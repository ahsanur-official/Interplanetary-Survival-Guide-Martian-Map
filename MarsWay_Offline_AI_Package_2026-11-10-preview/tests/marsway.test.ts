import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMarsDistanceKm,
  calculateMarsPolygonAreaKm2,
  calculateSlopeDegrees,
} from '../src/engine/spatialMath';
import { getMolaElevation } from '../src/engine/marsMolaElevation';
import { calculateAStarRoute } from '../src/engine/marsAStarRouter';
import { GALE_HAZARD_ZONES } from '../src/data/galeDataset';

test('Mars distance is zero for identical coordinates', () => {
  assert.equal(
    calculateMarsDistanceKm({ latitude: -4.7, longitude: 137.4 }, { latitude: -4.7, longitude: 137.4 }),
    0
  );
});

test('Mars polygon area returns a positive local area', () => {
  const area = calculateMarsPolygonAreaKm2([
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 1 },
    { latitude: 1, longitude: 0 },
  ]);
  assert.ok(area > 0);
});

test('slope uses horizontal distance and elevation delta', () => {
  assert.ok(calculateSlopeDegrees(
    { latitude: 0, longitude: 0 },
    0,
    { latitude: 0, longitude: 0.01 },
    100
  ) > 0);
});

test('MOLA-calibrated elevation stays within Mars model bounds', () => {
  const elevation = getMolaElevation(-4.7385, 137.3475);
  assert.ok(elevation >= -8200 && elevation <= 21229);
});

test('shared route engine returns a science route with Boxwork stop data', () => {
  const route = calculateAStarRoute(
    -4.7115,
    137.383,
    -4.7385,
    137.3475,
    'science',
    { hazardZones: GALE_HAZARD_ZONES }
  );
  assert.equal(route.mode, 'science');
  assert.ok(route.waypoints.length > 2);
  assert.ok(route.nearbyScienceStops.some((stop) => stop.category === 'Boxwork Formation'));
});

import { analyzeRouteSafety } from '../src/engine/marsRouteSafetyAnalyzer';
import { JEZERO_HAZARD_ZONES } from '../src/data/jezeroDataset';

test('analyzeRouteSafety detects hazards and generates a safer bypass', () => {
  const assessment = analyzeRouteSafety(
    { lat: 18.4447, lng: 77.4508, name: 'Octavia Base' },
    { lat: 18.4340, lng: 77.4120, name: 'Delta Scarp' },
    JEZERO_HAZARD_ZONES
  );
  assert.ok(assessment.directDistanceKm > 0);
  assert.ok(assessment.suggestedSaferRoute.waypoints.length > 2);
  assert.ok(assessment.comparison.saferSlope >= 0);
  assert.ok(assessment.warningHeadlineBn.length > 0);
});
