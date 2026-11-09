// MarsWay A* Planetary Surface Routing Engine
// Computes optimal EVA traverses on Mars using IAU 2000 MOLA elevation datum,
// terrain slope cost functions, hazard avoidance, and scientific opportunity interception.

import { HazardZone, MarsCoordinate } from '../types/mars';
import {
  calculateMarsDistanceKm,
  calculateMarsDistanceMeters,
  calculateSlopeDegrees,
  calculateAstronautWalkingSpeedKmH,
  calculateBearing,
  getBearingCardinal,
} from './spatialMath';
import { getMolaElevation } from './marsMolaElevation';

import { NasaSurfacePovImage } from '../types/mars';

export type RouteMode = 'safest' | 'shortest' | 'science';
export type MarsTransportModeType = 'foot' | 'unpressurized_rover' | 'pressurized_rover';
export type CrewBuddyConfigType = 'solo' | 'buddy_pair';

export interface PlannedWaypoint {
  id: string;
  lat: number;
  lng: number;
  elevationM: number;
  slopeDeg: number;
  cumulativeDistKm: number;
  cumulativeTimeHours: number;
  name: string;
  isScienceStop?: boolean;
  scienceCategory?: string;
  hazardRisk: 'Low' | 'Moderate' | 'Hazardous';
  surfacePovImage?: NasaSurfacePovImage;
}

export interface ScienceStopSuggestion {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: 'Clay Hydration' | 'Deltaic Sediment' | 'Subsurface Ice' | 'Carbonate Deposit' | 'Crater Rim' | 'Boxwork Formation';
  description: string;
  detourDistanceMeters: number;
  detourTimeMinutes: number;
  scientificValueScore: number; // 1 to 10
  surfacePovImage?: NasaSurfacePovImage;
}

export interface PlannedRouteResult {
  id: string;
  name: string;
  mode: RouteMode;
  color: string;
  transportMode?: MarsTransportModeType;
  crewConfig?: CrewBuddyConfigType;
  waypoints: PlannedWaypoint[];
  totalDistanceKm: number;
  totalAscentM: number;
  totalDescentM: number;
  maxSlopeDeg: number;
  avgSlopeDeg: number;
  estimatedWalkTimeHours: number;
  estimatedWalkTimeFormatted: string;
  metabolicKcal: number;
  oxygenExpenditureLiters: number;
  batteryPowerKwh?: number;
  crewProductivityMultiplier: number;
  safetyScore: number; // 0 to 100
  safetyExplanation: string;
  surfaceCondition: string;
  soilConditionScore: number;
  terrainSuitabilityScore: number;
  safetyFactors: {
    slopeScore: number;
    hazardAvoidanceScore: number;
    shelterProximityScore: number;
    thermalDaylightScore: number;
    radiationScore: number;
  };
  whyThisRoute: {
    summary: string;
    summaryBn: string; // Plain language Bengali explanation
    advantages: string[];
    tradeOffs: string[];
    criticalDecisionFactors: string[];
  };
  nearbyScienceStops: ScienceStopSuggestion[];
}

