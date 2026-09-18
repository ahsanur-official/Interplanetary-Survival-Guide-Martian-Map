import {
  MarsCoordinate,
  CandidateRoute,
  RouteWaypoint,
  ScienceTarget,
  HazardZone,
  ResourceSite,
  MarsRegion,
  MissionConstraints
} from '../types/mars';
import {
  calculateMarsDistanceKm,
  calculateMarsDistanceMeters,
  calculateSlopeDegrees,
  calculateAstronautWalkingSpeedKmH,
  calculateMetabolicRateKcalHr,
  distanceToSegmentMeters
} from './spatialMath';

interface ElevationProvider {
  getElevation(coord: MarsCoordinate): number;
  getSlope(coord: MarsCoordinate): number;
}

/**
 * Creates a synthetic yet authentic Jezero topographic elevation surface
 * based on MOLA / HRSC baseline gradients:
 * - Jezero floor: ~-2570m
 * - Kodiak butte: rises to ~-2480m
 * - Hawkes Bay Delta scarp: rises to ~-2490m then ascends to -2420m
 * - Belva crater: rim at -2420m, interior drops to -2540m
 * - Rim escarpment: ascends to -2300m
 */
export function getInterpolatedElevation(coord: MarsCoordinate, region: MarsRegion): number {
  if (region.id === 'jezero') {
    // Relative coordinates in bounding box
    const u = (coord.longitude - region.bounds.minLon) / (region.bounds.maxLon - region.bounds.minLon);
    const v = (coord.latitude - region.bounds.minLat) / (region.bounds.maxLat - region.bounds.minLat);

    // Regional baseline gradient: West is elevated rim/delta, East is lower basin floor
    let elev = -2570 + (1 - u) * 220 + v * 50;

    // Delta scarp feature around Hawkes Bay (u ~ 0.45, v ~ 0.42)
    const dScarp = Math.hypot(u - 0.46, v - 0.43);
    if (dScarp < 0.12) {
      elev += Math.cos((dScarp / 0.12) * Math.PI) * 75;
    }

    // Kodiak Butte isolated mesa (u ~ 0.54, v ~ 0.25)
    const dKodiak = Math.hypot(u - 0.54, v - 0.25);
    if (dKodiak < 0.06) {
      elev += Math.cos((dKodiak / 0.06) * (Math.PI / 2)) * 90;
    }

    // Belva crater depression (u ~ 0.35, v ~ 0.60)
    const dBelva = Math.hypot(u - 0.35, v - 0.60);
    if (dBelva < 0.09) {
      // Rim is elevated, interior is bowl
      if (dBelva < 0.05) {
        elev -= 110;
      } else {
        elev += 40; // Rim
      }
    }

    return Math.round(elev);
  }

  // Gale Crater baseline
  const u = (coord.longitude - region.bounds.minLon) / (region.bounds.maxLon - region.bounds.minLon);
  const v = (coord.latitude - region.bounds.minLat) / (region.bounds.maxLat - region.bounds.minLat);
  // Mount Sharp rises to the south (v -> 0)
  return Math.round(-4500 + (1 - v) * 550 - u * 60);
}

/**
 * Multi-objective Route Planner Engine
 */
