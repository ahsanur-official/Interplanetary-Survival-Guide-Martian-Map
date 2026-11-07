import React, { useState } from 'react';
import {
  Monitor,
  Tablet,
  Compass,
  X,
  ShieldCheck,
  Navigation,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Activity,
  Heart,
  Wind,
} from 'lucide-react';
import { DisplayViewFormat } from '../../types/mars';

export interface MarsDisplayModeOverlayProps {
  currentFormat: DisplayViewFormat;
  onChangeFormat: (format: DisplayViewFormat) => void;
  currentBearing: number;
  subSolarLat: number;
  currentLat?: number;
  currentLng?: number;
  currentElevM?: number;
  activeRouteName?: string;
  nextWaypointName?: string;
  distanceToNextKm?: number;
  estimatedRemainingMinutes?: number;
  onOpenLogSample?: () => void;
  onOpenPovViewer?: () => void;
  onResetBearing?: () => void;
}

export const MarsDisplayModeOverlay: React.FC<MarsDisplayModeOverlayProps> = ({
  currentFormat,
  onChangeFormat,
  currentBearing,
  currentLat = 18.4447,
  currentLng = 77.4509,
  currentElevM = -2560,
  nextWaypointName,
  distanceToNextKm,
  estimatedRemainingMinutes,
}) => {
  const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState(false);

  // In default Habitat Console mode, the standard UI serves as mission operations without any clutter
  if (currentFormat === 'HABITAT_CONSOLE') {
    return null;
  }

  // FIELD TABLET MODE: Sleek tactical banner with quick Exit button
  if (currentFormat === 'FIELD_TABLET') {
    return (
      <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-2 sm:p-4">
        {/* Subtle amber tactile border */}
        <div className="absolute inset-0 border-2 border-amber-500/40 rounded-xl pointer-events-none" />

        {/* Top Tactical Banner */}
        <div className="pointer-events-auto mx-auto max-w-lg w-full bg-[#0a0f1d]/95 backdrop-blur-xl border border-amber-500/60 rounded-xl px-3 py-2 shadow-2xl flex items-center justify-between text-amber-300 font-mono text-xs mt-12 sm:mt-14">
          <div className="flex items-center gap-2">
            <Tablet className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-400/80">Field Tablet Mode</div>
              <div className="text-white text-xs font-semibold">
                {currentLat >= 0 ? `${currentLat.toFixed(2)}°N` : `${Math.abs(currentLat).toFixed(2)}°S`}, {currentLng >= 0 ? `${currentLng.toFixed(2)}°E` : `${Math.abs(currentLng).toFixed(2)}°W`} ({currentElevM > 0 ? `+${currentElevM}` : currentElevM}m)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-400">{Math.round(currentBearing)}° TRUE</span>
            <button
              type="button"
              onClick={() => onChangeFormat('HABITAT_CONSOLE')}
              className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-[11px] font-sans font-medium flex items-center gap-1 transition cursor-pointer"
              title="Exit Field Tablet Mode"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* Empty bottom space to not block bottom bar */}
        <div />
      </div>
    );
  }

  // VISOR HUD MODE: Authentic, lightweight helmet-projected HUD with zero center obstruction
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between overflow-hidden">
      {/* Subtle curved visor vignette */}
      <div className="absolute inset-0 border-[4px] sm:border-[8px] border-emerald-500/15 rounded-[24px] sm:rounded-[40px] shadow-[inset_0_0_60px_rgba(16,185,129,0.12)] pointer-events-none" />

      {/* Top HUD Status Bar (Docked at top-center, sleek, compact) */}
      <div className="pointer-events-auto mx-auto max-w-md w-full px-3 mt-12 sm:mt-14 text-emerald-400 font-mono">
        <div className="bg-[#030906]/90 backdrop-blur-xl border border-emerald-500/40 rounded-full px-3 py-1.5 shadow-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="font-bold text-white text-[11px]">VISOR HUD</span>
            <span className="text-[10px] text-emerald-300/80 hidden sm:inline">• EMU NOMINAL (29.6 kPa)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-200">
              <Compass className="w-3 h-3 text-emerald-400" />
              <span>{Math.round(currentBearing)}°</span>
            </div>
            <button
              type="button"
              onClick={() => onChangeFormat('HABITAT_CONSOLE')}
              className="px-2 py-0.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-white text-[10px] font-sans flex items-center gap-1 transition cursor-pointer ml-1"
              title="Exit Visor HUD Mode"
            >
              <X className="w-3 h-3" />
              <span>Exit HUD</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compact, Foldable Mini Telemetry Badge (Docked at bottom-left, well away from center) */}
      <div className="pointer-events-auto px-4 pb-16 sm:pb-8 flex justify-start">
        <div className="bg-[#030906]/92 backdrop-blur-xl border border-emerald-500/40 rounded-xl p-2 shadow-2xl text-emerald-300 font-mono text-[10px] max-w-[210px]">
          <div
            className="flex items-center justify-between gap-2 cursor-pointer pb-1 border-b border-emerald-500/30"
            onClick={() => setIsTelemetryCollapsed(!isTelemetryCollapsed)}
          >
            <div className="flex items-center gap-1 font-bold text-white">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>SPACESUIT TELEMETRY</span>
            </div>
            {isTelemetryCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </div>

          {!isTelemetryCollapsed && (
            <div className="space-y-0.5 pt-1 text-[9.5px]">
              <div className="flex justify-between">
                <span className="text-neutral-400">O₂ Consumption:</span>
                <span className="text-emerald-300 font-bold">1.25 L/min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Heart Rate:</span>
                <span className="text-white font-bold">84 BPM</span>
              </div>
              {nextWaypointName && (
                <div className="flex justify-between pt-1 border-t border-emerald-500/20 text-cyan-300">
                  <span className="truncate max-w-[110px]">{nextWaypointName}:</span>
                  <span>{distanceToNextKm !== undefined ? `${distanceToNextKm.toFixed(1)}km` : 'Target'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
