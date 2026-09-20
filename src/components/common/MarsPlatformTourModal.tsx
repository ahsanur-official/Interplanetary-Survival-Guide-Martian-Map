import { useState } from 'react';
import {
  X,
  Globe,
  Layers,
  Radio,
  Shield,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface MarsPlatformTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (action: 'globe' | 'missions' | 'human' | 'layers' | 'ai') => void;
}

const TOUR_STEPS = [
  {
    title: 'Planetary Exploration & Navigation',
    subtitle: '2D Mercator GIS & Interactive 3D Martian Globe',
    icon: Globe,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    description:
      'Seamlessly switch between high-resolution 2D flat Mercator maps and a realistic 3D Globe with planetary day/night terminator lighting, true axial tilt, and moons Phobos and Deimos. Zoom, pan, and rotate to inspect any quadrant of Mars.',
    tips: 'Use mouse drag or touch gestures to rotate the planet. Double-click or pinch to zoom into craters.',
    actionKey: 'globe' as const,
    actionLabel: 'Try 3D Globe',
  },
  {
    title: 'Scientific GIS Layers & Topography',
    subtitle: 'Authoritative NASA Viking, MOLA Altimetry & THEMIS IR',
    icon: Layers,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    description:
      'Access calibrated basemaps and environmental overlays from NASA Planetary Data System. Toggle between natural Viking Color, MGS MOLA elevation gradients (-8.2 km to +21.2 km), THEMIS thermal inertia, and USGS geological provinces with opacity controls.',
    tips: 'Open the Layer Manager to adjust layer blending and view numerical elevation legends.',
    actionKey: 'layers' as const,
    actionLabel: 'Open Layer Manager',
  },
  {
    title: 'Mission Explorer & Sol-by-Sol Traverses',
    subtitle: 'Follow Perseverance, Curiosity, Opportunity & Orbiters',
    icon: Radio,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    description:
      'Browse historical and active Mars missions from NASA, ESA, CNSA, and UAESA. Select Perseverance or Curiosity to trace their exact rover tracks, inspect rock core samples, and activate "Follow Rover" mode to step through their discoveries chronologically.',
    tips: 'Select any rover to fly directly to its landing site and examine its traverse history.',
    actionKey: 'missions' as const,
    actionLabel: 'Launch Mission Explorer',
  },
  {
    title: 'Human Mission Mode & ISRU Evaluation',
    subtitle: 'Candidate Landing Zones & Multi-Criteria Safety Models',
    icon: Shield,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    description:
      'Evaluate future crewed exploration sites (Arcadia Planitia, Deuteronilus Mensae, Utopia Planitia, Jezero, Mawrth). Analyze atmospheric aerobraking thickness, solar energy, subsurface radar ice depth, and In-Situ Resource Utilization (ISRU) return propellant production timelines.',
    tips: 'Candidate zones clearly distinguish Observed data from Derived engineering criteria and Simulations.',
    actionKey: 'human' as const,
    actionLabel: 'Open Human Mission Mode',
  },
  {
    title: 'Ask MarsWay — AI Spatial Assistant',
    subtitle: 'Gemini-Powered Natural Language Map Control',
    icon: Sparkles,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    description:
      'Interact with an AI assistant that understands Martian geography and executes real map actions. Ask questions like "Take me to Olympus Mons", "Compare Jezero and Gale Crater", or "Where is subsurface ice?" to immediately fly, compare, or activate layers.',
    tips: 'Grounds answers in official NASA PDS, MOLA, and THEMIS catalogs with transparent citations.',
    actionKey: 'ai' as const,
    actionLabel: 'Open Ask MarsWay',
  },
];

export function MarsPlatformTourModal({
  isOpen,
  onClose,
  onSelectAction,
}: MarsPlatformTourModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleActionClick = () => {
    onSelectAction?.(step.actionKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0c1017] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-orange-400 font-bold uppercase tracking-wider">
              Platform Walkthrough
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-xs font-mono text-neutral-400">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl border shrink-0 ${step.color}`}>
              <Icon className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight">{step.title}</h3>
              <p className="text-xs font-mono text-neutral-400">{step.subtitle}</p>
            </div>
          </div>

          <p className="text-sm text-neutral-300 leading-relaxed font-sans">{step.description}</p>

          {/* Quick Tip Box */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-400 flex items-start gap-2.5">
            <span className="font-mono text-orange-400 font-bold uppercase text-[10px] shrink-0 pt-0.5">
              PRO TIP:
            </span>
            <span>{step.tips}</span>
          </div>

          {/* Action Trigger */}
          <div className="pt-1">
            <button
              onClick={handleActionClick}
              className="text-xs font-mono text-orange-400 hover:text-orange-300 flex items-center gap-1.5 transition"
            >
              <span>{step.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  currentStep === i ? 'w-6 bg-orange-500' : 'w-2 bg-neutral-700 hover:bg-neutral-500'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 transition flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Prev
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-lg transition flex items-center gap-1.5"
            >
              {currentStep === TOUR_STEPS.length - 1 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Get Started
                </>
              ) : (
                <>
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
