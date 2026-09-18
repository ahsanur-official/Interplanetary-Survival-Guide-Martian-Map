import { useState } from 'react';
import { MarsRegion, MissionConstraints } from '../../types/mars';
import { Compass, Clock, Zap, Shield, Sparkles, Navigation, Sliders, ChevronDown } from 'lucide-react';

interface MissionPlannerPanelProps {
  region: MarsRegion;
  namedLocations: {
    id: string;
    name: string;
    elevationMeters: number;
    description: string;
  }[];
  constraints: MissionConstraints;
  onChangeConstraints: (newConstraints: MissionConstraints) => void;
  onGenerateRoutes: () => void;
  isGenerating: boolean;
}

export function MissionPlannerPanel({
  region,
  namedLocations,
  constraints,
  onChangeConstraints,
  onGenerateRoutes,
  isGenerating,
}: MissionPlannerPanelProps) {
  const [showAdvancedWeights, setShowAdvancedWeights] = useState(false);

  const handlePresetSelect = (preset: 'BALANCED' | 'SAFETY' | 'SCIENCE' | 'EFFICIENCY') => {
    let weights = { safety: 0.5, science: 0.5, efficiency: 0.5, resources: 0.3 };
    if (preset === 'SAFETY') {
      weights = { safety: 0.95, science: 0.25, efficiency: 0.3, resources: 0.2 };
    } else if (preset === 'SCIENCE') {
      weights = { safety: 0.45, science: 0.95, efficiency: 0.3, resources: 0.6 };
    } else if (preset === 'EFFICIENCY') {
      weights = { safety: 0.35, science: 0.15, efficiency: 0.95, resources: 0.1 };
    }

    onChangeConstraints({
      ...constraints,
      priorityWeights: weights,
    });
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3.5 text-xs font-mono text-neutral-300 shadow-xl space-y-3.5">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-orange-400" />
          <span className="font-bold text-white uppercase tracking-wider text-sm">
            Marswalk Mission Planner
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-orange-950/80 text-orange-400 border border-orange-800/50">
          EVA SUIT CONSTRAINT MODEL
        </span>
      </div>

      {/* Start and Destination Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-neutral-400 text-[11px] mb-1 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            DEPARTURE BASE (POINT A)
          </label>
          <select
            id="select-start-location"
            value={constraints.startLocationId}
            onChange={(e) =>
              onChangeConstraints({
                ...constraints,
                startLocationId: e.target.value,
              })
            }
            className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-neutral-200 focus:border-orange-500 focus:outline-none truncate"
          >
            {namedLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.elevationMeters}m)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-neutral-400 text-[11px] mb-1 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
            PRIMARY DESTINATION (POINT B)
          </label>
          <select
            id="select-dest-location"
            value={constraints.destinationLocationId}
            onChange={(e) =>
              onChangeConstraints({
                ...constraints,
                destinationLocationId: e.target.value,
              })
            }
            className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-neutral-200 focus:border-orange-500 focus:outline-none truncate"
          >
            {namedLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.elevationMeters}m)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Maximum EVA Duration Slider */}
      <div className="bg-neutral-950/60 p-2.5 rounded border border-neutral-800">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-neutral-300 font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>MAXIMUM EVA DURATION LIMIT</span>
          </div>
          <span className="font-bold text-amber-300 text-sm">{constraints.maxDurationHours} HOURS</span>
        </div>
        <input
          id="range-max-duration"
          type="range"
          min={4}
          max={12}
          step={0.5}
          value={constraints.maxDurationHours}
          onChange={(e) =>
            onChangeConstraints({
              ...constraints,
              maxDurationHours: parseFloat(e.target.value),
            })
          }
          className="w-full accent-orange-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
          <span>4h (Sprint EVA)</span>
          <span>8h (Nominal Planetary Standard)</span>
          <span>12h (Max Contingency)</span>
        </div>
      </div>

      {/* Mission Priority Presets */}
      <div>
        <label className="block text-neutral-400 text-[11px] mb-1.5 font-semibold">
          MISSION STRATEGY PRESETS
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            id="btn-preset-balanced"
            onClick={() => handlePresetSelect('BALANCED')}
            className="p-1.5 rounded border bg-neutral-950 hover:bg-neutral-800 border-neutral-700 text-center transition-colors"
          >
            <div className="font-bold text-neutral-200">Balanced</div>
            <div className="text-[9px] text-neutral-400">Multi-factor</div>
          </button>
          <button
            id="btn-preset-safety"
            onClick={() => handlePresetSelect('SAFETY')}
            className="p-1.5 rounded border bg-neutral-950 hover:bg-neutral-800 border-emerald-800/60 text-center transition-colors"
          >
            <div className="font-bold text-emerald-300">Safety First</div>
            <div className="text-[9px] text-emerald-500">Min hazard/slope</div>
          </button>
          <button
            id="btn-preset-science"
            onClick={() => handlePresetSelect('SCIENCE')}
            className="p-1.5 rounded border bg-neutral-950 hover:bg-neutral-800 border-amber-800/60 text-center transition-colors"
          >
            <div className="font-bold text-amber-300">Max Science</div>
            <div className="text-[9px] text-amber-500">Sample outcrops</div>
          </button>
          <button
            id="btn-preset-efficiency"
            onClick={() => handlePresetSelect('EFFICIENCY')}
            className="p-1.5 rounded border bg-neutral-950 hover:bg-neutral-800 border-cyan-800/60 text-center transition-colors"
          >
            <div className="font-bold text-cyan-300">Efficiency</div>
            <div className="text-[9px] text-cyan-500">Direct transit</div>
          </button>
        </div>
      </div>

      {/* Advanced Configurable Weights Collapsible */}
      <div>
        <button
          onClick={() => setShowAdvancedWeights(!showAdvancedWeights)}
          className="flex items-center justify-between w-full py-1 text-neutral-400 hover:text-neutral-200 text-[11px]"
        >
          <span className="flex items-center gap-1">
            <Sliders className="w-3 h-3 text-orange-400" />
            Configurable Cost Model Weights
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedWeights ? 'rotate-180' : ''}`} />
        </button>

        {showAdvancedWeights && (
          <div className="bg-neutral-950/80 p-2.5 rounded border border-neutral-800 space-y-2 mt-1.5">
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span>Safety Avoidance Weight:</span>
                <span className="text-emerald-400">{Math.round(constraints.priorityWeights.safety * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={constraints.priorityWeights.safety}
                onChange={(e) =>
                  onChangeConstraints({
                    ...constraints,
                    priorityWeights: { ...constraints.priorityWeights, safety: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span>Scientific Opportunity Weight:</span>
                <span className="text-amber-400">{Math.round(constraints.priorityWeights.science * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={constraints.priorityWeights.science}
                onChange={(e) =>
                  onChangeConstraints({
                    ...constraints,
                    priorityWeights: { ...constraints.priorityWeights, science: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span>Time & Distance Efficiency:</span>
                <span className="text-cyan-400">{Math.round(constraints.priorityWeights.efficiency * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={constraints.priorityWeights.efficiency}
                onChange={(e) =>
                  onChangeConstraints({
                    ...constraints,
                    priorityWeights: { ...constraints.priorityWeights, efficiency: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-cyan-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Recalculate / Plan Button */}
      <button
        id="btn-generate-routes"
        onClick={onGenerateRoutes}
        disabled={isGenerating}
        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition-all cursor-pointer disabled:opacity-50"
      >
        <Zap className="w-4 h-4 fill-white" />
        <span>{isGenerating ? 'ANALYZING TERRAIN & OBJECTIVES...' : 'OPTIMIZE MULTI-OBJECTIVE MARSWALK'}</span>
      </button>
    </div>
  );
}
