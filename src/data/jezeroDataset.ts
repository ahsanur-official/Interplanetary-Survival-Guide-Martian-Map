import {
  MarsRegion,
  ScienceTarget,
  RoverObservation,
  HazardZone,
  ResourceSite,
  EnvironmentalConditions,
  MarsCoordinate
} from '../types/mars';

export const JEZERO_REGION: MarsRegion = {
  id: 'jezero',
  name: 'Jezero Crater & Western Delta',
  type: 'Ancient Lacustrine Basin & Delta Complex',
  center: { latitude: 18.444, longitude: 77.425 },
  bounds: {
    minLat: 18.34,
    maxLat: 18.56,
    minLon: 77.28,
    maxLon: 77.56,
  },
  baseElevationMeters: -2560,
  elevationRange: [-2680, -2280],
  description:
    'Site of an ancient Noachian-Hesperian open-basin lake (~3.7 Ga). Traversed by NASA Mars 2020 Perseverance. Displays exquisitely preserved river delta deposits, smectite clays, and carbonate margins of paramount astrobiological and human resource significance.',
  primaryMission: 'Mars 2020 Perseverance Rover',
  geologicalContext:
    'Western Jezero exhibits fan delta strata overlying olivine-rich igneous basement (Séítah and Máaz formations), bounded by high-relief crater walls and pierced by the Belva impact event.',
};

export const JEZERO_ENVIRONMENT: EnvironmentalConditions = {
  diurnalTempRangeCelsius: [-84, -14],
  currentTempCelsius: -28,
  atmosphericPressurePascals: 742,
  dustOpticalDepthTau: 0.42,
  radiationDoseRateMicroGyPerDay: 685, // Calibrated from MSL RAD with Jezero elevation column (+2.0 km vs Gale floor)
  effectiveShieldingIndex: 0.62,
  observationSource: 'Mars 2020 MEDA (Mars Environmental Dynamics Analyzer) Baseline',
  dataStatus: 'HISTORICAL',
};

// Key mission locations suitable as Start / Destination / Waypoints
export const JEZERO_NAMED_LOCATIONS: {
  id: string;
  name: string;
  coordinate: MarsCoordinate;
  elevationMeters: number;
  type: 'BASE_LANDING' | 'SCIENCE_STATION' | 'GEOLOGICAL_OUTPOST' | 'RESOURCE_ZONE';
  description: string;
}[] = [
  {
    id: 'loc_butler',
    name: 'Octavia E. Butler Landing Site',
    coordinate: { latitude: 18.4447, longitude: 77.4508 },
    elevationMeters: -2570,
    type: 'BASE_LANDING',
    description: 'Initial touchdown site of Mars 2020 Perseverance. Stable flat volcanic crater floor regolith.',
  },
  {
    id: 'loc_kodiak',
    name: 'Kodiak Butte Base',
    coordinate: { latitude: 18.3970, longitude: 77.4320 },
    elevationMeters: -2480,
    type: 'GEOLOGICAL_OUTPOST',
    description: 'Isolated erosional mesa exhibiting textbook bottomset and foreset deltaic layering.',
  },
  {
    id: 'loc_delta_scarp',
    name: 'Hawkes Bay Delta Scarp',
    coordinate: { latitude: 18.4350, longitude: 77.4100 },
    elevationMeters: -2490,
    type: 'SCIENCE_STATION',
    description: 'Steep amphitheater cliff exposing dense layered mudstones with high biosignature potential.',
  },
  {
    id: 'loc_belva_rim',
    name: 'Belva Crater South Rim',
    coordinate: { latitude: 18.4720, longitude: 77.3850 },
    elevationMeters: -2420,
    type: 'GEOLOGICAL_OUTPOST',
    description: 'Elevated vantage point overlooking 1-km impact crater revealing deep delta cross-sections.',
  },
  {
    id: 'loc_margin_carbonate',
    name: 'Margin Carbonate Ridge',
    coordinate: { latitude: 18.5200, longitude: 77.3400 },
    elevationMeters: -2350,
    type: 'RESOURCE_ZONE',
    description: 'Carbonate-rich bathtub-ring mineral deposits formed along the paleolake shoreline.',
  },
  {
    id: 'loc_neretva_inflow',
    name: 'Neretva Vallis Inflow Gorge',
    coordinate: { latitude: 18.5450, longitude: 77.3000 },
    elevationMeters: -2310,
    type: 'SCIENCE_STATION',
    description: 'Breach canyon through Jezero rim where ancient torrential river fed the delta complex.',
  },
];

