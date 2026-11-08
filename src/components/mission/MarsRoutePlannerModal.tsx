import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Navigation,
  Compass,
  TrendingUp,
  Shield,
  Zap,
  Sparkles,
  AlertTriangle,
  Download,
  FileText,
  Printer,
  Radio,
  MapPin,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Flame,
  LifeBuoy,
  Plus,
  RotateCcw,
  Languages,
  Camera,
  Battery,
  Users,
  User,
  Truck,
  Droplets,
  ArrowRightLeft,
  Crosshair,
} from 'lucide-react';
import {
  PlannedRouteResult,
  RouteMode,
  PlannedWaypoint,
  ScienceStopSuggestion,
  MarsTransportModeType,
  CrewBuddyConfigType,
  calculateAStarRoute,
  calculateEmergencyReturnRoute,
} from '../../engine/marsAStarRouter';
import { NasaSurfacePovImage } from '../../types/mars';
import { calculateMarsDistanceKm } from '../../engine/spatialMath';

export interface MarsRoutePlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  startPoint: { lat: number; lng: number; name?: string } | null;
  endPoint: { lat: number; lng: number; name?: string } | null;
  onSetStartPoint: (pt: { lat: number; lng: number; name?: string }) => void;
  onSetEndPoint: (pt: { lat: number; lng: number; name?: string }) => void;
  activeRoute: PlannedRouteResult | null;
  candidateRoutes: Record<RouteMode, PlannedRouteResult | null>;
  selectedMode: RouteMode;
  onSelectMode: (mode: RouteMode) => void;
  onTriggerEmergencyReturn: () => void;
  onAddScienceStop: (stop: ScienceStopSuggestion) => void;
  onLoadDemoScenario: (scenarioType?: 'jezero' | 'boxwork') => void;
  onFlyToRoute: () => void;
  onOpenPovImage?: (pov: NasaSurfacePovImage, waypointName?: string, elevationM?: number) => void;
  transportMode?: MarsTransportModeType;
  onChangeTransportMode?: (mode: MarsTransportModeType) => void;
  crewConfig?: CrewBuddyConfigType;
  onChangeCrewConfig?: (config: CrewBuddyConfigType) => void;
  onCancelRoute?: () => void;
  onClearRoute?: () => void;
  onSwapPoints?: () => void;
  onPickOnMap?: () => void;
}

