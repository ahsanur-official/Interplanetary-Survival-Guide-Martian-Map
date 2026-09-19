import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  Globe,
  RotateCcw,
  Camera,
  Layers,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Sun,
  MapPin,
  Mountain,
  Radio,
  Droplets,
  Wind,
  ShieldAlert,
  CloudRain,
  Orbit,
  Compass,
  X,
  Eye,
  Info,
  ChevronRight,
  Maximize2,
  Crosshair,
  Sparkles,
  ArrowDown,
} from 'lucide-react';
import { ALL_MARS_FEATURES, MarsFeature } from '../../data/marsNomenclature';
import {
  createProceduralMarsTexture,
  createProceduralMolaTexture,
} from '../../engine/marsTextureGenerator';
import { MarsOrbitalTelemetry } from '../../engine/nasaMarsService';
import {
  analyzeMarsLocationScience,
  MarsLocationScienceData,
} from '../../engine/marsEnvironmentalAnalysis';
import { MarsScienceDossierModal } from './MarsScienceDossierModal';
import { MarsMoonDossierModal, MARS_MOONS_DATA } from './MarsMoonDossierModal';

// Official NASA & USGS Planetary Mosaics
const MARS_TEXTURE_PRESETS = [
  {
    id: 'viking',
    name: 'NASA Viking Satellite True Color',
    subtext: 'Authentic 2K Equirectangular Satellite Mosaic',
    url: '/textures/mars_viking_2k.jpg',
    type: 'natural',
  },
  {
    id: 'mola',
    name: 'NASA MOLA Topography Elevation',
    subtext: 'Laser Altimeter Color Rainbow',
    url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map&service=WMS&request=GetMap&layers=mola_color&styles=&format=image/jpeg&srs=EPSG:4326&bbox=-180,-90,180,90&width=2048&height=1024',
    type: 'topo',
  },
  {
    id: 'themis',
    name: 'NASA THEMIS Infrared Day',
    subtext: 'Thermal Surface Temperature Imagery',
    url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map&service=WMS&request=GetMap&layers=themis_ir_day&styles=&format=image/jpeg&srs=EPSG:4326&bbox=-180,-90,180,90&width=2048&height=1024',
    type: 'infrared',
  },
];

// Famous quick-fly destinations with ultra-close zoom support
const QUICK_DESTINATIONS = [
  { id: 'perseverance', name: 'Perseverance Rover', tag: 'Jezero Delta', lat: 18.38, lng: 77.58, zoom: 102.5 },
  { id: 'olympus', name: 'Olympus Mons', tag: 'Tallest Volcano', lat: 18.65, lng: -133.8, zoom: 106.0 },
  { id: 'valles', name: 'Valles Marineris', tag: 'Grand Canyon', lat: -13.9, lng: -59.2, zoom: 112.0 },
  { id: 'curiosity', name: 'Curiosity Rover', tag: 'Gale Crater', lat: -4.59, lng: 137.44, zoom: 102.5 },
  { id: 'north_pole', name: 'Planum Boreum', tag: 'North Polar Cap', lat: 85.0, lng: 0.0, zoom: 108.0 },
  { id: 'opportunity', name: 'Opportunity Rover', tag: 'Meridiani', lat: -1.95, lng: -5.53, zoom: 102.5 },
  { id: 'cydonia', name: 'Cydonia Mensae', tag: 'Face on Mars', lat: 40.74, lng: -9.46, zoom: 106.0 },
  { id: 'hellas', name: 'Hellas Planitia', tag: 'Deepest Basin', lat: -42.7, lng: 70.0, zoom: 118.0 },
];

// Physical Sun direction in deep space (ecliptic coordinate)
const SUN_POSITION_VECTOR = new THREE.Vector3(1400, 280, 900).normalize();

interface Mars3DGlobeProps {
  onSwitchToFlatMap: (site?: MarsFeature | { lat: number; lng: number; name?: string; elevationM?: number; type?: string; [key: string]: any }) => void;
  onOpenNASACloseUp: (featureName: string) => void;
  telemetry?: MarsOrbitalTelemetry | null;
  initialSelectedSite?: MarsFeature | null;
}

