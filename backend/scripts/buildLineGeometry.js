/**
 * ONE-OFF: build real track geometry for the Rajpura – Patiala – Nabha section from OpenStreetMap.
 *
 *   node backend/scripts/buildLineGeometry.js
 *
 * Output (commit it): backend/data/lines/rajpura-patiala-nabha.json
 *   - polyline: [[lat, lng, km], …] along the track, km measured from Patiala (PTA),
 *     negative towards Nabha / Dhuri (W), positive towards Rajpura (E)
 *   - stations / crossings on the line with their chainage (km)
 */

import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { overpass, haversineKm } from './lib/overpass.js';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/lines/rajpura-patiala-nabha.json');
const BBOX = '30.28,75.78,30.55,76.66';
const ANCHOR = 'PTA';
const ENDS = { W: 'NBA', E: 'RPJ' };

function dijkstra(adj, start, goal) {
  const dist = new Map([[start, 0]]);
  const prev = new Map();
  const done = new Set();
  // Small graph (tens of thousands of nodes) — a sorted frontier array is fast enough.
  let frontier = [[0, start]];
  while (frontier.length) {
    frontier.sort((a, b) => a[0] - b[0]);
    const [d, u] = frontier.shift();
    if (done.has(u)) continue;
    done.add(u);
    if (u === goal) break;
    for (const [v, w] of adj.get(u) || []) {
      const nd = d + w;
      if (nd < (dist.get(v) ?? Infinity)) {
        dist.set(v, nd);
        prev.set(v, u);
        frontier.push([nd, v]);
      }
    }
  }
  if (!dist.has(goal)) throw new Error(`no track path ${start} → ${goal}`);
  const pathIds = [goal];
  while (pathIds[0] !== start) pathIds.unshift(prev.get(pathIds[0]));
  return pathIds;
}

