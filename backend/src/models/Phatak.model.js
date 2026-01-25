import mongoose from "mongoose";

/**
 * PHATAK DATA MODEL - PAN-INDIA RAILWAY LEVEL CROSSINGS
 * 
 * This schema supports scalable storage of railway level-crossing (phatak) data
 * across India. It combines static metadata (location, zone, gate type) with
 * dynamic runtime data (status, ETA, train info).
 * 
 * DATA SOURCE STRATEGY:
 * - Currently seeded from curated JSON files (backend/data/phataks/)
 * - No official open API exists for Indian railway level crossings
 * - Coordinates are approximate, sourced from railway maps and OSM data
 * - Production systems should integrate with Indian Railways' official APIs when available
 * 
 * SCALABILITY:
 * - Indexed by location (2dsphere) for efficient bbox queries
 * - Indexed by state, zone, and phatakId for fast lookups
 * - Supports thousands of phataks with minimal query overhead
 */

const phatakSchema = new mongoose.Schema({
  // === UNIQUE IDENTIFIER ===
  phatakId: {
    type: String,
    required: true,
    unique: true,
    // Format: PHK_{STATE_CODE}_{ZONE}_{SERIAL}
    // Example: PHK_UP_NCR_1021, PHK_MH_CR_2045
  },
  
  // === BASIC INFO ===
  name: {
    type: String,
    required: true,
    // Example: "Faridabad Level Crossing", "Dadar Phatak"
  },
  
  // === GEOGRAPHIC DATA ===
  state: {
    type: String,
    required: true,
    // Example: "Maharashtra", "Uttar Pradesh", "West Bengal"
  },
  district: {
    type: String,
    required: true,
    // Example: "Mumbai", "Varanasi", "Kolkata"
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number], // [lng, lat] - GeoJSON format
      required: true
    }
  },
  
  // === RAILWAY METADATA ===
  railwayZone: {
    type: String,
    required: true,
    // Example: "CR" (Central), "WR" (Western), "NR" (Northern)
    // Full list: CR, WR, NR, SR, ER, NER, NCR, SCR, SER, etc.
  },
  railLineName: {
    type: String,
    required: true,
    // Example: "Mumbai-Pune Line", "Delhi-Agra Mainline"
  },
  nearbyStations: [{
    type: String,
    // Example: ["Dadar", "Matunga"], ["New Delhi", "Hazrat Nizamuddin"]
  }],
  gateType: {
    type: String,
    enum: ["MANUAL", "AUTOMATIC", "UNMANNED"],
    required: true,
    default: "MANUAL"
    // MANUAL: Operated by gate keeper
    // AUTOMATIC: Interlocked with train signals
    // UNMANNED: No active control (high risk)
  },
  
  // === RUNTIME STATUS (Dynamic) ===
  status: {
    type: String,
    enum: ["OPEN", "CLOSED", "UNKNOWN"],
    default: "OPEN"
    // OPEN: Safe for road traffic
    // CLOSED: Train passing or approaching
    // UNKNOWN: No recent data
  },
  defaultStatus: {
    type: String,
    enum: ["OPEN", "CLOSED", "UNKNOWN"],
    default: "OPEN"
    // Default state when no train is nearby
  },
  
  // === TRAIN INTERACTION (Set by simulation engine) ===
  confidence: Number,
  reason: String,
  trainInfo: {
    type: String,
    default: null
  },
  trainName: String,
  eta: Number, // ETA in minutes
  delayMinutes: Number,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // === EVENT LOG ===
  events: [{
    type: {
      type: String,
      enum: ['gate_closed', 'gate_opened', 'delay_updated', 'train_approaching', 'status_unknown']
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // === DAILY SCHEDULE ===
  dailySchedule: [{
    trainNumber: String,
    trainName: String,
    scheduledTime: String, // Format: "HH:MM" (24-hour)
    direction: String, // "UP" or "DOWN"
    closureDuration: Number // Minutes the gate stays closed
  }]
}, {
  timestamps: true
});

// === INDEXES FOR PERFORMANCE ===
// Primary geospatial index for bbox queries (essential for map view)
phatakSchema.index({ location: "2dsphere" });

// Unique identifier lookup
phatakSchema.index({ phatakId: 1 }, { unique: true });

// Status filtering (for dashboard views)
phatakSchema.index({ status: 1 });

// State/zone filtering (for regional queries)
phatakSchema.index({ state: 1, railwayZone: 1 });

// Recent updates
phatakSchema.index({ lastUpdated: -1 });

/**
 * INTEGRATION WITH TRAIN SIMULATION ENGINE
 * 
 * How simulated trains interact with phataks:
 * 
 * 1. DISTANCE CALCULATION:
 *    - Train simulation calculates distance from each train to all nearby phataks
 *    - Uses Haversine formula (same as in trainSimulation.service.js)
 * 
 * 2. CLOSURE TRIGGER:
 *    - When train is within PHATAK_CLOSURE_DISTANCE_KM (typically 2km):
 *      - Phatak status → "CLOSED"
 *      - trainInfo → train number
 *      - trainName → train name
 *      - eta → calculated based on distance and train speed
 * 
 * 3. OPENING TRIGGER:
 *    - When train passes and is PHATAK_OPEN_DISTANCE_KM away (typically 0.5km):
 *      - Phatak status → defaultStatus (usually "OPEN")
 *      - trainInfo → null
 *      - eta → null
 * 
 * 4. EVENT LOGGING:
 *    - Each status change creates an event entry
 *    - Used for analytics and debugging
 * 
 * 5. REAL-TIME UPDATES:
 *    - Simulation runs every SIMULATION_TICK_MS (5 seconds)
 *    - Updates only phataks affected by moving trains
 *    - Frontend polls /api/phataks/bounds to get updates
 * 
 * FUTURE MIGRATION TO REAL APIs:
 * - Replace trainSimulation.service.js with actual NTES/RailYatri API calls
 * - Keep phatak schema unchanged - only update data source
 * - Add API connectors in backend/src/services/railwayAPI.service.js
 * - Swap JSON seed data with live railway crossing data when available
 */

export default mongoose.model("Phatak", phatakSchema);
