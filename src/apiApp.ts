import express, { Express } from 'express';
import fs from 'fs';
import path from 'path';
import { ALL_MARS_FEATURES } from './data/marsNomenclature';
import { parseOfficialMarsGazetteer } from './data/usgsMarsGazetteer';
import { MARS_REGIONS } from './data/marsRegions';
import { NASA_DATASET_CATALOG } from './data/provenanceData';
import { calculateAStarRoute, MarsTransportModeType, CrewBuddyConfigType, RouteMode } from './engine/marsAStarRouter';
import { calculateMarsDistanceKm, distanceToSegmentMeters } from './engine/spatialMath';
import { getMolaElevation, getMarsPressureMbar } from './engine/marsMolaElevation';
import { getMarsSpaceWeatherState, SpaceWeatherScenario } from './engine/marsSpaceWeather';
import { GLOBAL_MARS_HAZARD_ZONES } from './data/marsGlobalHazards';
import { JEZERO_HAZARD_ZONES } from './data/jezeroDataset';
import { GALE_HAZARD_ZONES } from './data/galeDataset';
import { resolveCanonicalMarsLocation } from './api/sharedMarsApi';

type Point = { lat: number; lng: number; name?: string };

function loadOfficialFeatures() {
  try {
    const file = path.resolve(process.cwd(), 'public/data/mars-nomenclature.dbf');
    const raw = fs.readFileSync(file);
    const arrayBuffer = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
    return parseOfficialMarsGazetteer(arrayBuffer).map((feature) => ({
      ...feature,
      elevationM: 0,
      description: feature.origin || 'Official USGS/IAU Mars feature.',
      originName: 'USGS/IAU Gazetteer of Planetary Nomenclature',
      featured: false,
    }));
  } catch {
    return [];
  }
}

const officialFeatures = loadOfficialFeatures();
const features = [
  ...ALL_MARS_FEATURES,
  ...officialFeatures.filter((feature) => !ALL_MARS_FEATURES.some((item) => item.name.toLowerCase() === feature.name.toLowerCase())),
];
const hazards = [...JEZERO_HAZARD_ZONES, ...GALE_HAZARD_ZONES, ...GLOBAL_MARS_HAZARD_ZONES];
const missions: any[] = [];

function routeHazards(start: Point, destination: Point) {
  const a = { latitude: start.lat, longitude: start.lng };
  const b = { latitude: destination.lat, longitude: destination.lng };
  return hazards.filter((hazard) => distanceToSegmentMeters(hazard.coordinate, a, b) <= Math.max(300000, hazard.radiusMeters * 1.5));
}

function localAssistant(query: string, context: any = {}) {
  const canonical = resolveCanonicalMarsLocation(query);
  const route = context?.route;
  const lower = query.toLowerCase();
  if (route?.active && /route|safe|safety|time|fast|soil|terrain|hazard|path|নিরাপদ|সময়/.test(lower)) {
    const active = route.active;
    const status = active.safetyScore >= 85 ? 'SAFE' : active.safetyScore >= 70 ? 'CAUTION' : 'DANGEROUS';
    return {
      source: 'marsway-offline-local',
      answer: `Offline MarsWay route analysis: ${active.name} is ${status} with safety score ${active.safetyScore}/100. Distance ${active.distanceKm} km, estimated time ${active.time}. Surface: ${active.surfaceCondition}; soil trafficability ${active.soilScore}/100; terrain suitability ${active.terrainScore}/100; maximum slope ${active.maxSlopeDeg}°.`,
      action: null,
    };
  }
  if (/route|safe|safety|time|soil|terrain|hazard|path|নিরাপদ|সময়/.test(lower)) {
    return { source: 'marsway-offline-local', answer: 'Select START and FINAL points and check the route first. Then I can compare safety, soil, terrain, hazards, and travel time from the local MarsWay route engine.', action: null };
  }
  if (canonical) {
    return {
      source: 'marsway-offline-local',
      answer: `${canonical.name} is at ${canonical.lat.toFixed(2)}°, ${canonical.lng.toFixed(2)}° with modeled elevation ${canonical.elevationM.toLocaleString()} m. This answer comes from the bundled MarsWay spatial catalog.`,
      action: { type: 'fly_to', lat: canonical.lat, lng: canonical.lng, zoom: canonical.zoom, name: canonical.name, elevationM: canonical.elevationM },
    };
  }
  if (/pressure|atmosphere|gas|weather|temperature/.test(lower)) {
    return { source: 'marsway-offline-local', answer: 'Mars has a thin CO₂-dominated atmosphere. Local pressure and weather context are calculated from the bundled MarsWay environmental models and the selected coordinate.', action: null };
  }
  return { source: 'marsway-offline-local', answer: `Offline MarsWay knowledge is active for “${query}”. Ask about a named feature, mission, route safety, soil, terrain, hazards, elevation, atmosphere, or travel time.`, action: null };
}

