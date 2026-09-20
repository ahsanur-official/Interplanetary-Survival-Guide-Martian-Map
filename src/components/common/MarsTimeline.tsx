import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Compass,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { MARS_MISSIONS_DATA, MarsMission } from '../../data/marsMissions';
import { marsSonification } from '../../engine/marsSonification';

interface TimelineEvent {
  year: number;
  title: string;
  missions: string[];
  description: string;
  flyTarget?: { lat: number; lng: number; zoom: number; name: string };
  elevationM?: number;
}

export const MARS_HISTORICAL_TIMELINE: TimelineEvent[] = [
  {
    year: 1971,
    title: 'First Orbit & Soft Impact',
    missions: ['Mariner 9 (NASA)', 'Mars 3 (USSR)'],
    description: 'Mariner 9 becomes the first artificial satellite to orbit Mars, revealing massive volcanoes and ancient river valleys. Mars 3 achieves first soft landing.',
    flyTarget: { lat: -45.0, lng: 202.0, zoom: 4, name: 'Mars 3 Landing Site' },
    elevationM: -1800,
  },
  {
    year: 1976,
    title: 'Viking Era — First Long-Duration Landers',
    missions: ['Viking 1', 'Viking 2'],
    description: 'Viking 1 touches down on Chryse Planitia; Viking 2 lands on Utopia Planitia. Transmitted first color photos and monitored weather for 6 years.',
    flyTarget: { lat: 22.48, lng: 312.05, zoom: 6, name: 'Viking 1 Landing (Chryse)' },
    elevationM: -2690,
  },
  {
    year: 1997,
    title: 'Pathfinder & Sojourner — The Rover Age Begins',
    missions: ['Mars Pathfinder', 'Sojourner Rover'],
    description: 'First successful micro-rover crawls across Ares Vallis flood deposits, pioneering airbag landing technology.',
    flyTarget: { lat: 19.33, lng: 326.45, zoom: 7, name: 'Pathfinder (Ares Vallis)' },
    elevationM: -3680,
  },
  {
    year: 2001,
    title: 'Odyssey — Global Water-Ice Detection',
    missions: ['2001 Mars Odyssey'],
    description: 'Discovers vast subterranean hydrogen enrichment (water-ice) with GRS and begins global THEMIS thermal infrared mapping.',
    flyTarget: { lat: 0.0, lng: 0.0, zoom: 3, name: 'Global Mars Odyssey Orbital Scan' },
    elevationM: 0,
  },
  {
    year: 2004,
    title: 'Twin Rovers — Spirit & Opportunity',
    missions: ['Spirit (Gusev)', 'Opportunity (Meridiani)'],
    description: 'Spirit discovers ancient silica hot springs at Gusev; Opportunity discovers hematite spherules and travels an unprecedented 45 km.',
    flyTarget: { lat: -1.95, lng: 354.47, zoom: 7, name: 'Opportunity (Meridiani Planum)' },
    elevationM: -1400,
  },
  {
    year: 2006,
    title: 'MRO — High-Resolution Reconnaissance',
    missions: ['Mars Reconnaissance Orbiter'],
    description: 'HiRISE delivers sub-meter resolution imaging, discovering active slope lineae, ice cliffs, and avalanche scarps across Mars.',
    flyTarget: { lat: -12.0, lng: 280.0, zoom: 5, name: 'Valles Marineris (HiRISE Target)' },
    elevationM: -4500,
  },
  {
    year: 2008,
    title: 'Phoenix — Arctic Subsurface Ice Scoop',
    missions: ['Phoenix Mars Lander'],
    description: 'Touches down in the Martian Arctic (Vastitas Borealis); scoops pure water-ice and discovers perchlorate salts in the soil.',
    flyTarget: { lat: 68.22, lng: 234.25, zoom: 6, name: 'Phoenix (Arctic Ice Cap)' },
    elevationM: -4120,
  },
  {
    year: 2012,
    title: 'Curiosity — Ancient Habitable Lake in Gale',
    missions: ['Mars Science Laboratory (MSL)'],
    description: 'Sky crane lands 1-ton Curiosity in Gale Crater; discovers neutral-pH ancient lakes, organic carbon, and climbs Mount Sharp.',
    flyTarget: { lat: -4.59, lng: 137.44, zoom: 7, name: 'Curiosity (Gale Crater)' },
    elevationM: -4450,
  },
  {
    year: 2018,
    title: 'InSight — Probing the Heart of Mars',
    missions: ['InSight Lander'],
    description: 'Places first ultra-sensitive seismometer directly on Martian bedrock in Elysium Planitia, recording over 1,300 marsquakes.',
    flyTarget: { lat: 4.5, lng: 135.62, zoom: 7, name: 'InSight (Elysium Planitia)' },
    elevationM: -2613,
  },
  {
    year: 2021,
    title: 'Perseverance, Ingenuity, Hope & Zhurong',
    missions: ['Perseverance & Ingenuity', 'Hope Probe', 'Tianwen-1 & Zhurong'],
    description: 'Historical multi-national exploration wave: Perseverance samples ancient river delta, Ingenuity completes 72 flights, Hope maps auroras, and Zhurong explores Utopia.',
    flyTarget: { lat: 18.38, lng: 77.58, zoom: 7, name: 'Perseverance & Ingenuity (Jezero Delta)' },
    elevationM: -2560,
  },
];

