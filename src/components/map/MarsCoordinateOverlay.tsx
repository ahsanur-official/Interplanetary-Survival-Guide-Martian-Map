import React, { useState, useEffect } from 'react';
import {
  Compass,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Mountain,
  Gauge,
  MapPin,
  Sparkles,
  Layers,
} from 'lucide-react';

export interface MarsCoordinateOverlayProps {
  coordLatRef: React.RefObject<HTMLSpanElement | null>;
  coordLngRef: React.RefObject<HTMLSpanElement | null>;
  coordElevRef: React.RefObject<HTMLSpanElement | null>;
  coordPressureRef: React.RefObject<HTMLSpanElement | null>;
  coordFeatureRef: React.RefObject<HTMLSpanElement | null>;
  coordDmsRef: React.RefObject<HTMLSpanElement | null>;
  initialLat?: number;
  initialLng?: number;
  initialElev?: number;
  initialPressure?: number;
  initialFeature?: string;
  currentZoom: number;
  onCopyCoordinates?: () => void;
}

export function formatDMS(deg: number, isLat: boolean): string {
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

  const direction = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
  return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds.toString().padStart(2, '0')}" ${direction}`;
}

export const MarsCoordinateOverlay: React.FC<MarsCoordinateOverlayProps> = ({
  coordLatRef,
  coordLngRef,
  coordElevRef,
  coordPressureRef,
  coordFeatureRef,
  coordDmsRef,
  initialLat = 18.38,
  initialLng = 77.58,
  initialElev = -2560,
  initialPressure = 7.5,
  initialFeature = 'Jezero Crater',
  currentZoom,
  onCopyCoordinates,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [formatMode, setFormatMode] = useState<'DD' | 'DMS'>('DD');
  const [copied, setCopied] = useState<boolean>(false);

  // Approximate ground resolution per pixel at equator on Mars (Mars equatorial circumference ~21,344 km)
  const approxResolutionMetersPerPixel = Math.round(
    (21344000 / (256 * Math.pow(2, currentZoom))) * 10
  ) / 10;

  const handleCopy = () => {
    if (onCopyCoordinates) {
      onCopyCoordinates();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    const latText = coordLatRef.current?.textContent || `${Math.abs(initialLat).toFixed(4)}°${initialLat >= 0 ? 'N' : 'S'}`;
    const lngText = coordLngRef.current?.textContent || `${Math.abs(initialLng).toFixed(4)}°${initialLng >= 0 ? 'E' : 'W'}`;
    const elevText = coordElevRef.current?.textContent || `${initialElev > 0 ? `+${initialElev}` : initialElev}m`;
    const textToCopy = `Mars Coordinates: ${latText}, ${lngText} (Elevation: ${elevText}, Datum: MOLA IAU 2000)`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20 pointer-events-auto font-sans select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
      {isExpanded ? (
        <div className="bg-[#070b14]/92 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl shadow-black/90 p-3 sm:p-3.5 text-neutral-200 w-auto min-w-[260px] sm:min-w-[310px] max-w-[calc(100vw-24px)] flex flex-col gap-2 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                Real-Time Coordinates
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* DD vs DMS Format Toggle */}
              <button
                type="button"
                onClick={() => setFormatMode(formatMode === 'DD' ? 'DMS' : 'DD')}
                className="px-2 py-0.5 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-[10px] font-mono text-cyan-300 font-bold border border-neutral-700/80 transition-colors cursor-pointer"
                title="Toggle between Decimal Degrees (DD) and Degrees Minutes Seconds (DMS)"
              >
                {formatMode}
              </button>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Copy coordinates & elevation to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Collapse Button */}
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Minimize coordinate overlay"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Coordinate Values Display */}
          <div className="grid grid-cols-2 gap-2 bg-neutral-950/70 p-2 rounded-xl border border-white/5 font-mono text-xs">
            <div>
              <span className="text-[9.5px] text-neutral-400 uppercase tracking-wider block">Latitude</span>
              <div className="text-white font-bold text-xs sm:text-[13px] tracking-tight">
                <span ref={coordLatRef}>
                  {Math.abs(initialLat).toFixed(4)}°{initialLat >= 0 ? 'N' : 'S'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[9.5px] text-neutral-400 uppercase tracking-wider block">Longitude</span>
              <div className="text-cyan-300 font-bold text-xs sm:text-[13px] tracking-tight">
                <span ref={coordLngRef}>
                  {initialLng >= 0 ? `${initialLng.toFixed(4)}°E` : `${Math.abs(initialLng).toFixed(4)}°W`}
                </span>
              </div>
            </div>
          </div>

          {/* Optional DMS Secondary Line */}
          {formatMode === 'DMS' && (
            <div className="px-2 py-1 bg-cyan-950/30 border border-cyan-500/20 rounded-lg text-[10px] font-mono text-cyan-200 flex items-center justify-between">
              <span className="text-neutral-400">DMS:</span>
              <span ref={coordDmsRef} className="font-semibold">
                {formatDMS(initialLat, true)}, {formatDMS(initialLng, false)}
              </span>
            </div>
          )}

          {/* Environmental Telemetry (MOLA Elevation & Surface Pressure) */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-neutral-900/80 border border-white/5">
              <Mountain className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="truncate">
                <span className="text-[9px] text-neutral-400 block uppercase">MOLA Elev</span>
                <span ref={coordElevRef} className="text-amber-300 font-bold">
                  {initialElev > 0 ? `+${initialElev}` : initialElev} m
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-neutral-900/80 border border-white/5">
              <Gauge className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <div className="truncate">
                <span className="text-[9px] text-neutral-400 block uppercase">Pressure</span>
                <span ref={coordPressureRef} className="text-blue-300 font-bold">
                  {initialPressure.toFixed(1)} mbar
                </span>
              </div>
            </div>
          </div>

          {/* Landmark / Feature Indicator */}
          <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-white/5 text-neutral-400">
            <div className="flex items-center gap-1 truncate pr-1">
              <MapPin className="w-3 h-3 text-red-400 shrink-0" />
              <span ref={coordFeatureRef} className="text-neutral-300 truncate font-sans">
                {initialFeature}
              </span>
            </div>
            <span className="shrink-0 text-[9px] text-neutral-400">
              Zoom {currentZoom} ({approxResolutionMetersPerPixel >= 1000 ? `${(approxResolutionMetersPerPixel / 1000).toFixed(1)} km/px` : `${approxResolutionMetersPerPixel} m/px`})
            </span>
          </div>
        </div>
      ) : (
        /* Minimized Sleek Pill Overlay */
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#070b14]/92 backdrop-blur-xl border border-white/20 shadow-2xl text-xs font-mono text-neutral-200 hover:text-white hover:border-cyan-500/60 transition-all cursor-pointer group hover:scale-105"
          title="Expand dynamic coordinate overlay"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400 group-hover:animate-ping" />
          <span ref={coordLatRef} className="font-bold text-white">
            {Math.abs(initialLat).toFixed(2)}°{initialLat >= 0 ? 'N' : 'S'}
          </span>
          <span className="text-neutral-500">•</span>
          <span ref={coordLngRef} className="font-bold text-cyan-300">
            {initialLng >= 0 ? `${initialLng.toFixed(2)}°E` : `${Math.abs(initialLng).toFixed(2)}°W`}
          </span>
          <span className="text-neutral-500">•</span>
          <span ref={coordElevRef} className="text-amber-400 font-semibold">
            {initialElev > 0 ? `+${initialElev}` : initialElev}m
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-transform" />
        </button>
      )}
    </div>
  );
};
