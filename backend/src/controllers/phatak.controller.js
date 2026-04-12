/**
 * PHATAK CONTROLLER
 *
 * Handles API requests for railway level crossing data.
 * For Phatak 23 and 24, overlays live status from the phatak monitor.
 */

import { getPhataks, getMonitoredPhataks } from '../services/dataCache.js';
import {
  getPhataksInBounds,
  getPhataksByState,
  getPhataksByZone,
  getPhatakStats,
} from '../services/phatakData.service.js';
import { PHATAKS_CONFIG } from '../services/phatakMonitor.service.js';

/** Get all phataks — includes monitored phataks (23 & 24) with live status */
export const getAllPhataks = async (req, res) => {
  try {
    // Start with all phataks from memory
    const allPhataks = getPhataks();

    // Get live-monitored phataks (Phatak 23 and 24)
    const monitored = getMonitoredPhataks();
    const monitoredIds = new Set(monitored.map((p) => p.phatakId));

    // Merge: for monitored phataks use live data, for rest use memory data
    // Also ensure monitored phataks appear even if not in JSON files
    const result = [];

    // Add non-monitored phataks from memory
    for (const p of allPhataks) {
      if (!monitoredIds.has(p.phatakId)) {
        result.push(p);
      }
    }

    // Add monitored phataks with live status
    for (const mp of monitored) {
      result.unshift(mp); // Show at top
    }

    // If monitored list empty (not yet computed), add config defaults
    if (monitored.length === 0) {
      for (const cfg of PHATAKS_CONFIG) {
        result.unshift({
          ...cfg,
          status: 'OPEN',
          trainInfo: null,
          liveStatus: { gateStatus: 'OPEN', approachingTrains: [], lastCheck: new Date() },
          lastUpdated: new Date(),
        });
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Get phataks within bounding box */
export const getPhataksByBounds = async (req, res) => {
  try {
    let minLat, minLng, maxLat, maxLng;

    if (req.query.bbox) {
      const coords = req.query.bbox.split(',').map(Number);
      if (coords.length !== 4) {
        return res.status(400).json({ message: 'Invalid bbox format. Expected: minLat,minLng,maxLat,maxLng' });
      }
      [minLat, minLng, maxLat, maxLng] = coords;
    } else if (req.query.minLat && req.query.minLng && req.query.maxLat && req.query.maxLng) {
      minLat = Number(req.query.minLat);
      minLng = Number(req.query.minLng);
      maxLat = Number(req.query.maxLat);
      maxLng = Number(req.query.maxLng);
    } else if (req.query.neLat && req.query.neLng && req.query.swLat && req.query.swLng) {
      minLat = Number(req.query.swLat);
      minLng = Number(req.query.swLng);
      maxLat = Number(req.query.neLat);
      maxLng = Number(req.query.neLng);
    } else {
      return getAllPhataks(req, res);
    }

    if (minLat >= maxLat || minLng >= maxLng) {
      return res.status(400).json({ message: 'Invalid bounds' });
    }

    const phataks = await getPhataksInBounds(minLat, minLng, maxLat, maxLng);

    // Add monitored phataks if within bounds
    const monitored = getMonitoredPhataks();
    for (const mp of monitored) {
      if (
        mp.lat >= minLat && mp.lat <= maxLat &&
        mp.lng >= minLng && mp.lng <= maxLng
      ) {
        // Avoid duplicates
        if (!phataks.find((p) => p.phatakId === mp.phatakId)) {
          phataks.unshift(mp);
        }
      }
    }

    res.json(phataks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Get phatak by MongoDB ID */
export const getPhatakById = async (req, res) => {
  try {
    // Check monitored first
    const monitored = getMonitoredPhataks();
    const mp = monitored.find((p) => p.phatakId === req.params.id);
    if (mp) return res.json(mp);

    const phataks = getPhataks();
    const p = phataks.find((ph) => ph._id?.toString() === req.params.id || ph.phatakId === req.params.id);
    if (!p) return res.status(404).json({ message: 'Phatak not found' });
    res.json(p);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Lookup by phatakId */
export const getPhatakByPhatakId = async (req, res) => {
  try {
    const monitored = getMonitoredPhataks();
    const mp = monitored.find((p) => p.phatakId === req.params.phatakId);
    if (mp) return res.json(mp);

    const phataks = getPhataks();
    const p = phataks.find((ph) => ph.phatakId === req.params.phatakId);
    if (!p) return res.status(404).json({ message: 'Phatak not found' });
    res.json(p);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Get phataks by state */
export const getPhataksByStateController = async (req, res) => {
  try {
    const phataks = await getPhataksByState(req.params.state);
    res.json(phataks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Get phataks by zone */
export const getPhataksByZoneController = async (req, res) => {
  try {
    const phataks = await getPhataksByZone(req.params.zone);
    res.json(phataks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Statistics */
export const getPhatakStatsController = async (req, res) => {
  try {
    const stats = await getPhatakStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Update phatak status (manual override) */
export const updatePhatakStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trainInfo } = req.body;
    // For now, return success (could update in-memory or MongoDB)
    res.json({ success: true, phatakId: id, status, trainInfo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
