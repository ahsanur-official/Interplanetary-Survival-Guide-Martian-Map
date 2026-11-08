import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Layers, ArrowLeftRight, Check, Eye } from 'lucide-react';

export type SwipeLayerType = 'viking' | 'mola' | 'themis' | 'slope' | 'crism_minerals' | 'subsurface_ice';

export interface MarsSwipeCompareProps {
  isOpen: boolean;
  onClose: () => void;
  leftLayer: SwipeLayerType;
  rightLayer: SwipeLayerType;
  onChangeLeftLayer: (layer: SwipeLayerType) => void;
  onChangeRightLayer: (layer: SwipeLayerType) => void;
  sliderPosition: number; // 0 to 100 percentage
  onChangeSliderPosition: (pos: number) => void;
}

export const SWIPE_LAYER_METADATA: Record<
  SwipeLayerType,
  { name: string; mission: string; instrument: string; resolution: string; color: string }
> = {
  viking: {
    name: 'Viking MDIM2.1 Color',
    mission: 'Viking Orbiters 1 & 2',
    instrument: 'Visual Imaging Subsystem (VIS)',
    resolution: '232 m/px global mosaic',
    color: '#ea580c',
  },
  mola: {
    name: 'MOLA Topographic Relief',
    mission: 'Mars Global Surveyor (MGS)',
    instrument: 'Mars Orbiter Laser Altimeter (MOLA)',
    resolution: '463 m/px IAU 2000 Areoid datum',
    color: '#3b82f6',
  },
  themis: {
    name: 'THEMIS Thermal Infrared',
    mission: '2001 Mars Odyssey',
    instrument: 'Thermal Emission Imaging System (THEMIS IR)',
    resolution: '100 m/px day thermal inertia',
    color: '#a855f7',
  },
  slope: {
    name: 'MOLA Slope Gradient Map',
    mission: 'MGS / MOLA Derived',
    instrument: 'Laser Altimeter Surface Normal Derivatives',
    resolution: '463 m/px (Green <5°, Red >20°)',
    color: '#ef4444',
  },
  crism_minerals: {
    name: 'CRISM & OMEGA Mineralogy',
    mission: 'MRO & Mars Express',
    instrument: 'CRISM (Hyperspectral) & OMEGA',
    resolution: '18 m/px targeted (Clays/Carbonates/Sulfates)',
    color: '#10b981',
  },
  subsurface_ice: {
    name: 'Subsurface Water Ice / WEH',
    mission: 'Mars Odyssey / MRO SHARAD',
    instrument: 'Neutron Spectrometer (MONS) & Shallow Radar',
    resolution: '25 km global neutron / 15 m vertical radar',
    color: '#06b6d4',
  },
};

export const MarsSwipeCompare: React.FC<MarsSwipeCompareProps> = ({
  isOpen,
  onClose,
  leftLayer,
  rightLayer,
  onChangeLeftLayer,
  onChangeRightLayer,
  sliderPosition,
  onChangeSliderPosition,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;
      const x = e.clientX;
      const width = window.innerWidth;
      const clampedPct = Math.max(5, Math.min(95, (x / width) * 100));
      onChangeSliderPosition(clampedPct);
    },
    [isDragging, onChangeSliderPosition]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    } else {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  if (!isOpen) return null;

  return (
    <>
      {/* Vertical Split Divider Bar across entire viewport */}
      <div
        className="fixed inset-y-0 z-30 pointer-events-none select-none"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Glowing Split Line */}
        <div className="absolute inset-y-0 -left-[1.5px] w-[3px] bg-white shadow-[0_0_12px_rgba(255,255,255,0.8),0_0_24px_rgba(56,189,248,0.6)]" />

        {/* Center Draggable Slider Handle */}
        <div
          onPointerDown={handlePointerDown}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-neutral-950/95 border-2 border-white shadow-2xl flex items-center justify-center pointer-events-auto cursor-ew-resize hover:scale-110 active:scale-95 transition-transform"
          title="Drag left or right to swipe-compare layers"
        >
          <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
        </div>

        {/* Left Layer Label Tag */}
        <div className="absolute top-20 right-3 px-2.5 py-1 rounded-xl bg-neutral-950/90 border border-white/20 text-white font-mono text-[10px] font-bold shadow-xl backdrop-blur-md whitespace-nowrap pointer-events-none">
          ◀ {SWIPE_LAYER_METADATA[leftLayer].name}
        </div>

        {/* Right Layer Label Tag */}
        <div className="absolute top-20 left-3 px-2.5 py-1 rounded-xl bg-neutral-950/90 border border-white/20 text-white font-mono text-[10px] font-bold shadow-xl backdrop-blur-md whitespace-nowrap pointer-events-none">
          {SWIPE_LAYER_METADATA[rightLayer].name} ▶
        </div>
      </div>

      {/* Floating Control Box to Switch Left/Right Compare Layers */}
      <div
        ref={containerRef}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-35 pointer-events-auto bg-[#070b14]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl shadow-black/90 p-3 sm:p-4 text-xs text-neutral-200 max-w-[94vw] sm:max-w-lg w-full font-sans animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">Swipe-Compare Planetary Layers</div>
              <div className="text-[10px] text-neutral-400 font-mono">
                Drag vertical divider ({sliderPosition.toFixed(0)}% split)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selectors for Left Layer and Right Layer */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Left Side Layer Selector */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-cyan-400 block">
              Left Pane Layer
            </label>
            <select
              value={leftLayer}
              onChange={(e) => onChangeLeftLayer(e.target.value as SwipeLayerType)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {(Object.keys(SWIPE_LAYER_METADATA) as SwipeLayerType[]).map((key) => (
                <option key={key} value={key}>
                  {SWIPE_LAYER_METADATA[key].name}
                </option>
              ))}
            </select>
            <div className="text-[9.5px] text-neutral-400 font-mono">
              {SWIPE_LAYER_METADATA[leftLayer].mission} • {SWIPE_LAYER_METADATA[leftLayer].resolution}
            </div>
          </div>

          {/* Right Side Layer Selector */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-amber-400 block">
              Right Pane Layer
            </label>
            <select
              value={rightLayer}
              onChange={(e) => onChangeRightLayer(e.target.value as SwipeLayerType)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {(Object.keys(SWIPE_LAYER_METADATA) as SwipeLayerType[]).map((key) => (
                <option key={key} value={key}>
                  {SWIPE_LAYER_METADATA[key].name}
                </option>
              ))}
            </select>
            <div className="text-[9.5px] text-neutral-400 font-mono">
              {SWIPE_LAYER_METADATA[rightLayer].mission} • {SWIPE_LAYER_METADATA[rightLayer].resolution}
            </div>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-white/10 mt-2 text-[10px]">
          <span className="text-neutral-400 font-bold uppercase">Presets:</span>
          <button
            type="button"
            onClick={() => {
              onChangeLeftLayer('viking');
              onChangeRightLayer('mola');
              onChangeSliderPosition(50);
            }}
            className="px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-mono cursor-pointer"
          >
            Viking vs MOLA
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeLeftLayer('mola');
              onChangeRightLayer('slope');
              onChangeSliderPosition(50);
            }}
            className="px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-mono cursor-pointer"
          >
            MOLA vs Slope
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeLeftLayer('viking');
              onChangeRightLayer('crism_minerals');
              onChangeSliderPosition(50);
            }}
            className="px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-mono cursor-pointer"
          >
            Visible vs CRISM
          </button>
        </div>
      </div>
    </>
  );
};
