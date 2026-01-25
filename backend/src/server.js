import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import { startSimulation, seedSampleTrains } from "./services/trainSimulation.service.js";
import { loadPhatakData } from "./services/phatakData.service.js";

/**
 * SERVER INITIALIZATION
 * 
 * Startup sequence:
 * 1. Connect to MongoDB
 * 2. Load pan-India phatak data from JSON files
 * 3. Seed sample trains (for simulation)
 * 4. Start train simulation engine
 */

connectDB();

app.listen(5000, async () => {
  console.log("🚀 Server running on port 5000");
  console.log("=" .repeat(50));
  
  try {
    // Load pan-India phatak data from backend/data/phataks/
    // This replaces seedSamplePhataks() with production-grade data
    const phatakResult = await loadPhatakData();
    
    if (!phatakResult.success) {
      console.warn("⚠️  Phatak data loading failed. Using existing database.");
    }
    
    // Seed sample trains for simulation
    await seedSampleTrains();
    
    // Start real-time train simulation
    startSimulation();
    
    console.log("=" .repeat(50));
    console.log("✅ Phatak Radar backend ready!");
    console.log("📡 API endpoints:");
    console.log("   GET /api/phataks/bbox?bbox=minLat,minLng,maxLat,maxLng");
    console.log("   GET /api/phataks/state/:state");
    console.log("   GET /api/phataks/zone/:zone");
    console.log("   GET /api/phataks/stats");
    console.log("   GET /api/trains");
    console.log("=" .repeat(50));
  } catch (error) {
    console.error("❌ Server initialization error:", error);
  }
});
