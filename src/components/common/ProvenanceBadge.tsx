import { DataStatus } from '../../types/mars';
import { ShieldCheck, History, Cpu, Sparkles, AlertCircle } from 'lucide-react';

interface ProvenanceBadgeProps {
  status: DataStatus;
  size?: 'sm' | 'md';
  showTooltip?: boolean;
}

export function ProvenanceBadge({ status, size = 'sm', showTooltip = true }: ProvenanceBadgeProps) {
  const config = {
    OBSERVED: {
      label: 'OBSERVED',
      bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
      icon: ShieldCheck,
      desc: 'Direct, primary in-situ or remote sensor measurement calibrated by NASA instrument science team.',
    },
    HISTORICAL: {
      label: 'HISTORICAL',
      bg: 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300',
      icon: History,
      desc: 'Authentic archival observation recorded during mission operations. Not real-time weather.',
    },
    DERIVED: {
      label: 'DERIVED',
      bg: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
      icon: Cpu,
      desc: 'Processed scientific product (e.g., stereo DTM slope, spectral absorption index ratio).',
    },
    MODELED: {
      label: 'MODELED',
      bg: 'bg-purple-950/70 border-purple-500/40 text-purple-300',
      icon: Sparkles,
      desc: 'Physics-based extrapolation or numerical model (e.g., atmospheric column radiation shielding).',
    },
    SIMULATED: {
      label: 'SIMULATED DATA',
      bg: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
      icon: AlertCircle,
      desc: 'Synthetic validation scenario for mission planner testing. Clearly isolated from observed facts.',
    },
  }[status];

  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold border rounded-full tracking-wider uppercase transition-colors select-none ${config.bg} ${sizeClasses}`}
      title={showTooltip ? config.desc : undefined}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
}