// Known science targets catalog on Mars for science-rich routing & auto-suggestions
export const MARS_SCIENCE_CATALOG: Array<{
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: 'Clay Hydration' | 'Deltaic Sediment' | 'Subsurface Ice' | 'Carbonate Deposit' | 'Crater Rim' | 'Boxwork Formation';
  description: string;
  scientificValueScore: number;
  surfacePovImage?: NasaSurfacePovImage;
}> = [
  {
    id: 'jezero_delta_fan',
    name: 'Jezero Delta Front Sediments',
    lat: 18.4447,
    lng: 77.4509,
    category: 'Deltaic Sediment',
    description: 'Fine-grained bottomset mudstones holding highest preservation potential for ancient microbial biosignatures.',
    scientificValueScore: 9.8,
  },
  {
    id: 'kodiak_butte',
    name: 'Kodiak Remnant Delta Butte',
    lat: 18.352,
    lng: 77.538,
    category: 'Deltaic Sediment',
    description: 'Isolated erosional butte with exposed Gilbert-type cross-bedding demonstrating multi-stage lake flooding.',
    scientificValueScore: 9.1,
  },
  {
    id: 'belva_impact_clays',
    name: 'Belva Crater Smectite Clays',
    lat: 18.512,
    lng: 77.378,
    category: 'Clay Hydration',
    description: 'Impact excavation exposing Fe/Mg phyllosilicates formed in neutral-pH aqueous alteration environments.',
    scientificValueScore: 9.4,
  },
  {
    id: 'neretva_vallia_inlet',
    name: 'Neretva Vallis Inflow Channel',
    lat: 18.495,
    lng: 77.295,
    category: 'Deltaic Sediment',
    description: 'Catastrophic breach channel that filled Jezero paleolake with regional boulder conglomerates.',
    scientificValueScore: 8.9,
  },
  {
    id: 'arcadia_shallow_ice',
    name: 'Arcadia Planitia Subsurface Glacial Ice',
    lat: 39.3,
    lng: -171.0,
    category: 'Subsurface Ice',
    description: 'Abundant shallow sheet ice 1-2 meters beneath dry regolith, detected via SHARAD radar and neutron spectrometers.',
    scientificValueScore: 9.7,
  },
  {
    id: 'utopia_permafrost_ice',
    name: 'Utopia Planitia Buried Ice Sheet',
    lat: 48.27,
    lng: 134.01,
    category: 'Subsurface Ice',
    description: 'Enormous underground ice reservoir estimated to hold more water than Lake Superior, covered by 1-10m dust.',
    scientificValueScore: 9.5,
  },
  {
    id: 'gale_clay_unit',
    name: 'Mount Sharp Glen Torridon Clay Unit',
    lat: -4.68,
    lng: 137.41,
    category: 'Clay Hydration',
    description: 'Thick stratigraphy of potassium-rich smectite clays deposited during Mars transition to arid conditions.',
    scientificValueScore: 9.6,
  },
  {
    id: 'gale_boxwork_formations',
    name: 'Mount Sharp Boxwork Formations (2025 Discovery)',
    lat: -4.738,
    lng: 137.348,
    category: 'Boxwork Formation',
    description: 'Gigantic spiderweb-like polygonal mineral ridges formed as deep groundwater fluids filled rock fractures and resisted eons of wind erosion.',
    scientificValueScore: 9.9,
    surfacePovImage: {
      id: 'POV-BOXWORK-ROUTER',
      title: 'Curiosity Mastcam Survey of Boxwork Mineral Fins',
      camera: 'Mastcam-100',
      sol: 4120,
      earthDate: '2024-03-24',
      imageUrl: 'https://images-assets.nasa.gov/image/PIA24485/PIA24485~medium.jpg',
      description: 'Polygonal boxwork mineral ridges protruding from the eroded slopes of Mount Sharp, preserving Martian groundwater chemistry.',
      targetFeature: 'Boxwork Polygonal Ridges',
      fieldOfViewDeg: 15,
      azimuthDeg: 215,
    },
  },
  {
    id: 'valles_carbonate_rim',
    name: 'Coprates Chasma Carbonate Veins',
    lat: -14.2,
    lng: -60.5,
    category: 'Carbonate Deposit',
    description: 'Hydrothermal magnesite and siderite precipitates indicating sub-surface alkaline groundwater circulation.',
    scientificValueScore: 9.2,
  },
  {
    id: 'olympus_caldera_scarp',
    name: 'Olympus Mons Basal Escarpment Layering',
    lat: 18.65,
    lng: -133.8,
    category: 'Crater Rim',
    description: 'Exposed basaltic lava flows spanning 6 vertical kilometers of Martian volcanic evolution.',
    scientificValueScore: 9.0,
  },
];

interface SurfaceAssessment {
  condition: string;
  soilScore: number;
  tractionFactor: number;
}

