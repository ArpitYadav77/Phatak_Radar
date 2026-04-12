/**
 * Haversine distance formula
 * Returns distance in kilometers between two GPS coordinates
 */
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** ETA in minutes given distance (km) and speed (km/h) */
export function getEtaMinutes(distKm, speedKmh) {
  if (!speedKmh || speedKmh < 5) speedKmh = 60;
  return Math.round((distKm / speedKmh) * 60);
}

/** Format distance for display */
export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
