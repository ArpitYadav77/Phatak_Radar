/**
 * IST TIME HELPERS
 *
 * Vercel runs in UTC; all railway schedules are in IST (Asia/Kolkata).
 * Never use Date#getHours() for schedule math — use these instead.
 */

const IST_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/** Returns { year, month, day, hours, minutes, seconds, date: 'YYYY-MM-DD', minutesOfDay } in IST. */
export function getISTParts(now = new Date()) {
  const parts = Object.fromEntries(
    IST_PARTS.formatToParts(now).map((p) => [p.type, p.value])
  );
  const hours = Number(parts.hour);
  const minutes = Number(parts.minute);
  const seconds = Number(parts.second);
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hours,
    minutes,
    seconds,
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutesOfDay: hours * 60 + minutes + seconds / 60,
  };
}

/** ISO-like IST timestamp, e.g. "2026-09-27T15:42:10+05:30". */
export function formatIST(now = new Date()) {
  const p = getISTParts(now);
  const pad = (n) => String(n).padStart(2, '0');
  return `${p.date}T${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}+05:30`;
}
