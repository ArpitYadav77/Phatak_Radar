import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyTrain } from '../src/services/trainType.js';

test('name keywords win', () => {
  assert.equal(classifyTrain({ number: '26462', name: 'Firozpur Cantt – Delhi Vande Bharat' }), 'VANDE_BHARAT');
  assert.equal(classifyTrain({ number: '00913', name: 'Bandra – Ghazipur Parcel Express' }), 'PARCEL');
  assert.equal(classifyTrain({ number: '00001', name: 'JPP Special' }), 'PARCEL');
  assert.equal(classifyTrain({ number: '74901', name: 'Rajpura – Bathinda DEMU' }), 'DEMU');
  assert.equal(classifyTrain({ number: '64501', name: 'Ludhiana – Chhehreta MEMU' }), 'MEMU');
  assert.equal(classifyTrain({ number: '54551', name: 'Ambala Cantt – Bathinda Passenger' }), 'PASSENGER');
  assert.equal(classifyTrain({ number: '12751', name: 'Nanded – Jammu Tawi Humsafar Express' }), 'SUPERFAST');
  assert.equal(classifyTrain({ number: '14525', name: 'Ambala Cantt – Shri Ganganagar Intercity' }), 'EXPRESS');
  assert.equal(classifyTrain({ name: 'Goods train' }), 'GOODS');
});

test('special beats superfast (time-limited service)', () => {
  assert.equal(classifyTrain({ number: '04559', name: 'Kerala Sampark Kranti Super Fast Special' }), 'SPECIAL');
  assert.equal(classifyTrain({ number: '04519', name: 'Varanasi – Bathinda Special' }), 'SPECIAL');
});

test('provider type hint is used when the name is ambiguous', () => {
  assert.equal(classifyTrain({ number: '12919', name: 'Malwa', typeHint: 'Superfast Express' }), 'SUPERFAST');
  assert.equal(classifyTrain({ number: '22439', name: 'NDLS SVDK', typeHint: 'VB' }), 'VANDE_BHARAT');
  assert.equal(classifyTrain({ number: '54001', name: 'X', typeHint: 'PAS' }), 'PASSENGER');
});

test('number-series fallback', () => {
  assert.equal(classifyTrain({ number: '04683' }), 'SPECIAL');
  assert.equal(classifyTrain({ number: '12001' }), 'SUPERFAST');
  assert.equal(classifyTrain({ number: '22477' }), 'SUPERFAST');
  assert.equal(classifyTrain({ number: '14887' }), 'EXPRESS');
  assert.equal(classifyTrain({ number: '54557' }), 'PASSENGER');
  assert.equal(classifyTrain({ number: '64511' }), 'MEMU');
  assert.equal(classifyTrain({ number: '74905' }), 'DEMU');
  assert.equal(classifyTrain({ number: '1234' }), 'UNKNOWN');
  assert.equal(classifyTrain({}), 'UNKNOWN');
});
