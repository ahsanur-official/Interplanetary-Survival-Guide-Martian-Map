import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX,
  Sparkles,
  Compass,
  X,
  Minimize2,
  Maximize2,
  AlertCircle,
  Loader2,
  Layers,
  Send,
  HelpCircle,
  CheckCircle2,
  Activity,
  Zap,
} from 'lucide-react';
import { MarsLiveAudioController, AudioVisualizerData } from '../../engine/marsLiveAudio';

interface MarsLiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLat?: number;
  currentLng?: number;
  currentZoom?: number;
  onFlyToLocation?: (lat: number, lng: number, zoom?: number, name?: string) => void;
  onSelectMission?: (missionId: string) => void;
  onToggleLayer?: (layerId: string) => void;
}

interface TranscriptItem {
  id: string;
  sender: 'user' | 'model' | 'system' | 'tool';
  text: string;
  timestamp: string;
  toolDetails?: {
    name: string;
    params?: any;
  };
}

const VOICE_OPTIONS = [
  { id: 'Zephyr', label: 'Zephyr (Crisp / Calm)', desc: 'Standard planetary flight controller' },
  { id: 'Puck', label: 'Puck (Energetic)', desc: 'Spirited exploratory scientist' },
  { id: 'Charon', label: 'Charon (Deep / Authoritative)', desc: 'Mission command director' },
  { id: 'Kore', label: 'Kore (Warm)', desc: 'Geoscience telemetry specialist' },
  { id: 'Fenrir', label: 'Fenrir (Resonant)', desc: 'Field expedition guide' },
];

const SUGGESTED_VOICE_QUERIES = [
  'Take me to Olympus Mons caldera',
  'Fly to Jezero Crater delta where Perseverance landed',
  'Switch map to MOLA elevation view',
  'What are the best human landing sites for water ice extraction?',
  'Tell me about the depth of Valles Marineris canyon',
];

