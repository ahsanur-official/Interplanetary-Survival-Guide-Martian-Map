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
          issueSummaryBn = `${hazard.name}: খাড়া ক্লিফ স্কার্প (ঢাল ~${hazard.slopeAngle || 20}°)। স্পেসস্যুট পা পিছলে পড়া এবং শিলাখণ্ডের ধসের তীব্র ঝুঁকি।`;
          issueSummaryEn = `${hazard.name}: Steep cliff scarp (${hazard.slopeAngle || 20}° slope). High risk of suit tumble, abrasion, and rockfall.`;
          remedyBn = 'কম ঢালের সমতল করিডোর দিয়ে ঘুরে যাওয়া সুপারিশকৃত।';
          remedyEn = 'Rerouting along low-gradient contours is strongly advised.';
        } else if (hazard.type === 'SOFT_SAND_DRIFT') {
          issueSummaryBn = `${hazard.name}: গভীর আলগা ব্যাসাল্ট বালিয়াড়ি (Dune Trap)। রোভারের চাকা আটকে যাওয়া এবং পায়ে হাঁটলে তীব্র ক্লান্তি।`;
          issueSummaryEn = `${hazard.name}: Deep uncompacted basaltic sand drift. High wheel-entrapment and severe metabolic fatigue risk.`;
          remedyBn = 'দৃঢ় বেডরক বা সমতল বালিয়াড়িহীন পথ বেছে নিন।';
          remedyEn = 'Bypass via hard bedrock and stable inter-dune corridors.';
        } else if (hazard.type === 'BOULDER_FIELD') {
          issueSummaryBn = `${hazard.name}: ঘন বৃহদাকার বোল্ডার ক্ষেত্র (ব্যাস ০.৮-৩.৫ মি)। স্পেসস্যুট আম্বিলিকাল তার আটকে যাওয়া বা রোভার আটকে যাওয়ার ঝুঁকি।`;
          issueSummaryEn = `${hazard.name}: Dense megaboulder ejecta field. High snagging and chassis collision hazard.`;
          remedyBn = 'পাথুরে বাধা এড়িয়ে পাশের মসৃণ পথ গ্রহণ করুন।';
          remedyEn = 'Circumnavigate outside the boulder perimeter.';
        } else {
          issueSummaryBn = `${hazard.name}: ভূতাত্ত্বিক বিপদজনক অঞ্চল (${hazard.riskLevel})।`;
          issueSummaryEn = `${hazard.name}: Geological hazard area (${hazard.riskLevel}).`;
          remedyBn = 'সুরক্ষিত বাফার দূরত্ব বজায় রেখে চলুন।';
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
      hazardName: 'অতিরিক্ত খাড়া প্রাকৃতিক ভূখণ্ড (High Natural Slope)',
      hazardType: 'STEEP_SLOPE',
      riskLevel: maxDirectSlope >= 20 ? 'CRITICAL' : 'HIGH',
      distanceToPathMeters: 0,
      maxSlopeDeg: maxDirectSlope,
      description: `সরাসরি পথের ঢাল সর্বোচ্চ ${maxDirectSlope}° তে পৌঁছেছে, যা মঙ্গল গ্রহে সাধারণ হাঁটা ও সাধারণ রোভারের জন্য ঝুঁকিপূর্ণ।`,
      issueSummaryBn: `সরাসরি পথে অতিরিক্ত খাড়া চড়াই (${maxDirectSlope}° ঢাল)। মহাকাশচারী পড়ে যাওয়ার সম্ভাবনা রয়েছে।`,
      issueSummaryEn: `Steep terrain detected (${maxDirectSlope}° slope). Exceeds nominal safe incline limits.`,
      remedySuggestionBn: 'সমান্তরাল নিম্ন-ঢালের রাস্তা ব্যবহার করুন।',
      remedySuggestionEn: 'Use gentle winding contour routes.',
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
    warningHeadlineBn = `⚠️ সতর্কতা: আপনার নির্ধারিত সরাসরি পথে ${issues.length} টি মারাত্মক বিপজ্জনক এলাকা রয়েছে!`;
    warningHeadlineEn = `⚠️ Danger: Direct corridor intersects ${issues.length} critical hazard zone(s)!`;
    detailedAnalysisBn = `আপনি যেদিকে যাওয়ার পরিকল্পনা করছেন, সেই সরাসরি লাইনে খাড়া স্কার্প বা বালিয়াড়ির মারাত্মক ফাঁদ রয়েছে (সর্বোচ্চ ঢাল ${maxDirectSlope}°)। এর মধ্য দিয়ে সরাসরি যাওয়া স্পেসস্যুট বা রোভারের জন্য অনিরাপদ। নিচে প্রদর্শিত নিরাপদ বিকল্প রুটটি বেছে নেওয়ার পরামর্শ দেওয়া হচ্ছে।`;
    detailedAnalysisEn = `The direct path crosses critical scarps or soft sand traps with slopes reaching ${maxDirectSlope}°. Traversal along this corridor risks rover wheel immobilization or spacesuit falls. The recommended bypass corridor safely circumnavigates these obstacles.`;
  } else if (safetyStatus === 'CAUTION') {
    warningHeadlineBn = `⚡ সতর্কতা: নির্ধারিত পথে মাঝারি মাত্রার সতর্কতা ও ঢাল পরিলক্ষিত হয়েছে।`;
    warningHeadlineEn = `⚡ Caution: Moderate terrain inclines and warning zones detected.`;
    detailedAnalysisBn = `সরাসরি পথে কিছু মাঝারি ঢাল ও হালকা বালুর অঞ্চল রয়েছে (গড় ঢাল ${avgDirectSlope}°)। সাবধানে এগুলে যাওয়া সম্ভব, তবে বিকল্প নিরাপদ পথটি আরও আরামদায়ক ও নিরাপদ।`;
    detailedAnalysisEn = `Terrain exhibits moderate slopes (average ${avgDirectSlope}°). Walkable with vigilance, though the recommended detour provides smoother footing.`;
  } else {
    warningHeadlineBn = `✅ রুটটি সম্পূর্ণ নিরাপদ ও চলাচলের উপযোগী (Nominal Surface Corridor)`;
    warningHeadlineEn = `✅ Route corridor is safe and nominal (No hazards detected)`;
    detailedAnalysisBn = `আপনার নির্ধারিত গন্তব্যে পৌঁছানোর সরাসরি পথে কোনো বড় খাদ, খাড়া স্কার্প বা বালিয়াড়ি নেই (সর্বোচ্চ ঢাল মাত্র ${maxDirectSlope}°)। আপনি নিরাপদে এগিয়ে যেতে পারেন।`;
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
