import { P } from '../styles/palette';

// Mirrors backend/src/services/trainType.js. Map colours: trains are blue family,
// goods amber, premium (Vande Bharat) gold — red/green stay reserved for gate states.
export const TRAIN_TYPES = {
  VANDE_BHARAT: { label: 'Vande Bharat', short: 'VB', icon: 'bolt', color: P.gold, cls: 'vb' },
  SUPERFAST: { label: 'Superfast', short: 'SF', icon: 'train', color: P.infoText, cls: '' },
  EXPRESS: { label: 'Express', short: 'EXP', icon: 'train', color: P.info, cls: '' },
  PASSENGER: { label: 'Passenger', short: 'PAS', icon: 'users', color: '#6F8FB0', cls: '' },
  DEMU: { label: 'DEMU', short: 'DEMU', icon: 'users', color: '#6F8FB0', cls: '' },
  MEMU: { label: 'MEMU', short: 'MEMU', icon: 'users', color: '#6F8FB0', cls: '' },
  EMU: { label: 'EMU / Local', short: 'EMU', icon: 'users', color: '#6F8FB0', cls: '' },
  PARCEL: { label: 'Parcel / Luggage', short: 'PCL', icon: 'package', color: '#9C8FC0', cls: '' },
  SPECIAL: { label: 'Special', short: 'SPL', icon: 'train', color: '#8FA3BF', cls: '' },
  GOODS: { label: 'Goods', short: 'GDS', icon: 'wagon', color: P.warning, cls: 'goods' },
  UNKNOWN: { label: 'Train', short: '—', icon: 'train', color: P.text2, cls: '' },
};

export const typeInfo = (t) => TRAIN_TYPES[t] || TRAIN_TYPES.UNKNOWN;

// Groups used by filter chips.
export const TYPE_FILTERS = [
  { key: 'VB', label: 'Vande Bharat', types: ['VANDE_BHARAT'] },
  { key: 'EXP', label: 'Express / SF', types: ['EXPRESS', 'SUPERFAST'] },
  { key: 'PAS', label: 'Passenger / DEMU', types: ['PASSENGER', 'DEMU', 'MEMU', 'EMU'] },
  { key: 'SPL', label: 'Special', types: ['SPECIAL'] },
  { key: 'PCL', label: 'Parcel', types: ['PARCEL'] },
];
