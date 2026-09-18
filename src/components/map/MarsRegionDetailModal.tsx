import React from 'react';
import {
  X,
  MapPin,
  Maximize2,
  Mountain,
  Compass,
  Layers,
  Camera,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { MarsRegion } from '../../data/marsRegions';
import { MarsFeature } from '../../data/marsNomenclature';

interface MarsRegionDetailModalProps {
  region: MarsRegion | null;
  featuresInside: MarsFeature[];
  onClose: () => void;
  onFlyToFeature: (feature: MarsFeature) => void;
  onOpenNASAImages: (query: string) => void;
  onFitRegionBounds: (region: MarsRegion) => void;
}

export function MarsRegionDetailModal({
  region,
  featuresInside,
  onClose,
  onFlyToFeature,
  onOpenNASAImages,
  onFitRegionBounds,
}: MarsRegionDetailModalProps) {
  if (!region) return null;

  return (
    <div className="fixed inset-0 z-45 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      {/* Main Drawer / Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="region-modal-title"
        className="relative w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[82vh] bg-[#0c101a] border border-neutral-700/80 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/90 pointer-events-auto flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
      >
        {/* Top Accent Strip with region border color */}
        <div
          className="h-1.5 w-full shrink-0"
          style={{
            backgroundColor: region.borderColor,
            boxShadow: `0 0 12px ${region.borderColor}`,
          }}
        />

        {/* Modal Header */}
        <div className="px-4 py-3.5 border-b border-neutral-800 flex items-start justify-between gap-3 bg-[#0e1422] shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg mt-0.5 border"
              style={{
                backgroundColor: `${region.borderColor}20`,
                borderColor: region.borderColor,
                color: region.textColor,
              }}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${region.badgeBg}`}
                >
                  {region.category}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {region.center[0] > 0 ? `+${region.center[0]}` : region.center[0]}°N,{' '}
                  {region.center[1] > 0 ? `+${region.center[1]}` : region.center[1]}°E
                </span>
              </div>
              <h2 id="region-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight truncate mt-0.5">
                {region.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onFitRegionBounds(region)}
              className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer border border-neutral-700/60"
              title="Fit map to region boundary"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer border border-neutral-700/60"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Quick Metrics Bar: Area & Dimensions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
                Total Surface Area
              </span>
              <span className="text-sm font-bold font-mono text-white mt-0.5 block">
                {region.areaKm2.toLocaleString()} km²
              </span>
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
                Features Inside
              </span>
              <span className="text-sm font-bold font-mono text-amber-300 mt-0.5 block">
                {featuresInside.length} Named Sites
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
                Boundary Extent
              </span>
              <span className="text-[11px] font-semibold text-neutral-200 mt-0.5 block truncate">
                {region.dimensions}
              </span>
            </div>
          </div>

          {/* Description & Geological Formation */}
          <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-neutral-300 font-bold text-xs">
              <Info className="w-3.5 h-3.5 text-orange-400" />
              <span>Overview & Geomorphology</span>
            </div>
            <p className="text-neutral-300 leading-relaxed text-xs">
              {region.description}
            </p>
            <div className="pt-1 border-t border-neutral-800/80 mt-2">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block mb-0.5">
                Geological Origin:
              </span>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                {region.geologicalSignificance}
              </p>
            </div>
          </div>

          {/* KEY HIGHLIGHTS CHECKLIST */}
          <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Key Physical Highlights & Structures
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {region.keyHighlights.map((hl, idx) => (
                <div key={idx} className="flex items-start gap-2 text-neutral-300 text-[11px]">
                  <CheckCircle2
                    className="w-3.5 h-3.5 shrink-0 mt-0.5"
                    style={{ color: region.borderColor }}
                  />
                  <span>{hl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* WHAT'S INSIDE THIS AREA: FULL LIST OF FEATURES & ROVERS */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                <span className="font-bold text-white text-xs">
                  What&apos;s Inside This Area ({featuresInside.length} Features)
                </span>
              </div>
              <span className="text-[10px] text-neutral-400">Click to fly to feature</span>
            </div>

            {featuresInside.length === 0 ? (
              <div className="p-4 bg-neutral-900/50 rounded-xl border border-neutral-800 text-center text-neutral-400">
                <span>No major primary catalog landmarks inside this boundary.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {featuresInside.map((feat) => (
                  <div
                    key={feat.id}
                    onClick={() => onFlyToFeature(feat)}
                    className="p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800/90 hover:border-orange-500/70 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-white text-[11px] group-hover:text-orange-400 transition-colors truncate">
                          {feat.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 border border-neutral-700 text-orange-300 shrink-0">
                          {feat.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 line-clamp-2 leading-tight">
                        {feat.originName || feat.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-800/60 text-[10px] font-mono">
                      <span className="text-cyan-300">
                        {feat.elevationM > 0 ? `+${feat.elevationM}` : feat.elevationM}m
                        {feat.diameterKm ? ` • ⌀${feat.diameterKm}km` : ''}
                      </span>
                      <span className="text-orange-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform font-bold text-[9px]">
                        Fly to <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-t border-neutral-800 bg-[#0e1422] flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => onOpenNASAImages(region.name)}
            className="px-3 py-2 rounded-xl bg-orange-950/80 border border-orange-700/80 hover:bg-orange-900 text-orange-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <Camera className="w-3.5 h-3.5 text-orange-400" />
            <span>NASA Close-Up Images</span>
          </button>

          <button
            onClick={() => onFitRegionBounds(region)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-cyan-950"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Zoom & Fit Area</span>
          </button>
        </div>
      </div>
    </div>
  );
}
