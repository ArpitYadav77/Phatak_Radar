import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

/**
 * SERVER
 *
 * All data (crossings, timetables, track geometry) is loaded from committed JSON at import
 * time and every status is computed from the current IST time on request — there are no
 * background jobs, so the first request after a cold start is already correct.
 * MongoDB (optional) only persists user reports, overrides and the RailRadar budget/cache.
 */

async function connectMongo() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️ MONGO_URI not set — reports and API budget are kept in memory only.");
    return;
  }
  try {
    const { default: mongoose } = await import("mongoose");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed — falling back to memory:", err.message);
  }
}

export function startServer() {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Phatak Radar API on port ${PORT}`));
  connectMongo();
  if (!process.env.RAILRADAR_API_KEY) {
    console.warn("⚠️ RAILRADAR_API_KEY not set — live delays and non-Patiala timetables are disabled.");
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}
