import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import L from 'leaflet';
import {
  X,
  Compass,
  Volume2,
  VolumeX,
  Camera,
  RotateCcw,
  Sparkles,
  Layers,
  Globe,
  Radio,
  Eye,
  Crosshair,
  ShieldAlert,
  Thermometer,
  Zap,
  Activity,
  Heart,
  Droplets,
  ChevronDown,
  ChevronUp,
  MapPin,
  CheckCircle2,
  Package,
  Info,
  Mic,
  MicOff,
  Flame,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  Lightbulb,
  Map as MapIcon,
  Locate,
  Footprints,
  Maximize2,
  Minimize2,
  Navigation,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  Download,
  Share2,
  Play,
  RotateCw,
  Gauge,
  Wind,
  AlertTriangle,
} from 'lucide-react';
import { marsEvaAudio } from '../../engine/marsEvaAudio';
import { distanceToSegmentMeters } from '../../engine/spatialMath';
import { GLOBAL_MARS_HAZARD_ZONES } from '../../data/marsGlobalHazards';
import { JEZERO_HAZARD_ZONES } from '../../data/jezeroDataset';
import { GALE_HAZARD_ZONES } from '../../data/galeDataset';

export interface AstronautSitePreset {
  id: string;
  name: string;
  tag: string;
  lat: number;
  lng: number;
  elevationM: number;
  description: string;
  geologyHighlights: string;
  groundColor: number;
  skyColor: number;
  sunIntensity: number;
  satelliteThumb: string;
  sampleTargets: Array<{
    name: string;
    type: string;
    composition: string;
    significance: string;
    pdsCitation: string;
  }>;
}

export const ASTRONAUT_SITE_PRESETS: AstronautSitePreset[] = [
  {
    id: 'jezero',
    name: 'Jezero Crater — Octavia E. Butler Landing',
    tag: 'Perseverance Rover Vicinity (18.38°N, 77.58°E)',
    lat: 18.38,
    lng: 77.58,
    elevationM: -2560,
    description: 'Ancient river delta lakebed filled with clay smectites and carbonate minerals cached for Mars Sample Return.',
    geologyHighlights: 'River delta bottomset beds, olivine-rich Máaz formation, delta scarp cliffs in the west.',
    groundColor: 0x9b4e28,
    skyColor: 0xc87d55,
    sunIntensity: 1.25,
    satelliteThumb: 'https://images-assets.nasa.gov/image/PIA24424/PIA24424~orig.jpg',
    sampleTargets: [
      {
        name: 'Delta Scarp Fine-Grained Mudstone',
        type: 'Fluvial Sedimentary Mudstone',
        composition: 'SiO2 46.2%, Al2O3 12.8%, FeO 18.1%, Carbonates 7.4%',
        significance: 'High astrobiological potential; ideal matrix for preserving microscopic organic biosignatures.',
        pdsCitation: 'NASA Mars 2020 SuperCam / Mastcam-Z Science Archive (PDS-GEO)',
      },
      {
        name: 'Kodiak Butte Basaltic Boulder',
        type: 'Delta Remnant Igneous Basalt',
        composition: 'SiO2 49.8%, FeO 19.3%, MgO 8.4%, CaO 7.1%',
        significance: 'Demonstrates catastrophic high-energy flooding events following ancient lake drawdown.',
        pdsCitation: 'Perseverance PIXL Instrument Record Sol 412',
      },
      {
        name: 'Séítah Olivine-Cumulate Outcrop',
        type: 'Ultramafic Cumulate Bedrock',
        composition: 'Fo65 Olivine 42%, Pyroxene 31%, Plagioclase 16%',
        significance: 'Reveals early magma chamber cooling history prior to aqueous deposition.',
        pdsCitation: 'Mars 2020 SHERLOC Raman Spectrometer Sol 198',
      },
    ],
  },
  {
    id: 'gale',
    name: 'Gale Crater — Bradbury Landing & Mount Sharp',
    tag: 'Curiosity Rover Traverse (-4.59°S, 137.44°E)',
    lat: -4.59,
    lng: 137.44,
    elevationM: -4450,
    description: 'Enormous 154 km impact basin with 5.5 km central peak Aeolis Mons exhibiting aqueous sulfate and clay layers.',
    geologyHighlights: 'Murray Formation finely laminated mudstones, Vera Rubin Hematite Ridge, sulfate-bearing unit.',
    groundColor: 0x8a4522,
    skyColor: 0xbf7850,
    sunIntensity: 1.3,
    satelliteThumb: 'https://images-assets.nasa.gov/image/PIA16098/PIA16098~orig.jpg',
    sampleTargets: [
      {
        name: 'Vera Rubin Ridge Hematite Nodules',
        type: 'Crystalline Gray Hematite',
        composition: 'Fe2O3 68.4%, SiO2 21.2%, SO3 4.9%',
        significance: 'Indicates groundwater redox interface where iron precipitated out of neutral pH fluids.',
        pdsCitation: 'NASA MSL ChemCam RMI Dataset Sol 1920',
      },
      {
        name: 'Sheepbed Mudstone Drill Core Tailings',
        type: 'Lacustrine Phyllosilicate Mudstone',
        composition: 'Smectite Clays 28%, Magnetite 4%, Basalt 52%',
        significance: 'Confirmed habitable ancient freshwater lake environment with bioessential elements (CHNOPS).',
        pdsCitation: 'Curiosity CheMin XRD Science Product Sol 279',
      },
      {
        name: 'Mount Sharp Gediz Vallis Boulder',
        type: 'Debris Flow Conglomerate',
        composition: 'Poorly sorted angular basaltic clasts in sulfate matrix',
        significance: 'Evidence of wet debris flows late in Martian climate history.',
        pdsCitation: 'Curiosity Mastcam Multispectral Mosaic Sol 3840',
      },
    ],
  },
  {
    id: 'valles',
    name: 'Valles Marineris — Coprates Chasma Abyss',
    tag: 'Grand Canyon of Mars (-13.90°S, 300.80°E)',
    lat: -13.90,
    lng: -59.20,
    elevationM: -3200,
    description: 'Largest canyon system in the solar system; sheer 7-kilometer cliff scarps exposing billions of years of crustal stratification.',
    geologyHighlights: 'Colossal landslide debris lobes, interior layered deposits (ILD), sulfate-rich knolls.',
    groundColor: 0x7c381c,
    skyColor: 0xb56d47,
    sunIntensity: 1.35,
    satelliteThumb: 'https://images-assets.nasa.gov/image/PIA00407/PIA00407~orig.jpg',
    sampleTargets: [
      {
        name: 'Coprates Wall Basaltic Stratum',
        type: 'Tholeiitic Flood Basalt',
        composition: 'SiO2 50.4%, FeO 18.2%, CaO 10.1%, TiO2 1.4%',
        significance: 'Represents massive volcanic outpourings during the Hesperian tectonic rifting era.',
        pdsCitation: 'MGS MOC & Mars Express HRSC Coprates DTM',
      },
      {
        name: 'Chasma Floor Opaline Silica Deposit',
        type: 'Hydrated Amorphous Silica',
        composition: 'SiO2·nH2O (Hydration ~6 wt%), Trace sulfates',
        significance: 'Formed by acidic hydrothermal groundwater circulation during late volcanic waning.',
        pdsCitation: 'CRISM Targeted Observation FRT000085C1',
      },
    ],
  },
  {
    id: 'olympus',
    name: 'Olympus Mons — Caldera Summit Rim',
    tag: 'Tallest Volcano in Solar System (21.2 km)',
    lat: 18.65,
    lng: -133.80,
    elevationM: 21229,
    description: 'Summit caldera rim at 21,229m altitude; near-vacuum atmospheric pressure (0.7 mbar) revealing pitch-black space overhead.',
    geologyHighlights: 'Multiple nested collapsed calderas, fresh lava tube channels, pahoehoe lava wrinkle ridges.',
    groundColor: 0x5a2d1d,
    skyColor: 0x3d2017,
    sunIntensity: 1.5,
    satelliteThumb: 'https://images-assets.nasa.gov/image/PIA00300/PIA00300~orig.jpg',
    sampleTargets: [
      {
        name: 'Summit Caldera Vesicular Basalt',
        type: 'Vesicular Shield Volcano Basalt',
        composition: 'SiO2 49.1%, FeO 20.8%, MgO 6.9%, Low volatile content',
        significance: 'Lava extruded under near-vacuum atmospheric boiling conditions.',
        pdsCitation: 'MGS MOLA Altimetry & THEMIS IR Thermal Inertia',
      },
      {
        name: 'Fumarolic Sulfur-Enriched Regolith',
        type: 'Volcanic Sublimate',
        composition: 'Elemental S 14.2%, Sulfate salts 22%, Fe-oxides 40%',
        significance: 'Preserves gas venting record from Mars youngest volcanic thermal pulses.',
        pdsCitation: 'Mars Global Surveyor Thermal Emission Spectrometer',
      },
    ],
  },
  {
    id: 'utopia',
    name: 'Utopia Planitia — Zhurong Rover Plains',
    tag: 'Subsurface Water Ice Sheet Plains (25.10°N, 109.90°E)',
    lat: 25.10,
    lng: 109.90,
    elevationM: -4100,
    description: 'Vast northern lowlands basin with verified massive subsurface water ice deposits beneath regolith mantle.',
    geologyHighlights: 'Polygon patterned ground, scalloped depressions, rampart impact crater ejecta.',
    groundColor: 0x8f4825,
    skyColor: 0xc47b52,
    sunIntensity: 1.2,
    satelliteThumb: 'https://images-assets.nasa.gov/image/PIA00570/PIA00570~orig.jpg',
    sampleTargets: [
      {
        name: 'Periglacial Regolith Breccia',
        type: 'Ice-Cemented Duricrust',
        composition: 'SiO2 43.1%, FeO 17.5%, SO3 6.8%, H2O equivalent 8.2%',
        significance: 'Confirms shallow ground ice freeze-thaw cyclicity in mid-latitudes.',
        pdsCitation: 'CNSA Tianwen-1 MarSCoDe Spectrometer Sol 120',
      },
    ],
  },
  {
    id: 'arcadia',
    name: 'Arcadia Planitia — Human Base In-Situ Ice',
    tag: 'Prime Artemis/SpaceX Base Site (39.30°N, 189.70°E)',
    lat: 39.30,
    lng: -170.30,
    elevationM: -3800,
    description: 'Flat, hazard-free plains with shallow buried sheet ice (1–2m depth) critical for in-situ rocket fuel and life support.',
    geologyHighlights: 'Pitted terrain, sheet ice aprons, basaltic dust dunes.',
    groundColor: 0x94502b,
    skyColor: 0xc88258,
    sunIntensity: 1.15,
    satelliteThumb: 'https://images-assets.nasa.gov/image/PIA01466/PIA01466~orig.jpg',
    sampleTargets: [
      {
        name: 'Sub-Surface Glacial Core Outcrop',
        type: 'Glacial Ice Core with Basaltic Dust',
        composition: 'H2O 94.2%, Insoluble silicate dust 5.8%',
        significance: 'Primary feedstock for Sabatier methane propellant production for return vehicles.',
        pdsCitation: 'MRO SHARAD Radar Sounder Profile 1204',
      },
    ],
  },
];

interface MarsEVAReconMapProps {
  lat: number;
  lng: number;
  mapLayer: 'visible' | 'infrared' | 'elevation';
  zoom: number;
  className?: string;
}

