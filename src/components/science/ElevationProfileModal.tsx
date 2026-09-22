import { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Mountain,
  TrendingUp,
  Activity,
  ArrowRightLeft,
  Volume2,
  VolumeX,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Download,
  Info,
  ChevronDown,
  Navigation,
  Footprints,
  Gauge,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  ElevationTransectProfile,
  ElevationSamplePoint,
  PRESET_MARS_TRANSECTS,
  PresetTransect,
} from '../../engine/marsMolaElevation';
import { marsSonification } from '../../engine/marsSonification';

interface ElevationProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ElevationTransectProfile | null;
  onReversePoints: () => void;
  onSelectPreset: (preset: PresetTransect) => void;
  onHoverSamplePoint?: (sample: ElevationSamplePoint | null) => void;
  onFlyToCoord?: (lat: number, lng: number, name?: string) => void;
  onStartDrawing?: () => void;
  isDrawingActive?: boolean;
}

export function ElevationProfileModal({
  isOpen,
  onClose,
  profile,
  onReversePoints,
  onSelectPreset,
  onHoverSamplePoint,
  onFlyToCoord,
  onStartDrawing,
  isDrawingActive = false,
}: ElevationProfileModalProps) {
  const [hoveredSample, setHoveredSample] = useState<ElevationSamplePoint | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const chartSvgRef = useRef<SVGSVGElement | null>(null);
  const audioIntervalRef = useRef<any>(null);

  // Notify parent on hover change for map beacon synchronization
  useEffect(() => {
    if (onHoverSamplePoint) {
      onHoverSamplePoint(hoveredSample);
    }
  }, [hoveredSample, onHoverSamplePoint]);

  // Clean up audio on unmount or close
  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      marsSonification.stop();
    };
  }, []);

  if (!isOpen) return null;

  // Chart Dimensions & Scales
  const chartWidth = 760;
  const chartHeight = 220;
  const padding = { top: 24, right: 30, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const { samples, minElevationM, maxElevationM, totalDistanceKm } = profile || {
    samples: [],
    minElevationM: -3000,
    maxElevationM: 3000,
    totalDistanceKm: 100,
  };

  // Y-axis bounds with padding
  const yPadding = Math.max(500, (maxElevationM - minElevationM) * 0.1);
  const yMin = Math.floor((minElevationM - yPadding) / 500) * 500;
  const yMax = Math.ceil((maxElevationM + yPadding) / 500) * 500;
  const ySpan = Math.max(1, yMax - yMin);

  // Coordinates mapping
  const getX = (distKm: number) => {
    if (totalDistanceKm <= 0) return padding.left;
    return padding.left + (distKm / totalDistanceKm) * innerWidth;
  };

  const getY = (elevM: number) => {
    return padding.top + innerHeight - ((elevM - yMin) / ySpan) * innerHeight;
  };

  // Generate SVG path for elevation line
  const elevationPath = useMemo(() => {
    if (!samples || samples.length === 0) return '';
    return samples
      .map((s, idx) => {
        const x = getX(s.distanceKm);
        const y = getY(s.elevationM);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [samples, yMin, ySpan, totalDistanceKm]);

  // Generate SVG path for shaded area under curve
  const areaPath = useMemo(() => {
    if (!samples || samples.length === 0) return '';
    const firstX = getX(samples[0].distanceKm);
    const lastX = getX(samples[samples.length - 1].distanceKm);
    const bottomY = padding.top + innerHeight;
    return `${elevationPath} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`;
  }, [elevationPath, samples]);

  // Y-Axis zero datum line (0m MOLA areoid)
  const zeroDatumY = getY(0);
  const isZeroDatumVisible = zeroDatumY >= padding.top && zeroDatumY <= padding.top + innerHeight;

  // Y-Axis Tick marks (every 1000m or 2000m)
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = ySpan > 12000 ? 4000 : ySpan > 6000 ? 2000 : 1000;
    const startTick = Math.ceil(yMin / step) * step;
    for (let t = startTick; t <= yMax; t += step) {
      ticks.push(t);
    }
    return ticks;
  }, [yMin, yMax, ySpan]);

  // Handle Chart Mouse Move / Touch
  const handleChartPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!chartSvgRef.current || !samples || samples.length === 0) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const normalizedX = (clientX / rect.width) * chartWidth;

    if (normalizedX < padding.left || normalizedX > padding.left + innerWidth) {
      setHoveredSample(null);
      return;
    }

    const distAtX = ((normalizedX - padding.left) / innerWidth) * totalDistanceKm;

    // Find closest sample point
    let closest = samples[0];
    let minDiff = Math.abs(samples[0].distanceKm - distAtX);
    for (let i = 1; i < samples.length; i++) {
      const diff = Math.abs(samples[i].distanceKm - distAtX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = samples[i];
      }
    }
    setHoveredSample(closest);
  };

  const handleChartPointerLeave = () => {
    setHoveredSample(null);
  };

  // Sonify the Elevation Profile
  const handleToggleSonification = () => {
    if (isPlayingAudio) {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      marsSonification.stop();
      setIsPlayingAudio(false);
      setHoveredSample(null);
      return;
    }

    if (!samples || samples.length === 0) return;

    marsSonification.setEnabled(true);
    setIsPlayingAudio(true);
    let sampleIdx = 0;

    audioIntervalRef.current = setInterval(() => {
      if (sampleIdx >= samples.length) {
        clearInterval(audioIntervalRef.current);
        marsSonification.stop();
        setIsPlayingAudio(false);
        setHoveredSample(null);
        return;
      }

      const cur = samples[sampleIdx];
      setHoveredSample(cur);
      marsSonification.sonifyLocation(cur.elevationM, cur.slopeDeg);
      sampleIdx++;
    }, 60);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!profile) return;
    let csv = 'Index,Distance_km,Latitude,Longitude,Elevation_m,Slope_deg,Difficulty,Pressure_mbar,WalkingSpeed_kmh\n';
    profile.samples.forEach((s) => {
      csv += `${s.index},${s.distanceKm},${s.lat},${s.lng},${s.elevationM},${s.slopeDeg},"${s.difficultyLabel}",${s.atmosphericPressureMbar},${s.astronautSpeedKmH}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mars_mola_transect_${profile.startPoint.lat}_${profile.startPoint.lng}_to_${profile.endPoint.lat}_${profile.endPoint.lng}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Find Peak and Lowest Points for Quick Flight
  const peakSample = useMemo(() => {
    if (!samples || samples.length === 0) return null;
    return samples.reduce((max, s) => (s.elevationM > max.elevationM ? s : max), samples[0]);
  }, [samples]);

  const lowestSample = useMemo(() => {
    if (!samples || samples.length === 0) return null;
    return samples.reduce((min, s) => (s.elevationM < min.elevationM ? s : min), samples[0]);
  }, [samples]);

  return (
    <div
      className={`fixed z-[9980] transition-all duration-300 font-sans ${
        isMinimized
          ? 'bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96'
          : 'bottom-0 left-0 right-0 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[94vw] sm:max-w-4xl'
      }`}
    >
      <div className="bg-[#0b0f17]/95 backdrop-blur-xl border border-neutral-700/80 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/80 overflow-hidden text-neutral-200">
        {/* HEADER BAR */}
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-neutral-800/80 bg-neutral-900/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/40">
              <Mountain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs sm:text-sm tracking-wide">
                  MGS MOLA Elevation Profile & Terrain Slope
                </span>
                <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-orange-300 border border-orange-600/30 font-mono">
                  IAU 0m Areoid Datum
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono">
                {profile
                  ? `${profile.startPoint.name || `${profile.startPoint.lat}°N, ${profile.startPoint.lng}°E`} → ${
                      profile.endPoint.name || `${profile.endPoint.lat}°N, ${profile.endPoint.lng}°E`
                    } (${profile.totalDistanceKm} km)`
                  : 'Click two points on the Mars map to draw an elevation transect'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Presets Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPresetsOpen(!isPresetsOpen)}
                className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-mono flex items-center gap-1 transition"
                title="Select famous Martian geological transects"
              >
                <span>Iconic Transects</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {isPresetsOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-2 z-50 text-xs font-sans animate-in fade-in zoom-in-95">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1 border-b border-neutral-800 mb-1">
                    Preset MOLA Topographic Transects
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {PRESET_MARS_TRANSECTS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          onSelectPreset(preset);
                          setIsPresetsOpen(false);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-neutral-800 border border-transparent hover:border-neutral-700 transition group"
                      >
                        <div className="font-semibold text-white text-[11px] group-hover:text-orange-400">
                          {preset.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 line-clamp-1">{preset.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Draw New Line Button */}
            {onStartDrawing && (
              <button
                type="button"
                onClick={onStartDrawing}
                className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition ${
                  isDrawingActive
                    ? 'bg-orange-600 text-white font-bold animate-pulse'
                    : 'bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white'
                }`}
                title="Click two points on the map to draw a new transect line"
              >
                <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden sm:inline">Draw Line</span>
              </button>
            )}

            {/* Invert Direction */}
            {profile && (
              <button
                type="button"
                onClick={onReversePoints}
                className="p-1 sm:p-1.5 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition"
                title="Reverse transect direction (Point B ⇄ Point A)"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Audio Sonification */}
            {profile && (
              <button
                type="button"
                onClick={handleToggleSonification}
                className={`p-1 sm:p-1.5 rounded-lg border transition ${
                  isPlayingAudio
                    ? 'bg-purple-900/80 border-purple-500 text-purple-300 animate-pulse'
                    : 'bg-neutral-800/90 hover:bg-neutral-700 border-neutral-700 text-neutral-300 hover:text-white'
                }`}
                title={isPlayingAudio ? 'Stop sonification sweep' : 'Listen to elevation pitch sweep along transect'}
              >
                {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Minimize / Maximize */}
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
              title={isMinimized ? 'Expand chart' : 'Minimize chart'}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
              title="Close elevation tool"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MINIMIZED SUMMARY VIEW */}
        {isMinimized && profile && (
          <div className="p-3 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-neutral-400 text-[10px] block">Elevation Span</span>
              <span className="font-bold text-orange-400">
                {profile.minElevationM}m to {profile.maxElevationM}m (Δ {profile.elevationSpanM}m)
              </span>
            </div>
            <div className="text-right">
              <span className="text-neutral-400 text-[10px] block">Max Slope</span>
              <span className="font-bold text-red-400">{profile.maxSlopeDeg}°</span>
            </div>
          </div>
        )}

        {/* FULL CONTENT BODY */}
        {!isMinimized && (
          <div className="p-3 sm:p-4 space-y-3 max-h-[75vh] overflow-y-auto">
            {/* If no profile or waiting for points */}
            {!profile ? (
              <div className="p-8 text-center space-y-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
                <div className="w-12 h-12 mx-auto rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center border border-orange-500/40">
                  <TrendingUp className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">Draw Elevation Transect on Mars</h4>
                  <p className="text-neutral-400 text-xs mt-1 max-w-md mx-auto">
                    Click anywhere on the Mars surface to drop <strong>Point A (Start)</strong>, then click a second
                    location to drop <strong>Point B (End)</strong> to measure the elevation profile, slope gradients,
                    and terrain traversability.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {PRESET_MARS_TRANSECTS.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelectPreset(p)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs text-orange-300 font-mono transition"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* INTERACTIVE ELEVATION PROFILE CHART (SVG) */}
                <div className="relative bg-neutral-950/90 rounded-xl border border-neutral-800 p-2 sm:p-3 select-none">
                  {/* Legend / Status Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 text-[10px] font-mono border-b border-neutral-800/60">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-cyan-400 rounded-full" />
                        <span className="text-neutral-300">Elevation Curve</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-neutral-500 border-b border-dashed border-neutral-400" />
                        <span className="text-neutral-400">0m MOLA Datum</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">Slope Difficulty:</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                        &lt;5° Flat
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-yellow-950 text-yellow-300 border border-yellow-700/50">
                        5°-15° Mod
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-orange-950 text-orange-300 border border-orange-700/50">
                        15°-25° Steep
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-700/50">
                        &gt;25° Cliff
                      </span>
                    </div>
                  </div>

                  {/* SVG Chart Container */}
                  <div className="relative w-full overflow-hidden">
                    <svg
                      ref={chartSvgRef}
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      className="w-full h-auto cursor-crosshair"
                      onPointerMove={handleChartPointerMove}
                      onPointerLeave={handleChartPointerLeave}
                    >
                      <defs>
                        {/* Shaded Area Gradient */}
                        <linearGradient id="molaElevationGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
                          <stop offset="40%" stopColor="#06b6d4" stopOpacity="0.3" />
                          <stop offset="80%" stopColor="#3b82f6" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.0" />
                        </linearGradient>

                        {/* Slope Color Stops Along Transect */}
                        <linearGradient id="slopeRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          {samples.map((s, idx) => (
                            <stop
                              key={idx}
                              offset={`${((s.distanceKm / totalDistanceKm) * 100).toFixed(1)}%`}
                              stopColor={s.difficultyColor}
                            />
                          ))}
                        </linearGradient>
                      </defs>

                      {/* Y-Axis Grid Lines */}
                      {yTicks.map((tick) => {
                        const y = getY(tick);
                        return (
                          <g key={tick}>
                            <line
                              x1={padding.left}
                              y1={y}
                              x2={padding.left + innerWidth}
                              y2={y}
                              stroke="#262626"
                              strokeWidth="1"
                              strokeDasharray="2,2"
                            />
                            <text
                              x={padding.left - 8}
                              y={y + 3}
                              fill="#737373"
                              fontSize="9"
                              fontFamily="monospace"
                              textAnchor="end"
                            >
                              {tick >= 0 ? `+${(tick / 1000).toFixed(1)}k` : `${(tick / 1000).toFixed(1)}k`}
                            </text>
                          </g>
                        );
                      })}

                      {/* 0m MOLA Areoid Datum Line */}
                      {isZeroDatumVisible && (
                        <g>
                          <line
                            x1={padding.left}
                            y1={zeroDatumY}
                            x2={padding.left + innerWidth}
                            y2={zeroDatumY}
                            stroke="#06b6d4"
                            strokeWidth="1.2"
                            strokeDasharray="4,4"
                            opacity="0.8"
                          />
                          <text
                            x={padding.left + innerWidth - 6}
                            y={zeroDatumY - 4}
                            fill="#06b6d4"
                            fontSize="8"
                            fontFamily="monospace"
                            textAnchor="end"
                          >
                            0m MOLA Datum
                          </text>
                        </g>
                      )}

                      {/* Shaded Area Under Curve */}
                      <path d={areaPath} fill="url(#molaElevationGrad)" />

                      {/* Primary Elevation Curve Line */}
                      <path
                        d={elevationPath}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Terrain Steepness / Difficulty Ribbon at bottom of graph */}
                      <rect
                        x={padding.left}
                        y={padding.top + innerHeight - 4}
                        width={innerWidth}
                        height={4}
                        fill="url(#slopeRibbonGrad)"
                        rx="2"
                      />

                      {/* X-Axis Distance Labels */}
                      <text
                        x={padding.left}
                        y={padding.top + innerHeight + 18}
                        fill="#737373"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="start"
                      >
                        0 km (Point A)
                      </text>
                      <text
                        x={padding.left + innerWidth / 2}
                        y={padding.top + innerHeight + 18}
                        fill="#737373"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {(totalDistanceKm / 2).toFixed(0)} km
                      </text>
                      <text
                        x={padding.left + innerWidth}
                        y={padding.top + innerHeight + 18}
                        fill="#737373"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {totalDistanceKm} km (Point B)
                      </text>

                      {/* Interactive Hover Crosshair Scrubber */}
                      {hoveredSample && (
                        <g>
                          {/* Vertical guide line */}
                          <line
                            x1={getX(hoveredSample.distanceKm)}
                            y1={padding.top}
                            x2={getX(hoveredSample.distanceKm)}
                            y2={padding.top + innerHeight}
                            stroke="#f97316"
                            strokeWidth="1.5"
                            strokeDasharray="3,3"
                          />

                          {/* Hover target circle on curve */}
                          <circle
                            cx={getX(hoveredSample.distanceKm)}
                            cy={getY(hoveredSample.elevationM)}
                            r="5"
                            fill={hoveredSample.difficultyColor}
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                        </g>
                      )}
                    </svg>

                    {/* FLOATING HOVER TOOLTIP HUD */}
                    {hoveredSample && (
                      <div
                        className="pointer-events-none absolute z-30 bg-[#0c121d]/95 backdrop-blur-md border border-neutral-700 rounded-lg p-2.5 shadow-xl text-neutral-200 text-[11px] font-mono space-y-1 min-w-[200px]"
                        style={{
                          left: `${Math.min(
                            82,
                            Math.max(18, (getX(hoveredSample.distanceKm) / chartWidth) * 100)
                          )}%`,
                          top: '12px',
                          transform: 'translateX(-50%)',
                        }}
                      >
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
                          <span className="font-bold text-white">
                            Distance: {hoveredSample.distanceKm} km
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {((hoveredSample.distanceKm / totalDistanceKm) * 100).toFixed(0)}%
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                          <div>
                            <span className="text-neutral-500">MOLA Elev:</span>
                            <span className="font-bold text-orange-400 ml-1">
                              {hoveredSample.elevationM > 0
                                ? `+${hoveredSample.elevationM}`
                                : hoveredSample.elevationM}
                              m
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Slope:</span>
                            <span
                              className="font-bold ml-1"
                              style={{ color: hoveredSample.difficultyColor }}
                            >
                              {hoveredSample.slopeDeg}°
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Pressure:</span>
                            <span className="text-cyan-300 ml-1">
                              {hoveredSample.atmosphericPressureMbar} mbar
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Walk Speed:</span>
                            <span className="text-neutral-300 ml-1">
                              {hoveredSample.astronautSpeedKmH} km/h
                            </span>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-neutral-800/80 flex items-center justify-between text-[9px]">
                          <span className="text-neutral-400">
                            {hoveredSample.lat}°N, {hoveredSample.lng}°E
                          </span>
                          <span
                            className="px-1.5 py-0.2 rounded font-semibold"
                            style={{
                              backgroundColor: `${hoveredSample.difficultyColor}20`,
                              color: hoveredSample.difficultyColor,
                            }}
                          >
                            {hoveredSample.difficultyLabel}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* TELEMETRY & TERRAIN DIFFICULTY METRICS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  {/* Total Distance & Elevation Relief */}
                  <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
                    <span className="text-[10px] text-neutral-400 block uppercase">Vertical Relief Span</span>
                    <div className="text-base sm:text-lg font-bold text-white flex items-baseline gap-1">
                      <span>Δ {profile.elevationSpanM.toLocaleString()}</span>
                      <span className="text-xs text-neutral-400 font-normal">m</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Lowest: <strong className="text-blue-300">{profile.minElevationM}m</strong> | Peak:{' '}
                      <strong className="text-orange-300">+{profile.maxElevationM}m</strong>
                    </div>
                  </div>

                  {/* Ascent / Descent */}
                  <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
                    <span className="text-[10px] text-neutral-400 block uppercase">Ascent & Descent</span>
                    <div className="text-base sm:text-lg font-bold text-cyan-400 flex items-baseline gap-1">
                      <span>↑ {profile.totalAscentM.toLocaleString()}m</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Total Descent: <strong className="text-purple-300">↓ {profile.totalDescentM.toLocaleString()}m</strong>
                    </div>
                  </div>

                  {/* Maximum Slope & Mean Slope */}
                  <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
                    <span className="text-[10px] text-neutral-400 block uppercase">Maximum Slope</span>
                    <div className="text-base sm:text-lg font-bold text-red-400 flex items-baseline gap-1">
                      <span>{profile.maxSlopeDeg}°</span>
                      <span className="text-[11px] text-neutral-400 font-normal">
                        (at km {profile.maxSlopeLocationKm})
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Average Slope: <strong className="text-yellow-300">{profile.meanSlopeDeg}°</strong>
                    </div>
                  </div>

                  {/* Estimated EVA Walking Time */}
                  <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
                    <span className="text-[10px] text-neutral-400 block uppercase">Suited EVA Traversal</span>
                    <div className="text-base sm:text-lg font-bold text-emerald-400 flex items-baseline gap-1">
                      <span>~{profile.astronautTravelTimeHours}</span>
                      <span className="text-xs text-neutral-400 font-normal">hours</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Total Distance: <strong className="text-white">{profile.totalDistanceKm} km</strong>
                    </div>
                  </div>
                </div>

                {/* ROVER TRAVERSE FEASIBILITY & TERRAIN DIFFICULTY DISTRIBUTION */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Rover Feasibility Card */}
                  <div className={`p-3 rounded-xl border ${profile.roverFeasibility.color} space-y-1`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      {profile.roverFeasibility.status === 'Nominal' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                      )}
                      <span>NASA Rover Traverse Feasibility: {profile.roverFeasibility.status}</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      {profile.roverFeasibility.description}
                    </p>
                  </div>

                  {/* Difficulty Distribution Breakdown */}
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2 font-mono">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white">Terrain Difficulty Composition</span>
                      <span className="text-orange-400 font-bold">{profile.overallDifficulty}</span>
                    </div>

                    {/* Progress Bar Stack */}
                    <div className="w-full h-3 rounded-full bg-neutral-950 overflow-hidden flex">
                      <div
                        style={{ width: `${profile.difficultyStats.gentlePct}%` }}
                        className="bg-emerald-500 h-full"
                        title={`Gentle / Flat: ${profile.difficultyStats.gentlePct}%`}
                      />
                      <div
                        style={{ width: `${profile.difficultyStats.moderatePct}%` }}
                        className="bg-yellow-500 h-full"
                        title={`Moderate Slope: ${profile.difficultyStats.moderatePct}%`}
                      />
                      <div
                        style={{ width: `${profile.difficultyStats.steepPct}%` }}
                        className="bg-orange-500 h-full"
                        title={`Steep Escarpment: ${profile.difficultyStats.steepPct}%`}
                      />
                      <div
                        style={{ width: `${profile.difficultyStats.extremePct}%` }}
                        className="bg-red-500 h-full"
                        title={`Extreme Cliff: ${profile.difficultyStats.extremePct}%`}
                      />
                    </div>

                    {/* Percentage Breakdown */}
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        Flat {profile.difficultyStats.gentlePct}%
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                        Mod {profile.difficultyStats.moderatePct}%
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                        Steep {profile.difficultyStats.steepPct}%
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                        Cliff {profile.difficultyStats.extremePct}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOTTOM ACTION BUTTONS */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    {onFlyToCoord && peakSample && (
                      <button
                        type="button"
                        onClick={() => onFlyToCoord(peakSample.lat, peakSample.lng, 'Transect Summit Peak')}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white flex items-center gap-1.5 transition font-mono text-[11px]"
                      >
                        <Navigation className="w-3.5 h-3.5 text-orange-400" />
                        <span>Fly to Summit (+{peakSample.elevationM}m)</span>
                      </button>
                    )}

                    {onFlyToCoord && lowestSample && (
                      <button
                        type="button"
                        onClick={() => onFlyToCoord(lowestSample.lat, lowestSample.lng, 'Transect Depression Floor')}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white flex items-center gap-1.5 transition font-mono text-[11px]"
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-400" />
                        <span>Fly to Base ({lowestSample.elevationM}m)</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white flex items-center gap-1.5 transition font-mono text-[11px]"
                      title="Download MGS MOLA elevation transect CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
