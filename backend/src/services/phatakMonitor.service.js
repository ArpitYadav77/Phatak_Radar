/**
 * PHATAK MONITOR SERVICE
 *
 * Core intelligence for Patiala Phatak 23 (Model Town Road) and
 * Patiala Phatak 24 (Nabha Road) — level crossings on the
 * Rajpura–Patiala–Dhuri railway line (Northern Railway, NR).
 *
 * PRIMARY LOGIC — Schedule-Based Gate Status:
 *   Gate CLOSED if a scheduled train is within -10 to +10 minutes of its
 *   Patiala crossing time.  Gate shows WARNING 10–20 min before closure.
 *
 * SECONDARY LOGIC — GPS Enhancement:
 *   If a RailRadar GPS position is known and within 15 km, it can
 *   override the schedule to trigger early warning or extend closure.
 */

import { EventEmitter } from 'events';

// ─── Phatak coordinates ──────────────────────────────────────────────────────
// Phatak 23 – Model Town Road crossing, Patiala
// Phatak 24 – Nabha Road crossing, Patiala
// Both on the Rajpura–Patiala–Dhuri line (NR)
export const PHATAKS_CONFIG = [
  {
    phatakId: 'PTA-PK-23',
    name: 'Patiala Phatak 23 — Model Town',
    shortName: 'Phatak 23',
    lat: 30.3510,
    lng: 76.3720,
    location: { type: 'Point', coordinates: [76.3720, 30.3510] },
    district: 'Patiala',
    state: 'Punjab',
    railwayZone: 'NR',
    railwayDivision: 'Ferozepur',
    railLineName: 'Rajpura–Patiala–Dhuri Line',
    road: 'Model Town Road',
    gateType: 'MANUAL',
    nearbyStations: ['PTA'],
  },
  {
    phatakId: 'PTA-PK-24',
    name: 'Patiala Phatak 24 — Nabha Road',
    shortName: 'Phatak 24',
    lat: 30.3320,
    lng: 76.3980,
    location: { type: 'Point', coordinates: [76.3980, 30.3320] },
    district: 'Patiala',
    state: 'Punjab',
    railwayZone: 'NR',
    railwayDivision: 'Ferozepur',
    railLineName: 'Rajpura–Patiala–Dhuri Line',
    road: 'Nabha Road',
    gateType: 'MANUAL',
    nearbyStations: ['PTA'],
  },
];

