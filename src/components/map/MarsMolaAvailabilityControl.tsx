import React, { useState } from 'react';
import {
  Layers,
  Mountain,
  Sliders,
  ExternalLink,
  Crosshair,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Zap,
  Globe2,
  ShieldCheck,
  Check,
  Compass,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  ElevationPointAvailability,
  ElevationResolutionTier,
  PRESET_HIGH_RES_ELEVATION_SITES,
  HighResElevationSite,
  ELEVATION_DATASET_CATALOG,
} from '../../engine/marsElevationAvailability';

interface MarsMolaAvailabilityControlProps {
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  layerOpacity: number;
  onChangeOpacity: (opacity: number) => void;
  activeTierFilter: 'ALL' | ElevationResolutionTier;
  onChangeTierFilter: (tier: 'ALL' | ElevationResolutionTier) => void;
  inspectedPoint?: ElevationPointAvailability | null;
  onClearInspectedPoint?: () => void;
  onFlyToSite?: (lat: number, lng: number, zoom: number, name: string) => void;
}

export const MarsMolaAvailabilityControl: React.FC<MarsMolaAvailabilityControlProps> = ({
  isOpen,
  onClose,
  isEnabled,
  onToggleEnabled,
  layerOpacity,
  onChangeOpacity,
  activeTierFilter,
  onChangeTierFilter,
  inspectedPoint,
  onClearInspectedPoint,
  onFlyToSite,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'legend' | 'probe' | 'sites' | 'provenance'>('legend');

  if (!isOpen) return null;

  return (
    <div
      id="mars-mola-availability-control"
      className="bg-[#0b1120]/95 backdrop-blur-xl border border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-950/40 text-neutral-200 overflow-hidden pointer-events-auto transition-all max-w-[94vw] sm:max-w-md w-full z-30"
    >
      {/* Header */}
      <div className="p-3 bg-gradient-to-r from-cyan-950/80 via-neutral-900 to-[#0e172a] border-b border-cyan-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl border transition-all ${
              isEnabled
                ? 'bg-cyan-600/30 text-cyan-400 border-cyan-500/60 shadow-lg shadow-cyan-950/80'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}
          >
            <Mountain className={`w-4 h-4 ${isEnabled ? 'text-cyan-300' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">MOLA Elevation Data Availability</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                  isEnabled
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {isEnabled ? 'Active Heatmap' : 'Overlay Off'}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400">
              MGS MOLA base vs HiRISE & HRSC high-res digital terrain models
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
            aria-label="Expand or collapse"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close overlay controls"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      {isExpanded && (
        <div className="p-3 space-y-3 font-mono text-xs max-h-[75vh] overflow-y-auto no-scrollbar">
          {/* Master Toggle & Opacity Slider */}
          <div className="bg-neutral-900/80 border border-neutral-800 p-2.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300 font-semibold text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Show Data Availability Heatmap</span>
              </span>
              <button
                type="button"
                onClick={() => onToggleEnabled(!isEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isEnabled ? 'bg-cyan-500' : 'bg-neutral-700'
                }`}
                role="switch"
                aria-checked={isEnabled}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isEnabled && (
              <div className="pt-2 border-t border-neutral-800/70 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-cyan-400" />
                    <span>Overlay Transparency</span>
                  </span>
                  <span className="font-bold text-cyan-300">{Math.round(layerOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.05"
                  value={layerOpacity}
                  onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-neutral-500">
                  <span>Transparent (Base tiles show through)</span>
                  <span>Opaque Heatmap</span>
                </div>
              </div>
            )}
          </div>

          {/* Sub Navigation Tabs */}
          <div className="grid grid-cols-4 gap-1 p-0.5 bg-neutral-900/90 rounded-xl border border-neutral-800 text-[10px]">
            <button
              type="button"
              onClick={() => setActiveTab('legend')}
              className={`py-1.5 px-1 rounded-lg font-bold transition-all cursor-pointer truncate ${
                activeTab === 'legend'
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Heatmap Scale
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('probe')}
              className={`py-1.5 px-1 rounded-lg font-bold transition-all cursor-pointer truncate flex items-center justify-center gap-1 ${
                activeTab === 'probe'
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Probe</span>
              {inspectedPoint && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sites')}
              className={`py-1.5 px-1 rounded-lg font-bold transition-all cursor-pointer truncate ${
                activeTab === 'sites'
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              High-Res Sites
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('provenance')}
              className={`py-1.5 px-1 rounded-lg font-bold transition-all cursor-pointer truncate ${
                activeTab === 'provenance'
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Provenance
            </button>
          </div>

          {/* TAB 1: HEATMAP SCALE & FILTER */}
          {activeTab === 'legend' && (
            <div className="space-y-3">
              {/* Filter Pills */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                    <Filter className="w-3 h-3 text-cyan-400" />
                    <span>Resolution Tier Filter</span>
                  </span>
                  <span className="text-neutral-500">
                    {activeTierFilter === 'ALL' ? 'Showing All' : activeTierFilter}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      { id: 'ALL', label: 'All Tiers' },
                      { id: 'ULTRA_HIGH', label: 'HiRISE (≤1m)' },
                      { id: 'HIGH', label: 'HRSC (12-50m)' },
                      { id: 'MEDIUM_HIGH', label: 'Polar 512' },
                      { id: 'LOW_RES_BASE', label: 'Gaps / Low-Res' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onChangeTierFilter(item.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        activeTierFilter === item.id
                          ? 'bg-cyan-500 text-black font-extrabold shadow-sm'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Continuous Heatmap Intensity Spectrum Bar */}
              <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-xl space-y-2">
                <div className="text-[10px] text-neutral-300 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Elevation Dataset Resolution Intensity</span>
                  <span className="text-cyan-400">Spatial Sampling</span>
                </div>

                {/* Heatmap Gradient Bar */}
                <div className="relative h-4 rounded-md overflow-hidden border border-neutral-700/80 shadow-inner">
                  <div
                    className="w-full h-full"
                    style={{
                      background:
                        'linear-gradient(to right, #6366f1 0%, #06b6d4 25%, #10b981 50%, #f59e0b 75%, #ff0055 100%)',
                    }}
                  />
                </div>
                <div className="flex justify-between text-[8.5px] text-neutral-400 font-mono">
                  <span>Low-Res (&gt;1.8 km)</span>
                  <span>MOLA 463m Base</span>
                  <span>Polar 115m</span>
                  <span>HRSC 12-50m</span>
                  <span className="text-pink-400 font-bold">HiRISE ≤1m</span>
                </div>
              </div>

              {/* Discrete Legend Tier Cards */}
              <div className="space-y-1.5">
                {/* 1. Ultra-High Res */}
                <div className="bg-neutral-900/70 border border-pink-500/30 p-2 rounded-xl flex items-start gap-2.5 hover:bg-neutral-900 transition-colors">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#ff0055] shrink-0 mt-0.5 shadow-sm shadow-pink-500/50" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-pink-300">Ultra-High Res (HiRISE DTMs)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-950/80 text-pink-300 border border-pink-700/50 font-bold">
                        0.25 - 1.0 m/px
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                      Up to <strong className="text-pink-300">1,852× resolution gain</strong> vs baseline MOLA tile. Stereo photogrammetry resolves sub-meter boulders & steep scarps.
                    </div>
                  </div>
                </div>

                {/* 2. High Res HRSC */}
                <div className="bg-neutral-900/70 border border-amber-500/30 p-2 rounded-xl flex items-start gap-2.5 hover:bg-neutral-900 transition-colors">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#f59e0b] shrink-0 mt-0.5 shadow-sm shadow-amber-500/50" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-300">High Res (HRSC & CTX DTMs)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-700/50 font-bold">
                        12.5 - 50 m/px
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                      <strong className="text-amber-300">10× to 37× sharper</strong> than MOLA. Mars Express stereo mosaics across Valles Marineris, Olympus Mons, and Tharsis.
                    </div>
                  </div>
                </div>

                {/* 3. Medium-High Polar */}
                <div className="bg-neutral-900/70 border border-emerald-500/30 p-2 rounded-xl flex items-start gap-2.5 hover:bg-neutral-900 transition-colors">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#10b981] shrink-0 mt-0.5 shadow-sm shadow-emerald-500/50" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-300">Polar Convergence (MOLA 512)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 font-bold">
                        115 m/px
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                      <strong className="text-emerald-300">4× higher shot density</strong> over Planum Boreum and Planum Australe from converging orbital tracks.
                    </div>
                  </div>
                </div>

                {/* 4. Standard Global Base */}
                <div className="bg-neutral-900/70 border border-cyan-500/30 p-2 rounded-xl flex items-start gap-2.5 hover:bg-neutral-900 transition-colors">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#06b6d4] shrink-0 mt-0.5 shadow-sm shadow-cyan-500/50" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-cyan-300">Global MOLA Base (MEGDR)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 font-bold">
                        463 m/px (128 px/°)
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                      Primary baseline tile source across the planet. 100% global datum reference to IAU 2000 0m Areoid.
                    </div>
                  </div>
                </div>

                {/* 5. Low-Res Gaps */}
                <div className="bg-neutral-900/70 border border-indigo-500/30 p-2 rounded-xl flex items-start gap-2.5 hover:bg-neutral-900 transition-colors">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#6366f1] shrink-0 mt-0.5 shadow-sm shadow-indigo-500/50" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-300">Interpolated Gaps / Low-Res</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 font-bold">
                        &gt;1.8 km/px
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                      Sparse laser shot spacing in rugged inter-crater sectors. Micro-relief smoothed out.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROBE INSPECTION */}
          {activeTab === 'probe' && (
            <div className="space-y-3">
              {inspectedPoint ? (
                <div className="space-y-2.5">
                  <div className="bg-neutral-900/90 border border-cyan-500/40 p-3 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Crosshair className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-white text-[11px]">Probed Surface Coordinates</span>
                      </div>
                      <button
                        type="button"
                        onClick={onClearInspectedPoint}
                        className="text-[10px] text-neutral-400 hover:text-white cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                      <div>
                        <span className="text-neutral-500 block">Latitude</span>
                        <span className="text-cyan-300 font-bold">
                          {inspectedPoint.lat.toFixed(4)}° {inspectedPoint.lat >= 0 ? 'N' : 'S'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">Longitude</span>
                        <span className="text-cyan-300 font-bold">
                          {Math.abs(inspectedPoint.lng).toFixed(4)}° {inspectedPoint.lng >= 0 ? 'E' : 'W'}
                        </span>
                      </div>
                    </div>

                    {/* Active Dataset Dossier */}
                    <div className="space-y-1.5 pt-1 border-t border-neutral-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-bold">
                          Highest Available Elevation Model
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.2 rounded font-bold font-mono"
                          style={{
                            backgroundColor: `${inspectedPoint.color}22`,
                            color: inspectedPoint.color,
                            border: `1px solid ${inspectedPoint.color}66`,
                          }}
                        >
                          {inspectedPoint.tierLabel}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-white">
                        {inspectedPoint.activeDataset.name}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-neutral-950/60 p-2 rounded-lg border border-neutral-800/80">
                        <div>
                          <span className="text-neutral-500 block">Ground Sampling (GSD)</span>
                          <span className="text-emerald-400 font-bold">
                            {inspectedPoint.resolutionMetersPerPixel < 1
                              ? `${inspectedPoint.resolutionMetersPerPixel * 100} cm/px`
                              : `${inspectedPoint.resolutionMetersPerPixel} m/pixel`}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">Resolution Gain</span>
                          <span
                            className="font-bold font-mono"
                            style={{ color: inspectedPoint.color }}
                          >
                            {inspectedPoint.relativeGainVsBaseMola >= 1
                              ? `${inspectedPoint.relativeGainVsBaseMola}× vs Base`
                              : `${inspectedPoint.relativeGainVsBaseMola}× (Sparse)`}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">Instrument / Mission</span>
                          <span className="text-neutral-300 font-medium">
                            {inspectedPoint.activeDataset.instrument}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">Vertical Precision</span>
                          <span className="text-neutral-300 font-medium">
                            ±{inspectedPoint.activeDataset.verticalPrecisionMeters} m
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-neutral-300 bg-neutral-800/40 p-2 rounded-lg border border-neutral-800">
                        {inspectedPoint.comparisonSummary}
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-neutral-500 pt-1">
                        <span>PDS Product: {inspectedPoint.activeDataset.productId}</span>
                        <a
                          href={inspectedPoint.activeDataset.pdsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold underline"
                        >
                          <span>PDS Record</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Resolution Comparison Gauge */}
                  <div className="bg-neutral-900/80 border border-neutral-800 p-2.5 rounded-xl space-y-2">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                      Resolution Comparison Benchmark
                    </span>
                    <div className="space-y-1.5 text-[9px]">
                      <div>
                        <div className="flex justify-between text-neutral-300 mb-0.5">
                          <span>Local Sample ({inspectedPoint.resolutionMetersPerPixel}m/px)</span>
                          <span className="font-bold" style={{ color: inspectedPoint.color }}>
                            Active
                          </span>
                        </div>
                        <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (1 / inspectedPoint.resolutionMetersPerPixel) * 100)}%`,
                              backgroundColor: inspectedPoint.color,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-neutral-400 mb-0.5">
                          <span>Base MOLA Tile (463m/px)</span>
                          <span>1.0× baseline</span>
                        </div>
                        <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                          <div className="w-[8%] bg-cyan-500 h-full rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-900/70 border border-dashed border-neutral-800 p-6 rounded-xl text-center space-y-2">
                  <div className="p-3 rounded-full bg-cyan-950/60 border border-cyan-800/50 w-fit mx-auto text-cyan-400">
                    <Crosshair className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="text-xs font-bold text-neutral-200">Interactive Elevation Probe</div>
                  <div className="text-[10px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
                    Tap or click anywhere on the Mars surface map to inspect local Digital Terrain Model (DTM) ground sampling resolution, instrument provenance, and resolution gains over base tiles.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HIGH-RES PRESET SITES */}
          {activeTab === 'sites' && (
            <div className="space-y-2">
              <div className="text-[10px] text-neutral-400 flex items-center justify-between">
                <span>Featured High-Res DTM Sites ({PRESET_HIGH_RES_ELEVATION_SITES.length})</span>
                <span className="text-cyan-400 font-bold">Tap to Fly</span>
              </div>

              <div className="space-y-1.5">
                {PRESET_HIGH_RES_ELEVATION_SITES.map((site) => (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => onFlyToSite?.(site.lat, site.lng, site.zoom, site.name)}
                    className="w-full text-left bg-neutral-900/80 border border-neutral-800/80 hover:border-cyan-500/50 p-2.5 rounded-xl transition-all hover:bg-neutral-850 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-neutral-200 text-xs group-hover:text-cyan-300 transition-colors">
                        {site.shortName}
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          site.tier === 'ULTRA_HIGH'
                            ? 'bg-pink-950/80 text-pink-300 border border-pink-700/60'
                            : site.tier === 'HIGH'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                        }`}
                      >
                        {site.badge}
                      </span>
                    </div>

                    <div className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                      {site.description}
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-neutral-500 pt-1.5 mt-1 border-t border-neutral-800/60">
                      <span>{site.resolutionText}</span>
                      <span className="text-cyan-400 font-mono font-bold flex items-center gap-1">
                        <span>{site.gainText}</span>
                        <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PROVENANCE & COVERAGE STATS */}
          {activeTab === 'provenance' && (
            <div className="space-y-2.5 text-[10px]">
              <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-xl space-y-2">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Planetary Elevation GIS Provenance</span>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-1.5">
                  <p>
                    MARSWAY integrates NASA and ESA planetary cartography products standardized to the{' '}
                    <strong className="text-cyan-300">IAU 2000 Mars Areoid 0m Datum</strong>:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-neutral-300">
                    <li>
                      <strong>NASA MGS MOLA MEGDR:</strong> Global baseline grid (128 px/deg, ~463m/px) calibrated with 670M laser pulses.
                    </li>
                    <li>
                      <strong>ESA Mars Express HRSC:</strong> High-resolution multi-orbit stereo digital elevation models (12.5 - 50m/px) across Valles Marineris and Olympus Mons.
                    </li>
                    <li>
                      <strong>NASA MRO HiRISE DTMs:</strong> Ultra-high-resolution photogrammetric stereo models (0.25 - 1.0m/px) covering rover corridors and sample collection landing sites.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Mars Surface Coverage Statistics */}
              <div className="bg-neutral-900/80 border border-neutral-800 p-2.5 rounded-xl space-y-2">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold block">
                  Estimated Planetary Coverage Footprints
                </span>

                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-neutral-300 mb-0.5">
                      <span>MGS MOLA Global Baseline (463m)</span>
                      <span className="text-cyan-400 font-bold">100% Global</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div className="w-full bg-cyan-500 h-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-300 mb-0.5">
                      <span>MEX HRSC Regional Stereo (12.5-50m)</span>
                      <span className="text-amber-400 font-bold">~19.4% Surface</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div className="w-[19.4%] bg-amber-500 h-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-300 mb-0.5">
                      <span>MOLA Polar High Density (115m)</span>
                      <span className="text-emerald-400 font-bold">~5.2% (Caps)</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div className="w-[5.2%] bg-emerald-500 h-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-300 mb-0.5">
                      <span>MRO HiRISE Sub-meter DTMs (≤1m)</span>
                      <span className="text-pink-400 font-bold">~0.38% (Corridors)</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div className="w-[3%] bg-pink-500 h-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
