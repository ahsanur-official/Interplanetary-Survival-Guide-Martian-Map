import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  calculateMarsDistanceMeters,
  calculateMarsDistanceKm,
  calculateMarsPolygonAreaKm2,
} from '../../engine/spatialMath';
import {
  Compass,
  Navigation,
  Crosshair,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Copy,
  Check,
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
  Mic,
  ChevronUp,
  Target,
} from 'lucide-react';
import { MARS_MISSIONS_DATA } from '../../data/marsMissions';
import { GALE_HAZARD_ZONES } from '../../data/galeDataset';
import { JEZERO_HAZARD_ZONES } from '../../data/jezeroDataset';
import { analyzeMarsLocationScience } from '../../engine/marsEnvironmentalAnalysis';
import { ALL_MARS_FEATURES, MarsFeature } from '../../data/marsNomenclature';
import { loadOfficialMarsGazetteer, UsgsMarsFeature } from '../../data/usgsMarsGazetteer';
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
import { MarsMissionBottomSheet, BottomSheetTab } from './MarsMissionBottomSheet';
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
import { MissionTimelineSlider, MISSION_ERAS } from '../mission/MissionTimelineSlider';
import { MarsDestinationTool, MarsDestination } from './MarsDestinationTool';
import { MarsAtmosphereOverlayControl, AtmosphereOverlayMode } from './MarsAtmosphereOverlayControl';
import { formatDMS } from './MarsCoordinateOverlay';
import {
  MARS_LANDING_SITES_ATMOSPHERE,
  MARS_ATMO_ZONES,
  MarsLandingSiteAtmosphere,
  calculateMarsAtmosphereAtCoord,
} from '../../data/marsAtmosphereData';
import { CompareSitesModal } from '../science/CompareSitesModal';
import { DataSourcesModal } from '../provenance/DataSourcesModal';
import { MarsBookmarksModal } from '../common/MarsBookmarksModal';
import { MarsMeasurementTool, MeasurementPoint } from './MarsMeasurementTool';
import { MarsPathElevationGraph } from './MarsPathElevationGraph';
import { ElevationProfileModal } from '../science/ElevationProfileModal';
import {
  generateElevationTransect,
  generateMultiPointElevationTransect,
  getMolaElevation,
  getMarsPressureMbar,
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
import { getMarsSpaceWeatherState, SpaceWeatherScenario } from '../../engine/marsSpaceWeather';
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
  Footprints,
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
import { MarsMolaAvailabilityControl } from './MarsMolaAvailabilityControl';
import {
  getElevationAvailabilityAtCoord,
  getAvailabilityHeatmapColor,
  generateElevationAvailabilityGrid,
  ELEVATION_DATASET_CATALOG,
  ElevationPointAvailability,
  ElevationResolutionTier,
  normalizeLongitude as normalizeAvailLongitude,
} from '../../engine/marsElevationAvailability';
import { MarsAstronautView } from './MarsAstronautView';
import {
  MarsNasaMissionsOverlayControl,
  NASA_HISTORIC_MISSIONS,
} from './MarsNasaMissionsOverlayControl';
import { MarsMission } from '../../data/marsMissions';

export const NASA_LANDING_ELLIPSES: Record<string, { majorKm: number; minorKm: number; tiltDeg: number }> = {
  perseverance: { majorKm: 7.7, minorKm: 6.6, tiltDeg: 25 },
  curiosity: { majorKm: 20.0, minorKm: 7.0, tiltDeg: 40 },
  viking1: { majorKm: 100.0, minorKm: 50.0, tiltDeg: 65 },
  viking2: { majorKm: 100.0, minorKm: 50.0, tiltDeg: 60 },
  opportunity: { majorKm: 80.0, minorKm: 12.0, tiltDeg: 88 },
  spirit: { majorKm: 80.0, minorKm: 12.0, tiltDeg: 78 },
  pathfinder: { majorKm: 100.0, minorKm: 50.0, tiltDeg: 70 },
  phoenix: { majorKm: 70.0, minorKm: 20.0, tiltDeg: 35 },
  insight: { majorKm: 130.0, minorKm: 27.0, tiltDeg: 90 },
};
import { NasaLandingSiteModal } from './NasaLandingSiteModal';
import { MarsRoutePlannerModal } from '../mission/MarsRoutePlannerModal';
import { MarsRouteSafetyHUD } from '../mission/MarsRouteSafetyHUD';
import { analyzeRouteSafety, RouteSafetyAssessment } from '../../engine/marsRouteSafetyAnalyzer';
import { NasaSurfacePovModal } from '../mission/NasaSurfacePovModal';
import { MarsDisplayModeOverlay } from './MarsDisplayModeOverlay';
import { DisplayViewFormat, NasaSurfacePovImage } from '../../types/mars';
import {
  calculateAStarRoute,
  calculateEmergencyReturnRoute,
  MarsTransportModeType,
  CrewBuddyConfigType,
  RouteMode,
  PlannedRouteResult,
  ScienceStopSuggestion,
} from '../../engine/marsAStarRouter';

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

/**
 * Robust extraction of landing/mission year from Mars robotic exploration sites
 */
export const getMissionLandingYear = (site: any): number | null => {
  if (site.year && typeof site.year === 'number') return site.year;
  const id = (site.id || '').toLowerCase();
  const name = (site.name || '').toLowerCase();
  if (id.includes('mars3') || name.includes('mars 3')) return 1971;
  if (id.includes('mars6') || name.includes('mars 6')) return 1974;
  if (id.includes('viking1') || id.includes('viking2') || id.includes('viking') || name.includes('viking')) return 1976;
  if (id.includes('sojourner') || id.includes('pathfinder') || name.includes('pathfinder')) return 1997;
  if (id.includes('beagle') || name.includes('beagle')) return 2003;
  if (id.includes('spirit') || id.includes('opportunity') || name.includes('spirit') || name.includes('opportunity')) return 2004;
  if (id.includes('phoenix') || name.includes('phoenix')) return 2008;
  if (id.includes('curiosity') || id.includes('msl') || name.includes('curiosity')) return 2012;
  if (id.includes('schiaparelli') || name.includes('schiaparelli')) return 2016;
  if (id.includes('insight') || name.includes('insight')) return 2018;
  if (
    id.includes('perseverance') ||
    id.includes('ingenuity') ||
    id.includes('zhurong') ||
    id.includes('tianwen') ||
    name.includes('perseverance') ||
    name.includes('zhurong')
  ) {
    return 2021;
  }
  if (site.missionOrIAUYear) {
    const match = site.missionOrIAUYear.match(/\b(19\d\d|20\d\d)\b/);
    if (match) return parseInt(match[1], 10);
  }
  return null;
};


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
  // Primary View Mode: '2d' (High-Def Surface Map & Rotating Compass), '3d' (Full 3D Mars Planet in Space with Stars), or 'astronaut' (First-Person Surface EVA View)
  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'astronaut'>(() => {
    try {
      const saved = localStorage.getItem('marsway_preferred_view');
      if (saved === '3d' || saved === '2d' || saved === 'astronaut') return saved;
    } catch {}
    return '2d';
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeComparisonPolylineRef = useRef<L.Polyline | null>(null);
  const routeHazardLayerRef = useRef<L.LayerGroup | null>(null);
  const routeMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const sitesLayerRef = useRef<L.LayerGroup | null>(null);
  const officialGazetteerLayerRef = useRef<L.LayerGroup | null>(null);
  const roverTrackLayerRef = useRef<L.LayerGroup | null>(null);
  const graticuleLayerRef = useRef<L.LayerGroup | null>(null);
  const regionsLayerRef = useRef<L.LayerGroup | null>(null);

  // Stage measurement for full diagonal coverage without black edges when rotated
  const mapStageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>(() => {
    if (typeof window !== 'undefined') {
      return {
        w: Math.max(window.innerWidth || 1920, 1920),
        h: Math.max(window.innerHeight || 1080, 1080),
      };
    }
    return { w: 1920, h: 1080 };
  });

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
    return Math.ceil(Math.hypot(stageSize.w, stageSize.h)) + 250;
  }, [stageSize.w, stageSize.h]);

  const safeInvalidateSize = (map?: L.Map | null) => {
    const targetMap = map || mapInstanceRef.current;
    if (!targetMap) return;
    try {
      // Check if map container and map pane still exist in DOM
      const container = targetMap.getContainer ? targetMap.getContainer() : null;
      const mapPane = (targetMap as any)._mapPane;
      if (container && mapPane && (targetMap as any)._loaded) {
        targetMap.invalidateSize({ debounceMoveend: false });
      }
    } catch {
      // Ignore if map is unmounting or disposed
    }
  };

  useEffect(() => {
    safeInvalidateSize();
  }, [stageDiagonal]);

  // Keep Leaflet viewport strictly synchronized with container and window resizes to prevent black voids
  useEffect(() => {
    const container = mapContainerRef.current;
    const handleResize = () => safeInvalidateSize();
    window.addEventListener('resize', handleResize);
    let ro: ResizeObserver | null = null;
    if (container) {
      ro = new ResizeObserver(() => safeInvalidateSize());
      ro.observe(container);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      if (ro) ro.disconnect();
    };
  }, []);

  // Map Orientation / Bearing: 0 (North Up), 90 (East Up), 180 (South Up), 270 (West Up)
  const [bearing, setBearing] = useState<number>(0);
  const bearingRef = useRef<number>(0);
  useEffect(() => {
    bearingRef.current = bearing;
    if (mapContainerRef.current) {
      mapContainerRef.current.style.setProperty('--map-bearing', `${bearing}deg`);
    }
    const map = mapInstanceRef.current;
    if (map) {
      safeInvalidateSize(map);
      const t1 = setTimeout(() => safeInvalidateSize(map), 80);
      const t2 = setTimeout(() => safeInvalidateSize(map), 250);
      const t3 = setTimeout(() => safeInvalidateSize(map), 550);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [bearing, stageDiagonal]);


  // Basemap & Surface Display (Defaults to NASA Viking True Color / Natural Mosaic)
  const [activeLayer, setActiveLayer] = useState<'themis' | 'viking' | 'mola' | 'opm'>('viking');
  const [surfaceFilter, setSurfaceFilter] = useState<'normal' | 'contrast' | 'sharp' | 'dark' | 'night'>('normal');
  const [showSites, setShowSites] = useState<boolean>(true);
  const [isPlacesDockOpen, setIsPlacesDockOpen] = useState<boolean>(true);
  const [showRoverTrack, setShowRoverTrack] = useState<boolean>(true);
  const [showGraticule, setShowGraticule] = useState<boolean>(false);

  // Esri-style Martian Nomenclature & Place Categorization State
  const [placeCategoryFilter, setPlaceCategoryFilter] = useState<'all' | 'mons' | 'crater' | 'chasma' | 'vallis' | 'planitia' | 'mission'>('all');

  // Mission Timeline Slider State (Interactive Year & Era Filter)
  const [isTimelineSliderOpen, setIsTimelineSliderOpen] = useState<boolean>(false);
  const [timelineSelectedYear, setTimelineSelectedYear] = useState<number>(2024);
  const [timelineSelectedEraId, setTimelineSelectedEraId] = useState<string | undefined>(undefined);
  const [timelineFilterMode, setTimelineFilterMode] = useState<'cumulative' | 'era_only' | 'all'>('all');

  // Mars Destination Select Tool State
  const [isDestinationToolOpen, setIsDestinationToolOpen] = useState<boolean>(false);
  const [isMapPickDestinationMode, setIsMapPickDestinationMode] = useState<boolean>(false);
  const [activeDestination, setActiveDestination] = useState<MarsDestination | null>(null);
  const [isTilesLoading, setIsTilesLoading] = useState<boolean>(false);
  const isMapPickDestinationModeRef = useRef<boolean>(false);
  const destinationMarkerLayerRef = useRef<L.LayerGroup | null>(null);
  const destinationTrajectoryLayerRef = useRef<L.Polyline | null>(null);
  const fallbackSurfaceLayerRef = useRef<L.ImageOverlay | null>(null);

  useEffect(() => {
    isMapPickDestinationModeRef.current = isMapPickDestinationMode;
    if (mapContainerRef.current) {
      mapContainerRef.current.style.cursor = isMapPickDestinationMode ? 'crosshair' : '';
    }
  }, [isMapPickDestinationMode]);
  const [mapBoundsKey, setMapBoundsKey] = useState<number>(0);
  const [isEarthComparisonOpen, setIsEarthComparisonOpen] = useState<boolean>(false);
  const [selectedEarthComparisonId, setSelectedEarthComparisonId] = useState<string>('olympus_vs_everest');
  const [activeEarthComparison, setActiveEarthComparison] = useState<EarthComparisonItem | null>(null);
  const [isPlaceIdentifierOpen, setIsPlaceIdentifierOpen] = useState<boolean>(false);
  const [placeIdentifierFeature, setPlaceIdentifierFeature] = useState<MarsFeature | null>(null);
  const earthComparisonLayerRef = useRef<L.LayerGroup | null>(null);

  // Google Maps Style Right-Click Context Menu ("What's Here?")
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    lat: number;
    lng: number;
    elevationM: number;
    pressureMbar: number;
    nearestFeature?: { name: string; type: string; distKm: number } | null;
  } | null>(null);
  const [contextCopied, setContextCopied] = useState<boolean>(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Google Maps Quick Layers Popover state
  const [isGoogleLayersOpen, setIsGoogleLayersOpen] = useState<boolean>(false);

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
  const [activeTab, setActiveTab] = useState<BottomSheetTab>(null);

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

  // Interactive 2-click map route plotting ('start' -> 'dest' -> null)
  const [interactiveRoutePlotStep, setInteractiveRoutePlotStep] = useState<'start' | 'dest' | null>(null);
  const interactiveRoutePlotStepRef = useRef<'start' | 'dest' | null>(null);
  useEffect(() => {
    interactiveRoutePlotStepRef.current = interactiveRoutePlotStep;
  }, [interactiveRoutePlotStep]);

  // GIS Distance & Area Measurement Tool State
  const [isMeasureToolOpen, setIsMeasureToolOpen] = useState<boolean>(false);
  const isMeasureToolOpenRef = useRef<boolean>(false);
  useEffect(() => {
    isMeasureToolOpenRef.current = isMeasureToolOpen;
  }, [isMeasureToolOpen]);

  const [measurePoints, setMeasurePoints] = useState<MeasurementPoint[]>([]);
  const [measureMode, setMeasureMode] = useState<'distance' | 'area'>('distance');
  const [isWideElevationDockOpen, setIsWideElevationDockOpen] = useState<boolean>(false);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (mapContainerRef.current) {
      if (isMeasureToolOpen || isMapPickDestinationMode || interactiveRoutePlotStep !== null) {
        mapContainerRef.current.style.cursor = 'crosshair';
      } else {
        mapContainerRef.current.style.cursor = '';
      }
    }
  }, [isMeasureToolOpen, isMapPickDestinationMode, interactiveRoutePlotStep]);

  // MGS MOLA Elevation Profile Transect Tool State
  const [isElevationProfileOpen, setIsElevationProfileOpen] = useState<boolean>(false);
  const [isElevationToolRequested, setIsElevationToolRequested] = useState<boolean>(false);
  const openElevationProfile = () => {
    setIsElevationToolRequested(true);
    setIsElevationProfileOpen(true);
  };
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

  // Reset transient elevation UI state on a real app mount. This prevents a
  // preserved Vite/HMR state from opening the empty modal before user action.
  useEffect(() => {
    setIsElevationProfileOpen(false);
    setIsElevationToolRequested(false);
    setIsDrawingElevationLine(false);
    setElevationPoints([]);
    setElevationProfile(null);
    setHoveredElevationSample(null);
  }, []);

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

  // MGS MOLA Elevation Data Availability & High-Res DTM Heatmap Overlay State
  const [showMolaAvailabilityOverlay, setShowMolaAvailabilityOverlay] = useState<boolean>(false);
  const showMolaAvailabilityOverlayRef = useRef<boolean>(false);
  useEffect(() => {
    showMolaAvailabilityOverlayRef.current = showMolaAvailabilityOverlay;
  }, [showMolaAvailabilityOverlay]);

  const [isMolaAvailabilityPanelOpen, setIsMolaAvailabilityPanelOpen] = useState<boolean>(false);
  const [molaAvailabilityOpacity, setMolaAvailabilityOpacity] = useState<number>(0.60);
  const [molaTierFilter, setMolaTierFilter] = useState<'ALL' | ElevationResolutionTier>('ALL');
  const [inspectedAvailabilityPoint, setInspectedAvailabilityPoint] = useState<ElevationPointAvailability | null>(null);
  const molaAvailabilityLayerRef = useRef<L.LayerGroup | null>(null);

  // Atmospheric Pressure & Temperature Overlay Layer State
  const [showAtmosphereOverlay, setShowAtmosphereOverlay] = useState<boolean>(false);
  const showAtmosphereOverlayRef = useRef<boolean>(false);
  useEffect(() => {
    showAtmosphereOverlayRef.current = showAtmosphereOverlay;
  }, [showAtmosphereOverlay]);
  const [isAtmospherePanelOpen, setIsAtmospherePanelOpen] = useState<boolean>(false);
  const [atmosphereMode, setAtmosphereMode] = useState<AtmosphereOverlayMode>('pressure');
  const [atmosphereOpacity, setAtmosphereOpacity] = useState<number>(0.65);
  const [showAtmosphereStationBadges, setShowAtmosphereStationBadges] = useState<boolean>(true);
  const [showAtmosphereIsobarZones, setShowAtmosphereIsobarZones] = useState<boolean>(true);
  const [selectedAtmosphereSiteId, setSelectedAtmosphereSiteId] = useState<string | undefined>(undefined);
  const atmosphereLayerRef = useRef<L.LayerGroup | null>(null);

  // NASA Historic Missions Overlay Layer State
  const [showNasaMissionsOverlay, setShowNasaMissionsOverlay] = useState<boolean>(false);
  const showNasaMissionsOverlayRef = useRef<boolean>(false);
  useEffect(() => {
    showNasaMissionsOverlayRef.current = showNasaMissionsOverlay;
  }, [showNasaMissionsOverlay]);
  const [isNasaMissionsPanelOpen, setIsNasaMissionsPanelOpen] = useState<boolean>(false);
  const [showLandingEllipses, setShowLandingEllipses] = useState<boolean>(true);
  const [showNasaTraverses, setShowNasaTraverses] = useState<boolean>(true);
  const [selectedNasaMission, setSelectedNasaMission] = useState<MarsMission | null>(null);
  const [isNasaLandingSiteModalOpen, setIsNasaLandingSiteModalOpen] = useState<boolean>(false);
  const nasaMissionsLayerRef = useRef<L.LayerGroup | null>(null);

  // Marswalk EVA Route Planner Modal & Multi-Transport Engine State (Starts completely clean with NO demo route)
  const [isRoutePlannerModalOpen, setIsRoutePlannerModalOpen] = useState<boolean>(false);
  const [isRouteSafetyHUDOpen, setIsRouteSafetyHUDOpen] = useState<boolean>(false);
  const [isRouteCheckReady, setIsRouteCheckReady] = useState<boolean>(false);
  const [isRouteChecked, setIsRouteChecked] = useState<boolean>(false);
  const [showRouteComparisonOnMap, setShowRouteComparisonOnMap] = useState<boolean>(false);
  const [routeTransportMode, setRouteTransportMode] = useState<MarsTransportModeType>('foot');
  const [routeCrewConfig, setRouteCrewConfig] = useState<CrewBuddyConfigType>('buddy_pair');
  const [routeMode, setRouteMode] = useState<RouteMode>('safest');
  const [routeStartPoint, setRouteStartPoint] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  const [routeEndPoint, setRouteEndPoint] = useState<{ lat: number; lng: number; name?: string } | null>(null);

  const handleStartMapRoutePlanning = () => {
    setIsRoutePlannerModalOpen(false);
    setIsSearchModalOpen(false);
    setIsHamburgerOpen(false);
    setActiveTab(null);
    setInspectedPoint(null);
    setSelectedSite(null);
    setSelectedRegion(null);
    setRouteStartPoint(null);
    setRouteEndPoint(null);
    setIsRouteCheckReady(false);
    setIsRouteChecked(false);
    setIsRouteSafetyHUDOpen(false);
    setShowRouteComparisonOnMap(false);
    setInteractiveRoutePlotStep('start');
  };

  const handleCancelAndClearRoute = () => {
    setRouteStartPoint(null);
    setRouteEndPoint(null);
    setInteractiveRoutePlotStep(null);
    setIsRouteCheckReady(false);
    setIsRouteChecked(false);
    setIsRouteSafetyHUDOpen(false);
    setShowRouteComparisonOnMap(false);
    setIsRoutePlannerModalOpen(false);
    if (routePolylineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    if (routeComparisonPolylineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routeComparisonPolylineRef.current);
      routeComparisonPolylineRef.current = null;
    }
    if (routeMarkersLayerRef.current) {
      routeMarkersLayerRef.current.clearLayers();
    }
  };

  const routeHazardZones = useMemo(() => {
    const point = routeStartPoint || routeEndPoint;
    if (!point) return [];
    return point.lng > 130 && point.lng < 145 ? GALE_HAZARD_ZONES : JEZERO_HAZARD_ZONES;
  }, [routeStartPoint, routeEndPoint]);

  // Real-time Route Safety Assessment (Detects scarps, soft dunes, and offers safer corridors)
  const routeSafetyAssessment = useMemo(() => {
    if (!routeStartPoint || !routeEndPoint) return null;
    return analyzeRouteSafety(routeStartPoint, routeEndPoint, routeHazardZones, {
      transportMode: routeTransportMode,
      crewConfig: routeCrewConfig,
    });
  }, [routeStartPoint, routeEndPoint, routeHazardZones, routeTransportMode, routeCrewConfig]);

  // Candidate routes computed via A* router with transport mode & buddy multiplier
  const candidateRoutes = useMemo(() => {
    if (!routeStartPoint || !routeEndPoint) {
      return {
        safest: null,
        shortest: null,
        science: null,
      };
    }
    const safest = calculateAStarRoute(
      routeStartPoint.lat,
      routeStartPoint.lng,
      routeEndPoint.lat,
      routeEndPoint.lng,
      'safest',
      { transportMode: routeTransportMode, crewConfig: routeCrewConfig, hazardZones: routeHazardZones }
    );
    const shortest = calculateAStarRoute(
      routeStartPoint.lat,
      routeStartPoint.lng,
      routeEndPoint.lat,
      routeEndPoint.lng,
      'shortest',
      { transportMode: routeTransportMode, crewConfig: routeCrewConfig, hazardZones: routeHazardZones }
    );
    const science = calculateAStarRoute(
      routeStartPoint.lat,
      routeStartPoint.lng,
      routeEndPoint.lat,
      routeEndPoint.lng,
      'science',
      { transportMode: routeTransportMode, crewConfig: routeCrewConfig, hazardZones: routeHazardZones }
    );
    return {
      safest,
      shortest,
      science,
    };
  }, [routeStartPoint, routeEndPoint, routeTransportMode, routeCrewConfig, routeHazardZones]);

  const activePlannedRoute = candidateRoutes[routeMode];

  // NASA Surface Point-of-View (POV) Imagery Modal State
  const [activeSurfacePovImage, setActiveSurfacePovImage] = useState<NasaSurfacePovImage | null>(null);
  const [povModalWaypointName, setPovModalWaypointName] = useState<string>('Surface Location');
  const [povModalElevationM, setPovModalElevationM] = useState<number | undefined>(undefined);

  // Astronaut Display Format (Habitat Console vs Field Tablet vs Spacesuit Visor HUD)
  const [displayViewFormat, setDisplayViewFormat] = useState<DisplayViewFormat>('HABITAT_CONSOLE');

  // Quick GIS Tools Popover State
  const [isQuickToolsMenuOpen, setIsQuickToolsMenuOpen] = useState<boolean>(false);

  // Selected site
  const [selectedSite, setSelectedSite] = useState<MarsSite | null>(null);
  const [officialMarsFeatures, setOfficialMarsFeatures] = useState<UsgsMarsFeature[]>([]);

  const officialMarsFeaturesForGlobe = useMemo<MarsFeature[]>(
    () => officialMarsFeatures.map((feature) => {
      const typeLower = feature.type.toLowerCase();
      const type: MarsFeature['type'] = typeLower.includes('crater')
        ? 'Crater'
        : typeLower.includes('mons') || typeLower.includes('tholus') || typeLower.includes('patera')
          ? 'Mons (Volcano)'
          : typeLower.includes('chasma') || typeLower.includes('vallis') || typeLower.includes('fossa')
            ? 'Chasma (Canyon)'
            : typeLower.includes('terra')
              ? 'Terra (Highland)'
              : 'Planitia (Plain)';
      return {
        id: feature.id,
        name: feature.name,
        type,
        lat: feature.lat,
        lng: feature.lng,
        planetocentricLng: feature.lng < 0 ? feature.lng + 360 : feature.lng,
        diameterKm: feature.diameterKm,
        elevationM: 0,
        originName: feature.origin || 'USGS/IAU Gazetteer of Planetary Nomenclature',
        description: `Official USGS/IAU Mars feature. ${feature.origin || ''}`.trim(),
        missionOrIAUYear: feature.approvalDate,
        featured: (feature.diameterKm || 0) >= 700,
      };
    }),
    [officialMarsFeatures]
  );

  useEffect(() => {
    loadOfficialMarsGazetteer()
      .then(setOfficialMarsFeatures)
      .catch((error) => console.warn('Official USGS Mars gazetteer unavailable:', error));
  }, []);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Live mouse or center coordinates
  const [cursorPos, setCursorPos] = useState<{ lat: number; lng: number; eastLng: number } | null>({
    lat: 18.38,
    lng: 77.58,
    eastLng: 77.58,
  });
  const cursorPosRef = useRef<{ lat: number; lng: number; eastLng: number }>({
    lat: 18.38,
    lng: 77.58,
    eastLng: 77.58,
  });
  const coordLatDisplayRef = useRef<HTMLSpanElement | null>(null);
  const coordLngDisplayRef = useRef<HTMLSpanElement | null>(null);
  const coordElevDisplayRef = useRef<HTMLSpanElement | null>(null);
  const coordPressureDisplayRef = useRef<HTMLSpanElement | null>(null);
  const coordFeatureDisplayRef = useRef<HTMLSpanElement | null>(null);
  const coordDmsDisplayRef = useRef<HTMLSpanElement | null>(null);

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
  const [spaceWeatherScenario, setSpaceWeatherScenario] = useState<SpaceWeatherScenario>('quiet');

  const currentWeather = useMemo(() => {
    if (liveWeather.length === 0) return null;
    return liveWeather[0];
  }, [liveWeather]);

  const spaceWeather = useMemo(
    () => getMarsSpaceWeatherState(spaceWeatherScenario),
    [spaceWeatherScenario]
  );

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

  // All robotic landing sites and missions
  const allMissionSites = useMemo(() => {
    return FAMOUS_MARS_SITES.filter(
      (s) =>
        s.type.includes('Rover') ||
        s.type.includes('Lander') ||
        s.category?.includes('Mission') ||
        s.category?.includes('Lander') ||
        s.category?.includes('Rover')
    );
  }, []);

  // Filtered mission count matching current timeline settings
  const visibleMissionCount = useMemo(() => {
    if (!isTimelineSliderOpen || timelineFilterMode === 'all') {
      return allMissionSites.length;
    }
    return allMissionSites.filter((s) => {
      const yr = getMissionLandingYear(s);
      if (yr === null) return true;
      if (timelineFilterMode === 'cumulative') {
        return yr <= timelineSelectedYear;
      }
      if (timelineFilterMode === 'era_only') {
        const era =
          MISSION_ERAS.find((e) => e.id === timelineSelectedEraId) ||
          MISSION_ERAS.find(
            (e) => timelineSelectedYear >= e.yearRange[0] && timelineSelectedYear <= e.yearRange[1]
          );
        if (!era) return true;
        return yr >= era.yearRange[0] && yr <= era.yearRange[1];
      }
      return true;
    }).length;
  }, [allMissionSites, isTimelineSliderOpen, timelineFilterMode, timelineSelectedYear, timelineSelectedEraId]);

  // All primary dialogs share one opening gateway so a new modal never sits
  // underneath an older drawer or leaves two backdrops active at once.
  const closeAllPrimaryOverlays = () => {
    setIsRegionDetailModalOpen(false);
    setIsCloseUpModalOpen(false);
    setIsScienceDossierOpen(false);
    setIsMissionExplorerOpen(false);
    setIsHumanMissionModeOpen(false);
    setIsSearchModalOpen(false);
    setIsTimelineSliderOpen(false);
    setIsDestinationToolOpen(false);
    setIsTimelineOpen(false);
    setIsCompareModalOpen(false);
    setIsDataSourcesModalOpen(false);
    setIsBookmarksModalOpen(false);
    setIsTourModalOpen(false);
    setIsPresentationModeOpen(false);
    setIsAskMarsWayOpen(false);
    setIsLiveVoiceOpen(false);
    setIsMeasureToolOpen(false);
    setIsElevationProfileOpen(false);
    setIsRoutePlannerModalOpen(false);
    setIsNasaLandingSiteModalOpen(false);
    setIsEarthComparisonOpen(false);
    setIsPlaceIdentifierOpen(false);
    setIsMolaAvailabilityPanelOpen(false);
    setIsDustStormPanelOpen(false);
    setIsAtmospherePanelOpen(false);
    setIsNasaMissionsPanelOpen(false);
    setIsMissionLayersPanelOpen(false);
    setIsQuickToolsMenuOpen(false);
    setActiveTab(null);
    setInspectedPoint(null);
    setSelectedSite(null);
    setSelectedRegion(null);
  };

  const openPrimaryOverlay = (setOpen: (open: boolean) => void) => {
    closeAllPrimaryOverlays();
    setOpen(true);
  };

  // Defensive state-level guard for secondary entry points (map clicks, voice,
  // child panels) that can open a dialog without going through the header menu.
  const overlaySnapshot = [
    ['region', isRegionDetailModalOpen],
    ['closeup', isCloseUpModalOpen],
    ['science', isScienceDossierOpen],
    ['missions', isMissionExplorerOpen],
    ['human', isHumanMissionModeOpen],
    ['search', isSearchModalOpen],
    ['timeline-slider', isTimelineSliderOpen],
    ['destination', isDestinationToolOpen],
    ['timeline', isTimelineOpen],
    ['compare', isCompareModalOpen],
    ['sources', isDataSourcesModalOpen],
    ['bookmarks', isBookmarksModalOpen],
    ['tour', isTourModalOpen],
    ['presentation', isPresentationModeOpen],
    ['ask', isAskMarsWayOpen],
    ['voice', isLiveVoiceOpen],
    ['measure', isMeasureToolOpen],
    ['elevation', isElevationProfileOpen],
    ['route', isRoutePlannerModalOpen],
    ['landing-site', isNasaLandingSiteModalOpen],
    ['earth-scale', isEarthComparisonOpen],
    ['place-identifier', isPlaceIdentifierOpen],
    ['mola-panel', isMolaAvailabilityPanelOpen],
    ['dust-panel', isDustStormPanelOpen],
    ['atmosphere-panel', isAtmospherePanelOpen],
    ['nasa-missions-panel', isNasaMissionsPanelOpen],
    ['mission-layers-panel', isMissionLayersPanelOpen],
    ['hamburger', isHamburgerOpen],
    ['tab', activeTab !== null],
  ] as const;
  const overlaySignature = overlaySnapshot.filter(([, open]) => open).map(([id]) => id).join('|');
  const previousOverlaySignatureRef = useRef('');
  const hasInitializedOverlayStateRef = useRef(false);

  useEffect(() => {
    // Ignore any overlay state restored by HMR/browser session on the first
    // render. It is stale UI state, not a fresh user interaction.
    if (!hasInitializedOverlayStateRef.current) {
      hasInitializedOverlayStateRef.current = true;
      previousOverlaySignatureRef.current = overlaySignature;
      return;
    }

    const currentIds = overlaySignature ? overlaySignature.split('|') : [];
    const previousIds = previousOverlaySignatureRef.current
      ? previousOverlaySignatureRef.current.split('|')
      : [];
    const newlyOpened = currentIds.filter((id) => !previousIds.includes(id));

    if (newlyOpened.length > 0 && currentIds.length > 1) {
      const activeId = newlyOpened[newlyOpened.length - 1];
      closeAllPrimaryOverlays();
      if (activeId === 'tab') setActiveTab('tools');
      else if (activeId === 'region') setIsRegionDetailModalOpen(true);
      else if (activeId === 'closeup') setIsCloseUpModalOpen(true);
      else if (activeId === 'science') setIsScienceDossierOpen(true);
      else if (activeId === 'missions') setIsMissionExplorerOpen(true);
      else if (activeId === 'human') setIsHumanMissionModeOpen(true);
      else if (activeId === 'search') setIsSearchModalOpen(true);
      else if (activeId === 'timeline-slider') setIsTimelineSliderOpen(true);
      else if (activeId === 'destination') setIsDestinationToolOpen(true);
      else if (activeId === 'timeline') setIsTimelineOpen(true);
      else if (activeId === 'compare') setIsCompareModalOpen(true);
      else if (activeId === 'sources') setIsDataSourcesModalOpen(true);
      else if (activeId === 'bookmarks') setIsBookmarksModalOpen(true);
      else if (activeId === 'tour') setIsTourModalOpen(true);
      else if (activeId === 'presentation') setIsPresentationModeOpen(true);
      else if (activeId === 'ask') setIsAskMarsWayOpen(true);
      else if (activeId === 'voice') setIsLiveVoiceOpen(true);
      else if (activeId === 'measure') setIsMeasureToolOpen(true);
      else if (activeId === 'elevation') openElevationProfile();
      else if (activeId === 'route') setIsRoutePlannerModalOpen(true);
      else if (activeId === 'landing-site') setIsNasaLandingSiteModalOpen(true);
      else if (activeId === 'earth-scale') setIsEarthComparisonOpen(true);
      else if (activeId === 'place-identifier') setIsPlaceIdentifierOpen(true);
      else if (activeId === 'mola-panel') setIsMolaAvailabilityPanelOpen(true);
      else if (activeId === 'dust-panel') setIsDustStormPanelOpen(true);
      else if (activeId === 'atmosphere-panel') setIsAtmospherePanelOpen(true);
      else if (activeId === 'nasa-missions-panel') setIsNasaMissionsPanelOpen(true);
      else if (activeId === 'mission-layers-panel') setIsMissionLayersPanelOpen(true);
      else if (activeId === 'hamburger') setIsHamburgerOpen(true);
    }

    previousOverlaySignatureRef.current = overlaySignature;
  }, [overlaySignature]);


  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      crs: L.CRS.EPSG4326,
      center: [18.38, 77.58],
      zoom: 3,
      minZoom: 2, // Keep the full Mars disk larger than the viewport so no polar/edge void appears.
      maxZoom: 20,
      maxBounds: [[-85, -540], [85, 540]], // Clamp latitude while still allowing several horizontal world copies.
      maxBoundsViscosity: 1,
      attributionControl: false,
      zoomControl: false,
      worldCopyJump: true,
      preferCanvas: true,
      wheelPxPerZoomLevel: 100,
      zoomSnap: 1,
      zoomDelta: 1,
      wheelDebounceTime: 30,
      inertia: true,
      inertiaDeceleration: 3400,
      inertiaMaxSpeed: Infinity,
      zoomAnimation: true,
      fadeAnimation: false,
      markerZoomAnimation: true,
      bounceAtZoomLimits: false,
    });

    mapInstanceRef.current = map;
    setMapInstance(map);

    let isMapMounted = true;

    requestAnimationFrame(() => {
      if (isMapMounted) {
        safeInvalidateSize(map);
      }
    });
    const initTimer = setTimeout(() => {
      if (isMapMounted) {
        safeInvalidateSize(map);
      }
    }, 150);

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
    officialGazetteerLayerRef.current = L.layerGroup().addTo(map);
    roverTrackLayerRef.current = L.layerGroup().addTo(map);
    routeMarkersLayerRef.current = L.layerGroup().addTo(map);
    routeHazardLayerRef.current = L.layerGroup().addTo(map);
    graticuleLayerRef.current = L.layerGroup().addTo(map);
    measureLayerRef.current = L.layerGroup().addTo(map);
    earthComparisonLayerRef.current = L.layerGroup().addTo(map);
    elevationLayerRef.current = L.layerGroup().addTo(map);
    dustStormLayerRef.current = L.layerGroup().addTo(map);
    molaAvailabilityLayerRef.current = L.layerGroup().addTo(map);
    atmosphereLayerRef.current = L.layerGroup().addTo(map);
    nasaMissionsLayerRef.current = L.layerGroup().addTo(map);

    // Mouse / Touch tracker: Updates DOM refs directly without triggering React re-renders, enabling true 120fps smoothness
    let lastCoordTime = 0;
    const updateCoordinates = (lat: number, rawLng: number) => {
      // Strictly clamp latitude to physical Martian boundaries [-90, +90]
      const clampedLat = Math.max(-90, Math.min(90, lat));
      let lng = rawLng;
      lng = ((((lng + 180) % 360) + 360) % 360) - 180;
      const eastLng = (lng + 360) % 360;
      const latVal = Number(clampedLat.toFixed(4));
      const lngVal = Number(lng.toFixed(4));
      const eastLngVal = Number(eastLng.toFixed(4));

      cursorPosRef.current = {
        lat: latVal,
        lng: lngVal,
        eastLng: eastLngVal,
      };

      const elev = getMolaElevation(latVal, lngVal);
      const pressure = getMarsPressureMbar(elev);

      if (coordLatDisplayRef.current) {
        coordLatDisplayRef.current.textContent = `${Math.abs(latVal).toFixed(4)}°${latVal >= 0 ? 'N' : 'S'}`;
      }
      if (coordLngDisplayRef.current) {
        coordLngDisplayRef.current.textContent = `${lngVal >= 0 ? `${lngVal.toFixed(4)}°E` : `${Math.abs(lngVal).toFixed(4)}°W`}`;
      }
      if (coordElevDisplayRef.current) {
        coordElevDisplayRef.current.textContent = `${elev > 0 ? `+${elev}` : elev} m`;
      }
      if (coordPressureDisplayRef.current) {
        coordPressureDisplayRef.current.textContent = `${pressure.toFixed(1)} mbar`;
      }
      if (coordDmsDisplayRef.current) {
        coordDmsDisplayRef.current.textContent = `${formatDMS(latVal, true)}, ${formatDMS(lngVal, false)}`;
      }

      const now = performance.now();
      if (coordFeatureDisplayRef.current && now - lastCoordTime > 120) {
        let nearestName = 'Martian Surface';
        let minDist = 350;
        for (const f of ALL_MARS_FEATURES) {
          const dLat = f.lat - latVal;
          const dLng = f.lng - lngVal;
          const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 59.3;
          if (dist < minDist) {
            minDist = dist;
            nearestName = `${f.name} (${Math.round(dist)}km)`;
          }
        }
        coordFeatureDisplayRef.current.textContent = nearestName;
      }

      // Sync state sparingly (every 250ms or when stationary) for components that listen to state
      if (now - lastCoordTime > 250) {
        lastCoordTime = now;
        setCursorPos({
          lat: latVal,
          lng: lngVal,
          eastLng: eastLngVal,
        });
      }
    };

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      updateCoordinates(e.latlng.lat, e.latlng.lng);
    });

    map.on('move', () => {
      const center = map.getCenter();
      updateCoordinates(center.lat, center.lng);
    });

    map.on('movestart', () => {
      setContextMenu(null);
    });

    // Google Maps Style Right-Click Context Menu ("What's Here?")
    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      L.DomEvent.preventDefault(e.originalEvent);
      let lng = e.latlng.lng;
      lng = ((((lng + 180) % 360) + 360) % 360) - 180;
      const lat = Number(e.latlng.lat.toFixed(4));
      const cleanLng = Number(lng.toFixed(4));
      const elev = getMolaElevation(lat, cleanLng);
      const pressure = getMarsPressureMbar(elev);

      let nearestFeature: { name: string; type: string; distKm: number } | null = null;
      let minDist = Infinity;
      for (const f of ALL_MARS_FEATURES) {
        const dist = calculateMarsDistanceMeters(
          { latitude: lat, longitude: cleanLng },
          { latitude: f.lat, longitude: f.lng }
        );
        if (dist < minDist && dist < 450000) {
          minDist = dist;
          nearestFeature = { name: f.name, type: f.type, distKm: Math.round(dist / 1000) };
        }
      }

      setContextMenu({
        x: Math.min(Math.max(16, e.containerPoint.x), window.innerWidth - 310),
        y: Math.min(Math.max(16, e.containerPoint.y), window.innerHeight - 360),
        lat,
        lng: cleanLng,
        elevationM: elev,
        pressureMbar: pressure,
        nearestFeature,
      });
      setContextCopied(false);
    });

    // Map click / tap -> adds route waypoints, measurement points, or inspects feature
    map.on('click', (e: L.LeafletMouseEvent) => {
      setContextMenu(null);
      let lng = e.latlng.lng;
      lng = ((((lng + 180) % 360) + 360) % 360) - 180;
      const lat = Number(e.latlng.lat.toFixed(4));
      const cleanLng = Number(lng.toFixed(4));
      const eastLng = Number((cleanLng < 0 ? cleanLng + 360 : cleanLng).toFixed(4));
      if (interactiveRoutePlotStepRef.current === 'start') {
        const elev = getMolaElevation(lat, cleanLng);
        let nearestName = `Base (${lat >= 0 ? `${lat}°N` : `${Math.abs(lat)}°S`}, ${cleanLng >= 0 ? `${cleanLng}°E` : `${Math.abs(cleanLng)}°W`})`;
        let minDist = Infinity;
        for (const f of ALL_MARS_FEATURES) {
          const dist = calculateMarsDistanceMeters(
            { latitude: lat, longitude: cleanLng },
            { latitude: f.lat, longitude: f.lng }
          );
          if (dist < minDist && dist < 350000) {
            minDist = dist;
            nearestName = `${f.name} Base`;
          }
        }
        setRouteStartPoint({ lat, lng: cleanLng, name: nearestName });
        setInteractiveRoutePlotStep('dest');
        marsSonification.sonifyLocation(elev, 1);
        return;
      }

      if (interactiveRoutePlotStepRef.current === 'dest') {
        const elev = getMolaElevation(lat, cleanLng);
        let nearestName = `Target (${lat >= 0 ? `${lat}°N` : `${Math.abs(lat)}°S`}, ${cleanLng >= 0 ? `${cleanLng}°E` : `${Math.abs(cleanLng)}°W`})`;
        let minDist = Infinity;
        for (const f of ALL_MARS_FEATURES) {
          const dist = calculateMarsDistanceMeters(
            { latitude: lat, longitude: cleanLng },
            { latitude: f.lat, longitude: f.lng }
          );
          if (dist < minDist && dist < 350000) {
            minDist = dist;
            nearestName = `${f.name} Target`;
          }
        }
        setRouteEndPoint({ lat, lng: cleanLng, name: nearestName });
        setInteractiveRoutePlotStep(null);
        setIsRouteCheckReady(true);
        setIsRouteChecked(false);
        setIsRouteSafetyHUDOpen(false);
        setShowRouteComparisonOnMap(false);
        if (routeStartPoint) {
          const bounds = L.latLngBounds([
            [routeStartPoint.lat, routeStartPoint.lng],
            [lat, cleanLng],
          ]);
          map.fitBounds(bounds, { padding: [70, 70], maxZoom: 8 });
        }
        marsSonification.sonifyLocation(elev, 2);
        return;
      }

      if (isMapPickDestinationModeRef.current) {
        // Destination map pick active!
        const elev = getMolaElevation(lat, cleanLng);
        let nearestName = `Target (${lat >= 0 ? `${lat}°N` : `${Math.abs(lat)}°S`}, ${cleanLng >= 0 ? `${cleanLng}°E` : `${Math.abs(cleanLng)}°W`})`;
        let minDist = Infinity;
        for (const f of ALL_MARS_FEATURES) {
          const dist = calculateMarsDistanceMeters(
            { latitude: lat, longitude: cleanLng },
            { latitude: f.lat, longitude: f.lng }
          );
          if (dist < minDist && dist < 350000) {
            minDist = dist;
            nearestName = `${f.name} Target Sector`;
          }
        }
        const customDest: MarsDestination = {
          id: `dest_${Date.now()}`,
          name: nearestName,
          category: 'Custom Map Pin',
          lat,
          lng: cleanLng,
          elevationM: elev,
          description: `Custom target coordinate designated by explorer at ${lat >= 0 ? `${lat}°N` : `${Math.abs(lat)}°S`}, ${cleanLng >= 0 ? `${cleanLng}°E` : `${Math.abs(cleanLng)}°W`}.`,
          significance: `Local MOLA Elevation: ${elev >= 0 ? `+${elev}m` : `${elev}m`}, Atmospheric Pressure: ${getMarsPressureMbar(elev)} mbar.`,
          recommendedZoom: Math.max(map.getZoom(), 7),
        };
        setActiveDestination(customDest);
        setIsMapPickDestinationMode(false);
        setIsDestinationToolOpen(true);
        marsSonification.sonifyLocation(elev, 2);
        return;
      }

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
          openElevationProfile();
          setIsDrawingElevationLine(false);
          marsSonification.sonifyLocation(profile.maxElevationM, profile.maxSlopeDeg);
        }
      } else if (isMeasureToolOpenRef.current) {
        // Measurement tool active: drop measurement pin with elevation
        const elev = getMolaElevation(lat, cleanLng);
        setMeasurePoints((prev) => [...prev, { lat, lng: cleanLng, elevationM: elev }]);
        marsSonification.sonifyLocation(elev, 1);
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
        setSelectedSite(null);
        setSelectedRegion(null);
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

        // Sample elevation data availability probe if MOLA availability heatmap is active
        if (showMolaAvailabilityOverlayRef.current) {
          const molaAvail = getElevationAvailabilityAtCoord(lat, cleanLng);
          setInspectedAvailabilityPoint(molaAvail);
          setIsMolaAvailabilityPanelOpen(true);
        }
      }
    });

    return () => {
      isMapMounted = false;
      clearTimeout(initTimer);
      mapInstanceRef.current = null;
      setMapInstance(null);
      regionsLayerRef.current = null;
      sitesLayerRef.current = null;
      officialGazetteerLayerRef.current = null;
      roverTrackLayerRef.current = null;
      routeMarkersLayerRef.current = null;
      routeHazardLayerRef.current = null;
      graticuleLayerRef.current = null;
      measureLayerRef.current = null;
      earthComparisonLayerRef.current = null;
      elevationLayerRef.current = null;
      dustStormLayerRef.current = null;
      molaAvailabilityLayerRef.current = null;
      atmosphereLayerRef.current = null;
      nasaMissionsLayerRef.current = null;
      try {
        map.remove();
      } catch {
        // Ignore unmounting errors
      }
    };
  }, []);

  // Render Measurement Tool Pins, Distance Legs & Enclosed Polygon Area on Map
  useEffect(() => {
    const layer = measureLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!isMeasureToolOpen || measurePoints.length === 0) return;

    // 1. Draw connecting polyline between consecutive points
    const latlngs: [number, number][] = measurePoints.map((p) => [p.lat, p.lng]);
    if (latlngs.length >= 2) {
      L.polyline(latlngs, {
        color: '#06b6d4',
        weight: 3.5,
        dashArray: '8, 6',
        opacity: 0.95,
      }).addTo(layer);

      // Add distance label badges on each segment midpoint
      for (let i = 0; i < measurePoints.length - 1; i++) {
        const p1 = measurePoints[i];
        const p2 = measurePoints[i + 1];
        const distKm = calculateMarsDistanceKm(
          { latitude: p1.lat, longitude: p1.lng },
          { latitude: p2.lat, longitude: p2.lng }
        );
        const midLat = (p1.lat + p2.lat) / 2;
        const midLng = (p1.lng + p2.lng) / 2;

        const segmentHtml = `
          <div style="
            transform: translate(-50%, -50%);
            background: rgba(3, 7, 18, 0.92);
            backdrop-filter: blur(4px);
            border: 1.5px solid #22d3ee;
            border-radius: 9999px;
            padding: 2px 7px;
            color: #a5f3fc;
            font-family: ui-monospace, monospace;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0,0,0,0.85);
            pointer-events: none;
            letter-spacing: 0.3px;
          ">
            ${distKm < 10 ? distKm.toFixed(2) : distKm.toFixed(1)} km
          </div>
        `;
        const segmentIcon = L.divIcon({
          html: segmentHtml,
          className: 'measure-segment-label',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        L.marker([midLat, midLng], { icon: segmentIcon, zIndexOffset: 1200 }).addTo(layer);
      }
    }

    // 2. Draw Enclosed Polygon Surface Area (when 3 or more vertices exist)
    if (measurePoints.length >= 3) {
      const areaKm2 = calculateMarsPolygonAreaKm2(
        measurePoints.map((p) => ({ latitude: p.lat, longitude: p.lng }))
      );

      L.polygon(latlngs, {
        color: '#06b6d4',
        weight: measureMode === 'area' ? 3 : 1.5,
        dashArray: measureMode === 'area' ? undefined : '5, 5',
        fillColor: '#0891b2',
        fillOpacity: measureMode === 'area' ? 0.35 : 0.18,
        opacity: 0.9,
      }).addTo(layer);

      // Centroid Area Badge
      const centerLat = measurePoints.reduce((acc, p) => acc + p.lat, 0) / measurePoints.length;
      const centerLng = measurePoints.reduce((acc, p) => acc + p.lng, 0) / measurePoints.length;

      const areaBadgeHtml = `
        <div style="
          transform: translate(-50%, -50%);
          background: rgba(8, 145, 178, 0.92);
          backdrop-filter: blur(6px);
          border: 1.5px solid #a5f3fc;
          border-radius: 10px;
          padding: 4px 9px;
          color: #ffffff;
          font-family: ui-monospace, monospace;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(0,0,0,0.8), 0 0 12px rgba(6,182,212,0.6);
          text-align: center;
          pointer-events: none;
        ">
          <div style="font-size: 8.5px; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Enclosed Area</div>
          <div style="font-size: 11.5px; font-weight: 900;">${areaKm2.toLocaleString(undefined, { maximumFractionDigits: 1 })} km²</div>
        </div>
      `;
      const areaIcon = L.divIcon({
        html: areaBadgeHtml,
        className: 'measure-area-badge',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([centerLat, centerLng], { icon: areaIcon, zIndexOffset: 2500 }).addTo(layer);
    }

    // 3. Draw Interactive Draggable Vertex Markers
    measurePoints.forEach((pt, idx) => {
      const elev = pt.elevationM ?? getMolaElevation(pt.lat, pt.lng);
      const isFirst = idx === 0;
      const isLast = idx === measurePoints.length - 1;

      const markerHtml = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 9999px;
          background: ${isFirst ? '#10b981' : isLast ? '#f59e0b' : '#06b6d4'};
          border: 2px solid #ffffff;
          color: #030712;
          font-weight: 900;
          font-size: 11px;
          font-family: ui-monospace, monospace;
          box-shadow: 0 4px 14px rgba(0,0,0,0.85), 0 0 10px rgba(6,182,212,0.7);
          cursor: grab;
          user-select: none;
          transition: transform 0.15s ease;
        ">
          ${idx + 1}
        </div>
      `;
      const icon = L.divIcon({
        html: markerHtml,
        className: 'measure-pin',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([pt.lat, pt.lng], {
        icon,
        draggable: true,
        zIndexOffset: 3000 + idx,
      });

      marker.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px; padding: 5px; line-height: 1.4; background: rgba(7,11,20,0.96); border: 1.5px solid #06b6d4; border-radius: 8px; color: #fff;">
          <div style="font-weight: bold; color: #38bdf8;">Vertex ${idx + 1} ${isFirst ? '(Start)' : isLast ? '(End)' : ''}</div>
          <div style="color: #cbd5e1;">Lat: ${pt.lat.toFixed(4)}°, Lng: ${pt.lng.toFixed(4)}°</div>
          <div style="color: #94a3b8;">Elevation: ${elev > 0 ? `+${elev}` : elev} m</div>
          <div style="color: #fbbf24; font-size: 9.5px; margin-top: 3px; border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 2px;">
            Drag to adjust • Click to delete
          </div>
        </div>`,
        { permanent: false, direction: 'top', offset: [0, -14] }
      );

      // Drag listener to update point coordinates interactively
      marker.on('dragend', (e) => {
        const newLatLng = (e.target as L.Marker).getLatLng();
        let lng = ((((newLatLng.lng + 180) % 360) + 360) % 360) - 180;
        const lat = Math.max(-90, Math.min(90, newLatLng.lat));
        setMeasurePoints((prev) =>
          prev.map((p, i) =>
            i === idx ? { lat, lng, elevationM: getMolaElevation(lat, lng) } : p
          )
        );
      });

      // Click on pin deletes it
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setMeasurePoints((prev) => prev.filter((_, i) => i !== idx));
      });

      marker.addTo(layer);
    });

    // 4. Synchronized live hover reticle from cross-sectional elevation graph
    if (hoveredElevationSample) {
      const hoverMarkerHtml = `
        <div class="relative flex items-center justify-center w-8 h-8 pointer-events-none">
          <div class="absolute inset-0 rounded-full animate-ping opacity-80" style="background-color: ${hoveredElevationSample.difficultyColor};"></div>
          <div class="w-4 h-4 rounded-full border-2 border-white shadow-2xl flex items-center justify-center" style="background-color: ${hoveredElevationSample.difficultyColor};">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
      `;
      const hoverIcon = L.divIcon({
        html: hoverMarkerHtml,
        className: 'hover-measure-transect-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const hoverMarker = L.marker([hoveredElevationSample.lat, hoveredElevationSample.lng], {
        icon: hoverIcon,
        zIndexOffset: 4500,
      }).addTo(layer);
      hoverMarker.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px; padding: 2px 4px;">
          <div style="font-weight: bold; color: #ffffff;">Dist: ${hoveredElevationSample.distanceKm} km | Elev: ${hoveredElevationSample.elevationM > 0 ? `+${hoveredElevationSample.elevationM}` : hoveredElevationSample.elevationM}m</div>
          <div style="color: ${hoveredElevationSample.difficultyColor};">Slope: ${hoveredElevationSample.slopeDeg}° (${hoveredElevationSample.difficultyLabel})</div>
        </div>`,
        { permanent: true, direction: 'top', offset: [0, -10] }
      );
    }
  }, [isMeasureToolOpen, measurePoints, measureMode, hoveredElevationSample]);

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
    openElevationProfile();
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

  // Fly to high-resolution DTM site
  const handleFlyToHighResSite = (lat: number, lng: number, zoom: number, name: string) => {
    const map = mapInstanceRef.current || mapInstance;
    if (!map) return;
    const cleanLng = normalizeAvailLongitude(lng, 'neg180_to_pos180');
    map.flyTo([lat, cleanLng], zoom, { duration: 1.5 });
    const avail = getElevationAvailabilityAtCoord(lat, cleanLng);
    setInspectedAvailabilityPoint(avail);
    marsSonification.sonifyLocation(Math.round(avail.resolutionMetersPerPixel * 10), 12);
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

  // Render MGS MOLA Elevation Data Availability & High-Res DTM Heatmap Overlay on Leaflet Map
  useEffect(() => {
    const layer = molaAvailabilityLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showMolaAvailabilityOverlay) return;

    // 1. Regional and Global Heatmap Grid Cells
    const gridCells = generateElevationAvailabilityGrid();
    gridCells.forEach((cell) => {
      // Apply Tier Filter if not 'ALL'
      if (molaTierFilter !== 'ALL' && cell.availability.tier !== molaTierFilter) {
        return;
      }

      const color = cell.availability.color;
      const fillOpacity = Math.min(
        0.82,
        Math.max(0.10, cell.availability.intensity * molaAvailabilityOpacity)
      );

      const circle = L.circle([cell.lat, cell.lng], {
        radius: cell.radiusKm * 1000,
        color: color,
        weight: cell.availability.tier === 'ULTRA_HIGH' ? 2 : cell.availability.tier === 'HIGH' ? 1.4 : 0.5,
        opacity: Math.min(0.85, fillOpacity + 0.2),
        fillColor: color,
        fillOpacity: fillOpacity,
      });

      circle.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px; padding: 4px; line-height: 1.4;">
          <div style="font-weight: bold; color: ${color};">${cell.availability.tierLabel}</div>
          <div style="color: #ffffff; font-weight: bold;">Ground Sampling: ${cell.availability.resolutionMetersPerPixel < 1 ? `${cell.availability.resolutionMetersPerPixel * 100} cm/px` : `${cell.availability.resolutionMetersPerPixel} m/pixel`}</div>
          <div style="color: #94a3b8; font-size: 10px;">${cell.availability.relativeGainVsBaseMola >= 1 ? `${cell.availability.relativeGainVsBaseMola}× resolution vs base MOLA` : 'Low-res interpolation gap'}</div>
          <div style="color: #cbd5e1; font-size: 10px; margin-top: 2px;">${cell.availability.activeDataset.name}</div>
          <div style="color: #38bdf8; font-size: 9px; margin-top: 3px;">Click to inspect elevation dataset dossier</div>
        </div>`,
        { permanent: false, direction: 'top' }
      );

      circle.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setInspectedAvailabilityPoint(cell.availability);
        setIsMolaAvailabilityPanelOpen(true);
      });

      circle.addTo(layer);
    });

    // 2. High-Resolution DTM Footprint Corridors & Ultra-High HiRISE Hotspots
    ELEVATION_DATASET_CATALOG.forEach((ds) => {
      if (molaTierFilter !== 'ALL' && ds.tier !== molaTierFilter) {
        return;
      }

      const minLng = normalizeAvailLongitude(ds.bounds.minLng, 'neg180_to_pos180');
      const maxLng = normalizeAvailLongitude(ds.bounds.maxLng, 'neg180_to_pos180');

      // Create bounding footprint box
      const bounds = L.latLngBounds(
        [ds.bounds.minLat, Math.min(minLng, maxLng)],
        [ds.bounds.maxLat, Math.max(minLng, maxLng)]
      );

      const strokeColor =
        ds.tier === 'ULTRA_HIGH'
          ? '#ff0055'
          : ds.tier === 'HIGH'
          ? '#f59e0b'
          : '#10b981';

      const rect = L.rectangle(bounds, {
        color: strokeColor,
        weight: ds.tier === 'ULTRA_HIGH' ? 2.5 : 1.8,
        dashArray: ds.tier === 'ULTRA_HIGH' ? '4, 4' : undefined,
        fillColor: strokeColor,
        fillOpacity: Math.min(0.55, 0.28 * molaAvailabilityOpacity),
      });

      rect.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px; padding: 4px; line-height: 1.4;">
          <div style="font-weight: bold; color: ${strokeColor};">${ds.name}</div>
          <div style="color: #ffffff;">${ds.instrument} • ${ds.resolutionMetersPerPixel < 1 ? `${ds.resolutionMetersPerPixel * 100} cm/px` : `${ds.resolutionMetersPerPixel} m/px`}</div>
          <div style="color: #facc15; font-size: 10px;">${ds.relativeGainVsBaseMola}× resolution vs 463m base tile</div>
          <div style="color: #94a3b8; font-size: 9px; margin-top: 2px;">${ds.geologicalContext}</div>
        </div>`,
        { permanent: false, direction: 'top' }
      );

      rect.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        const avail = getElevationAvailabilityAtCoord(ds.center.lat, ds.center.lng);
        setInspectedAvailabilityPoint(avail);
        setIsMolaAvailabilityPanelOpen(true);
      });

      rect.addTo(layer);

      // Centered badge icon for quick recognition
      const centerLng = normalizeAvailLongitude(ds.center.lng, 'neg180_to_pos180');
      const badgeHtml = `
        <div class="flex items-center gap-1 px-2 py-0.5 rounded-full shadow-2xl font-mono text-[9.5px] cursor-pointer whitespace-nowrap border ${
          ds.tier === 'ULTRA_HIGH'
            ? 'bg-pink-950/95 border-pink-500 text-pink-200'
            : ds.tier === 'HIGH'
            ? 'bg-amber-950/95 border-amber-500 text-amber-200'
            : 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
        }">
          <span class="font-bold">${ds.resolutionMetersPerPixel < 1 ? `${ds.resolutionMetersPerPixel * 100}cm` : `${ds.resolutionMetersPerPixel}m`}</span>
          <span class="opacity-80">${ds.id.split('-')[1] || ds.instrument}</span>
          <span class="px-1 rounded bg-black/60 font-bold text-[9px] text-white">${ds.relativeGainVsBaseMola}×</span>
        </div>
      `;
      const badgeIcon = L.divIcon({
        html: badgeHtml,
        className: 'elevation-dtm-badge',
        iconSize: [140, 24],
        iconAnchor: [70, 12],
      });

      const badgeMarker = L.marker([ds.center.lat, centerLng], { icon: badgeIcon }).addTo(layer);
      badgeMarker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        const avail = getElevationAvailabilityAtCoord(ds.center.lat, ds.center.lng);
        setInspectedAvailabilityPoint(avail);
        setIsMolaAvailabilityPanelOpen(true);
      });
    });

    // 3. Probed Surface Point Reticle
    if (inspectedAvailabilityPoint) {
      const probeIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 pointer-events-none">
            <div class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: ${inspectedAvailabilityPoint.color};"></div>
            <div class="w-5 h-5 rounded-full border-2 border-white shadow-2xl flex items-center justify-center font-mono font-bold text-[9px] text-white" style="background-color: ${inspectedAvailabilityPoint.color};">
              ▲
            </div>
          </div>
        `,
        className: 'elevation-probe-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const cleanProbeLng = normalizeAvailLongitude(inspectedAvailabilityPoint.lng, 'neg180_to_pos180');
      L.marker([inspectedAvailabilityPoint.lat, cleanProbeLng], { icon: probeIcon })
        .bindTooltip(
          `<div style="font-family: monospace; font-size: 11px;">
            <strong>${inspectedAvailabilityPoint.tierLabel}</strong><br/>
            ${inspectedAvailabilityPoint.resolutionMetersPerPixel < 1 ? `${inspectedAvailabilityPoint.resolutionMetersPerPixel * 100} cm/px` : `${inspectedAvailabilityPoint.resolutionMetersPerPixel} m/px`} (${inspectedAvailabilityPoint.relativeGainVsBaseMola}× gain)
          </div>`,
          { permanent: true, direction: 'top', offset: [0, -10] }
        )
        .addTo(layer);
    }
  }, [
    showMolaAvailabilityOverlay,
    molaAvailabilityOpacity,
    molaTierFilter,
    inspectedAvailabilityPoint,
  ]);

  // Render Atmospheric Pressure & Surface Temperature Overlay on Leaflet Map
  useEffect(() => {
    const layer = atmosphereLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showAtmosphereOverlay) return;

    // 1. Render Regional Isobar / Isotherm Zones (if enabled)
    if (showAtmosphereIsobarZones) {
      MARS_ATMO_ZONES.forEach((zone) => {
        const fillColor =
          atmosphereMode === 'temperature'
            ? zone.colorTemp
            : atmosphereMode === 'pressure'
            ? zone.colorPressure
            : zone.colorPressure;

        const polygon = L.polygon(zone.polygon, {
          color: fillColor,
          weight: 1.5,
          opacity: Math.min(0.9, atmosphereOpacity + 0.15),
          fillColor: fillColor,
          fillOpacity: Math.min(0.75, atmosphereOpacity * 0.45),
          dashArray: '4, 4',
        });

        polygon.bindTooltip(
          `<div style="font-family: monospace; font-size: 11px; padding: 4px; line-height: 1.4; background: rgba(7,11,20,0.95); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff;">
            <div style="font-weight: bold; color: ${fillColor}; font-size: 12px;">${zone.name}</div>
            <div style="color: #38bdf8; margin-top: 2px;">💨 Pressure: ${zone.pressureRangeMbar[0]} – ${zone.pressureRangeMbar[1]} mbar</div>
            <div style="color: #fb923c;">🌡️ Temperature: ${zone.tempRangeC[0]}°C to ${zone.tempRangeC[1]}°C</div>
            <div style="color: #94a3b8; font-size: 10px; margin-top: 3px;">${zone.description}</div>
          </div>`,
          { permanent: false, direction: 'top' }
        );

        polygon.addTo(layer);
      });
    }

    // 2. Render Meteorological Station Badges at Landing Sites (if enabled)
    if (showAtmosphereStationBadges) {
      MARS_LANDING_SITES_ATMOSPHERE.forEach((site) => {
        const isSelected = site.id === selectedAtmosphereSiteId;

        const badgeColor =
          atmosphereMode === 'temperature'
            ? site.tempMaxC > 0
              ? '#ea580c'
              : site.tempAvgC > -60
              ? '#f59e0b'
              : '#0284c7'
            : site.pressureMbar > 10
            ? '#1e3a8a'
            : site.pressureMbar > 8
            ? '#0284c7'
            : site.pressureMbar > 6
            ? '#10b981'
            : '#ef4444';

        const mainMetricText =
          atmosphereMode === 'temperature'
            ? `${site.tempMaxC}°C / ${site.tempMinC}°C`
            : atmosphereMode === 'pressure'
            ? `${site.pressureMbar} mb`
            : `${site.tempAvgC}°C • ${site.pressureMbar}mb`;

        const subMetricText =
          atmosphereMode === 'temperature'
            ? `Avg: ${site.tempAvgC}°C`
            : atmosphereMode === 'pressure'
            ? `${site.pressurePa} Pa`
            : site.weatherStationName.split(' ')[0];

        const customHtml = `
          <div style="
            transform: translate(-50%, -100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            filter: drop-shadow(0 4px 12px rgba(0,0,0,0.8));
          ">
            <div style="
              background: rgba(7, 11, 20, 0.92);
              backdrop-filter: blur(8px);
              border: 1.5px solid ${isSelected ? '#38bdf8' : badgeColor};
              border-radius: 9999px;
              padding: 2px 7px;
              display: flex;
              align-items: center;
              gap: 5px;
              white-space: nowrap;
              font-family: ui-monospace, monospace;
              box-shadow: ${isSelected ? '0 0 16px rgba(56,189,248,0.7)' : 'none'};
            ">
              <span style="
                width: 6px;
                height: 6px;
                border-radius: 9999px;
                background-color: ${badgeColor};
                animation: pulse 2s infinite;
              "></span>
              <span style="font-weight: 800; font-size: 10.5px; color: #ffffff;">
                ${mainMetricText}
              </span>
            </div>

            <div style="
              margin-top: 1px;
              background: rgba(0, 0, 0, 0.75);
              border-radius: 4px;
              padding: 1px 4px;
              font-size: 8.5px;
              font-weight: 600;
              color: #cbd5e1;
              white-space: nowrap;
              max-width: 110px;
              overflow: hidden;
              text-overflow: ellipsis;
            ">
              ${site.name.split(' ')[0]} • ${subMetricText}
            </div>

            <div style="
              width: 0;
              height: 0;
              border-left: 4px solid transparent;
              border-right: 4px solid transparent;
              border-top: 5px solid ${badgeColor};
              margin-top: -1px;
            "></div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'mars-atmosphere-badge',
          html: customHtml,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([site.lat, site.lng], { icon, zIndexOffset: isSelected ? 1000 : 500 });

        marker.bindTooltip(
          `<div style="font-family: monospace; font-size: 11px; padding: 6px; line-height: 1.4; background: rgba(7,11,20,0.96); border: 1.5px solid ${badgeColor}; border-radius: 12px; color: #fff; min-width: 220px;">
            <div style="font-weight: bold; font-size: 12px; color: #38bdf8;">${site.name}</div>
            <div style="color: #94a3b8; font-size: 10px;">${site.weatherStationName} (${site.agency})</div>
            <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 4px 0;"></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #94a3b8;">Elevation:</span>
              <span style="font-weight: bold;">${site.elevationM > 0 ? `+${site.elevationM}` : site.elevationM} m</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #94a3b8;">Pressure:</span>
              <span style="font-weight: bold; color: #38bdf8;">${site.pressureMbar} mbar (${site.pressurePa} Pa)</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #94a3b8;">Diurnal Temp:</span>
              <span style="font-weight: bold; color: #fb923c;">${site.tempMaxC}°C to ${site.tempMinC}°C (Avg ${site.tempAvgC}°C)</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #94a3b8;">Air Density:</span>
              <span style="font-weight: bold; color: #a78bfa;">${site.airDensityGPerM3} g/m³</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Wind & Dust:</span>
              <span>${site.windSpeedMps} m/s ${site.windDirection} (τ=${site.dustOpacityTau})</span>
            </div>
            <div style="color: #38bdf8; font-size: 9.5px; margin-top: 5px; text-align: center; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 3px;">
              Click to inspect site & open atmosphere dossier
            </div>
          </div>`,
          { permanent: false, direction: 'top', offset: [0, -25] }
        );

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedAtmosphereSiteId(site.id);
          setIsAtmospherePanelOpen(true);
          mapInstanceRef.current?.flyTo([site.lat, site.lng], Math.max(currentZoom, 6), { duration: 1.0 });
          marsSonification.sonifyLocation(site.pressureMbar * 10, 2);
        });

        marker.addTo(layer);
      });
    }
  }, [
    showAtmosphereOverlay,
    atmosphereMode,
    atmosphereOpacity,
    showAtmosphereStationBadges,
    showAtmosphereIsobarZones,
    selectedAtmosphereSiteId,
    currentZoom,
    mapInstance,
  ]);


  // Update Basemap Layer
  useEffect(() => {
    const map = mapInstance || mapInstanceRef.current;
    if (!map) return;

    if (fallbackSurfaceLayerRef.current) {
      map.removeLayer(fallbackSurfaceLayerRef.current);
      fallbackSurfaceLayerRef.current = null;
    }

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Ultra-fast, responsive tile options to eliminate zoom loading delay:
    // updateWhenIdle: false -> immediately begins tile fetch without waiting for gesture halt
    // updateWhenZooming: true -> hardware CSS scaling + continuous fetching during zoom
    // keepBuffer: 8 -> keeps loaded tiles in DOM cache so zooming in/out has zero blank re-loading
    const fastTileOptions: L.TileLayerOptions = {
      minZoom: 1,
      maxNativeZoom: activeLayer === 'themis' ? 8 : 7,
      maxZoom: 20,
      noWrap: false,
      updateWhenIdle: false,
      updateWhenZooming: true,
      keepBuffer: 8,
      updateInterval: 80,
      tileSize: 256,
      crossOrigin: 'anonymous',
    };

    let newTileLayer: L.TileLayer;

    if (activeLayer === 'themis') {
      newTileLayer = L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018/1.0.0/default/default028mm/{z}/{y}/{x}.png',
        {
          ...fastTileOptions,
          attribution: 'NASA Odyssey THEMIS 100m Controlled Mosaic',
        }
      );
    } else if (activeLayer === 'viking') {
      newTileLayer = L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        {
          ...fastTileOptions,
          attribution: 'NASA Mars Trek / Viking MDIM2.1',
        }
      );
    } else if (activeLayer === 'mola') {
      newTileLayer = L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        {
          ...fastTileOptions,
          attribution: 'NASA MGS MOLA Elevation',
        }
      );
    } else {
      newTileLayer = L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        {
          ...fastTileOptions,
          attribution: 'OpenPlanetary / NASA MGS MOLA',
        }
      );
    }

    let tileErrors = 0;
    let fallbackActivated = false;
    const activateLocalFallback = () => {
      if (fallbackActivated || !mapInstanceRef.current) return;
      fallbackActivated = true;
      map.removeLayer(newTileLayer);
      const fallback = L.imageOverlay(
        '/textures/mars_viking_2k.jpg',
        [[-90, -180], [90, 180]],
        { opacity: activeLayer === 'viking' ? 1 : 0.72, interactive: false, crossOrigin: true }
      );
      fallback.addTo(map);
      fallbackSurfaceLayerRef.current = fallback;
      setIsTilesLoading(false);
    };

    newTileLayer.on('loading', () => setIsTilesLoading(true));
    newTileLayer.on('load', () => setIsTilesLoading(false));
    newTileLayer.on('tileerror', () => {
      tileErrors += 1;
      if (tileErrors >= 3) activateLocalFallback();
    });
    newTileLayer.addTo(map);

    const loadingTimeout = window.setTimeout(() => {
      if (tileErrors > 0) activateLocalFallback();
      else setIsTilesLoading(false);
    }, 5000);

    return () => {
      window.clearTimeout(loadingTimeout);
      if (fallbackSurfaceLayerRef.current) {
        map.removeLayer(fallbackSurfaceLayerRef.current);
        fallbackSurfaceLayerRef.current = null;
      }
    };
  }, [activeLayer, mapInstance]);

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
        setSelectedSite(null);
        setInspectedPoint(null);
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
        site.type?.includes('Rover') ||
        site.type?.includes('Lander') ||
        site.category?.includes('Mission') ||
        site.category?.includes('Lander') ||
        site.category?.includes('Rover') ||
        site.id === 'perseverance' ||
        site.id === 'curiosity' ||
        site.id === 'viking1' ||
        site.id === 'viking2' ||
        site.id === 'opportunity' ||
        site.id === 'spirit' ||
        site.id === 'sojourner' ||
        site.id === 'pathfinder' ||
        site.id === 'phoenix' ||
        site.id === 'insight' ||
        site.id === 'zhurong' ||
        site.id === 'beagle2' ||
        site.id === 'mars3' ||
        site.id === 'boxwork_formations';

      // Deduplication: When NASA Missions Overlay is active, completely skip rendering duplicate mission pins
      if (showNasaMissionsOverlay && isMissionSite && !isSelected) {
        return;
      }

      if (isMissionSite) {
        // Mission Timeline Slider Filter (Cumulative Year or Specific Era)
        if (isTimelineSliderOpen && timelineFilterMode !== 'all' && !isSelected) {
          const siteYear = getMissionLandingYear(site);
          if (siteYear !== null) {
            if (timelineFilterMode === 'cumulative') {
              if (siteYear > timelineSelectedYear) return;
            } else if (timelineFilterMode === 'era_only') {
              const activeEra =
                MISSION_ERAS.find((e) => e.id === timelineSelectedEraId) ||
                MISSION_ERAS.find(
                  (e) => timelineSelectedYear >= e.yearRange[0] && timelineSelectedYear <= e.yearRange[1]
                );
              if (activeEra) {
                if (siteYear < activeEra.yearRange[0] || siteYear > activeEra.yearRange[1]) {
                  return;
                }
              }
            }
          }
        }

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
        setInspectedPoint(null);
        setSelectedRegion(null);
        setPlaceIdentifierFeature(site);
        mapInstanceRef.current?.flyTo([site.lat, site.lng], Math.max(currentZoom, 5), { duration: 1.0 });
      });

      sitesGroup.addLayer(marker);
    });
  }, [
    showSites,
    selectedSite,
    missionLayerOptions,
    currentZoom,
    placeCategoryFilter,
    isTimelineSliderOpen,
    timelineFilterMode,
    timelineSelectedYear,
    timelineSelectedEraId,
    Mic,
    mapBoundsKey,
    mapInstance,
    showNasaMissionsOverlay,
  ]);

  // Official USGS/IAU gazetteer labels: reveal more names as the user zooms in.
  // The curated mission layer above stays visually prominent; this layer fills the gaps.
  useEffect(() => {
    const group = officialGazetteerLayerRef.current;
    const map = mapInstanceRef.current;
    if (!group || !map) return;
    group.clearLayers();
    if (!showSites || officialMarsFeatures.length === 0 || currentZoom < 3) return;

    const bounds = map.getBounds().pad(0.16);
    const curatedNames = new Set(ALL_MARS_FEATURES.map((feature) => feature.name.toLowerCase()));
    const collisionPoints: Array<{ x: number; y: number }> = [];
    const minimumDistance = currentZoom < 6 ? 42 : currentZoom < 8 ? 28 : 18;

    officialMarsFeatures
      .filter((feature) => {
        if (curatedNames.has(feature.name.toLowerCase()) || !bounds.contains([feature.lat, feature.lng])) return false;
        if (currentZoom < 4) return (feature.diameterKm || 0) >= 700;
        if (currentZoom < 5) return (feature.diameterKm || 0) >= 250;
        if (currentZoom < 6) return (feature.diameterKm || 0) >= 80;
        return true;
      })
      .sort((a, b) => (b.diameterKm || 0) - (a.diameterKm || 0))
      .forEach((feature) => {
        const point = map.latLngToContainerPoint([feature.lat, feature.lng]);
        if (collisionPoints.some((placed) => Math.hypot(placed.x - point.x, placed.y - point.y) < minimumDistance)) return;
        collisionPoints.push(point);

        const typeLower = feature.type.toLowerCase();
        const accent = typeLower.includes('crater') ? '#c084fc' : typeLower.includes('mons') || typeLower.includes('tholus') ? '#fb7185' : '#67e8f9';
        const icon = L.divIcon({
          className: 'usgs-gazetteer-label',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
          html: `<div style="transform:translate(-50%,-50%);display:flex;align-items:center;gap:5px;padding:3px 7px;border:1px solid ${accent}99;border-radius:999px;background:rgba(6,10,18,.78);color:#f8fafc;font:600 10px system-ui,sans-serif;white-space:nowrap;box-shadow:0 3px 12px rgba(0,0,0,.6),0 0 8px ${accent}33;"><span style="width:5px;height:5px;border-radius:50%;background:${accent};box-shadow:0 0 7px ${accent};"></span>${feature.name}</div>`,
        });
        const marker = L.marker([feature.lat, feature.lng], { icon, interactive: true });
        marker.bindTooltip(
          `<strong style="color:${accent}">${feature.name}</strong><br/><span>${feature.type}</span><br/><span>USGS/IAU approved • ${feature.lat.toFixed(2)}°, ${feature.lng >= 0 ? feature.lng.toFixed(2) : (feature.lng + 360).toFixed(2)}°E</span>`,
          { className: 'mars-tooltip', direction: 'top', offset: [0, -8] }
        );
        marker.on('click', () => {
          marker.openTooltip();
          map.flyTo([feature.lat, feature.lng], Math.max(currentZoom, 7), { duration: 0.8 });
        });
        group.addLayer(marker);
      });
  }, [officialMarsFeatures, showSites, currentZoom, mapBoundsKey, mapInstance]);

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

      // Check if rover is visible under current timeline filter
      if (isTimelineSliderOpen && timelineFilterMode !== 'all') {
        const roverYear = getMissionLandingYear(mission);
        if (roverYear !== null) {
          if (timelineFilterMode === 'cumulative' && roverYear > timelineSelectedYear) {
            return;
          }
          if (timelineFilterMode === 'era_only') {
            const activeEra =
              MISSION_ERAS.find((e) => e.id === timelineSelectedEraId) ||
              MISSION_ERAS.find(
                (e) => timelineSelectedYear >= e.yearRange[0] && timelineSelectedYear <= e.yearRange[1]
              );
            if (activeEra && (roverYear < activeEra.yearRange[0] || roverYear > activeEra.yearRange[1])) {
              return;
            }
          }
        }
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
  }, [
    showRoverTrack,
    missionLayerOptions,
    isTimelineSliderOpen,
    timelineFilterMode,
    timelineSelectedYear,
    timelineSelectedEraId,
    mapInstance,
  ]);

  // Render User Planned Route & Waypoints
  useEffect(() => {
    const layer = routeHazardLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!routeStartPoint && !routeEndPoint) return;

    routeHazardZones.forEach((hazard) => {
      const color = hazard.riskLevel === 'CRITICAL' ? '#ef4444' : hazard.riskLevel === 'HIGH' ? '#f97316' : '#eab308';
      const circle = L.circle([hazard.coordinate.latitude, hazard.coordinate.longitude], {
        radius: hazard.radiusMeters,
        color,
        fillColor: color,
        fillOpacity: 0.18,
        weight: 2,
        dashArray: '7, 5',
      });
      circle.bindTooltip(
        `<div style="font-family:system-ui,sans-serif;max-width:260px;line-height:1.35;">
          <strong style="color:${color};">${hazard.riskLevel} • ${hazard.type.replaceAll('_', ' ')}</strong><br/>
          <strong>${hazard.name}</strong><br/>
          <span>${hazard.description}</span><br/>
          <small style="color:#a3a3a3;">${hazard.provenance.status} • ${hazard.provenance.source}</small>
        </div>`,
        { direction: 'top', sticky: true, className: 'mars-tooltip' }
      );
      layer.addLayer(circle);

      const icon = L.divIcon({
        html: `<div style="width:22px;height:22px;border-radius:999px;background:${color};border:2px solid white;color:#111827;display:flex;align-items:center;justify-content:center;font-weight:900;font-family:monospace;box-shadow:0 2px 10px rgba(0,0,0,.8);">!</div>`,
        className: 'route-hazard-marker',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const marker = L.marker([hazard.coordinate.latitude, hazard.coordinate.longitude], { icon });
      marker.bindTooltip(`${hazard.name}<br/><span style="color:${color};">${hazard.riskLevel} hazard</span>`, {
        direction: 'top',
        className: 'mars-tooltip',
      });
      layer.addLayer(marker);
    });
  }, [routeHazardZones, routeStartPoint, routeEndPoint, mapInstance]);

  // Render User Planned Route, Hazard Overlays, & Safer Bypass Corridor on Map
  useEffect(() => {
    const map = mapInstanceRef.current || mapInstance;
    const markersGroup = routeMarkersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    if (routeComparisonPolylineRef.current) {
      map.removeLayer(routeComparisonPolylineRef.current);
      routeComparisonPolylineRef.current = null;
    }

    // Keep Point A/B visible as soon as the user selects them. Previously these
    // markers waited for route analysis, so selected points appeared to vanish.
    const shouldRenderCheckedRoute = isRouteChecked || isRouteSafetyHUDOpen || isRoutePlannerModalOpen;
    const addSelectedPointMarker = (
      point: { lat: number; lng: number; name?: string },
      kind: 'start' | 'destination'
    ) => {
      const isStart = kind === 'start';
      const accent = isStart ? '#35f2a1' : '#35f2ff';
      const label = isStart ? 'START' : 'FINAL';
      const icon = L.divIcon({
        html: `<div class="route-pick-marker" style="--pick-accent:${accent};"><span class="route-pick-marker__dot"></span><span class="route-pick-marker__label"><b>${label}</b> ${point.name || (isStart ? 'Point A' : 'Point B')}</span></div>`,
        className: 'route-pick-marker-wrap',
        iconSize: [1, 1],
        iconAnchor: [0, 0],
      });
      const marker = L.marker([point.lat, point.lng], { icon, zIndexOffset: 1200 });
      marker.bindTooltip(`${label}: ${point.name || (isStart ? 'Point A' : 'Point B')}`, { className: 'mars-tooltip', direction: 'top' });
      markersGroup.addLayer(marker);
    };

    if (routeStartPoint && (!shouldRenderCheckedRoute || !activePlannedRoute)) {
      addSelectedPointMarker(routeStartPoint, 'start');
    }
    if (routeEndPoint && (!shouldRenderCheckedRoute || !activePlannedRoute)) {
      addSelectedPointMarker(routeEndPoint, 'destination');
    }

    // 1. Render automated A* route (Active route or Hazard comparison)
    if (shouldRenderCheckedRoute && activePlannedRoute && activePlannedRoute.waypoints.length > 1 && routeStartPoint && routeEndPoint) {
      const isDangerousOrCaution = routeSafetyAssessment && !routeSafetyAssessment.isSafe;

      if (showRouteComparisonOnMap && isDangerousOrCaution && routeSafetyAssessment) {
        // A. Draw the Direct Hazardous Line in Crimson Red
        const directCoords: [number, number][] = routeSafetyAssessment.directRoute.waypoints.map((w) => [w.lat, w.lng]);
        const directLine = L.polyline(directCoords, {
          color: '#ef4444',
          weight: 3.5,
          opacity: 0.85,
          dashArray: '8, 6',
        }).addTo(map);

        directLine.bindTooltip(
          `<div style="font-family:system-ui,sans-serif;line-height:1.35;max-width:260px;">
            <strong style="color:#ef4444;">⚠️ Direct Line (Hazardous Path)</strong><br/>
            <span>Max Slope: <strong>${routeSafetyAssessment.maxDirectSlopeDeg}°</strong></span><br/>
            <span style="color:#fca5a5;">${routeSafetyAssessment.issues.length} Potential Hazards Detected</span>
          </div>`,
          { className: 'mars-tooltip', sticky: true }
        );
        routeComparisonPolylineRef.current = directLine;

        // B. Draw the Suggested Safer Corridor in Glowing Emerald Green
        const saferCoords: [number, number][] = routeSafetyAssessment.suggestedSaferRoute.waypoints.map((w) => [w.lat, w.lng]);
        const saferLine = L.polyline(saferCoords, {
          color: '#10b981',
          weight: 5.5,
          opacity: 0.95,
        }).addTo(map);

        saferLine.bindTooltip(
          `<div style="font-family:system-ui,sans-serif;line-height:1.35;max-width:260px;">
            <strong style="color:#10b981;">✨ Recommended Safe Bypass Corridor</strong><br/>
            <span>Max Slope Only: <strong>${routeSafetyAssessment.comparison.saferSlope}°</strong></span><br/>
            <span style="color:#86efac;">100% Safe Bypass • 0 Hazards</span>
          </div>`,
          { className: 'mars-tooltip', sticky: true }
        );
        routePolylineRef.current = saferLine;

        // Add visual Caution Markers along the direct route hazard intersections
        routeSafetyAssessment.issues.forEach((issue) => {
          const matchingWp =
            routeSafetyAssessment.directRoute.waypoints.find(
              (w) => w.hazardRisk === 'Hazardous' || w.slopeDeg >= 15
            ) ||
            routeSafetyAssessment.directRoute.waypoints[
              Math.floor(routeSafetyAssessment.directRoute.waypoints.length / 2)
            ];

          if (matchingWp) {
            const cautionIcon = L.divIcon({
              html: `<div class="animate-bounce" style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:999px;background:#ef4444;border:2px solid white;color:white;font-size:12px;font-weight:bold;box-shadow:0 0 14px rgba(239,68,68,0.85);">⚠️</div>`,
              className: 'hazard-caution-pin',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });
            const marker = L.marker([matchingWp.lat, matchingWp.lng], { icon: cautionIcon });
            marker.bindTooltip(
              `<strong style="color:#ef4444;">${issue.hazardName}</strong><br/><span>${issue.issueSummaryEn}</span>`,
              { className: 'mars-tooltip' }
            );
            markersGroup.addLayer(marker);
          }
        });
      } else {
        // Standard route rendering
        const routeCoords: [number, number][] = activePlannedRoute.waypoints.map((w) => [w.lat, w.lng]);
        const routeSafetyStatus = activePlannedRoute.safetyScore >= 85
          ? 'SAFE'
          : activePlannedRoute.safetyScore >= 70
          ? 'CAUTION'
          : 'DANGEROUS';
        const routeColor = routeSafetyStatus === 'DANGEROUS'
          ? '#ef4444'
          : routeSafetyStatus === 'CAUTION'
          ? '#f59e0b'
          : routeMode === 'science'
          ? '#a855f7'
          : routeMode === 'shortest'
          ? '#06b6d4'
          : '#10b981';
        const polyline = L.polyline(routeCoords, {
          color: routeColor,
          weight: 5,
          opacity: 0.95,
          dashArray: routeMode === 'shortest' ? '8, 5' : undefined,
        }).addTo(map);

        polyline.bindTooltip(
          `<div style="font-family:system-ui,sans-serif;line-height:1.35;">
            <strong style="color:${routeColor};">${activePlannedRoute.name}</strong><br/>
            <span>Distance: ${activePlannedRoute.totalDistanceKm} km • Walk Time: ${activePlannedRoute.estimatedWalkTimeFormatted}</span><br/>
            <span>Safety Score: ${activePlannedRoute.safetyScore}/100</span>
          </div>`,
          { className: 'mars-tooltip', sticky: true }
        );
        routePolylineRef.current = polyline;
      }

      // Add Start Marker (Point A - Emerald Pin)
      const startWp = activePlannedRoute.waypoints[0];
      const startIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center select-none" style="transform: translate(-50%, -50%);">
            <div class="absolute w-7 h-7 rounded-full bg-emerald-400/35 animate-ping"></div>
            <div class="relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/95 border-2 border-emerald-400 text-white font-mono font-bold text-[10.5px] shadow-2xl whitespace-nowrap">
              <span>🚀</span>
              <span>START: ${routeStartPoint.name?.split('(')[0]?.trim() || 'Base A'}</span>
            </div>
          </div>
        `,
        className: 'route-start-pin',
        iconSize: [20, 20],
        iconAnchor: [0, 0],
      });
      const startMarker = L.marker([startWp.lat, startWp.lng], { icon: startIcon });
      startMarker.bindTooltip(
        `Departure Base: ${routeStartPoint.name || 'Point A'}<br/>Elevation: ${startWp.elevationM}m`,
        { className: 'mars-tooltip' }
      );
      markersGroup.addLayer(startMarker);

      // Add Destination Marker (Point B - Red/Cyan Pin)
      const destWp = activePlannedRoute.waypoints[activePlannedRoute.waypoints.length - 1];
      const destIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center select-none" style="transform: translate(-50%, -50%);">
            <div class="absolute w-7 h-7 rounded-full bg-cyan-400/35 animate-ping"></div>
            <div class="relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/95 border-2 border-cyan-400 text-white font-mono font-bold text-[10.5px] shadow-2xl whitespace-nowrap">
              <span>🎯</span>
              <span>DEST: ${routeEndPoint.name?.split('(')[0]?.trim() || 'Target B'}</span>
            </div>
          </div>
        `,
        className: 'route-dest-pin',
        iconSize: [20, 20],
        iconAnchor: [0, 0],
      });
      const destMarker = L.marker([destWp.lat, destWp.lng], { icon: destIcon });
      destMarker.bindTooltip(
        `Destination: ${routeEndPoint.name || 'Point B'}<br/>Elevation: ${destWp.elevationM}m`,
        { className: 'mars-tooltip' }
      );
      markersGroup.addLayer(destMarker);

      // Add intermediate waypoint indicators
      activePlannedRoute.waypoints.slice(1, -1).forEach((wp, idx) => {
        if (idx % 2 === 0 || wp.isScienceStop) {
          const wpIcon = L.divIcon({
            html: `
              <div class="w-4 h-4 rounded-full ${
                wp.isScienceStop ? 'bg-purple-600 border-purple-200' : 'bg-neutral-800 border-white'
              } border-2 text-[8px] font-bold text-white flex items-center justify-center shadow">
                ${wp.isScienceStop ? '🔬' : idx + 1}
              </div>
            `,
            className: 'route-mid-pin',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          const midMarker = L.marker([wp.lat, wp.lng], { icon: wpIcon });
          midMarker.bindTooltip(
            `${wp.name}<br/>Slope: ${wp.slopeDeg}° • Elevation: ${wp.elevationM}m`,
            { className: 'mars-tooltip' }
          );
          markersGroup.addLayer(midMarker);
        }
      });
    }

    // 2. Fallback manual routeWaypoints if user explicitly draws manual line
    if (routeWaypoints.length >= 2 && !activePlannedRoute) {
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
      const hours = km / 3.2;

      setRouteStats({
        distanceKm: Number(km.toFixed(2)),
        estHours: Number(hours.toFixed(1)),
      });
    }
  }, [
    activePlannedRoute,
    isRouteChecked,
    isRouteSafetyHUDOpen,
    isRoutePlannerModalOpen,
    routeStartPoint,
    routeEndPoint,
    routeMode,
    showRouteComparisonOnMap,
    routeSafetyAssessment,
    routeWaypoints,
    mapInstance,
  ]);

  // Render Destination Beacon & Range Trajectory Line on Mars Map
  useEffect(() => {
    const map = mapInstance || mapInstanceRef.current;
    if (!map) return;

    if (!destinationMarkerLayerRef.current) {
      destinationMarkerLayerRef.current = L.layerGroup().addTo(map);
    }
    const destGroup = destinationMarkerLayerRef.current;
    destGroup.clearLayers();

    if (destinationTrajectoryLayerRef.current) {
      map.removeLayer(destinationTrajectoryLayerRef.current);
      destinationTrajectoryLayerRef.current = null;
    }

    if (!activeDestination) return;

    // Glowing Animated Destination Beacon Icon
    const destIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center select-none" style="transform: translate(-50%, -50%);">
          <div class="absolute w-12 h-12 rounded-full bg-cyan-400/25 animate-ping"></div>
          <div class="absolute w-8 h-8 rounded-full bg-cyan-500/30 border border-cyan-400"></div>
          <div class="relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#060a12]/95 border-2 border-cyan-400 shadow-2xl text-cyan-300 text-[11px] font-bold font-mono">
            <span class="text-sm">🎯</span>
            <span class="text-white whitespace-nowrap">${activeDestination.name.split('(')[0].trim()}</span>
            <span class="text-[9.5px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/60 font-mono">
              ${activeDestination.elevationM >= 0 ? `+${activeDestination.elevationM}m` : `${activeDestination.elevationM}m`}
            </span>
          </div>
        </div>
      `,
      className: 'mars-dest-marker',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const marker = L.marker([activeDestination.lat, activeDestination.lng], { icon: destIcon });
    marker.on('click', () => {
      setIsDestinationToolOpen(true);
    });
    destGroup.addLayer(marker);

    // Geodesic Trajectory Line from active site/origin to destination
    const originLat = selectedSite?.lat ?? 18.38;
    const originLng = selectedSite?.lng ?? 77.58;
    const distKm = Math.round(
      calculateMarsDistanceKm(
        { latitude: originLat, longitude: originLng },
        { latitude: activeDestination.lat, longitude: activeDestination.lng }
      )
    );

    if (distKm > 2) {
      const trajectory = L.polyline(
        [
          [originLat, originLng],
          [activeDestination.lat, activeDestination.lng],
        ],
        {
          color: '#06b6d4',
          weight: 3.5,
          opacity: 0.85,
          dashArray: '8, 6',
        }
      ).addTo(map);

      trajectory.bindTooltip(
        `<b>Range:</b> ${distKm.toLocaleString()} km to ${activeDestination.name}`,
        { className: 'mars-tooltip', sticky: true }
      );

      destinationTrajectoryLayerRef.current = trajectory;
    }
  }, [activeDestination, selectedSite, mapInstance]);

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
      safeInvalidateSize(map);
      try {
        map.flyTo([site.lat, site.lng], zoomLevel, {
          duration: 1.2,
        });
      } catch {}
    }
  };

  // Fly to arbitrary lat/lng coordinates across both 2D Leaflet map & 3D Three.js Globe
  const handleFlyToLocation = (lat: number, rawLng: number, zoomLevel = 6, name?: string, elevationM?: number) => {
    // Guard against swapped coordinates (e.g. planetocentric lng > 90 passed as lat)
    let processedLat = lat;
    let processedLng = rawLng;
    if (Math.abs(processedLat) > 90 && Math.abs(processedLng) <= 90) {
      const temp = processedLat;
      processedLat = processedLng;
      processedLng = temp;
    }
    // Strictly clamp latitude to physical Martian boundaries [-89.9, 89.9]
    let finalLat = Math.max(-89.9, Math.min(89.9, processedLat));
    // 1. Normalize longitude into standard Leaflet GIS coordinate system [-180, 180]
    let finalLng = ((((processedLng + 180) % 360) + 360) % 360) - 180;
    let finalElevation = elevationM ?? -2000;
    let finalCategory: MarsFeature['type'] = 'Planitia (Plain)';
    let finalDesc = `Latitude: ${finalLat.toFixed(2)}°, Longitude: ${((finalLng + 360) % 360).toFixed(2)}°E`;
    let finalName = name || 'Martian Surface Target';
    let matchedSite: MarsSite | null = null;

    // 2. Canonical feature matching: If an explicit landmark name was specified (from AI, search, or mission),
    // look up authoritative coordinates from ALL_MARS_FEATURES database to guarantee 100% precision.
    const GENERIC_LABELS = ['martian surface target', 'requested martian location', 'inspected location', 'point', 'surface target', 'target', 'mars location', 'unknown'];
    if (name && !GENERIC_LABELS.includes(name.toLowerCase().trim())) {
      const q = name.toLowerCase().trim();
      const match = ALL_MARS_FEATURES.find((f) => {
        const fName = f.name.toLowerCase();
        if (fName === q || f.id.toLowerCase() === q) return true;
        const strippedF = fName.replace(/\s*(crater|mons|planitia|basin|vallis|chasma|tholus|patera|terra)/gi, '').trim();
        const strippedQ = q.replace(/\s*(crater|mons|planitia|basin|vallis|chasma|tholus|patera|terra)/gi, '').trim();
        if (strippedF && strippedQ && strippedF === strippedQ) return true;
        if (q.length >= 4 && (fName.startsWith(q + ' ') || fName.endsWith(' ' + q))) return true;
        return false;
      });
      if (match) {
        finalLat = match.lat;
        finalLng = match.lng;
        finalElevation = match.elevationM;
        finalCategory = match.type;
        finalDesc = match.description;
        finalName = match.name;
        matchedSite = {
          id: match.id,
          name: match.name,
          lat: match.lat,
          lng: match.lng,
          planetocentricLng: match.planetocentricLng,
          elevation: match.elevationM,
          elevationM: match.elevationM,
          category: match.type,
          type: match.type,
          significance: match.originName || match.description,
          description: match.description,
          originName: match.originName,
        };
      }
    }

    if (!matchedSite) {
      matchedSite = {
        id: `coord-${finalLat.toFixed(3)}-${finalLng.toFixed(3)}`,
        name: finalName,
        lat: finalLat,
        lng: finalLng,
        planetocentricLng: (finalLng + 360) % 360,
        elevation: finalElevation,
        elevationM: finalElevation,
        originName: finalName,
        category: finalCategory,
        type: finalCategory,
        significance: finalName ? `Target: ${finalName}` : 'Martian surface coordinate',
        description: finalDesc,
      };
    }

    setSelectedSite(matchedSite);
    setInspectedPoint(null);
    setSelectedRegion(null);

    const map = mapInstanceRef.current;
    if (map) {
      safeInvalidateSize(map);
      try {
        map.flyTo([finalLat, finalLng], zoomLevel, {
          duration: 1.2,
        });
      } catch {}
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

  // Helper: compute ellipse points on spherical Mars (3389.5 km radius)
  const getMarsEllipsePoints = (
    centerLat: number,
    centerLng: number,
    majorKm: number,
    minorKm: number,
    tiltDeg: number,
    numPoints: number = 32
  ): [number, number][] => {
    const kmPerDegLat = 59.16;
    const kmPerDegLng = 59.16 * Math.cos((centerLat * Math.PI) / 180);
    const safeKmPerDegLng = Math.max(0.01, kmPerDegLng);
    const radTilt = (tiltDeg * Math.PI) / 180;
    const cosTilt = Math.cos(radTilt);
    const sinTilt = Math.sin(radTilt);

    const points: [number, number][] = [];
    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * 2 * Math.PI;
      const x = majorKm * Math.cos(theta);
      const y = minorKm * Math.sin(theta);
      const rotX = x * cosTilt - y * sinTilt;
      const rotY = x * sinTilt + y * cosTilt;
      const lat = centerLat + rotY / kmPerDegLat;
      const lng = centerLng + rotX / safeKmPerDegLng;
      points.push([lat, lng]);
    }
    return points;
  };

  // Render NASA Historic Missions Overlay on Map
  useEffect(() => {
    const layer = nasaMissionsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showNasaMissionsOverlay) return;

    NASA_HISTORIC_MISSIONS.forEach((m) => {
      if (m.lat === undefined || m.lng === undefined) return;
      const mLat = m.lat;
      const mLng = ((((m.lng + 180) % 360) + 360) % 360) - 180;
      const ellipse = NASA_LANDING_ELLIPSES[m.id];
      const elev = m.elevationM ?? getMolaElevation(mLat, mLng);

      // 1. Landing Ellipse
      if (showLandingEllipses && ellipse) {
        const ellipsePoints = getMarsEllipsePoints(
          mLat,
          mLng,
          ellipse.majorKm,
          ellipse.minorKm,
          ellipse.tiltDeg
        );
        const ellipsePoly = L.polygon(ellipsePoints, {
          color: m.status === 'active' ? '#10b981' : '#f97316',
          weight: 2,
          dashArray: '5, 5',
          fillColor: m.status === 'active' ? '#10b981' : '#f97316',
          fillOpacity: 0.12,
        });
        ellipsePoly.bindTooltip(
          `<div style="font-family: monospace; font-size: 11px; padding: 4px; background: rgba(7,11,20,0.96); border: 1px solid #f97316; border-radius: 6px; color: #fff;">
            <div style="font-weight: bold; color: #fbbf24;">${m.name} EDL Ellipse</div>
            <div style="color: #cbd5e1;">Major Axis: ${ellipse.majorKm} km • Minor: ${ellipse.minorKm} km</div>
            <div style="color: #94a3b8;">Tilt: ${ellipse.tiltDeg}° • Elev: ${elev > 0 ? '+' + elev : elev}m</div>
          </div>`,
          { direction: 'top', offset: [0, -10] }
        );
        ellipsePoly.addTo(layer);
      }

      // 2. Mission Marker - Compact, sleek aerospace pill (no screen crowding)
      const isActive = m.status === 'active';
      const isRover = m.type === 'rover';
      const cleanShortName = m.name
        .replace('Mars Science Laboratory ', '')
        .replace('Mars Exploration Rover ', '')
        .replace('Mars 2020 ', '')
        .replace(' Mars Lander', '')
        .replace(' Lander & Orbiter', '');

      const yearLabel = m.arrivalDate ? m.arrivalDate.match(/\b(19\d\d|20\d\d)\b/)?.[0] || 'NASA' : 'NASA';

      const markerHtml = `
        <div class="group relative select-none cursor-pointer flex items-center justify-center" style="transform: translate(-50%, -50%);">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-200 backdrop-blur-md ${
            isActive
              ? 'bg-[#052e16]/95 border-2 border-emerald-400 text-emerald-100 shadow-[0_0_14px_rgba(16,185,129,0.7)]'
              : 'bg-[#1c0d02]/95 border-2 border-orange-500 text-orange-100 shadow-[0_0_12px_rgba(249,115,22,0.6)]'
          } hover:scale-110 z-30">
            <span class="text-xs leading-none">${isRover ? '🚙' : '📡'}</span>
            <span class="text-[11px] font-bold text-white whitespace-nowrap tracking-tight">
              ${cleanShortName}
            </span>
            <span class="text-[8.5px] font-mono font-semibold px-1 py-0.2 rounded ${
              isActive
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                : 'bg-orange-950 text-orange-300 border border-orange-700'
            }">
              ${isActive ? 'Active' : yearLabel}
            </span>
            ${
              isActive
                ? '<span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>'
                : ''
            }
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'nasa-mission-overlay-marker',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([mLat, mLng], { icon, zIndexOffset: 2000 }).addTo(layer);

      marker.bindTooltip(
        `<div style="font-family: system-ui, sans-serif; font-size: 11.5px; padding: 6px; line-height: 1.4; max-width: 240px; background: rgba(7,11,20,0.98); border: 1.5px solid #f97316; border-radius: 8px; color: #fff;">
          <div style="font-weight: 800; color: #fbbf24; font-size: 12px;">${m.name} (${m.landingSiteName || 'Surface Site'})</div>
          <div style="color: #cbd5e1; font-size: 10.5px; margin-top: 2px;">${m.objectives?.[0] || m.keyDiscoveries?.[0] || 'NASA Exploration Mission'}</div>
          <div style="color: #38bdf8; font-size: 10px; font-family: monospace; margin-top: 4px; border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 3px;">
            Coords: ${mLat > 0 ? '+' + mLat + '°N' : mLat + '°S'}, ${mLng >= 0 ? mLng + '°E' : Math.abs(mLng) + '°W'} • Click for Dossier & POV
          </div>
        </div>`,
        { direction: 'top', offset: [0, -18] }
      );

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedNasaMission(m);
        setIsNasaLandingSiteModalOpen(true);
        mapInstanceRef.current?.flyTo([mLat, mLng], Math.max(currentZoom, 7), { duration: 1.2 });
      });

      // 3. Traverse track if present and enabled
      if (showNasaTraverses && m.traverseTrack && m.traverseTrack.length > 1) {
        L.polyline(
          m.traverseTrack.map((pt) => [pt.lat, ((((pt.lng + 180) % 360) + 360) % 360) - 180] as [number, number]),
          {
            color: m.status === 'active' ? '#34d399' : '#f97316',
            weight: 3,
            dashArray: '5, 4',
            opacity: 0.9,
          }
        ).addTo(layer);
      }
    });
  }, [showNasaMissionsOverlay, showLandingEllipses, showNasaTraverses, currentZoom, mapInstance]);

  const activeMarsMissionForModal = selectedNasaMission;

  // Load Route Planner Demo Scenarios (Jezero Delta vs Boxwork Formations 2025)
  const handleLoadDemoScenario = (scenarioType: 'jezero' | 'boxwork' = 'jezero') => {
    if (scenarioType === 'boxwork') {
      const startPt = {
        lat: -4.7115,
        lng: 137.3830,
        name: 'Vera Rubin Ridge Crest (Curiosity)',
      };
      const endPt = {
        lat: -4.7385,
        lng: 137.3475,
        name: 'Mount Sharp Boxwork Mineral Fins',
      };
      setRouteStartPoint(startPt);
      setRouteEndPoint(endPt);
      setRouteTransportMode('foot');
      setRouteCrewConfig('buddy_pair');
      setRouteMode('science');
      mapInstanceRef.current?.flyTo([startPt.lat, startPt.lng], 13, { duration: 1.5 });
    } else {
      const startPt = {
        lat: 18.4447,
        lng: 77.4508,
        name: 'Octavia E. Butler Landing (Jezero Base)',
      };
      const endPt = {
        lat: 18.435,
        lng: 77.395,
        name: 'Kodiak Delta Remnant',
      };
      setRouteStartPoint(startPt);
      setRouteEndPoint(endPt);
      setRouteTransportMode('unpressurized_rover');
      setRouteCrewConfig('buddy_pair');
      setRouteMode('safest');
      mapInstanceRef.current?.flyTo([startPt.lat, startPt.lng], 12, { duration: 1.5 });
    }
  };

  const handleAddScienceStop = (stop: ScienceStopSuggestion) => {
    if (routeStartPoint) {
      setRouteEndPoint({
        lat: stop.lat,
        lng: stop.lng,
        name: stop.name,
      });
      mapInstanceRef.current?.flyTo([stop.lat, stop.lng], 13, { duration: 1.2 });
    }
  };

  const handleEmergencyReturn = () => {
    if (activePlannedRoute && activePlannedRoute.waypoints.length > 0) {
      const baseWp = activePlannedRoute.waypoints[0];
      mapInstanceRef.current?.flyTo([baseWp.lat, baseWp.lng], 13, { duration: 1.2 });
    }
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

  // Keep the many map-owned dialogs consistent: Escape closes the active layer,
  // and the page behind a blocking dialog must not scroll.
  const hasBlockingOverlay = Boolean(
    isRegionDetailModalOpen ||
      isCloseUpModalOpen ||
      isScienceDossierOpen ||
      isMissionExplorerOpen ||
      isHumanMissionModeOpen ||
      isSearchModalOpen ||
      isTimelineSliderOpen ||
      isDestinationToolOpen ||
      isTimelineOpen ||
      isCompareModalOpen ||
      isDataSourcesModalOpen ||
      isBookmarksModalOpen ||
      isTourModalOpen ||
      isPresentationModeOpen ||
      isAskMarsWayOpen ||
      isLiveVoiceOpen ||
      isMeasureToolOpen ||
      isElevationProfileOpen ||
      isRoutePlannerModalOpen ||
      isNasaLandingSiteModalOpen ||
      Boolean(activeSurfacePovImage) ||
      isEarthComparisonOpen ||
      isPlaceIdentifierOpen ||
      isMolaAvailabilityPanelOpen ||
      isDustStormPanelOpen ||
      isAtmospherePanelOpen ||
      isNasaMissionsPanelOpen ||
      isHamburgerOpen ||
      activeTab !== null
  );

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    if (hasBlockingOverlay) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    const closeActiveOverlay = () => {
      if (isAskMarsWayOpen) return setIsAskMarsWayOpen(false);
      if (isLiveVoiceOpen) return setIsLiveVoiceOpen(false);
      if (isRoutePlannerModalOpen) return setIsRoutePlannerModalOpen(false);
      if (isPresentationModeOpen) return setIsPresentationModeOpen(false);
      if (isTourModalOpen) return setIsTourModalOpen(false);
      if (isDataSourcesModalOpen) return setIsDataSourcesModalOpen(false);
      if (isBookmarksModalOpen) return setIsBookmarksModalOpen(false);
      if (isCompareModalOpen) return setIsCompareModalOpen(false);
      if (isTimelineOpen) return setIsTimelineOpen(false);
      if (isTimelineSliderOpen) return setIsTimelineSliderOpen(false);
      if (isDestinationToolOpen) return setIsDestinationToolOpen(false);
      if (isElevationProfileOpen) return setIsElevationProfileOpen(false);
      if (isMeasureToolOpen) return setIsMeasureToolOpen(false);
      if (isScienceDossierOpen) return setIsScienceDossierOpen(false);
      if (isCloseUpModalOpen) return setIsCloseUpModalOpen(false);
      if (isNasaLandingSiteModalOpen) return setIsNasaLandingSiteModalOpen(false);
      if (isMolaAvailabilityPanelOpen) return setIsMolaAvailabilityPanelOpen(false);
      if (isDustStormPanelOpen) return setIsDustStormPanelOpen(false);
      if (isAtmospherePanelOpen) return setIsAtmospherePanelOpen(false);
      if (isNasaMissionsPanelOpen) return setIsNasaMissionsPanelOpen(false);
      if (isPlaceIdentifierOpen) return setIsPlaceIdentifierOpen(false);
      if (isEarthComparisonOpen) return setIsEarthComparisonOpen(false);
      if (isHumanMissionModeOpen) return setIsHumanMissionModeOpen(false);
      if (isMissionExplorerOpen) return setIsMissionExplorerOpen(false);
      if (isRegionDetailModalOpen) return setIsRegionDetailModalOpen(false);
      if (isSearchModalOpen) return setIsSearchModalOpen(false);
      if (isHamburgerOpen) return setIsHamburgerOpen(false);
      if (activeTab !== null) setActiveTab(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && hasBlockingOverlay) {
        event.preventDefault();
        closeActiveOverlay();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [
    hasBlockingOverlay,
    isAskMarsWayOpen,
    isLiveVoiceOpen,
    isRoutePlannerModalOpen,
    isPresentationModeOpen,
    isTourModalOpen,
    isDataSourcesModalOpen,
    isBookmarksModalOpen,
    isCompareModalOpen,
    isTimelineOpen,
    isTimelineSliderOpen,
    isDestinationToolOpen,
    isElevationProfileOpen,
    isMeasureToolOpen,
    isScienceDossierOpen,
    isCloseUpModalOpen,
    isNasaLandingSiteModalOpen,
    isMolaAvailabilityPanelOpen,
    isDustStormPanelOpen,
    isAtmospherePanelOpen,
    isNasaMissionsPanelOpen,
    isPlaceIdentifierOpen,
    isEarthComparisonOpen,
    isHumanMissionModeOpen,
    isMissionExplorerOpen,
    isRegionDetailModalOpen,
    isSearchModalOpen,
    isHamburgerOpen,
    activeTab,
    activeSurfacePovImage,
  ]);

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
    <div className="mars-theme relative w-full h-full flex flex-col bg-[#08090e] overflow-hidden select-none font-sans text-neutral-100">
      {/* Top Header Bar: Clean, Minimal & Responsive Aerospace HUD */}
      <header className="z-25 bg-[linear-gradient(90deg,rgba(29,14,16,0.98),rgba(18,17,18,0.97),rgba(29,14,16,0.98))] backdrop-blur-2xl border-b border-orange-500/20 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-1 sm:gap-2 shadow-xl shadow-black/60 shrink-0 w-full min-w-0">
        {/* Brand */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
          <div className="relative group shrink-0">
            <img
              src="/assets/aistudio/image_5c943629.png"
              alt="MARSWAY"
              className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-xl shadow-md shadow-orange-950/60 ring-1 ring-orange-300/60 object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-extrabold bg-gradient-to-r from-orange-200 via-orange-400 to-cyan-300 bg-clip-text text-transparent tracking-[0.16em] text-xs sm:text-sm font-sans whitespace-nowrap">MARSWAY</span>
            <span className="hidden md:inline-block text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-orange-950/80 text-orange-400 border border-orange-700/60 font-semibold whitespace-nowrap">
              NASA GIS
            </span>
            <span className="hidden 2xl:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-800/60 whitespace-nowrap" title="Educational decision-support prototype; not certified for operational EVA flight.">
              NOT FLIGHT-CERTIFIED
            </span>
          </div>
        </div>

        {/* Primary View Mode Switcher: 3D | 2D | Astronaut EVA */}
        <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-black/60 border border-white/10 shadow-inner shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
              viewMode === '3d'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/60'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="3D Mars Planet Globe"
          >
            <Globe className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="hidden md:inline">3D Globe</span>
            <span className="md:hidden">3D</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('2d');
              setTimeout(() => safeInvalidateSize(), 60);
            }}
            className={`px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
              viewMode === '2d'
                ? 'bg-white/15 text-white shadow border border-white/15'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Flat Mercator 2D Map"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden md:inline">Flat Map</span>
            <span className="md:hidden">2D</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('astronaut')}
            className={`px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
              viewMode === 'astronaut'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/60 border border-cyan-400/40'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="First-Person Astronaut Surface EVA View"
          >
            <Footprints className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span className="hidden md:inline">Astronaut EVA</span>
            <span className="md:hidden">EVA</span>
          </button>
        </div>

        {/* Right side actions - Guaranteed to fit and never overflow on mobile */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          {/* Universal Search Modal Button (Tablet & desktop only to keep mobile uncluttered) */}
          <button
            type="button"
            onClick={() => openPrimaryOverlay(setIsSearchModalOpen)}
            className="hidden sm:flex p-1.5 sm:px-2 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-neutral-200 hover:text-white items-center gap-1.5 transition cursor-pointer shrink-0"
            title="Search Martian features, rovers & coordinates"
            aria-label="Search"
          >
            <Search className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="hidden xl:inline font-medium whitespace-nowrap">Search</span>
          </button>

          {/* Header Route Plan Button */}
          <button
            type="button"
            onClick={() => {
              if (interactiveRoutePlotStep) {
                setInteractiveRoutePlotStep(null);
              } else if (isRouteChecked && activePlannedRoute) {
                openPrimaryOverlay(setIsRoutePlannerModalOpen);
              } else {
                handleStartMapRoutePlanning();
              }
            }}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer border shadow-md active:scale-95 shrink-0 ${
              isRoutePlannerModalOpen || activePlannedRoute || interactiveRoutePlotStep !== null
                ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white border-cyan-400 shadow-cyan-950/60 ring-2 ring-cyan-400/50'
                : 'bg-cyan-950/50 hover:bg-cyan-900/80 text-cyan-200 border-cyan-400/50 hover:text-white'
            }`}
            title="Interactive Route Planner: Click on map from where to where to evaluate hazards"
            aria-label="Route Planner"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-200 fill-cyan-300/40 shrink-0" />
            <span className="hidden md:inline font-semibold text-xs whitespace-nowrap">Route Plan</span>
          </button>

          {/* Quick Clear / Reset Route Button if route is active */}
          {(activePlannedRoute || routeStartPoint || routeEndPoint) && (
            <button
              type="button"
              onClick={handleCancelAndClearRoute}
              className="p-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/50 text-red-300 hover:text-white transition-all cursor-pointer shadow-sm shrink-0"
              title="Clear / Cancel Current Route"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Desktop-only secondary buttons */}
          <div className="hidden xl:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openPrimaryOverlay(setIsMissionExplorerOpen)}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-neutral-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
              title="Browse missions"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Missions</span>
            </button>
            <button
              type="button"
              onClick={() => openPrimaryOverlay(setIsHumanMissionModeOpen)}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-neutral-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
              title="Base Planning"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              <span>Base Plan</span>
            </button>
          </div>

          {/* Ask AI button (Medium+ desktop header only) */}
          <button
            type="button"
            onClick={() => openPrimaryOverlay(setIsAskMarsWayOpen)}
            className="hidden md:flex px-2 sm:px-2.5 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-600/50 text-xs text-purple-200 hover:text-white items-center gap-1.5 transition cursor-pointer active:scale-95 shrink-0"
            title="Ask MarsWay AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span className="font-semibold">Ask AI</span>
          </button>

          {/* Menu Button - ALWAYS PROMINENT AND VISIBLE ON ALL MOBILE & DESKTOP SCREENS */}
          <button
            id="mars-global-hamburger-button"
            type="button"
            onClick={() => setIsHamburgerOpen(!isHamburgerOpen)}
            className={`flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm active:scale-95 ${
              isHamburgerOpen
                ? 'bg-orange-600 text-white border-orange-400 shadow-orange-950/80 shadow-md ring-2 ring-orange-400/40'
                : 'bg-orange-950/60 hover:bg-orange-900/80 text-orange-200 border-orange-500/50 hover:text-white'
            }`}
            title="Open Mars Mission & Navigation Suite"
            aria-label="Menu"
          >
            <Menu className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="hidden sm:inline font-bold text-xs whitespace-nowrap">Menu</span>
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
                <div className="grid grid-cols-3 gap-1.5 bg-neutral-900/90 p-1.5 rounded-xl border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('3d');
                      setIsHamburgerOpen(false);
                    }}
                    className={`py-2 px-1.5 rounded-lg text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
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
                      setTimeout(() => safeInvalidateSize(), 60);
                      setIsHamburgerOpen(false);
                    }}
                    className={`py-2 px-1.5 rounded-lg text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      viewMode === '2d'
                        ? 'bg-neutral-800 text-white shadow border border-neutral-600'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Flat Map</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('astronaut');
                      setIsHamburgerOpen(false);
                    }}
                    className={`py-2 px-1.5 rounded-lg text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      viewMode === 'astronaut'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md border border-cyan-400/40'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Footprints className="w-4 h-4 text-cyan-300" />
                    <span>Astronaut</span>
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
                      closeAllPrimaryOverlays();
                      setActiveTab(activeTab === 'landmarks' ? null : 'landmarks');
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
                      closeAllPrimaryOverlays();
                      setActiveTab(activeTab === 'tools' ? null : 'tools');
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
                      closeAllPrimaryOverlays();
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
                      openPrimaryOverlay(setIsMissionExplorerOpen);
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
                      openPrimaryOverlay(setIsMissionLayersPanelOpen);
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
                      openPrimaryOverlay(setIsHumanMissionModeOpen);
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
                      openPrimaryOverlay(setIsTimelineOpen);
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
                      openPrimaryOverlay(setIsCompareModalOpen);
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
                      openPrimaryOverlay(setIsMeasureToolOpen);
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
                        openPrimaryOverlay(setIsElevationProfileOpen);
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
                      openPrimaryOverlay(setIsBookmarksModalOpen);
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
                      openPrimaryOverlay(setIsPresentationModeOpen);
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
                      openPrimaryOverlay(setIsDataSourcesModalOpen);
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
                      openPrimaryOverlay(setIsLiveVoiceOpen);
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
                      openPrimaryOverlay(setIsAskMarsWayOpen);
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
              extraFeatures={officialMarsFeaturesForGlobe}
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
                      safeInvalidateSize(map);
                      try {
                        map.setView([site.lat, site.lng], 6, { animate: false });
                      } catch {}
                      setTimeout(() => {
                        safeInvalidateSize(map);
                        try {
                          map.flyTo([site.lat, site.lng], 6.5, { duration: 1.0 });
                        } catch {}
                      }, 50);
                    }
                  }, 40);
                } else {
                  setTimeout(() => {
                    safeInvalidateSize();
                  }, 40);
                }
              }}
              onOpenNASACloseUp={(name) => {
                setCloseUpSearchTarget(name);
                openPrimaryOverlay(setIsCloseUpModalOpen);
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
                openPrimaryOverlay(setIsEarthComparisonOpen);
              }}
              onOpenPlaceIdentifier={(feature) => {
                setPlaceIdentifierFeature(feature);
                openPrimaryOverlay(setIsPlaceIdentifierOpen);
              }}
              onOpenElevationProfile={(feature) => {
                if (feature) {
                  const ptA = {
                    lat: Math.max(-85, feature.lat - 1.2),
                    lng: feature.lng - 2.0,
                    name: `${feature.name} West Inflow`,
                  };
                  const ptB = {
                    lat: Math.min(85, feature.lat + 1.2),
                    lng: feature.lng + 2.0,
                    name: `${feature.name} Summit Rim`,
                  };
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
                  openPrimaryOverlay(setIsElevationProfileOpen);
                } else if (elevationProfile) {
                  openPrimaryOverlay(setIsElevationProfileOpen);
                } else if (PRESET_MARS_TRANSECTS && PRESET_MARS_TRANSECTS.length > 0) {
                  handleSelectElevationPreset(PRESET_MARS_TRANSECTS[0]);
                  openPrimaryOverlay(setIsElevationProfileOpen);
                } else {
                  openPrimaryOverlay(setIsElevationProfileOpen);
                }
              }}
              telemetry={ephemeris}
              initialSelectedSite={selectedSite}
              activeLayer={activeLayer}
              onLayerChange={(layerId) => handleSelectLayer(layerId as any)}
              onFlyTo={(target) => {
                handleFlyToLocation(target.lat, target.lng, target.zoom ?? 6, target.name, target.elevationM);
              }}
              onSwitchToAstronaut={(site) => {
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
                }
                setViewMode('astronaut');
              }}
            />
          </div>
        )}

        {/* Astronaut First-Person Surface EVA View (Immersive 3D EVA with Spacesuit Visor HUD) */}
        {viewMode === 'astronaut' && (
          <div className="absolute inset-0 z-20">
            <MarsAstronautView
              initialSite={
                selectedSite
                  ? {
                      name: selectedSite.name,
                      lat: selectedSite.lat,
                      lng: selectedSite.lng,
                      elevationM: selectedSite.elevationM ?? selectedSite.elevation ?? -2000,
                      description: selectedSite.description,
                    }
                  : undefined
              }
              onExit={() => setViewMode('3d')}
              onSwitchTo2D={() => {
                setViewMode('2d');
                setTimeout(() => safeInvalidateSize(), 60);
              }}
              onSwitchTo3D={() => setViewMode('3d')}
            />
          </div>
        )}

        {/* 2D Flat Mercator Map Container (Always kept mounted so tiles load instantly) */}
        <div
          className={`w-full h-full absolute inset-0 transition-opacity duration-300 ${
            viewMode === '2d' ? 'z-10 opacity-100 pointer-events-auto' : 'z-0 opacity-0 pointer-events-none'
          }`}
        >
          {/* MOBILE-ONLY TOP STEP GUIDANCE BANNER */}
          {interactiveRoutePlotStep && (
            <div className="sm:hidden absolute top-2 left-2 right-2 z-40 pointer-events-auto bg-[#070b14]/98 backdrop-blur-md border border-cyan-400 text-white px-3 py-2 rounded-2xl shadow-2xl flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 ring-2 ring-cyan-500/40">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative flex items-center justify-center shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${interactiveRoutePlotStep === 'start' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <div className={`absolute w-5 h-5 rounded-full animate-ping ${interactiveRoutePlotStep === 'start' ? 'bg-emerald-400/40' : 'bg-red-400/40'}`} />
                </div>
                <span className="text-[11px] font-bold text-white truncate">
                  {interactiveRoutePlotStep === 'start'
                    ? '📍 Step 1/2: Tap map for Base (A)'
                    : '🎯 Step 2/2: Tap map for Destination (B)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInteractiveRoutePlotStep(null)}
                className="px-2 py-1 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white text-[10px] font-bold shrink-0 border border-white/10"
              >
                Cancel
              </button>
            </div>
          )}

          {/* UNIFIED TOP SEARCH & CATEGORY HUD (Stacked with clean gap-2.5, Zero Collision) */}
          <div className="hidden sm:flex absolute top-3 left-1/2 -translate-x-1/2 z-35 flex-col items-center gap-2.5 pointer-events-none max-w-[96vw]">
            {/* Search Input Bar */}
            <div className="flex items-center gap-2 w-[480px] md:w-[560px] max-w-[94vw] pointer-events-auto relative z-30">
              <div className="flex-1">
                <MarsTopSearchBar
                  placeholder="Search craters, volcanoes, canyons, rovers..."
                  onFlyTo={(target) => {
                    handleFlyToLocation(target.lat, target.lng, target.zoom ?? 6, target.name, target.elevationM);
                  }}
                />
              </div>
            </div>

            {/* UNIFIED TOP NOTIFICATION & ACTIVE MODE BANNER (Clean, Non-Colliding) */}
            {interactiveRoutePlotStep ? (
              <div className="pointer-events-auto relative z-35 bg-[#070b14]/98 backdrop-blur-md border border-cyan-400 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 max-w-[94vw] ring-2 ring-cyan-500/30">
                <div className="relative flex items-center justify-center shrink-0">
                  <div className={`w-3 h-3 rounded-full ${interactiveRoutePlotStep === 'start' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <div className={`absolute w-6 h-6 rounded-full animate-ping ${interactiveRoutePlotStep === 'start' ? 'bg-emerald-400/40' : 'bg-red-400/40'}`} />
                </div>
                <span className="text-xs font-bold text-white">
                  {interactiveRoutePlotStep === 'start'
                    ? '📍 Step 1 of 2: Click on Mars map to set Departure Base (Point A)'
                    : '🎯 Step 2 of 2: Click on Mars map to set Destination Target (Point B)'}
                </span>
                <button
                  type="button"
                  onClick={() => setInteractiveRoutePlotStep(null)}
                  className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-bold transition-colors cursor-pointer shrink-0 border border-neutral-700"
                >
                  Cancel
                </button>
              </div>
            ) : isMapPickDestinationMode ? (
              <div className="pointer-events-auto relative z-20 bg-[#070b14]/95 backdrop-blur-md border border-cyan-400 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 max-w-[92vw]">
                <div className="relative flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <div className="absolute w-6 h-6 rounded-full bg-cyan-400/40 animate-ping"></div>
                </div>
                <span className="text-xs font-bold text-cyan-200">
                  🎯 Click anywhere on Mars map to set Destination
                </span>
                <button
                  type="button"
                  onClick={() => setIsMapPickDestinationMode(false)}
                  className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-bold transition-colors cursor-pointer shrink-0 border border-neutral-700"
                >
                  Cancel
                </button>
              </div>
            ) : isRoutePlanningActive ? (
              <div className="pointer-events-auto relative z-20 bg-[#0a1120]/95 backdrop-blur-md border border-cyan-400 text-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-2xl flex items-center gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-top-2 max-w-[92vw]">
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
            ) : arrivedSurfaceBanner ? (
              <div className="pointer-events-auto relative z-20 animate-in fade-in slide-in-from-top-3 duration-300 max-w-sm sm:max-w-md w-full px-3">
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
                      onClick={() => setViewMode('astronaut')}
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 hover:text-white text-[10.5px] font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-md"
                      title="Explore in First-Person 3D Surface View"
                    >
                      <Footprints className="w-3.5 h-3.5 text-cyan-400" />
                      <span>EVA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setArrivedSurfaceBanner(null)}
                      className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : isDrawingElevationLine ? (
              <div className="pointer-events-auto relative z-20 animate-in fade-in slide-in-from-top-3 duration-300 max-w-sm sm:max-w-md w-full px-3">
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
            ) : null}

            {/* NASA Tile Syncing Status Pill */}
            {isTilesLoading && (
              <div className="pointer-events-none bg-[#070b14]/90 backdrop-blur-md border border-cyan-500/30 text-cyan-300 px-3 py-1 rounded-full text-[10.5px] font-mono flex items-center gap-2 shadow-xl animate-in fade-in">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0"></span>
                <span>Syncing High-Res NASA Tiles...</span>
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
            willChange: 'transform',
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

        {/* Minimal, Ergonomic Google Maps Controls Widget */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex flex-col gap-2 pointer-events-auto">
          <div className="bg-[#070b14]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-1 flex flex-col gap-1 shadow-xl shadow-black/80">
            {/* Zoom In */}
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              disabled={currentZoom >= 20}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-neutral-200 hover:text-white hover:bg-white/10 disabled:opacity-30 rounded-xl transition-all cursor-pointer active:scale-95"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-orange-400" />
            </button>

            {/* Zoom Out */}
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              disabled={currentZoom <= 2}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-neutral-200 hover:text-white hover:bg-white/10 disabled:opacity-30 rounded-xl transition-all cursor-pointer active:scale-95"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-orange-400" />
            </button>

            <div className="h-[1px] bg-white/10 my-0.5" />

            {/* Google Maps Pegman: 360° Astronaut EVA Surface View */}
            <button
              onClick={() => {
                if (!selectedSite) {
                  const center = mapInstanceRef.current?.getCenter();
                  if (center) {
                    const elev = getMolaElevation(center.lat, center.lng);
                    setSelectedSite({
                      id: `eva-surface-${Date.now()}`,
                      name: `Martian Surface (${center.lat >= 0 ? `${center.lat.toFixed(2)}°N` : `${Math.abs(center.lat).toFixed(2)}°S`}, ${center.lng >= 0 ? `${center.lng.toFixed(2)}°E` : `${Math.abs(center.lng).toFixed(2)}°W`})`,
                      lat: center.lat,
                      lng: center.lng,
                      planetocentricLng: (center.lng + 360) % 360,
                      elevation: elev,
                      elevationM: elev,
                      category: 'Human Base Candidate',
                      type: 'Human Base Candidate',
                      significance: '360° Astronaut First-Person Surface EVA View',
                      description: `First-person Martian surface view at elevation ${elev >= 0 ? `+${elev}` : elev}m.`,
                      historicalContext: '',
                      scientificValue: '',
                      originName: 'Martian Surface Coordinates',
                    });
                  }
                }
                setViewMode('astronaut');
              }}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 rounded-xl transition-all cursor-pointer active:scale-95 group"
              title="Street View Pegman: 360° First-Person Martian Surface View (Astronaut EVA)"
              aria-label="Street View 360"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-amber-400 group-hover:scale-110 transition-transform">
                <circle cx="12" cy="4" r="2.5" />
                <path d="M15 8H9c-1.1 0-2 .9-2 2v6h2v6h6v-6h2v-6c0-1.1-.9-2-2-2z" />
              </svg>
            </button>

            {/* Google Maps Directions & Route Navigation */}
            {/* Directions & Route Navigation */}
            <button
              onClick={() => {
                if (interactiveRoutePlotStep) {
                  setInteractiveRoutePlotStep(null);
                } else if (activePlannedRoute) {
                  openPrimaryOverlay(setIsRoutePlannerModalOpen);
                } else {
                  handleStartMapRoutePlanning();
                }
              }}
              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isRoutePlannerModalOpen || activePlannedRoute || interactiveRoutePlotStep !== null
                  ? 'bg-cyan-500 text-neutral-950 font-bold shadow-md shadow-cyan-950/60 ring-2 ring-cyan-400'
                  : 'text-cyan-400 hover:text-white hover:bg-cyan-500/20'
              }`}
              title="Directions & Route Planner: Click two points on Mars to plan route"
              aria-label="Directions"
            >
              <Navigation className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            </button>

            {/* Marswalk EVA Route Planner & Safety Hub */}
            <button
              onClick={() => {
                openPrimaryOverlay(setIsRoutePlannerModalOpen);
              }}
              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all cursor-pointer active:scale-95 relative ${
                isRoutePlannerModalOpen
                  ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-950/60 ring-1 ring-orange-400'
                  : 'text-orange-400 hover:text-white hover:bg-orange-500/20'
              }`}
              title="Marswalk EVA Route Planner & Real-Time Safety Hub"
              aria-label="Marswalk Route Planner & Safety Hub"
            >
              <Footprints className="w-4 h-4 text-white" />
              {routeSafetyAssessment && (
                <span
                  className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black ${
                    routeSafetyAssessment.isSafe ? 'bg-emerald-400' : 'bg-red-500 animate-ping'
                  }`}
                  title={routeSafetyAssessment.isSafe ? 'Safe Corridor' : 'Hazard Detected'}
                />
              )}
            </button>

            {/* NASA Historic Missions Overlay Panel Trigger */}
            <button
              onClick={() => openPrimaryOverlay(setIsNasaMissionsPanelOpen)}
              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all cursor-pointer active:scale-95 relative ${
                showNasaMissionsOverlay
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                  : 'text-emerald-400 hover:text-white hover:bg-emerald-500/20'
              }`}
              title="NASA Historic Mars Missions Overlay (Perseverance, Curiosity, EDL Ellipses)"
              aria-label="NASA Missions Overlay"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              {showNasaMissionsOverlay && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* Google Maps My Location / Base Camp (Jezero Crater) */}
            <button
              onClick={() => {
                handleFlyToLocation(18.4447, 77.4509, 8, 'Perseverance Base Camp (Jezero Crater)', -2560);
              }}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-blue-400 hover:text-white hover:bg-blue-500/20 rounded-xl transition-all cursor-pointer active:scale-95"
              title="My Location / Primary Base Camp (Jezero Crater)"
              aria-label="My Location"
            >
              <Target className="w-4 h-4 text-blue-400" />
            </button>

            {/* Google Maps Distance Measurement Tool */}
            <button
              onClick={() => {
                const nextVal = !isMeasureToolOpen;
                setIsMeasureToolOpen(nextVal);
                if (nextVal) {
                  setMeasurePoints([]);
                }
              }}
              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isMeasureToolOpen
                  ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                  : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
              title="Measure Distance between points (Google Maps Measure)"
              aria-label="Measure Distance"
            >
              <Ruler className="w-4 h-4 text-amber-400" />
            </button>

            {/* Fullscreen Toggle - Desktop/Tablet */}
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                  setIsFullscreen(true);
                } else {
                  document.exitFullscreen().catch(() => {});
                  setIsFullscreen(false);
                }
              }}
              className="hidden sm:flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-neutral-300 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer active:scale-95"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              aria-label="Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-neutral-300" />
              ) : (
                <Maximize2 className="w-4 h-4 text-neutral-300" />
              )}
            </button>

            <div className="hidden sm:block h-[1px] bg-white/10 my-0.5" />

            {/* Reset View - Desktop/Tablet */}
            <button
              onClick={handleResetView}
              className="hidden sm:flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-neutral-300 hover:text-orange-400 hover:bg-white/10 rounded-xl transition-all cursor-pointer active:scale-95"
              title="Reset View to True North"
              aria-label="Reset View"
            >
              <RotateCcw className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Layers Drawer Trigger - Desktop/Tablet (Accessible in mobile bottom dock) */}
            <button
              onClick={() => {
                closeAllPrimaryOverlays();
                if (activeTab !== 'layers') setActiveTab('layers');
              }}
              className={`hidden sm:flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all cursor-pointer active:scale-95 ${
                activeTab === 'layers'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
              title="Map Layers & Basemap Options"
              aria-label="Layers"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Live Voice Navigation (Web Speech API) - Desktop/Tablet (Accessible in mobile bottom dock) */}
            <button
              onClick={() => openPrimaryOverlay(setIsLiveVoiceOpen)}
              className={`hidden sm:flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all cursor-pointer active:scale-95 relative ${
                isLiveVoiceOpen
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/50'
                  : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
              title="Voice Control Navigation & Mission Queries (Web Speech API)"
              aria-label="Voice Navigation"
            >
              <Mic className="w-4 h-4 text-cyan-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </button>

            {/* If Rotated, Show Quick Align True North (0°) Button */}
            {bearing !== 0 && (
              <button
                onClick={handleResetOrientation}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-amber-300 hover:text-white bg-amber-950/80 border border-amber-500/60 rounded-xl transition-all cursor-pointer animate-pulse"
                title="Align North (0°)"
                aria-label="Align North"
              >
                <Compass className="w-4 h-4 text-amber-400" />
              </button>
            )}
          </div>
        </div>

        {/* TOP-RIGHT CORNER: CRISP COMPASS & DESKTOP VERTICAL DOCK */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-30 pointer-events-auto flex flex-col items-end gap-2.5">
          {/* Mars Compass Widget */}
          <MarsCompassWidget
            bearing={bearing}
            onRotate={handleSetBearing}
            onResetOrientation={handleResetOrientation}
            subSolarLat={ephemeris.subSolarLatitude}
            solarLongitudeLs={ephemeris.solarLongitudeLs}
          />
          {bearing !== 0 && (
            <button
              onClick={handleResetOrientation}
              className="hidden sm:flex bg-[#090d16]/95 backdrop-blur-xl border border-amber-500/80 hover:border-amber-400 text-amber-300 hover:text-white px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold items-center gap-1.5 shadow-2xl transition cursor-pointer active:scale-95 animate-in fade-in"
              title="Click to reset map to True North (0°)"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>Align North (0°)</span>
            </button>
          )}

          {/* RIGHT-SIDE VERTICAL CATEGORY & GIS TOOLS DOCK (Desktop/Tablet only; hidden on mobile) */}
          <div className="hidden md:flex items-start gap-2 animate-in fade-in slide-in-from-right-3 duration-200">
          {/* GIS Planetary Tools Popover Card - Expands cleanly to the LEFT towards map center */}
          {isQuickToolsMenuOpen && (
            <>
              {/* Backdrop to close GIS tools when clicking outside on the map */}
              <div
                className="fixed inset-0 z-40 bg-black/10"
                onClick={() => setIsQuickToolsMenuOpen(false)}
              />

              <div className="relative z-50 w-72 max-w-[calc(100vw-160px)] bg-[#070b14]/98 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl p-2.5 shadow-2xl shadow-black/95 text-xs flex flex-col gap-2 animate-in fade-in slide-in-from-right-2 duration-150 max-h-[calc(100vh-140px)] overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 shrink-0">
                  <span className="font-bold text-cyan-300 text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Planetary GIS Tools</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsQuickToolsMenuOpen(false)}
                    className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Section 1: Analysis Tools */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-mono text-neutral-400 px-2 pt-0.5">
                    Terrain & Mission Analysis
                  </div>

                  {/* Destination Tool */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDestinationToolOpen(true);
                      setIsQuickToolsMenuOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                      activeDestination
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                        : 'hover:bg-white/5 text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-xs">Destination & Waypoint</div>
                        <div className="text-[10px] text-neutral-400">Range & route planning</div>
                      </div>
                    </div>
                    {activeDestination && (
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-cyan-500 text-neutral-950 font-bold">Active</span>
                    )}
                  </button>

                  {/* Elevation Transect Profile */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isElevationProfileOpen) {
                        setIsElevationProfileOpen(false);
                      } else if (elevationProfile) {
                        openElevationProfile();
                      } else {
                        setIsDrawingElevationLine(true);
                      }
                      setIsQuickToolsMenuOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                      isElevationProfileOpen || isDrawingElevationLine
                        ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40'
                        : 'hover:bg-white/5 text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-xs">Elevation Transect</div>
                        <div className="text-[10px] text-neutral-400">MOLA gradient cross-section</div>
                      </div>
                    </div>
                    {(isElevationProfileOpen || isDrawingElevationLine) && (
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-orange-500 text-white font-bold">Active</span>
                    )}
                  </button>

                  {/* Earth Scale Compare */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsEarthComparisonOpen(true);
                      setIsQuickToolsMenuOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                      activeEarthComparison
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                        : 'hover:bg-white/5 text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-xs">Earth Scale Compare</div>
                        <div className="text-[10px] text-neutral-400">Landmark size comparisons</div>
                      </div>
                    </div>
                    {activeEarthComparison && (
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-cyan-500 text-neutral-950 font-bold">Active</span>
                    )}
                  </button>

                  {/* Timeline Slider */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isTimelineSliderOpen;
                      setIsTimelineSliderOpen(next);
                      if (next && timelineFilterMode === 'all') {
                        setTimelineFilterMode('cumulative');
                      }
                      setIsQuickToolsMenuOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                      isTimelineSliderOpen
                        ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40'
                        : 'hover:bg-white/5 text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-xs">Mission Era Timeline</div>
                        <div className="text-[10px] text-neutral-400">Filter missions 1971–2026</div>
                      </div>
                    </div>
                    {isTimelineSliderOpen && (
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-orange-500 text-white font-bold">Active</span>
                    )}
                  </button>

                  {/* Marswalk EVA Route Planner (A* Multimodal Engine) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRoutePlannerModalOpen(true);
                      setIsQuickToolsMenuOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                      isRoutePlannerModalOpen || activePlannedRoute
                        ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40'
                        : 'hover:bg-white/5 text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Footprints className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-xs">Marswalk Route Planner</div>
                        <div className="text-[10px] text-neutral-400">Foot, LTV & Boxwork 2025</div>
                      </div>
                    </div>
                    {activePlannedRoute && (
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-orange-500 text-white font-bold">Active</span>
                    )}
                  </button>
                </div>

                <div className="h-[1px] bg-white/10 my-0.5" />

                {/* Section 2: Overlays */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-mono text-neutral-400 px-2 pt-0.5">
                    NASA Science & Planetary Overlays
                  </div>

                  {/* NASA Historic Missions Overlay */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !showNasaMissionsOverlay;
                      setShowNasaMissionsOverlay(nextVal);
                      if (nextVal) setIsNasaMissionsPanelOpen(true);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                      showNasaMissionsOverlay
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                        : 'hover:bg-white/5 text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-xs">NASA Missions Overlay</div>
                        <div className="text-[10px] text-neutral-400">EDL ellipses & landing sites</div>
                      </div>
                    </div>
                    <div className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${showNasaMissionsOverlay ? 'bg-emerald-500' : 'bg-neutral-700'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${showNasaMissionsOverlay ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  </button>

                  {/* MOLA Availability Overlay */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !showMolaAvailabilityOverlay;
                      setShowMolaAvailabilityOverlay(nextVal);
                      if (nextVal) setIsMolaAvailabilityPanelOpen(true);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                      showMolaAvailabilityOverlay
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                        : 'hover:bg-white/5 text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Mountain className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-xs">MOLA Availability</div>
                        <div className="text-[10px] text-neutral-400">High-Res DTM Heatmap</div>
                      </div>
                    </div>
                    <div className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${showMolaAvailabilityOverlay ? 'bg-cyan-500' : 'bg-neutral-700'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${showMolaAvailabilityOverlay ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  </button>

                  {/* Dust Storm Simulation */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !showDustStormOverlay;
                      setShowDustStormOverlay(nextVal);
                      setIsDustStormPanelOpen(true);
                      setMissionLayerOptions((prev) => ({ ...prev, showDustStormOverlay: nextVal }));
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                      showDustStormOverlay
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                        : 'hover:bg-white/5 text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Wind className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-xs">Dust Storm Simulation</div>
                        <div className="text-[10px] text-neutral-400">Atmospheric opacity</div>
                      </div>
                    </div>
                    <div className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${showDustStormOverlay ? 'bg-amber-500' : 'bg-neutral-700'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${showDustStormOverlay ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  </button>

                  {/* Atmospheric Pressure & Surface Temperature */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !showAtmosphereOverlay;
                      setShowAtmosphereOverlay(nextVal);
                      setIsAtmospherePanelOpen(true);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                      showAtmosphereOverlay
                        ? 'bg-blue-500/20 text-blue-200 border border-blue-500/40'
                        : 'hover:bg-white/5 text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Gauge className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-xs">Atmospheric Pressure</div>
                        <div className="text-[10px] text-neutral-400">Isobars & isotherms</div>
                      </div>
                    </div>
                    <div className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${showAtmosphereOverlay ? 'bg-blue-500' : 'bg-neutral-700'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${showAtmosphereOverlay ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Right-Side Vertical Category Dock */}
          {isPlacesDockOpen ? (
          <div className="relative z-40 flex flex-col gap-1 p-1 rounded-2xl bg-[#070b14]/94 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/85 min-w-[124px]">
            <div className="flex items-center justify-between px-2 py-1 border-b border-white/10">
              <span className="text-[10px] uppercase tracking-wide text-neutral-500 font-mono">Places</span>
              <button
                type="button"
                onClick={() => setIsPlacesDockOpen(false)}
                className="p-1 rounded-md text-neutral-500 hover:text-white hover:bg-white/10"
                aria-label="Hide places dock"
                title="Hide places dock"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            {[
              { id: 'all', label: 'All Places', icon: '📍' },
              { id: 'mons', label: 'Volcanoes', icon: '🌋' },
              { id: 'crater', label: 'Craters', icon: '☄️' },
              { id: 'chasma', label: 'Canyons', icon: '🏜️' },
              { id: 'planitia', label: 'Plains', icon: '🪐' },
              { id: 'mission', label: 'Missions', icon: '🚀' },
            ].map((chip) => {
              const isActive = placeCategoryFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setPlaceCategoryFilter(chip.id as any)}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer text-left whitespace-nowrap active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-md shadow-orange-950/60 ring-1 ring-orange-400'
                      : 'text-neutral-300 hover:text-white hover:bg-white/10'
                  }`}
                  title={`Filter by ${chip.label}`}
                >
                  <span className="text-sm leading-none shrink-0">{chip.icon}</span>
                  <span className="text-[11.5px] font-medium">{chip.label}</span>
                </button>
              );
            })}

            <div className="h-[1px] bg-white/10 my-0.5 mx-1" />

            {/* GIS Planetary Tools Popover Trigger */}
            <button
              type="button"
              onClick={() => setIsQuickToolsMenuOpen(!isQuickToolsMenuOpen)}
              className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
                isQuickToolsMenuOpen || (activeDestination || isTimelineSliderOpen || activeEarthComparison || isElevationProfileOpen || isDrawingElevationLine || showMolaAvailabilityOverlay || showDustStormOverlay || showAtmosphereOverlay)
                  ? 'bg-cyan-950/90 text-cyan-200 border border-cyan-500/60 ring-1 ring-cyan-500/40 font-bold'
                  : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
              title="Planetary Analysis Tools & Environmental Overlays"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[11.5px] font-medium">GIS Tools</span>
              </div>
              <div className="flex items-center gap-1">
                {(activeDestination || isTimelineSliderOpen || activeEarthComparison || isElevationProfileOpen || isDrawingElevationLine || showMolaAvailabilityOverlay || showDustStormOverlay || showAtmosphereOverlay) && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
                <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${isQuickToolsMenuOpen ? 'rotate-90' : '-rotate-90'}`} />
              </div>
            </button>
          </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsPlacesDockOpen(true)}
              className="relative z-40 px-3 py-2 rounded-xl bg-[#070b14]/94 backdrop-blur-2xl border border-white/10 text-neutral-200 text-[11px] font-semibold shadow-2xl hover:bg-neutral-800"
              aria-label="Show places dock"
            >
              <MapPin className="inline-block w-3.5 h-3.5 mr-1.5 text-orange-400" />
              Places
            </button>
          )}
        </div>
      </div>

        {/* GOOGLE MAPS STYLE LAYERS QUICK SWITCHER (Bottom Left) */}
        <div
          className={`absolute z-20 pointer-events-auto transition-all duration-300 ${
            selectedSite || inspectedPoint || selectedRegion
              ? 'hidden sm:flex sm:bottom-16 sm:left-[430px]'
              : 'bottom-22 left-2 sm:bottom-16 sm:left-4'
          }`}
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsGoogleLayersOpen(!isGoogleLayersOpen)}
              className="group relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-white/20 hover:border-orange-400 shadow-2xl transition-all cursor-pointer active:scale-95 bg-neutral-900"
              title="Google Maps Layers Switcher: Basemaps & Overlays"
            >
              {/* Thumbnail of active basemap */}
              <div
                className={`absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110 ${
                  activeLayer === 'mola'
                    ? 'bg-gradient-to-br from-blue-700 via-emerald-600 to-amber-500'
                    : activeLayer === 'themis'
                    ? 'bg-gradient-to-br from-neutral-800 via-neutral-500 to-neutral-200'
                    : 'bg-gradient-to-br from-amber-700 via-orange-800 to-amber-950'
                }`}
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
              <div className="absolute bottom-0 inset-x-0 py-0.5 bg-black/80 backdrop-blur-sm text-[9px] sm:text-[10px] font-bold text-center text-white leading-none">
                Layers
              </div>
            </button>

            {/* Google Maps Layers Popover Panel */}
            {isGoogleLayersOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#070b14]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-3 shadow-2xl shadow-black/90 animate-in fade-in slide-in-from-bottom-2 duration-150 text-xs flex flex-col gap-2.5 z-30">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <Layers className="w-3.5 h-3.5 text-orange-400" />
                    <span>Map Type & Overlays</span>
                  </div>
                  <button
                    onClick={() => setIsGoogleLayersOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Map Type Choices */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                    Map Type
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => {
                        handleSelectLayer('viking');
                        setIsGoogleLayersOpen(false);
                      }}
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        activeLayer === 'viking'
                          ? 'bg-orange-500/20 border-orange-500 text-white font-bold'
                          : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="w-full h-8 rounded-lg bg-gradient-to-br from-amber-700 to-orange-900 border border-white/10" />
                      <span className="text-[10px]">Satellite</span>
                    </button>

                    <button
                      onClick={() => {
                        handleSelectLayer('mola');
                        setIsGoogleLayersOpen(false);
                      }}
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        activeLayer === 'mola'
                          ? 'bg-orange-500/20 border-orange-500 text-white font-bold'
                          : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="w-full h-8 rounded-lg bg-gradient-to-br from-blue-700 via-emerald-600 to-amber-500 border border-white/10" />
                      <span className="text-[10px]">Terrain</span>
                    </button>

                    <button
                      onClick={() => {
                        handleSelectLayer('themis');
                        setIsGoogleLayersOpen(false);
                      }}
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        activeLayer === 'themis'
                          ? 'bg-orange-500/20 border-orange-500 text-white font-bold'
                          : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="w-full h-8 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-400 border border-white/10" />
                      <span className="text-[10px]">Thermal</span>
                    </button>
                  </div>
                </div>

                {/* Map Details / Overlays */}
                <div className="pt-1.5 border-t border-white/10 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Map Details
                  </span>

                  <label className="flex items-center justify-between text-[11px] text-neutral-200 hover:text-white cursor-pointer select-none">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-red-400" />
                      <span>Landmarks & Craters</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showSites}
                      onChange={(e) => setShowSites(e.target.checked)}
                      className="accent-orange-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between text-[11px] text-neutral-200 hover:text-white cursor-pointer select-none">
                    <span className="flex items-center gap-1.5">
                      <Footprints className="w-3 h-3 text-cyan-400" />
                      <span>Rover Traverses</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showRoverTrack}
                      onChange={(e) => setShowRoverTrack(e.target.checked)}
                      className="accent-orange-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between text-[11px] text-neutral-200 hover:text-white cursor-pointer select-none">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-emerald-400" />
                      <span>Coordinate Grid</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showGraticule}
                      onChange={(e) => setShowGraticule(e.target.checked)}
                      className="accent-orange-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between text-[11px] text-neutral-200 hover:text-white cursor-pointer select-none">
                    <span className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-blue-400" />
                      <span>Pressure & Temp Overlay</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showAtmosphereOverlay}
                      onChange={(e) => {
                        const next = e.target.checked;
                        setShowAtmosphereOverlay(next);
                        if (next) setIsAtmospherePanelOpen(true);
                      }}
                      className="accent-blue-500 rounded"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CRISP DARK-THEMED MARS SCALE BAR (Bottom Left - shifts gracefully when a card is open) */}
        <div
          className={`absolute z-20 pointer-events-auto transition-all duration-300 ${
            selectedSite || inspectedPoint || selectedRegion
              ? 'hidden sm:block sm:bottom-4 sm:left-[430px]'
              : 'bottom-18 left-2 sm:bottom-4 sm:left-4'
          }`}
        >
          <MarsScaleBar map={mapInstance} />
        </div>

        {/* Center Target Reticle for Mobile Precise Waypoint Placement */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 md:hidden opacity-35">
          <div className="w-6 h-6 border border-cyan-400 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
          </div>
        </div>

        {/* FLOATING SELECTED SITE CARD (Mobile & Desktop Place Card) */}
        {selectedSite && !inspectedPoint && !isRoutePlanningActive && !activeTab && (
          <div className="fixed top-14 sm:top-18 left-2 right-2 sm:left-4 sm:right-auto sm:w-[410px] max-w-[calc(100vw-16px)] z-50 pointer-events-auto bg-[#070b14]/98 backdrop-blur-2xl border border-cyan-500/50 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/95 text-xs flex flex-col gap-2.5 animate-in slide-in-from-top-3 duration-200 max-h-[calc(100vh-140px)] overflow-y-auto transition-all ring-1 ring-cyan-500/30">
            <div className="flex items-start justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    {selectedSite.category || selectedSite.type}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {selectedSite.elevation > 0 ? `+${selectedSite.elevation}` : selectedSite.elevation}m elev
                  </span>
                </div>
                <h3 className="text-white font-bold text-base tracking-tight truncate mt-1">
                  {selectedSite.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSite(null)}
                className="text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct 1-Click Route Plan Button (Immediately Visible!) */}
            <button
              onClick={() => {
                const endPt = {
                  lat: selectedSite.lat,
                  lng: selectedSite.lng,
                  name: selectedSite.name,
                  elevation: selectedSite.elevation,
                };
                const startPt = routeStartPoint || {
                  lat: 18.38,
                  lng: 77.58,
                  name: 'Perseverance Base (Jezero)',
                };
                setRouteStartPoint(startPt);
                setRouteEndPoint(endPt);
                setIsRouteSafetyHUDOpen(true);
                setShowRouteComparisonOnMap(true);
                openPrimaryOverlay(setIsRoutePlannerModalOpen);
                setSelectedSite(null);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-center text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-400/50 active:scale-95 shrink-0"
              title="Plan Route to this site & evaluate Martian hazards"
            >
              <Navigation className="w-4 h-4 fill-white/20 text-white" />
              <span>🧭 Plan Route to This Site</span>
            </button>

            {/* Quick Action Tools Bar */}
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap shrink-0">
              <button
                onClick={() => {
                  setViewMode('astronaut');
                }}
                className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-200 font-semibold text-center text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                title="Step onto Martian surface in First-Person Astronaut EVA View"
              >
                <Footprints className="w-3.5 h-3.5 text-cyan-300" />
                <span>360° EVA</span>
              </button>

              <button
                onClick={() => {
                  const ptA = {
                    lat: selectedSite.lat,
                    lng: selectedSite.lng,
                    name: `Point A (${selectedSite.name})`,
                  };
                  setElevationPoints([ptA]);
                  setElevationProfile(null);
                  setIsDrawingElevationLine(true);
                  setSelectedSite(null);
                }}
                className="py-1.5 px-2.5 rounded-xl bg-orange-950/60 hover:bg-orange-900/70 border border-orange-600/40 text-orange-200 hover:text-white font-semibold text-center text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="Start MGS MOLA elevation transect starting from this site"
              >
                <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => {
                  setCloseUpSearchTarget(selectedSite.name);
                  setIsCloseUpModalOpen(true);
                }}
                className="py-1.5 px-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-bold text-center text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer border border-neutral-700"
              >
                <Camera className="w-3.5 h-3.5 text-orange-400" />
                <span>Photos</span>
              </button>

              <button
                onClick={() => {
                  setPlaceIdentifierFeature(selectedSite);
                  setIsPlaceIdentifierOpen(true);
                }}
                className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 hover:text-white font-semibold text-center text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="Geological and IAU Nomenclature Place Dossier"
              >
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                <span>Info</span>
              </button>
            </div>

            <p className="text-neutral-300 text-[11.5px] leading-relaxed line-clamp-2 shrink-0">
              {selectedSite.significance || selectedSite.description}
            </p>

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
              className="w-full py-2 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-200 font-semibold text-center text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-950/30 shrink-0 mb-1"
            >
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full Water, Gas & Planetary Dossier</span>
            </button>
          </div>
        )}

        {/* INSPECTED POINT CARD (Top-anchored so bottom bar NEVER overlaps it!) */}
        {inspectedPoint && !isRoutePlanningActive && !activeTab && (
          <div className="fixed top-14 sm:top-18 left-2 right-2 sm:left-4 sm:right-auto sm:w-[410px] max-w-[calc(100vw-16px)] z-50 pointer-events-auto bg-[#070b14]/98 backdrop-blur-2xl border border-cyan-500/50 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/95 text-xs flex flex-col gap-2.5 animate-in slide-in-from-top-3 duration-200 max-h-[calc(100vh-140px)] overflow-y-auto transition-all ring-1 ring-cyan-500/30">
            {/* Header */}
            <div className="flex items-start justify-between shrink-0">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <span className="text-white tracking-tight font-bold text-sm">Inspected Coordinates</span>
              </div>
              <button
                onClick={() => setInspectedPoint(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Coordinates Box */}
            <div className="grid grid-cols-2 gap-2 bg-black/50 p-2.5 rounded-2xl border border-white/5 font-mono text-[11px] shrink-0">
              <div>
                <span className="text-neutral-500 text-[9px] block">COORDINATES</span>
                <span className="text-white font-semibold">{inspectedPoint.lat}°, {inspectedPoint.lng}°</span>
              </div>
              <div>
                <span className="text-neutral-500 text-[9px] block">EAST PLANETOCENTRIC</span>
                <span className="text-amber-300 font-semibold">{inspectedPoint.eastLng}°E</span>
              </div>
            </div>

            {/* Nearest Named Site */}
            {inspectedPoint.nearestFeature && (
              <div className="text-[11px] bg-neutral-950/70 p-2 rounded-xl border border-neutral-800 flex items-center justify-between shrink-0">
                <div className="min-w-0 pr-2">
                  <span className="text-neutral-400 block text-[9px]">NEAREST NAMED SITE</span>
                  <span className="text-white font-semibold truncate block">{inspectedPoint.nearestFeature.name}</span>
                  <span className="text-[10px] text-orange-400/90 block">({inspectedPoint.nearestFeature.type})</span>
                </div>
                <span className="text-cyan-300 font-mono text-[10px] font-bold shrink-0">
                  ~{inspectedPoint.distToNearestKm} km away
                </span>
              </div>
            )}

            {/* PRIMARY ACTION 1: 1-Click Route Plan Button (Immediately Visible!) */}
            <button
              onClick={() => {
                const endPt = {
                  lat: inspectedPoint.lat,
                  lng: inspectedPoint.lng,
                  name: inspectedPoint.nearestFeature ? inspectedPoint.nearestFeature.name : `Martian Sector (${inspectedPoint.lat}°, ${inspectedPoint.lng}°)`,
                };
                const startPt = routeStartPoint || {
                  lat: 18.38,
                  lng: 77.58,
                  name: 'Perseverance Base (Jezero)',
                };
                setRouteStartPoint(startPt);
                setRouteEndPoint(endPt);
                setIsRouteSafetyHUDOpen(true);
                setShowRouteComparisonOnMap(true);
                openPrimaryOverlay(setIsRoutePlannerModalOpen);
                setInspectedPoint(null);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-center text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-400/50 active:scale-95 shrink-0"
            >
              <Navigation className="w-4 h-4 fill-white/20 text-white" />
              <span>🧭 Plan Route to These Coordinates</span>
            </button>

            {/* Quick Action Tools Bar (Immediately Visible!) */}
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => {
                  const ptA = {
                    lat: inspectedPoint.lat,
                    lng: inspectedPoint.lng,
                    name: inspectedPoint.nearestFeature ? `Point A (${inspectedPoint.nearestFeature.name})` : `Point A (${inspectedPoint.lat}°, ${inspectedPoint.lng}°)`,
                  };
                  setElevationPoints([ptA]);
                  setElevationProfile(null);
                  setIsDrawingElevationLine(true);
                  setInspectedPoint(null);
                }}
                className="flex-1 py-1.5 px-2 rounded-xl bg-orange-950/60 hover:bg-orange-900/70 border border-orange-600/40 text-orange-200 hover:text-white font-semibold cursor-pointer transition-all text-[11px] flex items-center justify-center gap-1 shadow-sm"
                title="Start MGS MOLA elevation transect from this location"
              >
                <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => {
                  setCloseUpSearchTarget(inspectedPoint.nearestFeature?.name || `${inspectedPoint.lat}°, ${inspectedPoint.lng}°`);
                  setIsCloseUpModalOpen(true);
                }}
                className="flex-1 py-1.5 px-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold cursor-pointer transition-all text-[11px] flex items-center justify-center gap-1 shadow-md shadow-orange-950/50"
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
                className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-center cursor-pointer transition-all text-[11px] shadow-md shadow-cyan-950/50"
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
                  className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-200 border border-white/10 font-semibold cursor-pointer transition-all text-[11px]"
                >
                  Feature
                </button>
              )}
            </div>

            {/* Containing Area Boundary */}
            {inspectedPoint.containingRegion && (
              <div
                className="text-[11px] p-2.5 rounded-xl border flex items-center justify-between gap-2 shrink-0"
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
              const elevM = getMolaElevation(inspectedPoint.lat, inspectedPoint.lng);
              const sc = analyzeMarsLocationScience(inspectedPoint.lat, inspectedPoint.lng, elevM);
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
                      <span>
                        {sc.atmosphere.gases.slice(0, 4).map((gas, index) => (
                          <span key={gas.name}>
                            {index > 0 ? ' • ' : ''}{gas.formula} {gas.percentage}
                          </span>
                        ))}{' '}
                        ({sc.atmosphere.pressureDisplay})
                      </span>
                    </div>
                  </div>

                  {/* Human & Rover Safety */}
                  <div className="flex items-start gap-2 text-rose-200">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Human: </span>
                      <span className="text-rose-300 font-semibold">{sc.humanSafety.safetyRating}</span>
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

            {/* Environmental & Planetary Science Dossier Button */}
            <button
              onClick={() => {
                const elevM = getMolaElevation(inspectedPoint.lat, inspectedPoint.lng);
                setScienceDossierTarget({
                  lat: inspectedPoint.lat,
                  lng: inspectedPoint.lng,
                  elevationM: Math.round(elevM),
                  name: inspectedPoint.nearestFeature ? `Near ${inspectedPoint.nearestFeature.name}` : `Surface (${inspectedPoint.lat.toFixed(2)}°, ${inspectedPoint.lng.toFixed(2)}°)`,
                  type: 'Inspected Surface Point',
                });
                setIsScienceDossierOpen(true);
              }}
              className="w-full py-2 px-2.5 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-200 font-bold text-center text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shrink-0 mb-1"
            >
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>💧 Open Complete Scientific Dossier & Gas Table</span>
            </button>
          </div>
        )}

        {/* GOOGLE MAPS FLOATING PLACE / AREA DOSSIER CARD (Top-anchored so bottom bar NEVER overlaps it!) */}
        {selectedRegion && !activeTab && (
          <div className="fixed top-14 sm:top-18 left-2 right-2 sm:left-4 sm:right-auto sm:w-[410px] max-w-[calc(100vw-16px)] max-h-[calc(100vh-140px)] bg-[#0c101a]/98 backdrop-blur-2xl border border-neutral-700/90 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/95 p-3.5 z-50 flex flex-col gap-2.5 animate-in slide-in-from-top-3 duration-200 overflow-y-auto pointer-events-auto ring-1 ring-white/10 pb-4">
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

            {/* Direct 1-Click Route Plan Button */}
            <button
              onClick={() => {
                const endPt = {
                  lat: selectedRegion.center[0],
                  lng: selectedRegion.center[1],
                  name: selectedRegion.name,
                };
                const startPt = routeStartPoint || {
                  lat: 18.38,
                  lng: 77.58,
                  name: 'Perseverance Base (Jezero)',
                };
                setRouteStartPoint(startPt);
                setRouteEndPoint(endPt);
                setIsRouteSafetyHUDOpen(true);
                setShowRouteComparisonOnMap(true);
                openPrimaryOverlay(setIsRoutePlannerModalOpen);
                setSelectedRegion(null);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-center text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-400/50 active:scale-95"
              title="Plan Route to this region center & evaluate Martian hazards"
            >
              <Navigation className="w-4 h-4 fill-white/20 text-white" />
              <span>🧭 Plan Route to Region Center</span>
            </button>

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

        {/* Live Coordinate Status Bar (Bottom Center - Tablet & Desktop only to keep mobile 100% clean) */}
        {!inspectedPoint && !selectedSite && !selectedRegion && !isRoutePlanningActive && (
          <div className="hidden md:flex absolute bottom-16 left-1/2 -translate-x-1/2 z-20 bg-[#0c101a]/90 backdrop-blur-md border border-neutral-800/80 px-4 py-1.5 rounded-full text-xs text-neutral-300 shadow-xl items-center gap-4 pointer-events-auto whitespace-nowrap transition-all duration-300 opacity-100 translate-y-0">
            <div className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>
                Lat: <strong ref={coordLatDisplayRef} className="text-white font-mono">{cursorPos ? `${Math.abs(cursorPos.lat).toFixed(2)}°${cursorPos.lat >= 0 ? 'N' : 'S'}` : '18.38°N'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-neutral-800 pl-3">
              <span>
                Lng (E): <strong ref={coordLngDisplayRef} className="text-white font-mono">{cursorPos ? `${cursorPos.eastLng.toFixed(2)}°E` : '77.58°E'}</strong>
              </span>
            </div>
            {routeStats && (
              <div className="flex items-center gap-1.5 border-l border-neutral-800 pl-3">
                <span>
                  Route: <strong className="text-cyan-300 font-mono">{routeStats.distanceKm} km</strong>
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsLiveVoiceOpen(true)}
              className="flex items-center gap-1.5 border-l border-neutral-800 pl-3 text-cyan-300 hover:text-white transition-colors cursor-pointer group"
              title="Open Voice Navigation & Mission Queries (Web Speech API)"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform animate-pulse" />
              <span className="font-semibold text-[11px] tracking-wide text-cyan-300 group-hover:text-white">Voice Control</span>
            </button>
          </div>
        )}



        {/* GOOGLE MAPS STYLE RIGHT-CLICK CONTEXT MENU ("WHAT'S HERE?") */}
        {contextMenu && (
          <div
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
            className="absolute z-50 pointer-events-auto w-64 bg-[#080d1a]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl shadow-black/95 p-3 text-xs flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="flex items-start justify-between gap-1 pb-1.5 border-b border-white/10">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-white text-[12px]">
                  <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="truncate">Martian Location</span>
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                  {Math.abs(contextMenu.lat).toFixed(4)}°{contextMenu.lat >= 0 ? 'N' : 'S'},{' '}
                  {Math.abs(contextMenu.lng).toFixed(4)}°{contextMenu.lng >= 0 ? 'E' : 'W'}
                </div>
              </div>
              <button
                onClick={() => setContextMenu(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Elevation & Pressure readout */}
            <div className="flex items-center justify-between bg-white/5 rounded-xl p-2 font-mono text-[11px] text-neutral-300">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-neutral-500 block">Elevation</span>
                <span className="font-bold text-white">
                  {contextMenu.elevationM >= 0 ? `+${contextMenu.elevationM}` : contextMenu.elevationM} m
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-neutral-500 block">Pressure</span>
                <span className="font-bold text-cyan-300">{contextMenu.pressureMbar} mbar</span>
              </div>
            </div>

            {contextMenu.nearestFeature && (
              <div className="text-[10px] text-neutral-400 bg-neutral-900/60 rounded-lg px-2 py-1 flex items-center justify-between">
                <span className="truncate">{contextMenu.nearestFeature.name}</span>
                <span className="text-orange-400 shrink-0 font-mono">~{contextMenu.nearestFeature.distKm} km</span>
              </div>
            )}

            {/* Google Maps Actions */}
            <div className="flex flex-col gap-1 pt-0.5">
              <button
                onClick={() => {
                  const dest: MarsDestination = {
                    id: `dest_${Date.now()}`,
                    name: contextMenu.nearestFeature
                      ? `Near ${contextMenu.nearestFeature.name}`
                      : `Waypoint (${contextMenu.lat.toFixed(2)}°, ${contextMenu.lng.toFixed(2)}°)`,
                    category: 'Custom Map Pin',
                    lat: contextMenu.lat,
                    lng: contextMenu.lng,
                    elevationM: contextMenu.elevationM,
                    description: `Custom designated target at ${contextMenu.lat.toFixed(4)}°, ${contextMenu.lng.toFixed(4)}°.`,
                    significance: `Elevation ${contextMenu.elevationM}m, ${contextMenu.pressureMbar} mbar pressure.`,
                  };
                  setActiveDestination(dest);
                  setIsDestinationToolOpen(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-cyan-500/20 text-cyan-300 hover:text-white font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>Directions to here</span>
              </button>

              <button
                onClick={() => {
                  const targetName = contextMenu.nearestFeature
                    ? `Sector: ${contextMenu.nearestFeature.name}`
                    : `Target (${contextMenu.lat.toFixed(2)}°, ${contextMenu.lng.toFixed(2)}°)`;
                  const startPt = routeStartPoint || {
                    lat: 18.38,
                    lng: 77.58,
                    name: 'Perseverance Base (Jezero)',
                  };
                  setRouteStartPoint(startPt);
                  setRouteEndPoint({
                    lat: contextMenu.lat,
                    lng: contextMenu.lng,
                    name: targetName,
                  });
                  openPrimaryOverlay(setIsRoutePlannerModalOpen);
                  setIsRouteSafetyHUDOpen(true);
                  setShowRouteComparisonOnMap(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-emerald-500/20 text-emerald-300 hover:text-white font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>🎯 Plan Route Here & Check Safety</span>
              </button>

              <button
                onClick={() => {
                  const baseName = contextMenu.nearestFeature
                    ? `Base: ${contextMenu.nearestFeature.name}`
                    : `Base (${contextMenu.lat.toFixed(2)}°, ${contextMenu.lng.toFixed(2)}°)`;
                  setRouteStartPoint({
                    lat: contextMenu.lat,
                    lng: contextMenu.lng,
                    name: baseName,
                  });
                  setIsRouteSafetyHUDOpen(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-orange-500/20 text-orange-300 hover:text-white font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                <span>🚀 Set as Departure Base</span>
              </button>

              <button
                onClick={() => {
                  setIsMeasureToolOpen(true);
                  setMeasurePoints([{ lat: contextMenu.lat, lng: contextMenu.lng }]);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-amber-500/20 text-amber-300 hover:text-white font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Ruler className="w-3.5 h-3.5 text-amber-400" />
                <span>Measure distance from here</span>
              </button>

              <button
                onClick={() => {
                  setSelectedSite({
                    id: `eva_${Date.now()}`,
                    name: contextMenu.nearestFeature
                      ? `${contextMenu.nearestFeature.name} Sector`
                      : `Surface (${contextMenu.lat.toFixed(2)}°, ${contextMenu.lng.toFixed(2)}°)`,
                    lat: contextMenu.lat,
                    lng: contextMenu.lng,
                    planetocentricLng: (contextMenu.lng + 360) % 360,
                    elevation: contextMenu.elevationM,
                    elevationM: contextMenu.elevationM,
                    category: 'Human Base Candidate',
                    type: 'Human Base Candidate',
                    significance: '360° Astronaut EVA Surface View',
                    description: `Exploration coordinates. Elevation ${contextMenu.elevationM}m.`,
                    historicalContext: '',
                    scientificValue: '',
                    originName: 'Martian Surface Coordinates',
                  });
                  setViewMode('astronaut');
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-orange-500/20 text-orange-300 hover:text-white font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-orange-400">
                  <circle cx="12" cy="4" r="2.5" />
                  <path d="M15 8H9c-1.1 0-2 .9-2 2v6h2v6h6v-6h2v-6c0-1.1-.9-2-2-2z" />
                </svg>
                <span>360° Street / Surface View here</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${contextMenu.lat.toFixed(4)}, ${contextMenu.lng.toFixed(4)}`);
                  setContextCopied(true);
                  setTimeout(() => setContextCopied(false), 2000);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white font-medium transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Copy Coordinates</span>
                </span>
                {contextCopied && <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* COLLAPSIBLE BOTTOM SHEET & TOUCH-FRIENDLY MISSION TOOLS DOCK */}
      <MarsMissionBottomSheet
        activeTab={activeTab}
        onTabChange={(tab) => {
          closeAllPrimaryOverlays();
          if (tab) setActiveTab(tab);
        }}
        activeLayer={activeLayer}
        onSelectLayer={(l) => setActiveLayer(l)}
        surfaceFilter={surfaceFilter}
        onSelectFilter={(f) => setSurfaceFilter(f)}
        showGraticule={showGraticule}
        onToggleGraticule={(s) => setShowGraticule(s)}
        showRegions={showRegions}
        onToggleRegions={(s) => setShowRegions(s)}
        showDustStormOverlay={showDustStormOverlay}
        onToggleDustStorm={() => {
          const nextVal = !showDustStormOverlay;
          setShowDustStormOverlay(nextVal);
          setIsDustStormPanelOpen(true);
          setMissionLayerOptions((prev) => ({ ...prev, showDustStormOverlay: nextVal }));
        }}
        showMolaAvailabilityOverlay={showMolaAvailabilityOverlay}
        onToggleMolaAvailability={() => {
          const nextVal = !showMolaAvailabilityOverlay;
          setShowMolaAvailabilityOverlay(nextVal);
          if (nextVal) setIsMolaAvailabilityPanelOpen(true);
        }}
        showAtmosphereOverlay={showAtmosphereOverlay}
        onToggleAtmosphere={() => {
          const nextVal = !showAtmosphereOverlay;
          setShowAtmosphereOverlay(nextVal);
          if (nextVal) setIsAtmospherePanelOpen(true);
        }}
        placeCategoryFilter={placeCategoryFilter}
        onSelectCategoryFilter={(f) => setPlaceCategoryFilter(f)}
        onFlyToLocation={(lat, lng, zoom, name, elev) => {
          handleFlyToLocation(lat, lng, zoom || 6, name, elev);
        }}
        onFlyToSite={(site) => {
          setSelectedSite(site);
          handleFlyToLocation(site.lat, site.lng, 7, site.name);
        }}
        onSwitchToAstronaut={() => setViewMode('astronaut')}
        onOpenEarthScale={() => openPrimaryOverlay(setIsEarthComparisonOpen)}
        onOpenElevationProfile={() => {
          if (isElevationProfileOpen) {
            setIsElevationProfileOpen(false);
          } else if (elevationProfile) {
            openElevationProfile();
          } else {
            setIsDrawingElevationLine(true);
          }
        }}
        onOpenScienceDossier={() => {
          if (selectedSite) {
            setScienceDossierTarget({
              name: selectedSite.name,
              lat: selectedSite.lat,
              lng: selectedSite.lng,
              elevationM: selectedSite.elevationM || 0,
            });
            setIsScienceDossierOpen(true);
          } else {
            setScienceDossierTarget({
              name: 'Jezero Crater',
              lat: 18.38,
              lng: 77.58,
              elevationM: -2500,
            });
            setIsScienceDossierOpen(true);
          }
        }}
        onOpenHumanBasePlan={() => openPrimaryOverlay(setIsHumanMissionModeOpen)}
        onOpenMeasureTool={() => openPrimaryOverlay(setIsMeasureToolOpen)}
        onOpenNASACloseUp={(targetName) => {
          setCloseUpSearchTarget(targetName);
          setIsCloseUpModalOpen(true);
        }}
        onOpenSearch={() => openPrimaryOverlay(setIsSearchModalOpen)}
        onOpenAI={() => openPrimaryOverlay(setIsAskMarsWayOpen)}
        onOpenVoice={() => openPrimaryOverlay(setIsLiveVoiceOpen)}
        onOpenRoutePlanner={() => {
          if (activePlannedRoute || (routeStartPoint && routeEndPoint)) {
            openPrimaryOverlay(setIsRoutePlannerModalOpen);
            setIsRouteSafetyHUDOpen(true);
          } else {
            handleStartMapRoutePlanning();
          }
        }}
        isRoutePlanningActive={isRoutePlanningActive}
        onToggleRoutePlanning={() => {
          const nextVal = !isRoutePlanningActive;
          setIsRoutePlanningActive(nextVal);
          if (nextVal) {
            setActiveTab(null);
          }
        }}
        routeWaypointsCount={routeWaypoints.length}
        onClearRoute={() => setRouteWaypoints([])}
        ephemeris={ephemeris}
        currentWeather={currentWeather}
        roverPhotos={roverPhotos}
        spaceWeather={spaceWeather}
        onToggleSpaceWeather={() => {
          setSpaceWeatherScenario((current) =>
            current === 'quiet' ? 'sep_watch' : current === 'sep_watch' ? 'major_sep' : 'quiet'
          );
        }}
        onEmergencyReturn={() => {
          openPrimaryOverlay(setIsRoutePlannerModalOpen);
          handleEmergencyReturn();
        }}
      />

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
        onSwitchToAstronaut={(site) => {
          setSelectedSite({
            id: site.id,
            name: site.name,
            lat: site.lat,
            lng: site.lng,
            planetocentricLng: (site.lng + 360) % 360,
            elevation: site.elevationM,
            elevationM: site.elevationM,
            description: site.primaryAdvantage,
            category: 'Human Base Candidate',
            type: 'Human Base Candidate',
            originName: site.region,
          });
          setIsHumanMissionModeOpen(false);
          setViewMode('astronaut');
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

      {/* MISSION TIMELINE SLIDER (Filters Map Markers by Era or Year) */}
      <MissionTimelineSlider
        isOpen={isTimelineSliderOpen}
        onClose={() => setIsTimelineSliderOpen(false)}
        selectedYear={timelineSelectedYear}
        onYearChange={(year) => setTimelineSelectedYear(year)}
        selectedEraId={timelineSelectedEraId}
        onSelectEra={(eraId) => setTimelineSelectedEraId(eraId)}
        filterMode={timelineFilterMode}
        onFilterModeChange={(mode) => setTimelineFilterMode(mode)}
        visibleMissionCount={visibleMissionCount}
        totalMissionCount={allMissionSites.length}
        onFlyToMission={(lat, lng, zoom, name) => {
          handleFlyToLocation(lat, lng, zoom ?? 6, name);
        }}
      />

      {/* MARS DESTINATION SELECT TOOL */}
      <MarsDestinationTool
        isOpen={isDestinationToolOpen}
        onClose={() => setIsDestinationToolOpen(false)}
        activeDestination={activeDestination}
        onSelectDestination={(dest) => {
          setActiveDestination(dest);
          handleFlyToLocation(dest.lat, dest.lng, dest.recommendedZoom || 7, dest.name, dest.elevationM);
        }}
        onClearDestination={() => setActiveDestination(null)}
        isMapPickMode={isMapPickDestinationMode}
        onToggleMapPickMode={() => setIsMapPickDestinationMode((prev) => !prev)}
        currentOrigin={{
          lat: selectedSite?.lat ?? 18.38,
          lng: selectedSite?.lng ?? 77.58,
          name: selectedSite?.name ?? 'Perseverance Rover (Jezero)',
        }}
        onFlyToDestination={(lat, lng, zoom, name) => {
          handleFlyToLocation(lat, lng, zoom ?? 7, name);
        }}
        onPlotRouteToDestination={(dest) => {
          const startPt = {
            lat: selectedSite?.lat ?? 18.38,
            lng: selectedSite?.lng ?? 77.58,
            name: selectedSite?.name ?? 'Origin (Landing Site)',
          };
          const endPt = {
            lat: dest.lat,
            lng: dest.lng,
            name: dest.name,
          };
          setRouteStartPoint(startPt);
          setRouteEndPoint(endPt);
          setIsRouteSafetyHUDOpen(true);
          setShowRouteComparisonOnMap(true);
          handleFlyToLocation(dest.lat, dest.lng, dest.recommendedZoom || 6, dest.name, dest.elevationM);
        }}
      />

      {/* Small confirmation step keeps route analysis deliberate and easy to understand. */}
      {isRouteCheckReady && routeStartPoint && routeEndPoint && !isRoutePlannerModalOpen && (
        <div
          role="dialog"
          aria-label="Review selected route"
          className="fixed top-16 right-2 sm:right-4 z-[500] w-[min(360px,calc(100vw-16px))] rounded-2xl border border-cyan-400/60 bg-[#07101b]/98 p-3.5 text-white shadow-2xl shadow-cyan-950/50 backdrop-blur-xl animate-in slide-in-from-right-3"
        >
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-400/50 bg-cyan-500/15">
              <Navigation className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">Check this route?</div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-300">
                We’ll compare the direct path with safer options and suggest the route that balances safety and travel time.
              </p>
              <div className="mt-2 space-y-1 rounded-xl border border-white/10 bg-black/30 px-2.5 py-2 text-[10px]">
                <div className="truncate"><span className="text-emerald-300">START</span> · {routeStartPoint.name || 'Point A'}</div>
                <div className="truncate"><span className="text-cyan-300">FINAL</span> · {routeEndPoint.name || 'Point B'}</div>
              </div>
              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRouteCheckReady(false);
                    setIsRouteChecked(true);
                    setIsRouteSafetyHUDOpen(true);
                    setShowRouteComparisonOnMap(true);
                    if (routeStartPoint && routeEndPoint && mapInstanceRef.current) {
                      mapInstanceRef.current.fitBounds(
                        L.latLngBounds([
                          [routeStartPoint.lat, routeStartPoint.lng],
                          [routeEndPoint.lat, routeEndPoint.lng],
                        ]),
                        { padding: [70, 70], maxZoom: 8 }
                      );
                    }
                  }}
                  className="flex-1 rounded-xl bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 active:scale-95"
                >
                  Check route
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRouteCheckReady(false);
                    setInteractiveRoutePlotStep('start');
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-300 transition hover:bg-white/10 hover:text-white"
                >
                  Pick again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REAL-TIME ROUTE SAFETY HUD & SAFER CORRIDOR ENGINE */}
      {isRouteSafetyHUDOpen && !isRoutePlannerModalOpen && routeSafetyAssessment && (
        <MarsRouteSafetyHUD
          assessment={routeSafetyAssessment}
          activeMode={routeMode}
          onSelectMode={setRouteMode}
          transportMode={routeTransportMode}
          onChangeTransportMode={setRouteTransportMode}
          onApplySaferRoute={() => {
            setRouteMode('safest');
            setShowRouteComparisonOnMap(false);
            if (activePlannedRoute && activePlannedRoute.waypoints.length > 0 && mapInstanceRef.current) {
              const bounds = L.latLngBounds(activePlannedRoute.waypoints.map((w) => [w.lat, w.lng]));
              mapInstanceRef.current.fitBounds(bounds, { padding: [70, 70] });
            }
          }}
          onOpenFullModal={() => {
            setIsRoutePlannerModalOpen(true);
          }}
          onFlyToRoute={() => {
            if (activePlannedRoute && activePlannedRoute.waypoints.length > 0 && mapInstanceRef.current) {
              const bounds = L.latLngBounds(activePlannedRoute.waypoints.map((w) => [w.lat, w.lng]));
              mapInstanceRef.current.fitBounds(bounds, { padding: [70, 70] });
            }
          }}
          onSwapPoints={() => {
            if (routeStartPoint && routeEndPoint) {
              const temp = routeStartPoint;
              setRouteStartPoint(routeEndPoint);
              setRouteEndPoint(temp);
            }
          }}
          onPickNewDestination={() => {
            setIsMapPickDestinationMode(true);
          }}
          showComparisonOnMap={showRouteComparisonOnMap}
          onToggleShowComparison={() => setShowRouteComparisonOnMap((prev) => !prev)}
          onClose={() => setIsRouteSafetyHUDOpen(false)}
          onCancelRoute={handleCancelAndClearRoute}
        />
      )}

      {/* HISTORICAL EXPLORATION TIMELINE MODAL */}
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
        onDeletePoint={(idx) => setMeasurePoints((prev) => prev.filter((_, i) => i !== idx))}
        onUpdatePoint={(idx, newLat, newLng) => {
          setMeasurePoints((prev) =>
            prev.map((p, i) =>
              i === idx ? { lat: newLat, lng: newLng, elevationM: getMolaElevation(newLat, newLng) } : p
            )
          );
        }}
        measurementMode={measureMode}
        onChangeMode={(mode) => setMeasureMode(mode)}
        onFitBounds={() => {
          if (measurePoints.length > 0 && mapInstanceRef.current) {
            const bounds = L.latLngBounds(measurePoints.map((p) => [p.lat, p.lng]));
            mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
          }
        }}
        onLoadPreset={(presetPoints) => {
          setMeasurePoints(presetPoints);
          if (mapInstanceRef.current && presetPoints.length > 0) {
            const bounds = L.latLngBounds(presetPoints.map((p) => [p.lat, p.lng]));
            mapInstanceRef.current.fitBounds(bounds, { padding: [70, 70] });
          }
        }}
        hoveredElevationSample={hoveredElevationSample}
        onHoverElevationSample={(sample) => setHoveredElevationSample(sample)}
        onFlyToCoord={(lat, lng, name) => handleFlyToLocation(lat, lng, 6, name)}
        isWideElevationDockOpen={isWideElevationDockOpen}
        onToggleWideElevationDock={() => setIsWideElevationDockOpen(!isWideElevationDockOpen)}
        onOpenElevationProfile={(customProfile) => {
          if (customProfile) {
            setElevationProfile(customProfile);
            setElevationPoints(measurePoints.map((p, i) => ({ lat: p.lat, lng: p.lng, name: `Measure Pt ${i + 1}` })));
            openElevationProfile();
            setIsMeasureToolOpen(false);
          } else if (measurePoints.length >= 2) {
            const prof = generateMultiPointElevationTransect(measurePoints);
            if (prof) {
              setElevationProfile(prof);
              setElevationPoints(measurePoints.map((p, i) => ({ lat: p.lat, lng: p.lng, name: `Measure Pt ${i + 1}` })));
              openElevationProfile();
              setIsMeasureToolOpen(false);
            }
          }
        }}
      />

      {/* WIDE BOTTOM-DOCKED MOLA CROSS-SECTIONAL ELEVATION BAR */}
      {isMeasureToolOpen && measurePoints.length >= 2 && isWideElevationDockOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 max-w-full">
          <MarsPathElevationGraph
            profile={generateMultiPointElevationTransect(measurePoints)}
            points={measurePoints}
            hoveredSample={hoveredElevationSample}
            onHoverSample={(sample) => setHoveredElevationSample(sample)}
            onFlyToCoord={(lat, lng, name) => handleFlyToLocation(lat, lng, 6, name)}
            onOpenFullAnalysis={() => {
              const prof = generateMultiPointElevationTransect(measurePoints);
              if (prof) {
                setElevationProfile(prof);
                setElevationPoints(measurePoints.map((p, i) => ({ lat: p.lat, lng: p.lng, name: `Measure Pt ${i + 1}` })));
                openElevationProfile();
                setIsMeasureToolOpen(false);
              }
            }}
            variant="docked"
            onCloseDocked={() => setIsWideElevationDockOpen(false)}
          />
        </div>
      )}

      {/* MGS MOLA ELEVATION PROFILE & TERRAIN STEEPNESS MODAL */}
      <ElevationProfileModal
        // Never show an empty elevation modal on initial load (or after Vite
        // preserves stale component state during HMR). It is only visible
        // while actively drawing a transect or after a profile exists.
        isOpen={isElevationToolRequested && isElevationProfileOpen && (isDrawingElevationLine || elevationProfile !== null)}
        onClose={() => {
          // Fully reset the transect tool so a stale drawing/profile state
          // cannot immediately reopen the empty modal after it is closed.
          closeAllPrimaryOverlays();
          setIsElevationProfileOpen(false);
          setIsElevationToolRequested(false);
          setIsDrawingElevationLine(false);
          setElevationPoints([]);
          setElevationProfile(null);
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
          closeAllPrimaryOverlays();
          if (action === 'globe') setViewMode('3d');
          else if (action === 'missions') openPrimaryOverlay(setIsMissionExplorerOpen);
          else if (action === 'human') openPrimaryOverlay(setIsHumanMissionModeOpen);
          else if (action === 'layers') setActiveTab('layers');
          else if (action === 'ai') openPrimaryOverlay(setIsAskMarsWayOpen);
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
          openPrimaryOverlay(setIsMissionExplorerOpen);
        }}
        onOpenHumanMode={() => openPrimaryOverlay(setIsHumanMissionModeOpen)}
        onOpenCompare={(s1, s2) => {
          if (s1) setCompareSite1Id(s1);
          if (s2) setCompareSite2Id(s2);
          openPrimaryOverlay(setIsCompareModalOpen);
        }}
        onSelectLayer={(layer) => setActiveLayer(layer)}
        onOpenLiveVoice={() => openPrimaryOverlay(setIsLiveVoiceOpen)}
      />

      {/* WEB SPEECH API & VOICE COMMS */}
      <MarsLiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        currentLat={cursorPos?.lat ?? 18.38}
        currentLng={cursorPos?.lng ?? 77.58}
        currentZoom={currentZoom}
        onPanDirection={(direction: 'north' | 'south' | 'east' | 'west') => {
          const map = mapInstanceRef.current;
          if (!map) return;
          const center = map.getCenter();
          const zoom = map.getZoom();
          const step = Math.max(5, 45 / Math.pow(2, Math.max(0, zoom - 3)));
          let nextLat = center.lat;
          let nextLng = center.lng;
          if (direction === 'north') nextLat = Math.min(85, nextLat + step);
          if (direction === 'south') nextLat = Math.max(-85, nextLat - step);
          if (direction === 'east') nextLng = nextLng + step;
          if (direction === 'west') nextLng = nextLng - step;
          map.panTo([nextLat, nextLng], { animate: true, duration: 0.6 });
        }}
        onZoomAction={(action: 'in' | 'out' | 'reset') => {
          const map = mapInstanceRef.current;
          if (!map) return;
          if (action === 'in') map.zoomIn(1);
          else if (action === 'out') map.zoomOut(1);
          else if (action === 'reset') {
            setBearing(0);
            map.flyTo([18.38, 77.58], 3, { duration: 1.0 });
          }
        }}
        onRotateAction={(action: 'left' | 'right' | 'reset') => {
          if (action === 'right') handleSetBearing((bearing + 90) % 360);
          else if (action === 'left') handleSetBearing(((bearing - 90) % 360 + 360) % 360);
          else if (action === 'reset') handleResetOrientation();
        }}
        onSwitchView={(mode: '2d' | '3d' | 'astronaut') => setViewMode(mode)}
        onFlyToLocation={(lat, lng, targetZoom, name) => {
          handleFlyToLocation(lat, lng, targetZoom ?? 6, name);
        }}
        onSelectMission={(missionId) => {
          setSelectedMissionId(missionId);
          openPrimaryOverlay(setIsMissionExplorerOpen);
        }}
        onToggleLayer={(layerId) => {
          setActiveLayer(layerId as any);
        }}
        onSelectSite={(site: any) => {
          setSelectedSite(site);
          handleFlyToLocation(site.lat, site.lng, 7, site.name);
        }}
      />

      {/* HISTORICAL NASA/ESA MISSIONS & ROVER TRAVERSES LAYER CONTROL PANEL */}
      {isMissionLayersPanelOpen && (
        <div className="fixed sm:absolute top-16 sm:top-4 inset-x-2 sm:inset-x-auto sm:left-18 z-40 pointer-events-auto max-w-[96vw] sm:max-w-xs max-h-[calc(100vh-5rem)] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
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
              if (newOpts.showMolaAvailabilityOverlay !== undefined) {
                setShowMolaAvailabilityOverlay(newOpts.showMolaAvailabilityOverlay);
                if (newOpts.showMolaAvailabilityOverlay) {
                  setIsMolaAvailabilityPanelOpen(true);
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
        <div className="fixed sm:absolute top-16 sm:top-16 inset-x-2 sm:inset-x-auto sm:right-24 z-40 pointer-events-auto max-w-[96vw] sm:max-w-md max-h-[calc(100vh-120px)] animate-in fade-in zoom-in-95 duration-200">
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
        <div className="absolute top-[345px] sm:top-[360px] right-2.5 sm:right-3.5 z-20 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
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

      {/* MGS MOLA ELEVATION DATA AVAILABILITY & HIGH-RES DTM HEATMAP CONTROL PANEL */}
      {isMolaAvailabilityPanelOpen && (
        <div className="fixed sm:absolute top-16 sm:top-16 inset-x-2 sm:inset-x-auto sm:right-24 z-40 pointer-events-auto max-w-[96vw] sm:max-w-md max-h-[calc(100vh-120px)] animate-in fade-in zoom-in-95 duration-200">
          <MarsMolaAvailabilityControl
            isOpen={isMolaAvailabilityPanelOpen}
            onClose={() => setIsMolaAvailabilityPanelOpen(false)}
            isEnabled={showMolaAvailabilityOverlay}
            onToggleEnabled={(enabled) => {
              setShowMolaAvailabilityOverlay(enabled);
              setMissionLayerOptions((prev) => ({ ...prev, showMolaAvailabilityOverlay: enabled }));
            }}
            layerOpacity={molaAvailabilityOpacity}
            onChangeOpacity={setMolaAvailabilityOpacity}
            activeTierFilter={molaTierFilter}
            onChangeTierFilter={setMolaTierFilter}
            inspectedPoint={inspectedAvailabilityPoint}
            onClearInspectedPoint={() => setInspectedAvailabilityPoint(null)}
            onFlyToSite={handleFlyToHighResSite}
          />
        </div>
      )}

      {/* Floating HUD Indicator when MOLA Availability Overlay is Active but Panel is Closed */}
      {showMolaAvailabilityOverlay && !isMolaAvailabilityPanelOpen && (
        <div className="absolute top-[410px] sm:top-[425px] right-2.5 sm:right-3.5 z-20 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            type="button"
            onClick={() => setIsMolaAvailabilityPanelOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/95 border border-cyan-500/80 shadow-2xl text-white text-xs font-mono transition-all hover:scale-105 cursor-pointer backdrop-blur-md group"
            title="Open MOLA Elevation Data Availability & DTM Heatmap Controls"
          >
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
              <Mountain className="w-3.5 h-3.5 text-cyan-400 absolute" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">MOLA Heatmap Active</span>
              <span className="text-[11px] text-neutral-300 font-sans">
                {inspectedAvailabilityPoint ? `${inspectedAvailabilityPoint.tierLabel}` : 'MOLA Base (463m) vs HiRISE (0.25m)'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ATMOSPHERIC PRESSURE & TEMPERATURE OVERLAY CONTROL PANEL */}
      {isAtmospherePanelOpen && (
        <div className="fixed sm:absolute top-16 sm:top-16 inset-x-2 sm:inset-x-auto sm:right-28 z-40 pointer-events-auto max-w-[96vw] sm:max-w-md max-h-[calc(100vh-120px)] animate-in fade-in zoom-in-95 duration-200">
          <MarsAtmosphereOverlayControl
            isOpen={isAtmospherePanelOpen}
            onClose={() => setIsAtmospherePanelOpen(false)}
            isEnabled={showAtmosphereOverlay}
            onToggleEnabled={(enabled) => {
              setShowAtmosphereOverlay(enabled);
            }}
            mode={atmosphereMode}
            onChangeMode={setAtmosphereMode}
            opacity={atmosphereOpacity}
            onChangeOpacity={setAtmosphereOpacity}
            showStationBadges={showAtmosphereStationBadges}
            onToggleStationBadges={setShowAtmosphereStationBadges}
            showIsobarZones={showAtmosphereIsobarZones}
            onToggleIsobarZones={setShowAtmosphereIsobarZones}
            selectedSiteId={selectedAtmosphereSiteId}
            onSelectSite={(site) => {
              setSelectedAtmosphereSiteId(site.id);
              mapInstanceRef.current?.flyTo([site.lat, site.lng], 6, { duration: 1.2 });
              marsSonification.sonifyLocation(site.pressureMbar * 10, 2);
            }}
          />
        </div>
      )}

      {/* NASA HISTORIC MISSIONS OVERLAY CONTROL PANEL */}
      {isNasaMissionsPanelOpen && (
        <div className="fixed sm:absolute top-16 sm:top-16 inset-x-2 sm:inset-x-auto sm:right-28 z-40 pointer-events-auto max-w-[96vw] sm:max-w-md max-h-[calc(100vh-120px)] animate-in fade-in zoom-in-95 duration-200">
          <MarsNasaMissionsOverlayControl
            isOpen={isNasaMissionsPanelOpen}
            onClose={() => setIsNasaMissionsPanelOpen(false)}
            isEnabled={showNasaMissionsOverlay}
            onToggleEnabled={setShowNasaMissionsOverlay}
            showLandingEllipses={showLandingEllipses}
            onToggleLandingEllipses={setShowLandingEllipses}
            showTraverseTracks={showNasaTraverses}
            onToggleTraverseTracks={setShowNasaTraverses}
            selectedMissionId={selectedNasaMission?.id}
            onSelectMission={(mission: MarsMission) => {
              setSelectedNasaMission(mission);
              if (mission.lat !== undefined && mission.lng !== undefined) {
                mapInstanceRef.current?.flyTo([mission.lat, mission.lng], 7, { duration: 1.2 });
              }
            }}
            onFlyToMission={(lat: number, lng: number, zoom?: number, name?: string) => {
              handleFlyToLocation(lat, lng, zoom || 7, name);
            }}
            onOpenLandingSiteInfo={(mission: MarsMission) => {
              setSelectedNasaMission(mission);
              setIsNasaLandingSiteModalOpen(true);
            }}
          />
        </div>
      )}

      {/* NASA MISSION LANDING SITE SCIENTIFIC DOSSIER MODAL */}
      <NasaLandingSiteModal
        isOpen={isNasaLandingSiteModalOpen}
        onClose={() => setIsNasaLandingSiteModalOpen(false)}
        mission={activeMarsMissionForModal}
        onFlyToLocation={(lat, lng, zoom, name) => {
          handleFlyToLocation(lat, lng, zoom ?? 7, name);
        }}
        onExploreTraverse={(mission) => {
          setIsNasaLandingSiteModalOpen(false);
          if (mission.traverseTrack && mission.traverseTrack.length > 0) {
            const first = mission.traverseTrack[0];
            const last = mission.traverseTrack[mission.traverseTrack.length - 1];
            setRouteStartPoint({ lat: first.lat, lng: first.lng, name: `${mission.name} Landing` });
            setRouteEndPoint({ lat: last.lat, lng: last.lng, name: `${mission.name} Current Sol` });
            setIsRoutePlannerModalOpen(true);
          }
        }}
        onMeasureElevationProfile={(mission) => {
          setIsNasaLandingSiteModalOpen(false);
          if (mission.lat !== undefined && mission.lng !== undefined) {
            const ptA = { lat: mission.lat - 0.08, lng: mission.lng - 0.08, name: `${mission.name} Approach` };
            const ptB = { lat: mission.lat + 0.08, lng: mission.lng + 0.08, name: `${mission.name} Egress` };
            setElevationPoints([ptA, ptB]);
            const prof = generateElevationTransect(ptA.lat, ptA.lng, ptB.lat, ptB.lng, 100, ptA.name, ptB.name);
            setElevationProfile(prof);
            openElevationProfile();
          }
        }}
      />

      {/* MARSWALK & EVA A* MULTIMODAL ROUTE PLANNER MODAL */}
      <MarsRoutePlannerModal
        isOpen={isRoutePlannerModalOpen}
        onClose={() => setIsRoutePlannerModalOpen(false)}
        startPoint={routeStartPoint}
        endPoint={routeEndPoint}
        onSetStartPoint={setRouteStartPoint}
        onSetEndPoint={setRouteEndPoint}
        activeRoute={activePlannedRoute}
        candidateRoutes={candidateRoutes}
        selectedMode={routeMode}
        onSelectMode={setRouteMode}
        onTriggerEmergencyReturn={handleEmergencyReturn}
        onAddScienceStop={handleAddScienceStop}
        onLoadDemoScenario={handleLoadDemoScenario}
        onFlyToRoute={() => {
          if (activePlannedRoute && activePlannedRoute.waypoints.length > 0 && mapInstanceRef.current) {
            const bounds = L.latLngBounds(activePlannedRoute.waypoints.map((w) => [w.lat, w.lng]));
            mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] });
          }
        }}
        onOpenPovImage={(pov, waypointName, elevationM) => {
          setActiveSurfacePovImage(pov);
          setPovModalWaypointName(waypointName || 'Waypoint');
          setPovModalElevationM(elevationM);
        }}
        transportMode={routeTransportMode}
        onChangeTransportMode={setRouteTransportMode}
        crewConfig={routeCrewConfig}
        onChangeCrewConfig={setRouteCrewConfig}
        onClearRoute={() => {
          setRouteStartPoint(null);
          setRouteEndPoint(null);
          setIsRouteSafetyHUDOpen(false);
          setShowRouteComparisonOnMap(false);
          setIsRoutePlannerModalOpen(false);
        }}
        onSwapPoints={() => {
          if (routeStartPoint && routeEndPoint) {
            const temp = routeStartPoint;
            setRouteStartPoint(routeEndPoint);
            setRouteEndPoint(temp);
          }
        }}
        onPickOnMap={() => {
          setIsRoutePlannerModalOpen(false);
          setIsMapPickDestinationMode(true);
        }}
      />

      {/* NASA POINT-OF-VIEW (POV) GROUND IMAGERY MODAL */}
      <NasaSurfacePovModal
        isOpen={!!activeSurfacePovImage}
        onClose={() => setActiveSurfacePovImage(null)}
        povImage={activeSurfacePovImage}
        waypointName={povModalWaypointName}
        elevationM={povModalElevationM}
      />

      {/* MULTI-FORMAT ASTRONAUT DISPLAY OVERLAY (Habitat / Tablet / Visor HUD) */}
      <MarsDisplayModeOverlay
        currentFormat={displayViewFormat}
        onChangeFormat={setDisplayViewFormat}
        currentBearing={bearing}
        subSolarLat={ephemeris.subSolarLatitude}
        currentLat={cursorPos?.lat ?? 18.4447}
        currentLng={cursorPos?.lng ?? 77.4509}
        currentElevM={cursorPos ? getMolaElevation(cursorPos.lat, cursorPos.lng) : -2560}
        activeRouteName={activePlannedRoute?.name}
        nextWaypointName={activePlannedRoute?.waypoints[1]?.name}
        distanceToNextKm={activePlannedRoute?.waypoints[1]?.cumulativeDistKm}
        estimatedRemainingMinutes={activePlannedRoute ? Math.round(activePlannedRoute.estimatedWalkTimeHours * 60) : undefined}
        onOpenLogSample={() => setIsRoutePlannerModalOpen(true)}
        onOpenPovViewer={() => {
          if (activePlannedRoute) {
            const wpWithPov = activePlannedRoute.waypoints.find((w) => w.surfacePovImage);
            if (wpWithPov && wpWithPov.surfacePovImage) {
              setActiveSurfacePovImage(wpWithPov.surfacePovImage);
              setPovModalWaypointName(wpWithPov.name);
              setPovModalElevationM(wpWithPov.elevationM);
            } else {
              handleLoadDemoScenario('boxwork');
              setIsRoutePlannerModalOpen(true);
            }
          } else {
            handleLoadDemoScenario('boxwork');
            setIsRoutePlannerModalOpen(true);
          }
        }}
        onResetBearing={handleResetOrientation}
      />

    </div>
  );
}
