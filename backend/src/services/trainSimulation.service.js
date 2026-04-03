import Train from "../models/Train.model.js";
import Phatak from "../models/Phatak.model.js";
import { request } from 'undici';

// API call to RailRadar (wrapped in try-catch to prevent startup failure)
let railRadarInfo = null;
try {
  const { statusCode, body } = await request('https://railradar.in/docs');
  if (statusCode === 200) {
    railRadarInfo = await body.json();
  }
} catch (err) {
  console.warn("⚠️ Could not connect to RailRadar API, simulation will use local logic only.");
}

// Configuration
const SIMULATION_TICK_MS = 5000; // Update every 5 seconds
const TRAIN_SPEED_KMH = 60; // Average speed
const PHATAK_CLOSURE_DISTANCE_KM = 2; // Close phatak when train is within 2km
const PHATAK_OPEN_DISTANCE_KM = 0.5; // Open after train passes by 500m

// Helper: Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Helper: Calculate bearing between two points
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const bearing = Math.atan2(y, x);
  return (bearing * 180 / Math.PI + 360) % 360;
}

// Helper: Move point along bearing
function movePoint(lat, lon, bearing, distanceKm) {
  const R = 6371;
  const d = distanceKm / R;
  const brng = toRad(bearing);
  const lat1 = toRad(lat);
  const lon1 = toRad(lon);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );

  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    lat: lat2 * 180 / Math.PI,
    lng: lon2 * 180 / Math.PI
  };
}

// Helper: Check if train should be active based on schedule
function shouldTrainBeActive(train) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currentDay = now.getDay(); // 0 = Sunday
  
  if (!train.schedule) return true; // No schedule = always active
  
  // Check day of week
  if (train.schedule.frequency === 'weekdays' && (currentDay === 0 || currentDay === 6)) {
    return false;
  }
  if (train.schedule.frequency === 'weekends' && currentDay !== 0 && currentDay !== 6) {
    return false;
  }
  if (train.schedule.daysOfWeek && !train.schedule.daysOfWeek.includes(currentDay)) {
    return false;
  }
  
  // Check if within scheduled time window
  const dept = train.schedule.departureTime || "00:00";
  const arr = train.schedule.arrivalTime || "23:59";
  
  // Handle overnight trains (arrival time < departure time)
  if (arr < dept) {
    return currentTime >= dept || currentTime <= arr;
  } else {
    return currentTime >= dept && currentTime <= arr;
  }
}

// Helper: Calculate progress percentage based on schedule
function calculateScheduleProgress(train) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  if (!train.schedule || !train.schedule.departureTime || !train.schedule.arrivalTime) {
    return train.routeIndex / Math.max(1, train.route.coordinates.length - 1);
  }
  
  const dept = train.schedule.departureTime.split(':');
  const arr = train.schedule.arrivalTime.split(':');
  const curr = currentTime.split(':');
  
  const deptMinutes = parseInt(dept[0]) * 60 + parseInt(dept[1]);
  let arrMinutes = parseInt(arr[0]) * 60 + parseInt(arr[1]);
  const currMinutes = parseInt(curr[0]) * 60 + parseInt(curr[1]);
  
  // Handle overnight trains
  if (arrMinutes < deptMinutes) {
    arrMinutes += 24 * 60; // Add 24 hours
  }
  
  let adjustedCurr = currMinutes;
  if (currMinutes < deptMinutes && arrMinutes > 24 * 60) {
    adjustedCurr += 24 * 60;
  }
  
  const totalDuration = arrMinutes - deptMinutes;
  const elapsed = adjustedCurr - deptMinutes;
  
  return Math.max(0, Math.min(1, elapsed / totalDuration));
}

