/**
 * RAILRADAR API (https://railradar.in/docs) — server-side only; the key never reaches the browser.
 *
 *   Base:  https://api.railradar.in/v1
 *   Auth:  Authorization: Bearer <RAILRADAR_API_KEY>
 *   Free:  1,000 requests / month
 *
 * Budget: a hard daily cap (RAILRADAR_DAILY_CAP, default 30) counted in MongoDB so it is
 * shared across restarts. Every response is cached (station timetables 7 days, live
 * boards 2 hours) so repeated page loads cost nothing. Failures are logged loudly and
 * surfaced to the UI via /api/health and each status's `sources` field.
 */

import { getISTParts } from '../utils/time.js';
import { kvGet, kvSet, kvIncr } from './store.js';

const BASE = 'https://api.railradar.in/v1';
const TIMEOUT_MS = 12000;
const DAILY_CAP = Number(process.env.RAILRADAR_DAILY_CAP) || 30;

const status = {
  state: process.env.RAILRADAR_API_KEY ? 'idle' : 'disabled',
  lastFetch: null,
  lastError: null,
};

const key = () => process.env.RAILRADAR_API_KEY;
const todayKey = () => `railradar:calls:${getISTParts().date}`;

export async function railRadarStatus() {
  return {
    status: key() ? status.state : 'disabled',
    lastFetch: status.lastFetch,
    lastError: status.lastError,
    quotaUsedToday: (await kvGet(todayKey())) || 0,
    dailyCap: DAILY_CAP,
  };
}

async function callBudgeted(pathAndQuery) {
  if (!key()) return { error: 'disabled' };
  const used = (await kvGet(todayKey())) || 0;
  if (used >= DAILY_CAP) {
    status.state = 'over-budget';
    console.error(`❌ [RailRadar] daily cap ${DAILY_CAP} reached — skipping ${pathAndQuery}`);
    return { error: 'over-budget' };
  }
  await kvIncr(todayKey(), 36 * 60 * 60 * 1000);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${pathAndQuery}`, {
      headers: { Authorization: `Bearer ${key()}`, Accept: 'application/json' },
      signal: ctrl.signal,
    });
    const text = await res.text();
    status.lastFetch = new Date().toISOString();
    if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 160)}`);
    const json = JSON.parse(text);
    if (json.success === false) throw new Error(`API error ${JSON.stringify(json.error || json).slice(0, 160)}`);
    status.state = 'ok';
    status.lastError = null;
    return { data: json.data };
  } catch (err) {
    status.state = 'error';
    status.lastError = `${pathAndQuery}: ${err.name === 'AbortError' ? 'timeout' : err.message}`;
    console.error(`❌ [RailRadar] ${status.lastError}`);
    return { error: status.lastError };
  } finally {
    clearTimeout(timer);
  }
}

/** Cached wrapper: returns { data, cached } or { error }. */
async function cached(cacheKey, ttlMs, pathAndQuery) {
  const hit = await kvGet(cacheKey);
  if (hit) return { data: hit, cached: true };
  const r = await callBudgeted(pathAndQuery);
  if (r.data) await kvSet(cacheKey, r.data, ttlMs);
  return r;
}

/** Static timetable of every train at a station, incl. non-halting ones. Cached 7 days. */
export function stationTimetable(code) {
  const c = String(code).toUpperCase();
  return cached(`rr:station-trains:${c}`, 7 * 24 * 60 * 60 * 1000, `/stations/${encodeURIComponent(c)}/trains?includeIntermediate=true`);
}

/** Live board (delays) for a station, 8 h ahead. Cached 2 hours. */
export function stationLive(code) {
  const c = String(code).toUpperCase();
  return cached(`rr:station-live:${c}`, 2 * 60 * 60 * 1000, `/stations/${encodeURIComponent(c)}/live?hours=8`);
}

/** Map<trainNumber, delayMinutes> from a live board response (fields per railradar.in/docs/station-live-board). */
export function delaysFromLiveBoard(data) {
  const out = new Map();
  for (const t of data?.trains || []) {
    const number = t?.train?.number;
    const delay = t?.live?.delayMinutes;
    if (number && Number.isFinite(delay)) out.set(String(number), delay);
  }
  return out;
}
