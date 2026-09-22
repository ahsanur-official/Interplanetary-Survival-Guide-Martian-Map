import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { calculateMarsDistanceMeters } from '../../engine/spatialMath';
import {
  Compass,
  Navigation,
  Crosshair,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Wind,
  Thermometer,
  Gauge,
  Sparkles,
  MapPin,
  Layers,
  Search,
  X,
  Undo,
  Play,
  CheckCircle2,
  Sun,
  Eye,
  Sliders,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Globe,
  Plus,
  ArrowUpRight,
  ExternalLink,
  Radio,
  Satellite,
  Camera,
  RefreshCw,
  AlertCircle,
  Mountain,
  Milestone,
  Droplets,
  Menu,
  ShieldAlert,
  Bot,
  CloudRain,
  Filter,
  ChevronUp,
} from 'lucide-react';
import { MARS_MISSIONS_DATA } from '../../data/marsMissions';
import { analyzeMarsLocationScience } from '../../engine/marsEnvironmentalAnalysis';
import { ALL_MARS_FEATURES, MarsFeature } from '../../data/marsNomenclature';
import {
  MARS_REGIONS,
  MARS_USGS_QUADRANGLES,
  MARS_GEOLOGICAL_REGIONS,
  MarsRegion,
  isPointInMarsRegion,
} from '../../data/marsRegions';
import {
  computeRealtimeMarsEphemeris,
  fetchLiveNASAWeather,
  fetchLatestNASARoverPhotos,
  MarsOrbitalTelemetry,
  MarsLiveWeather,
  NASAImageTelemetry,
} from '../../engine/nasaMarsService';
import { MarsCompassWidget } from './MarsCompassWidget';
import { MarsScaleBar } from './MarsScaleBar';
import { NASACloseUpModal } from './NASACloseUpModal';
import { MarsLayerControlPanel, MissionLayerOptions } from './MarsLayerControlPanel';
import { MarsRegionDetailModal } from './MarsRegionDetailModal';
import { Mars3DGlobe } from './Mars3DGlobe';
import { MarsScienceDossierModal } from './MarsScienceDossierModal';
import { MissionExplorerDrawer } from '../mission/MissionExplorerDrawer';
import { HumanMissionMode } from '../mission/HumanMissionMode';
import { MarsSearchModal } from '../common/MarsSearchModal';
import { MarsTopSearchBar } from './MarsTopSearchBar';
import { MarsTimeline } from '../common/MarsTimeline';
import { CompareSitesModal } from '../science/CompareSitesModal';
import { DataSourcesModal } from '../provenance/DataSourcesModal';
import { MarsBookmarksModal } from '../common/MarsBookmarksModal';
import { MarsMeasurementTool, MeasurementPoint } from './MarsMeasurementTool';
import { ElevationProfileModal } from '../science/ElevationProfileModal';
import {
  generateElevationTransect,
  PRESET_MARS_TRANSECTS,
  PresetTransect,
  ElevationTransectProfile,
  ElevationSamplePoint,
} from '../../engine/marsMolaElevation';
import { MarsPlatformTourModal } from '../common/MarsPlatformTourModal';
import { MarsPresentationMode } from '../common/MarsPresentationMode';
import { AskMarsWayModal } from '../common/AskMarsWayModal';
import { MarsLiveVoiceModal } from '../voice/MarsLiveVoiceModal';
import { marsSonification } from '../../engine/marsSonification';
import {
  Ruler,
  Bookmark,
  FileText,
  Volume2,
  VolumeX,
  Clock,
  ArrowRightLeft,
  ShieldCheck,
  Presentation,
  Globe2,
  Scale,
  TrendingUp,
} from 'lucide-react';
import { MarsDustStormLayerControl } from './MarsDustStormLayerControl';
import {
  getSeasonalDustSimulation,
  getAtmosphericTelemetryAtCoord,
  getTauColor,
  DustStormCell,
  AtmosphericPointTelemetry,
  SeasonalDustState,
} from '../../engine/marsAtmosphereDustModel';
import { EarthScaleComparisonModal } from '../science/EarthScaleComparisonModal';
import { MarsPlaceIdentifierModal } from './MarsPlaceIdentifierModal';
import { EARTH_MARS_COMPARISONS, EarthComparisonItem } from '../../data/earthMarsComparisons';

export interface MarsSite extends MarsFeature {
  mission?: string;
  elevation: number;
  category?: string;
  significance?: string;
  historicalContext?: string;
  scientificValue?: string;
  [key: string]: any;
}

export const FAMOUS_MARS_SITES: MarsSite[] = ALL_MARS_FEATURES.map((f) => ({
  ...f,
  elevation: f.elevationM,
  mission: f.missionOrIAUYear || f.type,
  category: f.type,
  significance: f.originName,
}));


// Actual Perseverance Rover key traverse waypoints in Jezero Crater
export const PERSEVERANCE_TRAVERSE_TRACK = [
  { lat: 18.4447, lng: 77.4509, sol: 0, name: 'Octavia E. Butler Landing' },
  { lat: 18.4350, lng: 77.4420, sol: 85, name: 'Séítah South Dunes' },
  { lat: 18.4410, lng: 77.4260, sol: 210, name: 'Artuby Ridge' },
  { lat: 18.4550, lng: 77.4110, sol: 410, name: 'Hawkes Bay Delta Front' },
  { lat: 18.4680, lng: 77.3950, sol: 680, name: 'Enchanted Lake Outcrops' },
  { lat: 18.4790, lng: 77.3820, sol: 890, name: 'Tenacity Hill Scarp' },
  { lat: 18.4870, lng: 77.3690, sol: 1150, name: 'Margin Carbonate Unit' },
];