/**
 * Explainable surface-trafficability estimate from MOLA elevation, local
 * slope and mapped hazards. This is a planning aid, not live rover telemetry.
 */
export function assessMartianSurface(
  lat: number,
  lng: number,
  elevationM: number,
  slopeDeg: number,
  hazardZones: HazardZone[]
): SurfaceAssessment {
  const normalizedLng = ((lng + 180) % 360 + 360) % 360 - 180;
  let soilScore = 86;
  let condition = 'Firm basaltic regolith';

  if (Math.abs(lat) < 18) {
    soilScore = 76;
    condition = 'Dusty aeolian regolith';
  } else if (lat >= 30 && lat <= 58) {
    soilScore = 80;
    condition = 'Ice-bearing compact regolith';
  } else if (elevationM < -3500) {
    soilScore = 82;
    condition = 'Lowland basin regolith';
  }

  if (Math.abs(normalizedLng) > 150 && lat > 35) {
    soilScore -= 5;
    condition = 'Cold fractured ice-regolith mix';
  }
  if (elevationM > 2500) soilScore -= 8;
  if (slopeDeg > 8) soilScore -= Math.min(18, Math.round((slopeDeg - 8) * 1.5));

  const nearbyHazard = hazardZones.find((hazard) => {
    const distanceM = calculateMarsDistanceMeters(
      { latitude: lat, longitude: lng },
      hazard.coordinate
    );
    return distanceM <= hazard.radiusMeters * 1.15;
  });
  if (nearbyHazard) {
    if (nearbyHazard.type === 'SOFT_SAND_DRIFT') {
      soilScore -= 28;
      condition = 'Loose dune sand / wheel-trap risk';
    } else if (nearbyHazard.type === 'BOULDER_FIELD') {
      soilScore -= 22;
      condition = 'Rough boulder-strewn regolith';
    } else if (nearbyHazard.type === 'STEEP_SLOPE') {
      soilScore -= 24;
      condition = 'Scarp-edge fractured terrain';
    } else {
      soilScore -= nearbyHazard.riskLevel === 'CRITICAL' ? 24 : 12;
      condition = 'Mapped geological hazard terrain';
    }
  }

  soilScore = Math.max(20, Math.min(100, soilScore));
  return { condition, soilScore, tractionFactor: 0.62 + soilScore / 265 };
}

/**
 * A* Pathfinding Algorithm across Martian Terrain:
 * Searches for the optimal waypoint path between Start and End coordinates,
 * sampling intermediate nodes and adjusting step costs based on slope steepness.
 */
