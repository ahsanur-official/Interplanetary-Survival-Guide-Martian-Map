import { CandidateRoute, MarsRegion, EnvironmentalConditions } from '../../types/mars';
import { X, FileText, Download, Check, Printer, Shield, Compass, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface MissionSummaryModalProps {
  route: CandidateRoute | null;
  region: MarsRegion;
  environment: EnvironmentalConditions;
  startName: string;
  destName: string;
  onClose: () => void;
}

export function MissionSummaryModal({
  route,
  region,
  environment,
  startName,
  destName,
  onClose,
}: MissionSummaryModalProps) {
  const [copied, setCopied] = useState(false);

  if (!route) return null;

  const briefText = `=====================================================
MARSWAY — MARSWALK MISSION BRIEFING (EVA PLAN)
2026 NASA Space Apps Challenge Submission
=====================================================

MISSION METADATA:
-----------------
Operational Quadrangle: ${region.name}
Primary Architecture: Science-Aware Multi-Objective Route Optimization
Selected Route: ${route.name}
Departure Base (Point A): ${startName}
Primary Destination (Point B): ${destName}

METRICS & CONSTRAINTS:
----------------------
Total Traverse Distance: ${route.metrics.totalDistanceKm} km
Estimated EVA Duration: ${route.metrics.estimatedDurationHours} hours
Maximum Incline Encountered: ${route.metrics.maxSlopeDegrees}°
Average Gradient: ${route.metrics.averageSlopeDegrees}°
Estimated Metabolic Cost: ${route.metrics.metabolicEnergyCostKcal} kcal
Overall Hazard Exposure Index: ${route.metrics.hazardExposureScore}/100
Scientific Opportunity Yield: ${route.metrics.scienceOpportunityYield}/100
Feasibility Status: ${route.metrics.isFeasible ? 'FEASIBLE (Within EVA margin)' : 'EXCEEDS LIMIT'}

SURFACE ENVIRONMENTAL BASELINE:
--------------------------------
Atmospheric Pressure: ${environment.atmosphericPressurePascals} Pa
Diurnal Thermal Window: ${environment.diurnalTempRangeCelsius[0]}°C to ${environment.diurnalTempRangeCelsius[1]}°C
Dust Optical Depth (Tau): ${environment.dustOpticalDepthTau}
Calibrated Radiation Dose Rate: ${environment.radiationDoseRateMicroGyPerDay} μGy/day

EXPLAINABLE DECISION RATIONALE:
-------------------------------
${route.whyThisRoute.summary}

KEY ADVANTAGES:
${route.whyThisRoute.advantages.map((a) => ` + ${a}`).join('\n')}

ACCEPTABLE TRADE-OFFS:
${route.whyThisRoute.tradeOffs.map((t) => ` - ${t}`).join('\n')}

DATA SOURCES & SCIENTIFIC PROVENANCE:
-------------------------------------
- Topography: NASA MGS MOLA MEGDR & Mars Express HRSC (Observed / Derived)
- High-Resolution Imagery: NASA MRO HiRISE Orthomosaics (Observed)
- Mineralogy & Hydration: NASA MRO CRISM Hyperspectral Parameters (Derived)
- Atmospheric Telemetry: NASA Mars 2020 MEDA In-Situ Sensor Baseline (Historical)
- Radiation Exposure: NASA MSL RAD In-Situ / Model Column Adjusted (Modeled)

SCIENTIFIC HONESTY DISCLAIMER:
------------------------------
This plan was synthesized using the MARSWAY decision-support prototype. It is
an academic exploration tool designed for the 2026 NASA Space Apps Challenge
and is not certified for extraterrestrial flight operations.
=====================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(briefText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl font-mono text-xs text-neutral-300">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-900 z-10">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Marswalk Mission Briefing & Flight Plan
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Download className="w-3 h-3" />}
              <span>{copied ? 'Copied Brief' : 'Copy Brief'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Brief Body */}
        <div className="p-5 space-y-4">
          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
            <pre className="text-[11px] leading-relaxed text-neutral-200 whitespace-pre-wrap font-mono">
              {briefText}
            </pre>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-800 flex justify-end bg-neutral-900">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold transition-colors"
          >
            Close Mission Brief
          </button>
        </div>
      </div>
    </div>
  );
}
