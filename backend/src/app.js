import express from "express";
import cors from "cors";
import phatakRoutes from "./routes/phatak.routes.js";
import trainRoutes from "./routes/train.routes.js";
import alertRoutes from "./routes/alert.routes.js";

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
  res.json({ ok: true, service: "phatak-backend", ts: new Date().toISOString() });
});

app.use("/api/phataks", phatakRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api/alerts", alertRoutes);

export default app;
