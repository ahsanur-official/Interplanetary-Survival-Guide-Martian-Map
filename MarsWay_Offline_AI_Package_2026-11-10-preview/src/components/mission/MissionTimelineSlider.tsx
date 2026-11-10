import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Navigation,
  Clock,
  Layers,
  X,
  Radio,
} from 'lucide-react';
import { marsSonification } from '../../engine/marsSonification';

export interface MissionEra {
  id: string;
  name: string;
  shortLabel: string;
  yearRange: [number, number];
  featuredYear: number;
  description: string;
  flyTarget: { lat: number; lng: number; zoom: number; name: string };
  keyMissions: { id: string; name: string; year: number; agency: string }[];
}

export const MISSION_ERAS: MissionEra[] = [
  {
    id: 'early_ussr',
    name: 'Early Space Age & Soviet Probes',
    shortLabel: "Mars 3 ('71)",
    yearRange: [1971, 1974],
    featuredYear: 1971,
    description: 'Mars 3 achieves first historic soft touchdown on Mars surface; Mars 6 transmits atmospheric deceleration telemetry.',
    flyTarget: { lat: -45.0, lng: -158.0, zoom: 5, name: 'Mars 3 Landing Site' },
    keyMissions: [
      { id: 'mars3', name: 'Mars 3 Lander', year: 1971, agency: 'Soviet Space Program' },
      { id: 'mars6', name: 'Mars 6 Probe', year: 1974, agency: 'Soviet Space Program' },
    ],
  },
  {
    id: 'viking',
    name: 'Viking Era — First Long-Duration Landers',
    shortLabel: "Viking ('76)",
    yearRange: [1975, 1982],
    featuredYear: 1976,
    description: 'Viking 1 and 2 operate long-term on Chryse & Utopia Planitiae, transmitting first high-resolution Martian color panoramas.',
    flyTarget: { lat: 22.48, lng: -47.97, zoom: 6, name: 'Viking 1 (Chryse Planitia)' },
    keyMissions: [
      { id: 'viking1', name: 'Viking 1 Lander', year: 1976, agency: 'NASA' },
      { id: 'viking2', name: 'Viking 2 Lander', year: 1976, agency: 'NASA' },
    ],
  },
  {
    id: 'pathfinder',
    name: 'Pathfinder & Rover Age Begins',
    shortLabel: "Pathfinder ('97)",
    yearRange: [1996, 2001],
    featuredYear: 1997,
    description: 'Sojourner becomes the first wheeled robot on Mars, exploring catastrophic ancient mega-flood deposits in Ares Vallis.',
    flyTarget: { lat: 19.33, lng: -33.55, zoom: 7, name: 'Mars Pathfinder & Sojourner' },
    keyMissions: [
      { id: 'sojourner', name: 'Mars Pathfinder & Sojourner', year: 1997, agency: 'NASA / JPL' },
    ],
  },
  {
    id: 'mer',
    name: 'Mars Exploration Rovers (MER) & Beagle 2',
    shortLabel: "Spirit & Opp ('04)",
    yearRange: [2003, 2007],
    featuredYear: 2004,
    description: 'Spirit and Opportunity verify past liquid water, hematite spherules ("blueberries") at Meridiani, and silica hot springs at Gusev.',
    flyTarget: { lat: -1.95, lng: -5.53, zoom: 7, name: 'Opportunity Rover (Meridiani)' },
    keyMissions: [
      { id: 'beagle2', name: 'Beagle 2 Lander', year: 2003, agency: 'ESA / UK' },
      { id: 'spirit', name: 'Spirit Rover', year: 2004, agency: 'NASA / JPL' },
      { id: 'opportunity', name: 'Opportunity Rover', year: 2004, agency: 'NASA / JPL' },
    ],
  },
  {
    id: 'phoenix',
    name: 'Phoenix Arctic Ice Scout',
    shortLabel: "Phoenix ('08)",
    yearRange: [2007, 2011],
    featuredYear: 2008,
    description: 'Touches down in the Martian Arctic (Vastitas Borealis), scoops pure subsurface water-ice and detects soil perchlorates.',
    flyTarget: { lat: 68.22, lng: -125.7, zoom: 6, name: 'Phoenix (Arctic Ice Cap)' },
    keyMissions: [
      { id: 'phoenix', name: 'Phoenix Mars Lander', year: 2008, agency: 'NASA' },
    ],
  },
  {
    id: 'curiosity',
    name: 'Curiosity & Gale Crater Lake Era',
    shortLabel: "Curiosity ('12)",
    yearRange: [2012, 2017],
    featuredYear: 2012,
    description: 'Sky crane lands 1-ton Curiosity in Gale Crater; discovers ancient habitable freshwater lake sediments and organic carbon molecules.',
    flyTarget: { lat: -4.59, lng: 137.44, zoom: 7, name: 'Curiosity Rover (Gale Crater)' },
    keyMissions: [
      { id: 'curiosity', name: 'Curiosity Rover (MSL)', year: 2012, agency: 'NASA / JPL' },
      { id: 'schiaparelli_edm', name: 'Schiaparelli EDM', year: 2016, agency: 'ESA / Roscosmos' },
    ],
  },
  {
    id: 'insight',
    name: 'InSight Deep Geophysics Era',
    shortLabel: "InSight ('18)",
    yearRange: [2018, 2020],
    featuredYear: 2018,
    description: 'SEIS seismometer deployed on Elysium Planitia bedrock records over 1,300 marsquakes, revealing the structure of Mars core and mantle.',
    flyTarget: { lat: 4.5, lng: 135.62, zoom: 7, name: 'InSight (Elysium Planitia)' },
    keyMissions: [
      { id: 'insight', name: 'InSight Lander', year: 2018, agency: 'NASA / CNES' },
    ],
  },
  {
    id: 'perseverance',
    name: 'Modern Multi-Rover & Airborne Era',
    shortLabel: "Perseverance ('21)",
    yearRange: [2021, 2026],
    featuredYear: 2021,
    description: 'Perseverance caches delta core samples for Earth return, Ingenuity achieves 72 aerial flights, and Zhurong maps Utopia Planitia with radar.',
    flyTarget: { lat: 18.38, lng: 77.58, zoom: 7, name: 'Perseverance & Ingenuity (Jezero)' },
    keyMissions: [
      { id: 'perseverance', name: 'Perseverance & Ingenuity', year: 2021, agency: 'NASA / JPL' },
      { id: 'zhurong', name: 'Zhurong Rover & Tianwen-1', year: 2021, agency: 'CNSA' },
    ],
  },
];

