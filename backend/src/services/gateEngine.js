/**
 * GATE ENGINE — pure functions, no I/O, no timers.
 *
 * A crossing's status is computed from the current time alone:
 *   passages (timetable-derived, per train)  →  occurrences around `now`
 *   occurrences + gate timing                →  OPEN / CLOSING_SOON / CLOSED
 *   + user reports + gatekeeper override     →  final status with its basis
 *
 * Priority (highest first): gatekeeper override > 2+ agreeing user reports > timetable.
 */

import { istMidnight, istWeekdayOf } from '../utils/time.js';
import { trainTypeLabel } from './trainType.js';

const MIN = 60 * 1000;

/** Minutes the gate is closed before / after the train passes, and the "closing soon" lead. */
export const GATE_DEFAULTS = { leadMin: 6, trailMin: 3, warnMin: 10 };

export const REPORT_AGREE_WINDOW_MIN = 10;
export const REPORT_TTL_MIN = 20;

/**
 * Expand passages into concrete occurrences (yesterday/today/tomorrow, IST) around `now`.
 *
 * passage: { trainNumber, trainName, trainType, heading, stationMin, offsetMin, runsOn?, verified, source }
 *   stationMin + offsetMin = minutes after IST midnight of the station day when the train passes.
 * delays: Map<trainNumber, delayMinutes> from a live source (applied to runs within ±12 h).
 */
export function occurrencesAround(passages, now, delays = null) {
  const nowMs = now instanceof Date ? now.getTime() : now;
  const out = [];
  for (const p of passages) {
    for (const dayOffset of [-1, 0, 1]) {
      const midnight = istMidnight(nowMs, dayOffset);
      if (p.runsOn && !p.runsOn.includes(istWeekdayOf(midnight))) continue;
      const scheduledAt = midnight + (p.stationMin + p.offsetMin) * MIN;
      if (Math.abs(scheduledAt - nowMs) > 18 * 60 * MIN) continue;
      const live = delays?.get(p.trainNumber);
      const delayMin = live != null && Math.abs(scheduledAt - nowMs) < 12 * 60 * MIN ? live : 0;
      out.push({ ...p, scheduledAt, expectedAt: scheduledAt + delayMin * MIN, delayMin, delayKnown: live != null });
    }
  }
  return out.sort((a, b) => a.expectedAt - b.expectedAt);
}

/** Timetable-only gate state. */
export function timetableGate(occurrences, now, gate = GATE_DEFAULTS) {
  const nowMs = now instanceof Date ? now.getTime() : now;
  const withWindows = occurrences.map((o) => ({
    ...o,
    closeAt: o.expectedAt - gate.leadMin * MIN,
    openAt: o.expectedAt + gate.trailMin * MIN,
  }));

  // Merge overlapping closures so "opens in" accounts for back-to-back trains.
  const mergedEnd = (startIdx) => {
    let end = withWindows[startIdx].openAt;
    for (let i = startIdx + 1; i < withWindows.length && withWindows[i].closeAt <= end; i++) {
      end = Math.max(end, withWindows[i].openAt);
    }
    return end;
  };

  const activeIdx = withWindows.findIndex((o) => o.closeAt <= nowMs && nowMs <= o.openAt);
  const upcoming = withWindows.filter((o) => o.openAt >= nowMs);

  if (activeIdx !== -1) {
    // Show the train closest to passing (the first that hasn't passed, else the one just passed).
    const inWindow = withWindows.filter((o) => o.closeAt <= nowMs && nowMs <= o.openAt);
    const train = inWindow.find((o) => o.expectedAt >= nowMs) || inWindow[inWindow.length - 1];
    const firstActive = withWindows.findIndex((o) => o === inWindow[0]);
    return { status: 'CLOSED', train, closesAt: null, opensAt: mergedEnd(firstActive), upcoming };
  }

  const nextIdx = withWindows.findIndex((o) => o.closeAt > nowMs);
  if (nextIdx === -1) return { status: 'OPEN', train: null, closesAt: null, opensAt: null, upcoming };
  const next = withWindows[nextIdx];
  const soon = next.closeAt - nowMs <= gate.warnMin * MIN;
  return {
    status: soon ? 'CLOSING_SOON' : 'OPEN',
    train: next,
    closesAt: next.closeAt,
    opensAt: mergedEnd(nextIdx),
    upcoming,
  };
}

