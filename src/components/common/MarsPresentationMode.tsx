import { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Compass,
  Sparkles,
  Presentation,
  CheckCircle2,
} from 'lucide-react';
import { marsSonification } from '../../engine/marsSonification';

export interface PresentationChapter {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  description: string;
  keyFacts: string[];
  lat: number;
  lng: number;
  zoom: number;
  elevationM: number;
  recommendedLayer: 'viking' | 'mola' | 'themis' | 'opm';
}

const PRESENTATION_CHAPTERS: PresentationChapter[] = [
  {
    id: 'ch1',
    chapterNumber: 1,
    title: 'Welcome to MarsWay',
    subtitle: 'Planetary GIS & Mission Intelligence Architecture',
    description:
      'MarsWay combines NASA Planetary Data System mosaics, MGS MOLA altimetry, robotic exploration traverses, and physical environmental modeling into a unified planetary exploration platform.',
    keyFacts: [
      'Mars equatorial radius: 3,389.5 km (~53% of Earth).',
      'Surface gravity: 0.376 g (38% of Earth gravity).',
      'Atmospheric pressure: ~6.1 mbar (average surface datum).',
    ],
    lat: 0.0,
    lng: 0.0,
    zoom: 3,
    elevationM: 0,
    recommendedLayer: 'viking',
  },
  {
    id: 'ch2',
    chapterNumber: 2,
    title: 'Topographic Extremes of the Red Planet',
    subtitle: 'From Deep Hellas Basin to Olympus Mons Summit',
    description:
      'Mars features the most extreme planetary relief in the Solar System. MOLA calibrated laser altimetry maps the full 30-kilometer vertical span from the -8.2 km floor of Hellas Planitia to the +21.2 km caldera of Olympus Mons.',
    keyFacts: [
      'Olympus Mons: 21,229 m above datum (2.4x Mount Everest height).',
      'Basal diameter: ~600 km, rimmed by 6 km vertical scarps.',
      'Atmospheric pressure at summit: < 0.5 mbar (near-vacuum).',
    ],
    lat: 18.65,
    lng: 226.2,
    zoom: 5,
    elevationM: 21229,
    recommendedLayer: 'mola',
  },
  {
    id: 'ch3',
    chapterNumber: 3,
    title: 'NASA Mars 2020: Jezero Crater River Delta',
    subtitle: 'Ancient Lacustrine Habitability & Sample Caching',
    description:
      'Perseverance touched down in Jezero Crater on Feb 18, 2021. The crater once held an ancient lake fed by the Neretva Vallis river channel, creating an intact fan delta rich in smectite clays and carbonates ideal for preserving microbial biosignatures.',
    keyFacts: [
      'Landing site elevation: -2,560 meters.',
      'Traverse distance: Over 30 kilometers explored.',
      'Sealed 25+ hermetic titanium sample tubes for Earth return.',
      'Ingenuity completed 72 flights totaling over 120 minutes in air.',
    ],
    lat: 18.38,
    lng: 77.58,
    zoom: 7,
    elevationM: -2560,
    recommendedLayer: 'viking',
  },
  {
    id: 'ch4',
    chapterNumber: 4,
    title: 'Curiosity: Mount Sharp Sedimentary Archives',
    subtitle: 'Gale Crater & Over a Decade of Continuous Science',
    description:
      'Curiosity explored Gale Crater floor mudstones (Yellowknife Bay), proving ancient Mars had freshwater lakes with neutral pH and life-supporting elements. The rover is now climbing the 5.5 km layered central mound (Mount Sharp).',
    keyFacts: [
      'Bradbury landing elevation: -4,450 meters.',
      'Climbed over 400 vertical meters up Mount Sharp.',
      'Discovered diverse organic carbon macromolecules in clay strata.',
      'Monitored over 4,400 Martian Sols of surface weather.',
    ],
    lat: -4.59,
    lng: 137.44,
    zoom: 7,
    elevationM: -4450,
    recommendedLayer: 'viking',
  },
  {
    id: 'ch5',
    chapterNumber: 5,
    title: 'Grand Canyon of Mars: Valles Marineris',
    subtitle: 'Tectonic Rift System 4,000 Kilometers Long',
    description:
      'Valles Marineris stretches across one-fifth of the Martian circumference. It plunges up to 9 kilometers deep (over 4x the depth of Earth Grand Canyon), exposing ancient Noachian crustal stratigraphy.',
    keyFacts: [
      'Length: Over 4,000 km (spans entire width of continental US).',
      'Central chasm floor drops below -4,500 meters.',
      'Reveals layered basaltic canyon walls shaped by ancestral collapse and landslides.',
    ],
    lat: -9.8,
    lng: 283.6,
    zoom: 5,
    elevationM: -4500,
    recommendedLayer: 'themis',
  },
  {
    id: 'ch6',
    chapterNumber: 6,
    title: 'Future Human Exploration: Arcadia Planitia',
    subtitle: 'Shallow Subsurface Sheet Ice & ISRU Propellant Base',
    description:
      'NASA Human Landing Site Studies identify Arcadia Planitia as a prime outpost candidate. Low elevation (-4.1 km) maximizes atmospheric aerobraking, smooth volcanic plains provide landing safety, and radar confirms accessible subsurface glacial sheets for water extraction and rocket fuel synthesis.',
    keyFacts: [
      'Subsurface water-ice depth: 0.5 – 1.5 meters beneath regolith.',
      'Enables automated Sabatier fuel plants (CH4 + LOX for return rockets).',
      'Overall Human Landing Suitability Index: 89/100.',
    ],
    lat: 39.2,
    lng: 189.7,
    zoom: 6,
    elevationM: -4100,
    recommendedLayer: 'viking',
  },
];