/** A real Leaflet Mars map embedded in the EVA tactical panel. */
const MarsEVAReconMap: React.FC<MarsEVAReconMapProps> = ({ lat, lng, mapLayer, zoom, className = 'absolute inset-0' }) => {
  const mapHostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const trackRef = useRef<L.Polyline | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const fallbackRef = useRef<L.ImageOverlay | null>(null);
  const [tileState, setTileState] = useState<'loading' | 'ready'>('loading');

  const tileUrl = mapLayer === 'infrared'
    ? 'https://trek.nasa.gov/tiles/Mars/EQ/THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018/1.0.0/default/default028mm/{z}/{y}/{x}.png'
    : mapLayer === 'elevation'
      ? 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg'
      : 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg';

  useEffect(() => {
    if (!mapHostRef.current || mapRef.current) return;
    const map = L.map(mapHostRef.current, {
      crs: L.CRS.EPSG4326,
      center: [lat, lng],
      // EVA view is a local field-of-view, not a global Mars atlas.
      // Keep the astronaut's position in the centre and show only the
      // surrounding traverse area.
      zoom: Math.round(zoom + 2),
      minZoom: 2,
      maxZoom: 7,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: false,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1,
      preferCanvas: true,
    });
    mapRef.current = map;
    // Keep a local Mars surface underneath the public tiles so slow or
    // unavailable NASA requests never create black rectangles in the EVA map.
    fallbackRef.current = L.imageOverlay(
      '/textures/mars_viking_2k.jpg',
      [[-90, -180], [90, 180]],
      // Never present the global fallback as if it were local high-resolution
      // astronaut terrain. It is kept hidden while the real NASA layer loads.
      { opacity: 0, interactive: false }
    ).addTo(map);
    trackRef.current = L.polyline([[lat, lng]], {
      color: '#67e8f9',
      weight: 2,
      opacity: 0.9,
      dashArray: '5 5',
      interactive: false,
    }).addTo(map);
    markerRef.current = L.circleMarker([lat, lng], {
      radius: 7,
      color: '#67e8f9',
      weight: 2,
      fillColor: '#06b6d4',
      fillOpacity: 0.95,
    }).addTo(map);
    map.invalidateSize();

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      trackRef.current = null;
      tileRef.current = null;
      fallbackRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    const tile = L.tileLayer(tileUrl, {
      minZoom: 1,
      maxNativeZoom: mapLayer === 'infrared' ? 8 : 7,
      // Stay inside the imagery's native resolution. Upscaling beyond this
      // level is what caused the full-screen Real Map to become pixelated.
      maxZoom: 7,
      keepBuffer: 1,
      updateWhenIdle: true,
      updateWhenZooming: true,
      crossOrigin: 'anonymous',
    });
    setTileState('loading');
    tile.once('load', () => setTileState('ready'));
    tile.addTo(map);
    tileRef.current = tile;
    map.setMaxZoom(7);
    requestAnimationFrame(() => map.invalidateSize({ animate: false }));
    return () => {
      map.removeLayer(tile);
    };
  }, [tileUrl, mapLayer]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLatLng([lat, lng]);
    trackRef.current?.addLatLng([lat, lng]);
    if (trackRef.current && trackRef.current.getLatLngs().length > 160) {
      trackRef.current.setLatLngs(trackRef.current.getLatLngs().slice(-160) as L.LatLngExpression[]);
    }
    // Track-up behavior: keep the astronaut centered so every movement is
    // reflected by the real surface moving underneath the marker.
    map.panTo([lat, lng], { animate: false });
  }, [lat, lng]);

  useEffect(() => {
    mapRef.current?.setZoom(Math.min(7, Math.max(3, Math.round(zoom + 2))), { animate: false });
  }, [zoom]);

  return (
    <div ref={mapHostRef} className={`${className} bg-[#090b12]`} aria-label="Live Mars tactical map">
      {tileState === 'loading' && (
        <div className="absolute inset-0 z-[2] flex items-center justify-center bg-[#090b12]/95 pointer-events-none">
          <div className="rounded-xl border border-cyan-400/40 bg-[#07121d]/90 px-3 py-2 text-[10px] font-mono text-cyan-200 shadow-xl">
            Syncing NASA / USGS surface tiles…
          </div>
        </div>
      )}
    </div>
  );
};

interface MarsAstronautViewProps {
  initialSite?: {
    name: string;
    lat: number;
    lng: number;
    elevationM: number;
    description?: string;
  };
  onExit: () => void;
  onSwitchTo2D: () => void;
  onSwitchTo3D: () => void;
  activeRoute?: {
    name: string;
    safetyScore: number;
    maxSlopeDeg?: number;
    soilConditionScore?: number;
    terrainSuitabilityScore?: number;
    surfaceCondition?: string;
    waypoints: Array<{ lat: number; lng: number; name?: string; cumulativeDistKm?: number }>;
  };
}

interface EvaForwardGuidance {
  status: 'clear' | 'caution' | 'reroute';
  title: string;
  detail: string;
  direction: string;
  distanceKm?: number;
}

