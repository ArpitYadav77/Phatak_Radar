/**
 * BOOTSTRAP
 *
 * Server startup sequence:
 * 1. Connect to MongoDB (if URI available)
 * 2. Initialize in-memory store from JSON files
 * 3. Upsert Phatak 23 and 24 into MongoDB
 * 4. Start simulation engine
 * 5. Start RailRadar polling (30s interval)
 * 6. Start phatak monitor (runs after each poll)
 */

import { initializeMemoryStore, setRailRadarTrains, setMonitoredPhataks, getAllActiveTrains } from './services/dataCache.js';
import { startSimulation } from './services/trainSimulation.service.js';
import { fetchLiveMap, normalizeRailRadarTrain } from './services/railradar.service.js';
import { computePhatakStatus, PHATAKS_CONFIG, alertEmitter } from './services/phatakMonitor.service.js';

let initialized = false;

// ─── MongoDB lazy-connect ──────────────────────────────────────────────────────
async function tryConnectMongo() {
  try {
    const { default: connectDB } = await import('./config/db.js');
    await connectDB();
    return true;
  } catch (err) {
    console.warn('⚠️ MongoDB not available, running in database-less mode:', err.message);
    return false;
  }
}

// ─── Upsert Phatak 23/24 into MongoDB ────────────────────────────────────────
async function upsertMonitoredPhataks(mongoAvailable) {
  if (!mongoAvailable) return;
  try {
    const { default: Phatak } = await import('./models/Phatak.model.js');
    for (const cfg of PHATAKS_CONFIG) {
      await Phatak.findOneAndUpdate(
        { phatakId: cfg.phatakId },
        {
          $setOnInsert: {
            name: cfg.name,
            phatakId: cfg.phatakId,
            location: cfg.location,
            lat: cfg.lat,
            lng: cfg.lng,
            state: cfg.state,
            district: cfg.district,
            railwayZone: cfg.railwayZone,
            railLineName: cfg.railLineName,
            railwayDivision: cfg.railwayDivision || 'Ferozepur',
            road: cfg.road || null,
            gateType: cfg.gateType,
            nearbyStations: cfg.nearbyStations,
            status: 'OPEN',
            trainInfo: null,
            liveStatus: { gateStatus: 'OPEN', approachingTrains: [], lastCheck: new Date() },
            events: [],
            dailySchedule: getPatialaSchedule(),
          },
        },
        { upsert: true, new: true }
      );
      console.log(`✅ MongoDB: Upserted ${cfg.name}`);
    }
  } catch (err) {
    console.warn('⚠️ Could not upsert phataks to MongoDB:', err.message);
  }
}

// ─── Alert handler: persist to MongoDB + log ──────────────────────────────────
function setupAlertHandler(mongoAvailable) {
  alertEmitter.on('statusChange', async (event) => {
    const { phatakId, phatakName, prevStatus, newStatus, nearestTrain } = event;
    let alertType = 'ALL_CLEAR';
    if (newStatus === 'CLOSED') alertType = 'CRITICAL';
    else if (newStatus === 'WARNING') alertType = 'APPROACHING';

    console.log(`🚨 [Alert] ${phatakName}: ${prevStatus} → ${newStatus}${nearestTrain ? ` (Train ${nearestTrain.trainNumber}, ${nearestTrain.distanceKm}km)` : ''}`);

    if (mongoAvailable && alertType !== 'ALL_CLEAR') {
      try {
        const { default: AlertLog } = await import('./models/AlertLog.model.js');
        await AlertLog.create({
          phatakId,
          phatakName,
          trainNumber: nearestTrain?.trainNumber,
          trainName: nearestTrain?.trainName,
          alertType,
          distanceKm: nearestTrain?.distanceKm,
          etaMinutes: nearestTrain?.eta,
          speed: nearestTrain?.speed,
        });
      } catch (err) {
        console.warn('⚠️ Could not write alert to MongoDB:', err.message);
      }
    }

    // Persist gate status change to MongoDB
    if (mongoAvailable) {
      try {
        const { default: Phatak } = await import('./models/Phatak.model.js');
        await Phatak.findOneAndUpdate(
          { phatakId },
          {
            status: newStatus === 'OPEN' ? 'OPEN' : 'CLOSED',
            trainInfo: nearestTrain ? `${nearestTrain.trainName} (${nearestTrain.trainNumber})` : null,
            trainName: nearestTrain?.trainName || null,
            eta: nearestTrain?.eta || null,
            liveStatus: {
              gateStatus: newStatus,
              approachingTrains: nearestTrain ? [nearestTrain] : [],
              lastCheck: new Date(),
            },
            lastUpdated: new Date(),
          }
        );
      } catch (_) { /* ignore */ }
    }
  });
}