export const JEZERO_SCIENCE_TARGETS: ScienceTarget[] = [
  {
    id: 'sci_kodiak_foreset',
    name: 'Kodiak Butte Delta Foresets',
    coordinate: { latitude: 18.3965, longitude: 77.4315 },
    category: 'DELTAIC_SEDIMENT',
    scientificValueScore: 9.5,
    samplingTimeMinutes: 45,
    description:
      'Distinct dipping foreset beds capped by topset gravels, confirming fluctuating paleolake water levels and energy transitions.',
    hypothesizedSignificance:
      'Provides absolute depositional timeline and hydrological velocity constraints for ancient Jezero lake.',
    recommendedInstruments: ['Handheld Raman Spectrometer', 'Microscopic Imager', 'Rock Core Drill'],
    provenance: {
      source: 'NASA PDS / MRO HiRISE & Mars 2020 Mastcam-Z',
      datasetName: 'HiRISE DTM PSP_003442_1985 & Mastcam-Z High-Res Stitched Mosaics',
      mission: 'Mars 2020 & Mars Reconnaissance Orbiter',
      instrument: 'Mastcam-Z & HiRISE',
      observationDate: 'Sol 74 / 2021-05-04',
      spatialResolution: '0.25 m/px',
      status: 'OBSERVED',
      limitations: 'Distal cliff face observations; physical sample requires lower scree slope access.',
    },
  },
  {
    id: 'sci_enchanted_lake',
    name: 'Enchanted Lake Mudstones',
    coordinate: { latitude: 18.4360, longitude: 77.4080 },
    category: 'CLAY_HYDRATION',
    scientificValueScore: 9.8,
    samplingTimeMinutes: 60,
    description:
      'Fine-grained, finely laminated sedimentary mudstones rich in Fe/Mg smectite phyllosilicates.',
    hypothesizedSignificance:
      'Highest biosignature preservation capacity; analogous to Earth lacustrine muds that entomb organic molecules.',
    recommendedInstruments: ['Deep UV Luminescence (SHERLOC)', 'Planetary XRF (PIXL)', 'Hermetic Sample Corer'],
    provenance: {
      source: 'NASA PDS / Mars 2020 PIXL and SHERLOC Science Archives',
      datasetName: 'urn:nasa:pds:mars2020_pixl:data_derived',
      mission: 'Mars 2020 Perseverance',
      instrument: 'SHERLOC & PIXL',
      observationDate: 'Sol 482 / 2022-06-28',
      spatialResolution: '100 micron beam',
      status: 'OBSERVED',
      limitations: 'Micro-abrasions required to penetrate superficial weathered dust patina.',
    },
  },
  {
    id: 'sci_seitah_olivine',
    name: 'Séítah Cumulate Olivine Outcrop',
    coordinate: { latitude: 18.4230, longitude: 77.4410 },
    category: 'IGNEOUS_BASEMENT',
    scientificValueScore: 8.7,
    samplingTimeMinutes: 40,
    description:
      'Coarse-grained olivine cumulate rock with carbonate and sulfate cement fillings in intergranular pore spaces.',
    hypothesizedSignificance:
      'Constrains magmatic chamber cooling on ancient Mars and dates the floor formation prior to lake flooding.',
    recommendedInstruments: ['PIXL Elemental Analysis', 'Laser-Induced Breakdown (SuperCam)'],
    provenance: {
      source: 'NASA Planetary Data System / SuperCam Archive',
      datasetName: 'M2020_SUPERCAM_RDR',
      mission: 'Mars 2020 Perseverance',
      instrument: 'SuperCam & RIMFAX',
      observationDate: 'Sol 295 / 2021-12-18',
      spatialResolution: '1 mm laser spot',
      status: 'OBSERVED',
      limitations: 'Dense sand ripples make adjacent rover/pedestrian transit difficult.',
    },
  },
  {
    id: 'sci_belva_breccia',
    name: 'Belva Crater Megabreccia & Boulders',
    coordinate: { latitude: 18.4740, longitude: 77.3820 },
    category: 'CRATER_RIM',
    scientificValueScore: 8.9,
    samplingTimeMinutes: 50,
    description:
      'Impact-excavated megaclasts (>5m boulders) displaying pre-impact deltaic bedding tilted by shock forces.',
    hypothesizedSignificance:
      'Exposes deep subterranean stratigraphy that would otherwise require deep drilling.',
    recommendedInstruments: ['Multispectral Mastcam', 'Alpha Particle X-Ray Spectrometer'],
    provenance: {
      source: 'NASA PDS / Mars 2020 Mastcam-Z Archive',
      datasetName: 'M2020_MASTCAMZ_CALIBRATED',
      mission: 'Mars 2020 Perseverance',
      instrument: 'Mastcam-Z Stereo Pairs',
      observationDate: 'Sol 772 / 2023-04-22',
      spatialResolution: '0.5 cm at 10m',
      status: 'OBSERVED',
      limitations: 'Rugged block field; traverse must navigate between megaclasts.',
    },
  },
  {
    id: 'sci_margin_stromatolite_proxy',
    name: 'Margin Carbonate Bio-Pattern Prospect',
    coordinate: { latitude: 18.5180, longitude: 77.3420 },
    category: 'CARBONATE_MINERAL',
    scientificValueScore: 9.9,
    samplingTimeMinutes: 70,
    description:
      'Prominent banded carbonate precipitation benches exhibiting undulating laminations resembling terrestrial microbialites.',
    hypothesizedSignificance:
      'Prime candidate for macro-morphological fossil biosignatures on Mars; exceptional astrobiology target.',
    recommendedInstruments: ['Hand Lens Micro-Imager', 'Reflectance Spectrometer', 'Core Drill'],
    provenance: {
      source: 'NASA PDS / CRISM Targeted Hyperspectral Mapping & HiRISE',
      datasetName: 'CRISM FRT000047A3_07 Spectral Parameter OLINDEX/MIN_INDEX',
      mission: 'Mars Reconnaissance Orbiter',
      instrument: 'CRISM & HiRISE',
      observationDate: '2007-03-12 (MRO orbit)',
      spatialResolution: '18 m/px hyperspectral',
      status: 'DERIVED',
      limitations: 'Spectrally identified from orbit; ground verification pending human Marswalk investigation.',
    },
  },
  {
    id: 'sci_neretva_boulders',
    name: 'Neretva Fluvial Conglomerates',
    coordinate: { latitude: 18.5430, longitude: 77.3030 },
    category: 'DELTAIC_SEDIMENT',
    scientificValueScore: 8.4,
    samplingTimeMinutes: 35,
    description:
      'Well-rounded cobbles and pebble-rich conglomerates cemented by iron oxides, deposited by high-energy floodwaters.',
    hypothesizedSignificance:
      'Sample provenance traces back over 100 km into the Noachian watershed beyond Jezero Crater.',
    recommendedInstruments: ['Petrographic Lens', 'Handheld XRF'],
    provenance: {
      source: 'NASA PDS / Mars 2020 Mastcam-Z & SuperCam',
      datasetName: 'M2020_NERETVA_TRANSECT',
      mission: 'Mars 2020 Perseverance',
      instrument: 'SuperCam LIBS',
      observationDate: 'Sol 1050 / 2024-02-05',
      spatialResolution: '1.5 mm',
      status: 'OBSERVED',
      limitations: 'Loose scree deposits along canyon slopes.',
    },
  },
];

