import React, { useState } from 'react';
import {
  X,
  Gauge,
  Thermometer,
  Wind,
  Layers,
  ChevronRight,
  Sparkles,
  Info,
  MapPin,
  Sliders,
  Check,
  Activity,
  Droplets,
  AlertTriangle,
  RotateCcw,
  Compass,
  Radio,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  MARS_LANDING_SITES_ATMOSPHERE,
  MARS_ATMO_ZONES,
  MarsLandingSiteAtmosphere,
} from '../../data/marsAtmosphereData';

export type AtmosphereOverlayMode = 'pressure' | 'temperature' | 'dual';

export interface MarsAtmosphereOverlayControlProps {
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  mode: AtmosphereOverlayMode;
  onChangeMode: (mode: AtmosphereOverlayMode) => void;
  opacity: number;
  onChangeOpacity: (opacity: number) => void;
  showStationBadges: boolean;
  onToggleStationBadges: (show: boolean) => void;
  showIsobarZones: boolean;
  onToggleIsobarZones: (show: boolean) => void;
  selectedSiteId?: string;
  onSelectSite: (site: MarsLandingSiteAtmosphere) => void;
}

export const MarsAtmosphereOverlayControl: React.FC<MarsAtmosphereOverlayControlProps> = ({
  isOpen,
  onClose,
  isEnabled,
  onToggleEnabled,
  mode,
  onChangeMode,
  opacity,
  onChangeOpacity,
  showStationBadges,
  onToggleStationBadges,
  showIsobarZones,
  onToggleIsobarZones,
  selectedSiteId,
  onSelectSite,
}) => {
  const [activeTab, setActiveTab] = useState<'stations' | 'zones' | 'science'>('stations');

  // Currently focused site (fallback to selected or first site)
  const currentSite =
    MARS_LANDING_SITES_ATMOSPHERE.find((s) => s.id === selectedSiteId) ||
    MARS_LANDING_SITES_ATMOSPHERE[0];

  if (!isOpen) return null;

  return (
    <div className="bg-neutral-900/95 backdrop-blur-xl border border-blue-500/40 rounded-2xl shadow-2xl shadow-blue-950/50 flex flex-col overflow-hidden text-neutral-100 max-h-[85vh] sm:max-h-[620px] w-full">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-950/80 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600/30 to-cyan-500/20 border border-blue-500/40 text-blue-400">
            <Gauge className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Mars Atmospheric & Climate Overlay
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isEnabled
                  ? 'bg-blue-900/60 text-blue-300 border-blue-500/60 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}>
                {isEnabled ? 'ACTIVE' : 'MUTED'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Pressure isobars, thermal isotherms & 13 in-situ landing stations
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Close atmospheric panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
        {/* Master Layer Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-950/40 to-neutral-900 border border-blue-500/30">
          <div className="flex items-center gap-2.5">
            {isEnabled ? (
              <Eye className="w-4 h-4 text-blue-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-neutral-500" />
            )}
            <div>
              <div className="font-semibold text-neutral-100 text-xs">
                Render Atmospheric Layer on Map
              </div>
              <div className="text-[10.5px] text-neutral-400">
                Visualizes regional pressure contours and environmental telemetry
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isEnabled}
              onChange={(e) => onToggleEnabled(e.target.checked)}
            />
            <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Overlay Mode Switcher */}
        <div>
          <label className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider block mb-1.5">
            Visualization Metric
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => {
                onChangeMode('pressure');
                if (!isEnabled) onToggleEnabled(true);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium text-[11px] transition-all cursor-pointer ${
                mode === 'pressure'
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/50'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Pressure</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onChangeMode('temperature');
                if (!isEnabled) onToggleEnabled(true);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium text-[11px] transition-all cursor-pointer ${
                mode === 'temperature'
                  ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-900/50'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Temperature</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onChangeMode('dual');
                if (!isEnabled) onToggleEnabled(true);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium text-[11px] transition-all cursor-pointer ${
                mode === 'dual'
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/50'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Dual Weather</span>
            </button>
          </div>
        </div>

        {/* Dynamic Color Scale Legend */}
        <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-1.5">
          <div className="flex items-center justify-between text-[10.5px] font-mono text-neutral-400">
            <span>
              {mode === 'temperature' ? 'Cold (-140°C Poles)' : 'Low Pressure (Olympus ~0.7 mb)'}
            </span>
            <span className="text-white font-bold">
              {mode === 'temperature' ? 'Thermal Gradient' : 'Isobar Gradient'}
            </span>
            <span>
              {mode === 'temperature' ? 'Warm (+5°C Basins)' : 'High Pressure (Hellas ~12.4 mb)'}
            </span>
          </div>

          <div className="h-2.5 w-full rounded-full overflow-hidden flex shadow-inner">
            {mode === 'temperature' ? (
              <>
                <div className="flex-1 bg-blue-700" title="-140°C" />
                <div className="flex-1 bg-cyan-600" title="-90°C" />
                <div className="flex-1 bg-teal-500" title="-60°C" />
                <div className="flex-1 bg-emerald-500" title="-35°C" />
                <div className="flex-1 bg-amber-500" title="-10°C" />
                <div className="flex-1 bg-orange-600" title="+5°C" />
              </>
            ) : (
              <>
                <div className="flex-1 bg-red-600" title="< 2.0 mbar (Volcanic Summits)" />
                <div className="flex-1 bg-amber-500" title="4.0 mbar (High Plateaus)" />
                <div className="flex-1 bg-emerald-500" title="6.1 mbar (Datum / Triple Point)" />
                <div className="flex-1 bg-sky-500" title="8.0 mbar (Northern Lowlands)" />
                <div className="flex-1 bg-blue-700" title="10.5+ mbar (Deep Basins)" />
              </>
            )}
          </div>

          <div className="flex items-center justify-between text-[9.5px] text-neutral-400 font-mono pt-0.5">
            {mode === 'temperature' ? (
              <>
                <span>-140°C</span>
                <span>-90°C</span>
                <span>-55°C (Mean)</span>
                <span>-20°C</span>
                <span className="text-amber-400">+5°C</span>
              </>
            ) : (
              <>
                <span className="text-red-400">0.7 mb</span>
                <span>4.5 mb</span>
                <span className="text-cyan-300 font-bold">6.1 mb (H₂O Triple Pt)</span>
                <span>8.5 mb</span>
                <span className="text-blue-400 font-bold">12.4 mb</span>
              </>
            )}
          </div>
        </div>

        {/* Fine-Tuning Controls: Opacity & Sub-layer Checkboxes */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              Overlay Opacity
            </span>
            <span className="text-[11px] font-mono text-blue-300 font-bold">
              {Math.round(opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={opacity}
            onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
          />

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onToggleStationBadges(!showStationBadges)}
              className={`flex items-center justify-between p-2 rounded-xl border text-[11px] transition-all cursor-pointer ${
                showStationBadges
                  ? 'bg-blue-950/40 border-blue-500/50 text-blue-200'
                  : 'bg-neutral-950/50 border-neutral-800 text-neutral-500'
              }`}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Station Badges
              </span>
              <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${showStationBadges ? 'bg-blue-600 text-white' : 'border border-neutral-700'}`}>
                {showStationBadges && <Check className="w-2.5 h-2.5" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => onToggleIsobarZones(!showIsobarZones)}
              className={`flex items-center justify-between p-2 rounded-xl border text-[11px] transition-all cursor-pointer ${
                showIsobarZones
                  ? 'bg-blue-950/40 border-blue-500/50 text-blue-200'
                  : 'bg-neutral-950/50 border-neutral-800 text-neutral-500'
              }`}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Isobar Zones
              </span>
              <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${showIsobarZones ? 'bg-cyan-600 text-white' : 'border border-neutral-700'}`}>
                {showIsobarZones && <Check className="w-2.5 h-2.5" />}
              </div>
            </button>
          </div>
        </div>

        {/* Tab Bar: Stations List vs Microclimate Zones vs Scientific Background */}
        <div className="flex border-b border-neutral-800 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('stations')}
            className={`pb-1.5 px-2 font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'stations'
                ? 'border-blue-500 text-blue-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Landing Stations ({MARS_LANDING_SITES_ATMOSPHERE.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('zones')}
            className={`pb-1.5 px-2 font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'zones'
                ? 'border-blue-500 text-blue-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Isobar Regions ({MARS_ATMO_ZONES.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('science')}
            className={`pb-1.5 px-2 font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'science'
                ? 'border-blue-500 text-blue-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Physics & EDL
          </button>
        </div>

        {/* Tab 1: Landing Stations List & Selected Dossier */}
        {activeTab === 'stations' && (
          <div className="space-y-3">
            {/* Selected Station Detailed Environmental Dossier */}
            <div className="p-3 rounded-xl bg-neutral-950 border border-blue-500/40 space-y-2.5 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    <h4 className="font-bold text-white text-xs">{currentSite.name}</h4>
                  </div>
                  <div className="text-[10px] text-blue-300 font-mono mt-0.5">
                    {currentSite.weatherStationName} • {currentSite.agency}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectSite(currentSite)}
                  className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow"
                >
                  <MapPin className="w-3 h-3" />
                  Fly To
                </button>
              </div>

              {/* Atmospheric Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                <div className="p-2 rounded-lg bg-neutral-900/90 border border-neutral-800">
                  <div className="text-[9.5px] text-neutral-400 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-blue-400" />
                    Pressure
                  </div>
                  <div className="text-xs font-mono font-bold text-blue-300 mt-0.5">
                    {currentSite.pressureMbar} mbar
                  </div>
                  <div className="text-[9px] text-neutral-400 font-mono">
                    {currentSite.pressurePa} Pa
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-neutral-900/90 border border-neutral-800">
                  <div className="text-[9.5px] text-neutral-400 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-amber-400" />
                    Diurnal Temp
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                    {currentSite.tempMaxC}°C / {currentSite.tempMinC}°C
                  </div>
                  <div className="text-[9px] text-neutral-400 font-mono">
                    Avg {currentSite.tempAvgC}°C
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-neutral-900/90 border border-neutral-800">
                  <div className="text-[9.5px] text-neutral-400 flex items-center gap-1">
                    <Wind className="w-3 h-3 text-cyan-400" />
                    Wind Velocity
                  </div>
                  <div className="text-xs font-mono font-bold text-cyan-300 mt-0.5">
                    {currentSite.windSpeedMps} m/s
                  </div>
                  <div className="text-[9px] text-neutral-400 font-mono truncate">
                    {currentSite.windDirection}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-neutral-900/90 border border-neutral-800">
                  <div className="text-[9.5px] text-neutral-400 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-purple-400" />
                    Density & Dust
                  </div>
                  <div className="text-xs font-mono font-bold text-purple-300 mt-0.5">
                    {currentSite.airDensityGPerM3} g/m³
                  </div>
                  <div className="text-[9px] text-neutral-400 font-mono">
                    Dust τ={currentSite.dustOpacityTau}
                  </div>
                </div>
              </div>

              {/* Station Instruments & Phenomena */}
              <div className="text-[10.5px] text-neutral-300 space-y-1 bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/80">
                <div>
                  <span className="text-neutral-400 font-semibold">Phenomena: </span>
                  {currentSite.atmosphericPhenomena}
                </div>
                <div>
                  <span className="text-neutral-400 font-semibold">Seasonal Cycle: </span>
                  {currentSite.seasonalNotes}
                </div>
              </div>
            </div>

            {/* Station Quick Selector Horizontal / Vertical List */}
            <div>
              <div className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Select Weather Station</span>
                <span className="font-mono text-neutral-400">13 active/historic sites</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {MARS_LANDING_SITES_ATMOSPHERE.map((site) => {
                  const isCur = site.id === currentSite.id;
                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => onSelectSite(site)}
                      className={`flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer border ${
                        isCur
                          ? 'bg-blue-950/70 border-blue-500 text-white shadow-md'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:bg-neutral-900'
                      }`}
                    >
                      <div className="truncate pr-1">
                        <div className="font-bold text-[11px] truncate flex items-center gap-1">
                          {site.name.split(' (')[0]}
                          {isCur && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                        </div>
                        <div className="text-[9.5px] text-neutral-400 font-mono">
                          {site.weatherStationName.split(' (')[0]}
                        </div>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <div className="text-[10.5px] font-bold text-blue-300">
                          {site.pressureMbar} mb
                        </div>
                        <div className="text-[9px] text-amber-300">
                          {site.tempAvgC}°C
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Regional Isobar & Microclimate Zones */}
        {activeTab === 'zones' && (
          <div className="space-y-2">
            <div className="text-[11px] text-neutral-400">
              Martian elevation spans over 29 km, generating drastic pressure differentials from deep impact basins (Hellas: 12.4 mbar) to volcanic peaks (Olympus: 0.7 mbar).
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {MARS_ATMO_ZONES.map((zone) => (
                <div
                  key={zone.id}
                  className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[11.5px] text-white flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: zone.colorPressure }}
                      />
                      {zone.name}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-blue-300 font-bold">
                      {zone.pressureRangeMbar[0]} – {zone.pressureRangeMbar[1]} mb
                    </span>
                  </div>

                  <p className="text-[10.5px] text-neutral-300 leading-relaxed">
                    {zone.description}
                  </p>

                  <div className="flex items-center justify-between text-[9.5px] text-neutral-400 font-mono pt-0.5 border-t border-neutral-900">
                    <span>Temp: {zone.tempRangeC[0]}°C to {zone.tempRangeC[1]}°C</span>
                    <span className="text-neutral-400">{zone.scientificContext}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Physics, Triple Point & EDL Engineering */}
        {activeTab === 'science' && (
          <div className="space-y-3 text-[11px] text-neutral-300 leading-relaxed">
            <div className="p-3 rounded-xl bg-neutral-950 border border-blue-500/30 space-y-2">
              <div className="font-bold text-blue-300 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-blue-400" />
                The 6.1 mbar Water Triple Point Threshold
              </div>
              <p>
                Pure liquid water cannot exist in thermodynamic equilibrium on Mars below the triple point pressure of <strong className="text-white">6.1 mbar (610 Pa)</strong>. Below this datum, ice sublimates directly into vapor when warmed.
              </p>
              <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 text-[10.5px] font-mono text-blue-200">
                In Hellas Basin (-7.2 km) and deep Valles Marineris canyons, pressure reaches 9 to 12.4 mbar, allowing metastable liquid water brines to persist temporarily during warm summer sols.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Compass className="w-4 h-4 text-cyan-400" />
                Atmospheric Scale Height (H = 11.1 km)
              </div>
              <p>
                Mars atmosphere has a barometric scale height of <strong className="text-white">11.1 km</strong> (vs Earth&apos;s 8.5 km). Due to Mars low surface gravity (0.38g), the atmosphere decays more gradually with altitude:
              </p>
              <div className="p-2 rounded bg-neutral-900 font-mono text-center text-xs text-blue-300">
                P(z) = 6.1 mbar × e^(-z / 11,100 m)
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
              <div className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4" />
                Entry, Descent, and Landing (EDL) Aero-Braking
              </div>
              <p className="text-[10.5px] text-neutral-400">
                Robotic and human landers require low-elevation landing sites (typically below -1,500m to -4,000m) to provide sufficient air column thickness for supersonic parachute deployment and retro-propulsion fuel conservation.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Quick Link */}
      <div className="px-4 py-2.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400 shrink-0 font-mono">
        <span>Grounded in NASA MEDA, REMS & MOLA</span>
        <button
          type="button"
          onClick={() => {
            onToggleEnabled(true);
            onChangeMode('dual');
          }}
          className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Defaults
        </button>
      </div>
    </div>
  );
};
