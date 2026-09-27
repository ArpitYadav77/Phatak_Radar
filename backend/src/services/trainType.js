/**
 * TRAIN TYPE CLASSIFIER — the single place that decides a train's type.
 *
 * Order: name keywords first (most reliable), then a provider type hint
 * (e.g. RailRadar "SF" / "Superfast Express"), then the Indian Railways
 * number-series convention as a last resort.
 */

export const TRAIN_TYPES = {
  VANDE_BHARAT: { label: 'Vande Bharat', short: 'VB' },
  SUPERFAST:    { label: 'Superfast',    short: 'SF' },
  EXPRESS:      { label: 'Express',      short: 'EXP' },
  PASSENGER:    { label: 'Passenger',    short: 'PAS' },
  DEMU:         { label: 'DEMU',         short: 'DEMU' },
  MEMU:         { label: 'MEMU',         short: 'MEMU' },
  EMU:          { label: 'EMU / Local',  short: 'EMU' },
  PARCEL:       { label: 'Parcel / Luggage', short: 'PCL' },
  SPECIAL:      { label: 'Special',      short: 'SPL' },
  GOODS:        { label: 'Goods',        short: 'GDS' },
  UNKNOWN:      { label: 'Train',        short: '—' },
};

const NAME_RULES = [
  ['VANDE_BHARAT', /VANDE\s*BHARAT/],
  ['GOODS', /\bGOODS\b|FREIGHT|MAAL\s*GAADI|MALGADI/],
  ['PARCEL', /PARCEL|\bJPP\b|LUGGAGE|\bPCL\b|\bVPU\b|\bMILK\b|POSTAL|\bRMS\b/],
  ['DEMU', /\bD\.?E?MU\b|\bDEMU\b/],
  ['MEMU', /\bMEMU\b/],
  ['EMU', /\bEMU\b|\bLOCAL\b/],
  ['PASSENGER', /\bPASSENGER\b|\bPASS\b/],
  ['SPECIAL', /\bSPL\b|\bSPECIAL\b/],
  ['SUPERFAST', /\bSF\b|SUPER\s*FAST|RAJDHANI|SHATABDI|DURONTO|HUMSAFAR|TEJAS|GARIB\s*RATH|SAMPARK\s*KRANTI|AMRIT\s*BHARAT/],
  ['EXPRESS', /\bMAIL\b|\bEXP(RESS)?\b|\bEX\b|INTER\s*CITY|INTCITY/],
];

const HINT_RULES = [
  ['VANDE_BHARAT', /^VB$|VANDE/],
  ['SUPERFAST', /^(SF|RAJ|SHT|DRNT|GR)$|SUPER\s*FAST|RAJDHANI|SHATABDI|DURONTO|GARIB/],
  ['PASSENGER', /^PAS$|PASSENGER/],
  ['DEMU', /DEMU/],
  ['MEMU', /MEMU/],
  ['EMU', /^EMU$|SUBURBAN|LOCAL/],
  ['PARCEL', /PARCEL|FREIGHT/],
  ['EXPRESS', /^EXP$|EXPRESS|MAIL/],
];

function fromNumber(number) {
  const n = String(number || '').replace(/\D/g, '');
  if (n.length !== 5) return 'UNKNOWN';
  const d1 = n[0];
  const d2 = n.slice(0, 2);
  if (d1 === '0') return 'SPECIAL';
  if (['12', '20', '22'].includes(d2)) return 'SUPERFAST';
  if (d1 === '1' || d1 === '2' || d1 === '8') return 'EXPRESS';
  if (d1 === '5') return 'PASSENGER';
  if (d1 === '6') return 'MEMU';
  if (d1 === '7') return 'DEMU';
  if (['3', '4', '9'].includes(d1)) return 'EMU';
  return 'UNKNOWN';
}

/** Classify a train. All arguments optional; returns a TRAIN_TYPES key. */
export function classifyTrain({ number, name, typeHint } = {}) {
  const upperName = String(name || '').toUpperCase();
  for (const [type, re] of NAME_RULES) if (re.test(upperName)) return type;

  const hint = String(typeHint || '').toUpperCase().trim();
  if (hint) for (const [type, re] of HINT_RULES) if (re.test(hint)) return type;

  return fromNumber(number);
}

export function trainTypeLabel(type) {
  return (TRAIN_TYPES[type] || TRAIN_TYPES.UNKNOWN).label;
}
