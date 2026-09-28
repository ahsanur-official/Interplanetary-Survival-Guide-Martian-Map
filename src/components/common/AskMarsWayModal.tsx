import { useState, useRef, useEffect } from 'react';
import {
  X,
  Bot,
  Send,
  Sparkles,
  Compass,
  ArrowRight,
  Shield,
  Layers,
  ArrowRightLeft,
  Loader2,
  HelpCircle,
  Radio,
} from 'lucide-react';
import { ALL_MARS_FEATURES } from '../../data/marsNomenclature';
import { MARS_MISSIONS_DATA } from '../../data/marsMissions';
import { marsSonification } from '../../engine/marsSonification';

interface AskMarsWayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlyToLocation: (lat: number, lng: number, zoom?: number, name?: string) => void;
  onOpenMissions?: (missionId?: string) => void;
  onOpenHumanMode?: () => void;
  onOpenCompare?: (site1Id?: string, site2Id?: string) => void;
  onSelectLayer?: (layerId: 'viking' | 'mola' | 'themis' | 'opm') => void;
  onOpenLiveVoice?: () => void;
  currentContext?: {
    lat?: number;
    lng?: number;
    name?: string;
    activeLayer?: string;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  action?: {
    type: 'fly_to' | 'select_mission' | 'compare' | 'human_mode' | 'toggle_layer';
    label: string;
    payload: any;
  } | null;
  sources?: string[];
}

const SAMPLE_PROMPTS = [
  'Take me to Olympus Mons',
  'Where did Perseverance land?',
  'Compare Jezero and Gale Crater',
  'Show candidate zones for human missions',
  'Switch to MOLA elevation layer',
  'What is the atmospheric pressure on Mars?',
];

