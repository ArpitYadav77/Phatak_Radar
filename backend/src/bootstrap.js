import connectDB from "./config/db.js";
import { startSimulation, seedSampleTrains } from "./services/trainSimulation.service.js";
import { loadPhatakData } from "./services/phatakData.service.js";

let initialized = false;

export async function initializeServer({ startSimulationEngine = true } = {}) {
  if (initialized) {
    return;
  }

  await connectDB();

  try {
    // Load pan-India phatak data from backend/data/phataks/
    const phatakResult = await loadPhatakData();

    if (!phatakResult.success) {
      console.warn("⚠️  Phatak data loading failed. Using existing database.");
    }

    // Seed sample trains for simulation
    await seedSampleTrains();

    if (startSimulationEngine) {
      // Simulation uses a long-running interval and should only run locally.
      startSimulation();
    }

    initialized = true;

    console.log("=".repeat(50));
    console.log("✅ Phatak Radar backend ready!");
    console.log("📡 API endpoints:");
    console.log("   GET /api/health");
    console.log("   GET /api/phataks/bbox?bbox=minLat,minLng,maxLat,maxLng");
    console.log("   GET /api/phataks/state/:state");
    console.log("   GET /api/phataks/zone/:zone");
    console.log("   GET /api/phataks/stats");
    console.log("   GET /api/trains");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Server initialization error:", error);
    throw error;
  }
}
