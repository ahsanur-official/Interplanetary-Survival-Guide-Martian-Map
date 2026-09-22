import React, { useState, useEffect } from 'react';
import {
  Wind,
  CloudFog,
  Sun,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Crosshair,
  Compass,
  AlertTriangle,
  Radio,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  SeasonalDustState,
  DustStormCell,
  AtmosphericPointTelemetry,
  getSeasonalDustSimulation,
} from '../../engine/marsAtmosphereDustModel';

interface MarsDustStormLayerControlProps {
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  layerOpacity: number;
  onChangeOpacity: (opacity: number) => void;
  simulationState: SeasonalDustState;
  onChangeScenario: (scenario: SeasonalDustState['activeScenario'], customLs?: number) => void;
  showStormVortices: boolean;
  onToggleStormVortices: (show: boolean) => void;
  showWindVectors: boolean;
  onToggleWindVectors: (show: boolean) => void;
  onFlyToStorm?: (lat: number, lng: number, name: string) => void;
  inspectedPoint?: AtmosphericPointTelemetry | null;
  onClearInspectedPoint?: () => void;
}

export const MarsDustStormLayerControl: React.FC<MarsDustStormLayerControlProps> = ({
  isOpen,
  onClose,
  isEnabled,
  onToggleEnabled,
  layerOpacity,
  onChangeOpacity,
  simulationState,
  onChangeScenario,
  showStormVortices,
  onToggleStormVortices,
  showWindVectors,
  onToggleWindVectors,
  onFlyToStorm,
  inspectedPoint,
  onClearInspectedPoint,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isPlayingSeasonalCycle, setIsPlayingSeasonalCycle] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'controls' | 'storms' | 'rovers' | 'telemetry'>('controls');

  // Animation loop for seasonal cycle scrub
  useEffect(() => {
    if (!isPlayingSeasonalCycle) return;
    const interval = setInterval(() => {
      const nextLs = (simulationState.currentLs + 3) % 360;
      onChangeScenario('realtime', nextLs);
    }, 180);
    return () => clearInterval(interval);
  }, [isPlayingSeasonalCycle, simulationState.currentLs, onChangeScenario]);

  if (!isOpen) return null;

  return (
    <div
      id="mars-dust-storm-layer-control"
      className="bg-[#0b1120]/95 backdrop-blur-xl border border-orange-500/50 rounded-2xl shadow-2xl shadow-orange-950/40 text-neutral-200 overflow-hidden pointer-events-auto transition-all max-w-[94vw] sm:max-w-md w-full z-30"
    >
      {/* Header with Master Toggle */}
      <div className="p-3 bg-gradient-to-r from-orange-950/80 via-neutral-900 to-[#10172a] border-b border-orange-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border transition-all ${
            isEnabled
              ? 'bg-orange-600/30 text-orange-400 border-orange-500/60 shadow-lg shadow-orange-950/80'
              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
          }`}>
            <Wind className={`w-4 h-4 ${isEnabled ? 'animate-pulse text-orange-300' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">Dust Storm & Atmosphere</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                isEnabled
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}>
                {isEnabled ? 'Active Overlay' : 'Disabled'}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 flex items-center gap-1.5">
              <span>MGS/MRO Opacity (Tau) Simulation</span>
              <span>•</span>
              <span className="text-orange-300 font-mono">Ls {simulationState.currentLs.toFixed(0)}°</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Main Toggle Switch */}
          <button
            type="button"
            onClick={() => onToggleEnabled(!isEnabled)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm ${
              isEnabled
                ? 'bg-orange-600 hover:bg-orange-500 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
            title={isEnabled ? 'Hide dust storm overlay' : 'Show dust storm overlay'}
          >
            {isEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3.5 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Navigation Sub-Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-black/40 rounded-xl border border-neutral-800 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('controls')}
              className={`py-1 rounded-lg transition text-center ${
                activeTab === 'controls' ? 'bg-orange-600 text-white shadow-sm font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Season
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('storms')}
              className={`py-1 rounded-lg transition text-center flex items-center justify-center gap-1 ${
                activeTab === 'storms' ? 'bg-orange-600 text-white shadow-sm font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Storms</span>
              <span className="text-[9px] px-1 bg-orange-950 text-orange-300 rounded-full font-mono">
                {simulationState.activeStorms.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rovers')}
              className={`py-1 rounded-lg transition text-center ${
                activeTab === 'rovers' ? 'bg-orange-600 text-white shadow-sm font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Rovers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('telemetry')}
              className={`py-1 rounded-lg transition text-center flex items-center justify-center gap-1 ${
                activeTab === 'telemetry' ? 'bg-orange-600 text-white shadow-sm font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Probe</span>
              {inspectedPoint && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>}
            </button>
          </div>

          {/* TAB 1: SEASON & SLIDERS CONTROLS */}
          {activeTab === 'controls' && (
            <div className="space-y-3.5">
              {/* Layer Opacity Slider */}
              <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-orange-400" />
                    <span>Atmospheric Haze Opacity</span>
                  </span>
                  <span className="font-mono text-orange-300 font-bold">
                    {Math.round(layerOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="1.0"
                  step="0.05"
                  value={layerOpacity}
                  onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>

              {/* Display Element Toggles */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => onToggleStormVortices(!showStormVortices)}
                  className={`p-2 rounded-xl border text-left flex items-center justify-between transition ${
                    showStormVortices
                      ? 'bg-orange-950/60 border-orange-500/80 text-orange-200'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <CloudFog className="w-3.5 h-3.5 text-orange-400" />
                    <span>Storm Vortices</span>
                  </div>
                  <span className="font-bold">{showStormVortices ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleWindVectors(!showWindVectors)}
                  className={`p-2 rounded-xl border text-left flex items-center justify-between transition ${
                    showWindVectors
                      ? 'bg-orange-950/60 border-orange-500/80 text-orange-200'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Wind Vectors</span>
                  </div>
                  <span className="font-bold">{showWindVectors ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Seasonal Solar Longitude (Ls) Scrubber */}
              <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold block">
                      Martian Seasonal Cycle (Ls)
                    </span>
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>{simulationState.seasonName}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-orange-400 block">
                      Ls = {simulationState.currentLs.toFixed(1)}°
                    </span>
                    <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-semibold ${
                      simulationState.stormSeasonPhase.includes('Peak')
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {simulationState.stormSeasonPhase}
                    </span>
                  </div>
                </div>

                {/* Scrubber slider */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max="359"
                    step="1"
                    value={simulationState.currentLs}
                    onChange={(e) => {
                      setIsPlayingSeasonalCycle(false);
                      onChangeScenario('realtime', parseFloat(e.target.value));
                    }}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-neutral-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                    <span>0° Equinox</span>
                    <span>71° Aphelion</span>
                    <span>180° Dust Season</span>
                    <span>251° Perihelion</span>
                    <span>360°</span>
                  </div>
                </div>

                {/* Play / Reset Seasonal Animation */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setIsPlayingSeasonalCycle(!isPlayingSeasonalCycle)}
                    className="px-3 py-1 rounded-lg bg-orange-950/80 hover:bg-orange-900 border border-orange-700/60 text-orange-300 font-bold flex items-center gap-1.5 text-xs transition"
                  >
                    {isPlayingSeasonalCycle ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlayingSeasonalCycle ? 'Pause Year Cycle' : 'Play Annual Cycle'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlayingSeasonalCycle(false);
                      onChangeScenario('realtime');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-mono transition flex items-center gap-1"
                    title="Reset to current live Martian date"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Sync Live</span>
                  </button>
                </div>
              </div>

              {/* Quick Seasonal Scenario Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold block">
                  Planetary Weather Scenarios
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlayingSeasonalCycle(false);
                      onChangeScenario('aphelion_clear');
                    }}
                    className={`p-2 rounded-xl border text-left transition ${
                      simulationState.activeScenario === 'aphelion_clear'
                        ? 'bg-sky-950/80 border-sky-400 text-sky-200'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="font-bold text-xs">Aphelion Low Dust</div>
                    <div className="text-[10px] text-neutral-400">Ls 71° • Crisp Skies & Water-Ice Clouds</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlayingSeasonalCycle(false);
                      onChangeScenario('equinox_transition');
                    }}
                    className={`p-2 rounded-xl border text-left transition ${
                      simulationState.activeScenario === 'equinox_transition'
                        ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="font-bold text-xs">Equinox Transition</div>
                    <div className="text-[10px] text-neutral-400">Ls 180° • Thermal Inception</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlayingSeasonalCycle(false);
                      onChangeScenario('perihelion_storms');
                    }}
                    className={`p-2 rounded-xl border text-left transition ${
                      simulationState.activeScenario === 'perihelion_storms'
                        ? 'bg-orange-950/80 border-orange-400 text-orange-200'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="font-bold text-xs">Perihelion Storm Season</div>
                    <div className="text-[10px] text-neutral-400">Ls 251° • Hellas/Argyre Storms</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlayingSeasonalCycle(false);
                      onChangeScenario('global_pede');
                    }}
                    className={`p-2 rounded-xl border text-left transition ${
                      simulationState.activeScenario === 'global_pede'
                        ? 'bg-red-950/80 border-red-500 text-red-200 shadow-md shadow-red-950'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1">
                      <span>Global Dust Event (PEDE)</span>
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                    </div>
                    <div className="text-[10px] text-neutral-400">2018-Scale Planet-Wide Blackout</div>
                  </button>
                </div>
              </div>

              {/* Optical Depth Tau Color Scale Legend */}
              <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                  <span>ATMOSPHERIC OPTICAL DEPTH (TAU τ) SCALE</span>
                  <span className="text-orange-400 font-bold">Global Mean: {simulationState.globalMeanTau}</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden flex shadow-inner">
                  <div className="flex-1 bg-sky-400" title="Tau < 0.4: Clear Sky"></div>
                  <div className="flex-1 bg-amber-400" title="Tau 0.4-0.8: Midday Haze"></div>
                  <div className="flex-1 bg-orange-500" title="Tau 0.8-1.5: Elevated Squalls"></div>
                  <div className="flex-1 bg-red-600" title="Tau 1.5-2.5: Regional Dust Storm"></div>
                  <div className="flex-1 bg-rose-950" title="Tau > 2.5: Severe Global Storm"></div>
                </div>
                <div className="flex justify-between text-[9px] font-mono text-neutral-400">
                  <span>Clear (τ 0.2)</span>
                  <span>Haze (0.6)</span>
                  <span>Storm (1.5)</span>
                  <span>Severe (3.0+)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE DUST STORM CELLS */}
          {activeTab === 'storms' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>Active Regional Storms ({simulationState.activeStorms.length})</span>
                <span className="text-orange-400 font-mono">Season Ls {simulationState.currentLs.toFixed(0)}°</span>
              </div>

              {simulationState.activeStorms.length === 0 ? (
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 text-center text-neutral-400 space-y-1">
                  <Sun className="w-6 h-6 text-amber-400 mx-auto" />
                  <div className="font-bold text-white text-xs">Clear Sky Season</div>
                  <div className="text-[11px]">No severe regional dust storms active at this solar longitude. Surface visibility is at seasonal peak.</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {simulationState.activeStorms.map((storm) => (
                    <div
                      key={storm.id}
                      className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-orange-500/60 transition space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            <Wind className="w-3.5 h-3.5 text-orange-400" />
                            <span>{storm.name}</span>
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {storm.lat >= 0 ? `${storm.lat.toFixed(1)}°N` : `${Math.abs(storm.lat).toFixed(1)}°S`},{' '}
                            {storm.lng >= 0 ? `${storm.lng.toFixed(1)}°E` : `${Math.abs(storm.lng).toFixed(1)}°W`}
                            {' • '}Radius ~{storm.radiusKm.toLocaleString()} km
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-red-400 block">
                            Peak τ {storm.peakTau}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-950 text-orange-300 font-mono">
                            {storm.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-neutral-300 leading-relaxed">
                        {storm.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-neutral-800 text-[10px]">
                        <span className="text-neutral-400">
                          Drift: {storm.driftVelocityKmH} km/h @ {storm.driftHeadingDeg}°
                        </span>
                        {onFlyToStorm && (
                          <button
                            type="button"
                            onClick={() => onFlyToStorm(storm.lat, storm.lng, storm.name)}
                            className="px-2 py-0.5 rounded-lg bg-orange-600/30 hover:bg-orange-600 border border-orange-500/60 text-orange-200 hover:text-white font-bold flex items-center gap-1 transition"
                          >
                            <Crosshair className="w-3 h-3" />
                            <span>Locate Storm</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ROVER IN-SITU OPACITY TELEMETRY */}
          {activeTab === 'rovers' && (
            <div className="space-y-2.5">
              <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold block">
                In-Situ Surface Station Opacity
              </span>

              {/* Perseverance */}
              <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-bold text-white text-xs">Perseverance (Jezero Crater)</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                    MEDA RDS
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                  <div className="p-1.5 rounded bg-black/40 border border-neutral-800">
                    <span className="text-neutral-400 block text-[9px]">OPTICAL DEPTH</span>
                    <span className="text-orange-400 font-bold text-xs">
                      τ {simulationState.roverTelemetry.perseveranceJezero.tau}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-black/40 border border-neutral-800">
                    <span className="text-neutral-400 block text-[9px]">VISIBILITY</span>
                    <span className="text-white font-bold text-xs">
                      {simulationState.roverTelemetry.perseveranceJezero.visibilityKm} km
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-black/40 border border-neutral-800">
                    <span className="text-neutral-400 block text-[9px]">HAZARD</span>
                    <span className="text-emerald-400 font-bold text-xs">
                      {simulationState.roverTelemetry.perseveranceJezero.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Curiosity */}
              <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-white text-xs">Curiosity (Gale Crater)</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                    REMS / Mastcam
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                  <div className="p-1.5 rounded bg-black/40 border border-neutral-800">
                    <span className="text-neutral-400 block text-[9px]">OPTICAL DEPTH</span>
                    <span className="text-orange-400 font-bold text-xs">
                      τ {simulationState.roverTelemetry.curiosityGale.tau}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-black/40 border border-neutral-800">
                    <span className="text-neutral-400 block text-[9px]">VISIBILITY</span>
                    <span className="text-white font-bold text-xs">
                      {simulationState.roverTelemetry.curiosityGale.visibilityKm} km
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-black/40 border border-neutral-800">
                    <span className="text-neutral-400 block text-[9px]">HAZARD</span>
                    <span className="text-amber-400 font-bold text-xs">
                      {simulationState.roverTelemetry.curiosityGale.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* InSight */}
              <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-bold text-white text-xs">InSight Lander (Elysium)</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                    TWINS Station
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                  <div className="p-1.5 rounded bg-black/40 border border-neutral-800">
                    <span className="text-neutral-400 block text-[9px]">OPTICAL DEPTH</span>
                    <span className="text-orange-400 font-bold text-xs">
                      τ {simulationState.roverTelemetry.insightElysium.tau}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-black/40 border border-neutral-800">
                    <span className="text-neutral-400 block text-[9px]">VISIBILITY</span>
                    <span className="text-white font-bold text-xs">
                      {simulationState.roverTelemetry.insightElysium.visibilityKm} km
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-black/40 border border-neutral-800">
                    <span className="text-neutral-400 block text-[9px]">HAZARD</span>
                    <span className="text-emerald-400 font-bold text-xs">
                      {simulationState.roverTelemetry.insightElysium.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MAP PROBE / INSPECTED POINT TELEMETRY */}
          {activeTab === 'telemetry' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold">
                  Atmospheric Probe Telemetry
                </span>
                {inspectedPoint && onClearInspectedPoint && (
                  <button
                    type="button"
                    onClick={onClearInspectedPoint}
                    className="text-[10px] text-neutral-400 hover:text-white underline cursor-pointer"
                  >
                    Clear Probe
                  </button>
                )}
              </div>

              {inspectedPoint ? (
                <div className="space-y-2.5">
                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-xs">
                        {inspectedPoint.lat >= 0 ? `${inspectedPoint.lat}°N` : `${Math.abs(inspectedPoint.lat)}°S`},{' '}
                        {inspectedPoint.lng >= 0 ? `${inspectedPoint.lng}°E` : `${Math.abs(inspectedPoint.lng)}°W`}
                      </div>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded font-mono font-bold"
                        style={{
                          backgroundColor: `${inspectedPoint.hazardColor}20`,
                          color: inspectedPoint.hazardColor,
                          border: `1px solid ${inspectedPoint.hazardColor}50`,
                        }}
                      >
                        {inspectedPoint.dustHazardLevel} Risk
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2 rounded bg-black/40 border border-neutral-800">
                        <span className="text-[9px] text-neutral-400 block">OPTICAL DEPTH (TAU)</span>
                        <span className="text-base font-bold text-orange-400">τ {inspectedPoint.tau}</span>
                      </div>
                      <div className="p-2 rounded bg-black/40 border border-neutral-800">
                        <span className="text-[9px] text-neutral-400 block">EST. VISIBILITY</span>
                        <span className="text-base font-bold text-white">{inspectedPoint.visibilityKm} km</span>
                      </div>
                      <div className="p-2 rounded bg-black/40 border border-neutral-800">
                        <span className="text-[9px] text-neutral-400 block">SOLAR REDUCTION</span>
                        <span className="text-sm font-bold text-amber-300">-{inspectedPoint.solarAttenuationPercent}%</span>
                      </div>
                      <div className="p-2 rounded bg-black/40 border border-neutral-800">
                        <span className="text-[9px] text-neutral-400 block">ELEVATION</span>
                        <span className="text-sm font-bold text-cyan-300">
                          {inspectedPoint.elevationM > 0 ? `+${inspectedPoint.elevationM}` : inspectedPoint.elevationM}m
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-300 leading-relaxed border-t border-neutral-800 pt-2">
                      {inspectedPoint.description}
                    </p>

                    {inspectedPoint.nearestStorm && (
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 bg-neutral-950 p-2 rounded-lg border border-neutral-800/80">
                        <span>Nearest Storm: <strong>{inspectedPoint.nearestStorm.name}</strong></span>
                        <span className="font-mono text-orange-400">{inspectedPoint.nearestStorm.distanceKm} km</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 text-center text-neutral-400 space-y-1.5">
                  <Crosshair className="w-6 h-6 text-orange-400 mx-auto animate-pulse" />
                  <div className="font-bold text-white text-xs">Click Anywhere on Mars</div>
                  <div className="text-[11px]">
                    Click any point on the map to sample local atmospheric optical depth (τ), surface visibility, scale-height air density, and distance to active dust storm fronts.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scientific Provenance Tag */}
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[9px] text-neutral-500 font-mono">
            <span>NASA MGS TES & MRO MCS Climatology</span>
            <span>Scale Height H=11.1km</span>
          </div>
        </div>
      )}
    </div>
  );
};
