import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Wind,
  ShieldAlert,
  Bot,
  CloudRain,
  X,
  AlertTriangle,
  Camera,
} from 'lucide-react';
import {
  analyzeMarsLocationScience,
} from '../../engine/marsEnvironmentalAnalysis';

interface MarsScienceDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
  elevationM: number;
  featureName?: string;
  featureType?: string;
  onOpenNASACloseUp?: (name: string) => void;
}

export const MarsScienceDossierModal: React.FC<MarsScienceDossierModalProps> = ({
  isOpen,
  onClose,
  lat,
  lng,
  elevationM,
  featureName,
  featureType,
  onOpenNASACloseUp,
}) => {
  const [activeTab, setActiveTab] = useState<'water' | 'atmosphere' | 'safety' | 'rain'>('water');

  // Handle escape key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const science = analyzeMarsLocationScience(lat, lng, elevationM);

  const handleClose = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto select-text"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#0b0f19] border border-orange-500/40 rounded-2xl shadow-2xl overflow-hidden text-neutral-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-neutral-800 bg-[#0e1422] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-orange-950/90 text-orange-400 border border-orange-800/80 font-mono text-[10px] font-bold uppercase tracking-wider">
                {featureType || 'SURFACE SECTOR'}
              </span>
              <span className="text-xs font-mono text-neutral-400">
                {lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`},{' '}
                {lng >= 0 ? `${lng.toFixed(2)}°E` : `${Math.abs(lng).toFixed(2)}°W`}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1">
              {featureName || 'Martian Coordinate Science Dossier'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              NASA In-Situ Environmental, Atmospheric & Habitability Telemetry
            </p>
          </div>

          <button
            type="button"
            aria-label="Close dossier modal"
            onClick={handleClose}
            onTouchEnd={handleClose}
            className="p-2 rounded-xl bg-neutral-800/90 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-all cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Category Tabs */}
        <div className="flex items-center border-b border-neutral-800 bg-[#080c14] overflow-x-auto scrollbar-none shrink-0 px-2">
          <button
            type="button"
            onClick={() => setActiveTab('water')}
            className={`px-3 sm:px-4 py-3 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
              activeTab === 'water'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span>Water & Subsurface Ice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('atmosphere')}
            className={`px-3 sm:px-4 py-3 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
              activeTab === 'atmosphere'
                ? 'border-orange-400 text-orange-300 bg-orange-950/20'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Wind className="w-4 h-4 text-orange-400" />
            <span>Atmospheric Composition</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('safety')}
            className={`px-3 sm:px-4 py-3 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
              activeTab === 'safety'
                ? 'border-rose-400 text-rose-300 bg-rose-950/20'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Human & Rover Safety</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rain')}
            className={`px-3 sm:px-4 py-3 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
              activeTab === 'rain'
                ? 'border-indigo-400 text-indigo-300 bg-indigo-950/20'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <CloudRain className="w-4 h-4 text-indigo-400" />
            <span>Precipitation & Climatology</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: WATER & SUBSURFACE ICE */}
          {activeTab === 'water' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/60 flex items-start gap-3">
                <Droplets className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-cyan-200">
                    Water Ice Status & Geological Reservoirs
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    {science.water.summary}
                  </p>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800">
                  <span className="text-[10.5px] font-mono text-neutral-400 block">
                    Depth to Ice / Reservoir
                  </span>
                  <span className="text-sm font-bold text-white mt-1 block">
                    {science.water.depthDisplay}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800">
                  <span className="text-[10.5px] font-mono text-neutral-400 block">
                    Estimated Volumetric Abundance
                  </span>
                  <span className="text-sm font-bold text-cyan-300 mt-1 block">
                    {science.water.abundanceDisplay}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800">
                  <span className="text-[10.5px] font-mono text-neutral-400 block">
                    Confidence / Detection Chance
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {science.water.probabilityChance}%
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {science.water.probabilityRating.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Probability meter visual */}
              <div className="p-3.5 rounded-xl bg-neutral-900/70 border border-neutral-800">
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-neutral-400">Subsurface Water Probability Meter</span>
                  <span className="text-cyan-400 font-bold">{science.water.probabilityChance}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${science.water.probabilityChance}%` }}
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-2 font-mono">
                  {science.water.scientificNotes}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ATMOSPHERE & GASES */}
          {activeTab === 'atmosphere' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-orange-950/30 border border-orange-800/60 flex items-start gap-3">
                <Wind className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-orange-200">
                    Surface Atmospheric Pressure & In-Situ Gas Telemetry
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    {science.atmosphere.summary}
                  </p>
                </div>
              </div>

              {/* Surface Pressure Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800">
                  <span className="text-[10.5px] font-mono text-neutral-400 block">
                    Surface Barometric Pressure
                  </span>
                  <span className="text-sm font-bold text-white mt-1 block font-mono">
                    {science.atmosphere.pressureDisplay}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800">
                  <span className="text-[10.5px] font-mono text-neutral-400 block">
                    Trace Methane & Vapor Concentration
                  </span>
                  <span className="text-sm font-bold text-amber-300 mt-1 block font-mono">
                    CH₄: {science.atmosphere.traceMethanePpb} ppb • H₂O: {science.atmosphere.waterVaporPpm} ppm
                  </span>
                </div>
              </div>

              {/* Gas Composition Table */}
              <div className="p-3.5 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-2.5">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Atmospheric Gas Volumetric Fractions
                </h5>

                <div className="space-y-2">
                  {science.atmosphere.gases.map((gas) => (
                    <div key={gas.name} className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: gas.color }}
                          />
                          <span className="font-bold text-white">{gas.name}</span>
                          <span className="font-mono text-neutral-400 text-[11px]">({gas.formula})</span>
                        </div>
                        <span className="font-mono font-bold text-white text-sm">
                          {gas.percentage}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-neutral-400 mt-1 pl-4.5">
                        {gas.notes}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAFETY (HUMAN & ROVER) */}
          {activeTab === 'safety' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Human Safety Alert */}
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-700/60 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-200">
                    Human Survivability: Lethal Unpressurized Environment
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    {science.humanSafety.summary}
                  </p>
                </div>
              </div>

              {/* Human Hazard Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800">
                  <span className="text-[10.5px] font-mono text-neutral-400 block">
                    Life Support Requirement
                  </span>
                  <span className="text-xs font-bold text-rose-400 mt-1 block">
                    {science.humanSafety.suitRequirement}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800">
                  <span className="text-[10.5px] font-mono text-neutral-400 block">
                    Surface Cosmic Radiation
                  </span>
                  <span className="text-xs font-bold text-amber-300 mt-1 block font-mono">
                    {science.humanSafety.radiationDisplay}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800">
                  <span className="text-[10.5px] font-mono text-neutral-400 block">
                    Diurnal Surface Temperature
                  </span>
                  <span className="text-xs font-bold text-cyan-300 mt-1 block font-mono">
                    {science.humanSafety.tempDisplay}
                  </span>
                </div>
              </div>

              {/* Robot & Vehicle Safety Section */}
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/60 space-y-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-400 shrink-0" />
                  <h4 className="text-sm font-bold text-blue-200">
                    Robotic Rover & Vehicle Traversability Assessment
                  </h4>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {science.vehicleSafety.summary}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-blue-900/40 text-[11px] font-mono">
                  <div>
                    <span className="text-neutral-400">Wheel Sinkage Risk:</span>{' '}
                    <strong className={science.vehicleSafety.wheelSlipRisk === 'Low' ? 'text-emerald-400' : 'text-amber-400'}>
                      {science.vehicleSafety.wheelSlipRisk}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-400">Geomorphologic Slope:</span>{' '}
                    <strong className="text-white">{science.vehicleSafety.slopeDegrees}°</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRECIPITATION & RAIN */}
          {activeTab === 'rain' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/60 flex items-start gap-3">
                <CloudRain className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-indigo-200">
                    Precipitation & Meteorological Phenomena
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    {science.precipitation.summary}
                  </p>
                </div>
              </div>

              {/* Liquid Rain Impossibility Card */}
              <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Liquid Rainfall Probability:</span>
                  <span className="font-mono font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-950 border border-rose-800">
                    {science.precipitation.liquidRainProbability}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {science.precipitation.liquidRainExplanation}
                </p>
              </div>

              {/* Snow & Frost Phenomena */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800">
                  <span className="text-[10.5px] font-mono text-neutral-400 block">
                    Snow & Solid Precipitation
                  </span>
                  <span className="text-xs font-bold text-cyan-300 mt-1 block">
                    {science.precipitation.snowType}
                  </span>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    {science.precipitation.snowChance}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800">
                  <span className="text-[10.5px] font-mono text-neutral-400 block">
                    Frost Condensation Dynamics
                  </span>
                  <span className="text-xs font-bold text-white mt-1 block">
                    {science.precipitation.frostOccurrence}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-neutral-800 bg-[#0a0e1a] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] font-mono text-neutral-400">
            Elevation: <strong className="text-white">{elevationM > 0 ? `+${elevationM}m` : `${elevationM}m`}</strong>
          </div>

          <div className="flex items-center gap-2">
            {onOpenNASACloseUp && featureName && (
              <button
                type="button"
                onClick={() => onOpenNASACloseUp(featureName)}
                className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>NASA HiRISE Photos</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              onTouchEnd={handleClose}
              className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors cursor-pointer border border-neutral-700"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