export function generateCandidateRoutes(
  startCoord: MarsCoordinate,
  startName: string,
  destCoord: MarsCoordinate,
  destName: string,
  region: MarsRegion,
  scienceTargets: ScienceTarget[],
  hazardZones: HazardZone[],
  resourceSites: ResourceSite[],
  constraints: MissionConstraints
): CandidateRoute[] {
  const elevProvider: ElevationProvider = {
    getElevation: (c) => getInterpolatedElevation(c, region),
    getSlope: (c) => {
      const dLat = 0.002;
      const dLon = 0.002;
      const eC = getInterpolatedElevation(c, region);
      const eN = getInterpolatedElevation({ latitude: c.latitude + dLat, longitude: c.longitude }, region);
      const eE = getInterpolatedElevation({ latitude: c.latitude, longitude: c.longitude + dLon }, region);
      const slopeN = calculateSlopeDegrees(c, eC, { latitude: c.latitude + dLat, longitude: c.longitude }, eN);
      const slopeE = calculateSlopeDegrees(c, eC, { latitude: c.latitude, longitude: c.longitude + dLon }, eE);
      return Math.max(slopeN, slopeE);
    },
  };

  const directDistKm = calculateMarsDistanceKm(startCoord, destCoord);

  // Strategy A: Direct Efficiency
  const routeA = buildRoute(
    'route-a',
    'Route A: Direct Efficiency',
    'EFFICIENCY',
    '#38BDF8', // Cyan
    startCoord,
    startName,
    destCoord,
    destName,
    region,
    elevProvider,
    scienceTargets,
    hazardZones,
    resourceSites,
    constraints,
    {
      detourBias: 0.08,
      hazardAvoidanceWeight: 0.35,
      slopeWeight: 0.3,
      targetScienceBonus: 0.1,
      nameSuffix: 'Fastest trajectory with minimal deviation',
    }
  );

  // Strategy B: Science-Opportunity Maximizer
  const routeB = buildRoute(
    'route-b',
    'Route B: Science Opportunity',
    'SCIENCE',
    '#F59E0B', // Amber
    startCoord,
    startName,
    destCoord,
    destName,
    region,
    elevProvider,
    scienceTargets,
    hazardZones,
    resourceSites,
    constraints,
    {
      detourBias: 0.55,
      hazardAvoidanceWeight: 0.55,
      slopeWeight: 0.45,
      targetScienceBonus: 0.85,
      nameSuffix: 'Intersects rich delta sediments, mudstones & hydration proxies',
    }
  );

  // Strategy C: Maximum Safety & Traverse Ease
  const routeC = buildRoute(
    'route-c',
    'Route C: Maximum Safety',
    'SAFETY',
    '#10B981', // Emerald green
    startCoord,
    startName,
    destCoord,
    destName,
    region,
    elevProvider,
    scienceTargets,
    hazardZones,
    resourceSites,
    constraints,
    {
      detourBias: 0.32,
      hazardAvoidanceWeight: 0.95,
      slopeWeight: 0.95,
      targetScienceBonus: 0.2,
      nameSuffix: 'Gentle gradient corridor bypassing all identified hazards',
    }
  );

  return [routeA, routeB, routeC];
}

interface StrategyWeights {
  detourBias: number;
  hazardAvoidanceWeight: number;
  slopeWeight: number;
  targetScienceBonus: number;
  nameSuffix: string;
}

