// Phatak Radar — control-room palette.
// Single source for every color in the live UI. Status colors are semantic only:
// success = gate open/safe, danger = gate closing/critical, warning = warnings,
// info = trains/informational, gold = premium accent (selection, key labels).

export const P = {
  // Surfaces
  bg: '#0B111A',
  sidebar: '#0F1724',
  card: '#151F2E',
  cardHover: '#1B2738',
  border: '#263448',
  divider: '#1C2839',            // row separators inside cards (quieter than border)

  // Text
  text: '#E8EDF3',
  text2: '#8D9AAF',
  muted: '#647286',

  // Premium accent
  gold: '#C8A96B',
  goldBg: 'rgba(200, 169, 107, 0.08)',
  goldBorder: 'rgba(200, 169, 107, 0.32)',

  // Gate open / safe
  success: '#20A879',
  successText: '#35C995',
  successBg: 'rgba(32, 168, 121, 0.15)',
  successBorder: 'rgba(32, 168, 121, 0.35)',

  // Train / informational
  info: '#4D8FBF',
  infoText: '#7DB0D8',
  infoBg: 'rgba(77, 143, 191, 0.13)',
  infoBorder: 'rgba(77, 143, 191, 0.32)',

  // Warning
  warning: '#D6A64F',
  warningBg: 'rgba(214, 166, 79, 0.13)',
  warningBorder: 'rgba(214, 166, 79, 0.32)',
  warningSurface: '#2A2317',

  // Gate closing / critical
  danger: '#C94B4B',
  dangerText: '#DE7272',         // lighter tint so small text stays legible on dark
  dangerBg: 'rgba(201, 75, 75, 0.14)',
  dangerBorder: 'rgba(201, 75, 75, 0.35)',
  dangerSurface: '#321B20',
};

export const FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const FONT_MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