// Main simulation tick
async function simulationTick() {
  try {
    const trains = await Train.find({});
    const phataks = await Phatak.find({});

    for (const train of trains) {
      // Check if train should be active based on schedule
      const shouldBeActive = shouldTrainBeActive(train);
      
      if (!shouldBeActive) {
        if (train.isActive) {
          train.isActive = false;
          train.status = "STOPPED";
          await train.save();
        }
        continue;
      } else {
        if (!train.isActive) {
          train.isActive = true;
          train.status = "RUNNING";
          // Reset to start of route
          train.routeIndex = 0;
          if (train.route.coordinates.length > 0) {
            train.currentPosition.coordinates = train.route.coordinates[0];
          }
        }
      }
      
      // Calculate position based on schedule
      const progress = calculateScheduleProgress(train);
      const targetIndex = Math.floor(progress * (train.route.coordinates.length - 1));
      
      // Update route index to match schedule
      if (targetIndex !== train.routeIndex && train.route.coordinates.length > targetIndex) {
        train.routeIndex = targetIndex;
        train.currentPosition.coordinates = train.route.coordinates[targetIndex];
      }
      
      // Move train along route
      if (train.route.coordinates.length > 1) {
        const nextIndex = Math.min(train.routeIndex + 1, train.route.coordinates.length - 1);
        const currentPos = train.route.coordinates[train.routeIndex];
        const nextPos = train.route.coordinates[nextIndex];

        const [currentLng, currentLat] = currentPos;
        const [nextLng, nextLat] = nextPos;

        // Calculate new position
        const bearing = calculateBearing(currentLat, currentLng, nextLat, nextLng);
        const distancePerTick = (train.speed / 3600) * (SIMULATION_TICK_MS / 1000); // km
        const newPos = movePoint(currentLat, currentLng, bearing, distancePerTick);

        // Check if reached next waypoint
        const distToNext = calculateDistance(newPos.lat, newPos.lng, nextLat, nextLng);
        if (distToNext < 0.1 && nextIndex < train.route.coordinates.length - 1) { // Within 100m
          train.routeIndex = nextIndex;
          train.currentPosition.coordinates = [nextLng, nextLat];
        } else if (nextIndex < train.route.coordinates.length - 1) {
          train.currentPosition.coordinates = [newPos.lng, newPos.lat];
        }

        train.direction = bearing;
      }

      // Calculate ETAs to all phataks
      train.affectedPhataks = [];
      const [trainLng, trainLat] = train.currentPosition.coordinates;

      for (const phatak of phataks) {
        const [phatakLng, phatakLat] = phatak.location.coordinates;
        const distance = calculateDistance(trainLat, trainLng, phatakLat, phatakLng);
        const distanceMeters = distance * 1000;

        if (distance < PHATAK_CLOSURE_DISTANCE_KM) {
          const eta = (distance / train.speed) * 60; // minutes
          train.affectedPhataks.push({
            phatakId: phatak.phatakId || phatak._id.toString(),
            eta: Math.round(eta),
            distance: Math.round(distanceMeters)
          });

          // Update phatak status
          if (distance < PHATAK_CLOSURE_DISTANCE_KM && distance > PHATAK_OPEN_DISTANCE_KM) {
            phatak.status = "CLOSED";
            phatak.trainInfo = `${train.trainName} (${train.trainNumber}) approaching`;
            phatak.trainName = train.trainName;
            phatak.eta = Math.round(eta);
            phatak.reason = `Train arriving in ${Math.round(eta)} minutes`;
            phatak.lastUpdated = new Date();
            
            // Add event
            phatak.events.push({
              type: 'train_approaching',
              description: `${train.trainName} approaching, ETA ${Math.round(eta)} minutes`,
              timestamp: new Date()
            });
            
            await phatak.save();
          } else if (distance <= PHATAK_OPEN_DISTANCE_KM) {
            // Train has passed
            if (phatak.status === "CLOSED") {
              phatak.status = "OPEN";
              phatak.trainInfo = null;
              phatak.trainName = null;
              phatak.eta = null;
              phatak.reason = "Train passed, gates reopened";
              phatak.lastUpdated = new Date();
              
              phatak.events.push({
                type: 'gate_opened',
                description: `${train.trainName} passed, gates reopened for traffic`,
                timestamp: new Date()
              });
              
              await phatak.save();
            }
          }
        }
      }

      // Simulate random delays
      if (Math.random() < 0.05) { // 5% chance per tick
        train.delayMinutes += Math.floor(Math.random() * 5);
      }

      train.lastUpdated = new Date();
      await train.save();
    }

    console.log(`✓ Simulation tick completed - ${trains.length} trains updated`);
  } catch (error) {
    console.error('Simulation tick error:', error);
  }
}

