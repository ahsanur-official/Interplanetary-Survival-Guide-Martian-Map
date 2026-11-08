import { ScienceTarget, CandidateRoute } from '../../types/mars';
import { Disc, Plus, Check, Clock, Compass, Sparkles } from 'lucide-react';
import { ProvenanceBadge } from '../common/ProvenanceBadge';

interface ScienceOpportunityListProps {
  route: CandidateRoute | null;
  onAddTarget: (target: ScienceTarget) => void;
  requiredTargetIds: string[];
}

export function ScienceOpportunityList({
  route,
  onAddTarget,
  requiredTargetIds,
}: ScienceOpportunityListProps) {
  if (!route) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center text-xs text-neutral-500 font-mono">
        Select a route to detect nearby scientific opportunities
      </div>
    );
  }

  const opportunities = route.nearbyOpportunities || [];

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3 text-xs font-mono text-neutral-300 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-neutral-200 uppercase">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Science Opportunity Engine ({opportunities.length} Detected)</span>
        </div>
        <span className="text-[10px] text-neutral-500">750M CORRIDOR BUFFER</span>
      </div>

      <p className="text-[11px] text-neutral-400">
        Targets identified along the traverse corridor. Add high-value targets to mission objectives to incorporate them into the route.
      </p>

      {opportunities.length === 0 ? (
        <div className="p-4 text-center text-neutral-500 bg-neutral-950 rounded">
          No documented scientific targets detected within 750m corridor of this traverse.
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {opportunities.map(({ target, detourDistanceMeters, additionalTimeMinutes, isIncludedInPath }) => {
            const isMandated = requiredTargetIds.includes(target.id);

            return (
              <div
                key={target.id}
                className={`p-2.5 rounded-lg border transition-all ${
                  isIncludedInPath
                    ? 'bg-amber-950/25 border-amber-500/50 text-neutral-200'
                    : 'bg-neutral-950/80 border-neutral-800 text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Disc className={`w-3.5 h-3.5 ${isIncludedInPath ? 'text-amber-400' : 'text-neutral-500'}`} />
                    <span className="font-bold text-white text-xs">{target.name}</span>
                  </div>
                  <ProvenanceBadge status={target.provenance.status} size="sm" />
                </div>

                <div className="text-[11px] text-neutral-300 mb-2 leading-relaxed">
                  {target.description}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800/80 text-[10px]">
                  <div className="flex items-center gap-2.5">
                    <span>Value: <strong className="text-amber-400">{target.scientificValueScore}/10</strong></span>
                    <span>Detour: <strong className="text-cyan-300">{detourDistanceMeters}m</strong></span>
                    <span>Sampling: <strong className="text-neutral-300">+{additionalTimeMinutes} min</strong></span>
                  </div>

                  {isIncludedInPath ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50">
                      <Check className="w-3 h-3" />
                      INTERCEPTED IN ROUTE
                    </span>
                  ) : (
                    <button
                      onClick={() => onAddTarget(target)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-orange-600/90 hover:bg-orange-500 text-white font-bold transition-colors cursor-pointer"
                      title="Add target to mandatory mission objectives and recalculate"
                    >
                      <Plus className="w-3 h-3" />
                      Add to Mission
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
