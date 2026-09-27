import dotenv from "dotenv";
dotenv.config();

import app from "../backend/src/app.js";
import { initializeMemoryStore } from "../backend/src/services/dataCache.js";

/**
 * SERVERLESS ENTRY POINT
 *
 * For Vercel serverless functions, we MUST NOT:
 *  - Run top-level await on slow external APIs (RailRadar, MongoDB)
 *  - Use setInterval (functions are stateless, not long-lived)
 *  - Call process.exit() anywhere
 *
 * Strategy: lazy init — initialize the fast in-memory store on the
 * first request, then serve all subsequent requests instantly from memory.
 * MongoDB and RailRadar polling are best-effort and non-blocking.
 */

let memoryReady = false;
let memoryInitPromise = null;

function ensureMemoryStore() {
  if (!memoryInitPromise) {
    memoryInitPromise = initializeMemoryStore()
      .then(() => {
        memoryReady = true;
        // Fire-and-forget: try MongoDB + RailRadar in background (non-blocking)
        import("../backend/src/bootstrap.js")
          .then(({ initializeServer }) =>
            initializeServer({ startSimulationEngine: false, serverless: true })
          )
          .catch((err) =>
            console.warn("⚠️ Background server init failed:", err.message)
          );
      })
      .catch((err) => {
        console.error("❌ Memory store init failed:", err.message);
        memoryInitPromise = null; // allow retry
      });
  }
  return memoryInitPromise;
}

// Init-aware handler: the memory store is loaded BEFORE Express sees the
// request, so routers mounted in app.js never run against an empty store.
export default async function handler(req, res) {
  if (!memoryReady) await ensureMemoryStore();
  return app(req, res);
}