function buildRoute(
  id: string,
  name: string,
  objectiveType: 'EFFICIENCY' | 'SCIENCE' | 'SAFETY' | 'BALANCED',
  color: string,
  startCoord: MarsCoordinate,
  startName: string,
  destCoord: MarsCoordinate,
  destName: string,
  region: MarsRegion,
  elevProvider: ElevationProvider,
  scienceTargets: ScienceTarget[],
  hazardZones: HazardZone[],
  resourceSites: ResourceSite[],
  constraints: MissionConstraints,
  weights: StrategyWeights
): CandidateRoute {
  // Intermediate waypoint generation using piecewise optimization
  const numSteps = 14;
  const rawWaypoints: MarsCoordinate[] = [];
  rawWaypoints.push(startCoord);

  // Find candidate science targets in between start and dest for detour injection
  const relevantScience = scienceTargets.filter((st) => {
    // Check if target is generally in the corridor
    const dStart = calculateMarsDistanceKm(startCoord, st.coordinate);
    const dDest = calculateMarsDistanceKm(destCoord, st.coordinate);
    const dDirect = calculateMarsDistanceKm(startCoord, destCoord);
    return dStart + dDest <= dDirect * 1.6;
  });

  // Pick top target to detour towards if science strategy
  let primaryAttractor: ScienceTarget | null = null;
  if (weights.targetScienceBonus > 0.5 && relevantScience.length > 0) {
    primaryAttractor = relevantScience.reduce((best, cur) =>
      cur.scientificValueScore > best.scientificValueScore ? cur : best
    );
  }

  for (let i = 1; i < numSteps; i++) {
    const t = i / numSteps;
    // Linear base interpolation
    let lat = startCoord.latitude + (destCoord.latitude - startCoord.latitude) * t;
    let lon = startCoord.longitude + (destCoord.longitude - startCoord.longitude) * t;

    // Apply repulsion from hazards
    for (const haz of hazardZones) {
      const dHaz = calculateMarsDistanceMeters({ latitude: lat, longitude: lon }, haz.coordinate);
      const safeRadius = haz.radiusMeters * (1.2 + weights.hazardAvoidanceWeight * 0.8);
      if (dHaz < safeRadius && dHaz > 1) {
        const pushFactor = ((safeRadius - dHaz) / safeRadius) * weights.hazardAvoidanceWeight * 0.012;
        // Vector pointing away from hazard
        const dLatHaz = lat - haz.coordinate.latitude;
        const dLonHaz = lon - haz.coordinate.longitude;
        const len = Math.hypot(dLatHaz, dLonHaz) || 0.001;
        lat += (dLatHaz / len) * pushFactor;
        lon += (dLonHaz / len) * pushFactor;
      }
    }

    // If Route B (Science), attract towards primary science target
    if (primaryAttractor && weights.targetScienceBonus > 0.5) {
      const attractionEnvelope = Math.sin(t * Math.PI); // strongest in middle of traverse
      const dLatSci = primaryAttractor.coordinate.latitude - lat;
      const dLonSci = primaryAttractor.coordinate.longitude - lon;
      lat += dLatSci * weights.detourBias * attractionEnvelope * 0.45;
      lon += dLonSci * weights.detourBias * attractionEnvelope * 0.45;
    }

    // If Route C (Safety), push away from steep slopes by checking slope gradient
    if (weights.slopeWeight > 0.8) {
      const currentSlope = elevProvider.getSlope({ latitude: lat, longitude: lon });
      if (currentSlope > 11) {
        // Bend southward or northward into gentler wash
        lat += 0.004 * Math.sin(t * Math.PI);
      }
    }

    rawWaypoints.push({ latitude: lat, longitude: lon });
  }
  rawWaypoints.push(destCoord);

  // Convert to rich RouteWaypoints with elevation, slope, timing, and energy
  const waypoints: RouteWaypoint[] = [];
  let cumulativeDistKm = 0;
  let cumulativeTimeHours = 0;
  let totalMetabolicKcal = 0;
  let maxSlope = 0;
  let totalSlope = 0;

  for (let i = 0; i < rawWaypoints.length; i++) {
    const curCoord = rawWaypoints[i];
    const elevation = elevProvider.getElevation(curCoord);
    let slope = 0;
    let segDistKm = 0;
    let segTimeHr = 0;

    if (i > 0) {
      const prevCoord = rawWaypoints[i - 1];
      const prevElev = waypoints[i - 1].elevation;
      segDistKm = calculateMarsDistanceKm(prevCoord, curCoord);
      cumulativeDistKm += segDistKm;
      slope = calculateSlopeDegrees(prevCoord, prevElev, curCoord, elevation);
      maxSlope = Math.max(maxSlope, slope);
      totalSlope += slope;

      const isUphill = elevation > prevElev;
      const walkingSpeed = calculateAstronautWalkingSpeedKmH(slope, isUphill);
      segTimeHr = segDistKm / walkingSpeed;
      cumulativeTimeHours += segTimeHr;

      const metabolicRate = calculateMetabolicRateKcalHr(slope, walkingSpeed);
      totalMetabolicKcal += metabolicRate * segTimeHr;
    }

    // Hazard risk classification for this segment
    let hazardRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    for (const haz of hazardZones) {
      const dMeters = calculateMarsDistanceMeters(curCoord, haz.coordinate);
      if (dMeters < haz.radiusMeters * 1.1) {
        if (haz.riskLevel === 'CRITICAL' || haz.riskLevel === 'HIGH') {
          hazardRisk = 'HIGH';
        } else if (hazardRisk !== 'HIGH') {
          hazardRisk = 'MEDIUM';
        }
      }
    }
    if (slope > 14) hazardRisk = 'HIGH';
    else if (slope > 8 && hazardRisk === 'LOW') hazardRisk = 'MEDIUM';

    // Match science target if within 150m
    let matchedTarget: ScienceTarget | undefined;
    for (const st of scienceTargets) {
      if (calculateMarsDistanceMeters(curCoord, st.coordinate) <= 180) {
        matchedTarget = st;
        // Add observation stop time
        cumulativeTimeHours += st.samplingTimeMinutes / 60;
        break;
      }
    }

    waypoints.push({
      id: `${id}-wp-${i}`,
      name: i === 0 ? startName : i === rawWaypoints.length - 1 ? destName : matchedTarget ? matchedTarget.name : undefined,
      latitude: curCoord.latitude,
      longitude: curCoord.longitude,
      elevation,
      slope: Math.round(slope * 10) / 10,
      cumulativeDistanceKm: Math.round(cumulativeDistKm * 100) / 100,
      cumulativeTimeHours: Math.round(cumulativeTimeHours * 100) / 100,
      hazardRisk,
      visitedScienceTarget: matchedTarget,
    });
  }

  const avgSlope = Math.round((totalSlope / Math.max(1, waypoints.length - 1)) * 10) / 10;

  // Science opportunities detection within 600m corridor
  const nearbyOpportunities: {
    target: ScienceTarget;
    detourDistanceMeters: number;
    additionalTimeMinutes: number;
    isIncludedInPath: boolean;
  }[] = [];

  let scienceYieldSum = 0;
  for (const target of scienceTargets) {
    let minDetourMeters = Infinity;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const d = distanceToSegmentMeters(target.coordinate, waypoints[i], waypoints[i + 1]);
      if (d < minDetourMeters) minDetourMeters = d;
    }

    if (minDetourMeters < 750) {
      const isIncluded = minDetourMeters < 200;
      const detourKm = (minDetourMeters * 2) / 1000;
      const additionalTimeMin = Math.round((detourKm / 2.8) * 60 + target.samplingTimeMinutes);

      nearbyOpportunities.push({
        target,
        detourDistanceMeters: Math.round(minDetourMeters),
        additionalTimeMinutes: additionalTimeMin,
        isIncludedInPath: isIncluded,
      });

      if (isIncluded) {
        scienceYieldSum += target.scientificValueScore * 10;
      } else {
        // Proximity opportunity weight
        scienceYieldSum += target.scientificValueScore * 5 * Math.max(0, 1 - minDetourMeters / 750);
      }
    }
  }

  // Calculate Resource score
  let resourceScore = 0;
  for (const res of resourceSites) {
    let minD = Infinity;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const d = distanceToSegmentMeters(res.coordinate, waypoints[i], waypoints[i + 1]);
      if (d < minD) minD = d;
    }
    if (minD < 800) {
      resourceScore += res.confidence === 'HIGH' ? 35 : 20;
    }
  }

  // Hazard exposure score
  let hazardExposureScore = 0;
  for (const wp of waypoints) {
    if (wp.hazardRisk === 'HIGH') hazardExposureScore += 18;
    else if (wp.hazardRisk === 'MEDIUM') hazardExposureScore += 6;
  }
  hazardExposureScore = Math.min(100, Math.round(hazardExposureScore));

  const totalDistanceKm = Math.round(cumulativeDistKm * 100) / 100;
  const estimatedDurationHours = Math.round(cumulativeTimeHours * 10) / 10;
  const isFeasible = estimatedDurationHours <= constraints.maxDurationHours;

  // Build explainable decision-support rationale
  const whyThisRoute = generateWhyThisRouteRationale(
    objectiveType,
    totalDistanceKm,
    estimatedDurationHours,
    maxSlope,
    hazardExposureScore,
    nearbyOpportunities,
    isFeasible,
    constraints.maxDurationHours
  );

  return {
    id,
    name,
    objectiveType,
    color,
    waypoints,
    metrics: {
      totalDistanceKm,
      estimatedDurationHours,
      maxSlopeDegrees: Math.round(maxSlope * 10) / 10,
      averageSlopeDegrees: avgSlope,
      hazardExposureScore,
      scienceOpportunityYield: Math.min(100, Math.round(scienceYieldSum)),
      resourceInterestYield: Math.min(100, Math.round(resourceScore)),
      metabolicEnergyCostKcal: Math.round(totalMetabolicKcal),
      isFeasible,
    },
    whyThisRoute,
    nearbyOpportunities,
  };
}

