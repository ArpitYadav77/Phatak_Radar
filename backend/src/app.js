import express from "express";
import cors from "cors";
import phatakRoutes from "./routes/phatak.routes.js";
import trainRoutes from "./routes/train.routes.js";
import alertRoutes from "./routes/alert.routes.js";
import { getPhataks, getAllActiveTrains } from "./services/dataCache.js";
import { getRailRadarStatus } from "./services/railradar.service.js";
import { PHATAKS_CONFIG } from "./services/phatakMonitor.service.js";
import { formatIST } from "./utils/time.js";

const app = express();

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
app.use(express.json());

app.get("/api/health", (_req, res) => {
  const railradar = getRailRadarStatus();
  const phatakIds = new Set(getPhataks().map((p) => p.phatakId));
  PHATAKS_CONFIG.forEach((p) => phatakIds.add(p.phatakId));

  res.json({
    ok: phatakIds.size > 0,
    time_ist: formatIST(),
    trains: getAllActiveTrains().length,
    phataks: phatakIds.size,
    sources: {
      railradar: railradar.status,
      lastFetch: railradar.lastFetch,
      ...(railradar.lastError && { lastError: railradar.lastError }),
    },
    quotaUsedToday: railradar.quotaUsedToday,
  });
});

app.use("/api/phataks", phatakRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api/alerts", alertRoutes);

export default app;
