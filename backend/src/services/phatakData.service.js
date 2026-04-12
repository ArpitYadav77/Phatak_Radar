/**
 * PHATAK DATA SERVICE
 *
 * Provides query functions to filter in-memory phatak data.
 * Data is loaded by dataCache.js at startup from JSON files.
 */

import { getPhataks } from './dataCache.js';

export const loadPhatakData = () => Promise.resolve({ success: true });

/**
 * Query phataks within a bounding box (for map view)
 */
export async function getPhataksInBounds(minLat, minLng, maxLat, maxLng) {
  const nLat = Number(maxLat);
  const nLng = Number(maxLng);
  const sLat = Number(minLat);
  const sLng = Number(minLng);

  return getPhataks().filter((p) => {
    if (!p.location?.coordinates) return false;
    const [pLng, pLat] = p.location.coordinates;
    return pLat <= nLat && pLat >= sLat && pLng <= nLng && pLng >= sLng;
  });
}

/**
 * Query phataks by state
 */
export async function getPhataksByState(state) {
  return getPhataks().filter((p) => p.state === state);
}

/**
 * Query phataks by railway zone
 */
export async function getPhataksByZone(zone) {
  return getPhataks().filter((p) => p.railwayZone === zone);
}

/**
 * Get statistics about loaded phatak data
 */
export async function getPhatakStats() {
  const all = getPhataks();
  const total = all.length;

  const byState = Object.entries(
    all.reduce((acc, p) => {
      acc[p.state] = (acc[p.state] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([_id, count]) => ({ _id, count }))
    .sort((a, b) => b.count - a.count);

  const byZone = Object.entries(
    all.reduce((acc, p) => {
      acc[p.railwayZone] = (acc[p.railwayZone] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([_id, count]) => ({ _id, count }))
    .sort((a, b) => b.count - a.count);

  const byGateType = Object.entries(
    all.reduce((acc, p) => {
      acc[p.gateType] = (acc[p.gateType] || 0) + 1;
      return acc;
    }, {})
  ).map(([_id, count]) => ({ _id, count }));

  const byStatus = Object.entries(
    all.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([_id, count]) => ({ _id, count }));

  return { total, byState, byZone, byGateType, byStatus };
}

export default {
  loadPhatakData,
  getPhataksInBounds,
  getPhataksByState,
  getPhataksByZone,
  getPhatakStats,
};
