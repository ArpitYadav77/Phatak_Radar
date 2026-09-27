const IST = 'Asia/Kolkata';

const clockFmt = new Intl.DateTimeFormat('en-IN', { timeZone: IST, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** Epoch ms → "14:05" (IST, regardless of the phone's time zone). */
export const istClock = (ms) => (ms == null ? '—' : clockFmt.format(new Date(ms)));

/** Minutes until `ms` (rounded, never negative) — for "in 6 min". */
export const minutesUntil = (ms, now) => Math.max(0, Math.round((ms - now) / 60000));

/** "in 6 min" / "in 1 h 20 min" / "now" */
export function inWords(ms, now) {
  if (ms == null) return '';
  const m = Math.round((ms - now) / 60000);
  if (m <= 0) return 'now';
  if (m < 60) return `in ${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `in ${h} h ${r} min` : `in ${h} h`;
}

/** "12 s ago" / "3 min ago" */
export function ago(ms, now) {
  if (!ms) return '';
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return `${s} s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

/** Countdown value + unit for the big number: { value: "6", unit: "min" } */
export function countdown(ms, now) {
  if (ms == null) return null;
  const s = Math.max(0, Math.round((ms - now) / 1000));
  if (s < 60) return { value: String(s), unit: 's' };
  const m = Math.ceil(s / 60);
  if (m < 100) return { value: String(m), unit: 'min' };
  const h = Math.floor(m / 60);
  return { value: `${h}:${String(m % 60).padStart(2, '0')}`, unit: 'h' };
}

export const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function describeCrossing(c) {
  if (!c) return '';
  const parts = [];
  if (c.district) parts.push(c.district);
  if (c.nearStation && !c.curated) parts.push(`${c.nearKm} km ${c.dirFromStation} of ${c.nearStation}`);
  if (c.lineKm != null) parts.push(`${Math.abs(c.lineKm).toFixed(1)} km ${c.lineKm < 0 ? 'W' : 'E'} of Patiala stn`);
  return parts.join(' · ');
}