/** Ramer–Douglas–Peucker on [lat, lng] using a local metric projection. */
function simplify(points, toleranceM) {
  if (points.length < 3) return points;
  const k = 111320;
  const cos = Math.cos((points[0][0] * Math.PI) / 180);
  const xy = points.map(([lat, lng]) => [lng * k * cos, lat * k]);
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = 0;
    let idx = -1;
    const [ax, ay] = xy[a];
    const [bx, by] = xy[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = xy[i];
      const d = Math.abs((by - ay) * px - (bx - ax) * py + bx * ay - by * ax) / len;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > toleranceM) {
      keep[idx] = true;
      stack.push([a, idx], [idx, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

async function main() {
  const q = `[out:json][timeout:180];
    (way["railway"="rail"](${BBOX}););
    out body;
    >;
    out skel qt;
    (node["railway"~"^(station|halt)$"](${BBOX}););
    out body;
    (node["railway"="level_crossing"](${BBOX}););
    out body;`;
  const json = await overpass(q, { label: 'rajpura-patiala-nabha' });

  const nodes = new Map();
  const stations = [];
  const crossings = [];
  const ways = [];
  for (const e of json.elements) {
    if (e.type === 'way') ways.push(e);
    else if (e.type === 'node') {
      nodes.set(e.id, [e.lat, e.lon]);
      const t = e.tags || {};
      if (t.railway === 'station' || t.railway === 'halt') {
        const code = (t['railway:ref'] || t.ref || '').toUpperCase() || null;
        stations.push({ osmId: e.id, code, name: t['name:en'] || t.name, lat: e.lat, lng: e.lon, kind: t.railway });
      }
      if (t.railway === 'level_crossing') {
        crossings.push({ osmId: e.id, name: t['name:en'] || t.name || null, lat: e.lat, lng: e.lon });
      }
    }
  }

  // Track graph; yards/sidings cost more so the path follows the running line.
  const adj = new Map();
  const addEdge = (a, b, w) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a).push([b, w]);
  };
  for (const w of ways) {
    const penalty = w.tags?.service ? 5 : 1;
    for (let i = 1; i < w.nodes.length; i++) {
      const a = w.nodes[i - 1];
      const b = w.nodes[i];
      const pa = nodes.get(a);
      const pb = nodes.get(b);
      if (!pa || !pb) continue;
      const d = haversineKm(pa[0], pa[1], pb[0], pb[1]) * penalty;
      addEdge(a, b, d);
      addEdge(b, a, d);
    }
  }
  const trackNodes = [...adj.keys()];
  const nearestTrackNode = (lat, lng) => {
    let best = null;
    for (const id of trackNodes) {
      const [nlat, nlng] = nodes.get(id);
      const d = haversineKm(lat, lng, nlat, nlng);
      if (!best || d < best.d) best = { id, d };
    }
    return best.id;
  };

  const byCode = (code) => {
    const s = stations.find((st) => st.code === code);
    if (!s) throw new Error(`station ${code} not found in bbox`);
    return s;
  };
  const anchor = byCode(ANCHOR);
  const west = byCode(ENDS.W);
  const east = byCode(ENDS.E);

  const anchorNode = nearestTrackNode(anchor.lat, anchor.lng);
  const westPath = dijkstra(adj, anchorNode, nearestTrackNode(west.lat, west.lng)); // PTA → DUI
  const eastPath = dijkstra(adj, anchorNode, nearestTrackNode(east.lat, east.lng)); // PTA → RPJ

  // Chainage: negative along the W path, positive along the E path.
  const chain = (ids, sign) => {
    let km = 0;
    const out = [];
    for (let i = 0; i < ids.length; i++) {
      const p = nodes.get(ids[i]);
      if (i > 0) {
        const q2 = nodes.get(ids[i - 1]);
        km += haversineKm(q2[0], q2[1], p[0], p[1]);
      }
      out.push({ id: ids[i], lat: p[0], lng: p[1], km: sign * km });
    }
    return out;
  };
  const w = chain(westPath, -1).reverse(); // DUI … PTA
  const e = chain(eastPath, 1).slice(1);   // PTA … RPJ (skip duplicate PTA)
  const line = [...w, ...e];
  const kmByNode = new Map(line.map((p) => [p.id, p.km]));

  // Project a point onto the nearest line vertex (vertices are dense before simplification).
  const locate = (lat, lng) => {
    let best = null;
    for (const p of line) {
      const d = haversineKm(lat, lng, p.lat, p.lng);
      if (!best || d < best.d) best = { km: p.km, d };
    }
    return best;
  };

  const onLine = (items, maxKm) => items
    .map((it) => {
      const direct = kmByNode.get(it.osmId);
      const loc = direct != null ? { km: direct, d: 0 } : locate(it.lat, it.lng);
      return { ...it, km: Math.round(loc.km * 1000) / 1000, offLineKm: Math.round(loc.d * 1000) / 1000 };
    })
    .filter((it) => it.offLineKm <= maxKm)
    .sort((a, b) => a.km - b.km);

  const simplified = simplify(line.map((p) => [p.lat, p.lng, p.km]), 8)
    .map(([lat, lng, km]) => [Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5, Math.round(km * 1000) / 1000]);

  const result = {
    id: 'rajpura-patiala-nabha',
    generatedAt: new Date().toISOString(),
    source: 'OpenStreetMap contributors (ODbL 1.0), via Overpass API',
    chainage: 'km along the track from Patiala (PTA); negative = towards Nabha / Dhuri (W), positive = towards Rajpura (E)',
    lengthKm: { W: Math.round(-line[0].km * 100) / 100, E: Math.round(line[line.length - 1].km * 100) / 100 },
    stations: onLine(stations, 0.4).map(({ osmId, code, name, kind, lat, lng, km }) => ({ osmId, code, name, kind, lat, lng, km })),
    crossings: onLine(crossings, 0.05).map(({ osmId, name, lat, lng, km }) => ({ osmId, name, lat, lng, km })),
    polyline: simplified,
  };

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(result));
  console.log(`Line length W ${result.lengthKm.W} km, E ${result.lengthKm.E} km; ${result.polyline.length} vertices`);
  console.log('Stations:', result.stations.map((s) => `${s.code || '?'} ${s.name} @ ${s.km} km`).join(' | '));
  console.log('Named crossings:', result.crossings.filter((c) => c.name).map((c) => `${c.name} @ ${c.km} km`).join(' | '));
  console.log(`${result.crossings.length} crossings on the line`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
