// Mars Human Exploration Candidate Landing Sites & Multi-Factor Assessment Engine
// Based on NASA Human Landing Sites Study (HLS2) and LPI Mars Exploration Workshop data.

export interface HumanCandidateSite {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevationM: number;
  region: string;
  primaryAdvantage: string;
  iceEvidence: {
    type: 'Shallow Subsurface Sheet Ice' | 'Lobate Debris Apron Glacier' | 'Hydrated Phyllosilicates / Clays';
    depthM: number;
    depthDisplay: string;
    radarConfidence: 'Confirmed (SHARAD / SWIM)' | 'High Probability' | 'Orbital Spectroscopy (CRISM)';
  };
  evaluation: {
    atmosphericBrakingScore: number; // 0-100 (lower elevation = denser air for aerodynamic drag)
    solarThermalScore: number; // 0-100 (closer to equator = higher solar insolation, milder night cryogenic lows)
    isruWaterScore: number; // 0-100 (abundance and ease of ice extraction)
    terrainSafetyScore: number; // 0-100 (flat slopes < 5°, low boulder hazards)
    scienceDiversityScore: number; // 0-100 (access to multiple geological epochs and astrobiological targets)
    overallSuitabilityIndex: number; // 0-100 weighted
  };
  isruCapacity: {
    waterExtractionDifficulty: 'Low (< 1.5m drill)' | 'Moderate (2-5m overburden)' | 'High (Thermal stripping of clays)';
    estPropellantProductionDays: number; // Sols needed for full return propellant ascent vehicle (MVA)
    baseType: 'ISRU Industrial Outpost' | 'Science Research Station' | 'Glacial Drilling Camp';
  };
  hazards: string[];
  scientificObjectives: string[];
  dataSource: string;
}