// Initialize simulation
let simulationInterval = null;

export function startSimulation() {
  if (simulationInterval) {
    console.log('Simulation already running');
    return;
  }

  console.log('🚂 Starting train simulation engine...');
  simulationInterval = setInterval(simulationTick, SIMULATION_TICK_MS);
  simulationTick(); // Run immediately
}

export function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('Simulation stopped');
  }
}

// Seed sample phataks (railway crossings)
export async function seedSamplePhataks() {
  try {
    const existingPhataks = await Phatak.countDocuments();
    if (existingPhataks > 0) {
      console.log('Phataks already seeded');
      return;
    }

    const samplePhataks = [
      {
        name: "Sadar Bazar Crossing",
        phatakId: "PH001",
        location: {
          type: "Point",
          coordinates: [77.2167, 28.6500]
        },
        status: "OPEN"
      },
      {
        name: "Kashmere Gate Crossing",
        phatakId: "PH002",
        location: {
          type: "Point",
          coordinates: [77.2273, 28.6667]
        },
        status: "OPEN"
      },
      {
        name: "Old Delhi Railway Crossing",
        phatakId: "PH003",
        location: {
          type: "Point",
          coordinates: [77.2167, 28.6400]
        },
        status: "OPEN"
      },
      {
        name: "Shahdara Crossing",
        phatakId: "PH004",
        location: {
          type: "Point",
          coordinates: [77.2833, 28.6833]
        },
        status: "OPEN"
      },
      {
        name: "Tilak Bridge Crossing",
        phatakId: "PH005",
        location: {
          type: "Point",
          coordinates: [77.2500, 28.5833]
        },
        status: "OPEN"
      },
      {
        name: "Nizamuddin Crossing",
        phatakId: "PH006",
        location: {
          type: "Point",
          coordinates: [77.2500, 28.5667]
        },
        status: "OPEN"
      },
      {
        name: "Okhla Crossing",
        phatakId: "PH007",
        location: {
          type: "Point",
          coordinates: [77.2833, 28.5333]
        },
        status: "OPEN"
      },
      {
        name: "Patel Nagar Crossing",
        phatakId: "PH008",
        location: {
          type: "Point",
          coordinates: [77.1667, 28.6500]
        },
        status: "OPEN"
      },
      {
        name: "Rajendra Place Crossing",
        phatakId: "PH009",
        location: {
          type: "Point",
          coordinates: [77.1667, 28.6333]
        },
        status: "OPEN"
      },
      {
        name: "Naraina Crossing",
        phatakId: "PH010",
        location: {
          type: "Point",
          coordinates: [77.1333, 28.6167]
        },
        status: "OPEN"
      }
    ];

    await Phatak.insertMany(samplePhataks);
    console.log('✓ Seeded 10 sample phataks');
  } catch (error) {
    console.error('Error seeding phataks:', error);
  }
}

