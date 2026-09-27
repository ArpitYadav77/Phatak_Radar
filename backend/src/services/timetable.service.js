/**
 * TIMETABLE SERVICE — verified station timetables → per-crossing passages.
 *
 * Currently one anchor: Patiala (PTA) on the Rajpura – Patiala – Nabha section,
 * with real track geometry from OpenStreetMap. A crossing on that section within
 * MAX_ANCHOR_KM of PTA gets its passing times from the PTA arrival/departure plus
 * the running time over its distance along the track.
 */

import { createRequire } from 'module';
import { hhmmToMin, istMidnight, istWeekdayOf } from '../utils/time.js';
import { classifyTrain } from './trainType.js';

const require = createRequire(import.meta.url);
const PTA = require('../../data/timetable/patiala-pta.json');
const LINE = require('../../data/lines/rajpura-patiala-nabha.json');

/** Beyond this distance from the anchor station, intermediate halts make single-anchor estimates unreliable. */
export const MAX_ANCHOR_KM = 8;

const SIDE_HEADING = {
  W: 'towards Patiala Cantt · Dhuri',
  E: 'towards Rajpura · Ambala',
};
const TOWARDS_ANCHOR = {
  W: 'towards Patiala',
  E: 'towards Patiala',
};

/** Cruise speed (km/h) used between the 1 km acceleration/braking zone and the crossing. */
function cruiseKmh(type) {
  if (type === 'VANDE_BHARAT' || type === 'SUPERFAST') return 80;
  if (type === 'PASSENGER' || type === 'DEMU' || type === 'MEMU' || type === 'EMU') return 55;
  return 70;
}

/** Minutes to cover `km` from a standstill (or to a standstill): 1 km at ~30 km/h, rest at cruise. */
export function runMinutes(km, type) {
  const slow = Math.min(km, 1);
  const rest = Math.max(km - 1, 0);
  return (slow / 30) * 60 + (rest / cruiseKmh(type)) * 60;
}

/** Inverse of runMinutes: km covered after `minutes`. */
export function kmAfter(minutes, type) {
  if (minutes <= 2) return (minutes / 60) * 30;
  return 1 + ((minutes - 2) / 60) * cruiseKmh(type);
}

const trains = PTA.trains.map((t) => ({
  ...t,
  type: classifyTrain({ number: t.number, name: t.name }),
  arrMin: hhmmToMin(t.arr),
  depMin: hhmmToMin(t.dep),
}));

const lineCrossingKm = new Map(LINE.crossings.map((c) => [c.osmId, c.km]));

/** Chainage (km from PTA along the track) for an OSM crossing on the line, or null. */
export function lineKmForOsmId(osmId) {
  return lineCrossingKm.has(osmId) ? lineCrossingKm.get(osmId) : null;
}

export const timetableInfo = {
  id: PTA.id,
  station: PTA.station,
  verifiedAt: PTA.verifiedAt,
  sources: PTA.sources,
  note: 'Crossing time estimated from Patiala (PTA) station times and distance along the track.',
};

/** Passages for a crossing at `km` along the line (negative = W of PTA), or null if not covered. */
export function passagesAtKm(km) {
  if (km == null || Math.abs(km) > MAX_ANCHOR_KM) return null;
  const side = km < 0 ? 'W' : 'E';
  const d = Math.abs(km);
  const passages = [];
  for (const t of trains) {
    const base = {
      trainNumber: t.number,
      trainName: t.name,
      trainType: t.type,
      fromName: t.from,
      toName: t.to,
      runsOn: t.runsOn,
      verified: t.verified,
      note: t.note || null,
      source: 'timetable',
    };
    // Leaving PTA towards this crossing.
    if (t.toSide === side && t.depMin != null) {
      passages.push({ ...base, stationMin: t.depMin, offsetMin: runMinutes(d, t.type), heading: SIDE_HEADING[side] });
    }
    // Arriving at PTA from this crossing's side.
    if (t.fromSide === side && t.arrMin != null) {
      passages.push({ ...base, stationMin: t.arrMin, offsetMin: -runMinutes(d, t.type), heading: TOWARDS_ANCHOR[side] });
    }
  }
  return passages;
}

