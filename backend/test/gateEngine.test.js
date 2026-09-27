import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCrossingStatus } from '../src/services/gateEngine.js';
import { passagesAtKm, lineKmForOsmId, runMinutes } from '../src/services/timetable.service.js';

const PHATAK_23_OSM = 6007045153;
const ist = (s) => new Date(`${s}+05:30`).getTime();
const at = (iso, extra = {}) => resolveCrossingStatus({
  passages: passagesAtKm(lineKmForOsmId(PHATAK_23_OSM)),
  now: ist(iso),
  ...extra,
});

test('Phatak 23 sits 3–4 km west of Patiala on the real track', () => {
  const km = lineKmForOsmId(PHATAK_23_OSM);
  assert.ok(km < -3 && km > -4, `km=${km}`);
});

test('Sunday 11:00 IST: Vande Bharat 26462 (arr PTA 11:05 from the west) closes Phatak 23', () => {
  const s = at('2026-09-27T11:00:00');
  assert.equal(s.status, 'CLOSED');
  assert.equal(s.train.number, '26462');
  assert.equal(s.train.type, 'VANDE_BHARAT');
  assert.equal(s.basis, 'timetable');
  assert.ok(s.opensAt > ist('2026-09-27T11:00:00'));
});

test('Sunday 10:47 IST: closing soon for the Vande Bharat', () => {
  const s = at('2026-09-27T10:47:00');
  assert.equal(s.status, 'CLOSING_SOON');
  assert.equal(s.train.number, '26462');
  assert.ok(s.closesAt > ist('2026-09-27T10:47:00'));
});

test('Wednesday 11:00 IST: Vande Bharat does not run, gate open', () => {
  const s = at('2026-09-30T11:00:00');
  assert.equal(s.status, 'OPEN');
  assert.ok(!s.nextTrains.some((t) => t.number === '26462' && t.expectedAt < ist('2026-09-30T12:00:00')));
});

test('01:52 IST: 14888 (arr PTA 01:59 from the west) — overnight train handled', () => {
  const s = at('2026-09-27T01:52:00');
  assert.equal(s.status, 'CLOSED');
  assert.equal(s.train.number, '14888');
});

test('Patiala–Ambala passengers never cross the west-side phataks', () => {
  const numbers = passagesAtKm(lineKmForOsmId(PHATAK_23_OSM)).map((p) => p.trainNumber);
  assert.ok(!numbers.includes('54557'), 'UMB→PTA terminates at PTA from the east');
  assert.ok(!numbers.includes('54558'), 'PTA→UMB leaves eastwards');
  assert.ok(numbers.includes('54551') && numbers.includes('54552'));
});

test('two agreeing user reports with no timetable train → CLOSED, goods/unscheduled', () => {
  const now = ist('2026-09-30T11:00:00');
  const reports = [
    { status: 'CLOSED', at: now - 60_000, reporter: 'a' },
    { status: 'CLOSED', at: now - 120_000, reporter: 'b' },
  ];
  const s = at('2026-09-30T11:00:00', { reports });
  assert.equal(s.status, 'CLOSED');
  assert.equal(s.basis, 'reports');
  assert.equal(s.train.type, 'GOODS');
});

test('one report alone does not change the status', () => {
  const now = ist('2026-09-30T11:00:00');
  const s = at('2026-09-30T11:00:00', { reports: [{ status: 'CLOSED', at: now, reporter: 'a' }] });
  assert.equal(s.status, 'OPEN');
  assert.equal(s.reports.total, 1);
});

test('same reporter twice does not count as agreement', () => {
  const now = ist('2026-09-30T11:00:00');
  const reports = [
    { status: 'CLOSED', at: now - 10_000, reporter: 'a' },
    { status: 'CLOSED', at: now - 20_000, reporter: 'a' },
  ];
  assert.equal(at('2026-09-30T11:00:00', { reports }).status, 'OPEN');
});

test('gatekeeper override beats everything', () => {
  const now = ist('2026-09-27T11:00:00');
  const s = at('2026-09-27T11:00:00', { override: { status: 'OPEN', until: now + 60_000 } });
  assert.equal(s.status, 'OPEN');
  assert.equal(s.basis, 'gatekeeper');
});

test('live delay shifts the closure window', () => {
  const s = at('2026-09-27T11:00:00', { delays: new Map([['26462', 30]]) });
  assert.notEqual(s.status, 'CLOSED');
  const vb = s.nextTrains.find((t) => t.number === '26462');
  assert.equal(vb.delayMin, 30);
});

test('crossing without a timetable is UNKNOWN, not OPEN', () => {
  const s = resolveCrossingStatus({ passages: null, now: ist('2026-09-27T11:00:00') });
  assert.equal(s.status, 'UNKNOWN');
  assert.equal(s.basis, 'none');
});

test('running-time model is monotonic and sane', () => {
  assert.ok(runMinutes(1, 'EXPRESS') === 2);
  assert.ok(runMinutes(4.5, 'PASSENGER') > runMinutes(4.5, 'VANDE_BHARAT'));
  assert.ok(runMinutes(4.5, 'EXPRESS') < 8);
});
