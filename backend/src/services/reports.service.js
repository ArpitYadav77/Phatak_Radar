/**
 * USER REPORTS & GATEKEEPER OVERRIDES
 *
 * Reports: anyone at the crossing can say "gate CLOSED / OPEN" (optionally the train type).
 * The gate engine only acts on 2+ distinct reporters agreeing within 10 minutes.
 * Reporters are identified by a salted hash of their IP — raw IPs are never stored.
 */

import { createHash } from 'crypto';
import { addReport, recentReports, kvGet, kvSet } from './store.js';
import { REPORT_TTL_MIN } from './gateEngine.js';

const SALT = process.env.REPORT_SALT || 'phatak-radar';
const REPORT_TYPES = new Set(['GOODS', 'PASSENGER', 'EXPRESS', 'VANDE_BHARAT', 'PARCEL', 'UNKNOWN']);

export const reporterId = (ip) => createHash('sha256').update(`${SALT}:${ip}`).digest('hex').slice(0, 16);

// Rate limits (per server instance): 6 reports / 10 min per reporter, 1 per crossing per 2 min.
const recentByReporter = new Map();
function rateLimited(reporter, phatakId) {
  const now = Date.now();
  const list = (recentByReporter.get(reporter) || []).filter((r) => now - r.at < 10 * 60 * 1000);
  recentByReporter.set(reporter, list);
  if (list.length >= 6) return 'Too many reports — try again in a few minutes.';
  if (list.some((r) => r.phatakId === phatakId && now - r.at < 2 * 60 * 1000)) {
    return 'You already reported this crossing — thanks! You can update it in 2 minutes.';
  }
  list.push({ phatakId, at: now });
  return null;
}

export async function submitReport(phatakId, body, ip) {
  const status = String(body?.status || '').toUpperCase();
  if (!['OPEN', 'CLOSED'].includes(status)) return { error: 'status must be OPEN or CLOSED', code: 400 };
  const trainType = body?.trainType ? String(body.trainType).toUpperCase() : null;
  if (trainType && !REPORT_TYPES.has(trainType)) return { error: 'unknown trainType', code: 400 };
  const note = body?.note ? String(body.note).slice(0, 140) : null;

  const reporter = reporterId(ip);
  const limited = rateLimited(reporter, phatakId);
  if (limited) return { error: limited, code: 429 };

  await addReport({ phatakId, status, trainType, note, reporter });
  return { ok: true };
}

export function reportsFor(phatakId) {
  return recentReports(phatakId, Date.now() - REPORT_TTL_MIN * 60 * 1000);
}

// ─── Gatekeeper override (PIN-protected) ──────────────────────────────────────
export async function setOverride(phatakId, body) {
  const pin = process.env.GATEKEEPER_PIN;
  if (!pin) return { error: 'Gatekeeper override is disabled (GATEKEEPER_PIN not set).', code: 403 };
  if (String(body?.pin || '') !== pin) return { error: 'Invalid PIN', code: 401 };
  const status = String(body?.status || '').toUpperCase();
  if (!['OPEN', 'CLOSED'].includes(status)) return { error: 'status must be OPEN or CLOSED', code: 400 };
  const minutes = Math.min(Math.max(Number(body?.minutes) || 15, 1), 120);
  const override = { status, until: Date.now() + minutes * 60 * 1000 };
  await kvSet(`override:${phatakId}`, override, minutes * 60 * 1000);
  return { ok: true, override };
}

export const getOverride = (phatakId) => kvGet(`override:${phatakId}`);
