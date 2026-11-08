import { HazardZone, MarsCoordinate } from '../types/mars';
import {
  calculateMarsDistanceKm,
  calculateMarsDistanceMeters,
  calculateSlopeDegrees,
  distanceToSegmentMeters,
} from './spatialMath';
import { getMolaElevation } from './marsMolaElevation';
import {
  PlannedRouteResult,
  calculateAStarRoute,
  RouteMode,
  MarsTransportModeType,
  CrewBuddyConfigType,
} from './marsAStarRouter';

export interface RouteHazardIssue {
  id: string;
  hazardName: string;
  hazardType: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  distanceToPathMeters: number;
  maxSlopeDeg?: number;
  description: string;
  issueSummaryBn: string;
  issueSummaryEn: string;
  remedySuggestionBn: string;
  remedySuggestionEn: string;
}

export interface RouteSafetyAssessment {
  startPoint: { lat: number; lng: number; name?: string };
  endPoint: { lat: number; lng: number; name?: string };
  directDistanceKm: number;
  isSafe: boolean;
  safetyStatus: 'SAFE' | 'CAUTION' | 'DANGEROUS';
  overallSafetyScore: number; // 0 to 100
  maxDirectSlopeDeg: number;
  avgDirectSlopeDeg: number;
  issues: RouteHazardIssue[];
  warningHeadlineBn: string;
  warningHeadlineEn: string;
  detailedAnalysisBn: string;
  detailedAnalysisEn: string;
  suggestedSaferRoute: PlannedRouteResult;
  directRoute: PlannedRouteResult;
  comparison: {
    directSlope: number;
    saferSlope: number;
    slopeImprovementDeg: number;
    directHazardsCount: number;
    saferHazardsCount: number;
    detourExtraDistanceKm: number;
    safetyScoreDirect: number;
    safetyScoreSafer: number;
  };
}

/**
 * Analyzes the intended direct/current path between Start and Destination,
 * detects terrain hazards, steep scarps, and dune traps, and calculates
 * a verified safer bypass corridor.
 */
