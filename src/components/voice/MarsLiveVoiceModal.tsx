import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX,
  Compass,
  X,
  Minimize2,
  Maximize2,
  Layers,
  HelpCircle,
  CheckCircle2,
  ShieldCheck,
  Navigation,
  Globe,
  Footprints,
  MapPin,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Search,
  Info,
} from 'lucide-react';
import { MARS_MISSIONS_DATA } from '../../data/marsMissions';
import { ALL_MARS_FEATURES } from '../../data/marsNomenclature';
import { marsEvaAudio } from '../../engine/marsEvaAudio';

export interface MarsLiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLat?: number;
  currentLng?: number;
  currentZoom?: number;
  onPanDirection?: (direction: 'north' | 'south' | 'east' | 'west') => void;
  onZoomAction?: (action: 'in' | 'out' | 'reset') => void;
  onRotateAction?: (action: 'left' | 'right' | 'reset') => void;
  onSwitchView?: (mode: '2d' | '3d' | 'astronaut') => void;
  onFlyToLocation?: (lat: number, lng: number, zoom?: number, name?: string) => void;
  onSelectMission?: (missionId: string) => void;
  onToggleLayer?: (layerId: 'viking' | 'themis' | 'mola' | 'opm') => void;
  onSelectSite?: (site: any) => void;
  onStartRoutePlanning?: () => void;
  onPlanRouteBetweenLocations?: (transcript: string) => boolean;
  onSetRoutePoint?: (point: 'start' | 'destination') => boolean;
  onCheckRoute?: () => boolean;
  onSelectRouteMode?: (mode: 'safest' | 'shortest' | 'science') => void;
  onReadRouteSafety?: (language?: 'en' | 'bn' | 'banglish') => string | null;
}

interface CommandLogItem {
  id: string;
  type: 'user' | 'capcom' | 'system';
  text: string;
  timestamp: string;
  badge?: string;
}

