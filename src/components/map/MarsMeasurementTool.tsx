import { useState, useMemo } from 'react';
import {
  X,
  Ruler,
  Maximize2,
  Trash2,
  Undo,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import {
  calculateMarsDistanceKm,
  calculateMarsPolygonAreaKm2,
} from '../../engine/spatialMath';

export interface MeasurementPoint {
  lat: number;
  lng: number;
  elevationM?: number;
}

interface MarsMeasurementToolProps {
  isOpen: boolean;
  onClose: () => void;
  points: MeasurementPoint[];
  onClear: () => void;
  onUndo: () => void;
  measurementMode: 'distance' | 'area';
  onChangeMode: (mode: 'distance' | 'area') => void;
}

export function MarsMeasurementTool({
  isOpen,
  onClose,
  points,
  onClear,
  onUndo,
  measurementMode,
  onChangeMode,
}: MarsMeasurementToolProps) {
  if (!isOpen) return null;

  const totalDistanceKm = useMemo(() => {
    if (points.length < 2) return 0;
    let sum = 0;
    for (let i = 0; i < points.length - 1; i++) {
      sum += calculateMarsDistanceKm(
        { latitude: points[i].lat, longitude: points[i].lng },
        { latitude: points[i + 1].lat, longitude: points[i + 1].lng }
      );
    }
    return sum;
  }, [points]);

  const totalAreaKm2 = useMemo(() => {
    if (points.length < 3) return 0;
    return calculateMarsPolygonAreaKm2(
      points.map((p) => ({ latitude: p.lat, longitude: p.lng }))
    );
  }, [points]);

  return (
    <div className="fixed top-20 right-4 sm:right-6 w-80 bg-[#0c1017]/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl z-40 text-neutral-200 overflow-hidden font-mono text-xs">
      {/* Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/80">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-orange-400" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            Planetary GIS Measure
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="p-2 border-b border-neutral-800/80 bg-neutral-950/40 grid grid-cols-2 gap-1">
        <button
          onClick={() => onChangeMode('distance')}
          className={`py-1.5 px-2 rounded text-center transition ${
            measurementMode === 'distance'
              ? 'bg-orange-600 text-white font-bold shadow'
              : 'text-neutral-400 hover:text-white bg-neutral-900'
          }`}
        >
          Path Distance
        </button>
        <button
          onClick={() => onChangeMode('area')}
          className={`py-1.5 px-2 rounded text-center transition ${
            measurementMode === 'area'
              ? 'bg-orange-600 text-white font-bold shadow'
              : 'text-neutral-400 hover:text-white bg-neutral-900'
          }`}
        >
          Polygon Area
        </button>
      </div>

      {/* Primary Calculated Stats */}
      <div className="p-4 bg-neutral-950/80 space-y-2">
        {measurementMode === 'distance' ? (
          <div>
            <span className="text-[10px] text-neutral-500 uppercase block">
              Great-Circle Mars Distance
            </span>
            <div className="text-xl font-bold text-orange-400">
              {totalDistanceKm.toFixed(2)}{' '}
              <span className="text-xs font-normal text-neutral-400">km</span>
            </div>
            <span className="text-[11px] text-neutral-400 block mt-0.5">
              {(totalDistanceKm * 1000).toLocaleString()} meters (Mars Sphere R=3,396 km)
            </span>
          </div>
        ) : (
          <div>
            <span className="text-[10px] text-neutral-500 uppercase block">
              Spherical Surface Enclosed Area
            </span>
            <div className="text-xl font-bold text-cyan-400">
              {totalAreaKm2.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
              <span className="text-xs font-normal text-neutral-400">km²</span>
            </div>
            <span className="text-[11px] text-neutral-400 block mt-0.5">
              {points.length < 3
                ? 'Add at least 3 points on the map to calculate polygon area'
                : `${points.length} vertices enclosed`}
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Points: {points.length}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onUndo}
              disabled={points.length === 0}
              className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-neutral-300"
            >
              Undo
            </button>
            <button
              onClick={onClear}
              disabled={points.length === 0}
              className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-red-950/60 disabled:opacity-40 text-red-400"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Guidance */}
      <div className="p-2.5 bg-neutral-900/60 text-[10px] text-neutral-500 border-t border-neutral-800">
        Click anywhere on the Mars surface to drop measurement pins.
      </div>
    </div>
  );
}
