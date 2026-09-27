// Thin fetch wrapper. VITE_API_URL points at the backend (Render) in production;
// in local dev the Vite proxy serves /api.
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function request(path, { method = 'GET', body, signal } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    signal,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  health: () => request('/health'),
  crossing: (id, opts) => request(`/phataks/${encodeURIComponent(id)}`, opts),
  crossingDay: (id, opts) => request(`/phataks/${encodeURIComponent(id)}/day`, opts),
  curated: (opts) => request('/phataks', opts),
  inBbox: ([minLat, minLng, maxLat, maxLng], opts) =>
    request(`/phataks?bbox=${[minLat, minLng, maxLat, maxLng].map((n) => n.toFixed(4)).join(',')}`, opts),
  search: (q, opts) => request(`/phataks/search?q=${encodeURIComponent(q)}`, opts),
  nearest: (lat, lng, opts) => request(`/phataks/nearest?lat=${lat}&lng=${lng}&limit=6`, opts),
  report: (id, body) => request(`/phataks/${encodeURIComponent(id)}/report`, { method: 'POST', body }),
  trains: (opts) => request('/trains', opts),
  timetable: (opts) => request('/trains/timetable', opts),
};
