import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  X,
  Compass,
  Volume2,
  VolumeX,
  Camera,
  Maximize2,
  Minimize2,
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
} from 'lucide-react';
import { marsEvaAudio } from '../../engine/marsEvaAudio';

export interface AstronautSitePreset {
  id: string;
  name: string;
  tag: string;
  lat: number;
  lng: number;
  elevationM: number;
  description: string;
  geologyHighlights: string;
  groundColor: number; // Hex color for terrain tint
  skyColor: number;
  sunIntensity: number;
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
    tag: 'Perseverance Rover Vicinity',
    lat: 18.38,
    lng: 77.58,
    elevationM: -2560,
    description: 'Ancient river delta lakebed filled with clay smectites and carbonate minerals cached for Mars Sample Return.',
    geologyHighlights: 'River delta bottomset beds, olivine-rich Máaz formation, delta scarp cliffs in the west.',
    groundColor: 0x9b4e28,
    skyColor: 0xc87d55,
    sunIntensity: 1.25,
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
    tag: 'Curiosity Rover Traverse',
    lat: -4.59,
    lng: 137.44,
    elevationM: -4450,
    description: 'Enormous 154 km impact basin with 5.5 km central peak Aeolis Mons exhibiting aqueous sulfate and clay layers.',
    geologyHighlights: 'Murray Formation finely laminated mudstones, Vera Rubin Hematite Ridge, sulfate-bearing unit.',
    groundColor: 0x8a4522,
    skyColor: 0xbf7850,
    sunIntensity: 1.3,
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
    tag: 'Grand Canyon of Mars',
    lat: -13.90,
    lng: -59.20,
    elevationM: -3200,
    description: 'Largest canyon system in the solar system; sheer 7-kilometer cliff scarps exposing billions of years of crustal stratification.',
    geologyHighlights: 'Colossal landslide debris lobes, interior layered deposits (ILD), sulfate-rich sulfate knolls.',
    groundColor: 0x7c381c,
    skyColor: 0xb56d47,
    sunIntensity: 1.35,
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
    tag: 'Tallest Volcano (21.2 km)',
    lat: 18.65,
    lng: -133.80,
    elevationM: 21229,
    description: 'Summit caldera rim at 21,229m altitude; near-vacuum atmospheric pressure (0.7 mbar) revealing pitch-black space overhead.',
    geologyHighlights: 'Multiple nested collapsed calderas, fresh lava tube channels, pahoehoe lava wrinkle ridges.',
    groundColor: 0x5a2d1d,
    skyColor: 0x523023, // Much darker sky due to 0.7 mbar thin atmosphere
    sunIntensity: 1.5,
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
        pdsCitation: 'Mars Express OMEGA Spectral Cube ORB0442_2',
      },
    ],
  },
  {
    id: 'arcadia',
    name: 'Arcadia Planitia — Human Ice Base (ISRU)',
    tag: 'NASA Human Landing Site Candidate',
    lat: 39.20,
    lng: 189.70,
    elevationM: -4100,
    description: 'Vast smooth northern lowlands with confirmed pure water ice sheets buried within 1 meter of the surface for human ISRU fuel extraction.',
    geologyHighlights: 'Patterned periglacial ground, polygon thermal contraction cracks, expanded sheet ice.',
    groundColor: 0x935639,
    skyColor: 0xc4805d,
    sunIntensity: 1.15,
    sampleTargets: [
      {
        name: 'Sub-Regolith Glacial Core Sample',
        type: 'Near-Pure Relict Water Ice (H2O)',
        composition: 'H2O 96.8%, Dust particulate 3.2%, Trace Perchlorates',
        significance: 'Direct resource for human drinking water, oxygen production, and methane propellant synthesis.',
        pdsCitation: 'SHARAD Radar Subsurface Sounding & SWIM Project 2021',
      },
      {
        name: 'Periglacial Regolith Mantle',
        type: 'Cryoturbated Aeolian Sand',
        composition: 'Plagioclase 38%, Pyroxene 34%, Smectite 12%, Ice 8%',
        significance: 'Thermal insulation barrier preventing sublimation of ice sheets during high obliquity.',
        pdsCitation: 'HiRISE DTM ESP_021943_2200 Cryo-morphology',
      },
    ],
  },
  {
    id: 'meridiani',
    name: 'Meridiani Planum — Hematite Blueberry Field',
    tag: 'Opportunity Rover Resting Site',
    lat: -1.95,
    lng: -5.53,
    elevationM: -1440,
    description: 'Equatorial plain famous for billions of millimeter-sized gray hematite spherules ("blueberries") created by ancient groundwater percolation.',
    geologyHighlights: 'Cross-bedded sulfate sandstones, wind ripples, Burns Formation outcrop.',
    groundColor: 0x8b4b2a,
    skyColor: 0xc67f57,
    sunIntensity: 1.3,
    sampleTargets: [
      {
        name: 'Gray Hematite Spherule ("Blueberry")',
        type: 'Groundwater Concretion',
        composition: 'Fe2O3 > 85%, Quartz/Sulfate inclusions',
        significance: 'Groundbreaking proof of groundwater chemistry in Meridiani ancient playa system.',
        pdsCitation: 'MER-B Opportunity Mössbauer Spectrometer Sol 48',
      },
    ],
  },
  {
    id: 'gusev',
    name: 'Gusev Crater — Husband Hill Summit',
    tag: 'Spirit Rover Vista',
    lat: -14.57,
    lng: 175.47,
    elevationM: -1930,
    description: '166 km crater harboring the Columbia Hills; Spirit discovered rich volcanic hydrothermal deposits and 90% pure silica.',
    geologyHighlights: 'Silica-rich hydrothermal sinter, Comanche carbonate outcrop, Home Plate volcaniclastic plateau.',
    groundColor: 0x86401e,
    skyColor: 0xbc7449,
    sunIntensity: 1.3,
    sampleTargets: [
      {
        name: 'Home Plate Hydrothermal Opaline Silica',
        type: 'Hydrothermal Hot Spring Sinter',
        composition: 'SiO2 91.4%, TiO2 1.8%, Low Fe',
        significance: 'Evidence of explosive hydrothermal fumaroles or hot springs, an analog for early life origins on Earth.',
        pdsCitation: 'Spirit APXS & Mini-TES Science Product Sol 1152',
      },
    ],
  },
  {
    id: 'north_pole',
    name: 'Planum Boreum — North Polar Cap Edge',
    tag: 'Perennial Ice & Dune Fields',
    lat: 85.00,
    lng: 0.00,
    elevationM: -4100,
    description: 'Permanent water ice cap with dry-ice seasonal frosting, towering 1 km layered ice scarps and dark circumpolar sand seas.',
    geologyHighlights: 'Basal unit water ice, polar layered deposits (PLD), Olympia Planum dunes.',
    groundColor: 0xd8a98b, // Whiter / frostier tone
    skyColor: 0xd29d80,
    sunIntensity: 0.9,
    sampleTargets: [
      {
        name: 'Polar Layered Deposit Firn Ice',
        type: 'Perennial Water Ice & Dust Laminae',
        composition: 'H2O Ice 94%, Atmospheric Dust 6%, Trace Dry Ice (CO2)',
        significance: 'Annual climate record of Mars over the last 5 million years (equivalent to Greenland ice cores).',
        pdsCitation: 'Mars Express OMEGA & HRSC Polar Ice Archive',
      },
    ],
  },
];

