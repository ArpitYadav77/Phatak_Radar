import mongoose from "mongoose";

const trainSchema = new mongoose.Schema({
  trainNumber: {
    type: String,
    required: true
  },
  trainName: {
    type: String,
    required: true
  },
  currentPosition: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },
  direction: {
    type: Number, // Heading in degrees (0-360)
    default: 0
  },
  speed: {
    type: Number, // km/h
    default: 60
  },
  delayMinutes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["RUNNING", "STOPPED", "APPROACHING_CROSSING"],
    default: "RUNNING"
  },
  route: {
    type: {
      type: String,
      enum: ["LineString"],
      default: "LineString"
    },
    coordinates: {
      type: [[Number]], // Array of [lng, lat] pairs
      default: []
    }
  },
  routeIndex: {
    type: Number, // Current position index in route
    default: 0
  },
  affectedPhataks: [{
    phatakId: String,
    eta: Number, // Minutes until arrival
    distance: Number // Meters
  }],
  // Schedule information
  schedule: {
    departureTime: String, // Format: "HH:MM" (24-hour)
    arrivalTime: String,   // Format: "HH:MM" (24-hour)
    origin: String,
    destination: String,
    frequency: {
      type: String,
      enum: ["daily", "weekdays", "weekends", "specific"],
      default: "daily"
    },
    daysOfWeek: [Number] // 0=Sunday, 6=Saturday
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

trainSchema.index({ currentPosition: "2dsphere" });
trainSchema.index({ trainNumber: 1 });
trainSchema.index({ isActive: 1 });
trainSchema.index({ lastUpdated: -1 });

export default mongoose.model("Train", trainSchema);
