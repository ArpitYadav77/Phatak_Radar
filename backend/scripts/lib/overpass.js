/**
 * Minimal Overpass API client for one-off data scripts (never used at request time).
 * Retries on the "server too busy" responses the public instances return under load.
 */

// Public instances; overpass-api.de often answers 504 "too busy" under load.
const ENDPOINTS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function overpass(query, { attempts = 6, label = 'query' } = {}) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    const endpoint = ENDPOINTS[i % ENDPOINTS.length];
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'PhatakRadar-data-scripts/1.0',
        },
        body: new URLSearchParams({ data: query }),
      });
      const text = await res.text();
      if (res.ok && text.trimStart().startsWith('{')) {
        const json = JSON.parse(text);
        if (json.remark && /runtime error|timed out/i.test(json.remark)) {
          throw new Error(`Overpass remark: ${json.remark}`);
        }
        return json;
      }
      const reason = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
      throw new Error(`HTTP ${res.status}: ${reason || 'empty response'}`);
    } catch (err) {
      lastError = err;
      const wait = Math.min(15000 * (i + 1), 120000);
      console.warn(`[overpass] ${label} attempt ${i + 1}/${attempts} failed (${err.message}); retrying in ${wait / 1000}s`);
      await sleep(wait);
    }
  }
  throw new Error(`[overpass] ${label} failed after ${attempts} attempts: ${lastError?.message}`);
}

/** Great-circle distance in km. */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Initial bearing in degrees (0 = north). */
export function bearingDeg(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function compass(bearing) {
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(bearing / 45) % 8];
}
