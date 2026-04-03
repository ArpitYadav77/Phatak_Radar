import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { initializeServer } from "./bootstrap.js";

/**
 * SERVER INITIALIZATION
 * 
 * Startup sequence:
 * 1. Connect to MongoDB
 * 2. Load pan-India phatak data from JSON files
 * 3. Seed sample trains (for simulation)
 * 4. Start train simulation engine
 */

export async function startServer() {
  const PORT = process.env.PORT || 5000;
  await initializeServer({ startSimulationEngine: true });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}