export const JEZERO_ROVER_OBSERVATIONS: RoverObservation[] = [
  {
    id: 'rov_sol_224',
    mission: 'Perseverance (Mars 2020)',
    sol: 224,
    earthDate: '2021-10-06',
    coordinate: { latitude: 18.4312, longitude: 77.4475 },
    instrument: 'PIXL & SHERLOC',
    targetName: 'Bellegarde Abrasion Patch',
    observationSummary: 'Confirmed basaltic volcanic composition with localized sulfate veins.',
    sampleAcquired: true,
    provenance: {
      source: 'NASA Planetary Data System',
      datasetName: 'M2020_PIXL_EDR_0224',
      mission: 'Perseverance (Mars 2020)',
      instrument: 'PIXL',
      status: 'OBSERVED',
      spatialResolution: '120 um',
      limitations: 'Historical point sample.',
    },
  },
  {
    id: 'rov_sol_488',
    mission: 'Perseverance (Mars 2020)',
    sol: 488,
    earthDate: '2022-07-04',
    coordinate: { latitude: 18.4382, longitude: 77.4065 },
    instrument: 'SHERLOC Deep UV Raman',
    targetName: 'Wildcat Ridge Abrasion',
    observationSummary: 'Detected prominent aromatic organic molecular signatures correlated with sulfate minerals.',
    sampleAcquired: true,
    provenance: {
      source: 'NASA Planetary Data System',
      datasetName: 'M2020_SHERLOC_DERIVED_0488',
      mission: 'Perseverance (Mars 2020)',
      instrument: 'SHERLOC',
      status: 'OBSERVED',
      spatialResolution: '100 um',
      limitations: 'High fluorescence background requiring deconvolution.',
    },
  },
  {
    id: 'rov_sol_842',
    mission: 'Perseverance (Mars 2020)',
    sol: 842,
    earthDate: '2023-07-03',
    coordinate: { latitude: 18.4810, longitude: 77.3710 },
    instrument: 'SuperCam LIBS',
    targetName: 'Otis Peak Sandstone',
    observationSummary: 'Identified elevated phosphate and iron-magnesium signatures in cross-bedded quartz sandstone.',
    sampleAcquired: true,
    provenance: {
      source: 'NASA PDS Geosciences Node',
      datasetName: 'M2020_SUPERCAM_SPECTRA_0842',
      mission: 'Perseverance (Mars 2020)',
      instrument: 'SuperCam',
      status: 'OBSERVED',
      spatialResolution: '2 mm',
      limitations: 'Laser shot spot average.',
    },
  },
  {
    id: 'rov_sol_1102',
    mission: 'Perseverance (Mars 2020)',
    sol: 1102,
    earthDate: '2024-03-29',
    coordinate: { latitude: 18.5280, longitude: 77.3320 },
    instrument: 'RIMFAX Ground-Penetrating Radar',
    targetName: 'Bright Angel Subsurface Sounding',
    observationSummary: 'Radar profiling revealed shallow dipping reflections at ~15m depth, indicating ancient flood scours.',
    sampleAcquired: false,
    provenance: {
      source: 'NASA PDS / RIMFAX Radar Archive',
      datasetName: 'RIMFAX_RDR_SOL1102',
      mission: 'Perseverance (Mars 2020)',
      instrument: 'RIMFAX',
      status: 'OBSERVED',
      spatialResolution: '15 cm vertical',
      limitations: 'Dielectric constant assumed from terrestrial regolith analogs.',
    },
  },
];