// ─── RailRadar polling loop ───────────────────────────────────────────────────
async function pollRailRadar() {
  try {
    const liveData = await fetchLiveMap();
    if (liveData && liveData.length > 0) {
      const normalized = liveData
        .map(normalizeRailRadarTrain)
        .filter(Boolean);
      setRailRadarTrains(normalized);
      console.log(`📡 RailRadar: fetched ${normalized.length} live trains`);
    } else {
      console.log('📡 RailRadar: no data returned, keeping simulation trains');
      setRailRadarTrains([]);
    }
  } catch (err) {
    console.warn('⚠️ RailRadar poll failed:', err.message);
    setRailRadarTrains([]);
  }

  // After fetching trains, run phatak monitor
  runPhatakMonitor();
}

function runPhatakMonitor() {
  const allTrains = getAllActiveTrains();
  const { updatedPhataks, updatedTrains } = computePhatakStatus(allTrains);
  setMonitoredPhataks(updatedPhataks);
  // Note: updatedTrains are used by controllers at request time, not stored globally
}

// ─── Patiala daily schedule (Rajpura–Patiala–Dhuri line) ─────────────────────
function getPatialaSchedule() {
  // Same schedule for Phatak 23 (Model Town) & Phatak 24 (Nabha Road)
  // Both crossings are on the same line, trains pass them within minutes of each other
  return [
    { trainNumber: '14503', trainName: 'Patiala Express',          scheduledTime: '23:55', direction: 'DOWN', closureDuration: 10 },
    { trainNumber: '14504', trainName: 'Patiala Express',          scheduledTime: '05:25', direction: 'UP',   closureDuration: 10 },
    { trainNumber: '12497', trainName: 'Shane Punjab Express',     scheduledTime: '19:50', direction: 'UP',   closureDuration: 10 },
    { trainNumber: '12498', trainName: 'Shane Punjab Express',     scheduledTime: '08:10', direction: 'DOWN', closureDuration: 10 },
    { trainNumber: '14649', trainName: 'Saryuyamuna Express',      scheduledTime: '02:30', direction: 'DOWN', closureDuration: 10 },
    { trainNumber: '14650', trainName: 'Saryuyamuna Express',      scheduledTime: '01:15', direction: 'UP',   closureDuration: 10 },
    { trainNumber: '74901', trainName: 'Rajpura–Bhatinda DMU',     scheduledTime: '06:50', direction: 'DOWN', closureDuration: 10 },
    { trainNumber: '74902', trainName: 'Bhatinda–Rajpura DMU',     scheduledTime: '18:10', direction: 'UP',   closureDuration: 10 },
    { trainNumber: '74903', trainName: 'Patiala–Rajpura Passenger',scheduledTime: '07:45', direction: 'UP',   closureDuration: 10 },
    { trainNumber: '74904', trainName: 'Rajpura–Patiala Passenger',scheduledTime: '17:00', direction: 'DOWN', closureDuration: 10 },
    { trainNumber: '18101', trainName: 'Tata–Patiala Express',     scheduledTime: '11:30', direction: 'DOWN', closureDuration: 10 },
    { trainNumber: '18102', trainName: 'Patiala–Tata Express',     scheduledTime: '15:20', direction: 'UP',   closureDuration: 10 },
  ];
}

// ─── Main initialization ───────────────────────────────────────────────────────
export async function initializeServer({ startSimulationEngine = true } = {}) {
  if (initialized) return;

  // 1. Load JSON data into memory
  await initializeMemoryStore();

  // 2. Try MongoDB
  const mongoAvailable = await tryConnectMongo();

  // 3. Upsert Phatak 23 and 24
  await upsertMonitoredPhataks(mongoAvailable);

  // 4. Setup alert handler
  setupAlertHandler(mongoAvailable);

  // 5. Start simulation engine
  if (startSimulationEngine) {
    startSimulation();
  }

  // 6. First RailRadar poll immediately, then every 30s
  await pollRailRadar();
  setInterval(pollRailRadar, 30_000);

  initialized = true;

  console.log('='.repeat(50));
  console.log('✅ Phatak Radar backend ready!');
  console.log(`🗄️  MongoDB: ${mongoAvailable ? 'Connected' : 'Offline (memory mode)'}`);
  console.log('📡 RailRadar: Polling every 30 seconds');
  console.log('🚦 Monitoring: Patiala Phatak 23 (Model Town) & 24 (Nabha Road)');
  console.log('📡 API endpoints:');
  console.log('   GET /api/health');
  console.log('   GET /api/phataks');
  console.log('   GET /api/trains');
  console.log('   GET /api/alerts');
  console.log('='.repeat(50));
}
