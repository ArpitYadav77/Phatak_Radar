/**
 * TRAIN SIMULATION SERVICE
 *
 * Moves simulated trains along their routes so the map stays animated
 * even when the RailRadar API is unavailable.
 *
 * Also handles phatak updates for simulated trains (local logic only).
 * Real trains from RailRadar are handled by phatakMonitor.service.js.
 */

import {
  getTrains,
  getPhataks,
  updateTrain,
  updatePhatak,
} from './dataCache.js';

// ─── Configuration ────────────────────────────────────────────────────────────
const SIMULATION_TICK_MS = 8000; // Update every 8 seconds
const PHATAK_CLOSURE_DISTANCE_KM = 5; // Close when train within 5 km
const PHATAK_OPEN_DISTANCE_KM = 0.5; // Re-open after train passes 500 m

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Haversine distance in km */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Bearing in degrees */
function calculateBearing(lat1, lon1, lat2, lon2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Move a point `distKm` km in the given `bearing` direction */
function movePoint(lat, lon, bearing, distKm) {
  const R = 6371;
  const δ = distKm / R;
  const θ = (bearing * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lon * Math.PI) / 180;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) +
      Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );

  return {
    lat: (φ2 * 180) / Math.PI,
    lng: ((λ2 * 180) / Math.PI + 540) % 360 - 180, // normalise
  };
}

/**
 * Determine if a train should be active now based on its schedule.
 * If no schedule, always active.
 */
function shouldTrainBeActive(train) {
  if (!train.schedule?.departureTime || !train.schedule?.arrivalTime) {
    return true;
  }

  const now = new Date();
  const [depH, depM] = train.schedule.departureTime.split(':').map(Number);
  const [arrH, arrM] = train.schedule.arrivalTime.split(':').map(Number);

  const depMins = depH * 60 + depM;
  const arrMins = arrH * 60 + arrM;
  const nowMins = now.getHours() * 60 + now.getMinutes();

  // Handle overnight trains (arrMins < depMins)
  if (arrMins < depMins) {
    // Active from departure until midnight, OR from midnight until arrival
    return nowMins >= depMins || nowMins <= arrMins;
  }
  return nowMins >= depMins && nowMins <= arrMins;
}

/**
 * Returns a 0–1 value representing how far through the route the train is
 * based on its scheduled departure and arrival times.
 */
function calculateScheduleProgress(train) {
  if (!train.schedule?.departureTime || !train.schedule?.arrivalTime) {
    return 0.5; // default midpoint
  }

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const [depH, depM] = train.schedule.departureTime.split(':').map(Number);
  const [arrH, arrM] = train.schedule.arrivalTime.split(':').map(Number);

  let depMins = depH * 60 + depM;
  let arrMins = arrH * 60 + arrM;

  // Handle overnight
  if (arrMins < depMins) arrMins += 24 * 60;
  let currentMins = nowMins;
  if (currentMins < depMins) currentMins += 24 * 60;

  const totalDuration = arrMins - depMins;
  if (totalDuration <= 0) return 0;

  const elapsed = currentMins - depMins;
  return Math.max(0, Math.min(1, elapsed / totalDuration));
}

