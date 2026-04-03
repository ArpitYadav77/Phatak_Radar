import express from "express";
import cors from "cors";
import phatakRoutes from "./routes/phatak.routes.js";
import trainRoutes from "./routes/train.routes.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || "")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
				return callback(null, true);
			}
			return callback(new Error("Origin not allowed by CORS"));
		},
		credentials: true,
	})
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
	res.json({ ok: true, service: "phatak-backend" });
});

app.use("/api/phataks", phatakRoutes);
app.use("/api/trains", trainRoutes);

export default app;