export interface MissionTimelineSliderProps {
  isOpen: boolean;
  onClose: () => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  selectedEraId?: string;
  onSelectEra: (eraId: string | undefined) => void;
  filterMode: 'cumulative' | 'era_only' | 'all';
  onFilterModeChange: (mode: 'cumulative' | 'era_only' | 'all') => void;
  visibleMissionCount: number;
  totalMissionCount: number;
  onFlyToMission: (lat: number, lng: number, zoom?: number, name?: string) => void;
}

export function MissionTimelineSlider({
  isOpen,
  onClose,
  selectedYear,
  onYearChange,
  selectedEraId,
  onSelectEra,
  filterMode,
  onFilterModeChange,
  visibleMissionCount,
  totalMissionCount,
  onFlyToMission,
}: MissionTimelineSliderProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Determine current active era from selectedYear or selectedEraId
  const currentEra =
    MISSION_ERAS.find((e) => e.id === selectedEraId) ||
    MISSION_ERAS.find((e) => selectedYear >= e.yearRange[0] && selectedYear <= e.yearRange[1]) ||
    MISSION_ERAS[MISSION_ERAS.length - 1];

  // Stop playback on unmount or close
  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    } else {
      setIsPlaying(true);
      // If at end, wrap around to 1971
      let startYear = selectedYear >= 2024 ? 1971 : selectedYear;
      onYearChange(startYear);
      onFilterModeChange('cumulative');

      const eraYears = MISSION_ERAS.map((e) => e.featuredYear);
      let nextIdx = eraYears.findIndex((y) => y > startYear);
      if (nextIdx === -1) nextIdx = 0;

      playTimerRef.current = setInterval(() => {
        const nextYear = eraYears[nextIdx];
        onYearChange(nextYear);
        const matchingEra = MISSION_ERAS[nextIdx];
        onSelectEra(matchingEra.id);
        marsSonification.playPulse(440 + nextIdx * 45, 'sine', 0.12, 0.08);

        nextIdx = (nextIdx + 1) % eraYears.length;
        if (nextIdx === 0) {
          // Reached end of cycle
          setIsPlaying(false);
          if (playTimerRef.current) clearInterval(playTimerRef.current);
        }
      }, 2000);
    }
  };

  const handleSelectEraClick = (era: MissionEra) => {
    onSelectEra(era.id);
    onYearChange(era.featuredYear);
    onFilterModeChange('era_only');
    marsSonification.playPulse(520, 'sine', 0.15, 0.09);
  };

  const handleResetToAll = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    onSelectEra(undefined);
    onYearChange(2024);
    onFilterModeChange('all');
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-16 sm:bottom-12 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[96vw] max-w-4xl transition-all duration-300">
      <div className="bg-[#070b14]/95 backdrop-blur-2xl border border-orange-500/30 rounded-2xl shadow-2xl shadow-black/90 p-3 sm:p-4 text-white ring-1 ring-white/10">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-950/80 border border-orange-500/60 flex items-center justify-center text-orange-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm tracking-tight text-white flex items-center gap-1.5">
                  Martian Exploration Timeline
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
                    1971 – 2024
                  </span>
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <Radio className="w-3 h-3 animate-pulse" />
                  {filterMode === 'all'
                    ? `All Missions (${visibleMissionCount}/${totalMissionCount})`
                    : `Filtered: ${visibleMissionCount} Site${visibleMissionCount === 1 ? '' : 's'}`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Minimize */}
          <div className="flex items-center gap-1.5">
            {/* Filter Mode Selector */}
            <div className="hidden sm:flex items-center bg-black/40 rounded-xl p-0.5 border border-white/10 text-[11px]">
              <button
                type="button"
                onClick={() => onFilterModeChange('cumulative')}
                className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterMode === 'cumulative'
                    ? 'bg-orange-500 text-white font-bold shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Show all robotic missions landed up to selected year"
              >
                Up to Year
              </button>
              <button
                type="button"
                onClick={() => onFilterModeChange('era_only')}
                className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterMode === 'era_only'
                    ? 'bg-orange-500 text-white font-bold shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Show only missions from the selected era"
              >
                Era Only
              </button>
              <button
                type="button"
                onClick={handleResetToAll}
                className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-neutral-700 text-white font-bold shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Show all missions"
              >
                All
              </button>
            </div>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md ${
                isPlaying
                  ? 'bg-amber-500 text-neutral-950 ring-2 ring-amber-400/50'
                  : 'bg-orange-600 hover:bg-orange-500 text-white'
              }`}
              title={isPlaying ? 'Pause timeline playback' : 'Play chronological exploration sequence'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play Tour'}</span>
            </button>

            {/* Reset to All */}
            {filterMode !== 'all' && (
              <button
                type="button"
                onClick={handleResetToAll}
                className="p-1 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Reset to All Missions"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Minimize / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isMinimized ? 'Expand timeline controls' : 'Minimize timeline'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => {
                if (isPlaying && playTimerRef.current) clearInterval(playTimerRef.current);
                setIsPlaying(false);
                onClose();
              }}
              className="p-1 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Timeline Slider"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Timeline Era Quick Buttons (Viking, Pathfinder, Curiosity, etc.) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={handleResetToAll}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  filterMode === 'all'
                    ? 'bg-neutral-200 text-neutral-950 font-bold shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/5'
                }`}
              >
                All Eras
              </button>

              {MISSION_ERAS.map((era) => {
                const isSelected =
                  (selectedEraId === era.id || selectedYear === era.featuredYear) && filterMode !== 'all';
                return (
                  <button
                    key={era.id}
                    type="button"
                    onClick={() => handleSelectEraClick(era)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                      isSelected
                        ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-950/50 ring-1 ring-orange-300'
                        : 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5'
                    }`}
                  >
                    <span>{era.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Interactive Year Slider */}
            <div className="px-1 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1">
                <span>1971 (Mars 3)</span>
                <span className="text-orange-400 font-bold text-xs sm:text-sm bg-orange-950/60 px-2.5 py-0.5 rounded-full border border-orange-500/40">
                  Year: {selectedYear}
                </span>
                <span>2024 (Modern)</span>
              </div>

              <div className="relative flex items-center py-1">
                <input
                  type="range"
                  min={1971}
                  max={2024}
                  step={1}
                  value={selectedYear}
                  onChange={(e) => {
                    const yr = parseInt(e.target.value, 10);
                    onYearChange(yr);
                    if (filterMode === 'all') onFilterModeChange('cumulative');
                    // Find if year matches an era
                    const match = MISSION_ERAS.find(
                      (er) => yr >= er.yearRange[0] && yr <= er.yearRange[1]
                    );
                    if (match) onSelectEra(match.id);
                  }}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none"
                />
              </div>

              {/* Major Milestone Markers */}
              <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500 px-1 select-none">
                <span className="cursor-pointer hover:text-orange-400" onClick={() => onYearChange(1971)}>
                  '71
                </span>
                <span className="cursor-pointer hover:text-orange-400" onClick={() => onYearChange(1976)}>
                  '76 Viking
                </span>
                <span className="cursor-pointer hover:text-orange-400" onClick={() => onYearChange(1997)}>
                  '97 Pathfinder
                </span>
                <span className="cursor-pointer hover:text-orange-400" onClick={() => onYearChange(2004)}>
                  '04 MER
                </span>
                <span className="cursor-pointer hover:text-orange-400" onClick={() => onYearChange(2008)}>
                  '08 Phoenix
                </span>
                <span className="cursor-pointer hover:text-orange-400" onClick={() => onYearChange(2012)}>
                  '12 MSL
                </span>
                <span className="cursor-pointer hover:text-orange-400" onClick={() => onYearChange(2018)}>
                  '18 InSight
                </span>
                <span className="cursor-pointer hover:text-orange-400" onClick={() => onYearChange(2021)}>
                  '21 Jezero
                </span>
              </div>
            </div>

            {/* Active Era Details Card */}
            <div className="bg-[#0b101d]/90 border border-white/10 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-300 truncate">
                    {currentEra.name}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    ({currentEra.yearRange[0]}–{currentEra.yearRange[1]})
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 line-clamp-2 mt-0.5 leading-snug">
                  {currentEra.description}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {currentEra.keyMissions.map((m) => (
                    <span
                      key={m.id}
                      className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10 text-neutral-200"
                    >
                      🚀 {m.name} ({m.year})
                    </span>
                  ))}
                </div>
              </div>

              {/* Fly To Primary Target Button */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    onFlyToMission(
                      currentEra.flyTarget.lat,
                      currentEra.flyTarget.lng,
                      currentEra.flyTarget.zoom,
                      currentEra.flyTarget.name
                    );
                    marsSonification.sonifyLocation(-2500, 2);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-orange-950/40"
                  title={`Fly map view to ${currentEra.flyTarget.name}`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Fly to {currentEra.shortLabel}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
