import React, { useState, useMemo } from 'react';
import {
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Layers,
  Radio,
  Sparkles,
  Search,
  Compass,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  ExternalLink,
  Satellite,
  Volume2,
  VolumeX,
  Droplets,
  Wind,
  ShieldAlert,
  CloudRain,
  Mountain,
  Footprints,
  Globe2,
  TrendingUp,
  Thermometer,
  RotateCcw,
  Camera,
  ArrowUpRight,
  Filter,
  Check,
  Globe,
  Sliders,
  Maximize2,
  Mic,
} from 'lucide-react';
import { MARS_MISSIONS_DATA, MarsMission, MissionType } from '../../data/marsMissions';
import { ALL_MARS_FEATURES, MarsFeature } from '../../data/marsNomenclature';
import { MarsRegion } from '../../data/marsRegions';
import { MarsSite } from './RealMarsMap';
import { MarsOrbitalTelemetry, MarsLiveWeather, NASAImageTelemetry } from '../../engine/nasaMarsService';
import { marsSonification } from '../../engine/marsSonification';

export type BottomSheetTab = 'missions' | 'layers' | 'landmarks' | 'tools' | 'weather' | null;

export interface MarsMissionBottomSheetProps {
  activeTab: BottomSheetTab;
  onTabChange: (tab: BottomSheetTab) => void;
  // Basemap & Surface clarity
  activeLayer: 'themis' | 'viking' | 'mola' | 'opm';
  onSelectLayer: (layer: 'themis' | 'viking' | 'mola' | 'opm') => void;
  surfaceFilter: 'normal' | 'contrast' | 'sharp' | 'dark' | 'night';
  onSelectFilter: (filter: 'normal' | 'contrast' | 'sharp' | 'dark' | 'night') => void;
  // Overlays
  showGraticule: boolean;
  onToggleGraticule: (show: boolean) => void;
  showRegions: boolean;
  onToggleRegions: (show: boolean) => void;
  showDustStormOverlay: boolean;
  onToggleDustStorm: () => void;
  showMolaAvailabilityOverlay: boolean;
  onToggleMolaAvailability: () => void;
  showAtmosphereOverlay?: boolean;
  onToggleAtmosphere?: () => void;
  // Place category filter
  placeCategoryFilter: 'all' | 'mons' | 'crater' | 'chasma' | 'vallis' | 'planitia' | 'mission';
  onSelectCategoryFilter: (filter: 'all' | 'mons' | 'crater' | 'chasma' | 'vallis' | 'planitia' | 'mission') => void;
  // Navigation & Fly-To
  onFlyToLocation: (lat: number, lng: number, zoom?: number, name?: string, elevationM?: number) => void;
  onFlyToSite: (site: MarsSite) => void;
  onSwitchToAstronaut?: () => void;
  // Tool triggers
  onOpenEarthScale: (marsFeatureId?: string) => void;
  onOpenElevationProfile: () => void;
  onOpenScienceDossier: () => void;
  onOpenHumanBasePlan: () => void;
  onOpenMeasureTool: () => void;
  onOpenNASACloseUp: (targetName: string) => void;
  onOpenSearch: () => void;
  onOpenAI: () => void;
  onOpenVoice: () => void;
  // Route planning
  isRoutePlanningActive: boolean;
  onToggleRoutePlanning: () => void;
  routeWaypointsCount: number;
  onClearRoute: () => void;
  // Telemetry & Weather
  ephemeris: MarsOrbitalTelemetry;
  currentWeather: MarsLiveWeather | null;
  roverPhotos: NASAImageTelemetry[];
}

