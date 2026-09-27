import express from 'express';
import { estimatedTrainsOnLine, anchorTimetable } from '../services/timetable.service.js';
import { kvGet } from '../services/store.js';
import { delaysFromLiveBoard } from '../services/railradar.service.js';
import { trainTypeLabel } from '../services/trainType.js';

const router = express.Router();

/**
 * GET /api/trains — trains estimated to be on the lines we have verified timetables for
 * (currently Rajpura – Patiala – Nabha). Positions come from the timetable (+ cached
 * RailRadar delays when available); goods trains are not included (no public data).
 */
router.get('/', async (_req, res) => {
  const board = await kvGet('rr:station-live:PTA');
  const delays = board ? delaysFromLiveBoard(board) : null;
  const trains = estimatedTrainsOnLine(Date.now(), delays).map((t) => ({ ...t, typeLabel: trainTypeLabel(t.type) }));
  res.json({
    trains,
    coverage: 'Rajpura – Patiala – Nabha',
    positionSource: delays ? 'timetable + live delays' : 'timetable estimate',
    note: 'Goods trains have no public schedule and are not shown; see user reports on each crossing.',
    computedAt: Date.now(),
  });
});

/** GET /api/trains/timetable — the verified Patiala (PTA) timetable. */
router.get('/timetable', (_req, res) => {
  const tt = anchorTimetable();
  res.json({ ...tt, trains: tt.trains.map((t) => ({ ...t, typeLabel: trainTypeLabel(t.type) })) });
});

export default router;
