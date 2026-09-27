# Phatak Radar

Is the railway crossing (phatak) open? Phatak Radar answers that in one glance on a phone:
**OPEN / CLOSING SOON / CLOSED**, which train is crossing or next, a countdown, and how the
estimate was made.

> Unofficial estimate. Always obey the gate and railway signals.

## What the data is — and isn't

| Data | Source | Status |
|---|---|---|
| Crossing locations (all India) | OpenStreetMap level-crossing nodes, imported by `backend/scripts/importOsm.js` | Real locations; most crossings are unnamed in OSM, so they're labelled by the nearest station |
| Patiala Phatak 23 / 24 | OSM nodes named "23 / 24 number phatak" | Location verified; road names come from the project owner |
| Patiala (PTA) timetable, 28 trains incl. both Vande Bharats | Two independent station boards (see `backend/data/timetable/patiala-pta.json`) | Verified 2026-09-28; specials marked unverified |
| Track geometry Rajpura – Patiala – Nabha | OSM rail ways (`backend/scripts/buildLineGeometry.js`) | Used for crossing distances and train positions |
| Timetables for other crossings | RailRadar station timetables, derived per crossing | Only with `RAILRADAR_API_KEY`; estimates |
| Live delays (Patiala) | RailRadar live station board, cached 2 h | Only with `RAILRADAR_API_KEY` |
| Goods trains (maalgaadi) | **No public source exists** | Shown only via user reports (2+ agreeing within 10 min) |

Crossings on the Patiala line within 8 km of PTA get passing times from the verified timetable.
Everywhere else shows **NO DATA** until a RailRadar key is configured or people report the gate.

## How the status is computed

Everything is a pure function of the current IST time (`backend/src/services/gateEngine.js`) —
no background jobs, so the first request after a cold start is already correct.

1. Passages: when each train passes the crossing (station time ± running time over the distance).
2. Gate window: closed from ~6 min before to ~3 min after a train; "closing soon" 10 min earlier.
3. Priority: gatekeeper override (PIN) > 2+ agreeing user reports > timetable (+ live delay).

## Run locally

```bash
npm install          # installs root, backend and frontend
npm run dev          # backend :5000 + frontend :3000 (Vite proxies /api)
cd backend && npm test
```

Refresh the committed data (one-off, never at request time):

```bash
cd backend && npm run data:osm    # all-India crossings + stations (slow; resumable)
cd backend && npm run data:line   # Rajpura – Patiala – Nabha track geometry
```

## Deploy

- **Frontend — Vercel**: Root Directory `frontend`, build `npm run build`, output `dist`.
  Env: `VITE_API_URL=https://<your-render-service>.onrender.com/api`.
- **Backend — Render** (Web Service): Root Directory `backend`, build `npm install`,
  start `npm start`, health check `/api/health`.

Backend environment variables (Render):

| Variable | Needed | Purpose |
|---|---|---|
| `RAILRADAR_API_KEY` | optional | Live delays + timetables beyond Patiala (free: 1,000 calls/month) |
| `RAILRADAR_DAILY_CAP` | optional | Hard daily call cap, default 30 |
| `MONGO_URI` | recommended | Keeps reports, overrides and the API budget across Render restarts |
| `GATEKEEPER_PIN` | optional | Enables `POST /api/phataks/:id/status` overrides |
| `REPORT_SALT` | optional | Salt for hashing reporter IPs |
| `CORS_ORIGIN` | optional | Extra allowed origin (`*.vercel.app` is always allowed) |

## API

| Method | Path | |
|---|---|---|
| GET | `/api/health` | Data freshness, RailRadar status and quota |
| GET | `/api/phataks?bbox=minLat,minLng,maxLat,maxLng` | Crossings in view with status summary (no bbox → curated) |
| GET | `/api/phataks/search?q=` | Search by name / nearby station |
| GET | `/api/phataks/nearest?lat=&lng=` | Closest crossings |
| GET | `/api/phataks/:id` | Full status: train now/next, countdowns, basis, reports |
| GET | `/api/phataks/:id/day` | Today's expected closures |
| POST | `/api/phataks/:id/report` | `{ status: "CLOSED"\|"OPEN", trainType?, note? }` |
| POST | `/api/phataks/:id/status` | `{ pin, status, minutes? }` gatekeeper override |
| GET | `/api/trains` | Timetable trains estimated on the Patiala line now |
| GET | `/api/trains/timetable` | The verified Patiala timetable |

Crossing and track data © OpenStreetMap contributors (ODbL). Rail overlay © OpenRailwayMap (CC-BY-SA).