export const MarsRoutePlannerModal: React.FC<MarsRoutePlannerModalProps> = ({
  isOpen,
  onClose,
  startPoint,
  endPoint,
  onSetStartPoint,
  onSetEndPoint,
  activeRoute,
  candidateRoutes,
  selectedMode,
  onSelectMode,
  onTriggerEmergencyReturn,
  onAddScienceStop,
  onLoadDemoScenario,
  onFlyToRoute,
  onOpenPovImage,
  transportMode = 'foot',
  onChangeTransportMode,
  crewConfig = 'buddy_pair',
  onChangeCrewConfig,
  onCancelRoute,
  onClearRoute,
  onSwapPoints,
  onPickOnMap,
}) => {
  const handleCancelRoute = onCancelRoute || onClearRoute;
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'stops' | 'explainer' | 'comms' | 'export'>('overview');
  const [explainerLang, setExplainerLang] = useState<'en' | 'bn'>('en');
  const [hoveredProfileIndex, setHoveredProfileIndex] = useState<number | null>(null);

  // Keyboard Escape listener to dismiss modal smoothly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Orbiters pass timetable model (MRO, Odyssey, TGO, MAVEN)
  const orbiterPasses = [
    { name: 'Mars Reconnaissance Orbiter (MRO)', elevationDeg: 68, timeUntilPass: '24 mins', windowDuration: '18 mins', status: 'Direct Relay LOS Active' },
    { name: '2001 Mars Odyssey', elevationDeg: 34, timeUntilPass: '1h 12m', windowDuration: '14 mins', status: 'Approaching Horizon' },
    { name: 'ExoMars Trace Gas Orbiter (TGO)', elevationDeg: 82, timeUntilPass: '2h 45m', windowDuration: '22 mins', status: 'Scheduled Overhead Pass' },
    { name: 'MAVEN (Aeronomy Relay)', elevationDeg: 19, timeUntilPass: '4h 10m', windowDuration: '11 mins', status: 'Low Horizon Pass' },
  ];

  // Export GeoJSON Handler
  const handleExportGeoJSON = () => {
    if (!activeRoute) return;
    const geojson = {
      type: 'FeatureCollection',
      properties: {
        mission: 'MarsWay EVA Traverse Plan',
        routeId: activeRoute.id,
        name: activeRoute.name,
        mode: activeRoute.mode,
        totalDistanceKm: activeRoute.totalDistanceKm,
        estimatedWalkTimeHours: activeRoute.estimatedWalkTimeHours,
        safetyScore: activeRoute.safetyScore,
        datum: 'IAU 2000 MOLA Areoid',
      },
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: activeRoute.waypoints.map((w) => [w.lng, w.lat, w.elevationM]),
          },
          properties: {
            name: activeRoute.name,
            maxSlopeDeg: activeRoute.maxSlopeDeg,
            ascentM: activeRoute.totalAscentM,
            descentM: activeRoute.totalDescentM,
          },
        },
        ...activeRoute.waypoints.map((w, idx) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [w.lng, w.lat, w.elevationM],
          },
          properties: {
            index: idx + 1,
            name: w.name,
            elevationM: w.elevationM,
            slopeDeg: w.slopeDeg,
            hazardRisk: w.hazardRisk,
            cumulativeDistKm: w.cumulativeDistKm,
          },
        })),
      ],
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marsway-route-${activeRoute.mode}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export GPX Handler
  const handleExportGPX = () => {
    if (!activeRoute) return;
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MarsWay Planetary Mission Planner" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${activeRoute.name}</name>
    <desc>Mars Planetary EVA Traverse (MOLA Datum)</desc>
  </metadata>
  <trk>
    <name>${activeRoute.name}</name>
    <type>EVA Marswalk</type>
    <trkseg>
${activeRoute.waypoints.map((w) => `      <trkpt lat="${w.lat}" lon="${w.lng}">
        <ele>${w.elevationM}</ele>
        <name>${w.name}</name>
      </trkpt>`).join('\n')}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marsway-route-${activeRoute.mode}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print One-Page EVA Mission Brief PDF
  const handlePrintMissionBrief = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 pointer-events-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mars-route-planner-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#070b14]/98 border border-cyan-500/50 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/95 flex flex-col text-neutral-200 w-full max-w-2xl max-h-[92vh] overflow-hidden font-sans text-xs ring-1 ring-cyan-500/30">
        {/* Top Header */}
        <div className="p-3 sm:p-3.5 bg-neutral-950/90 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-600/40 to-blue-600/30 border border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-950/50">
              <Navigation className="w-4 h-4 fill-cyan-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-xs sm:text-sm tracking-wide">
                  <span id="mars-route-planner-title">Mars Route Planner & Directions</span>
                </h3>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 font-bold whitespace-nowrap">
                  A* Multi-Objective
                </span>
              </div>
              <div className="text-[10.5px] text-neutral-400">
                Google Maps style Martian route planning and terrain safety analysis
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {handleCancelRoute && (
              <button
                type="button"
                onClick={handleCancelRoute}
                className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900/90 text-red-200 border border-red-500/50 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                title="Cancel route planning and clear path from map"
              >
                <X className="w-3 h-3 text-red-400" />
                <span>Cancel Route</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Close window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Google Maps Style Origin & Destination Header Bar */}
        <div className="px-3.5 py-2.5 bg-[#0a101d] border-b border-white/10 shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1.5 flex-1">
              {/* Origin Start Point */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-neutral-950/90 border border-emerald-500/40">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                <div className="flex-1 min-w-0">
                  <div className="text-[9.5px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    Departure Base
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {startPoint?.name || (startPoint ? `${startPoint.lat.toFixed(3)}°N, ${startPoint.lng.toFixed(3)}°E` : 'Select Departure Base')}
                  </div>
                </div>
              </div>

              {/* Destination Target Point */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-neutral-950/90 border border-cyan-500/40">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
                <div className="flex-1 min-w-0">
                  <div className="text-[9.5px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                    Destination Target
                  </div>
                  <div className="text-xs font-bold text-cyan-200 truncate">
                    {endPoint?.name || (endPoint ? `${endPoint.lat.toFixed(3)}°N, ${endPoint.lng.toFixed(3)}°E` : 'Select Destination Point')}
                  </div>
                </div>
              </div>
            </div>

            {/* Swap ⇄ and Map Pick Action Column */}
            <div className="flex flex-col gap-1 items-center shrink-0">
              {onSwapPoints && (
                <button
                  type="button"
                  onClick={onSwapPoints}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 hover:text-cyan-300 transition cursor-pointer shadow-sm"
                  title="Swap Departure & Destination"
                >
                  <ArrowRightLeft className="w-4 h-4 text-cyan-400 rotate-90" />
                </button>
              )}

              {onPickOnMap && (
                <button
                  type="button"
                  onClick={onPickOnMap}
                  className="p-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 transition cursor-pointer shadow-sm"
                  title="Pick destination directly on Mars map"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Preset Route Scenarios */}
          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
            <span className="text-neutral-400 font-mono">Quick Scenarios:</span>
            <button
              type="button"
              onClick={() => onLoadDemoScenario('jezero')}
              className="px-2 py-0.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/40 font-mono font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Sparkles className="w-2.5 h-2.5 text-orange-400" />
              <span>Jezero Crater Delta</span>
            </button>
            <button
              type="button"
              onClick={() => onLoadDemoScenario('boxwork')}
              className="px-2 py-0.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-mono font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              <span>Gale Crater Boxwork</span>
            </button>
          </div>
        </div>

      {/* Transport Mode & Crew Configuration Controls */}
      <div className="px-3 py-2 bg-neutral-900/90 border-b border-white/5 space-y-1.5 shrink-0">
        <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
          <span className="uppercase tracking-wider flex items-center gap-1">
            <Truck className="w-3 h-3 text-cyan-400" />
            <span>Transport Mode & Crew Logistics</span>
          </span>
          <span className="text-cyan-300 font-bold">
            {transportMode === 'unpressurized_rover'
              ? 'LTV Rover (~12 km/h)'
              : transportMode === 'pressurized_rover'
              ? 'SEV Cabin (~18 km/h)'
              : 'Foot Marswalk (~3 km/h)'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => onChangeTransportMode && onChangeTransportMode('foot')}
            className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer border ${
              transportMode === 'foot'
                ? 'bg-orange-950/80 text-orange-200 border-orange-500/70 shadow'
                : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <span>🚶 Foot Walk</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTransportMode && onChangeTransportMode('unpressurized_rover')}
            className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer border ${
              transportMode === 'unpressurized_rover'
                ? 'bg-cyan-950/80 text-cyan-200 border-cyan-500/70 shadow'
                : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <span>🚜 Rover (LTV)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTransportMode && onChangeTransportMode('pressurized_rover')}
            className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer border ${
              transportMode === 'pressurized_rover'
                ? 'bg-blue-950/80 text-blue-200 border-blue-500/70 shadow'
                : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <span>🚐 Pressurized</span>
          </button>
        </div>

        {/* Crew Buddy Configuration */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
          <span className="text-neutral-400 font-mono">Crew Structure:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChangeCrewConfig && onChangeCrewConfig('solo')}
              className={`px-2 py-0.5 rounded text-[9.5px] font-mono transition cursor-pointer ${
                crewConfig === 'solo'
                  ? 'bg-neutral-700 text-white font-bold'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Solo
            </button>
            <button
              type="button"
              onClick={() => onChangeCrewConfig && onChangeCrewConfig('buddy_pair')}
              className={`px-2 py-0.5 rounded text-[9.5px] font-mono transition cursor-pointer flex items-center gap-1 ${
                crewConfig === 'buddy_pair'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-bold'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Users className="w-2.5 h-2.5" />
              <span>Buddy Pair (1.85x Science)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Route Mode Switcher Tabs (Tier 2 Item 13) */}
      <div className="p-2 border-b border-white/10 bg-neutral-950/80 grid grid-cols-3 gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onSelectMode('safest')}
          className={`py-1.5 px-2 rounded-xl text-center transition flex flex-col items-center gap-0.5 cursor-pointer border ${
            selectedMode === 'safest'
              ? 'bg-emerald-950/80 border-emerald-500 text-white font-bold shadow-md shadow-emerald-950/60'
              : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Safest</span>
          </div>
          <span className="text-[9px] text-emerald-300 font-mono">Slope &lt; 5°</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('shortest')}
          className={`py-1.5 px-2 rounded-xl text-center transition flex flex-col items-center gap-0.5 cursor-pointer border ${
            selectedMode === 'shortest'
              ? 'bg-cyan-950/80 border-cyan-500 text-white font-bold shadow-md shadow-cyan-950/60'
              : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1 text-[11px]">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Shortest</span>
          </div>
          <span className="text-[9px] text-cyan-300 font-mono">Min Distance</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('science')}
          className={`py-1.5 px-2 rounded-xl text-center transition flex flex-col items-center gap-0.5 cursor-pointer border ${
            selectedMode === 'science'
              ? 'bg-amber-950/80 border-amber-500 text-white font-bold shadow-md shadow-amber-950/60'
              : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Science-Rich</span>
          </div>
          <span className="text-[9px] text-amber-300 font-mono">Max Samples</span>
        </button>
      </div>

      {/* Sub-Tabs: Overview vs Elevation Profile vs Science Stops vs AI Explainer vs Comms vs Export */}
      <div className="flex border-b border-white/10 px-3 pt-2 gap-3 text-[11px] font-semibold overflow-x-auto no-scrollbar whitespace-nowrap shrink-0 bg-neutral-950/50">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-1.5 border-b-2 cursor-pointer transition ${
            activeTab === 'overview' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-1.5 border-b-2 cursor-pointer transition flex items-center gap-1 ${
            activeTab === 'profile' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3 h-3" />
          Elevation Chart
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stops')}
          className={`pb-1.5 border-b-2 cursor-pointer transition flex items-center gap-1 ${
            activeTab === 'stops' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <MapPin className="w-3 h-3 text-amber-400" />
          Science Stops
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('explainer')}
          className={`pb-1.5 border-b-2 cursor-pointer transition flex items-center gap-1 ${
            activeTab === 'explainer' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          AI Explainer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('comms')}
          className={`pb-1.5 border-b-2 cursor-pointer transition flex items-center gap-1 ${
            activeTab === 'comms' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Radio className="w-3 h-3" />
          Comms
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`pb-1.5 border-b-2 cursor-pointer transition flex items-center gap-1 ${
            activeTab === 'export' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Download className="w-3 h-3" />
          Export / PDF
        </button>
      </div>

      {/* Main Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {/* Empty / Unselected Route State with 1-Click Launchers */}
        {activeTab === 'overview' && !activeRoute && (
          <div className="p-6 text-center space-y-4 bg-neutral-950/80 border border-white/10 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600/30 to-blue-600/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300 mx-auto shadow-lg shadow-cyan-950/60">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-wide">
                Select Mars Exploration Route
              </h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Select departure base and destination target, or load a certified scientific exploration scenario below.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={() => onLoadDemoScenario('jezero')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-orange-950/50 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-orange-200" />
                <span>🚀 Load Jezero Delta Scenario</span>
              </button>
              <button
                type="button"
                onClick={() => onLoadDemoScenario('boxwork')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-950/50 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>🪨 Load Boxwork Formations (2025)</span>
              </button>
            </div>

            {onPickOnMap && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onPickOnMap}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 mx-auto transition cursor-pointer"
                >
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                  <span>🎯 Pick Points Directly on Mars Map</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Route Overview & Details Card (Tier 1 #5 & Tier 2 #8) */}
        {activeTab === 'overview' && activeRoute && (
          <div className="space-y-3">
            {/* Start & End Summary */}
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[10.5px] text-neutral-400 font-mono">Start:</span>
                <span className="font-bold text-white truncate">{startPoint?.name || 'Start Point'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-[10.5px] text-neutral-400 font-mono">Dest:</span>
                <span className="font-bold text-white truncate">{endPoint?.name || 'Destination Point'}</span>
              </div>
            </div>

            {/* Safety Alert & Suggested Safer Alternative Proposal (if active mode has hazards or high slope) */}
            {activeRoute.safetyScore < 85 && candidateRoutes.safest && selectedMode !== 'safest' && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>⚠️ Direct Route Hazard Detected</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white font-bold font-mono">
                    Score: {activeRoute.safetyScore}/100
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-snug">
                  This direct line encounters maximum slopes of <strong>{activeRoute.maxSlopeDeg}°</strong> which presents hazardous slip risks.
                  The recommended safer bypass reduces the slope to <strong>{candidateRoutes.safest.maxSlopeDeg}°</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => onSelectMode('safest')}
                  className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>🛡️ Apply Recommended Safer Bypass Corridor</span>
                </button>
              </div>
            )}

            {/* PRIMARY ROUTE DETAILS CARD (Tier 1 Item 5) */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-neutral-950 to-neutral-900 border border-cyan-500/30 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-mono">
                    Traverse Distance
                  </span>
                  <div className="text-2xl font-black font-mono text-cyan-400">
                    {activeRoute.totalDistanceKm}{' '}
                    <span className="text-xs font-normal text-neutral-300">km</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    {(activeRoute.totalDistanceKm * 0.621371).toFixed(2)} miles • {activeRoute.waypoints.length} waypoints
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-mono">
                    Estimated Walk Time
                  </span>
                  <div className="text-xl font-bold font-mono text-white">
                    {activeRoute.estimatedWalkTimeFormatted}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    0.38g EMU pace ({activeRoute.metabolicKcal} kcal)
                  </div>
                </div>
              </div>

              {/* Terrain Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center font-mono">
                <div className="p-2 rounded-lg bg-neutral-900/80 border border-white/5">
                  <span className="text-[9.5px] text-neutral-400 block uppercase font-sans">Max Slope</span>
                  <span className={`text-xs font-bold ${activeRoute.maxSlopeDeg > 15 ? 'text-red-400' : 'text-emerald-300'}`}>
                    {activeRoute.maxSlopeDeg}°
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-neutral-900/80 border border-white/5">
                  <span className="text-[9.5px] text-neutral-400 block uppercase font-sans">Avg Slope</span>
                  <span className="text-xs font-bold text-neutral-200">
                    {activeRoute.avgSlopeDeg}°
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-neutral-900/80 border border-white/5">
                  <span className="text-[9.5px] text-neutral-400 block uppercase font-sans">Ascent / Descent</span>
                  <span className="text-[11px] font-bold text-cyan-300">
                    +{activeRoute.totalAscentM}m / -{activeRoute.totalDescentM}m
                  </span>
                </div>
              </div>

              {/* Consumables & Logistics Row */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center font-mono">
                <div className="p-2 rounded-lg bg-neutral-900/80 border border-white/5">
                  <span className="text-[9.5px] text-neutral-400 block uppercase font-sans">Oxygen Load</span>
                  <span className="text-xs font-bold text-sky-300">
                    {activeRoute.oxygenExpenditureLiters > 0 ? `${activeRoute.oxygenExpenditureLiters} L O₂` : 'Cabin Life Support'}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-neutral-900/80 border border-white/5">
                  <span className="text-[9.5px] text-neutral-400 block uppercase font-sans">
                    {activeRoute.batteryPowerKwh !== undefined ? 'Battery Power' : 'Metabolic Work'}
                  </span>
                  <span className="text-xs font-bold text-amber-300">
                    {activeRoute.batteryPowerKwh !== undefined ? `${activeRoute.batteryPowerKwh} kWh` : `${activeRoute.metabolicKcal} kcal`}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-neutral-900/80 border border-white/5">
                  <span className="text-[9.5px] text-neutral-400 block uppercase font-sans">Science Yield</span>
                  <span className="text-xs font-bold text-emerald-300">
                    {activeRoute.crewProductivityMultiplier > 1 ? `${activeRoute.crewProductivityMultiplier}x (Buddy Pair)` : '1.0x (Solo)'}
                  </span>
                </div>
              </div>
            </div>

            {/* SAFETY SCORE CARD & EXPLANATION (Tier 2 Item 8) */}
            <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  EVA Safety Score
                </span>
                <div className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs border ${
                  activeRoute.safetyScore >= 85
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    : activeRoute.safetyScore >= 70
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                    : 'bg-red-950/80 text-red-300 border-red-500/50'
                }`}>
                  {activeRoute.safetyScore} / 100
                </div>
              </div>

              <p className="text-[11px] text-neutral-300 leading-relaxed">
                {activeRoute.safetyExplanation}
              </p>

              {/* 5 Safety Sub-Factors */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono text-neutral-400">
                <div className="flex justify-between p-1 rounded bg-neutral-900/60">
                  <span>Slope Hazard:</span>
                  <span className="text-white font-bold">{activeRoute.safetyFactors.slopeScore}/30</span>
                </div>
                <div className="flex justify-between p-1 rounded bg-neutral-900/60">
                  <span>Hazard Avoidance:</span>
                  <span className="text-white font-bold">{activeRoute.safetyFactors.hazardAvoidanceScore}/25</span>
                </div>
                <div className="flex justify-between p-1 rounded bg-neutral-900/60">
                  <span>Shelter Proximity:</span>
                  <span className="text-white font-bold">{activeRoute.safetyFactors.shelterProximityScore}/20</span>
                </div>
                <div className="flex justify-between p-1 rounded bg-neutral-900/60">
                  <span>Daylight & Thermal:</span>
                  <span className="text-white font-bold">{activeRoute.safetyFactors.thermalDaylightScore}/15</span>
                </div>
              </div>
            </div>

            {/* EMERGENCY RETURN / ABORT EVA BUTTON (Tier 2 Item 14) */}
            <button
              type="button"
              onClick={onTriggerEmergencyReturn}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold flex items-center justify-center gap-2 transition text-xs shadow-lg shadow-red-950/70 cursor-pointer group active:scale-98"
            >
              <LifeBuoy className="w-4 h-4 group-hover:animate-spin" />
              <span>🚨 Emergency Return: Nearest Habitat Shelter Path</span>
            </button>
          </div>
        )}

        {/* Tab 2: Elevation Profile Chart Along Route (Tier 1 Item 6) */}
        {activeTab === 'profile' && activeRoute && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-neutral-950 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  MOLA Elevation Profile Across Route
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  Total Span: {activeRoute.totalAscentM + activeRoute.totalDescentM}m
                </span>
              </div>

              {/* SVG Elevation Profile Chart */}
              <div className="relative h-40 w-full bg-neutral-900/80 rounded-xl p-2 border border-white/5 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="routeElevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.4" />
                      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Draw elevation area */}
                  {(() => {
                    const elevs = activeRoute.waypoints.map((w) => w.elevationM);
                    const minE = Math.min(...elevs);
                    const maxE = Math.max(...elevs);
                    const range = Math.max(1, maxE - minE);

                    const points = activeRoute.waypoints
                      .map((w, idx) => {
                        const x = (idx / (activeRoute.waypoints.length - 1)) * 400;
                        const y = 110 - ((w.elevationM - minE) / range) * 90;
                        return `${x},${y}`;
                      })
                      .join(' ');

                    const areaPoints = `0,120 ${points} 400,120`;

                    return (
                      <>
                        <polygon points={areaPoints} fill="url(#routeElevGrad)" />
                        <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="2.5" />
                      </>
                    );
                  })()}
                </svg>

                {/* Min / Max Labels */}
                <div className="absolute top-2 left-3 text-[9.5px] font-mono text-neutral-400">
                  Max: {Math.max(...activeRoute.waypoints.map((w) => w.elevationM))}m
                </div>
                <div className="absolute bottom-2 left-3 text-[9.5px] font-mono text-neutral-400">
                  Min: {Math.min(...activeRoute.waypoints.map((w) => w.elevationM))}m
                </div>
              </div>

              <div className="text-[10.5px] text-neutral-400">
                Hover or inspect waypoints along the route to see local slope steepness and metabolic pace.
              </div>
            </div>

            {/* Waypoint elevation table */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {activeRoute.waypoints.map((w, idx) => (
                <div
                  key={w.id}
                  className="p-2 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between text-[10.5px] font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-600/30 border border-cyan-400 text-cyan-300 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-white">{w.name}</div>
                      <div className="text-[9px] text-neutral-400">
                        {w.lat.toFixed(3)}°N, {w.lng.toFixed(3)}°E
                      </div>
                      {w.surfacePovImage && onOpenPovImage && (
                        <button
                          type="button"
                          onClick={() => onOpenPovImage(w.surfacePovImage!, w.name, w.elevationM)}
                          className="mt-1 px-1.5 py-0.5 rounded bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 border border-orange-500/40 text-[9px] font-mono flex items-center gap-1 transition cursor-pointer"
                        >
                          <Camera className="w-2.5 h-2.5 text-orange-400" />
                          <span>NASA Surface POV</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-cyan-300">
                      {w.elevationM > 0 ? `+${w.elevationM}` : w.elevationM}m
                    </div>
                    <div className={`text-[9px] ${w.slopeDeg > 12 ? 'text-red-400 font-bold' : 'text-neutral-400'}`}>
                      Slope: {w.slopeDeg}°
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Science Stops Auto-Suggest (Tier 2 Item 10) */}
        {activeTab === 'stops' && activeRoute && (
          <div className="space-y-3">
            <div className="text-[11px] text-neutral-300">
              The engine automatically detects high-value planetary science deposits (clays, ancient deltas, ground ice, and boxwork formations) along your route corridor.
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activeRoute.nearbyScienceStops.length > 0 ? (
                activeRoute.nearbyScienceStops.map((stop) => (
                  <div
                    key={stop.id}
                    className="p-3 rounded-xl bg-neutral-950 border border-amber-500/30 space-y-2 hover:border-amber-500/60 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>{stop.name}</span>
                        </div>
                        <span className="text-[9.5px] font-mono text-amber-300 px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 mt-1 inline-block">
                          {stop.category} • Value: {stop.scientificValueScore}/10
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {stop.surfacePovImage && onOpenPovImage && (
                          <button
                            type="button"
                            onClick={() => onOpenPovImage(stop.surfacePovImage!, stop.name)}
                            className="px-2 py-1 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/40 font-mono text-[9.5px] flex items-center gap-1 transition cursor-pointer"
                            title="Inspect ground POV image taken by NASA Mars rover"
                          >
                            <Camera className="w-3 h-3 text-orange-400" />
                            <span>POV</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onAddScienceStop(stop)}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer shadow"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Stop</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-[10.5px] text-neutral-300">
                      {stop.description}
                    </p>

                    <div className="flex items-center justify-between text-[9.5px] font-mono text-neutral-400 border-t border-neutral-900 pt-1">
                      <span>Detour: ~{stop.detourDistanceMeters}m</span>
                      <span>Added Time: +{stop.detourTimeMinutes} mins</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-neutral-950 text-center text-neutral-400">
                  No major cataloged science deposits within 5 km of this corridor.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: AI Explainer: "ei route keno" (Tier 3 Item 19) */}
        {activeTab === 'explainer' && activeRoute && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Explainable Decision Rationale
              </span>

            </div>

            {/* Plain-Language Explanation */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-emerald-500/40 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Tactical Optimization Summary
              </div>
              <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                {activeRoute.whyThisRoute.summary}
              </p>
            </div>

            {/* Operational Advantages */}
            <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/5 space-y-1.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                Operational Advantages
              </div>
              <ul className="space-y-1 text-[11px] text-neutral-300">
                {activeRoute.whyThisRoute.advantages.map((adv, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trade-offs */}
            <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/5 space-y-1.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                Considerations & Trade-offs
              </div>
              <ul className="space-y-1 text-[11px] text-neutral-300">
                {activeRoute.whyThisRoute.tradeOffs.map((tro, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold shrink-0">⚠</span>
                    <span>{tro}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 5: Communications Check (Tier 3 Item 16) */}
        {activeTab === 'comms' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-neutral-950 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  Mars Relay Orbiters Timetable
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  Direct Line-of-Sight OK
                </span>
              </div>
              <p className="text-[10.5px] text-neutral-400">
                Continuous UHF/X-band proximity links between EVA astronaut suit radios and orbiting Mars reconnaissance satellites.
              </p>
            </div>

            <div className="space-y-2">
              {orbiterPasses.map((orbiter, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between text-[11px]"
                >
                  <div>
                    <div className="font-bold text-white">{orbiter.name}</div>
                    <div className="text-[9.5px] text-neutral-400 font-mono mt-0.5">
                      Max Elevation: {orbiter.elevationDeg}° • Window: {orbiter.windowDuration}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                      in {orbiter.timeUntilPass}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5 text-[10.5px] text-neutral-400 font-mono">
              Earth Light-Time Delay: <strong className="text-white">14.2 minutes (Round-Trip 28.4m)</strong>. Direct-to-Earth (DTE) uplink available via 20-meter high-gain antenna on habitat base.
            </div>
          </div>
        )}

        {/* Tab 6: Export Tools & One-Page EVA Brief PDF (Tier 3 Item 17) */}
        {activeTab === 'export' && activeRoute && (
          <div className="space-y-3">
            <div className="text-[11px] text-neutral-300">
              Export the finalized traverse coordinates and life support telemetry for rover flight computers, handheld astronaut navigators, or mission control documentation.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportGeoJSON}
                className="p-3 rounded-xl bg-neutral-950 hover:bg-neutral-900 border border-cyan-500/40 flex items-center gap-2.5 text-left transition cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">Export GeoJSON</div>
                  <div className="text-[10px] text-neutral-400 font-mono">GIS standard feature layers</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportGPX}
                className="p-3 rounded-xl bg-neutral-950 hover:bg-neutral-900 border border-cyan-500/40 flex items-center gap-2.5 text-left transition cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">Export GPX Track</div>
                  <div className="text-[10px] text-neutral-400 font-mono">GPS trackpoints & elevations</div>
                </div>
              </button>
            </div>

            {/* ONE-PAGE EVA MISSION BRIEF PDF (Tier 3 Item 17) */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-orange-950/40 to-neutral-950 border border-orange-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-white text-xs">One-Page EVA Mission Brief PDF</span>
                </div>
                <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-500/40">
                  FLIGHT FORMAT
                </span>
              </div>

              <p className="text-[10.5px] text-neutral-300">
                Generates a flight-ready, 1-page EVA briefing sheet containing complete waypoint coordinates, terrain elevation charts, spacesuit consumable budgets, safety scores, and communications windows.
              </p>

              <button
                type="button"
                onClick={handlePrintMissionBrief}
                className="w-full py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center justify-center gap-2 transition text-xs shadow-md shadow-orange-950/60 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save 1-Page EVA Mission Brief PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-neutral-950 border-t border-white/10 flex items-center justify-between shrink-0 font-mono text-[10.5px]">
        <div className="flex items-center gap-2">
          {handleCancelRoute && (
            <button
              type="button"
              onClick={handleCancelRoute}
              className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/50 flex items-center gap-1.5 transition font-sans font-bold cursor-pointer shadow-sm active:scale-95"
              title="Cancel and reset this route"
            >
              <X className="w-3.5 h-3.5 text-red-400" />
              <span>Cancel Route</span>
            </button>
          )}

          <button
            type="button"
            onClick={onFlyToRoute}
            className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/30"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Fit Route on Map</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition font-sans font-semibold cursor-pointer shadow-sm"
        >
          Close
        </button>
      </div>
    </div>
  </div>
  );
};
