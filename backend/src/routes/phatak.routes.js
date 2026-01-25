import express from "express";
import { 
  getAllPhataks, 
  getPhataksByBounds, 
  getPhatakById,
  getPhatakByPhatakId,
  getPhataksByStateController,
  getPhataksByZoneController,
  getPhatakStatsController
} from "../controllers/phatak.controller.js";

const router = express.Router();

/**
 * PHATAK API ROUTES
 * 
 * Route order matters! Specific routes must come before parameterized routes.
 */

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

export default router;
