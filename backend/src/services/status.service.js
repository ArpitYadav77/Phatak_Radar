/**
 * STATUS SERVICE — assembles a crossing's status at request time.
 *
 *   passages  : verified Patiala timetable (crossings on that line)  |  RailRadar-derived (others)
 *   delays    : RailRadar live board for PTA (cached 2 h, only fetched when someone asks)
 *   reports   : user reports (last 20 min)
 *   override  : gatekeeper (PIN)
 *        ↓
 *   gateEngine.resolveCrossingStatus()
 */

import { resolveCrossingStatus } from './gateEngine.js';
import { passagesAtKm, timetableInfo, MAX_ANCHOR_KM } from './timetable.service.js';
import { derivedPassagesFor } from './derivedTimetable.service.js';
import { stationLive, delaysFromLiveBoard, railRadarStatus } from './railradar.service.js';
import { reportsFor, getOverride } from './reports.service.js';
import { kvGet } from './store.js';

const onPatialaTimetable = (c) => c.line && Math.abs(c.line.km) <= MAX_ANCHOR_KM;

export function publicCrossing(c) {
  return {
    id: c.id,
    osmId: c.osmId,
    name: c.name || null,
    shortName: c.shortName || null,
    label: c.label,
    lat: c.lat,
    lng: c.lng,
    road: c.road || null,
    roadNameSource: c.roadNameSource || null,
    district: c.district || null,
    state: c.state || null,
    nearStation: c.nearStation || null,
    nearStationCode: c.nearStationCode || null,
    nearKm: c.nearKm ?? null,
    dirFromStation: c.dirFromStation || null,
    barrier: c.barrier || null,
    curated: !!c.curated,
    locationSource: c.locationSource,
    timetable: onPatialaTimetable(c) ? 'patiala' : null,
    lineKm: c.line ? c.line.km : null,
  };
}

/** Live delays for trains at Patiala; `fetch=false` → only use what's already cached. */
async function patialaDelays(fetch) {
  if (!process.env.RAILRADAR_API_KEY) return { delays: null, live: 'disabled' };
  const cachedBoard = await kvGet('rr:station-live:PTA');
  if (cachedBoard) return { delays: delaysFromLiveBoard(cachedBoard), live: 'ok' };
  if (!fetch) return { delays: null, live: 'not-fetched' };
  const r = await stationLive('PTA');
  if (r.error) return { delays: null, live: 'unavailable', liveError: r.error };
  return { delays: delaysFromLiveBoard(r.data), live: 'ok' };
}

// ─── 5-second response cache (bursts of requests don't recompute) ─────────────
const memo = new Map();
async function memoized(key, fn, ttlMs = 5000) {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  const value = await fn();
  memo.set(key, { at: Date.now(), value });
  if (memo.size > 5000) memo.clear();
  return value;
}
export const invalidate = (crossingId) => {
  for (const k of memo.keys()) if (k.includes(crossingId) || k.startsWith('bbox:')) memo.delete(k);
};

/** Full status for one crossing (may call RailRadar within budget). */
export function statusFor(crossing) {
  return memoized(`status:${crossing.id}`, async () => {
    let passages = null;
    let info;
    let delays = null;
    let live = 'not-applicable';
    let liveError = null;

    if (onPatialaTimetable(crossing)) {
      passages = passagesAtKm(crossing.line.km);
      info = { available: true, source: 'Verified Patiala (PTA) timetable', ...timetableInfo, lineKm: crossing.line.km };
      ({ delays, live, liveError = null } = await patialaDelays(true));
    } else {
      const d = await derivedPassagesFor(crossing);
      passages = d.passages;
      info = d.info;
    }

    const [reports, override] = await Promise.all([reportsFor(crossing.id), getOverride(crossing.id)]);
    const s = resolveCrossingStatus({ passages, now: Date.now(), delays, reports, override, timetableInfo: info });
    const rr = await railRadarStatus();
    return {
      crossing: publicCrossing(crossing),
      ...s,
      sources: {
        timetable: info.available ? info.source : null,
        liveDelays: live,
        liveError,
        railradar: rr.status,
      },
    };
  });
}

/** Cheap status for map lists: no remote calls; UNKNOWN unless timetable or reports say otherwise. */
export async function summaryFor(crossing, reportedIds) {
  const needsReports = reportedIds.has(crossing.id);
  if (!onPatialaTimetable(crossing) && !needsReports) {
    return { id: crossing.id, status: 'UNKNOWN', basis: 'none' };
  }
  const passages = onPatialaTimetable(crossing) ? passagesAtKm(crossing.line.km) : null;
  const { delays } = onPatialaTimetable(crossing) ? await patialaDelays(false) : { delays: null };
  const [reports, override] = needsReports
    ? await Promise.all([reportsFor(crossing.id), getOverride(crossing.id)])
    : [[], null];
  const s = resolveCrossingStatus({ passages, now: Date.now(), delays, reports, override });
  return {
    id: crossing.id,
    status: s.status,
    basis: s.basis,
    train: s.train ? { number: s.train.number, name: s.train.name, type: s.train.type } : null,
    closesAt: s.closesAt,
    opensAt: s.opensAt,
  };
}

export { memoized };
