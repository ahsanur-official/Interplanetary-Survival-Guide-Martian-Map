import { useState } from 'react';
import {
  X,
  Compass,
  Shield,
  Droplets,
  Sun,
  Flame,
  Gauge,
  Sparkles,
  AlertTriangle,
  Layers,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  HUMAN_CANDIDATE_SITES,
  HumanCandidateSite,
} from '../../data/humanLandingSites';
import { marsSonification } from '../../engine/marsSonification';

interface HumanMissionModeProps {
  isOpen: boolean;
  onClose: () => void;
  onFlyToLocation: (lat: number, lng: number, zoom?: number, name?: string) => void;
  onSelectSite?: (site: HumanCandidateSite) => void;
}

export function HumanMissionMode({
  isOpen,
  onClose,
  onFlyToLocation,
  onSelectSite,
}: HumanMissionModeProps) {
  const [selectedSite, setSelectedSite] = useState<HumanCandidateSite>(HUMAN_CANDIDATE_SITES[0]);

  if (!isOpen) return null;

  const handleSelectSite = (site: HumanCandidateSite) => {
    setSelectedSite(site);
    onSelectSite?.(site);
    onFlyToLocation(site.lat, site.lng, 6, `Human Exploration Zone: ${site.name}`);
    marsSonification.sonifyLocation(site.elevationM, 2);
  };

  return (
    <div className="fixed inset-y-0 left-0 w-full sm:w-[500px] lg:w-[540px] bg-[#0b0e14]/95 backdrop-blur-md border-r border-neutral-800 z-50 flex flex-col shadow-2xl text-neutral-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
              Human Mission Mode
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                NASA HLS2 Study
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Multi-criteria landing site suitability, water-ice ISRU & safety evaluation
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          title="Close Human Mission Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Candidate Sites Horizontal Selector */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-950/40 overflow-x-auto flex gap-2">
        {HUMAN_CANDIDATE_SITES.map((site) => {
          const isSelected = selectedSite.id === site.id;
          return (
            <button
              key={site.id}
              onClick={() => handleSelectSite(site)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition border text-left flex flex-col gap-0.5 ${
                isSelected
                  ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-lg'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              <span className="font-semibold">{site.name.split('(')[0].trim()}</span>
              <span className="text-[10px] font-mono text-cyan-400">
                Index: {site.evaluation.overallSuitabilityIndex}/100
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Analysis Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-neutral-800/80">
        {/* Site Overview */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">
                  {selectedSite.region}
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-xs font-mono text-neutral-400">
                  {selectedSite.lat.toFixed(1)}°N, {selectedSite.lng.toFixed(1)}°E
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">{selectedSite.name}</h3>
              <p className="text-xs text-neutral-300 mt-1">{selectedSite.primaryAdvantage}</p>
            </div>

            <button
              onClick={() =>
                onFlyToLocation(
                  selectedSite.lat,
                  selectedSite.lng,
                  6,
                  `Human Base Candidate: ${selectedSite.name}`
                )
              }
              className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shrink-0 transition"
            >
              <Compass className="w-3.5 h-3.5" />
              Fly to Zone
            </button>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-neutral-900/80 p-3 rounded-lg border border-neutral-800">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Elevation</span>
              <span className="text-cyan-400 font-bold">{selectedSite.elevationM.toLocaleString()} m</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Suitability</span>
              <span className="text-white font-bold">{selectedSite.evaluation.overallSuitabilityIndex} / 100</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Ice Depth</span>
              <span className="text-emerald-400 font-bold">{selectedSite.iceEvidence.depthM} m</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Base Profile</span>
              <span className="text-amber-400 font-bold truncate block">{selectedSite.isruCapacity.baseType.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* Multi-Criteria Evaluation Radar/Bar Scores */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase font-mono tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" />
              Engineering & Environmental Suitability Model
            </h4>
            <span className="text-[10px] font-mono text-emerald-400">[Derived Analysis]</span>
          </div>

          <div className="space-y-2 text-xs">
            {/* 1. Atmospheric Braking */}
            <div>
              <div className="flex justify-between text-neutral-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Atmospheric Entry Aerobraking Margin
                </span>
                <span className="font-mono text-cyan-400">
                  {selectedSite.evaluation.atmosphericBrakingScore}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${selectedSite.evaluation.atmosphericBrakingScore}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500 block mt-0.5">
                Low elevation allows aerodynamic drag to safely slow heavy human landers.
              </span>
            </div>

            {/* 2. Solar & Thermal Stability */}
            <div>
              <div className="flex justify-between text-neutral-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Thermal & Photovoltaic Solar Insolation
                </span>
                <span className="font-mono text-cyan-400">
                  {selectedSite.evaluation.solarThermalScore}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${selectedSite.evaluation.solarThermalScore}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500 block mt-0.5">
                Moderate latitude reduces polar winter cryogenic darkness.
              </span>
            </div>

            {/* 3. Water-Ice ISRU Abundance */}
            <div>
              <div className="flex justify-between text-neutral-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  Water-Ice ISRU Extraction Viability
                </span>
                <span className="font-mono text-cyan-400">
                  {selectedSite.evaluation.isruWaterScore}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${selectedSite.evaluation.isruWaterScore}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500 block mt-0.5">
                {selectedSite.iceEvidence.type} — {selectedSite.iceEvidence.depthDisplay}
              </span>
            </div>

            {/* 4. Terrain Landing Safety */}
            <div>
              <div className="flex justify-between text-neutral-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Terrain Landing Safety (Slope & Boulders)
                </span>
                <span className="font-mono text-cyan-400">
                  {selectedSite.evaluation.terrainSafetyScore}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${selectedSite.evaluation.terrainSafetyScore}%` }}
                />
              </div>
            </div>

            {/* 5. Scientific Diversity */}
            <div>
              <div className="flex justify-between text-neutral-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Astrobiological & Geological Science Diversity
                </span>
                <span className="font-mono text-cyan-400">
                  {selectedSite.evaluation.scienceDiversityScore}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${selectedSite.evaluation.scienceDiversityScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ISRU Propellant Production Simulation */}
        <div className="pt-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase font-mono tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              In-Situ Resource Utilization (ISRU) Production
            </h4>
            <span className="text-[10px] font-mono text-purple-400">[Simulated Model]</span>
          </div>

          <div className="bg-neutral-900/70 p-3 rounded-lg border border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-400">Extraction Difficulty:</span>
              <span className="text-white font-mono">{selectedSite.isruCapacity.waterExtractionDifficulty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Return Propellant Fill Sol Duration:</span>
              <span className="text-amber-400 font-mono font-bold">
                {selectedSite.isruCapacity.estPropellantProductionDays} Sols
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Subsurface Radar Confidence:</span>
              <span className="text-emerald-400 font-mono">{selectedSite.iceEvidence.radarConfidence}</span>
            </div>
          </div>
        </div>

        {/* Hazards & Constraints */}
        <div className="pt-4 space-y-2">
          <h4 className="text-xs font-semibold uppercase font-mono tracking-wider text-neutral-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Operational Hazards & Environmental Constraints
          </h4>
          <ul className="space-y-1.5 text-xs text-neutral-300">
            {selectedSite.hazards.map((hazard, i) => (
              <li key={i} className="flex items-start gap-2 bg-amber-950/20 border border-amber-900/40 p-2 rounded">
                <span className="text-amber-400 font-bold">•</span>
                <span>{hazard}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Scientific Objectives */}
        <div className="pt-4 space-y-2">
          <h4 className="text-xs font-semibold uppercase font-mono tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Core Human Surface Exploration Objectives
          </h4>
          <ul className="space-y-1 text-xs text-neutral-300">
            {selectedSite.scientificObjectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 bg-neutral-900/50 border border-neutral-800 p-2 rounded">
                <span className="text-cyan-400 font-bold">•</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Scientific Attribution */}
        <div className="pt-4 text-[11px] font-mono text-neutral-500 flex items-center justify-between">
          <span>Source: {selectedSite.dataSource}</span>
          <span className="text-cyan-400">[Observed + Derived + Simulated]</span>
        </div>
      </div>
    </div>
  );
}
