/**
 * CROSSINGS — every real railway level crossing we know about.
 *
 *   data/osm/crossings-india.json   all-India OpenStreetMap import (scripts/importOsm.js)
 *   data/phataks/curated.json       hand-checked crossings (override OSM records by osmId)
 *
 * In-memory grid index for bbox / nearest / search; no database needed.
 */

import { createRequire } from 'module';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { lineKmForOsmId } from './timetable.service.js';

const require = createRequire(import.meta.url);
const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data');

const curated = require('../../data/phataks/curated.json');
const osmFile = path.join(DATA, 'osm/crossings-india.json');
const osm = existsSync(osmFile) ? require('../../data/osm/crossings-india.json') : { rows: [], generatedAt: null };
if (!osm.rows.length) console.error('❌ [crossings] data/osm/crossings-india.json missing — run scripts/importOsm.js');

const CELL = 0.1; // degrees
const grid = new Map();
const byId = new Map();
const all = [];

const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const cellKey = (lat, lng) => `${Math.floor(lat / CELL)}:${Math.floor(lng / CELL)}`;

function labelFor(c) {
  if (c.name) return c.name;
  if (c.nearStation) {
    const km = c.nearKm < 0.3 ? 'at' : `${c.nearKm} km ${c.dirFromStation} of`;
    return `Level crossing ${km} ${c.nearStation}`;
  }
  return 'Level crossing';
}

function add(c) {
  c.label = labelFor(c);
  Object.defineProperty(c, 'hay', {
    enumerable: false,
    value: [c.name, c.label, c.nearStation, c.nearStationCode, c.id, c.district, c.road].map(norm).join(' '),
  });
  const km = lineKmForOsmId(c.osmId);
  if (km != null) c.line = { id: 'rajpura-patiala-nabha', km };
  byId.set(c.id, c);
  all.push(c);
  const k = cellKey(c.lat, c.lng);
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push(c);
}

const curatedByOsm = new Map(curated.crossings.map((c) => [c.osmId, c]));

for (const r of osm.rows) {
  const [osmId, lat, lng, name, barrier, nearStation, nearStationCode, nearKm, dirFromStation] = r;
  if (curatedByOsm.has(osmId)) continue;
  add({
    id: `osm-${osmId}`,
    osmId, lat, lng, name, barrier, nearStation, nearStationCode, nearKm, dirFromStation,
    curated: false,
    locationSource: 'OpenStreetMap',
  });
}

for (const c of curated.crossings) {
  const r = osm.rows.find((row) => row[0] === c.osmId);
  add({
    id: c.phatakId,
    osmId: c.osmId,
    lat: c.lat,
    lng: c.lng,
    name: c.road ? `${c.name} — ${c.road}` : c.name,
    shortName: c.name,
    road: c.road || null,
    roadNameSource: c.roadNameSource || null,
    osmName: c.osmName || null,
    district: c.district || null,
    state: c.state || null,
    barrier: r?.[4] || null,
    nearStation: r?.[5] || null,
    nearStationCode: r?.[6] || null,
    nearKm: r?.[7] ?? null,
    dirFromStation: r?.[8] || null,
    curated: true,
    locationSource: 'OpenStreetMap (named node, hand-checked)',
  });
}

export const crossingsMeta = {
  total: all.length,
  curated: curated.crossings.length,
  osmGeneratedAt: osm.generatedAt,
  source: 'OpenStreetMap contributors (ODbL 1.0)',
};

export function getCrossing(id) {
  if (byId.has(id)) return byId.get(id);
  // Accept a bare OSM id too.
  if (/^\d+$/.test(String(id))) return byId.get(`osm-${id}`) || all.find((c) => String(c.osmId) === String(id)) || null;
  return null;
}

export function crossingsInBbox(minLat, minLng, maxLat, maxLng, limit = 1500) {
  const out = [];
  for (let i = Math.floor(minLat / CELL); i <= Math.floor(maxLat / CELL); i++) {
    for (let j = Math.floor(minLng / CELL); j <= Math.floor(maxLng / CELL); j++) {
      for (const c of grid.get(`${i}:${j}`) || []) {
        if (c.lat >= minLat && c.lat <= maxLat && c.lng >= minLng && c.lng <= maxLng) out.push(c);
      }
    }
  }
  // Prefer crossings we can say something about when truncating.
  out.sort((a, b) => (b.curated - a.curated) || ((b.line ? 1 : 0) - (a.line ? 1 : 0)));
  return { items: out.slice(0, limit), truncated: out.length > limit, total: out.length };
}

const distKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export function nearestCrossings(lat, lng, limit = 5, maxKm = 50) {
  const found = [];
  const ci = Math.floor(lat / CELL);
  const cj = Math.floor(lng / CELL);
  for (let r = 0; r <= Math.ceil(maxKm / 11); r++) {
    for (let i = ci - r; i <= ci + r; i++) {
      for (let j = cj - r; j <= cj + r; j++) {
        if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== r) continue; // ring only
        for (const c of grid.get(`${i}:${j}`) || []) found.push({ c, d: distKm(lat, lng, c.lat, c.lng) });
      }
    }
    // Once we have enough candidates, one more ring guarantees correctness at cell edges.
    if (found.length >= limit && r >= 1) break;
  }
  return found
    .filter((f) => f.d <= maxKm)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map(({ c, d }) => ({ crossing: c, distanceKm: Math.round(d * 100) / 100 }));
}

export function searchCrossings(query, limit = 20) {
  const q = norm(query);
  if (!q) return [];
  const terms = q.split(' ');
  const scored = [];
  for (const c of all) {
    if (!terms.every((t) => c.hay.includes(t))) continue;
    let score = 0;
    if (c.curated) score += 100;
    if (c.name && norm(c.name).includes(q)) score += 40;
    if (norm(c.nearStation) === q || norm(c.nearStationCode) === q) score += 30;
    if (c.line) score += 10;
    score -= (c.nearKm || 0);
    scored.push({ c, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.c);
}

export function curatedCrossings() {
  return all.filter((c) => c.curated);
}