export function MarsLiveVoiceModal({
  isOpen,
  onClose,
  currentLat = 18.38,
  currentLng = 77.58,
  currentZoom = 5,
  onFlyToLocation,
  onSelectMission,
  onToggleLayer,
}: MarsLiveVoiceModalProps) {
  // Voice Session State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('Zephyr');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPushToTalk, setIsPushToTalk] = useState<boolean>(false);
  const [isPTTHeld, setIsPTTHeld] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Standby. Click Start Voice Link.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio & Waveform Visualization
  const [visualizerData, setVisualizerData] = useState<AudioVisualizerData>({
    inputLevel: 0,
    outputLevel: 0,
    inputWaveform: new Array(16).fill(0),
    outputWaveform: new Array(16).fill(0),
  });
  const [isModelSpeaking, setIsModelSpeaking] = useState<boolean>(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);

  // Transcripts
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [textInput, setTextInput] = useState<string>('');

  // Audio Controller & WS References
  const audioControllerRef = useRef<MarsLiveAudioController | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef<boolean>(false);

  // Auto-scroll transcript
  useEffect(() => {
    if (!isMinimized) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts, isMinimized]);

  // Clean up on unmount or close
  const disconnectSession = useCallback(() => {
    isClosingRef.current = true;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioControllerRef.current) {
      audioControllerRef.current.destroy();
      audioControllerRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsModelSpeaking(false);
    setIsUserSpeaking(false);
    setStatusMessage('Voice comms link closed.');
    setVisualizerData({
      inputLevel: 0,
      outputLevel: 0,
      inputWaveform: new Array(16).fill(0),
      outputWaveform: new Array(16).fill(0),
    });
  }, []);

  // Handle level updates to detect active speaking
  const handleLevelUpdate = useCallback((data: AudioVisualizerData) => {
    setVisualizerData(data);
    setIsUserSpeaking(data.inputLevel > 0.08);
    setIsModelSpeaking(data.outputLevel > 0.05);
  }, []);

  // Connect to Gemini Live WebSocket
  const connectSession = async () => {
    setErrorMessage(null);
    setIsConnecting(true);
    setStatusMessage('Initiating sub-second link to gemini-3.8-live...');
    isClosingRef.current = false;

    try {
      // 1. Initialize audio capture and playback pipeline
      const controller = new MarsLiveAudioController();
      await controller.initialize((base64Chunk) => {
        // Send audio chunk to WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'audio',
              audio: base64Chunk,
            })
          );
        }
      }, handleLevelUpdate);

      audioControllerRef.current = controller;

      // 2. Request mic access
      await controller.startMicrophone();

      // 3. Connect to WebSocket server on /api/live-ws
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live-ws?voice=${selectedVoice}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatusMessage('Establishing neural audio link with gemini-3.8-live...');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'session_ready') {
            setIsConnected(true);
            setIsConnecting(false);
            setStatusMessage(`Live Voice Active (gemini-3.8-live • Voice: ${selectedVoice})`);

            // Add system greeting to transcript
            setTranscripts((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).substring(7),
                sender: 'system',
                text: `Connected to gemini-3.8-live via low-latency audio stream. Grounded in NASA PDS & MOLA GIS. Speak freely or tap a quick prompt.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              },
            ]);

            // Send initial situational context about current Mars coordinates
            ws.send(
              JSON.stringify({
                type: 'text',
                text: `[SYSTEM CONTEXT: Astronaut is viewing Mars map at latitude ${currentLat.toFixed(
                  2
                )}°, longitude ${currentLng.toFixed(2)}°, zoom level ${currentZoom}. Please say hello and ask how you can guide their exploration.]`,
              })
            );
          } else if (msg.type === 'audio') {
            // Play incoming model audio chunk
            if (audioControllerRef.current) {
              audioControllerRef.current.playAudioChunk(msg.audio);
            }
          } else if (msg.type === 'transcript_model') {
            // Append or update model transcript
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'model') {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...last,
                    text: `${last.text} ${msg.text}`.trim(),
                  },
                ];
              } else {
                return [
                  ...prev,
                  {
                    id: Math.random().toString(36).substring(7),
                    sender: 'model',
                    text: msg.text,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ];
              }
            });
          } else if (msg.type === 'transcript_user') {
            // User speech transcribed by Gemini Live
            setTranscripts((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).substring(7),
                sender: 'user',
                text: msg.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          } else if (msg.type === 'interrupted') {
            // User spoke over the model; immediately cut off audio
            if (audioControllerRef.current) {
              audioControllerRef.current.handleInterruption();
            }
            setIsModelSpeaking(false);
          } else if (msg.type === 'tool_call') {
            // Handle tool calls generated by the Live model
            const toolCall = msg.toolCall;
            for (const call of toolCall.functionCalls || []) {
              if (call.name === 'flyToLocation') {
                const { name, lat, lng, zoom } = call.args || {};
                if (onFlyToLocation && typeof lat === 'number' && typeof lng === 'number') {
                  onFlyToLocation(lat, lng, zoom || 6, name || 'Requested Martian Location');
                }
                setTranscripts((prev) => [
                  ...prev,
                  {
                    id: Math.random().toString(36).substring(7),
                    sender: 'tool',
                    text: `Orbital camera navigated to ${name || 'target'} (${lat?.toFixed(2)}°, ${lng?.toFixed(2)}°)`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    toolDetails: { name: 'flyToLocation', params: call.args },
                  },
                ]);
              } else if (call.name === 'selectMission') {
                const { missionId, name } = call.args || {};
                if (onSelectMission && missionId) {
                  onSelectMission(missionId);
                }
                setTranscripts((prev) => [
                  ...prev,
                  {
                    id: Math.random().toString(36).substring(7),
                    sender: 'tool',
                    text: `Selected surface mission: ${name || missionId}`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    toolDetails: { name: 'selectMission', params: call.args },
                  },
                ]);
              } else if (call.name === 'toggleLayer') {
                const { layerId } = call.args || {};
                if (onToggleLayer && layerId) {
                  onToggleLayer(layerId);
                }
                setTranscripts((prev) => [
                  ...prev,
                  {
                    id: Math.random().toString(36).substring(7),
                    sender: 'tool',
                    text: `Switched global GIS layer to: ${layerId.toUpperCase()}`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    toolDetails: { name: 'toggleLayer', params: call.args },
                  },
                ]);
              }
            }
          } else if (msg.type === 'error') {
            setErrorMessage(msg.message || 'Error from Live voice service');
            disconnectSession();
          } else if (msg.type === 'session_closed') {
            disconnectSession();
          }
        } catch (e) {
          console.error('Error parsing live WS message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('Live WS socket error:', err);
        setErrorMessage('Failed to establish WebSocket link to server. Ensure Gemini API key is configured.');
        disconnectSession();
      };

      ws.onclose = () => {
        if (!isClosingRef.current) {
          setIsConnected(false);
          setIsConnecting(false);
          setStatusMessage('Live voice comms disconnected.');
        }
      };
    } catch (err: any) {
      console.error('Error starting live voice session:', err);
      setErrorMessage(
        err?.message || 'Could not access microphone or connect to gemini-3.8-live. Please grant mic permissions.'
      );
      disconnectSession();
    }
  };

  // Toggle mute
  const handleToggleMute = () => {
    if (!audioControllerRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    audioControllerRef.current.setMuted(next);
  };

  // Send typed query to the live session
  const handleSendText = () => {
    if (!textInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const query = textInput.trim();
    setTextInput('');

    setTranscripts((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        sender: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    wsRef.current.send(
      JSON.stringify({
        type: 'text',
        text: query,
      })
    );
  };

  // Quick Prompt click
  const handleQuickPrompt = (prompt: string) => {
    if (!isConnected) {
      connectSession().then(() => {
        setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            setTranscripts((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).substring(7),
                sender: 'user',
                text: prompt,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
            wsRef.current.send(JSON.stringify({ type: 'text', text: prompt }));
          }
        }, 1500);
      });
      return;
    }

    setTranscripts((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        sender: 'user',
        text: prompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', text: prompt }));
    }
  };

  // Handle push-to-talk press
  const handlePTTDown = () => {
    if (!isPushToTalk || !audioControllerRef.current) return;
    setIsPTTHeld(true);
    audioControllerRef.current.setMuted(false);
  };

  const handlePTTUp = () => {
    if (!isPushToTalk || !audioControllerRef.current) return;
    setIsPTTHeld(false);
    audioControllerRef.current.setMuted(true);
  };

  // If closed, return null unless minimized and still connected
  if (!isOpen && !isMinimized) {
    return null;
  }

  // Floating Minimized Mode (allows user to speak while looking at map)
  if (isMinimized) {
    return (
      <div className="fixed bottom-14 right-4 sm:bottom-6 sm:right-6 z-50 bg-neutral-900/95 backdrop-blur-md border border-purple-500/50 rounded-2xl shadow-2xl p-3 flex items-center gap-3 text-white animate-in slide-in-from-bottom-3 duration-200">
        {/* Pulsing indicator */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              isModelSpeaking
                ? 'bg-purple-600 animate-pulse'
                : isUserSpeaking
                ? 'bg-emerald-600 animate-pulse'
                : isConnected
                ? 'bg-purple-950 border border-purple-500/60'
                : 'bg-neutral-800'
            }`}
          >
            {isModelSpeaking ? (
              <Volume2 className="w-5 h-5 text-white" />
            ) : isMuted ? (
              <MicOff className="w-5 h-5 text-rose-400" />
            ) : (
              <Mic className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          {isConnected && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-neutral-950"></span>
          )}
        </div>

        {/* Live Audio Mini Bars */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-purple-300">Live Comms</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 font-mono border border-purple-800/40">
              gemini-3.8-live
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <div className="flex items-end gap-0.5 h-3.5 w-16">
              {(isModelSpeaking ? visualizerData.outputWaveform : visualizerData.inputWaveform)
                .slice(0, 8)
                .map((val, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-t transition-all duration-75 ${
                      isModelSpeaking ? 'bg-purple-400' : isUserSpeaking ? 'bg-emerald-400' : 'bg-neutral-700'
                    }`}
                    style={{ height: `${Math.max(2, val * 14)}px` }}
                  />
                ))}
            </div>
            <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[120px]">
              {isModelSpeaking ? 'AI speaking...' : isUserSpeaking ? 'Listening...' : isMuted ? 'Muted' : 'Standby'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800">
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-lg transition ${
              isMuted
                ? 'bg-rose-950/80 text-rose-400 hover:bg-rose-900 border border-rose-700/50'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsMinimized(false)}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
            title="Expand Live Voice Console"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              disconnectSession();
              setIsMinimized(false);
              onClose();
            }}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
            title="Disconnect Voice Link"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-950/50 border border-purple-500/30">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-wide font-mono">
                  MARSWAY LIVE VOICE COMMS
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 font-mono border border-purple-700/60 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono flex items-center gap-2">
                <span>Real-Time Bi-Directional PCM Audio Link</span>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block"></span>
                <span>NASA PDS & MOLA Grounded</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition"
              title="Minimize to floating HUD"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                disconnectSession();
                onClose();
              }}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status & Error Notification */}
        {errorMessage && (
          <div className="px-4 py-2.5 bg-rose-950/80 border-b border-rose-800 text-rose-200 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="px-2 py-0.5 rounded bg-rose-900 text-white hover:bg-rose-800 text-[10px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Interactive Audio Center */}
        <div className="p-5 border-b border-neutral-800/80 bg-gradient-to-b from-neutral-900/40 to-neutral-950 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Circular Visualizer Radar */}
          <div className="relative flex items-center justify-center my-4">
            {/* Outer animated rings */}
            <div
              className={`absolute w-36 h-36 rounded-full border border-purple-500/20 transition-all duration-300 ${
                isModelSpeaking ? 'scale-125 opacity-100 animate-ping' : 'scale-100 opacity-20'
              }`}
            />
            <div
              className={`absolute w-48 h-48 rounded-full border border-indigo-500/10 transition-all duration-500 ${
                isUserSpeaking ? 'scale-115 opacity-80 border-emerald-500/30' : 'scale-100 opacity-10'
              }`}
            />

            {/* Central Master Button */}
            {!isConnected ? (
              <button
                onClick={connectSession}
                disabled={isConnecting}
                className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 disabled:opacity-60 text-white shadow-xl shadow-purple-950/70 border border-purple-400/40 flex flex-col items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 group"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-purple-200" />
                    <span className="text-[11px] font-mono tracking-wider font-semibold">CONNECTING</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-8 h-8 text-white group-hover:animate-pulse" />
                    <span className="text-[11px] font-mono tracking-wider font-bold">START VOICE</span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-28 h-28 rounded-full bg-neutral-900 border-2 border-purple-500/60 shadow-2xl flex flex-col items-center justify-center relative z-10">
                {isModelSpeaking ? (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Volume2 className="w-7 h-7 text-purple-400 animate-bounce" />
                    <span className="text-[10px] font-mono text-purple-300 font-bold uppercase tracking-wider">
                      Speaking
                    </span>
                  </div>
                ) : isUserSpeaking ? (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Mic className="w-7 h-7 text-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider">
                      Listening
                    </span>
                  </div>
                ) : isMuted ? (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <MicOff className="w-7 h-7 text-rose-400" />
                    <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">
                      Muted
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Radio className="w-7 h-7 text-purple-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                      Live Link
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Real-time Spectrum Oscilloscope */}
          <div className="w-full max-w-md flex items-end justify-center gap-1 h-12 py-1">
            {(isModelSpeaking
              ? visualizerData.outputWaveform
              : visualizerData.inputWaveform
            ).map((val, i) => (
              <div
                key={i}
                className={`w-2.5 rounded-t transition-all duration-75 ${
                  isModelSpeaking
                    ? 'bg-gradient-to-t from-purple-600 to-indigo-400'
                    : isUserSpeaking
                    ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                    : 'bg-neutral-800'
                }`}
                style={{
                  height: `${Math.max(4, val * 44)}px`,
                }}
              />
            ))}
          </div>

          {/* Connection & Status Banner */}
          <div className="mt-2 text-center">
            <p className="text-xs font-mono text-neutral-300">{statusMessage}</p>
            {isConnected && (
              <p className="text-[11px] font-mono text-purple-400 mt-0.5">
                Latency: Sub-second • Sampling: 16kHz PCM In / 24kHz PCM Out • Voice: {selectedVoice}
              </p>
            )}
          </div>

          {/* Audio Controls Toolbar */}
          {isConnected && (
            <div className="mt-4 flex items-center gap-2.5 flex-wrap justify-center font-mono text-xs">
              <button
                onClick={handleToggleMute}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition ${
                  isMuted
                    ? 'bg-rose-950 text-rose-300 border-rose-700/60 shadow'
                    : 'bg-neutral-900 text-neutral-200 border-neutral-700/60 hover:bg-neutral-800'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
              </button>

              <button
                onClick={() => {
                  setIsPushToTalk(!isPushToTalk);
                  if (!isPushToTalk && audioControllerRef.current) {
                    audioControllerRef.current.setMuted(true);
                  } else if (audioControllerRef.current) {
                    audioControllerRef.current.setMuted(false);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition ${
                  isPushToTalk
                    ? 'bg-purple-950 text-purple-300 border-purple-700/60'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>{isPushToTalk ? 'Push-To-Talk [ON]' : 'Open Mic (VAD)'}</span>
              </button>

              {isPushToTalk && (
                <button
                  onMouseDown={handlePTTDown}
                  onMouseUp={handlePTTUp}
                  onTouchStart={handlePTTDown}
                  onTouchEnd={handlePTTUp}
                  className={`px-4 py-1.5 rounded-lg font-bold border transition ${
                    isPTTHeld
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-950'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                  }`}
                >
                  {isPTTHeld ? 'TRANSMITTING...' : 'HOLD TO TALK'}
                </button>
              )}

              <button
                onClick={disconnectSession}
                className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition"
              >
                End Voice Link
              </button>
            </div>
          )}
        </div>

        {/* Configuration Bar (Voice Persona Selector & Prompt Pills) */}
        <div className="px-4 py-2.5 bg-neutral-900/80 border-b border-neutral-800 flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-400 shrink-0">Flight Voice:</span>
            <select
              value={selectedVoice}
              onChange={(e) => {
                const newVoice = e.target.value;
                setSelectedVoice(newVoice);
                if (isConnected) {
                  disconnectSession();
                  setTimeout(() => {
                    connectSession();
                  }, 200);
                }
              }}
              className="bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-neutral-200 font-mono focus:outline-none focus:border-purple-500"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Try saying: "Fly to Olympus Mons" or "Show MOLA elevation"</span>
          </div>
        </div>

        {/* Live Conversation Transcript Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px] max-h-[260px] bg-neutral-950/60 font-sans text-xs">
          {transcripts.length === 0 ? (
            <div className="text-center py-6 text-neutral-500 font-mono">
              <Radio className="w-6 h-6 mx-auto mb-2 text-neutral-600" />
              <p>Voice transmission log will display here in real-time.</p>
              <p className="text-[11px] text-neutral-600 mt-1">
                You can interrupt the AI at any time simply by speaking over it.
              </p>
            </div>
          ) : (
            transcripts.map((t) => (
              <div
                key={t.id}
                className={`flex flex-col ${
                  t.sender === 'user'
                    ? 'items-end'
                    : t.sender === 'system' || t.sender === 'tool'
                    ? 'items-center'
                    : 'items-start'
                }`}
              >
                {t.sender === 'system' ? (
                  <div className="px-3 py-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800 text-[11px] font-mono text-neutral-400 text-center max-w-lg">
                    {t.text}
                  </div>
                ) : t.sender === 'tool' ? (
                  <div className="px-3 py-1.5 rounded-lg bg-indigo-950/50 border border-indigo-700/60 text-[11px] font-mono text-indigo-300 flex items-center gap-2 max-w-lg">
                    <Compass className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{t.text}</span>
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow ${
                      t.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-tr-none'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1 text-[10px] font-mono opacity-70">
                      <span className="font-bold">
                        {t.sender === 'user' ? 'Astronaut (You)' : `Gemini Live (${selectedVoice})`}
                      </span>
                      <span>{t.timestamp}</span>
                    </div>
                    <p className="leading-relaxed">{t.text}</p>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Quick Voice Starters */}
        <div className="px-4 py-2 border-t border-neutral-800/80 bg-neutral-950/40 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[10px] font-mono text-neutral-500 shrink-0">Prompts:</span>
          {SUGGESTED_VOICE_QUERIES.map((query, i) => (
            <button
              key={i}
              onClick={() => handleQuickPrompt(query)}
              className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white whitespace-nowrap transition text-xs flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>{query}</span>
            </button>
          ))}
        </div>

        {/* Text Fallback / Input Field */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/70 flex items-center gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendText();
            }}
            placeholder={
              isConnected
                ? 'Type to speak via Gemini Live, or speak into your microphone...'
                : 'Connect Voice Link above, or type here to start...'
            }
            className="flex-1 bg-neutral-950 border border-neutral-800 text-sm text-white placeholder-neutral-500 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={isConnected ? handleSendText : () => connectSession()}
            disabled={!textInput.trim() && isConnected}
            className="p-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white transition shadow flex items-center justify-center"
            title="Send Text Message to Live Session"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
