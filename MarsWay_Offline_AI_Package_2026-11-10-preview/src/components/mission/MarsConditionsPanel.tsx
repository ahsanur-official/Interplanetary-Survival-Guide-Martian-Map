import React from 'react';
import {
  X,
  Sun,
  Moon,
  Clock,
  Thermometer,
  Wind,
  ShieldAlert,
  Compass,
  Radio,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Footprints,
  Eye,
  Sliders
} from 'lucide-react';

export interface MarsConditionsData {
  timeOfSolMinutes: number; // 0 to 1479 (24h 39m sol = 1479.5 minutes)
  timeOfSolFormatted: string; // e.g. "13:45 LMST"
  sunElevationDeg: number;
  isDaylight: boolean;
  daylightRemainingHours: number;
  surfaceTempC: number;
  airTempC: number;
  dustOpacityTau: number;
  radiationDoseMicroGyPerDay: number;
  evaSafetyFactor: 'Optimal' | 'Caution' | 'Hazardous (Night EVA)';
  evaSafetyScore: number; // 0 to 100
  evaMaxDurationHours: number; // 2, 4, 6, 8
  showRangeCircles: boolean;
  nominalRangeKm: number;
  returnBoundaryKm: number;
}

export interface MarsConditionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  timeOfSolMinutes: number; // 0 to 1479
  onChangeTimeOfSol: (minutes: number) => void;
  evaDurationHours: number;
  onChangeEvaDuration: (hours: number) => void;
  showRangeCircles: boolean;
  onToggleRangeCircles: (show: boolean) => void;
  locationName?: string;
  latitude?: number;
  elevationM?: number;
}