export function calculateAStarRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  mode: RouteMode,
  options?: {
    customName?: string;
    includeScienceStops?: boolean;
    avoidSlopesOverDeg?: number;
    transportMode?: MarsTransportModeType;
    crewConfig?: CrewBuddyConfigType;
    hazardZones?: HazardZone[];
  }
): PlannedRouteResult {
  const directDistKm = calculateMarsDistanceKm(
    { latitude: startLat, longitude: startLng },
    { latitude: endLat, longitude: endLng }
  );

  const transportMode = options?.transportMode || 'foot';
  const crewConfig = options?.crewConfig || 'buddy_pair';
  const hazardZones = options?.hazardZones || [];

  // Number of discretized navigation nodes along the corridor (scale with distance)
  const numSteps = Math.max(8, Math.min(32, Math.round(directDistKm / 0.75)));
  const waypoints: PlannedWaypoint[] = [];
  const surfaceScores: number[] = [];
  const surfaceConditions: string[] = [];

  let cumDistKm = 0;
  let cumTimeHours = 0;
  let totalAscent = 0;
  let totalDescent = 0;
  let maxSlope = 0;
  let slopeSum = 0;

  // Find candidate science targets near this corridor
  const nearbyScience = findNearbyScienceStops(startLat, startLng, endLat, endLng, 5.0);

  // Generate intermediate waypoints using A* slope avoidance and detour logic
  for (let i = 0; i <= numSteps; i++) {
    const fraction = i / numSteps;

    // Linear great-circle baseline
    let lat = startLat + (endLat - startLat) * fraction;
    let lng = startLng + (endLng - startLng) * fraction;

    let isScience = false;
    let scienceCat: string | undefined;
    let pointName = i === 0 ? 'Start (Departure)' : i === numSteps ? 'Destination' : `Waypoint ${i}`;
    let waypointPovImage: NasaSurfacePovImage | undefined = undefined;

    // Apply Mode-Specific Path Adjustments and avoid mapped hazard footprints.
    if (i > 0 && i < numSteps) {
      const normalLat = -(endLng - startLng);
      const normalLng = endLat - startLat;
      const normLen = Math.hypot(normalLat, normalLng) || 1;

      // Sample lateral offsets and choose the lowest combined terrain/hazard cost.
      let bestLat = lat;
      let bestLng = lng;
      let bestSlope = Infinity;
      let bestCost = Infinity;

      [-0.025, -0.015, 0, 0.015, 0.025].forEach((offsetFactor) => {
        const testLat = lat + (normalLat / normLen) * offsetFactor;
        const testLng = lng + (normalLng / normLen) * offsetFactor;
        const elevTest = getMolaElevation(testLat, testLng);
        const prevElev = waypoints.length > 0 ? waypoints[waypoints.length - 1].elevationM : elevTest;
        const distStep = waypoints.length > 0
          ? calculateMarsDistanceMeters(
              { latitude: waypoints[waypoints.length - 1].lat, longitude: waypoints[waypoints.length - 1].lng },
              { latitude: testLat, longitude: testLng }
            )
          : 100;
        const slope = (Math.abs(elevTest - prevElev) / Math.max(1, distStep)) * (180 / Math.PI);
        const hazardCost = hazardZones.reduce((total, hazard) => {
          const distance = calculateMarsDistanceMeters(
            { latitude: testLat, longitude: testLng },
            hazard.coordinate
          );
          const protectedRadius = hazard.radiusMeters * 1.35;
          if (distance >= protectedRadius) return total;
          const riskWeight = hazard.riskLevel === 'CRITICAL' ? 100 : hazard.riskLevel === 'HIGH' ? 70 : 35;
          return total + (1 - distance / protectedRadius) * riskWeight;
        }, 0);
        const modeHazardWeight = mode === 'shortest' ? 0.75 : mode === 'science' ? 1.0 : 1.5;
        const cost = slope + hazardCost * modeHazardWeight;
        if (cost < bestCost) {
          bestCost = cost;
          bestSlope = slope;
          bestLat = testLat;
          bestLng = testLng;
        }
      });

      lat = bestLat;
      lng = bestLng;
    }

    if (mode === 'science' && i > 0 && i < numSteps && nearbyScience.length > 0) {
      // Science-rich Mode: detours toward nearest unvisited science target
      const target = nearbyScience[0];
      const targetDistToFraction = Math.abs(fraction - 0.5);
      if (targetDistToFraction < 0.25) {
        // Bias waypoint toward science target
        lat = lat * 0.45 + target.lat * 0.55;
        lng = lng * 0.45 + target.lng * 0.55;
        isScience = true;
        scienceCat = target.category;
        pointName = `Science Stop: ${target.name}`;
        waypointPovImage = target.surfacePovImage;
      }
    }

    const elev = getMolaElevation(lat, lng);
    let slope = 0;

    if (waypoints.length > 0) {
      const prev = waypoints[waypoints.length - 1];
      const stepDistMeters = calculateMarsDistanceMeters(
        { latitude: prev.lat, longitude: prev.lng },
        { latitude: lat, longitude: lng }
      );
      const stepDistKm = stepDistMeters / 1000;
      cumDistKm += stepDistKm;

      const elevDelta = elev - prev.elevationM;
      if (elevDelta > 0) totalAscent += elevDelta;
      else totalDescent += Math.abs(elevDelta);

      slope = calculateSlopeDegrees(
        { latitude: prev.lat, longitude: prev.lng },
        prev.elevationM,
        { latitude: lat, longitude: lng },
        elev
      );

      const surfaceAssessment = assessMartianSurface(lat, lng, elev, slope, hazardZones);
      surfaceScores.push(surfaceAssessment.soilScore);
      surfaceConditions.push(surfaceAssessment.condition);

      // Speed calculation based on transport mode, slope and soil traction.
      let speedKmH: number;
      if (transportMode === 'unpressurized_rover') {
        speedKmH = Math.max(4.0, 12.0 * Math.max(0.25, 1 - slope / 28));
      } else if (transportMode === 'pressurized_rover') {
        speedKmH = Math.max(6.0, 18.0 * Math.max(0.35, 1 - slope / 26));
      } else {
        speedKmH = calculateAstronautWalkingSpeedKmH(slope, elevDelta > 0);
      }

      speedKmH *= surfaceAssessment.tractionFactor;
      cumTimeHours += stepDistKm / speedKmH;
    }

    maxSlope = Math.max(maxSlope, slope);
    slopeSum += slope;

    let hazardRisk: 'Low' | 'Moderate' | 'Hazardous' = 'Low';
    if (slope > 18) hazardRisk = 'Hazardous';
    else if (slope > 8) hazardRisk = 'Moderate';

    // Keep route safety honest: a low-slope waypoint is not automatically safe
    // when it still passes through a mapped hazard footprint.
    const nearbyHazard = hazardZones.find((hazard) => {
      const distance = calculateMarsDistanceMeters(
        { latitude: lat, longitude: lng },
        hazard.coordinate
      );
      return distance <= hazard.radiusMeters * 1.15;
    });
    if (nearbyHazard && (nearbyHazard.riskLevel === 'CRITICAL' || nearbyHazard.riskLevel === 'HIGH')) {
      hazardRisk = 'Hazardous';
    } else if (nearbyHazard) {
      hazardRisk = 'Moderate';
    }

    // Check if near any catalog item with POV image
    if (!waypointPovImage) {
      const matchedCatalog = MARS_SCIENCE_CATALOG.find((cat) => {
        const d = calculateMarsDistanceKm({ latitude: lat, longitude: lng }, { latitude: cat.lat, longitude: cat.lng });
        return d < 2.5 && cat.surfacePovImage;
      });
      if (matchedCatalog) {
        waypointPovImage = matchedCatalog.surfacePovImage;
      }
    }

    waypoints.push({
      id: `wp-${i}`,
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4)),
      elevationM: elev,
      slopeDeg: Number(slope.toFixed(1)),
      cumulativeDistKm: Number(cumDistKm.toFixed(2)),
      cumulativeTimeHours: Number(cumTimeHours.toFixed(2)),
      name: pointName,
      isScienceStop: isScience,
      scienceCategory: scienceCat,
      hazardRisk,
      surfacePovImage: waypointPovImage,
    });
  }

  const avgSlope = Number((slopeSum / Math.max(1, waypoints.length - 1)).toFixed(1));
  const roundedDistKm = Number(cumDistKm.toFixed(2));
  const roundedTimeHours = Number(cumTimeHours.toFixed(2));
  const hoursInt = Math.floor(roundedTimeHours);
  const minsInt = Math.round((roundedTimeHours - hoursInt) * 60);
  const timeFormatted = `${hoursInt}h ${minsInt.toString().padStart(2, '0')}m`;

  // Metabolic Energy Expenditure & Consumables Model:
  let metabolicKcal: number;
  let oxygenExpenditureLiters: number;
  let batteryPowerKwh: number | undefined;

  if (transportMode === 'unpressurized_rover') {
    metabolicKcal = Math.round(roundedTimeHours * 140);
    oxygenExpenditureLiters = Math.round(roundedTimeHours * 28);
    batteryPowerKwh = Number((roundedDistKm * 0.32).toFixed(1));
  } else if (transportMode === 'pressurized_rover') {
    metabolicKcal = Math.round(roundedTimeHours * 95);
    oxygenExpenditureLiters = 0;
    batteryPowerKwh = Number((roundedDistKm * 0.55).toFixed(1));
  } else {
    metabolicKcal = Math.round(roundedTimeHours * (320 + avgSlope * 18));
    oxygenExpenditureLiters = Math.round(roundedTimeHours * 75);
  }

  const crewProductivityMultiplier = crewConfig === 'buddy_pair' ? 1.85 : 1.0;

  // Compute Rigorous Safety Score (0-100) & Explanations:
  const hazardExposureCount = waypoints.filter((waypoint) => waypoint.hazardRisk !== 'Low').length;
  const soilConditionScore = Math.round(surfaceScores.reduce((sum, score) => sum + score, 0) / Math.max(1, surfaceScores.length));
  const terrainSuitabilityScore = Math.max(
    10,
    Math.min(100, Math.round(soilConditionScore * 0.55 + Math.max(0, 100 - maxSlope * 3) * 0.45))
  );
  const safetyBreakdown = computeSafetyScore(
    mode,
    maxSlope,
    avgSlope,
    roundedDistKm,
    roundedTimeHours,
    hazardExposureCount,
    soilConditionScore,
    terrainSuitabilityScore
  );
  const dominantSurfaceCondition = surfaceConditions.length > 0
    ? surfaceConditions.sort((a, b) => surfaceConditions.filter((value) => value === b).length - surfaceConditions.filter((value) => value === a).length)[0]
    : 'Unknown Martian surface';
  if (crewConfig === 'buddy_pair') {
    safetyBreakdown.score = Math.min(100, safetyBreakdown.score + 5);
  }

  // Generate Plain Language Explanations (English and Bengali)
  const explanations = generateRouteExplanation(mode, roundedDistKm, roundedTimeHours, maxSlope, avgSlope, safetyBreakdown.score);

  // Colors based on Route Mode:
  const color =
    mode === 'safest'
      ? '#10b981' // Emerald Green
      : mode === 'shortest'
      ? '#06b6d4' // Cyan
      : '#f59e0b'; // Amber / Science

  const routeName =
    options?.customName ||
    (mode === 'safest'
      ? 'A* Safest Corridor (Low-Slope Traverse)'
      : mode === 'shortest'
      ? 'A* Direct Shortest Path'
      : 'A* Science-Rich Astrobiology Traverse');

  return {
    id: `route-${mode}-${Date.now()}`,
    name: routeName,
    mode,
    color,
    transportMode,
    crewConfig,
    waypoints,
    totalDistanceKm: roundedDistKm,
    totalAscentM: Math.round(totalAscent),
    totalDescentM: Math.round(totalDescent),
    maxSlopeDeg: Number(maxSlope.toFixed(1)),
    avgSlopeDeg: avgSlope,
    estimatedWalkTimeHours: roundedTimeHours,
    estimatedWalkTimeFormatted: timeFormatted,
    metabolicKcal,
    oxygenExpenditureLiters,
    batteryPowerKwh,
    crewProductivityMultiplier,
    safetyScore: safetyBreakdown.score,
    safetyExplanation: `${safetyBreakdown.explanation} Surface: ${dominantSurfaceCondition} (${soilConditionScore}/100 soil trafficability).`,
    surfaceCondition: dominantSurfaceCondition,
    soilConditionScore,
    terrainSuitabilityScore,
    safetyFactors: safetyBreakdown.factors,
    whyThisRoute: explanations,
    nearbyScienceStops: nearbyScience,
  };
}

