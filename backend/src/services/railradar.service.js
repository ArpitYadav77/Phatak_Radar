/**
 * RAILRADAR API SERVICE
 *
 * Wraps the public RailRadar API (https://api.railradar.org) for server-side use.
 * This avoids CORS issues — backend fetches, frontend polls our Express API.
 *
 * Key endpoints used:
 *  - GET /api/v1/trains/live-map              → all running trains with GPS
 *  - GET /api/v1/trains/{number}?dataType=live → specific train live status
 *  - GET /api/v1/stations/LDH/live            → Ludhiana station board
 */

import { request } from 'undici';
import { getISTParts } from '../utils/time.js';

const RAILRADAR_BASE = 'https://api.railradar.org';
const TIMEOUT_MS = 10000;

// ─── Source status (reported by /api/health) ──────────────────────────────────
// Call counter is per serverless instance for now; moves to MongoDB in Phase 2.
const sourceStatus = {
  state: process.env.RAILRADAR_API_KEY ? 'unknown' : 'disabled',
  lastFetch: null,
  lastError: null,
  callsDate: null,
  callsToday: 0,
};

function recordCall(ok, error = null) {
  const today = getISTParts().date;
  if (sourceStatus.callsDate !== today) {
    sourceStatus.callsDate = today;
    sourceStatus.callsToday = 0;
  }
  sourceStatus.callsToday += 1;
  sourceStatus.lastFetch = new Date().toISOString();
  sourceStatus.state = ok ? 'ok' : 'error';
  sourceStatus.lastError = error;
  if (!ok) console.error(`❌ [RailRadar] ${error}`);
}

export function getRailRadarStatus() {
  const today = getISTParts().date;
  return {
    status: sourceStatus.state,
    lastFetch: sourceStatus.lastFetch,
    lastError: sourceStatus.lastError,
    quotaUsedToday: sourceStatus.callsDate === today ? sourceStatus.callsToday : 0,
  };
}

/** Fetch all currently running trains with live GPS positions. */
export async function fetchLiveMap() {
  if (!process.env.RAILRADAR_API_KEY) {
    sourceStatus.state = 'disabled';
    return null;
  }
  try {
    const { statusCode, body } = await request(
      `${RAILRADAR_BASE}/api/v1/trains/live-map`,
      { headersTimeout: TIMEOUT_MS, bodyTimeout: TIMEOUT_MS }
    );
    if (statusCode !== 200) {
      await body.dump();
      recordCall(false, `live-map returned HTTP ${statusCode}`);
      return null;
    }
    const data = await body.json();
    recordCall(true);
    // data is an array of LiveTrainMapData objects
    return Array.isArray(data) ? data : null;
  } catch (err) {
    recordCall(false, `fetchLiveMap failed: ${err.message}`);
    return null;
  }
}

/**
 * Fetch live status for a specific train.
 * Returns null if unavailable.
 */
export async function fetchTrainLive(trainNumber) {
  try {
    const url = `${RAILRADAR_BASE}/api/v1/trains/${trainNumber}?dataType=live`;
    const { statusCode, body } = await request(url, {
      headersTimeout: TIMEOUT_MS,
      bodyTimeout: TIMEOUT_MS,
    });
    if (statusCode !== 200) return null;
    const data = await body.json();
    return data;
  } catch (err) {
    console.warn(`[RailRadar] fetchTrainLive(${trainNumber}) failed:`, err.message);
    return null;
  }
}

/**
 * Fetch Ludhiana live station board.
 * Returns list of trains arriving/departing within the next few hours.
 */
export async function fetchLudhianaBoard(hours = 4) {
  try {
    const url = `${RAILRADAR_BASE}/api/v1/stations/LDH/live?hours=${hours}`;
    const { statusCode, body } = await request(url, {
      headersTimeout: TIMEOUT_MS,
      bodyTimeout: TIMEOUT_MS,
    });
    if (statusCode !== 200) return null;
    return await body.json();
  } catch (err) {
    console.warn('[RailRadar] fetchLudhianaBoard failed:', err.message);
    return null;
  }
}

/**
 * Normalize a LiveTrainMapData entry from RailRadar's /live-map
 * into the internal train shape used by the rest of the app.
 */
export function normalizeRailRadarTrain(entry) {
  if (!entry || entry.current_lat == null || entry.current_lng == null) return null;

  return {
    _id: `rr_${entry.train_number}`,
    trainNumber: String(entry.train_number),
    trainName: entry.train_name || `Train ${entry.train_number}`,
    currentPosition: {
      type: 'Point',
      coordinates: [parseFloat(entry.current_lng), parseFloat(entry.current_lat)],
    },
    // RailRadar gives next station lat/lng — use to determine direction bearing
    nextStation: entry.next_station_name || entry.next_station || null,
    nextLat: entry.next_lat ? parseFloat(entry.next_lat) : null,
    nextLng: entry.next_lng ? parseFloat(entry.next_lng) : null,
    speed: entry.current_speed_kmph ?? (entry.curr_distance != null ? 60 : 60), // default 60 if unavailable
    delayMinutes: 0, // will be updated if live detail is fetched
    status: 'RUNNING',
    isActive: true,
    source: 'railradar',
    schedule: {
      origin: entry.source_station_name || '',
      destination: entry.destination_station_name || '',
      departureTime: null,
      arrivalTime: null,
      frequency: 'daily',
    },
    affectedPhataks: [],
    lastUpdated: new Date(),
  };
}
