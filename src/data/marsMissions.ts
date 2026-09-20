// MarsWay Comprehensive Mars Missions Intelligence Database
// Grounded in NASA, ESA, ISRO, CNSA, and UAE Space Agency mission catalogs.

export type MissionType = 'rover' | 'lander' | 'orbiter';
export type MissionStatus = 'active' | 'completed' | 'lost';

export interface MarsMissionWaypoint {
  sol: number;
  name: string;
  lat: number;
  lng: number;
  elevationM: number;
  discovery: string;
  instrumentsUsed?: string[];
}

export interface MarsMission {
  id: string;
  name: string;
  agency: string;
  type: MissionType;
  launchDate: string;
  arrivalDate: string;
  status: MissionStatus;
  statusDisplay: string;
  lat?: number;
  lng?: number;
  elevationM?: number;
  landingSiteName?: string;
  orbitType?: string;
  objectives: string[];
  keyDiscoveries: string[];
  featured?: boolean;
  traverseTrack?: MarsMissionWaypoint[];
  dataSource: string;
}

export const MARS_MISSIONS_DATA: MarsMission[] = [
  // 1. Perseverance Rover & Ingenuity Helicopter
  {
    id: 'perseverance',
    name: 'Mars 2020 Perseverance & Ingenuity',
    agency: 'NASA / JPL',
    type: 'rover',
    launchDate: 'July 30, 2020',
    arrivalDate: 'February 18, 2021',
    status: 'active',
    statusDisplay: 'Operational (Sol 1400+)',
    lat: 18.38,
    lng: 77.58,
    elevationM: -2560,
    landingSiteName: 'Jezero Crater (Octavia E. Butler Landing)',
    objectives: [
      'Seek signs of ancient microbial life in lacustrine delta deposits.',
      'Collect and seal scientifically selected rock and regolith core samples for future Mars Sample Return.',
      'Demonstrate in-situ oxygen production from atmospheric CO2 using MOXIE.',
      'Fly the first powered, controlled aircraft on another planet (Ingenuity completed 72 flights).',
    ],
    keyDiscoveries: [
      'Confirmed ancient river delta with igneous basalt floor and mudstones.',
      'Discovered organic carbon molecules preserved in delta sedimentary layers.',
      'MOXIE generated 122 grams of breathable oxygen from atmospheric CO2.',
      'Successfully sealed 25+ geological core samples in titanium tubes.',
    ],
    featured: true,
    dataSource: 'NASA Mars 2020 Mission / PDS Geosciences Node',
    traverseTrack: [
      {
        sol: 0,
        name: 'Octavia E. Butler Landing Site',
        lat: 18.4447,
        lng: 77.4509,
        elevationM: -2560,
        discovery: 'Touchdown point on crater floor basalt unit; sky crane deployed successfully.',
        instrumentsUsed: ['Mastcam-Z', 'SuperCam', 'EDL Cameras'],
      },
      {
        sol: 85,
        name: 'Séítah South Ripple Dunes',
        lat: 18.435,
        lng: 77.442,
        elevationM: -2565,
        discovery: 'Olivine-rich cumulate igneous rock unit representing ancient magma body crystallization.',
        instrumentsUsed: ['PIXL', 'SHERLOC', 'SuperCam'],
      },
      {
        sol: 210,
        name: 'Artuby Ridge & Dourbes Outcrop',
        lat: 18.441,
        lng: 77.426,
        elevationM: -2548,
        discovery: 'First abraded rock target confirming fine-grained volcanic composition with salt alterations.',
        instrumentsUsed: ['PIXL', 'SHERLOC', 'WATSON'],
      },
      {
        sol: 410,
        name: 'Hawkes Bay Delta Front Scarp',
        lat: 18.455,
        lng: 77.411,
        elevationM: -2520,
        discovery: 'Ascended the ancient river delta; observed cross-bedded river sandstone and conglomerates.',
        instrumentsUsed: ['RIMFAX', 'Mastcam-Z', 'SuperCam'],
      },
      {
        sol: 680,
        name: 'Enchanted Lake Mudstone Outcrop',
        lat: 18.468,
        lng: 77.395,
        elevationM: -2480,
        discovery: 'Fine-grained sedimentary mudstone showing highest concentrations of organic macromolecules.',
        instrumentsUsed: ['SHERLOC', 'PIXL', 'SuperCam'],
      },
      {
        sol: 890,
        name: 'Tenacity Hill Scarp',
        lat: 18.479,
        lng: 77.382,
        elevationM: -2440,
        discovery: 'Upper delta strata formed during high-energy river flood episodes carrying distant boulders.',
        instrumentsUsed: ['Mastcam-Z', 'SuperCam'],
      },
      {
        sol: 1150,
        name: 'Margin Carbonate Unit Outcrop',
        lat: 18.487,
        lng: 77.369,
        elevationM: -2410,
        discovery: 'Abundant magnesium carbonates formed along ancient lake shoreline; prime astrobiology target.',
        instrumentsUsed: ['PIXL', 'SHERLOC', 'RIMFAX'],
      },
    ],
  },

  // 2. Curiosity Rover (MSL)
  {
    id: 'curiosity',
    name: 'Mars Science Laboratory (Curiosity)',
    agency: 'NASA / JPL',
    type: 'rover',
    launchDate: 'November 26, 2011',
    arrivalDate: 'August 6, 2012',
    status: 'active',
    statusDisplay: 'Operational (Sol 4400+)',
    lat: -4.59,
    lng: 137.44,
    elevationM: -4450,
    landingSiteName: 'Gale Crater (Bradbury Landing)',
    objectives: [
      'Determine whether Gale Crater ever offered an environment favorable for microbial life.',
      'Investigate the layered sedimentary stack of Mount Sharp (Aeolis Mons).',
      'Assess planetary habitability and radiation environment for future crewed exploration.',
    ],
    keyDiscoveries: [
      'Discovered that ancient Gale Crater held fresh-water lakes with all key chemical building blocks for life.',
      'Detected diverse organic carbon molecules and cyclical atmospheric methane spikes.',
      'Measured surface radiation dosage with RAD, establishing baseline for human Mars transit.',
      'Climbed over 400 vertical meters up Mount Sharp, traversing through clay, sulfate, and silica eras.',
    ],
    featured: true,
    dataSource: 'NASA PDS Geosciences & Planetary Data System',
    traverseTrack: [
      {
        sol: 0,
        name: 'Bradbury Landing',
        lat: -4.5895,
        lng: 137.4417,
        elevationM: -4450,
        discovery: 'Touchdown point on gravel plains carved by ancestral crater wall alluvium.',
        instrumentsUsed: ['Mastcam', 'Hazcam', 'ChemCam'],
      },
      {
        sol: 125,
        name: 'Yellowknife Bay (John Klein Drill)',
        lat: -4.592,
        lng: 137.456,
        elevationM: -4520,
        discovery: 'Mudstone sediment showing neutral pH, low salinity, and essential elements (C, H, N, O, P, S).',
        instrumentsUsed: ['SAM', 'CheMin', 'APXS'],
      },
      {
        sol: 750,
        name: 'Pahrump Hills (Base of Mount Sharp)',
        lat: -4.675,
        lng: 137.382,
        elevationM: -4420,
        discovery: 'Transition from crater plains into the basal layers of the 5.5 km high central mound.',
        instrumentsUsed: ['MAHLI', 'CheMin', 'ChemCam'],
      },
      {
        sol: 1170,
        name: 'Bagnold Dunes Field',
        lat: -4.685,
        lng: 137.375,
        elevationM: -4380,
        discovery: 'First in-situ study of active, moving extraterrestrial sand dunes on another world.',
        instrumentsUsed: ['REMS', 'Mastcam', 'APXS'],
      },
      {
        sol: 1800,
        name: 'Vera Rubin Ridge',
        lat: -4.712,
        lng: 137.362,
        elevationM: -4210,
        discovery: 'Prominent topographic ridge rich in crystalline hematite, indicating groundwater flow.',
        instrumentsUsed: ['ChemCam', 'Mastcam', 'CheMin'],
      },
      {
        sol: 2300,
        name: 'Glen Torridon Clay-Bearing Unit',
        lat: -4.728,
        lng: 137.355,
        elevationM: -4180,
        discovery: 'Trough containing highest abundance of clay minerals (smectite) in Gale Crater.',
        instrumentsUsed: ['SAM', 'CheMin', 'DAN'],
      },
      {
        sol: 4100,
        name: 'Gediz Vallis Ridge Scarp',
        lat: -4.745,
        lng: 137.342,
        elevationM: -3950,
        discovery: 'Massive boulders deposited in violent debris flows late in Gale Crater history.',
        instrumentsUsed: ['Mastcam', 'ChemCam', 'DAN'],
      },
    ],
  },

  // 3. Opportunity Rover (MER-B)
  {
    id: 'opportunity',
    name: 'Mars Exploration Rover Opportunity',
    agency: 'NASA / JPL',
    type: 'rover',
    launchDate: 'July 7, 2003',
    arrivalDate: 'January 25, 2004',
    status: 'completed',
    statusDisplay: 'Completed (2004–2018, 5,352 Sols)',
    lat: -1.95,
    lng: 354.47,
    elevationM: -1400,
    landingSiteName: 'Meridiani Planum (Eagle Crater)',
    objectives: [
      'Search for and characterize a wide range of rocks and soils that hold clues to past water activity.',
      'Explore the vast plains of Meridiani Planum, driven by orbital hematite detections.',
    ],
    keyDiscoveries: [
      'Discovered gray hematite spherules nicknamed "blueberries" formed in acidic ancient groundwater.',
      'Drove 45.16 kilometers (28.06 miles), the off-world driving record for any planetary rover.',
      'Discovered gypsum veins at Endeavour Crater, direct evidence of neutral-water mineral precipitation.',
    ],
    featured: true,
    dataSource: 'NASA Planetary Data System MER Archives',
    traverseTrack: [
      {
        sol: 0,
        name: 'Eagle Crater (Hole-in-One Landing)',
        lat: -1.946,
        lng: 354.473,
        elevationM: -1400,
        discovery: 'Directly hit an impact crater exposing sulfate-rich outcrop with hematite spherules.',
        instrumentsUsed: ['Pancam', 'Microscopic Imager', 'Mossbauer Spectrometer'],
      },
      {
        sol: 130,
        name: 'Endurance Crater Basin',
        lat: -1.95,
        lng: 354.505,
        elevationM: -1415,
        discovery: 'Descended crater walls revealing multi-meter stratified layers formed by ancient water.',
        instrumentsUsed: ['APXS', 'RAT Rock Abrasion Tool'],
      },
      {
        sol: 950,
        name: 'Victoria Crater Duck Bay',
        lat: -2.05,
        lng: 354.49,
        elevationM: -1380,
        discovery: 'Dramatic scallop-edged 800m crater showing massive eolian sand dune beds.',
        instrumentsUsed: ['Pancam', 'Microscopic Imager'],
      },
      {
        sol: 2700,
        name: 'Endeavour Crater / Cape York',
        lat: -2.28,
        lng: 354.68,
        elevationM: -1320,
        discovery: 'Ancient Noachian bedrock rim containing pure gypsum veins deposited by neutral water.',
        instrumentsUsed: ['APXS', 'Pancam', 'Microscopic Imager'],
      },
    ],
  },

  // 4. Spirit Rover (MER-A)
  {
    id: 'spirit',
    name: 'Mars Exploration Rover Spirit',
    agency: 'NASA / JPL',
    type: 'rover',
    launchDate: 'June 10, 2003',
    arrivalDate: 'January 4, 2004',
    status: 'completed',
    statusDisplay: 'Completed (2004–2010, 2,210 Sols)',
    lat: -14.57,
    lng: 175.47,
    elevationM: -1900,
    landingSiteName: 'Gusev Crater (Columbia Memorial Station)',
    objectives: [
      'Investigate ancient lakebed sediments inside the 160 km wide Gusev Crater.',
      'Explore the Columbia Hills for signs of hydrothermal and volcanic water alteration.',
    ],
    keyDiscoveries: [
      'Discovered pure silica deposits at Home Plate, conclusive evidence of ancient hot springs or fumaroles.',
      'Found carbonate-rich outcrops proving non-acidic water was present in early Martian history.',
      'Traveled 7.73 kilometers and ascended Husband Hill, revealing panoramic vistas of Gusev.',
    ],
    featured: true,
    dataSource: 'NASA Planetary Data System MER Archives',
  },

  // 5. InSight Mars Lander
  {
    id: 'insight',
    name: 'InSight Mars Geophysical Lander',
    agency: 'NASA / CNES / DLR',
    type: 'lander',
    launchDate: 'May 5, 2018',
    arrivalDate: 'November 26, 2018',
    status: 'completed',
    statusDisplay: 'Completed (2018–2022, 1,440 Sols)',
    lat: 4.5024,
    lng: 135.6234,
    elevationM: -2613,
    landingSiteName: 'Elysium Planitia',
    objectives: [
      'Probe the deep interior of Mars using the SEIS seismometer.',
      'Determine crust thickness, mantle composition, and liquid core radius.',
      'Record local weather, atmospheric pressure waves, and magnetic field.',
    ],
    keyDiscoveries: [
      'Detected over 1,300 marsquakes, confirming active tectonic and magma movement.',
      'Discovered that Mars has a large liquid iron-nickel core with radius of ~1,830 km.',
      'Measured crustal thickness (24–72 km) and detected deep subsurface fractured rock saturated with liquid water.',
    ],
    featured: true,
    dataSource: 'NASA InSight PDS Geophysical Archives',
  },

  // 6. Phoenix Mars Lander
  {
    id: 'phoenix',
    name: 'Phoenix Mars Lander',
    agency: 'NASA / University of Arizona',
    type: 'lander',
    launchDate: 'August 4, 2007',
    arrivalDate: 'May 25, 2008',
    status: 'completed',
    statusDisplay: 'Completed (May–Nov 2008)',
    lat: 68.2188,
    lng: 234.2508,
    elevationM: -4120,
    landingSiteName: 'Vastitas Borealis (Green Valley)',
    objectives: [
      'Search for a habitable zone in the ice-rich Arctic soil.',
      'Analyze subsurface water-ice using robotic arm scoop and thermal evolved gas analyzer (TEGA).',
    ],
    keyDiscoveries: [
      'Directly verified and scooped pure subsurface water-ice just a few centimeters below dry regolith.',
      'Observed snow falling from high-altitude clouds (virga) and melting ice chunks in dig trenches.',
      'Discovered perchlorate salts in Martian regolith, revealing oxidant soil chemistry.',
    ],
    featured: true,
    dataSource: 'NASA PDS Phoenix Archives',
  },

  // 7. Viking 1 Lander
  {
    id: 'viking1',
    name: 'Viking 1 Lander & Orbiter',
    agency: 'NASA / Langley',
    type: 'lander',
    launchDate: 'August 20, 1975',
    arrivalDate: 'July 20, 1976',
    status: 'completed',
    statusDisplay: 'Completed (1976–1982, 2,245 Sols)',
    lat: 22.48,
    lng: 312.05,
    elevationM: -2690,
    landingSiteName: 'Chryse Planitia (Thomas Mutch Memorial)',
    objectives: [
      'Execute the first successful soft landing and long-duration surface mission on Mars.',
      'Perform biological experiments searching for microbial metabolism.',
    ],
    keyDiscoveries: [
      'First color photos from the surface of Mars, showing a reddish-orange sky and boulder-strewn desert.',
      'Conducted biology experiments that revealed chemically reactive oxidant soil rather than biology.',
      'Transmitted first continuous surface weather monitoring for over 6 Earth years.',
    ],
    featured: true,
    dataSource: 'NASA PDS Viking Archives',
  },

  // 8. Viking 2 Lander
  {
    id: 'viking2',
    name: 'Viking 2 Lander & Orbiter',
    agency: 'NASA / Langley',
    type: 'lander',
    launchDate: 'September 9, 1975',
    arrivalDate: 'September 3, 1976',
    status: 'completed',
    statusDisplay: 'Completed (1976–1980, 1,281 Sols)',
    lat: 48.27,
    lng: 134.03,
    elevationM: -4050,
    landingSiteName: 'Utopia Planitia',
    objectives: [
      'Study surface geology, atmosphere, and biology in the northern high plains.',
    ],
    keyDiscoveries: [
      'Observed water-frost coating the red rocks during winter in Utopia Planitia.',
      'Recorded one marsquake on its deck-mounted seismometer.',
    ],
    featured: false,
    dataSource: 'NASA PDS Viking Archives',
  },

  // 9. Mars Pathfinder & Sojourner
  {
    id: 'pathfinder',
    name: 'Mars Pathfinder & Sojourner Rover',
    agency: 'NASA / JPL',
    type: 'rover',
    launchDate: 'December 4, 1996',
    arrivalDate: 'July 4, 1997',
    status: 'completed',
    statusDisplay: 'Completed (July–Sept 1997)',
    lat: 19.33,
    lng: 326.45,
    elevationM: -3680,
    landingSiteName: 'Ares Vallis (Carl Sagan Memorial Station)',
    objectives: [
      'Demonstrate low-cost airbag landing system and first micro-rover mobility on another planet.',
      'Analyze catastrophic outflow channel rocks in Ares Vallis.',
    ],
    keyDiscoveries: [
      'Sojourner analyzed famous rocks named Yogi, Barnacle Bill, and Flat Top using APXS.',
      'Confirmed Ares Vallis was carved by massive catastrophic floods of liquid water.',
    ],
    featured: true,
    dataSource: 'NASA PDS Pathfinder Archives',
  },

  // 10. Zhurong Rover (Tianwen-1)
  {
    id: 'zhurong',
    name: 'Tianwen-1 & Zhurong Rover',
    agency: 'CNSA (China National Space Administration)',
    type: 'rover',
    launchDate: 'July 23, 2020',
    arrivalDate: 'May 14, 2021',
    status: 'completed',
    statusDisplay: 'Completed (358 Sols, 1.9 km drive)',
    lat: 25.066,
    lng: 109.925,
    elevationM: -4100,
    landingSiteName: 'Southern Utopia Planitia',
    objectives: [
      'Analyze soil characteristics, magnetic fields, and water-ice distribution using sub-surface ground penetrating radar.',
    ],
    keyDiscoveries: [
      'Rover subsurface radar revealed buried layered flood deposits down to 80 meters depth.',
      'Discovered hydrated minerals formed during recent episodic groundwater activity.',
    ],
    featured: true,
    dataSource: 'CNSA Planetary Exploration Data System',
  },

  // 11. Mars Reconnaissance Orbiter (MRO)
  {
    id: 'mro',
    name: 'Mars Reconnaissance Orbiter (MRO)',
    agency: 'NASA / JPL',
    type: 'orbiter',
    launchDate: 'August 12, 2005',
    arrivalDate: 'March 10, 2006',
    status: 'active',
    statusDisplay: 'Operational (High-Res Orbital Reconnaissance)',
    orbitType: 'Sun-synchronous polar orbit (~250 x 316 km altitude)',
    objectives: [
      'Image surface features at unprecedented 30 cm/pixel resolution with HiRISE.',
      'Probe shallow subsurface ice with SHARAD radar.',
      'Provide ultra-high-bandwidth telecommunications relay for active rovers on surface.',
    ],
    keyDiscoveries: [
      'Mapped thousands of avalanche gullies, Recurring Slope Lineae (RSL), and moving sand dunes.',
      'Discovered massive subsurface glacial sheets (lobate debris aprons) across mid-latitudes.',
      'Imaged every active and historic Mars landing craft and rover tracks from orbit.',
    ],
    featured: true,
    dataSource: 'NASA PDS Cartography and Imaging Sciences Node',
  },

  // 12. Mars Odyssey
  {
    id: 'odyssey',
    name: '2001 Mars Odyssey',
    agency: 'NASA / JPL',
    type: 'orbiter',
    launchDate: 'April 7, 2001',
    arrivalDate: 'October 24, 2001',
    status: 'active',
    statusDisplay: 'Operational (Longest-Operating Mars Spacecraft)',
    orbitType: 'Sun-synchronous circular orbit (~400 km altitude)',
    objectives: [
      'Map global mineralogy and thermal inertia using THEMIS 9-band infrared camera.',
      'Detect hydrogen enrichment (water-ice indicator) using Gamma Ray Spectrometer (GRS).',
    ],
    keyDiscoveries: [
      'First definitive global orbital discovery of vast subsurface water-ice deposits on Mars.',
      'Created the definitive global daytime and nighttime thermal infrared basemaps.',
    ],
    featured: true,
    dataSource: 'NASA PDS Odyssey THEMIS / ASU Node',
  },

  // 13. MAVEN
  {
    id: 'maven',
    name: 'Mars Atmosphere and Volatile EvolutioN (MAVEN)',
    agency: 'NASA / LASP',
    type: 'orbiter',
    launchDate: 'November 18, 2013',
    arrivalDate: 'September 22, 2014',
    status: 'active',
    statusDisplay: 'Operational (Atmospheric Stripping & Ionosphere)',
    orbitType: 'Elliptical orbit (~150 x 6,200 km altitude)',
    objectives: [
      'Determine the role that loss of volatiles to space had on changing the Martian climate through time.',
      'Measure atmospheric escape rates driven by solar wind interaction.',
    ],
    keyDiscoveries: [
      'Proved that solar storms and ultraviolet radiation stripped away the majority of early Mars atmosphere.',
      'Discovered metal ions in the ionosphere and mapped global ultraviolet auroras.',
    ],
    featured: true,
    dataSource: 'NASA PDS Atmospheric Node',
  },

  // 14. Mars Express
  {
    id: 'mex',
    name: 'Mars Express',
    agency: 'ESA (European Space Agency)',
    type: 'orbiter',
    launchDate: 'June 2, 2003',
    arrivalDate: 'December 25, 2003',
    status: 'active',
    statusDisplay: 'Operational (ESA Flagship Orbiter)',
    orbitType: 'Polar elliptical orbit (~340 x 10,500 km altitude)',
    objectives: [
      'High-resolution stereoscopic 3D color mapping with HRSC.',
      'Subsurface radar sounding with MARSIS looking for deep aquifers.',
    ],
    keyDiscoveries: [
      'Confirmed methane traces in the Martian atmosphere.',
      'Detected bright subglacial radar reflections beneath the South Polar layered deposits.',
    ],
    featured: true,
    dataSource: 'ESA Planetary Science Archive (PSA)',
  },

  // 15. Emirates Mars Mission (Hope Probe)
  {
    id: 'hope',
    name: 'Emirates Mars Mission (Hope Probe)',
    agency: 'UAESA / MBRSC',
    type: 'orbiter',
    launchDate: 'July 19, 2020',
    arrivalDate: 'February 9, 2021',
    status: 'active',
    statusDisplay: 'Operational (Global Weather & Discrete Auroras)',
    orbitType: 'High elliptical orbit (20,000 x 43,000 km altitude)',
    objectives: [
      'Provide first complete 24-hour diurnal atmospheric cycle picture of global Mars weather.',
      'Observe hydrogen and oxygen loss into interplanetary space.',
    ],
    keyDiscoveries: [
      'Captured unprecedented global synoptic views of dust storms and water-ice clouds across all local times.',
      'Discovered the elusive "sinuous discrete aurora" stretching across thousands of kilometers of Mars nightside.',
    ],
    featured: true,
    dataSource: 'Emirates Mars Mission Science Data Center',
  },
];