export const HUMAN_CANDIDATE_SITES: HumanCandidateSite[] = [
  {
    id: 'arcadia_planitia',
    name: 'Arcadia Planitia (Northern Lowlands)',
    lat: 39.2,
    lng: 189.7,
    elevationM: -4100,
    region: 'Arcadia Quadrangle (MC-07)',
    primaryAdvantage: 'Vast shallow sheet ice beneath centimeters of regolith; lowest elevation provides maximum atmospheric braking.',
    iceEvidence: {
      type: 'Shallow Subsurface Sheet Ice',
      depthM: 0.8,
      depthDisplay: '0.5 – 1.5 m (Directly accessible with mechanical trenching)',
      radarConfidence: 'Confirmed (SHARAD / SWIM)',
    },
    evaluation: {
      atmosphericBrakingScore: 96,
      solarThermalScore: 78,
      isruWaterScore: 98,
      terrainSafetyScore: 94,
      scienceDiversityScore: 72,
      overallSuitabilityIndex: 89,
    },
    isruCapacity: {
      waterExtractionDifficulty: 'Low (< 1.5m drill)',
      estPropellantProductionDays: 480,
      baseType: 'ISRU Industrial Outpost',
    },
    hazards: [
      'Sublimation cratering if thermal insulation is disturbed.',
      'Winter sol daytime duration reduced (42% lower solar energy in winter solstice).',
      'Seasonal dust layer accumulation on photovoltaic arrays.',
    ],
    scientificObjectives: [
      'Extract pristine Martian ice cores to reconstruct recent Amazonian climate cyclicity.',
      'Investigate periglacial polygon patterned ground and underground cryogenic structures.',
      'Test large-scale automated Sabatier fuel plant operation.',
    ],
    dataSource: 'NASA Subsurface Water Ice Mapping (SWIM) / MRO SHARAD / MGS MOLA',
  },

  {
    id: 'deuteronilus_mensae',
    name: 'Deuteronilus Mensae (Lobate Glaciers)',
    lat: 43.9,
    lng: 337.4,
    elevationM: -2900,
    region: 'Ismenius Lacus (MC-05)',
    primaryAdvantage: 'Vast debris-covered mountain glaciers hundreds of meters thick protected beneath rocky mantle.',
    iceEvidence: {
      type: 'Lobate Debris Apron Glacier',
      depthM: 2.2,
      depthDisplay: '1.5 – 3.0 m (Debris-covered relict glacier ~300m thick)',
      radarConfidence: 'Confirmed (SHARAD / SWIM)',
    },
    evaluation: {
      atmosphericBrakingScore: 84,
      solarThermalScore: 68,
      isruWaterScore: 95,
      terrainSafetyScore: 81,
      scienceDiversityScore: 88,
      overallSuitabilityIndex: 83,
    },
    isruCapacity: {
      waterExtractionDifficulty: 'Moderate (2-5m overburden)',
      estPropellantProductionDays: 520,
      baseType: 'Glacial Drilling Camp',
    },
    hazards: [
      'Mesa escarpments pose rockfall hazards near glacier aprons.',
      'Higher latitude requires supplemental nuclear fission surface power (Kilopower).',
    ],
    scientificObjectives: [
      'Deep ice drilling into 100-million-year-old glacial ice layers.',
      'Study dichotomy boundary tectonic scarp evolution.',
    ],
    dataSource: 'MRO SHARAD Radar Sounder / HRSC Stereo Topography',
  },

  {
    id: 'utopia_planitia',
    name: 'Utopia Planitia Basin',
    lat: 46.7,
    lng: 117.5,
    elevationM: -4200,
    region: 'Casius Quadrangle (MC-06)',
    primaryAdvantage: 'Enormous underground ice deposit exceeding Lake Superior in water volume; exceptionally flat terrain.',
    iceEvidence: {
      type: 'Shallow Subsurface Sheet Ice',
      depthM: 1.8,
      depthDisplay: '1.0 – 2.5 m (Widespread thick ice sheet deposit)',
      radarConfidence: 'Confirmed (SHARAD / SWIM)',
    },
    evaluation: {
      atmosphericBrakingScore: 98,
      solarThermalScore: 64,
      isruWaterScore: 94,
      terrainSafetyScore: 92,
      scienceDiversityScore: 75,
      overallSuitabilityIndex: 85,
    },
    isruCapacity: {
      waterExtractionDifficulty: 'Low (< 1.5m drill)',
      estPropellantProductionDays: 500,
      baseType: 'ISRU Industrial Outpost',
    },
    hazards: [
      'Severe winter night temperatures (-125°C).',
      'Permafrost frost-heave cycles affecting permanent foundation structures.',
    ],
    scientificObjectives: [
      'Characterize the ancient Utopia impact mega-basin sediments.',
      'Analyze ground ice purity and isotopic deuterium/hydrogen (D/H) ratio.',
    ],
    dataSource: 'University of Texas / NASA SHARAD Survey / Tianwen-1 Subsurface Radar',
  },

  {
    id: 'jezero_human_base',
    name: 'Jezero Crater & Nili Fossae Foothills',
    lat: 18.4,
    lng: 77.5,
    elevationM: -2550,
    region: 'Syrtis Major Quadrangle (MC-13)',
    primaryAdvantage: 'Supreme astrobiological return, clay-rich regolith, and pre-cached return samples from Perseverance.',
    iceEvidence: {
      type: 'Hydrated Phyllosilicates / Clays',
      depthM: 0.1,
      depthDisplay: 'Surface to 0.5 m (Hydrated smectite clays & carbonate minerals, 5-8% water by mass)',
      radarConfidence: 'Orbital Spectroscopy (CRISM)',
    },
    evaluation: {
      atmosphericBrakingScore: 82,
      solarThermalScore: 95,
      isruWaterScore: 68,
      terrainSafetyScore: 83,
      scienceDiversityScore: 99,
      overallSuitabilityIndex: 86,
    },
    isruCapacity: {
      waterExtractionDifficulty: 'High (Thermal stripping of clays)',
      estPropellantProductionDays: 610,
      baseType: 'Science Research Station',
    },
    hazards: [
      'Delta front scarps and bouldery impact ejecta limit rover trafficability in certain sectors.',
      'Extracting water requires high electrical energy to heat clays to 400°C.',
    ],
    scientificObjectives: [
      'Direct human laboratory examination of ancient river delta lacustrine biosignatures.',
      'Sample multiple billion years of geological stratigraphy across the Nili Fossae regional fracture.',
    ],
    dataSource: 'Mars 2020 Mission Science Team / CRISM / HiRISE',
  },

  {
    id: 'mawrth_vallis',
    name: 'Mawrth Vallis Ancient River Valley',
    lat: 23.9,
    lng: 341.1,
    elevationM: -2850,
    region: 'Oxia Palus Quadrangle (MC-11)',
    primaryAdvantage: 'Exposes thickest sequence of clay-bearing rocks on Mars with prime astrobiological habitability record.',
    iceEvidence: {
      type: 'Hydrated Phyllosilicates / Clays',
      depthM: 0.2,
      depthDisplay: 'Directly exposed at surface (Aluminum & Iron/Magnesium smectites)',
      radarConfidence: 'Orbital Spectroscopy (CRISM)',
    },
    evaluation: {
      atmosphericBrakingScore: 86,
      solarThermalScore: 91,
      isruWaterScore: 71,
      terrainSafetyScore: 80,
      scienceDiversityScore: 97,
      overallSuitabilityIndex: 85,
    },
    isruCapacity: {
      waterExtractionDifficulty: 'High (Thermal stripping of clays)',
      estPropellantProductionDays: 590,
      baseType: 'Science Research Station',
    },
    hazards: [
      'Inverted river channels and yardangs can impede surface mobility.',
      'Requires thermal baking reactor for regolith water extraction.',
    ],
    scientificObjectives: [
      'Explore the Noachian-Hesperian transition recorded in stratified clay beds.',
      'Search for fossilized microstructures in protected clay layers.',
    ],
    dataSource: 'ESA / NASA Joint Landing Site Working Group / CRISM',
  },
];