export const MarsAstronautView: React.FC<MarsAstronautViewProps> = ({
  initialSite,
  onExit,
  onSwitchTo2D,
  onSwitchTo3D,
  activeRoute,
}) => {
  // Selected site preset
  const [selectedSitePreset, setSelectedSitePreset] = useState<AstronautSitePreset>(() => {
    if (initialSite) {
      const match = ASTRONAUT_SITE_PRESETS.find(
        (p) =>
          initialSite.name?.toLowerCase().includes(p.id) ||
          p.name.toLowerCase().includes(initialSite.name?.toLowerCase() || '')
      );
      if (match) return match;
    }
    return ASTRONAUT_SITE_PRESETS[0];
  });

  // UI state
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [showHUD, setShowHUD] = useState<boolean>(true);
  const [visorFilter, setVisorFilter] = useState<'optical' | 'crism' | 'thermal' | 'night' | 'uv'>('optical');
  const [isSiteMenuOpen, setIsSiteMenuOpen] = useState<boolean>(false);
  const [isSampleCaddyOpen, setIsSampleCaddyOpen] = useState<boolean>(false);
  const [isTacticalMapOpen, setIsTacticalMapOpen] = useState<boolean>(false);
  const [isTacticalMapExpanded, setIsTacticalMapExpanded] = useState<boolean>(false);
  const [tacticalMapLayer, setTacticalMapLayer] = useState<'visible' | 'infrared' | 'elevation'>('visible');
  const [tacticalMapZoom, setTacticalMapZoom] = useState<number>(1.5);
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);
  // Reference-style EVA: first-person Mars surface is the main view, while
  // the real GIS reconnaissance map remains visible as the inset/tactical map.
  const [evaDisplayMode] = useState<'real-map' | 'surface-sim'>('surface-sim');
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [voiceCommandFeedback, setVoiceCommandFeedback] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [isVoiceCheatSheetOpen, setIsVoiceCheatSheetOpen] = useState<boolean>(false);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState<boolean>(false);
  const [isSprintActive, setIsSprintActive] = useState<boolean>(false);
  const [isHoverJetpackActive, setIsHoverJetpackActive] = useState<boolean>(false);

  // Captured EVA Photos
  const [capturedPhotos, setCapturedPhotos] = useState<Array<{
    id: string;
    dataUrl: string;
    timestamp: string;
    siteName: string;
    coordinates: string;
    altitudeM: number;
  }>>([]);

  // Collected samples
  const [collectedSamples, setCollectedSamples] = useState<Array<{
    id: string;
    targetName: string;
    sampleType: string;
    solTime: string;
    locationName: string;
    massGrams: number;
    pdsCitation: string;
  }>>([]);

  // Scanning state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeScanTarget, setActiveScanTarget] = useState<{
    name: string;
    type: string;
    composition: string;
    significance: string;
    pdsCitation: string;
    distanceM: number;
  } | null>(null);

  // Astronaut vitals & environment telemetry
  const [heartRate, setHeartRate] = useState<number>(74);
  const [oxygenLevel, setOxygenLevel] = useState<number>(94.6);
  const [suitPressureKPa, setSuitPressureKPa] = useState<number>(29.6);
  const [batteryPct, setBatteryPct] = useState<number>(87);
  const [headingDeg, setHeadingDeg] = useState<number>(142);
  const [pitchDeg, setPitchDeg] = useState<number>(0);
  const [evaDurationSec, setEvaDurationSec] = useState<number>(1840);
  const [photoFlash, setPhotoFlash] = useState<boolean>(false);
  const [odometerM, setOdometerM] = useState<number>(0);
  const [altitudeM, setAltitudeM] = useState<number>(1.75);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [movementDirection, setMovementDirection] = useState<string>('Stationary');
  const [movementSeconds, setMovementSeconds] = useState<number>(0);

  // Live dynamic coordinates based on movement offset
  const [currentLat, setCurrentLat] = useState<number>(selectedSitePreset.lat);
  const [currentLng, setCurrentLng] = useState<number>(selectedSitePreset.lng);

  const forwardGuidance = useMemo<EvaForwardGuidance>(() => {
    const headingRad = (headingDeg * Math.PI) / 180;
    const aheadLat = currentLat + Math.cos(headingRad) * 0.28;
    const latitudeScale = Math.max(0.25, Math.cos((currentLat * Math.PI) / 180));
    const aheadLng = currentLng + (Math.sin(headingRad) * 0.28) / latitudeScale;
    const start = { latitude: currentLat, longitude: currentLng };
    const ahead = { latitude: aheadLat, longitude: aheadLng };

    if (activeRoute?.waypoints?.length) {
      const target = activeRoute.waypoints.slice(1).find((waypoint) =>
        Math.hypot(waypoint.lat - currentLat, waypoint.lng - currentLng) > 0.01
      ) || activeRoute.waypoints[activeRoute.waypoints.length - 1];
      const targetBearing = (Math.atan2(
        (target.lng - currentLng) * latitudeScale,
        target.lat - currentLat
      ) * 180) / Math.PI;
      const normalizedBearing = (targetBearing + 360) % 360;
      const relative = ((normalizedBearing - headingDeg + 540) % 360) - 180;
      const turnText = Math.abs(relative) < 22
        ? 'Continue on the planned corridor'
        : `${relative > 0 ? 'Turn right' : 'Turn left'} ${Math.round(Math.abs(relative))}° toward the next waypoint`;
      const distanceKm = target.cumulativeDistKm;
      const needsReroute = activeRoute.safetyScore < 70 || (activeRoute.maxSlopeDeg ?? 0) >= 22;
      const needsCaution = activeRoute.safetyScore < 85 || (activeRoute.maxSlopeDeg ?? 0) >= 15;
      return {
        status: needsReroute ? 'reroute' : needsCaution ? 'caution' : 'clear',
        title: needsReroute ? 'Route change required' : needsCaution ? 'Caution ahead' : 'Smooth route ahead',
        detail: `${activeRoute.name}: ${activeRoute.surfaceCondition || 'surface model nominal'}${activeRoute.soilConditionScore !== undefined ? ` • soil ${Math.round(activeRoute.soilConditionScore)}/100` : ''}${activeRoute.maxSlopeDeg !== undefined ? ` • max slope ${activeRoute.maxSlopeDeg.toFixed(1)}°` : ''}`,
        direction: turnText,
        distanceKm,
      };
    }

    const hazards = [...JEZERO_HAZARD_ZONES, ...GALE_HAZARD_ZONES, ...GLOBAL_MARS_HAZARD_ZONES]
      .map((hazard) => ({ hazard, distance: distanceToSegmentMeters(hazard.coordinate, start, ahead) }))
      .filter(({ hazard, distance }) => distance <= Math.max(2500, hazard.radiusMeters * 0.12))
      .sort((a, b) => a.distance - b.distance);
    const nearest = hazards[0]?.hazard;
    if (nearest) {
      const severe = nearest.riskLevel === 'CRITICAL' || nearest.riskLevel === 'HIGH';
      return {
        status: severe ? 'reroute' : 'caution',
        title: severe ? 'Route change required' : 'Caution ahead',
        detail: `${nearest.name} is inside the forward scan corridor. ${nearest.description}`,
        direction: severe ? 'Stop, slow down, and choose a safer bypass' : 'Reduce speed and verify terrain before continuing',
      };
    }
    return {
      status: 'clear',
      title: 'Smooth ahead',
      detail: 'No modeled hazard detected in the forward scan corridor.',
      direction: 'Continue on current heading',
    };
  }, [activeRoute, currentLat, currentLng, headingDeg]);

  // 3D Canvas References
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const rocksGroupRef = useRef<THREE.Group | null>(null);
  const skyDomeRef = useRef<THREE.Mesh | null>(null);
  const dustFieldRef = useRef<THREE.Points | null>(null);
  const ecgCanvasRef = useRef<HTMLCanvasElement>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);
  const laserBeamRef = useRef<THREE.Line | null>(null);
  const spotLightRef = useRef<THREE.SpotLight | null>(null);

  // Astronaut 6-DOF Navigation State (W/S/A/D/Space/C, Turn, Look)
  const cameraEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isPointerDown = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const keysDown = useRef<{ [key: string]: boolean }>({});
  const astronautPos = useRef(new THREE.Vector3(0, 1.75, 0));
  const astronautAltitude = useRef(1.75); // Eye level baseline
  const isMovingRef = useRef(false);
  const lastMovementDirectionRef = useRef('Stationary');
  const walkStepTimer = useRef(0);
  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    const movementClock = window.setInterval(() => {
      if (isMovingRef.current) setMovementSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(movementClock);
  }, []);
  const activeMoveInterval = useRef<any>(null);

  // Update live coordinates whenever site preset changes
  useEffect(() => {
    setCurrentLat(selectedSitePreset.lat);
    setCurrentLng(selectedSitePreset.lng);
    astronautPos.current.set(0, 1.75, 0);
    astronautAltitude.current = 1.75;
    cameraEuler.current.set(0, 0, 0);
    setHeadingDeg(0);
    setPitchDeg(0);
    setOdometerM(0);
    setMovementSeconds(0);
    setMovementDirection('Stationary');
    setIsMoving(false);
    isMovingRef.current = false;
  }, [selectedSitePreset]);

  // Start audio on mount
  useEffect(() => {
    marsEvaAudio.start();
    setIsAudioMuted(marsEvaAudio.getIsMuted());
    marsEvaAudio.playRadioClick();
    return () => {
      marsEvaAudio.stop();
    };
  }, []);

  // Timer for EVA duration & vitals fluctuation
  useEffect(() => {
    const timer = setInterval(() => {
      setEvaDurationSec((prev) => prev + 1);
      setHeartRate((prev) => {
        const delta = (Math.random() - 0.5) * 2;
        return Math.round(Math.max(68, Math.min(88, prev + delta)));
      });
      setSuitPressureKPa((prev) => {
        const delta = (Math.random() - 0.5) * 0.04;
        return Number(Math.max(29.4, Math.min(29.8, prev + delta)).toFixed(2));
      });
      setOxygenLevel((prev) => Math.max(80, Number((prev - 0.002).toFixed(2))));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Radio voice synthesis speaker for astronaut comms feedback
  const speakEvaComms = useCallback((message: string) => {
    marsEvaAudio.playRadioClick();
    setVoiceCommandFeedback(message);
    setTimeout(() => setVoiceCommandFeedback(null), 4500);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
        utterance.volume = 0.85;
        window.speechSynthesis.speak(utterance);
      } catch {}
    }
  }, []);

  // Execute Laser LIBS / Raman Scan
  const handlePerformScan = useCallback(() => {
    if (isScanning || !activeScanTarget) return;
    setIsScanning(true);
    marsEvaAudio.playLaserScan();

    if (laserBeamRef.current) {
      (laserBeamRef.current.material as THREE.LineBasicMaterial).opacity = 1;
      setTimeout(() => {
        if (laserBeamRef.current) {
          (laserBeamRef.current.material as THREE.LineBasicMaterial).opacity = 0;
        }
      }, 550);
    }

    setTimeout(() => {
      setIsScanning(false);
      marsEvaAudio.playRadioClick();
    }, 1200);
  }, [isScanning, activeScanTarget]);

  // Collect Geological Sample into Caddy
  const handleCollectSample = useCallback(() => {
    if (!activeScanTarget) return;
    marsEvaAudio.playSampleCollected();
    const newSample = {
      id: `sample-${Date.now()}`,
      targetName: activeScanTarget.name,
      sampleType: activeScanTarget.type,
      solTime: `Sol 482`,
      locationName: selectedSitePreset.name,
      massGrams: Math.round(18 + Math.random() * 24),
      pdsCitation: activeScanTarget.pdsCitation,
    };
    setCollectedSamples((prev) => [newSample, ...prev]);
    speakEvaComms(`${activeScanTarget.name} core sealed into titanium sample tube.`);
  }, [activeScanTarget, selectedSitePreset.name, speakEvaComms]);

  // Voice Command System (Web Speech API) - Supporting both Bengali & English
  const processVoiceCommand = useCallback((raw: string) => {
    const text = raw.toLowerCase().trim();
    setVoiceTranscript(raw);

    // Movement: Forward ("forward", "ahead", "straight")
    if (
      text.includes('forward') ||
      text.includes('ahead') ||
      text.includes('straight')
    ) {
      keysDown.current['w'] = true;
      setTimeout(() => { keysDown.current['w'] = false; }, 2600);
      speakEvaComms('Advancing forward 5 meters.');
      return;
    }

    // Movement: Backward ("back", "backward", "reverse")
    if (
      text.includes('back') ||
      text.includes('backward') ||
      text.includes('reverse')
    ) {
      keysDown.current['s'] = true;
      setTimeout(() => { keysDown.current['s'] = false; }, 2600);
      speakEvaComms('Reversing position.');
      return;
    }

    // Movement: Left ("left", "turn left")
    if (text.includes('left') || text.includes('turn left')) {
      cameraEuler.current.y += Math.PI / 4;
      if (cameraRef.current) cameraRef.current.quaternion.setFromEuler(cameraEuler.current);
      speakEvaComms('Turned 45 degrees left.');
      return;
    }

    // Movement: Right ("right", "turn right")
    if (text.includes('right') || text.includes('turn right')) {
      cameraEuler.current.y -= Math.PI / 4;
      if (cameraRef.current) cameraRef.current.quaternion.setFromEuler(cameraEuler.current);
      speakEvaComms('Turned 45 degrees right.');
      return;
    }

    // Movement: Up / Jetpack / Jump ("up", "fly", "jump", "thruster")
    if (
      text.includes('up') ||
      text.includes('jump') ||
      text.includes('fly') ||
      text.includes('thruster')
    ) {
      astronautAltitude.current = Math.min(30, astronautAltitude.current + 8);
      marsEvaAudio.playThrusterBurst();
      speakEvaComms('MMU Thrusters fired. Altitude ascending.');
      return;
    }

    // Movement: Down / Land ("down", "crouch", "land")
    if (
      text.includes('down') ||
      text.includes('land') ||
      text.includes('crouch')
    ) {
      astronautAltitude.current = 1.75;
      speakEvaComms('Landing on surface regolith.');
      return;
    }

    // Movement: Stop ("stop", "halt")
    if (
      text.includes('stop') ||
      text.includes('halt')
    ) {
      keysDown.current['w'] = false;
      keysDown.current['s'] = false;
      keysDown.current['a'] = false;
      keysDown.current['d'] = false;
      speakEvaComms('All movement halted.');
      return;
    }

    // Speed Boost ("boost", "fast", "speed", "sprint")
    if (text.includes('boost') || text.includes('fast') || text.includes('speed') || text.includes('sprint')) {
      setIsSprintActive((prev) => {
        const next = !prev;
        speakEvaComms(next ? 'Turbo thruster sprint activated.' : 'Standard walking pace resumed.');
        return next;
      });
      return;
    }

    // Flashlight / Light ("light", "torch", "flashlight")
    if (
      text.includes('light') ||
      text.includes('torch') ||
      text.includes('flashlight')
    ) {
      setIsFlashlightOn((prev) => {
        const next = !prev;
        if (spotLightRef.current) spotLightRef.current.intensity = next ? 4.5 : 0;
        marsEvaAudio.playFlashlightClick();
        speakEvaComms(next ? 'Dual helmet LED spotlights illuminated.' : 'Helmet spotlights deactivated.');
        return next;
      });
      return;
    }

    // Scan ("scan", "analyze", "laser")
    if (
      text.includes('scan') ||
      text.includes('analyze') ||
      text.includes('laser')
    ) {
      handlePerformScan();
      speakEvaComms('Laser LIBS Spectrometer firing.');
      return;
    }

    // Sample ("sample", "collect", "bag")
    if (
      text.includes('sample') ||
      text.includes('collect') ||
      text.includes('bag')
    ) {
      handleCollectSample();
      return;
    }

    // Photo ("photo", "picture", "camera")
    if (
      text.includes('photo') ||
      text.includes('picture') ||
      text.includes('camera')
    ) {
      triggerPhotoCapture();
      return;
    }

    // Tactical Real Map ("map", "radar", "recon")
    if (
      text.includes('map') ||
      text.includes('radar') ||
      text.includes('recon')
    ) {
      setIsTacticalMapOpen((prev) => {
        const next = !prev;
        speakEvaComms(next ? 'Tactical real Mars map opened.' : 'Tactical map closed.');
        return next;
      });
      return;
    }

    // Visor Filters ("thermal", "crism", "night", "optical", "uv")
    if (text.includes('thermal') || text.includes('infrared')) {
      setVisorFilter('thermal');
      speakEvaComms('Visor switched to FLIR Thermal Infrared.');
      return;
    }
    if (text.includes('night') || text.includes('dark')) {
      setVisorFilter('night');
      speakEvaComms('Visor switched to Phosphor Night Vision.');
      return;
    }
    if (text.includes('crism') || text.includes('mineral')) {
      setVisorFilter('crism');
      speakEvaComms('Visor switched to CRISM Mineralogy Spectrograph.');
      return;
    }
    if (text.includes('uv') || text.includes('ultraviolet')) {
      setVisorFilter('uv');
      speakEvaComms('Visor switched to UV Fluorescence.');
      return;
    }
    if (text.includes('optical') || text.includes('normal') || text.includes('color')) {
      setVisorFilter('optical');
      speakEvaComms('Visor returned to True Optical Color.');
      return;
    }

    speakEvaComms(`Voice command recognized: "${raw}". Check guide for commands.`);
  }, [handleCollectSample, handlePerformScan, speakEvaComms]);

  // Toggle Voice Recognition
  const toggleVoiceControl = () => {
    if (isVoiceListening) {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
      }
      setIsVoiceListening(false);
      speakEvaComms('Voice recognition offline.');
    } else {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        speakEvaComms('Speech Recognition is not supported in this browser. Use manual HUD controls.');
        setIsVoiceCheatSheetOpen(true);
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        // Accept both Bengali and English utterances
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const lastIdx = event.results.length - 1;
          const transcript = event.results[lastIdx][0].transcript;
          processVoiceCommand(transcript);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
          setIsVoiceListening(false);
        };

        recognition.onend = () => {
          if (isVoiceListening) {
            try { recognition.start(); } catch {}
          }
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
        setIsVoiceListening(true);
        speakEvaComms('Voice recognition online. Speak commands in English or Bengali.');
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
        setIsVoiceListening(false);
        setIsVoiceCheatSheetOpen(true);
      }
    }
  };

  // High-Resolution In-Situ Photo Capture
  const triggerPhotoCapture = useCallback(() => {
    setPhotoFlash(true);
    marsEvaAudio.playLaserScan(); // Shutter sound
    setTimeout(() => setPhotoFlash(false), 150);

    if (rendererRef.current) {
      try {
        const dataUrl = rendererRef.current.domElement.toDataURL('image/jpeg', 0.92);
        const newPhoto = {
          id: `photo-${Date.now()}`,
          dataUrl,
          timestamp: `Sol 482 • ${formatTimer(evaDurationSec)}`,
          siteName: selectedSitePreset.name.split('—')[0],
          coordinates: `${currentLat.toFixed(2)}°N, ${currentLng.toFixed(2)}°E`,
          altitudeM,
        };
        setCapturedPhotos((prev) => [newPhoto, ...prev]);
        speakEvaComms(`Photo captured and saved to EVA gallery.`);
      } catch (e) {
        console.warn('Photo snapshot failed:', e);
      }
    }
  }, [currentLat, currentLng, altitudeM, evaDurationSec, selectedSitePreset.name, speakEvaComms]);

  // Draw Live ECG Waveform
  useEffect(() => {
    const canvas = ecgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x = 0;
    let animId: number;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawECG = () => {
      ctx.fillStyle = 'rgba(7, 11, 20, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.moveTo(x, 10);
      x = (x + 1.5) % canvas.width;

      const mod = x % 35;
      let y = 10;
      if (mod > 14 && mod < 18) y = 3;
      else if (mod >= 18 && mod < 22) y = 17;
      else if (mod >= 22 && mod < 25) y = 8;

      ctx.lineTo(x, y);
      ctx.stroke();

      animId = requestAnimationFrame(drawECG);
    };

    drawECG();
    return () => cancelAnimationFrame(animId);
  }, [heartRate]);

  // Draw Tactical Mini-Radar Overlay Canvas
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sweepAngle = 0;
    let animId: number;

    const renderRadar = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxR = Math.min(cx, cy) - 6;

      // Radar rings
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 1;
      [0.35, 0.7, 1.0].forEach((rPct) => {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * rPct, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy);
      ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR);
      ctx.lineTo(cx, cy + maxR);
      ctx.stroke();

      // Heading directional beam cone (rotates with astronaut yaw)
      const headingRad = (headingDeg * Math.PI) / 180;
      const fovAngle = Math.PI / 4;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR * 0.95, -headingRad - fovAngle / 2 - Math.PI / 2, -headingRad + fovAngle / 2 - Math.PI / 2);
      ctx.closePath();
      ctx.fill();

      // Sweeping radar beam
      sweepAngle += 0.045;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR);
      ctx.stroke();

      // Radar blips for rocks
      ctx.fillStyle = '#f59e0b';
      const blips = [
        { angle: 0.6, dist: 0.4 },
        { angle: 2.1, dist: 0.7 },
        { angle: -1.2, dist: 0.5 },
        { angle: -2.8, dist: 0.8 },
      ];
      blips.forEach((b) => {
        const bx = cx + Math.cos(b.angle) * maxR * b.dist;
        const by = cy + Math.sin(b.angle) * maxR * b.dist;
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Astronaut center blip
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // North indicator
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('N', cx, 12);

      animId = requestAnimationFrame(renderRadar);
    };

    renderRadar();
    return () => cancelAnimationFrame(animId);
  }, [headingDeg]);

  // Handle keyboard navigation (WASD, Arrows, Space, C, Z, X, Shift, L, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysDown.current[k] = true;

      // Jump / Ascend with Space or E
      if (k === ' ' || k === 'e') {
        e.preventDefault();
        astronautAltitude.current = Math.min(35, astronautAltitude.current + 1.5);
        marsEvaAudio.playThrusterBurst();
      }

      // Descend / Crouch with C or Q
      if (k === 'c' || k === 'q') {
        astronautAltitude.current = Math.max(1.75, astronautAltitude.current - 1.5);
      }

      // Turn Left (Z) / Turn Right (X)
      if (k === 'z') {
        cameraEuler.current.y += 0.08;
      }
      if (k === 'x') {
        cameraEuler.current.y -= 0.08;
      }

      // Look Up (R) / Look Down (F)
      if (k === 'r') {
        cameraEuler.current.x = Math.max(-1.25, cameraEuler.current.x - 0.08);
      }
      if (k === 'f') {
        cameraEuler.current.x = Math.min(1.35, cameraEuler.current.x + 0.08);
      }

      // Flashlight toggle (L)
      if (k === 'l') {
        toggleFlashlight();
      }

      // Tactical Map toggle (M)
      if (k === 'm') {
        setIsTacticalMapOpen((prev) => !prev);
      }

      // Sprint toggle (Shift)
      if (k === 'shift') {
        setIsSprintActive(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysDown.current[k] = false;
      if (k === 'shift') {
        setIsSprintActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Format EVA timer
  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Build Procedural Martian Surface Texture with realistic basalt & iron dust
  const createMartianGroundTexture = useCallback((baseColorHex: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    const r = (baseColorHex >> 16) & 255;
    const g = (baseColorHex >> 8) & 255;
    const b = baseColorHex & 255;

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, 1024, 1024);

    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 55;
      const grain = Math.sin((i / 4) * 0.1) * 12;
      data[i] = Math.max(0, Math.min(255, r + noise + grain));
      data[i + 1] = Math.max(0, Math.min(255, g + noise * 0.7 + grain * 0.5));
      data[i + 2] = Math.max(0, Math.min(255, b + noise * 0.5));
    }
    ctx.putImageData(imgData, 0, 0);

    // Ripple dunes
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 0; y < 1024; y += 32) {
      ctx.beginPath();
      ctx.ellipse(512, y, 600, 14, 0.05, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 16);
    return tex;
  }, []);

  // A layered dusty-sky gradient gives the EVA visor a readable horizon
  // instead of a single flat orange color.
  const createMartianSkyTexture = useCallback((skyColorHex: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    const base = new THREE.Color(skyColorHex);
    // Mars dust makes the sky warm, but an over-saturated orange gradient
    // makes the EVA scene look like a cartoon. Keep the horizon luminous and
    // the upper sky muted like a real dusty planetary atmosphere.
    const top = base.clone().multiplyScalar(0.12);
    const mid = base.clone().multiplyScalar(0.34);
    const horizon = base.clone().lerp(new THREE.Color(0xd18d70), 0.18);
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, `#${top.getHexString()}`);
    gradient.addColorStop(0.48, `#${mid.getHexString()}`);
    gradient.addColorStop(0.82, `#${horizon.getHexString()}`);
    gradient.addColorStop(1, '#5b403b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Low-contrast dust bands create atmospheric depth near the horizon.
    for (let y = 560; y < 1024; y += 46) {
      ctx.fillStyle = `rgba(255, 194, 132, ${0.025 + (y - 560) / 26000})`;
      ctx.fillRect(0, y, canvas.width, 18);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }, []);

  // Initialize Three.js 3D Surface Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    // Linear dusty haze creates depth without washing the entire scene in
    // site-colour orange. The real surface texture remains readable nearby.
    scene.fog = new THREE.Fog(0x6e514b, 105, 330);

    // Human eye-level framing: horizon ahead, ground in the lower field of
    // view, and no overhead/global-map perspective.
    const camera = new THREE.PerspectiveCamera(62, width / height, 0.25, 900);
    camera.position.set(0, 1.72, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 1. Terrain Mesh (320m x 320m localized ground grid)
    const terrainGeo = new THREE.PlaneGeometry(320, 320, 128, 128);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const dist = Math.sqrt(vx * vx + vz * vz);
      const centerDamp = Math.min(1, Math.max(0, (dist - 4) / 20));
      const h1 = Math.sin(vx * 0.05) * Math.cos(vz * 0.05) * 2.2;
      const h2 = Math.sin(vx * 0.12 + 1.2) * Math.sin(vz * 0.12) * 0.75;
      const h3 = Math.cos(vx * 0.02 - vz * 0.02) * 3.1;
      const duneRidges = Math.sin(vz * 0.32 + Math.sin(vx * 0.08)) * 0.28;
      const microRelief = Math.sin(vx * 1.7) * Math.cos(vz * 1.35) * 0.08;
      const craterLip = dist > 60 ? (dist - 60) * 0.045 : 0;
      posAttr.setY(i, (h1 + h2 + h3 + duneRidges + microRelief + craterLip) * centerDamp);
    }
    terrainGeo.computeVertexNormals();

    const groundTex = createMartianGroundTexture(selectedSitePreset.groundColor);
    const terrainMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      bumpMap: groundTex,
      bumpScale: 0.16,
      roughness: 0.95,
      metalness: 0.02,
    });
    // Use the bundled NASA/USGS Viking global mosaic on the actual 3D
    // surface. The texture is cropped around the selected landing site so
    // walking forward reveals real Martian albedo detail instead of a flat
    // procedural orange floor.
    const realMarsTexture = new THREE.TextureLoader().load('/textures/mars_viking_2k.jpg', (texture) => {
      // A wider crop gives the eye enough real orbital texture while avoiding
      // the stretched, single-colour look of the previous narrow crop.
      const repeatX = 0.34;
      const repeatY = 0.28;
      const centerU = (selectedSitePreset.lng + 180) / 360;
      const centerV = (90 - selectedSitePreset.lat) / 180;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.repeat.set(repeatX, repeatY);
      texture.offset.set(
        Math.max(0, Math.min(1 - repeatX, centerU - repeatX / 2)),
        Math.max(0, Math.min(1 - repeatY, centerV - repeatY / 2)),
      );
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      terrainMat.map = texture;
      terrainMat.bumpMap = texture;
      terrainMat.bumpScale = 0.28;
      terrainMat.needsUpdate = true;
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMeshRef.current = terrainMesh;
    scene.add(terrainMesh);

    // 2. Distant Horizon Mountain Ring + layered geological silhouettes.
    const rimGeo = new THREE.CylinderGeometry(290, 300, 70, 48, 1, true);
    const rimMat = new THREE.MeshBasicMaterial({
      color: 0x624640,
      side: THREE.BackSide,
      fog: true,
      transparent: true,
      opacity: 0.42,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = 15;
    scene.add(rimMesh);

    const mountainGroup = new THREE.Group();
    const mountainGeo = new THREE.SphereGeometry(1, 32, 16);
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x5d433d,
      roughness: 1,
      metalness: 0,
      flatShading: false,
    });
    for (let i = 0; i < 14; i += 1) {
      const mountain = new THREE.Mesh(mountainGeo, mountainMat);
      const x = -150 + i * 23 + Math.sin(i * 1.7) * 10;
      const z = -190 - (i % 3) * 18;
      const height = 14 + (i % 5) * 6;
      mountain.position.set(x, height * 0.18, z);
      mountain.scale.set(20 + (i % 4) * 8, height, 16 + (i % 3) * 7);
      mountain.rotation.y = i * 0.7;
      mountain.castShadow = true;
      mountainGroup.add(mountain);
    }
    scene.add(mountainGroup);

    // 3. Martian Rocks & Outcrops Scatter
    const rocksGroup = new THREE.Group();
    rocksGroupRef.current = rocksGroup;
    const rockGeo = new THREE.IcosahedronGeometry(0.8, 3);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x9a593d,
      roughness: 0.98,
      metalness: 0,
      emissive: 0x100806,
      emissiveIntensity: 0.04,
    });

    const rockPositions = [
      // Keep the spawn point clear; targets become selectable as the
      // astronaut walks toward them instead of filling the centre reticle.
      { x: 5.5, z: -8.5, s: 1.4, targetIdx: 0 },
      { x: -11.5, z: -17.5, s: 2.1, targetIdx: 1 },
      { x: 15.5, z: -20.5, s: 1.8, targetIdx: 2 % selectedSitePreset.sampleTargets.length },
      { x: -8.5, z: 10.5, s: 1.2, targetIdx: 0 },
      { x: 15.2, z: 11.8, s: 2.4, targetIdx: 1 },
      { x: -19.5, z: -6.3, s: 3.1, targetIdx: 0 },
      { x: 28.0, z: -26.0, s: 4.2, targetIdx: 2 % selectedSitePreset.sampleTargets.length },
      { x: -28.0, z: -30.0, s: 3.8, targetIdx: 1 },
      { x: 34.0, z: -42.0, s: 1.2, targetIdx: 0 },
      { x: -42.0, z: -48.0, s: 1.6, targetIdx: 1 },
      { x: 48.0, z: -62.0, s: 2.3, targetIdx: 2 % selectedSitePreset.sampleTargets.length },
      { x: -54.0, z: -72.0, s: 1.1, targetIdx: 0 },
      { x: 22.0, z: -78.0, s: 1.5, targetIdx: 1 },
      { x: -24.0, z: -92.0, s: 2.0, targetIdx: 2 % selectedSitePreset.sampleTargets.length },
    ];

    rockPositions.forEach((pos) => {
      const mesh = new THREE.Mesh(rockGeo, rockMat);
      mesh.position.set(pos.x, pos.s * 0.4, pos.z);
      mesh.scale.set(pos.s, pos.s * 0.62 + Math.random() * 0.28, pos.s * 1.05);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = {
        isScanTarget: true,
        targetInfo: selectedSitePreset.sampleTargets[pos.targetIdx],
        distM: Number(Math.sqrt(pos.x * pos.x + pos.z * pos.z).toFixed(1)),
      };
      rocksGroup.add(mesh);
    });
    scene.add(rocksGroup);

    // Fine airborne regolith catches the light and gives the low-pressure
    // atmosphere depth without covering the astronaut's view.
    const dustCount = width < 700 ? 220 : 420;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i += 1) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 190;
      dustPositions[i * 3 + 1] = 0.35 + Math.random() * 15;
      dustPositions[i * 3 + 2] = -150 + Math.random() * 180;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xd8a17d,
      size: width < 700 ? 0.045 : 0.06,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const dustField = new THREE.Points(dustGeo, dustMat);
    dustFieldRef.current = dustField;
    scene.add(dustField);

    // 4. Rover Tracks
    const trackGeo = new THREE.PlaneGeometry(0.24, 18);
    trackGeo.rotateX(-Math.PI / 2);
    const trackMat = new THREE.MeshBasicMaterial({
      color: 0x421c0e,
      transparent: true,
      opacity: 0.1,
    });
    const trackLeft = new THREE.Mesh(trackGeo, trackMat);
    trackLeft.position.set(-0.85, 0.025, -8);
    const trackRight = new THREE.Mesh(trackGeo, trackMat);
    trackRight.position.set(0.85, 0.025, -8);
    scene.add(trackLeft);
    scene.add(trackRight);

    // 5. Sky Dome
    const skyGeo = new THREE.SphereGeometry(350, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      map: createMartianSkyTexture(selectedSitePreset.skyColor),
      color: 0xffffff,
      side: THREE.BackSide,
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    skyDomeRef.current = skyDome;
    scene.add(skyDome);

    // 6. Lighting
    const hemiLight = new THREE.HemisphereLight(0xffd2a6, 0x32140e, 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffd3a6, selectedSitePreset.sunIntensity * 0.86);
    sunLight.position.set(60, 85, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(width < 700 ? 512 : 1024, width < 700 ? 512 : 1024);
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 360;
    sunLight.shadow.camera.left = -160;
    sunLight.shadow.camera.right = 160;
    sunLight.shadow.camera.top = 160;
    sunLight.shadow.camera.bottom = -160;
    scene.add(sunLight);

    // A small physically-readable sun disc replaces the flat orange sky cue.
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 128;
    sunCanvas.height = 128;
    const sunCtx = sunCanvas.getContext('2d');
    if (sunCtx) {
      const sunGradient = sunCtx.createRadialGradient(64, 64, 8, 64, 64, 64);
      sunGradient.addColorStop(0, 'rgba(255,250,220,1)');
      sunGradient.addColorStop(0.2, 'rgba(255,221,164,.95)');
      sunGradient.addColorStop(0.52, 'rgba(245,139,76,.28)');
      sunGradient.addColorStop(1, 'rgba(245,139,76,0)');
      sunCtx.fillStyle = sunGradient;
      sunCtx.fillRect(0, 0, 128, 128);
      const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(sunCanvas),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }));
      sunSprite.position.set(110, 54, -230);
      sunSprite.scale.set(25, 25, 1);
      scene.add(sunSprite);
    }

    // Dual Helmet Spotlight
    const spotLight = new THREE.SpotLight(0xffffff, isFlashlightOn ? 4.5 : 0, 45, Math.PI / 5, 0.35);
    spotLight.position.set(0, 1.8, 0);
    spotLightRef.current = spotLight;
    camera.add(spotLight);
    scene.add(camera);

    // Laser Beam Line
    const laserMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0,
      linewidth: 3,
    });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0.2, -0.2, -0.4),
      new THREE.Vector3(0, 0, -10),
    ]);
    const laserLine = new THREE.Line(laserGeo, laserMat);
    laserBeamRef.current = laserLine;
    camera.add(laserLine);

    // Window Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Mouse / Touch Look Around (Pitch & Yaw)
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isPointerDown.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevPointer.current = { x: clientX, y: clientY };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isPointerDown.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const dx = clientX - prevPointer.current.x;
      const dy = clientY - prevPointer.current.y;
      prevPointer.current = { x: clientX, y: clientY };

      // Sensitivity
      cameraEuler.current.y -= dx * 0.0028;
      cameraEuler.current.x = Math.max(-1.25, Math.min(1.35, cameraEuler.current.x - dy * 0.0028));

      camera.quaternion.setFromEuler(cameraEuler.current);

      // Compute heading & pitch in degrees
      const degY = ((-cameraEuler.current.y * 180) / Math.PI) % 360;
      setHeadingDeg(Math.round(degY < 0 ? degY + 360 : degY));
      setPitchDeg(Math.round((-cameraEuler.current.x * 180) / Math.PI));
    };

    const handlePointerUp = () => {
      isPointerDown.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handlePointerDown);
    dom.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    dom.addEventListener('touchstart', handlePointerDown, { passive: true });
    dom.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Animation Loop
    let reqId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = Math.min(0.1, clock.getDelta());

      // Check walking & omnidirectional movement
      const keys = keysDown.current;
      const moveVec = new THREE.Vector3(0, 0, 0);

      // Forward / Back
      if (keys['w'] || keys['arrowup']) moveVec.z -= 1;
      if (keys['s'] || keys['arrowdown']) moveVec.z += 1;

      // Strafe Left / Right
      if (keys['a'] || keys['arrowleft']) moveVec.x -= 1;
      if (keys['d'] || keys['arrowright']) moveVec.x += 1;

      // Ascend / Jump
      if (keys[' '] || keys['e']) {
        astronautAltitude.current = Math.min(35, astronautAltitude.current + 8 * delta);
      } else if (!isHoverJetpackActive && astronautAltitude.current > 1.75 && !keys['c'] && !keys['q']) {
        // Gentle Martian low-gravity drift down (0.38g)
        astronautAltitude.current = Math.max(1.75, astronautAltitude.current - 3.8 * delta);
      }

      // Descend / Crouch
      if (keys['c'] || keys['q']) {
        astronautAltitude.current = Math.max(1.75, astronautAltitude.current - 7 * delta);
      }

      setAltitudeM(Number(astronautAltitude.current.toFixed(1)));

      // Speed boost calculation
      const speedMultiplier = isSprintActive || keys['shift'] ? 2.6 : 1.0;

      // Process horizontal motion
      if (moveVec.lengthSq() > 0) {
        isMovingRef.current = true;
        const nextMovementDirection = Math.abs(moveVec.z) >= Math.abs(moveVec.x)
          ? (moveVec.z < 0 ? 'Forward' : 'Reverse')
          : (moveVec.x < 0 ? 'Strafe left' : 'Strafe right');
        if (lastMovementDirectionRef.current !== nextMovementDirection) {
          lastMovementDirectionRef.current = nextMovementDirection;
          setMovementDirection(nextMovementDirection);
        }
        setIsMoving(true);
        moveVec.normalize();
        const walkSpeed = 2.5 * speedMultiplier * delta;

        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraEuler.current.y);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraEuler.current.y);

        astronautPos.current.addScaledVector(forward, -moveVec.z * walkSpeed);
        astronautPos.current.addScaledVector(right, moveVec.x * walkSpeed);

        setOdometerM((prev) => prev + walkSpeed);

        // Clamping inside exploration radius
        astronautPos.current.x = Math.max(-95, Math.min(95, astronautPos.current.x));
        astronautPos.current.z = Math.max(-95, Math.min(95, astronautPos.current.z));

        // Keep the first-person camera outside rocks while still allowing the
        // astronaut to approach close enough for the scanner/sample workflow.
        rocksGroup.children.forEach((rock) => {
          const dx = astronautPos.current.x - rock.position.x;
          const dz = astronautPos.current.z - rock.position.z;
          const distance = Math.hypot(dx, dz);
          const rockRadius = Math.max(rock.scale.x, rock.scale.z) * 0.72;
          const safeDistance = rockRadius + 1.15;
          if (distance > 0.001 && distance < safeDistance) {
            const push = (safeDistance - distance) / distance;
            astronautPos.current.x += dx * push;
            astronautPos.current.z += dz * push;
          }
        });

        // Dynamically shift GPS lat/lng slightly as astronaut moves
        const latOffset = (astronautPos.current.z / 100000);
        const lngOffset = (astronautPos.current.x / 100000);
        setCurrentLat(selectedSitePreset.lat - latOffset);
        setCurrentLng(selectedSitePreset.lng + lngOffset);

        // Walking head bobbing
        walkStepTimer.current += delta * 6;
        const bob = astronautAltitude.current <= 1.85 ? Math.sin(walkStepTimer.current) * 0.05 : 0;
        camera.position.set(astronautPos.current.x, astronautAltitude.current + bob, astronautPos.current.z);

        // Footstep sound in regolith
        if (astronautAltitude.current <= 1.85 && Math.sin(walkStepTimer.current) > 0.95 && Math.random() < 0.28) {
          marsEvaAudio.playFootstep();
        }
      } else {
        isMovingRef.current = false;
        if (lastMovementDirectionRef.current !== 'Stationary') {
          lastMovementDirectionRef.current = 'Stationary';
          setMovementDirection('Stationary');
        }
        setIsMoving(false);
        camera.position.set(astronautPos.current.x, astronautAltitude.current, astronautPos.current.z);
      }

      // Keep the first-person view aligned with the current attitude. Keyboard
      // turn/look controls update cameraEuler directly, so syncing here avoids
      // the camera appearing to stare at the ground or rotate out of phase
      // with the direction used by movement.
      camera.quaternion.setFromEuler(cameraEuler.current);

      // Slow lateral drift makes the regolith particles feel suspended in a
      // thin Martian atmosphere instead of looking like a game-particle burst.
      const dustPositions = dustFieldRef.current?.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
      if (dustPositions) {
        for (let i = 0; i < dustPositions.count; i += 1) {
          const x = dustPositions.getX(i) + delta * 0.11;
          dustPositions.setX(i, x > 96 ? -96 : x);
        }
        dustPositions.needsUpdate = true;
      }

      // Check nearest rock for target scanner
      let nearestTarget: any = null;
      let minTargetDist = 999;
      rocksGroup.children.forEach((rock) => {
        const d = rock.position.distanceTo(camera.position);
        if (d < 12 && d < minTargetDist) {
          minTargetDist = d;
          nearestTarget = {
            ...rock.userData.targetInfo,
            distanceM: Number(d.toFixed(1)),
          };
        }
      });
      setActiveScanTarget(nearestTarget);

      // Render
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', handlePointerDown);
      dom.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      dom.removeEventListener('touchstart', handlePointerDown);
      dom.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
      }
    };
  }, [selectedSitePreset, createMartianGroundTexture, isFlashlightOn, isHoverJetpackActive, isSprintActive]);

  // Update Visor Filter Color Grading
  useEffect(() => {
    if (!skyDomeRef.current || !terrainMeshRef.current || !sceneRef.current) return;
    const skyMat = skyDomeRef.current.material as THREE.MeshBasicMaterial;
    const terrainMat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;

    if (visorFilter === 'crism') {
      skyMat.color.setHex(0x1e3a5f);
      terrainMat.color.setHex(0x00f0ff);
      sceneRef.current.fog = new THREE.FogExp2(0x1e3a5f, 0.012);
    } else if (visorFilter === 'thermal') {
      skyMat.color.setHex(0x110222);
      terrainMat.color.setHex(0xffaa22);
      sceneRef.current.fog = new THREE.FogExp2(0x110222, 0.01);
    } else if (visorFilter === 'night') {
      skyMat.color.setHex(0x041f0b);
      terrainMat.color.setHex(0x22c55e);
      sceneRef.current.fog = new THREE.FogExp2(0x041f0b, 0.015);
    } else if (visorFilter === 'uv') {
      skyMat.color.setHex(0x1a052e);
      terrainMat.color.setHex(0xd946ef);
      sceneRef.current.fog = new THREE.FogExp2(0x1a052e, 0.012);
    } else {
      skyMat.color.setHex(selectedSitePreset.skyColor);
      terrainMat.color.setHex(0xffffff);
      sceneRef.current.fog = new THREE.FogExp2(selectedSitePreset.skyColor, 0.008);
    }
  }, [visorFilter, selectedSitePreset]);

  // Flashlight toggle
  const toggleFlashlight = () => {
    setIsFlashlightOn((prev) => {
      const next = !prev;
      if (spotLightRef.current) spotLightRef.current.intensity = next ? 4.5 : 0;
      marsEvaAudio.playFlashlightClick();
      return next;
    });
  };

  // Continuous hold-to-move directional controller
  const startContinuousMove = (direction: 'forward' | 'back' | 'left' | 'right' | 'up' | 'down' | 'turnLeft' | 'turnRight' | 'lookUp' | 'lookDown') => {
    stopContinuousMove();

    const applyMove = () => {
      if (direction === 'forward') {
        keysDown.current['w'] = true;
      } else if (direction === 'back') {
        keysDown.current['s'] = true;
      } else if (direction === 'left') {
        keysDown.current['a'] = true;
      } else if (direction === 'right') {
        keysDown.current['d'] = true;
      } else if (direction === 'up') {
        astronautAltitude.current = Math.min(35, astronautAltitude.current + 1.2);
        marsEvaAudio.playThrusterBurst();
      } else if (direction === 'down') {
        astronautAltitude.current = Math.max(1.75, astronautAltitude.current - 1.2);
      } else if (direction === 'turnLeft') {
        cameraEuler.current.y += 0.08;
        if (cameraRef.current) cameraRef.current.quaternion.setFromEuler(cameraEuler.current);
        const degY = ((-cameraEuler.current.y * 180) / Math.PI) % 360;
        setHeadingDeg(Math.round(degY < 0 ? degY + 360 : degY));
      } else if (direction === 'turnRight') {
        cameraEuler.current.y -= 0.08;
        if (cameraRef.current) cameraRef.current.quaternion.setFromEuler(cameraEuler.current);
        const degY = ((-cameraEuler.current.y * 180) / Math.PI) % 360;
        setHeadingDeg(Math.round(degY < 0 ? degY + 360 : degY));
      } else if (direction === 'lookUp') {
        cameraEuler.current.x = Math.max(-1.25, cameraEuler.current.x - 0.06);
        if (cameraRef.current) cameraRef.current.quaternion.setFromEuler(cameraEuler.current);
        setPitchDeg(Math.round((-cameraEuler.current.x * 180) / Math.PI));
      } else if (direction === 'lookDown') {
        cameraEuler.current.x = Math.min(1.35, cameraEuler.current.x + 0.06);
        if (cameraRef.current) cameraRef.current.quaternion.setFromEuler(cameraEuler.current);
        setPitchDeg(Math.round((-cameraEuler.current.x * 180) / Math.PI));
      }
    };

    applyMove();
    activeMoveInterval.current = setInterval(applyMove, 100);
  };

  const stopContinuousMove = () => {
    if (activeMoveInterval.current) {
      clearInterval(activeMoveInterval.current);
      activeMoveInterval.current = null;
    }
    keysDown.current['w'] = false;
    keysDown.current['s'] = false;
    keysDown.current['a'] = false;
    keysDown.current['d'] = false;
  };

  // Reset Camera Horizon
  const resetCameraHorizon = () => {
    cameraEuler.current.x = 0;
    if (cameraRef.current) cameraRef.current.quaternion.setFromEuler(cameraEuler.current);
    setPitchDeg(0);
    speakEvaComms('Horizon attitude leveled.');
  };

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden font-sans">
      {/* Real Mars GIS is the default EVA surface. The 3D simulation remains
          available as an explicit presentation mode, never as a fake map. */}
      {evaDisplayMode === 'real-map' && (
        <MarsEVAReconMap
          lat={currentLat}
          lng={currentLng}
          mapLayer={tacticalMapLayer}
          zoom={5}
          className="absolute inset-0 z-0"
        />
      )}

      {/* Optional 3D surface simulation */}
      <div
        ref={mountRef}
        className={`absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing transition-opacity duration-300 ${
          evaDisplayMode === 'surface-sim' ? 'z-0 opacity-100' : 'z-0 opacity-0 pointer-events-none'
        }`}
      />

      {/* Visor optics: subtle vignette and horizon guide unify the 3D scene with
          the mission HUD without obscuring the terrain. */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(7,10,18,.28) 0%, transparent 26%, transparent 72%, rgba(7,8,13,.48) 100%), radial-gradient(ellipse at center, transparent 48%, rgba(7,8,13,.38) 100%)',
        }}
      />
      {evaDisplayMode === 'surface-sim' && (
        <div className="absolute left-6 right-6 top-[18%] z-[2] pointer-events-none border-t border-amber-200/15" />
      )}

      {/* First-person helmet immersion layer. This is attached to the camera
          viewport, not a third-person astronaut body. */}
      <div className="absolute inset-0 z-[4] pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Curved visor glass and pressure-ring edge. */}
        <div className="absolute inset-0 rounded-[clamp(1.2rem,3vw,3rem)] border-[clamp(8px,1.45vw,24px)] border-[#171313]/72 shadow-[inset_0_0_24px_rgba(255,180,120,.24),inset_0_0_90px_rgba(0,0,0,.58)]" />
        <div className="absolute inset-[clamp(10px,2vw,30px)] rounded-[clamp(1rem,2.5vw,2.5rem)] border border-orange-200/16 shadow-[inset_0_0_16px_rgba(255,220,180,.14)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_48%,rgba(4,7,12,.2)_72%,rgba(2,3,6,.7)_100%)]" style={{ backdropFilter: 'blur(.25px) saturate(1.08)' }} />
        {/* Sun reflection, glass scratches, and slow dust on the visor. */}
        <div className="absolute inset-0 opacity-45 mix-blend-screen bg-[linear-gradient(116deg,transparent_28%,rgba(255,224,190,.16)_38%,transparent_46%),linear-gradient(72deg,transparent_54%,rgba(109,220,255,.1)_63%,transparent_70%)]" />
        {evaDisplayMode === 'surface-sim' && (
          <div className="mars-visor-scratches absolute inset-[6%] rounded-[3rem] opacity-10" />
        )}
        <div className="mars-visor-dust absolute inset-0 opacity-[0.08]" />
        {/* Only small peripheral suit/shoulder hints remain in the lower frame. */}
        <div className="absolute left-[-5%] bottom-[-13%] w-[22vw] min-w-[120px] max-w-[260px] h-[19vh] rounded-[65%_35%_20%_0] rotate-[12deg] bg-gradient-to-br from-slate-200/12 via-slate-800/22 to-slate-950/58 border border-slate-200/10 shadow-[10px_-10px_26px_rgba(0,0,0,.3)]" />
        <div className="absolute right-[-5%] bottom-[-13%] w-[22vw] min-w-[120px] max-w-[260px] h-[19vh] rounded-[35%_65%_0_20%] rotate-[-12deg] bg-gradient-to-bl from-slate-200/12 via-slate-800/22 to-slate-950/58 border border-slate-200/10 shadow-[-10px_-10px_26px_rgba(0,0,0,.3)]" />
        <div className="absolute bottom-[-16%] left-1/2 -translate-x-1/2 w-[min(30vw,380px)] h-[14vh] rounded-[48%_48%_0_0] bg-gradient-to-b from-slate-200/07 via-slate-800/24 to-slate-950/62 border border-cyan-100/08" />
      </div>

      {/* Snapshot Flash Overlay */}
      {photoFlash && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 animate-out fade-out" />
      )}

      {/* Audio Comms Speech Radio Feedback Badge */}
      {voiceCommandFeedback && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-[#070b14]/95 border border-cyan-400 text-cyan-200 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-3 max-w-[90vw]">
          <div className="relative flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div className="absolute w-7 h-7 rounded-full bg-cyan-400/30 animate-ping" />
          </div>
          <div className="text-xs font-mono font-medium truncate">
            <span className="text-cyan-400 font-bold mr-1">CAPCOM:</span>
            {voiceCommandFeedback}
          </div>
        </div>
      )}

      {/* SPACESUIT VISOR HUD OVERLAY */}
      {showHUD && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-2.5 sm:p-4">
          {/* Visor Curved Glass Glare & Tint */}
          <div
            className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
              visorFilter === 'crism'
                ? 'bg-cyan-950/20 ring-[40px] ring-cyan-900/10'
                : visorFilter === 'thermal'
                ? 'bg-purple-950/20 ring-[40px] ring-orange-950/20'
                : visorFilter === 'night'
                ? 'bg-emerald-950/15 ring-[40px] ring-black/60'
                : visorFilter === 'uv'
                ? 'bg-fuchsia-950/15 ring-[40px] ring-fuchsia-950/20'
                : 'bg-transparent ring-[40px] ring-orange-950/10'
            }`}
          />

          {/* TOP HUD BAR */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 shrink-0 pointer-events-auto">
            {/* Top Left: Helmet Telemetry & ECG */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 bg-[#070b14]/90 backdrop-blur-xl border border-neutral-700/80 rounded-2xl px-2.5 sm:px-3.5 py-1.5 shadow-2xl text-neutral-200">
              <div className="flex items-center gap-1 text-xs font-mono">
                <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span className="font-bold text-white">{heartRate}</span>
                <span className="text-[10px] text-neutral-400">BPM</span>
              </div>
              <canvas ref={ecgCanvasRef} width={65} height={18} className="hidden sm:block opacity-90" />
              <div className="h-3.5 w-[1px] bg-neutral-700 mx-0.5" />
              <div className="flex items-center gap-1 text-xs font-mono">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-white">{oxygenLevel.toFixed(1)}%</span>
                <span className="text-[10px] text-neutral-400">O2</span>
              </div>
              <div className="h-3.5 w-[1px] bg-neutral-700 mx-0.5 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-1 text-xs font-mono">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-white">{suitPressureKPa}</span>
                <span className="text-[10px] text-neutral-400">kPa</span>
              </div>
              <div className="h-3.5 w-[1px] bg-neutral-700 mx-0.5 hidden md:block" />
              <div className="hidden md:flex items-center gap-1 text-xs font-mono">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold text-white">{altitudeM}m</span>
                <span className="text-[10px] text-neutral-400">Alt</span>
              </div>
            </div>

            {/* Top Center: Site Name & Heading Compass */}
            <div className="hidden md:flex flex-col items-center bg-[#070b14]/90 backdrop-blur-xl border border-neutral-700/80 rounded-2xl px-4 py-1.5 shadow-2xl text-neutral-200">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-mono font-bold text-white">
                  {headingDeg}° {headingDeg > 315 || headingDeg <= 45 ? 'N' : headingDeg <= 135 ? 'E' : headingDeg <= 225 ? 'S' : 'W'} • Pitch {pitchDeg}°
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-950/80 text-orange-300 border border-orange-800 font-mono">
                  EVA {formatTimer(evaDurationSec)}
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5 font-medium truncate max-w-[280px]">
                {selectedSitePreset.name.split('—')[0]}
              </div>
            </div>

            {/* Top Right: Voice Command, Flashlight, Audio & Close Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Voice Command Toggle Button with Wave Pulse */}
              <button
                type="button"
                onClick={toggleVoiceControl}
                className={`px-2 sm:px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-lg ${
                  isVoiceListening
                    ? 'bg-cyan-600 text-white border-cyan-400 ring-2 ring-cyan-400/50 animate-pulse'
                    : 'bg-[#070b14]/90 text-cyan-300 hover:text-white border-cyan-800/60'
                }`}
                title="Toggle Voice Recognition (English & Bengali)"
              >
                {isVoiceListening ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-cyan-400" />}
                <span className="hidden sm:inline">{isVoiceListening ? 'VOICE ON' : 'VOICE'}</span>
              </button>

              {/* Voice Help / Command Palette Modal Toggle */}
              <button
                type="button"
                onClick={() => setIsVoiceCheatSheetOpen((prev) => !prev)}
                className="p-1.5 sm:p-2 rounded-xl bg-[#070b14]/90 hover:bg-neutral-800 border border-neutral-700 text-cyan-300 hover:text-white transition cursor-pointer shadow-md"
                title="Voice Commands Guide (English & Bengali)"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Headlamp Spotlight Toggle */}
              <button
                type="button"
                onClick={toggleFlashlight}
                className={`p-1.5 sm:p-2 rounded-xl border text-xs transition-all cursor-pointer shadow-md ${
                  isFlashlightOn
                    ? 'bg-amber-500 text-black border-amber-300 font-bold shadow-amber-500/30'
                    : 'bg-[#070b14]/90 text-neutral-300 hover:text-white border-neutral-700'
                }`}
                title="Toggle Helmet Spotlights (L key)"
              >
                <Lightbulb className="w-4 h-4" />
              </button>

              {/* Tactical Real Map Modal Button */}
              <button
                type="button"
                onClick={() => setIsTacticalMapOpen((prev) => !prev)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer ${
                  isTacticalMapOpen
                    ? 'bg-orange-500 text-white border-orange-300'
                    : 'bg-orange-600/90 hover:bg-orange-500 text-white border-orange-400'
                }`}
                title="Open Real Mars Tactical Map (M key)"
              >
                <MapIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Tactical Map</span>
              </button>

              {/* Audio Mute Button */}
              <button
                type="button"
                onClick={() => {
                  const m = marsEvaAudio.toggleMute();
                  setIsAudioMuted(m);
                }}
                className="p-1.5 sm:p-2 rounded-xl bg-[#070b14]/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer shadow-md"
                title={isAudioMuted ? 'Unmute EVA Audio' : 'Mute EVA Audio'}
              >
                {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              </button>

              {/* Exit to 3D Globe / Map */}
              <button
                type="button"
                onClick={onExit}
                className="p-1.5 sm:p-2 rounded-xl bg-neutral-900/90 hover:bg-rose-950 border border-neutral-700 hover:border-rose-600 text-neutral-300 hover:text-rose-200 transition cursor-pointer shadow-md"
                title="Exit Astronaut EVA Mode"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Forward surface/route guidance: tells the astronaut whether to
              continue, slow down, or change route before moving. */}
          <div
            className={`absolute top-20 right-3 sm:right-4 z-20 w-[min(310px,calc(100vw-1.5rem))] pointer-events-auto rounded-2xl border backdrop-blur-xl shadow-2xl p-3 ${
              forwardGuidance.status === 'reroute'
                ? 'bg-rose-950/90 border-rose-400/70'
                : forwardGuidance.status === 'caution'
                  ? 'bg-amber-950/90 border-amber-400/70'
                  : 'bg-emerald-950/85 border-emerald-400/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {forwardGuidance.status === 'clear' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                ) : (
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${forwardGuidance.status === 'reroute' ? 'text-rose-300' : 'text-amber-300'}`} />
                )}
                <span className="text-xs font-bold text-white truncate">{forwardGuidance.title}</span>
              </div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-white/60">Forward scan</span>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-white/75">{forwardGuidance.detail}</p>
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-black/25 px-2 py-1.5 text-[10px] font-semibold text-white">
              <Navigation className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span>{forwardGuidance.direction}</span>
              {forwardGuidance.distanceKm !== undefined && (
                <span className="ml-auto font-mono text-cyan-200">{forwardGuidance.distanceKm.toFixed(1)} km</span>
              )}
            </div>
          </div>

          {/* Movement telemetry stays above the lower suit/visor area so the
              astronaut always sees direction and elapsed movement time. */}
          <div className="absolute left-3 sm:left-4 bottom-28 sm:bottom-24 z-20 pointer-events-none rounded-2xl border border-cyan-300/25 bg-[#07121d]/85 backdrop-blur-xl px-3 py-2 shadow-2xl min-w-[170px]">
            <div className="flex items-center justify-between gap-3 text-[9px] font-mono uppercase tracking-wider text-cyan-200/70">
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${isMoving ? 'bg-emerald-300 animate-pulse' : 'bg-slate-500'}`} />
                EVA movement
              </span>
              <span className="text-amber-300">{movementSeconds.toString().padStart(2, '0')}s</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs font-bold text-white">
              <Navigation className={`w-3.5 h-3.5 ${isMoving ? 'text-emerald-300' : 'text-cyan-300'}`} />
              <span>{movementDirection}</span>
              <span className="ml-auto font-mono text-cyan-200">{odometerM.toFixed(1)} m</span>
            </div>
            <div className="mt-1 text-[9px] text-neutral-400">
              {isMoving ? 'Surface tracking active' : 'Press W/A/S/D or use the 6-DOF pad'}
            </div>
          </div>

          {/* CENTER RETICLE & SPECTROMETER TARGET SCANNER */}
          <div className="absolute top-[53%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
            {/* Crosshair Reticle */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <Crosshair className={`w-8 h-8 transition-colors ${activeScanTarget ? 'text-cyan-400 animate-pulse' : 'text-white/40'}`} />
              <div className="absolute w-2 h-2 rounded-full bg-cyan-400/50" />
            </div>

            {/* Active Rock Target Readout */}
            {activeScanTarget && evaDisplayMode === 'surface-sim' && (
              <div className="mt-3 bg-[#070b14]/95 backdrop-blur-xl border border-cyan-500/80 rounded-2xl p-3 shadow-2xl text-left max-w-xs sm:max-w-sm pointer-events-auto animate-in zoom-in-95">
                <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{activeScanTarget.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                    {activeScanTarget.distanceM}m
                  </span>
                </div>
                <div className="text-[11px] text-neutral-300 leading-relaxed mb-2 font-mono">
                  {activeScanTarget.composition}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePerformScan}
                    disabled={isScanning}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isScanning ? 'Firing Laser...' : 'Laser LIBS Scan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCollectSample}
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                    title="Seal rock sample into titanium container"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Sample</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* FLOATING TACTICAL REAL MAP HUD DOCK (LEFT SIDE - "real map dekhabe") */}
          <div className="absolute left-2.5 sm:left-4 top-20 z-20 pointer-events-auto flex flex-col gap-2 max-w-[260px]">
            <div className="bg-[#070b14]/90 backdrop-blur-xl border border-neutral-700/80 rounded-2xl p-2.5 shadow-2xl hover:border-cyan-400 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-1.5">
                <span className="flex items-center gap-1 font-bold">
                  <Locate className="w-3.5 h-3.5 text-cyan-400" />
                  <span>REAL MARS RECON</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsTacticalMapExpanded((prev) => !prev)}
                    className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[9px] transition"
                    title={isTacticalMapExpanded ? 'Minimize Map' : 'Expand Map HUD'}
                  >
                    {isTacticalMapExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTacticalMapOpen(true)}
                    className="px-1.5 py-0.5 rounded bg-orange-600/80 hover:bg-orange-500 text-white text-[9px] font-bold transition"
                  >
                    FULL [M]
                  </button>
                </div>
              </div>

              {/* Mini-Map Canvas & Satellite Viewport */}
              <div
                className={`relative rounded-xl overflow-hidden border border-cyan-900/60 bg-black transition-all duration-300 ${
                  isTacticalMapExpanded ? 'w-[240px] h-[180px]' : 'w-[190px] h-[120px]'
                }`}
              >
                {/* Live Leaflet Mars basemap with the astronaut position */}
                <MarsEVAReconMap
                  lat={currentLat}
                  lng={currentLng}
                  mapLayer={tacticalMapLayer}
                  zoom={tacticalMapZoom}
                />

                {/* Live Radar Canvas with Sweeping Beam & Heading Cone */}
                <canvas
                  ref={radarCanvasRef}
                  width={isTacticalMapExpanded ? 240 : 190}
                  height={isTacticalMapExpanded ? 180 : 120}
                  className="absolute inset-0 pointer-events-none"
                />

                {/* GPS Reticle Overlay */}
                <div className="absolute bottom-1 right-1 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-mono text-cyan-300 border border-cyan-500/40">
                  {headingDeg}° FOV
                </div>
              </div>

              {/* Coordinates & Odometer Footer */}
              <div className="mt-1.5 flex items-center justify-between text-[9.5px] font-mono text-neutral-300">
                <span className="text-cyan-300 font-bold">{currentLat.toFixed(2)}°N, {currentLng.toFixed(2)}°E</span>
                <span className="text-amber-400">{odometerM.toFixed(1)}m EVA</span>
              </div>
            </div>
          </div>

          {/* BOTTOM CONTROLS & OMNIDIRECTIONAL 6-DOF NAVIGATION CLUSTER ("samne dane bame pichone upore niche") */}
          <div className="flex items-end justify-between gap-2 sm:gap-4 shrink-0 pointer-events-auto">
            {/* Bottom Left: Quick Jump Site Selector & Mission Intel */}
            <div className="hidden sm:flex flex-col gap-1.5 bg-[#070b14]/85 backdrop-blur-md border border-neutral-800 rounded-2xl p-2 text-xs">
              <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-400" />
                <span>ACTIVE LANDING ZONE</span>
              </div>
              <div className="text-[11px] font-bold text-white truncate max-w-[200px]">
                {selectedSitePreset.name.split('—')[0]}
              </div>
              <div className="text-[10px] text-neutral-400">
                Elev: <span className="font-mono text-amber-300">{selectedSitePreset.elevationM}m</span> • O2: <span className="font-mono text-cyan-300">{oxygenLevel.toFixed(1)}%</span>
              </div>
            </div>

            {/* Bottom Center: Visor Filter Selector & EVA Science Belt */}
            <div className="flex flex-col items-center gap-2 max-w-full">
              {/* Visor Spectral Mode Filter Buttons */}
              <div className="flex items-center gap-1 bg-[#070b14]/90 backdrop-blur-xl border border-neutral-700/80 rounded-2xl p-1 shadow-2xl overflow-x-auto max-w-[94vw]">
                <button
                  type="button"
                  onClick={() => setVisorFilter('optical')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                    visorFilter === 'optical' ? 'bg-orange-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="True Color Optical Visor"
                >
                  Optical
                </button>
                <button
                  type="button"
                  onClick={() => setVisorFilter('crism')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                    visorFilter === 'crism' ? 'bg-cyan-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="CRISM Mineralogy False-Color"
                >
                  CRISM
                </button>
                <button
                  type="button"
                  onClick={() => setVisorFilter('thermal')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                    visorFilter === 'thermal' ? 'bg-amber-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="FLIR Thermal Infrared Heat Map"
                >
                  Thermal
                </button>
                <button
                  type="button"
                  onClick={() => setVisorFilter('night')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                    visorFilter === 'night' ? 'bg-emerald-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Phosphor Night Vision Amplification"
                >
                  Night
                </button>
                <button
                  type="button"
                  onClick={() => setVisorFilter('uv')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                    visorFilter === 'uv' ? 'bg-fuchsia-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="UV Fluorescence Mineral Sensor"
                >
                  UV
                </button>
              </div>

              {/* EVA Science Toolbar */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={triggerPhotoCapture}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  title="Capture In-Situ EVA Photo"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSampleCaddyOpen(true)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  title="Open Geological Sample Caddy"
                >
                  <Package className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Samples ({collectedSamples.length})</span>
                </button>
                {capturedPhotos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsPhotoGalleryOpen(true)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                    title="View Captured EVA Photo Gallery"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gallery ({capturedPhotos.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSiteMenuOpen(true)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  title="Change Martian Exploration Site"
                >
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  <span>Teleport</span>
                </button>
              </div>
            </div>

            {/* Bottom Right: OMNIDIRECTIONAL 6-DOF NAVIGATION CONTROLLER ("samne, dane, bame, pichone, upore, niche") */}
            <div className="flex flex-col gap-1.5 bg-[#070b14]/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-2 shadow-2xl text-neutral-200">
              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 pb-1 border-b border-neutral-800/80">
                <span className="font-bold">EVA MOTION CONTROL</span>
                <button
                  type="button"
                  onClick={() => setIsSprintActive((prev) => !prev)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono transition ${
                    isSprintActive ? 'bg-amber-500 text-black shadow-md' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                  title="Toggle Turbo Thruster Sprint"
                >
                  {isSprintActive ? 'BOOST ON' : 'BOOST'}
                </button>
              </div>

              <div className="text-[9px] font-mono text-neutral-500 text-center">W/S FWD/REV • A/D STRAFE • Z/X TURN</div>

              {/* 3D Directional Move Cluster (Forward, Back, Strafe Left/Right, Pitch, Turn) */}
              <div className="flex items-center gap-2">
                {/* 2D Horizontal Compass D-Pad */}
                <div className="flex flex-col items-center gap-1">
                  {/* Forward (W) */}
                  <button
                    type="button"
                    onMouseDown={() => startContinuousMove('forward')}
                    onMouseUp={stopContinuousMove}
                    onMouseLeave={stopContinuousMove}
                    onTouchStart={() => startContinuousMove('forward')}
                    onTouchEnd={stopContinuousMove}
                    onTouchCancel={stopContinuousMove}
                    className="w-9 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-cyan-400 active:scale-90 transition cursor-pointer"
                    title="Forward (W)"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Strafe Left (A) */}
                    <button
                      type="button"
                      onMouseDown={() => startContinuousMove('left')}
                      onMouseUp={stopContinuousMove}
                      onMouseLeave={stopContinuousMove}
                      onTouchStart={() => startContinuousMove('left')}
                      onTouchEnd={stopContinuousMove}
                      onTouchCancel={stopContinuousMove}
                      className="w-9 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-cyan-400 active:scale-90 transition cursor-pointer"
                      title="Strafe Left (A)"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    {/* Center Reset Horizon */}
                    <button
                      type="button"
                      onClick={resetCameraHorizon}
                      className="w-9 h-8 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-cyan-800/60 flex items-center justify-center text-cyan-300 text-[9px] font-bold active:scale-90 transition cursor-pointer"
                      title="Reset Level Horizon"
                    >
                      LEV
                    </button>

                    {/* Strafe Right (D) */}
                    <button
                      type="button"
                      onMouseDown={() => startContinuousMove('right')}
                      onMouseUp={stopContinuousMove}
                      onMouseLeave={stopContinuousMove}
                      onTouchStart={() => startContinuousMove('right')}
                      onTouchEnd={stopContinuousMove}
                      onTouchCancel={stopContinuousMove}
                      className="w-9 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-cyan-400 active:scale-90 transition cursor-pointer"
                      title="Strafe Right (D)"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Backward (S) */}
                  <button
                    type="button"
                    onMouseDown={() => startContinuousMove('back')}
                    onMouseUp={stopContinuousMove}
                    onMouseLeave={stopContinuousMove}
                    onTouchStart={() => startContinuousMove('back')}
                    onTouchEnd={stopContinuousMove}
                    onTouchCancel={stopContinuousMove}
                    className="w-9 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 flex items-center justify-center text-cyan-400 active:scale-90 transition cursor-pointer"
                    title="Backward (S)"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Vertical Altitude & Thruster Flight */}
                <div className="flex flex-col items-center gap-1 border-l border-neutral-800 pl-2">
                  {/* Ascend / Jetpack UP (Space) */}
                  <button
                    type="button"
                    onMouseDown={() => startContinuousMove('up')}
                    onMouseUp={stopContinuousMove}
                    onMouseLeave={stopContinuousMove}
                    onTouchStart={() => startContinuousMove('up')}
                    onTouchEnd={stopContinuousMove}
                    onTouchCancel={stopContinuousMove}
                    className="w-14 h-8 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer shadow-md"
                    title="MMU Thruster Ascend (Space / E)"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>ALT +</span>
                  </button>

                  {/* Descend / Land DOWN (C) */}
                  <button
                    type="button"
                    onMouseDown={() => startContinuousMove('down')}
                    onMouseUp={stopContinuousMove}
                    onMouseLeave={stopContinuousMove}
                    onTouchStart={() => startContinuousMove('down')}
                    onTouchEnd={stopContinuousMove}
                    onTouchCancel={stopContinuousMove}
                    className="w-14 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
                    title="Descend / Land (C / Q)"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-neutral-400" />
                    <span>ALT -</span>
                  </button>

                  {/* Turn 360° Left & Right */}
                  <div className="flex items-center gap-1 w-14">
                    <button
                      type="button"
                      onMouseDown={() => startContinuousMove('turnLeft')}
                      onMouseUp={stopContinuousMove}
                      onMouseLeave={stopContinuousMove}
                      onTouchStart={() => startContinuousMove('turnLeft')}
                      onTouchEnd={stopContinuousMove}
                      onTouchCancel={stopContinuousMove}
                      className="flex-1 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-[10px] font-mono text-cyan-300 border border-neutral-800 active:scale-90"
                      title="Turn Left (Z)"
                    >
                      ↺
                    </button>
                    <button
                      type="button"
                      onMouseDown={() => startContinuousMove('turnRight')}
                      onMouseUp={stopContinuousMove}
                      onMouseLeave={stopContinuousMove}
                      onTouchStart={() => startContinuousMove('turnRight')}
                      onTouchEnd={stopContinuousMove}
                      onTouchCancel={stopContinuousMove}
                      className="flex-1 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-[10px] font-mono text-cyan-300 border border-neutral-800 active:scale-90"
                      title="Turn Right (X)"
                    >
                      ↻
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL TACTICAL SATELLITE RECON MAP MODAL ("real map dekhabe") */}
      {isTacticalMapOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xl flex flex-col px-3 pb-3 sm:px-6 sm:pb-6 pt-[4.75rem] min-h-0 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl mx-auto flex-1 min-h-0 flex flex-col bg-[#090d16] border border-cyan-500/70 rounded-3xl overflow-hidden shadow-2xl text-neutral-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 bg-[#0c1220] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400">
                  <MapIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                    <span>Tactical Real Mars Orbital Satellite Recon</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
                      NASA / USGS MDIM 2.1
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Live GPS tracking • Elevation data • Rover landing markers • 1-Click Teleport
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Switch to Full 2D GIS Map */}
                <button
                  type="button"
                  onClick={() => {
                    setIsTacticalMapOpen(false);
                    onSwitchTo2D();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  title="Switch to Full Global 2D Flat Map"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Global 2D Map</span>
                </button>

                {/* Switch to 3D Globe */}
                <button
                  type="button"
                  onClick={() => {
                    setIsTacticalMapOpen(false);
                    onSwitchTo3D();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  title="Switch to 3D Orbital Globe"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">3D Globe</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTacticalMapOpen(false)}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tactical Map Recon Surface Viewer */}
            <div className="flex-1 min-h-0 relative bg-black flex flex-col md:flex-row overflow-hidden">
              {/* Main Satellite View */}
              <div className="flex-1 relative overflow-hidden flex flex-col p-3 sm:p-4 bg-[#080d1a]">
                {/* Map Layer Toolbar & Zoom Controls */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 bg-[#0c1220] border border-neutral-800 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setTacticalMapLayer('visible')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        tacticalMapLayer === 'visible' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      True Color
                    </button>
                    <button
                      type="button"
                      onClick={() => setTacticalMapLayer('infrared')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        tacticalMapLayer === 'infrared' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      THEMIS IR
                    </button>
                    <button
                      type="button"
                      onClick={() => setTacticalMapLayer('elevation')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        tacticalMapLayer === 'elevation' ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      MOLA Elevation
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTacticalMapZoom((z) => Math.min(3.5, z + 0.3))}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTacticalMapZoom((z) => Math.max(0.8, z - 0.3))}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Satellite Imagery Container */}
                <div className="relative flex-1 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl bg-black flex items-center justify-center">
                  <div
                    className="w-full h-full relative transition-transform duration-300 flex items-center justify-center"
                    style={{ transform: `scale(${tacticalMapZoom})` }}
                  >
                    <MarsEVAReconMap
                      lat={currentLat}
                      lng={currentLng}
                      mapLayer={tacticalMapLayer}
                      zoom={tacticalMapZoom}
                    />

                    {/* Tactical Crosshair at current astronaut location */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                      <Crosshair className="w-12 h-12 text-cyan-400 animate-pulse" />
                      <div className="text-[10px] font-mono font-bold text-cyan-300 bg-black/85 px-2 py-0.5 rounded border border-cyan-500/50 mt-1 whitespace-nowrap shadow-xl">
                        EVA ASTRONAUT 1 • {currentLat.toFixed(2)}°N, {currentLng.toFixed(2)}°E ({altitudeM}m)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tactical Legend and Telemetry Bar */}
                <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="font-mono text-cyan-300">Target: {selectedSitePreset.name.split('—')[0]}</span>
                  </div>
                  <span className="font-mono text-neutral-500">Scale: 1:{Math.round(25000 / tacticalMapZoom)} • Datum MOLA</span>
                </div>
              </div>

              {/* Side Tactical Intelligence & Teleport Quick-List */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-neutral-800 bg-[#0b101c] p-4 overflow-y-auto space-y-3">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">
                  Martian Surface Exploration Zones
                </span>
                <div className="space-y-2">
                  {ASTRONAUT_SITE_PRESETS.map((site) => (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => {
                        setSelectedSitePreset(site);
                        speakEvaComms(`Teleported to ${site.name.split('—')[0]}.`);
                        setIsTacticalMapOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                        selectedSitePreset.id === site.id
                          ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-md'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{site.name.split('—')[0]}</span>
                        <span className="text-[10px] font-mono text-cyan-400">{site.elevationM}m</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">{site.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAMPLE CADDY DRAWER */}
      {isSampleCaddyOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 pt-[4.75rem] sm:pt-[4.75rem] animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0c1220] border border-emerald-500/60 rounded-3xl p-5 shadow-2xl text-neutral-200 max-h-[calc(100dvh-6rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Geological Sample Caddy (Cached for Return)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSampleCaddyOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-3 max-h-64 overflow-y-auto space-y-2">
              {collectedSamples.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-6">
                  No samples sealed yet. Aim crosshairs at a rock and press &quot;Sample&quot; or say &quot;collect sample&quot;.
                </p>
              ) : (
                collectedSamples.map((s) => (
                  <div key={s.id} className="p-3 rounded-2xl bg-black/40 border border-neutral-800 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{s.targetName}</span>
                      <span className="text-emerald-400 font-mono">{s.massGrams}g</span>
                    </div>
                    <div className="text-[11px] text-neutral-400">{s.sampleType} • {s.solTime}</div>
                    <div className="text-[10px] text-neutral-500 font-mono truncate">{s.pdsCitation}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SITE TELEPORT MENU */}
      {isSiteMenuOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 pt-[4.75rem] sm:pt-[4.75rem] animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-[#0c1220] border border-orange-500/60 rounded-3xl p-5 shadow-2xl text-neutral-200 max-h-[calc(100dvh-6rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Select Exploration Landing Site</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSiteMenuOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-3 max-h-72 overflow-y-auto space-y-2">
              {ASTRONAUT_SITE_PRESETS.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => {
                    setSelectedSitePreset(site);
                    speakEvaComms(`Beamed to ${site.name.split('—')[0]}.`);
                    setIsSiteMenuOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedSitePreset.id === site.id
                      ? 'bg-orange-600/20 border-orange-400 text-white'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{site.name}</span>
                    <span className="text-[10px] font-mono text-orange-400">{site.elevationM}m</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">{site.tag}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EVA PHOTO GALLERY MODAL */}
      {isPhotoGalleryOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-start sm:items-center justify-center p-3 pt-[4.75rem] sm:pt-[4.75rem] animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#0c1220] border border-cyan-500/60 rounded-3xl p-5 shadow-2xl text-neutral-200 flex flex-col max-h-[calc(100dvh-6rem)] sm:max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">In-Situ EVA Photographic Archive</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoGalleryOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {capturedPhotos.map((photo) => (
                <div key={photo.id} className="bg-black/60 rounded-2xl overflow-hidden border border-neutral-800 flex flex-col">
                  <div className="relative aspect-video bg-neutral-950 overflow-hidden">
                    <img src={photo.dataUrl} alt={photo.siteName} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                      {photo.coordinates}
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{photo.siteName}</div>
                      <div className="text-[11px] text-neutral-400">{photo.timestamp}</div>
                    </div>
                    <a
                      href={photo.dataUrl}
                      download={`mars-eva-${photo.id}.jpg`}
                      className="p-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-white transition"
                      title="Download Full Resolution JPEG"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VOICE CONTROL HELP & 1-CLICK COMMAND PALETTE MODAL */}
      {isVoiceCheatSheetOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-start sm:items-center justify-center p-3 pt-[4.75rem] sm:pt-[4.75rem] animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl bg-[#0c1220] border border-cyan-500/70 rounded-3xl p-5 shadow-2xl text-neutral-200 flex flex-col max-h-[calc(100dvh-6rem)] sm:max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">EVA Voice Command System</h3>
                  <p className="text-xs text-neutral-400">NASA EVA speech command interface</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVoiceCheatSheetOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto space-y-4 text-xs">

              {/* English Commands Section */}
              <div className="bg-black/40 rounded-2xl p-3 border border-neutral-800">
                <div className="text-xs font-bold text-orange-300 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  <span>English Voice Commands</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { cmd: 'Forward', desc: 'Walk forward' },
                    { cmd: 'Back', desc: 'Walk backward' },
                    { cmd: 'Left / Right', desc: 'Turn 45°' },
                    { cmd: 'Up / Fly', desc: 'MMU Thruster climb' },
                    { cmd: 'Down / Land', desc: 'Descend to regolith' },
                    { cmd: 'Stop / Halt', desc: 'Cease motion' },
                    { cmd: 'Map', desc: 'Tactical Recon' },
                    { cmd: 'Light', desc: 'Dual Helmet LEDs' },
                    { cmd: 'Scan', desc: 'Laser Spectrometer' },
                    { cmd: 'Sample', desc: 'Seal titanium core' },
                    { cmd: 'Photo', desc: 'Take snapshot' },
                    { cmd: 'Thermal / Night', desc: 'Visor Filter' },
                  ].map((item) => (
                    <button
                      key={item.cmd}
                      type="button"
                      onClick={() => processVoiceCommand(item.cmd)}
                      className="p-2 rounded-xl bg-neutral-900/80 hover:bg-orange-950 border border-neutral-800 hover:border-orange-500 text-left transition flex flex-col justify-between"
                      title={`Click to test command: "${item.cmd}"`}
                    >
                      <div className="font-bold text-white text-xs">{item.cmd}</div>
                      <div className="text-[10px] text-neutral-400">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-neutral-400 text-center">
                Tip: Click any button above to test that voice command instantly!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
