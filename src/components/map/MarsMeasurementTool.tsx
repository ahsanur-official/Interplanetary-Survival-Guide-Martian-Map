import React, { useState, useMemo } from 'react';
import {
  X,
  Ruler,
  Maximize2,
  Trash2,
  Undo,
  CheckCircle2,
  Compass,
  TrendingUp,
  Copy,
  Check,
  Layers,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  Square,
  ArrowRight,
  Focus,
} from 'lucide-react';
import {
  calculateMarsDistanceKm,
  calculateMarsPolygonAreaKm2,
  calculateBearing,
  getBearingCardinal,
  MARS_RADIUS_KM,
} from '../../engine/spatialMath';
import { getMolaElevation } from '../../engine/marsMolaElevation';

export interface MeasurementPoint {
  lat: number;
  lng: number;
  elevationM?: number;
  name?: string;
}

export interface MeasurementSegment {
  index: number;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  distanceKm: number;
  bearingDeg: number;
  bearingCardinal: string;
  elevFromM?: number;
  elevToM?: number;
  elevDeltaM?: number;
}

export interface MarsMeasurementToolProps {
  isOpen: boolean;
  onClose: () => void;
  points: MeasurementPoint[];
  onClear: () => void;
  onUndo: () => void;
  onDeletePoint?: (index: number) => void;
  onUpdatePoint?: (index: number, lat: number, lng: number) => void;
  measurementMode: 'distance' | 'area';
  onChangeMode: (mode: 'distance' | 'area') => void;
  onOpenElevationProfile?: () => void;
  onFitBounds?: () => void;
  onLoadPreset?: (points: MeasurementPoint[]) => void;
}

// Preset benchmark geological features on Mars for instant scale verification
export interface MeasurementPreset {
  id: string;
  name: string;
  category: 'Impact Crater' | 'Volcano' | 'Canyon' | 'Basin';
  description: string;
  expectedMetric: string;
  points: MeasurementPoint[];
}

export const MARS_MEASUREMENT_PRESETS: MeasurementPreset[] = [
  {
    id: 'olympus_caldera',
    name: 'Olympus Mons Caldera Rim',
    category: 'Volcano',
    description: 'Enormous complex volcanic summit caldera spanning ~80 km across at +21.2 km altitude.',
    expectedMetric: '~4,800 km² caldera floor area',
    points: [
      { lat: 18.95, lng: -133.50, elevationM: 21100 },
      { lat: 18.70, lng: -133.25, elevationM: 21200 },
      { lat: 18.35, lng: -133.55, elevationM: 21150 },
      { lat: 18.40, lng: -134.10, elevationM: 20950 },
      { lat: 18.75, lng: -134.25, elevationM: 21180 },
    ],
  },
  {
    id: 'gale_crater',
    name: 'Gale Crater Rim (Curiosity MSL)',
    category: 'Impact Crater',
    description: '154 km diameter ancient impact crater holding Mount Sharp (Aeolis Mons) central mound.',
    expectedMetric: '~18,500 km² floor basin area',
    points: [
      { lat: -3.85, lng: 137.40, elevationM: -2500 },
      { lat: -4.30, lng: 138.45, elevationM: -2600 },
      { lat: -5.50, lng: 138.10, elevationM: -2700 },
      { lat: -5.75, lng: 137.20, elevationM: -2550 },
      { lat: -5.00, lng: 136.40, elevationM: -2650 },
      { lat: -4.05, lng: 136.65, elevationM: -2500 },
    ],
  },
  {
    id: 'jezero_crater',
    name: 'Jezero Crater Paleolake (Perseverance)',
    category: 'Impact Crater',
    description: '45 km diameter paleolake crater with ancient river delta fan at -2,560m elevation.',
    expectedMetric: '~1,600 km² floor area • ~140 km rim perimeter',
    points: [
      { lat: 18.65, lng: 77.45, elevationM: -2450 },
      { lat: 18.55, lng: 77.75, elevationM: -2500 },
      { lat: 18.25, lng: 77.70, elevationM: -2550 },
      { lat: 18.15, lng: 77.40, elevationM: -2480 },
      { lat: 18.40, lng: 77.25, elevationM: -2520 },
    ],
  },
  {
    id: 'valles_melas',
    name: 'Melas Chasma Transect (Valles Marineris)',
    category: 'Canyon',
    description: 'Deepest chasma rift in the Valles Marineris canyon system plunging down 9 km to -5,000m.',
    expectedMetric: '~420 km cross-canyon distance',
    points: [
      { lat: -7.50, lng: -78.50, elevationM: 3200 },
      { lat: -9.20, lng: -76.80, elevationM: -3800 },
      { lat: -10.80, lng: -75.10, elevationM: 2800 },
    ],
  },
];