export const MarsMissionBottomSheet: React.FC<MarsMissionBottomSheetProps> = ({
  activeTab,
  onTabChange,
  activeLayer,
  onSelectLayer,
  surfaceFilter,
  onSelectFilter,
  showGraticule,
  onToggleGraticule,
  showRegions,
  onToggleRegions,
  showDustStormOverlay,
  onToggleDustStorm,
  showMolaAvailabilityOverlay,
  onToggleMolaAvailability,
  showAtmosphereOverlay = false,
  onToggleAtmosphere,
  placeCategoryFilter,
  onSelectCategoryFilter,
  onFlyToLocation,
  onFlyToSite,
  onSwitchToAstronaut,
  onOpenEarthScale,
  onOpenElevationProfile,
  onOpenScienceDossier,
  onOpenHumanBasePlan,
  onOpenMeasureTool,
  onOpenNASACloseUp,
  onOpenSearch,
  onOpenAI,
  onOpenVoice,
  isRoutePlanningActive,
  onToggleRoutePlanning,
  routeWaypointsCount,
  onClearRoute,
  ephemeris,
  currentWeather,
  roverPhotos,
}) => {
  // Mission Explorer state inside bottom sheet
  const [selectedMission, setSelectedMission] = useState<MarsMission>(MARS_MISSIONS_DATA[0]);
  const [missionFilterType, setMissionFilterType] = useState<MissionType | 'all'>('all');
  const [missionSearch, setMissionSearch] = useState<string>('');
  const [currentWaypointIdx, setCurrentWaypointIdx] = useState<number>(0);
  const [isPlayingTraverse, setIsPlayingTraverse] = useState<boolean>(false);

  // Landmark search state inside bottom sheet
  const [landmarkSearch, setLandmarkSearch] = useState<string>('');

  // Weather station
  const [weatherStation, setWeatherStation] = useState<'perseverance' | 'insight'>('perseverance');

  // Filtered missions
  const filteredMissions = useMemo(() => {
    return MARS_MISSIONS_DATA.filter((m) => {
      if (missionFilterType !== 'all' && m.type !== missionFilterType) return false;
      if (missionSearch.trim()) {
        const q = missionSearch.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.agency.toLowerCase().includes(q) ||
          (m.landingSiteName && m.landingSiteName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [missionFilterType, missionSearch]);

  // Filtered landmarks
  const filteredLandmarks = useMemo(() => {
    let list = ALL_MARS_FEATURES;
    if (placeCategoryFilter !== 'all') {
      list = list.filter((f) => {
        const typeLower = (f.type || '').toLowerCase();
        if (placeCategoryFilter === 'mons') return typeLower.includes('mons') || typeLower.includes('volcano');
        if (placeCategoryFilter === 'crater') return typeLower.includes('crater');
        if (placeCategoryFilter === 'chasma') return typeLower.includes('chasma') || typeLower.includes('canyon');
        if (placeCategoryFilter === 'vallis') return typeLower.includes('vallis') || typeLower.includes('valley');
        if (placeCategoryFilter === 'planitia') return typeLower.includes('planitia') || typeLower.includes('plain');
        if (placeCategoryFilter === 'mission') return typeLower.includes('rover') || typeLower.includes('lander');
        return true;
      });
    }
    if (landmarkSearch.trim()) {
      const q = landmarkSearch.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || (f.type || '').toLowerCase().includes(q));
    }
    return list.slice(0, 40); // Top matches for responsive performance
  }, [placeCategoryFilter, landmarkSearch]);

  // Handle waypoint click
  const handleWaypointClick = (wpIdx: number) => {
    if (!selectedMission.traverseTrack || selectedMission.traverseTrack.length === 0) return;
    const wp = selectedMission.traverseTrack[wpIdx];
    if (wp) {
      setCurrentWaypointIdx(wpIdx);
      onFlyToLocation(wp.lat, wp.lng, 9, `${selectedMission.name} — ${wp.name}`);
      if (wp.elevationM !== undefined) {
        marsSonification.sonifyLocation(wp.elevationM, 2);
      }
    }
  };

  const isExpanded = activeTab !== null;

  return (
    <>
      {/* EXPANDED BOTTOM SHEET BACKDROP */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-35 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={() => onTabChange(null)}
        />
      )}

      {/* EXPANDED BOTTOM SHEET PANEL */}
      {isExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mars Mission & Controls Bottom Sheet"
          className="fixed bottom-[56px] inset-x-0 z-40 max-w-4xl mx-auto w-full max-h-[72vh] sm:max-h-[68vh] bg-[#090d16]/98 backdrop-blur-2xl border-t border-x border-neutral-700/80 rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 text-neutral-200"
        >
          {/* Pull Handle / Drag Indicator */}
          <div
            className="pt-2.5 pb-1 flex justify-center cursor-pointer select-none group"
            onClick={() => onTabChange(null)}
            title="Click to collapse to map"
          >
            <div className="w-12 h-1.5 bg-neutral-600 group-hover:bg-neutral-400 rounded-full transition-colors" />
          </div>

          {/* Header with Title, Tab Switcher & Collapse Button */}
          <div className="px-4 sm:px-6 py-2.5 border-b border-neutral-800/80 bg-[#0c101d] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 shrink-0">
                {activeTab === 'missions' && <Radio className="w-4 h-4" />}
                {activeTab === 'layers' && <Layers className="w-4 h-4 text-emerald-400" />}
                {activeTab === 'landmarks' && <MapPin className="w-4 h-4 text-orange-400" />}
                {activeTab === 'tools' && <Sliders className="w-4 h-4 text-cyan-400" />}
                {activeTab === 'weather' && <Thermometer className="w-4 h-4 text-amber-400" />}
              </span>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                  {activeTab === 'missions' && 'Mars Missions & Rover Traverses'}
                  {activeTab === 'layers' && 'Basemaps, Surface Clarity & Overlays'}
                  {activeTab === 'landmarks' && 'Martian Nomenclature & Landmarks'}
                  {activeTab === 'tools' && 'Scientific Mission Analysis Tools'}
                  {activeTab === 'weather' && 'Martian Weather & Deep Space Telemetry'}
                </h3>
              </div>
            </div>

            {/* Collapse / Close Button */}
            <button
              onClick={() => onTabChange(null)}
              className="p-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium border border-neutral-700/80 shrink-0"
              title="Collapse to Map"
            >
              <ChevronDown className="w-4 h-4 text-neutral-400" />
              <span className="hidden sm:inline">Map View</span>
            </button>
          </div>

          {/* Scrollable Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            {/* ========================================================================= */}
            {/* TAB 1: MISSIONS & TRAVERSES                                              */}
            {/* ========================================================================= */}
            {activeTab === 'missions' && (
              <div className="space-y-4">
                {/* Search & Type Filter Row */}
                <div className="flex items-center gap-2 flex-wrap justify-between">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search rovers, landers, agencies..."
                      value={missionSearch}
                      onChange={(e) => setMissionSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-xl border border-neutral-800">
                    {(['all', 'rover', 'lander', 'orbiter'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setMissionFilterType(t)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize cursor-pointer transition ${
                          missionFilterType === t
                            ? 'bg-orange-600 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {t === 'all' ? 'All' : `${t}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Key Missions Quick-Jump Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { id: 'perseverance', label: 'Perseverance' },
                    { id: 'curiosity', label: 'Curiosity' },
                    { id: 'opportunity', label: 'Opportunity' },
                    { id: 'spirit', label: 'Spirit' },
                    { id: 'zhurong', label: 'Zhurong' },
                    { id: 'viking1', label: 'Viking 1' },
                    { id: 'insight', label: 'InSight' },
                  ].map((m) => {
                    const mission = MARS_MISSIONS_DATA.find((item) => item.id === m.id);
                    if (!mission) return null;
                    const isSelected = selectedMission.id === mission.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedMission(mission);
                          setCurrentWaypointIdx(0);
                          if (mission.lat !== undefined && mission.lng !== undefined) {
                            onFlyToLocation(mission.lat, mission.lng, 7, mission.name);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border shrink-0 ${
                          isSelected
                            ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                            : 'bg-neutral-900/90 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>

                {/* Active Mission Spotlight Card */}
                {selectedMission && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900/95 to-[#101726]/90 border border-neutral-800 space-y-3 shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                              selectedMission.status === 'active'
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80 font-bold'
                                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                selectedMission.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
                              }`}
                            />
                            {selectedMission.statusDisplay}
                          </span>
                          <span className="text-neutral-400 text-[11px] font-mono">{selectedMission.agency}</span>
                        </div>
                        <h4 className="text-base font-bold text-white">{selectedMission.name}</h4>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {selectedMission.landingSiteName || selectedMission.orbitType || "Planetary Surface"} • Arrived {selectedMission.arrivalDate}
                        </p>
                      </div>

                      {/* Fly to Mission Button */}
                      {selectedMission.lat !== undefined && selectedMission.lng !== undefined && (
                        <button
                          onClick={() => {
                            onFlyToLocation(selectedMission.lat!, selectedMission.lng!, 7, selectedMission.name);
                            onTabChange(null); // Auto-collapse to let user see map
                          }}
                          className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer shrink-0"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Fly To</span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed">{selectedMission.objectives?.join(". ") || selectedMission.keyDiscoveries?.join(". ") || ""}</p>

                    {/* Traverse Track & Waypoint Stepper */}
                    {selectedMission.traverseTrack && selectedMission.traverseTrack.length > 0 && (
                      <div className="p-3 rounded-xl bg-black/40 border border-cyan-800/40 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Surface Traverse Track ({selectedMission.traverseTrack ? (selectedMission.traverseTrack.length * 1.2).toFixed(1) : "0"} km estimated)</span>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400">
                            WP {currentWaypointIdx + 1} of {selectedMission.traverseTrack.length}
                          </span>
                        </div>

                        {/* Waypoints horizontal scrubber */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                          {selectedMission.traverseTrack.map((wp, idx) => (
                            <button
                              key={wp.sol}
                              onClick={() => handleWaypointClick(idx)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap transition cursor-pointer border shrink-0 ${
                                currentWaypointIdx === idx
                                  ? 'bg-cyan-600 text-white border-cyan-400 font-bold shadow-sm'
                                  : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-white'
                              }`}
                            >
                              Sol {wp.sol} • {wp.name.split('—')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Discoveries */}
                    {selectedMission.keyDiscoveries && selectedMission.keyDiscoveries.length > 0 && (
                      <div>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                          Key Planetary Discoveries
                        </span>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-neutral-300">
                          {selectedMission.keyDiscoveries.map((d, i) => (
                            <li key={i} className="flex items-start gap-1.5 bg-neutral-900/70 p-2 rounded-lg border border-neutral-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-snug">{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: BASEMAPS, SURFACE CLARITY & OVERLAYS                              */}
            {/* ========================================================================= */}
            {activeTab === 'layers' && (
              <div className="space-y-5">
                {/* Global Basemaps Grid */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block font-bold">
                    Primary Global Basemaps
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        id: 'themis' as const,
                        name: 'NASA THEMIS 100m High-Res IR',
                        desc: 'Mars Odyssey daytime thermal infrared mosaic (~100m/pixel). Crisp global clarity.',
                        badge: '100m IR',
                      },
                      {
                        id: 'viking' as const,
                        name: 'NASA Viking True-Color Mars',
                        desc: 'Dual-camera natural true-color composite showing vivid rust & dune tones.',
                        badge: 'Natural Color',
                      },
                      {
                        id: 'mola' as const,
                        name: 'NASA MGS MOLA Topographic Relief',
                        desc: 'Color-coded elevation shading displaying volcano altitudes & canyon depths.',
                        badge: 'Elevation Relief',
                      },
                      {
                        id: 'opm' as const,
                        name: 'OpenPlanetary USGS Cartographic',
                        desc: 'Clean cartographic vector-and-raster composite from USGS Astrogeology.',
                        badge: 'USGS Basemap',
                      },
                    ].map((layer) => {
                      const isSelected = activeLayer === layer.id;
                      return (
                        <div
                          key={layer.id}
                          onClick={() => {
                            onSelectLayer(layer.id);
                            onTabChange(null); // Auto-collapse to map
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? 'bg-orange-950/60 border-orange-500 shadow-md shadow-orange-950/40 text-white'
                              : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:bg-neutral-800/80'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-orange-400' : 'text-neutral-600'}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs truncate">{layer.name}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-orange-300 border border-neutral-700">
                                {layer.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{layer.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Surface Clarity Filters */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block font-bold">
                    Surface Lighting & Clarity Filters
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'normal' as const, label: 'Normal' },
                      { id: 'contrast' as const, label: 'Contrast Boost' },
                      { id: 'sharp' as const, label: 'Sharp Ridge' },
                      { id: 'dark' as const, label: 'Dark Basalt' },
                      { id: 'night' as const, label: 'Night IR' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          onSelectFilter(f.id);
                          onTabChange(null);
                        }}
                        className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                          surfaceFilter === f.id
                            ? 'bg-orange-600 text-white border-orange-400 shadow-md'
                            : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overlays & Simulation Controls */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block font-bold">
                    Planetary Overlays & Simulations
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Graticule */}
                    <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white block">Coordinate Graticule</span>
                        <span className="text-[10px] text-neutral-400">Latitude & Longitude grid lines (15° steps)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showGraticule}
                        onChange={(e) => onToggleGraticule(e.target.checked)}
                        className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
                      />
                    </div>

                    {/* Regional Boundaries */}
                    <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white block">Geological Area Boundaries</span>
                        <span className="text-[10px] text-neutral-400">USGS 30 Quadrangle & Geological Provinces</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showRegions}
                        onChange={(e) => onToggleRegions(e.target.checked)}
                        className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
                      />
                    </div>

                    {/* Dust Storm Simulation */}
                    <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">Dust Storm & Optical Depth</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        </div>
                        <span className="text-[10px] text-neutral-400">Simulate atmospheric opacity (Tau) on solar arrays</span>
                      </div>
                      <button
                        onClick={onToggleDustStorm}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          showDustStormOverlay
                            ? 'bg-amber-500 text-black shadow'
                            : 'bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {showDustStormOverlay ? 'Active' : 'Off'}
                      </button>
                    </div>

                    {/* MOLA Elevation Availability */}
                    <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">MOLA Elevation Data Heatmap</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        </div>
                        <span className="text-[10px] text-neutral-400">High-resolution DTM availability across quadrangles</span>
                      </div>
                      <button
                        onClick={onToggleMolaAvailability}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          showMolaAvailabilityOverlay
                            ? 'bg-cyan-500 text-black shadow'
                            : 'bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {showMolaAvailabilityOverlay ? 'Active' : 'Off'}
                      </button>
                    </div>

                    {/* Atmospheric Pressure & Surface Temperature */}
                    <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">Atmospheric Pressure & Temperature</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        </div>
                        <span className="text-[10px] text-neutral-400">Isobars, isotherms & weather telemetry at landing sites</span>
                      </div>
                      <button
                        onClick={onToggleAtmosphere}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          showAtmosphereOverlay
                            ? 'bg-blue-600 text-white shadow ring-1 ring-cyan-300'
                            : 'bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {showAtmosphereOverlay ? 'Active' : 'Off'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: LANDMARKS & CARTOGRAPHY                                           */}
            {/* ========================================================================= */}
            {activeTab === 'landmarks' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search craters, volcanoes, canyons..."
                    value={landmarkSearch}
                    onChange={(e) => setLandmarkSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Category Filter Pills (Zero Pill collision: clean segmented buttons) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { id: 'all' as const, label: '🌐 All Places' },
                    { id: 'mons' as const, label: '🌋 Volcanoes' },
                    { id: 'crater' as const, label: '☄️ Craters' },
                    { id: 'chasma' as const, label: '🏜️ Canyons' },
                    { id: 'planitia' as const, label: '🪐 Plains' },
                    { id: 'mission' as const, label: '🚀 Missions' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => onSelectCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                        placeCategoryFilter === cat.id
                          ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                          : 'bg-neutral-900/90 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Filtered Landmarks Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                  {filteredLandmarks.map((feature) => (
                    <div
                      key={feature.id}
                      onClick={() => {
                        onFlyToLocation(feature.lat, feature.lng, 6, feature.name, feature.elevationM);
                        onTabChange(null); // Auto collapse to let user view map
                      }}
                      className="p-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-orange-500/80 transition cursor-pointer flex items-center justify-between group shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs group-hover:text-orange-400 transition-colors truncate">
                            {feature.name}
                          </span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-neutral-800 text-neutral-400 shrink-0">
                            {feature.type}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                          {feature.lat >= 0 ? `${feature.lat.toFixed(1)}°N` : `${Math.abs(feature.lat).toFixed(1)}°S`},{' '}
                          {feature.lng >= 0 ? `${feature.lng.toFixed(1)}°E` : `${Math.abs(feature.lng).toFixed(1)}°W`}
                          {feature.elevationM !== undefined && (
                            <span className="ml-2 text-cyan-400 font-semibold">{feature.elevationM}m</span>
                          )}
                        </div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-orange-500/20 group-hover:text-orange-400 text-neutral-500 transition shrink-0">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: SCIENTIFIC MISSION ANALYSIS TOOLS                                  */}
            {/* ========================================================================= */}
            {activeTab === 'tools' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Astronaut Surface EVA 3D Simulation */}
                {onSwitchToAstronaut && (
                  <button
                    onClick={() => {
                      onSwitchToAstronaut();
                      onTabChange(null);
                    }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/90 to-blue-950/90 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/60 hover:border-cyan-400 text-left transition cursor-pointer group shadow-lg sm:col-span-2"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 group-hover:scale-105 transition-transform">
                        <Footprints className="w-5 h-5 text-cyan-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-xs sm:text-sm">Astronaut Surface EVA Simulation (3D First-Person)</h4>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-neutral-950 text-[10px] font-mono font-bold">
                            NEW
                          </span>
                        </div>
                        <span className="text-[10px] text-cyan-300 font-mono">Real Tactical Satellite Map • 6-DOF Movement • Bilingual Voice Control</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-snug">
                      Step onto the Martian surface with realistic spacesuit visor HUD, live tactical satellite map, 6-DOF movement (সামনে, ডানে, বামে, পেছনে, উপরে, নিচে), laser LIBS spectrometer, rock sample caching, and voice recognition in English & Bengali.
                    </p>
                  </button>
                )}

                {/* Elevation Profile Transect */}
                <button
                  onClick={() => {
                    onOpenElevationProfile();
                    onTabChange(null);
                  }}
                  className="p-4 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-orange-500/60 text-left transition cursor-pointer group shadow-md"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-orange-950/80 text-orange-400 border border-orange-800/60 group-hover:scale-105 transition-transform">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm">MGS MOLA Elevation Profile</h4>
                      <span className="text-[10px] text-neutral-400">Laser altimeter 2-point transect analysis</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Click any two locations on Mars to generate a high-definition elevation slice, relief drop, and terrain steepness chart.
                  </p>
                </button>

                {/* Earth vs Mars Physical Scale Comparison */}
                <button
                  onClick={() => {
                    onOpenEarthScale();
                    onTabChange(null);
                  }}
                  className="p-4 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-cyan-500/60 text-left transition cursor-pointer group shadow-md"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 group-hover:scale-105 transition-transform">
                      <Globe2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm">Earth vs. Mars Scale Comparison</h4>
                      <span className="text-[10px] text-cyan-400">Esri Explore Mars physical scale overlay</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Compare the physical sizes of Olympus Mons vs Mount Everest, and Valles Marineris spanning the entire continental United States.
                  </p>
                </button>

                {/* Water, Atmosphere & Planetary Safety Dossier */}
                <button
                  onClick={() => {
                    onOpenScienceDossier();
                    onTabChange(null);
                  }}
                  className="p-4 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-cyan-500/60 text-left transition cursor-pointer group shadow-md"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/60 group-hover:scale-105 transition-transform">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm">Subsurface Water & Atmosphere Dossier</h4>
                      <span className="text-[10px] text-blue-300">SHARAD ground radar & gas partial pressures</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Inspect ice depths, triple-point liquid water phase physics, radiation shielding thickness, and rover trafficability.
                  </p>
                </button>

                {/* Human Base Planning */}
                <button
                  onClick={() => {
                    onOpenHumanBasePlan();
                    onTabChange(null);
                  }}
                  className="p-4 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-emerald-500/60 text-left transition cursor-pointer group shadow-md"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 group-hover:scale-105 transition-transform">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm">Human Base Candidate Planning</h4>
                      <span className="text-[10px] text-emerald-300">In-situ resource utilization (ISRU)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Multi-criteria evaluation for future crewed Martian surface outposts at Arcadia Planitia, Deuteronilus Mensae, and Mawrth Vallis.
                  </p>
                </button>

                {/* Interactive Rover Route Planner */}
                <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-white text-xs sm:text-sm">Interactive Traverse Planner</span>
                    </div>
                    <button
                      onClick={onToggleRoutePlanning}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isRoutePlanningActive
                          ? 'bg-cyan-500 text-neutral-950 shadow-md'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 hover:bg-cyan-900'
                      }`}
                    >
                      {isRoutePlanningActive ? 'Plotting Active (Click Map)' : 'Start Plotting'}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Click anywhere on the Mars surface to drop waypoints, measure geodesic ground distance in km, and simulate traverse routes.
                  </p>
                  {routeWaypointsCount > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
                      <span className="text-cyan-300 font-mono text-[11px]">{routeWaypointsCount} waypoints logged</span>
                      <button
                        onClick={onClearRoute}
                        className="text-neutral-400 hover:text-red-400 text-[11px] underline cursor-pointer"
                      >
                        Clear Route
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: WEATHER & NASA RAW TELEMETRY                                      */}
            {/* ========================================================================= */}
            {activeTab === 'weather' && (
              <div className="space-y-4">
                {/* Real-time Earth-Mars Interplanetary Link Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-[#0e1628] border border-cyan-800/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                      <Satellite className="w-4 h-4 text-cyan-400" />
                      <span>NASA Deep Space Network (DSN) Orbital Link</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE EPHEMERIS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-black/40 p-2.5 rounded-xl border border-neutral-800">
                      <span className="text-neutral-400 text-[9px] block">EARTH-MARS DISTANCE</span>
                      <span className="text-white font-bold text-xs">{ephemeris.earthMarsDistanceKm.toLocaleString()} km</span>
                      <span className="text-cyan-300/80 text-[10px] block">({ephemeris.earthMarsDistanceAU.toFixed(3)} AU)</span>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded-xl border border-neutral-800">
                      <span className="text-neutral-400 text-[9px] block">RADIO LIGHT-LAG (ONE-WAY)</span>
                      <span className="text-amber-300 font-bold text-xs">
                        {ephemeris.lightTravelTimeMinutes}m {ephemeris.lightTravelTimeSeconds}s
                      </span>
                      <span className="text-neutral-400 text-[10px] block">
                        round-trip: ~{ephemeris.lightTravelTimeMinutes * 2}m
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono bg-black/30 p-2 rounded-xl border border-neutral-800/80">
                    <div>
                      <span className="text-neutral-400 block text-[9px]">SOLAR LONGITUDE (Ls)</span>
                      <span className="text-orange-300 font-bold">{ephemeris.solarLongitudeLs.toFixed(1)}°</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[9px]">MARTIAN SEASON</span>
                      <span className="text-neutral-200 font-semibold truncate block">{ephemeris.marsSeason.split('/')[0]}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[9px]">PERSEVERANCE SOL</span>
                      <span className="text-cyan-300 font-bold">Sol {ephemeris.perseveranceSol}</span>
                    </div>
                  </div>
                </div>

                {/* Weather Station Selector */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWeatherStation('perseverance')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      weatherStation === 'perseverance'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    Perseverance MEDA (Jezero Crater)
                  </button>
                  <button
                    onClick={() => setWeatherStation('insight')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      weatherStation === 'insight'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    InSight TWINS (Elysium Planitia)
                  </button>
                </div>

                {/* NASA Raw Rover Photo Stream Preview */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-orange-400" />
                      <span>NASA Rover Raw Image Stream</span>
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">NASA Open API</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {roverPhotos.slice(0, 6).map((photo) => (
                      <div
                        key={photo.id}
                        className="rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 group relative aspect-video cursor-pointer"
                        onClick={() => onOpenNASACloseUp(photo.cameraFullName || 'Jezero Crater')}
                      >
                        <img
                          src={photo.imgSrc}
                          alt={photo.cameraFullName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/80 backdrop-blur-sm text-[9px] font-mono text-neutral-300 truncate">
                          {photo.cameraName} • Sol {photo.sol}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COLLAPSIBLE BOTTOM PEEK BAR / DOCK                                       */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-auto select-none">
        <nav
          aria-label="MarsWay Navigation & Mission Tools Dock"
          className="bg-[#070b14]/92 backdrop-blur-2xl border-t border-white/[0.08] px-2 sm:px-4 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-1 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"
        >
          {/* Tab 1: Missions */}
          <button
            type="button"
            onClick={() => onTabChange(activeTab === 'missions' ? null : 'missions')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer min-h-[46px] active:scale-95 ${
              activeTab === 'missions' ? 'text-orange-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-all ${
                activeTab === 'missions'
                  ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/50 shadow-sm'
                  : ''
              }`}
            >
              <Radio className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Missions</span>
          </button>

          {/* Tab 2: Layers & Basemaps */}
          <button
            type="button"
            onClick={() => onTabChange(activeTab === 'layers' ? null : 'layers')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer min-h-[46px] active:scale-95 ${
              activeTab === 'layers' ? 'text-emerald-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-all ${
                activeTab === 'layers'
                  ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50 shadow-sm'
                  : ''
              }`}
            >
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Layers</span>
          </button>

          {/* Tab 3: Landmarks & Categories */}
          <button
            type="button"
            onClick={() => onTabChange(activeTab === 'landmarks' ? null : 'landmarks')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer min-h-[46px] active:scale-95 ${
              activeTab === 'landmarks' ? 'text-orange-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-all ${
                activeTab === 'landmarks'
                  ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/50 shadow-sm'
                  : ''
              }`}
            >
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Places</span>
          </button>

          {/* Tab 4: Tools (Elevation, Earth Scale, Water) */}
          <button
            type="button"
            onClick={() => onTabChange(activeTab === 'tools' ? null : 'tools')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer min-h-[46px] active:scale-95 ${
              activeTab === 'tools' ? 'text-cyan-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-all ${
                activeTab === 'tools'
                  ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/50 shadow-sm'
                  : ''
              }`}
            >
              <Sliders className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Tools</span>
          </button>

          {/* Tab 5: Weather */}
          <button
            type="button"
            onClick={() => onTabChange(activeTab === 'weather' ? null : 'weather')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer min-h-[46px] active:scale-95 ${
              activeTab === 'weather' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-all ${
                activeTab === 'weather'
                  ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50 shadow-sm'
                  : ''
              }`}
            >
              <Thermometer className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Weather</span>
          </button>

          {/* Divider */}
          <div className="w-[1px] h-6 bg-white/10 mx-0.5" />

          {/* Quick Action: Search */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-h-[46px] text-neutral-400 hover:text-white active:scale-95"
            title="Search Martian features"
          >
            <div className="p-1 rounded-lg">
              <Search className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Search</span>
          </button>

          {/* Quick Action: Ask AI */}
          <button
            type="button"
            onClick={onOpenAI}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-h-[46px] text-purple-300 hover:text-purple-100 active:scale-95"
            title="Ask MarsWay AI"
          >
            <div className="p-1 rounded-lg bg-purple-900/40">
              <Sparkles className="w-4 h-4 text-purple-300" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">AI</span>
          </button>

          {/* Quick Action: Voice Navigation */}
          <button
            type="button"
            onClick={onOpenVoice}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-h-[46px] text-cyan-300 hover:text-white active:scale-95"
            title="Voice Navigation & Mission Queries (Web Speech API)"
          >
            <div className="p-1 rounded-lg bg-cyan-950/60 border border-cyan-700/50">
              <Mic className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Voice</span>
          </button>
        </nav>
      </div>
    </>
  );
};
