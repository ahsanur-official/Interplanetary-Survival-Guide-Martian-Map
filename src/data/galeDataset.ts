import {
  MarsRegion,
  ScienceTarget,
  RoverObservation,
  HazardZone,
  ResourceSite,
  EnvironmentalConditions,
  MarsCoordinate
} from '../types/mars';

export const GALE_REGION: MarsRegion = {
  id: 'gale',
  name: 'Gale Crater & Mount Sharp',
  type: 'Central Peak Impact Crater & Stratigraphic Mound',
  center: { latitude: -4.589, longitude: 137.441 },
  bounds: {
    minLat: -4.75,
    maxLat: -4.45,
    minLon: 137.30,
    maxLon: 137.60,
  },
  baseElevationMeters: -4450,
  elevationRange: [-4550, -3800],
  description:
    'Site of NASA Curiosity rover exploration since August 2012. Features a 5-km high central mound (Aeolis Mons / Mount Sharp) exposing billions of years of Martian climate transition from warm, wet clay-forming environments to dry, sulfate-dominated arid conditions.',
  primaryMission: 'Mars Science Laboratory (Curiosity Rover)',
  geologicalContext:
    'Gale crater floor is lined with lacustrine mudstones (Yellowknife Bay, Murray formation) capped by hematite-rich ridges (Vera Rubin Ridge) and sulfate-bearing layered sulfate units.',
};

export const GALE_ENVIRONMENT: EnvironmentalConditions = {
  diurnalTempRangeCelsius: [-79, -8],
  currentTempCelsius: -22,
  atmosphericPressurePascals: 840, // High atmospheric column due to deep -4.5 km crater floor
  dustOpticalDepthTau: 0.48,
  radiationDoseRateMicroGyPerDay: 635, // In-situ MSL RAD benchmark
  effectiveShieldingIndex: 0.72,
  observationSource: 'MSL REMS & RAD In-Situ Sensor Telemetry',
  dataStatus: 'OBSERVED',
};

export const GALE_NAMED_LOCATIONS: {
  id: string;
  name: string;
  coordinate: MarsCoordinate;
  elevationMeters: number;
  type: 'BASE_LANDING' | 'SCIENCE_STATION' | 'GEOLOGICAL_OUTPOST' | 'RESOURCE_ZONE';
  description: string;
}[] = [
  {
    id: 'gale_bradbury',
    name: 'Bradbury Landing Site',
    coordinate: { latitude: -4.5895, longitude: 137.4417 },
    elevationMeters: -4501,
    type: 'BASE_LANDING',
    description: 'Touchdown site of MSL Curiosity, named after author Ray Bradbury. Low-slope alluvial fan regolith.',
  },
  {
    id: 'gale_yellowknife',
    name: 'Yellowknife Bay Depression',
    coordinate: { latitude: -4.5880, longitude: 137.4580 },
    elevationMeters: -4520,
    type: 'SCIENCE_STATION',
    description: 'Ancient lakebed mudstones where NASA confirmed Mars was once habitable for microbial life.',
  },
  {
    id: 'gale_bagnold',
    name: 'Bagnold Dunes Field Base',
    coordinate: { latitude: -4.6650, longitude: 137.4050 },
    elevationMeters: -4410,
    type: 'GEOLOGICAL_OUTPOST',
    description: 'Active dark basaltic sand dune field active in current Martian wind regimes.',
  },
  {
    id: 'gale_vera_rubin',
    name: 'Vera Rubin Ridge Crest',
    coordinate: { latitude: -4.7120, longitude: 137.3820 },
    elevationMeters: -4205,
    type: 'SCIENCE_STATION',
    description: 'High-standing, iron-oxide hematite cemented ridge with dramatic views of Mount Sharp.',
  },
];

export const GALE_SCIENCE_TARGETS: ScienceTarget[] = [
  {
    id: 'sci_gale_john_klein',
    name: 'John Klein Mudstone Drill Site',
    coordinate: { latitude: -4.5882, longitude: 137.4585 },
    category: 'CLAY_HYDRATION',
    scientificValueScore: 9.7,
    samplingTimeMinutes: 50,
    description:
      'First sample drilled on Mars confirming neutral pH, low salinity, and essential bio-elements (C, H, N, O, P, S).',
    hypothesizedSignificance:
      'Definitive evidence of ancient habitable lacustrine environment in Gale Crater.',
    recommendedInstruments: ['CheMin X-Ray Diffraction', 'SAM Gas Chromatograph'],
    provenance: {
      source: 'NASA PDS Geosciences / MSL CheMin Archive',
      datasetName: 'MSL_CHEMIN_RDR_0068',
      mission: 'Curiosity (MSL)',
      instrument: 'CheMin & SAM',
      observationDate: 'Sol 182 / 2013-02-08',
      spatialResolution: 'Powder XRD diffraction',
      status: 'OBSERVED',
      limitations: 'Sample drilled in 2013; drill borehole remains open for inspection.',
    },
  },
  {
    id: 'sci_gale_hematite_crest',
    name: 'Vera Rubin Ridge Gray Hematite Outcrop',
    coordinate: { latitude: -4.7115, longitude: 137.3830 },
    category: 'IGNEOUS_BASEMENT',
    scientificValueScore: 9.1,
    samplingTimeMinutes: 45,
    description:
      'Hard, erosion-resistant gray hematite crystal coatings formed when oxidizing groundwater met lake sediment.',
    hypothesizedSignificance:
      'Traces redox gradient boundaries where chemolithoautotrophic microbes could have extracted metabolic energy.',
    recommendedInstruments: ['ChemCam Laser Spectrometer', 'APXS Elemental Sensor'],
    provenance: {
      source: 'NASA PDS / MSL ChemCam & Mastcam',
      datasetName: 'MSL_CHEMCAM_SPECTRA_1900',
      mission: 'Curiosity (MSL)',
      instrument: 'ChemCam & Mastcam',
      observationDate: 'Sol 1912 / 2017-12-14',
      spatialResolution: '1 mm laser footprint',
      status: 'OBSERVED',
      limitations: 'Rock surface is dust-varnished.',
    },
  },
];

export const GALE_HAZARD_ZONES: HazardZone[] = [
  {
    id: 'haz_gale_bagnold_dunes',
    name: 'Bagnold Active Dune Wave Front',
    type: 'SOFT_SAND_DRIFT',
    coordinate: { latitude: -4.6640, longitude: 137.4040 },
    radiusMeters: 500,
    riskLevel: 'HIGH',
    description:
      'High-relief transverse sand dunes with loose grain packing and slip faces up to 30°. Extreme mobility hazard.',
    provenance: {
      source: 'NASA MSL Traverse Hazard Map',
      datasetName: 'MSL_BAGNOLD_TRAVERSE_LIMITS',
      mission: 'Curiosity (MSL)',
      status: 'OBSERVED',
      spatialResolution: '1 m',
      limitations: 'Active migration ~1 meter/Martian year.',
    },
  },
];
