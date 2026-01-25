import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/phatak_radar';

async function resetTrains() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Drop the trains collection
    const db = mongoose.connection.db;
    await db.collection('trains').drop();
    console.log('✓ Trains collection dropped');
    
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    console.log('\nNow restart the backend server to reseed all 12 trains!');
  } catch (error) {
    if (error.message === 'ns not found') {
      console.log('Trains collection does not exist - that\'s fine!');
    } else {
      console.error('Error:', error);
    }
    process.exit(1);
  }
}

resetTrains();