export const Mars3DGlobe: React.FC<Mars3DGlobeProps> = ({
  onSwitchToFlatMap,
  onOpenNASACloseUp,
  telemetry,
  initialSelectedSite,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const marsGroupRef = useRef<THREE.Group | null>(null);
  const marsMeshRef = useRef<THREE.Mesh | null>(null);
  const atmosphereMeshRef = useRef<THREE.Mesh | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const phobosMeshRef = useRef<THREE.Mesh | null>(null);
  const deimosMeshRef = useRef<THREE.Mesh | null>(null);
  const phobosOrbitLineRef = useRef<THREE.LineLoop | null>(null);
  const deimosOrbitLineRef = useRef<THREE.LineLoop | null>(null);

  // State
  const [selectedLayerId, setSelectedLayerId] = useState<string>('viking');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  
  // Planetary Rotation Speed State: 'realtime' (true 24.6h Sol by default), 'slow' (gentle cosmic drift), 'paused'
  const [rotationSpeedMode, setRotationSpeedMode] = useState<'realtime' | 'slow' | 'paused'>('realtime');
  const rotationSpeedModeRef = useRef(rotationSpeedMode);
  useEffect(() => {
    rotationSpeedModeRef.current = rotationSpeedMode;
  }, [rotationSpeedMode]);
  
  // Visual Toggles
  const [showMoons, setShowMoons] = useState(true);
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [markerFilter, setMarkerFilter] = useState<'all' | 'rovers' | 'landmarks'>('all');
  
  // Selection States
  const [selectedSite, setSelectedSite] = useState<MarsFeature | null>(initialSelectedSite || null);
  const [selectedMoon, setSelectedMoon] = useState<'phobos' | 'deimos' | null>(null);
  const [activeTextureSource, setActiveTextureSource] = useState<string>('NASA Viking 2K Satellite');
  const [isLoadingTexture, setIsLoadingTexture] = useState(false);

  // Surface Point Inspection State
  const [inspectedCoord, setInspectedCoord] = useState<{
    lat: number;
    lng: number;
    elevationM: number;
    name?: string;
    science: MarsLocationScienceData;
    isDaySide?: boolean;
    solarElevationDeg?: number;
  } | null>(null);

  // Science Dossier Modal
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);

  // Moon Dossier Modal
  const [isMoonModalOpen, setIsMoonModalOpen] = useState(false);

  // Subsolar Point Telemetry (Real-time Day/Night)
  const [subsolarPoint, setSubsolarPoint] = useState<{ lat: number; lng: number }>({ lat: 11.2, lng: -42.5 });

  // Screen-projected 2D coordinates for UI overlays
  const [projectedMarkers, setProjectedMarkers] = useState<Array<{
    site: MarsFeature;
    x: number;
    y: number;
    visible: boolean;
  }>>([]);

  // Screen-projected 2D coordinates for Moons
  const [projectedMoons, setProjectedMoons] = useState<{
    phobos: { x: number; y: number; visible: boolean; distKm: number } | null;
    deimos: { x: number; y: number; visible: boolean; distKm: number } | null;
  }>({ phobos: null, deimos: null });

  // Real-time camera distance & altitude state
  const [cameraDist, setCameraDist] = useState<number>(420);
  const [focalTelemetry, setFocalTelemetry] = useState<{
    lat: number;
    lng: number;
    altitudeKm: number;
    zoomScale: number;
    nearestFeature?: MarsFeature;
    elevationM: number;
    isDaySide: boolean;
    solarElevationDeg: number;
  }>({
    lat: 18.38,
    lng: 77.58,
    altitudeKm: 10846,
    zoomScale: 1.0,
    nearestFeature: ALL_MARS_FEATURES.find(f => f.name === 'Jezero Crater'),
    elevationM: -2500,
    isDaySide: true,
    solarElevationDeg: 35,
  });

  // Guard against rapid duplicate triggers during zoom transitions
  const isTransitioningTo2DRef = useRef(false);

  // Seamlessly transition camera view into the 2D high-resolution surface map
  const diveInto2DMapAtFocalPoint = useCallback((specificFeature?: MarsFeature | { lat: number; lng: number; name?: string; elevationM?: number; type?: string; [key: string]: any }) => {
    if (isTransitioningTo2DRef.current) return;
    isTransitioningTo2DRef.current = true;
    setTimeout(() => {
      isTransitioningTo2DRef.current = false;
    }, 1500);

    const target = specificFeature || focalTelemetry.nearestFeature || {
      id: `target-${focalTelemetry.lat.toFixed(2)}-${focalTelemetry.lng.toFixed(2)}`,
      name: focalTelemetry.nearestFeature?.name || `Surface Target (${focalTelemetry.lat >= 0 ? `${focalTelemetry.lat}°N` : `${Math.abs(focalTelemetry.lat)}°S`}, ${focalTelemetry.lng >= 0 ? `${focalTelemetry.lng}°E` : `${Math.abs(focalTelemetry.lng)}°W`})`,
      type: focalTelemetry.nearestFeature?.type || 'Planitia (Plain)',
      lat: focalTelemetry.lat,
      lng: focalTelemetry.lng,
      planetocentricLng: (focalTelemetry.lng + 360) % 360,
      elevationM: focalTelemetry.elevationM,
      description: `High-resolution surface coordinates at ${focalTelemetry.lat >= 0 ? `${focalTelemetry.lat}°N` : `${Math.abs(focalTelemetry.lat)}°S`}, ${focalTelemetry.lng >= 0 ? `${focalTelemetry.lng}°E` : `${Math.abs(focalTelemetry.lng)}°W`}`,
      originName: 'Target Coordinates',
    };

    onSwitchToFlatMap(target as any);
  }, [focalTelemetry, onSwitchToFlatMap]);

  // Camera spherical coordinates state (Controlled gentle inertia & spacious space view)
  const sphereState = useRef({
    radius: 420, // Spacious deep space view showing Mars floating among stars & moons
    theta: 0,
    phi: Math.PI / 2.3,
    targetRadius: 420,
    targetTheta: 0,
    targetPhi: Math.PI / 2.3,
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    velocityTheta: 0,
    velocityPhi: 0,
    isAnimating: false,
    animStartTime: 0,
    animDuration: 1200,
    startTheta: 0,
    startPhi: 0,
    startRadius: 420,
    // Orbital angles for moons
    phobosAngle: 0.8,
    deimosAngle: 2.4,
    // Mars axial rotation angle
    marsRotationY: 0,
    lastTelemetryTime: 0,
  });

  // Convert Latitude & Longitude to 3D Sphere Cartesian Coordinates on Mars
  const latLngToVector3 = (lat: number, lng: number, radius = 100): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  // Convert 3D Vector to Lat/Lng taking Mars rotation into account
  const vector3ToLatLng = (v: THREE.Vector3) => {
    const norm = v.clone().normalize();
    const lat = 90 - Math.acos(norm.y) * (180 / Math.PI);
    let lng = (Math.atan2(norm.z, -norm.x) * (180 / Math.PI)) - 180;
    
    // Adjust for current Mars rotation
    const rotDeg = (sphereState.current.marsRotationY * 180) / Math.PI;
    lng = (lng - rotDeg) % 360;
    if (lng < -180) lng += 360;
    if (lng > 180) lng -= 360;
    return { lat, lng };
  };

  // Helper to generate a circular ring path on the 3D sphere surface for craters & calderas
  const createSphereCirclePoints = (centerLat: number, centerLng: number, radiusDeg: number, segments = 48, r = 100.12): THREE.Vector3[] => {
    const pts: THREE.Vector3[] = [];
    const rad = (radiusDeg * Math.PI) / 180;
    const cLat = (centerLat * Math.PI) / 180;
    const cLng = (centerLng * Math.PI) / 180;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const sinD = Math.sin(rad);
      const cosD = Math.cos(rad);
      const sinLat = Math.sin(cLat) * cosD + Math.cos(cLat) * sinD * Math.cos(angle);
      const pLat = Math.asin(Math.max(-1, Math.min(1, sinLat)));
      const y = Math.sin(angle) * sinD * Math.cos(cLat);
      const x = cosD - Math.sin(cLat) * sinLat;
      const pLng = cLng + Math.atan2(y, x);

      pts.push(latLngToVector3((pLat * 180) / Math.PI, (pLng * 180) / Math.PI, r));
    }
    return pts;
  };

  // Active markers: Adaptive density based on zoom level!
  const activeMarkers = useMemo(() => {
    return ALL_MARS_FEATURES.filter((f) => {
      if (!f.lat && f.lat !== 0) return false;
      if (markerFilter === 'rovers') {
        return f.type === 'Robotic Rover/Lander';
      }
      if (markerFilter === 'landmarks') {
        return f.type !== 'Robotic Rover/Lander';
      }
      // When zoomed in close (cameraDist < 190), show ALL sites, craters, and landing sites!
      if (cameraDist < 190) {
        return true;
      }
      return f.featured || f.type === 'Robotic Rover/Lander' || f.type === 'Mons (Volcano)';
    });
  }, [markerFilter, cameraDist]);

  // Texture loader helper
  const loadTexturePreset = (presetId: string) => {
    const mars = marsMeshRef.current;
    if (!mars) return;

    setIsLoadingTexture(true);

    const preset = MARS_TEXTURE_PRESETS.find((p) => p.id === presetId) || MARS_TEXTURE_PRESETS[0];
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    textureLoader.load(
      preset.url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.generateMipmaps = true;
        if (mars.material instanceof THREE.MeshStandardMaterial) {
          mars.material.map = tex;
          mars.material.needsUpdate = true;
        }
        setActiveTextureSource(preset.name);
        setIsLoadingTexture(false);
      },
      undefined,
      (err) => {
        console.warn('Primary texture load failed, loading procedural fallback:', err);
        const fallbackUrl = presetId === 'mola'
          ? createProceduralMolaTexture(2048, 1024)
          : createProceduralMarsTexture(2048, 1024);
        
        textureLoader.load(fallbackUrl, (fbTex) => {
          if (mars.material instanceof THREE.MeshStandardMaterial) {
            mars.material.map = fbTex;
            mars.material.needsUpdate = true;
          }
        });
        setActiveTextureSource('Procedural Topo Map');
        setIsLoadingTexture(false);
      }
    );
  };

  // Fly Camera to specific Lat/Lng
  const flyToLocation = (lat: number, lng: number, targetDist = 180) => {
    const s = sphereState.current;
    s.isDragging = false;
    s.velocityTheta = 0;
    s.velocityPhi = 0;

    const targetPhi = Math.max(0.08, Math.min(Math.PI - 0.08, (90 - lat) * (Math.PI / 180)));
    // Offset by current Mars rotation
    let targetTheta = -((lng + 180) * (Math.PI / 180)) + Math.PI / 2 + s.marsRotationY;

    while (targetTheta - s.theta > Math.PI) targetTheta -= Math.PI * 2;
    while (targetTheta - s.theta < -Math.PI) targetTheta += Math.PI * 2;

    s.startTheta = s.theta;
    s.startPhi = s.phi;
    s.startRadius = s.radius;

    s.targetTheta = targetTheta;
    s.targetPhi = targetPhi;
    s.targetRadius = targetDist;

    s.animStartTime = performance.now();
    s.animDuration = 1400;
    s.isAnimating = true;
  };

  // Fly Camera to Moon (Phobos or Deimos)
  const flyToMoon = (moonId: 'phobos' | 'deimos') => {
    const s = sphereState.current;
    s.isDragging = false;
    s.velocityTheta = 0;
    s.velocityPhi = 0;

    const moonMesh = moonId === 'phobos' ? phobosMeshRef.current : deimosMeshRef.current;
    if (!moonMesh) return;

    const pos = moonMesh.position;
    const dist = pos.length();
    const phi = Math.acos(pos.y / dist);
    let theta = Math.atan2(pos.x, pos.z);

    while (theta - s.theta > Math.PI) theta -= Math.PI * 2;
    while (theta - s.theta < -Math.PI) theta += Math.PI * 2;

    s.startTheta = s.theta;
    s.startPhi = s.phi;
    s.startRadius = s.radius;

    s.targetTheta = theta;
    s.targetPhi = phi;
    s.targetRadius = moonId === 'phobos' ? 320 : 620;

    s.animStartTime = performance.now();
    s.animDuration = 1400;
    s.isAnimating = true;

    setSelectedMoon(moonId);
  };

  // Reset to deep space view
  const handleResetToSpace = () => {
    const s = sphereState.current;
    s.isDragging = false;
    s.velocityTheta = 0;
    s.velocityPhi = 0;

    s.startTheta = s.theta;
    s.startPhi = s.phi;
    s.startRadius = s.radius;

    s.targetTheta = s.theta;
    s.targetPhi = Math.PI / 2.3;
    s.targetRadius = 450;

    s.animStartTime = performance.now();
    s.animDuration = 1000;
    s.isAnimating = true;
    setSelectedSite(null);
    setInspectedCoord(null);
  };

  // Zoom handlers with progressive multi-stage close-up support and automatic 2D map dive
  const handleZoomIn = () => {
    const s = sphereState.current;

    // If already at close surface distance, zooming in enters the 2D high-res surface map
    if (s.radius <= 103.5) {
      diveInto2DMapAtFocalPoint();
      return;
    }

    let nextRadius = s.radius;
    if (s.radius > 280) nextRadius = 210;
    else if (s.radius > 170) nextRadius = 140;
    else if (s.radius > 118) nextRadius = 108;
    else if (s.radius > 103.5) nextRadius = 102.0;
    else {
      diveInto2DMapAtFocalPoint();
      return;
    }

    s.targetRadius = Math.max(101.5, nextRadius);
    s.startRadius = s.radius;
    s.startTheta = s.theta;
    s.startPhi = s.phi;
    s.targetTheta = s.theta;
    s.targetPhi = s.phi;
    s.animStartTime = performance.now();
    s.animDuration = 420;
    s.isAnimating = true;
  };

  const handleZoomOut = () => {
    const s = sphereState.current;
    let nextRadius = s.radius;
    if (s.radius < 103) nextRadius = 112;
    else if (s.radius < 125) nextRadius = 175;
    else if (s.radius < 220) nextRadius = 320;
    else nextRadius = Math.min(950, s.radius + 120);

    s.targetRadius = nextRadius;
    s.startRadius = s.radius;
    s.startTheta = s.theta;
    s.startPhi = s.phi;
    s.targetTheta = s.theta;
    s.targetPhi = s.phi;
    s.animStartTime = performance.now();
    s.animDuration = 420;
    s.isAnimating = true;
  };

  // Fly directly to a specific altitude preset
  const handleFlyToAltitude = (targetRad: number) => {
    const s = sphereState.current;
    s.isDragging = false;
    s.velocityTheta = 0;
    s.velocityPhi = 0;
    s.startRadius = s.radius;
    s.startTheta = s.theta;
    s.startPhi = s.phi;
    s.targetTheta = s.theta;
    s.targetPhi = s.phi;
    s.targetRadius = targetRad;
    s.animStartTime = performance.now();
    s.animDuration = 900;
    s.isAnimating = true;
  };

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060b);
    sceneRef.current = scene;

    // 2. Camera with large frustum and near plane 0.2 for microscopic surface close-up
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.2, 12000);
    camera.position.set(0, 50, 420);
    cameraRef.current = camera;

    // 3. Renderer with high dynamic range & antialiasing
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. Starfield (3,500+ realistic colored stars in deep space)
    const starsCount = 3600;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);
    const starColors = new Float32Array(starsCount * 3);

    const baseWhite = new THREE.Color(0xffffff);
    const starCyan = new THREE.Color(0xa5f3fc);
    const starGold = new THREE.Color(0xfef08a);
    const starMarsRed = new THREE.Color(0xfca5a5);

    for (let i = 0; i < starsCount; i++) {
      const radius = 2200 + Math.random() * 3500;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * radius;
      const sinPhi = Math.sin(phi);

      starPositions[i * 3] = r * sinPhi * Math.cos(theta);
      starPositions[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      let c = baseWhite;
      const roll = Math.random();
      if (roll < 0.16) c = starCyan;
      else if (roll < 0.28) c = starGold;
      else if (roll < 0.35) c = starMarsRed;

      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 5. Sun in Deep Space (Glowing Sun Core + Corona Flare)
    const sunDist = 3200;
    const sunPos = SUN_POSITION_VECTOR.clone().multiplyScalar(sunDist);
    const sunSphereGeo = new THREE.SphereGeometry(75, 32, 32);
    const sunSphereMat = new THREE.MeshBasicMaterial({
      color: 0xfffbeb,
    });
    const sunMesh = new THREE.Mesh(sunSphereGeo, sunSphereMat);
    sunMesh.position.copy(sunPos);
    scene.add(sunMesh);

    // Sun corona billboard glow
    const sunHaloCanvas = document.createElement('canvas');
    sunHaloCanvas.width = 256;
    sunHaloCanvas.height = 256;
    const ctx = sunHaloCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(255, 250, 220, 1.0)');
      grad.addColorStop(0.3, 'rgba(251, 191, 36, 0.6)');
      grad.addColorStop(0.65, 'rgba(249, 115, 22, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const sunHaloTex = new THREE.CanvasTexture(sunHaloCanvas);
    const sunHaloMat = new THREE.SpriteMaterial({
      map: sunHaloTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
    });
    const sunHaloSprite = new THREE.Sprite(sunHaloMat);
    sunHaloSprite.scale.set(700, 700, 1);
    sunHaloSprite.position.copy(sunPos);
    scene.add(sunHaloSprite);

    // 6. Mars Planetary Group (Tilt ~25.19° obliquity)
    const marsGroup = new THREE.Group();
    // Martian axial tilt
    marsGroup.rotation.z = (25.19 * Math.PI) / 180;
    scene.add(marsGroup);
    marsGroupRef.current = marsGroup;

    // Mars Sphere (Radius 100)
    const marsRadius = 100;
    const marsGeo = new THREE.SphereGeometry(marsRadius, 96, 96);
    const marsMat = new THREE.MeshStandardMaterial({
      color: 0xd35b2e, // Authentic Martian terracotta base
      roughness: 0.88,
      metalness: 0.04,
    });
    const marsMesh = new THREE.Mesh(marsGeo, marsMat);
    marsGroup.add(marsMesh);
    marsMeshRef.current = marsMesh;

    // Surface Features Group attached directly to marsMesh
    // (Rotates in sync with Mars's planetary rotation!)
    const surfaceFeatures = new THREE.Group();
    marsMesh.add(surfaceFeatures);

    // Cartographic Graticule Coordinate Rings
    const addLatitudeRing = (lat: number, color: number, opacity = 0.25) => {
      const pts: THREE.Vector3[] = [];
      const segments = 96;
      for (let i = 0; i <= segments; i++) {
        const lng = (i / segments) * 360 - 180;
        pts.push(latLngToVector3(lat, lng, marsRadius * 1.002));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      surfaceFeatures.add(new THREE.Line(geo, mat));
    };

    const addLongitudeMeridian = (lng: number, color: number, opacity = 0.25) => {
      const pts: THREE.Vector3[] = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const lat = (i / segments) * 170 - 85;
        pts.push(latLngToVector3(lat, lng, marsRadius * 1.002));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      surfaceFeatures.add(new THREE.Line(geo, mat));
    };

    // Equator (0°): Distinct gold line
    addLatitudeRing(0, 0xfbbf24, 0.4);
    // Tropics & Polar Circles
    addLatitudeRing(25, 0x94a3b8, 0.2);
    addLatitudeRing(-25, 0x94a3b8, 0.2);
    addLatitudeRing(65, 0x38bdf8, 0.28);
    addLatitudeRing(-65, 0x38bdf8, 0.28);

    // Meridians
    // Prime Meridian (0° Airy-0): Distinct cyan line
    addLongitudeMeridian(0, 0x38bdf8, 0.45);
    addLongitudeMeridian(90, 0x64748b, 0.18);
    addLongitudeMeridian(180, 0x64748b, 0.18);
    addLongitudeMeridian(-90, 0x64748b, 0.18);

    // Crater Rims & Volcano Caldera Rings
    const addCraterRing = (cLat: number, cLng: number, radiusDeg: number, color: number, opacity = 0.8) => {
      const pts = createSphereCirclePoints(cLat, cLng, radiusDeg, 48, marsRadius * 1.004);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
      surfaceFeatures.add(mat);
    };

    // Jezero Crater Rim (~45km diameter, 0.76° radius)
    addCraterRing(18.38, 77.58, 0.76, 0x06b6d4, 0.85);
    // Gale Crater Rim (~154km diameter, 2.6° radius)
    addCraterRing(-4.59, 137.44, 2.6, 0xf59e0b, 0.85);
    // Olympus Mons Caldera Rim (~80km caldera, 1.35° radius)
    addCraterRing(18.65, -133.8, 1.35, 0xef4444, 0.9);
    // Olympus Mons Outer Scarp Basal Ring (~600km shield, 8.2° radius)
    addCraterRing(18.65, -133.8, 8.2, 0xf97316, 0.5);
    // Gusev Crater Rim
    addCraterRing(-14.57, 175.47, 2.7, 0x10b981, 0.75);
    // Hellas Impact Basin Outer Rim
    addCraterRing(-42.7, 70.0, 22.0, 0xa855f7, 0.45);

    // Valles Marineris Grand Canyon Spine Line (~4,000 km grand rift)
    const canyonPts = [
      latLngToVector3(-5.0, -90.0, marsRadius * 1.004),
      latLngToVector3(-7.5, -82.0, marsRadius * 1.004),
      latLngToVector3(-9.2, -75.0, marsRadius * 1.004),
      latLngToVector3(-11.5, -67.0, marsRadius * 1.004),
      latLngToVector3(-13.9, -59.2, marsRadius * 1.004),
      latLngToVector3(-14.2, -50.0, marsRadius * 1.004),
      latLngToVector3(-12.8, -42.0, marsRadius * 1.004),
      latLngToVector3(-11.0, -32.0, marsRadius * 1.004),
    ];
    const canyonGeo = new THREE.BufferGeometry().setFromPoints(canyonPts);
    const canyonMat = new THREE.Line(canyonGeo, new THREE.LineBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.75 }));
    surfaceFeatures.add(canyonMat);

    // Perseverance Rover Traverse Track in Jezero Crater (Octavia Butler to Margin Carbonate)
    const jezTraversePts = [
      latLngToVector3(18.4447, 77.4509, marsRadius * 1.005), // Octavia E. Butler Landing
      latLngToVector3(18.4350, 77.4420, marsRadius * 1.005), // Séítah South
      latLngToVector3(18.4410, 77.4260, marsRadius * 1.005), // Artuby Ridge
      latLngToVector3(18.4550, 77.4110, marsRadius * 1.005), // Hawkes Bay Delta
      latLngToVector3(18.4680, 77.3950, marsRadius * 1.005), // Enchanted Lake
      latLngToVector3(18.4790, 77.3820, marsRadius * 1.005), // Tenacity Hill
      latLngToVector3(18.4870, 77.3690, marsRadius * 1.005), // Margin Carbonate
    ];
    const jezTrackGeo = new THREE.BufferGeometry().setFromPoints(jezTraversePts);
    const jezTrackMat = new THREE.Line(jezTrackGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8 }));
    surfaceFeatures.add(jezTrackMat);

    // Waypoint dots for Perseverance
    jezTraversePts.forEach((pt) => {
      const dotGeo = new THREE.SphereGeometry(0.18, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.copy(pt);
      surfaceFeatures.add(dotMesh);
    });

    // Curiosity Rover Traverse Track in Gale Crater (Bradbury to Mount Sharp)
    const curTraversePts = [
      latLngToVector3(-4.5895, 137.4417, marsRadius * 1.005), // Bradbury Landing
      latLngToVector3(-4.6150, 137.4250, marsRadius * 1.005), // Yellowknife Bay
      latLngToVector3(-4.6400, 137.3950, marsRadius * 1.005), // Dingo Gap
      latLngToVector3(-4.6800, 137.3700, marsRadius * 1.005), // Pahrump Hills
      latLngToVector3(-4.7200, 137.3450, marsRadius * 1.005), // Namib Dune
      latLngToVector3(-4.7600, 137.3200, marsRadius * 1.005), // Vera Rubin Ridge
      latLngToVector3(-4.7950, 137.3050, marsRadius * 1.005), // Gediz Vallis
    ];
    const curTrackGeo = new THREE.BufferGeometry().setFromPoints(curTraversePts);
    const curTrackMat = new THREE.Line(curTrackGeo, new THREE.LineBasicMaterial({ color: 0xf59e0b }));
    surfaceFeatures.add(curTrackMat);

    // Waypoint dots for Curiosity
    curTraversePts.forEach((pt) => {
      const dotGeo = new THREE.SphereGeometry(0.18, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.copy(pt);
      surfaceFeatures.add(dotMesh);
    });

    // Thin Martian Carbon Dioxide Atmosphere Limb Glow (Sunlit Terminator Haze)
    const atmoGeo = new THREE.SphereGeometry(marsRadius * 1.018, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldNormal;
        uniform vec3 color;
        uniform vec3 sunDirection;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float intensity = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.2);
          // Only illuminate atmosphere facing the Sun, fading smoothly across the terminator
          float sunAlignment = dot(vWorldNormal, sunDirection);
          float sunFactor = smoothstep(-0.25, 0.35, sunAlignment);
          gl_FragColor = vec4(color, intensity * 0.75 * sunFactor);
        }
      `,
      uniforms: {
        color: { value: new THREE.Color(0xd97736) },
        sunDirection: { value: SUN_POSITION_VECTOR.clone().normalize() },
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
    marsGroup.add(atmosphereMesh);
    atmosphereMeshRef.current = atmosphereMesh;

    // 7. Martian Moons (Phobos & Deimos)
    // Scale: Mars radius = 100.
    // Phobos semi-major axis: 265 (~2.65 Mars radii; real is 2.76)
    // Deimos semi-major axis: 560 (~5.6 Mars radii; real is 6.9)
    const phobosOrbitRadius = 265;
    const deimosOrbitRadius = 560;

    // Helper to create irregular asteroid geometry
    const createAsteroidGeometry = (radius: number, stretch: [number, number, number]) => {
      const geo = new THREE.IcosahedronGeometry(radius, 3);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        // Procedural bump & oblong deformation
        const noise = 1 + (Math.sin(x * 1.8) * Math.cos(y * 1.8) * Math.sin(z * 1.8)) * 0.18;
        pos.setXYZ(i, x * stretch[0] * noise, y * stretch[1] * noise, z * stretch[2] * noise);
      }
      geo.computeVertexNormals();
      return geo;
    };

    // Phobos Mesh (Irregular oblong potato, ~4.2 units, dark carbonaceous chondrite)
    const phobosGeo = createAsteroidGeometry(4.2, [1.3, 1.0, 0.85]);
    const phobosMat = new THREE.MeshStandardMaterial({
      color: 0x48423d,
      roughness: 0.94,
      metalness: 0.05,
    });
    const phobosMesh = new THREE.Mesh(phobosGeo, phobosMat);
    scene.add(phobosMesh);
    phobosMeshRef.current = phobosMesh;

    // Phobos Orbit Line Loop
    const phobosSegments = 96;
    const phobosOrbitPoints: THREE.Vector3[] = [];
    const phobosInc = (1.08 * Math.PI) / 180; // Phobos inclination
    for (let i = 0; i < phobosSegments; i++) {
      const a = (i / phobosSegments) * Math.PI * 2;
      const x = phobosOrbitRadius * Math.cos(a);
      const z = phobosOrbitRadius * Math.sin(a);
      const y = z * Math.sin(phobosInc);
      phobosOrbitPoints.push(new THREE.Vector3(x, y, z));
    }
    const phobosOrbitGeo = new THREE.BufferGeometry().setFromPoints(phobosOrbitPoints);
    const phobosOrbitMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.38,
    });
    const phobosOrbitLine = new THREE.LineLoop(phobosOrbitGeo, phobosOrbitMat);
    scene.add(phobosOrbitLine);
    phobosOrbitLineRef.current = phobosOrbitLine;

    // Deimos Mesh (Smaller irregular mini-asteroid, ~2.2 units, dusty reddish-grey)
    const deimosGeo = createAsteroidGeometry(2.3, [1.2, 1.0, 0.9]);
    const deimosMat = new THREE.MeshStandardMaterial({
      color: 0x5a524a,
      roughness: 0.92,
      metalness: 0.04,
    });
    const deimosMesh = new THREE.Mesh(deimosGeo, deimosMat);
    scene.add(deimosMesh);
    deimosMeshRef.current = deimosMesh;

    // Deimos Orbit Line Loop
    const deimosSegments = 120;
    const deimosOrbitPoints: THREE.Vector3[] = [];
    const deimosInc = (1.79 * Math.PI) / 180; // Deimos inclination
    for (let i = 0; i < deimosSegments; i++) {
      const a = (i / deimosSegments) * Math.PI * 2;
      const x = deimosOrbitRadius * Math.cos(a);
      const z = deimosOrbitRadius * Math.sin(a);
      const y = z * Math.sin(deimosInc);
      deimosOrbitPoints.push(new THREE.Vector3(x, y, z));
    }
    const deimosOrbitGeo = new THREE.BufferGeometry().setFromPoints(deimosOrbitPoints);
    const deimosOrbitMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.32,
    });
    const deimosOrbitLine = new THREE.LineLoop(deimosOrbitGeo, deimosOrbitMat);
    scene.add(deimosOrbitLine);
    deimosOrbitLineRef.current = deimosOrbitLine;

    // 8. Lighting: High-contrast Sunlight + Deep Space Ambient
    // Ambient light is subtle to show the distinct dark night side
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.22);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Directional Sunlight aligned from the Sun vector towards Mars
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.8);
    sunLight.position.copy(SUN_POSITION_VECTOR.clone().multiplyScalar(800));
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Load initial NASA texture
    loadTexturePreset(selectedLayerId);

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    window.addEventListener('resize', handleResize);
    handleResize();

    // Animation Loop
    let animationFrameId: number;

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const s = sphereState.current;

      // 1. Mars Planetary Rotation Engine
      let rotationDelta = 0;
      if (rotationSpeedModeRef.current === 'realtime') {
        // Authentic 1x Real-Time Martian Sol: 24.62 hours per rotation (0.0000012 rad/frame at 60fps)
        rotationDelta = 0.0000012;
      } else if (rotationSpeedModeRef.current === 'slow') {
        // Serene gentle planetary drift (~10x slower than previous pace)
        rotationDelta = 0.000045;
      } else {
        // Paused
        rotationDelta = 0;
      }

      s.marsRotationY += rotationDelta;
      if (marsMeshRef.current) {
        marsMeshRef.current.rotation.y = s.marsRotationY;
      }

      // 2. Moons Orbital Motion (Scaled physically to Mars rotation)
      // Phobos completes ~3.21 orbits per Martian Sol (7h 39m period)
      // Deimos completes ~0.81 orbits per Martian Sol (30h 18m period)
      s.phobosAngle += rotationDelta * 3.21;
      s.deimosAngle += rotationDelta * 0.81;

      if (phobosMeshRef.current) {
        const px = phobosOrbitRadius * Math.cos(s.phobosAngle);
        const pz = phobosOrbitRadius * Math.sin(s.phobosAngle);
        const py = pz * Math.sin(phobosInc);
        phobosMeshRef.current.position.set(px, py, pz);
        // Synchronous tidal locking to Mars (faces Mars naturally)
        phobosMeshRef.current.rotation.y = s.phobosAngle;
      }

      if (deimosMeshRef.current) {
        const dx = deimosOrbitRadius * Math.cos(s.deimosAngle);
        const dz = deimosOrbitRadius * Math.sin(s.deimosAngle);
        const dy = dz * Math.sin(deimosInc);
        deimosMeshRef.current.position.set(dx, dy, dz);
        // Synchronous tidal locking to Mars (faces Mars naturally)
        deimosMeshRef.current.rotation.y = s.deimosAngle;
      }

      // 3. Camera Position / Flight Animation
      if (s.isAnimating) {
        const elapsed = time - s.animStartTime;
        const progress = Math.min(1, elapsed / s.animDuration);
        const t = 1 - Math.pow(1 - progress, 3);

        s.theta = s.startTheta + (s.targetTheta - s.startTheta) * t;
        s.phi = s.startPhi + (s.targetPhi - s.startPhi) * t;
        s.radius = s.startRadius + (s.targetRadius - s.startRadius) * t;

        if (progress >= 1) {
          s.isAnimating = false;
        }
      } else if (!s.isDragging) {
        // Inertia Damping
        if (Math.abs(s.velocityTheta) > 0.00001 || Math.abs(s.velocityPhi) > 0.00001) {
          s.theta += s.velocityTheta;
          s.phi += s.velocityPhi;
          s.velocityTheta *= 0.92;
          s.velocityPhi *= 0.92;
          s.phi = Math.max(0.06, Math.min(Math.PI - 0.06, s.phi));
        }
      }

      // Compute camera position from spherical coordinates
      const camX = s.radius * Math.sin(s.phi) * Math.sin(s.theta);
      const camY = s.radius * Math.cos(s.phi);
      const camZ = s.radius * Math.sin(s.phi) * Math.cos(s.theta);

      camera.position.set(camX, camY, camZ);
      camera.lookAt(0, 0, 0);

      const wHalf = (container.clientWidth || window.innerWidth) / 2;
      const hHalf = (container.clientHeight || window.innerHeight) / 2;
      const camDir = camera.position.clone().normalize();

      // Throttle React state updates to every 80-100ms for silky 60fps WebGL execution
      if (!s.lastTelemetryTime || time - s.lastTelemetryTime > 90) {
        s.lastTelemetryTime = time;
        setCameraDist(s.radius);

        // Ground coordinate currently under camera focal center
        const camNorm = camera.position.clone().normalize();
        camNorm.applyAxisAngle(new THREE.Vector3(0, 0, 1), -(25.19 * Math.PI) / 180);
        camNorm.applyAxisAngle(new THREE.Vector3(0, 1, 0), -s.marsRotationY);

        const fLat = Number((90 - Math.acos(Math.max(-1, Math.min(1, camNorm.y))) * (180 / Math.PI)).toFixed(2));
        let fLng = Number(((Math.atan2(camNorm.z, -camNorm.x) * (180 / Math.PI)) - 180).toFixed(2));
        if (fLng < -180) fLng += 360;
        if (fLng > 180) fLng -= 360;

        // Auto Day / Night computation for focal point
        const focalLocalVec = latLngToVector3(fLat, fLng, 1.0);
        focalLocalVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), s.marsRotationY);
        focalLocalVec.applyAxisAngle(new THREE.Vector3(0, 0, 1), (25.19 * Math.PI) / 180);
        const sunDot = focalLocalVec.normalize().dot(SUN_POSITION_VECTOR);
        const isDaySide = sunDot > -0.05;
        const solarElevationDeg = Math.round(Math.asin(Math.max(-1, Math.min(1, sunDot))) * (180 / Math.PI));

        // Find nearest landmark to ground focal point
        let nearest: MarsFeature | undefined;
        let minD = 14.0;
        ALL_MARS_FEATURES.forEach((f) => {
          const d = Math.hypot(f.lat - fLat, f.lng - fLng);
          if (d < minD) {
            minD = d;
            nearest = f;
          }
        });

        const altKm = Math.max(12, Math.round(((s.radius - 100) / 100) * 3389.5));
        const zoomScale = Number((420 / Math.max(100.8, s.radius)).toFixed(1));

        setFocalTelemetry({
          lat: fLat,
          lng: fLng,
          altitudeKm: altKm,
          zoomScale,
          nearestFeature: nearest,
          elevationM: nearest ? nearest.elevationM : -2100,
          isDaySide,
          solarElevationDeg,
        });

        // Compute Subsolar Coordinates on Mars based on current rotation (Real-time Day/Night)
        const currentRotDeg = ((s.marsRotationY * 180) / Math.PI) % 360;
        const subsolarLng = Number(((-currentRotDeg + 360) % 360 - 180).toFixed(1));
        const subsolarLat = telemetry?.subSolarLatitude ?? 12.5;
        setSubsolarPoint({ lat: subsolarLat, lng: subsolarLng });

        // 4. Project Surface Markers
        if (showMarkers && marsMeshRef.current) {
          const projected: Array<{ site: MarsFeature; x: number; y: number; visible: boolean }> = [];

          activeMarkers.forEach((site) => {
            const localV = latLngToVector3(site.lat, site.lng, marsRadius * 1.012);
            localV.applyAxisAngle(new THREE.Vector3(0, 1, 0), s.marsRotationY);
            localV.applyAxisAngle(new THREE.Vector3(0, 0, 1), (25.19 * Math.PI) / 180);

            const siteDir = localV.clone().normalize();
            const dot = siteDir.dot(camDir);

            if (dot > 0.15) {
              const screenPos = localV.clone().project(camera);
              const sx = screenPos.x * wHalf + wHalf;
              const sy = -(screenPos.y * hHalf) + hHalf;
              projected.push({
                site,
                x: sx,
                y: sy,
                visible: true,
              });
            }
          });
          setProjectedMarkers(projected);
        } else {
          setProjectedMarkers([]);
        }

        // 5. Project Moons Screen Coordinates
        if (showMoons && phobosMeshRef.current && deimosMeshRef.current) {
          const phobosPos = phobosMeshRef.current.position.clone();
          const deimosPos = deimosMeshRef.current.position.clone();

          const pDot = phobosPos.clone().normalize().dot(camDir);
          const dDot = deimosPos.clone().normalize().dot(camDir);

          let pProj: { x: number; y: number; visible: boolean; distKm: number } | null = null;
          let dProj: { x: number; y: number; visible: boolean; distKm: number } | null = null;

          if (pDot > -0.2) {
            const pScreen = phobosPos.project(camera);
            pProj = {
              x: pScreen.x * wHalf + wHalf,
              y: -(pScreen.y * hHalf) + hHalf,
              visible: true,
              distKm: 9376,
            };
          }

          if (dDot > -0.2) {
            const dScreen = deimosPos.project(camera);
            dProj = {
              x: dScreen.x * wHalf + wHalf,
              y: -(dScreen.y * hHalf) + hHalf,
              visible: true,
              distKm: 23463,
            };
          }

          setProjectedMoons({ phobos: pProj, deimos: dProj });
        } else {
          setProjectedMoons({ phobos: null, deimos: null });
        }
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      ro.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Atmosphere Visibility
  useEffect(() => {
    if (atmosphereMeshRef.current) {
      atmosphereMeshRef.current.visible = showAtmosphere;
    }
  }, [showAtmosphere]);

  // Update Moons Visibility
  useEffect(() => {
    if (phobosMeshRef.current && deimosMeshRef.current && phobosOrbitLineRef.current && deimosOrbitLineRef.current) {
      phobosMeshRef.current.visible = showMoons;
      deimosMeshRef.current.visible = showMoons;
      phobosOrbitLineRef.current.visible = showMoons;
      deimosOrbitLineRef.current.visible = showMoons;
    }
  }, [showMoons]);

  // Change Map Texture
  const handleSelectLayer = (layerId: string) => {
    setSelectedLayerId(layerId);
    loadTexturePreset(layerId);
    setIsLayerMenuOpen(false);
  };

  // Mouse & Touch Controls
  const handlePointerDown = (e: React.PointerEvent) => {
    const s = sphereState.current;
    s.isDragging = true;
    s.isAnimating = false;
    s.prevMouseX = e.clientX;
    s.prevMouseY = e.clientY;
    s.velocityTheta = 0;
    s.velocityPhi = 0;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const s = sphereState.current;
    if (!s.isDragging) return;

    const dx = e.clientX - s.prevMouseX;
    const dy = e.clientY - s.prevMouseY;

    // Smoothed drag factor scaled by distance to Mars surface
    // (Extremely smooth & fine-tuned when zoomed in close)
    const distFactor = Math.max(0.16, Math.min(1.0, (s.radius - 98) / 220));
    const rotSpeed = 0.0035 * distFactor;
    const dTheta = -dx * rotSpeed;
    const dPhi = -dy * rotSpeed;

    s.theta += dTheta;
    s.phi += dPhi;
    s.phi = Math.max(0.06, Math.min(Math.PI - 0.06, s.phi));

    s.velocityTheta = dTheta;
    s.velocityPhi = dPhi;

    s.prevMouseX = e.clientX;
    s.prevMouseY = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const s = sphereState.current;
    s.isDragging = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Wheel Zoom with non-linear fine sensitivity near the surface & auto 2D map dive
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const s = sphereState.current;
    s.isAnimating = false;

    // If scrolling in (zooming into surface) when already close, transition directly to 2D view
    if (e.deltaY < 0 && s.radius <= 103.5) {
      diveInto2DMapAtFocalPoint();
      return;
    }

    // Dynamic wheel factor: smooth fine control near ground, fast in space
    const dist = Math.max(0.6, s.radius - 100);
    const factor = dist > 80 ? 0.45 : dist > 20 ? 0.20 : dist > 4 ? 0.08 : 0.024;
    
    s.radius += e.deltaY * factor;
    s.radius = Math.max(100.8, Math.min(950, s.radius));
    setCameraDist(s.radius);

    // If scroll reached ground threshold, dive into 2D view
    if (e.deltaY < 0 && s.radius <= 101.5) {
      diveInto2DMapAtFocalPoint();
    }
  };

  // Double Click on Mars Surface directly zooms & opens 2D High-Res View at that location
  const handleDoubleClick = (e: React.MouseEvent) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const marsMesh = marsMeshRef.current;
    if (!container || !camera || !marsMesh) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const hits = raycaster.intersectObject(marsMesh);
    if (hits.length > 0) {
      const hit = hits[0];
      const { lat, lng } = vector3ToLatLng(hit.point);
      let nearestFeature: MarsFeature | undefined;
      let minDistance = 5.0;
      ALL_MARS_FEATURES.forEach((f) => {
        const d = Math.hypot(f.lat - lat, f.lng - lng);
        if (d < minDistance) {
          minDistance = d;
          nearestFeature = f;
        }
      });
      diveInto2DMapAtFocalPoint(nearestFeature || {
        id: `target-${lat.toFixed(2)}-${lng.toFixed(2)}`,
        name: nearestFeature ? nearestFeature.name : 'Martian Surface Target',
        type: nearestFeature ? nearestFeature.type : 'Planitia (Plain)',
        lat: Number(lat.toFixed(2)),
        lng: Number(lng.toFixed(2)),
        planetocentricLng: (lng + 360) % 360,
        elevationM: nearestFeature?.elevationM ?? -2000,
        description: `Coordinates at ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
        originName: 'Target Coordinates',
      });
    }
  };

  // Click on Globe Surface to Inspect Science Telemetry
  const handleCanvasClick = (e: React.MouseEvent) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const marsMesh = marsMeshRef.current;
    if (!container || !camera || !marsMesh) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // Check Moons first
    if (showMoons) {
      if (phobosMeshRef.current) {
        const pHits = raycaster.intersectObject(phobosMeshRef.current);
        if (pHits.length > 0) {
          setSelectedMoon('phobos');
          setIsMoonModalOpen(true);
          return;
        }
      }
      if (deimosMeshRef.current) {
        const dHits = raycaster.intersectObject(deimosMeshRef.current);
        if (dHits.length > 0) {
          setSelectedMoon('deimos');
          setIsMoonModalOpen(true);
          return;
        }
      }
    }

    // Check Mars Sphere
    const hits = raycaster.intersectObject(marsMesh);
    if (hits.length > 0) {
      const hit = hits[0];
      const point = hit.point;
      const { lat, lng } = vector3ToLatLng(point);

      // Find nearest landmark if within 5 degrees
      let nearestFeature: MarsFeature | undefined;
      let minDistance = 5.0;

      ALL_MARS_FEATURES.forEach((f) => {
        const d = Math.hypot(f.lat - lat, f.lng - lng);
        if (d < minDistance) {
          minDistance = d;
          nearestFeature = f;
        }
      });

      const science = analyzeMarsLocationScience(lat, lng, nearestFeature?.elevationM || 0);

      // Auto-compute Day / Night status for clicked surface point
      const hitWorldNorm = hit.point.clone().normalize();
      const sunDot = hitWorldNorm.dot(SUN_POSITION_VECTOR);
      const isDaySide = sunDot > -0.05;
      const solarElevationDeg = Math.round(Math.asin(Math.max(-1, Math.min(1, sunDot))) * (180 / Math.PI));

      setInspectedCoord({
        lat: Number(lat.toFixed(2)),
        lng: Number(lng.toFixed(2)),
        elevationM: nearestFeature?.elevationM || 0,
        name: nearestFeature ? nearestFeature.name : undefined,
        science,
        isDaySide,
        solarElevationDeg,
      });
      setSelectedSite(nearestFeature || null);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#04060b] overflow-hidden select-none font-sans">
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        onDoubleClick={handleDoubleClick}
      />

      {/* TOP STREAMLINED MISSION HUD */}
      <div className="absolute top-3 left-3 right-3 z-20 pointer-events-none flex items-center justify-between gap-3">
        {/* Left: Planet Title & Real-Time Auto Day/Night Telemetry */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="bg-[#090d16]/90 backdrop-blur-xl border border-neutral-700/80 rounded-2xl px-3.5 py-2 shadow-2xl flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-sm shadow-orange-500/50" />
              <div>
                <h1 className="text-xs font-black text-white tracking-wider uppercase font-mono">
                  Mars 3D Orbital
                </h1>
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                  <span>R: 3,389.5 km</span>
                  <span>•</span>
                  <span className="text-orange-400 font-bold">{activeTextureSource.split(' ')[1] || 'Viking'}</span>
                </div>
              </div>
            </div>

            {/* Live Auto Day / Night Solar Indicator */}
            <div className="hidden sm:flex items-center gap-2 border-l border-neutral-800 pl-3">
              <div className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-neutral-900/90 border border-neutral-700/80 text-neutral-200">
                <span className={`w-2 h-2 rounded-full ${focalTelemetry.isDaySide ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-indigo-400 shadow-sm shadow-indigo-400/50'}`} />
                <span className={focalTelemetry.isDaySide ? 'text-amber-300 font-bold' : 'text-indigo-300 font-bold'}>
                  {focalTelemetry.isDaySide ? '☀️ Day (Sunlit)' : '🌑 Night (Shadow)'}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  ({focalTelemetry.solarElevationDeg >= 0 ? `+${focalTelemetry.solarElevationDeg}°` : `${focalTelemetry.solarElevationDeg}°`})
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono hidden md:inline">
                Subsolar: {subsolarPoint.lat}°N, {subsolarPoint.lng}°E
              </span>
            </div>
          </div>
        </div>

        {/* Right: Sleek Action Icons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Moons Toggle */}
          <button
            type="button"
            onClick={() => setShowMoons(!showMoons)}
            className={`p-2 rounded-xl border shadow-xl transition-all cursor-pointer ${
              showMoons
                ? 'bg-cyan-950/90 border-cyan-700 text-cyan-300'
                : 'bg-[#090d16]/90 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
            title={showMoons ? 'Hide Moons (Phobos & Deimos)' : 'Show Moons (Phobos & Deimos)'}
          >
            <Orbit className="w-4 h-4" />
          </button>

          {/* Surface Pins Toggle */}
          <button
            type="button"
            onClick={() => setShowMarkers(!showMarkers)}
            className={`p-2 rounded-xl border shadow-xl transition-all cursor-pointer ${
              showMarkers
                ? 'bg-orange-950/90 border-orange-700 text-orange-300'
                : 'bg-[#090d16]/90 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
            title={showMarkers ? 'Hide Surface Pins' : 'Show Surface Pins'}
          >
            <MapPin className="w-4 h-4" />
          </button>

          {/* Layer Selector Popover Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
              className="p-2 rounded-xl bg-[#090d16]/90 border border-neutral-700 text-neutral-300 hover:text-white shadow-xl transition-all cursor-pointer"
              title="Select Map Imagery Layer"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Layer Picker Dropdown */}
            {isLayerMenuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-[#0c101a] border border-neutral-700 rounded-2xl p-2 shadow-2xl z-30 flex flex-col gap-1 text-xs">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider px-2 py-1">
                  Global Basemaps
                </span>
                {MARS_TEXTURE_PRESETS.map((layer) => (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => handleSelectLayer(layer.id)}
                    className={`p-2 rounded-xl text-left transition-colors cursor-pointer ${
                      selectedLayerId === layer.id
                        ? 'bg-orange-950/80 border border-orange-700/80 text-orange-200'
                        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{layer.name}</span>
                      {selectedLayerId === layer.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      )}
                    </div>
                    <span className="text-[9.5px] text-neutral-400 font-mono block mt-0.5">{layer.subtext}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Switch to 2D Mercator Flat Map */}
          <button
            type="button"
            onClick={() => onSwitchToFlatMap(selectedSite || undefined)}
            className="flex items-center gap-1.5 bg-[#090d16]/90 hover:bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 shadow-xl text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer transition-all"
            title="Switch to High-Resolution 2D Mercator Map"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">2D Map</span>
          </button>
        </div>
      </div>

      {/* FLOATING 3D MARKERS OVERLAY */}
      {showMarkers &&
        projectedMarkers.map(({ site, x, y, visible }) => {
          if (!visible) return null;
          const isSelected = selectedSite?.name === site.name;
          return (
            <div
              key={site.name}
              className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group"
              style={{ left: `${x}px`, top: `${y}px` }}
              onClick={() => {
                setSelectedSite(site);
                const sc = analyzeMarsLocationScience(site.lat, site.lng, site.elevationM);
                setInspectedCoord({
                  lat: site.lat,
                  lng: site.lng,
                  elevationM: site.elevationM,
                  name: site.name,
                  science: sc,
                });
              }}
            >
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono border backdrop-blur-md transition-all shadow-md ${
                  isSelected
                    ? 'bg-orange-600 border-white text-white scale-110'
                    : 'bg-[#090d16]/80 border-neutral-700 text-neutral-300 group-hover:border-orange-500 group-hover:text-white'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    site.type === 'Robotic Rover/Lander' ? 'bg-cyan-400' : 'bg-orange-400'
                  }`}
                />
                <span className="font-semibold">{site.name}</span>
              </div>
            </div>
          );
        })}

      {/* FLOATING MOONS OVERLAY (PHOBOS & DEIMOS) */}
      {showMoons && projectedMoons.phobos && (
        <div
          className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 z-15 cursor-pointer"
          style={{ left: `${projectedMoons.phobos.x}px`, top: `${projectedMoons.phobos.y}px` }}
          onClick={() => {
            setSelectedMoon('phobos');
            setIsMoonModalOpen(true);
          }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border border-cyan-500/80 bg-cyan-950/90 text-cyan-200 backdrop-blur-md shadow-xl hover:scale-105 transition-transform">
            <Orbit className="w-3 h-3 text-cyan-400 animate-spin" />
            <span className="font-black">PHOBOS</span>
            <span className="text-[9px] text-cyan-400 hidden sm:inline">9,376 km</span>
          </div>
        </div>
      )}

      {showMoons && projectedMoons.deimos && (
        <div
          className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 z-15 cursor-pointer"
          style={{ left: `${projectedMoons.deimos.x}px`, top: `${projectedMoons.deimos.y}px` }}
          onClick={() => {
            setSelectedMoon('deimos');
            setIsMoonModalOpen(true);
          }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border border-amber-500/80 bg-amber-950/90 text-amber-200 backdrop-blur-md shadow-xl hover:scale-105 transition-transform">
            <Orbit className="w-3 h-3 text-amber-400 animate-spin" />
            <span className="font-black">DEIMOS</span>
            <span className="text-[9px] text-amber-400 hidden sm:inline">23,463 km</span>
          </div>
        </div>
      )}

      {/* RIGHT CONTROLS: ZOOM, ALTITUDE PRESETS & ROTATION PACE */}
      <div className="absolute right-3 top-20 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Zoom In / Out / Reset Stack */}
        <div className="flex flex-col bg-[#090d16]/90 border border-neutral-700/80 rounded-2xl overflow-hidden shadow-2xl">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2.5 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer border-b border-neutral-800"
            title="Zoom In (Progressive to Surface)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2.5 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer border-b border-neutral-800"
            title="Zoom Out to Deep Space"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetToSpace}
            className="p-2.5 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Reset to Deep Space Mars View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Altitude Presets Stack */}
        <div className="flex flex-col bg-[#090d16]/90 border border-neutral-700/80 rounded-2xl overflow-hidden shadow-2xl text-[9.5px] font-mono">
          <div className="px-2 py-1 bg-neutral-900/90 text-neutral-400 font-bold border-b border-neutral-800 text-[8.5px] text-center uppercase tracking-wider">
            Altitude
          </div>
          <button
            type="button"
            onClick={() => handleFlyToAltitude(101.8)}
            className={`px-2 py-1.5 border-b border-neutral-800 text-center transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              cameraDist < 115 ? 'bg-orange-600 text-white font-bold' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
            title="Dive to Surface Close-Up (~60 km altitude)"
          >
            <Crosshair className="w-3 h-3 text-orange-400" />
            <span>Close</span>
          </button>
          <button
            type="button"
            onClick={() => diveInto2DMapAtFocalPoint()}
            className="px-2 py-1.5 border-b border-neutral-800 text-center transition-colors cursor-pointer flex items-center justify-center gap-1 text-emerald-400 hover:text-white hover:bg-emerald-950/60 font-bold"
            title="Switch directly to High-Resolution 2D Map for this location"
          >
            <Maximize2 className="w-3 h-3 text-emerald-400" />
            <span>2D View</span>
          </button>
          <button
            type="button"
            onClick={() => handleFlyToAltitude(140)}
            className={`px-2 py-1.5 border-b border-neutral-800 text-center transition-colors cursor-pointer ${
              cameraDist >= 115 && cameraDist < 180 ? 'bg-orange-950 text-orange-200 font-bold' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
            title="Regional View (~1,350 km altitude)"
          >
            Region
          </button>
          <button
            type="button"
            onClick={() => handleFlyToAltitude(220)}
            className={`px-2 py-1.5 border-b border-neutral-800 text-center transition-colors cursor-pointer ${
              cameraDist >= 180 && cameraDist < 340 ? 'bg-cyan-950 text-cyan-200 font-bold' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
            title="High Orbit View (~4,000 km altitude)"
          >
            Orbit
          </button>
          <button
            type="button"
            onClick={() => handleFlyToAltitude(450)}
            className={`px-2 py-1.5 text-center transition-colors cursor-pointer ${
              cameraDist >= 340 ? 'bg-blue-950 text-blue-200 font-bold' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
            title="Deep Space View (~11,800 km altitude)"
          >
            Space
          </button>
        </div>

        {/* Mars Rotation Speed Controller: Authentic Real Speed by Default */}
        <div className="flex flex-col bg-[#090d16]/90 border border-neutral-700/80 rounded-2xl overflow-hidden shadow-2xl text-[9.5px] font-mono">
          <div className="px-2 py-1 bg-neutral-900/90 text-neutral-400 font-bold border-b border-neutral-800 text-[8px] text-center uppercase tracking-wider">
            Speed
          </div>
          <button
            type="button"
            onClick={() => setRotationSpeedMode('realtime')}
            className={`px-2 py-1.5 border-b border-neutral-800 text-center transition-colors cursor-pointer ${
              rotationSpeedMode === 'realtime'
                ? 'bg-cyan-950 text-cyan-300 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Authentic Real Speed (True 24.6h Sol rotation & Keplerian orbital period)"
          >
            1x Real
          </button>
          <button
            type="button"
            onClick={() => setRotationSpeedMode('slow')}
            className={`px-2 py-1.5 border-b border-neutral-800 text-center transition-colors cursor-pointer ${
              rotationSpeedMode === 'slow'
                ? 'bg-amber-950 text-amber-300 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Gentle Cosmic Planetary Drift"
          >
            Drift
          </button>
          <button
            type="button"
            onClick={() => setRotationSpeedMode('paused')}
            className={`px-2 py-1.5 text-center transition-colors cursor-pointer ${
              rotationSpeedMode === 'paused'
                ? 'bg-neutral-800 text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Pause Planetary Rotation"
          >
            Pause
          </button>
        </div>
      </div>

      {/* HiRISE SURFACE CLOSE-UP VIEWFINDER HUD (Active when camera is close to the surface) */}
      {cameraDist <= 145 && !inspectedCoord && !selectedSite && (
        <div className="absolute top-20 left-3 sm:left-4 z-20 pointer-events-auto max-w-xs sm:max-w-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#090d16]/95 backdrop-blur-xl border border-emerald-500/60 rounded-2xl p-3.5 shadow-2xl text-neutral-200 font-mono">
            {/* Viewfinder Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                  HiRISE Close-Up Viewfinder
                </span>
              </div>
              <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                {focalTelemetry.zoomScale}x
              </span>
            </div>

            {/* Target Location & Focal Coordinates */}
            <div className="mt-2.5">
              <div className="text-xs font-bold text-white flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="truncate">{focalTelemetry.nearestFeature?.name || 'Martian Surface Target'}</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5 flex items-center justify-between">
                <span>
                  {focalTelemetry.lat >= 0 ? `${focalTelemetry.lat}°N` : `${Math.abs(focalTelemetry.lat)}°S`},{' '}
                  {focalTelemetry.lng >= 0 ? `${focalTelemetry.lng}°E` : `${Math.abs(focalTelemetry.lng)}°W`}
                </span>
                <span className={`text-[10px] font-bold ${focalTelemetry.isDaySide ? 'text-amber-300' : 'text-indigo-300'}`}>
                  {focalTelemetry.isDaySide ? `☀️ Day (+${focalTelemetry.solarElevationDeg}°)` : `🌑 Night (${focalTelemetry.solarElevationDeg}°)`}
                </span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5 flex items-center justify-between">
                <span>Alt: <span className="text-cyan-400">{focalTelemetry.altitudeKm.toLocaleString()} km</span></span>
                <span>Elev: <span className="text-white font-semibold">{focalTelemetry.elevationM.toLocaleString()} m</span></span>
                {focalTelemetry.nearestFeature?.type && (
                  <span className="ml-2 text-neutral-500">({focalTelemetry.nearestFeature.type})</span>
                )}
              </div>
            </div>

            {/* Viewfinder Action Buttons */}
            <div className="mt-3 pt-2 border-t border-neutral-800/90 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onSwitchToFlatMap(
                    focalTelemetry.nearestFeature || {
                      id: `target-${focalTelemetry.lat.toFixed(2)}-${focalTelemetry.lng.toFixed(2)}`,
                      name: 'Martian Surface Target',
                      type: 'Planitia (Plain)',
                      lat: focalTelemetry.lat,
                      lng: focalTelemetry.lng,
                      planetocentricLng: (focalTelemetry.lng + 360) % 360,
                      elevationM: focalTelemetry.elevationM,
                      description: 'Close-up exploration area on the Martian surface.',
                      originName: 'Target Coordinates',
                    }
                  );
                }}
                className="col-span-2 py-1.5 px-2 rounded-xl bg-gradient-to-r from-emerald-950 to-teal-950 hover:from-emerald-900 hover:to-teal-900 border border-emerald-600/80 text-emerald-200 text-[10.5px] font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                title="Open high-resolution flat satellite map for this exact location"
              >
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dive into 2D High-Res Map</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenNASACloseUp(focalTelemetry.nearestFeature?.name || 'Jezero Crater')}
                className="py-1 px-2 rounded-lg bg-orange-950/80 hover:bg-orange-900 border border-orange-700/80 text-orange-200 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all truncate"
                title="View real NASA in-situ photos"
              >
                <Camera className="w-3 h-3 text-orange-400 shrink-0" />
                <span className="truncate">NASA Photos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const sc = analyzeMarsLocationScience(focalTelemetry.lat, focalTelemetry.lng, focalTelemetry.elevationM);
                  setInspectedCoord({
                    lat: focalTelemetry.lat,
                    lng: focalTelemetry.lng,
                    elevationM: focalTelemetry.elevationM,
                    name: focalTelemetry.nearestFeature?.name,
                    science: sc,
                  });
                  setIsDossierModalOpen(true);
                }}
                className="py-1 px-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-200 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all truncate"
                title="Inspect water, atmosphere, and environmental data"
              >
                <Droplets className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">Science</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM INSPECTION CARD (Single unified card for surface point, rover, or landmark) */}
      {(inspectedCoord || selectedSite) && (
        <div className="absolute bottom-4 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-20 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#090d16]/95 backdrop-blur-xl border border-orange-500/60 rounded-2xl p-4 shadow-2xl text-neutral-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-950 text-orange-300 border border-orange-800 font-bold uppercase">
                    {selectedSite?.type || 'SURFACE POINT'}
                  </span>
                  {inspectedCoord?.isDaySide !== undefined && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      inspectedCoord.isDaySide
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                    }`}>
                      {inspectedCoord.isDaySide ? '☀️ Day (Sunlit)' : '🌑 Night (Shadow)'}
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-neutral-400">
                    {inspectedCoord
                      ? `${inspectedCoord.lat >= 0 ? `${inspectedCoord.lat}°N` : `${Math.abs(inspectedCoord.lat)}°S`}, ${inspectedCoord.lng >= 0 ? `${inspectedCoord.lng}°E` : `${Math.abs(inspectedCoord.lng)}°W`}`
                      : selectedSite
                      ? `${selectedSite.lat >= 0 ? `${selectedSite.lat}°N` : `${Math.abs(selectedSite.lat)}°S`}, ${selectedSite.lng >= 0 ? `${selectedSite.lng}°E` : `${Math.abs(selectedSite.lng)}°W`}`
                      : ''}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1 truncate">
                  {selectedSite?.name || inspectedCoord?.name || 'Martian Surface Sector'}
                </h3>
              </div>

              {/* Close Button with explicit onClick and touchEnd */}
              <button
                type="button"
                aria-label="Close inspection card"
                onClick={(e) => {
                  e.stopPropagation();
                  setInspectedCoord(null);
                  setSelectedSite(null);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  setInspectedCoord(null);
                  setSelectedSite(null);
                }}
                className="p-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Science Highlights */}
            {inspectedCoord && (
              <div className="grid grid-cols-2 gap-2 my-2.5 text-[11px] font-mono">
                <div className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800">
                  <span className="text-cyan-400 font-bold flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> Water Ice:
                  </span>
                  <span className="text-white text-[10.5px] block mt-0.5 truncate">
                    {inspectedCoord.science.water.depthDisplay}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800">
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <CloudRain className="w-3 h-3" /> Liquid Rain:
                  </span>
                  <span className="text-white text-[10.5px] block mt-0.5">
                    {inspectedCoord.science.precipitation.liquidRainProbability}
                  </span>
                </div>
              </div>
            )}

            {/* Selected Site Description */}
            {selectedSite && (
              <p className="text-xs text-neutral-300 leading-relaxed mb-3 line-clamp-2">
                {selectedSite.description}
              </p>
            )}

            {/* Open Full Environmental & Science Dossier Button */}
            <button
              type="button"
              onClick={() => {
                if (!inspectedCoord && selectedSite) {
                  const sc = analyzeMarsLocationScience(selectedSite.lat, selectedSite.lng, selectedSite.elevationM);
                  setInspectedCoord({
                    lat: selectedSite.lat,
                    lng: selectedSite.lng,
                    elevationM: selectedSite.elevationM,
                    name: selectedSite.name,
                    science: sc,
                  });
                }
                setIsDossierModalOpen(true);
              }}
              className="w-full mb-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-700/80 text-cyan-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Water, Atmosphere, Rain & Safety Dossier</span>
            </button>

            {/* Secondary Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/80">
              {selectedSite && (
                <button
                  type="button"
                  onClick={() => onOpenNASACloseUp(selectedSite.name)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>NASA Close-Up</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onSwitchToFlatMap(selectedSite || undefined)}
                className="py-1.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-neutral-700"
                title="Inspect on 2D Mercator Map"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>2D Map</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Surface Dive Prompt Button (Appears when zoomed near surface) */}
      {cameraDist <= 140 && !inspectedCoord && !selectedSite && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            type="button"
            onClick={() => diveInto2DMapAtFocalPoint()}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-2xl border border-emerald-400/80 cursor-pointer transition-transform hover:scale-105 active:scale-95 font-mono"
            title="Dive into high-resolution 2D surface map for this location"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-200" />
            <span>Open 2D High-Res Map for this Location</span>
            <span className="text-[10px] text-emerald-200 opacity-80">(or zoom closer)</span>
          </button>
        </div>
      )}

      {/* QUICK PLANETARY DESTINATIONS DOCK (Bottom Center) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-15 pointer-events-auto hidden md:flex items-center gap-1 bg-[#090d16]/85 backdrop-blur-md border border-neutral-800/90 px-3 py-1.5 rounded-full shadow-2xl">
        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mr-1">
          Quick Fly:
        </span>
        {QUICK_DESTINATIONS.slice(0, 5).map((dest) => (
          <button
            key={dest.id}
            type="button"
            onClick={() => flyToLocation(dest.lat, dest.lng, dest.zoom)}
            className="px-2.5 py-1 rounded-full text-[10.5px] font-mono text-neutral-300 hover:text-white hover:bg-neutral-800 border border-transparent hover:border-neutral-700 transition-colors cursor-pointer"
          >
            {dest.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* PLANETARY SCIENCE DOSSIER MODAL */}
      {inspectedCoord && (
        <MarsScienceDossierModal
          isOpen={isDossierModalOpen}
          onClose={() => setIsDossierModalOpen(false)}
          lat={inspectedCoord.lat}
          lng={inspectedCoord.lng}
          elevationM={inspectedCoord.elevationM}
          featureName={inspectedCoord.name}
          onOpenNASACloseUp={onOpenNASACloseUp}
        />
      )}

      {/* MARTIAN MOONS DOSSIER MODAL (PHOBOS & DEIMOS) */}
      {selectedMoon && (
        <MarsMoonDossierModal
          isOpen={isMoonModalOpen}
          moonId={selectedMoon}
          onClose={() => {
            setIsMoonModalOpen(false);
            setSelectedMoon(null);
          }}
          onFocusMoon={(id) => flyToMoon(id)}
        />
      )}
    </div>
  );
};