// Seed sample trains
export async function seedSampleTrains() {
  try {
    const existingTrains = await Train.countDocuments();
    if (existingTrains > 0) {
      console.log('Trains already seeded');
      return;
    }

    // Define sample routes around Delhi and Punjab with realistic schedules
    const sampleTrains = [
      {
        trainNumber: "12469",
        trainName: "Delhi-Ludhiana Express",
        currentPosition: {
          type: "Point",
          coordinates: [77.2090, 28.6139]
        },
        direction: 315,
        speed: 65,
        delayMinutes: 0,
        route: {
          type: "LineString",
          coordinates: [
            [77.2090, 28.6139], // Delhi
            [77.2500, 28.6800],
            [77.3000, 28.7500],
            [77.3500, 28.8200],
            [76.8573, 30.9010], // Ludhiana
          ]
        },
        schedule: {
          departureTime: "06:00",
          arrivalTime: "12:00",
          origin: "New Delhi",
          destination: "Ludhiana",
          frequency: "daily"
        },
        isActive: true
      },
      {
        trainNumber: "12001",
        trainName: "Shatabdi Express",
        currentPosition: {
          type: "Point",
          coordinates: [77.1000, 28.5500]
        },
        direction: 90,
        speed: 80,
        delayMinutes: 5,
        route: {
          type: "LineString",
          coordinates: [
            [77.1000, 28.5500],
            [77.2090, 28.6139],
            [77.3500, 28.6500],
            [77.5000, 28.7000],
            [78.0000, 29.0000],
          ]
        },
        schedule: {
          departureTime: "07:15",
          arrivalTime: "13:30",
          origin: "New Delhi",
          destination: "Amritsar",
          frequency: "daily"
        },
        isActive: true
      },
      {
        trainNumber: "12003",
        trainName: "Rajdhani Express",
        currentPosition: {
          type: "Point",
          coordinates: [77.3000, 28.5000]
        },
        direction: 180,
        speed: 90,
        delayMinutes: 15,
        route: {
          type: "LineString",
          coordinates: [
            [77.3000, 28.5000],
            [77.2500, 28.4000],
            [77.2000, 28.3000],
            [77.1500, 28.2000],
            [77.1000, 28.1000],
          ]
        },
        schedule: {
          departureTime: "16:55",
          arrivalTime: "09:10",
          origin: "New Delhi",
          destination: "Mumbai",
          frequency: "daily"
        },
        isActive: true
      },
      {
        trainNumber: "12013",
        trainName: "Amritsar Shatabdi",
        currentPosition: {
          type: "Point",
          coordinates: [75.8573, 30.9010]
        },
        direction: 315,
        speed: 85,
        delayMinutes: 0,
        route: {
          type: "LineString",
          coordinates: [
            [75.8573, 30.9010], // Ludhiana
            [75.5762, 31.3260], // Jalandhar
            [74.8723, 31.6340], // Amritsar
          ]
        },
        schedule: {
          departureTime: "08:30",
          arrivalTime: "10:45",
          origin: "Ludhiana",
          destination: "Amritsar",
          frequency: "weekdays",
          daysOfWeek: [1, 2, 3, 4, 5]
        },
        isActive: true
      },
      {
        trainNumber: "12037",
        trainName: "Punjab Mail",
        currentPosition: {
          type: "Point",
          coordinates: [76.3869, 30.3398]
        },
        direction: 225,
        speed: 70,
        delayMinutes: 10,
        route: {
          type: "LineString",
          coordinates: [
            [76.3869, 30.3398], // Patiala
            [75.8573, 30.9010], // Ludhiana
            [75.5762, 31.3260], // Jalandhar
            [74.8723, 31.6340], // Amritsar
          ]
        },
        schedule: {
          departureTime: "22:10",
          arrivalTime: "06:25",
          origin: "Mumbai Central",
          destination: "Firozpur",
          frequency: "daily"
        },
        isActive: true
      },
      {
        trainNumber: "12053",
        trainName: "Jalandhar-Pathankot Passenger",
        currentPosition: {
          type: "Point",
          coordinates: [75.5762, 31.3260]
        },
        direction: 0,
        speed: 55,
        delayMinutes: 3,
        route: {
          type: "LineString",
          coordinates: [
            [75.5762, 31.3260], // Jalandhar
            [75.9100, 31.5333], // Hoshiarpur
            [75.6520, 32.2646], // Pathankot
          ]
        },
        schedule: {
          departureTime: "05:45",
          arrivalTime: "09:20",
          origin: "Jalandhar",
          destination: "Pathankot",
          frequency: "daily"
        },
        isActive: true
      },
      {
        trainNumber: "12715",
        trainName: "Sachkhand Express",
        currentPosition: {
          type: "Point",
          coordinates: [74.8723, 31.6340]
        },
        direction: 135,
        speed: 75,
        delayMinutes: 0,
        route: {
          type: "LineString",
          coordinates: [
            [74.8723, 31.6340], // Amritsar
            [75.5762, 31.3260], // Jalandhar
            [75.8573, 30.9010], // Ludhiana
            [76.3869, 30.3398], // Patiala
            [77.2090, 28.6139], // Delhi
          ]
        },
        schedule: {
          departureTime: "23:00",
          arrivalTime: "08:30",
          origin: "Amritsar",
          destination: "Nanded",
          frequency: "daily"
        },
        isActive: true
      },
      {
        trainNumber: "12481",
        trainName: "Jodhpur-Jammu Express",
        currentPosition: {
          type: "Point",
          coordinates: [75.6520, 32.2646]
        },
        direction: 270,
        speed: 60,
        delayMinutes: 20,
        route: {
          type: "LineString",
          coordinates: [
            [75.6520, 32.2646], // Pathankot
            [75.5762, 31.3260], // Jalandhar
            [75.8573, 30.9010], // Ludhiana
            [74.9455, 30.2110], // Bathinda
          ]
        },
        schedule: {
          departureTime: "14:20",
          arrivalTime: "08:15",
          origin: "Jodhpur",
          destination: "Jammu Tawi",
          frequency: "weekends",
          daysOfWeek: [0, 6]
        },
        isActive: true
      },
      {
        trainNumber: "12487",
        trainName: "Bathinda-Delhi Express",
        currentPosition: {
          type: "Point",
          coordinates: [74.9455, 30.2110]
        },
        direction: 90,
        speed: 68,
        delayMinutes: 7,
        route: {
          type: "LineString",
          coordinates: [
            [74.9455, 30.2110], // Bathinda
            [75.1705, 30.8080], // Moga
            [75.8573, 30.9010], // Ludhiana
            [76.3869, 30.3398], // Patiala
            [77.2090, 28.6139], // Delhi
          ]
        },
        schedule: {
          departureTime: "20:45",
          arrivalTime: "05:30",
          origin: "Bathinda",
          destination: "New Delhi",
          frequency: "daily"
        },
        isActive: true
      },
      {
        trainNumber: "14631",
        trainName: "Firozepur-Delhi Express",
        currentPosition: {
          type: "Point",
          coordinates: [74.6142, 30.9257]
        },
        direction: 45,
        speed: 62,
        delayMinutes: 12,
        route: {
          type: "LineString",
          coordinates: [
            [74.6142, 30.9257], // Firozpur
            [75.1705, 30.8080], // Moga
            [75.8573, 30.9010], // Ludhiana
            [77.2090, 28.6139], // Delhi
          ]
        },
        schedule: {
          departureTime: "19:30",
          arrivalTime: "06:45",
          origin: "Firozepur",
          destination: "Old Delhi",
          frequency: "daily"
        },
        isActive: true
      },
      {
        trainNumber: "12497",
        trainName: "Amritsar-Delhi Shan-e-Punjab",
        currentPosition: {
          type: "Point",
          coordinates: [74.8723, 31.6340]
        },
        direction: 120,
        speed: 82,
        delayMinutes: 0,
        route: {
          type: "LineString",
          coordinates: [
            [74.8723, 31.6340], // Amritsar
            [75.5762, 31.3260], // Jalandhar
            [75.8573, 30.9010], // Ludhiana
            [76.7794, 30.7333], // Ambala
            [77.2090, 28.6139], // Delhi
          ]
        },
        schedule: {
          departureTime: "16:30",
          arrivalTime: "23:30",
          origin: "Amritsar",
          destination: "New Delhi",
          frequency: "daily"
        },
        isActive: true
      },
      {
        trainNumber: "18238",
        trainName: "Chhatisgarh Express",
        currentPosition: {
          type: "Point",
          coordinates: [77.2090, 28.6139]
        },
        direction: 225,
        speed: 73,
        delayMinutes: 25,
        route: {
          type: "LineString",
          coordinates: [
            [77.2090, 28.6139], // Delhi
            [76.3869, 30.3398], // Patiala
            [75.8415, 30.2451], // Sangrur
            [74.9455, 30.2110], // Bathinda
          ]
        },
        schedule: {
          departureTime: "18:10",
          arrivalTime: "09:35",
          origin: "Amritsar",
          destination: "Bilaspur",
          frequency: "daily"
        },
        isActive: true
      }
    ];

    await Train.insertMany(sampleTrains);
    console.log(`✓ Seeded ${sampleTrains.length} sample trains with schedules`);
  } catch (error) {
    console.error('Error seeding trains:', error);
  }
}
