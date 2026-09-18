import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2, Play, Navigation, HelpCircle, Layers } from 'lucide-react';

interface DemoTourModalProps {
  onClose: () => void;
  onExecuteTourStep: (stepNumber: number) => void;
}

export function DemoTourModal({ onClose, onExecuteTourStep }: DemoTourModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      step: 1,
      title: 'Define Mission Context & Departure Base',
      desc: 'Set departure point at the Octavia E. Butler Landing Site and destination at Hawkes Bay Delta Scarp. Configure an 8-hour planetary EVA constraint with Balanced multi-factor priorities.',
      actionLabel: 'Apply Scenario 1 (Initial Mission Setup)',
    },
    {
      step: 2,
      title: 'Synthesize Multi-Objective Candidate Routes',
      desc: 'Execute multi-objective optimization. Notice how the engine generates three distinct Pareto candidates: Route A (Direct Efficiency), Route B (Science Opportunity), and Route C (Maximum Safety).',
      actionLabel: 'Calculate Candidate Routes',
    },
    {
      step: 3,
      title: 'Inspect "Why This Route?" Decision Support',
      desc: 'Open explainable decision support on Route B. Review quantitative trade-offs: +0.7 km added distance yields access to primary lacustrine mudstone targets without exceeding EVA life-support.',
      actionLabel: 'Activate Route B & Review Rationale',
    },
    {
      step: 4,
      title: 'Science Opportunity Engine: In-Route Detours',
      desc: 'Examine the 750m corridor buffer. The engine detects the "Enchanted Lake Mudstones" (Scientific Value: 9.8/10). Intercepting this sample site adds 45 minutes of coring time while remaining safe.',
      actionLabel: 'Inspect Detected Opportunities',
    },
    {
      step: 5,
      title: 'What-If Simulation: Emergency Pass Blocked',
      desc: 'Simulate a dynamic canyon rockfall scarp alert closing the Hawkes Bay pass. Watch the router reroute the explorer around the perimeter, explaining the distance and time delta in real time.',
      actionLabel: 'Simulate Pass Blocked Reroute',
    },
    {
      step: 6,
      title: 'Export Final Marswalk Mission Plan',
      desc: 'Generate the complete, flight-formatted Marswalk Mission Summary with elevation profiles, metabolic expenditure, and full NASA PDS dataset citations.',
      actionLabel: 'View Mission Summary Brief',
    },
  ];

  const current = steps[currentStep - 1];

  const handleRunAction = () => {
    onExecuteTourStep(currentStep);
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-xl w-full shadow-2xl font-mono text-xs text-neutral-300">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Guided 3-Minute Marswalk Demo Tour
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-5 pt-4 flex items-center justify-between text-[11px] text-neutral-500">
          <span>STEP {currentStep} OF {steps.length}</span>
          <div className="flex gap-1.5">
            {steps.map((s) => (
              <span
                key={s.step}
                className={`w-2 h-2 rounded-full ${
                  s.step === currentStep
                    ? 'bg-orange-500'
                    : s.step < currentStep
                    ? 'bg-emerald-500'
                    : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-950 text-orange-400 border border-orange-700 flex items-center justify-center text-[10px]">
              {current.step}
            </span>
            <span>{current.title}</span>
          </h4>

          <p className="text-neutral-300 leading-relaxed text-xs bg-neutral-950 p-3.5 rounded-lg border border-neutral-800">
            {current.desc}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between bg-neutral-900">
          <button
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <button
            id="btn-run-tour-step"
            onClick={handleRunAction}
            className="px-4 py-1.5 rounded bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold flex items-center gap-1.5 shadow"
          >
            <span>{current.actionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
