import React from 'react';
import {
  X,
  MapPin,
  Mountain,
  Compass,
  Layers,
  Droplets,
  Wind,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Maximize2,
  Globe2,
  Check,
  Navigation,
  ChevronRight,
} from 'lucide-react';
import { MarsFeature } from '../../data/marsNomenclature';
import { analyzeMarsLocationScience } from '../../engine/marsEnvironmentalAnalysis';
import { EARTH_MARS_COMPARISONS } from '../../data/earthMarsComparisons';

interface MarsPlaceIdentifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: MarsFeature | null;
  onFlyTo?: (lat: number, lng: number, zoom?: number) => void;
  onOpenNASACloseUp?: (featureName: string) => void;
  onOpenEarthComparison?: (featureId: string) => void;
  onAddToRoute?: (feature: MarsFeature) => void;
}

export const MarsPlaceIdentifierModal: React.FC<MarsPlaceIdentifierModalProps> = ({
  isOpen,
  onClose,
  feature,
  onFlyTo,
  onOpenNASACloseUp,
  onOpenEarthComparison,
  onAddToRoute,
}) => {
  const [copiedCoords, setCopiedCoords] = React.useState<boolean>(false);

  if (!isOpen || !feature) return null;

  const science = analyzeMarsLocationScience(
    feature.lat,
    feature.lng,
    feature.elevationM
  );

  // Check if there is an Earth comparison for this feature
  const earthComparison = EARTH_MARS_COMPARISONS.find(
    (c) =>
      c.marsFeatureId === feature.id ||
      feature.name.toLowerCase().includes(c.marsName.toLowerCase().split('(')[0].trim())
  );

  // Geological term definitions based on USGS planetary nomenclature
  const getGeologicDefinition = (type: string) => {
    switch (type) {
      case 'Mons (Volcano)':
        return {
          term: 'Mons (pl. Montes)',
          meaning: 'Mountain or massive volcanic edifice. Formed by stationary mantle plumes over billions of years due to the absence of plate tectonics on Mars.',
          color: 'from-rose-500/20 to-orange-500/10 border-rose-500/40 text-rose-300',
        };
      case 'Crater':
        return {
          term: 'Crater',
          meaning: 'Circular impact excavation caused by asteroids or comets striking the Martian crust, often featuring central uplift peaks and terraced rim walls.',
          color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/40 text-purple-300',
        };
      case 'Chasma (Canyon)':
        return {
          term: 'Chasma (pl. Chasmata)',
          meaning: 'Deep, elongated, steep-sided canyon or rift valley. Formed primarily by tectonic crustal rifting and colossal subsurface magma displacement.',
          color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/40 text-blue-300',
        };
      case 'Vallis (Valley/Riverbed)':
        return {
          term: 'Vallis (pl. Valles)',
          meaning: 'Sinuous valley or channel network carved by ancient catastrophic megafloods, glacial melt, or perennial river systems during the Noachian/Hesperian eras.',
          color: 'from-teal-500/20 to-emerald-500/10 border-teal-500/40 text-teal-300',
        };
      case 'Planitia (Plain)':
        return {
          term: 'Planitia (pl. Planitiae)',
          meaning: 'Low-elevation smooth plain, frequently corresponding to colossal ancient impact basins filled with smooth basaltic lava flows or ancient ocean sediments.',
          color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/40 text-amber-300',
        };
      case 'Terra (Highland)':
        return {
          term: 'Terra (pl. Terrae)',
          meaning: 'Extensive, heavily cratered ancient crustal highlands formed during the heavy bombardment period ~4 billion years ago.',
          color: 'from-orange-500/20 to-amber-500/10 border-orange-500/40 text-orange-300',
        };
      case 'Polar Cap/Ice':
        return {
          term: 'Planum / Polar Ice',
          meaning: 'Permanent or seasonal polar ice sheets composed of alternating layers of water ice, frozen carbon dioxide (dry ice), and windblown atmospheric dust.',
          color: 'from-cyan-500/20 to-sky-500/10 border-cyan-500/40 text-cyan-300',
        };
      case 'Robotic Rover/Lander':
        return {
          term: 'Robotic Exploration Site',
          meaning: 'Historical landing site of robotic rovers, landers, or airborne probes deployed by NASA, ESA, or CNSA to investigate habitability, geology, and past life.',
          color: 'from-emerald-500/20 to-cyan-500/10 border-emerald-500/40 text-emerald-300',
        };
      default:
        return {
          term: feature.type,
          meaning: 'Official planetary surface feature cataloged by the International Astronomical Union (IAU) and USGS Astrogeology Science Center.',
          color: 'from-neutral-800 to-neutral-900 border-neutral-700 text-neutral-300',
        };
    }
  };

  const geo = getGeologicDefinition(feature.type);

  // Elevation gauge calculation (-8200m Hellas to +21287m Olympus)
  const minElev = -8200;
  const maxElev = 22000;
  const elevPercent = Math.max(
    0,
    Math.min(100, ((feature.elevationM - minElev) / (maxElev - minElev)) * 100)
  );

  const copyCoordinates = () => {
    const coordStr = `${feature.lat.toFixed(4)}°N, ${feature.lng.toFixed(4)}°E (Planetocentric: ${feature.planetocentricLng?.toFixed(2) || (feature.lng < 0 ? feature.lng + 360 : feature.lng).toFixed(2)}°E)`;
    navigator.clipboard.writeText(coordStr);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0b0f19] border border-orange-500/60 rounded-2xl shadow-2xl shadow-black flex flex-col overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-orange-950/40 border-b border-neutral-800 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-orange-950 text-orange-300 border border-orange-800/80">
                {feature.type}
              </span>
              {feature.missionOrIAUYear && (
                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700">
                  {feature.missionOrIAUYear}
                </span>
              )}
              <span className="text-[10px] font-mono text-cyan-400">
                USGS / IAU Catalog
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
              {feature.name}
            </h2>
            <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
              <span>{feature.originName}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            title="Close Place Dossier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Geological Classification Banner */}
          <div className={`p-3.5 rounded-xl border bg-gradient-to-br ${geo.color}`}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-white">
                <Mountain className="w-3.5 h-3.5 text-orange-400" />
                <span>Geological Classification: {geo.term}</span>
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {geo.meaning}
            </p>
          </div>

          {/* Description */}
          <div className="bg-neutral-900/70 p-3.5 rounded-xl border border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              Nomenclature & Exploration Background
            </span>
            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans">
              {feature.description}
            </p>
          </div>

          {/* Coordinates & Elevation Spatial Bar */}
          <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-neutral-300">
                  {feature.lat.toFixed(4)}°N, {feature.lng.toFixed(4)}°E
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  (Planetocentric:{' '}
                  {feature.planetocentricLng?.toFixed(2) ||
                    (feature.lng < 0 ? feature.lng + 360 : feature.lng).toFixed(2)}
                  °E)
                </span>
              </div>

              <button
                type="button"
                onClick={copyCoordinates}
                className="self-start sm:self-auto px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-neutral-300 font-mono transition-colors cursor-pointer flex items-center gap-1 border border-neutral-700"
              >
                {copiedCoords ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <span>Copy Coords</span>
                )}
              </button>
            </div>

            {/* MOLA Elevation Datum Gauge */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 flex items-center gap-1">
                  <span>MOLA Areoid Elevation</span>
                </span>
                <span className="font-mono font-bold text-white text-sm">
                  {feature.elevationM > 0 ? `+${feature.elevationM.toLocaleString()}` : feature.elevationM.toLocaleString()} m
                </span>
              </div>

              {/* Graphical Elevation Gradient Bar */}
              <div className="relative h-2.5 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-emerald-500 via-amber-500 to-rose-600 transition-all duration-500"
                  style={{ width: `${elevPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                <span>Hellas Basin (-8,200m)</span>
                <span className="text-neutral-400">Mars Datum (0m)</span>
                <span>Olympus Mons (+21,287m)</span>
              </div>
            </div>

            {/* Dimension Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-neutral-800 text-xs">
              {feature.diameterKm && (
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                  <span className="text-neutral-400 text-[10px] block">Spatial Extent / Diameter</span>
                  <span className="font-mono font-bold text-orange-300">
                    {feature.diameterKm.toLocaleString()} km
                  </span>
                </div>
              )}
              <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                <span className="text-neutral-400 text-[10px] block">Atmospheric Pressure</span>
                <span className="font-mono font-bold text-cyan-300">
                  {science.atmosphere.pressureDisplay} ({science.atmosphere.surfacePressureMbar} mbar)
                </span>
              </div>
              <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                <span className="text-neutral-400 text-[10px] block">Subsurface Water Ice</span>
                <span className="font-mono font-bold text-emerald-300">
                  {science.water.probabilityChance}% ({science.water.depthDisplay})
                </span>
              </div>
            </div>
          </div>

          {/* Earth Comparison Spotlight Card (If available) */}
          {earthComparison && (
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/40 via-neutral-900 to-neutral-900 border border-cyan-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Earth Scale Comparison</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenEarthComparison) onOpenEarthComparison(earthComparison.id);
                  }}
                  className="text-[10px] text-cyan-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer underline"
                >
                  <span>Open Full Scale Model</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="text-xs text-white font-semibold">
                {earthComparison.headline}
              </div>
              <p className="text-[11px] text-neutral-300">
                {earthComparison.ratioSummary}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 bg-neutral-900 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {onOpenNASACloseUp && (
              <button
                type="button"
                onClick={() => {
                  onOpenNASACloseUp(feature.name);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-neutral-700"
              >
                <Maximize2 className="w-3.5 h-3.5 text-orange-400" />
                <span>HiRISE / CTX Imagery</span>
              </button>
            )}

            {onAddToRoute && (
              <button
                type="button"
                onClick={() => {
                  onAddToRoute(feature);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-neutral-700"
              >
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ Waypoint</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onFlyTo && (
              <button
                type="button"
                onClick={() => {
                  onFlyTo(feature.lat, feature.lng, 6);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-orange-950"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Fly & Center on Map</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