interface MarsAstronautViewProps {
  initialSite?: {
    name?: string;
    lat: number;
    lng: number;
    elevationM?: number;
    description?: string;
  };
  onExit: () => void;
  onSwitchTo2D: () => void;
  onSwitchTo3D: () => void;
}

export const MarsAstronautView: React.FC<MarsAstronautViewProps> = ({
  initialSite,
  onExit,
  onSwitchTo2D,
  onSwitchTo3D,
}) => {
  // Determine starting site preset
  const [selectedSitePreset, setSelectedSitePreset] = useState<AstronautSitePreset>(() => {
    if (initialSite) {
      // Find closest preset or match by name
      const nameMatch = ASTRONAUT_SITE_PRESETS.find(
        (p) =>
          initialSite.name?.toLowerCase().includes(p.id) ||
          p.name.toLowerCase().includes(initialSite.name?.toLowerCase() || '')
      );
      if (nameMatch) return nameMatch;
    }
    return ASTRONAUT_SITE_PRESETS[0]; // Jezero Crater default
  });

  // UI state
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [showHUD, setShowHUD] = useState<boolean>(true);
  const [visorFilter, setVisorFilter] = useState<'optical' | 'crism' | 'thermal' | 'night'>('optical');
  const [isSiteMenuOpen, setIsSiteMenuOpen] = useState<boolean>(false);
  const [isSampleCaddyOpen, setIsSampleCaddyOpen] = useState<boolean>(false);
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

  // Astronaut vitals & environment telemetry (Real-time simulated biometrics)
  const [heartRate, setHeartRate] = useState<number>(74);
  const [oxygenLevel, setOxygenLevel] = useState<number>(94.6);
  const [suitPressureKPa, setSuitPressureKPa] = useState<number>(29.6);
  const [batteryPct, setBatteryPct] = useState<number>(87);
  const [headingDeg, setHeadingDeg] = useState<number>(142);
  const [pitchDeg, setPitchDeg] = useState<number>(0);
  const [evaDurationSec, setEvaDurationSec] = useState<number>(1840);
  const [photoFlash, setPhotoFlash] = useState<boolean>(false);
  const [photoSavedNotice, setPhotoSavedNotice] = useState<string | null>(null);

  // 3D Canvas References
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const rocksGroupRef = useRef<THREE.Group | null>(null);
  const skyDomeRef = useRef<THREE.Mesh | null>(null);
  const sunMeshRef = useRef<THREE.Mesh | null>(null);
  const phobosMeshRef = useRef<THREE.Mesh | null>(null);
  const ecgCanvasRef = useRef<HTMLCanvasElement>(null);
  const laserBeamRef = useRef<THREE.Line | null>(null);

  // Astronaut navigation state (WASD, look, step)
  const cameraEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isPointerDown = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const keysDown = useRef<{ [key: string]: boolean }>({});
  const astronautPos = useRef(new THREE.Vector3(0, 1.75, 0)); // 1.75m eye level
  const walkStepTimer = useRef(0);
  const isWalkingRef = useRef(false);

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
      // Small realistic fluctuations
      setHeartRate((prev) => {
        const delta = (Math.random() - 0.5) * 2;
        return Math.round(Math.max(68, Math.min(88, prev + delta)));
      });
      setSuitPressureKPa((prev) => {
        const delta = (Math.random() - 0.5) * 0.04;
        return Number((Math.max(29.4, Math.min(29.8, prev + delta))).toFixed(2));
      });
      setOxygenLevel((prev) => Math.max(80, Number((prev - 0.002).toFixed(2))));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ECG Pulse canvas visualizer
  useEffect(() => {
    const canvas = ecgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let xOffset = 0;
    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    const renderECG = () => {
      ctx.fillStyle = 'rgba(10, 15, 20, 0.2)';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#06b6d4'; // Cyan glowing line
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#22d3ee';

      ctx.beginPath();
      for (let x = 0; x < width; x += 3) {
        const pos = (x + xOffset) % 120;
        let y = midY;
        if (pos > 40 && pos < 48) {
          y = midY - (pos - 40) * 3; // P wave
        } else if (pos >= 48 && pos < 56) {
          y = midY + (pos - 48) * 2;
        } else if (pos >= 60 && pos < 64) {
          y = midY - (pos - 60) * 8; // Q wave down
        } else if (pos >= 64 && pos < 70) {
          y = midY - 18 + (pos - 64) * 8; // R spike up
        } else if (pos >= 70 && pos < 76) {
          y = midY + 12 - (pos - 70) * 4; // S wave
        } else if (pos >= 88 && pos < 100) {
          y = midY - Math.sin((pos - 88) / 12 * Math.PI) * 5; // T wave
        }
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      xOffset = (xOffset + 1.2) % 120;
      animId = requestAnimationFrame(renderECG);
    };

    renderECG();
    return () => cancelAnimationFrame(animId);
  }, [heartRate]);

  // Handle keyboard walking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDown.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current[e.key.toLowerCase()] = false;
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
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Parse base color
    const r = (baseColorHex >> 16) & 255;
    const g = (baseColorHex >> 8) & 255;
    const b = baseColorHex & 255;

    // Fill base
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, 1024, 1024);

    // Multi-layer procedural regolith noise
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

    // Draw Martian ripple dunes
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 0; y < 1024; y += 32) {
      ctx.beginPath();
      ctx.ellipse(512, y, 600, 14, 0.05, 0, Math.PI * 2);
      ctx.fill();
    }

    // Small gravel speckles
    ctx.fillStyle = 'rgba(30, 15, 10, 0.35)';
    for (let k = 0; k < 600; k++) {
      const gx = Math.random() * 1024;
      const gy = Math.random() * 1024;
      const gr = 1 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 16);
    return tex;
  }, []);

  // Initialize Three.js 3D Surface Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Width and height
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(selectedSitePreset.skyColor, 0.008);

    // Camera (First-person perspective, ~75° FOV)
    const camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 800);
    camera.position.set(0, 1.75, 0); // Eye-level
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 1. Terrain Mesh (200m x 200m localized ground grid with realistic elevation noise)
    const terrainGeo = new THREE.PlaneGeometry(300, 300, 128, 128);
    terrainGeo.rotateX(-Math.PI / 2);

    // Deform vertices with realistic Martian crater and ripple relief
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      // Distance from center
      const dist = Math.sqrt(vx * vx + vz * vz);
      // Flat around astronaut standing point
      const centerDamp = Math.min(1, Math.max(0, (dist - 4) / 20));

      // Multi-octave terrain height
      const h1 = Math.sin(vx * 0.05) * Math.cos(vz * 0.05) * 2.2;
      const h2 = Math.sin(vx * 0.12 + 1.2) * Math.sin(vz * 0.12) * 0.8;
      const h3 = Math.cos(vx * 0.02 - vz * 0.02) * 4.5; // Distant hills / crater rim
      const craterLip = dist > 60 ? (dist - 60) * 0.09 : 0; // Gentle rim rising in distance

      posAttr.setY(i, (h1 + h2 + h3 + craterLip) * centerDamp);
    }
    terrainGeo.computeVertexNormals();

    const groundTex = createMartianGroundTexture(selectedSitePreset.groundColor);
    const terrainMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.95,
      metalness: 0.02,
      flatShading: false,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMeshRef.current = terrainMesh;
    scene.add(terrainMesh);

    // 2. Distant Horizon Mountain Ring (Simulating canyon walls / crater rims)
    const rimGeo = new THREE.CylinderGeometry(280, 290, 70, 48, 1, true);
    const rimMat = new THREE.MeshBasicMaterial({
      color: selectedSitePreset.groundColor,
      side: THREE.BackSide,
      fog: true,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = 15;
    scene.add(rimMesh);

    // 3. Martian Rocks & Outcrops Scatter
    const rocksGroup = new THREE.Group();
    rocksGroupRef.current = rocksGroup;
    const rockGeo = new THREE.DodecahedronGeometry(0.8, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: selectedSitePreset.groundColor,
      roughness: 0.9,
      metalness: 0.05,
    });

    // Seeded rock cluster around the scene
    const rockPositions = [
      { x: 3.2, z: -4.5, s: 1.4, targetIdx: 0 },
      { x: -5.1, z: -7.2, s: 2.1, targetIdx: 1 },
      { x: 7.8, z: -8.9, s: 1.8, targetIdx: 2 % selectedSitePreset.sampleTargets.length },
      { x: -2.8, z: 5.4, s: 1.2, targetIdx: 0 },
      { x: 6.2, z: 4.8, s: 2.4, targetIdx: 1 },
      { x: -8.4, z: -2.3, s: 3.1, targetIdx: 0 },
      { x: 12.0, z: -14.0, s: 4.2, targetIdx: 2 % selectedSitePreset.sampleTargets.length },
      { x: -14.0, z: -16.0, s: 3.8, targetIdx: 1 },
    ];

    rockPositions.forEach((pos, idx) => {
      const mesh = new THREE.Mesh(rockGeo, rockMat);
      mesh.position.set(pos.x, pos.s * 0.4, pos.z);
      mesh.scale.set(pos.s, pos.s * 0.7 + Math.random() * 0.4, pos.s * 1.1);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.userData = {
        isScanTarget: true,
        targetInfo: selectedSitePreset.sampleTargets[pos.targetIdx],
        distM: Number(Math.sqrt(pos.x * pos.x + pos.z * pos.z).toFixed(1)),
      };
      rocksGroup.add(mesh);
    });
    scene.add(rocksGroup);

    // 4. Rover Wheel Tracks & Astronaut Boot Prints
    const trackGeo = new THREE.PlaneGeometry(1.2, 24);
    trackGeo.rotateX(-Math.PI / 2);
    const trackMat = new THREE.MeshBasicMaterial({
      color: 0x421c0e,
      transparent: true,
      opacity: 0.45,
    });
    const trackLeft = new THREE.Mesh(trackGeo, trackMat);
    trackLeft.position.set(-1.2, 0.02, -10);
    const trackRight = new THREE.Mesh(trackGeo, trackMat);
    trackRight.position.set(1.2, 0.02, -10);
    scene.add(trackLeft);
    scene.add(trackRight);

    // 5. Sky Dome (Ochre / Butterscotch Mars sky)
    const skyGeo = new THREE.SphereGeometry(350, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      color: selectedSitePreset.skyColor,
      side: THREE.BackSide,
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    skyDomeRef.current = skyDome;
    scene.add(skyDome);

    // 6. The Sun on Mars (Smaller than on Earth, with authentic blue forward-scattering halo)
    const sunGroup = new THREE.Group();
    // Sun disk
    const sunDiskGeo = new THREE.SphereGeometry(4.5, 16, 16);
    const sunDiskMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sunDisk = new THREE.Mesh(sunDiskGeo, sunDiskMat);
    sunGroup.add(sunDisk);

    // Blue Mie-scattering halo (Mars Blue Sunset / Sun halo phenomenon)
    const haloGeo = new THREE.RingGeometry(4.6, 18.0, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x58a4d8, // Distinctive Martian sky cyan-blue halo
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.lookAt(camera.position);
    sunGroup.add(halo);

    sunGroup.position.set(180, 95, -180);
    sunMeshRef.current = sunGroup as any;
    scene.add(sunGroup);

    // 7. Phobos in the sky
    const phobosGeo = new THREE.DodecahedronGeometry(1.6, 1);
    const phobosMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    const phobosMesh = new THREE.Mesh(phobosGeo, phobosMat);
    phobosMesh.position.set(-120, 140, -140);
    phobosMeshRef.current = phobosMesh;
    scene.add(phobosMesh);

    // 8. Lighting
    const hemiLight = new THREE.HemisphereLight(
      selectedSitePreset.skyColor,
      selectedSitePreset.groundColor,
      0.85
    );
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, selectedSitePreset.sunIntensity);
    sunLight.position.set(180, 95, -180);
    scene.add(sunLight);

    // 9. Laser Scanning Beam Line
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0.2, -0.3, -0.4),
      new THREE.Vector3(0, 0, -5),
    ]);
    const laserMat = new THREE.LineBasicMaterial({
      color: 0x22c55e,
      linewidth: 3,
      transparent: true,
      opacity: 0,
    });
    const laserLine = new THREE.Line(laserGeo, laserMat);
    laserBeamRef.current = laserLine;
    camera.add(laserLine);
    scene.add(camera);

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Pointer events for looking around
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

      const deltaX = clientX - prevPointer.current.x;
      const deltaY = clientY - prevPointer.current.y;
      prevPointer.current = { x: clientX, y: clientY };

      // Look sensitivity
      const sens = 0.0032;
      cameraEuler.current.y -= deltaX * sens;
      cameraEuler.current.x -= deltaY * sens;
      // Clamp pitch between -70° and +75°
      cameraEuler.current.x = Math.max(-1.25, Math.min(1.35, cameraEuler.current.x));

      camera.quaternion.setFromEuler(cameraEuler.current);

      // Update HUD compass heading
      const deg = Math.round((-cameraEuler.current.y * (180 / Math.PI)) % 360);
      setHeadingDeg((deg + 360) % 360);
      setPitchDeg(Math.round(cameraEuler.current.x * (180 / Math.PI)));
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
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = Math.min(0.1, clock.getDelta());

      // Check walking movement
      const keys = keysDown.current;
      const moveVec = new THREE.Vector3(0, 0, 0);
      if (keys['w'] || keys['arrowup']) moveVec.z -= 1;
      if (keys['s'] || keys['arrowdown']) moveVec.z += 1;
      if (keys['a'] || keys['arrowleft']) moveVec.x -= 1;
      if (keys['d'] || keys['arrowright']) moveVec.x += 1;

      if (moveVec.lengthSq() > 0) {
        moveVec.normalize();
        isWalkingRef.current = true;
        const walkSpeed = 2.4 * delta; // 2.4 m/s suited astronaut trot

        // Transform movement into camera heading orientation
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraEuler.current.y);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraEuler.current.y);

        astronautPos.current.addScaledVector(forward, -moveVec.z * walkSpeed);
        astronautPos.current.addScaledVector(right, moveVec.x * walkSpeed);

        // Clamp inside 100m perimeter
        astronautPos.current.x = Math.max(-80, Math.min(80, astronautPos.current.x));
        astronautPos.current.z = Math.max(-80, Math.min(80, astronautPos.current.z));

        // Walking head bobbing and footsteps
        walkStepTimer.current += delta * 6;
        const bob = Math.sin(walkStepTimer.current) * 0.06;
        camera.position.set(astronautPos.current.x, 1.75 + bob, astronautPos.current.z);

        // Sound trigger every full step cycle
        if (Math.sin(walkStepTimer.current) > 0.95 && Math.random() < 0.25) {
          marsEvaAudio.playFootstep();
        }
      } else {
        isWalkingRef.current = false;
        camera.position.set(astronautPos.current.x, 1.75, astronautPos.current.z);
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
  }, [selectedSitePreset, createMartianGroundTexture]);

  // Update Visor Filter Color Grading
  useEffect(() => {
    if (!skyDomeRef.current || !terrainMeshRef.current || !sceneRef.current) return;
    const skyMat = skyDomeRef.current.material as THREE.MeshBasicMaterial;
    const terrainMat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;

    if (visorFilter === 'crism') {
      // False-color mineralogical highlighting (Cyan clays, green olivine, magenta hematite)
      skyMat.color.setHex(0x1e3a5f);
      terrainMat.color.setHex(0x00f0ff);
      sceneRef.current.fog = new THREE.FogExp2(0x1e3a5f, 0.012);
    } else if (visorFilter === 'thermal') {
      // FLIR Thermal infrared (Deep purple/black for cold terrain, yellow-white for sunlit rocks)
      skyMat.color.setHex(0x110222);
      terrainMat.color.setHex(0xffaa22);
      sceneRef.current.fog = new THREE.FogExp2(0x110222, 0.01);
    } else if (visorFilter === 'night') {
      // Starry Martian night
      skyMat.color.setHex(0x050711);
      terrainMat.color.setHex(0x1c1a24);
      sceneRef.current.fog = new THREE.FogExp2(0x050711, 0.006);
    } else {
      // Optical standard
      skyMat.color.setHex(selectedSitePreset.skyColor);
      terrainMat.color.setHex(0xffffff);
      sceneRef.current.fog = new THREE.FogExp2(selectedSitePreset.skyColor, 0.008);
    }
  }, [visorFilter, selectedSitePreset]);

  // Execute Laser LIBS / Raman Scan
  const handlePerformScan = () => {
    if (isScanning || !activeScanTarget) return;
    setIsScanning(true);
    marsEvaAudio.playLaserScan();

    // Animate green laser line
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
  };

  // Collect Core Sample into Caddy
  const handleCollectSample = () => {
    if (!activeScanTarget) return;
    marsEvaAudio.playSampleCollected();
    const newSample = {
      id: `CORE-${Date.now().toString().slice(-4)}`,
      targetName: activeScanTarget.name,
      sampleType: activeScanTarget.type,
      solTime: `Sol ${Math.floor(evaDurationSec / 60) + 1042} (EVA ${formatTimer(evaDurationSec)})`,
      locationName: selectedSitePreset.name,
      massGrams: Number((120 + Math.random() * 35).toFixed(1)),
      pdsCitation: activeScanTarget.pdsCitation,
    };
    setCollectedSamples((prev) => [newSample, ...prev]);
    setIsSampleCaddyOpen(true);
  };

  // Capture Snapshot / Photo mode
  const handleCapturePhoto = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    marsEvaAudio.playLaserScan();
    setPhotoFlash(true);
    setTimeout(() => setPhotoFlash(false), 200);

    try {
      const dataUrl = renderer.domElement.toDataURL('image/jpeg', 0.92);
      const link = document.createElement('a');
      link.download = `MARSWAY_EVA_${selectedSitePreset.id.toUpperCase()}_${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
      setPhotoSavedNotice('High-Res EVA Postcard Saved with Telemetry Stamp!');
      setTimeout(() => setPhotoSavedNotice(null), 3500);
    } catch (e) {
      console.warn('Screenshot capture failed:', e);
    }
  };

  // Switch location preset
  const handleSelectSitePreset = (site: AstronautSitePreset) => {
    setSelectedSitePreset(site);
    setIsSiteMenuOpen(false);
    astronautPos.current.set(0, 1.75, 0);
    cameraEuler.current.set(0, 0, 0);
    marsEvaAudio.playRadioClick();
  };

  // Toggle Audio
  const handleToggleAudio = () => {
    const muted = marsEvaAudio.toggleMute();
    setIsAudioMuted(muted);
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-black font-sans text-neutral-100">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-crosshair z-0" />

      {/* Photo Flash Effect */}
      {photoFlash && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200" />
      )}

      {/* Snapshot Saved Toast */}
      {photoSavedNotice && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{photoSavedNotice}</span>
        </div>
      )}

      {/* ASTRONAUT HELMET VISOR HUD OVERLAY */}
      {showHUD && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 sm:p-5">
          {/* Subtle curved helmet glass curvature border */}
          <div className="absolute inset-0 border-[6px] sm:border-[10px] border-neutral-900/40 rounded-[2.5rem] pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.7)]" />

          {/* TOP BAR: Compass Heading Tape & Return Navigation */}
          <div className="w-full flex items-center justify-between gap-1.5 sm:gap-3 pointer-events-auto">
            {/* Left: EVA Status & Site Selector Dropdown */}
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <div className="relative">
                <button
                  onClick={() => setIsSiteMenuOpen(!isSiteMenuOpen)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 border border-cyan-500/30 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 sm:gap-2 shadow-lg backdrop-blur-md transition cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="max-w-[110px] xs:max-w-[150px] sm:max-w-[260px] truncate">{selectedSitePreset.name.split('—')[0]}</span>
                  {isSiteMenuOpen ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                </button>

                {/* Site Dropdown */}
                {isSiteMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-neutral-950/95 border border-cyan-500/40 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-xl space-y-1">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 px-2 py-1">
                      Authoritative Landing Sites
                    </div>
                    {ASTRONAUT_SITE_PRESETS.map((site) => (
                      <button
                        key={site.id}
                        onClick={() => handleSelectSitePreset(site)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition flex flex-col gap-0.5 cursor-pointer ${
                          selectedSitePreset.id === site.id
                            ? 'bg-cyan-950/80 border border-cyan-500/60 text-white'
                            : 'hover:bg-neutral-900/80 text-neutral-300'
                        }`}
                      >
                        <span className="font-semibold text-white">{site.name}</span>
                        <div className="flex items-center justify-between text-[10px] text-neutral-400">
                          <span>{site.tag}</span>
                          <span className="font-mono text-cyan-300">
                            {site.lat > 0 ? `${site.lat.toFixed(1)}°N` : `${Math.abs(site.lat).toFixed(1)}°S`},{' '}
                            {site.lng > 0 ? `${site.lng.toFixed(1)}°E` : `${Math.abs(site.lng).toFixed(1)}°W`}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Coordinates & Elevation Badge */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-neutral-300 backdrop-blur-md">
                <span className="text-amber-400">ELEV: {selectedSitePreset.elevationM}m</span>
                <span className="text-neutral-500">|</span>
                <span>
                  {selectedSitePreset.lat.toFixed(2)}°, {selectedSitePreset.lng.toFixed(2)}°
                </span>
              </div>
            </div>

            {/* Center: Digital Azimuth Compass Tape */}
            <div className="flex flex-col items-center">
              <div className="px-4 py-1 rounded-xl bg-black/70 border border-cyan-500/40 backdrop-blur-md shadow-xl flex items-center gap-2 font-mono text-xs">
                <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                <span className="text-cyan-300 font-bold">{headingDeg.toString().padStart(3, '0')}°</span>
                <span className="text-neutral-400 text-[10px]">
                  {headingDeg >= 337.5 || headingDeg < 22.5 ? 'NORTH' :
                   headingDeg < 67.5 ? 'NE' :
                   headingDeg < 112.5 ? 'EAST' :
                   headingDeg < 157.5 ? 'SE' :
                   headingDeg < 202.5 ? 'SOUTH' :
                   headingDeg < 247.5 ? 'SW' :
                   headingDeg < 292.5 ? 'WEST' : 'NW'}
                </span>
                <span className="text-neutral-500">|</span>
                <span className="text-amber-300 text-[10px]">PITCH: {pitchDeg}°</span>
              </div>
            </div>

            {/* Right: Quick Mode Switch & Audio / Exit Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Audio Toggle */}
              <button
                onClick={handleToggleAudio}
                className={`p-2 rounded-xl border backdrop-blur-md transition shadow cursor-pointer ${
                  isAudioMuted
                    ? 'bg-red-950/60 border-red-500/40 text-red-400 hover:bg-red-900/60'
                    : 'bg-black/60 border-white/10 text-cyan-300 hover:bg-black/80'
                }`}
                title={isAudioMuted ? 'Unmute Martian Acoustics' : 'Mute Martian Acoustics'}
              >
                {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Photo Mode Snapshot */}
              <button
                onClick={handleCapturePhoto}
                className="p-2 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-amber-300 hover:text-white backdrop-blur-md transition shadow cursor-pointer"
                title="Capture EVA Photo Postcard"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Sample Caddy Drawer Button */}
              <button
                onClick={() => setIsSampleCaddyOpen(!isSampleCaddyOpen)}
                className="relative px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-xs font-medium text-emerald-300 backdrop-blur-md transition shadow flex items-center gap-1.5 cursor-pointer"
                title="Open Collected Rock Samples Caddy"
              >
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Samples</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                  {collectedSamples.length}
                </span>
              </button>

              {/* Switch to 3D Globe */}
              <button
                onClick={onSwitchTo3D}
                className="px-2.5 py-1.5 rounded-xl bg-orange-950/60 hover:bg-orange-900/80 border border-orange-500/40 text-orange-200 text-xs font-semibold backdrop-blur-md transition shadow flex items-center gap-1 cursor-pointer"
                title="Return to 3D Orbital Globe"
              >
                <Globe className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden sm:inline">Orbit Globe</span>
              </button>

              {/* Switch to 2D Map */}
              <button
                onClick={onSwitchTo2D}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-900/70 hover:bg-neutral-800 border border-white/10 text-neutral-200 text-xs font-semibold backdrop-blur-md transition shadow flex items-center gap-1 cursor-pointer"
                title="Switch to 2D Mercator Map"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Flat Map</span>
              </button>

              {/* Exit Button */}
              <button
                onClick={onExit}
                className="p-2 rounded-xl bg-black/70 hover:bg-red-950/80 border border-white/10 hover:border-red-500/40 text-neutral-300 hover:text-red-400 backdrop-blur-md transition shadow cursor-pointer"
                title="Exit Astronaut View"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CENTER: HUD Crosshair & Live Geological Target Scanner */}
          <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
            {/* Visor Reticle */}
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full border border-cyan-400/80" />
              <div className="absolute w-8 h-[1px] bg-cyan-400/60" />
              <div className="absolute h-8 w-[1px] bg-cyan-400/60" />
              {/* Outer corner ticks */}
              <div className="absolute inset-0 border border-cyan-400/30 rounded-lg animate-pulse" />
            </div>

            {/* Interactive Target Scanner Readout Box */}
            {activeScanTarget && (
              <div className="mt-4 pointer-events-auto bg-black/85 border border-cyan-500/60 rounded-2xl p-3 sm:p-4 max-w-sm sm:max-w-md shadow-2xl backdrop-blur-xl animate-fade-in text-neutral-200">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Laser LIBS Target Lock
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-400">
                    DIST: {activeScanTarget.distanceM}m
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-cyan-300">{activeScanTarget.name}</div>
                  <div className="text-[11px] text-neutral-400 font-mono">
                    Type: <span className="text-white">{activeScanTarget.type}</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/20">
                    {activeScanTarget.composition}
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    {activeScanTarget.significance}
                  </p>
                  <p className="text-[9px] text-neutral-500 font-mono truncate">
                    Ref: {activeScanTarget.pdsCitation}
                  </p>
                </div>

                {/* Science Action Buttons */}
                <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={handlePerformScan}
                    disabled={isScanning}
                    className="py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-900/50 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                    <span>{isScanning ? 'Firing Laser...' : 'Laser Pulse (LIBS)'}</span>
                  </button>

                  <button
                    onClick={handleCollectSample}
                    className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/50 cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Collect Core Tube</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM BAR: Astronaut Life Support (PLSS) Telemetry & Visor Filter Toggles */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 pointer-events-auto">
            {/* Left: Astronaut Biometrics & Life Support Panel */}
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-black/75 border border-cyan-500/30 backdrop-blur-xl shadow-2xl">
              {/* EKG Live Waveform */}
              <div className="flex items-center gap-2 px-2 border-r border-white/10">
                <canvas ref={ecgCanvasRef} width={80} height={28} className="rounded" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-red-400 font-mono">
                    <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
                    <span>{heartRate} BPM</span>
                  </div>
                  <span className="text-[9px] text-neutral-400 font-mono">NORMAL SINUS</span>
                </div>
              </div>

              {/* O2 & Pressure */}
              <div className="flex items-center gap-3 px-2 border-r border-white/10 text-xs font-mono">
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-400">O2 TANK</span>
                  <span className="text-cyan-300 font-bold">{oxygenLevel.toFixed(1)}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-400">SUIT P</span>
                  <span className="text-amber-300 font-bold">{suitPressureKPa} kPa</span>
                </div>
              </div>

              {/* Environment Conditions */}
              <div className="hidden sm:flex items-center gap-3 px-2 text-xs font-mono">
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-400">EXT TEMP</span>
                  <span className="text-blue-300 font-bold">-62°C</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-400">P_SURF</span>
                  <span className="text-indigo-300 font-bold">6.1 mbar</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-400">EVA CLOCK</span>
                  <span className="text-white font-bold">{formatTimer(evaDurationSec)}</span>
                </div>
              </div>
            </div>

            {/* Center: Walking Controls Reminder */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-[10px] font-mono text-neutral-400 backdrop-blur-md">
              <span className="text-cyan-400 font-bold">WASD / ARROWS:</span> Walk Around
              <span className="text-neutral-500">|</span>
              <span className="text-cyan-400 font-bold">MOUSE DRAG:</span> 360° Pan
            </div>

            {/* Right: Visor Optical Filter Mode Switcher */}
            <div className="flex items-center p-1 rounded-2xl bg-black/75 border border-white/15 backdrop-blur-xl shadow-2xl">
              <button
                onClick={() => setVisorFilter('optical')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  visorFilter === 'optical'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Standard Gold Anti-Glare EVA Visor"
              >
                Optical
              </button>
              <button
                onClick={() => setVisorFilter('crism')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  visorFilter === 'crism'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="CRISM Mineral False-Color Infrared Mode"
              >
                CRISM Mineral
              </button>
              <button
                onClick={() => setVisorFilter('thermal')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  visorFilter === 'thermal'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="FLIR Thermal Infrared Temperature Gradient"
              >
                FLIR Thermal
              </button>
              <button
                onClick={() => setVisorFilter('night')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  visorFilter === 'night'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Low-Light Night Reconnaissance Mode"
              >
                Night
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAMPLE TUBE CADDY DRAWER MODAL */}
      {isSampleCaddyOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-neutral-950/95 border-l border-emerald-500/40 z-50 p-5 flex flex-col shadow-2xl backdrop-blur-2xl animate-fade-in text-neutral-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                EVA Sample Return Caddy
              </h3>
            </div>
            <button
              onClick={() => setIsSampleCaddyOpen(false)}
              className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-neutral-400 mt-2 mb-4 leading-relaxed">
            Hermetically sealed Mars rock core tubes cached in spacesuit sampling rack for Mars Sample Return.
          </p>

          <div className="flex-1 overflow-y-auto space-y-3">
            {collectedSamples.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-xs">
                No samples collected yet. Aim your visor crosshair at any Martian rock and click "Collect Core Tube"!
              </div>
            ) : (
              collectedSamples.map((sample) => (
                <div
                  key={sample.id}
                  className="p-3 rounded-xl bg-neutral-900/80 border border-emerald-500/30 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      TUBE {sample.id}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {sample.massGrams}g
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white">{sample.targetName}</h4>
                  <div className="text-[11px] text-cyan-300 font-mono">{sample.sampleType}</div>
                  <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1 border-t border-white/5">
                    <span>{sample.solTime}</span>
                    <span className="truncate max-w-[120px]">{sample.locationName.split('—')[0]}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-white/10 text-[10px] font-mono text-neutral-400 text-center">
            NASA Planetary Protection Category IVb Certified
          </div>
        </div>
      )}

      {/* MINIMAL FLOATING TOGGLE HUD BUTTON (When user hides HUD for pure photo look) */}
      <button
        onClick={() => setShowHUD(!showHUD)}
        className="absolute bottom-4 right-4 z-20 p-2.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white shadow-xl backdrop-blur-md transition cursor-pointer"
        title={showHUD ? 'Hide Spacesuit HUD (Photo View)' : 'Show Spacesuit HUD'}
      >
        <Eye className="w-4 h-4 text-cyan-400" />
      </button>
    </div>
  );
};
