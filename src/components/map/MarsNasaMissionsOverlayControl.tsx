import React, { useState } from 'react';
import {
  Rocket,
  Radio,
  Layers,
  MapPin,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  Crosshair,
  Filter,
  Check,
  Info,
  Calendar,
  Compass,
} from 'lucide-react';
import { MARS_MISSIONS_DATA, MarsMission } from '../../data/marsMissions';

export type NasaMissionTypeFilter = 'all' | 'rovers' | 'landers' | 'active';

export interface MarsNasaMissionsOverlayControlProps {
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  showLandingEllipses: boolean;
  onToggleLandingEllipses: (show: boolean) => void;
  showTraverseTracks: boolean;
  onToggleTraverseTracks: (show: boolean) => void;
  selectedMissionId?: string | null;
  onSelectMission: (mission: MarsMission) => void;
  onFlyToMission: (lat: number, lng: number, zoom?: number, name?: string) => void;
  onOpenLandingSiteInfo: (mission: MarsMission) => void;
}

// NASA missions filter list (historic + active NASA Mars exploration program missions)
export const NASA_HISTORIC_MISSIONS = MARS_MISSIONS_DATA.filter((m) =>
  m.agency.includes('NASA') && m.lat !== undefined && m.lng !== undefined
);

export const MarsNasaMissionsOverlayControl: React.FC<MarsNasaMissionsOverlayControlProps> = ({
  isOpen,
  onClose,
  isEnabled,
  onToggleEnabled,
  showLandingEllipses,
  onToggleLandingEllipses,
  showTraverseTracks,
  onToggleTraverseTracks,
  selectedMissionId,
  onSelectMission,
  onFlyToMission,
  onOpenLandingSiteInfo,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<NasaMissionTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const filteredMissions = NASA_HISTORIC_MISSIONS.filter((m) => {
    if (typeFilter === 'active' && m.status !== 'active') return false;
    if (typeFilter === 'rovers' && m.type !== 'rover') return false;
    if (typeFilter === 'landers' && m.type !== 'lander') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchSite = (m.landingSiteName || '').toLowerCase().includes(q);
      const matchYear = m.arrivalDate.toLowerCase().includes(q);
      if (!matchName && !matchSite && !matchYear) return false;
    }
    return true;
  });

  return (
    <div
      id="mars-nasa-missions-overlay-control"
      className="bg-[#090d18]/95 backdrop-blur-2xl border border-orange-500/50 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/90 text-neutral-200 overflow-hidden pointer-events-auto transition-all max-w-[94vw] sm:max-w-md w-full z-35 animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Header with NASA Insignia styling */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-950/80 via-neutral-900 to-orange-950/60 border-b border-orange-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl border transition-all ${
              isEnabled
                ? 'bg-gradient-to-tr from-blue-600 to-red-600 text-white border-white/30 shadow-lg shadow-orange-950/80'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}
          >
            <Rocket className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                NASA Mars Missions Overlay
              </span>
              <span
                className={`text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                  isEnabled
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}
              >
                {isEnabled ? 'Overlay Active' : 'Off'}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400">
              Perseverance • Curiosity • Viking 1 & 2 • Opportunity
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Main Master Toggle Switch */}
          <button
            type="button"
            onClick={() => onToggleEnabled(!isEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer mr-1 p-0.5 ${
              isEnabled ? 'bg-orange-500 ring-2 ring-orange-400/40' : 'bg-neutral-700'
            }`}
            title={isEnabled ? 'Disable NASA Missions Overlay' : 'Enable NASA Missions Overlay'}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close NASA Overlay Control"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-4 space-y-3.5 max-h-[calc(85vh-120px)] overflow-y-auto no-scrollbar text-xs">
          {/* Sub-layers & Features Toggles */}
          <div className="grid grid-cols-2 gap-2 bg-black/40 p-2.5 rounded-2xl border border-white/5">
            {/* Landing Error Ellipses */}
            <button
              type="button"
              onClick={() => onToggleLandingEllipses(!showLandingEllipses)}
              className={`p-2 rounded-xl flex items-center justify-between transition cursor-pointer text-left border ${
                showLandingEllipses
                  ? 'bg-blue-950/60 text-blue-200 border-blue-500/40'
                  : 'bg-neutral-900/60 text-neutral-400 border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-[11px] font-semibold">EDL Ellipses</span>
              </div>
              <div
                className={`w-6 h-3.5 rounded-full transition-colors relative shrink-0 ${
                  showLandingEllipses ? 'bg-blue-500' : 'bg-neutral-700'
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    showLandingEllipses ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </div>
            </button>

            {/* Rover Traverse Tracks */}
            <button
              type="button"
              onClick={() => onToggleTraverseTracks(!showTraverseTracks)}
              className={`p-2 rounded-xl flex items-center justify-between transition cursor-pointer text-left border ${
                showTraverseTracks
                  ? 'bg-amber-950/60 text-amber-200 border-amber-500/40'
                  : 'bg-neutral-900/60 text-neutral-400 border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-semibold">Rover Traverses</span>
              </div>
              <div
                className={`w-6 h-3.5 rounded-full transition-colors relative shrink-0 ${
                  showTraverseTracks ? 'bg-amber-500' : 'bg-neutral-700'
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    showTraverseTracks ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { id: 'all', label: `All NASA (${NASA_HISTORIC_MISSIONS.length})` },
              { id: 'active', label: 'Active (2)' },
              { id: 'rovers', label: 'Rovers (5)' },
              { id: 'landers', label: 'Landers (4)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id as NasaMissionTypeFilter)}
                className={`px-2.5 py-1 rounded-xl text-[10.5px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  typeFilter === tab.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-950/50'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Missions List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10.5px] text-neutral-400 px-1 font-mono uppercase">
              <span>Historic Landing Sites</span>
              <span>{filteredMissions.length} Sites</span>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto no-scrollbar pr-0.5">
              {filteredMissions.map((m) => {
                const isSelected = selectedMissionId === m.id;
                const isActive = m.status === 'active';
                const lat = m.lat ?? 0;
                const lng = m.lng ?? 0;

                return (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-2xl border transition-all text-left flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-orange-950/40 border-orange-500/80 shadow-lg shadow-orange-950/40'
                        : 'bg-neutral-900/80 hover:bg-neutral-800/80 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                            isActive
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 shadow-emerald-950/50'
                              : 'bg-neutral-800 text-orange-400 border-neutral-700'
                          }`}
                        >
                          {m.type === 'rover' ? (
                            <Rocket className="w-3.5 h-3.5" />
                          ) : (
                            <Radio className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs truncate">
                              {m.name}
                            </span>
                            {isActive && (
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate">
                            {m.landingSiteName || 'Mars Landing Site'}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 font-bold ${
                          isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                        }`}
                      >
                        {m.arrivalDate.split(',')[1]?.trim() || m.arrivalDate.slice(-4)}
                      </span>
                    </div>

                    {/* Coordinates & Elevation bar */}
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono px-1">
                      <span>
                        {lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`},{' '}
                        {lng >= 0 ? `${lng.toFixed(2)}°E` : `${Math.abs(lng).toFixed(2)}°W`}
                      </span>
                      <span className="text-cyan-400">
                        {m.elevationM !== undefined
                          ? `${m.elevationM > 0 ? '+' : ''}${m.elevationM}m`
                          : ''}
                      </span>
                    </div>

                    {/* Action buttons: Fly to site & View Landing Info */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectMission(m);
                          onFlyToMission(lat, lng, 6, m.name);
                        }}
                        className="py-1 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-200 text-[10.5px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title="Fly map directly to this landing site"
                      >
                        <Crosshair className="w-3 h-3 text-orange-400" />
                        <span>Fly to Site</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectMission(m);
                          onOpenLandingSiteInfo(m);
                        }}
                        className="py-1 px-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/40 text-[10.5px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title="Open detailed Landing Site Dossier & Science Payload"
                      >
                        <Info className="w-3 h-3 text-orange-400" />
                        <span>Landing Info</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
