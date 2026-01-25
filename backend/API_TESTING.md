# API Testing Guide - Phatak Radar

## Quick Start

After starting the server, test these endpoints to verify the pan-India phatak system works correctly.

---

## 1. Server Startup

```bash
cd backend
npm start
```

**Expected console output:**

```
🚀 Server running on port 5000
==================================================
📍 Loading pan-India phatak data...
✅ Phatak data loaded successfully!
   Total phataks: 145
   Inserted: 145, Updated: 0
   States covered: 8
   State breakdown: { ... }
📊 Phatak indexes verified
==================================================
✅ Phatak Radar backend ready!
📡 API endpoints:
   GET /api/phataks/bbox?bbox=minLat,minLng,maxLat,maxLng
   GET /api/phataks/state/:state
   GET /api/phataks/zone/:zone
   GET /api/phataks/stats
   GET /api/trains
==================================================
```

---

## 2. Test Basic Endpoints

### Get Statistics

```bash
curl http://localhost:5000/api/phataks/stats
```

**Expected response:**

```json
{
  "total": 145,
  "byState": [
    { "_id": "Uttar Pradesh", "count": 25 },
    { "_id": "Maharashtra", "count": 20 },
    ...
  ],
  "byZone": [
    { "_id": "CR", "count": 18 },
    ...
  ],
  "byGateType": [
    { "_id": "AUTOMATIC", "count": 60 },
    { "_id": "MANUAL", "count": 75 },
    { "_id": "UNMANNED", "count": 10 }
  ],
  "byStatus": [
    { "_id": "OPEN", "count": 145 }
  ]
}
```

---

## 3. Test Bounding Box Query (Map View)

### Mumbai Region

```bash
curl "http://localhost:5000/api/phataks/bbox?bbox=18.5,72.8,19.5,73.2"
```

**Expected**: 5-8 phataks in Mumbai area

### Delhi-NCR Region

```bash
curl "http://localhost:5000/api/phataks/bbox?bbox=28.4,77.0,28.7,77.5"
```

**Expected**: 3-5 phataks in Delhi-NCR area

### Kolkata Region

```bash
curl "http://localhost:5000/api/phataks/bbox?bbox=22.4,88.2,22.7,88.5"
```

**Expected**: 4-6 phataks in Kolkata area

---

## 4. Test State Filtering

### Maharashtra

```bash
curl http://localhost:5000/api/phataks/state/Maharashtra
```

**Expected**: 20 phataks

### Uttar Pradesh

```bash
curl "http://localhost:5000/api/phataks/state/Uttar%20Pradesh"
```

**Expected**: 25 phataks

### West Bengal

```bash
curl "http://localhost:5000/api/phataks/state/West%20Bengal"
```

**Expected**: 20 phataks

---

## 5. Test Railway Zone Filtering

### Central Railway

```bash
curl http://localhost:5000/api/phataks/zone/CR
```

**Expected**: ~18 phataks

### Northern Railway

```bash
curl http://localhost:5000/api/phataks/zone/NR
```

**Expected**: ~15 phataks

### Eastern Railway

```bash
curl http://localhost:5000/api/phataks/zone/ER
```

**Expected**: ~12 phataks

---

## 6. Test Phatak Lookup

### By Phatak ID

```bash
curl http://localhost:5000/api/phataks/lookup/PHK_MH_CR_001
```

**Expected response:**

```json
{
  "_id": "...",
  "phatakId": "PHK_MH_CR_001",
  "name": "Dadar East Level Crossing",
  "state": "Maharashtra",
  "district": "Mumbai",
  "railwayZone": "CR",
  "railLineName": "Mumbai-Pune Mainline",
  "location": {
    "type": "Point",
    "coordinates": [72.8467, 19.0176]
  },
  "nearbyStations": ["Dadar", "Matunga"],
  "gateType": "AUTOMATIC",
  "status": "OPEN",
  "defaultStatus": "OPEN",
  ...
}
```

---

## 7. Performance Testing

### Load Test (100 concurrent requests)

```bash
# Using Apache Bench
ab -n 100 -c 10 "http://localhost:5000/api/phataks/bbox?bbox=18.5,72.8,19.5,73.2"
```

**Expected**:

- Average response time: <10ms
- No failed requests

### Large Bbox Query (All India)

```bash
curl "http://localhost:5000/api/phataks/bbox?bbox=8.0,68.0,35.0,97.0"
```

**Expected**: All 145 phataks (should still return in <50ms)

---

## 8. Verify Integration with Train Simulation

After server runs for 30-60 seconds, check for dynamic status changes:

```bash
# Get phataks with CLOSED status
curl "http://localhost:5000/api/phataks/bbox?bbox=18.5,72.8,19.5,73.2" | jq '.[] | select(.status == "CLOSED")'
```

**Expected**: Some phataks should have:

- `status: "CLOSED"`
- `trainInfo: "12345"` (or other train number)
- `trainName: "Express Name"`
- `eta: 3` (minutes)

---

## 9. Error Handling Tests

### Invalid Bbox

```bash
curl "http://localhost:5000/api/phataks/bbox?bbox=invalid"
```

**Expected**: 400 error with message

### Non-existent State

```bash
curl http://localhost:5000/api/phataks/state/InvalidState
```

**Expected**: Empty array `[]`

### Invalid Phatak ID

```bash
curl http://localhost:5000/api/phataks/lookup/INVALID_ID
```

**Expected**: 404 error

---

## 10. Frontend Integration Test

Open browser console and run:

```javascript
// Test bbox query from frontend
fetch("http://localhost:5000/api/phataks/bbox?bbox=18.5,72.8,19.5,73.2")
  .then((res) => res.json())
  .then((data) => console.log("Phataks:", data));

// Test stats
fetch("http://localhost:5000/api/phataks/stats")
  .then((res) => res.json())
  .then((data) => console.log("Stats:", data));
```

---

## Common Issues & Solutions

### Issue: "No phatak data files found"

**Solution**: Ensure JSON files exist in `backend/data/phataks/`

### Issue: MongoDB connection error

**Solution**: Start MongoDB service: `mongod` or check connection string in `.env`

### Issue: Duplicate key error on restart

**Solution**: Normal behavior - upsert will update existing phataks instead of creating duplicates

### Issue: Empty results from bbox query

**Solution**: Check bbox coordinates - ensure minLat < maxLat and minLng < maxLng

---

## Success Criteria

✅ Server starts without errors  
✅ All 145 phataks loaded successfully  
✅ Bbox queries return correct phataks  
✅ State/zone filtering works  
✅ Statistics endpoint returns accurate counts  
✅ Train simulation updates phatak status  
✅ Response times < 10ms for bbox queries

---

## Next Steps

1. **Test frontend integration**: Open `http://localhost:5173` (Vite dev server)
2. **Monitor live updates**: Watch phatak status change as trains move
3. **Verify map performance**: Pan/zoom map and check bbox queries
4. **Check event logging**: Verify phatak events are recorded

---

**Last Updated**: January 2026