export const JEZERO_HAZARD_ZONES: HazardZone[] = [
  {
    id: 'haz_scarp_wall',
    name: 'Hawkes Bay Delta Scarp Cliff Face',
    type: 'STEEP_SLOPE',
    coordinate: { latitude: 18.4340, longitude: 77.4120 },
    radiusMeters: 450,
    riskLevel: 'CRITICAL',
    slopeAngle: 26,
    description:
      'Extremely steep, friable sedimentary cliff scarp. Exceeds astronaut 20° stability threshold; high risk of suit puncture, rockfall, and footing collapse.',
    provenance: {
      source: 'NASA MRO HiRISE DTM (Elevation Gradient Derived)',
      datasetName: 'HiRISE_DTM_DTEEC_003442_1985',
      mission: 'Mars Reconnaissance Orbiter',
      instrument: 'HiRISE',
      status: 'DERIVED',
      spatialResolution: '1.0 m grid',
      limitations: 'Local rockfall instability cannot be dynamically predicted from orbital imagery.',
    },
  },
  {
    id: 'haz_seitah_dunes',
    name: 'Séítah South Active Dune Complex',
    type: 'SOFT_SAND_DRIFT',
    coordinate: { latitude: 18.4190, longitude: 77.4430 },
    radiusMeters: 550,
    riskLevel: 'HIGH',
    description:
      'Deep, uncompacted basaltic aeolian ripples with high sinkage coefficient. Suited walking leads to severe metabolic fatigue and slip; impassable for wheeled rovers.',
    provenance: {
      source: 'NASA Mars 2020 Hazcam Traverse Logs & HiRISE',
      datasetName: 'M2020_TRAVERSABILITY_MAP_SEITAH',
      mission: 'Mars 2020 Perseverance',
      status: 'DERIVED',
      spatialResolution: '0.5 m',
      limitations: 'Wind activity continuously reshapes ripple crests.',
    },
  },
  {
    id: 'haz_belva_boulder_field',
    name: 'Belva North-East Megaboulder Field',
    type: 'BOULDER_FIELD',
    coordinate: { latitude: 18.4790, longitude: 77.3870 },
    radiusMeters: 380,
    riskLevel: 'MEDIUM',
    description:
      'Dense distribution of jagged impact-ejecta boulders (0.8m to 3.5m diameter) with deep interstitial shadow traps. High risk of tripping and umbilical snagging.',
    provenance: {
      source: 'NASA MRO HiRISE Automated Rock Counter Algorithm',
      datasetName: 'HIRISE_BOULDER_CATALOG_JEZERO',
      mission: 'Mars Reconnaissance Orbiter',
      status: 'DERIVED',
      spatialResolution: '25 cm/px',
      limitations: 'Boulders < 0.5m diameter below orbital detection threshold.',
    },
  },
  {
    id: 'haz_crater_rim_gully',
    name: 'Jezero Western Outer Rim Escarpment',
    type: 'STEEP_SLOPE',
    coordinate: { latitude: 18.5100, longitude: 77.2950 },
    radiusMeters: 600,
    riskLevel: 'CRITICAL',
    slopeAngle: 28,
    description:
      'Pre-Noachian crater wall scarp with loose scree runout chutes. Strictly prohibited for un-tethered pedestrian EVA.',
    provenance: {
      source: 'NASA MGS MOLA & HRSC Merged Topography',
      datasetName: 'MOLA_HRSC_BLENDED_DEM_200M',
      mission: 'Mars Global Surveyor / Mars Express',
      status: 'OBSERVED',
      spatialResolution: '50 m/px',
      limitations: 'Averaged orbital DEM smooths micro-cliffs.',
    },
  },
];

