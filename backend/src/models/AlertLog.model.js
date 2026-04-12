import mongoose from 'mongoose';

const alertLogSchema = new mongoose.Schema({
  phatakId: { type: String, required: true },
  phatakName: { type: String, required: true },
  trainNumber: { type: String },
  trainName: { type: String },
  alertType: {
    type: String,
    enum: ['APPROACHING', 'CRITICAL', 'ALL_CLEAR'],
    required: true,
  },
  distanceKm: { type: Number },
  etaMinutes: { type: Number },
  speed: { type: Number },
  timestamp: { type: Date, default: Date.now },
});

alertLogSchema.index({ timestamp: -1 });
alertLogSchema.index({ phatakId: 1, timestamp: -1 });

export default mongoose.model('AlertLog', alertLogSchema);
