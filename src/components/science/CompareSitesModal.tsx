import { useState, useMemo } from 'react';
import {
  X,
  Compass,
  ArrowRightLeft,
  Mountain,
  Droplets,
  Gauge,
  Sparkles,
  Calendar,
  Layers,
  Thermometer,
  Shield,
} from 'lucide-react';
import { ALL_MARS_FEATURES, MarsFeature } from '../../data/marsNomenclature';
import { analyzeMarsLocationScience } from '../../engine/marsEnvironmentalAnalysis';
import { marsSonification } from '../../engine/marsSonification';

interface CompareSitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlyToLocation: (lat: number, lng: number, zoom?: number, name?: string) => void;
  initialSite1Id?: string;
  initialSite2Id?: string;
}

const COMPARISON_PRESETS = [
  {
    name: 'Jezero Delta vs. Gale Crater (Rovers)',
    site1: 'perseverance',
    site2: 'curiosity',
  },
  {
    name: 'Olympus Mons vs. Valles Marineris (Megastructures)',
    site1: 'olympus_mons',
    site2: 'valles_marineris',
  },
  {
    name: 'Arcadia Planitia vs. Jezero (Human Landing)',
    site1: 'arcadia_planitia',
    site2: 'perseverance',
  },
  {
    name: 'North Polar Cap vs. South Polar Cap',
    site1: 'planum_boreum',
    site2: 'planum_australe',
  },
];

