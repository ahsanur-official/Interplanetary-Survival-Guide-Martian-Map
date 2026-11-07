import React, { useState, useMemo } from 'react';
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
<<<<<<< HEAD
  Languages,
  Camera,
  Battery,
  Users,
  User,
  Truck,
  Droplets,
=======
  Languages
>>>>>>> 1809cdbd6f24b128d8041df8ce7cf6fc528aad47
} from 'lucide-react';
import {
  PlannedRouteResult,
  RouteMode,
  PlannedWaypoint,
  ScienceStopSuggestion,
<<<<<<< HEAD
  MarsTransportModeType,
  CrewBuddyConfigType,
  calculateAStarRoute,
  calculateEmergencyReturnRoute,
} from '../../engine/marsAStarRouter';
import { NasaSurfacePovImage } from '../../types/mars';
=======
  calculateAStarRoute,
  calculateEmergencyReturnRoute,
} from '../../engine/marsAStarRouter';
>>>>>>> 1809cdbd6f24b128d8041df8ce7cf6fc528aad47
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
<<<<<<< HEAD
  onLoadDemoScenario: (scenarioType?: 'jezero' | 'boxwork') => void;
  onFlyToRoute: () => void;
  onOpenPovImage?: (pov: NasaSurfacePovImage, waypointName?: string, elevationM?: number) => void;
  transportMode?: MarsTransportModeType;
  onChangeTransportMode?: (mode: MarsTransportModeType) => void;
  crewConfig?: CrewBuddyConfigType;
  onChangeCrewConfig?: (config: CrewBuddyConfigType) => void;
=======
  onLoadDemoScenario: () => void;
  onFlyToRoute: () => void;
>>>>>>> 1809cdbd6f24b128d8041df8ce7cf6fc528aad47
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
<<<<<<< HEAD
  onOpenPovImage,
  transportMode = 'foot',
  onChangeTransportMode,
  crewConfig = 'buddy_pair',
  onChangeCrewConfig,
=======
>>>>>>> 1809cdbd6f24b128d8041df8ce7cf6fc528aad47
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'stops' | 'explainer' | 'comms' | 'export'>('overview');
  const [explainerLang, setExplainerLang] = useState<'en' | 'bn'>('en');
  const [hoveredProfileIndex, setHoveredProfileIndex] = useState<number | null>(null);

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
<<<<<<< HEAD
    <div className="fixed inset-0 sm:inset-auto sm:top-14 sm:left-4 sm:bottom-4 z-40 pointer-events-auto bg-[#070b14]/96 backdrop-blur-2xl border border-cyan-500/40 rounded-none sm:rounded-2xl shadow-2xl shadow-black/95 flex flex-col text-neutral-200 w-full sm:w-[460px] lg:w-[500px] overflow-hidden font-sans text-xs" role="dialog" aria-modal="true" aria-labelledby="mars-route-planner-title">
=======
    <div className="fixed inset-0 sm:inset-auto sm:top-14 sm:left-4 sm:bottom-4 z-40 pointer-events-auto bg-[#070b14]/96 backdrop-blur-2xl border border-cyan-500/40 rounded-none sm:rounded-2xl shadow-2xl shadow-black/95 flex flex-col text-neutral-200 w-full sm:w-[460px] lg:w-[500px] overflow-hidden font-sans text-xs">
>>>>>>> 1809cdbd6f24b128d8041df8ce7cf6fc528aad47
      {/* Top Header */}
      <div className="p-3 sm:p-3.5 bg-neutral-950/90 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-600/30 to-blue-500/20 border border-cyan-500/50 text-cyan-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-xs tracking-wide">
<<<<<<< HEAD
                <span id="mars-route-planner-title">Mars EVA A* Route Planner</span>
=======
                Mars EVA A* Route Planner
>>>>>>> 1809cdbd6f24b128d8041df8ce7cf6fc528aad47
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-semibold">
                3 Modes
              </span>
            </div>
            <div className="text-[10.5px] text-neutral-400">
              Multi-objective terrain slope & consumable optimization
            </div>
          </div>
        </div>

<<<<<<< HEAD
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* Demo Scenario Selectors */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onLoadDemoScenario('jezero')}
              className="px-2 py-0.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/40 font-mono text-[9.5px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
              title="Load Jezero Crater Delta sample fetch scenario"
            >
              <Sparkles className="w-2.5 h-2.5 text-orange-400" />
              <span>Jezero Delta</span>
            </button>

            <button
              type="button"
              onClick={() => onLoadDemoScenario('boxwork')}
              className="px-2 py-0.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-mono text-[9.5px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
              title="Load NASA Curiosity 2025 Boxwork Formations Expedition scenario"
            >
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              <span>Boxwork (2025)</span>
            </button>
          </div>
=======
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onLoadDemoScenario}
            className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
            title="Load authentic Jezero Crater Delta sample fetch scenario"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Demo</span>
          </button>
>>>>>>> 1809cdbd6f24b128d8041df8ce7cf6fc528aad47

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

<<<<<<< HEAD
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

=======
>>>>>>> 1809cdbd6f24b128d8041df8ce7cf6fc528aad47
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
      <div className="flex border-b border-white/10 px-3 pt-2 gap-3 text-[11px] font-semibold overflow-x-auto shrink-0 bg-neutral-950/50">
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
<<<<<<< HEAD

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
=======
>>>>>>> 1809cdbd6f24b128d8041df8ce7cf6fc528aad47
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
<<<<<<< HEAD
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
=======
>>>>>>> 1809cdbd6f24b128d8041df8ce7cf6fc528aad47
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
<<<<<<< HEAD
              The engine automatically detects high-value planetary science deposits (clays, ancient deltas, ground ice, and boxwork formations) along your route corridor.
=======
              The engine automatically detects high-value planetary science deposits (clays, ancient deltas, ground ice) along your route corridor.
>>>>>>> 1809cdbd6f24b128d8041df8ce7cf6fc528aad47
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

<<<<<<< HEAD
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
=======
                      <button
                        type="button"
                        onClick={() => onAddScienceStop(stop)}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer shadow"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Stop</span>
                      </button>
>>>>>>> 1809cdbd6f24b128d8041df8ce7cf6fc528aad47
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

              {/* Language Switcher (EN vs BN) */}
              <button
                type="button"
                onClick={() => setExplainerLang(explainerLang === 'en' ? 'bn' : 'en')}
                className="px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10.5px] font-mono font-bold text-cyan-300 flex items-center gap-1 cursor-pointer border border-neutral-700"
              >
                <Languages className="w-3 h-3" />
                <span>{explainerLang === 'en' ? 'বাংলায় দেখুন' : 'View in English'}</span>
              </button>
            </div>

            {/* Plain-Language Explanation */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-emerald-500/40 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                {explainerLang === 'en' ? 'Tactical Optimization Summary' : 'কৌশলগত রুট পর্যালোচনা'}
              </div>
              <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                {explainerLang === 'en' ? activeRoute.whyThisRoute.summary : activeRoute.whyThisRoute.summaryBn}
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
        <button
          type="button"
          onClick={onFlyToRoute}
          className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1 font-semibold"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Fit Route on Map</span>
        </button>

        <span className="text-neutral-500">MarsWay A* Engine</span>
      </div>
    </div>
  );
};