// ─── Patiala station train schedule ──────────────────────────────────────────
// All scheduled times are approximate crossing times at these two phataks.
// The phataks are ~2–3 km from Patiala station; trains pass the crossings
// slightly before/after station halt depending on direction.
//
// Source: NTES / Indian Railways timetable for trains halting at Patiala (PTA)
//         on the Rajpura–Patiala–Dhuri branch.
//
// DIRECTION: UP = towards Rajpura/Delhi, DOWN = towards Dhuri/Bhatinda
export const PATIALA_SCHEDULE = [
  // ── Express / Mail trains ───────────────────────────────────────────────────
  { trainNumber: '14503', trainName: 'Patiala Express',               scheduledTime: '23:55', direction: 'DOWN', origin: 'Delhi Sarai Rohilla', destination: 'Patiala' },
  { trainNumber: '14504', trainName: 'Patiala Express',               scheduledTime: '05:25', direction: 'UP',   origin: 'Patiala',            destination: 'Delhi Sarai Rohilla' },
  { trainNumber: '12497', trainName: 'Shane Punjab Express',          scheduledTime: '19:50', direction: 'UP',   origin: 'Amritsar',           destination: 'New Delhi' },
  { trainNumber: '12498', trainName: 'Shane Punjab Express',          scheduledTime: '08:10', direction: 'DOWN', origin: 'New Delhi',           destination: 'Amritsar' },
  { trainNumber: '14649', trainName: 'Saryuyamuna Express',           scheduledTime: '02:30', direction: 'DOWN', origin: 'Delhi',               destination: 'Patiala/Bhiwani' },
  { trainNumber: '14650', trainName: 'Saryuyamuna Express',           scheduledTime: '01:15', direction: 'UP',   origin: 'Patiala',             destination: 'Delhi' },
  { trainNumber: '14033', trainName: 'Delhi–Jammu Mail',              scheduledTime: '21:40', direction: 'DOWN', origin: 'Delhi Junction',       destination: 'Jammu Tawi' },
  { trainNumber: '14034', trainName: 'Jammu–Delhi Mail',              scheduledTime: '06:20', direction: 'UP',   origin: 'Jammu Tawi',          destination: 'Delhi Junction' },
  { trainNumber: '18101', trainName: 'Tata–Patiala Express',          scheduledTime: '11:30', direction: 'DOWN', origin: 'Tatanagar',            destination: 'Patiala' },
  { trainNumber: '18102', trainName: 'Patiala–Tata Express',          scheduledTime: '15:20', direction: 'UP',   origin: 'Patiala',             destination: 'Tatanagar' },
  { trainNumber: '12487', trainName: 'Sealdah–Amritsar Express',      scheduledTime: '03:45', direction: 'DOWN', origin: 'Sealdah',             destination: 'Amritsar' },
  { trainNumber: '12488', trainName: 'Amritsar–Sealdah Express',      scheduledTime: '20:30', direction: 'UP',   origin: 'Amritsar',            destination: 'Sealdah' },
  { trainNumber: '18238', trainName: 'Chhatisgarh Express',           scheduledTime: '18:45', direction: 'DOWN', origin: 'Amritsar',            destination: 'Bilaspur' },
  { trainNumber: '18237', trainName: 'Chhatisgarh Express (Return)',  scheduledTime: '09:15', direction: 'UP',   origin: 'Bilaspur',            destination: 'Amritsar' },

  // ── DMU / Passenger services (Rajpura–Patiala–Dhuri/Bhatinda) ────────────
  { trainNumber: '74901', trainName: 'Rajpura–Bhatinda DMU',          scheduledTime: '06:50', direction: 'DOWN', origin: 'Rajpura',             destination: 'Bhatinda' },
  { trainNumber: '74902', trainName: 'Bhatinda–Rajpura DMU',          scheduledTime: '18:10', direction: 'UP',   origin: 'Bhatinda',            destination: 'Rajpura' },
  { trainNumber: '74903', trainName: 'Patiala–Rajpura Passenger',     scheduledTime: '07:45', direction: 'UP',   origin: 'Patiala',             destination: 'Rajpura' },
  { trainNumber: '74904', trainName: 'Rajpura–Patiala Passenger',     scheduledTime: '17:00', direction: 'DOWN', origin: 'Rajpura',             destination: 'Patiala' },
  { trainNumber: '74905', trainName: 'Patiala–Dhuri Passenger',       scheduledTime: '09:20', direction: 'DOWN', origin: 'Patiala',             destination: 'Dhuri' },
  { trainNumber: '74906', trainName: 'Dhuri–Patiala Passenger',       scheduledTime: '16:00', direction: 'UP',   origin: 'Dhuri',               destination: 'Patiala' },
  { trainNumber: '54401', trainName: 'Patiala–Jakhal Passenger',      scheduledTime: '10:35', direction: 'DOWN', origin: 'Patiala',             destination: 'Jakhal' },
  { trainNumber: '54402', trainName: 'Jakhal–Patiala Passenger',      scheduledTime: '14:30', direction: 'UP',   origin: 'Jakhal',              destination: 'Patiala' },
  { trainNumber: '54403', trainName: 'Morinda–Patiala Passenger',     scheduledTime: '12:50', direction: 'DOWN', origin: 'Morinda',             destination: 'Patiala' },
  { trainNumber: '54404', trainName: 'Patiala–Morinda Passenger',     scheduledTime: '13:45', direction: 'UP',   origin: 'Patiala',             destination: 'Morinda' },
];

// ─── Gate timing windows ─────────────────────────────────────────────────────
/** Gate CLOSED from this many minutes BEFORE scheduled crossing until AFTER */
const GATE_CLOSE_BEFORE_MIN = 10;
const GATE_OPEN_AFTER_MIN = 10;
/** WARNING shown this many minutes before the gate closes */
const GATE_WARNING_BEFORE_MIN = 20;

// ─── GPS thresholds ──────────────────────────────────────────────────────────
const APPROACH_RADIUS_KM = 15;
const CRITICAL_RADIUS_KM = 5;

// ─── In-memory live status ───────────────────────────────────────────────────
const liveStatusMap = {};
PHATAKS_CONFIG.forEach((p) => {
  liveStatusMap[p.phatakId] = {
    gateStatus: 'OPEN',
    approachingTrains: [],
    scheduledTrain: null,
    minutesToCrossing: null,
    lastCheck: new Date(),
    method: 'schedule',
  };
});

