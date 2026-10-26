# Phatak Radar

**Is the railway crossing (phatak) open?** Phatak Radar answers that in one glance on a phone:
**OPEN / CLOSING SOON / CLOSED**, which train is crossing or comes next, a countdown, and how the
estimate was made.

- Live app: https://phatak-radar.vercel.app
- API: `https://phatak-radar-1.onrender.com/api/health`

> Unofficial estimate. Always obey the gate and railway signals.

## Features

- **Status screen** — pick a crossing (search all of India, **Near me** via your phone's location,
  or a recent one) and see one big status card: the state in words + icon + colour
  (with Hindi / Punjabi), the train crossing now or next with its type, a live countdown,
  and what the estimate is based on.
- **Next trains** at the crossing, with times at the crossing itself (IST).
- **Report gate** — people at the crossing report *closed / open* and what is passing
  (goods, passenger, express, Vande Bharat…). Two matching reports within 10 minutes update
  the crossing for everyone; reports expire after 20 minutes.
- **Map** — every crossing in view coloured by status, timetable trains as arrows by type,
  OpenRailwayMap rail-line overlay, filter chips per train type.
- **Trains** — trains estimated on the Rajpura – Patiala – Nabha line right now, and the full
  verified Patiala timetable with running days.
- **Insights** — today's closures per hour, train-type mix, estimated minutes the gate is closed,
  longest open spell.
- Mobile-first: bottom tabs on phones, sidebar on laptops; dark and light themes.

## What the data is — and isn't

| Data | Source | Coverage |
|---|---|---|
| **56,504 level crossings (all India)** | OpenStreetMap, imported by `backend/scripts/importOsm.js` | Real locations. Only 57 are named in OSM, so the rest are labelled by the nearest station, e.g. "Level crossing 1.4 km W of Rajpura Junction" |
| **10,235 stations / halts** (9,570 with codes) | OpenStreetMap | Used for labels and RailRadar lookups |
| **Patiala Phatak 23 / 24** | OSM nodes named "23 / 24 number phatak" | Location verified; road names (Model Town / Nabha Road) from the project owner |
| **Patiala (PTA) timetable — 28 trains, incl. both Vande Bharats** | Two independent station boards (`backend/data/timetable/patiala-pta.json`) | Verified 2026-09-28; special trains marked unverified |
| **Track geometry Rajpura – Patiala – Nabha** | OSM rail lines (`backend/scripts/buildLineGeometry.js`) | Crossing distances and train positions |
| Timetables for other crossings | RailRadar station timetables, derived per crossing | Only with `RAILRADAR_API_KEY`; estimates |
| Live delays (Patiala) | RailRadar live station board, cached 2 h | Only with `RAILRADAR_API_KEY` |
| **Goods trains (maalgaadi)** | **No public source exists** | Shown only through user reports |

The 32 crossings on the Patiala line within 8 km of Patiala station get passing times from the
verified timetable. Other crossings show **NO DATA** until a RailRadar key is configured or
people report the gate.

## How the status is computed

Everything is a pure function of the current India time (`backend/src/services/gateEngine.js`) —
no background jobs, so the first request after the free server wakes up is already correct.

1. **Passages** — when each train passes the crossing: Patiala station time ± running time over
   the distance along the real track.
2. **Gate window** — closed from ~6 min before to ~3 min after the train; "closing soon" in the
   10 minutes before that.
3. **Priority** — gatekeeper override (PIN) > 2+ agreeing user reports > timetable (+ live delay).

## Project structure

```
frontend/          React 18 + Vite + react-leaflet (Vercel)
  src/pages/       Status, Map, Trains, Insights
  src/components/  status card, picker, report sheet, map, layout
backend/           Express API (Render)
  src/services/    gateEngine, timetable, crossings, reports, railradar, trainType
  data/osm/        all-India crossings + stations (OpenStreetMap)
  data/timetable/  verified Patiala timetable
  data/lines/      Rajpura – Patiala – Nabha track geometry
  scripts/         one-off data import scripts
  test/            node:test unit tests
```

## Run locally

```bash
npm install          # installs root, backend and frontend
npm run dev          # backend :5000 + frontend :3000 (Vite proxies /api)
cd backend && npm test
```

Refresh the committed data (one-off, never at request time):

```bash
cd backend && npm run data:osm    # all-India crossings + stations (slow; resumes if interrupted)
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
| `REPORT_SALT` | optional | Salt for hashing reporter IPs (raw IPs are never stored) |
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

## Known limits

- Crossing times are estimates from distance along the track; real gates close at the gateman's
  discretion.
- Goods trains have no public timetable anywhere — they appear only through user reports.
- Without `MONGO_URI`, user reports live in memory and are lost when the free Render server sleeps.

## Credits

Crossing, station and track data © OpenStreetMap contributors (ODbL).
Rail overlay © OpenRailwayMap (CC-BY-SA). Timetables cross-checked against public station boards.
