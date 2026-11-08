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

import { calculateAstronautWalkingSpeedKmH } from '../src/engine/spatialMath';
import { getMarsPressureMbar } from '../src/engine/marsMolaElevation';
import { getMarsSpaceWeatherState } from '../src/engine/marsSpaceWeather';
import { JEZERO_REGION, JEZERO_SCIENCE_TARGETS, JEZERO_RESOURCE_SITES } from '../src/data/jezeroDataset';
import { MARS_LANDING_SITES_ATMOSPHERE } from '../src/data/marsAtmosphereData';

test('Margaria-Minetti walking speed model adjusts speed based on Martian slope', () => {
  const flatSpeed = calculateAstronautWalkingSpeedKmH(0, false);
  const uphillSpeed = calculateAstronautWalkingSpeedKmH(12, true);
  const impassableSpeed = calculateAstronautWalkingSpeedKmH(25, true);

  assert.ok(flatSpeed > 3.0 && flatSpeed <= 3.5, 'Flat walking speed is ~3.2 km/h in Martian gravity');
  assert.ok(uphillSpeed < flatSpeed, 'Uphill slope slows walking speed');
  assert.ok(impassableSpeed <= 0.5, 'Slopes over 22° are marked effectively impassable for unassisted EVA');
});

test('Mars barometric formula calculates correct atmospheric pressure at MOLA datum and Olympus Mons', () => {
  const datumPressure = getMarsPressureMbar(0); // 0m datum
  const summitPressure = getMarsPressureMbar(21229); // Olympus Mons summit ~21.2 km

  assert.ok(datumPressure >= 6.0 && datumPressure <= 6.2, 'Mars datum pressure should be ~6.1 mbar');
  assert.ok(summitPressure < 1.0, 'Summit of Olympus Mons has near-vacuum atmospheric pressure (< 1 mbar)');
});

test('Space weather telemetry model accurately calibrates against MSL RAD baseline', () => {
  const quietState = getMarsSpaceWeatherState('quiet');
  const majorSepState = getMarsSpaceWeatherState('major_sep');

  assert.equal(quietState.radiationDoseMicroGyPerDay, 635, 'Nominal radiation baseline matches MSL RAD Gale Crater (635 µGy/day)');
  assert.ok(majorSepState.radiationDoseMicroGyPerDay > quietState.radiationDoseMicroGyPerDay, 'Major SEP event elevates radiation dose 5x');
  assert.ok(majorSepState.shelterReturnRequired, 'Major solar particle event triggers astronaut shelter return required');
});

test('Jezero Crater dataset provides integrated science targets, clay resources, and weather telemetry', () => {
  assert.equal(JEZERO_REGION.id, 'jezero');
  assert.ok(JEZERO_SCIENCE_TARGETS.length >= 5, 'Contains multiple verified astrobiology science targets');
  assert.ok(JEZERO_RESOURCE_SITES.some(r => r.resourceType === 'CLAY_BOUND_WATER'), 'Includes hydrated smectite clay water resource');
  
  const jezeroAtmo = MARS_LANDING_SITES_ATMOSPHERE.find(s => s.id === 'perseverance');
  assert.ok(jezeroAtmo !== undefined, 'MEDA atmospheric station telemetry is present');
  assert.ok(jezeroAtmo!.tempMinC < -50 && jezeroAtmo!.tempMaxC > -35, 'Realistic diurnal temperature range');
});

import { analyzeMarsLocationScience } from '../src/engine/marsEnvironmentalAnalysis';

test('analyzeMarsLocationScience produces geographically distinct and scientifically accurate data across Mars', () => {
  const olympus = analyzeMarsLocationScience(18.65, -133.8, 21229);
  const hellas = analyzeMarsLocationScience(-42.7, 70.0, -8200);
  const korolev = analyzeMarsLocationScience(73.0, 165.0);
  const arcadia = analyzeMarsLocationScience(39.2, -170.3);
  const jezero = analyzeMarsLocationScience(18.38, 77.58, -2560);

  // Pressure varies with MOLA elevation
  assert.ok(olympus.atmosphere.surfacePressureMbar < 1.5, 'Olympus Mons summit has near-vacuum pressure (< 1.5 mbar)');
  assert.ok(hellas.atmosphere.surfacePressureMbar > 9.5, 'Hellas Basin has highest Mars pressure (> 9.5 mbar)');
  assert.notEqual(olympus.atmosphere.pressureDisplay, hellas.atmosphere.pressureDisplay);

  // Water/Ice presence varies regionally
  assert.equal(korolev.water.presenceType, 'Exposed Surface Ice', 'Korolev has exposed pure water ice mound');
  assert.equal(korolev.water.probabilityChance, 98, 'Korolev water ice chance is 98%');

  assert.equal(arcadia.water.presenceType, 'Shallow Subsurface Ice (<1m)', 'Arcadia has shallow subsurface ice');
  assert.ok(arcadia.water.probabilityChance >= 90, 'Arcadia ice probability is >= 90%');

  assert.equal(jezero.water.presenceType, 'Deep Hydrated Clay/Salts', 'Jezero delta has hydrated clays');
  assert.ok(jezero.water.depthDisplay.includes('smectite'), 'Jezero specifies smectite clays');

  // Trafficability and slope hazard vary
  assert.equal(olympus.vehicleSafety.trafficabilityRating, 'Extreme (Cliff/Caldera)');
  assert.notEqual(olympus.vehicleSafety.trafficabilityRating, arcadia.vehicleSafety.trafficabilityRating);
});


