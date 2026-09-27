/**
 * ONE-OFF: import every railway level crossing and station in India from OpenStreetMap.
 *
 *   node backend/scripts/importOsm.js
 *
 * Writes (commit these; the app never calls Overpass at request time):
 *   backend/data/osm/crossings-india.json
 *   backend/data/osm/stations-india.json
 *
 * Data © OpenStreetMap contributors, ODbL 1.0 — attribution is shown in the app.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { overpass, haversineKm, bearingDeg, compass } from './lib/overpass.js';

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/osm');
const round5 = (n) => Math.round(n * 1e5) / 1e5;

// One India-wide query is too heavy for the public Overpass servers (504 under load),
// so query 4°×4° tiles clipped to India's boundary and merge them.
const TILE = 4;
const TILES = [];
for (let lat = 6; lat < 38; lat += TILE) {
  for (let lng = 68; lng < 98; lng += TILE) TILES.push([lat, lng, lat + TILE, lng + TILE]);
}

// Finished tiles are checkpointed so a busy server never costs completed work.
async function fetchTiled(selector, label) {
  const ckptFile = path.join(OUT_DIR, `.checkpoint-${label}.json`);
  const done = existsSync(ckptFile) ? JSON.parse(readFileSync(ckptFile, 'utf8')) : {};
  for (let i = 0; i < TILES.length; i++) {
    if (done[i]) continue;
    const [s, w, n, e] = TILES[i];
    const q = `[out:json][timeout:240];area["ISO3166-1"="IN"][admin_level=2]->.in;(${selector}(area.in)(${s},${w},${n},${e}););out qt;`;
    const json = await overpass(q, { label: `${label} tile ${i + 1}/${TILES.length}`, attempts: 40 });
    done[i] = json.elements.map((el) => ({ id: el.id, lat: el.lat, lon: el.lon, tags: el.tags }));
    writeFileSync(ckptFile, JSON.stringify(done));
    const count = Object.values(done).reduce((a, t) => a + t.length, 0);
    console.log(`  ${label}: tile ${i + 1}/${TILES.length} done (${Object.keys(done).length} tiles, ${count} elements)`);
  }
  const byId = new Map();
  for (const tile of Object.values(done)) for (const el of tile) byId.set(el.id, el);
  return [...byId.values()];
}

async function importStations() {
  const elements = await fetchTiled('node["railway"~"^(station|halt)$"]', 'stations');
  const rows = [];
  for (const e of elements) {
    const t = e.tags || {};
    const name = t['name:en'] || t.name;
    if (!name) continue;
    const code = (t['railway:ref'] || t.ref || '').toUpperCase().replace(/[^A-Z0-9]/g, '') || null;
    rows.push([e.id, round5(e.lat), round5(e.lon), name, code, t.railway]);
  }
  return rows;
}

async function importCrossings() {
  const elements = await fetchTiled('node["railway"="level_crossing"]', 'crossings');
  return elements.map((e) => {
    const t = e.tags || {};
    const name = t['name:en'] || t.name || null;
    const barrier = t['crossing:barrier'] || t.barrier || null;
    return { id: e.id, lat: round5(e.lat), lng: round5(e.lon), name, barrier };
  });
}

/** Grid index (0.2°) for nearest-station lookups. */
function buildIndex(stations) {
  const cell = (lat, lng) => `${Math.floor(lat / 0.2)}:${Math.floor(lng / 0.2)}`;
  const grid = new Map();
  for (const s of stations) {
    const k = cell(s[1], s[2]);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(s);
  }
  return (lat, lng) => {
    const ci = Math.floor(lat / 0.2);
    const cj = Math.floor(lng / 0.2);
    let best = null;
    for (let r = 0; r <= 3 && !best; r++) {
      for (let i = ci - r; i <= ci + r; i++) {
        for (let j = cj - r; j <= cj + r; j++) {
          for (const s of grid.get(`${i}:${j}`) || []) {
            const d = haversineKm(lat, lng, s[1], s[2]);
            if (!best || d < best.d) best = { s, d };
          }
        }
      }
    }
    return best;
  };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log('Fetching stations…');
  const stations = await importStations();
  console.log(`  ${stations.length} named stations/halts (${stations.filter((s) => s[4]).length} with codes)`);

  console.log('Fetching level crossings…');
  const crossings = await importCrossings();
  console.log(`  ${crossings.length} level crossings (${crossings.filter((c) => c.name).length} named)`);

  const nearest = buildIndex(stations);
  const rows = crossings.map((c) => {
    const n = nearest(c.lat, c.lng);
    const near = n
      ? [n.s[3], n.s[4], Math.round(n.d * 10) / 10, compass(bearingDeg(n.s[1], n.s[2], c.lat, c.lng))]
      : [null, null, null, null];
    return [c.id, c.lat, c.lng, c.name, c.barrier, ...near];
  });

  const generatedAt = new Date().toISOString();
  const source = 'OpenStreetMap contributors (ODbL 1.0), via Overpass API';

  writeFileSync(path.join(OUT_DIR, 'stations-india.json'), JSON.stringify({
    generatedAt, source,
    fields: ['osmId', 'lat', 'lng', 'name', 'code', 'kind'],
    rows: stations,
  }));
  writeFileSync(path.join(OUT_DIR, 'crossings-india.json'), JSON.stringify({
    generatedAt, source,
    fields: ['osmId', 'lat', 'lng', 'name', 'barrier', 'nearStation', 'nearStationCode', 'nearKm', 'dirFromStation'],
    rows,
  }));
  console.log(`Wrote ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