interface MarsTimelineProps {
  isOpen: boolean;
  onClose: () => void;
  onFlyToLocation: (lat: number, lng: number, zoom?: number, name?: string) => void;
  onSelectMissionById?: (missionId: string) => void;
}

export function MarsTimeline({
  isOpen,
  onClose,
  onFlyToLocation,
  onSelectMissionById,
}: MarsTimelineProps) {
  const [selectedIdx, setSelectedIdx] = useState<number>(MARS_HISTORICAL_TIMELINE.length - 1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeEvent = MARS_HISTORICAL_TIMELINE[selectedIdx];

  const handleSelectEvent = (idx: number) => {
    setSelectedIdx(idx);
    const ev = MARS_HISTORICAL_TIMELINE[idx];
    if (ev.flyTarget) {
      onFlyToLocation(ev.flyTarget.lat, ev.flyTarget.lng, ev.flyTarget.zoom, `${ev.year}: ${ev.title}`);
    }
    if (ev.elevationM !== undefined) {
      marsSonification.sonifyLocation(ev.elevationM, 2);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    } else {
      setIsPlaying(true);
      let next = (selectedIdx + 1) % MARS_HISTORICAL_TIMELINE.length;
      handleSelectEvent(next);

      playTimerRef.current = setInterval(() => {
        setSelectedIdx((prev) => {
          const n = (prev + 1) % MARS_HISTORICAL_TIMELINE.length;
          const ev = MARS_HISTORICAL_TIMELINE[n];
          if (ev.flyTarget) {
            onFlyToLocation(ev.flyTarget.lat, ev.flyTarget.lng, ev.flyTarget.zoom, `${ev.year}: ${ev.title}`);
          }
          if (ev.elevationM !== undefined) {
            marsSonification.sonifyLocation(ev.elevationM, 2);
          }
          return n;
        });
      }, 5500);
    }
  };

  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-14 left-1/2 -translate-x-1/2 w-full max-w-4xl px-3 z-40 animate-in slide-in-from-bottom duration-200">
      <div className="bg-[#0b0e14]/95 backdrop-blur-md border border-neutral-800 rounded-xl p-4 shadow-2xl space-y-3 text-neutral-200">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              Mars Exploration Timeline (1971 – 2026)
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-orange-950/70 text-orange-400 border border-orange-900/60">
                Historical Chronology
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="px-3 py-1 rounded-md bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause Tour
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Play Timeline
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
              title="Close Timeline"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrubber Nodes */}
        <div className="relative py-2">
          {/* Horizontal Track Line */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-neutral-800 -translate-y-1/2" />

          <div className="flex justify-between items-center relative z-10 overflow-x-auto gap-2 px-2">
            {MARS_HISTORICAL_TIMELINE.map((ev, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={ev.year}
                  onClick={() => handleSelectEvent(idx)}
                  className="group flex flex-col items-center gap-1 focus:outline-none shrink-0"
                >
                  <span
                    className={`text-[10px] font-mono transition ${
                      isSelected ? 'text-orange-400 font-bold' : 'text-neutral-500 group-hover:text-neutral-300'
                    }`}
                  >
                    {ev.year}
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 transition ${
                      isSelected
                        ? 'bg-orange-500 border-white scale-125 shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                        : 'bg-neutral-900 border-neutral-700 group-hover:border-neutral-500'
                    }`}
                  />
                  <span className="text-[9px] text-neutral-400 max-w-[60px] truncate text-center line-clamp-1">
                    {ev.title.split('—')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Epoch Details Card */}
        <div className="bg-neutral-900/80 p-3 rounded-lg border border-neutral-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-mono text-orange-400">
                {activeEvent.year}
              </span>
              <span className="text-xs font-semibold text-white">{activeEvent.title}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                {activeEvent.missions.join(' · ')}
              </span>
            </div>
            <p className="text-xs text-neutral-300 max-w-2xl">{activeEvent.description}</p>
          </div>

          {activeEvent.flyTarget && (
            <button
              onClick={() => handleSelectEvent(selectedIdx)}
              className="px-2.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
            >
              <Compass className="w-3.5 h-3.5 text-orange-400" />
              Re-center Map
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
