import express from 'express';

const router = express.Router();

/** GET /api/alerts — last 24h alerts */
router.get('/', async (req, res) => {
  try {
    const AlertLog = (await import('../models/AlertLog.model.js')).default;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const alerts = await AlertLog.find({ timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(alerts);
  } catch (err) {
    // MongoDB may not be available — return empty
    res.json([]);
  }
});

/** POST /api/alerts — log new alert */
router.post('/', async (req, res) => {
  try {
    const AlertLog = (await import('../models/AlertLog.model.js')).default;
    const alert = await AlertLog.create(req.body);
    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
