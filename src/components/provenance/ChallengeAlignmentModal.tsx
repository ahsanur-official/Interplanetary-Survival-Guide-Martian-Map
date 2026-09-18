import { Award, CheckCircle2, X, Compass, Layers, Shield, Sparkles } from 'lucide-react';

interface ChallengeAlignmentModalProps {
  onClose: () => void;
}

export function ChallengeAlignmentModal({ onClose }: ChallengeAlignmentModalProps) {
  const criteria = [
    {
      challengeReq: 'Layered, Integrated Martian View',
      challengeDesc:
        'Create a layered, integrated view of a Martian location or route that combines multiple types of scientific and terrain data.',
      marswayImpl:
        'Multi-layer interactive Martian viewport compositing MOLA topography, HiRISE slope gradients, CRISM hydration spectra, rover tracks, hazard zones, and candidate traverses into a single synchronized spatial canvas.',
    },
    {
      challengeReq: 'Multiple NASA Science Missions',
      challengeDesc:
        'Incorporate data from multiple NASA robotic Mars exploration missions over decades.',
      marswayImpl:
        'Unified ETL integration ingesting data from Mars Global Surveyor (MOLA), Mars Reconnaissance Orbiter (HiRISE, CRISM, SHARAD), Mars Science Laboratory (Curiosity RAD, REMS, ChemCam), and Mars 2020 (Perseverance MEDA, PIXL, SHERLOC, RIMFAX).',
    },
    {
      challengeReq: 'Route & Destination Information',
      challengeDesc:
        'Support human explorer route planning from departure base to scientific destinations.',
      marswayImpl:
        'Dedicated Astronaut Marswalk Mission Planner allowing start and destination waypoint selection, EVA life-support duration thresholds, and multi-objective Pareto route generation.',
    },
    {
      challengeReq: 'Conduct New Science Along the Way',
      challengeDesc:
        'Help an explorer conduct new science during transit rather than just finding the shortest path.',
      marswayImpl:
        'Novel Science Opportunity Engine that buffers the traverse corridor, detects nearby scientific targets and rover observation sites, and allows one-click integration into mission objectives.',
    },
    {
      challengeReq: 'Environmental Conditions & Mission Safety',
      challengeDesc:
        'Analyze terrain difficulties, hazards, and environmental conditions to manage explorer risk.',
      marswayImpl:
        'Slope trafficability modeling (Margaria-Minetti bioenergetic pacing), critical scarp avoidance, boulder field hazards, and authentic diurnal thermal and radiation shielding calculations.',
    },
    {
      challengeReq: 'Explainable Decision Support',
      challengeDesc:
        'Help explorers understand trade-offs between safety, distance, terrain difficulty, and science.',
      marswayImpl:
        'Dedicated "Why This Route?" decision support modal and side-by-side trade-off matrix explicitly contrasting Route A (Efficiency), Route B (Science Opportunity), and Route C (Maximum Safety).',
    },
    {
      challengeReq: 'Scientific Honesty & Provenance',
      challengeDesc:
        'Clearly label data sources, distinguish real observations from modeled/simulated data, and make limitations transparent.',
      marswayImpl:
        'Rigorous 5-tier provenance tagging (OBSERVED, HISTORICAL, DERIVED, MODELED, SIMULATED) on every entity, accompanied by a complete PDS archive citation catalog.',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl font-mono text-xs text-neutral-300">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-900 z-10">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                2026 NASA Space Apps Challenge Alignment
              </h3>
              <p className="text-[11px] text-neutral-400">
                Challenge: &quot;Interplanetary Survival Guide: Martian Map&quot;
              </p>
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
          <div className="bg-orange-950/30 border border-orange-700/50 p-3.5 rounded-lg text-neutral-300 leading-relaxed text-xs">
            <strong className="text-orange-400">Our Core Philosophy:</strong> Rather than building another generic Mars globe or a simple shortest-path algorithm, MARSWAY transforms decades of robotic Mars exploration data into an <strong>explainable, science-aware decision support system</strong> for future human explorers.
          </div>

          <div className="space-y-3">
            {criteria.map((item, idx) => (
              <div key={idx} className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item.challengeReq}</span>
                </div>
                <div className="text-neutral-400 text-[11px] pl-6">
                  <strong className="text-neutral-300">Challenge Requirement:</strong> {item.challengeDesc}
                </div>
                <div className="text-cyan-300/90 bg-cyan-950/20 p-2 rounded border border-cyan-900/30 text-[11px] pl-2.5 ml-6">
                  <strong className="text-cyan-400">MARSWAY Implementation:</strong> {item.marswayImpl}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-neutral-800 flex justify-end bg-neutral-900">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold transition-colors"
          >
            Close Alignment Review
          </button>
        </div>
      </div>
    </div>
  );
}
