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
} from 'lucide-react';
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
import { MarsRegionDetailModal } from './MarsRegionDetailModal';

export interface MarsSite extends MarsFeature {
  mission?: string;
  elevation: number;
  category?: string;
  significance?: string;
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

  // Basemap & Surface Display (Defaults to NASA Viking MDIM 2.1 Natural Planetary Color)
  const [activeLayer, setActiveLayer] = useState<'themis' | 'viking' | 'mola' | 'opm'>('viking');
  const [surfaceFilter, setSurfaceFilter] = useState<'normal' | 'contrast' | 'sharp' | 'dark' | 'night'>('normal');
  const [showSites, setShowSites] = useState<boolean>(true);
  const [showRoverTrack, setShowRoverTrack] = useState<boolean>(true);
  const [showGraticule, setShowGraticule] = useState<boolean>(false);

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

  // Active modal/drawer tab: 'sites' | 'route' | 'layers' | 'weather' | 'search' | null
  const [activeTab, setActiveTab] = useState<'sites' | 'route' | 'layers' | 'weather' | 'search' | null>(null);

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
      center: [18.38, 77.58],
      zoom: 4,
      minZoom: 2,
      maxZoom: 10,
      maxBounds: [
        [-85, -180],
        [85, 180],
      ],
      maxBoundsViscosity: 0.8,
      attributionControl: false,
      zoomControl: false,
      worldCopyJump: true,
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

    // Keep zoom state updated
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Layer groups
    regionsLayerRef.current = L.layerGroup().addTo(map);
    sitesLayerRef.current = L.layerGroup().addTo(map);
    roverTrackLayerRef.current = L.layerGroup().addTo(map);
    routeMarkersLayerRef.current = L.layerGroup().addTo(map);
    graticuleLayerRef.current = L.layerGroup().addTo(map);

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

