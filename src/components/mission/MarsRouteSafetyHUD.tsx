import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Maximize2,
  X,
  Compass,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import { RouteSafetyAssessment } from '../../engine/marsRouteSafetyAnalyzer';
import { MarsTransportModeType, RouteMode } from '../../engine/marsAStarRouter';

export interface MarsRouteSafetyHUDProps {
  assessment: RouteSafetyAssessment | null;
  activeMode: RouteMode;
  onSelectMode: (mode: RouteMode) => void;
  transportMode: MarsTransportModeType;
  onChangeTransportMode: (mode: MarsTransportModeType) => void;
  onApplySaferRoute: () => void;
  onOpenFullModal: () => void;
  onFlyToRoute: () => void;
  onSwapPoints: () => void;
  onPickNewDestination: () => void;
  showComparisonOnMap: boolean;
  onToggleShowComparison: () => void;
  onClose?: () => void;
  onCancelRoute?: () => void;
}

export const MarsRouteSafetyHUD: React.FC<MarsRouteSafetyHUDProps> = ({
  assessment,
  activeMode,
  onApplySaferRoute,
  onOpenFullModal,
  onFlyToRoute,
  onClose,
  onCancelRoute,
}) => {
  if (!assessment) return null;

  const {
    startPoint,
    endPoint,
    isSafe,
    safetyStatus,
    maxDirectSlopeDeg,
    issues,
    warningHeadlineEn,
    detailedAnalysisEn,
    comparison,
  } = assessment;

  const hasIssues = !isSafe || safetyStatus === 'DANGEROUS' || safetyStatus === 'CAUTION';
  const isDangerous = safetyStatus === 'DANGEROUS';

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Route Safety Status"
      className={`fixed top-14 sm:top-18 left-2 sm:left-auto right-2 sm:right-4 w-auto sm:w-[410px] max-w-[calc(100vw-16px)] max-h-[calc(100vh-140px)] overflow-y-auto z-[500] pointer-events-auto rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-xs font-sans shadow-2xl backdrop-blur-2xl transition-all duration-200 border animate-in slide-in-from-top-3 ${
        hasIssues
          ? isDangerous
            ? 'bg-[#0f090b]/98 border-red-500/60 shadow-red-950/80 ring-1 ring-red-500/40'
            : 'bg-[#0f0d09]/98 border-amber-500/60 shadow-amber-950/80 ring-1 ring-amber-500/40'
          : 'bg-[#07130f]/98 border-emerald-500/60 shadow-emerald-950/80 ring-1 ring-emerald-500/40'
      }`}
    >
      {/* 1. Header with Status Icon, Title & Close */}
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              hasIssues
                ? isDangerous
                  ? 'bg-red-500/20 border-red-400 text-red-400 shadow-md shadow-red-950'
                  : 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-md shadow-amber-950'
                : 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-md shadow-emerald-950'
            }`}
          >
            {hasIssues ? (
              isDangerous ? (
                <ShieldAlert className="w-4 h-4 animate-pulse" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-white text-sm tracking-tight truncate">
                {hasIssues ? 'Route Issue Detected' : 'Route is 100% Safe'}
              </h3>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase font-mono tracking-wider ${
                  hasIssues
                    ? isDangerous
                      ? 'bg-red-500 text-white'
                      : 'bg-amber-500 text-neutral-950'
                    : 'bg-emerald-500 text-neutral-950'
                }`}
              >
                {safetyStatus}
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
              Direct: <strong className="text-white">{assessment.directDistanceKm} km</strong> • Max Slope:{' '}
              <strong className={maxDirectSlopeDeg > 15 ? 'text-red-400' : 'text-emerald-400'}>
                {maxDirectSlopeDeg}°
              </strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          title="Dismiss Modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Route Waypoints Bar (From Point A -> Final Destination Point B) */}
      <div className="mt-2.5 bg-black/60 border border-white/10 rounded-xl p-2 font-mono text-[11px] space-y-1 shrink-0">
        <div className="flex items-center gap-1.5 text-neutral-300 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="text-neutral-500 text-[10px]">BASE (A):</span>
          <span className="text-white font-semibold truncate">
            {startPoint.name?.split('(')[0]?.trim() || `${startPoint.lat.toFixed(2)}°, ${startPoint.lng.toFixed(2)}°`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-neutral-300 truncate border-t border-white/5 pt-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
          <span className="text-neutral-500 text-[10px]">DEST (B):</span>
          <span className="text-cyan-300 font-semibold truncate">
            {endPoint.name?.split('(')[0]?.trim() || `${endPoint.lat.toFixed(2)}°, ${endPoint.lng.toFixed(2)}°`}
          </span>
        </div>
      </div>

      {/* 3. CASE A: ROUTE HAS ISSUES (Red Direct Line + Green Safer Bypass Line) */}
      {hasIssues ? (
        <div className="mt-2.5 space-y-2.5">
          {/* Issue Explanation Box (Red Direct Line) */}
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-red-300 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
              <span>Direct Path Issue (Red Dashed Line)</span>
            </div>
            <p className="text-[11px] text-red-200/90 leading-relaxed font-sans">
              {detailedAnalysisEn || warningHeadlineEn}
            </p>

            {/* Identified Hazards Chips */}
            {issues.length > 0 && (
              <div className="pt-1 border-t border-red-500/20 space-y-1">
                {issues.slice(0, 2).map((issue, idx) => (
                  <div
                    key={issue.id || idx}
                    className="flex items-start gap-1.5 text-[10px] text-neutral-300 bg-black/40 rounded-lg p-1.5 border border-red-900/50"
                  >
                    <span className="text-red-400 font-bold shrink-0">⚠️</span>
                    <div className="min-w-0">
                      <strong className="text-white">{issue.hazardName}:</strong>{' '}
                      <span className="text-neutral-300">{issue.issueSummaryEn}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safer Solution Box (Green Line Leading to Final Destination) */}
          <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Recommended Safer Path (Green Line)</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                0 Hazards
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/90 leading-relaxed font-sans">
              Shortest safe bypass routing around dangerous scarps. Slope reduced to{' '}
              <strong className="text-white">{comparison.saferSlope}°</strong> (safe for EVA) with only{' '}
              <strong className="text-white">+{comparison.detourExtraDistanceKm} km</strong> detour to target.
            </p>
          </div>

          {/* Functional Actions */}
          <div className="pt-1 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={onApplySaferRoute}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95 ${
                activeMode === 'safest'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/80 ring-1 ring-emerald-400/50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{activeMode === 'safest' ? 'Safe Corridor Active' : 'Use Safer Route (Green Line)'}</span>
            </button>

            {onCancelRoute && (
              <button
                type="button"
                onClick={onCancelRoute}
                className="py-2.5 px-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white font-semibold text-xs border border-white/10 transition cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 4. CASE B: ROUTE IS 100% SAFE (Solid Green Line) */
        <div className="mt-2.5 space-y-2.5">
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Direct Path is 100% Safe (Green Line)</span>
            </div>
            <p className="text-[11px] text-emerald-100/90 leading-relaxed font-sans">
              Zero steep scarps, loose sand drifts, or boulder fields detected along this corridor. Safe for suited
              astronaut traverse or rover navigation.
            </p>
          </div>

          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={onFlyToRoute}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Fit to Map</span>
            </button>

            <button
              type="button"
              onClick={onOpenFullModal}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 text-xs font-semibold border border-white/10 transition cursor-pointer flex items-center gap-1"
              title="View full elevation profile and waypoint sequence"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Details</span>
            </button>

            {onCancelRoute && (
              <button
                type="button"
                onClick={onCancelRoute}
                className="py-2 px-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs border border-white/10 transition cursor-pointer"
              >
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
