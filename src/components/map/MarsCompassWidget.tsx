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

  // Cardinal direction name
  const getCardinalName = (deg: number) => {
    if (deg >= 315 || deg < 45) return { name: 'NORTH UP', code: 'N', color: 'text-red-400', bg: 'bg-red-950/80 border-red-700' };
    if (deg >= 45 && deg < 135) return { name: 'EAST UP', code: 'E', color: 'text-amber-400', bg: 'bg-amber-950/80 border-amber-700' };
    if (deg >= 135 && deg < 225) return { name: 'SOUTH UP', code: 'S', color: 'text-blue-400', bg: 'bg-blue-950/80 border-blue-700' };
    return { name: 'WEST UP', code: 'W', color: 'text-emerald-400', bg: 'bg-emerald-950/80 border-emerald-700' };
  };

  const cardinal = getCardinalName(normalizedBearing);

  const handleCompassCenterClick = () => {
    setIsSpinning(true);
    onResetOrientation();
    setTimeout(() => {
      setIsSpinning(false);
    }, 700);
  };

  const handleRotateStep = (delta: number) => {
    const next = ((normalizedBearing + delta) % 360 + 360) % 360;
    onRotate(next);
  };

  return (
    <div
      className="relative pointer-events-auto select-none flex flex-col items-end gap-1.5"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Top Container with Dial and 4-Direction Switcher */}
      <div className="flex items-center gap-1.5 bg-[#0c101a]/95 backdrop-blur-md border border-neutral-800 p-1.5 rounded-2xl shadow-2xl">
        {/* Step Rotate Left Button */}
        <button
          onClick={() => handleRotateStep(-90)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Rotate Map Counter-Clockwise 90°"
          aria-label="Rotate Left 90 degrees"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Compass Dial Container */}
        <button
          onClick={handleCompassCenterClick}
          title={`Heading: ${normalizedBearing}° ${cardinal.code} • Click to reset to True North`}
          className="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-neutral-900 border border-neutral-700/90 hover:border-orange-500 shadow-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          aria-label={`Mars Compass: ${cardinal.name}`}
        >
          {/* Outer Degree Tick Ring - Rotates with Map Bearing */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full p-1"
            style={{
              transform: isSpinning ? 'rotate(360deg)' : `rotate(${-normalizedBearing}deg)`,
              transition: isSpinning ? 'transform 0.7s cubic-bezier(0.2, 0, 0, 1)' : 'transform 0.45s cubic-bezier(0.2, 0, 0, 1)',
            }}
          >
            {/* Outer Dial Ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#334155"
              strokeWidth="1.2"
              opacity="0.6"
            />
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.8"
            />

            {/* 30-degree tick marks */}
            {[...Array(12)].map((_, i) => {
              const angle = i * 30;
              const isCardinal = i % 3 === 0;
              const length = isCardinal ? 6 : 3.5;
              const strokeWidth = isCardinal ? 1.5 : 0.9;
              const strokeColor = i === 0 ? '#ef4444' : isCardinal ? '#cbd5e1' : '#64748b';
              return (
                <line
                  key={angle}
                  x1="50"
                  y1={50 - 43}
                  x2="50"
                  y2={50 - 43 + length}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  transform={`rotate(${angle} 50 50)`}
                />
              );
            })}

            {/* Cardinal Labels on Dial: N, E, S, W */}
            <text
              x="50"
              y="19"
              fill="#ef4444"
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
              dominantBaseline="central"
            >
              N
            </text>
            <text
              x="84"
              y="51"
              fill="#fbbf24"
              fontSize="8"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
              dominantBaseline="central"
            >
              E
            </text>
            <text
              x="50"
              y="83"
              fill="#60a5fa"
              fontSize="8"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
              dominantBaseline="central"
            >
              S
            </text>
            <text
              x="16"
              y="51"
              fill="#34d399"
              fontSize="8"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
              dominantBaseline="central"
            >
              W
            </text>

            {/* Precision Aerospace Compass Needle */}
            {/* North Needle (Red/Orange Glowing) */}
            <polygon
              points="50,22 46,50 54,50"
              fill="url(#northGradient)"
              filter="drop-shadow(0 0 3px rgba(239, 68, 68, 0.8))"
            />
            {/* South Needle (Slate Blue) */}
            <polygon
              points="50,78 46,50 54,50"
              fill="url(#southGradient)"
            />

            {/* Center Hub */}
            <circle cx="50" cy="50" r="4" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.2" />
            <circle cx="50" cy="50" r="1.6" fill="#ef4444" />

            {/* Gradients */}
            <defs>
              <linearGradient id="northGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>
              <linearGradient id="southGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>
          </svg>

          {/* Heading Degree Badge at Top of Button */}
          <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 px-1 py-0.2 border rounded text-[7.5px] font-mono font-black leading-none shadow-sm ${cardinal.bg} ${cardinal.color}`}>
            {normalizedBearing}° {cardinal.code}
          </div>
        </button>

        {/* Step Rotate Right Button */}
        <button
          onClick={() => handleRotateStep(90)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Rotate Map Clockwise 90°"
          aria-label="Rotate Right 90 degrees"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4 CARDINAL ORIENTATION BUTTONS (North, East, South, West) */}
      <div className="flex items-center gap-1 bg-[#0c101a]/95 backdrop-blur-md border border-neutral-800 p-1 rounded-xl shadow-xl">
        {/* North Button */}
        <button
          onClick={() => onRotate(0)}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
            normalizedBearing === 0
              ? 'bg-red-600 text-white shadow-md shadow-red-950 scale-105'
              : 'text-neutral-400 hover:text-red-300 hover:bg-neutral-800/80'
          }`}
          title="North Up (0° - Standard Planetary View)"
        >
          N (0°)
        </button>

        {/* East Button */}
        <button
          onClick={() => onRotate(90)}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
            normalizedBearing === 90
              ? 'bg-amber-500 text-neutral-950 font-black shadow-md shadow-amber-950 scale-105'
              : 'text-neutral-400 hover:text-amber-300 hover:bg-neutral-800/80'
          }`}
          title="East Up (90° - Forward Dawn Horizon View)"
        >
          E (90°)
        </button>

        {/* South Button */}
        <button
          onClick={() => onRotate(180)}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
            normalizedBearing === 180
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950 scale-105'
              : 'text-neutral-400 hover:text-blue-300 hover:bg-neutral-800/80'
          }`}
          title="South Up (180° - Inverted Southern Perspective)"
        >
          S (180°)
        </button>

        {/* West Button */}
        <button
          onClick={() => onRotate(270)}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
            normalizedBearing === 270
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 scale-105'
              : 'text-neutral-400 hover:text-emerald-300 hover:bg-neutral-800/80'
          }`}
          title="West Up (270° - Forward Dusk Horizon View)"
        >
          W (270°)
        </button>
      </div>

      {/* Floating Dark HUD Tooltip / Spatial Status */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-[#0c101a]/98 backdrop-blur-xl border border-neutral-700/90 rounded-xl p-2.5 shadow-2xl text-[10px] space-y-1.5 z-30 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-1 font-mono">
            <span className={`${cardinal.color} font-bold flex items-center gap-1`}>
              <Compass className="w-3 h-3" /> {cardinal.name}
            </span>
            <span className="text-white font-bold">{normalizedBearing.toString().padStart(3, '0')}.0°</span>
          </div>
          <div className="text-neutral-400 space-y-0.5">
            <div className="flex justify-between">
              <span>Orientation:</span>
              <span className="text-neutral-200 font-semibold">{cardinal.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Grid Reference:</span>
              <span className="text-neutral-200 font-mono">Areocentric</span>
            </div>
            <div className="flex justify-between">
              <span>Solar Ls:</span>
              <span className="text-amber-300 font-mono">{solarLongitudeLs.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span>Subsolar Lat:</span>
              <span className="text-cyan-300 font-mono">{subSolarLat}°</span>
            </div>
          </div>
          <div className="pt-1 border-t border-neutral-800/80 text-[9px] text-neutral-400 text-center">
            Click N, E, S, W to rotate map in 4 directions • Click dial to reset to North
          </div>
        </div>
      )}
    </div>
  );
};