export function createApiApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({
    status: 'ok', service: 'MarsWay API', version: '2026.1.0',
    aiMode: 'offline-local', apiKeyRequired: false,
    datasetsLoaded: NASA_DATASET_CATALOG.length, regionsAvailable: MARS_REGIONS.length,
    featuresCatalogSize: features.length,
  }));

  app.get('/api/regions', (_req, res) => res.json({ count: MARS_REGIONS.length, regions: MARS_REGIONS }));
  app.get('/api/layers', (_req, res) => res.json({
    count: 4,
    layers: [
      { id: 'viking', name: 'Viking MDIM True Color', status: 'OBSERVED' },
      { id: 'mola', name: 'MGS MOLA Topography', status: 'OBSERVED / MODELED' },
      { id: 'themis', name: 'Odyssey THEMIS Day IR', status: 'OBSERVED' },
      { id: 'opm', name: 'OpenPlanetaryMap', status: 'DERIVED' },
    ], provenanceCatalog: NASA_DATASET_CATALOG,
  }));

  app.get('/api/features', (req, res) => {
    const q = String(req.query.q || req.query.search || '').trim().toLowerCase();
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const result = q ? features.filter((feature) => `${feature.name} ${feature.type} ${feature.originName || ''}`.toLowerCase().includes(q)) : features;
    res.json({ count: result.length, features: result.slice(0, limit) });
  });
  app.get('/api/features/:featureId', (req, res) => {
    const feature = features.find((item) => item.id === req.params.featureId || item.name.toLowerCase() === req.params.featureId.toLowerCase());
    if (!feature) return res.status(404).json({ error: 'Feature not found' });
    res.json(feature);
  });

  app.get('/api/elevation', (req, res) => {
    const lat = Number(req.query.lat); const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ error: 'lat and lng are required' });
    const elevationM = getMolaElevation(lat, lng);
    res.json({ lat, lng, elevationM, pressureMbar: getMarsPressureMbar(elevationM), status: 'MODELED' });
  });
  app.get('/api/weather', (req, res) => {
    const scenario = String(req.query.scenario || 'nominal') as SpaceWeatherScenario;
    res.json(getMarsSpaceWeatherState(scenario));
  });

  app.post('/api/routes/plan', (req, res) => {
    try {
      const start = req.body.start || req.body.startPoint;
      const destination = req.body.destination || req.body.endPoint;
      if (!start || !destination) return res.status(400).json({ error: 'start and destination are required' });
      const routeZones = routeHazards(start, destination);
      const transportMode = String(req.body.transportMode || 'foot').toLowerCase() as MarsTransportModeType;
      const crewConfig = String(req.body.crewConfig || 'buddy_pair').toLowerCase() as CrewBuddyConfigType;
      const routes = (['shortest', 'science', 'safest'] as RouteMode[]).map((mode) => calculateAStarRoute(start.lat, start.lng, destination.lat, destination.lng, mode, { transportMode, crewConfig, hazardZones: routeZones }));
      res.json({ source: 'marsway-offline-local', routes, hazardsConsidered: routeZones.length, distanceKm: calculateMarsDistanceKm({ latitude: start.lat, longitude: start.lng }, { latitude: destination.lat, longitude: destination.lng }) });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to calculate local route', details: error?.message || 'Unknown error' });
    }
  });

  app.get('/api/missions', (_req, res) => res.json({ count: missions.length, missions }));
  app.post('/api/missions', (req, res) => { const mission = { id: `mission-${Date.now()}`, ...req.body, createdAt: new Date().toISOString() }; missions.push(mission); res.status(201).json(mission); });
  app.get('/api/missions/:missionId', (req, res) => { const mission = missions.find((item) => item.id === req.params.missionId); mission ? res.json(mission) : res.status(404).json({ error: 'Mission not found' }); });
  app.put('/api/missions/:missionId', (req, res) => { const index = missions.findIndex((item) => item.id === req.params.missionId); if (index < 0) return res.status(404).json({ error: 'Mission not found' }); missions[index] = { ...missions[index], ...req.body, updatedAt: new Date().toISOString() }; res.json(missions[index]); });
  app.post('/api/ask-marsway', (req, res) => { const query = String(req.body.query || req.body.message || '').trim(); if (!query) return res.status(400).json({ error: 'Query is required' }); res.json(localAssistant(query, req.body.context)); });

  return app;
}