export const alertEmitter = new EventEmitter();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function nowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes() + n.getSeconds() / 60;
}

function minutesUntilCrossing(scheduledTimeStr) {
  const scheduled = toMinutes(scheduledTimeStr);
  const now = nowMinutes();
  let diff = scheduled - now;
  if (diff > 720)  diff -= 24 * 60;
  if (diff < -720) diff += 24 * 60;
  return diff;
}

export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcEta(distKm, speedKmh) {
  if (!speedKmh || speedKmh < 5) speedKmh = 55;
  return Math.round((distKm / speedKmh) * 60);
}

const prevPositions = {};
function isMovingToward(trainId, phatakId, currentDistKm) {
  const key = `${trainId}_${phatakId}`;
  const prev = prevPositions[key];
  prevPositions[key] = currentDistKm;
  if (prev == null) return true;
  return currentDistKm < prev;
}

// ─── Schedule-based gate status ───────────────────────────────────────────────
function getScheduleBasedStatus() {
  const candidates = PATIALA_SCHEDULE.map((entry) => ({
    ...entry,
    minutesUntil: minutesUntilCrossing(entry.scheduledTime),
  }));

  candidates.sort((a, b) => Math.abs(a.minutesUntil) - Math.abs(b.minutesUntil));

  let activeTrain = null;
  let gateStatus = 'OPEN';

  for (const c of candidates) {
    const t = c.minutesUntil;
    if (t >= -GATE_OPEN_AFTER_MIN && t <= GATE_CLOSE_BEFORE_MIN) {
      gateStatus = 'CLOSED';
      activeTrain = c;
      break;
    }
    if (t > GATE_CLOSE_BEFORE_MIN && t <= GATE_WARNING_BEFORE_MIN) {
      gateStatus = 'WARNING';
      activeTrain = c;
      break;
    }
  }

  const nextTrain = candidates.find((c) => c.minutesUntil > 0) || candidates[0];

  return { gateStatus, activeTrain, nextTrain, minutesToCrossing: activeTrain?.minutesUntil ?? nextTrain?.minutesUntil ?? null };
}