export function computeMartianSolarConditions(
  timeOfSolMinutes: number,
  latitude = 18.38,
  elevationM = -2560,
  evaDurationHours = 6
): MarsConditionsData {
  // Convert minutes to fraction of sol (1479.6 minutes per sol)
  const solFraction = (timeOfSolMinutes % 1480) / 1480;
  const hours = Math.floor(timeOfSolMinutes / 60);
  const mins = Math.floor(timeOfSolMinutes % 60);
  const timeFormatted = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} LMST`;

  // Sun elevation: peaks at noon (740 mins / ~12:20)
  const solarNoonOffsetMinutes = timeOfSolMinutes - 740;
  const solarAngleRad = (solarNoonOffsetMinutes / 1480) * 2 * Math.PI;
  const sunElevationDeg = Math.round(Math.cos(solarAngleRad) * 72);
  const isDaylight = sunElevationDeg > -2;

  // Sunrise at ~05:45 (345 min), Sunset at ~18:55 (1135 min)
  let daylightRemainingHours = 0;
  if (isDaylight && timeOfSolMinutes < 1135) {
    daylightRemainingHours = Number(((1135 - timeOfSolMinutes) / 60).toFixed(1));
  }

  // Diurnal surface temperature model (-85°C night to -15°C noon)
  const tempSpan = 70;
  const noonPeak = -18 - (elevationM / 1000) * 2.5; // lapse rate
  const nightMin = noonPeak - tempSpan;
  const tempNormalized = Math.max(0, Math.cos(solarAngleRad));
  const surfaceTempC = Math.round(nightMin + tempNormalized * tempSpan);
  const airTempC = Math.round(surfaceTempC - 6);

  // Atmospheric dust optical depth tau (nominal 0.45)
  const dustOpacityTau = 0.48;

  // Radiation dose: higher when sun is up (solar UV & energetic particles)
  const baseCosmicRayDose = 480; // uGy/day (Curiosity RAD)
  const solarParticleComponent = isDaylight ? Math.round(sunElevationDeg * 2.2) : 0;
  const radiationDoseMicroGyPerDay = baseCosmicRayDose + solarParticleComponent;

  // EVA Safety Evaluation
  let evaSafetyFactor: 'Optimal' | 'Caution' | 'Hazardous (Night EVA)' = 'Optimal';
  let evaSafetyScore = 90;

  if (!isDaylight) {
    evaSafetyFactor = 'Hazardous (Night EVA)';
    evaSafetyScore = 42; // extreme cold (-85°C to -120°C) and zero visibility
  } else if (daylightRemainingHours < evaDurationHours) {
    evaSafetyFactor = 'Caution';
    evaSafetyScore = 68; // daylight running out before planned EVA finishes
  } else if (sunElevationDeg > 55) {
    evaSafetyScore = 95; // peak solar illumination & warm ground
  }

  // Marswalk Range Circles (based on suited speed ~ 3.2 km/h)
  // Nominal Range: 50% of time used for outbound, 50% reserved for return
  const nominalRangeKm = Number(((evaDurationHours * 3.2) / 2).toFixed(1));
  // Point of No Return Boundary: 100% of consumable envelope
  const returnBoundaryKm = Number((evaDurationHours * 3.2).toFixed(1));

  return {
    timeOfSolMinutes,
    timeOfSolFormatted: timeFormatted,
    sunElevationDeg,
    isDaylight,
    daylightRemainingHours,
    surfaceTempC,
    airTempC,
    dustOpacityTau,
    radiationDoseMicroGyPerDay,
    evaSafetyFactor,
    evaSafetyScore,
    evaMaxDurationHours: evaDurationHours,
    showRangeCircles: true,
    nominalRangeKm,
    returnBoundaryKm,
  };
}

export const MarsConditionsPanel: React.FC<MarsConditionsPanelProps> = ({
  isOpen,
  onClose,
  timeOfSolMinutes,
  onChangeTimeOfSol,
  evaDurationHours,
  onChangeEvaDuration,
  showRangeCircles,
  onToggleRangeCircles,
  locationName = 'Octavia E. Butler Base Camp (Jezero Crater)',
  latitude = 18.38,
  elevationM = -2560,
}) => {
  if (!isOpen) return null;

  const conditions = computeMartianSolarConditions(
    timeOfSolMinutes,
    latitude,
    elevationM,
    evaDurationHours
  );

  return (
    <div className="fixed top-16 right-2 sm:right-6 z-40 pointer-events-auto bg-[#070b14]/95 backdrop-blur-2xl border border-orange-500/40 rounded-2xl shadow-2xl shadow-black/90 p-4 text-xs text-neutral-200 max-w-[94vw] sm:max-w-md w-full font-sans animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40">
            {conditions.isDaylight ? <Sun className="w-4 h-4 animate-spin-slow" /> : <Moon className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-xs tracking-wide">
                Martian Conditions & Solar Time
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                conditions.evaSafetyFactor === 'Optimal'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                  : conditions.evaSafetyFactor === 'Caution'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                  : 'bg-red-950/80 text-red-300 border-red-500/50'
              }`}>
                {conditions.evaSafetyFactor}
              </span>
            </div>
            <div className="text-[10.5px] text-neutral-400 truncate max-w-[240px]">
              {locationName}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3.5 pt-3">
        {/* TIME-OF-SOL INTERACTIVE SLIDER */}
        <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              Time of Sol (LMST)
            </span>
            <div className="text-sm font-bold font-mono text-orange-400">
              {conditions.timeOfSolFormatted}
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="1479"
            step="15"
            value={timeOfSolMinutes}
            onChange={(e) => onChangeTimeOfSol(parseInt(e.target.value, 10))}
            className="w-full accent-orange-500 cursor-pointer h-2 bg-neutral-800 rounded-lg"
          />

          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <span>00:00 (Midnight)</span>
            <span className="text-cyan-300">05:45 (Dawn)</span>
            <span className="text-amber-400">12:20 (Noon)</span>
            <span className="text-orange-400">18:55 (Dusk)</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80 text-[10.5px]">
            <span className="text-neutral-400">Daylight Remaining:</span>
            <span className="font-mono font-bold text-cyan-300">
              {conditions.isDaylight ? `${conditions.daylightRemainingHours} hours left` : '0h (Night Dark)'}
            </span>
          </div>
        </div>

        {/* METEOROLOGICAL & RADIATION TELEMETRY GRID */}
        <div className="grid grid-cols-2 gap-2">
          {/* Surface & Air Temp */}
          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-white/5 space-y-1 font-mono">
            <div className="text-[10px] text-neutral-400 flex items-center gap-1 font-sans">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span>Surface / Air Temp</span>
            </div>
            <div className="text-base font-bold text-amber-300">
              {conditions.surfaceTempC}°C
            </div>
            <div className="text-[9.5px] text-neutral-400">
              Air: {conditions.airTempC}°C ({conditions.surfaceTempC + 273}K)
            </div>
          </div>

          {/* Dust & Radiation */}
          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-white/5 space-y-1 font-mono">
            <div className="text-[10px] text-neutral-400 flex items-center gap-1 font-sans">
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              <span>Radiation & Dust</span>
            </div>
            <div className="text-base font-bold text-purple-300">
              {conditions.radiationDoseMicroGyPerDay} <span className="text-[10px] font-normal">μGy/day</span>
            </div>
            <div className="text-[9.5px] text-neutral-400">
              Dust Opacity τ = {conditions.dustOpacityTau}
            </div>
          </div>
        </div>

        {/* MARSWALK RANGE CIRCLE & EVA CONSUMABLES */}
        <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-emerald-400" />
              Marswalk Range Envelope
            </span>

            <button
              type="button"
              onClick={() => onToggleRangeCircles(!showRangeCircles)}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-mono font-semibold transition cursor-pointer border ${
                showRangeCircles
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              {showRangeCircles ? 'Circles On' : 'Circles Off'}
            </button>
          </div>

          {/* EVA Duration Selector */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10.5px] text-neutral-400">EVA Duration:</span>
            {[2, 4, 6, 8].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => onChangeEvaDuration(h)}
                className={`flex-1 py-1 px-1.5 rounded-lg text-center text-[10.5px] font-mono font-bold transition cursor-pointer ${
                  evaDurationHours === h
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/80 text-[10px] font-mono">
            <div className="p-1.5 rounded bg-emerald-950/30 border border-emerald-500/30">
              <span className="text-emerald-300 block font-bold">Nominal Range (50% Reserve)</span>
              <span className="text-white text-xs font-bold">{conditions.nominalRangeKm} km</span>
            </div>

            <div className="p-1.5 rounded bg-red-950/30 border border-red-500/30">
              <span className="text-red-300 block font-bold">Point of No Return</span>
              <span className="text-white text-xs font-bold">{conditions.returnBoundaryKm} km</span>
            </div>
          </div>
        </div>

        {/* SAFETY SCORE EXPLANATION */}
        <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5 flex items-start gap-2 text-[10.5px] text-neutral-300">
          <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">EVA Safety Rating: {conditions.evaSafetyScore}/100. </strong>
            {conditions.isDaylight
              ? `Sun elevation is ${conditions.sunElevationDeg}°. Safe thermal and solar conditions for unassisted pedestrian EVA.`
              : 'Nighttime temperatures plummet to -85°C. Unassisted pedestrian EVA outside pressurized rover is strictly prohibited.'}
          </div>
        </div>
      </div>
    </div>
  );
};