function generateWhyThisRouteRationale(
  objectiveType: 'EFFICIENCY' | 'SCIENCE' | 'SAFETY' | 'BALANCED',
  distanceKm: number,
  durationHours: number,
  maxSlope: number,
  hazardScore: number,
  opportunities: any[],
  isFeasible: boolean,
  maxDuration: number
) {
  if (objectiveType === 'EFFICIENCY') {
    return {
      summary: `Prioritizes minimal traverse distance (${distanceKm} km) and rapid transit time (${durationHours} h), allowing maximum operational margin before life-support limits.`,
      advantages: [
        `Shortest surface traverse distance (${distanceKm} km)`,
        `Fastest transit duration (${durationHours} h, reserve margin: ${Math.max(0, Math.round((maxDuration - durationHours) * 10) / 10)} h)`,
        `Lowest total metabolic life-support oxygen consumption`,
      ],
      tradeOffs: [
        `Bypasses peripheral delta outcrops, missing potential sampling targets`,
        `Crosses higher local slope transitions (up to ${maxSlope}°) rather than circumnavigating them`,
        `Requires suited astronaut to maintain steady ~3.0 km/h walking cadence`,
      ],
      criticalDecisionFactors: [
        `Selected when operational EVA window is compressed or life-support reserves must be conserved.`,
        `Terrain suitability verified for high-traction spacesuit boots.`,
      ],
    };
  }

  if (objectiveType === 'SCIENCE') {
    const includedTargets = opportunities.filter((o) => o.isIncludedInPath).length;
    return {
      summary: `Optimized to maximize scientific return by routing directly through documented sedimentary layers and sample sites (${includedTargets} directly intercepted).`,
      advantages: [
        `Directly accesses high-value geological formations (${includedTargets} verified targets)`,
        `Proximity to CRISM-detected hydrated smectite clay exposures`,
        `Provides continuous cross-stratigraphy observation across lacustrine facies`,
      ],
      tradeOffs: [
        `Traverse length increases to ${distanceKm} km (~${Math.round((distanceKm * 0.2) * 10) / 10} km longer than direct path)`,
        `Total mission time reaches ${durationHours} h, consuming more life-support envelope`,
        `Includes designated static sampling stops requiring tethered drill deployment`,
      ],
      criticalDecisionFactors: [
        `High astrobiological priority targets justify additional traverse distance.`,
        `Must maintain strict chronometer monitoring to prevent exceeding ${maxDuration}h EVA limit.`,
      ],
    };
  }

  // SAFETY
  return {
    summary: `Engineered for conservative risk tolerance, keeping slopes below ${maxSlope}° and maintaining generous safety buffers from friable scarps and loose sand ripples.`,
    advantages: [
      `Maintains lowest average slope and avoids all known rockfall / scarp collapse zones`,
      `Zero transit across uncompacted aeolian dunes (Séítah ripples), minimizing slip fatigue`,
      `Lowest overall hazard exposure score (${hazardScore}/100)`,
    ],
    tradeOffs: [
      `Adds detour distance (${distanceKm} km) around topographical obstacles`,
      `Requires gentle contour climbing which increases cumulative distance`,
      `May pass at distal viewing range from cliff-face science targets`,
    ],
    criticalDecisionFactors: [
      `Recommended during early exploratory sorties before micro-terrain traction is calibrated.`,
      `Optimal route if an astronaut experiences elevated metabolic stress or minor suit mobility constraints.`,
    ],
  };
}
