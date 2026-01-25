# 🚂 Phatak Radar - Railway Level Crossing Monitor

A real-time railway level-crossing monitoring system with live train visualization, backend-driven simulation, and comprehensive safety awareness features.

## 🎯 Features

### Live Train Visualization

- **Real-time Train Tracking**: Directional arrow markers showing live train positions
- **Delay-Based Color Coding**:
  - 🟢 Green - On time
  - 🔵 Blue - Slight delay (<10 min)
  - 🟠 Orange - Moderate delay (10-20 min)
  - 🔴 Red - Heavy delay (>20 min)
- **Interactive Train Markers**: Click to view details, speed, delay, and affected crossings
- **Route Visualization**: View train routes on demand when selecting a train

### Railway Crossing Management

- **Pan-India Phatak Data**: 145+ level crossings across 8 states with realistic coordinates
- **Real-Time Status Monitoring**: Open, Closed, Unknown states
- **Train-Phatak Integration**: Automatic closure when trains approach within 2km
- **ETA Calculations**: Display time until train arrival at each crossing
- **State-wise & Zone-wise Filtering**: Browse phataks by state or railway zone
- **Event Tracking**: Complete history of gate operations and train interactions

### Live Updates Feed

- **Combined Event Stream**: Unified view of phatak and train events
- **Event Types**:
  - 🚂 Gate Closed
  - ✅ Gate Opened
  - ⏱️ Delay Updated
  - 🚂 Train Approaching
  - ⚠️ Status Unknown
- **Time-Stamped Events**: "just now" to relative time display
- **Category Badges**: Visual distinction between train and crossing events

### Status Overview Panel

- **Phatak Statistics**:
  - Total crossings in view
  - Open/Closed/Unknown counts
  - Visual indicators with icons
- **Train Statistics**:
  - Active trains count
  - On-time vs delayed trains
  - Affected crossings count
- **Animated Indicators**: Pulse animation for critical states

### Backend-Driven Simulation

- **5-Second Tick Engine**: All movement and state updates handled server-side
- **Haversine Distance Calculations**: Accurate geographic computations
- **Automatic Delay Simulation**: Random delays to simulate real-world scenarios
- **Train-Phatak Relationship Logic**: Automatic status updates based on proximity

## 🏗️ Architecture

### Tech Stack

**Frontend:**

- React 18
- Leaflet & React-Leaflet for maps
- OpenStreetMap tiles (no API key required)
- Axios for API calls
- Vite for build tooling

**Backend:**

- Node.js & Express
- MongoDB with Mongoose
- Geospatial indexing (2dsphere)
- Real-time simulation engine
- RESTful APIs

### Data Flow

```
Backend Simulation Engine (5s tick)
    ↓
Train Position Updates → MongoDB
    ↓
Distance Calculations → Phatak Status Updates
    ↓
REST APIs ← Frontend Polling (5s)
    ↓
UI Updates (Markers, Events, Stats)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- MongoDB 5.0+
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd Phatak_radar
```

2. **Install Backend Dependencies**

```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**

```bash
cd frontend
npm install
```

4. **Configure Environment**

Backend `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/phatak_radar
PORT=5000
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

5. **Start MongoDB**

```bash
mongod
```

6. **Start Backend** (with auto-seeding)

```bash
cd backend
npm start
```

The backend will:

- Connect to MongoDB
- Seed 3 sample trains with routes
- Start the simulation engine
- Begin serving APIs on port 5000

7. **Start Frontend**

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`

## 📡 API Endpoints

### Trains

- `GET /api/trains` - Get all active trains
- `GET /api/trains/bounds?neLat&neLng&swLat&swLng` - Get trains in viewport
- `GET /api/trains/:trainNumber` - Get specific train details
- `GET /api/trains/:trainNumber/route` - Get train route polyline
- `GET /api/trains/statistics` - Get train statistics

### Phataks

- `GET /api/phataks` - Get all phataks
- `GET /api/phataks/:id` - Get specific phatak

## 🎨 Design Philosophy

### Layered Map System

1. **Static Layer** → Railway Crossings (Phataks)
2. **Dynamic Layer** → Live Trains
3. **Context Layer** → Train Routes (on-demand)
4. **UI Overlay** → Legend, Panels, Controls

### Core Principles

- **Backend-Driven Truth**: All simulation logic server-side
- **Frontend Lightweight**: Pure data consumption and rendering
- **Explainability**: Clear visual indicators and event descriptions
- **Safety Awareness**: Prominent warnings for closed crossings
- **Trust Signals**: Live update timestamps and status indicators

## 🔧 Configuration

### Simulation Parameters

Edit `backend/src/services/trainSimulation.service.js`:

```javascript
const SIMULATION_TICK_MS = 5000; // Update frequency
const TRAIN_SPEED_KMH = 60; // Average speed
const PHATAK_CLOSURE_DISTANCE_KM = 2; // Close when train within 2km
const PHATAK_OPEN_DISTANCE_KM = 0.5; // Open after train passes 500m
```

### Sample Train Routes

Modify `seedSampleTrains()` function to add custom routes around your area.

## 📊 Data Models

### Train Schema

```javascript
{
  trainNumber: String,
  trainName: String,
  currentPosition: { type: "Point", coordinates: [lng, lat] },
  direction: Number, // 0-360 degrees
  speed: Number, // km/h
  delayMinutes: Number,
  route: { type: "LineString", coordinates: [[lng, lat], ...] },
  affectedPhataks: [{ phatakId, eta, distance }],
  lastUpdated: Date,
  isActive: Boolean
}
```

### Phatak Schema

```javascript
{
  name: String,
  phatakId: String,
  location: { type: "Point", coordinates: [lng, lat] },
  status: "OPEN" | "CLOSED" | "UNKNOWN",
  trainInfo: String,
  trainName: String,
  eta: Number,
  reason: String,
  events: [{ type, description, timestamp }],
  lastUpdated: Date
}
```

## 🎯 Future Enhancements

- [ ] WebSocket support for real-time updates (no polling)
- [ ] Historical data and analytics
- [ ] Mobile app (React Native)
- [ ] User notifications and alerts
- [ ] Integration with real Indian Railways API
- [ ] Multi-language support
- [ ] Advanced route planning
- [ ] Crowd-sourced status updates

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md for guidelines.

## 📞 Support

For issues and questions:

- GitHub Issues: [repository-url]/issues
- Email: support@phatakradar.com

---

**Built with ❤️ for railway safety and awareness**