/** Summarise raw reports: distinct reporters agreeing within the agreement window. */
export function summariseReports(reports, now) {
  const nowMs = now instanceof Date ? now.getTime() : now;
  const fresh = reports.filter((r) => nowMs - r.at <= REPORT_TTL_MIN * MIN);
  const agreeing = (status) => new Set(
    fresh.filter((r) => r.status === status && nowMs - r.at <= REPORT_AGREE_WINDOW_MIN * MIN).map((r) => r.reporter),
  ).size;
  const latest = fresh.reduce((a, r) => (!a || r.at > a.at ? r : a), null);
  return {
    closed: agreeing('CLOSED'),
    open: agreeing('OPEN'),
    total: fresh.length,
    latest: latest ? { status: latest.status, at: latest.at, trainType: latest.trainType || null } : null,
    goodsReported: fresh.some((r) => r.status === 'CLOSED' && r.trainType === 'GOODS'),
  };
}

const publicTrain = (o) => o && {
  number: o.trainNumber || null,
  name: o.trainName,
  type: o.trainType,
  typeLabel: trainTypeLabel(o.trainType),
  heading: o.heading || null,
  from: o.fromName || null,
  to: o.toName || null,
  scheduledAt: o.scheduledAt ?? null,
  expectedAt: o.expectedAt ?? null,
  delayMin: o.delayMin ?? 0,
  delayKnown: !!o.delayKnown,
  verified: o.verified !== false,
  note: o.note || null,
};

/**
 * Final status for one crossing.
 *
 * input: { passages|null, now, delays?, reports: [], override?: {status, until, by}, gate?, timetableInfo? }
 */
export function resolveCrossingStatus({ passages, now, delays = null, reports = [], override = null, gate = GATE_DEFAULTS, timetableInfo = null }) {
  const nowMs = now instanceof Date ? now.getTime() : now;
  const hasTimetable = Array.isArray(passages) && passages.length > 0;
  const tt = hasTimetable ? timetableGate(occurrencesAround(passages, nowMs, delays), nowMs, gate) : null;
  const rep = summariseReports(reports, nowMs);

  let status = tt ? tt.status : 'UNKNOWN';
  let basis = tt ? (tt.train?.delayKnown ? 'live' : 'timetable') : 'none';
  let train = tt?.train || null;
  let closesAt = tt?.closesAt ?? null;
  let opensAt = tt?.opensAt ?? null;

  if (override && override.until > nowMs) {
    status = override.status;
    basis = 'gatekeeper';
    if (status === 'OPEN') { train = tt?.status === 'OPEN' ? train : null; closesAt = null; opensAt = null; }
  } else if (rep.closed >= 2 && status !== 'CLOSED') {
    const dueSoon = train && train.expectedAt - nowMs <= 15 * MIN;
    status = 'CLOSED';
    closesAt = null;
    if (dueSoon) {
      // Gate closed early for the timetable train that is about to pass.
      basis = 'timetable+reports';
    } else {
      // No timetable train explains it → most likely a goods / unscheduled train.
      basis = 'reports';
      train = { trainName: 'Goods / unscheduled train', trainType: 'GOODS', heading: null, verified: false };
      opensAt = null;
    }
  } else if (rep.open >= 2 && status === 'CLOSED') {
    status = 'OPEN';
    basis = 'reports';
    closesAt = null;
    opensAt = null;
  } else if (rep.closed >= 2 && status === 'CLOSED') {
    basis = basis === 'live' ? 'live' : 'timetable+reports';
  }

  const nextTrains = (tt?.upcoming || []).slice(0, 6).map(publicTrain);

  return {
    status,
    basis,
    train: publicTrain(train),
    closesAt,
    opensAt,
    nextTrains,
    reports: rep,
    timetable: timetableInfo || { available: hasTimetable },
    computedAt: nowMs,
  };
}
