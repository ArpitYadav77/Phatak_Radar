import dotenv from "dotenv";
import app from "../backend/src/app.js";
import { initializeServer } from "../backend/src/bootstrap.js";

dotenv.config();

// Pre-initialize server-side logic (caching, DB connection) for this serverless instance
// startSimulationEngine is disabled as it's not suitable for serverless functions
await initializeServer({ startSimulationEngine: false });

export default app;