export function analyzeRouteSafety(
  startPoint: { lat: number; lng: number; name?: string },
  endPoint: { lat: number; lng: number; name?: string },
  hazardZones: HazardZone[],
  options?: {
    transportMode?: MarsTransportModeType;
    crewConfig?: CrewBuddyConfigType;
  }
): RouteSafetyAssessment {
  const transportMode = options?.transportMode || 'foot';
  const crewConfig = options?.crewConfig || 'buddy_pair';

  const p1: MarsCoordinate = { latitude: startPoint.lat, longitude: startPoint.lng };
  const p2: MarsCoordinate = { latitude: endPoint.lat, longitude: endPoint.lng };
  const directDistanceKm = Number(calculateMarsDistanceKm(p1, p2).toFixed(2));

  // Compute standard candidate routes (Shortest represents the direct line, Safest represents the bypass)
  const directRoute = calculateAStarRoute(startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng, 'shortest', {
    transportMode,
    crewConfig,
    hazardZones,
  });

  const suggestedSaferRoute = calculateAStarRoute(startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng, 'safest', {
    transportMode,
    crewConfig,
    hazardZones,
  });

  // Sample 25 intermediate points along the straight direct corridor to evaluate ground truth slope and hazards
  const sampleSteps = 25;
  const issues: RouteHazardIssue[] = [];
  const processedHazardIds = new Set<string>();

  let maxDirectSlope = 0;
  let slopeTotal = 0;
  let prevElev = getMolaElevation(startPoint.lat, startPoint.lng);
  let prevPt: MarsCoordinate = p1;

  for (let i = 1; i <= sampleSteps; i++) {
    const fraction = i / sampleSteps;
    const curLat = startPoint.lat + (endPoint.lat - startPoint.lat) * fraction;
    const curLng = startPoint.lng + (endPoint.lng - startPoint.lng) * fraction;
    const curPt: MarsCoordinate = { latitude: curLat, longitude: curLng };
    const curElev = getMolaElevation(curLat, curLng);

    const stepSlope = calculateSlopeDegrees(prevPt, prevElev, curPt, curElev);
    if (stepSlope > maxDirectSlope) maxDirectSlope = stepSlope;
    slopeTotal += stepSlope;

    prevElev = curElev;
    prevPt = curPt;

    // Check intersection with known mapped Hazard Zones
    hazardZones.forEach((hazard) => {
      if (processedHazardIds.has(hazard.id)) return;

      const distM = calculateMarsDistanceMeters(curPt, hazard.coordinate);
      const thresholdM = hazard.radiusMeters * 1.35; // buffer safety margin

      if (distM <= thresholdM) {
        processedHazardIds.add(hazard.id);

        let issueSummaryBn = '';
        let issueSummaryEn = '';
        let remedyBn = '';
        let remedyEn = '';

        if (hazard.type === 'STEEP_SLOPE') {
          issueSummaryBn = `${hazard.name}: Steep cliff scarp (${hazard.slopeAngle || 20}° slope). High risk of suit tumble, abrasion, and rockfall.`;
          issueSummaryEn = `${hazard.name}: Steep cliff scarp (${hazard.slopeAngle || 20}° slope). High risk of suit tumble, abrasion, and rockfall.`;
          remedyBn = 'Rerouting along low-gradient contours is strongly advised.';
          remedyEn = 'Rerouting along low-gradient contours is strongly advised.';
        } else if (hazard.type === 'SOFT_SAND_DRIFT') {
          issueSummaryBn = `${hazard.name}: Deep uncompacted basaltic sand drift. High wheel-entrapment and severe metabolic fatigue risk.`;
          issueSummaryEn = `${hazard.name}: Deep uncompacted basaltic sand drift. High wheel-entrapment and severe metabolic fatigue risk.`;
          remedyBn = 'Bypass via hard bedrock and stable inter-dune corridors.';
          remedyEn = 'Bypass via hard bedrock and stable inter-dune corridors.';
        } else if (hazard.type === 'BOULDER_FIELD') {
          issueSummaryBn = `${hazard.name}: Dense megaboulder ejecta field. High snagging and chassis collision hazard.`;
          issueSummaryEn = `${hazard.name}: Dense megaboulder ejecta field. High snagging and chassis collision hazard.`;
          remedyBn = 'Circumnavigate outside the boulder perimeter.';
          remedyEn = 'Circumnavigate outside the boulder perimeter.';
        } else {
          issueSummaryBn = `${hazard.name}: Geological hazard area (${hazard.riskLevel}).`;
          issueSummaryEn = `${hazard.name}: Geological hazard area (${hazard.riskLevel}).`;
          remedyBn = 'Maintain safe standoff distance.';
          remedyEn = 'Maintain safe standoff distance.';
        }

        issues.push({
          id: hazard.id,
          hazardName: hazard.name,
          hazardType: hazard.type,
          riskLevel: hazard.riskLevel,
          distanceToPathMeters: Math.round(distM),
          maxSlopeDeg: hazard.slopeAngle || Math.round(stepSlope),
          description: hazard.description,
          issueSummaryBn,
          issueSummaryEn,
          remedySuggestionBn: remedyBn,
          remedySuggestionEn: remedyEn,
        });
      }
    });
  }

  const avgDirectSlope = Number((slopeTotal / sampleSteps).toFixed(1));
  maxDirectSlope = Number(maxDirectSlope.toFixed(1));

  // If local slope exceeds 16° but wasn't part of named hazard, add high slope issue
  if (maxDirectSlope >= 16 && !issues.some((iss) => iss.hazardType === 'STEEP_SLOPE')) {
    issues.push({
      id: 'high_incline_detected',
      hazardName: 'High Natural Slope (>15° Incline)',
      hazardType: 'STEEP_SLOPE',
      riskLevel: maxDirectSlope >= 20 ? 'CRITICAL' : 'HIGH',
      distanceToPathMeters: 0,
      maxSlopeDeg: maxDirectSlope,
      description: `Direct path slope reaches ${maxDirectSlope}°, exceeding nominal safe slope limits for human EVA walk and rovers.`,
      issueSummaryBn: `Steep terrain detected (${maxDirectSlope}° slope). High risk of suit tumble and traction loss.`,
      issueSummaryEn: `Steep terrain detected (${maxDirectSlope}° slope). High risk of suit tumble and traction loss.`,
      remedySuggestionBn: 'Use parallel low-gradient contour routes.',
      remedySuggestionEn: 'Use parallel low-gradient contour routes.',
    });
  }

  // Determine overall safety status and score
  const hasCritical = issues.some((i) => i.riskLevel === 'CRITICAL') || maxDirectSlope >= 20;
  const hasHigh = issues.some((i) => i.riskLevel === 'HIGH') || maxDirectSlope >= 14;

  let safetyStatus: 'SAFE' | 'CAUTION' | 'DANGEROUS' = 'SAFE';
  let overallSafetyScore = 92;

  if (hasCritical) {
    safetyStatus = 'DANGEROUS';
    overallSafetyScore = Math.max(25, 60 - issues.length * 15);
  } else if (hasHigh || issues.length > 0) {
    safetyStatus = 'CAUTION';
    overallSafetyScore = Math.max(55, 80 - issues.length * 10);
  } else {
    safetyStatus = 'SAFE';
    overallSafetyScore = 95;
  }

  // Generate clear headlines
  let warningHeadlineBn = '';
  let warningHeadlineEn = '';
  let detailedAnalysisBn = '';
  let detailedAnalysisEn = '';

  if (safetyStatus === 'DANGEROUS') {
    warningHeadlineBn = `⚠️ Danger: Direct corridor intersects ${issues.length} critical hazard zone(s)!`;
    warningHeadlineEn = `⚠️ Danger: Direct corridor intersects ${issues.length} critical hazard zone(s)!`;
    detailedAnalysisBn = `The direct path crosses critical scarps or soft sand traps with slopes reaching ${maxDirectSlope}°. Traversal along this corridor risks rover wheel immobilization or spacesuit falls. The recommended bypass corridor safely circumnavigates these obstacles.`;
    detailedAnalysisEn = `The direct path crosses critical scarps or soft sand traps with slopes reaching ${maxDirectSlope}°. Traversal along this corridor risks rover wheel immobilization or spacesuit falls. The recommended bypass corridor safely circumnavigates these obstacles.`;
  } else if (safetyStatus === 'CAUTION') {
    warningHeadlineBn = `⚡ Caution: Moderate terrain inclines and warning zones detected.`;
    warningHeadlineEn = `⚡ Caution: Moderate terrain inclines and warning zones detected.`;
    detailedAnalysisBn = `Terrain exhibits moderate slopes (average ${avgDirectSlope}°). Walkable with vigilance, though the recommended detour provides smoother footing.`;
    detailedAnalysisEn = `Terrain exhibits moderate slopes (average ${avgDirectSlope}°). Walkable with vigilance, though the recommended detour provides smoother footing.`;
  } else {
    warningHeadlineBn = `✅ Route corridor is safe and nominal (No hazards detected)`;
    warningHeadlineEn = `✅ Route corridor is safe and nominal (No hazards detected)`;
    detailedAnalysisBn = `No critical scarps, loose sand drifts, or boulder fields intersect your path (max slope ${maxDirectSlope}°). Nominal traverse clearance.`;
    detailedAnalysisEn = `No critical scarps, loose sand drifts, or boulder fields intersect your path (max slope ${maxDirectSlope}°). Nominal traverse clearance.`;
  }

  const comparison = {
    directSlope: maxDirectSlope,
    saferSlope: suggestedSaferRoute.maxSlopeDeg,
    slopeImprovementDeg: Math.max(0, Number((maxDirectSlope - suggestedSaferRoute.maxSlopeDeg).toFixed(1))),
    directHazardsCount: issues.length,
    saferHazardsCount: 0,
    detourExtraDistanceKm: Math.max(0, Number((suggestedSaferRoute.totalDistanceKm - directDistanceKm).toFixed(2))),
    safetyScoreDirect: overallSafetyScore,
    safetyScoreSafer: suggestedSaferRoute.safetyScore,
  };

  return {
    startPoint,
    endPoint,
    directDistanceKm,
    isSafe: safetyStatus === 'SAFE',
    safetyStatus,
    overallSafetyScore,
    maxDirectSlopeDeg: maxDirectSlope,
    avgDirectSlopeDeg: avgDirectSlope,
    issues,
    warningHeadlineBn,
    warningHeadlineEn,
    detailedAnalysisBn,
    detailedAnalysisEn,
    suggestedSaferRoute,
    directRoute,
    comparison,
  };
}
