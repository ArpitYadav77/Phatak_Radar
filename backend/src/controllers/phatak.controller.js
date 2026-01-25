/**
 * PHATAK CONTROLLER
 * 
 * Handles API requests for railway level crossing data.
 * 
 * Key endpoints:
 * - GET /api/phataks - Get all phataks (use with caution, can be slow with large datasets)
 * - GET /api/phataks/bbox - Get phataks within map bounds (RECOMMENDED for map view)
 * - GET /api/phataks/state/:state - Get phataks by state
 * - GET /api/phataks/zone/:zone - Get phataks by railway zone
 * - GET /api/phataks/stats - Get statistics
 * - GET /api/phataks/:id - Get single phatak by ID
 */

import Phatak from "../models/Phatak.model.js";
import { 
  getPhataksInBounds, 
  getPhataksByState, 
  getPhataksByZone,
  getPhatakStats 
} from "../services/phatakData.service.js";

/**
 * Get all phataks
 * 
 * ⚠️ WARNING: Can be slow with 1000+ phataks
 * Recommended: Use bbox query instead
 */
export const getAllPhataks = async (req, res) => {
  try {
    const phataks = await Phatak.find({})
      .select('-events') // Exclude events for performance
      .sort({ lastUpdated: -1 })
      .limit(1000); // Safety limit
    
    res.json(phataks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get phataks within bounding box (OPTIMIZED FOR MAP VIEW)
 * 
 * Query params:
 * - bbox: "minLat,minLng,maxLat,maxLng" (single param)
 * OR
 * - minLat, minLng, maxLat, maxLng (separate params)
 * OR (legacy support)
 * - neLat, neLng, swLat, swLng
 * 
 * Example:
 * GET /api/phataks/bbox?bbox=18.5,72.8,19.5,73.2
 * GET /api/phataks/bbox?minLat=18.5&minLng=72.8&maxLat=19.5&maxLng=73.2
 * 
 * Performance: O(log n) with 2dsphere index
 * Typical response: <10ms for 10,000 phataks
 */
export const getPhataksByBounds = async (req, res) => {
  try {
    let minLat, minLng, maxLat, maxLng;

    // Support single bbox parameter: bbox=minLat,minLng,maxLat,maxLng
    if (req.query.bbox) {
      const coords = req.query.bbox.split(',').map(Number);
      if (coords.length !== 4) {
        return res.status(400).json({ 
          message: 'Invalid bbox format. Expected: bbox=minLat,minLng,maxLat,maxLng' 
        });
      }
      [minLat, minLng, maxLat, maxLng] = coords;
    }
    // Support separate parameters
    else if (req.query.minLat && req.query.minLng && req.query.maxLat && req.query.maxLng) {
      minLat = Number(req.query.minLat);
      minLng = Number(req.query.minLng);
      maxLat = Number(req.query.maxLat);
      maxLng = Number(req.query.maxLng);
    }
    // Legacy support: neLat, neLng, swLat, swLng
    else if (req.query.neLat && req.query.neLng && req.query.swLat && req.query.swLng) {
      minLat = Number(req.query.swLat);
      minLng = Number(req.query.swLng);
      maxLat = Number(req.query.neLat);
      maxLng = Number(req.query.neLng);
    }
    // No bounds provided - return all (with warning)
    else {
      console.warn('⚠️  Bbox query without bounds - falling back to getAllPhataks');
      return getAllPhataks(req, res);
    }

    // Validate bounds
    if (minLat >= maxLat || minLng >= maxLng) {
      return res.status(400).json({ 
        message: 'Invalid bounds. Ensure minLat < maxLat and minLng < maxLng' 
      });
    }

    const phataks = await getPhataksInBounds(minLat, minLng, maxLat, maxLng);
    
    res.json(phataks);
  } catch (error) {
    console.error('Error in getPhataksByBounds:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get phatak by MongoDB ID
 */
export const getPhatakById = async (req, res) => {
  try {
    const phatak = await Phatak.findById(req.params.id);
    
    if (!phatak) {
      return res.status(404).json({ message: 'Phatak not found' });
    }
    
    res.json(phatak);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get phatak by phatakId (unique identifier)
 * 
 * Example: GET /api/phataks/lookup/PHK_MH_CR_001
 */
export const getPhatakByPhatakId = async (req, res) => {
  try {
    const phatak = await Phatak.findOne({ phatakId: req.params.phatakId });
    
    if (!phatak) {
      return res.status(404).json({ message: 'Phatak not found' });
    }
    
    res.json(phatak);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all phataks in a state
 * 
 * Example: GET /api/phataks/state/Maharashtra
 */
export const getPhataksByStateController = async (req, res) => {
  try {
    const phataks = await getPhataksByState(req.params.state);
    res.json(phataks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all phataks in a railway zone
 * 
 * Example: GET /api/phataks/zone/CR
 */
export const getPhataksByZoneController = async (req, res) => {
  try {
    const phataks = await getPhataksByZone(req.params.zone);
    res.json(phataks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get phatak statistics
 * 
 * Returns breakdown by state, zone, gate type, status
 */
export const getPhatakStatsController = async (req, res) => {
  try {
    const stats = await getPhatakStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