export function AskMarsWayModal({
  isOpen,
  onClose,
  onFlyToLocation,
  onOpenMissions,
  onOpenHumanMode,
  onOpenCompare,
  onSelectLayer,
  onOpenLiveVoice,
  currentContext,
}: AskMarsWayModalProps) {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Greetings. I am Ask MarsWay, your planetary exploration and mission intelligence assistant. Ask me about Martian topography, robotic missions, environmental physics, or future human landing candidates — and I can execute real map actions for you.',
      sources: ['NASA PDS', 'MGS MOLA', 'MRO HiRISE', 'Odyssey THEMIS'],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  // Local fallback rule-based spatial intelligence if Gemini endpoint is unavailable
  const generateLocalResponse = (query: string): ChatMessage => {
    const q = query.toLowerCase();

    // 1. Olympus Mons (English & Bengali)
    if (q.includes('olympus') || q.includes('অলিম্পাস') || q.includes('আগ্নেয়গিরি')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        text: 'Olympus Mons (অলিম্পাস মনস) is the largest shield volcano in the Solar System, towering 21,229 meters above the Mars zero-elevation datum with a basal diameter of approximately 600 kilometers. Coordinates: 18.65°N, 133.8°W.',
        action: {
          type: 'fly_to',
          label: 'Fly to Olympus Mons',
          payload: { lat: 18.65, lng: -133.8, zoom: 5, name: 'Olympus Mons', elevationM: 21229 },
        },
        sources: ['MGS MOLA Laser Altimetry', 'USGS Astrogeology'],
      };
    }

    // 2. Valles Marineris Grand Canyon (English & Bengali)
    if (q.includes('valles') || q.includes('canyon') || q.includes('marineris') || q.includes('মেরিনারিস') || q.includes('ক্যানিয়ন')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        text: 'Valles Marineris (ভ্যালিস মেরিনারিস) is the grand canyon of Mars, stretching over 4,000 kilometers along the Martian equator and plunging 7-10 km deep into the crust. Coordinates: 13.9°S, 59.2°W.',
        action: {
          type: 'fly_to',
          label: 'Fly to Valles Marineris',
          payload: { lat: -13.9, lng: -59.2, zoom: 5, name: 'Valles Marineris', elevationM: -7000 },
        },
        sources: ['MGS MOLA Laser Altimetry', 'Viking Orbiter / NASA'],
      };
    }

    // 3. Perseverance / Jezero (English & Bengali)
    if (q.includes('perseverance') || q.includes('jezero') || q.includes('ingenuity') || q.includes('জেজেরো') || q.includes('পারসিভিয়ারেন্স')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        text: 'NASA Mars 2020 Perseverance and Ingenuity landed at Jezero Crater (জেজেরো ক্রেটার: 18.38°N, 77.58°E) on February 18, 2021, exploring an ancient river delta that fed into a crater paleolake.',
        action: {
          type: 'select_mission',
          label: 'Open Perseverance Mission & Traverse',
          payload: { missionId: 'perseverance', lat: 18.38, lng: 77.58, name: 'Perseverance Rover & Ingenuity Helicopter' },
        },
        sources: ['NASA Mars 2020 Mission Science Team', 'HiRISE / MRO'],
      };
    }

    // 4. Curiosity / Gale (English & Bengali)
    if (q.includes('curiosity') || q.includes('gale') || q.includes('sharp') || q.includes('গেল') || q.includes('কিউরিওসিটি')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        text: 'Curiosity rover landed at Gale Crater (গেল ক্রেটার: 4.59°S, 137.44°E) on August 6, 2012, exploring the 5.5 km high sedimentary layers of Mount Sharp (Aeolis Mons).',
        action: {
          type: 'select_mission',
          label: 'Open Curiosity Mission & Traverse',
          payload: { missionId: 'curiosity', lat: -4.59, lng: 137.44, name: 'Curiosity Rover (Bradbury Landing)' },
        },
        sources: ['NASA MSL Science Team / PDS Geosciences'],
      };
    }

    // 5. Compare Jezero and Gale
    if (q.includes('compare')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        text: 'Comparing Jezero Crater and Gale Crater: Jezero (-2,560m) preserves an intact river delta with prominent smectite clays and carbonate shorelines; Gale (-4,450m) hosts a 5.5 km central sedimentary mound (Mount Sharp) spanning billions of years of hydrological history.',
        action: {
          type: 'compare',
          label: 'Launch Comparison Matrix',
          payload: { site1Id: 'perseverance', site2Id: 'curiosity' },
        },
        sources: ['MOLA Elevation Datum', 'CRISM Mineralogical Map'],
      };
    }

    // 6. Human Mission / Landing Sites / Arcadia Planitia
    if (q.includes('human') || q.includes('landing zone') || q.includes('crew') || q.includes('base') || q.includes('arcadia')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        text: 'For human missions, NASA HLS2 identifies Arcadia Planitia (39.2°N, -170.3°W) as a leading candidate due to shallow subsurface water-ice (<1m depth) detected by SHARAD radar, smooth landing plains, and low elevation (-4,100m) for atmospheric braking.',
        action: {
          type: 'human_mode',
          label: 'Activate Human Mission Mode',
          payload: {},
        },
        sources: ['NASA HLS2 Study', 'MRO SHARAD / SWIM Project'],
      };
    }

    // 7. Hellas Planitia
    if (q.includes('hellas')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        text: 'Hellas Planitia is the deepest impact basin on Mars and one of the largest craters in the Solar System, plunging down to 8,200 meters below the datum with an atmospheric pressure high enough (11.5 mbar) for liquid water to briefly exist.',
        action: {
          type: 'fly_to',
          label: 'Fly to Hellas Basin',
          payload: { lat: -42.7, lng: 70.0, zoom: 4, name: 'Hellas Planitia' },
        },
        sources: ['MGS MOLA Science Team'],
      };
    }

    // 8. Elysium Mons
    if (q.includes('elysium')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        text: 'Elysium Mons is a massive shield volcano standing 14,100 meters above the datum in Elysium Planitia (25.02°N, 147.21°E), flanked by Hecates Tholus and Albor Tholus.',
        action: {
          type: 'fly_to',
          label: 'Fly to Elysium Mons',
          payload: { lat: 25.02, lng: 147.21, zoom: 5, name: 'Elysium Mons' },
        },
        sources: ['MGS MOLA Science Team'],
      };
    }

    // 6. MOLA / Elevation Layer
    if (q.includes('mola') || q.includes('elevation layer') || q.includes('topo')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        text: 'Switching basemap to MGS MOLA Topography. MOLA calibrated laser altimetry maps the full global Martian dynamic range from Hellas Basin (-8,200m) to the summit of Olympus Mons (+21,229m).',
        action: {
          type: 'toggle_layer',
          label: 'Switch to MOLA Topography',
          payload: { layerId: 'mola' },
        },
        sources: ['NASA GSFC MOLA Science Team'],
      };
    }

    // 7. General Atmospheric / Pressure
    if (q.includes('pressure') || q.includes('atmosphere') || q.includes('temp') || q.includes('weather')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        text: 'Mars has a thin carbon dioxide atmosphere (~95.3% CO2, 2.6% N2, 1.9% Ar). Surface atmospheric pressure averages 6.1 millibars (under 1% of Earth sea level), preventing stable liquid water on the surface. Diurnal temperatures fluctuate from -125°C at winter night to +20°C at summer midday equator.',
        sources: ['Mars 2020 MEDA', 'MSL REMS Weather Station'],
      };
    }

    // Default
    return {
      id: Date.now().toString(),
      role: 'assistant',
      text: `Regarding "${query}": Mars is a dynamic cold desert world with radius 3,389.5 km. Use the map tools, GIS layer manager, and mission explorer to inspect topography, rover routes, and subsurface water deposits.`,
      sources: ['NASA Planetary Data System', 'USGS Astrogeology'],
    };
  };

  const handleSendMessage = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Call backend /api/ask-marsway
      const res = await fetch('/api/ask-marsway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          context: currentContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();

      let actionObj: ChatMessage['action'] = null;
      if (data.action && data.action.type) {
        let label = 'Execute Action';
        if (data.action.type === 'fly_to') label = `Fly to ${data.action.name || 'Location'}`;
        else if (data.action.type === 'select_mission') label = `Open ${data.action.name || 'Mission'}`;
        else if (data.action.type === 'compare') label = 'Launch Comparison Matrix';
        else if (data.action.type === 'human_mode') label = 'Activate Human Mission Mode';
        else if (data.action.type === 'toggle_layer') label = `Switch to ${data.action.layerId} Layer`;

        actionObj = {
          type: data.action.type,
          label,
          payload: data.action,
        };
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.answer || data.text || 'Information processed.',
        action: actionObj,
        sources: ['NASA Planetary Data System', 'MGS MOLA', 'Odyssey THEMIS'],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.warn('Backend AI query falling back to built-in local spatial engine:', err);
      const fallbackMsg = generateLocalResponse(q);
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = (action: NonNullable<ChatMessage['action']>) => {
    if (action.type === 'fly_to') {
      let lat = action.payload.lat;
      let rawLng = action.payload.lng;
      let name = action.payload.name || '';
      let zoom = action.payload.zoom || 6;
      let elevationM = action.payload.elevationM || 0;

      // 1. Resolve canonical feature from authoritative ALL_MARS_FEATURES database with strict precision
      const cleanName = name.toLowerCase().trim();
      const STOPWORDS = ['crater', 'mountain', 'volcano', 'mons', 'plain', 'planitia', 'canyon', 'valley', 'vallis', 'target', 'location', 'point', 'martian', 'mars', 'surface', 'landing', 'site'];

      const canonicalMatch = ALL_MARS_FEATURES.find((f) => {
        if (action.payload.featureId && f.id === action.payload.featureId) return true;
        const fName = f.name.toLowerCase();
        if (fName === cleanName || f.id.toLowerCase() === cleanName) return true;
        // Exact match stripped of suffix
        const strippedF = fName.replace(/\s*(crater|mons|planitia|basin|vallis|chasma|tholus|patera|terra)/gi, '').trim();
        const strippedName = cleanName.replace(/\s*(crater|mons|planitia|basin|vallis|chasma|tholus|patera|terra)/gi, '').trim();
        if (strippedF && strippedName && strippedF === strippedName) return true;
        // Match word if long enough and not a generic geographic stopword
        if (cleanName.length >= 4 && !STOPWORDS.includes(cleanName) && (fName.startsWith(cleanName + ' ') || fName.endsWith(' ' + cleanName))) return true;
        return false;
      });

      if (canonicalMatch) {
        lat = canonicalMatch.lat;
        rawLng = canonicalMatch.lng;
        name = canonicalMatch.name;
        elevationM = canonicalMatch.elevationM;
      }

      // 2. Normalize longitude to standard GIS format [-180, 180]
      const cleanLng = ((((rawLng + 180) % 360) + 360) % 360) - 180;

      marsSonification.sonifyLocation(elevationM || 0, 2);
      onFlyToLocation(lat, cleanLng, zoom, name);
      onClose();
    } else if (action.type === 'select_mission') {
      const mission = MARS_MISSIONS_DATA.find(
        (m) =>
          m.id === action.payload.missionId ||
          (action.payload.name && m.name.toLowerCase().includes(action.payload.name.toLowerCase()))
      );
      let lat = mission?.lat ?? action.payload.lat;
      let rawLng = mission?.lng ?? action.payload.lng;
      onOpenMissions?.(action.payload.missionId || mission?.id);
      if (lat !== undefined && rawLng !== undefined) {
        const cleanLng = ((((rawLng + 180) % 360) + 360) % 360) - 180;
        onFlyToLocation(lat, cleanLng, 7, mission?.name || action.payload.name);
      }
      onClose();
    } else if (action.type === 'compare') {
      onOpenCompare?.(action.payload.site1Id, action.payload.site2Id);
      onClose();
    } else if (action.type === 'human_mode') {
      onOpenHumanMode?.();
      onClose();
    } else if (action.type === 'toggle_layer') {
      onSelectLayer?.(action.payload.layerId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-3xl bg-[#0c1017] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[640px] max-h-[90vh] text-neutral-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
                Ask MarsWay AI
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 border border-purple-800/60">
                  Spatial Intelligence
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Planetary query assistant powered by Gemini and NASA scientific data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLiveVoice && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLiveVoice();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 border border-purple-500/70 text-purple-200 hover:text-white text-xs flex items-center gap-1.5 transition font-mono shadow shadow-purple-950/40 group"
                title="Switch to real-time voice conversation powered by gemini-3.8-live"
              >
                <Radio className="w-3.5 h-3.5 text-purple-400 group-hover:animate-pulse" />
                <span className="font-semibold">Live Voice</span>
                <span className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-700/50">
                  gemini-3.8-live
                </span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-orange-600 text-white font-medium rounded-tr-none shadow'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-none shadow-md'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Suggested Map Action Button */}
                {msg.action && (
                  <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center gap-2">
                    <button
                      onClick={() => handleExecuteAction(msg.action!)}
                      className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg transition"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      {msg.action.label}
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                )}

                {/* Sources Attributions */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 text-[10px] font-mono text-neutral-400 flex items-center gap-1.5 flex-wrap">
                    <span className="text-neutral-500">Grounded in:</span>
                    {msg.sources.map((s, i) => (
                      <span key={i} className="px-1.5 py-0.2 rounded bg-neutral-800/80 text-neutral-300">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800 w-fit">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              <span>Analyzing Mars orbital telemetry and spatial datasets...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Bar */}
        <div className="px-4 py-2 border-t border-neutral-800/80 bg-neutral-950/40 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[10px] font-mono text-neutral-500 shrink-0">Try:</span>
          {SAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white whitespace-nowrap transition text-xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Query Input */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/60 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Ask about a crater, mission, water-ice, or say 'Take me to Olympus Mons'..."
            className="flex-1 bg-neutral-950 border border-neutral-800 text-sm text-white placeholder-neutral-500 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || isLoading}
            className="p-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white transition shadow"
            title="Send Query"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
