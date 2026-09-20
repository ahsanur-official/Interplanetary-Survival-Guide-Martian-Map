import { useState } from 'react';
import {
  X,
  Database,
  ExternalLink,
  ShieldCheck,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface DataSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataSourcesModal({ isOpen, onClose }: DataSourcesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-4xl bg-[#0c1017] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-neutral-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
                Scientific Data Provenance & Sources
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  Transparency Protocol
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Authoritative orbital sensors, surface in-situ instruments, and modeling methodologies
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Provenance Tier Definitions */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
              Scientific Classification Framework
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="bg-emerald-950/30 border border-emerald-800/50 p-3 rounded-lg space-y-1">
                <span className="inline-block text-[11px] font-mono font-bold text-emerald-400">
                  [Observed Data]
                </span>
                <p className="text-xs text-neutral-300">
                  Direct raw or calibrated measurements acquired by spacecraft sensors (e.g. MOLA laser pulses, HiRISE optics, REMS/MEDA transducers).
                </p>
              </div>

              <div className="bg-cyan-950/30 border border-cyan-800/50 p-3 rounded-lg space-y-1">
                <span className="inline-block text-[11px] font-mono font-bold text-cyan-400">
                  [Derived Analysis]
                </span>
                <p className="text-xs text-neutral-300">
                  Scientifically calculated or interpolated datasets (e.g. terrain slope gradients, orthodromic geodesic distances, diurnal thermal ranges).
                </p>
              </div>

              <div className="bg-purple-950/30 border border-purple-800/50 p-3 rounded-lg space-y-1">
                <span className="inline-block text-[11px] font-mono font-bold text-purple-400">
                  [Simulated Models]
                </span>
                <p className="text-xs text-neutral-300">
                  Physical computational models (e.g. astronomical Keplerian ephemeris coordinates, atmospheric scale heights, diurnal sol cycles).
                </p>
              </div>

              <div className="bg-amber-950/30 border border-amber-800/50 p-3 rounded-lg space-y-1">
                <span className="inline-block text-[11px] font-mono font-bold text-amber-400">
                  [Experimental]
                </span>
                <p className="text-xs text-neutral-300">
                  Exploratory concepts (e.g. human mission EVA landing site weightings, Web Audio terrain elevation sonification synthesis).
                </p>
              </div>
            </div>
          </div>

          {/* Primary Datasets Catalog */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
              Primary Planetary Datasets & Spacecraft Instrumentation
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              {/* 1. Viking MDIM */}
              <div className="p-3.5 rounded-lg bg-neutral-900/70 border border-neutral-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">
                    NASA Viking Orbiter MDIM 2.1 Mars Digital Image Mosaic
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                    Observed Imagery
                  </span>
                </div>
                <p className="text-neutral-400 font-sans">
                  Compiled by USGS Astrogeology from thousands of clean Viking Orbiter clear-filter frames normalized to 231 meters/pixel planetary resolution. Provides natural surface albedo and planetary visual features.
                </p>
                <div className="text-[11px] text-neutral-500 pt-1">
                  Provider: USGS Astrogeology Science Center / NASA Planetary Data System (PDS)
                </div>
              </div>

              {/* 2. MOLA Elevation */}
              <div className="p-3.5 rounded-lg bg-neutral-900/70 border border-neutral-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">
                    MGS MOLA Precision Elevation & Topography Grid
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                    Observed Altimetry
                  </span>
                </div>
                <p className="text-neutral-400 font-sans">
                  Laser altimeter measurements from Mars Global Surveyor firing 10 Hz pulses across 600+ million soundings. Establishes the official Martian topographic zero-datum (areoid).
                </p>
                <div className="text-[11px] text-neutral-500 pt-1">
                  Provider: NASA Goddard Space Flight Center (GSFC) / PDS Geosciences Node
                </div>
              </div>

              {/* 3. THEMIS Infrared */}
              <div className="p-3.5 rounded-lg bg-neutral-900/70 border border-neutral-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">
                    Mars Odyssey THEMIS Thermal Infrared Global Mosaic
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                    Observed Thermal IR
                  </span>
                </div>
                <p className="text-neutral-400 font-sans">
                  Multi-band thermal infrared imagery at 100m/pixel. Daytime thermal radiance distinguishes bedrock, dust cover, and coarse gravel based on thermal inertia.
                </p>
                <div className="text-[11px] text-neutral-500 pt-1">
                  Provider: Arizona State University (ASU) Mars Space Flight Facility / NASA JPL
                </div>
              </div>

              {/* 4. Subsurface Ice & Radar */}
              <div className="p-3.5 rounded-lg bg-neutral-900/70 border border-neutral-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">
                    MRO SHARAD Radar & Subsurface Water Ice Mapping (SWIM)
                  </span>
                  <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                    Observed + Derived
                  </span>
                </div>
                <p className="text-neutral-400 font-sans">
                  Shallow Radar 15–25 MHz sounding observations detecting subsurface dielectric permittivity boundaries, confirming pure glacial ice sheets across Arcadia Planitia, Deuteronilus Mensae, and Utopia Planitia.
                </p>
                <div className="text-[11px] text-neutral-500 pt-1">
                  Provider: Italian Space Agency (ASI) / NASA JPL / Planetary Science Institute (PSI)
                </div>
              </div>

              {/* 5. Surface Weather Stations */}
              <div className="p-3.5 rounded-lg bg-neutral-900/70 border border-neutral-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">
                    In-Situ Atmospheric Telemetry (MEDA & REMS)
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                    Observed In-Situ
                  </span>
                </div>
                <p className="text-neutral-400 font-sans">
                  Surface meteorological instrumentation aboard Mars 2020 Perseverance (MEDA) and MSL Curiosity (REMS) measuring local atmospheric pressure, ground temperature, wind speed, and optical dust tau.
                </p>
                <div className="text-[11px] text-neutral-500 pt-1">
                  Provider: Centro de Astrobiología (CAB / CSIC-INTA) / NASA JPL
                </div>
              </div>

              {/* 6. IAU Nomenclature */}
              <div className="p-3.5 rounded-lg bg-neutral-900/70 border border-neutral-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">
                    IAU / USGS Gazetteer of Planetary Nomenclature
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                    Official Standards
                  </span>
                </div>
                <p className="text-neutral-400 font-sans">
                  Official feature names, coordinates, crater diameters, and descriptor terms approved by the Working Group for Planetary System Nomenclature (WGPSN) of the International Astronomical Union.
                </p>
                <div className="text-[11px] text-neutral-500 pt-1">
                  Provider: International Astronomical Union (IAU) / USGS Astrogeology
                </div>
              </div>
            </div>
          </div>

          {/* Attribution & Legal Notice */}
          <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800/80 text-xs text-neutral-400 space-y-1">
            <span className="font-bold text-white font-mono uppercase block text-[11px]">
              Scientific Usage & Disclaimers
            </span>
            <p className="leading-relaxed">
              MarsWay is an educational and planetary exploration intelligence platform. Imagery and data products courtesy of NASA/JPL-Caltech/USGS/ESA/CNSA/UAESA. All planetary coordinates adhere to IAU planetocentric longitude conventions (0° to 360° East).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
