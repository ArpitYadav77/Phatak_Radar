import { test } from 'node:test';
import assert from 'node:assert/strict';
import { derivePassages } from '../src/services/derivedTimetable.service.js';

// Shapes follow https://railradar.in/docs/station-board (GET /v1/stations/{code}/trains).
const stop = (sequence, arrival, departure, arrivalDay = 1, departureDay = 1) =>
  ({ sequence, arrival, departure, arrivalDay, departureDay, distance: 0, stopType: 'halt' });
const train = (number, name, type, runDays) =>
  ({ number, name, type, source: { code: 'AAA', name: 'Origin' }, destination: { code: 'ZZZ', name: 'Dest' }, runDays });

// Crossing sits 2 km from A and 6 km from B (fraction 0.25 from A).
const pair = { A: { code: 'AAA', name: 'Alpha', km: 2 }, B: { code: 'BBB', name: 'Bravo', km: 6 } };

test('train at both stations → passage interpolated by distance, direction from sequence', () => {
  const boardA = { trains: [{ train: train('12345', 'Test SF Express', 'Superfast Express', ['mon', 'wed']), stop: stop(4, '10:00', '10:02') }] };
  const boardB = { trains: [{ train: train('12345', 'Test SF Express', 'Superfast Express', ['mon', 'wed']), stop: stop(5, '10:22', '10:24') }] };
  const [p] = derivePassages(pair, boardA, boardB);
  assert.equal(p.trainNumber, '12345');
  assert.equal(p.trainType, 'SUPERFAST');
  assert.equal(p.stationMin, 10 * 60 + 2);          // departs A 10:02
  assert.equal(p.offsetMin, 0.25 * 20);             // 20 min A→B, 25% of the way
  assert.equal(p.heading, 'towards Bravo');
  assert.deepEqual(p.runsOn.sort(), [1, 3]);
});

test('reverse direction: B has the lower sequence', () => {
  const boardA = { trains: [{ train: train('54321', 'Back Passenger', 'PAS', ['sun']), stop: stop(9, '18:30', '18:31') }] };
  const boardB = { trains: [{ train: train('54321', 'Back Passenger', 'PAS', ['sun']), stop: stop(8, '18:00', '18:02') }] };
  const [p] = derivePassages(pair, boardA, boardB);
  assert.equal(p.heading, 'towards Alpha');
  assert.equal(p.stationMin, 18 * 60 + 2);          // departs B 18:02
  assert.equal(p.offsetMin, 0.75 * 28);             // crossing is 6 km from B of 8 km
  assert.equal(p.trainType, 'PASSENGER');
});

test('runDays shift with the day the train reaches the station', () => {
  const boardA = { trains: [{ train: train('12001', 'Night Mail', 'EXP', ['sat']), stop: stop(10, '00:40', '00:42', 2, 2) }] };
  const boardB = { trains: [{ train: train('12001', 'Night Mail', 'EXP', ['sat']), stop: stop(11, '01:00', '01:01', 2, 2) }] };
  const [p] = derivePassages(pair, boardA, boardB);
  assert.deepEqual(p.runsOn, [0]); // leaves origin Saturday, at A on Sunday
});

test('trains at only one station, or with nonsense times, are skipped', () => {
  const boardA = { trains: [
    { train: train('11111', 'Only A', 'EXP', ['mon']), stop: stop(1, null, '05:00') },
    { train: train('22222', 'Bad times', 'EXP', ['mon']), stop: stop(1, null, '09:00') },
  ] };
  const boardB = { trains: [{ train: train('22222', 'Bad times', 'EXP', ['mon']), stop: stop(2, '08:00', '08:01') }] };
  assert.equal(derivePassages(pair, boardA, boardB).length, 0);
});

test('malformed responses do not throw', () => {
  assert.deepEqual(derivePassages(pair, null, undefined), []);
  assert.deepEqual(derivePassages(pair, { trains: [{}] }, { trains: [null] }), []);
});
