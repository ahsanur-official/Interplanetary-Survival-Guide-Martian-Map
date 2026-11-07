import React from 'react';
import {
  X,
  Camera,
  Compass,
  Calendar,
  Layers,
  Sparkles,
  Maximize2,
  ExternalLink,
  ShieldAlert,
  Info,
  Eye,
} from 'lucide-react';
import { NasaSurfacePovImage } from '../../types/mars';

export interface NasaSurfacePovModalProps {
  isOpen: boolean;
  onClose: () => void;
  povImage: NasaSurfacePovImage | null;
  waypointName?: string;
  elevationM?: number;
}

export const NasaSurfacePovModal: React.FC<NasaSurfacePovModalProps> = ({
  isOpen,
  onClose,
  povImage,
  waypointName,
  elevationM,
}) => {
  if (!isOpen || !povImage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#090d16]/98 border border-orange-500/50 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/95 text-neutral-100 overflow-hidden flex flex-col max-h-[92vh] font-sans">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-neutral-950 via-orange-950/40 to-neutral-950 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/40">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-950 text-orange-300 border border-orange-500/40 uppercase tracking-wider">
                  NASA Point-of-View (POV) Surface Imagery
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  Sol {povImage.sol}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5 truncate">
                {povImage.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 no-scrollbar text-xs">
          {/* Main POV Image Container */}
          <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black shadow-xl group">
            <img
              src={povImage.imageUrl}
              alt={povImage.title}
              className="w-full h-auto max-h-[50vh] object-cover object-center group-hover:scale-[1.01] transition-transform duration-300"
              loading="lazy"
            />
            {/* Camera Overlay Badge on Image */}
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-[10.5px] font-mono font-semibold text-neutral-200 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-orange-400" />
              <span>{povImage.camera}</span>
            </div>

            {/* Target Feature badge */}
            <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-orange-500/40 text-[10.5px] font-mono text-orange-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Target: {povImage.targetFeature}</span>
            </div>

            {povImage.azimuthDeg !== undefined && (
              <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-[10.5px] font-mono text-cyan-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Azimuth: {povImage.azimuthDeg}°</span>
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-[9px] uppercase tracking-wider text-neutral-400">Location</div>
              <div className="text-xs font-bold text-white mt-0.5 truncate">
                {waypointName || povImage.targetFeature}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-[9px] uppercase tracking-wider text-neutral-400">Elevation</div>
              <div className="text-xs font-bold text-cyan-300 mt-0.5">
                {elevationM !== undefined
                  ? `${elevationM > 0 ? '+' : ''}${elevationM}m`
                  : 'Surface Level'}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-[9px] uppercase tracking-wider text-neutral-400">Observation Sol</div>
              <div className="text-xs font-bold text-amber-300 mt-0.5">
                Sol {povImage.sol} ({povImage.earthDate})
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-[9px] uppercase tracking-wider text-neutral-400">Field of View</div>
              <div className="text-xs font-bold text-emerald-300 mt-0.5">
                {povImage.fieldOfViewDeg ? `${povImage.fieldOfViewDeg}°` : 'Panoramic Stereo'}
              </div>
            </div>
          </div>

          {/* Description & Scientific Value */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-orange-400 text-xs">
              <Info className="w-4 h-4 text-orange-400" />
              <span>Ground-Level Geological Context & What Astronaut Sees</span>
            </div>
            <p className="text-neutral-300 leading-relaxed text-xs">
              {povImage.description}
            </p>
          </div>

          {/* Suited Marswalk Safety Tip based on Terrain */}
          <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-2.5 text-neutral-300 text-xs leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-cyan-300">Astronaut Navigation Context: </span>
              In-situ ground imagery confirms trafficability, boulder distribution, and footing stability. Suited astronauts should maintain visual line of sight with navigation waypoints and avoid loose talus scree along ridgelines.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