    // Map click / tap -> only adds route waypoints if route planning mode is explicitly active!
    map.on('click', (e: L.LeafletMouseEvent) => {
      let lng = e.latlng.lng;
      lng = ((((lng + 180) % 360) + 360) % 360) - 180;
      const lat = Number(e.latlng.lat.toFixed(4));
      const cleanLng = Number(lng.toFixed(4));
      const eastLng = Number(((cleanLng + 360) % 360).toFixed(4));

      if (isRoutePlanningActiveRef.current) {
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
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      regionsLayerRef.current = null;
    };
  }, []);

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
          minZoom: 2,
          maxNativeZoom: 9,
          maxZoom: 10,
          attribution: 'NASA Odyssey THEMIS 100m Controlled Mosaic',
          noWrap: false,
          updateWhenIdle: false,
        }
      );
    } else if (activeLayer === 'viking') {
      newTileLayer = L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        {
          minZoom: 2,
          maxNativeZoom: 7,
          maxZoom: 10,
          attribution: 'NASA Mars Trek / Viking MDIM2.1',
          noWrap: false,
          updateWhenIdle: false,
        }
      );
    } else if (activeLayer === 'mola') {
      newTileLayer = L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        {
          minZoom: 2,
          maxNativeZoom: 7,
          maxZoom: 10,
          attribution: 'NASA MGS MOLA Elevation',
          noWrap: false,
          updateWhenIdle: false,
        }
      );
    } else {
      newTileLayer = L.tileLayer(
        'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-2/all/{z}/{x}/{y}.png',
        {
          minZoom: 2,
          maxNativeZoom: 8,
          maxZoom: 10,
          attribution: 'OpenPlanetary & USGS',
          noWrap: false,
          updateWhenIdle: false,
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
            <div style="
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
              transform: translate(-50%, -50%);
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

  // Render Mission Sites Markers
  useEffect(() => {
    const sitesGroup = sitesLayerRef.current;
    if (!sitesGroup) return;
    sitesGroup.clearLayers();

    if (!showSites) return;

    FAMOUS_MARS_SITES.forEach((site) => {
      const isSelected = selectedSite?.id === site.id;

      const getCategoryColor = (type: string) => {
        if (type.includes('Rover') || type.includes('Lander')) return 'bg-amber-500 border-amber-300 text-amber-950';
        if (type.includes('Mons') || type.includes('Volcano')) return 'bg-rose-600 border-rose-300 text-rose-950';
        if (type.includes('Crater')) return 'bg-purple-500 border-purple-300 text-purple-950';
        if (type.includes('Chasma') || type.includes('Canyon')) return 'bg-blue-500 border-blue-300 text-blue-950';
        if (type.includes('Vallis') || type.includes('Valley')) return 'bg-teal-500 border-teal-300 text-teal-950';
        if (type.includes('Planitia') || type.includes('Plain')) return 'bg-yellow-500 border-yellow-300 text-yellow-950';
        if (type.includes('Terra') || type.includes('Highland')) return 'bg-orange-600 border-orange-300 text-orange-950';
        if (type.includes('Polar') || type.includes('Ice')) return 'bg-cyan-400 border-cyan-200 text-cyan-950';
        if (type.includes('Base')) return 'bg-emerald-500 border-emerald-300 text-emerald-950';
        return 'bg-red-500 border-red-300 text-red-950';
      };

      const colorClass = getCategoryColor(site.category || site.type);

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-125">
          <div class="w-5 h-5 rounded-full flex items-center justify-center border-2 shadow-lg ${colorClass} ${
            isSelected ? 'ring-4 ring-white scale-125' : ''
          }">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
          <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-950/95 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-neutral-700 text-neutral-200 pointer-events-none shadow">
            ${site.name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'mars-site-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([site.lat, site.lng], { icon: customIcon });

      marker.bindTooltip(
        `<b>${site.name}</b> <span style="color:#a3a3a3;font-size:10px;">(${site.type})</span><br/><span style="color:#f97316;">${site.originName || site.significance}</span><br/>Elev: ${site.elevation > 0 ? '+' : ''}${site.elevation}m`,
        { className: 'mars-tooltip' }
      );

      marker.on('click', () => {
        setSelectedSite(site);
        // On marker click, fly smoothly and keep view clear
        mapInstanceRef.current?.flyTo([site.lat, site.lng], 6, { duration: 1.2 });
      });

      sitesGroup.addLayer(marker);
    });
  }, [showSites, selectedSite]);

  // Render Perseverance Rover Historical Traverse Track
  useEffect(() => {
    const roverGroup = roverTrackLayerRef.current;
    if (!roverGroup) return;
    roverGroup.clearLayers();

    if (!showRoverTrack) return;

    const latLngs: [number, number][] = PERSEVERANCE_TRAVERSE_TRACK.map((pt) => [pt.lat, pt.lng]);

    const trackPolyline = L.polyline(latLngs, {
      color: '#f97316',
      weight: 3.5,
      opacity: 0.9,
      dashArray: '6, 6',
    });
    roverGroup.addLayer(trackPolyline);

    PERSEVERANCE_TRAVERSE_TRACK.forEach((wp) => {
      const wpIcon = L.divIcon({
        html: `<div class="w-2.5 h-2.5 rounded-full bg-orange-400 border border-white shadow"></div>`,
        className: 'rover-wp',
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });
      const wpMarker = L.marker([wp.lat, wp.lng], { icon: wpIcon });
      wpMarker.bindTooltip(`<b>${wp.name}</b><br/>Perseverance Sol ${wp.sol}`, {
        className: 'mars-tooltip',
      });
      roverGroup.addLayer(wpMarker);
    });
  }, [showRoverTrack]);

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
          <div class="flex items-center justify-center w-6 h-6 rounded-full font-bold text-[10px] text-white shadow-lg border-2 ${
            isStart
              ? 'bg-emerald-600 border-white'
              : isEnd
              ? 'bg-red-600 border-white'
              : 'bg-cyan-600 border-cyan-200'
          }">
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
  const handleFlyTo = (site: MarsSite) => {
    setSelectedSite(site);
    setActiveTab(null); // Auto-close modal as requested
    mapInstanceRef.current?.flyTo([site.lat, site.lng], 6, {
      duration: 1.5,
    });
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
    mapInstanceRef.current?.flyTo([18.46, 77.41], 10, { duration: 1.5 });
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

  // Surface filter CSS style
  const getFilterStyle = () => {
    if (surfaceFilter === 'contrast') {
      return 'contrast(1.25) saturate(1.15) brightness(1.05)';
    }
    if (surfaceFilter === 'sharp') {
      return 'contrast(1.4) brightness(0.95)';
    }
    if (surfaceFilter === 'dark') {
      return 'brightness(0.62) contrast(1.18) saturate(0.85)';
    }
    if (surfaceFilter === 'night') {
      return 'brightness(0.42) contrast(1.28) hue-rotate(200deg) saturate(0.65)';
    }
    return 'none';
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#080b11] overflow-hidden select-none font-sans text-neutral-100">
      {/* Top Header Bar: Responsive, Clean & Sleek */}
      <header className="z-25 bg-[#0c101a]/95 backdrop-blur-md border-b border-neutral-800/80 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 shadow-xl shrink-0">
        {/* Brand & Status */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="w-7 h-7 sm:w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-950/60 shrink-0">
            <Globe className="w-4 h-4 sm:w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-bold text-white tracking-wide text-xs sm:text-sm">MARSWAY</span>
              <span className="text-[8.5px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded bg-orange-950/80 text-orange-400 border border-orange-800 font-semibold whitespace-nowrap">
                NASA GIS
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 hidden sm:block">
              Planetary Surface Imagery & Mission Traverse Explorer
            </p>
          </div>
        </div>

        {/* Desktop Search Bar (Hidden on mobile) */}
        <div className="relative max-w-xs w-full hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search crater, rover, mountain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-700/80 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Dropdown Popup */}
          {searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0f1422] border border-neutral-700 rounded-lg shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto">
              {filteredSites.length === 0 ? (
                <div className="p-3 text-xs text-neutral-400 text-center">No locations found</div>
              ) : (
                filteredSites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => {
                      handleFlyTo(site);
                      setSearchQuery('');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-orange-950/40 border-b border-neutral-800/50 flex items-center justify-between text-xs transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-white">{site.name}</span>
                      <span className="block text-[10px] text-neutral-400">{site.significance}</span>
                    </div>
                    <span className="text-[10px] text-orange-400 font-mono">
                      {site.lat > 0 ? `+${site.lat}` : site.lat}°
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Desktop Navigation Tabs (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab(activeTab === 'sites' ? null : 'sites')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTab === 'sites'
                ? 'bg-orange-600 text-white border-orange-400 shadow-md shadow-orange-950'
                : 'bg-neutral-900/90 text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Landmarks</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'route' ? null : 'route')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTab === 'route'
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-950'
                : 'bg-neutral-900/90 text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Route Planner</span>
            {routeWaypoints.length > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-cyan-400 text-cyan-950 text-[10px] flex items-center justify-center font-bold">
                {routeWaypoints.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'layers' ? null : 'layers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTab === 'layers'
                ? 'bg-neutral-700 text-white border-neutral-500 shadow-md'
                : 'bg-neutral-900/90 text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Surface View</span>
          </button>

          {/* Authentic Google Maps Borders Dropdown & Selector */}
          <div className="relative">
            <div className="flex items-center rounded-lg border border-neutral-700 bg-neutral-900/90 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowRegions(!showRegions)}
                className={`px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showRegions
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Toggle Google Maps-Style Area Borders"
              >
                <Globe className={`w-3.5 h-3.5 ${showRegions ? 'text-[#ea4335]' : 'text-neutral-500'}`} />
                <span>Area Borders</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                    showRegions
                      ? 'bg-red-950 text-red-300 border border-red-800/80'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {showRegions ? 'ON' : 'OFF'}
                </span>
              </button>
              <button
                onClick={() => setIsBordersMenuOpen(!isBordersMenuOpen)}
                className={`px-1.5 py-1.5 border-l border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer ${
                  isBordersMenuOpen ? 'bg-neutral-800 text-white' : ''
                }`}
                title="Google Maps Border Options & Area Picker"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Google Maps Borders Popover Menu */}
            {isBordersMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsBordersMenuOpen(false)}
                />
                <div className="absolute top-full right-0 mt-2 z-50 w-72 sm:w-80 bg-[#0c101a]/98 backdrop-blur-2xl border border-neutral-700 rounded-2xl shadow-2xl p-3.5 space-y-3 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#ea4335]" />
                      <span className="text-xs font-bold text-white">Google Maps Boundary System</span>
                    </div>
                    <button
                      onClick={() => setIsBordersMenuOpen(false)}
                      className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Master Toggle */}
                  <div className="flex items-center justify-between bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800">
                    <div>
                      <span className="text-xs font-semibold text-neutral-200 block">Show Borders</span>
                      <span className="text-[10px] text-neutral-400 block">Clean hairline boundaries, no color fill</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showRegions}
                      onChange={(e) => setShowRegions(e.target.checked)}
                      className="accent-[#ea4335] rounded w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {/* Dataset Choice */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      Grid & Territory Standard
                    </span>
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
                  </div>

                  {/* Quick Jump / Search to Area */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      Jump to Area (Highlights in Google Red)
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
                        setIsBordersMenuOpen(false);
                      }}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-[#ea4335] cursor-pointer"
                    >
                      <option value="">Select an area to highlight...</option>
                      {activeRegions.map((reg) => (
                        <option key={reg.id} value={reg.id}>
                          {reg.quadCode ? `[${reg.quadCode}] ` : ''}{reg.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Labels Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
                    <span className="text-neutral-300 text-xs">Show Typography Labels</span>
                    <input
                      type="checkbox"
                      checked={showRegionLabels}
                      onChange={(e) => setShowRegionLabels(e.target.checked)}
                      className="accent-[#ea4335] rounded w-3.5 h-3.5 cursor-pointer"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setActiveTab(activeTab === 'weather' ? null : 'weather')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTab === 'weather'
                ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                : 'bg-neutral-900/90 text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Weather</span>
          </button>

          <button
            onClick={() => {
              setCloseUpSearchTarget(selectedSite?.name || 'Jezero Crater');
              setIsCloseUpModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border bg-orange-950/80 text-orange-200 border-orange-700/80 hover:bg-orange-900 hover:text-white shadow-md shadow-orange-950/50"
            title="Real NASA in-situ close-up photographs from rovers & HiRISE"
          >
            <Camera className="w-3.5 h-3.5 text-orange-400" />
            <span>NASA Close-Up</span>
          </button>
        </div>

        {/* Mobile Header Quick Actions */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsBordersMenuOpen(!isBordersMenuOpen)}
            className={`px-2 py-1.5 rounded-lg border flex items-center gap-1 cursor-pointer transition-all ${
              showRegions
                ? 'bg-neutral-800 text-white border-neutral-600 shadow-sm'
                : 'bg-neutral-900 text-neutral-400 border-neutral-700'
            }`}
            title="Google Maps Border Settings"
          >
            <Globe className={`w-3.5 h-3.5 ${showRegions ? 'text-[#ea4335]' : 'text-neutral-500'}`} />
            <span className="text-[10px] font-bold">Borders</span>
          </button>

          <button
            onClick={() => {
              setCloseUpSearchTarget(selectedSite?.name || 'Jezero Crater');
              setIsCloseUpModalOpen(true);
            }}
            className="px-2 py-1.5 rounded-lg bg-orange-950/80 border border-orange-700/80 text-orange-300 font-bold text-[10px] flex items-center gap-1 shadow cursor-pointer"
            title="NASA Close-Up"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Close-Up</span>
          </button>

          <button
            onClick={handleResetView}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Reset to Full Mars View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <div
        ref={mapStageRef}
        className="flex-1 relative w-full h-full overflow-hidden bg-[#07090e]"
      >
        {/* Rotated Map Canvas Container with Smooth 4-Directional Animation */}
        <div
          className="absolute top-1/2 left-1/2 flex items-center justify-center origin-center transition-transform duration-500 ease-out pointer-events-auto"
          style={{
            width: `${stageDiagonal}px`,
            height: `${stageDiagonal}px`,
            transform: `translate(-50%, -50%) rotate(${-bearing}deg)`,
            filter: getFilterStyle(),
          }}
        >
          {/* Leaflet Map Canvas */}
          <div
            ref={mapContainerRef}
            className="w-full h-full z-0 cursor-crosshair"
          />
        </div>

        {/* PROMINENT ZOOM CONTROLS WITH CLEAR VISIBLE TEXT */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 pointer-events-auto">
          <div className="bg-[#0c101a]/95 backdrop-blur-md border border-neutral-700/90 rounded-xl p-1 sm:p-1.5 flex flex-col gap-1 shadow-2xl">
            {/* Live Zoom Scale Indicator */}
            <div className="px-1.5 sm:px-2 py-0.5 text-[8.5px] sm:text-[9px] text-neutral-400 font-mono flex items-center justify-between border-b border-neutral-800/60 pb-1">
              <span className="hidden sm:inline">SCALE</span>
              <span className="text-orange-400 font-bold">{currentZoom}x / 10x</span>
            </div>

            {/* Zoom In Button with Visible Text on Desktop */}
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              disabled={currentZoom >= 10}
              className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 p-2 sm:px-2.5 sm:py-1.5 text-neutral-200 hover:text-white hover:bg-neutral-800/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              title="Zoom In to Mars Surface (Max 10x)"
            >
              <ZoomIn className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="font-bold tracking-tight hidden sm:inline">Zoom In</span>
            </button>

            {/* Zoom Out Button with Visible Text on Desktop */}
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              disabled={currentZoom <= 2}
              className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 p-2 sm:px-2.5 sm:py-1.5 text-neutral-200 hover:text-white hover:bg-neutral-800/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              title="Zoom Out from Mars Surface"
            >
              <ZoomOut className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="font-bold tracking-tight hidden sm:inline">Zoom Out</span>
            </button>

            <div className="h-[1px] bg-neutral-800/80 my-0.5" />

            {/* Reset View Button with Visible Text on Desktop */}
            <button
              onClick={handleResetView}
              className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 p-2 sm:px-2.5 sm:py-1.5 text-neutral-300 hover:text-orange-400 hover:bg-neutral-800/90 rounded-lg font-medium text-xs transition-colors cursor-pointer"
              title="Reset to Full Global Mars View & True North"
            >
              <RotateCcw className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="font-medium hidden sm:inline">Reset View</span>
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
              Natural Color
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
        <div className="absolute top-3 right-3 z-20 pointer-events-auto">
          <MarsCompassWidget
            bearing={bearing}
            onRotate={handleSetBearing}
            onResetOrientation={handleResetOrientation}
            subSolarLat={ephemeris.subSolarLatitude}
            solarLongitudeLs={ephemeris.solarLongitudeLs}
          />
        </div>

        {/* CRISP DARK-THEMED MARS SCALE BAR (Bottom Left Corner) */}
        <div className="absolute bottom-24 sm:bottom-4 left-3 sm:left-4 z-20 pointer-events-auto">
          <MarsScaleBar map={mapInstance} />
        </div>

        {/* High-Zoom Notification & In-Situ Close-Up Quick Action Banner */}
        {currentZoom >= 7 && (
          <div className="absolute top-16 sm:top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-[#0a101f]/95 backdrop-blur-md border border-orange-500/70 text-white px-3 sm:px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-2 text-xs max-w-[92vw]">
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
          <div className="absolute bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-25 pointer-events-auto bg-[#0c101a]/95 backdrop-blur-xl border border-orange-500/70 p-3 sm:p-3.5 rounded-2xl shadow-2xl max-w-sm w-[94%] sm:w-84 text-xs flex flex-col gap-2 animate-in slide-in-from-bottom-3 duration-200">
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

            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                onClick={() => {
                  setCloseUpSearchTarget(selectedSite.name);
                  setIsCloseUpModalOpen(true);
                }}
                className="flex-1 py-2 px-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-950 transition-colors cursor-pointer min-h-[38px]"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>NASA Close-Up</span>
              </button>
              <button
                onClick={() => {
                  handleAddSiteToRoute(selectedSite);
                }}
                className="py-2 px-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-700/80 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer min-h-[38px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Route</span>
              </button>
            </div>
          </div>
        )}

        {/* INSPECTED POINT CARD (Exploration Mode - Does NOT create routes) */}
        {inspectedPoint && !isRoutePlanningActive && !activeTab && (
          <div className="absolute bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-25 pointer-events-auto bg-[#0c101a]/95 backdrop-blur-xl border border-neutral-700/90 p-3 sm:p-3.5 rounded-2xl shadow-2xl max-w-sm w-[94%] sm:w-80 text-xs flex flex-col gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
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
                            <span className="font-bold block text-xs">NASA Viking MDIM 2.1 (Natural Color)</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-900/60 border border-amber-700/50 text-[9px] font-mono text-amber-300 font-bold">
                              Natural Color • Default
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
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                      Overlays & Grids
                    </span>
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
                        <span className="text-neutral-200">Perseverance Rover Traverse</span>
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
          <div className="absolute bottom-16 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 bg-[#0c101a]/90 backdrop-blur-md border border-neutral-800/80 px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs text-neutral-300 shadow-xl flex items-center gap-2.5 sm:gap-4 pointer-events-auto whitespace-nowrap">
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

      {/* DEDICATED MOBILE BOTTOM NAVBAR */}
      <nav className="md:hidden z-30 bg-[#0c101a]/98 backdrop-blur-xl border-t border-neutral-800/80 px-1.5 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-2xl shrink-0">
        <button
          onClick={() => setActiveTab(activeTab === 'sites' ? null : 'sites')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[48px] active:scale-95 ${
            activeTab === 'sites'
              ? 'text-orange-400 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'sites' ? 'bg-orange-950/80' : ''}`}>
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Landmarks</span>
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'route' ? null : 'route')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[48px] active:scale-95 ${
            activeTab === 'route'
              ? 'text-cyan-400 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'route' ? 'bg-cyan-950/80' : ''}`}>
            <Navigation className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Route</span>
          {routeWaypoints.length > 0 && (
            <span className="absolute top-0.5 right-1.5 w-4 h-4 rounded-full bg-cyan-500 text-cyan-950 text-[9px] flex items-center justify-center font-bold">
              {routeWaypoints.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'layers' ? null : 'layers')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[48px] active:scale-95 ${
            activeTab === 'layers'
              ? 'text-emerald-400 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'layers' ? 'bg-emerald-950/80' : ''}`}>
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Surface</span>
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'weather' ? null : 'weather')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[48px] active:scale-95 ${
            activeTab === 'weather'
              ? 'text-amber-400 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'weather' ? 'bg-amber-950/80' : ''}`}>
            <Thermometer className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Weather</span>
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'search' ? null : 'search')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[48px] active:scale-95 ${
            activeTab === 'search'
              ? 'text-orange-400 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'search' ? 'bg-orange-950/80' : ''}`}>
            <Search className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Search</span>
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
            maxZoom: 7,
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
    </div>
  );
}