export function MarsMeasurementTool({
  isOpen,
  onClose,
  points,
  onClear,
  onUndo,
  onDeletePoint,
  measurementMode,
  onChangeMode,
  onOpenElevationProfile,
  onFitBounds,
  onLoadPreset,
}: MarsMeasurementToolProps) {
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [showSegmentsList, setShowSegmentsList] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showPresets, setShowPresets] = useState<boolean>(false);

  // 1. Calculate Individual Segments
  const segments = useMemo<MeasurementSegment[]>(() => {
    if (points.length < 2) return [];
    const list: MeasurementSegment[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dist = calculateMarsDistanceKm(
        { latitude: p1.lat, longitude: p1.lng },
        { latitude: p2.lat, longitude: p2.lng }
      );
      const bearing = calculateBearing(
        { latitude: p1.lat, longitude: p1.lng },
        { latitude: p2.lat, longitude: p2.lng }
      );
      const elev1 = p1.elevationM ?? getMolaElevation(p1.lat, p1.lng);
      const elev2 = p2.elevationM ?? getMolaElevation(p2.lat, p2.lng);

      list.push({
        index: i + 1,
        fromLat: p1.lat,
        fromLng: p1.lng,
        toLat: p2.lat,
        toLng: p2.lng,
        distanceKm: dist,
        bearingDeg: Math.round(bearing),
        bearingCardinal: getBearingCardinal(bearing),
        elevFromM: elev1,
        elevToM: elev2,
        elevDeltaM: elev2 - elev1,
      });
    }
    return list;
  }, [points]);

  // 2. Total Cumulative Path Distance
  const totalPathDistanceKm = useMemo(() => {
    return segments.reduce((acc, s) => acc + s.distanceKm, 0);
  }, [segments]);

  // 3. Total Closed Polygon Perimeter
  const totalPerimeterKm = useMemo(() => {
    if (points.length < 3) return totalPathDistanceKm;
    const closingDist = calculateMarsDistanceKm(
      { latitude: points[points.length - 1].lat, longitude: points[points.length - 1].lng },
      { latitude: points[0].lat, longitude: points[0].lng }
    );
    return totalPathDistanceKm + closingDist;
  }, [points, totalPathDistanceKm]);

  // 4. Enclosed Spherical Polygon Area on Mars
  const totalAreaKm2 = useMemo(() => {
    if (points.length < 3) return 0;
    return calculateMarsPolygonAreaKm2(
      points.map((p) => ({ latitude: p.lat, longitude: p.lng }))
    );
  }, [points]);

  // 5. Elevation statistics across measured vertices
  const elevationStats = useMemo(() => {
    if (points.length === 0) return null;
    const elevs = points.map((p) => p.elevationM ?? getMolaElevation(p.lat, p.lng));
    const min = Math.min(...elevs);
    const max = Math.max(...elevs);
    let ascent = 0;
    let descent = 0;

    for (let i = 0; i < elevs.length - 1; i++) {
      const delta = elevs[i + 1] - elevs[i];
      if (delta > 0) ascent += delta;
      else descent += Math.abs(delta);
    }

    return {
      min,
      max,
      span: max - min,
      ascent,
      descent,
    };
  }, [points]);

  // Area Earth/Mars Comparison Analog
  const areaComparisonText = useMemo(() => {
    if (totalAreaKm2 < 1) return null;
    if (totalAreaKm2 < 20) return `~${(totalAreaKm2 / 2.0).toFixed(1)}× Monaco`;
    if (totalAreaKm2 < 100) return `~${(totalAreaKm2 / 78).toFixed(1)}× Manhattan Island`;
    if (totalAreaKm2 < 1000) return `~${(totalAreaKm2 / 600).toFixed(1)}× Isle of Man`;
    if (totalAreaKm2 < 5000) return `~${(totalAreaKm2 / 1600).toFixed(1)}× Jezero Crater floor`;
    if (totalAreaKm2 < 25000) return `~${(totalAreaKm2 / 18500).toFixed(1)}× Gale Crater floor`;
    if (totalAreaKm2 < 100000) return `~${(totalAreaKm2 / 41285).toFixed(1)}× Switzerland`;
    if (totalAreaKm2 < 1000000) return `~${(totalAreaKm2 / 357022).toFixed(1)}× Germany`;
    return `~${(totalAreaKm2 / 1200000).toFixed(1)}× Hellas Planitia Basin`;
  }, [totalAreaKm2]);

  // Copy Summary to Clipboard
  const handleCopySummary = async () => {
    if (points.length === 0) return;
    const lines = [
      `== MarsWay GIS Planetary Measurement Summary ==`,
      `Mode: ${measurementMode.toUpperCase()}`,
      `Total Path Distance: ${totalPathDistanceKm.toFixed(2)} km (${(totalPathDistanceKm * 0.621371).toFixed(2)} miles)`,
    ];

    if (points.length >= 3) {
      lines.push(
        `Enclosed Polygon Area: ${totalAreaKm2.toLocaleString(undefined, { maximumFractionDigits: 1 })} km² (${(totalAreaKm2 * 0.386102).toLocaleString(undefined, { maximumFractionDigits: 1 })} sq mi)`,
        `Closed Perimeter: ${totalPerimeterKm.toFixed(2)} km`
      );
    }

    lines.push(`Points Count: ${points.length}`);
    lines.push(`--- Coordinates ---`);
    points.forEach((p, i) => {
      const elev = p.elevationM ?? getMolaElevation(p.lat, p.lng);
      lines.push(`Pt ${i + 1}: ${p.lat.toFixed(4)}°N, ${p.lng.toFixed(4)}°E (Elev: ${elev > 0 ? `+${elev}` : elev}m)`);
    });

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-14 sm:top-20 left-2 right-2 sm:left-auto sm:right-6 w-auto sm:w-88 max-w-[calc(100vw-16px)] bg-[#0b1019]/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-2xl shadow-black/80 z-40 text-neutral-100 overflow-hidden font-sans text-xs animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header */}
      <div className="p-3 bg-neutral-950/90 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-cyan-600/30 to-blue-500/20 border border-cyan-500/50 text-cyan-400">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs tracking-wide">
                Mars GIS Measurement Tool
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-semibold">
                R={MARS_RADIUS_KM.toFixed(0)}km
              </span>
            </div>
            <div className="text-[10.5px] text-neutral-400">
              Click map to add points • Drag to adjust
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onFitBounds && points.length >= 2 && (
            <button
              type="button"
              onClick={onFitBounds}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Fit map viewport to measured path"
            >
              <Focus className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close measure tool"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="p-2 border-b border-neutral-800 bg-neutral-950/60 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => onChangeMode('distance')}
          className={`py-1.5 px-2.5 rounded-xl text-center transition flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
            measurementMode === 'distance'
              ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/50'
              : 'text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-850'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Path Distance</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeMode('area')}
          className={`py-1.5 px-2.5 rounded-xl text-center transition flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
            measurementMode === 'area'
              ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/50'
              : 'text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-850'
          }`}
        >
          <Square className="w-3.5 h-3.5" />
          <span>Polygon Area</span>
        </button>
      </div>

      {/* Measurement Metrics Display Card */}
      <div className="p-3.5 bg-neutral-950/80 space-y-3">
        {/* Main Stat Value */}
        {measurementMode === 'distance' ? (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">
                Great-Circle Path Distance
              </span>
              <button
                type="button"
                onClick={() => setUnitSystem(unitSystem === 'metric' ? 'imperial' : 'metric')}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors underline cursor-pointer"
              >
                {unitSystem === 'metric' ? 'Show Miles' : 'Show Kilometers'}
              </button>
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-2xl font-black font-mono text-cyan-400 tracking-tight">
                {unitSystem === 'metric'
                  ? totalPathDistanceKm.toFixed(2)
                  : (totalPathDistanceKm * 0.621371).toFixed(2)}
              </div>
              <span className="text-xs font-bold text-neutral-300 uppercase">
                {unitSystem === 'metric' ? 'km' : 'miles'}
              </span>
            </div>

            <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between pt-0.5">
              <span>
                {unitSystem === 'metric'
                  ? `${(totalPathDistanceKm * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} meters`
                  : `${(totalPathDistanceKm * 3280.84).toLocaleString(undefined, { maximumFractionDigits: 0 })} feet`}
              </span>
              {points.length >= 2 && (
                <span className="text-neutral-400">
                  {segments.length} {segments.length === 1 ? 'segment' : 'segments'}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">
                Enclosed Spherical Surface Area
              </span>
              <button
                type="button"
                onClick={() => setUnitSystem(unitSystem === 'metric' ? 'imperial' : 'metric')}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors underline cursor-pointer"
              >
                {unitSystem === 'metric' ? 'Show Sq Miles' : 'Show Sq Km'}
              </button>
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-2xl font-black font-mono text-cyan-400 tracking-tight">
                {unitSystem === 'metric'
                  ? totalAreaKm2.toLocaleString(undefined, { maximumFractionDigits: 1 })
                  : (totalAreaKm2 * 0.386102).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </div>
              <span className="text-xs font-bold text-neutral-300 uppercase">
                {unitSystem === 'metric' ? 'km²' : 'sq mi'}
              </span>
            </div>

            <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between pt-0.5">
              <span>
                {points.length < 3
                  ? 'Add at least 3 points on the map to enclose area'
                  : `Perimeter: ${unitSystem === 'metric' ? `${totalPerimeterKm.toFixed(1)} km` : `${(totalPerimeterKm * 0.621371).toFixed(1)} mi`}`}
              </span>
              {points.length >= 3 && (
                <span className="text-cyan-300/90 font-medium">{points.length} vertices</span>
              )}
            </div>

            {areaComparisonText && (
              <div className="mt-1.5 px-2 py-1 rounded bg-cyan-950/40 border border-cyan-500/30 text-[10.5px] text-cyan-200 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Geographic analog: {areaComparisonText}</span>
              </div>
            )}
          </div>
        )}

        {/* Dual Mode Secondary Summary (Shows Area when in Distance mode if 3+ points exist, and vice versa) */}
        {points.length >= 3 && (
          <div className="p-2 rounded-xl bg-neutral-900/70 border border-neutral-800 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">
              {measurementMode === 'distance' ? 'Enclosed Polygon Area:' : 'Total Path Length:'}
            </span>
            <span className="font-mono font-bold text-white">
              {measurementMode === 'distance'
                ? `${totalAreaKm2.toLocaleString(undefined, { maximumFractionDigits: 1 })} km²`
                : `${totalPathDistanceKm.toFixed(2)} km`}
            </span>
          </div>
        )}

        {/* Elevation Profile Summary across points */}
        {elevationStats && points.length >= 2 && (
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 space-y-1 text-[10.5px] font-mono">
            <div className="flex items-center justify-between text-neutral-400">
              <span>MOLA Elevation Span:</span>
              <span className="text-white font-bold">
                {elevationStats.min > 0 ? `+${elevationStats.min}` : elevationStats.min}m to {elevationStats.max > 0 ? `+${elevationStats.max}` : elevationStats.max}m
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Ascent / Descent:</span>
              <span>
                <span className="text-emerald-400">+{Math.round(elevationStats.ascent)}m</span>
                {' / '}
                <span className="text-red-400">-{Math.round(elevationStats.descent)}m</span>
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons: Undo, Clear, Copy */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] font-mono text-neutral-400">
            Points: <strong className="text-white">{points.length}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopySummary}
              disabled={points.length === 0}
              className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-neutral-300 hover:text-white flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
              title="Copy measurement summary to clipboard"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={onUndo}
              disabled={points.length === 0}
              className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-neutral-300 hover:text-white flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
              title="Undo last placed point"
            >
              <Undo className="w-3 h-3" />
              <span>Undo</span>
            </button>

            <button
              type="button"
              onClick={onClear}
              disabled={points.length === 0}
              className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-red-950/60 disabled:opacity-40 text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
              title="Clear all measurement points"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Collapsible Segments Breakdown */}
        {segments.length > 0 && (
          <div className="border-t border-neutral-800/80 pt-2">
            <button
              type="button"
              onClick={() => setShowSegmentsList(!showSegmentsList)}
              className="w-full flex items-center justify-between text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer py-1"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Individual Segments Breakdown ({segments.length})
              </span>
              {showSegmentsList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSegmentsList && (
              <div className="mt-1.5 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {segments.map((seg) => (
                  <div
                    key={seg.index}
                    className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800/80 flex items-center justify-between text-[10.5px] font-mono"
                  >
                    <div>
                      <div className="font-bold text-neutral-200 flex items-center gap-1">
                        <span>Leg {seg.index}: Pt {seg.index}</span>
                        <ArrowRight className="w-3 h-3 text-neutral-400" />
                        <span>Pt {seg.index + 1}</span>
                      </div>
                      <div className="text-[9.5px] text-neutral-400 mt-0.5">
                        Azimuth: {seg.bearingDeg}° ({seg.bearingCardinal})
                        {seg.elevDeltaM !== undefined && (
                          <span className="ml-2 text-neutral-400">
                            Δh: {seg.elevDeltaM >= 0 ? `+${seg.elevDeltaM}` : seg.elevDeltaM}m
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right font-bold text-cyan-300">
                      {seg.distanceKm < 10
                        ? `${seg.distanceKm.toFixed(2)} km`
                        : `${seg.distanceKm.toFixed(1)} km`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3D MOLA Elevation Transect Action Button */}
        {onOpenElevationProfile && points.length >= 2 && (
          <button
            type="button"
            onClick={onOpenElevationProfile}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold flex items-center justify-center gap-2 transition text-xs shadow-md shadow-cyan-950/60 cursor-pointer"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Generate 3D MOLA Elevation Profile</span>
          </button>
        )}

        {/* Mars Feature Presets Dropdown */}
        {onLoadPreset && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-neutral-900/70 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white hover:bg-neutral-850 transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Load Martian Feature Benchmark
              </span>
              {showPresets ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showPresets && (
              <div className="mt-1.5 space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {MARS_MEASUREMENT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onLoadPreset(preset.points);
                      setShowPresets(false);
                    }}
                    className="w-full text-left p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-cyan-500/60 transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px] group-hover:text-cyan-300">
                        {preset.name}
                      </span>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-amber-400">
                        {preset.category}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      {preset.expectedMetric}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="p-2.5 bg-neutral-950 border-t border-neutral-800 text-[10.5px] text-neutral-400 flex items-center justify-between font-mono">
        <span className="flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-cyan-400 shrink-0" />
          Click map to drop vertex • Drag vertex to adjust
        </span>
        {points.length > 0 && (
          <span className="text-cyan-400 font-bold">Active</span>
        )}
      </div>
    </div>
  );
}