interface MarsPresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
  onFlyToLocation: (lat: number, lng: number, zoom?: number, name?: string) => void;
  onSelectLayer?: (layerId: 'viking' | 'mola' | 'themis' | 'opm') => void;
}

export function MarsPresentationMode({
  isOpen,
  onClose,
  onFlyToLocation,
  onSelectLayer,
}: MarsPresentationModeProps) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const chapter = PRESENTATION_CHAPTERS[currentIdx];

  const handleApplyChapter = (idx: number) => {
    setCurrentIdx(idx);
    const ch = PRESENTATION_CHAPTERS[idx];
    onFlyToLocation(ch.lat, ch.lng, ch.zoom, `Presentation: ${ch.title}`);
    onSelectLayer?.(ch.recommendedLayer);
    marsSonification.sonifyLocation(ch.elevationM, 2);
  };

  const handleNext = () => {
    const next = (currentIdx + 1) % PRESENTATION_CHAPTERS.length;
    handleApplyChapter(next);
  };

  const handlePrev = () => {
    const prev = (currentIdx - 1 + PRESENTATION_CHAPTERS.length) % PRESENTATION_CHAPTERS.length;
    handleApplyChapter(prev);
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setIsPlaying(true);
      timerRef.current = setInterval(() => {
        setCurrentIdx((prev) => {
          const n = (prev + 1) % PRESENTATION_CHAPTERS.length;
          const ch = PRESENTATION_CHAPTERS[n];
          onFlyToLocation(ch.lat, ch.lng, ch.zoom, `Presentation: ${ch.title}`);
          onSelectLayer?.(ch.recommendedLayer);
          marsSonification.sonifyLocation(ch.elevationM, 2);
          return n;
        });
      }, 7000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleApplyChapter(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-3 z-40 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#0b0e14]/95 backdrop-blur-md border border-neutral-800 rounded-xl p-4 shadow-2xl space-y-3 text-neutral-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Guided Presentation Mode
              </span>
              <span className="text-[10px] text-neutral-400 block">
                Chapter {chapter.chapterNumber} of {PRESENTATION_CHAPTERS.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="px-3 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause Auto
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Auto Tour
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chapter Title & Description */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-base font-bold text-white tracking-tight">{chapter.title}</h3>
            <span className="text-xs font-mono text-orange-400 font-semibold">
              Elev: {chapter.elevationM.toLocaleString()} m
            </span>
          </div>
          <p className="text-xs font-mono text-neutral-400">{chapter.subtitle}</p>
          <p className="text-xs text-neutral-300 leading-relaxed">{chapter.description}</p>

          {/* Key Facts Bullet points */}
          <div className="bg-neutral-900/80 p-3 rounded-lg border border-neutral-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-neutral-500 block font-bold">
              Scientific Takeaways:
            </span>
            <ul className="space-y-1 text-xs text-neutral-300">
              {chapter.keyFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stepper Navigation Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
          <button
            onClick={handlePrev}
            className="px-3 py-1 rounded border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Prev Chapter
          </button>

          <div className="flex items-center gap-1.5">
            {PRESENTATION_CHAPTERS.map((_, i) => (
              <button
                key={i}
                onClick={() => handleApplyChapter(i)}
                className={`w-2 h-2 rounded-full transition ${
                  currentIdx === i ? 'bg-orange-500 scale-125' : 'bg-neutral-700 hover:bg-neutral-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-white flex items-center gap-1"
          >
            Next Chapter <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
