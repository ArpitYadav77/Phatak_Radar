import express from 'express';
import {
  getCrossing, crossingsInBbox, nearestCrossings, searchCrossings, curatedCrossings,
} from '../services/crossings.service.js';
import { statusFor, summaryFor, publicCrossing, memoized, invalidate, dayFor } from '../services/status.service.js';
import { submitReport, setOverride } from '../services/reports.service.js';
import { reportedPhatakIds } from '../services/store.js';
import { REPORT_TTL_MIN } from '../services/gateEngine.js';

const router = express.Router();

const num = (v) => (v === undefined || v === '' ? NaN : Number(v));
const recentReportIds = () => reportedPhatakIds(Date.now() - REPORT_TTL_MIN * 60 * 1000);

/**
 * GET /api/phataks?bbox=minLat,minLng,maxLat,maxLng[&limit=]
 * Without bbox: the curated crossings (small, for the default view).
 */
router.get('/', async (req, res) => {
  try {
    if (!req.query.bbox) {
      const reported = await recentReportIds();
      const items = await Promise.all(curatedCrossings().map(async (c) => ({ ...publicCrossing(c), ...(await summaryFor(c, reported)) })));
      return res.json({ items, total: items.length, truncated: false });
    }
    const [minLat, minLng, maxLat, maxLng] = String(req.query.bbox).split(',').map(Number);
    if ([minLat, minLng, maxLat, maxLng].some((n) => !Number.isFinite(n)) || minLat >= maxLat || minLng >= maxLng) {
      return res.status(400).json({ error: 'bbox must be minLat,minLng,maxLat,maxLng' });
    }
    if ((maxLat - minLat) * (maxLng - minLng) > 4) {
      return res.status(400).json({ error: 'bbox too large — zoom in' });
    }
    const limit = Math.min(Number(req.query.limit) || 800, 2000);
    const key = `bbox:${[minLat, minLng, maxLat, maxLng].map((n) => n.toFixed(3)).join(',')}:${limit}`;
    const body = await memoized(key, async () => {
      const { items, truncated, total } = crossingsInBbox(minLat, minLng, maxLat, maxLng, limit);
      const reported = await recentReportIds();
      const withStatus = await Promise.all(items.map(async (c) => ({ ...publicCrossing(c), ...(await summaryFor(c, reported)) })));
      return { items: withStatus, total, truncated };
    });
    res.json(body);
  } catch (err) {
    console.error('❌ GET /api/phataks', err);
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/phataks/search?q=patiala */
router.get('/search', (req, res) => {
  const q = String(req.query.q || '').slice(0, 80);
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  res.json({ items: searchCrossings(q, limit).map(publicCrossing) });
});

/** GET /api/phataks/nearest?lat=..&lng=..[&limit=5] */
router.get('/nearest', (req, res) => {
  const lat = num(req.query.lat);
  const lng = num(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ error: 'lat and lng required' });
  const limit = Math.min(Number(req.query.limit) || 5, 20);
  res.json({
    items: nearestCrossings(lat, lng, limit).map(({ crossing, distanceKm }) => ({ ...publicCrossing(crossing), distanceKm })),
  });
});

/** GET /api/phataks/:id — full status (train now/next, countdowns, confidence). */
router.get('/:id', async (req, res) => {
  const c = getCrossing(req.params.id);
  if (!c) return res.status(404).json({ error: 'Crossing not found' });
  try {
    res.json(await statusFor(c));
  } catch (err) {
    console.error(`❌ GET /api/phataks/${req.params.id}`, err);
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/phataks/:id/day — today's expected closures (IST) for charts. */
router.get('/:id/day', async (req, res) => {
  const c = getCrossing(req.params.id);
  if (!c) return res.status(404).json({ error: 'Crossing not found' });
  try {
    res.json(await memoized(`day:${c.id}`, () => dayFor(c), 60000));
  } catch (err) {
    console.error(`❌ GET /api/phataks/${req.params.id}/day`, err);
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/phataks/:id/report { status: "CLOSED"|"OPEN", trainType?, note? } */
router.post('/:id/report', async (req, res) => {
  const c = getCrossing(req.params.id);
  if (!c) return res.status(404).json({ error: 'Crossing not found' });
  const r = await submitReport(c.id, req.body, req.ip);
  if (r.error) return res.status(r.code).json({ error: r.error });
  invalidate(c.id);
  res.status(201).json({ ok: true, status: await statusFor(c) });
});

/** POST /api/phataks/:id/status { pin, status, minutes? } — gatekeeper override. */
router.post('/:id/status', async (req, res) => {
  const c = getCrossing(req.params.id);
  if (!c) return res.status(404).json({ error: 'Crossing not found' });
  const r = await setOverride(c.id, req.body);
  if (r.error) return res.status(r.code).json({ error: r.error });
  invalidate(c.id);
  res.json({ ok: true, override: r.override, status: await statusFor(c) });
});

export default router;