export function CompareSitesModal({
  isOpen,
  onClose,
  onFlyToLocation,
  initialSite1Id = 'perseverance',
  initialSite2Id = 'curiosity',
}: CompareSitesModalProps) {
  const [site1Id, setSite1Id] = useState<string>(initialSite1Id);
  const [site2Id, setSite2Id] = useState<string>(initialSite2Id);

  const site1 = useMemo(() => {
    return ALL_MARS_FEATURES.find((f) => f.id === site1Id) || ALL_MARS_FEATURES[0];
  }, [site1Id]);

  const site2 = useMemo(() => {
    return ALL_MARS_FEATURES.find((f) => f.id === site2Id) || ALL_MARS_FEATURES[1];
  }, [site2Id]);

  const site1Science = useMemo(() => {
    return analyzeMarsLocationScience(site1.lat, site1.lng, site1.elevationM);
  }, [site1]);

  const site2Science = useMemo(() => {
    return analyzeMarsLocationScience(site2.lat, site2.lng, site2.elevationM);
  }, [site2]);

  if (!isOpen) return null;

  const handleApplyPreset = (s1: string, s2: string) => {
    setSite1Id(s1);
    setSite2Id(s2);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-5xl bg-[#0c1017] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-neutral-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
                Planetary Location Comparison Matrix
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                  Dual GIS Analysis
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Side-by-side geological, hydrological, and environmental evaluation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Presets bar */}
        <div className="px-4 py-2 border-b border-neutral-800/80 bg-neutral-950/40 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-neutral-500 font-mono text-[11px] shrink-0">Presets:</span>
          {COMPARISON_PRESETS.map((preset, i) => (
            <button
              key={i}
              onClick={() => handleApplyPreset(preset.site1, preset.site2)}
              className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white whitespace-nowrap transition text-xs"
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Dual Selection Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border-b border-neutral-800/80 bg-neutral-950/20">
          {/* Site 1 Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-indigo-400 uppercase font-bold flex items-center justify-between">
              <span>Location A (Primary Target)</span>
              <button
                onClick={() => {
                  marsSonification.sonifyLocation(site1.elevationM, 2);
                  onFlyToLocation(site1.lat, site1.lng, 6, site1.name);
                }}
                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <Compass className="w-3 h-3 text-indigo-400" /> Fly to A
              </button>
            </label>
            <select
              value={site1Id}
              onChange={(e) => setSite1Id(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg p-2 focus:outline-none focus:border-indigo-500"
            >
              {ALL_MARS_FEATURES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.type})
                </option>
              ))}
            </select>
          </div>

          {/* Site 2 Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-orange-400 uppercase font-bold flex items-center justify-between">
              <span>Location B (Comparative Target)</span>
              <button
                onClick={() => {
                  marsSonification.sonifyLocation(site2.elevationM, 2);
                  onFlyToLocation(site2.lat, site2.lng, 6, site2.name);
                }}
                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <Compass className="w-3 h-3 text-orange-400" /> Fly to B
              </button>
            </label>
            <select
              value={site2Id}
              onChange={(e) => setSite2Id(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg p-2 focus:outline-none focus:border-orange-500"
            >
              {ALL_MARS_FEATURES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Matrix Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="border border-neutral-800 rounded-lg overflow-hidden divide-y divide-neutral-800/70 text-xs font-mono">
            {/* Header Titles */}
            <div className="grid grid-cols-2 bg-neutral-900/90 font-bold text-sm">
              <div className="p-3 border-r border-neutral-800 text-indigo-300 flex items-center justify-between">
                <span>{site1.name}</span>
                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/60">
                  {site1.type}
                </span>
              </div>
              <div className="p-3 text-orange-300 flex items-center justify-between">
                <span>{site2.name}</span>
                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-orange-950 text-orange-400 border border-orange-800/60">
                  {site2.type}
                </span>
              </div>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 divide-x divide-neutral-800">
              <div className="p-2.5">
                <span className="text-[10px] text-neutral-500 uppercase block">Coordinates</span>
                <span className="text-white">
                  {site1.lat.toFixed(2)}°N, {site1.lng.toFixed(2)}°E
                </span>
              </div>
              <div className="p-2.5">
                <span className="text-[10px] text-neutral-500 uppercase block">Coordinates</span>
                <span className="text-white">
                  {site2.lat.toFixed(2)}°N, {site2.lng.toFixed(2)}°E
                </span>
              </div>
            </div>

            {/* Elevation */}
            <div className="grid grid-cols-2 divide-x divide-neutral-800 bg-neutral-900/30">
              <div className="p-2.5">
                <span className="text-[10px] text-neutral-500 uppercase block">MOLA Elevation</span>
                <span className="text-indigo-400 font-bold text-sm">
                  {site1.elevationM.toLocaleString()} meters
                </span>
              </div>
              <div className="p-2.5">
                <span className="text-[10px] text-neutral-500 uppercase block">MOLA Elevation</span>
                <span className="text-orange-400 font-bold text-sm">
                  {site2.elevationM.toLocaleString()} meters
                </span>
              </div>
            </div>

            {/* Water & Ice Presence */}
            <div className="grid grid-cols-2 divide-x divide-neutral-800">
              <div className="p-2.5 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase block flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-blue-400" />
                  Hydrological / Ice Presence
                </span>
                <span className="text-white font-medium block">
                  {site1Science.water.presenceType}
                </span>
                <span className="text-[11px] text-neutral-400 block">
                  {site1Science.water.probabilityRating} — {site1Science.water.abundanceDisplay}
                </span>
              </div>
              <div className="p-2.5 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase block flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-blue-400" />
                  Hydrological / Ice Presence
                </span>
                <span className="text-white font-medium block">
                  {site2Science.water.presenceType}
                </span>
                <span className="text-[11px] text-neutral-400 block">
                  {site2Science.water.probabilityRating} — {site2Science.water.abundanceDisplay}
                </span>
              </div>
            </div>

            {/* Atmospheric Surface Pressure */}
            <div className="grid grid-cols-2 divide-x divide-neutral-800 bg-neutral-900/30">
              <div className="p-2.5">
                <span className="text-[10px] text-neutral-500 uppercase block flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-neutral-400" />
                  Surface Atmospheric Pressure
                </span>
                <span className="text-white font-bold">
                  {site1Science.atmosphere.pressureDisplay}
                </span>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  {site1Science.atmosphere.summary}
                </span>
              </div>
              <div className="p-2.5">
                <span className="text-[10px] text-neutral-500 uppercase block flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-neutral-400" />
                  Surface Atmospheric Pressure
                </span>
                <span className="text-white font-bold">
                  {site2Science.atmosphere.pressureDisplay}
                </span>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  {site2Science.atmosphere.summary}
                </span>
              </div>
            </div>

            {/* Surface Temperature & Radiation */}
            <div className="grid grid-cols-2 divide-x divide-neutral-800">
              <div className="p-2.5">
                <span className="text-[10px] text-neutral-500 uppercase block flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-400" />
                  Diurnal Temperature & Radiation
                </span>
                <span className="text-white">{site1Science.humanSafety.tempDisplay}</span>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  Radiation: {site1Science.humanSafety.radiationDisplay}
                </span>
              </div>
              <div className="p-2.5">
                <span className="text-[10px] text-neutral-500 uppercase block flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-400" />
                  Diurnal Temperature & Radiation
                </span>
                <span className="text-white">{site2Science.humanSafety.tempDisplay}</span>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  Radiation: {site2Science.humanSafety.radiationDisplay}
                </span>
              </div>
            </div>

            {/* Scientific Description & Historical Context */}
            <div className="grid grid-cols-2 divide-x divide-neutral-800 bg-neutral-900/30">
              <div className="p-2.5 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase block">Geological Significance</span>
                <p className="text-neutral-300 font-sans leading-relaxed text-xs">{site1.description}</p>
              </div>
              <div className="p-2.5 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase block">Geological Significance</span>
                <p className="text-neutral-300 font-sans leading-relaxed text-xs">{site2.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
