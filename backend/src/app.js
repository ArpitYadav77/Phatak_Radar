import express from "express";
import cors from "cors";
import crossingRoutes from "./routes/crossing.routes.js";
import trainRoutes from "./routes/train.routes.js";
import { crossingsMeta } from "./services/crossings.service.js";
import { anchorTimetable } from "./services/timetable.service.js";
import { railRadarStatus } from "./services/railradar.service.js";
import { storeBackend } from "./services/store.js";
import { formatIST } from "./utils/time.js";

const app = express();

// Render / Vercel sit behind a proxy: trust it so req.ip is the client (used for report rate limits).
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  process.env.CLIENT_ORIGIN,
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", async (_req, res) => {
  const railradar = await railRadarStatus();
  res.json({
    ok: crossingsMeta.total > 0,
    time_ist: formatIST(),
    crossings: crossingsMeta.total,
    curatedCrossings: crossingsMeta.curated,
    osmDataGeneratedAt: crossingsMeta.osmGeneratedAt,
    timetableTrains: anchorTimetable().trains.length,
    store: storeBackend(),
    sources: {
      railradar: railradar.status,
      lastFetch: railradar.lastFetch,
      ...(railradar.lastError && { lastError: railradar.lastError }),
    },
    quotaUsedToday: railradar.quotaUsedToday,
    dailyCap: railradar.dailyCap,
  });
});

app.use("/api/phataks", crossingRoutes);
app.use("/api/trains", trainRoutes);

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

export default app;
