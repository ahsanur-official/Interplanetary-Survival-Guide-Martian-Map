import { useState, useMemo } from 'react';
import {
  X,
  Target,
  Navigation,
  MapPin,
  Compass,
  Footprints,
  Car,
  TrendingUp,
  Mountain,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { calculateMarsDistanceKm } from '../../engine/spatialMath';
import { getMolaElevation, getMarsPressureMbar } from '../../engine/marsMolaElevation';
import { ALL_MARS_FEATURES, MarsFeature } from '../../data/marsNomenclature';
import { marsSonification } from '../../engine/marsSonification';

export interface MarsDestination {
  id: string;
  name: string;
  category: 'Scientific Site' | 'Rover Cache' | 'Volcanic Summit' | 'Canyon Floor' | 'Glacial Ice' | 'Custom Map Pin';
  lat: number;
  lng: number;
  elevationM: number;
  description: string;
  significance: string;
  recommendedZoom?: number;
}

export const PRESET_MARS_DESTINATIONS: MarsDestination[] = [
  {
    id: 'jezero_delta',
    name: 'Jezero Crater Delta (Perseverance Cache)',
    category: 'Rover Cache',
    lat: 18.4447,
    lng: 77.4509,
    elevationM: -2560,
    description: 'Ancient lacustrine river delta with sealed igneous and sedimentary core sample tubes cached for Earth return.',
    significance: 'Primary astrobiological search zone for ancient microbial biosignatures.',
    recommendedZoom: 8,
  },
  {
    id: 'mount_sharp_base',
    name: 'Mount Sharp / Aeolis Mons (Curiosity MSL)',
    category: 'Scientific Site',
    lat: -4.59,
    lng: 137.44,
    elevationM: -4450,
    description: '5.5 km tall central mound in Gale Crater exposing billions of years of stratified clay, sulfate, and lake sedimentary layers.',
    significance: 'Verified ancient neutral-pH habitable freshwater lakes and complex organics.',
    recommendedZoom: 7,
  },
  {
    id: 'olympus_mons_caldera',
    name: 'Olympus Mons Summit Caldera',
    category: 'Volcanic Summit',
    lat: 18.65,
    lng: -133.8,
    elevationM: 21229,
    description: 'The highest planetary peak in the solar system, crowned by a 80 km wide multi-collapse volcanic caldera complex.',
    significance: 'Extreme high-altitude shield volcanism with thin 0.8 mbar atmospheric pressure.',
    recommendedZoom: 6,
  },
  {
    id: 'valles_marineris_melas',
    name: 'Melas Chasma (Valles Marineris Floor)',
    category: 'Canyon Floor',
    lat: -9.8,
    lng: -76.4,
    elevationM: -3500,
    description: 'The deepest central canyon of the 4,000 km grand canyon system with layered sulphate deposits and landslide megabreccia.',
    significance: 'Exposes deep Martian crustal cross-sections and ancient groundwater seepage.',
    recommendedZoom: 6,
  },
  {
    id: 'korolev_glacier',
    name: 'Korolev Crater Pure Water-Ice Glacier',
    category: 'Glacial Ice',
    lat: 73.0,
    lng: 165.0,
    elevationM: -3900,
    description: '81 km wide impact crater in the northern lowlands trapping a 1.8 km thick permanent reservoir of 2,200 km³ pure water ice.',
    significance: 'Massive unpolluted surface water ice sheet kept frozen by a natural cold-trap microclimate.',
    recommendedZoom: 7,
  },
  {
    id: 'meridiani_hematite',
    name: 'Meridiani Planum (Opportunity Spherules)',
    category: 'Scientific Site',
    lat: -1.95,
    lng: -5.53,
    elevationM: -1440,
    description: 'Extensive gray crystalline hematite plains where Opportunity discovered millimeter-sized mineral spherules ("blueberries").',
    significance: 'Unambiguous sedimentary proof of acidic ancient groundwater percolation.',
    recommendedZoom: 7,
  },
  {
    id: 'arcadia_ice_sheet',
    name: 'Arcadia Planitia Subsurface Glacial Ice',
    category: 'Glacial Ice',
    lat: 39.3,
    lng: -170.3,
    elevationM: -3800,
    description: 'Flat volcanic plains underlain by pure sheet ice just 1 to 2.5 meters beneath the desiccated basalt dust regolith.',
    significance: 'Top candidate for human landing infrastructure due to accessible drinking water and propellant synthesis.',
    recommendedZoom: 6,
  },
  {
    id: 'utopia_zhurong',
    name: 'Southern Utopia Planitia (Zhurong Site)',
    category: 'Scientific Site',
    lat: 25.07,
    lng: 109.93,
    elevationM: -4100,
    description: 'Expansive sedimentary basin with polygon ground patterns and underground layers detected by ground-penetrating radar.',
    significance: 'Possible shoreline of an ancient northern ocean with catastrophic sedimentary flood deposits.',
    recommendedZoom: 6,
  },
  {
    id: 'insight_elysium',
    name: 'Elysium Planitia Geophysics Base (InSight)',
    category: 'Scientific Site',
    lat: 4.5,
    lng: 135.62,
    elevationM: -2613,
    description: 'Smooth equatorial plain where the SEIS seismometer recorded over 1,300 marsquakes and Cerberus Fossae magma activity.',
    significance: 'Provided the first seismic map of Mars crust, mantle, and molten metallic core.',
    recommendedZoom: 7,
  },
  {
    id: 'ares_vallis_pathfinder',
    name: 'Ares Vallis Flood Plain (Pathfinder & Sojourner)',
    category: 'Scientific Site',
    lat: 19.33,
    lng: -33.55,
    elevationM: -3650,
    description: 'Catastrophic ancient mega-flood depositional fan strewn with imbricated boulders from ancient southern highlands.',
    significance: 'First successful micro-rover deployment exploring diverse rock conglomerate lithologies.',
    recommendedZoom: 7,
  },
];

interface MarsDestinationToolProps {
  isOpen: boolean;
  onClose: () => void;
  activeDestination: MarsDestination | null;
  onSelectDestination: (dest: MarsDestination) => void;
  onClearDestination: () => void;
  isMapPickMode: boolean;
  onToggleMapPickMode: () => void;
  currentOrigin?: { lat: number; lng: number; name?: string };
  onFlyToDestination: (lat: number, lng: number, zoom?: number, name?: string) => void;
  onPlotRouteToDestination: (dest: MarsDestination) => void;
}

export function MarsDestinationTool({
  isOpen,
  onClose,
  activeDestination,
  onSelectDestination,
  onClearDestination,
  isMapPickMode,
  onToggleMapPickMode,
  currentOrigin = { lat: 18.38, lng: 77.58, name: 'Perseverance (Jezero)' },
  onFlyToDestination,
  onPlotRouteToDestination,
}: MarsDestinationToolProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Filter preset destinations
  const filteredPresets = useMemo(() => {
    let list = PRESET_MARS_DESTINATIONS;
    if (selectedCategory !== 'All') {
      list = list.filter((d) => d.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.significance.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery, selectedCategory]);

  // Compute live metrics for active destination
  const activeMetrics = useMemo(() => {
    if (!activeDestination) return null;
    const distKm = calculateMarsDistanceKm(
      { latitude: currentOrigin.lat, longitude: currentOrigin.lng },
      { latitude: activeDestination.lat, longitude: activeDestination.lng }
    );
    const pressure = getMarsPressureMbar(activeDestination.elevationM);
    // Walking at 3.2 km/h
    const walkHours = distKm / 3.2;
    // Pressurized Rover at 12 km/h
    const roverHours = distKm / 12.0;
    // Sols (1 Sol = 24.66 hours)
    const sols = (roverHours / 24.66).toFixed(1);

    return {
      distanceKm: Math.round(distKm * 10) / 10,
      pressureMbar: pressure,
      walkHours: Math.round(walkHours * 10) / 10,
      roverHours: Math.round(roverHours * 10) / 10,
      solsNeeded: Number(sols),
    };
  }, [activeDestination, currentOrigin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto">
      <div className="bg-[#070b14]/95 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-black/90 w-full max-w-2xl max-h-[92vh] flex flex-col text-white ring-1 ring-cyan-500/20 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 via-transparent to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50">
              <Target className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Mars Destination Select Tool
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                  MOLA Navigation
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Select exploration target, analyze geodesic range & plot optimal traversal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close Destination Tool"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Mode Action Bar */}
        <div className="p-4 border-b border-white/10 bg-[#0a1120]/80 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Interactive Pick on Map Button */}
            <button
              type="button"
              onClick={() => {
                onToggleMapPickMode();
                marsSonification.playPulse(660, 'sine', 0.15, 0.1);
                onClose();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md ${
                isMapPickMode
                  ? 'bg-amber-500 text-neutral-950 ring-2 ring-amber-400/80 shadow-amber-950/50 animate-pulse'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/50'
              }`}
              title="Click anywhere on the Mars map surface to set an exact custom Destination point"
            >
              <Crosshair className="w-4 h-4" />
              <span>{isMapPickMode ? 'Map Pick Active (Click Surface)' : '🎯 Pick Target on Map'}</span>
            </button>

            {/* Current Reference Origin indicator */}
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
              <span className="text-neutral-500">Origin:</span>
              <span className="text-cyan-300 font-semibold truncate max-w-[170px]">
                {currentOrigin.name || `${currentOrigin.lat.toFixed(2)}°, ${currentOrigin.lng.toFixed(2)}°`}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-5 flex-1">
          {/* Active Destination Card (If selected) */}
          {activeDestination ? (
            <div className="bg-gradient-to-br from-cyan-950/50 via-[#0a1120] to-black border-2 border-cyan-400/60 rounded-2xl p-4 shadow-xl shadow-cyan-950/30 animate-in fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase tracking-wider">
                      Active Destination
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-neutral-300 border border-white/10">
                      {activeDestination.category}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1.5">
                    {activeDestination.name}
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    {activeDestination.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClearDestination}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
                  title="Clear Active Destination"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Geographic & Topographic Metrics Grid */}
              {activeMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5 pt-3.5 border-t border-white/10">
                  <div className="bg-black/40 rounded-xl p-2.5 border border-white/5">
                    <div className="text-[10px] font-mono text-neutral-400">Coordinates</div>
                    <div className="text-xs font-mono font-bold text-cyan-300 mt-0.5">
                      {activeDestination.lat >= 0 ? `${activeDestination.lat.toFixed(2)}°N` : `${Math.abs(activeDestination.lat).toFixed(2)}°S`},{' '}
                      {activeDestination.lng >= 0 ? `${activeDestination.lng.toFixed(2)}°E` : `${Math.abs(activeDestination.lng).toFixed(2)}°W`}
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-xl p-2.5 border border-white/5">
                    <div className="text-[10px] font-mono text-neutral-400">MOLA Elevation</div>
                    <div className="text-xs font-mono font-bold text-orange-400 mt-0.5">
                      {activeDestination.elevationM >= 0 ? `+${activeDestination.elevationM}m` : `${activeDestination.elevationM}m`}
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-xl p-2.5 border border-white/5">
                    <div className="text-[10px] font-mono text-neutral-400">Range from Origin</div>
                    <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                      {activeMetrics.distanceKm.toLocaleString()} km
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-xl p-2.5 border border-white/5">
                    <div className="text-[10px] font-mono text-neutral-400">Est. Traverse</div>
                    <div className="text-xs font-mono font-bold text-amber-300 mt-0.5 flex items-center gap-1">
                      <Car className="w-3 h-3 text-amber-400" />
                      <span>{activeMetrics.roverHours < 24 ? `${activeMetrics.roverHours}h` : `${activeMetrics.solsNeeded} Sols`}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons for Active Destination */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    onFlyToDestination(
                      activeDestination.lat,
                      activeDestination.lng,
                      activeDestination.recommendedZoom || 7,
                      activeDestination.name
                    );
                    marsSonification.sonifyLocation(activeDestination.elevationM, 2);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-cyan-950/50"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Fly to Target</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onPlotRouteToDestination(activeDestination);
                    marsSonification.playPulse(550, 'sine', 0.2, 0.1);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-950/50"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Plot EVA Route to Target</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#0b101d]/60 border border-dashed border-cyan-500/30 rounded-2xl p-4 text-center">
              <div className="w-10 h-10 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-2">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-white">No Destination Currently Set</h4>
              <p className="text-[11px] text-neutral-400 mt-1 max-w-md mx-auto">
                Choose a prime Martian exploration target below, or click "Pick Target on Map" to set any point on Mars as your destination.
              </p>
            </div>
          )}

          {/* Curated Martian Destination Catalog */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>Curated Martian Exploration Targets</span>
                <span className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded">
                  {filteredPresets.length} available
                </span>
              </h3>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {['All', 'Scientific Site', 'Rover Cache', 'Volcanic Summit', 'Canyon Floor', 'Glacial Ice'].map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-0.5 rounded-lg text-[10.5px] font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-cyan-500 text-neutral-950 font-bold shadow'
                          : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search target by crater, valley, glacier or mission..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
              />
            </div>

            {/* Destination List Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredPresets.map((dest) => {
                const isSelected = activeDestination?.id === dest.id;
                const distFromOrigin = Math.round(
                  calculateMarsDistanceKm(
                    { latitude: currentOrigin.lat, longitude: currentOrigin.lng },
                    { latitude: dest.lat, longitude: dest.lng }
                  )
                );

                return (
                  <div
                    key={dest.id}
                    onClick={() => {
                      onSelectDestination(dest);
                      marsSonification.sonifyLocation(dest.elevationM, 2);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400/50 shadow-lg shadow-cyan-950/40'
                        : 'bg-[#090d16]/80 hover:bg-[#0c1220] border-white/5 hover:border-cyan-500/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-neutral-300 border border-white/10">
                          {dest.category}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          {distFromOrigin.toLocaleString()} km away
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1.5 line-clamp-1">
                        {dest.name}
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {dest.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10.5px] font-mono text-neutral-400">
                      <span>
                        {dest.elevationM >= 0 ? `+${dest.elevationM}m` : `${dest.elevationM}m`}
                      </span>
                      <span className="text-cyan-400 font-bold flex items-center gap-1 group">
                        {isSelected ? 'Selected' : 'Select'}
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
