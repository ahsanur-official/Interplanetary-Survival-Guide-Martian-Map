import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Navigation,
  Sparkles,
  Maximize2,
  Minimize2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Footprints,
  Truck,
  Languages,
  Eye,
  Crosshair,
  Compass,
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
}

export const MarsRouteSafetyHUD: React.FC<MarsRouteSafetyHUDProps> = ({
  assessment,
  activeMode,
  onSelectMode,
  transportMode,
  onChangeTransportMode,
  onApplySaferRoute,
  onOpenFullModal,
  onFlyToRoute,
  onSwapPoints,
  onPickNewDestination,
  showComparisonOnMap,
  onToggleShowComparison,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showIssuesList, setShowIssuesList] = useState(true);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');

  if (!assessment) return null;

  const {
    startPoint,
    endPoint,
    isSafe,
    safetyStatus,
    overallSafetyScore,
    maxDirectSlopeDeg,
    issues,
    warningHeadlineBn,
    warningHeadlineEn,
    detailedAnalysisBn,
    detailedAnalysisEn,
    suggestedSaferRoute,
    comparison,
  } = assessment;

  const isDangerous = safetyStatus === 'DANGEROUS';
  const isCaution = safetyStatus === 'CAUTION';

  // Status color schemes
  const statusTheme = isDangerous
    ? {
        border: 'border-red-500/60',
        bg: 'bg-red-950/80',
        text: 'text-red-400',
        badge: 'bg-red-500 text-white',
        glow: 'shadow-[0_0_25px_rgba(239,68,68,0.25)]',
      }
    : isCaution
    ? {
        border: 'border-amber-500/60',
        bg: 'bg-amber-950/80',
        text: 'text-amber-400',
        badge: 'bg-amber-500 text-neutral-950 font-bold',
        glow: 'shadow-[0_0_25px_rgba(245,158,11,0.2)]',
      }
    : {
        border: 'border-emerald-500/60',
        bg: 'bg-emerald-950/80',
        text: 'text-emerald-400',
        badge: 'bg-emerald-500 text-neutral-950 font-bold',
        glow: 'shadow-[0_0_25px_rgba(16,185,129,0.25)]',
      };

  return (
    <div
      className={`fixed z-[500] bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-[460px] max-h-[85vh] flex flex-col rounded-2xl glass-panel ${statusTheme.border} ${statusTheme.glow} transition-all duration-300 font-sans select-none backdrop-blur-xl bg-[#090e17]/95 border shadow-2xl overflow-hidden`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          {isDangerous ? (
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
              <ShieldAlert className="w-4 h-4" />
            </div>
          ) : isCaution ? (
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <AlertTriangle className="w-4 h-4" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <ShieldCheck className="w-4 h-4" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs tracking-wider text-white uppercase font-mono">
                {lang === 'bn' ? 'রুট সেফটি হাব' : 'Route Safety Hub'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${statusTheme.badge}`}>
                {safetyStatus}
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">
              Score: <strong className={statusTheme.text}>{overallSafetyScore}/100</strong> • Max Slope:{' '}
              <strong className={maxDirectSlopeDeg > 15 ? 'text-red-400' : 'text-neutral-200'}>
                {maxDirectSlopeDeg}°
              </strong>
            </span>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1">
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="px-2 py-1 rounded-md text-[10px] font-bold font-mono bg-white/5 hover:bg-white/15 text-neutral-300 border border-white/10 transition"
            title="Toggle Language (বাংলা / English)"
          >
            {lang === 'bn' ? 'বাংলা' : 'EN'}
          </button>

          {/* Minimize / Expand */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition ml-0.5"
              title="Close HUD"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Minimized Quick Pill Bar */}
      {isMinimized ? (
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className={`w-2 h-2 rounded-full ${isDangerous ? 'bg-red-500 animate-ping' : isCaution ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
            <span className="truncate text-neutral-200 text-[11px]">
              {endPoint.name || 'Target Destination'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isDangerous && (
              <button
                onClick={onApplySaferRoute}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] shadow-sm flex items-center gap-1 transition"
              >
                <Sparkles className="w-3 h-3" />
                {lang === 'bn' ? 'নিরাপদ রুট' : 'Safer Way'}
              </button>
            )}
            <button
              onClick={() => setIsMinimized(false)}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 text-[10.5px] transition"
            >
              {lang === 'bn' ? 'বিস্তারিত' : 'Details'}
            </button>
          </div>
        </div>
      ) : (
        /* Full Expanded Body */
        <div className="flex flex-col overflow-y-auto max-h-[72vh] p-3.5 space-y-3">
          {/* Start to Destination Summary with Swap and Edit */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between text-neutral-400 text-[10.5px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <strong>{lang === 'bn' ? 'শুরুর স্থান (Base)' : 'Departure'}</strong>
              </span>
              <button
                onClick={onSwapPoints}
                className="text-[10px] text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1"
                title="Swap Start & Destination"
              >
                <RotateCcw className="w-3 h-3" /> {lang === 'bn' ? 'অদলবদল' : 'Swap'}
              </button>
            </div>
            <div className="text-white font-semibold text-xs truncate pl-3">
              {startPoint.name || `${startPoint.lat.toFixed(3)}°, ${startPoint.lng.toFixed(3)}°`}
            </div>

            <div className="border-t border-white/5 pt-1.5 flex items-center justify-between text-neutral-400 text-[10.5px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <strong>{lang === 'bn' ? 'গন্তব্য (Destination)' : 'Target'}</strong>
              </span>
              <button
                onClick={onPickNewDestination}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
              >
                <Crosshair className="w-3 h-3" /> {lang === 'bn' ? 'নতুন গন্তব্য' : 'Pick Target'}
              </button>
            </div>
            <div className="text-cyan-300 font-semibold text-xs truncate pl-3 flex items-center justify-between">
              <span className="truncate">{endPoint.name || `${endPoint.lat.toFixed(3)}°, ${endPoint.lng.toFixed(3)}°`}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 shrink-0 ml-2">
                {assessment.directDistanceKm} km
              </span>
            </div>
          </div>

          {/* Safety Diagnostic Headline Alert */}
          <div className={`p-3 rounded-xl border ${statusTheme.border} ${statusTheme.bg} space-y-1.5 transition-all`}>
            <div className="flex items-start gap-2">
              <div className="shrink-0 mt-0.5">
                {isDangerous ? (
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                ) : isCaution ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-xs leading-snug">
                  {lang === 'bn' ? warningHeadlineBn : warningHeadlineEn}
                </h4>
                <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                  {lang === 'bn' ? detailedAnalysisBn : detailedAnalysisEn}
                </p>
              </div>
            </div>

            {/* List of Specific Issues / Hazards Encountered */}
            {issues.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5">
                <button
                  onClick={() => setShowIssuesList(!showIssuesList)}
                  className="w-full flex items-center justify-between text-[11px] font-bold text-neutral-200 hover:text-white"
                >
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    {lang === 'bn'
                      ? `সনাক্তকৃত বিপদসমূহ (${issues.length} টি)`
                      : `Identified Hazards (${issues.length})`}
                  </span>
                  {showIssuesList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showIssuesList && (
                  <div className="space-y-2 mt-1">
                    {issues.map((issue, idx) => (
                      <div
                        key={issue.id || idx}
                        className="bg-black/50 border border-white/10 rounded-lg p-2 text-[10.5px] space-y-1 font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                            {issue.hazardName}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              issue.riskLevel === 'CRITICAL'
                                ? 'bg-red-600 text-white'
                                : issue.riskLevel === 'HIGH'
                                ? 'bg-amber-600 text-white'
                                : 'bg-yellow-600 text-neutral-950'
                            }`}
                          >
                            {issue.riskLevel}
                          </span>
                        </div>
                        <p className="text-neutral-300 text-[10px] font-sans leading-tight">
                          {lang === 'bn' ? issue.issueSummaryBn : issue.issueSummaryEn}
                        </p>
                        <div className="text-emerald-400 text-[9.5px] flex items-center gap-1 font-sans">
                          <Sparkles className="w-2.5 h-2.5 shrink-0" />
                          <span>{lang === 'bn' ? issue.remedySuggestionBn : issue.remedySuggestionEn}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SAFER WAY PROPOSAL & COMPARISON BOX */}
          <div className="bg-gradient-to-br from-emerald-950/70 to-neutral-900/90 border border-emerald-500/50 rounded-xl p-3 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="font-bold text-xs text-white">
                  {lang === 'bn' ? 'প্রস্তাবিত নিরাপদ সমাধান' : 'Suggested Safer Solution'}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold font-mono">
                {lang === 'bn' ? '০ টি ঝুঁকি • ১০০% ক্লিয়ার' : '0 Hazards • Safe Clearance'}
              </span>
            </div>

            {/* Metrics Comparison Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
              {/* Direct Path Column */}
              <div className="bg-black/40 border border-white/5 rounded-lg p-2 space-y-1">
                <div className="text-neutral-400 font-semibold flex items-center gap-1">
                  <span>❌ {lang === 'bn' ? 'সরাসরি রুট' : 'Direct Line'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">{lang === 'bn' ? 'ঢাল' : 'Slope'}:</span>
                  <span className="text-red-400 font-bold">{comparison.directSlope}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">{lang === 'bn' ? 'বিপদ' : 'Hazards'}:</span>
                  <span className="text-red-400 font-bold">{comparison.directHazardsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">{lang === 'bn' ? 'সুরক্ষা' : 'Safety'}:</span>
                  <span className="text-red-400 font-bold">{comparison.safetyScoreDirect}/100</span>
                </div>
              </div>

              {/* Suggested Safe Path Column */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2 space-y-1">
                <div className="text-emerald-300 font-semibold flex items-center gap-1">
                  <span>✨ {lang === 'bn' ? 'নিরাপদ রুট' : 'Safer Corridor'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">{lang === 'bn' ? 'ঢাল' : 'Slope'}:</span>
                  <span className="text-emerald-400 font-bold">{comparison.saferSlope}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">{lang === 'bn' ? 'দূরত্ব' : 'Detour'}:</span>
                  <span className="text-neutral-300">+{comparison.detourExtraDistanceKm} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">{lang === 'bn' ? 'সুরক্ষা' : 'Safety'}:</span>
                  <span className="text-emerald-400 font-bold">{comparison.safetyScoreSafer}/100</span>
                </div>
              </div>
            </div>

            {/* Quick 1-Click Action to Apply Safer Route */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={onApplySaferRoute}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-95 ${
                  activeMode === 'safest'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 font-mono'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold shadow-emerald-950/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {activeMode === 'safest'
                    ? lang === 'bn'
                      ? '✅ নিরাপদ রুট সক্রিয় রয়েছে'
                      : '✅ Safe Corridor Active'
                    : lang === 'bn'
                    ? '🛡️ প্রস্তাবিত নিরাপদ রুট প্রয়োগ করুন'
                    : '🛡️ Apply Recommended Safer Route'}
                </span>
              </button>

              <button
                onClick={onToggleShowComparison}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  showComparisonOnMap
                    ? 'bg-cyan-600/30 text-cyan-200 border-cyan-400'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10'
                }`}
                title="Toggle visual comparison of direct hazardous line vs. safe detour on map"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">
                  {showComparisonOnMap
                    ? lang === 'bn'
                      ? 'তুলনা দৃশ্যমান'
                      : 'Comparison On'
                    : lang === 'bn'
                    ? 'ম্যাপে তুলনা'
                    : 'Compare on Map'}
                </span>
              </button>
            </div>
          </div>

          {/* Strategy Modes & Transport Quick Bar */}
          <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 space-y-2">
            <div className="flex items-center justify-between text-[10.5px] text-neutral-400">
              <span className="font-semibold">{lang === 'bn' ? 'রুটের ধরন ও বাহন' : 'Strategy & Vehicle'}</span>
              <button
                onClick={onFlyToRoute}
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Compass className="w-3 h-3" /> {lang === 'bn' ? 'ক্যামেরা ফোকাস' : 'Fit to Map'}
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
              <button
                onClick={() => onSelectMode('safest')}
                className={`py-1.5 px-1 rounded-lg font-bold flex items-center justify-center gap-1 transition ${
                  activeMode === 'safest'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>{lang === 'bn' ? 'নিরাপদ' : 'Safest'}</span>
              </button>

              <button
                onClick={() => onSelectMode('shortest')}
                className={`py-1.5 px-1 rounded-lg font-bold flex items-center justify-center gap-1 transition ${
                  activeMode === 'shortest'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                <Navigation className="w-3 h-3" />
                <span>{lang === 'bn' ? 'সরাসরি' : 'Direct'}</span>
              </button>

              <button
                onClick={() => onSelectMode('science')}
                className={`py-1.5 px-1 rounded-lg font-bold flex items-center justify-center gap-1 transition ${
                  activeMode === 'science'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>{lang === 'bn' ? 'সায়েন্স' : 'Science'}</span>
              </button>
            </div>

            {/* Transport Mode Buttons */}
            <div className="flex items-center gap-1 text-[10.5px]">
              <span className="text-neutral-500 text-[10px] font-mono mr-1">Vehicle:</span>
              <button
                onClick={() => onChangeTransportMode('foot')}
                className={`px-2 py-1 rounded-md flex items-center gap-1 transition ${
                  transportMode === 'foot'
                    ? 'bg-orange-500/30 text-orange-200 border border-orange-500/50'
                    : 'bg-white/5 text-neutral-400 hover:text-neutral-200'
                }`}
                title="Foot Marswalk (Suited pedestrian EVA)"
              >
                <Footprints className="w-3 h-3" />
                <span>Foot</span>
              </button>

              <button
                onClick={() => onChangeTransportMode('unpressurized_rover')}
                className={`px-2 py-1 rounded-md flex items-center gap-1 transition ${
                  transportMode === 'unpressurized_rover'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50'
                    : 'bg-white/5 text-neutral-400 hover:text-neutral-200'
                }`}
                title="Unpressurized Lunar/Martian Terrain Vehicle (LTV)"
              >
                <Truck className="w-3 h-3" />
                <span>LTV Rover</span>
              </button>

              <button
                onClick={() => onChangeTransportMode('pressurized_rover')}
                className={`px-2 py-1 rounded-md flex items-center gap-1 transition ${
                  transportMode === 'pressurized_rover'
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                    : 'bg-white/5 text-neutral-400 hover:text-neutral-200'
                }`}
                title="Pressurized Habitable Mobile Rover"
              >
                <Navigation className="w-3 h-3" />
                <span>Cabin</span>
              </button>
            </div>
          </div>

          {/* Bottom Actions: Open Full Modal */}
          <div className="pt-1">
            <button
              onClick={onOpenFullModal}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 transition cursor-pointer"
            >
              <span>{lang === 'bn' ? 'পূর্ণাঙ্গ ট্রাভার্স প্ল্যানার ও এলিভেশন প্রোফাইল' : 'Full Mission Traverse & Elevation Profile'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