// ─── Simulation tick ───────────────────────────────────────────────────────────
async function simulationTick() {
  try {
    const trains = getTrains();
    const phataks = getPhataks();

    for (const train of trains) {
      if (!train.route?.coordinates || train.route.coordinates.length < 2) continue;

      // Check schedule
      const shouldBeActive = shouldTrainBeActive(train);
      if (!shouldBeActive) {
        if (train.isActive) {
          updateTrain(train.trainNumber, {
            isActive: false,
            status: 'STOPPED',
          });
        }
        continue;
      } else if (!train.isActive) {
        updateTrain(train.trainNumber, {
          isActive: true,
          status: 'RUNNING',
          routeIndex: 0,
          currentPosition: {
            type: 'Point',
            coordinates: train.route.coordinates[0],
          },
        });
      }

      // Advance route index based on schedule progress
      const progress = calculateScheduleProgress(train);
      const coords = train.route.coordinates;
      const targetIndex = Math.min(
        Math.floor(progress * (coords.length - 1)),
        coords.length - 1
      );

      const updateData = { lastUpdated: new Date() };

      // Update route index if needed
      if (targetIndex !== (train.routeIndex || 0) && coords.length > targetIndex) {
        updateData.routeIndex = targetIndex;
        updateData.currentPosition = {
          type: 'Point',
          coordinates: coords[targetIndex],
        };
      }

      // Smooth movement: move train toward next waypoint
      if (coords.length > 1) {
        const currentIdx = updateData.routeIndex ?? train.routeIndex ?? 0;
        const nextIdx = Math.min(currentIdx + 1, coords.length - 1);
        const [curLng, curLat] = coords[currentIdx];
        const [nxtLng, nxtLat] = coords[nextIdx];

        const bearing = calculateBearing(curLat, curLng, nxtLat, nxtLng);
        const speedKmh = train.speed || 60;
        const distPerTick = (speedKmh / 3600) * (SIMULATION_TICK_MS / 1000);
        const newPos = movePoint(curLat, curLng, bearing, distPerTick);

        const distToNext = calculateDistance(
          newPos.lat,
          newPos.lng,
          nxtLat,
          nxtLng
        );

        if (distToNext < 0.1 && nextIdx < coords.length - 1) {
          // Arrived at waypoint — advance
          updateData.routeIndex = nextIdx;
          updateData.currentPosition = {
            type: 'Point',
            coordinates: [nxtLng, nxtLat],
          };
        } else if (nextIdx < coords.length - 1) {
          updateData.currentPosition = {
            type: 'Point',
            coordinates: [newPos.lng, newPos.lat],
          };
        }
        updateData.direction = bearing;
      }

      // Update affected phataks
      const affectedPhataks = [];
      const coord = (
        updateData.currentPosition || train.currentPosition
      ).coordinates;
      const [trainLng, trainLat] = coord;

      for (const phatak of phataks) {
        if (!phatak.location?.coordinates) continue;
        const [pLng, pLat] = phatak.location.coordinates;
        const dist = calculateDistance(trainLat, trainLng, pLat, pLng);
        const distMeters = dist * 1000;

        if (dist < PHATAK_CLOSURE_DISTANCE_KM) {
          const eta = Math.round((dist / (train.speed || 60)) * 60);
          affectedPhataks.push({
            phatakId: phatak.phatakId,
            eta,
            distance: Math.round(distMeters),
          });

          // Update phatak status
          if (dist > PHATAK_OPEN_DISTANCE_KM) {
            updatePhatak(phatak.phatakId, {
              status: 'CLOSED',
              trainInfo: `${train.trainName} (${train.trainNumber}) approaching`,
              trainName: train.trainName,
              eta,
              reason: `Train arriving in ${eta} minutes`,
            });
          } else if (phatak.status === 'CLOSED') {
            updatePhatak(phatak.phatakId, {
              status: 'OPEN',
              trainInfo: null,
              trainName: null,
              eta: null,
              reason: 'Train passed, gates reopened',
            });
          }
        }
      }

      updateData.affectedPhataks = affectedPhataks;

      // Random minor delay variation
      if (Math.random() < 0.05) {
        updateData.delayMinutes =
          (train.delayMinutes || 0) + Math.floor(Math.random() * 3);
      }

      updateTrain(train.trainNumber, updateData);
    }
  } catch (error) {
    console.error('Simulation tick error:', error.message);
  }
}

// ─── Exports ───────────────────────────────────────────────────────────────────
let simulationInterval = null;

export function startSimulation() {
  if (simulationInterval) {
    console.log('Simulation already running');
    return;
  }
  console.log('🚂 Starting train simulation engine...');
  simulationTick(); // immediate first tick
  simulationInterval = setInterval(simulationTick, SIMULATION_TICK_MS);
}

export function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('Simulation stopped');
  }
}

// Legacy exports (kept for bootstrap.js compatibility)
export async function seedSampleTrains() {
  console.log('ℹ️  Trains are seeded via dataCache.js initializeMemoryStore()');
}
export async function seedSamplePhataks() {
  console.log('ℹ️  Phataks are seeded via dataCache.js initializeMemoryStore()');
}