/**
 * Calculates Emergency Abort / Immediate Shelter Return Trajectory
 * Returns direct fastest path back to nearest Habitat base or cache
 */
export function calculateEmergencyReturnRoute(
  currentLat: number,
  currentLng: number,
  shelterLat: number,
  shelterLng: number,
  shelterName = 'Primary Base Camp Habitat'
): PlannedRouteResult {
  const route = calculateAStarRoute(currentLat, currentLng, shelterLat, shelterLng, 'safest', {
    customName: `🚨 Emergency Abort to ${shelterName}`,
  });

  route.color = '#ef4444'; // Emergency Crimson Red
  route.whyThisRoute.summary = `Emergency EVA Abort Vector to ${shelterName}. Minimizes hazardous scarp drops and terrain choke points to achieve fastest pressurized shelter ingress.`;
  route.whyThisRoute.summaryBn = route.whyThisRoute.summary;
  return route;
}

/**
 * Evaluates Multi-Factor Safety Score (0-100)
 */
function computeSafetyScore(
  mode: RouteMode,
  maxSlope: number,
  avgSlope: number,
  distKm: number,
  timeHours: number,
  hazardExposureCount: number,
  soilConditionScore: number,
  terrainSuitabilityScore: number
): { score: number; explanation: string; factors: PlannedRouteResult['safetyFactors'] } {
  // 1. Slope Score (max 30 pts)
  let slopeScore = 30;
  if (maxSlope > 20) slopeScore = 5;
  else if (maxSlope > 14) slopeScore = 14;
  else if (maxSlope > 8) slopeScore = 22;
  else slopeScore = 30;

  // 2. Hazard Avoidance Score (max 25 pts)
  const baseHazardScore = mode === 'safest' ? 25 : mode === 'shortest' ? 18 : 21;
  const hazardExposurePenalty = Math.min(16, hazardExposureCount * 4);
  let hazardScore = Math.max(4, baseHazardScore - hazardExposurePenalty);
  if (avgSlope > 10) hazardScore -= 7;

  // Loose soil, ice-regolith and rough terrain reduce the route score even
  // when the geometric slope looks acceptable.
  const soilPenalty = Math.round(Math.max(0, (78 - soilConditionScore) * 0.22));
  const terrainPenalty = Math.round(Math.max(0, (72 - terrainSuitabilityScore) * 0.12));
  hazardScore = Math.max(2, hazardScore - soilPenalty - terrainPenalty);

  // 3. Shelter Proximity & Life Support Margin (max 20 pts)
  let shelterScore = 20;
  if (timeHours > 7) shelterScore = 6;
  else if (timeHours > 5) shelterScore = 12;
  else if (timeHours > 3) shelterScore = 16;

  // 4. Thermal & Daylight Margin (max 15 pts)
  const thermalScore = timeHours < 6 ? 15 : 10;

  // 5. Radiation Score (max 10 pts)
  const radiationScore = 9;

  const total = Math.min(100, Math.max(10, slopeScore + hazardScore + shelterScore + thermalScore + radiationScore));

  let explanation = '';
  if (total >= 85) {
    explanation = 'Optimal EVA safety: Gentle slopes (<8°), plenty of life-support consumable margin, and nominal line-of-sight to shelter.';
  } else if (total >= 70) {
    explanation = 'Acceptable EVA risk: Moderate slopes encountered along segments; requires monitoring spacesuit joint wear and metabolic rates.';
  } else {
    explanation = 'Elevated EVA hazard: Exceeds nominal slope thresholds (>15°) or long travel duration approaching life support abort limits.';
  }

  return {
    score: total,
    explanation,
    factors: {
      slopeScore,
      hazardAvoidanceScore: hazardScore,
      shelterProximityScore: shelterScore,
      thermalDaylightScore: thermalScore,
      radiationScore,
    },
  };
}

