import { MarsRegion } from '../../types/mars';
import { Compass, Info, FileText, Award, Layers, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentRegion: MarsRegion;
  onSelectRegion: (regionId: string) => void;
  onOpenMethodology: () => void;
  onOpenChallengeAlignment: () => void;
  onOpenDemoTour: () => void;
}

export function Header({
  currentRegion,
  onSelectRegion,
  onOpenMethodology,
  onOpenChallengeAlignment,
  onOpenDemoTour,
}: HeaderProps) {
  return (
    <header className="bg-neutral-950 border-b border-neutral-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-white select-none z-20 relative">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-600 to-amber-700 flex items-center justify-center shadow-md shadow-orange-950/40 border border-orange-500/30">
          <Compass className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-wider text-orange-400 font-mono">
              MARSWAY
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-950/80 text-orange-300 font-mono border border-orange-700/50">
              NASA SPACE APPS 2026
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 hidden sm:block">
            Science-Aware Multi-Objective Route Planning for Human Marswalks
          </p>
        </div>
      </div>

      {/* Region Selector & Mission Sol */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-md p-0.5 text-xs font-mono">
          <button
            id="btn-region-jezero"
            onClick={() => onSelectRegion('jezero')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              currentRegion.id === 'jezero'
                ? 'bg-orange-600 text-white font-medium shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            Jezero Crater Delta
          </button>
          <button
            id="btn-region-gale"
            onClick={() => onSelectRegion('gale')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              currentRegion.id === 'gale'
                ? 'bg-orange-600 text-white font-medium shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
            Gale Crater (MSL)
          </button>
        </div>

        {/* Demo Data Notice */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300 font-mono" title="Uses authentic NASA MOLA/HiRISE/MEDA/CRISM data combined with calibrated simulation models.">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>AUTHENTIC NASA ARCHIVE + SIM</span>
        </div>
      </div>

      {/* Action Buttons: Methodology, Challenge Alignment, Demo Story */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <button
          id="btn-open-demo-tour"
          onClick={onOpenDemoTour}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-orange-950/60 hover:bg-orange-900/80 text-orange-200 border border-orange-700/60 transition-colors"
          title="Watch 3-minute guided Marswalk mission planning scenario"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          <span className="hidden sm:inline">Guided Demo Tour</span>
        </button>

        <button
          id="btn-open-methodology"
          onClick={onOpenMethodology}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60 transition-colors"
          title="View Data Provenance, Instruments & Algorithmic Methodology"
        >
          <FileText className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Methodology & PDS</span>
        </button>

        <button
          id="btn-open-challenge"
          onClick={onOpenChallengeAlignment}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60 transition-colors"
          title="See how MARSWAY addresses the 2026 NASA Space Apps Challenge requirements"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Challenge Criteria</span>
        </button>
      </div>
    </header>
  );
}
