import express from "express";
import cors from "cors";
import phatakRoutes from "./routes/phatak.routes.js";
import trainRoutes from "./routes/train.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/phataks", phatakRoutes);
app.use("/api/trains", trainRoutes);

export default app;