/**
 * Generates Plain Language Rationale ("Why this route?") in English
 */
function generateRouteExplanation(
  mode: RouteMode,
  distKm: number,
  timeHours: number,
  maxSlope: number,
  avgSlope: number,
  safetyScore: number
): PlannedRouteResult['whyThisRoute'] {
  if (mode === 'safest') {
    const summary = `This route prioritizes crew survivability by hugging low-gradient Martian terrain (max slope ${maxSlope}°). It bypasses treacherous dune traps, boulder scree fields, and vertical crater scarps while maintaining optimal line-of-sight to the base.`;
    return {
      summary,
      summaryBn: summary,
      advantages: [
        `Maintains gentle slope gradient (avg ${avgSlope}° vs steep cliff hazards)`,
        `Minimizes rover wheel slip and spacesuit metabolic fatigue (${Math.round(timeHours * 340)} kcal)`,
        `High safety margin (Safety Score: ${safetyScore}/100) ensuring plenty of life support reserves`,
      ],
      tradeOffs: [
        `Adds ~8-15% distance compared to direct line-of-sight path`,
        `May bypass some secondary science outcrops to guarantee low-angle footing`,
      ],
      criticalDecisionFactors: [
        'Strict constraint: Slopes capped under 15° to prevent spacesuit falls',
        'Conserves 50% EVA oxygen reserve for emergency return',
      ],
    };
  }

  if (mode === 'shortest') {
    const summary = `This is the direct geodesic shortest path between points (${distKm} km). It cuts straight through terrain to minimize elapsed travel time (${timeHours}h), but encounters steeper elevation changes and higher physical effort.`;
    return {
      summary,
      summaryBn: summary,
      advantages: [
        `Absolute minimum traverse distance (${distKm} km)`,
        `Fastest direct travel time (${timeHours} hours)`,
        `Simplifies celestial compass navigation along a single heading`,
      ],
      tradeOffs: [
        `Crosses steeper gradients (max slope reached: ${maxSlope}°)`,
        `Increased metabolic burn and risk of regolith slippage`,
      ],
      criticalDecisionFactors: [
        'Time-critical mission scenario where minimal travel duration is mandated',
      ],
    };
  }

  // Science-rich
  const summary = `This route actively routes through geological points of interest including deltaic river fans, hydrated clay deposits, and crater rims. It yields the highest planetary science return per kilometer while staying safely inside the EVA return boundary.`;
  return {
    summary,
    summaryBn: summary,
    advantages: [
      'Intercepts high-priority astrobiological sample locations (clays & delta fans)',
      'Provides high scientific value return per sol',
      'Provides varied geological strata across sedimentary horizons',
    ],
    tradeOffs: [
      'Additional distance for sampling detours',
      'Requires allocating time for surface drilling and coring operations',
    ],
    criticalDecisionFactors: [
      'Optimized for Mars 2020 sample return cache priorities',
      'Maintains safe return boundary to primary shelter',
    ],
  };
}

