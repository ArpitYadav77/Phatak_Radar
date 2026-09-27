/**
 * DERIVED TIMETABLES — train passing times for ANY OpenStreetMap crossing.
 *
 * 1. Pick the nearest coded station (A) and the nearest coded station on the other
 *    side of the crossing (B, angle A–crossing–B ≥ 110°).
 * 2. Fetch both stations' full timetables from RailRadar (incl. non-halting trains;
 *    cached 7 days, so each station costs one call per week).
 * 3. Every train listed at both stations passes the crossing: its time is interpolated
 *    between the two stations by distance.
 *
 * Needs RAILRADAR_API_KEY. Results are estimates and labelled as such.
 */

import { createRequire } from 'module';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { stationTimetable } from './railradar.service.js';
import { classifyTrain } from './trainType.js';
import { hhmmToMin } from '../utils/time.js';
import { kvGet, kvSet } from './store.js';

const require = createRequire(import.meta.url);
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/osm/stations-india.json');
const stationRows = existsSync(file) ? require('../../data/osm/stations-india.json').rows : [];
const coded = stationRows
  .filter((r) => r[4])
  .map(([osmId, lat, lng, name, code]) => ({ osmId, lat, lng, name, code }));

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const toRad = (d) => (d * Math.PI) / 180;
const distKm = (a, b) => {
  const s = Math.sin(toRad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
};

/** Nearest station A and a station B on the opposite side of the crossing. */
export function stationPair(crossing, maxKm = 25) {
  const near = coded
    .map((s) => ({ s, d: distKm(crossing, s) }))
    .filter((x) => x.d <= maxKm)
    .sort((a, b) => a.d - b.d);
  if (near.length < 2) return null;
  const A = near[0];
  const vx = (s) => [(s.lng - crossing.lng) * Math.cos(toRad(crossing.lat)), s.lat - crossing.lat];
  const [ax, ay] = vx(A.s);
  for (const cand of near.slice(1)) {
    const [bx, by] = vx(cand.s);
    const cos = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by) || 1);
    if (cos <= Math.cos(toRad(110))) return { A: { ...A.s, km: A.d }, B: { ...cand.s, km: cand.d } };
  }
  return null;
}

const stopMinutes = (stop, which) => {
  const t = which === 'dep' ? (stop.departure || stop.arrival) : (stop.arrival || stop.departure);
  const day = which === 'dep' ? (stop.departureDay || stop.arrivalDay || 1) : (stop.arrivalDay || stop.departureDay || 1);
  const m = hhmmToMin(t);
  return m == null ? null : { min: m, day };
};

/** Pure derivation from two station timetable responses (exported for tests). */
export function derivePassages(pair, boardA, boardB) {
  const byNumber = new Map((boardB?.trains || []).map((t) => [String(t?.train?.number), t]));
  const passages = [];
  for (const ta of boardA?.trains || []) {
    const number = String(ta?.train?.number || '');
    const tb = byNumber.get(number);
    if (!number || !tb) continue;
    const seqA = ta.stop?.sequence;
    const seqB = tb.stop?.sequence;
    if (!Number.isFinite(seqA) || !Number.isFinite(seqB) || seqA === seqB) continue;

    const [first, second, firstSt, secondSt] = seqA < seqB
      ? [ta, tb, pair.A, pair.B]
      : [tb, ta, pair.B, pair.A];
    const dep = stopMinutes(first.stop, 'dep');
    const arr = stopMinutes(second.stop, 'arr');
    if (!dep || !arr) continue;
    const travel = (arr.min + (arr.day - 1) * 1440) - (dep.min + (dep.day - 1) * 1440);
    if (travel <= 0 || travel > 6 * 60) continue;

    const f = firstSt.km / (firstSt.km + secondSt.km);
    const runDays = (first.train?.runDays || ta.train?.runDays || []).map((d) => DAYS.indexOf(String(d).slice(0, 3).toLowerCase()));
    const shift = dep.day - 1; // runDays are origin-station days
    const runsOn = runDays.length ? [...new Set(runDays.filter((d) => d >= 0).map((d) => (d + shift) % 7))] : null;

    passages.push({
      trainNumber: number,
      trainName: ta.train?.name || `Train ${number}`,
      trainType: classifyTrain({ number, name: ta.train?.name, typeHint: ta.train?.type }),
      fromName: ta.train?.source?.name || ta.train?.source?.code || null,
      toName: ta.train?.destination?.name || ta.train?.destination?.code || null,
      heading: `towards ${secondSt.name}`,
      stationMin: dep.min,
      offsetMin: f * travel,
      runsOn,
      verified: false,
      source: 'railradar-derived',
    });
  }
  return passages;
}

/**
 * Passages for a crossing, or { passages: null, info } explaining why not.
 * Cached per crossing for 7 days.
 */
export async function derivedPassagesFor(crossing) {
  const cacheKey = `derived:${crossing.id}`;
  const hit = await kvGet(cacheKey);
  if (hit) return hit;

  const baseInfo = { available: false, source: 'RailRadar station timetables (derived)' };
  if (!process.env.RAILRADAR_API_KEY) {
    return { passages: null, info: { ...baseInfo, reason: 'No timetable for this crossing yet (RailRadar key not configured).' } };
  }
  const pair = stationPair(crossing);
  if (!pair) return { passages: null, info: { ...baseInfo, reason: 'No station found on both sides of this crossing within 25 km.' } };

  const [a, b] = await Promise.all([stationTimetable(pair.A.code), stationTimetable(pair.B.code)]);
  if (a.error || b.error) {
    return { passages: null, info: { ...baseInfo, reason: `Live timetable unavailable (${a.error || b.error}).` } };
  }
  const passages = derivePassages(pair, a.data, b.data);
  const result = {
    passages: passages.length ? passages : null,
    info: {
      available: passages.length > 0,
      source: 'RailRadar station timetables (derived)',
      stations: [pair.A, pair.B].map(({ code, name, km }) => ({ code, name, km: Math.round(km * 10) / 10 })),
      note: `Crossing times interpolated between ${pair.A.name} and ${pair.B.name}; goods trains are not included.`,
      reason: passages.length ? null : `No trains found running between ${pair.A.name} and ${pair.B.name}.`,
    },
  };
  await kvSet(cacheKey, result, 7 * 24 * 60 * 60 * 1000);
  return result;
}
