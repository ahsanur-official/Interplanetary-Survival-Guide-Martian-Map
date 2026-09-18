import { useState } from 'react';
import {
  MissionConstraints,
  CandidateRoute,
  HazardZone,
  ScienceTarget,
} from '../../types/mars';
import { Sparkles, AlertTriangle, Clock, RefreshCw, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface WhatIfSimulatorPanelProps {
  constraints: MissionConstraints;
  routes: CandidateRoute[];
  activeRoute: CandidateRoute | null;
  scienceTargets: ScienceTarget[];
  onApplyScenario: (scenario: {
    durationHours?: number;
    extraHazard?: HazardZone;
    mandatedTargetId?: string;
    description: string;
  }) => void;
  onResetScenarios: () => void;
  simulationLog: {
    title: string;
    explanation: string;
    deltaDistanceKm: number;
    deltaTimeHours: number;
  } | null;
}

export function WhatIfSimulatorPanel({
  constraints,
  routes,
  activeRoute,
  scienceTargets,
  onApplyScenario,
  onResetScenarios,
  simulationLog,
}: WhatIfSimulatorPanelProps) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const handleRunScenario = (scenarioKey: string) => {
    setSelectedScenario(scenarioKey);

    if (scenarioKey === 'duration-cut') {
      onApplyScenario({
        durationHours: 5.5,
        description:
          'EMERGENCY EVA LIMIT REDUCTION: Life-support constraint tightened from 8.0h to 5.5h due to secondary sublimator thermal spike.',
      });
    } else if (scenarioKey === 'scarp-restricted') {
      const dynamicHazard: HazardZone = {
        id: 'dyn_haz_scarp_rockfall',
        name: 'SIMULATED RESTRICTED: Active Scarp Rockfall Zone',
        type: 'RESTRICTED',
        coordinate: { latitude: 18.435, longitude: 77.412 },
        radiusMeters: 650,
        riskLevel: 'CRITICAL',
        description: 'Orbiter HiRISE detected fresh boulder track displacement; canyon pass classified as strictly prohibited.',
        provenance: {
          source: 'Simulated Hazard Injection (What-If Module)',
          datasetName: 'SIM_HAZARD_OVERRIDE_001',
          mission: 'MARSWAY Mission Simulator',
          status: 'SIMULATED',
          spatialResolution: '1m',
          limitations: 'Validation scenario only.',
        },
      };

      onApplyScenario({
        extraHazard: dynamicHazard,
        description:
          'DYNAMIC PASS CLOSURE: Hawkes Bay Delta Scarp canyon closed due to detected rockfall activity.',
      });
    } else if (scenarioKey === 'mandatory-sample') {
      // Pick Enchanted lake or top target
      const topTarget = scienceTargets[0];
      onApplyScenario({
        mandatedTargetId: topTarget.id,
        description: `MANDATED SAMPLE OBJECTIVE: Science Operations Team elevated "${topTarget.name}" to high-priority mandatory collection.`,
      });
    }
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3.5 text-xs font-mono text-neutral-300 shadow-xl space-y-3.5">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span className="font-bold text-white uppercase tracking-wider text-sm">
            What-If Mission Simulator
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/50">
          CONTINGENCY ANALYSIS
        </span>
      </div>

      <p className="text-[11px] text-neutral-400 leading-relaxed">
        Test operational disruptions, emergency duration reductions, or dynamic terrain hazards. The router recalculates feasible paths and explains the trade-off delta.
      </p>

      {/* Quick Scenario Triggers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          id="btn-scenario-duration"
          onClick={() => handleRunScenario('duration-cut')}
          className={`p-2.5 rounded-lg border text-left transition-all ${
            selectedScenario === 'duration-cut'
              ? 'bg-purple-950/60 border-purple-500 text-white'
              : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 text-neutral-400'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-neutral-200 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>EVA Cut to 5.5h</span>
          </div>
          <div className="text-[10px] text-neutral-500">
            Life support emergency reduction
          </div>
        </button>

        <button
          id="btn-scenario-hazard"
          onClick={() => handleRunScenario('scarp-restricted')}
          className={`p-2.5 rounded-lg border text-left transition-all ${
            selectedScenario === 'scarp-restricted'
              ? 'bg-purple-950/60 border-purple-500 text-white'
              : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 text-neutral-400'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-neutral-200 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Pass Blocked</span>
          </div>
          <div className="text-[10px] text-neutral-500">
            Canyon rockfall alert closure
          </div>
        </button>

        <button
          id="btn-scenario-mandate"
          onClick={() => handleRunScenario('mandatory-sample')}
          className={`p-2.5 rounded-lg border text-left transition-all ${
            selectedScenario === 'mandatory-sample'
              ? 'bg-purple-950/60 border-purple-500 text-white'
              : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 text-neutral-400'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-neutral-200 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Priority Target</span>
          </div>
          <div className="text-[10px] text-neutral-500">
            Mandate primary sample collection
          </div>
        </button>
      </div>

      {/* Simulation Outcome & Explainable Delta */}
      {simulationLog && (
        <div className="bg-neutral-950 p-3 rounded-lg border border-purple-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              SIMULATION OUTCOME & ROUTE ADAPTATION
            </span>
            <button
              onClick={() => {
                setSelectedScenario(null);
                onResetScenarios();
              }}
              className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 underline"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Plan
            </button>
          </div>

          <div className="text-[11px] text-neutral-200 font-semibold">
            {simulationLog.title}
          </div>

          <p className="text-[11px] text-neutral-400 leading-relaxed bg-neutral-900/80 p-2 rounded border border-neutral-800">
            {simulationLog.explanation}
          </p>

          <div className="grid grid-cols-2 gap-2 text-center text-[11px] pt-1">
            <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800">
              <span className="text-neutral-500 block text-[9px]">TRAVERSE DELTA</span>
              <span className="font-bold text-cyan-300">
                {simulationLog.deltaDistanceKm >= 0 ? `+${simulationLog.deltaDistanceKm.toFixed(2)}` : simulationLog.deltaDistanceKm.toFixed(2)} km
              </span>
            </div>
            <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800">
              <span className="text-neutral-500 block text-[9px]">TIME DELTA</span>
              <span className="font-bold text-amber-300">
                {simulationLog.deltaTimeHours >= 0 ? `+${simulationLog.deltaTimeHours.toFixed(1)}` : simulationLog.deltaTimeHours.toFixed(1)} h
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