export function MarsLiveVoiceModal({
  isOpen,
  onClose,
  currentLat = 18.38,
  currentLng = 77.58,
  currentZoom = 5,
  onPanDirection,
  onZoomAction,
  onRotateAction,
  onSwitchView,
  onFlyToLocation,
  onSelectMission,
  onToggleLayer,
  onSelectSite,
  onStartRoutePlanning,
  onPlanRouteBetweenLocations,
  onSetRoutePoint,
  onCheckRoute,
  onSelectRouteMode,
  onReadRouteSafety,
}: MarsLiveVoiceModalProps) {
  // Voice Recognition State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready for voice navigation & mission queries.');
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [lastCapcomReply, setLastCapcomReply] = useState<string>(
    'Mars Flight Control online. Say "Start route planning", "set start here", "set destination here", "check route", or "is the route safe?".'
  );
  const [commandLogs, setCommandLogs] = useState<CommandLogItem[]>([
    {
      id: 'welcome',
      type: 'capcom',
      text: 'Mars Flight Control online. Ready for map navigation & mission site queries.',
      timestamp: '00:00:01',
      badge: 'CAPCOM',
    },
  ]);
  const [recognitionLanguage, setRecognitionLanguage] = useState<'en-US' | 'bn-BD'>('en-US');
  const [activeCategory, setActiveCategory] = useState<'all' | 'navigation' | 'missions' | 'landmarks' | 'route'>('all');

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const isSpeakingRef = useRef(false);
  const speechIgnoreUntilRef = useRef(0);
  const lastProcessedTranscriptRef = useRef('');
  const lastProcessedAtRef = useRef(0);
  const shouldKeepListeningRef = useRef(false);

  // Auto-scroll logs
  useEffect(() => {
    if (!isMinimized) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [commandLogs, isMinimized]);

  // Voice Synthesis Speaker (CapCom Voice Feedback with Radio Audio Click)
  const speakCapcom = useCallback(
    (message: string) => {
      setLastCapcomReply(message);
      setCommandLogs((prev) => [
        ...prev,
        {
          id: `capcom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'capcom',
          text: message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          badge: 'CAPCOM',
        },
      ]);

      try {
        marsEvaAudio.playRadioClick();
      } catch {}

      if (isAudioMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }

      try {
        window.speechSynthesis.cancel();
        isSpeakingRef.current = true;
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 1.05;
        utterance.pitch = 0.96;
        utterance.volume = 0.85;
        // Prefer a matching local voice so Bangla replies are spoken naturally
        const voices = window.speechSynthesis.getVoices();
        const targetLang = /[\u0980-\u09FF]/.test(message) ? 'bn' : 'en';
        const matchingVoice = voices.find((v) => v.lang.toLowerCase().startsWith(targetLang));
        if (matchingVoice) utterance.voice = matchingVoice;
        utterance.lang = matchingVoice?.lang || (targetLang === 'bn' ? 'bn-BD' : 'en-US');
        const finishSpeech = () => {
          isSpeakingRef.current = false;
          // Ignore the tail of the speaker's own audio so the recognizer does
          // not turn CAPCOM's reply into a second command.
          speechIgnoreUntilRef.current = Date.now() + 900;
        };
        utterance.onend = finishSpeech;
        utterance.onerror = finishSpeech;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        isSpeakingRef.current = false;
        console.warn('Speech synthesis error:', e);
      }
    },
    [isAudioMuted]
  );

  // Execute Voice Command
  const processCommand = useCallback(
    (rawTranscript: string) => {
      // Speech recognition may add punctuation or use slightly different
      // Bengali Unicode compositions. Normalize before matching intents.
      const normalizedTranscript = rawTranscript
        .toLowerCase()
        .normalize('NFC')
        .replace(/[.,!?;:।]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const now = Date.now();

      // Web Speech can emit the same final result more than once, especially
      // when continuous recognition is active. Process one utterance once.
      if (
        !normalizedTranscript ||
        isSpeakingRef.current ||
        now < speechIgnoreUntilRef.current ||
        (normalizedTranscript === lastProcessedTranscriptRef.current && now - lastProcessedAtRef.current < 2500)
      ) {
        return;
      }
      lastProcessedTranscriptRef.current = normalizedTranscript;
      lastProcessedAtRef.current = now;

      const q = normalizedTranscript;
      setCurrentTranscript(rawTranscript);

      // Add user transcript to log
      setCommandLogs((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          type: 'user',
          text: `"${rawTranscript}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          badge: 'VOICE IN',
        },
      ]);

      const hasBanglaScript = /[\u0980-\u09FF]/.test(q);
      // Do not classify ordinary English route questions as Banglish just because
      // they contain the word "route". Banglish needs a Bengali transliteration
      // marker such as "koro", "ache", or "nirapod".
      const isBanglish = !hasBanglaScript && /\b(koro|korben|ache|ki|chai|nao|nibo|ekhane|shuru|surur|nirapod|somoy|kom|hoye|hocche|kothay|dekh)\b/i.test(q);
      const reply = (english: string, bangla: string, banglish: string) =>
        speakCapcom(hasBanglaScript ? bangla : isBanglish ? banglish : english);

      const soundsLikeLocationRoute =
        (q.includes('from') && q.includes(' to ')) ||
        q.includes('থেকে') ||
        q.includes('যেতে চাই') ||
        q.includes('যাব') ||
        q.includes('যাওয়ার') ||
        q.includes('যাওয়ার') ||
        q.includes(' theke ') ||
        q.includes('jete chai') ||
        q.includes('jabo') ||
        q.includes('jawar') ||
        q.includes('e jete');

      if (soundsLikeLocationRoute && onPlanRouteBetweenLocations?.(rawTranscript)) {
        reply(
          'Route points found from your voice command. The route is ready for safety and time checking.',
          'আপনার কথার ভিত্তিতে শুরু ও গন্তব্য পয়েন্ট পাওয়া গেছে। এখন রুটের নিরাপত্তা ও সময় পরীক্ষা করা যাবে।',
          'Voice command theke start ar destination paoa geche. Ekhon route safety ar time check kora jabe.'
        );
        return;
      }

      // ROUTE PLANNING COMMANDS (English, Bangla, and Banglish)
      if (
        q.includes('route plan') || q.includes('plan a route') || q.includes('start route') ||
        q.includes('route planning') ||
        q.includes('রুট প্ল্যান') || q.includes('রোড প্ল্যান') || q.includes('রোট প্ল্যান') || q.includes('রুট পরিকল্পনা') || q.includes('রুট শুরু') ||
        /(?:রু[টট]|রোড|রোট)\s*(প্ল্যান|পরিকল্পনা)/u.test(q) ||
        /(প্ল্যান|পরিকল্পনা).*(?:রু[টট]|রোড|রোট)/u.test(q) ||
        /(?:রু[টট]|রোড|রোট).*(করো|করুন|চাই|দাও|দেও)/u.test(q) ||
        q.includes('route planning shuru') || q.includes('route plan koro')
      ) {
        onStartRoutePlanning?.();
        reply('Route planning started. Say set start here, then set destination here.', 'রুট পরিকল্পনা শুরু হয়েছে। এখন বলুন: এখানে শুরু এবং তারপর এখানে গন্তব্য।', 'Route planning shuru hoyeche. Bolo: set start here, tarpor set destination here.');
        return;
      }

      if (
        q.includes('set start') || q.includes('start point') || q.includes('base here') ||
        q.includes('শুরু পয়েন্ট') || q.includes('শুরু পয়েন্ট') || q.includes('এখানে শুরু') ||
        /((শুরু|স্টার্ট).*(এখানে|পয়েন্ট|পয়েন্ট|সেট|করো|করুন))/u.test(q) ||
        q.includes('start ekhane') || q.includes('shuru ekhane') || q.includes('start set koro')
      ) {
        const accepted = onSetRoutePoint?.('start') ?? false;
        reply(
          accepted ? 'Start point set at the current map position. Now set the destination.' : 'I could not set the start point yet. Open the Flat Map first.',
          accepted ? 'বর্তমান ম্যাপ অবস্থানকে শুরু পয়েন্ট করা হয়েছে। এখন গন্তব্য সেট করুন।' : 'শুরু পয়েন্ট সেট করা যায়নি। আগে Flat Map খুলুন।',
          accepted ? 'Current map position start point hisebe set hoyeche. Ekhon destination set koro.' : 'Start point set hoyni. Age Flat Map kholo.'
        );
        return;
      }

      if (
        q.includes('set destination') || q.includes('set final') || q.includes('destination here') ||
        q.includes('গন্তব্য') || q.includes('শেষ পয়েন্ট') || q.includes('শেষ পয়েন্ট') ||
        /((গন্তব্য|ডেস্টিনেশন|শেষ).*(এখানে|পয়েন্ট|পয়েন্ট|সেট|করো|করুন))/u.test(q) ||
        q.includes('destination ekhane') || q.includes('final ekhane') || q.includes('gontobbo ekhane')
      ) {
        const accepted = onSetRoutePoint?.('destination') ?? false;
        reply(
          accepted ? 'Destination set. Say check route to evaluate safety and travel time.' : 'Set a start point first, then set the destination.',
          accepted ? 'গন্তব্য সেট হয়েছে। নিরাপত্তা ও সময় পরীক্ষা করতে বলুন: রুট চেক করুন।' : 'আগে শুরু পয়েন্ট সেট করুন, তারপর গন্তব্য সেট করুন।',
          accepted ? 'Destination set hoyeche. Safety ar time dekhte bolo: route check koro.' : 'Age start point set koro, tarpor destination set koro.'
        );
        return;
      }

      if (
        q.includes('check route') || q.includes('analyze route') || q.includes('evaluate route') ||
        q.includes('রুট চেক') || q.includes('রুট পরীক্ষা') || q.includes('এই রুট নিরাপদ') ||
        /(?:রু[টট]|রোড|রোট).*(চেক|পরীক্ষা|নিরাপদ)/u.test(q) ||
        q.includes('route check koro') || q.includes('route safe ki') || q.includes('route nirapod ki')
      ) {
        const accepted = onCheckRoute?.() ?? false;
        reply(
          accepted ? 'Route checked. The safety panel now compares hazards, slope, soil, and travel time.' : 'I need both a start point and a destination before checking the route.',
          accepted ? 'রুট পরীক্ষা শেষ। নিরাপত্তা প্যানেলে hazard, slope, soil এবং ভ্রমণ সময় তুলনা করা হচ্ছে।' : 'রুট পরীক্ষা করতে শুরু এবং গন্তব্য—দুই পয়েন্টই দরকার।',
          accepted ? 'Route check shesh. Safety panel e hazard, slope, soil ar travel time compare hocche.' : 'Route check korte start ar destination duita point dorkar.'
        );
        return;
      }

      if (q.includes('safest route') || q.includes('safe route') || q.includes('নিরাপদ রুট') || /নিরাপদ.*(?:রু[টট]|রোড|রোট)|(?:রু[টট]|রোড|রোট).*নিরাপদ/u.test(q) || q.includes('safe route nao') || q.includes('nirapod route')) {
        onSelectRouteMode?.('safest');
        reply('Safest route selected. I will prioritize terrain, slope, soil, and hazards.', 'সবচেয়ে নিরাপদ রুট বেছে নেওয়া হয়েছে। terrain, slope, soil এবং hazard-কে অগ্রাধিকার দেওয়া হবে।', 'Safest route select hoyeche. Terrain, slope, soil ar hazard priority pabe.');
        return;
      }

      if (q.includes('shortest route') || q.includes('quickest route') || q.includes('কম সময়') || /কম.*সময়.*(?:রু[টট]|রোড|রোট)|দ্রুত.*(?:রু[টট]|রোড|রোট)|ছোট.*(?:রু[টট]|রোড|রোট)/u.test(q) || q.includes('short route') || q.includes('time kom')) {
        onSelectRouteMode?.('shortest');
        reply('Shortest route selected. I will show the lowest-distance option and its risks.', 'সবচেয়ে ছোট রুট বেছে নেওয়া হয়েছে। এর দূরত্ব কম, তবে ঝুঁকি থাকতে পারে।', 'Shortest route select hoyeche. Distance kom, kintu risk thakte pare.');
        return;
      }

      if (q.includes('science route') || q.includes('science priority') || q.includes('বিজ্ঞান রুট') || q.includes('science target')) {
        onSelectRouteMode?.('science');
        reply('Science route selected. The route can take a detour toward a science target.', 'Science route বেছে নেওয়া হয়েছে। প্রয়োজনে science target-এর দিকে detour নেওয়া হবে।', 'Science route select hoyeche. Science target er jonno detour hote pare.');
        return;
      }

      if (
        q.includes('is the route safe') || q.includes('route safety') || q.includes('how safe is the route') ||
        q.includes('রুট নিরাপদ কি') || q.includes('রুটের নিরাপত্তা') || q.includes('route safe kina')
      ) {
        const safetySummary = onReadRouteSafety?.(hasBanglaScript ? 'bn' : isBanglish ? 'banglish' : 'en');
        reply(
          safetySummary || 'No checked route is active. Set both points and say check route first.',
          safetySummary || 'কোনো পরীক্ষা করা রুট সক্রিয় নেই। আগে দুই পয়েন্ট সেট করে রুট চেক করুন।',
          safetySummary || 'Checked route nei. Age duita point set kore route check koro.'
        );
        return;
      }

      // 1. PAN / MOVE NORTH
      if (
        q.includes('move north') ||
        q.includes('pan north') ||
        q.includes('go north') ||
        q.includes('navigate north') ||
        q.includes('scroll north') ||
        q === 'north' ||
        q === 'up'
      ) {
        onPanDirection?.('north');
        speakCapcom('Panning map north 15 degrees.');
        return;
      }

      // 2. PAN / MOVE SOUTH
      if (
        q.includes('move south') ||
        q.includes('pan south') ||
        q.includes('go south') ||
        q.includes('navigate south') ||
        q.includes('scroll south') ||
        q === 'south' ||
        q === 'down'
      ) {
        onPanDirection?.('south');
        speakCapcom('Panning map south 15 degrees.');
        return;
      }

      // 3. PAN / MOVE EAST
      if (
        q.includes('move east') ||
        q.includes('pan east') ||
        q.includes('go east') ||
        q.includes('navigate east') ||
        q.includes('scroll east') ||
        q === 'east' ||
        q === 'right'
      ) {
        onPanDirection?.('east');
        speakCapcom('Panning map east 15 degrees.');
        return;
      }

      // 4. PAN / MOVE WEST
      if (
        q.includes('move west') ||
        q.includes('pan west') ||
        q.includes('go west') ||
        q.includes('navigate west') ||
        q.includes('scroll west') ||
        q === 'west' ||
        q === 'left'
      ) {
        onPanDirection?.('west');
        speakCapcom('Panning map west 15 degrees.');
        return;
      }

      // 5. ZOOM IN
      if (
        q.includes('zoom in') ||
        q.includes('closer') ||
        q.includes('zoom closer') ||
        q.includes('enhance') ||
        q.includes('magnify') ||
        q === 'in'
      ) {
        onZoomAction?.('in');
        speakCapcom('Zooming in closer to surface.');
        return;
      }

      // 6. ZOOM OUT
      if (
        q.includes('zoom out') ||
        q.includes('wider') ||
        q.includes('pull back') ||
        q === 'out'
      ) {
        onZoomAction?.('out');
        speakCapcom('Zooming out to broader regional view.');
        return;
      }

      // 7. RESET ZOOM / GLOBAL VIEW
      if (
        q.includes('reset zoom') ||
        q.includes('global view') ||
        q.includes('overview') ||
        q.includes('reset map') ||
        q.includes('full map') ||
        q === 'reset' ||
        q === 'center'
      ) {
        onZoomAction?.('reset');
        speakCapcom('Resetting to full global Mars overview.');
        return;
      }

      // 8. ROTATION & BEARING
      if (q.includes('rotate right') || q.includes('turn right') || q.includes('clockwise')) {
        onRotateAction?.('right');
        speakCapcom('Rotating map 90 degrees clockwise.');
        return;
      }
      if (q.includes('rotate left') || q.includes('turn left') || q.includes('counter clockwise')) {
        onRotateAction?.('left');
        speakCapcom('Rotating map 90 degrees counter-clockwise.');
        return;
      }
      if (
        q.includes('reset north') ||
        q.includes('align north') ||
        q.includes('true north') ||
        q.includes('north up')
      ) {
        onRotateAction?.('reset');
        speakCapcom('Map re-aligned with True North Up.');
        return;
      }

      // 9. VIEW MODE SWITCHING
      if (q.includes('3d globe') || q.includes('switch to 3d') || q.includes('globe view') || q.includes('show globe')) {
        onSwitchView?.('3d');
        speakCapcom('Switching to 3D Orbital Globe mode.');
        return;
      }
      if (q.includes('flat map') || q.includes('2d map') || q.includes('switch to 2d') || q.includes('mercator')) {
        onSwitchView?.('2d');
        speakCapcom('Switching to 2D Mercator flat map view.');
        return;
      }
      if (
        q.includes('astronaut view') ||
        q.includes('astronaut') ||
        q.includes('eva') ||
        q.includes('surface view') ||
        q.includes('first person') ||
        q.includes('step onto surface')
      ) {
        onSwitchView?.('astronaut');
        speakCapcom('Deploying to First-Person Astronaut Surface EVA mode.');
        return;
      }

      // 10. BASEMAP LAYERS
      if (q.includes('mola') || q.includes('elevation') || q.includes('topography')) {
        onToggleLayer?.('mola');
        speakCapcom('Basemap switched to NASA MOLA Color Shaded Elevation.');
        return;
      }
      if (q.includes('viking') || q.includes('true color') || q.includes('color map') || q.includes('visible')) {
        onToggleLayer?.('viking');
        speakCapcom('Basemap switched to Viking MDIM 2.1 Natural Color Mosaic.');
        return;
      }
      if (q.includes('themis') || q.includes('infrared') || q.includes('thermal')) {
        onToggleLayer?.('themis');
        speakCapcom('Basemap switched to THEMIS Day Infrared Controlled Mosaic.');
        return;
      }

      // 11. DYNAMIC MISSION SITE QUERIES & FAMOUS MISSIONS
      // Clean query text for entity extraction
      const cleanTarget = q
        .replace(/^(where is|tell me about|navigate to|go to|fly to|show me|find|query mission site|query mission|query site|query|show|information on|info on)\s+/i, '')
        .replace(/\s*(rover|lander|mission|crater|mons|volcano|canyon|basin|planitia|base)?$/i, '')
        .trim();

      // Check MARS_MISSIONS_DATA database
      const matchedMission = MARS_MISSIONS_DATA.find((m) => {
        const mName = m.name.toLowerCase();
        const mId = m.id.toLowerCase();
        const siteName = (m.landingSiteName || '').toLowerCase();
        return (
          q.includes(mName) ||
          q.includes(mId) ||
          mName.includes(cleanTarget) ||
          (cleanTarget.length >= 3 && mId.includes(cleanTarget)) ||
          (siteName && q.includes(siteName))
        );
      });

      if (matchedMission && matchedMission.lat !== undefined && matchedMission.lng !== undefined) {
        onFlyToLocation?.(
          matchedMission.lat,
          matchedMission.lng,
          7,
          `${matchedMission.landingSiteName || matchedMission.name} — ${matchedMission.name}`
        );
        onSelectMission?.(matchedMission.id);
        const arrivalInfo = matchedMission.arrivalDate ? `Arrived ${matchedMission.arrivalDate}.` : '';
        const statusInfo = matchedMission.statusDisplay ? `Status: ${matchedMission.statusDisplay}.` : '';
        const story = matchedMission.keyDiscoveries?.length
          ? matchedMission.keyDiscoveries[0]
          : matchedMission.objectives?.slice(0, 2).join('. ') || 'Planetary exploration mission.';
        speakCapcom(
          `Navigating to ${matchedMission.name} at ${matchedMission.landingSiteName || 'Martian surface'}. ${arrivalInfo} ${statusInfo} ${story}`
        );
        return;
      }

      // Check ALL_MARS_FEATURES database (craters, volcanoes, canyons, plains)
      const matchedFeature = ALL_MARS_FEATURES.find((f) => {
        const fName = f.name.toLowerCase();
        const fId = f.id.toLowerCase();
        return (
          q.includes(fName) ||
          fName.includes(cleanTarget) ||
          (cleanTarget.length >= 4 && fId.includes(cleanTarget))
        );
      });

      if (matchedFeature) {
        onFlyToLocation?.(
          matchedFeature.lat,
          matchedFeature.lng,
          6,
          matchedFeature.name
        );
        onSelectSite?.(matchedFeature);
        const elevDisplay = matchedFeature.elevationM >= 0 ? `+${matchedFeature.elevationM}m` : `${matchedFeature.elevationM}m`;
        speakCapcom(
          `Navigating to ${matchedFeature.name} (${matchedFeature.type}). Surface elevation is ${elevDisplay}. ${matchedFeature.description}`
        );
        return;
      }

      // Keep unknown speech realtime and local. Do not redirect to the old
      // generic navigation fallback or pretend that an action was executed.
      reply(
        'I heard you, but I could not match an action. Please repeat the command.',
        'আমি শুনেছি, কিন্তু কোনো কাজের কমান্ড বুঝতে পারিনি। অনুগ্রহ করে আবার বলুন।',
        'Ami shunechi, kintu kono action bujhini. Command-ta abar bolo.'
      );
    },
    [
      onPanDirection,
      onZoomAction,
      onRotateAction,
      onSwitchView,
      onToggleLayer,
      onFlyToLocation,
      onSelectMission,
      onSelectSite,
      onStartRoutePlanning,
      onPlanRouteBetweenLocations,
      onSetRoutePoint,
      onCheckRoute,
      onSelectRouteMode,
      onReadRouteSafety,
      speakCapcom,
    ]
  );

  // Initialize Web Speech API Speech Recognition
  const startListening = (announce = true) => {
    if (typeof window === 'undefined') return;
    shouldKeepListeningRef.current = true;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusMessage('Web Speech API is not supported in this browser. Use command chips below to simulate.');
      speakCapcom('Speech Recognition not supported in browser. Use interactive buttons below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = recognitionLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('Listening for navigation & mission queries...');
      };

      recognition.onresult = (event: any) => {
        const lastIdx = event.results.length - 1;
        const transcript = event.results[lastIdx][0].transcript;
        if (transcript && transcript.trim()) {
          processCommand(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        if (e.error === 'not-allowed') {
          setStatusMessage('Microphone access denied. You can click any voice command button below to execute it!');
          shouldKeepListeningRef.current = false;
        } else if (e.error === 'aborted' || e.error === 'no-speech') {
          setStatusMessage('Voice link reconnecting...');
        } else {
          setStatusMessage(`Speech link idle (${e.error}). Click to restart or use buttons.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
        }
        if (shouldKeepListeningRef.current && isOpen && !isSpeakingRef.current) {
          window.setTimeout(() => {
            if (shouldKeepListeningRef.current && isOpen && !recognitionRef.current) {
              startListening(false);
            }
          }, 350);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      if (announce) {
        speakCapcom('Voice system online. Say a command or query.');
      }
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsListening(false);
      setStatusMessage('Voice recognition error. Use quick command buttons below.');
    }
  };

  const stopListening = () => {
    shouldKeepListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setStatusMessage('Voice listening paused. Click Mic to resume.');
  };

  // Start on mount if opened
  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
    }
    return () => {
      stopListening();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    };
  }, [isOpen, recognitionLanguage]);

  // Animated Visualizer Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      const numBars = 28;
      const barWidth = w / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 2);
        let amplitude = 2;

        if (isListening) {
          const wave1 = Math.sin((i / numBars) * Math.PI * 4 + phase);
          const wave2 = Math.cos((i / numBars) * Math.PI * 2 - phase * 1.5);
          amplitude = Math.max(2, Math.abs(wave1 * wave2) * (h / 2.2));
        } else {
          // Keep a calm live-link pulse visible in both English and Bangla
          // modes, even while the browser is reconnecting the microphone.
          amplitude = 3 + Math.abs(Math.sin(phase + i * 0.35)) * 3;
        }

        ctx.fillStyle = isListening ? (i % 2 === 0 ? '#06b6d4' : '#38bdf8') : '#f59e0b';
        ctx.fillRect(x, centerY - amplitude, barWidth, amplitude * 2);
      }

      phase += 0.08;
      animId = requestAnimationFrame(renderWave);
    };

    renderWave();
    return () => cancelAnimationFrame(animId);
  }, [isListening]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-[9999] transition-all duration-300 ${
        isMinimized
          ? 'bottom-20 right-4 sm:right-6 w-80'
          : 'inset-x-3 bottom-16 sm:bottom-20 sm:inset-x-auto sm:right-6 sm:w-[460px] max-h-[85vh]'
      }`}
    >
      <div className="bg-[#090d16]/95 backdrop-blur-2xl border border-cyan-500/70 rounded-3xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-neutral-800/80 bg-[#0c1220] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex items-center justify-center p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/60 text-cyan-400">
              <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse text-cyan-300' : 'text-neutral-400'}`} />
              {isListening && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                  Web Speech Voice Controller
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  LIVE API
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 truncate font-mono">
                {statusMessage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                const next = !isAudioMuted;
                setIsAudioMuted(next);
                if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              className="p-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
              title={isAudioMuted ? 'Unmute CapCom Audio Voice' : 'Mute Voice Audio'}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized((prev) => !prev)}
              className="p-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
              title={isMinimized ? 'Expand Voice HUD' : 'Minimize Voice HUD'}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
              title="Close Voice Assistant"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isMinimized && (
          <div className="flex flex-col flex-1 max-h-[500px]">
            {/* Live Audio Visualizer Canvas & Mic Button */}
            <div className="p-3 bg-black/40 border-b border-neutral-800 flex items-center justify-between gap-3">
              <canvas ref={canvasRef} width={180} height={28} className="rounded-lg opacity-90" />
              <div className="flex items-center gap-1.5">
                <select
                  value={recognitionLanguage}
                  onChange={(event) => setRecognitionLanguage(event.target.value as 'en-US' | 'bn-BD')}
                  className="rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-[10px] text-neutral-300 outline-none cursor-pointer"
                  aria-label="Voice recognition language"
                >
                  <option value="en-US">English / Banglish</option>
                  <option value="bn-BD">বাংলা</option>
                </select>
                <button
                  type="button"
                  onClick={() => (isListening ? stopListening() : startListening())}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                    isListening
                      ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isListening ? 'PAUSE MIC' : 'LISTEN'}</span>
                </button>
              </div>
            </div>

            {/* Live CapCom & Transcript Log View */}
            <div className="p-3 overflow-y-auto space-y-2.5 flex-1 min-h-[140px] max-h-[220px] bg-[#070b14]/50">
              {commandLogs.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-2xl text-xs leading-relaxed transition-all ${
                    item.type === 'user'
                      ? 'bg-cyan-950/70 border border-cyan-800 text-cyan-200 ml-4'
                      : 'bg-neutral-900/80 border border-neutral-800 text-neutral-200 mr-2'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                    <span className={`font-bold ${item.type === 'user' ? 'text-cyan-400' : 'text-orange-400'}`}>
                      {item.badge}
                    </span>
                    <span>{item.timestamp}</span>
                  </div>
                  <div>{item.text}</div>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>

            {/* Quick-Click Command Chips (Categorized & 1-Click Interactive Test) */}
            <div className="p-3 border-t border-neutral-800 bg-[#0a0f1d] space-y-2">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="font-mono text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Click or Speak Any Command</span>
                </span>
                {/* Category Pills */}
                <div className="flex items-center gap-1">
                  {(['all', 'navigation', 'missions', 'landmarks', 'route'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`px-1.5 py-0.5 rounded text-[9px] capitalize transition ${
                        activeCategory === cat ? 'bg-cyan-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-[135px] overflow-y-auto pr-1">
                {/* Route Planning Commands */}
                {(activeCategory === 'all' || activeCategory === 'route') && (
                  <>
                    <button
                      type="button"
                      onClick={() => processCommand('Start route planning')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-cyan-950 border border-neutral-800 hover:border-cyan-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <Navigation className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">"Start route plan"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Set start here')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-cyan-950 border border-neutral-800 hover:border-cyan-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">"Set start here"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Set destination here')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-cyan-950 border border-neutral-800 hover:border-cyan-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                      <span className="truncate">"Set destination"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Check route')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-emerald-950 border border-neutral-800 hover:border-emerald-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">"Check route"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Safest route')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-emerald-950 border border-neutral-800 hover:border-emerald-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">"Safest route"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Is the route safe?')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-amber-950 border border-neutral-800 hover:border-amber-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <HelpCircle className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">"Is route safe?"</span>
                    </button>
                  </>
                )}

                {/* Navigation Commands */}
                {(activeCategory === 'all' || activeCategory === 'navigation') && (
                  <>
                    <button
                      type="button"
                      onClick={() => processCommand('Move north')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-cyan-950 border border-neutral-800 hover:border-cyan-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <ArrowUp className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">"Move north"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Move south')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-cyan-950 border border-neutral-800 hover:border-cyan-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <ArrowDown className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">"Move south"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Move east')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-cyan-950 border border-neutral-800 hover:border-cyan-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">"Move east"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Move west')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-cyan-950 border border-neutral-800 hover:border-cyan-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <ArrowLeft className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">"Move west"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Zoom in')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-cyan-950 border border-neutral-800 hover:border-cyan-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <ZoomIn className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">"Zoom in"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Zoom out')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-cyan-950 border border-neutral-800 hover:border-cyan-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <ZoomOut className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">"Zoom out"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Align north')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-cyan-950 border border-neutral-800 hover:border-cyan-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <Compass className="w-3 h-3 text-orange-400 shrink-0" />
                      <span className="truncate">"Align north"</span>
                    </button>
                  </>
                )}

                {/* Mission Queries */}
                {(activeCategory === 'all' || activeCategory === 'missions') && (
                  <>
                    <button
                      type="button"
                      onClick={() => processCommand('Where is Perseverance?')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-orange-950 border border-neutral-800 hover:border-orange-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <Navigation className="w-3 h-3 text-orange-400 shrink-0" />
                      <span className="truncate">"Perseverance Rover"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Where is Curiosity?')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-orange-950 border border-neutral-800 hover:border-orange-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <Navigation className="w-3 h-3 text-orange-400 shrink-0" />
                      <span className="truncate">"Curiosity Rover"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Opportunity Rover')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-orange-950 border border-neutral-800 hover:border-orange-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <Navigation className="w-3 h-3 text-orange-400 shrink-0" />
                      <span className="truncate">"Opportunity Rover"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Where is Zhurong?')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-orange-950 border border-neutral-800 hover:border-orange-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <Navigation className="w-3 h-3 text-orange-400 shrink-0" />
                      <span className="truncate">"Zhurong Rover"</span>
                    </button>
                  </>
                )}

                {/* Landmark Queries */}
                {(activeCategory === 'all' || activeCategory === 'landmarks') && (
                  <>
                    <button
                      type="button"
                      onClick={() => processCommand('Olympus Mons')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-purple-950 border border-neutral-800 hover:border-purple-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="truncate">"Olympus Mons"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Valles Marineris')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-purple-950 border border-neutral-800 hover:border-purple-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="truncate">"Valles Marineris"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Arcadia Planitia')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-purple-950 border border-neutral-800 hover:border-purple-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">"Arcadia Planitia Base"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => processCommand('Astronaut view')}
                      className="p-1.5 rounded-xl bg-neutral-900/90 hover:bg-blue-950 border border-neutral-800 hover:border-blue-500 text-left transition flex items-center gap-1.5 text-[11px]"
                    >
                      <Footprints className="w-3 h-3 text-cyan-300 shrink-0" />
                      <span className="truncate">"Astronaut View"</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
