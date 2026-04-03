import dotenv from "dotenv";
import app from "../src/app.js";
import { initializeServer } from "../src/bootstrap.js";

dotenv.config();

// Vercel serverless function entrypoint.
await initializeServer({ startSimulationEngine: false });

export default app;
