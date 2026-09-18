import {
  MarsCoordinate,
  MarsRegion,
  ScienceTarget,
  RoverObservation,
  HazardZone,
  ResourceSite,
  EnvironmentalConditions,
} from '../../types/mars';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { calculateMarsDistanceMeters } from '../../engine/spatialMath';
import {
  X,
  Compass,
  Mountain,
  Thermometer,
  Shield,
  Droplets,
  Disc,
  Radio,
  FileText,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

interface LocationIntelDrawerProps {
  coordinate: MarsCoordinate | null;
  elevation: number;
  slope: number;
  region: MarsRegion;
  environment: EnvironmentalConditions;
  scienceTargets: ScienceTarget[];
  roverObservations: RoverObservation[];
  hazardZones: HazardZone[];
  resourceSites: ResourceSite[];
  selectedScienceTarget: ScienceTarget | null;
  selectedHazard: HazardZone | null;
  selectedResource: ResourceSite | null;
  onClose: () => void;
  onAddScienceTargetToObjectives?: (targetId: string) => void;
}

export function LocationIntelDrawer({
  coordinate,
  elevation,
  slope,
  region,
  environment,
  scienceTargets,
  roverObservations,
  hazardZones,
  resourceSites,
  selectedScienceTarget,
  selectedHazard,
  selectedResource,
  onClose,
  onAddScienceTargetToObjectives,
}: LocationIntelDrawerProps) {
  if (!coordinate && !selectedScienceTarget && !selectedHazard && !selectedResource) {
    return null;
  }

  // Active target coords
  const activeCoord: MarsCoordinate =
    selectedScienceTarget?.coordinate ||
    selectedHazard?.coordinate ||
    selectedResource?.coordinate ||
    coordinate || { latitude: 0, longitude: 0 };

  // Nearest science target
  let nearestScience: { target: ScienceTarget; distMeters: number } | null = null;
  for (const st of scienceTargets) {
    const d = calculateMarsDistanceMeters(activeCoord, st.coordinate);
    if (!nearestScience || d < nearestScience.distMeters) {
      nearestScience = { target: st, distMeters: Math.round(d) };
    }
  }

  // Nearest rover observation
  let nearestRover: { obs: RoverObservation; distMeters: number } | null = null;
  for (const ro of roverObservations) {
    const d = calculateMarsDistanceMeters(activeCoord, ro.coordinate);
    if (!nearestRover || d < nearestRover.distMeters) {
      nearestRover = { obs: ro, distMeters: Math.round(d) };
    }
  }

  // Nearest hazard
  let nearestHazard: { haz: HazardZone; distMeters: number } | null = null;
  for (const hz of hazardZones) {
    const d = calculateMarsDistanceMeters(activeCoord, hz.coordinate);
    if (!nearestHazard || d < nearestHazard.distMeters) {
      nearestHazard = { haz: hz, distMeters: Math.round(d) };
    }
  }

  // Nearest resource site
  let nearestResource: { res: ResourceSite; distMeters: number } | null = null;
  for (const rs of resourceSites) {
    const d = calculateMarsDistanceMeters(activeCoord, rs.coordinate);
    if (!nearestResource || d < nearestResource.distMeters) {
      nearestResource = { res: rs, distMeters: Math.round(d) };
    }
  }

  // Slope trafficability classification
  const trafficability =
    slope > 20 ? 'IMPASSABLE' : slope > 14 ? 'HAZARDOUS' : slope > 8 ? 'MODERATE' : 'GOOD';
  const trafficabilityColor =
    trafficability === 'IMPASSABLE'
      ? 'text-red-400 border-red-500/40 bg-red-950/40'
      : trafficability === 'HAZARDOUS'
      ? 'text-orange-400 border-orange-500/40 bg-orange-950/40'
      : trafficability === 'MODERATE'
      ? 'text-amber-400 border-amber-500/40 bg-amber-950/40'
      : 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';

  return (
    <div className="bg-neutral-900/95 border-t lg:border-t-0 lg:border-l border-neutral-800 p-4 font-mono text-xs text-neutral-300 shadow-2xl overflow-y-auto max-h-[480px] lg:max-h-none h-full space-y-4">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-orange-400" />
          <span className="font-bold text-white uppercase tracking-wider text-sm">
            Location Intelligence
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Entity Banner (if user clicked a specific target/hazard) */}
      {selectedScienceTarget && (
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-600/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-amber-400" />
              SCIENTIFIC TARGET
            </span>
            <ProvenanceBadge status={selectedScienceTarget.provenance.status} />
          </div>
          <div className="text-sm font-bold text-white">{selectedScienceTarget.name}</div>
          <div className="text-[11px] text-neutral-300 leading-relaxed">
            {selectedScienceTarget.description}
          </div>
          <div className="bg-neutral-950/70 p-2 rounded text-[10px] space-y-1">
            <div className="text-amber-400 font-semibold">Hypothesized Significance:</div>
            <div className="text-neutral-400">{selectedScienceTarget.hypothesizedSignificance}</div>
            <div className="text-neutral-500">Instruments: {selectedScienceTarget.recommendedInstruments.join(', ')}</div>
          </div>
        </div>
      )}

      {selectedHazard && (
        <div className="p-3 rounded-lg bg-red-950/30 border border-red-600/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-red-300 text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              IDENTIFIED HAZARD ZONE
            </span>
            <ProvenanceBadge status={selectedHazard.provenance.status} />
          </div>
          <div className="text-sm font-bold text-white">{selectedHazard.name}</div>
          <div className="text-[11px] text-neutral-300 leading-relaxed">
            {selectedHazard.description}
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-neutral-400">Risk Level:</span>
            <strong className="text-red-400 font-bold">{selectedHazard.riskLevel}</strong>
            <span className="text-neutral-400">| Radius:</span>
            <strong className="text-white">{selectedHazard.radiusMeters}m</strong>
          </div>
        </div>
      )}

      {selectedResource && (
        <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-600/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              WATER/ICE & MINERAL RESOURCE PROXY
            </span>
            <ProvenanceBadge status={selectedResource.provenance.status} />
          </div>
          <div className="text-sm font-bold text-white">{selectedResource.name}</div>
          <div className="text-[11px] text-neutral-300 leading-relaxed">
            {selectedResource.description}
          </div>
          <div className="bg-neutral-950/70 p-2 rounded text-[10px] space-y-1">
            <div>Detection Method: <strong className="text-cyan-300">{selectedResource.detectionMethod}</strong></div>
            <div>Estimated Abundance: <strong className="text-white">{selectedResource.estimatedAbundance}</strong></div>
          </div>
        </div>
      )}

      {/* 1. Spatial Coordinates & Quad */}
      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-1.5">
        <div className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
          GEODETIC LOCATION
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-neutral-500">Latitude: </span>
            <span className="text-orange-300 font-bold">{activeCoord.latitude.toFixed(4)}°N</span>
          </div>
          <div>
            <span className="text-neutral-500">Longitude: </span>
            <span className="text-orange-300 font-bold">{activeCoord.longitude.toFixed(4)}°E</span>
          </div>
        </div>
        <div className="text-[10px] text-neutral-500">
          Region: <span className="text-neutral-300">{region.name}</span>
        </div>
      </div>

      {/* 2. Topography & Trafficability */}
      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Mountain className="w-3.5 h-3.5 text-amber-400" />
            TERRAIN & TRAVERSABILITY
          </span>
          <ProvenanceBadge status="DERIVED" size="sm" />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
            <div className="text-neutral-500 text-[9px]">ELEVATION</div>
            <div className="font-bold text-cyan-300">{elevation} m</div>
          </div>
          <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
            <div className="text-neutral-500 text-[9px]">LOCAL SLOPE</div>
            <div className={`font-bold ${slope > 14 ? 'text-red-400' : 'text-emerald-300'}`}>
              {slope}°
            </div>
          </div>
          <div className={`p-2 rounded border flex flex-col justify-center ${trafficabilityColor}`}>
            <div className="text-[9px] font-medium opacity-80">SUIT MOBILITY</div>
            <div className="font-bold text-[10px]">{trafficability}</div>
          </div>
        </div>
      </div>

      {/* 3. Environment & Radiation */}
      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            ENVIRONMENT & RADIATION
          </span>
          <ProvenanceBadge status={environment.dataStatus} size="sm" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
            <span className="text-neutral-500 block text-[9px]">DIURNAL TEMP</span>
            <span className="text-cyan-300 font-bold">
              {environment.diurnalTempRangeCelsius[0]}°C to {environment.diurnalTempRangeCelsius[1]}°C
            </span>
          </div>
          <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
            <span className="text-neutral-500 block text-[9px]">ATMOSPHERIC PRESSURE</span>
            <span className="text-white font-bold">{environment.atmosphericPressurePascals} Pa</span>
          </div>
        </div>

        <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 text-[10px]">DOSE RATE (MSL RAD CALIBRATED):</span>
            <span className="text-amber-400 font-bold">{environment.radiationDoseRateMicroGyPerDay} μGy/day</span>
          </div>
          <div className="text-[9px] text-neutral-500">
            Shielding index: {(environment.effectiveShieldingIndex * 100).toFixed(0)}% (atmospheric column depth at {elevation}m MOLA datum).
          </div>
        </div>
      </div>

      {/* 4. Proximity to Science & Rover History */}
      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-2">
        <div className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
          PROXIMITY RADIAL SCOUTING
        </div>

        {nearestScience && (
          <div className="flex items-center justify-between bg-neutral-900/80 p-2 rounded text-[10px]">
            <div>
              <div className="text-amber-300 font-bold">{nearestScience.target.name}</div>
              <div className="text-neutral-500">Scientific Value: {nearestScience.target.scientificValueScore}/10</div>
            </div>
            <span className="text-neutral-400 font-mono font-bold">{nearestScience.distMeters} m</span>
          </div>
        )}

        {nearestRover && (
          <div className="flex items-center justify-between bg-neutral-900/80 p-2 rounded text-[10px]">
            <div>
              <div className="text-purple-300 font-bold">{nearestRover.obs.mission} (Sol {nearestRover.obs.sol})</div>
              <div className="text-neutral-500">{nearestRover.obs.targetName} ({nearestRover.obs.instrument})</div>
            </div>
            <span className="text-neutral-400 font-mono font-bold">{nearestRover.distMeters} m</span>
          </div>
        )}
      </div>

      {/* 5. Provenance & Source Metadata */}
      <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] space-y-1 text-neutral-400">
        <div className="flex items-center gap-1.5 text-neutral-300 font-semibold">
          <FileText className="w-3 h-3 text-orange-400" />
          <span>DATA PROVENANCE & CALIBRATION</span>
        </div>
        <div>Source: NASA PDS Geosciences & Atmospheres Nodes</div>
        <div>Instruments: MOLA, HiRISE, CRISM, MEDA, RAD</div>
        <div className="text-neutral-500 italic">
          Disclaimer: Prototype decision-support system for 2026 NASA Space Apps Challenge. Not approved for flight navigation.
        </div>
      </div>
    </div>
  );
}