// ─── Main compute function ────────────────────────────────────────────────────
export function computePhatakStatus(trains) {
  const scheduleResult = getScheduleBasedStatus();

  const updatedPhataks = PHATAKS_CONFIG.map((phatakCfg) => {
    const approachingTrainsGPS = [];

    for (const train of trains) {
      if (!train.currentPosition?.coordinates) continue;
      const [lng, lat] = train.currentPosition.coordinates;
      const distKm = getDistanceKm(lat, lng, phatakCfg.lat, phatakCfg.lng);
      if (distKm > APPROACH_RADIUS_KM) continue;
      const movingToward = isMovingToward(train.trainNumber || train._id, phatakCfg.phatakId, distKm);
      if (!movingToward && distKm > CRITICAL_RADIUS_KM) continue;
      approachingTrainsGPS.push({
        trainNumber: train.trainNumber,
        trainName: train.trainName,
        distanceKm: Math.round(distKm * 10) / 10,
        eta: calcEta(distKm, train.speed),
        speed: train.speed || 55,
        movingToward,
        source: 'gps',
      });
    }
    approachingTrainsGPS.sort((a, b) => a.distanceKm - b.distanceKm);

    // Determine final status
    let gateStatus = scheduleResult.gateStatus;
    let trainInfo = null;
    let trainName = null;
    let eta = null;
    let method = 'schedule';
    let approachingTrains = [];

    if (scheduleResult.activeTrain) {
      const at = scheduleResult.activeTrain;
      trainInfo = `${at.trainName} (#${at.trainNumber})`;
      trainName = at.trainName;
      eta = at.minutesUntil > 0 ? Math.round(at.minutesUntil) : 0;
      approachingTrains = [{
        trainNumber: at.trainNumber,
        trainName: at.trainName,
        scheduledTime: at.scheduledTime,
        direction: at.direction,
        origin: at.origin,
        destination: at.destination,
        minutesUntil: at.minutesUntil,
        source: 'schedule',
        distanceKm: null,
        eta,
      }];
    }

    const nearestGPS = approachingTrainsGPS[0];
    if (nearestGPS) {
      if (nearestGPS.distanceKm <= CRITICAL_RADIUS_KM && gateStatus !== 'CLOSED') {
        gateStatus = 'CLOSED';
        method = 'gps';
      } else if (nearestGPS.distanceKm <= APPROACH_RADIUS_KM && gateStatus === 'OPEN') {
        gateStatus = 'WARNING';
        method = 'gps';
      }
      approachingTrains = [...approachingTrains, ...approachingTrainsGPS];
    }

    const prevStatus = liveStatusMap[phatakCfg.phatakId]?.gateStatus;
    liveStatusMap[phatakCfg.phatakId] = {
      gateStatus,
      approachingTrains,
      scheduledTrain: scheduleResult.activeTrain || scheduleResult.nextTrain,
      minutesToCrossing: scheduleResult.minutesToCrossing,
      nextScheduled: scheduleResult.nextTrain,
      lastCheck: new Date(),
      method,
    };

    if (prevStatus !== gateStatus) {
      alertEmitter.emit('statusChange', {
        phatakId: phatakCfg.phatakId,
        phatakName: phatakCfg.name,
        prevStatus,
        newStatus: gateStatus,
        nearestTrain: nearestGPS || (scheduleResult.activeTrain
          ? { trainNumber: scheduleResult.activeTrain.trainNumber, trainName: scheduleResult.activeTrain.trainName, eta }
          : null),
        timestamp: new Date(),
      });
    }

    return {
      ...phatakCfg,
      status: gateStatus === 'OPEN' ? 'OPEN' : 'CLOSED',
      trainInfo,
      trainName,
      eta,
      liveStatus: liveStatusMap[phatakCfg.phatakId],
      lastUpdated: new Date(),
    };
  });

  // Enrich trains with phatak distances
  const pk23 = PHATAKS_CONFIG[0];
  const pk24 = PHATAKS_CONFIG[1];

  const updatedTrains = trains.map((train) => {
    if (!train.currentPosition?.coordinates) {
      const matched = PATIALA_SCHEDULE.find((s) => s.trainNumber === train.trainNumber);
      if (matched) {
        const mins = minutesUntilCrossing(matched.scheduledTime);
        let approachStatus = 'CLEAR';
        if (mins >= -GATE_OPEN_AFTER_MIN && mins <= GATE_CLOSE_BEFORE_MIN) approachStatus = 'CRITICAL';
        else if (mins > GATE_CLOSE_BEFORE_MIN && mins <= GATE_WARNING_BEFORE_MIN) approachStatus = 'APPROACHING';
        return { ...train, scheduledMinutesUntil: Math.round(mins), approachStatus };
      }
      return train;
    }
    const [lng, lat] = train.currentPosition.coordinates;
    const d23 = getDistanceKm(lat, lng, pk23.lat, pk23.lng);
    const d24 = getDistanceKm(lat, lng, pk24.lat, pk24.lng);
    const eta23 = calcEta(d23, train.speed);
    const eta24 = calcEta(d24, train.speed);

    let approachStatus = 'CLEAR';
    if (d23 <= CRITICAL_RADIUS_KM || d24 <= CRITICAL_RADIUS_KM) approachStatus = 'CRITICAL';
    else if (d23 <= APPROACH_RADIUS_KM || d24 <= APPROACH_RADIUS_KM) approachStatus = 'APPROACHING';

    return {
      ...train,
      distToPhatak23: Math.round(d23 * 10) / 10,
      distToPhatak24: Math.round(d24 * 10) / 10,
      etaToPhatak23: eta23,
      etaToPhatak24: eta24,
      approachStatus,
    };
  });

  return { updatedPhataks, updatedTrains };
}

/** Full Patiala schedule with live window status per train */
export function getFullScheduleWithStatus() {
  return PATIALA_SCHEDULE.map((entry) => {
    const minutesUntil = minutesUntilCrossing(entry.scheduledTime);
    let windowStatus = 'UPCOMING';
    if (minutesUntil >= -GATE_OPEN_AFTER_MIN && minutesUntil <= GATE_CLOSE_BEFORE_MIN) windowStatus = 'GATE CLOSED';
    else if (minutesUntil > GATE_CLOSE_BEFORE_MIN && minutesUntil <= GATE_WARNING_BEFORE_MIN) windowStatus = 'WARNING';
    else if (minutesUntil < -GATE_OPEN_AFTER_MIN) windowStatus = 'PASSED';
    return { ...entry, minutesUntil: Math.round(minutesUntil), windowStatus };
  }).sort((a, b) => a.minutesUntil - b.minutesUntil);
}

export function getLiveStatus(phatakId) { return liveStatusMap[phatakId] || null; }
export function getAllLiveStatuses() { return liveStatusMap; }
