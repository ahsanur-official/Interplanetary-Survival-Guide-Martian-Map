import React, { useEffect } from 'react';
import {
  X,
  Compass,
  Clock,
  Orbit,
  AlertTriangle,
  Info,
  Rocket,
  Maximize2,
} from 'lucide-react';

export interface MarsMoonData {
  id: 'phobos' | 'deimos';
  name: string;
  tagline: string;
  semiMajorAxisKm: number;
  altitudeAboveSurfaceKm: number;
  orbitalPeriodHours: number;
  orbitalPeriodDisplay: string;
  dimensionsKm: string;
  meanRadiusKm: number;
  massKg: string;
  surfaceGravity: string;
  escapeVelocityKmH: number;
  albedo: number;
  apparentMagnitude: number;
  discoveryYear: number;
  discoverer: string;
  majorFeatures: string[];
  scientificSummary: string;
  futureFate: string;
  missions: string[];
}

export const MARS_MOONS_DATA: Record<'phobos' | 'deimos', MarsMoonData> = {
  phobos: {
    id: 'phobos',
    name: 'Phobos',
    tagline: 'Innermost & Largest Martian Natural Satellite',
    semiMajorAxisKm: 9376,
    altitudeAboveSurfaceKm: 5980,
    orbitalPeriodHours: 7.65,
    orbitalPeriodDisplay: '7h 39m 12s (3.2 orbits per Martian Sol)',
    dimensionsKm: '26.8 × 22.4 × 18.4 km',
    meanRadiusKm: 11.26,
    massKg: '1.066 × 10¹⁶ kg',
    surfaceGravity: '0.0057 m/s² (0.00058 g)',
    escapeVelocityKmH: 40.7, // 11.3 m/s
    albedo: 0.071, // extremely dark, carbonaceous chondrite
    apparentMagnitude: 11.8,
    discoveryYear: 1877,
    discoverer: 'Asaph Hall (US Naval Observatory)',
    majorFeatures: [
      'Stickney Crater (9 km diameter — nearly half the width of Phobos)',
      'Parallel linear grooves & fracture lineaments across surface',
      'Limtoc and Hall impact craters',
    ],
    scientificSummary:
      'Phobos orbits closer to its primary planet than any other moon in the Solar System. Because its orbital period is shorter than a Martian Sol, it rises in the west, travels rapidly across the Martian sky in 4 hours 15 minutes, and sets in the east twice each Martian day.',
    futureFate:
      'Tidal deceleration is drawing Phobos inward by ~1.8 cm per year. In approximately 30 to 50 million years, it will cross the Martian fluid Roche limit and either break apart into a dense planetary ring system or collide with the surface.',
    missions: [
      'Mariner 9 (First close-up orbital imagery, 1971)',
      'Viking 1 Orbiter (Detailed mapping, 1977)',
      'Mars Express (High-resolution HRSC & OMEGA flybys)',
      'JAXA MMX (Martian Moons eXploration sample return mission)',
    ],
  },
  deimos: {
    id: 'deimos',
    name: 'Deimos',
    tagline: 'Outermost & Smaller Martian Natural Satellite',
    semiMajorAxisKm: 23463,
    altitudeAboveSurfaceKm: 20063,
    orbitalPeriodHours: 30.3,
    orbitalPeriodDisplay: '30h 18m (Longer than 1 Martian Sol)',
    dimensionsKm: '15.0 × 12.2 × 11.0 km',
    meanRadiusKm: 6.2,
    massKg: '1.476 × 10¹⁵ kg',
    surfaceGravity: '0.003 m/s² (0.0003 g)',
    escapeVelocityKmH: 20.2, // 5.6 m/s
    albedo: 0.068,
    apparentMagnitude: 12.89,
    discoveryYear: 1877,
    discoverer: 'Asaph Hall (US Naval Observatory)',
    majorFeatures: [
      'Swift Crater (1 km diameter) & Voltaire Crater (1.9 km)',
      'Thick smooth regolith dust blanket (fills in craters up to 100m deep)',
      'Bright albedo streaks across low-relief ridges',
    ],
    scientificSummary:
      'Deimos orbits just beyond synchronous orbit distance (17,000 km). Because its orbital period (30.3 hours) is slightly longer than the Martian day (24.6 hours), it rises in the east very slowly, taking 2.7 Martian sols (64 hours) to cross the sky before setting in the west.',
    futureFate:
      'Unlike Phobos, Deimos orbits outside Mars synchronous radius. Tidal forces are slowly accelerating Deimos, causing its orbit to gradually spiral outward away from Mars, maintaining orbital stability.',
    missions: [
      'Viking 1 & 2 Orbiters (First close flybys, 1977)',
      'MRO HiRISE (Color imaging of regolith cover)',
      'Hope Mars Mission (UAE - First high-altitude ultraviolet/infrared flybys)',
    ],
  },
};