export function RealMarsMap() {
  // Primary View Mode: '3d' (Full 3D Mars Planet in Space with Stars) or '2d' (Flat Mercator Map)
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const sitesLayerRef = useRef<L.LayerGroup | null>(null);
  const roverTrackLayerRef = useRef<L.LayerGroup | null>(null);
  const graticuleLayerRef = useRef<L.LayerGroup | null>(null);
  const regionsLayerRef = useRef<L.LayerGroup | null>(null);

  // Map Orientation / Bearing: 0 (North Up), 90 (East Up), 180 (South Up), 270 (West Up)
  const [bearing, setBearing] = useState<number>(0);
  const bearingRef = useRef<number>(0);
  useEffect(() => {
    bearingRef.current = bearing;
    if (mapContainerRef.current) {
      mapContainerRef.current.style.setProperty('--map-bearing', `${bearing}deg`);
    }
  }, [bearing]);

  // Stage measurement for full diagonal coverage without black edges when rotated
  const mapStageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 1200, h: 800 });

  useEffect(() => {
    const stage = mapStageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setStageSize({ w: Math.ceil(width), h: Math.ceil(height) });
        }
      }
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const stageDiagonal = useMemo(() => {
    return Math.ceil(Math.sqrt(stageSize.w * stageSize.w + stageSize.h * stageSize.h)) + 32;
  }, [stageSize.w, stageSize.h]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
    }
  }, [stageDiagonal]);

  // Basemap & Surface Display (Defaults to NASA Viking True Color / Natural Mosaic)
  const [activeLayer, setActiveLayer] = useState<'themis' | 'viking' | 'mola' | 'opm'>('viking');
  const [surfaceFilter, setSurfaceFilter] = useState<'normal' | 'contrast' | 'sharp' | 'dark' | 'night'>('normal');
  const [showSites, setShowSites] = useState<boolean>(true);
  const [showRoverTrack, setShowRoverTrack] = useState<boolean>(true);
  const [showGraticule, setShowGraticule] = useState<boolean>(false);

  // Esri-style Martian Nomenclature & Place Categorization State
  const [placeCategoryFilter, setPlaceCategoryFilter] = useState<'all' | 'mons' | 'crater' | 'chasma' | 'vallis' | 'planitia' | 'mission'>('all');
  const [isCategoryBarExpanded, setIsCategoryBarExpanded] = useState<boolean>(false);
  const [mapBoundsKey, setMapBoundsKey] = useState<number>(0);
  const [isEarthComparisonOpen, setIsEarthComparisonOpen] = useState<boolean>(false);
  const [selectedEarthComparisonId, setSelectedEarthComparisonId] = useState<string>('olympus_vs_everest');
  const [activeEarthComparison, setActiveEarthComparison] = useState<EarthComparisonItem | null>(null);
  const [isPlaceIdentifierOpen, setIsPlaceIdentifierOpen] = useState<boolean>(false);
  const [placeIdentifierFeature, setPlaceIdentifierFeature] = useState<MarsFeature | null>(null);
  const earthComparisonLayerRef = useRef<L.LayerGroup | null>(null);

  // Granular Mars Missions & Traverses Layer Control Panel State
  const [isMissionLayersPanelOpen, setIsMissionLayersPanelOpen] = useState<boolean>(false);
  const [missionLayerOptions, setMissionLayerOptions] = useState<MissionLayerOptions>({
    showAllMissions: true,
    showHistoricLandings: true,
    showActiveRovers: true,
    showTraverseTracks: true,
    enabledTraverseMissionIds: ['perseverance', 'curiosity', 'opportunity', 'spirit', 'zhurong'],
    agencyFilter: 'all',
    missionTypeFilter: 'all',
  });

  // Authentic Google Maps-style Boundary System State
  const [showRegions, setShowRegions] = useState<boolean>(true);
  const [regionDataset, setRegionDataset] = useState<'geological' | 'usgs'>('geological');
  const [isBordersMenuOpen, setIsBordersMenuOpen] = useState<boolean>(false);
  const [showRegionLabels, setShowRegionLabels] = useState<boolean>(true);
  const [selectedRegion, setSelectedRegion] = useState<MarsRegion | null>(null);
  const [isRegionDetailModalOpen, setIsRegionDetailModalOpen] = useState<boolean>(false);

  // Active boundaries dataset (Continuous 30 USGS Quadrangles or Geological Provinces)
  const activeRegions = useMemo(() => {
    return regionDataset === 'usgs' ? MARS_USGS_QUADRANGLES : MARS_GEOLOGICAL_REGIONS;
  }, [regionDataset]);

  // NASA In-Situ High-Res Close-Up Modal State
  const [isCloseUpModalOpen, setIsCloseUpModalOpen] = useState<boolean>(false);
  const [closeUpSearchTarget, setCloseUpSearchTarget] = useState<string>('Jezero Crater');

  // Mars Science Dossier Modal State (Water, Gas, Safety, Rain)
  const [isScienceDossierOpen, setIsScienceDossierOpen] = useState<boolean>(false);
  const [scienceDossierTarget, setScienceDossierTarget] = useState<{
    lat: number;
    lng: number;
    elevationM: number;
    name?: string;
    type?: string;
  } | null>(null);

  // Active modal/drawer tab: 'sites' | 'route' | 'layers' | 'weather' | 'search' | null
  const [activeTab, setActiveTab] = useState<'sites' | 'route' | 'layers' | 'weather' | 'search' | null>(null);

  // Desktop & Mobile Global Hamburger Navigation Drawer
  const [isHamburgerOpen, setIsHamburgerOpen] = useState<boolean>(false);

  // MarsWay Intelligence Modules & Tool Modals
  const [isMissionExplorerOpen, setIsMissionExplorerOpen] = useState<boolean>(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | undefined>(undefined);
  const [isHumanMissionModeOpen, setIsHumanMissionModeOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [compareSite1Id, setCompareSite1Id] = useState<string | undefined>('perseverance');
  const [compareSite2Id, setCompareSite2Id] = useState<string | undefined>('curiosity');
  const [isDataSourcesModalOpen, setIsDataSourcesModalOpen] = useState<boolean>(false);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState<boolean>(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState<boolean>(false);
  const [isPresentationModeOpen, setIsPresentationModeOpen] = useState<boolean>(false);
  const [isAskMarsWayOpen, setIsAskMarsWayOpen] = useState<boolean>(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState<boolean>(false);

  // GIS Distance & Area Measurement Tool State
  const [isMeasureToolOpen, setIsMeasureToolOpen] = useState<boolean>(false);
  const isMeasureToolOpenRef = useRef<boolean>(false);
  useEffect(() => {
    isMeasureToolOpenRef.current = isMeasureToolOpen;
  }, [isMeasureToolOpen]);

  const [measurePoints, setMeasurePoints] = useState<MeasurementPoint[]>([]);
  const [measureMode, setMeasureMode] = useState<'distance' | 'area'>('distance');
  const measureLayerRef = useRef<L.LayerGroup | null>(null);

  // MGS MOLA Elevation Profile Transect Tool State
  const [isElevationProfileOpen, setIsElevationProfileOpen] = useState<boolean>(false);
  const isElevationProfileOpenRef = useRef<boolean>(false);
  useEffect(() => {
    isElevationProfileOpenRef.current = isElevationProfileOpen;
  }, [isElevationProfileOpen]);

  const [isDrawingElevationLine, setIsDrawingElevationLine] = useState<boolean>(false);
  const isDrawingElevationLineRef = useRef<boolean>(false);
  useEffect(() => {
    isDrawingElevationLineRef.current = isDrawingElevationLine;
  }, [isDrawingElevationLine]);

  const [elevationPoints, setElevationPoints] = useState<Array<{ lat: number; lng: number; name?: string }>>([]);
  const elevationPointsRef = useRef<Array<{ lat: number; lng: number; name?: string }>>([]);
  useEffect(() => {
    elevationPointsRef.current = elevationPoints;
  }, [elevationPoints]);

  const [elevationProfile, setElevationProfile] = useState<ElevationTransectProfile | null>(null);
  const [hoveredElevationSample, setHoveredElevationSample] = useState<ElevationSamplePoint | null>(null);
  const elevationLayerRef = useRef<L.LayerGroup | null>(null);

  // Dust Storm & Atmospheric Opacity Simulation Layer State
  const [showDustStormOverlay, setShowDustStormOverlay] = useState<boolean>(false);
  const showDustStormOverlayRef = useRef<boolean>(false);
  useEffect(() => {
    showDustStormOverlayRef.current = showDustStormOverlay;
  }, [showDustStormOverlay]);

  const [isDustStormPanelOpen, setIsDustStormPanelOpen] = useState<boolean>(false);
  const [dustLayerOpacity, setDustLayerOpacity] = useState<number>(0.65);
  const [dustSimulationState, setDustSimulationState] = useState<SeasonalDustState>(() =>
    getSeasonalDustSimulation('realtime')
  );
  const dustSimulationStateRef = useRef<SeasonalDustState>(dustSimulationState);
  useEffect(() => {
    dustSimulationStateRef.current = dustSimulationState;
  }, [dustSimulationState]);

  const [showStormVortices, setShowStormVortices] = useState<boolean>(true);
  const [showWindVectors, setShowWindVectors] = useState<boolean>(true);
  const [inspectedAtmosphericPoint, setInspectedAtmosphericPoint] = useState<AtmosphericPointTelemetry | null>(null);
  const dustStormLayerRef = useRef<L.LayerGroup | null>(null);

  // Selected site
  const [selectedSite, setSelectedSite] = useState<MarsSite | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Live mouse or center coordinates
  const [cursorPos, setCursorPos] = useState<{ lat: number; lng: number; eastLng: number } | null>({
    lat: 18.38,
    lng: 77.58,
    eastLng: 77.58,
  });

  // Current zoom level tracker
  const [currentZoom, setCurrentZoom] = useState<number>(4);

  // Route Planning Activation: Map clicks ONLY add waypoints when TRUE
  const [isRoutePlanningActive, setIsRoutePlanningActive] = useState<boolean>(false);
  const isRoutePlanningActiveRef = useRef<boolean>(false);
  useEffect(() => {
    isRoutePlanningActiveRef.current = isRoutePlanningActive;
  }, [isRoutePlanningActive]);

  // Normal inspection point when tapping on Mars (without creating route)
  const [inspectedPoint, setInspectedPoint] = useState<{
    lat: number;
    lng: number;
    eastLng: number;
    nearestFeature?: MarsFeature;
    distToNearestKm?: number;
    containingRegion?: MarsRegion;
  } | null>(null);

  // Arrived surface location notification banner when diving from 3D
  const [arrivedSurfaceBanner, setArrivedSurfaceBanner] = useState<{ name: string; lat: number; lng: number } | null>(null);

  // Route Planning Waypoints
  const [routeWaypoints, setRouteWaypoints] = useState<{ lat: number; lng: number; name: string }[]>([]);
  const [routeStats, setRouteStats] = useState<{ distanceKm: number; estHours: number } | null>(null);

  // Category Filter for All Martian Features
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Real-time NASA Ephemeris & Live Telemetry
  const [ephemeris, setEphemeris] = useState<MarsOrbitalTelemetry>(() => computeRealtimeMarsEphemeris());
  const [liveWeather, setLiveWeather] = useState<MarsLiveWeather[]>([]);
  const [roverPhotos, setRoverPhotos] = useState<NASAImageTelemetry[]>([]);
  const [isLoadingNASA, setIsLoadingNASA] = useState<boolean>(false);
  const [activeWeatherStation, setActiveWeatherStation] = useState<'perseverance' | 'insight'>('perseverance');

  const currentWeather = useMemo(() => {
    if (liveWeather.length === 0) return null;
    return liveWeather[0];
  }, [liveWeather]);

  // Features inside the currently selected region (Google Maps-style Area Content)
  const featuresInsideSelectedRegion = useMemo(() => {
    if (!selectedRegion) return [];
    return ALL_MARS_FEATURES.filter((f) =>
      isPointInMarsRegion(f.lat, f.lng, selectedRegion.polygon)
    );
  }, [selectedRegion]);

  // Real-time update loop for NASA orbital ephemeris and data
  useEffect(() => {
    const ephemerisTimer = setInterval(() => {
      setEphemeris(computeRealtimeMarsEphemeris());
    }, 4000);

    const loadNASAData = async () => {
      setIsLoadingNASA(true);
      try {
        const [weatherData, photosData] = await Promise.all([
          fetchLiveNASAWeather(),
          fetchLatestNASARoverPhotos(),
        ]);
        setLiveWeather(weatherData);
        setRoverPhotos(photosData);
      } catch (err) {
        console.error('NASA Telemetry sync error:', err);
      } finally {
        setIsLoadingNASA(false);
      }
    };

    loadNASAData();

    return () => clearInterval(ephemerisTimer);
  }, []);

  // Filtered sites by Category and Search
  const filteredSites = useMemo(() => {
    let list = FAMOUS_MARS_SITES;
    if (selectedCategory !== 'All') {
      list = list.filter((s) => s.category === selectedCategory || s.type === selectedCategory);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.mission && s.mission.toLowerCase().includes(q)) ||
        (s.significance && s.significance.toLowerCase().includes(q)) ||
        s.description.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q))
    );
  }, [searchQuery, selectedCategory]);


  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      crs: L.CRS.EPSG4326,
      center: [18.38, 77.58],
      zoom: 3,
      minZoom: 1,
      maxZoom: 20,
      maxBounds: [
        [-90, -180],
        [90, 180],
      ],
      maxBoundsViscosity: 0.8,
      attributionControl: false,
      zoomControl: false,
      worldCopyJump: false,
      inertia: true,
      inertiaDeceleration: 3200,
      inertiaMaxSpeed: Infinity,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      bounceAtZoomLimits: false,
    });

    mapInstanceRef.current = map;
    setMapInstance(map);

    // Override mouseEventToContainerPoint so coordinates and clicks are 100% accurate when rotated
    const origMouseEventToContainerPoint = map.mouseEventToContainerPoint.bind(map);
    map.mouseEventToContainerPoint = function (e: MouseEvent) {
      const curBearing = bearingRef.current;
      if (curBearing === 0) {
        return origMouseEventToContainerPoint(e);
      }
      const container = map.getContainer();
      const stage = mapStageRef.current;
      if (!stage || !container) {
        return origMouseEventToContainerPoint(e);
      }
      const stageRect = stage.getBoundingClientRect();
      const screenCenterX = stageRect.left + stageRect.width / 2;
      const screenCenterY = stageRect.top + stageRect.height / 2;

      const dx = e.clientX - screenCenterX;
      const dy = e.clientY - screenCenterY;

      // Container is visually rotated by -curBearing; rotate screen delta by +curBearing to map back to local
      const rad = (curBearing * Math.PI) / 180;
      const localDx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const localDy = dx * Math.sin(rad) + dy * Math.cos(rad);

      const containerCenterX = container.clientWidth / 2;
      const containerCenterY = container.clientHeight / 2;

      return new L.Point(containerCenterX + localDx, containerCenterY + localDy);
    };

    // Patch Leaflet Draggable so dragging smoothly tracks cursor on screen when map is rotated
    const draggable = (map.dragging as any)?._draggable;
    if (draggable) {
      const origOnMove = draggable._onMove.bind(draggable);
      draggable._onMove = function (e: any) {
        const curBearing = bearingRef.current;
        if (curBearing === 0) {
          return origOnMove(e);
        }
        if (!this._enabled) return;
        if (e.touches && e.touches.length > 1) {
          this._moved = true;
          return;
        }
        const first = e.touches && e.touches.length === 1 ? e.touches[0] : e;
        const offset = new L.Point(first.clientX, first.clientY).subtract(this._startPoint);
        if (!offset.x && !offset.y) return;
        if (Math.abs(offset.x) + Math.abs(offset.y) < this.options.clickTolerance) return;

        offset.x /= this._parentScale.x;
        offset.y /= this._parentScale.y;

        if (e.preventDefault) e.preventDefault();

        if (!this._moved) {
          this.fire('dragstart');
          this._moved = true;
          L.DomUtil.addClass(document.body, 'leaflet-dragging');
          this._lastTarget = e.target || e.srcElement;
          L.DomUtil.addClass(this._lastTarget, 'leaflet-drag-target');
        }

        const rad = (curBearing * Math.PI) / 180;
        const rotOffsetX = offset.x * Math.cos(rad) - offset.y * Math.sin(rad);
        const rotOffsetY = offset.x * Math.sin(rad) + offset.y * Math.cos(rad);

        this._newPos = this._startPos.add(new L.Point(rotOffsetX, rotOffsetY));
        this._moving = true;
        this._lastEvent = e;
        L.Util.cancelAnimFrame(this._animRequest);
        this._animRequest = L.Util.requestAnimFrame(this._updatePosition, this, true);
      };
    }

    // Keep zoom state and bounds updated on map interaction
    map.on('moveend zoomend dragend', () => {
      setCurrentZoom(map.getZoom());
      setMapBoundsKey((prev) => prev + 1);
    });

    // Layer groups
    regionsLayerRef.current = L.layerGroup().addTo(map);
    sitesLayerRef.current = L.layerGroup().addTo(map);
    roverTrackLayerRef.current = L.layerGroup().addTo(map);
    routeMarkersLayerRef.current = L.layerGroup().addTo(map);
    graticuleLayerRef.current = L.layerGroup().addTo(map);
    measureLayerRef.current = L.layerGroup().addTo(map);
    earthComparisonLayerRef.current = L.layerGroup().addTo(map);
    elevationLayerRef.current = L.layerGroup().addTo(map);
    dustStormLayerRef.current = L.layerGroup().addTo(map);

    // Mouse / Touch tracker
    const updateCoordinates = (lat: number, rawLng: number) => {
      let lng = rawLng;
      lng = ((((lng + 180) % 360) + 360) % 360) - 180;
      const eastLng = (lng + 360) % 360;
      setCursorPos({
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        eastLng: Number(eastLng.toFixed(4)),
      });
    };

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      updateCoordinates(e.latlng.lat, e.latlng.lng);
    });

    map.on('move', () => {
      const center = map.getCenter();
      updateCoordinates(center.lat, center.lng);
    });

    // Map click / tap -> adds route waypoints, measurement points, or inspects feature
    map.on('click', (e: L.LeafletMouseEvent) => {
      let lng = e.latlng.lng;
      lng = ((((lng + 180) % 360) + 360) % 360) - 180;
      const lat = Number(e.latlng.lat.toFixed(4));
      const cleanLng = Number(lng.toFixed(4));
      const eastLng = Number(((cleanLng + 360) % 360).toFixed(4));

      if (isDrawingElevationLineRef.current) {
        // Drawing Elevation Profile Line: drop Point A or Point B
        const currentPoints = elevationPointsRef.current;
        if (currentPoints.length === 0 || currentPoints.length >= 2) {
          // Drop Point A
          const ptA = {
            lat,
            lng: cleanLng,
            name: `Point A (${lat >= 0 ? `${lat}°N` : `${Math.abs(lat)}°S`}, ${cleanLng >= 0 ? `${cleanLng}°E` : `${Math.abs(cleanLng)}°W`})`,
          };
          setElevationPoints([ptA]);
          setElevationProfile(null);
          marsSonification.sonifyLocation(lat * 100, 2);
        } else {
          // Drop Point B and calculate MOLA elevation transect
          const ptA = currentPoints[0];
          const ptB = {
            lat,
            lng: cleanLng,
            name: `Point B (${lat >= 0 ? `${lat}°N` : `${Math.abs(lat)}°S`}, ${cleanLng >= 0 ? `${cleanLng}°E` : `${Math.abs(cleanLng)}°W`})`,
          };
          setElevationPoints([ptA, ptB]);
          const profile = generateElevationTransect(
            ptA.lat,
            ptA.lng,
            ptB.lat,
            ptB.lng,
            120,
            ptA.name,
            ptB.name
          );
          setElevationProfile(profile);
          setIsElevationProfileOpen(true);
          setIsDrawingElevationLine(false);
          marsSonification.sonifyLocation(profile.maxElevationM, profile.maxSlopeDeg);
        }
      } else if (isMeasureToolOpenRef.current) {
        // Measurement tool active: drop measurement pin
        setMeasurePoints((prev) => [...prev, { lat, lng: cleanLng }]);
      } else if (isRoutePlanningActiveRef.current) {
        // Explicit route planning mode active: add waypoint
        setRouteWaypoints((prev) => [
          ...prev,
          {
            lat,
            lng: cleanLng,
            name: `WP ${prev.length + 1}`,
          },
        ]);
      } else {
        // Exploration mode: inspect location without adding any route waypoints!
        let nearest: MarsFeature | undefined;
        let minDistMeters = Infinity;
        for (const f of ALL_MARS_FEATURES) {
          const dist = calculateMarsDistanceMeters(
            { latitude: lat, longitude: cleanLng },
            { latitude: f.lat, longitude: f.lng }
          );
          if (dist < minDistMeters) {
            minDistMeters = dist;
            nearest = f;
          }
        }
        const regionFound =
          activeRegions.find((r) => isPointInMarsRegion(lat, cleanLng, r.polygon)) ||
          MARS_USGS_QUADRANGLES.find((r) => isPointInMarsRegion(lat, cleanLng, r.polygon)) ||
          MARS_REGIONS.find((r) => isPointInMarsRegion(lat, cleanLng, r.polygon));
        setInspectedPoint({
          lat,
          lng: cleanLng,
          eastLng,
          nearestFeature: nearest,
          distToNearestKm: Math.round(minDistMeters / 1000),
          containingRegion: regionFound,
        });

        // Sample real-time atmospheric opacity probe if dust storm layer is active
        if (showDustStormOverlayRef.current) {
          const atmoTelemetry = getAtmosphericTelemetryAtCoord(
            lat,
            cleanLng,
            dustSimulationStateRef.current.currentLs,
            dustSimulationStateRef.current.globalStormActive
          );
          setInspectedAtmosphericPoint(atmoTelemetry);
        }
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      regionsLayerRef.current = null;
      measureLayerRef.current = null;
      elevationLayerRef.current = null;
      dustStormLayerRef.current = null;
    };
  }, []);

  // Render Measurement Tool Pins & Lines on Map
  useEffect(() => {
    const layer = measureLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!isMeasureToolOpen || measurePoints.length === 0) return;

    // Draw markers
    measurePoints.forEach((pt, idx) => {
      const markerHtml = `
        <div class="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500 border-2 border-white text-[10px] font-bold text-neutral-950 shadow-lg font-mono">
          ${idx + 1}
        </div>
      `;
      const icon = L.divIcon({
        html: markerHtml,
        className: 'measure-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([pt.lat, pt.lng], { icon }).addTo(layer);
    });

    // Draw path or polygon
    const latlngs: [number, number][] = measurePoints.map((p) => [p.lat, p.lng]);
    if (measureMode === 'distance' && latlngs.length >= 2) {
      L.polyline(latlngs, {
        color: '#06b6d4',
        weight: 3,
        dashArray: '6, 6',
        opacity: 0.9,
      }).addTo(layer);
    } else if (measureMode === 'area' && latlngs.length >= 3) {
      L.polygon(latlngs, {
        color: '#06b6d4',
        fillColor: '#0891b2',
        fillOpacity: 0.3,
        weight: 2,
      }).addTo(layer);
    }
  }, [isMeasureToolOpen, measurePoints, measureMode]);

  // Render MGS MOLA Elevation Profile Transect on Map
  useEffect(() => {
    const layer = elevationLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!isElevationProfileOpen && elevationPoints.length === 0 && !isDrawingElevationLine) return;

    // Render Point A
    if (elevationPoints.length >= 1) {
      const ptA = elevationPoints[0];
      const markerHtmlA = `
        <div class="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 border-2 border-white text-xs font-bold text-neutral-950 shadow-xl font-mono ring-2 ring-emerald-400/80 animate-bounce">
          A
        </div>
      `;
      const iconA = L.divIcon({
        html: markerHtmlA,
        className: 'elevation-pin-a',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([ptA.lat, ptA.lng], { icon: iconA })
        .bindTooltip(`Point A (Start): ${ptA.name || `${ptA.lat}°N, ${ptA.lng}°E`}`, {
          permanent: false,
          direction: 'top',
        })
        .addTo(layer);
    }

    // Render Point B
    if (elevationPoints.length >= 2) {
      const ptB = elevationPoints[1];
      const markerHtmlB = `
        <div class="flex items-center justify-center w-7 h-7 rounded-full bg-rose-500 border-2 border-white text-xs font-bold text-neutral-950 shadow-xl font-mono ring-2 ring-rose-400/80 animate-bounce">
          B
        </div>
      `;
      const iconB = L.divIcon({
        html: markerHtmlB,
        className: 'elevation-pin-b',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([ptB.lat, ptB.lng], { icon: iconB })
        .bindTooltip(`Point B (End): ${ptB.name || `${ptB.lat}°N, ${ptB.lng}°E`}`, {
          permanent: false,
          direction: 'top',
        })
        .addTo(layer);
    }

    // Render Geodesic Line between A and B
    if (elevationProfile && elevationProfile.samples.length > 0) {
      const sampleCoords: [number, number][] = elevationProfile.samples.map((s) => [s.lat, s.lng]);

      // Outer dark halo for contrast against any Martian surface
      L.polyline(sampleCoords, {
        color: '#000000',
        weight: 6,
        opacity: 0.7,
      }).addTo(layer);

      // Inner glowing transect path
      L.polyline(sampleCoords, {
        color: '#38bdf8',
        weight: 3.5,
        dashArray: '8, 5',
        opacity: 0.95,
      }).addTo(layer);
    } else if (elevationPoints.length >= 2) {
      L.polyline(
        [
          [elevationPoints[0].lat, elevationPoints[0].lng],
          [elevationPoints[1].lat, elevationPoints[1].lng],
        ],
        {
          color: '#38bdf8',
          weight: 3,
          dashArray: '6, 4',
          opacity: 0.9,
        }
      ).addTo(layer);
    }

    // Render Synchronized Hover Beacon on Map
    if (hoveredElevationSample) {
      const hoverMarkerHtml = `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute inset-0 rounded-full animate-ping opacity-80" style="background-color: ${hoveredElevationSample.difficultyColor};"></div>
          <div class="w-4 h-4 rounded-full border-2 border-white shadow-2xl flex items-center justify-center" style="background-color: ${hoveredElevationSample.difficultyColor};">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
      `;
      const hoverIcon = L.divIcon({
        html: hoverMarkerHtml,
        className: 'hover-transect-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const hoverMarker = L.marker([hoveredElevationSample.lat, hoveredElevationSample.lng], { icon: hoverIcon }).addTo(layer);
      hoverMarker.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px; padding: 2px 4px;">
          <div style="font-weight: bold; color: #ffffff;">Dist: ${hoveredElevationSample.distanceKm} km | Elev: ${hoveredElevationSample.elevationM > 0 ? `+${hoveredElevationSample.elevationM}` : hoveredElevationSample.elevationM}m</div>
          <div style="color: ${hoveredElevationSample.difficultyColor};">Slope: ${hoveredElevationSample.slopeDeg}° (${hoveredElevationSample.difficultyLabel})</div>
        </div>`,
        { permanent: true, direction: 'top', offset: [0, -10] }
      );
    }
  }, [isElevationProfileOpen, elevationPoints, elevationProfile, hoveredElevationSample, isDrawingElevationLine]);

  // Handle Preset Elevation Transect Selection
  const handleSelectElevationPreset = (preset: PresetTransect) => {
    setElevationPoints([preset.start, preset.end]);
    const prof = generateElevationTransect(
      preset.start.lat,
      preset.start.lng,
      preset.end.lat,
      preset.end.lng,
      120,
      preset.start.name,
      preset.end.name
    );
    setElevationProfile(prof);
    setIsElevationProfileOpen(true);
    setIsDrawingElevationLine(false);

    // Orient map to fit both endpoints
    const map = mapInstanceRef.current;
    if (map) {
      map.fitBounds(
        [
          [preset.start.lat, preset.start.lng],
          [preset.end.lat, preset.end.lng],
        ],
        { padding: [80, 80], maxZoom: 6 }
      );
    }
    marsSonification.sonifyLocation(prof.maxElevationM, prof.maxSlopeDeg);
  };

  // Reverse Elevation Transect Points (A <-> B)
  const handleReverseElevationPoints = () => {
    if (elevationPoints.length < 2) return;
    const ptA = elevationPoints[1];
    const ptB = elevationPoints[0];
    setElevationPoints([ptA, ptB]);
    const prof = generateElevationTransect(
      ptA.lat,
      ptA.lng,
      ptB.lat,
      ptB.lng,
      120,
      ptA.name,
      ptB.name
    );
    setElevationProfile(prof);
  };

  // Fly to active dust storm vortex
  const handleFlyToStorm = (lat: number, lng: number, name: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([lat, lng], 5, { duration: 1.5 });
    const telemetry = getAtmosphericTelemetryAtCoord(
      lat,
      lng,
      dustSimulationState.currentLs,
      dustSimulationState.globalStormActive
    );
    setInspectedAtmosphericPoint(telemetry);
    marsSonification.sonifyLocation(telemetry.elevationM, 15);
  };

  // Render Real-time Dust Storm & Atmospheric Opacity Simulation on Leaflet Map
  useEffect(() => {
    const layer = dustStormLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showDustStormOverlay) return;

    // 1. Regional and Global Optical Depth (Tau) Grid Cells
    const samplingPoints: Array<{ lat: number; lng: number; radiusKm: number; label: string }> = [
      // Major Basins & Lowlands (Deep atmospheric columns & storm nurseries)
      { lat: -42.5, lng: 70.5, radiusKm: 1100, label: 'Hellas Planitia (Deep Vortex)' },
      { lat: -49.7, lng: 316.0, radiusKm: 800, label: 'Argyre Planitia' },
      { lat: 26.5, lng: 320.0, radiusKm: 850, label: 'Chryse Planitia' },
      { lat: 12.9, lng: 87.0, radiusKm: 750, label: 'Isidis Planitia' },
      { lat: 49.7, lng: 118.0, radiusKm: 900, label: 'Utopia Planitia' },
      { lat: 4.5, lng: 135.6, radiusKm: 700, label: 'Elysium Planitia' },
      { lat: 47.0, lng: 192.0, radiusKm: 800, label: 'Arcadia Planitia' },
      { lat: 50.0, lng: 340.0, radiusKm: 850, label: 'Acidalia Planitia' },
      { lat: 70.0, lng: 0.0, radiusKm: 1200, label: 'Vastitas Borealis' },
      // Highland & Volcanic Regions
      { lat: -27.0, lng: 270.0, radiusKm: 750, label: 'Solis Planum' },
      { lat: -10.0, lng: 335.0, radiusKm: 750, label: 'Margaritifer Terra' },
      { lat: 20.0, lng: 30.0, radiusKm: 850, label: 'Arabia Terra' },
      { lat: -45.0, lng: 30.0, radiusKm: 850, label: 'Noachis Terra' },
      { lat: 0.0, lng: 248.0, radiusKm: 950, label: 'Tharsis Montes' },
      { lat: 18.6, lng: 226.2, radiusKm: 650, label: 'Olympus Mons' },
      { lat: -14.0, lng: 300.0, radiusKm: 800, label: 'Valles Marineris' },
      { lat: -78.0, lng: 0.0, radiusKm: 1100, label: 'Planum Australe (South Polar Margin)' },
      { lat: 82.0, lng: 0.0, radiusKm: 900, label: 'Planum Boreum (North Polar Margin)' },
      // Surface Rover In-situ stations
      { lat: 18.38, lng: 77.58, radiusKm: 450, label: 'Jezero Crater (Perseverance MEDA Station)' },
      { lat: -4.59, lng: 137.44, radiusKm: 450, label: 'Gale Crater (Curiosity REMS Station)' },
    ];

    // Regular global coordinate sampling
    for (let gLat = -60; gLat <= 60; gLat += 30) {
      for (let gLng = -160; gLng <= 160; gLng += 40) {
        samplingPoints.push({
          lat: gLat,
          lng: gLng,
          radiusKm: 750,
          label: `Atmospheric Sector [${gLat >= 0 ? `${gLat}°N` : `${Math.abs(gLat)}°S`}, ${gLng >= 0 ? `${gLng}°E` : `${Math.abs(gLng)}°W`}]`,
        });
      }
    }

    samplingPoints.forEach((pt) => {
      const telemetry = getAtmosphericTelemetryAtCoord(
        pt.lat,
        pt.lng,
        dustSimulationState.currentLs,
        dustSimulationState.globalStormActive
      );

      const color = getTauColor(telemetry.tau, dustLayerOpacity);
      const fillOpacity = Math.min(0.88, Math.max(0.08, (telemetry.tau / 2.6) * dustLayerOpacity));

      const circle = L.circle([pt.lat, pt.lng], {
        radius: pt.radiusKm * 1000,
        color: telemetry.tau > 1.2 ? telemetry.hazardColor : '#f97316',
        weight: telemetry.tau > 1.5 ? 1.5 : 0.4,
        opacity: Math.min(0.8, fillOpacity + 0.15),
        fillColor: color,
        fillOpacity: fillOpacity,
        dashArray: telemetry.tau > 2.0 ? '4, 4' : undefined,
      });

      circle.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px; padding: 4px; line-height: 1.4;">
          <div style="font-weight: bold; color: #ffffff;">${pt.label}</div>
          <div style="color: ${telemetry.hazardColor}; font-weight: bold;">Optical Depth: τ ${telemetry.tau} (${telemetry.dustHazardLevel} Risk)</div>
          <div style="color: #cbd5e1;">Visibility: ${telemetry.visibilityKm} km | Solar Flux: -${telemetry.solarAttenuationPercent}%</div>
          <div style="color: #94a3b8; font-size: 10px;">Elev: ${telemetry.elevationM > 0 ? `+${telemetry.elevationM}` : telemetry.elevationM}m • Click for Full Probe</div>
        </div>`,
        { permanent: false, direction: 'top' }
      );

      circle.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setInspectedAtmosphericPoint(telemetry);
        setIsDustStormPanelOpen(true);
      });

      circle.addTo(layer);
    });

    // 2. Active Dust Storm Vortices & Cyclones
    if (showStormVortices && dustSimulationState.activeStorms.length > 0) {
      dustSimulationState.activeStorms.forEach((storm) => {
        // Outer Expanding Dust Front
        L.circle([storm.lat, storm.lng], {
          radius: storm.radiusKm * 1000,
          color: '#ef4444',
          weight: 2,
          dashArray: '6, 6',
          fillColor: '#b91c1c',
          fillOpacity: Math.min(0.65, 0.35 * dustLayerOpacity),
        }).addTo(layer);

        // Inner Cyclonic Core
        L.circle([storm.lat, storm.lng], {
          radius: storm.radiusKm * 380,
          color: '#f97316',
          weight: 1.5,
          fillColor: '#ea580c',
          fillOpacity: Math.min(0.85, 0.6 * dustLayerOpacity),
        }).addTo(layer);

        // Eye Center Rotating Badge
        const stormBadgeHtml = `
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/95 border border-red-500 shadow-2xl text-white font-mono text-[10.5px] cursor-pointer hover:scale-105 transition-transform whitespace-nowrap">
            <span class="inline-block animate-spin text-orange-400">🌪️</span>
            <span class="font-bold text-red-200">${storm.name.split(' ')[0]} Vortex</span>
            <span class="px-1.5 py-0.2 rounded bg-red-600 font-bold text-white text-[10px]">τ ${storm.peakTau}</span>
          </div>
        `;
        const stormIcon = L.divIcon({
          html: stormBadgeHtml,
          className: 'storm-vortex-badge',
          iconSize: [160, 28],
          iconAnchor: [80, 14],
        });

        const stormMarker = L.marker([storm.lat, storm.lng], { icon: stormIcon }).addTo(layer);

        stormMarker.bindTooltip(
          `<div style="font-family: monospace; font-size: 11px; padding: 4px; max-width: 250px;">
            <div style="font-weight: bold; color: #ef4444;">${storm.name}</div>
            <div style="color: #fb923c; font-weight: bold;">Status: ${storm.status} (Peak τ ${storm.peakTau})</div>
            <div style="color: #cbd5e1; font-size: 10px; margin-top: 2px;">Drift: ${storm.driftVelocityKmH} km/h • Radius: ~${storm.radiusKm} km</div>
            <div style="color: #94a3b8; font-size: 10px; margin-top: 3px;">${storm.description}</div>
          </div>`,
          { permanent: false, direction: 'top' }
        );

        stormMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          const tel = getAtmosphericTelemetryAtCoord(
            storm.lat,
            storm.lng,
            dustSimulationState.currentLs,
            dustSimulationState.globalStormActive
          );
          setInspectedAtmosphericPoint(tel);
          setIsDustStormPanelOpen(true);
        });
      });
    }

    // 3. Seasonal Wind Vector Streamlines
    if (showWindVectors) {
      const windVectors: Array<{ from: [number, number]; to: [number, number]; label: string }> = [
        { from: [40, 60], to: [-30, 70], label: 'Northerly Lowland Outflow to Hellas Basin' },
        { from: [30, 310], to: [-40, 316], label: 'Acidalia-Chryse Outflow Streamline' },
        { from: [-65, 120], to: [-45, 80], label: 'South Polar Katabatic Circulation' },
        { from: [-65, 300], to: [-45, 310], label: 'Argyre Catabatic Wind Vector' },
        { from: [20, 100], to: [5, 85], label: 'Isidis-Syrtis Thermal Slope Wind' },
        { from: [0, 240], to: [-20, 260], label: 'Tharsis Downslope Thermal Wind' },
      ];

      windVectors.forEach((vec) => {
        L.polyline([vec.from, vec.to], {
          color: '#38bdf8',
          weight: 2,
          dashArray: '6, 6',
          opacity: 0.65 * dustLayerOpacity,
        })
          .bindTooltip(`Seasonal Wind Drift: ${vec.label}`, { direction: 'center' })
          .addTo(layer);
      });
    }

    // 4. Probed Location Pin
    if (inspectedAtmosphericPoint) {
      const probeMarkerHtml = `
        <div class="relative flex items-center justify-center w-8 h-8 pointer-events-none">
          <div class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: ${inspectedAtmosphericPoint.hazardColor};"></div>
          <div class="w-5 h-5 rounded-full border-2 border-white shadow-2xl flex items-center justify-center font-mono font-bold text-[9px] text-white" style="background-color: ${inspectedAtmosphericPoint.hazardColor};">
            τ
          </div>
        </div>
      `;
      const probeIcon = L.divIcon({
        html: probeMarkerHtml,
        className: 'probe-atmospheric-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([inspectedAtmosphericPoint.lat, inspectedAtmosphericPoint.lng], { icon: probeIcon })
        .bindTooltip(
          `<div style="font-family: monospace; font-size: 11px;">
            <strong>Atmospheric Probe: τ ${inspectedAtmosphericPoint.tau}</strong><br/>
            ${inspectedAtmosphericPoint.dustHazardLevel} Risk (${inspectedAtmosphericPoint.visibilityKm} km visibility)
          </div>`,
          { permanent: true, direction: 'top', offset: [0, -10] }
        )
        .addTo(layer);
    }
  }, [
    showDustStormOverlay,
    dustLayerOpacity,
    dustSimulationState,
    showStormVortices,
    showWindVectors,
    inspectedAtmosphericPoint,
  ]);


  // Update Basemap Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let newTileLayer: L.TileLayer;

    if (activeLayer === 'themis') {
      newTileLayer = L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018/1.0.0/default/default028mm/{z}/{y}/{x}.png',
        {
          minZoom: 1,
          maxNativeZoom: 8,
          maxZoom: 20,
          attribution: 'NASA Odyssey THEMIS 100m Controlled Mosaic',
          noWrap: false,
          updateWhenIdle: false,
        }
      );
    } else if (activeLayer === 'viking') {
      newTileLayer = L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        {
          minZoom: 1,
          maxNativeZoom: 7,
          maxZoom: 20,
          attribution: 'NASA Mars Trek / Viking MDIM2.1',
          noWrap: false,
          updateWhenIdle: false,
        }
      );
    } else if (activeLayer === 'mola') {
      newTileLayer = L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        {
          minZoom: 1,
          maxNativeZoom: 7,
          maxZoom: 20,
          attribution: 'NASA MGS MOLA Elevation',
          noWrap: false,
          updateWhenIdle: false,
        }
      );
    } else {
      newTileLayer = L.tileLayer.wms(
        'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map',
        {
          layers: 'mola_color',
          format: 'image/jpeg',
          attribution: 'USGS Astrogeology Mars MOLA',
          minZoom: 1,
          maxZoom: 20,
        }
      );
    }

    newTileLayer.addTo(map);
  }, [activeLayer]);

  // Update Graticule (Lat/Long Grid)
  useEffect(() => {
    const graticuleGroup = graticuleLayerRef.current;
    if (!graticuleGroup) return;
    graticuleGroup.clearLayers();

    if (!showGraticule) return;

    const equator = L.polyline([[-0, -180], [0, 180]], {
      color: '#f97316',
      weight: 1.5,
      opacity: 0.6,
      dashArray: '4, 4',
    });
    graticuleGroup.addLayer(equator);

    [-60, -30, 30, 60].forEach((lat) => {
      const line = L.polyline([[lat, -180], [lat, 180]], {
        color: '#64748b',
        weight: 1,
        opacity: 0.35,
        dashArray: '3, 6',
      });
      graticuleGroup.addLayer(line);
    });

    [-120, -60, 0, 60, 120].forEach((lng) => {
      const line = L.polyline([[-85, lng], [85, lng]], {
        color: '#64748b',
        weight: 1,
        opacity: 0.35,
        dashArray: '3, 6',
      });
      graticuleGroup.addLayer(line);
    });
  }, [showGraticule]);

  // Render Google Maps-style Regional Boundaries & Quadrangles
  useEffect(() => {
    const map = mapInstanceRef.current;
    const regionsGroup = regionsLayerRef.current;
    if (!map || !regionsGroup) return;

    regionsGroup.clearLayers();

    if (!showRegions) return;

    activeRegions.forEach((region) => {
      const isSelected = selectedRegion?.id === region.id;
      const countInside = ALL_MARS_FEATURES.filter((f) =>
        isPointInMarsRegion(f.lat, f.lng, region.polygon)
      ).length;

      // Authentic Google Maps boundary rendering:
      // Normal: subtle hairline border (#cbd5e1, 1.2px) with ZERO background fill
      // Selected: signature Google Maps Red outline (#ea4335, 2.8px) with subtle 6% tint
      const polygon = L.polygon(region.polygon, {
        color: isSelected ? '#ea4335' : '#cbd5e1',
        weight: isSelected ? 2.8 : 1.2,
        opacity: isSelected ? 1 : 0.65,
        dashArray: isSelected ? undefined : '3, 4',
        fill: isSelected,
        fillColor: '#ea4335',
        fillOpacity: isSelected ? 0.06 : 0,
      });

      polygon.on('mouseover', () => {
        if (selectedRegion?.id !== region.id) {
          polygon.setStyle({
            color: '#1a73e8', // Google Blue
            weight: 2,
            opacity: 1,
            dashArray: undefined,
            fill: true,
            fillColor: '#1a73e8',
            fillOpacity: 0.04,
          });
        }
      });

      polygon.on('mouseout', () => {
        if (selectedRegion?.id !== region.id) {
          polygon.setStyle({
            color: '#cbd5e1',
            weight: 1.2,
            opacity: 0.65,
            dashArray: '3, 4',
            fill: false,
            fillOpacity: 0,
          });
        }
      });

      polygon.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedRegion(region);
        map.fitBounds(polygon.getBounds(), {
          padding: [50, 50],
          maxZoom: 7,
        });
      });

      polygon.bindTooltip(
        `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2px 4px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: #ea4335;"></span>
            <span style="font-weight: 700; font-size: 11px; color: #f8fafc;">${region.name}</span>
          </div>
          <div style="font-size: 9.5px; color: #94a3b8; margin-top: 2px;">
            ${region.category} • ${region.areaKm2.toLocaleString()} km² • ${countInside} features inside
          </div>
          <div style="font-size: 8.5px; color: #38bdf8; margin-top: 1px;">
            Click to select & inspect area
          </div>
        </div>`,
        {
          sticky: true,
          className: 'mars-google-tooltip',
        }
      );

      regionsGroup.addLayer(polygon);

      // Clean Google Maps-style typography labels on satellite map
      if (showRegionLabels) {
        const shortLabel = region.quadCode
          ? `${region.quadCode}: ${region.name.replace(/ \(MC-\d+\)/, '')}`
          : region.name
              .replace(' Basin', '')
              .replace(' System', '')
              .replace(' Plateau', '')
              .replace(' Northern Lowlands', '');

        const labelIcon = L.divIcon({
          className: 'mars-google-label',
          html: `
            <div class="mars-google-label-inner" style="
              display: inline-flex;
              align-items: center;
              gap: 4px;
              color: #f1f5f9;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 10px;
              font-weight: 600;
              letter-spacing: 0.03em;
              text-shadow: 0 1px 3px rgba(0,0,0,0.95), 0 0 3px #000;
              white-space: nowrap;
              pointer-events: none;
              transform: translate(-50%, -50%) rotate(var(--map-bearing, 0deg));
              transform-origin: center center;
              transition: transform 0.45s cubic-bezier(0.2, 0, 0, 1);
              opacity: ${isSelected ? 1 : 0.85};
            ">
              <span>${shortLabel}</span>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const labelMarker = L.marker(region.center, {
          icon: labelIcon,
          interactive: false,
        });

        regionsGroup.addLayer(labelMarker);
      }
    });
  }, [showRegions, regionDataset, showRegionLabels, selectedRegion, mapInstance]);

  // Render Earth Scale Comparison Overlay Stencil on Map (Esri Explore Mars Signature)
  useEffect(() => {
    const layerGroup = earthComparisonLayerRef.current;
    if (!layerGroup || !mapInstanceRef.current) return;
    layerGroup.clearLayers();

    if (!activeEarthComparison) return;

    const { centerLat, centerLng, radiusKm, lengthKm, widthKm } = activeEarthComparison.overlayBoundsKm;

    if (activeEarthComparison.overlayType === 'circle' && radiusKm) {
      const earthCircle = L.circle([centerLat, centerLng], {
        radius: radiusKm * 1000,
        color: activeEarthComparison.color,
        weight: 3,
        dashArray: '8, 8',
        fillColor: activeEarthComparison.color,
        fillOpacity: 0.22,
      });

      earthCircle.bindTooltip(
        `<div style="font-family: system-ui, sans-serif; font-size: 11px; padding: 4px; line-height: 1.4;">
          <b style="color: ${activeEarthComparison.color};">🔵 Earth Comparison Stencil</b><br/>
          <span style="font-weight: 600; color: #f8fafc;">${activeEarthComparison.earthName}</span><br/>
          <span style="color: #94a3b8; font-size: 10px;">${activeEarthComparison.ratioSummary}</span>
        </div>`,
        { permanent: true, direction: 'center', className: 'earth-scale-tooltip' }
      );

      layerGroup.addLayer(earthCircle);
    } else if (activeEarthComparison.overlayType === 'rectangle' && lengthKm && widthKm) {
      const dLat = (widthKm / 2) / 59.2;
      const dLng = (lengthKm / 2) / 59.2;

      const bounds: L.LatLngBoundsExpression = [
        [centerLat - dLat, centerLng - dLng],
        [centerLat + dLat, centerLng + dLng],
      ];

      const earthRect = L.rectangle(bounds, {
        color: activeEarthComparison.color,
        weight: 3,
        dashArray: '8, 8',
        fillColor: activeEarthComparison.color,
        fillOpacity: 0.25,
      });

      earthRect.bindTooltip(
        `<div style="font-family: system-ui, sans-serif; font-size: 11px; padding: 4px; line-height: 1.4;">
          <b style="color: ${activeEarthComparison.color};">🔵 Earth Grand Canyon Stencil</b><br/>
          <span style="font-weight: 600; color: #f8fafc;">446 km long × 29 km wide</span><br/>
          <span style="color: #94a3b8; font-size: 10px;">Placed inside Valles Marineris (4,000 km)</span>
        </div>`,
        { permanent: true, direction: 'center', className: 'earth-scale-tooltip' }
      );

      layerGroup.addLayer(earthRect);
    }
  }, [activeEarthComparison]);

  // Render Martian Nomenclature, Landmarks & Planetary Landing Sites
  useEffect(() => {
    const sitesGroup = sitesLayerRef.current;
    const map = mapInstanceRef.current;
    if (!sitesGroup) return;
    sitesGroup.clearLayers();

    if (!showSites || !missionLayerOptions.showAllMissions) return;

    // Viewport bounds detection for zoom-in area visibility
    const mapBounds = map ? map.getBounds() : null;
    const bufferedBounds = mapBounds ? mapBounds.pad(0.12) : null;

    // TIER 1: Prime iconic landmarks shown at global view (zoom <= 3, 1x zoom)
    // Only top universally recognized landmarks are shown at 1x to ensure a clean, uncluttered view
    const TIER_1_GLOBAL_IDS = new Set([
      'olympus_mons',      // Olympus Mons (Tallest volcano in Solar System)
      'valles_marineris',  // Valles Marineris (Grand Canyon of Mars)
      'perseverance',      // Perseverance Rover (Jezero Crater)
      'curiosity',         // Curiosity Rover (Gale Crater / Mount Sharp)
      'hellas_planitia',   // Hellas Planitia (Deepest impact basin)
      'elysium_mons',      // Elysium Mons
      'opportunity',       // Opportunity Rover (Meridiani Planum)
      'viking1',           // Viking 1 (First successful soft landing)
    ]);

    // TIER 2: Major Regional Landmarks revealed when zooming to zoom >= 4 in the visible area
    const TIER_2_REGIONAL_IDS = new Set([
      'ascraeus_mons',
      'pavonis_mons',
      'arsia_mons',
      'alba_mons',
      'hecates_tholus',
      'albor_tholus',
      'apollinaris_mons',
      'korolev',
      'schiaparelli_crater',
      'huygens_crater',
      'cassini_crater',
      'galle_crater',
      'spirit',
      'phoenix',
      'insight',
      'pathfinder',
      'zhurong',
      'viking2',
      'argyre_planitia',
      'utopia_planitia',
      'isidis_planitia',
      'tharsis_montes',
      'planum_boreum',
      'planum_australe',
    ]);

    // TIER 3: Local Canyons, Craters & Vallis revealed when zooming to zoom >= 6 in the visible area
    const TIER_3_LOCAL_IDS = new Set([
      'melas_chasma',
      'candor_chasma',
      'coprates_chasma',
      'ius_chasma',
      'tithonium_chasma',
      'echus_chasma',
      'kasei_valles',
      'ares_vallis',
      'mawrth_vallis',
      'victoria_crater',
      'endeavour_crater',
      'gusev_crater',
      'beagle2',
      'mars3',
      'chryse_planitia',
      'amazonis_planitia',
      'elysium_planitia',
      'terra_sabaea',
      'arabia_terra',
      'noachis_terra',
    ]);

    // Screen-space collision prevention: ensure markers never overlap or hide each other
    const placedScreenPoints: { x: number; y: number }[] = [];
    const minCollisionDistPx = currentZoom <= 3 ? 55 : currentZoom <= 5 ? 42 : currentZoom <= 7 ? 32 : 20;

    // Prioritize selected site and featured sites first
    const sitesToProcess = [...FAMOUS_MARS_SITES].sort((a, b) => {
      if (selectedSite?.id === a.id) return -1;
      if (selectedSite?.id === b.id) return 1;
      if (TIER_1_GLOBAL_IDS.has(a.id) && !TIER_1_GLOBAL_IDS.has(b.id)) return -1;
      if (!TIER_1_GLOBAL_IDS.has(a.id) && TIER_1_GLOBAL_IDS.has(b.id)) return 1;
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });

    sitesToProcess.forEach((site) => {
      const isSelected = selectedSite?.id === site.id;

      // 1. Viewport Clipping: If not selected, only render features in the currently visible map area!
      if (!isSelected && bufferedBounds && !bufferedBounds.contains([site.lat, site.lng])) {
        return;
      }

      // Check mission category filters
      const isMissionSite =
        site.type.includes('Rover') ||
        site.type.includes('Lander') ||
        site.category?.includes('Mission') ||
        site.category?.includes('Lander') ||
        site.category?.includes('Rover');

      if (isMissionSite) {
        if (!missionLayerOptions.showHistoricLandings && !site.type.includes('Active')) {
          const isHistoric =
            site.id.includes('viking') ||
            site.id.includes('pathfinder') ||
            site.id.includes('spirit') ||
            site.id.includes('opportunity') ||
            site.id.includes('phoenix') ||
            site.id.includes('insight') ||
            site.id.includes('mars2') ||
            site.id.includes('mars3') ||
            site.id.includes('beagle');
          if (isHistoric && !isSelected) return;
        }

        if (!missionLayerOptions.showActiveRovers && !isSelected) {
          const isActive = site.id === 'perseverance' || site.id === 'curiosity';
          if (isActive) return;
        }

        // Agency filter
        if (missionLayerOptions.agencyFilter !== 'all' && !isSelected) {
          const matchedMission = MARS_MISSIONS_DATA.find(
            (m) => m.id === site.id || site.name.toLowerCase().includes(m.name.toLowerCase())
          );
          if (matchedMission) {
            const isNasa = matchedMission.agency.includes('NASA');
            if (missionLayerOptions.agencyFilter === 'nasa' && !isNasa) return;
            if (
              missionLayerOptions.agencyFilter === 'international' &&
              isNasa &&
              !matchedMission.agency.includes('ESA') &&
              !matchedMission.agency.includes('CNSA')
            )
              return;
          }
        }

        // Type filter
        if (missionLayerOptions.missionTypeFilter !== 'all' && !isSelected) {
          if (missionLayerOptions.missionTypeFilter === 'rover' && !site.type.toLowerCase().includes('rover')) return;
          if (missionLayerOptions.missionTypeFilter === 'lander' && !site.type.toLowerCase().includes('lander')) return;
        }
      }

      // Place Category Quick Filter (overrides LOD when active)
      const siteTypeLower = (site.type || '').toLowerCase();
      if (placeCategoryFilter !== 'all') {
        if (
          placeCategoryFilter === 'mons' &&
          !siteTypeLower.includes('mons') &&
          !siteTypeLower.includes('volcano') &&
          !siteTypeLower.includes('tholus')
        )
          return;
        if (placeCategoryFilter === 'crater' && !siteTypeLower.includes('crater')) return;
        if (
          placeCategoryFilter === 'chasma' &&
          !siteTypeLower.includes('chasma') &&
          !siteTypeLower.includes('canyon') &&
          !siteTypeLower.includes('fossa')
        )
          return;
        if (placeCategoryFilter === 'vallis' && !siteTypeLower.includes('vallis') && !siteTypeLower.includes('valley'))
          return;
        if (
          placeCategoryFilter === 'planitia' &&
          !siteTypeLower.includes('planitia') &&
          !siteTypeLower.includes('plain') &&
          !siteTypeLower.includes('basin') &&
          !siteTypeLower.includes('terra')
        )
          return;
        if (placeCategoryFilter === 'mission' && !isMissionSite) return;
      } else if (!isSelected) {
        // Dynamic Zoom-Level LOD Decluttering:
        // "1x a thakle import name show korbe but zoom in korle ek ek kore sob jaigar name show korbe mane emon hobe je je jaiga zoom in kortici setar name show korbe"
        if (currentZoom <= 3) {
          // At 1x / global view, show ONLY Tier 1 prime landmarks
          if (!TIER_1_GLOBAL_IDS.has(site.id)) return;
        } else if (currentZoom < 5) {
          // At zoom 4: show Tier 1 + Tier 2 regional landmarks in the zoomed area
          if (!TIER_1_GLOBAL_IDS.has(site.id) && !TIER_2_REGIONAL_IDS.has(site.id)) return;
        } else if (currentZoom < 7) {
          // At zoom 5-6: show Tier 1, 2, and Tier 3 local landmarks in the zoomed area
          if (!TIER_1_GLOBAL_IDS.has(site.id) && !TIER_2_REGIONAL_IDS.has(site.id) && !TIER_3_LOCAL_IDS.has(site.id)) return;
        }
        // At zoom >= 7 (all the way up to 20x high zoom): show all detailed places in the zoomed area!
      }

      // Check collision in screen pixel space to ensure places don't overlap or hide each other
      if (map && !isSelected) {
        try {
          const pt = map.latLngToContainerPoint([site.lat, site.lng]);
          const isColliding = placedScreenPoints.some((p) => {
            const dx = p.x - pt.x;
            const dy = p.y - pt.y;
            return Math.sqrt(dx * dx + dy * dy) < minCollisionDistPx;
          });
          if (isColliding) return;
          placedScreenPoints.push({ x: pt.x, y: pt.y });
        } catch {
          // fallback if map point calculation is unavailable
        }
      }

      const isActiveRover = site.id === 'perseverance' || site.id === 'curiosity';

      // Determine Category Glyph, Color & Formatting
      let categoryGlyph = '📍';
      let formattedName = site.name.split('(')[0].trim();
      let metricBadge = '';
      let accentBorder = 'border-orange-500/70';
      let accentGlow = 'rgba(249, 115, 22, 0.4)';

      if (siteTypeLower.includes('mons') || siteTypeLower.includes('volcano') || siteTypeLower.includes('tholus')) {
        categoryGlyph = '🌋';
        accentBorder = 'border-rose-500/80';
        accentGlow = 'rgba(244, 63, 94, 0.5)';
        if (site.elevation !== undefined) {
          const km = (site.elevation / 1000).toFixed(1);
          metricBadge = site.elevation > 0 ? `+${km}km` : `${km}km`;
        }
      } else if (siteTypeLower.includes('crater')) {
        categoryGlyph = '☄️';
        accentBorder = 'border-purple-500/80';
        accentGlow = 'rgba(168, 85, 247, 0.5)';
        if (site.diameterKm) {
          metricBadge = `Ø${site.diameterKm}km`;
        }
      } else if (siteTypeLower.includes('chasma') || siteTypeLower.includes('canyon')) {
        categoryGlyph = '🏜️';
        accentBorder = 'border-blue-500/80';
        accentGlow = 'rgba(59, 130, 246, 0.5)';
        if (site.diameterKm) {
          metricBadge = `${site.diameterKm}km`;
        }
      } else if (siteTypeLower.includes('vallis') || siteTypeLower.includes('valley')) {
        categoryGlyph = '🌊';
        accentBorder = 'border-teal-500/80';
        accentGlow = 'rgba(20, 184, 166, 0.5)';
      } else if (siteTypeLower.includes('planitia') || siteTypeLower.includes('plain') || siteTypeLower.includes('basin')) {
        categoryGlyph = '🪐';
        accentBorder = 'border-amber-500/80';
        accentGlow = 'rgba(245, 158, 11, 0.5)';
      } else if (siteTypeLower.includes('terra') || siteTypeLower.includes('highland')) {
        categoryGlyph = '🏔️';
        accentBorder = 'border-orange-500/80';
        accentGlow = 'rgba(249, 115, 22, 0.5)';
      } else if (siteTypeLower.includes('polar') || siteTypeLower.includes('ice')) {
        categoryGlyph = '❄️';
        accentBorder = 'border-cyan-400/80';
        accentGlow = 'rgba(6, 182, 212, 0.5)';
      } else if (isMissionSite) {
        categoryGlyph = '🚀';
        accentBorder = 'border-emerald-500/80';
        accentGlow = 'rgba(16, 185, 129, 0.5)';
        if (isActiveRover) {
          metricBadge = 'Active';
        }
      }

      const iconHtml = `
        <div class="mars-carto-pin group relative select-none cursor-pointer flex items-center justify-center" style="transform: translate(-50%, -50%) rotate(var(--map-bearing, 0deg)); transform-origin: center center; transition: transform 0.35s ease;">
          <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all duration-200 backdrop-blur-md ${
            isSelected
              ? 'bg-[#060a12]/95 border-2 border-orange-400 shadow-2xl scale-115 z-30'
              : 'bg-[#080d18]/85 hover:bg-[#080d18]/95 border ' + accentBorder + ' hover:border-white shadow-lg hover:scale-108 z-10'
          }" style="box-shadow: 0 4px 16px rgba(0,0,0,0.85), 0 0 10px ${isSelected ? 'rgba(249, 115, 22, 0.7)' : accentGlow};">
            <span class="text-[10.5px] leading-none">${categoryGlyph}</span>
            <span class="text-[10.5px] font-bold text-neutral-100 whitespace-nowrap tracking-tight" style="text-shadow: 0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.9);">
              ${formattedName}
            </span>
            ${
              metricBadge
                ? `<span class="text-[8.5px] font-mono font-bold px-1 py-0.2 rounded ${
                    isActiveRover
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                      : 'bg-black/50 text-neutral-300 border border-neutral-700/60'
                  }">${metricBadge}</span>`
                : ''
            }
            ${
              isActiveRover
                ? `<span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>`
                : ''
            }
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'mars-carto-icon-wrapper',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([site.lat, site.lng], { icon: customIcon });

      marker.bindTooltip(
        `<div style="font-family: system-ui, sans-serif; font-size: 11px; padding: 4px; line-height: 1.4;">
          <b style="color: #f97316;">${site.name}</b> <span style="color:#94a3b8; font-size: 10px;">(${site.type})</span><br/>
          <span style="color: #e2e8f0;">${site.originName || site.significance}</span><br/>
          <span style="color: #38bdf8; font-family: monospace;">Elevation: ${site.elevation > 0 ? '+' : ''}${site.elevation.toLocaleString()}m</span>
          ${site.diameterKm ? `<br/><span style="color: #c084fc; font-family: monospace;">Span: ${site.diameterKm.toLocaleString()} km</span>` : ''}
        </div>`,
        { className: 'mars-tooltip', direction: 'top', offset: [0, -12] }
      );

      marker.on('click', () => {
        setSelectedSite(site);
        setPlaceIdentifierFeature(site);
        setIsPlaceIdentifierOpen(true);
        mapInstanceRef.current?.flyTo([site.lat, site.lng], Math.max(currentZoom, 5), { duration: 1.0 });
      });

      sitesGroup.addLayer(marker);
    });
  }, [showSites, selectedSite, missionLayerOptions, currentZoom, placeCategoryFilter, mapBoundsKey]);

  // Render Rover Historical Traverse Tracks (Perseverance, Curiosity, Opportunity, etc.)
  useEffect(() => {
    const roverGroup = roverTrackLayerRef.current;
    if (!roverGroup) return;
    roverGroup.clearLayers();

    if (!showRoverTrack || !missionLayerOptions.showTraverseTracks) return;

    // Iterate through all missions with traverseTrack
    const missionsWithTracks = MARS_MISSIONS_DATA.filter((m) => m.traverseTrack && m.traverseTrack.length > 0);

    missionsWithTracks.forEach((mission) => {
      // Check if this rover's traverse is enabled in missionLayerOptions
      if (!missionLayerOptions.enabledTraverseMissionIds.includes(mission.id)) {
        return;
      }

      const track = mission.traverseTrack!;
      const latLngs: [number, number][] = track.map((pt) => [pt.lat, pt.lng]);

      const trackColor = mission.id === 'perseverance' ? '#f97316' : mission.id === 'curiosity' ? '#38bdf8' : '#eab308';

      const trackPolyline = L.polyline(latLngs, {
        color: trackColor,
        weight: 3.5,
        opacity: 0.9,
        dashArray: '6, 6',
      });
      roverGroup.addLayer(trackPolyline);

      track.forEach((wp) => {
        const wpIcon = L.divIcon({
          html: `<div class="w-2.5 h-2.5 rounded-full border border-white shadow" style="background-color: ${trackColor};"></div>`,
          className: 'rover-wp',
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });
        const wpMarker = L.marker([wp.lat, wp.lng], { icon: wpIcon });
        wpMarker.bindTooltip(
          `<b>${wp.name}</b><br/><span style="color:${trackColor};">${mission.name}</span> Sol ${wp.sol}<br/><span style="font-size:10px;color:#a3a3a3;">${wp.discovery}</span>`,
          { className: 'mars-tooltip' }
        );
        roverGroup.addLayer(wpMarker);
      });
    });
  }, [showRoverTrack, missionLayerOptions]);

  // Render User Planned Route & Waypoints
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = routeMarkersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (routeWaypoints.length === 0) {
      setRouteStats(null);
      return;
    }

    // Render waypoint markers
    routeWaypoints.forEach((wp, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === routeWaypoints.length - 1 && routeWaypoints.length > 1;

      const wpIcon = L.divIcon({
        html: `
          <div class="mars-waypoint-badge flex items-center justify-center w-6 h-6 rounded-full font-bold text-[10px] text-white shadow-lg border-2 ${
            isStart
              ? 'bg-emerald-600 border-white'
              : isEnd
              ? 'bg-red-600 border-white'
              : 'bg-cyan-600 border-cyan-200'
          }" style="transform: rotate(var(--map-bearing, 0deg)); transform-origin: center center; transition: transform 0.45s cubic-bezier(0.2, 0, 0, 1);">
            ${idx + 1}
          </div>
        `,
        className: 'route-wp-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([wp.lat, wp.lng], { icon: wpIcon });
      marker.bindTooltip(`Waypoint ${idx + 1}<br/>${wp.lat.toFixed(2)}°, ${wp.lng.toFixed(2)}°`, {
        className: 'mars-tooltip',
      });
      markersGroup.addLayer(marker);
    });

    if (routeWaypoints.length < 2) {
      setRouteStats(null);
      return;
    }

    const latLngs: [number, number][] = routeWaypoints.map((w) => [w.lat, w.lng]);
    const polyline = L.polyline(latLngs, {
      color: '#38bdf8',
      weight: 4,
      opacity: 0.95,
      dashArray: '8, 4',
    }).addTo(map);

    routePolylineRef.current = polyline;

    let totalMeters = 0;
    for (let i = 0; i < routeWaypoints.length - 1; i++) {
      const p1 = { latitude: routeWaypoints[i].lat, longitude: routeWaypoints[i].lng };
      const p2 = { latitude: routeWaypoints[i + 1].lat, longitude: routeWaypoints[i + 1].lng };
      totalMeters += calculateMarsDistanceMeters(p1, p2);
    }

    const km = totalMeters / 1000;
    const hours = km / 3.2; // Marswalk walking speed ~ 3.2 km/h

    setRouteStats({
      distanceKm: Number(km.toFixed(2)),
      estHours: Number(hours.toFixed(1)),
    });
  }, [routeWaypoints]);

  // Fly to site - AUTO-CLOSES MODAL to immediately show the target
  const handleFlyTo = (site: MarsSite | MarsFeature, zoomLevel = 6) => {
    const fullSite: MarsSite = {
      ...site,
      elevation: (site as any).elevation ?? (site as any).elevationM ?? 0,
      category: (site as any).category ?? (site as any).type ?? 'Surface Feature',
      significance: (site as any).significance ?? (site as any).description ?? 'Martian surface feature',
    };
    setSelectedSite(fullSite);
    setActiveTab(null); // Auto-close modal as requested
    
    const map = mapInstanceRef.current;
    if (map) {
      map.invalidateSize();
      map.flyTo([site.lat, site.lng], zoomLevel, {
        duration: 1.2,
      });
    }
  };

  // Fly to arbitrary lat/lng coordinates across both 2D Leaflet map & 3D Three.js Globe
  const handleFlyToLocation = (lat: number, lng: number, zoomLevel = 6, name?: string, elevationM?: number) => {
    const fullSite: MarsSite = {
      id: `coord-${lat.toFixed(3)}-${lng.toFixed(3)}`,
      name: name || 'Martian Surface Target',
      lat,
      lng,
      planetocentricLng: (lng + 360) % 360,
      elevation: elevationM ?? -2000,
      elevationM: elevationM ?? -2000,
      originName: name || 'Martian Surface Coordinates',
      category: 'Planitia (Plain)',
      type: 'Planitia (Plain)',
      significance: name ? `Target: ${name}` : 'Martian surface coordinate',
      description: `Latitude: ${lat.toFixed(2)}°, Longitude: ${((lng + 360) % 360).toFixed(2)}°E`,
    };
    setSelectedSite(fullSite);

    const map = mapInstanceRef.current;
    if (map) {
      map.invalidateSize();
      map.flyTo([lat, lng], zoomLevel, {
        duration: 1.2,
      });
    }
  };

  // Global reset view
  const handleResetView = () => {
    setBearing(0);
    mapInstanceRef.current?.flyTo([0, 0], 3, { duration: 1.2 });
  };

  // Orientation Handlers for 4 Cardinal Directions & Compass
  const handleSetBearing = (newBearing: number) => {
    const normalized = ((newBearing % 360) + 360) % 360;
    setBearing(normalized);
  };

  const handleResetOrientation = () => {
    setBearing(0);
  };

  // Add selected site as route waypoint - AUTO-CLOSES MODAL to show route on map
  const handleAddSiteToRoute = (site: MarsSite) => {
    setRouteWaypoints((prev) => [
      ...prev,
      { lat: site.lat, lng: site.lng, name: site.name },
    ]);
    setActiveTab(null); // Auto-close modal
  };

  // Add waypoint at center of current map view - AUTO-CLOSES MODAL
  const handleAddWaypointAtCenter = () => {
    if (!mapInstanceRef.current) return;
    const center = mapInstanceRef.current.getCenter();
    let lng = center.lng;
    lng = ((((lng + 180) % 360) + 360) % 360) - 180;
    const newPt = {
      lat: Number(center.lat.toFixed(4)),
      lng: Number(lng.toFixed(4)),
      name: `Point ${routeWaypoints.length + 1}`,
    };
    setRouteWaypoints((prev) => [...prev, newPt]);
    setActiveTab(null); // Auto-close modal
  };

  // Undo last waypoint
  const handleUndoWaypoint = () => {
    setRouteWaypoints((prev) => prev.slice(0, -1));
  };

  // Clear all waypoints
  const handleClearAllWaypoints = () => {
    setRouteWaypoints([]);
    setRouteStats(null);
    setActiveTab(null); // Auto-close modal
  };

  // Load Perseverance Delta Walk Preset - AUTO-CLOSES MODAL to show traverse
  const handleLoadPerseveranceRoute = () => {
    const pts = PERSEVERANCE_TRAVERSE_TRACK.map((pt) => ({
      lat: pt.lat,
      lng: pt.lng,
      name: pt.name,
    }));
    setRouteWaypoints(pts);
    setActiveTab(null); // Auto-close modal
    mapInstanceRef.current?.flyTo([18.46, 77.41], 7, { duration: 1.5 });
  };

  // Select Basemap - AUTO-CLOSES MODAL
  const handleSelectLayer = (layer: 'themis' | 'viking' | 'mola' | 'opm') => {
    setActiveLayer(layer);
    setActiveTab(null); // Auto-close modal
  };

  // Select Surface Clarity Filter - AUTO-CLOSES MODAL
  const handleSelectFilter = (filter: 'normal' | 'contrast' | 'sharp' | 'dark' | 'night') => {
    setSurfaceFilter(filter);
    setActiveTab(null); // Auto-close modal
  };

  // Surface filter CSS style - Ultra-clear detail and high-pass topography definition
  const getFilterStyle = () => {
    if (surfaceFilter === 'sharp') {
      return 'contrast(1.35) brightness(0.98) saturate(1.15)';
    }
    if (surfaceFilter === 'contrast') {
      return 'contrast(1.26) saturate(1.2) brightness(1.03)';
    }
    if (surfaceFilter === 'dark') {
      return 'brightness(0.65) contrast(1.22) saturate(0.85)';
    }
    if (surfaceFilter === 'night') {
      return 'brightness(0.42) contrast(1.28) hue-rotate(200deg) saturate(0.65)';
    }
    // High-definition clarity default: slightly boosted contrast & saturation so the red planet's ridges, dunes, and craters pop with realistic crispness
    return 'contrast(1.12) saturate(1.1) brightness(1.02)';
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#080b11] overflow-hidden select-none font-sans text-neutral-100">
      {/* Top Header Bar: Responsive, Clean & Sleek */}
      <header className="z-25 bg-[#0c101a]/95 backdrop-blur-md border-b border-neutral-800/80 px-2 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-3 shadow-xl shrink-0">
        {/* Brand & Status */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="w-7 h-7 sm:w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-950/60 shrink-0">
            <Globe className="w-4 h-4 sm:w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-bold text-white tracking-wide text-xs sm:text-sm">MARSWAY</span>
              <span className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded bg-orange-950/80 text-orange-400 border border-orange-800 font-semibold whitespace-nowrap">
                NASA GIS
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 hidden md:block">
              Planetary Surface Imagery & Mission Traverse Explorer
            </p>
          </div>
        </div>

        {/* Primary View Mode Switcher: 3D Planet Globe vs 2D Flat Map */}
        <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-neutral-900/90 border border-neutral-700/80 shadow-inner shrink-0">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
              viewMode === '3d'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/60'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Interactive 3D Mars Planet Globe with Deep Space & Stars"
          >
            <Globe className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden xs:inline">3D Globe</span>
            <span className="xs:hidden">3D</span>
            <span className="text-[8.5px] px-1 py-0.2 rounded bg-orange-950/90 text-orange-300 border border-orange-700/80 font-mono hidden sm:inline">
              PRIMARY
            </span>
          </button>
          <button
            onClick={() => {
              setViewMode('2d');
              setTimeout(() => mapInstanceRef.current?.invalidateSize(), 60);
            }}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
              viewMode === '2d'
                ? 'bg-neutral-800 text-white shadow border border-neutral-600'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Flat Mercator 2D Map with Elevation & Route Traverses"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xs:inline">Flat Map</span>
            <span className="xs:hidden">2D</span>
          </button>
        </div>

        {/* Quick Access Platform Actions Bar */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Universal Search Modal Button */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-xs text-neutral-200 hover:text-white items-center gap-1.5 transition shadow hidden sm:flex"
            title="Search all Martian craters, volcanoes, canyons, missions & landing sites"
          >
            <Search className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden xl:inline">Search</span>
          </button>

          {/* Missions Explorer Button */}
          <button
            onClick={() => setIsMissionExplorerOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-xs text-neutral-200 hover:text-white items-center gap-1.5 transition shadow hidden md:flex"
            title="Browse NASA, ESA, CNSA Mars rovers, landers & orbiters"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-semibold">Missions</span>
          </button>

          {/* Human Mission Mode Button */}
          <button
            onClick={() => setIsHumanMissionModeOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-xs text-neutral-200 hover:text-white items-center gap-1.5 transition shadow hidden lg:flex"
            title="Evaluate future human landing candidate zones & ISRU resources"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline font-semibold">Human Base</span>
          </button>

          {/* Ask MarsWay AI Button */}
          <button
            onClick={() => setIsAskMarsWayOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900/90 border border-purple-700/80 text-xs text-purple-200 hover:text-white flex items-center gap-1.5 transition shadow shadow-purple-950/50"
            title="Ask MarsWay AI spatial assistant with live map actions"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline font-bold">Ask AI</span>
          </button>

          {/* Live Voice Comms (gemini-3.8-live) Button */}
          <button
            onClick={() => setIsLiveVoiceOpen(true)}
            className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-900/90 hover:from-purple-800 hover:to-indigo-800 border border-purple-500/70 text-xs text-white flex items-center gap-1.5 transition shadow shadow-purple-950/60 group"
            title="Start real-time bi-directional voice conversation powered by gemini-3.8-live (Live API)"
          >
            <Radio className="w-3.5 h-3.5 text-purple-300 group-hover:animate-pulse" />
            <span className="font-bold flex items-center gap-1">
              <span className="hidden xs:inline">Live Voice</span>
              <span className="xs:hidden">Voice</span>
              <span className="hidden xl:inline text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 font-mono border border-purple-600/40">
                3.8-Live
              </span>
            </span>
          </button>

          {/* Guided Tour & Presentation Button */}
          <button
            onClick={() => setIsTourModalOpen(true)}
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-xs text-neutral-300 hover:text-white items-center gap-1 transition hidden lg:flex"
            title="Open Platform Tour & Presentation"
          >
            <Presentation className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

        {/* Desktop & Mobile Unified Hamburger Menu Button */}
        <div className="flex items-center gap-2 shrink-0">
          {routeWaypoints.length > 0 && (
            <button
              onClick={() => setActiveTab('route')}
              className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>{routeWaypoints.length} pts</span>
            </button>
          )}

          <button
            id="mars-global-hamburger-button"
            type="button"
            onClick={() => setIsHamburgerOpen(!isHamburgerOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-lg ${
              isHamburgerOpen
                ? 'bg-orange-600 text-white border-orange-400 shadow-orange-950/60'
                : 'bg-neutral-900/95 text-neutral-200 border-neutral-700/80 hover:bg-neutral-800 hover:text-white'
            }`}
            title="Open Mars Mission & Navigation Suite"
          >
            <Menu className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline tracking-wide">Menu</span>
          </button>
        </div>
      </header>


      {/* GLOBAL HAMBURGER SLIDE-OVER NAVIGATION SUITE */}
      {isHamburgerOpen && (
        <div className="fixed inset-0 z-[9990] flex justify-end pointer-events-auto animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsHamburgerOpen(false)}
          />

          {/* Slide-over Drawer Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mars Mission Navigation Suite"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm sm:max-w-md h-full bg-[#0c101a] border-l border-neutral-800/90 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 text-neutral-200"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 bg-[#0e1422] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                    Mars Mission Navigation
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    Cartography, Datasets & Scientific Tools
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setIsHamburgerOpen(false)}
                className="p-2 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
              {/* PRIMARY VIEW SELECTOR */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Planet Projection Mode
                </span>
                <div className="grid grid-cols-2 gap-2 bg-neutral-900/90 p-1.5 rounded-xl border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('3d');
                      setIsHamburgerOpen(false);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      viewMode === '3d'
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>3D Globe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('2d');
                      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 60);
                      setIsHamburgerOpen(false);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      viewMode === '2d'
                        ? 'bg-neutral-800 text-white shadow border border-neutral-600'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Flat Mercator</span>
                  </button>
                </div>
              </div>

              {/* MISSION EXPLORATION & CARTOGRAPHY */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Exploration & Cartography
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(activeTab === 'sites' ? null : 'sites');
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-orange-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-950/80 text-orange-400 border border-orange-800/60 group-hover:scale-105 transition-transform">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Landmarks & Historic Sites</span>
                        <span className="text-[10px] text-neutral-400">Olympus Mons, Jezero, Gale, Valles Marineris</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(activeTab === 'route' ? null : 'route');
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-cyan-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 group-hover:scale-105 transition-transform">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Rover Route & Traverse Planner</span>
                        <span className="text-[10px] text-neutral-400">Click anywhere to measure distance in km</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(activeTab === 'layers' ? null : 'layers');
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-emerald-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 group-hover:scale-105 transition-transform">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Surface Imagery & Basemaps</span>
                        <span className="text-[10px] text-neutral-400">Viking Color, MOLA Elevation, THEMIS Thermal</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>

              {/* MISSION INTELLIGENCE & HUMAN FLIGHT */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Mission Intelligence & Future Bases
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMissionExplorerOpen(true);
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-cyan-900/40 hover:border-cyan-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 group-hover:scale-105 transition-transform">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Missions & Traverses Explorer</span>
                        <span className="text-[10px] text-neutral-400">Curiosity, Perseverance, Opportunity, InSight</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMissionLayersPanelOpen(true);
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-orange-900/40 hover:border-orange-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-950/80 text-orange-400 border border-orange-800/60 group-hover:scale-105 transition-transform">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Missions & Traverses Layer Control</span>
                        <span className="text-[10px] text-neutral-400">Toggle NASA/ESA landings & rover track overlays</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsHumanMissionModeOpen(true);
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-blue-900/40 hover:border-blue-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/60 group-hover:scale-105 transition-transform">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Human Landing & Habitation Mode</span>
                        <span className="text-[10px] text-neutral-400">Subsurface ice, radiation shield, slope & ISRU</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsTimelineOpen(true);
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/60 group-hover:scale-105 transition-transform">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Exploration Chronology (1965–Present)</span>
                        <span className="text-[10px] text-neutral-400">Interactive timeline of all human missions to Mars</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCompareModalOpen(true);
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-indigo-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 group-hover:scale-105 transition-transform">
                        <ArrowRightLeft className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Dual-Site Comparison Matrix</span>
                        <span className="text-[10px] text-neutral-400">Side-by-side elevation, pressure, ice & geology</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>

              {/* GIS SCIENTIFIC TOOLS & PLATFORM SUITE */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  GIS Scientific Analysis & Tools
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMeasureToolOpen(true);
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-cyan-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 group-hover:scale-105 transition-transform">
                        <Ruler className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Measurement Tool (Distance & Area)</span>
                        <span className="text-[10px] text-neutral-400">Great-circle distance, bearings & spherical polygon km²</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsHamburgerOpen(false);
                      if (elevationProfile) {
                        setIsElevationProfileOpen(true);
                      } else {
                        setIsDrawingElevationLine(true);
                      }
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-orange-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-950/80 text-orange-400 border border-orange-800/60 group-hover:scale-105 transition-transform">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">MGS MOLA Elevation Profile</span>
                        <span className="text-[10px] text-neutral-400">Draw line to analyze topography, slopes & rover traversability</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsBookmarksModalOpen(true);
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/60 group-hover:scale-105 transition-transform">
                        <Bookmark className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Saved Waypoints & Bookmarks</span>
                        <span className="text-[10px] text-neutral-400">Save coordinate pins with custom scientific tags</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPresentationModeOpen(true);
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-purple-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800/60 group-hover:scale-105 transition-transform">
                        <Presentation className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Interactive Presentation Mode</span>
                        <span className="text-[10px] text-neutral-400">Fullscreen guided showcase of major Mars features</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDataSourcesModalOpen(true);
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-emerald-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Data Sources & Provenance</span>
                        <span className="text-[10px] text-neutral-400">NASA PDS, USGS, MOLA, THEMIS, Mars Trek specs</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>

              {/* PLANETARY AI & REAL-TIME VOICE COMMS */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                  Planetary AI & Real-Time Comms
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLiveVoiceOpen(true);
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-gradient-to-r from-purple-950/90 to-indigo-950/90 hover:from-purple-900/90 hover:to-indigo-900/90 border border-purple-600/70 hover:border-purple-400 flex items-center justify-between text-left transition-all cursor-pointer group shadow-lg shadow-purple-950/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-900/90 text-purple-300 border border-purple-500/50 group-hover:scale-105 transition-transform">
                        <Radio className="w-4 h-4 text-purple-300 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs block">Live Voice Comms</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900 text-purple-300 border border-purple-500/40 font-mono">
                            gemini-3.8-live
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-300">Ultra-low latency audio stream & live map action control</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-400 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAskMarsWayOpen(true);
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-purple-900/40 hover:border-purple-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800/60 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Ask MarsWay AI Spatial Assistant</span>
                        <span className="text-[10px] text-neutral-400">Natural language chat, scientific telemetry & automated flight</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>

              {/* GOOGLE MAPS AREA BORDERS & USGS 30 QUADRANGLES */}
              <div className="p-3.5 rounded-xl bg-[#0e1422] border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#ea4335]" />
                    <span className="text-xs font-bold text-white">Google Maps Area Borders</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRegions}
                      onChange={(e) => setShowRegions(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ea4335]"></div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-1.5 bg-neutral-900/90 p-1 rounded-lg border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setRegionDataset('usgs')}
                    className={`py-1.5 px-2 rounded-md text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                      regionDataset === 'usgs'
                        ? 'bg-neutral-800 text-white shadow border border-neutral-700'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <span>USGS 30 Quads</span>
                    <span className="text-[8px] font-normal opacity-70">100% Global Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegionDataset('geological')}
                    className={`py-1.5 px-2 rounded-md text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                      regionDataset === 'geological'
                        ? 'bg-neutral-800 text-white shadow border border-neutral-700'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <span>Geological</span>
                    <span className="text-[8px] font-normal opacity-70">Natural Provinces</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-neutral-400 block">
                    Jump to Area & Highlight
                  </span>
                  <select
                    value={selectedRegion?.id || ''}
                    onChange={(e) => {
                      const reg = activeRegions.find((r) => r.id === e.target.value);
                      if (reg) {
                        setSelectedRegion(reg);
                        setShowRegions(true);
                        const polygon = L.polygon(reg.polygon);
                        mapInstanceRef.current?.fitBounds(polygon.getBounds(), {
                          padding: [50, 50],
                          maxZoom: 7,
                        });
                      } else {
                        setSelectedRegion(null);
                      }
                      setIsHamburgerOpen(false);
                    }}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-[#ea4335] cursor-pointer"
                  >
                    <option value="">Select an area to highlight...</option>
                    {activeRegions.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.quadCode ? `[${reg.quadCode}] ` : ''}{reg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-800/80">
                  <span className="text-[11px] text-neutral-300">Show Area Labels</span>
                  <input
                    type="checkbox"
                    checked={showRegionLabels}
                    onChange={(e) => setShowRegionLabels(e.target.checked)}
                    className="accent-[#ea4335] rounded w-3.5 h-3.5 cursor-pointer"
                  />
                </div>
              </div>

              {/* SCIENTIFIC DOSSIER & IN-SITU DATA */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Scientific Telemetry & Imagery
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCloseUpSearchTarget(selectedSite?.name || 'Jezero Crater');
                      setIsCloseUpModalOpen(true);
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-orange-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-950/80 text-orange-400 border border-orange-800/60 group-hover:scale-105 transition-transform">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">NASA In-Situ Close-Up Imagery</span>
                        <span className="text-[10px] text-neutral-400">25cm/pixel HiRISE & Rover Micro-Imagers</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setScienceDossierTarget({
                        lat: cursorPos?.lat || 18.38,
                        lng: cursorPos?.lng || 77.58,
                        elevationM: -2500,
                        name: selectedSite?.name || 'Current Surface Sector',
                        type: selectedSite?.type || 'TERRAIN SECTOR',
                      });
                      setIsScienceDossierOpen(true);
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-cyan-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 group-hover:scale-105 transition-transform">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Water, Atmosphere & Safety Dossier</span>
                        <span className="text-[10px] text-neutral-400">Subsurface ice depth, gas fractions, human safety</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(activeTab === 'weather' ? null : 'weather');
                      setIsHamburgerOpen(false);
                    }}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/60 group-hover:scale-105 transition-transform">
                        <Thermometer className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Live Weather (Perseverance & InSight)</span>
                        <span className="text-[10px] text-neutral-400">Ground temp, pressure, wind velocity & opacity</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>

              {/* CALIBRATION & CONTROLS */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Map Calibration
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleResetView();
                      setIsHamburgerOpen(false);
                    }}
                    className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBearing(0);
                      setIsHamburgerOpen(false);
                    }}
                    className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5 text-orange-400" />
                    <span>Align North</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Stage */}
      <div
        ref={mapStageRef}
        className="flex-1 relative w-full h-full overflow-hidden bg-[#07090e]"
      >
        {/* 3D Interactive Planet Globe (Primary View Mode) */}
        {viewMode === '3d' && (
          <div className="absolute inset-0 z-10">
            <Mars3DGlobe
              onSwitchToFlatMap={(site) => {
                setViewMode('2d');
                if (site) {
                  const fullSite: MarsSite = {
                    id: (site as any).id || `site-${site.lat}-${site.lng}`,
                    name: site.name || 'Martian Surface Target',
                    lat: site.lat,
                    lng: site.lng,
                    planetocentricLng: (site as any).planetocentricLng ?? (site.lng + 360) % 360,
                    elevation: (site as any).elevation ?? (site as any).elevationM ?? -2000,
                    elevationM: (site as any).elevationM ?? (site as any).elevation ?? -2000,
                    category: (site as any).category ?? (site as any).type ?? 'Surface Feature',
                    type: (site as any).type ?? 'Surface Feature',
                    significance: (site as any).significance ?? (site as any).description ?? 'Martian surface coordinates.',
                    description: (site as any).description ?? 'Martian surface coordinates.',
                    historicalContext: (site as any).historicalContext ?? '',
                    scientificValue: (site as any).scientificValue ?? '',
                    originName: (site as any).originName ?? 'Surface Coordinates',
                  };
                  setSelectedSite(fullSite);
                  setArrivedSurfaceBanner({
                    name: fullSite.name,
                    lat: fullSite.lat,
                    lng: fullSite.lng,
                  });

                  // Smoothly ensure Leaflet map has valid dimensions and flies to the target coordinates
                  setTimeout(() => {
                    const map = mapInstanceRef.current;
                    if (map) {
                      map.invalidateSize();
                      map.setView([site.lat, site.lng], 6, { animate: false });
                      setTimeout(() => {
                        map.invalidateSize();
                        map.flyTo([site.lat, site.lng], 6.5, { duration: 1.0 });
                      }, 50);
                    }
                  }, 40);
                } else {
                  setTimeout(() => {
                    mapInstanceRef.current?.invalidateSize();
                  }, 40);
                }
              }}
              onOpenNASACloseUp={(name) => {
                setCloseUpSearchTarget(name);
                setIsCloseUpModalOpen(true);
              }}
              onOpenEarthComparison={(compTargetId) => {
                if (compTargetId) {
                  const match = EARTH_MARS_COMPARISONS.find(
                    (c) => c.marsFeatureId === compTargetId || c.id === compTargetId
                  );
                  if (match) {
                    setSelectedEarthComparisonId(match.id);
                    setActiveEarthComparison(match);
                  }
                }
                setIsEarthComparisonOpen(true);
              }}
              onOpenPlaceIdentifier={(feature) => {
                setPlaceIdentifierFeature(feature);
                setIsPlaceIdentifierOpen(true);
              }}
              telemetry={ephemeris}
              initialSelectedSite={selectedSite}
              activeLayer={activeLayer}
              onLayerChange={(layerId) => handleSelectLayer(layerId as any)}
            />

            {/* TOP MARS SEARCH BAR IN 3D GLOBE MODE */}
            <div className="absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[calc(100%-24px)] sm:w-[380px] md:w-[460px] max-w-[94vw]">
              <MarsTopSearchBar
                placeholder="Search craters, volcanoes, canyons, rovers..."
                onFlyTo={(target) => {
                  handleFlyToLocation(target.lat, target.lng, target.zoom ?? 6, target.name, target.elevationM);
                }}
              />
            </div>
          </div>
        )}

        {/* 2D Flat Mercator Map Container (Always kept mounted so tiles load instantly) */}
        <div
          className={`w-full h-full absolute inset-0 transition-opacity duration-300 ${
            viewMode === '2d' ? 'z-10 opacity-100 pointer-events-auto' : 'z-0 opacity-0 pointer-events-none'
          }`}
        >
          {/* SEARCH INPUT BAR AT THE TOP OF THE MAP */}
          <div className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 z-35 pointer-events-auto w-[calc(100%-20px)] sm:w-[420px] md:w-[480px] max-w-[94vw]">
            <MarsTopSearchBar
              placeholder="Search craters, volcanoes, canyons, rovers..."
              onFlyTo={(target) => {
                handleFlyToLocation(target.lat, target.lng, target.zoom ?? 6, target.name, target.elevationM);
              }}
            />
          </div>

          {/* Arrived Surface Location Notification Banner */}
          {arrivedSurfaceBanner && (
            <div className="absolute top-24 sm:top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-300 max-w-sm sm:max-w-md w-full px-3">
              <div className="bg-[#090d16]/95 backdrop-blur-xl border border-emerald-500/80 rounded-2xl px-3.5 py-2.5 shadow-2xl flex items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/80 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                        Surface 2D View
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {arrivedSurfaceBanner.name}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400">
                      {arrivedSurfaceBanner.lat >= 0 ? `${arrivedSurfaceBanner.lat.toFixed(2)}°N` : `${Math.abs(arrivedSurfaceBanner.lat).toFixed(2)}°S`},{' '}
                      {arrivedSurfaceBanner.lng >= 0 ? `${arrivedSurfaceBanner.lng.toFixed(2)}°E` : `${Math.abs(arrivedSurfaceBanner.lng).toFixed(2)}°W`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('3d')}
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-[10.5px] font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1 border border-neutral-700"
                    title="Return to 3D Globe"
                  >
                    <Globe className="w-3 h-3 text-orange-400" />
                    <span>3D Globe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setArrivedSurfaceBanner(null)}
                    className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MGS MOLA Interactive Line Drawing Instructions Banner */}
          {isDrawingElevationLine && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[92vw] sm:max-w-md w-full animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="bg-[#0b101d]/95 backdrop-blur-xl border border-orange-500/80 rounded-2xl p-3 shadow-2xl shadow-orange-950/40 flex items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-600/30 border border-orange-500/70 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-orange-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-orange-200 flex items-center gap-1.5">
                      <span>MOLA Transect Tool</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/30 text-orange-300 font-mono">
                        {elevationPoints.length === 0 ? 'Step 1 of 2' : 'Step 2 of 2'}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-300">
                      {elevationPoints.length === 0
                        ? 'Click anywhere on Mars to drop Point A (Start)'
                        : 'Point A set! Click on Mars to drop Point B (End)'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawingElevationLine(false);
                    setElevationPoints([]);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-mono transition-colors cursor-pointer shrink-0 border border-neutral-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Esri Explore Mars-style Place Nomenclature Category Filter & Earth Scale Bar */}
          <div className="absolute top-14 sm:top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[96vw] px-1 sm:px-2 transition-all duration-300 opacity-100 translate-y-0">
            {!isCategoryBarExpanded ? (
              // Sleek, compact pill - uncluttered, zero obstruction
              <div className="bg-[#090d16]/90 backdrop-blur-xl border border-neutral-700/80 rounded-full px-2.5 py-1 shadow-2xl flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setIsCategoryBarExpanded(true)}
                  className="flex items-center gap-1.5 px-2 py-0.5 text-neutral-300 hover:text-white rounded-full transition-colors cursor-pointer"
                  title="Filter Martian places by category"
                >
                  <Filter className="w-3.5 h-3.5 text-orange-400" />
                  <span className="font-semibold text-[11px] sm:text-xs">
                    {placeCategoryFilter === 'all'
                      ? 'Categories'
                      : placeCategoryFilter === 'mons'
                      ? '🌋 Volcanoes'
                      : placeCategoryFilter === 'crater'
                      ? '☄️ Craters'
                      : placeCategoryFilter === 'chasma'
                      ? '🏜️ Canyons'
                      : placeCategoryFilter === 'planitia'
                      ? '🪐 Plains'
                      : '🚀 Missions'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>

                {placeCategoryFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setPlaceCategoryFilter('all')}
                    className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Reset to All categories"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                <div className="w-[1px] h-3.5 bg-neutral-700/80 mx-0.5" />

                <button
                  type="button"
                  onClick={() => setIsEarthComparisonOpen(true)}
                  className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    activeEarthComparison
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-cyan-300 hover:text-white hover:bg-cyan-950/60'
                  }`}
                  title="Compare scale of Mars landforms directly against Earth landmarks"
                >
                  <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Earth Scale</span>
                </button>

                <div className="w-[1px] h-3.5 bg-neutral-700/80 mx-0.5" />

                <button
                  type="button"
                  onClick={() => {
                    if (isElevationProfileOpen) {
                      setIsElevationProfileOpen(false);
                    } else if (elevationProfile) {
                      setIsElevationProfileOpen(true);
                    } else {
                      setIsDrawingElevationLine(true);
                    }
                  }}
                  className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    isElevationProfileOpen || isDrawingElevationLine
                      ? 'bg-orange-600 text-white shadow-md ring-1 ring-orange-400'
                      : 'text-orange-300 hover:text-white hover:bg-orange-950/60'
                  }`}
                  title="Draw line between two points to analyze MGS MOLA elevation & terrain steepness"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                  <span className="hidden sm:inline">Elevation Profile</span>
                </button>

                <div className="w-[1px] h-3.5 bg-neutral-700/80 mx-0.5" />

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !showDustStormOverlay;
                    setShowDustStormOverlay(nextVal);
                    setIsDustStormPanelOpen(true);
                    setMissionLayerOptions((prev) => ({ ...prev, showDustStormOverlay: nextVal }));
                  }}
                  className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    showDustStormOverlay
                      ? 'bg-amber-500 text-black shadow-md font-bold'
                      : 'text-amber-300 hover:text-white hover:bg-amber-950/60'
                  }`}
                  title="Toggle Dust Storm & Atmosphere Opacity Simulation Overlay"
                >
                  <Wind className={`w-3.5 h-3.5 ${showDustStormOverlay ? 'animate-pulse text-black' : 'text-amber-400'}`} />
                  <span className="hidden sm:inline">Dust Storm</span>
                </button>
              </div>
            ) : (
              // Expanded single-row horizontal pill with smooth scrolling & minimize button
              <div className="bg-[#090d16]/95 backdrop-blur-2xl border border-neutral-700/90 rounded-2xl p-1 shadow-2xl flex items-center gap-1 flex-nowrap overflow-x-auto no-scrollbar max-w-[94vw] sm:max-w-max">
                <button
                  type="button"
                  onClick={() => setPlaceCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    placeCategoryFilter === 'all'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                  }`}
                >
                  <span>🌐 All</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlaceCategoryFilter('mons')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    placeCategoryFilter === 'mons'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                  }`}
                >
                  <span>🌋 Volcanoes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlaceCategoryFilter('crater')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    placeCategoryFilter === 'crater'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                  }`}
                >
                  <span>☄️ Craters</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlaceCategoryFilter('chasma')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    placeCategoryFilter === 'chasma'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                  }`}
                >
                  <span>🏜️ Canyons</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlaceCategoryFilter('planitia')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    placeCategoryFilter === 'planitia'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                  }`}
                >
                  <span>🪐 Plains</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlaceCategoryFilter('mission')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    placeCategoryFilter === 'mission'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                  }`}
                >
                  <span>🚀 Missions</span>
                </button>

                <div className="w-[1px] h-4 bg-neutral-700 mx-0.5 shrink-0" />

                {/* Earth Scale Comparison Trigger */}
                <button
                  type="button"
                  onClick={() => setIsEarthComparisonOpen(true)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeEarthComparison
                      ? 'bg-cyan-600 text-white shadow-lg animate-pulse ring-1 ring-cyan-400'
                      : 'bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-200 hover:text-white'
                  }`}
                  title="Compare scale of Mars landforms directly against Earth landmarks"
                >
                  <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Earth Scale</span>
                  {activeEarthComparison && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  )}
                </button>

                <div className="w-[1px] h-4 bg-neutral-700 mx-0.5 shrink-0" />

                {/* MGS MOLA Elevation Profile Transect Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    if (isElevationProfileOpen) {
                      setIsElevationProfileOpen(false);
                    } else if (elevationProfile) {
                      setIsElevationProfileOpen(true);
                    } else {
                      setIsDrawingElevationLine(true);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isElevationProfileOpen || isDrawingElevationLine
                      ? 'bg-orange-600 text-white shadow-lg ring-1 ring-orange-400'
                      : 'bg-orange-950/80 hover:bg-orange-900 border border-orange-700/80 text-orange-200 hover:text-white'
                  }`}
                  title="Draw line between two points to analyze MGS MOLA elevation & terrain steepness"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                  <span>Elevation Profile</span>
                  {(isElevationProfileOpen || isDrawingElevationLine) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  )}
                </button>

                <div className="w-[1px] h-4 bg-neutral-700 mx-0.5 shrink-0" />

                {/* Dust Storm / Atmosphere Overlay Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !showDustStormOverlay;
                    setShowDustStormOverlay(nextVal);
                    setIsDustStormPanelOpen(true);
                    setMissionLayerOptions((prev) => ({ ...prev, showDustStormOverlay: nextVal }));
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    showDustStormOverlay
                      ? 'bg-amber-500 text-black shadow-lg ring-1 ring-amber-300'
                      : 'bg-amber-950/80 hover:bg-amber-900 border border-amber-700/80 text-amber-200 hover:text-white'
                  }`}
                  title="Toggle Dust Storm & Atmosphere Opacity Simulation Overlay"
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>Dust Storm</span>
                  {showDustStormOverlay && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  )}
                </button>

                <div className="w-[1px] h-4 bg-neutral-700 mx-0.5 shrink-0" />

                {/* Minimize Button */}
                <button
                  type="button"
                  onClick={() => setIsCategoryBarExpanded(false)}
                  className="p-1 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/90 transition-colors cursor-pointer shrink-0"
                  title="Collapse Category Filters"
                  aria-label="Collapse"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Rotated Map Canvas Container with Smooth 4-Directional Animation */}
        <div
          className={`flex items-center justify-center origin-center transition-transform duration-500 ease-out pointer-events-auto ${
            bearing === 0 ? 'absolute inset-0 w-full h-full' : 'absolute top-1/2 left-1/2'
          }`}
          style={{
            width: bearing === 0 ? '100%' : `${stageDiagonal}px`,
            height: bearing === 0 ? '100%' : `${stageDiagonal}px`,
            transform: bearing === 0 ? 'none' : `translate(-50%, -50%) rotate(${-bearing}deg)`,
            filter: getFilterStyle(),
            ['--map-bearing' as any]: `${bearing}deg`,
          }}
        >
          {/* Leaflet Map Canvas */}
          <div
            ref={mapContainerRef}
            style={{
              ['--map-bearing' as any]: `${bearing}deg`,
            }}
            className="w-full h-full z-0 cursor-crosshair"
          />
        </div>

        {/* PROMINENT ZOOM CONTROLS WITH CLEAR VISIBLE TEXT */}
        <div className="absolute top-24 sm:top-3 left-2.5 sm:left-3 z-20 flex flex-col gap-2 pointer-events-auto transition-all duration-300 opacity-100">
          <div className="bg-[#0c101a]/95 backdrop-blur-md border border-neutral-700/90 rounded-xl p-1 sm:p-1.5 flex flex-col gap-1 shadow-2xl">
            {/* Live Zoom Scale Indicator */}
            <div className="px-1.5 sm:px-2 py-0.5 text-[8.5px] sm:text-[9px] text-neutral-400 font-mono flex items-center justify-between border-b border-neutral-800/60 pb-1">
              <span className="hidden sm:inline">SCALE</span>
              <span className="text-orange-400 font-bold">{currentZoom}x / 20x</span>
            </div>

            {/* Zoom In Button (Icon Only) */}
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              disabled={currentZoom >= 20}
              className="flex items-center justify-center p-2 text-neutral-200 hover:text-white hover:bg-neutral-800/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
              title="Zoom In to Mars Surface (Max 20x High Resolution)"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-orange-400 shrink-0" />
            </button>

            {/* Zoom Out Button (Icon Only) */}
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              disabled={currentZoom <= 2}
              className="flex items-center justify-center p-2 text-neutral-200 hover:text-white hover:bg-neutral-800/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
              title="Zoom Out from Mars Surface"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-orange-400 shrink-0" />
            </button>

            <div className="h-[1px] bg-neutral-800/80 my-0.5" />

            {/* Reset View Button (Icon Only) */}
            <button
              onClick={handleResetView}
              className="flex items-center justify-center p-2 text-neutral-300 hover:text-orange-400 hover:bg-neutral-800/90 rounded-lg transition-colors cursor-pointer"
              title="Reset to Full Global Mars View & True North"
              aria-label="Reset View"
            >
              <RotateCcw className="w-4 h-4 text-neutral-400 shrink-0" />
            </button>

            {/* Missions Explorer Quick Trigger Button */}
            <button
              onClick={() => setIsMissionExplorerOpen(true)}
              className="flex items-center justify-center p-2 text-cyan-400 hover:text-white hover:bg-cyan-950/50 rounded-lg transition-colors cursor-pointer border-t border-neutral-800/60"
              title="Open Mars Missions Explorer (Rovers, Landers & Orbiters)"
              aria-label="Open Missions Explorer"
            >
              <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
            </button>

            {/* Mission & Rover Traverse Layers Control Panel Toggle */}
            <button
              onClick={() => setIsMissionLayersPanelOpen((prev) => !prev)}
              className={`flex items-center justify-center p-2 rounded-lg transition-colors cursor-pointer border-t border-neutral-800/60 ${
                isMissionLayersPanelOpen
                  ? 'text-orange-300 bg-orange-950/60'
                  : 'text-orange-400 hover:text-white hover:bg-orange-950/40'
              }`}
              title="Toggle Mars Missions & Rover Traverse Layer Control Panel"
              aria-label="Mission Layers Control"
            >
              <Layers className="w-4 h-4 shrink-0" />
            </button>

            {/* If Rotated, Show Quick Align True North (0°) Button */}
            {bearing !== 0 && (
              <button
                onClick={handleResetOrientation}
                className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 p-2 sm:px-2.5 sm:py-1.5 text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/80 rounded-lg font-bold text-xs transition-colors cursor-pointer animate-in fade-in duration-200"
                title="Reset orientation to True North (0°)"
              >
                <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold hidden sm:inline">Align North (0°)</span>
              </button>
            )}
          </div>

          {/* Quick Basemap Switcher (Desktop and Tablet) */}
          <div className="hidden sm:flex bg-[#0c101a]/95 backdrop-blur-md border border-neutral-800 rounded-xl p-2 shadow-2xl flex-col gap-1 text-[11px]">
            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider px-1">
              Basemap
            </span>
            <button
              onClick={() => handleSelectLayer('viking')}
              className={`px-2 py-1 rounded text-left font-medium transition-colors cursor-pointer ${
                activeLayer === 'viking'
                  ? 'bg-orange-600 text-white font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80'
              }`}
            >
              True Color (Viking)
            </button>
            <button
              onClick={() => handleSelectLayer('themis')}
              className={`px-2 py-1 rounded text-left font-medium transition-colors cursor-pointer flex items-center justify-between ${
                activeLayer === 'themis'
                  ? 'bg-orange-600 text-white font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80'
              }`}
            >
              <span>THEMIS 100m IR</span>
              <span className="text-[9px] font-mono text-amber-300 ml-1">Sharp</span>
            </button>
            <button
              onClick={() => handleSelectLayer('mola')}
              className={`px-2 py-1 rounded text-left font-medium transition-colors cursor-pointer ${
                activeLayer === 'mola'
                  ? 'bg-orange-600 text-white font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80'
              }`}
            >
              MOLA Topography
            </button>
            <button
              onClick={() => handleSelectLayer('opm')}
              className={`px-2 py-1 rounded text-left font-medium transition-colors cursor-pointer ${
                activeLayer === 'opm'
                  ? 'bg-orange-600 text-white font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80'
              }`}
            >
              OpenPlanetary
            </button>

            <div className="border-t border-neutral-800 my-0.5" />
            <div className="flex items-center justify-between px-1 pt-0.5">
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                Surface Tone
              </span>
              <button
                onClick={() => setSurfaceFilter((prev) => (prev === 'dark' ? 'normal' : 'dark'))}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                  surfaceFilter === 'dark'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
                title="Toggle Dark Surface filter"
              >
                {surfaceFilter === 'dark' ? 'Dark ON' : 'Dark OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* CRISP DARK-THEMED COMPASS WIDGET (Top Right Corner) */}
        <div className="absolute top-24 sm:top-3 right-2.5 sm:right-3 z-20 pointer-events-auto transition-all duration-300 opacity-100">
          <MarsCompassWidget
            bearing={bearing}
            onRotate={handleSetBearing}
            onResetOrientation={handleResetOrientation}
            subSolarLat={ephemeris.subSolarLatitude}
            solarLongitudeLs={ephemeris.solarLongitudeLs}
          />
        </div>

        {/* CRISP DARK-THEMED MARS SCALE BAR (Bottom Left Corner) */}
        <div className="absolute bottom-20 sm:bottom-4 left-2.5 sm:left-4 z-20 pointer-events-auto transition-all duration-300 opacity-100">
          <MarsScaleBar map={mapInstance} />
        </div>

        {/* High-Zoom Notification & In-Situ Close-Up Quick Action Banner */}
        {currentZoom >= 7 && (
          <div className="absolute top-24 sm:top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-[#0a101f]/95 backdrop-blur-md border border-orange-500/70 text-white px-3 sm:px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-2 text-xs max-w-[92vw] transition-all duration-300 opacity-100 translate-y-0">
            <div className="flex items-center gap-1.5 text-orange-400 font-semibold text-[11px] truncate">
              <Satellite className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="hidden sm:inline">Orbital basemap max detail (~100m/px)</span>
              <span className="sm:hidden">Orbital max detail</span>
            </div>
            <span className="text-neutral-500 shrink-0">•</span>
            <button
              onClick={() => {
                setCloseUpSearchTarget(inspectedPoint?.nearestFeature?.name || selectedSite?.name || 'Jezero Crater');
                setIsCloseUpModalOpen(true);
              }}
              className="px-2.5 py-0.5 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] sm:text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-md shadow-orange-950 shrink-0"
            >
              <Camera className="w-3 h-3" />
              <span>NASA Close-Up</span>
            </button>
          </div>
        )}

        {/* Center Target Reticle for Mobile Precise Waypoint Placement */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 md:hidden opacity-35">
          <div className="w-6 h-6 border border-cyan-400 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
          </div>
        </div>

        {/* FLOATING ROUTE PLANNING ACTIVE BANNER (Clear Visual Feedback) */}
        {isRoutePlanningActive && (
          <div className="absolute top-16 sm:top-4 left-1/2 -translate-x-1/2 z-25 pointer-events-auto bg-[#0a1120]/95 backdrop-blur-md border border-cyan-400 text-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-2xl flex items-center gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-top-2 max-w-[92vw]">
            <div className="relative flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
              <div className="absolute w-5 h-5 rounded-full bg-cyan-400/40 animate-ping"></div>
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-cyan-200 truncate">
              Plotting Active ({routeWaypoints.length} WPs)
            </span>
            <button
              onClick={() => setIsRoutePlanningActive(false)}
              className="px-2.5 sm:px-3 py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-[10px] sm:text-[11px] font-bold transition-colors cursor-pointer shrink-0"
            >
              Finish
            </button>
          </div>
        )}

        {/* FLOATING SELECTED SITE CARD (Mobile & Desktop Place Card) */}
        {selectedSite && !inspectedPoint && !isRoutePlanningActive && !activeTab && (
          <div className="absolute bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-25 pointer-events-auto bg-[#0c101a]/95 backdrop-blur-xl border border-orange-500/70 p-3 sm:p-3.5 rounded-2xl shadow-2xl max-w-sm w-[94%] sm:w-84 text-xs flex flex-col gap-2 animate-in slide-in-from-bottom-3 duration-200 max-h-[60vh] sm:max-h-[75vh] overflow-y-auto transition-all opacity-100 translate-y-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-orange-950 text-orange-300 border border-orange-800">
                    {selectedSite.category || selectedSite.type}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {selectedSite.elevation > 0 ? `+${selectedSite.elevation}` : selectedSite.elevation}m elev
                  </span>
                </div>
                <h3 className="text-white font-bold text-sm tracking-tight truncate mt-0.5">
                  {selectedSite.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSite(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-neutral-300 text-[11px] leading-relaxed line-clamp-2">
              {selectedSite.significance || selectedSite.description}
            </p>

            {/* Quick Science Summary for Selected Landmark */}
            {(() => {
              const sc = analyzeMarsLocationScience(selectedSite.lat, selectedSite.lng, selectedSite.elevation);
              return (
                <div className="bg-neutral-900/85 rounded-xl p-2 border border-neutral-800 space-y-1.5 text-[10.5px]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{sc.water.depthDisplay}</span>
                    </span>
                    <span className="text-cyan-400 font-mono font-bold">{sc.water.probabilityChance}% Ice Chance</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300 text-[10px]">
                    <span className="flex items-center gap-1 text-orange-300">
                      <Wind className="w-3 h-3 text-orange-400" />
                      CO₂ 95.3% • N₂ 2.6%
                    </span>
                    <span className="flex items-center gap-1 text-rose-300 font-bold">
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                      Suit Required
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Environmental & Science Dossier Button */}
            <button
              onClick={() => {
                setScienceDossierTarget({
                  lat: selectedSite.lat,
                  lng: selectedSite.lng,
                  elevationM: selectedSite.elevation || 0,
                  name: selectedSite.name,
                  type: selectedSite.category || selectedSite.type,
                });
                setIsScienceDossierOpen(true);
              }}
              className="w-full py-1.5 px-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-700/80 text-cyan-200 font-bold text-center text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>💧 Full Water, Gas, Weather & Safety Dossier</span>
            </button>

            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <button
                onClick={() => {
                  setPlaceIdentifierFeature(selectedSite);
                  setIsPlaceIdentifierOpen(true);
                }}
                className="flex-1 py-1.5 px-2 rounded-xl bg-orange-950/80 hover:bg-orange-900 border border-orange-600/80 text-orange-200 hover:text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                title="Geological and IAU Nomenclature Place Dossier"
              >
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                <span>Place Info</span>
              </button>

              <button
                onClick={() => {
                  const match = EARTH_MARS_COMPARISONS.find(
                    (c) => c.marsFeatureId === selectedSite.id || c.id === selectedSite.id
                  );
                  if (match) {
                    setSelectedEarthComparisonId(match.id);
                    setActiveEarthComparison(match);
                  }
                  setIsEarthComparisonOpen(true);
                }}
                className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/80 text-cyan-200 hover:text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                title="Compare Scale against Earth Features"
              >
                <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Earth Scale</span>
              </button>

              <button
                onClick={() => {
                  setCloseUpSearchTarget(selectedSite.name);
                  setIsCloseUpModalOpen(true);
                }}
                className="py-1.5 px-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
              >
                <Camera className="w-3.5 h-3.5 text-orange-400" />
                <span>Photos</span>
              </button>

              <button
                onClick={() => {
                  handleAddSiteToRoute(selectedSite);
                }}
                className="py-1.5 px-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-cyan-300 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-neutral-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Route</span>
              </button>
            </div>
          </div>
        )}

        {/* INSPECTED POINT CARD (Exploration Mode - Does NOT create routes) */}
        {inspectedPoint && !isRoutePlanningActive && !activeTab && (
          <div className="absolute bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-25 pointer-events-auto bg-[#0c101a]/95 backdrop-blur-xl border border-neutral-700/90 p-3 sm:p-3.5 rounded-2xl shadow-2xl max-w-sm w-[94%] sm:w-80 text-xs flex flex-col gap-2.5 animate-in slide-in-from-bottom-3 duration-200 max-h-[60vh] sm:max-h-[75vh] overflow-y-auto transition-all opacity-100 translate-y-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5 text-orange-400 font-bold">
                <Crosshair className="w-4 h-4" />
                <span>Inspected Mars Surface</span>
              </div>
              <button
                onClick={() => setInspectedPoint(null)}
                className="text-neutral-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-neutral-900/80 p-2 rounded-lg border border-neutral-800 font-mono text-[11px]">
              <div>
                <span className="text-neutral-500 text-[9px] block">COORDINATES</span>
                <span className="text-white font-bold">{inspectedPoint.lat}°, {inspectedPoint.lng}°</span>
              </div>
              <div>
                <span className="text-neutral-500 text-[9px] block">EAST PLANETOCENTRIC</span>
                <span className="text-amber-300 font-bold">{inspectedPoint.eastLng}°E</span>
              </div>
            </div>

            {inspectedPoint.nearestFeature && (
              <div className="text-[11px] bg-neutral-950/60 p-2 rounded-lg border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-neutral-400 block text-[9px]">NEAREST NAMED SITE</span>
                  <span className="text-white font-semibold">{inspectedPoint.nearestFeature.name}</span>
                  <span className="text-[10px] text-orange-400/90 block">({inspectedPoint.nearestFeature.type})</span>
                </div>
                <span className="text-cyan-300 font-mono text-[10px] font-bold">
                  ~{inspectedPoint.distToNearestKm} km away
                </span>
              </div>
            )}

            {inspectedPoint.containingRegion && (
              <div
                className="text-[11px] p-2 rounded-lg border flex items-center justify-between gap-2"
                style={{
                  backgroundColor: `${inspectedPoint.containingRegion.borderColor}18`,
                  borderColor: inspectedPoint.containingRegion.borderColor,
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: inspectedPoint.containingRegion.borderColor }}
                    />
                    <span className="text-[9px] text-neutral-300 font-bold uppercase tracking-wider block">
                      Inside Area Boundary
                    </span>
                  </div>
                  <span className="text-white font-bold text-xs block truncate mt-0.5">
                    {inspectedPoint.containingRegion.name}
                  </span>
                  <span
                    className="text-[10px] block font-mono"
                    style={{ color: inspectedPoint.containingRegion.textColor }}
                  >
                    {inspectedPoint.containingRegion.areaKm2.toLocaleString()} km² • {inspectedPoint.containingRegion.category}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedRegion(inspectedPoint.containingRegion!);
                    setInspectedPoint(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-[10px] cursor-pointer shrink-0 border border-neutral-700 shadow"
                >
                  View Area
                </button>
              </div>
            )}

            {/* Instant In-Situ Environmental & Safety Science Analysis */}
            {(() => {
              const sc = analyzeMarsLocationScience(inspectedPoint.lat, inspectedPoint.lng);
              return (
                <div className="bg-neutral-900/90 rounded-xl p-2.5 border border-neutral-800 space-y-2 text-[10.5px]">
                  {/* Water / Ice Depth & Abundance */}
                  <div className="flex items-start gap-2 text-cyan-200">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Water / Ice: </span>
                      <span>{sc.water.depthDisplay} ({sc.water.abundanceDisplay}) — <strong className="text-cyan-300">{sc.water.probabilityChance}% chance</strong></span>
                    </div>
                  </div>

                  {/* Atmospheric Gas Composition */}
                  <div className="flex items-start gap-2 text-orange-200">
                    <Wind className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Gases: </span>
                      <span>CO₂ 95.3% • N₂ 2.6% • Ar 1.9% • O₂ 0.16% ({sc.atmosphere.pressureDisplay})</span>
                    </div>
                  </div>

                  {/* Human & Rover Safety */}
                  <div className="flex items-start gap-2 text-rose-200">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Human: </span>
                      <span className="text-rose-300 font-semibold">Lethal (EVA Suit Mandatory)</span>
                      <span className="text-neutral-400 mx-1">•</span>
                      <span className="font-bold text-white">Rover: </span>
                      <span className="text-emerald-400 font-semibold">{sc.vehicleSafety.trafficabilityRating}</span>
                    </div>
                  </div>

                  {/* Precipitation / Rain */}
                  <div className="flex items-start gap-2 text-indigo-200">
                    <CloudRain className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Precipitation: </span>
                      <span>0% Liquid Rain (Triple point barrier) • {sc.precipitation.snowChance}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={() => {
                setScienceDossierTarget({
                  lat: inspectedPoint.lat,
                  lng: inspectedPoint.lng,
                  elevationM: 0,
                  name: inspectedPoint.nearestFeature ? `Near ${inspectedPoint.nearestFeature.name}` : `Surface (${inspectedPoint.lat}°, ${inspectedPoint.lng}°)`,
                  type: 'Inspected Surface Point',
                });
                setIsScienceDossierOpen(true);
              }}
              className="w-full py-2 px-2.5 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-200 font-bold text-center text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>💧 Open Complete Scientific Dossier & Gas Table</span>
            </button>

            <div className="flex gap-2 pt-0.5">
              <button
                onClick={() => {
                  setCloseUpSearchTarget(inspectedPoint.nearestFeature?.name || `${inspectedPoint.lat}°, ${inspectedPoint.lng}°`);
                  setIsCloseUpModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold cursor-pointer transition-colors text-xs flex items-center gap-1 shadow-md shadow-orange-950"
                title="View real NASA in-situ close-up photos"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Close-Up</span>
              </button>
              <button
                onClick={() => {
                  setRouteWaypoints((prev) => [
                    ...prev,
                    {
                      lat: inspectedPoint.lat,
                      lng: inspectedPoint.lng,
                      name: inspectedPoint.nearestFeature ? `Near ${inspectedPoint.nearestFeature.name}` : `WP ${prev.length + 1}`,
                    },
                  ]);
                  setInspectedPoint(null);
                }}
                className="flex-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-center cursor-pointer transition-colors text-xs shadow-md shadow-cyan-950"
              >
                + Traverse
              </button>
              {inspectedPoint.nearestFeature && (
                <button
                  onClick={() => {
                    const feat = FAMOUS_MARS_SITES.find((s) => s.id === inspectedPoint.nearestFeature?.id);
                    if (feat) {
                      setSelectedSite(feat);
                      mapInstanceRef.current?.flyTo([feat.lat, feat.lng], 6, { duration: 1.2 });
                    }
                    setInspectedPoint(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold cursor-pointer transition-colors text-xs"
                >
                  Feature
                </button>
              )}
            </div>
          </div>
        )}

        {/* GOOGLE MAPS FLOATING PLACE / AREA DOSSIER CARD */}
        {selectedRegion && !activeTab && (
          <div className="absolute bottom-12 left-3 right-3 sm:right-auto sm:w-[380px] max-h-[75vh] bg-[#0c101a]/96 backdrop-blur-2xl border border-neutral-700/90 rounded-2xl shadow-2xl shadow-black/90 p-3.5 z-25 flex flex-col gap-2.5 animate-in slide-in-from-bottom-4 duration-200">
            {/* Header with Google Red Area Outline Tag & Close Button */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="w-2 h-2 rounded-full bg-[#ea4335] shadow-[0_0_8px_#ea4335]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea4335]">
                    {selectedRegion.category}
                  </span>
                  {selectedRegion.quadCode && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                      {selectedRegion.quadCode}
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate mt-0.5">
                  {selectedRegion.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRegion(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                title="Clear Selection (Remove Red Boundary Highlight)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-[11px] text-neutral-300 leading-relaxed line-clamp-2">
              {selectedRegion.description}
            </p>

            {/* Google Maps Style Metric Row */}
            <div className="grid grid-cols-2 gap-2 bg-neutral-900/80 p-2 rounded-xl border border-neutral-800/80 text-[10px]">
              <div>
                <span className="text-neutral-500 block font-medium">Surface Area</span>
                <span className="text-neutral-200 font-bold font-mono">
                  {selectedRegion.areaKm2.toLocaleString()} km²
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block font-medium">Landmarks Inside</span>
                <span className="text-neutral-200 font-bold font-mono">
                  {featuresInsideSelectedRegion.length} named features
                </span>
              </div>
            </div>

            {/* Quick Landmark Chips inside this region (clickable to fly to) */}
            {featuresInsideSelectedRegion.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9.5px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Key Features in this Area:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                  {featuresInsideSelectedRegion.slice(0, 6).map((feat) => (
                    <button
                      key={feat.id}
                      onClick={() => {
                        mapInstanceRef.current?.setView([feat.lat, feat.lng], 6, { animate: true });
                        const site = FAMOUS_MARS_SITES.find((s) => s.id === feat.id);
                        if (site) setSelectedSite(site);
                      }}
                      className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-[10px] text-neutral-200 hover:text-white font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <MapPin className="w-2.5 h-2.5 text-[#ea4335]" />
                      <span>{feat.name}</span>
                    </button>
                  ))}
                  {featuresInsideSelectedRegion.length > 6 && (
                    <button
                      onClick={() => setIsRegionDetailModalOpen(true)}
                      className="text-[10px] text-neutral-400 hover:text-white font-semibold underline shrink-0 px-1 cursor-pointer"
                    >
                      +{featuresInsideSelectedRegion.length - 6} more
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Google Maps Actions Bar */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-800/80">
              <button
                onClick={() => {
                  const polygon = L.polygon(selectedRegion.polygon);
                  mapInstanceRef.current?.fitBounds(polygon.getBounds(), {
                    padding: [40, 40],
                    maxZoom: 7,
                  });
                }}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-[10px] flex items-center gap-1 transition-colors cursor-pointer border border-neutral-700 shadow-sm"
              >
                <Maximize2 className="w-3 h-3 text-orange-400" />
                <span>Fit Bounds</span>
              </button>

              <button
                onClick={() => {
                  setCloseUpSearchTarget(selectedRegion.name);
                  setIsCloseUpModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-orange-950/80 hover:bg-orange-900 text-orange-300 font-semibold text-[10px] flex items-center gap-1 transition-colors cursor-pointer border border-orange-800/60 shadow-sm"
              >
                <Camera className="w-3 h-3 text-orange-400" />
                <span>NASA Close-Up</span>
              </button>

              <button
                onClick={() => setIsRegionDetailModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-blue-300 font-semibold text-[10px] flex items-center gap-1 transition-colors cursor-pointer border border-neutral-700 shadow-sm ml-auto"
              >
                <span>Full Dossier</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* BEAUTIFUL MODAL BACKDROP OVERLAY */}
        {activeTab && (
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-sm z-30 transition-opacity animate-in fade-in"
            onClick={() => setActiveTab(null)}
          />
        )}

        {/* BEAUTIFULLY STYLED MODAL (With Auto-Close on Actions) */}
        {activeTab && (
          <div className="fixed z-35 inset-x-2 bottom-16 top-14 sm:inset-auto sm:top-14 sm:right-6 sm:w-[420px] sm:max-h-[calc(100vh-5rem)] bg-[#0c101a]/98 backdrop-blur-2xl border border-neutral-700/80 rounded-2xl shadow-2xl shadow-black/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Top Accent Line */}
            <div
              className={`h-1 w-full ${
                activeTab === 'sites'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                  : activeTab === 'route'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  : activeTab === 'layers'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : activeTab === 'weather'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-purple-500 to-orange-500'
              }`}
            />

            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1 bg-neutral-700 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-[#0e1320]">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                {activeTab === 'sites' && (
                  <>
                    <MapPin className="w-4 h-4 text-orange-400" />
                    <span>Mars Mission Landmarks</span>
                  </>
                )}
                {activeTab === 'route' && (
                  <>
                    <Navigation className="w-4 h-4 text-cyan-400" />
                    <span>Traverse Route Planner</span>
                  </>
                )}
                {activeTab === 'layers' && (
                  <>
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Surface View & Clarity</span>
                  </>
                )}
                {activeTab === 'weather' && (
                  <>
                    <Thermometer className="w-4 h-4 text-amber-400" />
                    <span>Martian In-Situ Weather</span>
                  </>
                )}
                {activeTab === 'search' && (
                  <>
                    <Search className="w-4 h-4 text-orange-400" />
                    <span>Search Mars Database</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setActiveTab(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* TAB 0: SEARCH (Auto closes when selecting a site) */}
              {activeTab === 'search' && (
                <div className="space-y-3">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Type crater, rover, volcano name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 text-sm"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-400">
                    Click any location below to immediately fly to it on the map.
                  </p>

                  <div className="space-y-2 pt-1">
                    {filteredSites.map((site) => (
                      <div
                        key={site.id}
                        onClick={() => {
                          handleFlyTo(site); // Auto closes modal
                        }}
                        className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-orange-500 hover:bg-neutral-800/70 flex items-center justify-between cursor-pointer transition-all shadow-sm group"
                      >
                        <div>
                          <span className="font-bold text-white text-sm block group-hover:text-orange-400 transition-colors">
                            {site.name}
                          </span>
                          <span className="text-[11px] text-orange-400/90">{site.significance}</span>
                          <span className="text-[10px] text-neutral-400 block mt-0.5">{site.mission}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-400 group-hover:text-orange-400">
                          <span className="text-[11px] font-medium hidden sm:inline">Fly</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 1: LANDMARKS & ALL NAMED MARS FEATURES (Auto closes on "Fly to Site" or clicking card) */}
              {activeTab === 'sites' && (
                <div className="space-y-3">
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px]">
                    {[
                      'All',
                      'Robotic Rover/Lander',
                      'Mons (Volcano)',
                      'Crater',
                      'Chasma (Canyon)',
                      'Vallis (Valley/Riverbed)',
                      'Planitia (Plain)',
                      'Terra (Highland)',
                      'Chaos/Labyrinth',
                      'Polar Cap/Ice',
                      'Human Base Candidate',
                    ].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-orange-500 text-white shadow-sm font-bold'
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="bg-orange-950/20 border border-orange-800/30 p-2.5 rounded-xl flex items-center justify-between text-[11px] text-neutral-300">
                    <span>Showing <strong>{filteredSites.length}</strong> official IAU/NASA Martian features</span>
                    <span className="text-[10px] text-orange-400 font-mono">100% Comprehensive</span>
                  </div>

                  <div className="space-y-2.5">
                    {filteredSites.map((site) => {
                      const isSelected = selectedSite?.id === site.id;
                      return (
                        <div
                          key={site.id}
                          onClick={() => handleFlyTo(site)} // Auto-closes modal
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                            isSelected
                              ? 'bg-orange-950/50 border-orange-500 shadow-lg shadow-orange-950/40'
                              : 'bg-neutral-900/70 border-neutral-800/90 hover:border-orange-500/80 hover:bg-neutral-800/60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors">
                              {site.name}
                            </span>
                            <span
                              className="text-[9px] px-2 py-0.5 rounded font-bold bg-neutral-800 text-orange-300 border border-neutral-700"
                            >
                              {site.type || site.category}
                            </span>
                          </div>

                          <span className="block text-[11px] text-orange-400 font-semibold mb-1">
                            {site.originName || site.significance}
                          </span>
                          <p className="text-neutral-400 text-[11px] leading-relaxed mb-3">
                            {site.description}
                          </p>

                          <div className="grid grid-cols-2 gap-2 bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800 text-[10px] font-mono mb-3">
                            <div>
                              <span className="text-neutral-500 block text-[9px]">COORDINATES</span>
                              <span className="text-neutral-200">
                                {site.lat.toFixed(2)}°, {site.planetocentricLng.toFixed(2)}°E
                              </span>
                            </div>
                            <div>
                              <span className="text-neutral-500 block text-[9px]">ELEVATION / DIAMETER</span>
                              <span className="text-cyan-300 font-bold">
                                {site.elevation > 0 ? `+${site.elevation}` : site.elevation} m
                                {site.diameterKm ? ` (${site.diameterKm} km)` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFlyTo(site); // Auto-close!
                              }}
                              className="flex-1 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-center transition-colors cursor-pointer text-xs shadow-md shadow-orange-950"
                            >
                              Fly to Site
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCloseUpSearchTarget(site.name);
                                setIsCloseUpModalOpen(true);
                                setActiveTab(null);
                              }}
                              className="px-2.5 py-2 rounded-lg bg-orange-950/80 border border-orange-700/80 hover:bg-orange-900 text-orange-200 font-semibold transition-colors cursor-pointer text-xs flex items-center gap-1"
                              title="NASA In-Situ Close-Up"
                            >
                              <Camera className="w-3 h-3 text-orange-400" />
                              <span>Close-Up</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddSiteToRoute(site); // Auto-close!
                              }}
                              className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-700 border border-neutral-700 text-neutral-200 font-semibold transition-colors cursor-pointer text-xs"
                              title="Add to Route Waypoints"
                            >
                              + Route
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: ROUTE PLANNER (Auto closes on load preset or drop center) */}
              {activeTab === 'route' && (
                <div className="space-y-4">
                  {/* Explicit Plotting Mode Toggle (Directly addressing: map clicks auto-adding routes) */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    isRoutePlanningActive
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-lg shadow-cyan-950/50'
                      : 'bg-neutral-900/90 border-neutral-800'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`w-2 h-2 rounded-full ${isRoutePlanningActive ? 'bg-cyan-400 animate-ping' : 'bg-neutral-600'}`} />
                          <span className="font-bold text-white text-xs">
                            {isRoutePlanningActive ? 'Map-Click Mode: ACTIVE' : 'Map-Click Mode: DISABLED'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 leading-relaxed">
                          {isRoutePlanningActive
                            ? 'Clicking anywhere on the Mars map surface will now drop waypoints.'
                            : 'Clicking on the map will inspect coordinates only. It will NOT draw routes.'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const nextState = !isRoutePlanningActive;
                          setIsRoutePlanningActive(nextState);
                          if (nextState) {
                            setActiveTab(null); // Auto-close drawer so the user can immediately tap the map!
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer shadow ${
                          isRoutePlanningActive
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        }`}
                      >
                        {isRoutePlanningActive ? '⏹ Stop Mode' : '▶ Start Plotting'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-950/40 to-blue-950/20 border border-cyan-800/50 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300">Route Traverse Summary</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-200 font-mono">
                        {routeWaypoints.length} Waypoints
                      </span>
                    </div>

                    {routeStats ? (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800">
                          <span className="text-neutral-400 text-[10px] block">TOTAL DISTANCE</span>
                          <span className="text-white font-bold font-mono text-lg">
                            {routeStats.distanceKm} km
                          </span>
                        </div>
                        <div className="bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800">
                          <span className="text-neutral-400 text-[10px] block">EST. MARSWALK</span>
                          <span className="text-amber-300 font-bold font-mono text-lg">
                            {routeStats.estHours} hrs
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-neutral-400 text-[11px] leading-relaxed">
                        Activate plotting mode above, or click "Drop Waypoint at Center" to plot your traverse path.
                      </p>
                    )}
                  </div>

                  {/* Drop Waypoint at Center (Auto-Closes) */}
                  <button
                    onClick={handleAddWaypointAtCenter}
                    className="w-full py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs shadow-md shadow-cyan-950/60"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Drop Waypoint at Center & View Map</span>
                  </button>

                  {/* Load Perseverance Traverse Preset (Auto-Closes) */}
                  <button
                    onClick={handleLoadPerseveranceRoute}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-950/60 transition-all cursor-pointer text-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Load Perseverance Traverse (Auto-Close)</span>
                  </button>

                  {/* Undo & Clear Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleUndoWaypoint}
                      disabled={routeWaypoints.length === 0}
                      className="flex-1 py-2 px-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed border border-neutral-700 text-neutral-200 flex items-center justify-center gap-1.5 font-semibold transition-colors cursor-pointer text-xs"
                    >
                      <Undo className="w-3.5 h-3.5" />
                      <span>Undo Last</span>
                    </button>
                    <button
                      onClick={handleClearAllWaypoints}
                      disabled={routeWaypoints.length === 0}
                      className="flex-1 py-2 px-2 rounded-lg bg-neutral-900 hover:bg-red-950/60 hover:border-red-700 disabled:opacity-40 disabled:cursor-not-allowed border border-neutral-700 text-neutral-200 flex items-center justify-center gap-1.5 font-semibold transition-colors cursor-pointer text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  </div>

                  {/* Waypoints List */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                      Plotted Waypoints
                    </span>
                    {routeWaypoints.length === 0 ? (
                      <div className="p-4 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-xl text-xs">
                        No points plotted yet. Turn on plotting mode above or tap "Drop Waypoint at Center".
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {routeWaypoints.map((wp, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-center justify-between text-[11px]"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-neutral-200">{wp.name}</span>
                            </div>
                            <span className="text-neutral-400 font-mono text-[10px]">
                              {wp.lat.toFixed(2)}°, {wp.lng.toFixed(2)}°
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SURFACE VIEW & LAYERS (Auto closes on basemap/filter selection) */}
              {activeTab === 'layers' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                      Select Basemap (Clicking any Auto-Closes)
                    </span>
                    <div className="space-y-2">
                      <div
                        onClick={() => handleSelectLayer('viking')}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          activeLayer === 'viking'
                            ? 'bg-orange-950/50 border-orange-500 text-white shadow-md shadow-orange-950'
                            : 'bg-neutral-900/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80 hover:border-neutral-700'
                        }`}
                      >
                        <div className="mt-0.5">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              activeLayer === 'viking' ? 'text-orange-400' : 'text-neutral-600'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold block text-xs">NASA Viking MDIM 2.1 (True Color)</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-900/60 border border-amber-700/50 text-[9px] font-mono text-amber-300 font-bold">
                              True Color • Primary Default
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 leading-normal">
                            True planetary natural color mosaic captured by NASA Viking Orbiter cameras.
                          </span>
                        </div>
                      </div>

                      <div
                        onClick={() => handleSelectLayer('themis')}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          activeLayer === 'themis'
                            ? 'bg-orange-950/50 border-orange-500 text-white shadow-md shadow-orange-950'
                            : 'bg-neutral-900/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80 hover:border-neutral-700'
                        }`}
                      >
                        <div className="mt-0.5">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              activeLayer === 'themis' ? 'text-orange-400' : 'text-neutral-600'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold block text-xs">NASA THEMIS 100m High-Res IR</span>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-900/60 border border-emerald-700/50 text-[9px] font-mono text-emerald-300 font-bold">
                              100m Sharp
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 leading-normal">
                            High-resolution daytime infrared mosaic from Mars Odyssey spacecraft. Highest native detail on global scale.
                          </span>
                        </div>
                      </div>

                      <div
                        onClick={() => handleSelectLayer('mola')}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          activeLayer === 'mola'
                            ? 'bg-orange-950/50 border-orange-500 text-white shadow-md shadow-orange-950'
                            : 'bg-neutral-900/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80 hover:border-neutral-700'
                        }`}
                      >
                        <div className="mt-0.5">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              activeLayer === 'mola' ? 'text-orange-400' : 'text-neutral-600'
                            }`}
                          />
                        </div>
                        <div>
                          <span className="font-bold block text-xs">NASA MGS MOLA Topographic Relief</span>
                          <span className="text-[10px] text-neutral-400 leading-normal">
                            Color-coded elevation shading displaying craters, mountains, and canyon depths.
                          </span>
                        </div>
                      </div>

                      <div
                        onClick={() => handleSelectLayer('opm')}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          activeLayer === 'opm'
                            ? 'bg-orange-950/50 border-orange-500 text-white shadow-md shadow-orange-950'
                            : 'bg-neutral-900/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80 hover:border-neutral-700'
                        }`}
                      >
                        <div className="mt-0.5">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              activeLayer === 'opm' ? 'text-orange-400' : 'text-neutral-600'
                            }`}
                          />
                        </div>
                        <div>
                          <span className="font-bold block text-xs">OpenPlanetary High-Contrast Basemap</span>
                          <span className="text-[10px] text-neutral-400 leading-normal">
                            Clean cartographic vector and raster composite from USGS Astrogeology.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Surface Clarity & Enhancement */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                      Surface Lighting & Clarity (Auto-Closes)
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      <button
                        onClick={() => handleSelectFilter('normal')}
                        className={`p-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                          surfaceFilter === 'normal'
                            ? 'bg-neutral-700 text-white border-neutral-400 shadow-md'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        Normal
                      </button>
                      <button
                        onClick={() => handleSelectFilter('contrast')}
                        className={`p-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                          surfaceFilter === 'contrast'
                            ? 'bg-orange-600 text-white border-orange-400 shadow-md'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        Contrast
                      </button>
                      <button
                        onClick={() => handleSelectFilter('sharp')}
                        className={`p-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                          surfaceFilter === 'sharp'
                            ? 'bg-orange-600 text-white border-orange-400 shadow-md'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        Sharp
                      </button>
                      <button
                        onClick={() => handleSelectFilter('dark')}
                        className={`p-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                          surfaceFilter === 'dark'
                            ? 'bg-neutral-800 text-amber-300 border-amber-500 shadow-md'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                        title="Dark Surface Mode (Reduces glare, deep space tones)"
                      >
                        Dark
                      </button>
                      <button
                        onClick={() => handleSelectFilter('night')}
                        className={`p-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                          surfaceFilter === 'night'
                            ? 'bg-indigo-950 text-indigo-200 border-indigo-400 shadow-md'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                        title="Night Blue Infrared Surface"
                      >
                        Night
                      </button>
                    </div>
                  </div>

                  {/* Map Overlays Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                        Overlays & Grids
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMissionLayersPanelOpen(true);
                          setActiveTab(null);
                        }}
                        className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold cursor-pointer underline flex items-center gap-1"
                      >
                        <Layers className="w-3 h-3" />
                        <span>Advanced Mission Layers</span>
                      </button>
                    </div>
                    <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 space-y-2.5">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-neutral-200">Show Mission Landmarks</span>
                        <input
                          type="checkbox"
                          checked={showSites}
                          onChange={(e) => setShowSites(e.target.checked)}
                          className="accent-orange-500 rounded w-4 h-4"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-neutral-200">Rover Traverse Paths</span>
                        <input
                          type="checkbox"
                          checked={showRoverTrack}
                          onChange={(e) => setShowRoverTrack(e.target.checked)}
                          className="accent-orange-500 rounded w-4 h-4"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-neutral-200">Latitude & Longitude Grid</span>
                        <input
                          type="checkbox"
                          checked={showGraticule}
                          onChange={(e) => setShowGraticule(e.target.checked)}
                          className="accent-orange-500 rounded w-4 h-4"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-neutral-800/60">
                        <div className="flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-neutral-200">Dust Storm & Atmosphere</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={showDustStormOverlay}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setShowDustStormOverlay(val);
                            if (val) setIsDustStormPanelOpen(true);
                            setMissionLayerOptions((prev) => ({ ...prev, showDustStormOverlay: val }));
                          }}
                          className="accent-amber-500 rounded w-4 h-4 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Google Maps-style Boundary Framework Section */}
                  <div className="space-y-2.5 pt-3 border-t border-neutral-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                        Google Maps Boundary System
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded font-bold font-mono bg-red-950 border border-red-800 text-red-300">
                        {activeRegions.length} Areas
                      </span>
                    </div>

                    {/* Dataset Choice */}
                    <div className="grid grid-cols-2 gap-1.5 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
                      <button
                        onClick={() => setRegionDataset('usgs')}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                          regionDataset === 'usgs'
                            ? 'bg-neutral-800 text-white shadow border border-neutral-700'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <span>USGS 30 Quads</span>
                        <span className="text-[8.5px] font-normal opacity-70">100% Global Grid</span>
                      </button>
                      <button
                        onClick={() => setRegionDataset('geological')}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                          regionDataset === 'geological'
                            ? 'bg-neutral-800 text-white shadow border border-neutral-700'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <span>Geological</span>
                        <span className="text-[8.5px] font-normal opacity-70">Natural Provinces</span>
                      </button>
                    </div>

                    <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 space-y-2.5">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-neutral-200 block font-semibold text-xs">Show Area Borders</span>
                          <span className="text-[10px] text-neutral-400">Hairline boundary lines, no opaque fill</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={showRegions}
                          onChange={(e) => setShowRegions(e.target.checked)}
                          className="accent-[#ea4335] rounded w-4 h-4"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-neutral-800/60">
                        <div>
                          <span className="text-neutral-200 block font-semibold text-xs">Show Typography Labels</span>
                          <span className="text-[10px] text-neutral-400">Subtle names on satellite basemap</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={showRegionLabels}
                          onChange={(e) => setShowRegionLabels(e.target.checked)}
                          className="accent-[#ea4335] rounded w-4 h-4"
                        />
                      </label>
                    </div>

                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block pt-1">
                      Browse & Inspect Areas:
                    </span>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {activeRegions.map((reg) => {
                        const count = ALL_MARS_FEATURES.filter((f) =>
                          isPointInMarsRegion(f.lat, f.lng, reg.polygon)
                        ).length;
                        const isSelected = selectedRegion?.id === reg.id;
                        return (
                          <div
                            key={reg.id}
                            onClick={() => {
                              setSelectedRegion(reg);
                              setShowRegions(true);
                              setActiveTab(null);
                              const polygon = L.polygon(reg.polygon);
                              mapInstanceRef.current?.fitBounds(polygon.getBounds(), {
                                padding: [50, 50],
                                maxZoom: 7,
                              });
                            }}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all group ${
                              isSelected
                                ? 'bg-red-950/40 border-[#ea4335]'
                                : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 hover:border-neutral-600'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  isSelected ? 'bg-[#ea4335] shadow-[0_0_8px_#ea4335]' : 'bg-neutral-500'
                                }`}
                              />
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-white font-bold text-xs group-hover:text-red-300 truncate">
                                    {reg.name}
                                  </span>
                                  {reg.quadCode && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
                                      {reg.quadCode}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-neutral-400 block truncate">
                                  {reg.areaKm2.toLocaleString()} km² • {reg.category}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-amber-300 font-mono shrink-0 ml-2 px-1.5 py-0.5 rounded bg-black/40 border border-neutral-700">
                              {count} inside
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WEATHER & NASA REAL-TIME TELEMETRY */}
              {activeTab === 'weather' && (
                <div className="space-y-4">
                  {/* Real-Time Earth-Mars Interplanetary Orbital Link */}
                  <div className="bg-gradient-to-br from-neutral-900 to-[#0f172a] border border-cyan-800/40 p-3.5 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                        <Satellite className="w-4 h-4 text-cyan-400" />
                        <span>NASA Deep Space Network Orbital Link</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        LIVE EPHEMERIS
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="bg-black/40 p-2 rounded-lg border border-neutral-800">
                        <span className="text-neutral-400 text-[9px] block">EARTH-MARS DISTANCE</span>
                        <span className="text-white font-bold text-xs">
                          {ephemeris.earthMarsDistanceKm.toLocaleString()} km
                        </span>
                        <span className="text-cyan-300/80 text-[10px] block">
                          ({ephemeris.earthMarsDistanceAU.toFixed(3)} AU)
                        </span>
                      </div>
                      <div className="bg-black/40 p-2 rounded-lg border border-neutral-800">
                        <span className="text-neutral-400 text-[9px] block">RADIO LIGHT-LAG (ONE-WAY)</span>
                        <span className="text-amber-300 font-bold text-xs">
                          {ephemeris.lightTravelTimeMinutes}m {ephemeris.lightTravelTimeSeconds}s
                        </span>
                        <span className="text-neutral-400 text-[10px] block">
                          round-trip: ~{(ephemeris.lightTravelTimeMinutes * 2)}m
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[10px] bg-black/30 p-2 rounded-lg border border-neutral-800/80">
                      <div>
                        <span className="text-neutral-400 block text-[9px]">SOLAR LONGITUDE (Ls)</span>
                        <span className="text-orange-300 font-bold font-mono">
                          {ephemeris.solarLongitudeLs.toFixed(1)}°
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[9px]">MARTIAN SEASON</span>
                        <span className="text-neutral-200 font-semibold truncate block">
                          {ephemeris.marsSeason.split('/')[0]}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[9px]">PERSEVERANCE SOL</span>
                        <span className="text-cyan-300 font-bold font-mono">
                          Sol {ephemeris.perseveranceSol}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Weather Station Selector & Header */}
                  <div className="bg-gradient-to-br from-amber-950/40 to-orange-950/20 border border-amber-800/40 p-3.5 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Thermometer className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-amber-300 text-xs">
                          {activeWeatherStation === 'perseverance' ? 'Perseverance MEDA Station' : 'InSight TWINS Station'}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-800 font-mono">
                        Sol {currentWeather?.sol || ephemeris.perseveranceSol}
                      </span>
                    </div>

                    {/* Station Switcher */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-lg border border-neutral-800 text-[11px]">
                      <button
                        onClick={() => setActiveWeatherStation('perseverance')}
                        className={`py-1 rounded font-semibold transition-all cursor-pointer ${
                          activeWeatherStation === 'perseverance'
                            ? 'bg-amber-600 text-white font-bold'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Jezero Crater (Perseverance)
                      </button>
                      <button
                        onClick={() => setActiveWeatherStation('insight')}
                        className={`py-1 rounded font-semibold transition-all cursor-pointer ${
                          activeWeatherStation === 'insight'
                            ? 'bg-amber-600 text-white font-bold'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Elysium Planitia (InSight)
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span>{currentWeather?.source || 'NASA Planetary Data System (PDS)'}</span>
                      <span>Earth Date: {currentWeather?.terrestrialDate || new Date().toISOString().split('T')[0]}</span>
                    </div>
                  </div>

                  {/* Dynamic 4-Metric Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800">
                      <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
                        <Thermometer className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-bold text-neutral-400">Air / Surface Temp</span>
                      </div>
                      <span className="text-xl font-bold font-mono text-white">
                        {currentWeather?.airTempAvgC !== undefined ? `${currentWeather.airTempAvgC}°C` : '-62°C'}
                      </span>
                      <span className="block text-[10px] text-neutral-400 mt-0.5">
                        Min: {currentWeather?.airTempMinC ?? -84}°C / Max: {currentWeather?.airTempMaxC ?? -14}°C
                      </span>
                      <span className="block text-[9px] text-neutral-500 font-mono">
                        Ground: {currentWeather?.groundTempMaxC ?? -10}°C
                      </span>
                    </div>

                    <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800">
                      <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                        <Gauge className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-bold text-neutral-400">Pressure</span>
                      </div>
                      <span className="text-xl font-bold font-mono text-white">
                        {currentWeather?.pressurePa ?? 745} Pa
                      </span>
                      <span className="block text-[10px] text-neutral-400 mt-0.5">
                        {currentWeather ? (currentWeather.pressurePa / 100).toFixed(2) : '7.45'} hPa
                      </span>
                      <span className="block text-[9px] text-neutral-500">
                        {currentWeather ? ((currentWeather.pressurePa / 101325) * 100).toFixed(2) : '0.74'}% of Earth sea-level
                      </span>
                    </div>

                    <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800">
                      <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                        <Wind className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-bold text-neutral-400">Wind Velocity</span>
                      </div>
                      <span className="text-xl font-bold font-mono text-white">
                        {currentWeather?.windSpeedMps ?? 5.2} m/s
                      </span>
                      <span className="block text-[10px] text-neutral-400 mt-0.5">
                        Gusts: {currentWeather ? (currentWeather.windSpeedMps * 1.8).toFixed(1) : '12'} m/s
                      </span>
                      <span className="block text-[9px] text-neutral-500">
                        Heading: {currentWeather?.windDirectionDegrees ?? 245}°
                      </span>
                    </div>

                    <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800">
                      <div className="flex items-center gap-1.5 text-orange-400 mb-1">
                        <Sun className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-bold text-neutral-400">Dust & Solar</span>
                      </div>
                      <span className="text-xl font-bold font-mono text-white">
                        τ {currentWeather?.dustOpacityTau ?? 0.42}
                      </span>
                      <span className="block text-[10px] text-neutral-400 mt-0.5">
                        Atm. Optical Depth (Tau)
                      </span>
                      <span className="block text-[9px] text-amber-300 font-mono">
                        UV Index: {currentWeather?.uvIndex || 'High'}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Sol Historic Trend */}
                  {liveWeather.length > 1 && (
                    <div className="bg-neutral-900/70 p-3 rounded-xl border border-neutral-800 space-y-2">
                      <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
                        Recent 5-Sol Atmospheric Record
                      </span>
                      <div className="grid grid-cols-5 gap-1 text-center font-mono">
                        {liveWeather.slice(0, 5).map((s: MarsLiveWeather) => (
                          <div key={s.sol} className="bg-black/40 p-1.5 rounded border border-neutral-800/80">
                            <span className="text-[9px] text-orange-400 block font-bold">Sol {s.sol}</span>
                            <span className="text-[10px] text-white block">{s.airTempMaxC}°C</span>
                            <span className="text-[8px] text-cyan-400 block">{s.airTempMinC}°C</span>
                            <span className="text-[8px] text-neutral-500 block">{s.pressurePa}Pa</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* REAL NASA RAW ROVER PHOTOGRAPHS STREAM */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-orange-400" />
                        <span className="font-bold text-white text-xs">NASA Mars Rover Raw Imagery</span>
                      </div>
                      <span className="text-[9px] text-cyan-400 font-mono">NASA Open API</span>
                    </div>

                    <div className="space-y-2">
                      {roverPhotos.length > 0 ? (
                        roverPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            className="bg-neutral-900/90 rounded-xl border border-neutral-800 overflow-hidden group shadow-md"
                          >
                            <div className="relative aspect-video bg-neutral-950 overflow-hidden">
                              <img
                                src={photo.imgSrc}
                                alt={`Mars Rover ${photo.cameraFullName}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-orange-300 border border-neutral-700">
                                {photo.roverName} • Sol {photo.sol}
                              </div>
                              <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-neutral-200 border border-neutral-700">
                                {photo.cameraName}
                              </div>
                            </div>
                            <div className="p-2.5 flex items-center justify-between text-[10px]">
                              <div>
                                <span className="font-semibold text-white block truncate max-w-[240px]">
                                  {photo.cameraFullName}
                                </span>
                                <span className="text-neutral-500 text-[9px]">Taken: {photo.earthDate}</span>
                              </div>
                              <a
                                href={photo.imgSrc}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-medium flex items-center gap-1 transition-colors"
                              >
                                <span>Full Res</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-xl">
                          Loading raw NASA rover stream...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with One-Click Close & View Map */}
            <div className="p-3 border-t border-neutral-800 bg-[#0c101a] shrink-0">
              <button
                onClick={() => setActiveTab(null)}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Close & View Map
              </button>
            </div>
          </div>
        )}

        {/* Live Coordinate Status Bar (Bottom Center) - Only visible when not inspecting a point or site to prevent mobile overlap */}
        {!inspectedPoint && !selectedSite && !isRoutePlanningActive && (
          <div className="absolute bottom-16 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 bg-[#0c101a]/90 backdrop-blur-md border border-neutral-800/80 px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs text-neutral-300 shadow-xl flex items-center gap-2.5 sm:gap-4 pointer-events-auto whitespace-nowrap transition-all duration-300 opacity-100 translate-y-0">
            <div className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>
                Lat: <strong className="text-white font-mono">{cursorPos ? `${cursorPos.lat}°` : '18.38°N'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-neutral-800 pl-2.5 sm:pl-3">
              <span>
                Lng (E): <strong className="text-white font-mono">{cursorPos ? `${cursorPos.eastLng}°E` : '77.58°E'}</strong>
              </span>
            </div>
            {routeStats && (
              <div className="hidden sm:flex items-center gap-1.5 border-l border-neutral-800 pl-3">
                <span>
                  Route: <strong className="text-cyan-300 font-mono">{routeStats.distanceKm} km</strong>
                </span>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* DEDICATED MOBILE BOTTOM NAVBAR: 100% Desktop Feature Parity on Touch Devices */}
      <nav className="md:hidden z-30 bg-[#0c101a]/98 backdrop-blur-xl border-t border-neutral-800/80 px-1.5 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-between sm:justify-around overflow-x-auto no-scrollbar scroll-smooth gap-1 shadow-2xl shrink-0">
        <button
          onClick={() => setActiveTab(activeTab === 'sites' ? null : 'sites')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] shrink-0 active:scale-95 ${
            activeTab === 'sites' ? 'text-orange-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'sites' ? 'bg-orange-950/80' : ''}`}>
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] mt-0.5 tracking-tight">Landmarks</span>
        </button>

        <button
          onClick={() => setIsMissionExplorerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] shrink-0 active:scale-95 ${
            isMissionExplorerOpen ? 'text-cyan-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${isMissionExplorerOpen ? 'bg-cyan-950/80' : ''}`}>
            <Radio className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] mt-0.5 tracking-tight">Missions</span>
        </button>

        <button
          onClick={() => setIsHumanMissionModeOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] shrink-0 active:scale-95 ${
            isHumanMissionModeOpen ? 'text-blue-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${isHumanMissionModeOpen ? 'bg-blue-950/80' : ''}`}>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] mt-0.5 tracking-tight">Human Base</span>
        </button>

        <button
          onClick={() => setIsMeasureToolOpen(!isMeasureToolOpen)}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] shrink-0 active:scale-95 ${
            isMeasureToolOpen ? 'text-emerald-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${isMeasureToolOpen ? 'bg-emerald-950/80' : ''}`}>
            <Ruler className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] mt-0.5 tracking-tight">Measure</span>
        </button>

        <button
          onClick={() => {
            if (isElevationProfileOpen) {
              setIsElevationProfileOpen(false);
            } else if (elevationProfile) {
              setIsElevationProfileOpen(true);
            } else {
              setIsDrawingElevationLine(true);
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] shrink-0 active:scale-95 ${
            isElevationProfileOpen || isDrawingElevationLine ? 'text-orange-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="MGS MOLA Elevation Transect"
        >
          <div className={`p-1 rounded-lg ${isElevationProfileOpen || isDrawingElevationLine ? 'bg-orange-950/80' : ''}`}>
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] mt-0.5 tracking-tight">Elevation</span>
        </button>

        <button
          onClick={() => setIsAskMarsWayOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] shrink-0 active:scale-95 ${
            isAskMarsWayOpen ? 'text-purple-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${isAskMarsWayOpen ? 'bg-purple-950/80' : ''}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] mt-0.5 tracking-tight">Ask AI</span>
        </button>

        <button
          onClick={() => setIsLiveVoiceOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] shrink-0 active:scale-95 ${
            isLiveVoiceOpen ? 'text-purple-300 font-bold' : 'text-purple-300 hover:text-purple-100'
          }`}
          title="Live Voice Comms with gemini-3.8-live"
        >
          <div className={`p-1 rounded-lg ${isLiveVoiceOpen ? 'bg-purple-900/90' : 'bg-purple-950/60'}`}>
            <Radio className="w-4 h-4 text-purple-300 animate-pulse" />
          </div>
          <span className="text-[9.5px] mt-0.5 tracking-tight font-semibold">Voice</span>
        </button>

        <button
          onClick={() => setIsHamburgerOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] shrink-0 active:scale-95 text-neutral-400 hover:text-white"
        >
          <div className="p-1 rounded-lg">
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] mt-0.5 tracking-tight">Menu</span>
        </button>
      </nav>

      {/* GOOGLE MAPS STYLE REGION DOSSIER MODAL */}
      <MarsRegionDetailModal
        region={isRegionDetailModalOpen ? selectedRegion : null}
        featuresInside={featuresInsideSelectedRegion}
        onClose={() => setIsRegionDetailModalOpen(false)}
        onFlyToFeature={(feature: MarsFeature) => {
          setIsRegionDetailModalOpen(false);
          mapInstanceRef.current?.setView([feature.lat, feature.lng], 6, {
            animate: true,
          });
          const site = FAMOUS_MARS_SITES.find((s) => s.name === feature.name);
          if (site) {
            setSelectedSite(site);
          }
        }}
        onFitRegionBounds={(region: MarsRegion) => {
          const polygon = L.polygon(region.polygon);
          mapInstanceRef.current?.fitBounds(polygon.getBounds(), {
            padding: [40, 40],
          });
        }}
        onOpenNASAImages={(query: string) => {
          setCloseUpSearchTarget(query);
          setIsCloseUpModalOpen(true);
        }}
      />

      {/* REAL NASA IN-SITU CLOSE-UP MODAL (25cm/px HiRISE & Rover Micro-Imagers) */}
      <NASACloseUpModal
        isOpen={isCloseUpModalOpen}
        onClose={() => setIsCloseUpModalOpen(false)}
        initialQuery={closeUpSearchTarget}
        featureName={closeUpSearchTarget}
      />

      {/* PLANETARY SCIENCE & ENVIRONMENTAL DOSSIER MODAL */}
      {scienceDossierTarget && (
        <MarsScienceDossierModal
          isOpen={isScienceDossierOpen}
          onClose={() => setIsScienceDossierOpen(false)}
          lat={scienceDossierTarget.lat}
          lng={scienceDossierTarget.lng}
          elevationM={scienceDossierTarget.elevationM}
          featureName={scienceDossierTarget.name}
          featureType={scienceDossierTarget.type}
          onOpenNASACloseUp={(name) => {
            setCloseUpSearchTarget(name);
            setIsCloseUpModalOpen(true);
          }}
        />
      )}

      {/* MARSWAY MISSION EXPLORER DRAWER */}
      <MissionExplorerDrawer
        isOpen={isMissionExplorerOpen}
        onClose={() => setIsMissionExplorerOpen(false)}
        selectedMissionId={selectedMissionId}
        onSelectMission={(mission) => {
          setSelectedMissionId(mission.id);
          if (mission.lat !== undefined && mission.lng !== undefined) {
            mapInstanceRef.current?.flyTo([mission.lat, mission.lng], 7, {
              duration: 1.2,
            });
          }
        }}
        onFlyToLocation={(lat, lng, zoom, name) => {
          mapInstanceRef.current?.flyTo([lat, lng], zoom ?? 7, { duration: 1.2 });
        }}
      />

      {/* HUMAN MISSION LANDING & HABITATION MODE */}
      <HumanMissionMode
        isOpen={isHumanMissionModeOpen}
        onClose={() => setIsHumanMissionModeOpen(false)}
        onFlyToLocation={(lat, lng, zoom, name) => {
          handleFlyToLocation(lat, lng, zoom ?? 6, name);
        }}
      />

      {/* UNIVERSAL SEARCH MODAL */}
      <MarsSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectResult={(result) => {
          setIsSearchModalOpen(false);
          handleFlyToLocation(result.lat, result.lng, result.zoom ?? 6, result.name, result.elevationM);
          if (result.elevationM !== undefined) {
            marsSonification.sonifyLocation(result.elevationM, 2);
          }
        }}
      />

      {/* HISTORICAL EXPLORATION TIMELINE */}
      <MarsTimeline
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        onFlyToLocation={(lat, lng, zoom, name) => {
          handleFlyToLocation(lat, lng, zoom ?? 6, name);
        }}
        onSelectMissionById={(missionId) => {
          setSelectedMissionId(missionId);
          setIsMissionExplorerOpen(true);
        }}
      />

      {/* DUAL-SITE COMPARISON MATRIX */}
      <CompareSitesModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        initialSite1Id={compareSite1Id}
        initialSite2Id={compareSite2Id}
        onFlyToLocation={(lat, lng, zoom, name) => {
          handleFlyToLocation(lat, lng, zoom ?? 6, name);
        }}
      />

      {/* SCIENTIFIC DATA SOURCES & PROVENANCE MODAL */}
      <DataSourcesModal
        isOpen={isDataSourcesModalOpen}
        onClose={() => setIsDataSourcesModalOpen(false)}
      />

      {/* SAVED WAYPOINTS & BOOKMARKS MODAL */}
      <MarsBookmarksModal
        isOpen={isBookmarksModalOpen}
        onClose={() => setIsBookmarksModalOpen(false)}
        currentLocation={
          cursorPos
            ? {
                lat: cursorPos.lat,
                lng: cursorPos.lng,
                name: inspectedPoint?.nearestFeature?.name,
                elevationM: inspectedPoint?.nearestFeature?.elevationM,
              }
            : null
        }
        onFlyToLocation={(lat, lng, zoom, name) => {
          handleFlyToLocation(lat, lng, zoom ?? 6, name);
        }}
      />

      {/* GIS DISTANCE & AREA MEASUREMENT FLOATING TOOL */}
      <MarsMeasurementTool
        isOpen={isMeasureToolOpen}
        onClose={() => setIsMeasureToolOpen(false)}
        points={measurePoints}
        onClear={() => setMeasurePoints([])}
        onUndo={() => setMeasurePoints((prev) => prev.slice(0, -1))}
        measurementMode={measureMode}
        onChangeMode={(mode) => setMeasureMode(mode)}
        onOpenElevationProfile={() => {
          if (measurePoints.length >= 2) {
            const ptA = measurePoints[0];
            const ptB = measurePoints[measurePoints.length - 1];
            const nameA = `Measure Pt 1 (${ptA.lat.toFixed(2)}°, ${ptA.lng.toFixed(2)}°)`;
            const nameB = `Measure Pt ${measurePoints.length} (${ptB.lat.toFixed(2)}°, ${ptB.lng.toFixed(2)}°)`;
            setElevationPoints([
              { lat: ptA.lat, lng: ptA.lng, name: nameA },
              { lat: ptB.lat, lng: ptB.lng, name: nameB },
            ]);
            const prof = generateElevationTransect(ptA.lat, ptA.lng, ptB.lat, ptB.lng, 120, nameA, nameB);
            setElevationProfile(prof);
            setIsElevationProfileOpen(true);
            setIsMeasureToolOpen(false);
          }
        }}
      />

      {/* MGS MOLA ELEVATION PROFILE & TERRAIN STEEPNESS MODAL */}
      <ElevationProfileModal
        isOpen={isElevationProfileOpen}
        onClose={() => {
          setIsElevationProfileOpen(false);
          setHoveredElevationSample(null);
        }}
        profile={elevationProfile}
        onReversePoints={handleReverseElevationPoints}
        onSelectPreset={handleSelectElevationPreset}
        onHoverSamplePoint={(sample) => setHoveredElevationSample(sample)}
        onFlyToCoord={(lat, lng, name) => handleFlyToLocation(lat, lng, 6, name)}
        onStartDrawing={() => {
          setIsElevationProfileOpen(false);
          setElevationPoints([]);
          setElevationProfile(null);
          setIsDrawingElevationLine(true);
        }}
        isDrawingActive={isDrawingElevationLine}
      />

      {/* ONBOARDING & PLATFORM TOUR MODAL */}
      <MarsPlatformTourModal
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        onSelectAction={(action) => {
          setIsTourModalOpen(false);
          if (action === 'globe') setViewMode('3d');
          else if (action === 'missions') setIsMissionExplorerOpen(true);
          else if (action === 'human') setIsHumanMissionModeOpen(true);
          else if (action === 'layers') setActiveTab('layers');
          else if (action === 'ai') setIsAskMarsWayOpen(true);
        }}
      />

      {/* INTERACTIVE PRESENTATION MODE */}
      <MarsPresentationMode
        isOpen={isPresentationModeOpen}
        onClose={() => setIsPresentationModeOpen(false)}
        onSelectLayer={(layer) => setActiveLayer(layer)}
        onFlyToLocation={(lat, lng, zoom, name) => {
          handleFlyToLocation(lat, lng, zoom ?? 6, name);
        }}
      />

      {/* ASK MARSWAY AI SPATIAL ASSISTANT */}
      <AskMarsWayModal
        isOpen={isAskMarsWayOpen}
        onClose={() => setIsAskMarsWayOpen(false)}
        currentContext={{
          lat: cursorPos?.lat,
          lng: cursorPos?.lng,
          name: inspectedPoint?.nearestFeature?.name,
          activeLayer,
        }}
        onFlyToLocation={(lat, lng, zoom, name) => {
          handleFlyToLocation(lat, lng, zoom ?? 6, name);
        }}
        onOpenMissions={(missionId) => {
          setSelectedMissionId(missionId);
          setIsMissionExplorerOpen(true);
        }}
        onOpenHumanMode={() => setIsHumanMissionModeOpen(true)}
        onOpenCompare={(s1, s2) => {
          if (s1) setCompareSite1Id(s1);
          if (s2) setCompareSite2Id(s2);
          setIsCompareModalOpen(true);
        }}
        onSelectLayer={(layer) => setActiveLayer(layer)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
      />

      {/* GEMINI LIVE VOICE COMMS (gemini-3.8-live) */}
      <MarsLiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        currentLat={cursorPos?.lat ?? 18.38}
        currentLng={cursorPos?.lng ?? 77.58}
        currentZoom={currentZoom}
        onFlyToLocation={(lat, lng, targetZoom, name) => {
          handleFlyToLocation(lat, lng, targetZoom ?? 6, name);
        }}
        onSelectMission={(missionId) => {
          setSelectedMissionId(missionId);
          setIsMissionExplorerOpen(true);
        }}
        onToggleLayer={(layerId) => {
          setActiveLayer(layerId as any);
        }}
      />

      {/* HISTORICAL NASA/ESA MISSIONS & ROVER TRAVERSES LAYER CONTROL PANEL */}
      {isMissionLayersPanelOpen && (
        <div className="absolute top-14 sm:top-14 left-2 sm:left-14 z-30 pointer-events-auto max-w-[96vw] sm:max-w-xs animate-in fade-in zoom-in-95 duration-200">
          <MarsLayerControlPanel
            isOpen={isMissionLayersPanelOpen}
            onClose={() => setIsMissionLayersPanelOpen(false)}
            options={missionLayerOptions}
            onChangeOptions={(newOpts) => {
              setMissionLayerOptions((prev) => ({ ...prev, ...newOpts }));
              if (newOpts.showAllMissions !== undefined) {
                setShowSites(newOpts.showAllMissions);
              }
              if (newOpts.showTraverseTracks !== undefined) {
                setShowRoverTrack(newOpts.showTraverseTracks);
              }
              if (newOpts.showDustStormOverlay !== undefined) {
                setShowDustStormOverlay(newOpts.showDustStormOverlay);
                if (newOpts.showDustStormOverlay) {
                  setIsDustStormPanelOpen(true);
                }
              }
            }}
            onFlyToMission={(lat, lng, zoom, name) => {
              mapInstanceRef.current?.flyTo([lat, lng], zoom || 7, { duration: 1.2 });
              if (name) {
                const matchingSite = FAMOUS_MARS_SITES.find(
                  (s) =>
                    s.name.toLowerCase().includes(name.toLowerCase()) ||
                    name.toLowerCase().includes(s.name.toLowerCase())
                );
                if (matchingSite) {
                  setSelectedSite(matchingSite);
                }
              }
            }}
          />
        </div>
      )}

      {/* Esri-style Earth vs Mars Physical Scale Comparison Modal */}
      <EarthScaleComparisonModal
        isOpen={isEarthComparisonOpen}
        onClose={() => setIsEarthComparisonOpen(false)}
        activeComparisonId={selectedEarthComparisonId}
        onSelectComparison={(item) => {
          setSelectedEarthComparisonId(item.id);
          setActiveEarthComparison(item);
        }}
        onFlyToMartianFeature={(lat, lng, zoom = 5) => {
          setViewMode('2d');
          setTimeout(() => {
            mapInstanceRef.current?.flyTo([lat, lng], zoom, { duration: 1.2 });
          }, 50);
        }}
        onToggleMapOverlay={(item) => {
          setActiveEarthComparison(item);
        }}
        isOverlayActiveOnMap={!!activeEarthComparison}
      />

      {/* Comprehensive Esri-style Mars Place Nomenclature & Scientific Identifier Modal */}
      <MarsPlaceIdentifierModal
        isOpen={isPlaceIdentifierOpen}
        onClose={() => setIsPlaceIdentifierOpen(false)}
        feature={placeIdentifierFeature}
        onFlyTo={(lat, lng, zoom = 5) => {
          setViewMode('2d');
          setTimeout(() => {
            mapInstanceRef.current?.flyTo([lat, lng], zoom, { duration: 1.2 });
          }, 50);
        }}
        onOpenNASACloseUp={(featureName) => {
          setCloseUpSearchTarget(featureName);
          setIsCloseUpModalOpen(true);
        }}
        onOpenEarthComparison={(featId) => {
          const match = EARTH_MARS_COMPARISONS.find(
            (c) => c.marsFeatureId === featId || c.id === featId
          );
          if (match) {
            setSelectedEarthComparisonId(match.id);
            setActiveEarthComparison(match);
          }
          setIsEarthComparisonOpen(true);
        }}
        onAddToRoute={(feat) => {
          handleAddSiteToRoute(feat as any);
        }}
      />

      {/* REAL-TIME DUST STORM & ATMOSPHERIC OPACITY SIMULATION CONTROL PANEL */}
      {isDustStormPanelOpen && (
        <div className="absolute top-14 sm:top-14 right-2 sm:right-14 z-30 pointer-events-auto max-w-[96vw] sm:max-w-md max-h-[calc(100vh-120px)] animate-in fade-in zoom-in-95 duration-200">
          <MarsDustStormLayerControl
            isOpen={isDustStormPanelOpen}
            onClose={() => setIsDustStormPanelOpen(false)}
            isEnabled={showDustStormOverlay}
            onToggleEnabled={(enabled) => {
              setShowDustStormOverlay(enabled);
              setMissionLayerOptions((prev) => ({ ...prev, showDustStormOverlay: enabled }));
            }}
            layerOpacity={dustLayerOpacity}
            onChangeOpacity={setDustLayerOpacity}
            simulationState={dustSimulationState}
            onChangeScenario={(scenario, customLs) => {
              const updated = getSeasonalDustSimulation(scenario, customLs);
              setDustSimulationState(updated);
            }}
            showStormVortices={showStormVortices}
            onToggleStormVortices={setShowStormVortices}
            showWindVectors={showWindVectors}
            onToggleWindVectors={setShowWindVectors}
            onFlyToStorm={handleFlyToStorm}
            inspectedPoint={inspectedAtmosphericPoint}
            onClearInspectedPoint={() => setInspectedAtmosphericPoint(null)}
          />
        </div>
      )}

      {/* Floating HUD Indicator when Dust Storm Overlay is Active but Panel is Closed */}
      {showDustStormOverlay && !isDustStormPanelOpen && (
        <div className="absolute top-14 right-2 sm:right-4 z-20 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            type="button"
            onClick={() => setIsDustStormPanelOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/95 border border-amber-500/80 shadow-2xl text-white text-xs font-mono transition-all hover:scale-105 cursor-pointer backdrop-blur-md group"
            title="Open Dust Storm & Atmosphere Simulation Controls"
          >
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping opacity-75" />
              <Wind className="w-3.5 h-3.5 text-amber-400 absolute" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Dust Overlay Active</span>
              <span className="text-[11px] text-neutral-300 font-sans">
                {dustSimulationState.globalStormActive ? 'Global Dust Storm' : `Season Ls ${dustSimulationState.currentLs}°`} • τ {dustSimulationState.globalMeanTau}
              </span>
            </div>
          </button>
        </div>
      )}

    </div>
  );
}