export const JEZERO_RESOURCE_SITES: ResourceSite[] = [
  {
    id: 'res_delta_smectite',
    name: 'Delta Bottomset Hydrated Smectite Clay Deposit',
    coordinate: { latitude: 18.4370, longitude: 77.4110 },
    resourceType: 'CLAY_BOUND_WATER',
    confidence: 'HIGH',
    detectionMethod: 'CRISM 1.9 & 2.2 um metal-OH vibrational overtone spectroscopy',
    estimatedAbundance: '4.8% to 7.2% structural H2O by weight (thermally extractable at 450°C)',
    description:
      'Extensive layered deposit of iron-magnesium smectite clays formed by protracted aqueous alteration. Prime candidate for in-situ resource utilization (ISRU) water extraction without requiring polar ice mining.',
    provenance: {
      source: 'NASA PDS / MRO CRISM Science Team',
      datasetName: 'CRISM Targeted Observation HRL000040FF_07',
      mission: 'Mars Reconnaissance Orbiter',
      instrument: 'CRISM (Compact Reconnaissance Imaging Spectrometer for Mars)',
      status: 'DERIVED',
      spatialResolution: '18 m/px',
      limitations: 'Reflectance spectroscopy queries upper tens of microns; depth volume modeled from stratigraphic dip.',
    },
  },
  {
    id: 'res_margin_carbonate',
    name: 'Margin Carbonate & Magnesite Unit',
    coordinate: { latitude: 18.5170, longitude: 77.3450 },
    resourceType: 'CARBONATE_DEPOSIT',
    confidence: 'HIGH',
    detectionMethod: 'CRISM 2.3 & 2.5 um absorption doublet & Mastcam-Z multispectral validation',
    estimatedAbundance: '18% to 32% Mg/Ca-carbonate fraction',
    description:
      'Massive lacustrine shoreline carbonate deposit. In addition to bio-preservation, provides mineral feedstock for construction binders, radiation shields, and oxygen/CO2 chemical extraction cycles.',
    provenance: {
      source: 'NASA PDS / MRO CRISM & Mars 2020 Science Team',
      datasetName: 'MRO_CRISM_MSP000085A3',
      mission: 'Mars Reconnaissance Orbiter',
      instrument: 'CRISM & Mastcam-Z',
      status: 'DERIVED',
      spatialResolution: '18 m/px',
      limitations: 'Superficial dust contamination creates local spectral dilution.',
    },
  },
  {
    id: 'res_rim_subsurface_proxy',
    name: 'North-West Periglacial Subsurface Ice Proxy',
    coordinate: { latitude: 18.5520, longitude: 77.2920 },
    resourceType: 'SUBSURFACE_ICE_PROXY',
    confidence: 'LOW',
    detectionMethod: 'SHARAD orbital radar dielectric attenuation & thermal inertia modeling',
    estimatedAbundance: 'Modeled pore ice at 1.2m to 2.8m regolith depth',
    description:
      'High thermal inertia anomaly coupled with low radar reflectivity, consistent with relict cemented pore-ice in protected northern shadow gullies.',
    provenance: {
      source: 'NASA MRO SHARAD / Mars Odyssey THEMIS Team',
      datasetName: 'SHARAD_RADAR_GRAM_0842201 & THEMIS_THERMAL_INERTIA',
      mission: 'Mars Reconnaissance Orbiter & Mars Odyssey',
      status: 'MODELED',
      spatialResolution: '300 m along-track radar resolution',
      limitations: 'Pore ice at equatorial latitudes is unstable over astronomical timescales; requires drill verification.',
    },
  },
];
