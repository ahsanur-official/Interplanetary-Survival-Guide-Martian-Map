import React, { useState } from 'react';
import {
  Layers,
  MapPin,
  Route,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Crosshair,
  Radio,
  Sliders,
  Check,
  Compass,
  X,
  Wind,
} from 'lucide-react';
import { MARS_MISSIONS_DATA, MarsMission } from '../../data/marsMissions';

export interface MissionLayerOptions {
  showAllMissions: boolean;
  showHistoricLandings: boolean;
  showActiveRovers: boolean;
  showTraverseTracks: boolean;
  showDustStormOverlay?: boolean;
  enabledTraverseMissionIds: string[]; // e.g. ['perseverance', 'curiosity', 'opportunity']
  agencyFilter: 'all' | 'nasa' | 'international';
  missionTypeFilter: 'all' | 'rover' | 'lander';
}

interface MarsLayerControlPanelProps {
  layerOptions?: MissionLayerOptions;
  options?: MissionLayerOptions;
  onChangeOptions: (updated: Partial<MissionLayerOptions>) => void;
  onFlyToMission?: (lat: number, lng: number, zoom?: number, name?: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
  activeMissionId?: string;
  className?: string;
}

export const MarsLayerControlPanel: React.FC<MarsLayerControlPanelProps> = ({
  layerOptions: propLayerOptions,
  options: propOptions,
  onChangeOptions,
  onFlyToMission,
  onClose,
  isOpen = true,
  activeMissionId,
  className = '',
}) => {
  const layerOptions = propLayerOptions || propOptions || {
    showAllMissions: true,
    showHistoricLandings: true,
    showActiveRovers: true,
    showTraverseTracks: true,
    enabledTraverseMissionIds: ['perseverance', 'curiosity', 'opportunity'],
    agencyFilter: 'all',
    missionTypeFilter: 'all',
  };

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'sites' | 'traverses'>('sites');

  if (!isOpen) return null;

  // Filter missions with traverse tracks
  const missionsWithTraverse = MARS_MISSIONS_DATA.filter(
    (m) => m.traverseTrack && m.traverseTrack.length > 0
  );

  // Filter landing sites based on options
  const filteredMissions = MARS_MISSIONS_DATA.filter((m) => {
    if (m.lat === undefined || m.lng === undefined) return false;
    if (layerOptions.missionTypeFilter !== 'all' && m.type !== layerOptions.missionTypeFilter) {
      return false;
    }
    if (layerOptions.agencyFilter === 'nasa' && !m.agency.includes('NASA')) {
      return false;
    }
    if (layerOptions.agencyFilter === 'international' && m.agency.includes('NASA') && !m.agency.includes('ESA') && !m.agency.includes('CNSA')) {
      return false;
    }
    if (!layerOptions.showHistoricLandings && m.status === 'completed') {
      return false;
    }
    if (!layerOptions.showActiveRovers && m.status === 'active') {
      return false;
    }
    return true;
  });

  const toggleTraverseMission = (missionId: string) => {
    const current = layerOptions.enabledTraverseMissionIds;
    const next = current.includes(missionId)
      ? current.filter((id) => id !== missionId)
      : [...current, missionId];
    onChangeOptions({ enabledTraverseMissionIds: next });
  };

  return (
    <div
      className={`bg-[#0c101a]/95 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-2xl text-neutral-200 overflow-hidden transition-all duration-300 pointer-events-auto w-full max-w-[calc(100vw-20px)] sm:max-w-xs ${className}`}
      id="mars-mission-layer-control-panel"
    >
      {/* Panel Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3.5 py-2.5 bg-gradient-to-r from-neutral-900/90 to-[#0e1526] border-b border-neutral-800 flex items-center justify-between cursor-pointer select-none hover:bg-neutral-800/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">Mission Layers</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-950/80 border border-orange-700/60 text-orange-300 font-mono">
                NASA & Global
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            aria-label={isExpanded ? 'Collapse layers panel' : 'Expand layers panel'}
            className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="Close layers panel"
              className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3 text-xs">
          {/* Main Visibility Master Toggles */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase font-mono font-bold text-neutral-400 px-0.5">
              <span>Primary Overlays</span>
              <span className="text-neutral-500">TOGGLE</span>
            </div>

            {/* 1. Historical NASA & Global Mission Landing Sites */}
            <div className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between hover:border-neutral-700 transition">
              <div className="flex items-center gap-2 min-w-0 pr-1">
                <MapPin className={`w-3.5 h-3.5 shrink-0 ${layerOptions.showAllMissions ? 'text-amber-400' : 'text-neutral-500'}`} />
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate text-[11px]">Mission Landing Sites</div>
                  <div className="text-[9px] text-neutral-400 truncate">Viking, Pathfinder, InSight, Rovers</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onChangeOptions({ showAllMissions: !layerOptions.showAllMissions })}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer shrink-0 ${
                  layerOptions.showAllMissions
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {layerOptions.showAllMissions ? 'Visible' : 'Hidden'}
              </button>
            </div>

            {/* 2. Rover Traverse Paths & Sols */}
            <div className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between hover:border-neutral-700 transition">
              <div className="flex items-center gap-2 min-w-0 pr-1">
                <Route className={`w-3.5 h-3.5 shrink-0 ${layerOptions.showTraverseTracks ? 'text-orange-400' : 'text-neutral-500'}`} />
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate text-[11px]">Rover Traverse Paths</div>
                  <div className="text-[9px] text-neutral-400 truncate">Perseverance, Curiosity, Opportunity</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onChangeOptions({ showTraverseTracks: !layerOptions.showTraverseTracks })}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer shrink-0 ${
                  layerOptions.showTraverseTracks
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {layerOptions.showTraverseTracks ? 'Visible' : 'Hidden'}
              </button>
            </div>

            {/* 3. Dust Storm & Atmospheric Opacity Simulation */}
            <div className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between hover:border-neutral-700 transition">
              <div className="flex items-center gap-2 min-w-0 pr-1">
                <Wind className={`w-3.5 h-3.5 shrink-0 ${layerOptions.showDustStormOverlay ? 'text-amber-400 animate-pulse' : 'text-neutral-500'}`} />
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate text-[11px]">Dust Storm / Atmosphere</div>
                  <div className="text-[9px] text-neutral-400 truncate">MGS/MRO Opacity (Tau) Simulation</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onChangeOptions({ showDustStormOverlay: !layerOptions.showDustStormOverlay })}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer shrink-0 ${
                  layerOptions.showDustStormOverlay
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {layerOptions.showDustStormOverlay ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>

          {/* Sub-Tabs: Detail Filters & Rover Tracks Selection */}
          <div className="pt-1 border-t border-neutral-800/80">
            <div className="grid grid-cols-2 gap-1 bg-neutral-950/80 p-0.5 rounded-lg border border-neutral-800 mb-2.5">
              <button
                type="button"
                onClick={() => setActiveSubTab('sites')}
                className={`py-1 text-[10.5px] font-semibold rounded-md transition text-center ${
                  activeSubTab === 'sites'
                    ? 'bg-neutral-800 text-white shadow-sm font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Landing Sites ({filteredMissions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('traverses')}
                className={`py-1 text-[10.5px] font-semibold rounded-md transition text-center flex items-center justify-center gap-1 ${
                  activeSubTab === 'traverses'
                    ? 'bg-neutral-800 text-orange-300 shadow-sm font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span>Traverse Routes</span>
                <span className="text-[9px] px-1 bg-orange-950 text-orange-400 rounded-full font-mono">
                  {layerOptions.enabledTraverseMissionIds.length}
                </span>
              </button>
            </div>

            {/* TAB CONTENT: LANDING SITES FILTER */}
            {activeSubTab === 'sites' && (
              <div className="space-y-2 animate-in fade-in duration-150">
                {/* Agency Filter */}
                <div>
                  <span className="text-[9.5px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                    Agency Filter:
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['all', 'nasa', 'international'] as const).map((ag) => (
                      <button
                        key={ag}
                        type="button"
                        onClick={() => onChangeOptions({ agencyFilter: ag })}
                        className={`py-1 px-1 rounded text-[10px] font-medium capitalize transition border ${
                          layerOptions.agencyFilter === ag
                            ? 'bg-orange-600 text-white border-orange-500 font-bold'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {ag === 'all' ? 'All' : ag === 'nasa' ? 'NASA Only' : 'Global'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Craft Type Filter */}
                <div>
                  <span className="text-[9.5px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                    Platform Type:
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['all', 'rover', 'lander'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onChangeOptions({ missionTypeFilter: type })}
                        className={`py-1 px-1 rounded text-[10px] font-medium capitalize transition border ${
                          layerOptions.missionTypeFilter === type
                            ? 'bg-amber-600 text-white border-amber-500 font-bold'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {type === 'all' ? 'All' : `${type}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick status checkboxes */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layerOptions.showActiveRovers}
                      onChange={(e) => onChangeOptions({ showActiveRovers: e.target.checked })}
                      className="accent-emerald-500 rounded"
                    />
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Active
                    </span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layerOptions.showHistoricLandings}
                      onChange={(e) => onChangeOptions({ showHistoricLandings: e.target.checked })}
                      className="accent-amber-500 rounded"
                    />
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Historical
                    </span>
                  </label>
                </div>

                {/* Quick Jump List of Featured Missions */}
                <div className="pt-1.5 border-t border-neutral-800/80">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                    Quick Center on NASA Site:
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-0.5">
                    {filteredMissions.slice(0, 8).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onFlyToMission?.(m.lat!, m.lng!, 7, m.name)}
                        className={`w-full text-left px-2 py-1 rounded-md text-[10.5px] transition flex items-center justify-between border cursor-pointer ${
                          activeMissionId === m.id
                            ? 'bg-orange-950/80 border-orange-500 text-white font-bold'
                            : 'bg-neutral-900/60 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{m.name.split(' (')[0]}</span>
                        <span className="text-[9px] font-mono text-neutral-500 shrink-0 ml-1">
                          {m.arrivalDate.split(' ').pop()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ROVER TRAVERSE ROUTES SELECTION */}
            {activeSubTab === 'traverses' && (
              <div className="space-y-2 animate-in fade-in duration-150">
                <span className="text-[9.5px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Toggle Individual Rover Tracks:
                </span>

                <div className="space-y-1.5">
                  {missionsWithTraverse.map((rover) => {
                    const isEnabled = layerOptions.enabledTraverseMissionIds.includes(rover.id);
                    const wpCount = rover.traverseTrack?.length || 0;

                    return (
                      <div
                        key={rover.id}
                        className={`p-2 rounded-xl border transition flex items-center justify-between ${
                          isEnabled
                            ? 'bg-neutral-900 border-neutral-700'
                            : 'bg-neutral-950/60 border-neutral-800/60 opacity-60'
                        }`}
                      >
                        <div className="min-w-0 pr-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${rover.status === 'active' ? 'bg-emerald-400' : 'bg-neutral-400'}`} />
                            <span className="font-semibold text-[11px] text-white truncate">
                              {rover.name.split(' (')[0]}
                            </span>
                          </div>
                          <div className="text-[9px] text-neutral-400 font-mono mt-0.5">
                            {wpCount} In-Situ Sols & Waypoints
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {rover.lat !== undefined && rover.lng !== undefined && (
                            <button
                              type="button"
                              onClick={() => onFlyToMission?.(rover.lat!, rover.lng!, 8, rover.name)}
                              className="p-1 text-neutral-400 hover:text-orange-400 rounded hover:bg-neutral-800 transition"
                              title={`Fly to ${rover.name}`}
                            >
                              <Crosshair className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleTraverseMission(rover.id)}
                            className={`p-1 rounded transition cursor-pointer ${
                              isEnabled
                                ? 'bg-orange-600 text-white'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                            title={isEnabled ? 'Hide track' : 'Show track'}
                          >
                            {isEnabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[9.5px] text-neutral-400 leading-relaxed bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/60">
                  💡 Zoom to level 6x+ to see high-precision rover telemetry tracks and Sol waypoint milestones.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
