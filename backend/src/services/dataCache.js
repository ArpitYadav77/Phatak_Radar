// Static JSON imports — bundler-safe for Vercel and all serverless platforms.
// Do NOT switch these to dynamic fs reads; Vercel's nft bundler cannot trace them.
import gujaratData from '../../data/phataks/gujarat.json' assert { type: 'json' };
import karnatakaData from '../../data/phataks/karnataka.json' assert { type: 'json' };
import maharashtraData from '../../data/phataks/maharashtra.json' assert { type: 'json' };
import punjabData from '../../data/phataks/punjab.json' assert { type: 'json' };
import rajasthanData from '../../data/phataks/rajasthan.json' assert { type: 'json' };
import tamilNaduData from '../../data/phataks/tamil_nadu.json' assert { type: 'json' };
import uttarPradeshData from '../../data/phataks/uttar_pradesh.json' assert { type: 'json' };
import westBengalData from '../../data/phataks/west_bengal.json' assert { type: 'json' };

const ALL_PHATAK_DATA = [
  ...gujaratData,
  ...karnatakaData,
  ...maharashtraData,
  ...punjabData,
  ...rajasthanData,
  ...tamilNaduData,
  ...uttarPradeshData,
  ...westBengalData,
];

// In-memory store
let phataks = [];
let trains = [];

// Live RailRadar trains (from /api/v1/trains/live-map)
let railRadarTrains = [];

// Processed phataks with live status (Phatak 23 and 24)
let monitoredPhataks = [];

export async function initializeMemoryStore() {
  console.log('🧠 Initializing in-memory data store from static JSON imports...');

  try {
    phataks = ALL_PHATAK_DATA.map((p) => ({
      ...p,
      location: {
        type: 'Point',
        coordinates: [p.lng, p.lat],
      },
      status: p.defaultStatus || 'OPEN',
      lastUpdated: new Date(),
      events: [],
    }));
    console.log(`✅ Loaded ${phataks.length} phataks into memory.`);

    // Load sample trains
    trains = getSampleTrains();
    console.log(`✅ Loaded ${trains.length} sample trains into memory.`);
  } catch (error) {
    console.error('❌ Memory store initialization error:', error);
  }
}

// ─── Phatak accessors ────────────────────────────────────────────────────────
export const getPhataks = () => phataks;

export const updatePhatak = (id, data) => {
  const index = phataks.findIndex(
    (p) => p.phatakId === id || p._id === id
  );
  if (index !== -1) {
    phataks[index] = { ...phataks[index], ...data, lastUpdated: new Date() };
    return phataks[index];
  }
  return null;
};

// ─── Simulation train accessors ───────────────────────────────────────────────
export const getTrains = () => trains;

export const updateTrain = (id, data) => {
  const index = trains.findIndex(
    (t) => t.trainNumber === id || t._id === id
  );
  if (index !== -1) {
    trains[index] = { ...trains[index], ...data, lastUpdated: new Date() };
    return trains[index];
  }
  return null;
};

// ─── RailRadar live-map cache ─────────────────────────────────────────────────
export const getRailRadarTrains = () => railRadarTrains;

export const setRailRadarTrains = (newTrains) => {
  railRadarTrains = Array.isArray(newTrains) ? newTrains : [];
};

// ─── Monitored phataks (Phatak 23 and 24 with live status) ───────────────────
export const getMonitoredPhataks = () => monitoredPhataks;

export const setMonitoredPhataks = (phatakList) => {
  monitoredPhataks = Array.isArray(phatakList) ? phatakList : [];
};

// ─── All trains (merge simulation + RailRadar) ────────────────────────────────
export const getAllActiveTrains = () => {
  const localActive = trains.filter((t) => t.isActive);
  const rrNumbers = new Set(railRadarTrains.map((t) => t.trainNumber));

  // Prefer RailRadar over local simulation for the same train number
  const localFiltered = localActive.filter(
    (t) => !rrNumbers.has(t.trainNumber)
  );

  return [...railRadarTrains, ...localFiltered];
};

