import { getAllActiveTrains, getTrains, updateTrain } from '../services/dataCache.js';
import { computePhatakStatus } from '../services/phatakMonitor.service.js';

/** Get all active trains enriched with phatak distance data */
export const getAllTrains = async (req, res) => {
  try {
    const allTrains = getAllActiveTrains();

    // Compute phatak distances for this snapshot
    const { updatedTrains } = computePhatakStatus(allTrains);

    // Sort: approaching trains first, then by distance to Phatak 23
    const sorted = updatedTrains.sort((a, b) => {
      const order = { CRITICAL: 0, APPROACHING: 1, CLEAR: 2 };
      const ao = order[a.approachStatus] ?? 3;
      const bo = order[b.approachStatus] ?? 3;
      if (ao !== bo) return ao - bo;
      return (a.distToPhatak23 ?? Infinity) - (b.distToPhatak23 ?? Infinity);
    });

    // Strip route from response (too large)
    const result = sorted.map(({ route, ...t }) => t);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Get trains by viewport bounds */
export const getTrainsByBounds = async (req, res) => {
  try {
    const { neLat, neLng, swLat, swLng } = req.query;
    const nLat = Number(neLat);
    const nLng = Number(neLng);
    const sLat = Number(swLat);
    const sLng = Number(swLng);

    const allTrains = getAllActiveTrains();
    const { updatedTrains } = computePhatakStatus(allTrains);

    const filtered = updatedTrains.filter((train) => {
      if (!train.currentPosition?.coordinates) return false;
      const [lng, lat] = train.currentPosition.coordinates;
      return lat <= nLat && lat >= sLat && lng <= nLng && lng >= sLng;
    });

    res.json(filtered.map(({ route, ...t }) => t));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Get a specific train by number */
export const getTrainByNumber = async (req, res) => {
  try {
    const allTrains = getAllActiveTrains();
    const train = allTrains.find(
      (t) => t.trainNumber === req.params.trainNumber
    );
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    const { updatedTrains } = computePhatakStatus([train]);
    res.json(updatedTrains[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Get train route */
export const getTrainRoute = async (req, res) => {
  try {
    const localTrains = getTrains();
    const train = localTrains.find(
      (t) => t.trainNumber === req.params.trainNumber && t.isActive
    );
    if (!train) {
      return res.status(404).json({ message: 'Route not found (RailRadar trains have no stored route)' });
    }
    res.json({
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      route: train.route,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Train statistics */
export const getTrainStatistics = async (req, res) => {
  try {
    const trains = getAllActiveTrains();
    const total = trains.length;
    const delayed = trains.filter((t) => (t.delayMinutes || 0) > 0).length;
    const avgSpeed = total > 0
      ? Math.round(trains.reduce((s, t) => s + (t.speed || 0), 0) / total)
      : 0;

    res.json({ total, delayed, onTime: total - delayed, avgSpeed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
