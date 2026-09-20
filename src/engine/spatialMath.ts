import { MarsCoordinate } from '../types/mars';

// Mars mean volumetric radius
export const MARS_RADIUS_KM = 3396.19;

/**
 * Calculates Great-Circle distance between two points on Mars using Haversine formula
 */
export function calculateMarsDistanceKm(coord1: MarsCoordinate, coord2: MarsCoordinate): number {
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLatRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLonRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return MARS_RADIUS_KM * c;
}

export function calculateMarsDistanceMeters(coord1: MarsCoordinate, coord2: MarsCoordinate): number {
  return calculateMarsDistanceKm(coord1, coord2) * 1000;
}

/**
 * Calculate slope in degrees between two 3D positions on Mars
 */
export function calculateSlopeDegrees(
  coord1: MarsCoordinate,
  elev1Meters: number,
  coord2: MarsCoordinate,
  elev2Meters: number
): number {
  const horizontalDistMeters = calculateMarsDistanceMeters(coord1, coord2);
  if (horizontalDistMeters < 0.1) return 0;
  const verticalDelta = Math.abs(elev2Meters - elev1Meters);
  const slopeRad = Math.atan(verticalDelta / horizontalDistMeters);
  return (slopeRad * 180) / Math.PI;
}

/**
 * Mars suited astronaut walking velocity (km/h) based on slope (Margaria-Minetti adjusted for 0.38g)
 * Typical flat walking speed for EMU/xEMU planetary suit: ~3.0 - 3.4 km/h
 * Slopes over 15° require tethering/hands-on-regolith, speeds slow to < 1.0 km/h
 * Slopes over 22° are strictly impassable for unassisted pedestrian EVA.
 */
export function calculateAstronautWalkingSpeedKmH(slopeDegrees: number, isUphill: boolean): number {
  const baseSpeed = 3.2; // km/h on flat Mars terrain
  if (slopeDegrees <= 2) return baseSpeed;
  if (slopeDegrees >= 22) return 0.2; // effectively impassable

  const slopeFraction = Math.tan((slopeDegrees * Math.PI) / 180);
  if (isUphill) {
    // Metabolic cost increases sharply uphill
    return Math.max(0.4, baseSpeed * Math.exp(-2.9 * slopeFraction));
  } else {
    // Downhill: moderate slopes give slight assistance, steep downhill (>12°) slows to prevent tumbling
    if (slopeDegrees <= 8) {
      return Math.min(3.6, baseSpeed * 1.05);
    }
    return Math.max(0.6, baseSpeed * Math.exp(-2.1 * slopeFraction));
  }
}

/**
 * Metabolic energy expenditure calculation (kcal/hour) for suited Marswalk
 * Base suit life support metabolic load is ~280 kcal/hr + kinetic effort
 */
export function calculateMetabolicRateKcalHr(slopeDegrees: number, speedKmH: number): number {
  const baseMetabolism = 260; // kcal/h for pressurized suit maintenance
  const kineticEffort = 80 * speedKmH;
  const slopeFactor = Math.pow(slopeDegrees / 5, 1.4) * 45;
  return Math.min(680, baseMetabolism + kineticEffort + slopeFactor);
}

/**
 * Calculate distance from a point to a line segment on Mars surface (meters)
 */
export function distanceToSegmentMeters(
  point: MarsCoordinate,
  segA: MarsCoordinate,
  segB: MarsCoordinate
): number {
  const dAB = calculateMarsDistanceMeters(segA, segB);
  if (dAB < 0.5) return calculateMarsDistanceMeters(point, segA);

  const dAP = calculateMarsDistanceMeters(segA, point);
  const dBP = calculateMarsDistanceMeters(segB, point);

  // Using projection scalar
  const cosAngle = (dAP * dAP + dAB * dAB - dBP * dBP) / (2 * dAP * dAB);
  const proj = dAP * cosAngle;

  if (proj <= 0) return dAP;
  if (proj >= dAB) return dBP;

  // Perpendicular distance
  const perp = Math.sqrt(Math.max(0, dAP * dAP - proj * proj));
  return perp;
}

/**
 * Computes spherical polygon area on Mars in square kilometers using spherical excess
 */
export function calculateMarsPolygonAreaKm2(coords: MarsCoordinate[]): number {
  if (coords.length < 3) return 0;

  let totalAngle = 0;
  const n = coords.length;

  for (let i = 0; i < n; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % n];
    const p3 = coords[(i + 2) % n];

    // Compute bearings
    const bearing1 = calculateBearing(p2, p1);
    const bearing2 = calculateBearing(p2, p3);

    let angle = bearing2 - bearing1;
    while (angle < 0) angle += 360;
    while (angle >= 360) angle -= 360;

    totalAngle += angle * (Math.PI / 180);
  }

  const excess = Math.abs(totalAngle - (n - 2) * Math.PI);
  return excess * MARS_RADIUS_KM * MARS_RADIUS_KM;
}

function calculateBearing(start: MarsCoordinate, dest: MarsCoordinate): number {
  const startLat = (start.latitude * Math.PI) / 180;
  const startLon = (start.longitude * Math.PI) / 180;
  const destLat = (dest.latitude * Math.PI) / 180;
  const destLon = (dest.longitude * Math.PI) / 180;

  const y = Math.sin(destLon - startLon) * Math.cos(destLat);
  const x =
    Math.cos(startLat) * Math.sin(destLat) -
    Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLon - startLon);

  const brng = Math.atan2(y, x);
  return ((brng * 180) / Math.PI + 360) % 360;
}

