import Train from "../models/Train.model.js";

// Get all active trains
export const getAllTrains = async (req, res) => {
  try {
    const trains = await Train.find({ isActive: true })
      .select('-route.coordinates -__v')
      .sort({ lastUpdated: -1 });
    res.json(trains);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get trains by bounds (for map viewport)
export const getTrainsByBounds = async (req, res) => {
  try {
    const { neLat, neLng, swLat, swLng } = req.query;

    const trains = await Train.find({
      isActive: true,
      currentPosition: {
        $geoWithin: {
          $box: [
            [Number(swLng), Number(swLat)],
            [Number(neLng), Number(neLat)]
          ]
        }
      }
    });

    res.json(trains);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get train by number
export const getTrainByNumber = async (req, res) => {
  try {
    const train = await Train.findOne({ 
      trainNumber: req.params.trainNumber,
      isActive: true 
    });
    
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    
    res.json(train);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get train route
export const getTrainRoute = async (req, res) => {
  try {
    const train = await Train.findOne({ 
      trainNumber: req.params.trainNumber,
      isActive: true 
    }).select('route trainNumber trainName');
    
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    
    res.json(train);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get statistics
export const getTrainStatistics = async (req, res) => {
  try {
    const total = await Train.countDocuments({ isActive: true });
    const running = await Train.countDocuments({ isActive: true, status: 'RUNNING' });
    const delayed = await Train.countDocuments({ isActive: true, delayMinutes: { $gt: 0 } });
    const heavilyDelayed = await Train.countDocuments({ isActive: true, delayMinutes: { $gte: 15 } });

    res.json({
      total,
      running,
      delayed,
      heavilyDelayed,
      onTime: total - delayed
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
