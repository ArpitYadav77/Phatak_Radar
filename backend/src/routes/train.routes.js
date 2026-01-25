import express from "express";
import {
  getAllTrains,
  getTrainsByBounds,
  getTrainByNumber,
  getTrainRoute,
  getTrainStatistics
} from "../controllers/train.controller.js";

const router = express.Router();

router.get("/", getAllTrains);
router.get("/bounds", getTrainsByBounds);
router.get("/statistics", getTrainStatistics);
router.get("/:trainNumber", getTrainByNumber);
router.get("/:trainNumber/route", getTrainRoute);

export default router;