/** Full PTA timetable for listing (with type). */
export function anchorTimetable() {
  return {
    ...timetableInfo,
    sides: PTA.sides,
    trains: trains.map(({ arrMin, depMin, ...t }) => t),
    excluded: PTA.excluded,
  };
}

// ─── Estimated train positions along the line (for the map) ───────────────────

const poly = LINE.polyline; // [lat, lng, km] ordered W → E
const minKm = poly[0][2];
const maxKm = poly[poly.length - 1][2];

function pointAtKm(km) {
  if (km < minKm || km > maxKm) return null;
  for (let i = 1; i < poly.length; i++) {
    const [lat1, lng1, k1] = poly[i - 1];
    const [lat2, lng2, k2] = poly[i];
    if (km >= k1 && km <= k2) {
      const f = k2 === k1 ? 0 : (km - k1) / (k2 - k1);
      const lat = lat1 + f * (lat2 - lat1);
      const lng = lng1 + f * (lng2 - lng1);
      const bearing = (Math.atan2((lng2 - lng1) * Math.cos((lat * Math.PI) / 180), lat2 - lat1) * 180) / Math.PI;
      return { lat, lng, bearingEast: (bearing + 360) % 360 };
    }
  }
  return null;
}

const SIGN = { W: -1, E: 1 };

/**
 * Trains estimated to be on the line right now (timetable + optional live delays).
 * Returns [{ number, name, type, lat, lng, bearing, km, state, positionSource }]
 */
export function estimatedTrainsOnLine(now, delays = null) {
  const nowMs = now instanceof Date ? now.getTime() : now;
  const out = [];
  for (const t of trains) {
    for (const dayOffset of [-1, 0]) {
      const midnight = istMidnight(nowMs, dayOffset);
      if (t.runsOn && !t.runsOn.includes(istWeekdayOf(midnight))) continue;
      const delay = delays?.get(t.number) ?? 0;
      const at = (m) => (m == null ? null : midnight + (m + delay) * 60000);
      const arr = at(t.arrMin);
      const dep = at(t.depMin);
      let km = null;
      let state = null;
      let heading = null;
      if (arr != null && nowMs < arr && t.fromSide) {
        const mins = (arr - nowMs) / 60000;
        km = SIGN[t.fromSide] * kmAfter(mins, t.type);
        state = 'APPROACHING_PTA';
        heading = t.fromSide === 'W' ? 'E' : 'W';
      } else if ((arr ?? dep) != null && nowMs >= (arr ?? dep) && (dep == null || nowMs <= dep)) {
        if (dep == null && nowMs - arr > 5 * 60000) continue; // terminated at PTA
        km = 0;
        state = 'AT_PTA';
        heading = t.toSide || (t.fromSide === 'W' ? 'E' : 'W');
      } else if (dep != null && nowMs > dep && t.toSide) {
        const mins = (nowMs - dep) / 60000;
        km = SIGN[t.toSide] * kmAfter(mins, t.type);
        state = 'LEFT_PTA';
        heading = t.toSide;
      }
      if (km == null) continue;
      const p = pointAtKm(km);
      if (!p) continue;
      out.push({
        number: t.number,
        name: t.name,
        type: t.type,
        from: t.from,
        to: t.to,
        lat: Math.round(p.lat * 1e5) / 1e5,
        lng: Math.round(p.lng * 1e5) / 1e5,
        bearing: Math.round(heading === 'E' ? p.bearingEast : (p.bearingEast + 180) % 360),
        km: Math.round(km * 100) / 100,
        state,
        delayMin: delay,
        positionSource: delays?.has(t.number) ? 'timetable+live-delay' : 'timetable',
        verified: t.verified,
      });
    }
  }
  return out;
}

export const lineGeometry = {
  id: LINE.id,
  source: LINE.source,
  polyline: poly.map(([lat, lng]) => [lat, lng]),
  stations: LINE.stations,
};
