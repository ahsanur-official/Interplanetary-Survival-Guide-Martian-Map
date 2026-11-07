import React, { useState } from 'react';
import {
  X,
  Globe2,
  Mountain,
  Compass,
  ArrowRight,
  Maximize2,
  Sparkles,
  Layers,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { EARTH_MARS_COMPARISONS, EarthComparisonItem } from '../../data/earthMarsComparisons';

interface EarthScaleComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeComparisonId?: string;
  onSelectComparison?: (item: EarthComparisonItem) => void;
  onFlyToMartianFeature?: (lat: number, lng: number, zoom?: number) => void;
  onToggleMapOverlay?: (item: EarthComparisonItem | null) => void;
  isOverlayActiveOnMap?: boolean;
}

export const EarthScaleComparisonModal: React.FC<EarthScaleComparisonModalProps> = ({
  isOpen,
  onClose,
  activeComparisonId,
  onSelectComparison,
  onFlyToMartianFeature,
  onToggleMapOverlay,
  isOverlayActiveOnMap = false,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    activeComparisonId || 'olympus_vs_everest'
  );

  if (!isOpen) return null;

  const currentItem =
    EARTH_MARS_COMPARISONS.find((c) => c.id === selectedId) ||
    EARTH_MARS_COMPARISONS[0];

  const handleSelect = (item: EarthComparisonItem) => {
    setSelectedId(item.id);
    if (onSelectComparison) onSelectComparison(item);
  };

  const handleFlyTo = () => {
    if (onFlyToMartianFeature && currentItem.overlayBoundsKm) {
      onFlyToMartianFeature(
        currentItem.overlayBoundsKm.centerLat,
        currentItem.overlayBoundsKm.centerLng,
        5
      );
      onClose();
    }
  };

  const handleToggleOverlay = () => {
    if (onToggleMapOverlay) {
      onToggleMapOverlay(isOverlayActiveOnMap ? null : currentItem);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c101a] border border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-950/40 flex flex-col overflow-hidden text-neutral-200">
        {/* Modal Header */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-cyan-950/40 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-950 border border-cyan-700/60 text-cyan-400 shrink-0">
              <Globe2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold bg-cyan-950/80 px-1.5 sm:px-2 py-0.5 rounded border border-cyan-800/60">
                  Esri Inspired
                </span>
                <span className="text-[9px] sm:text-[10px] text-neutral-400 truncate hidden xs:inline">GCS Mars 2000 Scale</span>
              </div>
              <h2 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate">
                Earth vs. Mars Scale Comparison
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 ml-2"
            title="Close Scale Comparison"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Quick Selection Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {EARTH_MARS_COMPARISONS.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-lg shadow-cyan-950'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-[9px] uppercase font-mono font-semibold tracking-wider text-cyan-400/90">
                    {item.earthCategory}
                  </div>
                  <div className="font-bold text-xs truncate text-white">{item.marsName.split('(')[0]}</div>
                  <div className="text-[10px] text-neutral-400 truncate">vs {item.earthName.split('&')[0]}</div>
                </button>
              );
            })}
          </div>

          {/* Active Comparison Spotlight Hero Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-neutral-900 via-[#0e1626] to-[#0c1c33] border border-cyan-800/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Scale Analysis
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {currentItem.marsName} <span className="text-neutral-500 font-normal">vs</span>{' '}
                  <span className="text-cyan-300">{currentItem.earthName}</span>
                </h3>
              </div>
              <div className="px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-700/80 text-cyan-300 font-mono text-xs font-bold self-start sm:self-center">
                {currentItem.ratioSummary.split('•')[0]}
              </div>
            </div>

            <p className="text-neutral-200 text-xs sm:text-sm font-medium leading-relaxed">
              {currentItem.headline}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-300 pt-1">
              <span className="px-2 py-0.5 rounded bg-neutral-800/80 border border-neutral-700 font-mono text-cyan-300">
                {currentItem.ratioSummary}
              </span>
            </div>
          </div>

          {/* Side-by-Side Dimension Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Martian Feature Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-orange-950/30 to-neutral-900/80 border border-orange-800/50 space-y-3">
              <div className="flex items-center justify-between border-b border-orange-900/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />
                  <span className="font-bold text-white text-sm tracking-tight">
                    🔴 Mars: {currentItem.marsName}
                  </span>
                </div>
                <span className="text-[9.5px] font-mono text-orange-400 px-1.5 py-0.5 rounded bg-orange-950/60 border border-orange-800/60">
                  Planet Radius: 3,389 km
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Height / Elevation</span>
                  <span className="font-mono font-bold text-orange-200">
                    {currentItem.marsMetrics.heightOrLength}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Width / Diameter</span>
                  <span className="font-mono font-bold text-orange-200">
                    {currentItem.marsMetrics.widthOrDiameter}
                  </span>
                </div>
                {currentItem.marsMetrics.depthOrRelief && (
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Vertical Relief / Depth</span>
                    <span className="font-mono font-bold text-orange-200">
                      {currentItem.marsMetrics.depthOrRelief}
                    </span>
                  </div>
                )}
                {currentItem.marsMetrics.areaKm2 && (
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400">Estimated Area</span>
                    <span className="font-mono font-bold text-orange-200">
                      {currentItem.marsMetrics.areaKm2}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Earth Equivalent Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-cyan-950/30 to-neutral-900/80 border border-cyan-800/50 space-y-3">
              <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
                  <span className="font-bold text-white text-sm tracking-tight">
                    🔵 Earth: {currentItem.earthName}
                  </span>
                </div>
                <span className="text-[9.5px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
                  Planet Radius: 6,371 km
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Height / Elevation</span>
                  <span className="font-mono font-bold text-cyan-200">
                    {currentItem.earthMetrics.heightOrLength}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Width / Diameter</span>
                  <span className="font-mono font-bold text-cyan-200">
                    {currentItem.earthMetrics.widthOrDiameter}
                  </span>
                </div>
                {currentItem.earthMetrics.depthOrRelief && (
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Vertical Relief / Depth</span>
                    <span className="font-mono font-bold text-cyan-200">
                      {currentItem.earthMetrics.depthOrRelief}
                    </span>
                  </div>
                )}
                {currentItem.earthMetrics.areaKm2 && (
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400">Estimated Area</span>
                    <span className="font-mono font-bold text-cyan-200">
                      {currentItem.earthMetrics.areaKm2}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Geological Key Takeaways */}
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Scientific Insights on Physical Scale</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentItem.keyTakeaways.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/60 text-xs text-neutral-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 bg-neutral-900 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Target Coordinates: {currentItem.overlayBoundsKm.centerLat}°N,{' '}
              {currentItem.overlayBoundsKm.centerLng}°E
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Toggle Overlay Button */}
            <button
              type="button"
              onClick={handleToggleOverlay}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                isOverlayActiveOnMap
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-950'
                  : 'bg-cyan-950/80 text-cyan-300 border-cyan-700/70 hover:bg-cyan-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isOverlayActiveOnMap ? 'Earth Stencil Active on Map' : 'Project Earth Stencil on Map'}</span>
            </button>

            {/* Fly to Landmark Button */}
            <button
              type="button"
              onClick={handleFlyTo}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-orange-950"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Fly to Landmark</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
