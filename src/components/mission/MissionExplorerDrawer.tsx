import { useState, useMemo } from 'react';
import {
  X,
  Compass,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Satellite,
  Radio,
  Search,
  ChevronRight,
  Sparkles,
  Layers,
  Volume2,
} from 'lucide-react';
import {
  MARS_MISSIONS_DATA,
  MarsMission,
  MarsMissionWaypoint,
  MissionType,
} from '../../data/marsMissions';
import { marsSonification } from '../../engine/marsSonification';

interface MissionExplorerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMission: (mission: MarsMission) => void;
  onFlyToLocation: (lat: number, lng: number, zoom?: number, name?: string) => void;
  selectedMissionId?: string;
}

export function MissionExplorerDrawer({
  isOpen,
  onClose,
  onSelectMission,
  onFlyToLocation,
  selectedMissionId,
}: MissionExplorerDrawerProps) {
  const [filterType, setFilterType] = useState<MissionType | 'all'>('all');
  const [onlyActive, setOnlyActive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMission, setActiveMission] = useState<MarsMission | null>(() => {
    return MARS_MISSIONS_DATA.find((m) => m.id === selectedMissionId) || MARS_MISSIONS_DATA[0];
  });

  // Follow Rover Track State
  const [currentWaypointIdx, setCurrentWaypointIdx] = useState<number>(0);
  const [isPlayingTraverse, setIsPlayingTraverse] = useState<boolean>(false);

  const filteredMissions = useMemo(() => {
    return MARS_MISSIONS_DATA.filter((m) => {
      if (filterType !== 'all' && m.type !== filterType) return false;
      if (onlyActive && m.status !== 'active') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.agency.toLowerCase().includes(q) ||
          (m.landingSiteName && m.landingSiteName.toLowerCase().includes(q)) ||
          m.keyDiscoveries.some((d) => d.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [filterType, onlyActive, searchQuery]);

  const handleSelectMission = (mission: MarsMission) => {
    setActiveMission(mission);
    setCurrentWaypointIdx(0);
    setIsPlayingTraverse(false);
    onSelectMission(mission);

    if (mission.lat !== undefined && mission.lng !== undefined) {
      onFlyToLocation(mission.lat, mission.lng, 7, mission.name);
      if (mission.elevationM !== undefined) {
        marsSonification.sonifyLocation(mission.elevationM, 2);
      }
    }
  };

  const handleStepWaypoint = (idx: number) => {
    if (!activeMission?.traverseTrack) return;
    const wp = activeMission.traverseTrack[idx];
    if (!wp) return;

    setCurrentWaypointIdx(idx);
    onFlyToLocation(wp.lat, wp.lng, 9, `${activeMission.name} — ${wp.name}`);
    marsSonification.sonifyLocation(wp.elevationM, 4);
  };

  const togglePlayTraverse = () => {
    if (!activeMission?.traverseTrack || activeMission.traverseTrack.length === 0) return;

    if (isPlayingTraverse) {
      setIsPlayingTraverse(false);
    } else {
      setIsPlayingTraverse(true);
      let nextIdx = (currentWaypointIdx + 1) % activeMission.traverseTrack.length;
      handleStepWaypoint(nextIdx);

      const interval = setInterval(() => {
        setCurrentWaypointIdx((prev) => {
          const n = (prev + 1) % activeMission.traverseTrack!.length;
          const wp = activeMission.traverseTrack![n];
          onFlyToLocation(wp.lat, wp.lng, 9, `${activeMission.name} — ${wp.name}`);
          marsSonification.sonifyLocation(wp.elevationM, 3);
          return n;
        });
      }, 4000);

      // Auto stop after full loop
      setTimeout(() => {
        clearInterval(interval);
        setIsPlayingTraverse(false);
      }, activeMission.traverseTrack.length * 4000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-full sm:w-[480px] lg:w-[520px] bg-[#0c1017]/95 backdrop-blur-md border-r border-neutral-800 z-50 flex flex-col shadow-2xl text-neutral-200">
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
              Mission Explorer
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                NASA · ESA · CNSA · UAESA
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Robotic rovers, surface landers, and scientific orbital reconnaissance
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          title="Close Mission Explorer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-4 border-b border-neutral-800 space-y-3 bg-neutral-950/40">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search missions, agencies, or discoveries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-md border border-neutral-800 text-xs font-mono">
            {(['all', 'rover', 'lander', 'orbiter'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded capitalize transition ${
                  filterType === t
                    ? 'bg-orange-600 text-white font-semibold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All' : `${t}s`}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
              className="rounded bg-neutral-900 border-neutral-700 text-orange-500 focus:ring-0"
            />
            <span>Active Only</span>
          </label>
        </div>
      </div>

      {/* Drawer Content: Split List & Detail */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/80">
        {/* Active Mission Spotlight */}
        {activeMission && (
          <div className="p-5 bg-gradient-to-b from-orange-950/20 via-transparent to-transparent space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${
                      activeMission.status === 'active'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        activeMission.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
                      }`}
                    />
                    {activeMission.statusDisplay}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">{activeMission.agency}</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">{activeMission.name}</h3>
              </div>

              {activeMission.lat !== undefined && activeMission.lng !== undefined && (
                <button
                  onClick={() =>
                    onFlyToLocation(activeMission.lat!, activeMission.lng!, 7, activeMission.name)
                  }
                  className="px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg transition"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Fly to Site
                </button>
              )}
            </div>

            {/* Coordinates / Orbit Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-neutral-900/80 p-3 rounded-lg border border-neutral-800/80">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Launch / Arrival</span>
                <span className="text-neutral-200">{activeMission.arrivalDate}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">
                  {activeMission.type === 'orbiter' ? 'Orbital Altitude' : 'Landing Coordinates'}
                </span>
                <span className="text-neutral-200">
                  {activeMission.type === 'orbiter'
                    ? activeMission.orbitType
                    : `${activeMission.lat?.toFixed(2)}°N, ${activeMission.lng?.toFixed(2)}°E`}
                </span>
              </div>
              {activeMission.elevationM !== undefined && (
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Elevation (Datum)</span>
                  <span className="text-orange-400">
                    {activeMission.elevationM.toLocaleString()} meters
                  </span>
                </div>
              )}
              {activeMission.landingSiteName && (
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Site</span>
                  <span className="text-neutral-200 truncate block" title={activeMission.landingSiteName}>
                    {activeMission.landingSiteName}
                  </span>
                </div>
              )}
            </div>

            {/* Key Discoveries */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase font-mono tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Key Scientific Discoveries
              </h4>
              <ul className="space-y-1 text-xs text-neutral-300">
                {activeMission.keyDiscoveries.map((disc, i) => (
                  <li key={i} className="flex items-start gap-2 bg-neutral-900/40 p-2 rounded border border-neutral-800/50">
                    <span className="text-orange-400 font-mono font-bold">•</span>
                    <span>{disc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Follow Rover Track Section (if traverse track available) */}
            {activeMission.traverseTrack && activeMission.traverseTrack.length > 0 && (
              <div className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono uppercase">
                      <Navigation className="w-3.5 h-3.5 text-orange-400" />
                      Follow Rover Track (Sol-by-Sol)
                    </h5>
                    <p className="text-[11px] text-neutral-400">
                      Step through traverse waypoints chronologically
                    </p>
                  </div>

                  <button
                    onClick={togglePlayTraverse}
                    className="px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium flex items-center gap-1 transition"
                  >
                    {isPlayingTraverse ? (
                      <>
                        <Pause className="w-3 h-3" /> Stop
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" /> Auto Walk
                      </>
                    )}
                  </button>
                </div>

                {/* Waypoints stepper */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeMission.traverseTrack.map((wp, idx) => (
                    <button
                      key={wp.sol}
                      onClick={() => handleStepWaypoint(idx)}
                      className={`w-full text-left p-2 rounded text-xs transition border flex items-center justify-between ${
                        currentWaypointIdx === idx
                          ? 'bg-orange-950/60 border-orange-600/70 text-white'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-orange-300 font-bold">
                            SOL {wp.sol}
                          </span>
                          <span className="font-medium text-neutral-200">{wp.name}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 line-clamp-1">{wp.discovery}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Data Provenance Badge */}
            <div className="text-[11px] font-mono text-neutral-500 pt-1 flex items-center justify-between border-t border-neutral-800/80">
              <span>Source: {activeMission.dataSource}</span>
              <span className="text-emerald-400/90 font-medium">[Observed PDS Data]</span>
            </div>
          </div>
        )}

        {/* All Missions Directory List */}
        <div className="p-4 space-y-2">
          <h4 className="text-xs font-semibold uppercase font-mono tracking-wider text-neutral-400 mb-2">
            Mars Exploration Missions Catalog ({filteredMissions.length})
          </h4>

          <div className="space-y-2">
            {filteredMissions.map((mission) => {
              const isSelected = activeMission?.id === mission.id;
              return (
                <div
                  key={mission.id}
                  onClick={() => handleSelectMission(mission)}
                  className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-neutral-900 border-orange-500/80 shadow-md'
                      : 'bg-neutral-900/40 border-neutral-800/70 hover:bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{mission.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded capitalize ${
                          mission.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {mission.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-3">
                      <span>{mission.agency}</span>
                      <span>•</span>
                      <span>Arrived {mission.arrivalDate}</span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 transition ${
                      isSelected ? 'text-orange-400 translate-x-0.5' : 'text-neutral-600'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
