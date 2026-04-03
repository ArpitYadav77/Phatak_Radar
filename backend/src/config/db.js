import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MongoDB URI is missing. Set MONGO_URI or MONGODB_URI.");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:");
    console.error(err.message);
    if (process.env.NODE_ENV === "production" && !process.env.MONGO_URI) {
      console.warn("⚠️  Are you missing MONGO_URI in your Vercel environment variables?");
    }
    process.exit(1);
  }
};

export default connectDB;
