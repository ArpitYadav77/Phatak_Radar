import express from "express";
import { 
  getAllPhataks, 
  getPhataksByBounds, 
  getPhatakById,
  getPhatakByPhatakId,
  getPhataksByStateController,
  getPhataksByZoneController,
  getPhatakStatsController,
  updatePhatakStatus
} from "../controllers/phatak.controller.js";
import { getFullScheduleWithStatus } from "../services/phatakMonitor.service.js";

const router = express.Router();

/**
 * PHATAK API ROUTES
 * 
 * Route order matters! Specific routes must come before parameterized routes.
 */

// Full Ludhiana schedule with gate window status (OPEN/WARNING/CLOSED)
router.get("/schedule", (_req, res) => res.json(getFullScheduleWithStatus()));

// Statistics endpoint
router.get("/stats", getPhatakStatsController);

// Bbox query (RECOMMENDED for map view)
router.get("/bbox", getPhataksByBounds);

// Legacy bounds endpoint (kept for backward compatibility)
router.get("/bounds", getPhataksByBounds);

// State filter
router.get("/state/:state", getPhataksByStateController);

// Railway zone filter
router.get("/zone/:zone", getPhataksByZoneController);

// Lookup by phatakId
router.get("/lookup/:phatakId", getPhatakByPhatakId);

// Get all phataks (use with caution)
router.get("/", getAllPhataks);

// Get by MongoDB _id (must be last to avoid conflicts)
router.get("/:id", getPhatakById);

// Update phatak status (manual override or gate logic)
router.post("/:id/status", updatePhatakStatus);

export default router;
