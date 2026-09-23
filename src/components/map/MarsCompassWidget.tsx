import React, { useState } from 'react';
import { Compass, RotateCcw, RotateCw } from 'lucide-react';

interface MarsCompassWidgetProps {
  bearing: number; // In degrees: 0 (North Up), 90 (East Up), 180 (South Up), 270 (West Up)
  onRotate: (newBearing: number) => void;
  onResetOrientation: () => void;
  subSolarLat?: number;
  solarLongitudeLs?: number;
}

export const MarsCompassWidget: React.FC<MarsCompassWidgetProps> = ({
  bearing = 0,
  onRotate,
  onResetOrientation,
  subSolarLat = 0,
  solarLongitudeLs = 0,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Normalize bearing to 0-359
  const normalizedBearing = ((bearing % 360) + 360) % 360;

  // Cardinal direction information
  const getCardinalInfo = (deg: number) => {
    if (deg >= 315 || deg < 45) {
      return { name: 'NORTH UP', code: 'N', color: 'text-red-400', bg: 'bg-red-950/90 border-red-700/80', desc: 'Standard Planetary View' };
    }
    if (deg >= 45 && deg < 135) {
      return { name: 'EAST UP', code: 'E', color: 'text-amber-400', bg: 'bg-amber-950/90 border-amber-700/80', desc: 'Forward Dawn Horizon' };
    }
    if (deg >= 135 && deg < 225) {
      return { name: 'SOUTH UP', code: 'S', color: 'text-sky-400', bg: 'bg-sky-950/90 border-sky-700/80', desc: 'Inverted South Perspective' };
    }
    return { name: 'WEST UP', code: 'W', color: 'text-emerald-400', bg: 'bg-emerald-950/90 border-emerald-700/80', desc: 'Forward Dusk Horizon' };
  };

  const cardinal = getCardinalInfo(normalizedBearing);

  // Reset to True North (0°) with a quick spin animation
  const handleResetToNorth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSpinning(true);
    onResetOrientation();
    setTimeout(() => {
      setIsSpinning(false);
    }, 600);
  };

  // Rotate by +/- 90 degrees
  const handleRotateStep = (delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = ((normalizedBearing + delta) % 360 + 360) % 360;
    onRotate(next);
  };

  // Clicking the compass dial: if rotated away from 0°, resets immediately to True North; if already 0°, advances 90°
  const handleDialClick = (e: React.MouseEvent) => {
    if (normalizedBearing !== 0) {
      handleResetToNorth(e);
    } else {
      handleRotateStep(90, e);
    }
  };

  return (
    <div
      className="relative pointer-events-auto select-none flex flex-col items-end"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Sleek, Crystal Clear Aerospace Compass Pod */}
      <div className="flex items-center gap-1.5 bg-[#090d16]/95 backdrop-blur-md border border-neutral-700/80 p-1.5 rounded-2xl shadow-2xl hover:border-neutral-600 transition-all">
        {/* Rotate Left (Counter-Clockwise 90°) */}
        <button
          onClick={(e) => handleRotateStep(-90, e)}
          className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/90 active:scale-95 transition-all cursor-pointer"
          title="Rotate Map Counter-Clockwise 90°"
          aria-label="Rotate Counter-Clockwise 90°"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Clear Compass Dial */}
        <div className="relative flex items-center justify-center">
          <button
            onClick={handleDialClick}
            title={normalizedBearing !== 0 ? `Bearing: ${normalizedBearing}° ${cardinal.code} (${cardinal.name}) • Click to reset True North (0°)` : `Bearing: 0° N (North Up) • Click to rotate 90°`}
            className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-neutral-900 to-[#070a12] border-2 border-neutral-600/90 hover:border-orange-500 shadow-xl transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/50 active:scale-95"
            aria-label={`Mars Compass: ${cardinal.name}`}
          >
            {/* Compass Dial Face - Rotates with Map Bearing */}
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full p-1"
              style={{
                transform: isSpinning ? 'rotate(360deg)' : `rotate(${-normalizedBearing}deg)`,
                transition: isSpinning
                  ? 'transform 0.6s cubic-bezier(0.2, 0, 0, 1)'
                  : 'transform 0.45s cubic-bezier(0.2, 0, 0, 1)',
              }}
            >
              {/* Outer Metallic Bezel Ring */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#475569"
                strokeWidth="1.2"
                opacity="0.8"
              />
              <circle
                cx="50"
                cy="50"
                r="39"
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.8"
              />

              {/* 30-degree Tick Marks around the Dial */}
              {[...Array(12)].map((_, i) => {
                const angle = i * 30;
                const isCardinal = i % 3 === 0;
                const length = isCardinal ? 6.5 : 3.5;
                const strokeWidth = isCardinal ? 1.8 : 0.9;
                const strokeColor =
                  i === 0
                    ? '#ef4444' // North Red
                    : i === 3
                    ? '#f59e0b' // East Amber
                    : i === 6
                    ? '#38bdf8' // South Sky Blue
                    : i === 9
                    ? '#10b981' // West Emerald
                    : '#64748b';

                return (
                  <line
                    key={angle}
                    x1="50"
                    y1={50 - 44}
                    x2="50"
                    y2={50 - 44 + length}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    transform={`rotate(${angle} 50 50)`}
                  />
                );
              })}

              {/* Crystal-Clear Cardinal Letters on Dial: N, E, S, W */}
              {/* North */}
              <text
                x="50"
                y="18"
                fill="#ef4444"
                fontSize="10"
                fontWeight="900"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                textAnchor="middle"
                dominantBaseline="central"
              >
                N
              </text>
              {/* East */}
              <text
                x="83"
                y="50"
                fill="#f59e0b"
                fontSize="9"
                fontWeight="900"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                textAnchor="middle"
                dominantBaseline="central"
              >
                E
              </text>
              {/* South */}
              <text
                x="50"
                y="83"
                fill="#38bdf8"
                fontSize="9"
                fontWeight="900"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                textAnchor="middle"
                dominantBaseline="central"
              >
                S
              </text>
              {/* West */}
              <text
                x="17"
                y="50"
                fill="#10b981"
                fontSize="9"
                fontWeight="900"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                textAnchor="middle"
                dominantBaseline="central"
              >
                W
              </text>

              {/* High-Definition 3D Aerospace Compass Needle */}
              {/* North Pointer (Luminous Mars Red) */}
              <polygon
                points="50,21 45,50 50,47"
                fill="url(#northRedLeft)"
                filter="drop-shadow(0 0 4px rgba(239, 68, 68, 0.9))"
              />
              <polygon
                points="50,21 55,50 50,47"
                fill="url(#northRedRight)"
                filter="drop-shadow(0 0 4px rgba(239, 68, 68, 0.9))"
              />

              {/* South Pointer (Titanium Slate Silver) */}
              <polygon
                points="50,79 45,50 50,53"
                fill="url(#southSlateLeft)"
              />
              <polygon
                points="50,79 55,50 50,53"
                fill="url(#southSlateRight)"
              />

              {/* Center Pivot Bezel & Jewel */}
              <circle cx="50" cy="50" r="5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="2" fill="#ef4444" />

              {/* Shading Gradients for Needle */}
              <defs>
                <linearGradient id="northRedLeft" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <linearGradient id="northRedRight" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#991b1b" />
                </linearGradient>
                <linearGradient id="southSlateLeft" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
                <linearGradient id="southSlateRight" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
              </defs>
            </svg>

            {/* True North Instant Reset Center Click Target */}
            {normalizedBearing !== 0 && (
              <div
                onClick={handleResetToNorth}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Click to reset True North (0°)"
              >
                <div className="w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform scale-90 hover:scale-110 transition-transform">
                  <RotateCcw className="w-2.5 h-2.5" />
                </div>
              </div>
            )}
          </button>

          {/* Heading Degree Badge at Top of Compass Button */}
          <button
            onClick={handleResetToNorth}
            title="Click to reset True North (0°)"
            className={`absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 border rounded-full text-[8.5px] font-mono font-black leading-none shadow-md cursor-pointer hover:scale-110 transition-transform ${cardinal.bg} ${cardinal.color}`}
          >
            {normalizedBearing}° {cardinal.code}
          </button>
        </div>

        {/* Rotate Right (Clockwise 90°) */}
        <button
          onClick={(e) => handleRotateStep(90, e)}
          className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/90 active:scale-95 transition-all cursor-pointer"
          title="Rotate Map Clockwise 90°"
          aria-label="Rotate Clockwise 90°"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Dark HUD Tooltip / Spatial Status */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[#090d16]/98 backdrop-blur-xl border border-neutral-700 rounded-xl p-2.5 shadow-2xl text-[10.5px] space-y-1.5 z-30 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 font-mono">
            <span className={`${cardinal.color} font-bold flex items-center gap-1`}>
              <Compass className="w-3.5 h-3.5" /> {cardinal.name}
            </span>
            <span className="text-white font-bold">{normalizedBearing.toString().padStart(3, '0')}°</span>
          </div>

          <div className="text-neutral-300 space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-neutral-400">Orientation:</span>
              <span className="text-white font-semibold">{cardinal.desc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Mars Coordinate Ref:</span>
              <span className="text-neutral-200 font-mono">Areocentric East</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Solar Ls (Season):</span>
              <span className="text-amber-300 font-mono">{solarLongitudeLs.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Subsolar Lat:</span>
              <span className="text-cyan-300 font-mono">{subSolarLat}°</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-neutral-800 text-[9px] text-neutral-400 text-center flex flex-col gap-0.5">
            <span>• Click <b>↶</b> or <b>↷</b> to turn 90°</span>
            <span>• Click dial or top badge to reset <b>True North (0°)</b></span>
          </div>
        </div>
      )}
    </div>
  );
};
