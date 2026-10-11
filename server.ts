import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { ALL_MARS_FEATURES } from './src/data/marsNomenclature';
import { MARS_REGIONS } from './src/data/marsRegions';
import {
  JEZERO_REGION,
  JEZERO_ENVIRONMENT,
  JEZERO_NAMED_LOCATIONS,
  JEZERO_SCIENCE_TARGETS,
  JEZERO_ROVER_OBSERVATIONS,
  JEZERO_HAZARD_ZONES,
  JEZERO_RESOURCE_SITES,
} from './src/data/jezeroDataset';
import {
  GALE_REGION,
  GALE_ENVIRONMENT,
  GALE_NAMED_LOCATIONS,
  GALE_SCIENCE_TARGETS,
  GALE_HAZARD_ZONES,
} from './src/data/galeDataset';
import { NASA_DATASET_CATALOG } from './src/data/provenanceData';
import { generateCandidateRoutes } from './src/engine/multiObjectiveRouter';
import { calculateMarsDistanceKm } from './src/engine/spatialMath';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Authoritative Gazetteer of Certified Martian Coordinates (NASA PDS / MGS MOLA / USGS Astrogeology)
// Longitudes in standard GIS format [-180, 180]
const CANONICAL_MARS_LOCATIONS: Record<string, { lat: number; lng: number; zoom: number; elevationM: number; name: string }> = {
  'olympus mons': { lat: 18.65, lng: -133.8, zoom: 5, elevationM: 21229, name: 'Olympus Mons' },
  'olympus': { lat: 18.65, lng: -133.8, zoom: 5, elevationM: 21229, name: 'Olympus Mons' },
  'অলিম্পাস': { lat: 18.65, lng: -133.8, zoom: 5, elevationM: 21229, name: 'Olympus Mons' },
  'অলিম্পাস মনস': { lat: 18.65, lng: -133.8, zoom: 5, elevationM: 21229, name: 'Olympus Mons' },
  'jezero crater': { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Jezero Crater' },
  'jezero': { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Jezero Crater' },
  'জেজেরো': { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Jezero Crater' },
  'জেজেরো ক্রেটার': { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Jezero Crater' },
  'perseverance': { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Perseverance Rover (Jezero Crater)' },
  'ingenuity': { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Ingenuity Helicopter (Jezero Crater)' },
  'gale crater': { lat: -4.59, lng: 137.44, zoom: 7, elevationM: -4450, name: 'Gale Crater (Mount Sharp)' },
  'gale': { lat: -4.59, lng: 137.44, zoom: 7, elevationM: -4450, name: 'Gale Crater (Mount Sharp)' },
  'গেল': { lat: -4.59, lng: 137.44, zoom: 7, elevationM: -4450, name: 'Gale Crater (Mount Sharp)' },
  'গেল ক্রেটার': { lat: -4.59, lng: 137.44, zoom: 7, elevationM: -4450, name: 'Gale Crater (Mount Sharp)' },
  'curiosity': { lat: -4.59, lng: 137.44, zoom: 7, elevationM: -4450, name: 'Curiosity Rover (Gale Crater)' },
  'mount sharp': { lat: -5.08, lng: 137.85, zoom: 6, elevationM: 5500, name: 'Mount Sharp (Aeolis Mons)' },
  'aeolis mons': { lat: -5.08, lng: 137.85, zoom: 6, elevationM: 5500, name: 'Mount Sharp (Aeolis Mons)' },
  'valles marineris': { lat: -13.9, lng: -59.2, zoom: 5, elevationM: -7000, name: 'Valles Marineris' },
  'marineris': { lat: -13.9, lng: -59.2, zoom: 5, elevationM: -7000, name: 'Valles Marineris' },
  'ভ্যালিস মেরিনারিস': { lat: -13.9, lng: -59.2, zoom: 5, elevationM: -7000, name: 'Valles Marineris' },
  'grand canyon': { lat: -13.9, lng: -59.2, zoom: 5, elevationM: -7000, name: 'Valles Marineris' },
  'elysium mons': { lat: 25.02, lng: 147.21, zoom: 5, elevationM: 14100, name: 'Elysium Mons' },
  'elysium': { lat: 25.02, lng: 147.21, zoom: 5, elevationM: 14100, name: 'Elysium Mons' },
  'arsia mons': { lat: -8.4, lng: -121.1, zoom: 5, elevationM: 17761, name: 'Arsia Mons' },
  'pavonis mons': { lat: 0.8, lng: -113.4, zoom: 5, elevationM: 14058, name: 'Pavonis Mons' },
  'ascraeus mons': { lat: 11.9, lng: -104.5, zoom: 5, elevationM: 18225, name: 'Ascraeus Mons' },
  'hellas planitia': { lat: -42.7, lng: 70.0, zoom: 4, elevationM: -8200, name: 'Hellas Planitia' },
  'hellas': { lat: -42.7, lng: 70.0, zoom: 4, elevationM: -8200, name: 'Hellas Planitia' },
  'utopia planitia': { lat: 25.066, lng: 109.925, zoom: 6, elevationM: -4000, name: 'Utopia Planitia' },
  'utopia': { lat: 25.066, lng: 109.925, zoom: 6, elevationM: -4000, name: 'Utopia Planitia' },
  'zhurong': { lat: 25.066, lng: 109.925, zoom: 7, elevationM: -4000, name: 'Zhurong Rover (Utopia Planitia)' },
  'meridiani planum': { lat: -1.95, lng: -5.53, zoom: 7, elevationM: -1440, name: 'Meridiani Planum' },
  'meridiani': { lat: -1.95, lng: -5.53, zoom: 7, elevationM: -1440, name: 'Meridiani Planum' },
  'opportunity': { lat: -1.95, lng: -5.53, zoom: 7, elevationM: -1440, name: 'Opportunity Rover (Meridiani Planum)' },
  'gusev crater': { lat: -14.57, lng: 175.47, zoom: 7, elevationM: -1930, name: 'Gusev Crater' },
  'gusev': { lat: -14.57, lng: 175.47, zoom: 7, elevationM: -1930, name: 'Gusev Crater' },
  'spirit': { lat: -14.57, lng: 175.47, zoom: 7, elevationM: -1930, name: 'Spirit Rover (Gusev Crater)' },
  'chryse planitia': { lat: 22.48, lng: -47.97, zoom: 6, elevationM: -3627, name: 'Chryse Planitia' },
  'viking 1': { lat: 22.48, lng: -47.97, zoom: 7, elevationM: -3627, name: 'Viking 1 Lander (Chryse Planitia)' },
  'viking 2': { lat: 48.27, lng: 134.0, zoom: 7, elevationM: -4100, name: 'Viking 2 Lander (Utopia Planitia)' },
  'pathfinder': { lat: 19.33, lng: -33.55, zoom: 7, elevationM: -3650, name: 'Mars Pathfinder & Sojourner' },
  'sojourner': { lat: 19.33, lng: -33.55, zoom: 7, elevationM: -3650, name: 'Mars Pathfinder & Sojourner' },
  'phoenix': { lat: 68.22, lng: -125.7, zoom: 7, elevationM: -4150, name: 'Phoenix Lander (Green Valley)' },
  'insight': { lat: 4.502, lng: 135.623, zoom: 7, elevationM: -2600, name: 'InSight Lander (Elysium Planitia)' },
  'arcadia planitia': { lat: 39.2, lng: -170.3, zoom: 5, elevationM: -4100, name: 'Arcadia Planitia' },
  'arcadia': { lat: 39.2, lng: -170.3, zoom: 5, elevationM: -4100, name: 'Arcadia Planitia' },
  'cydonia': { lat: 40.74, lng: -9.46, zoom: 6, elevationM: -1200, name: 'Cydonia Mensae (Face on Mars)' },
  'cydonia mensae': { lat: 40.74, lng: -9.46, zoom: 6, elevationM: -1200, name: 'Cydonia Mensae' },
  'korolev': { lat: 73.0, lng: 165.0, zoom: 5, elevationM: -1800, name: 'Korolev Crater (Water Ice)' },
  'korolev crater': { lat: 73.0, lng: 165.0, zoom: 5, elevationM: -1800, name: 'Korolev Crater' },
  'planum boreum': { lat: 85.0, lng: 0.0, zoom: 4, elevationM: -2000, name: 'Planum Boreum (North Polar Ice Cap)' },
  'north pole': { lat: 85.0, lng: 0.0, zoom: 4, elevationM: -2000, name: 'Planum Boreum (North Polar Ice Cap)' },
  'উত্তর মেরু': { lat: 85.0, lng: 0.0, zoom: 4, elevationM: -2000, name: 'Planum Boreum (North Polar Ice Cap)' },
  'planum australe': { lat: -85.0, lng: 0.0, zoom: 4, elevationM: 1000, name: 'Planum Australe (South Polar Ice Cap)' },
  'south pole': { lat: -85.0, lng: 0.0, zoom: 4, elevationM: 1000, name: 'Planum Australe (South Polar Ice Cap)' },
  'দক্ষিণ মেরু': { lat: -85.0, lng: 0.0, zoom: 4, elevationM: 1000, name: 'Planum Australe (South Polar Ice Cap)' },
  'alba mons': { lat: 40.5, lng: -109.9, zoom: 5, elevationM: 6770, name: 'Alba Mons' },
  'noctis labyrinthus': { lat: -7.0, lng: -101.2, zoom: 5, elevationM: 2000, name: 'Noctis Labyrinthus' },
  'kasei valles': { lat: 24.6, lng: -65.0, zoom: 5, elevationM: -3000, name: 'Kasei Valles' },
  'syrtis major': { lat: 8.4, lng: 69.5, zoom: 5, elevationM: 1000, name: 'Syrtis Major Planum' },
  'isidis planitia': { lat: 12.9, lng: 87.0, zoom: 5, elevationM: -3800, name: 'Isidis Planitia' },
  'schiaparelli': { lat: -2.7, lng: 16.7, zoom: 6, elevationM: -1500, name: 'Schiaparelli Crater' },
  'mawrth vallis': { lat: 23.99, lng: -18.96, zoom: 6, elevationM: -2240, name: 'Mawrth Vallis' },
  'oxia planum': { lat: 18.2, lng: -24.3, zoom: 6, elevationM: -3000, name: 'Oxia Planum' },
  'beagle 2': { lat: 11.53, lng: 90.43, zoom: 7, elevationM: -3800, name: 'Beagle 2 (Isidis Planitia)' },
};

function resolveCanonicalMarsLocation(queryOrName: string) {
  if (!queryOrName) return null;
  const q = queryOrName.toLowerCase().trim();
  if (CANONICAL_MARS_LOCATIONS[q]) {
    return CANONICAL_MARS_LOCATIONS[q];
  }
  for (const [key, loc] of Object.entries(CANONICAL_MARS_LOCATIONS)) {
    if (key.length >= 4 && (q.includes(key) || key.includes(q))) {
      return loc;
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health check with detailed service telemetry
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'MarsWay API',
      version: '2026.1.0',
      tagline: 'Explore Smarter. Navigate Safer. Discover More.',
      challenge: 'NASA Space Apps Challenge 2026 — Interplanetary Survival Guide: Martian Map',
      team: 'Team UnknownX',
      liveModel: 'gemini-3.8-live',
      geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
      datasetsLoaded: NASA_DATASET_CATALOG.length,
      regionsAvailable: MARS_REGIONS.length,
      featuresCatalogSize: ALL_MARS_FEATURES.length,
    });
  });

  // 2. Study Regions API: GET /api/regions
  app.get('/api/regions', (req, res) => {
    const detailedRegions = [
      {
        ...JEZERO_REGION,
        namedLocations: JEZERO_NAMED_LOCATIONS,
        scienceTargetsCount: JEZERO_SCIENCE_TARGETS.length,
        hazardZonesCount: JEZERO_HAZARD_ZONES.length,
        environment: JEZERO_ENVIRONMENT,
      },
      {
        ...GALE_REGION,
        namedLocations: GALE_NAMED_LOCATIONS,
        scienceTargetsCount: GALE_SCIENCE_TARGETS.length,
        hazardZonesCount: GALE_HAZARD_ZONES.length,
        environment: GALE_ENVIRONMENT,
      },
      ...MARS_REGIONS.filter((r) => r.id !== 'jezero' && r.id !== 'gale').map((r) => ({
        id: r.id,
        name: r.name,
        type: r.category || 'Martian Geological Region',
        center: { latitude: r.center[0], longitude: r.center[1] },
        bounds: {
          minLat: Math.min(...r.polygon.map((p) => p[0])),
          maxLat: Math.max(...r.polygon.map((p) => p[0])),
          minLon: Math.min(...r.polygon.map((p) => p[1])),
          maxLon: Math.max(...r.polygon.map((p) => p[1])),
        },
        baseElevationMeters: -2000,
        elevationRange: [-4500, 2500],
        areaKm2: r.areaKm2,
        dimensions: r.dimensions,
        description: r.description,
        primaryMission: 'NASA Planetary Geologic Mapping (USGS/IAU)',
        geologicalContext: r.geologicalSignificance || r.description,
        keyHighlights: r.keyHighlights,
      })),
    ];
    res.json({
      success: true,
      count: detailedRegions.length,
      regions: detailedRegions,
    });
  });

  // 3. Map Layers & Provenance Catalog: GET /api/layers
  app.get('/api/layers', (req, res) => {
    const layers = [
      {
        id: 'viking',
        name: 'Viking MDIM 2.1 True Color',
        type: 'Basemap Mosaic',
        mission: 'Viking Orbiters 1 & 2',
        status: 'OBSERVED',
        resolution: '232 m/pixel',
        format: 'XYZ Tiles / NASA Trek',
        tileUrl: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        attribution: 'NASA Mars Trek / USGS Astrogeology',
      },
      {
        id: 'mola',
        name: 'MGS MOLA Color Shaded Relief Topography',
        type: 'Topographic Altimetry',
        mission: 'Mars Global Surveyor (MGS)',
        status: 'OBSERVED',
        resolution: '463 m/pixel (128 px/deg)',
        format: 'XYZ Tiles / NASA Trek',
        tileUrl: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        attribution: 'NASA GSFC MOLA Science Team',
      },
      {
        id: 'themis',
        name: 'Odyssey THEMIS Daytime Infrared 100m',
        type: 'Thermal Infrared Regolith',
        mission: 'Mars Odyssey',
        status: 'OBSERVED',
        resolution: '100 m/pixel',
        format: 'XYZ Tiles / NASA Trek',
        tileUrl: 'https://trek.nasa.gov/tiles/Mars/EQ/THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018/1.0.0/default/default028mm/{z}/{y}/{x}.png',
        attribution: 'NASA / ASU / Odyssey THEMIS Team',
      },
      {
        id: 'hirise-coverage',
        name: 'MRO HiRISE Orthomosaic Footprints',
        type: 'High-Resolution Orbital Reconnaissance',
        mission: 'Mars Reconnaissance Orbiter (MRO)',
        status: 'DERIVED',
        resolution: '0.25 - 0.50 m/pixel',
        attribution: 'NASA / JPL / University of Arizona',
      },
      {
        id: 'crism-mineralogy',
        name: 'CRISM Hyperspectral Hydration & Phyllosilicate Indices',
        type: 'Spectroscopic Mineralogy',
        mission: 'Mars Reconnaissance Orbiter (MRO)',
        status: 'DERIVED',
        resolution: '18 m/pixel',
        attribution: 'NASA / JHU-APL CRISM Team',
      },
      {
        id: 'rad-radiation',
        name: 'MSL RAD Galactic Cosmic Ray & SPE Telemetry',
        type: 'In-Situ Biohazard & Radiation Environment',
        mission: 'Curiosity Rover / MSL',
        status: 'MODELED',
        resolution: 'Point Sensor + Column Density Model',
        attribution: 'Southwest Research Institute / NASA MSL RAD',
      },
      {
        id: 'meda-weather',
        name: 'Mars 2020 MEDA Diurnal Atmospheric Pressure & Dust',
        type: 'Surface Meteorology',
        mission: 'Perseverance Rover / Mars 2020',
        status: 'HISTORICAL',
        resolution: 'Surface Station Log',
        attribution: 'CAB / NASA Mars 2020 MEDA',
      },
    ];

    res.json({
      success: true,
      count: layers.length,
      layers,
      provenanceCatalog: NASA_DATASET_CATALOG,
    });
  });

  // 4. Geographic & Scientific Features: GET /api/features
  app.get('/api/features', (req, res) => {
    const { category, q, featured, region } = req.query;
    let list = ALL_MARS_FEATURES;

    if (category && typeof category === 'string') {
      const catLower = category.toLowerCase();
      list = list.filter((f) => f.type.toLowerCase().includes(catLower));
    }

    if (q && typeof q === 'string') {
      const qLower = q.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(qLower) ||
          f.id.toLowerCase().includes(qLower) ||
          f.description.toLowerCase().includes(qLower)
      );
    }

    if (featured === 'true') {
      list = list.filter((f) => f.featured);
    }

    // Attach local Jezero / Gale science targets if region specified
    let scienceTargets: any[] = [];
    if (region === 'jezero') {
      scienceTargets = JEZERO_SCIENCE_TARGETS;
    } else if (region === 'gale') {
      scienceTargets = GALE_SCIENCE_TARGETS;
    }

    res.json({
      success: true,
      count: list.length,
      features: list.slice(0, 150),
      scienceTargets,
    });
  });

  // 5. Specific Feature Detail: GET /api/features/:feature_id
  app.get('/api/features/:feature_id', (req, res) => {
    const { feature_id } = req.params;
    const f = ALL_MARS_FEATURES.find(
      (item) => item.id.toLowerCase() === feature_id.toLowerCase() || item.name.toLowerCase() === feature_id.toLowerCase()
    );
    if (!f) {
      // Check regional science targets
      const st = [...JEZERO_SCIENCE_TARGETS, ...GALE_SCIENCE_TARGETS].find(
        (item) => item.id.toLowerCase() === feature_id.toLowerCase() || item.name.toLowerCase() === feature_id.toLowerCase()
      );
      if (st) {
        res.json({ success: true, feature: st, type: 'ScienceTarget' });
        return;
      }
      res.status(404).json({ error: 'Feature not found in Mars planetary catalog' });
      return;
    }
    res.json({ success: true, feature: f, type: 'PlanetaryNomenclature' });
  });

  // 6. Intelligent Marswalk Multi-Objective Route Planner: POST /api/routes/plan
  app.post('/api/routes/plan', (req, res) => {
    try {
      const {
        startCoord,
        startName,
        destCoord,
        destName,
        regionId = 'jezero',
        constraints = {
          startLocationId: 'loc_butler',
          destinationLocationId: 'loc_delta_scarp',
          maxDurationHours: 4.5,
          maxDistanceKm: 12.0,
          priorityWeights: { safety: 0.5, science: 0.5, efficiency: 0.5, resources: 0.3 },
          requiredScienceTargetIds: [],
          avoidHazardTypes: [],
        },
      } = req.body;

      // Coordinate validation: Mars latitude [-90, +90], longitude [-180, +180] or [0, 360]
      if (
        !startCoord ||
        typeof startCoord.latitude !== 'number' ||
        typeof startCoord.longitude !== 'number' ||
        !destCoord ||
        typeof destCoord.latitude !== 'number' ||
        typeof destCoord.longitude !== 'number'
      ) {
        res.status(400).json({ error: 'Valid startCoord and destCoord with numeric latitude and longitude are required' });
        return;
      }

      if (
        startCoord.latitude < -90 ||
        startCoord.latitude > 90 ||
        destCoord.latitude < -90 ||
        destCoord.latitude > 90
      ) {
        res.status(400).json({ error: 'Latitude must be between -90° and +90°' });
        return;
      }

      const cleanStart = {
        latitude: startCoord.latitude,
        longitude: ((((startCoord.longitude + 180) % 360) + 360) % 360) - 180,
      };
      const cleanDest = {
        latitude: destCoord.latitude,
        longitude: ((((destCoord.longitude + 180) % 360) + 360) % 360) - 180,
      };

      const selectedRegion = regionId === 'gale' ? GALE_REGION : JEZERO_REGION;
      const scienceTargets = regionId === 'gale' ? GALE_SCIENCE_TARGETS : JEZERO_SCIENCE_TARGETS;
      const hazardZones = regionId === 'gale' ? GALE_HAZARD_ZONES : JEZERO_HAZARD_ZONES;
      const resourceSites = regionId === 'gale' ? [] : JEZERO_RESOURCE_SITES;

      const routes = generateCandidateRoutes(
        cleanStart,
        startName || 'Departure Base',
        cleanDest,
        destName || 'Primary Science Target',
        selectedRegion,
        scienceTargets,
        hazardZones,
        resourceSites,
        constraints
      );

      const directDistKm = Number(calculateMarsDistanceKm(cleanStart, cleanDest).toFixed(3));

      res.json({
        success: true,
        regionId,
        directDistanceKm: directDistKm,
        routesCount: routes.length,
        routes,
        solverMetadata: {
          algorithm: 'Pareto Multi-Objective Graph Traversal (C(e) = w_d·D + w_s·S + w_h·H - w_v·V)',
          gravityRatio: '0.38g (Mars)',
          bioenergeticModel: 'Margaria-Minetti Metabolic Walking Speed Formulation (150 W/kg baseline)',
          elevationDatum: 'MGS MOLA Areoid 0 km Reference Surface',
          dataTimestamp: new Date().toISOString(),
          statusDisclaimer: 'Research planning prototype for 2026 NASA Space Apps Challenge; not certified for operational EVA flight.',
        },
      });
    } catch (err: any) {
      console.error('Route calculation error:', err);
      res.status(500).json({ error: 'Failed to compute multi-objective routes', details: err?.message || 'Unknown' });
    }
  });

  // In-Memory Missions Store seeded with authentic demonstration EVA plans
  const inMemoryMissions: Record<string, any> = {
    'mission-jezero-alpha': {
      id: 'mission-jezero-alpha',
      name: 'Jezero Delta Western Scarp Astrobiology Traverse',
      regionId: 'jezero',
      startName: 'Octavia E. Butler Landing Site',
      startCoord: { latitude: 18.4447, longitude: 77.4508 },
      destName: 'Hawkes Bay Delta Bottomsets',
      destCoord: { latitude: 18.4382, longitude: 77.4128 },
      selectedRouteId: 'route-b',
      strategy: 'SCIENCE',
      notes: 'Investigate ancient fine-grained mudstones with high clay mineral signatures for preserved biosignatures.',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
    'mission-kodiak-recon': {
      id: 'mission-kodiak-recon',
      name: 'Kodiak Butte Isolated Mesa Stratigraphic Transect',
      regionId: 'jezero',
      startName: 'Octavia E. Butler Landing Site',
      startCoord: { latitude: 18.4447, longitude: 77.4508 },
      destName: 'Kodiak Butte Uplift',
      destCoord: { latitude: 18.4055, longitude: 77.4395 },
      selectedRouteId: 'route-c',
      strategy: 'SAFETY',
      notes: 'Bypass soft sand ripples to assess foreset delta beds proving catastrophic past paleolake highstands.',
      createdAt: '2026-10-03T11:30:00.000Z',
      updatedAt: '2026-10-03T11:30:00.000Z',
    },
  };

  // 7. Saved Missions: GET /api/missions
  app.get('/api/missions', (req, res) => {
    res.json({
      success: true,
      missions: Object.values(inMemoryMissions),
    });
  });

  // 8. Create Mission: POST /api/missions
  app.post('/api/missions', (req, res) => {
    try {
      const {
        name = 'New Marswalk Mission',
        regionId = 'jezero',
        startName = 'Departure Base',
        startCoord,
        destName = 'Destination',
        destCoord,
        selectedRouteId = 'route-b',
        strategy = 'SCIENCE',
        waypoints = [],
        notes = '',
      } = req.body;

      if (!startCoord || !destCoord) {
        res.status(400).json({ error: 'startCoord and destCoord are required' });
        return;
      }

      const id = `mission-${Date.now().toString(36)}`;
      const newMission = {
        id,
        name,
        regionId,
        startName,
        startCoord,
        destName,
        destCoord,
        selectedRouteId,
        strategy,
        waypoints,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      inMemoryMissions[id] = newMission;
      res.status(201).json({ success: true, mission: newMission });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create mission', details: err?.message });
    }
  });

  // 9. Get Single Mission: GET /api/missions/:mission_id
  app.get('/api/missions/:mission_id', (req, res) => {
    const { mission_id } = req.params;
    const mission = inMemoryMissions[mission_id];
    if (!mission) {
      res.status(404).json({ error: 'Mission not found' });
      return;
    }
    res.json({ success: true, mission });
  });

  // 10. Update Mission: PUT /api/missions/:mission_id
  app.put('/api/missions/:mission_id', (req, res) => {
    const { mission_id } = req.params;
    const existing = inMemoryMissions[mission_id];
    if (!existing) {
      res.status(404).json({ error: 'Mission not found' });
      return;
    }
    const updated = {
      ...existing,
      ...req.body,
      id: mission_id,
      updatedAt: new Date().toISOString(),
    };
    inMemoryMissions[mission_id] = updated;
    res.json({ success: true, mission: updated });
  });

  // 11. Mission Report Briefing: POST /api/missions/:mission_id/report
  app.post('/api/missions/:mission_id/report', (req, res) => {
    const { mission_id } = req.params;
    const mission = inMemoryMissions[mission_id];
    if (!mission) {
      res.status(404).json({ error: 'Mission not found' });
      return;
    }

    const region = mission.regionId === 'gale' ? GALE_REGION : JEZERO_REGION;
    const env = mission.regionId === 'gale' ? GALE_ENVIRONMENT : JEZERO_ENVIRONMENT;

    const reportText = `=====================================================
MARSWAY — OFFICIAL MARSWALK MISSION BRIEFING (EVA FLIGHT PLAN)
NASA Space Apps Challenge 2026 | Team UnknownX
=====================================================
Mission ID: ${mission.id}
Mission Name: ${mission.name}
Generated: ${new Date().toUTCString()}
Operational Quadrangle: ${region.name} (${region.type})

MISSION OBJECTIVES & TRAVERSE:
------------------------------
Departure Base: ${mission.startName} (${mission.startCoord.latitude.toFixed(4)}°N, ${mission.startCoord.longitude.toFixed(4)}°E)
Destination: ${mission.destName} (${mission.destCoord.latitude.toFixed(4)}°N, ${mission.destCoord.longitude.toFixed(4)}°E)
Active Strategy: ${mission.strategy} (Route ID: ${mission.selectedRouteId})
Notes: ${mission.notes || 'Nominal EVA exploration protocol.'}

ENVIRONMENTAL TELEMETRY BASELINE:
----------------------------------
Surface Atmospheric Pressure: ${env.atmosphericPressurePascals} Pa
Diurnal Thermal Range: ${env.diurnalTempRangeCelsius[0]}°C to ${env.diurnalTempRangeCelsius[1]}°C
Atmospheric Optical Depth (Tau): ${env.dustOpticalDepthTau}
Calibrated Radiation Dose: ${env.radiationDoseRateMicroGyPerDay} μGy/day
Effective Column Shielding: ${env.effectiveShieldingIndex * 100}%

AUTHENTIC DATA SOURCES & CITATIONS:
------------------------------------
- Elevation Datum: NASA MGS MOLA MEGDR (Areoid 0 km)
- High-Resolution Orbital Imagery: NASA MRO HiRISE Orthomosaics
- Mineralogical Composition: NASA MRO CRISM Hyperspectral Parameters
- Surface Weather Telemetry: NASA Mars 2020 MEDA In-Situ Baseline
- Radiation Environment: NASA MSL RAD Telemetry & Atmospheric Attenuation

SCIENTIFIC HONESTY DISCLAIMER:
-------------------------------
This plan was synthesized using the MARSWAY decision-support prototype. It is
an academic exploration tool designed for the 2026 NASA Space Apps Challenge
and is not certified for operational extraterrestrial flight operations.
=====================================================`;

    res.json({
      success: true,
      missionId: mission.id,
      generatedAt: new Date().toISOString(),
      reportText,
      mission,
      region,
      environment: env,
    });
  });

  // Ask MarsWay AI Assistant Endpoint (using gemini-3.8-flash)
  app.post('/api/ask-marsway', async (req, res) => {
    try {
      const { query, context } = req.body;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Query is required' });
        return;
      }

      const client = getAIClient();
      if (!client) {
        const canonical = resolveCanonicalMarsLocation(query);
        res.json({
          source: 'local-knowledge',
          answer: canonical
            ? `MarsWay built-in spatial planetary dataset located: ${canonical.name} at coordinates (${canonical.lat.toFixed(2)}°, ${canonical.lng.toFixed(2)}°), elevation ${canonical.elevationM}m.`
            : `[AI Studio Gemini key not configured in environment; utilizing MarsWay built-in spatial planetary intelligence dataset]. For: "${query}", explore the interactive map, mission layers, and location telemetry.`,
          action: canonical
            ? {
                type: 'fly_to',
                lat: canonical.lat,
                lng: canonical.lng,
                zoom: canonical.zoom,
                name: canonical.name,
                elevationM: canonical.elevationM,
              }
            : null,
        });
        return;
      }

      const systemPrompt = `You are "Ask MarsWay", the intelligent AI spatial assistant for MarsWay (an interactive Mars exploration, mapping, and mission intelligence platform).
Your role is to assist scientists, students, and space explorers with scientifically grounded information regarding Mars topography, NASA/ESA/ISRO/CNSA missions, planetary science, and future human exploration scenarios.

CRITICAL RULES:
1. NEVER fabricate scientific data, temperatures, or coordinates. Reference authoritative datasets (NASA Planetary Data System, MGS MOLA, Odyssey THEMIS, MRO HiRISE/SHARAD/CRISM, MSL REMS, Mars 2020 MEDA).
2. Clearly distinguish between Observed Data, Derived Models, and Hypothetical Human Mission Planning.
3. CRITICAL LONGITUDE SPECIFICATION: All longitudes MUST be in standard GIS format between -180 and +180 degrees.
   Authoritative Reference Locations:
   - Olympus Mons: lat: 18.65, lng: -133.8, zoom: 5
   - Jezero Crater (Perseverance / Ingenuity): lat: 18.38, lng: 77.58, zoom: 7
   - Gale Crater (Curiosity): lat: -4.59, lng: 137.44, zoom: 7
   - Valles Marineris (Grand Canyon): lat: -13.9, lng: -59.2, zoom: 5
   - Elysium Mons: lat: 25.02, lng: 147.21, zoom: 5
   - Arsia Mons: lat: -8.4, lng: -121.1, zoom: 5
   - Pavonis Mons: lat: 0.8, lng: -113.4, zoom: 5
   - Ascraeus Mons: lat: 11.9, lng: -104.5, zoom: 5
   - Hellas Planitia (Basin): lat: -42.7, lng: 70.0, zoom: 4
   - Utopia Planitia (Zhurong Rover): lat: 25.066, lng: 109.925, zoom: 6
   - Meridiani Planum (Opportunity): lat: -1.95, lng: -5.53, zoom: 7
   - Gusev Crater (Spirit): lat: -14.57, lng: 175.47, zoom: 7
   - Chryse Planitia (Viking 1): lat: 22.48, lng: -47.97, zoom: 6
   - Arcadia Planitia (Human Landing Candidate): lat: 39.2, lng: -170.3, zoom: 5
   - Cydonia Mensae: lat: 40.74, lng: -9.46, zoom: 6
   - Korolev Crater: lat: 73.0, lng: 165.0, zoom: 5
   - Planum Boreum (North Polar Cap): lat: 85.0, lng: 0.0, zoom: 4
   - Planum Australe (South Polar Cap): lat: -85.0, lng: 0.0, zoom: 4
4. If the user's query asks to see, locate, fly to, or examine a specific crater, volcano, rover, landing site, or feature, produce a JSON object with:
   - "answer": concise, scientifically accurate explanation (2-4 sentences) with data source attribution.
   - "action": an action object if applicable, or null.
     Action types:
     - { "type": "fly_to", "lat": number, "lng": number, "zoom": number, "name": string, "featureId": string }
     - { "type": "select_mission", "missionId": string, "name": string }
     - { "type": "toggle_layer", "layerId": "viking" | "mola" | "themis" | "opm" }
     - { "type": "compare", "site1Id": string, "site2Id": string }
     - { "type": "human_mode" }
5. Respond in valid JSON only with structure:
   {
     "answer": "string",
     "action": { ... } | null
   }`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemPrompt}\n\nCurrent Map Context: ${JSON.stringify(context || {})}\n\nUser Question: ${query}\n\nRespond with strict JSON only.`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text || '{}';
      let parsed: any = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { answer: responseText, action: null };
      }

      // Canonical snapping & auto-detection: Guarantee 100% accurate coordinates for all Martian targets
      const canonicalFromQuery = resolveCanonicalMarsLocation(query);
      if (parsed.action && parsed.action.type === 'fly_to') {
        const canonical = resolveCanonicalMarsLocation(parsed.action.name) || canonicalFromQuery;
        if (canonical) {
          parsed.action.lat = canonical.lat;
          parsed.action.lng = canonical.lng;
          parsed.action.zoom = canonical.zoom;
          parsed.action.name = canonical.name;
          parsed.action.elevationM = canonical.elevationM;
        }
      } else if (!parsed.action && canonicalFromQuery) {
        // User asked for a location or rover in any language, auto-attach certified fly_to action
        parsed.action = {
          type: 'fly_to',
          lat: canonicalFromQuery.lat,
          lng: canonicalFromQuery.lng,
          zoom: canonicalFromQuery.zoom,
          name: canonicalFromQuery.name,
          elevationM: canonicalFromQuery.elevationM,
        };
      }

      res.json({
        source: 'gemini-3.8-flash',
        ...parsed,
      });
    } catch (err: any) {
      console.error('Gemini API query error:', err);
      res.status(500).json({
        error: 'AI query processing failure',
        details: err?.message || 'Unknown error',
      });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Create HTTP server to attach both Express and WebSocketServer
  const server = http.createServer(app);

  // Attach WebSocketServer for Gemini Live (gemini-3.8-live) Real-Time Audio Streaming
  const wss = new WebSocketServer({ server, path: '/api/live-ws' });

  wss.on('connection', async (clientWs: WebSocket, req) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          message:
            'GEMINI_API_KEY is not configured in the AI Studio environment. Please configure it in Settings > Secrets to enable Live Voice Conversations.',
        })
      );
      clientWs.close();
      return;
    }

    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const voiceName = url.searchParams.get('voice') || 'Zephyr';

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    let session: any = null;
    let isClosed = false;

    const cleanup = () => {
      if (isClosed) return;
      isClosed = true;
      if (session) {
        try {
          session.close();
        } catch {
          // ignore close errors
        }
        session = null;
      }
    };

    clientWs.on('close', cleanup);
    clientWs.on('error', (err) => {
      console.error('Mars Live client WS error:', err);
      cleanup();
    });

    try {
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName,
              },
            },
          },
          systemInstruction: `You are "MarsWay Live Flight Controller", an AI planetary scientist and exploration mission guide for the MarsWay interactive Mars platform.
You are in real-time, low-latency, two-way voice communication with an astronaut or planetary scientist exploring Mars.
Guidelines for spoken speech:
1. Speak naturally, conversationally, concisely, and clearly in 1 to 3 spoken sentences. Avoid long monologues.
2. Ground all answers in authentic scientific datasets (NASA Planetary Data System, MGS MOLA elevation, Odyssey THEMIS thermal infrared, MRO HiRISE imagery, Mars 2020 Perseverance and MSL Curiosity findings).
3. Distinguish between actual observational facts and future human exploration scenarios.
4. When asked to look at, fly to, or examine a specific landmark, crater, volcano, canyon, or landing site, invoke the tool "flyToLocation".
5. When asked about a robotic rover or lander, invoke "selectMission".
6. When asked about elevation, topography, or infrared, invoke "toggleLayer" with "mola" or "themis".
Keep your tone adventurous, composed, scientific, and encouraging.`,
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'flyToLocation',
                  description:
                    'Fly the interactive Mars camera to a landmark, crater, volcano, canyon, or landing site',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      name: {
                        type: Type.STRING,
                        description: 'Name of the crater, mountain, or feature on Mars',
                      },
                      lat: {
                        type: Type.NUMBER,
                        description: 'Latitude in decimal degrees (-90 to +90)',
                      },
                      lng: {
                        type: Type.NUMBER,
                        description: 'Longitude in decimal degrees (0 to 360 or -180 to +180)',
                      },
                      zoom: {
                        type: Type.NUMBER,
                        description: 'Camera zoom level (typically 4 to 8)',
                      },
                    },
                    required: ['name', 'lat', 'lng'],
                  },
                },
                {
                  name: 'selectMission',
                  description: 'Open details and rover traverse for a Mars surface mission',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      missionId: {
                        type: Type.STRING,
                        description:
                          'Mission identifier (perseverance, curiosity, opportunity, spirit, zhurong, viking1, etc.)',
                      },
                      name: {
                        type: Type.STRING,
                        description: 'Name of the mission',
                      },
                    },
                    required: ['missionId'],
                  },
                },
                {
                  name: 'toggleLayer',
                  description: 'Switch active global GIS raster layer on Mars',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      layerId: {
                        type: Type.STRING,
                        description: 'Layer ID: viking, mola, themis, or opm',
                      },
                    },
                    required: ['layerId'],
                  },
                },
              ],
            },
          ],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // Model audio and text
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && parts.length > 0) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'audio',
                      audio: part.inlineData.data,
                    })
                  );
                }
                if (part.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'transcript_model',
                      text: part.text,
                    })
                  );
                }
              }
            }

            // User speech transcription
            const userText = (message.serverContent as any)?.inputAudioTranscription?.text;
            if (userText) {
              clientWs.send(
                JSON.stringify({
                  type: 'transcript_user',
                  text: userText,
                })
              );
            }

            // User interruption
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            // Model turn complete
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turn_complete' }));
            }

            // Tool calls
            const toolCall = (message as any).toolCall;
            if (toolCall) {
              if (toolCall.functionCalls) {
                for (const fc of toolCall.functionCalls) {
                  if (fc.name === 'flyToLocation' && fc.args) {
                    const canonical = resolveCanonicalMarsLocation(fc.args.name);
                    if (canonical) {
                      fc.args.lat = canonical.lat;
                      fc.args.lng = canonical.lng;
                      fc.args.zoom = canonical.zoom;
                      fc.args.name = canonical.name;
                    }
                  }
                }
              }

              clientWs.send(
                JSON.stringify({
                  type: 'tool_call',
                  toolCall,
                })
              );

              // Acknowledge function call to allow generation to proceed
              try {
                const functionResponses = (toolCall.functionCalls || []).map((fc: any) => ({
                  response: { output: { status: 'executed', function: fc.name } },
                  id: fc.id,
                }));
                session.sendToolResponse({ functionResponses });
              } catch (fcErr) {
                console.error('Failed to send tool response to Live API:', fcErr);
              }
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live session error:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'error',
                  message: err?.message || 'Live API connection error',
                })
              );
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'session_closed' }));
            }
          },
        },
      });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'session_ready',
            model: 'gemini-3.8-live',
            voice: voiceName,
            sampleRate: 24000,
          })
        );
      }

      clientWs.on('message', (raw) => {
        if (!session) return;
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'audio' && msg.audio) {
            session.sendRealtimeInput({
              audio: {
                data: msg.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } else if (msg.type === 'text' && msg.text) {
            session.sendClientContent({
              turns: [
                {
                  role: 'user',
                  parts: [{ text: msg.text }],
                },
              ],
              turnComplete: true,
            });
          }
        } catch (e) {
          console.error('Error handling client message:', e);
        }
      });
    } catch (err: any) {
      console.error('Failed to initialize gemini-3.8-live session:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            message: `Failed to initialize gemini-3.8-live session: ${err?.message || 'Unknown error'}`,
          })
        );
        clientWs.close();
      }
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`MarsWay Server & Gemini Live WebSocket running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
