import React, { useRef, useState, useMemo } from 'react';
import {
  TrendingUp,
  Mountain,
  Gauge,
  Compass,
  Footprints,
  Maximize2,
  Minimize2,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ElevationTransectProfile,
  ElevationSamplePoint,
} from '../../engine/marsMolaElevation';
import { marsSonification } from '../../engine/marsSonification';
import { MeasurementPoint } from './MarsMeasurementTool';

export interface MarsPathElevationGraphProps {
  profile: ElevationTransectProfile | null;
  points: MeasurementPoint[];
  hoveredSample?: ElevationSamplePoint | null;
  onHoverSample?: (sample: ElevationSamplePoint | null) => void;
  onFlyToCoord?: (lat: number, lng: number, name?: string) => void;
  onOpenFullAnalysis?: () => void;
  variant?: 'compact' | 'docked';
  onCloseDocked?: () => void;
}

export const MarsPathElevationGraph: React.FC<MarsPathElevationGraphProps> = ({
  profile,
  points,
  hoveredSample,
  onHoverSample,
  onFlyToCoord,
  onOpenFullAnalysis,
  variant = 'compact',
  onCloseDocked,
}) => {
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [showSlopeColoring, setShowSlopeColoring] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const isDocked = variant === 'docked';
  const chartWidth = isDocked ? 900 : 340;
  const chartHeight = isDocked ? 170 : 120;
  const padding = isDocked
    ? { top: 20, right: 30, bottom: 32, left: 56 }
    : { top: 14, right: 14, bottom: 24, left: 42 };

  const innerWidth = Math.max(10, chartWidth - padding.left - padding.right);
  const innerHeight = Math.max(10, chartHeight - padding.top - padding.bottom);

  const {
    samples = [],
    minElevationM = -3000,
    maxElevationM = 3000,
    totalDistanceKm = 100,
    totalAscentM = 0,
    totalDescentM = 0,
    maxSlopeDeg = 0,
    meanSlopeDeg = 0,
    overallDifficulty = 'Level 1: Traversable Plains',
    astronautTravelTimeHours = 0,
    roverFeasibility,
  } = profile || {};

  // Elevation vertical scale with 10% breathing room
  const elevSpan = Math.max(400, maxElevationM - minElevationM);
  const yPad = Math.max(100, elevSpan * 0.12);
  const yMin = Math.floor((minElevationM - yPad) / 100) * 100;
  const yMax = Math.ceil((maxElevationM + yPad) / 100) * 100;
  const yRange = Math.max(1, yMax - yMin);

  // Coordinate transforms
  const getX = (distKm: number) => {
    if (totalDistanceKm <= 0) return padding.left;
    return padding.left + (Math.min(totalDistanceKm, Math.max(0, distKm)) / totalDistanceKm) * innerWidth;
  };

  const getY = (elevM: number) => {
    return padding.top + innerHeight - ((elevM - yMin) / yRange) * innerHeight;
  };

  // Convert MOLA elevation to display unit
  const formatElev = (meters: number) => {
    if (unitSystem === 'imperial') {
      const feet = Math.round(meters * 3.28084);
      return `${feet > 0 ? `+${feet}` : feet} ft`;
    }
    return `${meters > 0 ? `+${Math.round(meters)}` : Math.round(meters)}m`;
  };

  const formatDist = (km: number) => {
    if (unitSystem === 'imperial') {
      return `${(km * 0.621371).toFixed(1)} mi`;
    }
    return `${km < 10 ? km.toFixed(2) : km.toFixed(1)} km`;
  };

  // SVG Line path
  const elevationPath = useMemo(() => {
    if (!samples || samples.length === 0) return '';
    return samples
      .map((s, idx) => {
        const x = getX(s.distanceKm);
        const y = getY(s.elevationM);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [samples, yMin, yRange, totalDistanceKm, innerWidth, innerHeight]);

  // SVG Area Fill path
  const areaPath = useMemo(() => {
    if (!samples || samples.length === 0) return '';
    const firstX = getX(samples[0].distanceKm);
    const lastX = getX(samples[samples.length - 1].distanceKm);
    const bottomY = padding.top + innerHeight;
    return `${elevationPath} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`;
  }, [elevationPath, samples, innerHeight]);

  // Zero datum line (0m MOLA Areoid)
  const zeroDatumY = getY(0);
  const isZeroDatumVisible = zeroDatumY >= padding.top && zeroDatumY <= padding.top + innerHeight;

  // Y-axis grid ticks
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = yRange > 12000 ? 4000 : yRange > 6000 ? 2000 : yRange > 2500 ? 1000 : 500;
    const start = Math.ceil(yMin / step) * step;
    for (let t = start; t <= yMax; t += step) {
      ticks.push(t);
    }
    return ticks;
  }, [yMin, yMax, yRange]);

  // X-axis distance marks
  const xTicks = useMemo(() => {
    if (totalDistanceKm <= 0) return [];
    const count = isDocked ? 6 : 4;
    const step = totalDistanceKm / count;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(Math.round(i * step * 10) / 10);
    }
    return ticks;
  }, [totalDistanceKm, isDocked]);

  // Vertex Waypoint markers along the distance axis
  const vertexMilestones = useMemo(() => {
    if (!points || points.length < 2 || !samples || samples.length === 0) return [];
    let cumDist = 0;
    const milestones: { index: number; distKm: number; x: number; y: number; lat: number; lng: number; name?: string }[] = [];

    milestones.push({
      index: 1,
      distKm: 0,
      x: getX(0),
      y: getY(samples[0].elevationM),
      lat: points[0].lat,
      lng: points[0].lng,
      name: points[0].name || 'Start',
    });

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      // Find sample closest to p2
      let closestDist = Infinity;
      let matchedDistKm = 0;
      let matchedElev = 0;

      for (const s of samples) {
        const d = Math.hypot(s.lat - p2.lat, s.lng - p2.lng);
        if (d < closestDist) {
          closestDist = d;
          matchedDistKm = s.distanceKm;
          matchedElev = s.elevationM;
        }
      }

      milestones.push({
        index: i + 2,
        distKm: matchedDistKm,
        x: getX(matchedDistKm),
        y: getY(matchedElev),
        lat: p2.lat,
        lng: p2.lng,
        name: p2.name || `Pt ${i + 2}`,
      });
    }

    return milestones;
  }, [points, samples, innerWidth, totalDistanceKm]);

  // Handle Scrubbing Pointer Events
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || !samples || samples.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const normalizedX = (clientX / rect.width) * chartWidth;

    if (normalizedX < padding.left || normalizedX > padding.left + innerWidth) {
      if (onHoverSample) onHoverSample(null);
      return;
    }

    const ratio = (normalizedX - padding.left) / innerWidth;
    const targetDist = ratio * totalDistanceKm;

    // Find closest sample point
    let closest = samples[0];
    let minDelta = Math.abs(samples[0].distanceKm - targetDist);
    for (let i = 1; i < samples.length; i++) {
      const delta = Math.abs(samples[i].distanceKm - targetDist);
      if (delta < minDelta) {
        minDelta = delta;
        closest = samples[i];
      }
    }

    if (onHoverSample) onHoverSample(closest);

    if (isAudioEnabled) {
      marsSonification.sonifyLocation(closest.elevationM, closest.slopeDeg);
    }
  };

  const handlePointerLeave = () => {
    if (onHoverSample) onHoverSample(null);
  };

  const handleClickPoint = (sample: ElevationSamplePoint) => {
    if (onFlyToCoord) {
      onFlyToCoord(sample.lat, sample.lng, `Path Km ${sample.distanceKm}`);
    }
  };

  if (!profile || samples.length < 2) {
    return (
      <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-center text-neutral-400 text-xs">
        <Mountain className="w-5 h-5 mx-auto mb-1 text-cyan-400 opacity-60" />
        <div>Measuring path... Add 2 or more vertices on the map</div>
      </div>
    );
  }

  return (
    <div
      className={`relative select-none font-sans ${
        isDocked
          ? 'w-full bg-[#080d18]/96 backdrop-blur-2xl border-t border-cyan-500/40 shadow-2xl p-3 z-30 animate-in slide-in-from-bottom-4 duration-200'
          : 'w-full bg-neutral-950/90 rounded-2xl border border-cyan-500/30 p-2.5 space-y-2'
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-start gap-2 pb-1.5 border-b border-white/10 text-xs">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <div className="mt-0.5 shrink-0 p-1 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-cyan-400">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-white text-xs tracking-wide leading-snug whitespace-normal">
                MOLA Cross-Sectional Elevation Profile
              </span>
              <span className="shrink-0 text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                NASA MGS MOLA DTM
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono leading-snug">
              IAU 0m Areoid Datum • {samples.length} continuous topographic samples
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1 text-[11px]">
          {/* Unit Toggle */}
          <button
            type="button"
            onClick={() => setUnitSystem(unitSystem === 'metric' ? 'imperial' : 'metric')}
            className="shrink-0 whitespace-nowrap px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-cyan-300 font-mono text-[10px] border border-cyan-500/30 transition cursor-pointer"
            title="Toggle Metric (m/km) and Imperial (ft/mi)"
          >
            {unitSystem === 'metric' ? 'Meters / Km' : 'Feet / Miles'}
          </button>

          {/* Slope Color Toggle */}
          <button
            type="button"
            onClick={() => setShowSlopeColoring(!showSlopeColoring)}
            className={`shrink-0 whitespace-nowrap px-2 py-0.5 rounded-lg text-[10px] font-mono border transition cursor-pointer ${
              showSlopeColoring
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800'
            }`}
            title="Color-code terrain slope hazard gradient"
          >
            Slope Heatmap
          </button>

          {/* Sonification Sound */}
          <button
            type="button"
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`p-1 rounded-lg transition cursor-pointer ${
              isAudioEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
            title={isAudioEnabled ? 'Mute terrain audio sonification' : 'Enable Mars terrain sonification while scrubbing'}
          >
            {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Full Analysis Modal Button */}
          {onOpenFullAnalysis && (
            <button
              type="button"
              onClick={onOpenFullAnalysis}
              className="shrink-0 whitespace-nowrap px-2 py-0.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-[10.5px] hover:brightness-110 shadow-sm transition flex items-center gap-1 cursor-pointer"
              title="Open full scientific terrain analysis modal"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Full Analysis</span>
            </button>
          )}

          {/* Close Docked Bar */}
          {isDocked && onCloseDocked && (
            <button
              type="button"
              onClick={onCloseDocked}
              className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer ml-1"
              title="Close docked elevation bar"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Callouts Ribbon */}
      <div
        className={`grid gap-1.5 text-[10px] font-mono ${
          isDocked ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6' : 'grid-cols-2'
        }`}
      >
        <div className="p-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
          <div className="text-neutral-400 text-[9px]">TOTAL DISTANCE</div>
          <div className="text-white font-bold text-xs">{formatDist(totalDistanceKm)}</div>
        </div>

        <div className="p-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
          <div className="text-neutral-400 text-[9px]">ELEVATION SPAN</div>
          <div className="text-cyan-300 font-bold text-xs">
            {formatElev(minElevationM)} → {formatElev(maxElevationM)}
          </div>
        </div>

        <div className="p-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
          <div className="text-neutral-400 text-[9px]">ASCENT / DESCENT</div>
          <div className="font-bold text-xs">
            <span className="text-emerald-400">+{formatElev(totalAscentM)}</span>
            {' / '}
            <span className="text-red-400">-{formatElev(totalDescentM)}</span>
          </div>
        </div>

        <div className="p-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
          <div className="text-neutral-400 text-[9px]">MAX / MEAN SLOPE</div>
          <div className="font-bold text-xs">
            <span className={maxSlopeDeg > 20 ? 'text-red-400' : maxSlopeDeg > 10 ? 'text-amber-400' : 'text-emerald-400'}>
              {maxSlopeDeg}°
            </span>
            <span className="text-neutral-400"> / {meanSlopeDeg}°</span>
          </div>
        </div>

        <div className="p-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
          <div className="text-neutral-400 text-[9px]">ASTRONAUT EVA ETA</div>
          <div className="text-amber-300 font-bold text-xs flex items-center gap-1">
            <Footprints className="w-3 h-3 text-amber-400 shrink-0" />
            <span>~{astronautTravelTimeHours} hrs</span>
          </div>
        </div>

        <div className="p-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
          <div className="text-neutral-400 text-[9px]">ROVER FEASIBILITY</div>
          <div className="font-bold text-xs flex items-center gap-1">
            {roverFeasibility?.status === 'Nominal' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            {roverFeasibility?.status === 'Cautious' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
            {(roverFeasibility?.status === 'Hazardous' || roverFeasibility?.status === 'Impassable') && (
              <AlertTriangle className="w-3 h-3 text-red-400" />
            )}
            <span className={roverFeasibility?.color ? roverFeasibility.color.split(' ')[0] : 'text-white'}>
              {roverFeasibility?.status || 'Nominal'}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Elevation Cross-Section Canvas */}
      <div className="relative w-full rounded-xl overflow-hidden bg-[#060a12] border border-neutral-800/90 shadow-inner">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto cursor-crosshair touch-none select-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            {/* Shaded Area Terrain Gradient */}
            <linearGradient id="molaTerrainGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#0891b2" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.02" />
            </linearGradient>

            {/* Glowing Stroke Filter */}
            <filter id="molaGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal Grid lines & Elevation Labels */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#737373"
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  {formatElev(tick)}
                </text>
              </g>
            );
          })}

          {/* 0m MOLA Datum Reference Line */}
          {isZeroDatumVisible && (
            <g>
              <line
                x1={padding.left}
                y1={zeroDatumY}
                x2={padding.left + innerWidth}
                y2={zeroDatumY}
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                opacity="0.8"
              />
              <text
                x={padding.left + innerWidth - 4}
                y={zeroDatumY - 3}
                textAnchor="end"
                fill="#38bdf8"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
                opacity="0.9"
              >
                0m MOLA AREOID DATUM
              </text>
            </g>
          )}

          {/* X-axis Distance Grid Lines & Labels */}
          {xTicks.map((d) => {
            const x = getX(d);
            return (
              <g key={d}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + innerHeight}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + innerHeight + 14}
                  textAnchor="middle"
                  fill="#737373"
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  {formatDist(d)}
                </text>
              </g>
            );
          })}

          {/* Area under curve fill */}
          {areaPath && <path d={areaPath} fill="url(#molaTerrainGradient)" />}

          {/* Elevation Profile Main Continuous Stroke */}
          {elevationPath && (
            <path
              d={elevationPath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#molaGlow)"
            />
          )}

          {/* Slope-colored segments overlay */}
          {showSlopeColoring &&
            samples.slice(0, -1).map((s, idx) => {
              const next = samples[idx + 1];
              const x1 = getX(s.distanceKm);
              const y1 = getY(s.elevationM);
              const x2 = getX(next.distanceKm);
              const y2 = getY(next.elevationM);
              return (
                <line
                  key={idx}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={s.difficultyColor}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  opacity="0.9"
                />
              );
            })}

          {/* Waypoint Vertex Markers (Point 1, Point 2, Point 3...) */}
          {vertexMilestones.map((vm) => (
            <g key={vm.index}>
              {/* Vertical dotted beacon line */}
              <line
                x1={vm.x}
                y1={padding.top}
                x2={vm.x}
                y2={padding.top + innerHeight}
                stroke="#f59e0b"
                strokeWidth="1"
                strokeDasharray="2 3"
                opacity="0.6"
              />
              {/* Point Node Circle */}
              <circle
                cx={vm.x}
                cy={vm.y}
                r="4.5"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="1.5"
                className="cursor-pointer hover:scale-125 transition-transform"
                onClick={() => onFlyToCoord && onFlyToCoord(vm.lat, vm.lng, vm.name)}
              />
              <text
                x={vm.x}
                y={padding.top + 10}
                textAnchor="middle"
                fill="#fbbf24"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="900"
              >
                P{vm.index}
              </text>
            </g>
          ))}

          {/* Interactive Scrubbing Crosshair & Reticle */}
          {hoveredSample && (
            <g>
              {/* Vertical Tracking Line */}
              <line
                x1={getX(hoveredSample.distanceKm)}
                y1={padding.top}
                x2={getX(hoveredSample.distanceKm)}
                y2={padding.top + innerHeight}
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeDasharray="3 2"
              />
              {/* Outer Pulsing Ping */}
              <circle
                cx={getX(hoveredSample.distanceKm)}
                cy={getY(hoveredSample.elevationM)}
                r="7"
                fill="none"
                stroke={hoveredSample.difficultyColor}
                strokeWidth="1.5"
                opacity="0.75"
              />
              {/* Center Target Dot */}
              <circle
                cx={getX(hoveredSample.distanceKm)}
                cy={getY(hoveredSample.elevationM)}
                r="3.5"
                fill="#ffffff"
                stroke={hoveredSample.difficultyColor}
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Live Hover Floating HUD Badge */}
        {hoveredSample && (
          <div
            className="absolute top-2 left-2 sm:left-auto sm:right-2 p-2 rounded-xl bg-[#090d16]/95 backdrop-blur-xl border border-cyan-500/50 shadow-2xl text-[11px] font-mono pointer-events-none flex items-center gap-3 animate-in fade-in zoom-in-95 duration-100 z-10"
          >
            <div>
              <div className="text-[9px] text-neutral-400 flex items-center gap-1">
                <span>PROGRESS</span>
                <span className="text-white font-bold">{formatDist(hoveredSample.distanceKm)}</span>
                <span className="text-neutral-500">/ {formatDist(totalDistanceKm)}</span>
              </div>
              <div className="text-sm font-black text-cyan-300 font-mono mt-0.5">
                {formatElev(hoveredSample.elevationM)}
              </div>
            </div>

            <div className="h-6 w-[1px] bg-white/10" />

            <div>
              <div className="text-[9px] text-neutral-400">SLOPE / TERRAIN</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="font-bold"
                  style={{ color: hoveredSample.difficultyColor }}
                >
                  {hoveredSample.slopeDeg}°
                </span>
                <span
                  className="text-[9.5px] px-1.5 py-0.2 rounded font-bold"
                  style={{
                    backgroundColor: `${hoveredSample.difficultyColor}25`,
                    color: hoveredSample.difficultyColor,
                  }}
                >
                  {hoveredSample.difficultyLabel}
                </span>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />

            <div className="hidden sm:block">
              <div className="text-[9px] text-neutral-400">PRESSURE</div>
              <div className="text-sky-300 font-bold mt-0.5">
                {hoveredSample.atmosphericPressureMbar} mbar
              </div>
            </div>

            <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />

            <div className="hidden sm:block">
              <div className="text-[9px] text-neutral-400">COORDINATES</div>
              <div className="text-neutral-200 text-[10px] mt-0.5">
                {hoveredSample.lat.toFixed(2)}°N, {hoveredSample.lng.toFixed(2)}°E
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Helper Legend */}
      <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-0.5 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span>&lt;5° Gentle</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#eab308]" />
            <span>5–15° Moderate</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#f97316]" />
            <span>15–25° Steep</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span>&gt;25° Cliff</span>
          </span>
        </div>

        <div className="text-neutral-500 hidden sm:block">
          Hover / scrub chart to sync marker with map
        </div>
      </div>
    </div>
  );
};