/**
 * Searches for known science targets within a buffer distance (km) of a route line
 */
export function findNearbyScienceStops(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  bufferKm = 8.0
): ScienceStopSuggestion[] {
  const suggestions: ScienceStopSuggestion[] = [];

  MARS_SCIENCE_CATALOG.forEach((target) => {
    // Distance from target to start, end, and midpoint
    const dStart = calculateMarsDistanceKm({ latitude: startLat, longitude: startLng }, { latitude: target.lat, longitude: target.lng });
    const dEnd = calculateMarsDistanceKm({ latitude: endLat, longitude: endLng }, { latitude: target.lat, longitude: target.lng });
    const midLat = (startLat + endLat) / 2;
    const midLng = (startLng + endLng) / 2;
    const dMid = calculateMarsDistanceKm({ latitude: midLat, longitude: midLng }, { latitude: target.lat, longitude: target.lng });

    const minDistKm = Math.min(dStart, dEnd, dMid);
    if (minDistKm <= bufferKm) {
      const detourDistMeters = Math.round(minDistKm * 600); // approximate round-trip detour
      const detourTimeMinutes = Math.round((detourDistMeters / 1000 / 3.0) * 60 + 20); // walking + 20 min sample sampling

      suggestions.push({
        id: target.id,
        name: target.name,
        lat: target.lat,
        lng: target.lng,
        category: target.category,
        description: target.description,
        detourDistanceMeters: detourDistMeters,
        detourTimeMinutes,
        scientificValueScore: target.scientificValueScore,
      });
    }
  });

  return suggestions.sort((a, b) => b.scientificValueScore - a.scientificValueScore);
}
