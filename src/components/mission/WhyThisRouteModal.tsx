import { CandidateRoute } from '../../types/mars';
import { X, CheckCircle, AlertTriangle, Lightbulb, Compass, Clock, Zap, Shield, Sparkles } from 'lucide-react';

interface WhyThisRouteModalProps {
  route: CandidateRoute | null;
  onClose: () => void;
  maxDurationHours: number;
}

export function WhyThisRouteModal({ route, onClose, maxDurationHours }: WhyThisRouteModalProps) {
  if (!route) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl font-mono text-xs text-neutral-300">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-900 z-10">
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: route.color }}></span>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Why This Route? — Explainable Decision Support
              </h3>
              <p className="text-[11px] text-neutral-400">{route.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Executive Rationale */}
          <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800">
            <div className="text-orange-400 font-bold mb-1 uppercase text-[11px] flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Strategic Optimization Rationale
            </div>
            <p className="text-neutral-200 leading-relaxed text-xs">
              {route.whyThisRoute.summary}
            </p>
          </div>

          {/* Advantages vs Trade-offs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Advantages */}
            <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg p-3.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-2 uppercase text-[11px]">
                <CheckCircle className="w-3.5 h-3.5" />
                Operational Advantages
              </div>
              <ul className="space-y-1.5 text-neutral-300">
                {route.whyThisRoute.advantages.map((adv, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold shrink-0">+</span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trade-offs */}
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-3.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-2 uppercase text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                Incurred Trade-Offs
              </div>
              <ul className="space-y-1.5 text-neutral-300">
                {route.whyThisRoute.tradeOffs.map((to, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold shrink-0">-</span>
                    <span>{to}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Decision Factors */}
          <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800">
            <div className="text-cyan-400 font-bold mb-1.5 uppercase text-[11px] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Critical Decision Triggers For Astronaut
            </div>
            <ul className="space-y-1 text-neutral-300">
              {route.whyThisRoute.criticalDecisionFactors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-neutral-500 font-bold">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Metric Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
              <div className="text-neutral-500 text-[10px]">TOTAL DISTANCE</div>
              <div className="text-sm font-bold text-white">{route.metrics.totalDistanceKm} km</div>
            </div>
            <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
              <div className="text-neutral-500 text-[10px]">TIME / LIMIT</div>
              <div className="text-sm font-bold text-amber-300">{route.metrics.estimatedDurationHours}h / {maxDurationHours}h</div>
            </div>
            <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
              <div className="text-neutral-500 text-[10px]">HAZARD RATING</div>
              <div className="text-sm font-bold text-orange-400">{route.metrics.hazardExposureScore}/100</div>
            </div>
            <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
              <div className="text-neutral-500 text-[10px]">SCIENCE YIELD</div>
              <div className="text-sm font-bold text-emerald-400">{route.metrics.scienceOpportunityYield}/100</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-800 flex justify-end bg-neutral-900">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold transition-colors"
          >
            Acknowledge Rationale
          </button>
        </div>
      </div>
    </div>
  );
}