interface MarsMoonDossierModalProps {
  isOpen: boolean;
  moonId: 'phobos' | 'deimos' | null;
  onClose: () => void;
  onFocusMoon?: (moonId: 'phobos' | 'deimos') => void;
}

export const MarsMoonDossierModal: React.FC<MarsMoonDossierModalProps> = ({
  isOpen,
  moonId,
  onClose,
  onFocusMoon,
}) => {
  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !moonId) return null;

  const data = MARS_MOONS_DATA[moonId];

  const handleClose = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto select-text"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-[#0b0f19] border border-orange-500/40 rounded-2xl shadow-2xl overflow-hidden text-neutral-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-neutral-800 bg-[#0e1422] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-400 border border-cyan-800/80 font-mono text-[10px] font-bold uppercase tracking-wider">
                Natural Martian Satellite
              </span>
              <span className="text-xs font-mono text-neutral-400">
                Discovered {data.discoveryYear} by {data.discoverer}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
              <span>{data.name}</span>
              <span className="text-xs font-mono font-normal text-orange-400 border border-orange-800/80 px-2 py-0.5 rounded-md bg-orange-950/60">
                {data.dimensionsKm}
              </span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">{data.tagline}</p>
          </div>

          <button
            type="button"
            aria-label="Close moon dossier"
            onClick={handleClose}
            onTouchEnd={handleClose}
            className="p-2 rounded-xl bg-neutral-800/90 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-all cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Key Orbital Telemetry Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800">
              <div className="flex items-center gap-1.5 text-neutral-400 text-[10.5px] font-mono">
                <Orbit className="w-3.5 h-3.5 text-cyan-400" />
                <span>Orbit Distance</span>
              </div>
              <span className="text-sm font-bold text-white mt-1 block font-mono">
                {data.semiMajorAxisKm.toLocaleString()} km
              </span>
              <span className="text-[10px] text-neutral-500 block">
                {data.altitudeAboveSurfaceKm.toLocaleString()} km above surface
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800">
              <div className="flex items-center gap-1.5 text-neutral-400 text-[10.5px] font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Orbital Period</span>
              </div>
              <span className="text-sm font-bold text-amber-300 mt-1 block font-mono">
                {data.orbitalPeriodHours} hours
              </span>
              <span className="text-[10px] text-neutral-400 block truncate">
                {data.orbitalPeriodDisplay}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-neutral-400 text-[10.5px] font-mono">
                <Compass className="w-3.5 h-3.5 text-rose-400" />
                <span>Surface Gravity</span>
              </div>
              <span className="text-sm font-bold text-rose-300 mt-1 block font-mono">
                {data.surfaceGravity}
              </span>
              <span className="text-[10px] text-neutral-500 block">
                Escape Vel: {data.escapeVelocityKmH} km/h
              </span>
            </div>
          </div>

          {/* Scientific Overview */}
          <div className="p-3.5 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider font-mono">
              <Info className="w-3.5 h-3.5 text-orange-400" />
              <span>Astrodynamics & Orbit Characteristics</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {data.scientificSummary}
            </p>
          </div>

          {/* Major Geologic Features */}
          <div className="p-3.5 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block">
              Morphology & Key Geological Formations
            </span>
            <ul className="space-y-1.5 text-xs text-neutral-300">
              {data.majorFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Future Astrodynamic Evolution / Roche Fate */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Orbital Evolution & Future Planetary Fate</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {data.futureFate}
            </p>
          </div>

          {/* Robotic Exploration Missions */}
          <div className="p-3.5 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider font-mono">
              <Rocket className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exploration Heritage & Spacecraft Flybys</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-neutral-400 font-mono">
              {data.missions.map((m, i) => (
                <div key={i} className="p-1.5 rounded bg-neutral-950/80 border border-neutral-800/70">
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-neutral-800 bg-[#0a0e1a] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] font-mono text-neutral-400">
            Mass: <strong className="text-white font-mono">{data.massKg}</strong>
          </div>

          <div className="flex items-center gap-2">
            {onFocusMoon && (
              <button
                type="button"
                onClick={() => {
                  onFocusMoon(data.id);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Track Moon in 3D</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              onTouchEnd={handleClose}
              className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors cursor-pointer border border-neutral-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