// ─── Sample simulation trains (Ludhiana corridor) ─────────────────────────────
function getSampleTrains() {
  const LUDHIANA = [75.8573, 30.9010];
  const DELHI = [77.2090, 28.6139];
  const AMRITSAR = [74.8723, 31.6340];
  const JALANDHAR = [75.5762, 31.3260];
  const AMBALA = [76.7794, 30.7333];
  const PATHANKOT = [75.6520, 32.2646];

  return [
    {
      _id: 'sim_12001',
      trainNumber: '12001',
      trainName: 'Shatabdi Express',
      currentPosition: { type: 'Point', coordinates: [76.5, 30.2] },
      direction: 315,
      speed: 85,
      delayMinutes: 0,
      status: 'RUNNING',
      isActive: true,
      source: 'simulation',
      routeIndex: 0,
      route: {
        type: 'LineString',
        coordinates: [DELHI, AMBALA, LUDHIANA, JALANDHAR, AMRITSAR],
      },
      schedule: {
        departureTime: '06:00',
        arrivalTime: '12:30',
        origin: 'New Delhi',
        destination: 'Amritsar',
        frequency: 'daily',
      },
      affectedPhataks: [],
      lastUpdated: new Date(),
    },
    {
      _id: 'sim_12002',
      trainNumber: '12002',
      trainName: 'Shatabdi Express (Return)',
      currentPosition: { type: 'Point', coordinates: [75.2, 31.1] },
      direction: 135,
      speed: 80,
      delayMinutes: 5,
      status: 'RUNNING',
      isActive: true,
      source: 'simulation',
      routeIndex: 0,
      route: {
        type: 'LineString',
        coordinates: [AMRITSAR, JALANDHAR, LUDHIANA, AMBALA, DELHI],
      },
      schedule: {
        departureTime: '15:30',
        arrivalTime: '21:45',
        origin: 'Amritsar',
        destination: 'New Delhi',
        frequency: 'daily',
      },
      affectedPhataks: [],
      lastUpdated: new Date(),
    },
    {
      _id: 'sim_12469',
      trainNumber: '12469',
      trainName: 'Delhi-Ludhiana Express',
      currentPosition: { type: 'Point', coordinates: [76.9, 30.6] },
      direction: 315,
      speed: 70,
      delayMinutes: 0,
      status: 'RUNNING',
      isActive: true,
      source: 'simulation',
      routeIndex: 0,
      route: {
        type: 'LineString',
        coordinates: [DELHI, AMBALA, LUDHIANA],
      },
      schedule: {
        departureTime: '08:00',
        arrivalTime: '13:00',
        origin: 'New Delhi',
        destination: 'Ludhiana',
        frequency: 'daily',
      },
      affectedPhataks: [],
      lastUpdated: new Date(),
    },
    {
      _id: 'sim_12470',
      trainNumber: '12470',
      trainName: 'Ludhiana-Delhi Express',
      currentPosition: { type: 'Point', coordinates: [75.9, 30.85] },
      direction: 135,
      speed: 68,
      delayMinutes: 10,
      status: 'RUNNING',
      isActive: true,
      source: 'simulation',
      routeIndex: 0,
      route: {
        type: 'LineString',
        coordinates: [LUDHIANA, AMBALA, DELHI],
      },
      schedule: {
        departureTime: '14:00',
        arrivalTime: '19:30',
        origin: 'Ludhiana',
        destination: 'New Delhi',
        frequency: 'daily',
      },
      affectedPhataks: [],
      lastUpdated: new Date(),
    },
    {
      _id: 'sim_12715',
      trainNumber: '12715',
      trainName: 'Sachkhand Express',
      currentPosition: { type: 'Point', coordinates: [75.1, 31.2] },
      direction: 315,
      speed: 75,
      delayMinutes: 15,
      status: 'RUNNING',
      isActive: true,
      source: 'simulation',
      routeIndex: 0,
      route: {
        type: 'LineString',
        coordinates: [DELHI, AMBALA, LUDHIANA, JALANDHAR, AMRITSAR],
      },
      schedule: {
        departureTime: '22:00',
        arrivalTime: '06:30',
        origin: 'Nanded',
        destination: 'Amritsar',
        frequency: 'daily',
      },
      affectedPhataks: [],
      lastUpdated: new Date(),
    },
    {
      _id: 'sim_12925',
      trainNumber: '12925',
      trainName: 'Paschim Express',
      currentPosition: { type: 'Point', coordinates: [76.2, 30.4] },
      direction: 315,
      speed: 72,
      delayMinutes: 0,
      status: 'RUNNING',
      isActive: true,
      source: 'simulation',
      routeIndex: 0,
      route: {
        type: 'LineString',
        coordinates: [DELHI, AMBALA, LUDHIANA, AMRITSAR],
      },
      schedule: {
        departureTime: '21:55',
        arrivalTime: '05:30',
        origin: 'Mumbai Central',
        destination: 'Amritsar',
        frequency: 'daily',
      },
      affectedPhataks: [],
      lastUpdated: new Date(),
    },
  ];
}
