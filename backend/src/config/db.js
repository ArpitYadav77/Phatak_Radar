import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MongoDB URI is missing. Set MONGO_URI or MONGODB_URI.");
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log("✅ MongoDB Connected successfully");
};

export default connectDB;
