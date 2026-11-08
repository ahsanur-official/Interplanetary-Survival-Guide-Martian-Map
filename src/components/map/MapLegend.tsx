import { AlertTriangle, Disc, Droplets, Radio, Flag, CheckCircle2 } from 'lucide-react';

export function MapLegend() {
  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3 text-[11px] font-mono text-neutral-300 shadow-xl backdrop-blur-sm">
      <div className="font-bold tracking-wider text-neutral-400 uppercase border-b border-neutral-800 pb-1 mb-2">
        Cartographic Legend & Symbols
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Hazards & Slopes */}
        <div>
          <div className="text-neutral-500 font-semibold mb-1 text-[10px]">HAZARDS & TRAVERSABILITY</div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white"></span>
              <span className="text-red-400 font-bold">CRITICAL:</span>
              <span className="text-neutral-400">Cliff Scarp &gt;20°</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span className="text-orange-400 font-bold">HIGH:</span>
              <span className="text-neutral-400">Soft Sand Ripple Dunes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-amber-400 font-bold">MEDIUM:</span>
              <span className="text-neutral-400">Boulder Block Field</span>
            </div>
          </div>
        </div>

        {/* Science & Exploration */}
        <div>
          <div className="text-neutral-500 font-semibold mb-1 text-[10px]">SCIENCE & EXPLORATION</div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-black"></span>
              <span className="text-amber-200">Scientific Sample Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rotate-45 bg-cyan-400"></span>
              <span className="text-cyan-200">Hydrated Mineral / Ice</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span className="text-purple-200">Rover In-Situ Observation</span>
            </div>
          </div>
        </div>

        {/* Candidate Routes */}
        <div>
          <div className="text-neutral-500 font-semibold mb-1 text-[10px]">CANDIDATE MARSWALK ROUTES</div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1 bg-cyan-400 rounded"></span>
              <span className="text-cyan-300 font-semibold">Route A:</span>
              <span className="text-neutral-400">Direct Efficiency</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1 bg-amber-400 rounded"></span>
              <span className="text-amber-300 font-semibold">Route B:</span>
              <span className="text-neutral-400">Science Opportunity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1 bg-emerald-400 rounded"></span>
              <span className="text-emerald-300 font-semibold">Route C:</span>
              <span className="text-neutral-400">Maximum Safety</span>
            </div>
          </div>
        </div>

        {/* Mission Waypoints */}
        <div>
          <div className="text-neutral-500 font-semibold mb-1 text-[10px]">OPERATIONAL WAYPOINTS</div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[8px]">A</span>
              <span className="text-emerald-300">Base / Landing Outpost</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-[8px]">B</span>
              <span className="text-red-300">Scientific Destination</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border border-blue-400"></span>
              <span className="text-blue-300">Selected Coordinates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
