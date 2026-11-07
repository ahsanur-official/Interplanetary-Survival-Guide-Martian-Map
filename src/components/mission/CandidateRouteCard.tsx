import { CandidateRoute } from '../../types/mars';
import { HelpCircle, CheckCircle2, AlertTriangle, Shield, Sparkles, Clock, MapPin, ArrowRight } from 'lucide-react';

interface CandidateRouteCardProps {
  routes: CandidateRoute[];
  activeRouteId: string;
  onSelectRoute: (routeId: string) => void;
  onOpenWhyThisRoute: (route: CandidateRoute) => void;
  maxDurationHours: number;
}

export function CandidateRouteCard({
  routes,
  activeRouteId,
  onSelectRoute,
  onOpenWhyThisRoute,
  maxDurationHours,
}: CandidateRouteCardProps) {
  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold text-neutral-300 uppercase tracking-wider">
          Generated Candidate Traverses ({routes.length})
        </span>
        <span className="text-[10px] text-neutral-500">PARETO TRADE-OFF MATRIX</span>
      </div>

      {/* Route Cards */}
      <div className="space-y-2.5">
        {routes.map((route) => {
          const isActive = route.id === activeRouteId;
          const isFeasible = route.metrics.isFeasible;

          return (
            <div
              key={route.id}
              id={`card-${route.id}`}
              onClick={() => onSelectRoute(route.id)}
              className={`p-3 rounded-lg border transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-neutral-900 border-orange-500 shadow-md shadow-orange-950/40 ring-1 ring-orange-500/50'
                  : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 text-neutral-400'
              }`}
            >
              {/* Header: Name, Objective Tag, and Active Indicator */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: route.color }}
                  ></span>
                  <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-neutral-300'}`}>
                    {route.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWhyThisRoute(route);
                    }}
                    className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 flex items-center gap-1 text-[10px] transition-colors"
                    title="Explain rationale, advantages, and trade-offs"
                  >
                    <HelpCircle className="w-3 h-3 text-orange-400" />
                    <span>Why This Route?</span>
                  </button>
                  {isFeasible ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      FEASIBLE
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/60 text-[10px] flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      EXCEEDS LIMIT
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 bg-neutral-950/80 p-2 rounded border border-neutral-800/60 text-[11px] mb-2">
                <div>
                  <div className="text-neutral-500 text-[10px]">DISTANCE</div>
                  <div className="font-bold text-white">{route.metrics.totalDistanceKm} km</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[10px]">EST. DURATION</div>
                  <div className={`font-bold ${route.metrics.estimatedDurationHours > maxDurationHours ? 'text-red-400' : 'text-amber-300'}`}>
                    {route.metrics.estimatedDurationHours} h
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[10px]">MAX SLOPE</div>
                  <div className={`font-bold ${route.metrics.maxSlopeDegrees > 14 ? 'text-red-400' : 'text-emerald-300'}`}>
                    {route.metrics.maxSlopeDegrees}°
                  </div>
                </div>

                <div>
                  <div className="text-neutral-500 text-[10px]">HAZARD SCORE</div>
                  <div className="font-bold text-orange-400">{route.metrics.hazardExposureScore}/100</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[10px]">SCIENCE YIELD</div>
                  <div className="font-bold text-amber-400">{route.metrics.scienceOpportunityYield}/100</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[10px]">METABOLIC EST.</div>
                  <div className="font-bold text-cyan-400">{route.metrics.metabolicEnergyCostKcal} kcal</div>
                </div>
              </div>

              {/* Quick Summary Pill */}
              <div className="text-[11px] text-neutral-400 line-clamp-2">
                {route.whyThisRoute.summary}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Trade-Off Table */}
      <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-2.5 text-[10px]">
        <div className="text-neutral-400 font-bold mb-1.5 uppercase">
          Comparative Trade-off Table
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500">
                <th className="py-1">Route</th>
                <th className="py-1">Dist</th>
                <th className="py-1">Duration</th>
                <th className="py-1">Max Slope</th>
                <th className="py-1">Hazard</th>
                <th className="py-1">Science</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {routes.map((r) => (
                <tr key={r.id} className={r.id === activeRouteId ? 'text-white font-bold bg-neutral-900/50' : 'text-neutral-400'}>
                  <td className="py-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: r.color }}></span>
                    <span>{r.name.split(':')[0]}</span>
                  </td>
                  <td className="py-1">{r.metrics.totalDistanceKm} km</td>
                  <td className="py-1">{r.metrics.estimatedDurationHours} h</td>
                  <td className="py-1">{r.metrics.maxSlopeDegrees}°</td>
                  <td className="py-1">{r.metrics.hazardExposureScore}</td>
                  <td className="py-1">{r.metrics.scienceOpportunityYield}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
