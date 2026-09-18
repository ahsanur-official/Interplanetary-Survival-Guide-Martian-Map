export interface MarsCoordinate {
  latitude: number;   // Degrees North (-90 to +90, Planetocentric)
  longitude: number;  // Degrees East (0 to 360 or -180 to +180)
}

export type DataStatus = 'OBSERVED' | 'HISTORICAL' | 'DERIVED' | 'MODELED' | 'SIMULATED';

export interface DataProvenance {
  source: string;              // e.g., "NASA PDS / MGS MOLA MEGDR"
  datasetName: string;         // e.g., "MOLA Experiment Gridded Data Record"
  mission: string;             // e.g., "Mars Global Surveyor"
  instrument?: string;         // e.g., "MOLA"
  observationDate?: string;    // e.g., "Sol 350 / 2021-02-18"
  spatialResolution: string;   // e.g., "463 m/px (MOLA) / 0.25 m/px (HiRISE)"
  status: DataStatus;
  limitations: string;
}

export interface MarsRegion {
  id: string;
  name: string;
  type: string;
  center: MarsCoordinate;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  baseElevationMeters: number;
  elevationRange: [number, number]; // [min, max]
  description: string;
  primaryMission: string;
  geologicalContext: string;
}

export interface ElevationGridPoint {
  x: number; // Normalized 0..1 in bounding box
  y: number; // Normalized 0..1 in bounding box
  lat: number;
  lon: number;
  elevationMeters: number;
  slopeDegrees: number;
  roughness: number; // 0..1
}

export interface ScienceTarget {
  id: string;
  name: string;
  coordinate: MarsCoordinate;
  category: 'DELTAIC_SEDIMENT' | 'CARBONATE_MINERAL' | 'IGNEOUS_BASEMENT' | 'CRATER_RIM' | 'CLAY_HYDRATION' | 'HYDROTHERMAL_SILICA';
  scientificValueScore: number; // 1 to 10
  samplingTimeMinutes: number;
  description: string;
  hypothesizedSignificance: string;
  recommendedInstruments: string[];
  provenance: DataProvenance;
}

export interface RoverObservation {
  id: string;
  mission: 'Perseverance (Mars 2020)' | 'Curiosity (MSL)' | 'Opportunity (MER-B)';
  sol: number;
  earthDate: string;
  coordinate: MarsCoordinate;
  instrument: string;
  targetName: string;
  observationSummary: string;
  sampleAcquired?: boolean;
  provenance: DataProvenance;
}

export interface HazardZone {
  id: string;
  name: string;
  type: 'STEEP_SLOPE' | 'BOULDER_FIELD' | 'SOFT_SAND_DRIFT' | 'THERMAL_SHADOW' | 'RESTRICTED';
  coordinate: MarsCoordinate;
  radiusMeters: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  slopeAngle?: number;
  description: string;
  provenance: DataProvenance;
}

export interface ResourceSite {
  id: string;
  name: string;
  coordinate: MarsCoordinate;
  resourceType: 'CLAY_BOUND_WATER' | 'SUBSURFACE_ICE_PROXY' | 'CARBONATE_DEPOSIT' | 'SULFATE_HYDRATE';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  detectionMethod: string;
  estimatedAbundance: string;
  description: string;
  provenance: DataProvenance;
}

export interface EnvironmentalConditions {
  diurnalTempRangeCelsius: [number, number]; // e.g. [-84, -14]
  currentTempCelsius: number;
  atmosphericPressurePascals: number;        // e.g. 740 Pa
  dustOpticalDepthTau: number;               // e.g. 0.45
  radiationDoseRateMicroGyPerDay: number;    // e.g. 640 uGy/day (from Curiosity RAD)
  effectiveShieldingIndex: number;           // 0..1 based on atmospheric column height
  observationSource: string;
  dataStatus: DataStatus;
}

export interface MapLayerConfig {
  terrainElevation: boolean;
  slopeHeatmap: boolean;
  terrainDifficulty: boolean;
  hazardZones: boolean;
  environmentalOverlay: boolean;
  radiationOverlay: boolean;
  roverTraverse: boolean;
  roverObservations: boolean;
  scienceTargets: boolean;
  resourceLocations: boolean;
  candidateRoutes: boolean;
  waypoints: boolean;
}

export interface RouteWaypoint extends MarsCoordinate {
  id: string;
  name?: string;
  elevation: number;
  slope: number;
  cumulativeDistanceKm: number;
  cumulativeTimeHours: number;
  hazardRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  visitedScienceTarget?: ScienceTarget;
}

export interface CandidateRoute {
  id: string;
  name: string;
  objectiveType: 'EFFICIENCY' | 'SCIENCE' | 'SAFETY' | 'BALANCED' | 'CUSTOM';
  color: string;
  dashPattern?: number[];
  waypoints: RouteWaypoint[];
  metrics: {
    totalDistanceKm: number;
    estimatedDurationHours: number;
    maxSlopeDegrees: number;
    averageSlopeDegrees: number;
    hazardExposureScore: number;    // 0 to 100 (lower is safer)
    scienceOpportunityYield: number; // 0 to 100 (sum of target weights)
    resourceInterestYield: number;  // 0 to 100
    metabolicEnergyCostKcal: number;
    isFeasible: boolean;            // within max duration
  };
  whyThisRoute: {
    summary: string;
    advantages: string[];
    tradeOffs: string[];
    criticalDecisionFactors: string[];
  };
  nearbyOpportunities: {
    target: ScienceTarget;
    detourDistanceMeters: number;
    additionalTimeMinutes: number;
    isIncludedInPath: boolean;
  }[];
}

export interface MissionConstraints {
  startLocationId: string;
  destinationLocationId: string;
  maxDurationHours: number;
  maxDistanceKm: number;
  priorityWeights: {
    safety: number;     // 0..1
    science: number;    // 0..1
    efficiency: number; // 0..1
    resources: number;  // 0..1
  };
  requiredScienceTargetIds: string[];
  avoidHazardTypes: string[];
}

export interface WhatIfScenario {
  id: string;
  title: string;
  description: string;
  durationAdjustmentHours?: number;
  additionalHazard?: HazardZone;
  mandatedScienceTargetId?: string;
  slopeLimitAdjustment?: number;
}
