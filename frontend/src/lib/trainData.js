/**
 * Static train data for Patiala Phatak 23 (Model Town) & 24 (Nabha Road)
 * Rajpura–Patiala–Dhuri railway line, Northern Railway (NR)
 */

// ─── Phatak coordinates ───────────────────────────────────────────────────────
export const PHATAK_23 = {
  id: 'PTA-PK-23',
  name: 'Patiala Phatak 23 — Model Town',
  shortName: 'Phatak 23',
  lat: 30.3510,
  lng: 76.3720,
  road: 'Model Town Road, Patiala',
};

export const PHATAK_24 = {
  id: 'PTA-PK-24',
  name: 'Patiala Phatak 24 — Nabha Road',
  shortName: 'Phatak 24',
  lat: 30.3320,
  lng: 76.3980,
  road: 'Nabha Road, Patiala',
};

export const PHATAKS = [PHATAK_23, PHATAK_24];

// Patiala city center
export const PATIALA_CENTER = [30.3398, 76.3869];

// Alert radii
export const APPROACH_RADIUS_KM = 15;
export const CRITICAL_RADIUS_KM = 5;

// ─── Trains on the Rajpura–Patiala–Dhuri line ─────────────────────────────────
// scheduledTime = approximate crossing time at Patiala Phatak 23/24
export const PATIALA_TRAINS = [
  { trainNumber: '14503', trainName: 'Patiala Express',               origin: 'Delhi Sarai Rohilla', destination: 'Patiala',   scheduledTime: '23:55', direction: 'DOWN' },
  { trainNumber: '14504', trainName: 'Patiala Express',               origin: 'Patiala',             destination: 'Delhi',      scheduledTime: '05:25', direction: 'UP' },
  { trainNumber: '12497', trainName: 'Shane Punjab Express',          origin: 'Amritsar',            destination: 'New Delhi',  scheduledTime: '19:50', direction: 'UP' },
  { trainNumber: '12498', trainName: 'Shane Punjab Express',          origin: 'New Delhi',            destination: 'Amritsar',   scheduledTime: '08:10', direction: 'DOWN' },
  { trainNumber: '14649', trainName: 'Saryuyamuna Express',           origin: 'Delhi',               destination: 'Bhiwani',    scheduledTime: '02:30', direction: 'DOWN' },
  { trainNumber: '14650', trainName: 'Saryuyamuna Express',           origin: 'Patiala',             destination: 'Delhi',      scheduledTime: '01:15', direction: 'UP' },
  { trainNumber: '14033', trainName: 'Delhi–Jammu Mail',              origin: 'Delhi Junction',      destination: 'Jammu Tawi', scheduledTime: '21:40', direction: 'DOWN' },
  { trainNumber: '14034', trainName: 'Jammu–Delhi Mail',              origin: 'Jammu Tawi',          destination: 'Delhi',      scheduledTime: '06:20', direction: 'UP' },
  { trainNumber: '18101', trainName: 'Tata–Patiala Express',          origin: 'Tatanagar',           destination: 'Patiala',    scheduledTime: '11:30', direction: 'DOWN' },
  { trainNumber: '18102', trainName: 'Patiala–Tata Express',          origin: 'Patiala',             destination: 'Tatanagar',  scheduledTime: '15:20', direction: 'UP' },
  { trainNumber: '12487', trainName: 'Sealdah–Amritsar Express',      origin: 'Sealdah',             destination: 'Amritsar',   scheduledTime: '03:45', direction: 'DOWN' },
  { trainNumber: '12488', trainName: 'Amritsar–Sealdah Express',      origin: 'Amritsar',            destination: 'Sealdah',    scheduledTime: '20:30', direction: 'UP' },
  { trainNumber: '18238', trainName: 'Chhatisgarh Express',           origin: 'Amritsar',            destination: 'Bilaspur',   scheduledTime: '18:45', direction: 'DOWN' },
  { trainNumber: '18237', trainName: 'Chhatisgarh Express (Return)',  origin: 'Bilaspur',            destination: 'Amritsar',   scheduledTime: '09:15', direction: 'UP' },
  { trainNumber: '74901', trainName: 'Rajpura–Bhatinda DMU',          origin: 'Rajpura',             destination: 'Bhatinda',   scheduledTime: '06:50', direction: 'DOWN' },
  { trainNumber: '74902', trainName: 'Bhatinda–Rajpura DMU',          origin: 'Bhatinda',            destination: 'Rajpura',    scheduledTime: '18:10', direction: 'UP' },
  { trainNumber: '74903', trainName: 'Patiala–Rajpura Passenger',     origin: 'Patiala',             destination: 'Rajpura',    scheduledTime: '07:45', direction: 'UP' },
  { trainNumber: '74904', trainName: 'Rajpura–Patiala Passenger',     origin: 'Rajpura',             destination: 'Patiala',    scheduledTime: '17:00', direction: 'DOWN' },
  { trainNumber: '74905', trainName: 'Patiala–Dhuri Passenger',       origin: 'Patiala',             destination: 'Dhuri',      scheduledTime: '09:20', direction: 'DOWN' },
  { trainNumber: '74906', trainName: 'Dhuri–Patiala Passenger',       origin: 'Dhuri',               destination: 'Patiala',    scheduledTime: '16:00', direction: 'UP' },
  { trainNumber: '54401', trainName: 'Patiala–Jakhal Passenger',      origin: 'Patiala',             destination: 'Jakhal',     scheduledTime: '10:35', direction: 'DOWN' },
  { trainNumber: '54402', trainName: 'Jakhal–Patiala Passenger',      origin: 'Jakhal',              destination: 'Patiala',    scheduledTime: '14:30', direction: 'UP' },
  { trainNumber: '54403', trainName: 'Morinda–Patiala Passenger',     origin: 'Morinda',             destination: 'Patiala',    scheduledTime: '12:50', direction: 'DOWN' },
  { trainNumber: '54404', trainName: 'Patiala–Morinda Passenger',     origin: 'Patiala',             destination: 'Morinda',    scheduledTime: '13:45', direction: 'UP' },
];

// Backward-compat alias
export const LUDHIANA_TRAINS = PATIALA_TRAINS;
export const LUDHIANA_CENTER = PATIALA_CENTER;

/** Get trains sorted by minutes until scheduled crossing, wrapping at midnight */
export function getScheduleSortedTrains() {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  return PATIALA_TRAINS.map((t) => {
    const [h, m] = t.scheduledTime.split(':').map(Number);
    const trainMins = h * 60 + m;
    let diff = trainMins - nowMins;
    if (diff > 720)  diff -= 24 * 60;
    if (diff < -720) diff += 24 * 60;
    return { ...t, minutesUntil: diff };
  }).sort((a, b) => a.minutesUntil - b.minutesUntil);
}
