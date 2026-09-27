import dotenv from "dotenv";
dotenv.config();

/**
 * SERVERLESS ENTRY POINT (only used if the repo is deployed as a single Vercel project;
 * production runs the backend on Render via backend/src/server.js).
 *
 * Data loads from committed JSON at import time and statuses are computed per request,
 * so no init step or background job is needed here.
 */
import app from "../backend/src/app.js";

export default app;
