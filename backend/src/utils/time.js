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
  weekday: 'short',
  hourCycle: 'h23',
});

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Returns { year, month, day, hours, minutes, seconds, weekday (0=Sun..6=Sat),
 * date: 'YYYY-MM-DD', minutesOfDay } in IST.
 */
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
    weekday: WEEKDAYS.indexOf(parts.weekday),
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutesOfDay: hours * 60 + minutes + seconds / 60,
  };
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Epoch ms of IST midnight for the IST day containing `now`, shifted by `dayOffset` days. */
export function istMidnight(now = new Date(), dayOffset = 0) {
  const t = now instanceof Date ? now.getTime() : now;
  const istDayIndex = Math.floor((t + IST_OFFSET_MS) / DAY_MS);
  return (istDayIndex + dayOffset) * DAY_MS - IST_OFFSET_MS;
}

/** IST weekday (0=Sun..6=Sat) of the IST day starting at `midnightMs`. */
export function istWeekdayOf(midnightMs) {
  return new Date(midnightMs + IST_OFFSET_MS).getUTCDay();
}

/** "HH:MM" → minutes after midnight (null for empty). */
export function hhmmToMin(hhmm) {
  if (!hhmm) return null;
  const [h, m] = String(hhmm).split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/** Epoch ms → "HH:MM" in IST. */
export function formatISTClock(ms) {
  const p = getISTParts(new Date(ms));
  return `${String(p.hours).padStart(2, '0')}:${String(p.minutes).padStart(2, '0')}`;
}

/** ISO-like IST timestamp, e.g. "2026-09-27T15:42:10+05:30". */
export function formatIST(now = new Date()) {
  const p = getISTParts(now);
  const pad = (n) => String(n).padStart(2, '0');
  return `${p.date}T${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}+05:30`;
}
