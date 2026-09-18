import { NASA_DATASET_CATALOG } from '../../data/provenanceData';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { X, FileText, Database, Shield, AlertTriangle, ExternalLink, Cpu, Layers } from 'lucide-react';

interface MethodologyModalProps {
  onClose: () => void;
}

export function MethodologyModal({ onClose }: MethodologyModalProps) {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl font-mono text-xs text-neutral-300">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-900 z-10">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Data Sources, Methodology & Scientific Provenance
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Architecture Pipeline Diagram */}
          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2">
            <div className="text-orange-400 font-bold uppercase text-xs flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Multi-Mission Data Fusion Architecture
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Decades of robotic Mars exploration datasets are ingested, standardized to the IAU 2000 planetocentric coordinate frame, and normalized to the MOLA zero-datum areoid before feeding into the multi-objective graph solver.
            </p>
            <div className="bg-neutral-900/90 p-3 rounded border border-neutral-800 font-mono text-[10px] text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed">
{`RAW NASA DATA (PDS Archives)
  ├── MOLA MEGDR Topography (MGS)
  ├── HiRISE Stereo DTM & Imagery (MRO)
  ├── CRISM Hyperspectral Parameter Maps (MRO)
  ├── MEDA Atmospheric Sensor Logs (Mars 2020)
  ├── RAD Radiation Telemetry (MSL Curiosity)
  └── In-Situ Rover Traverses (Perseverance / Curiosity)
       ↓
PREPROCESSING & SPATIAL ETL
  ├── Geodetic Normalization (IAU 2000 Mars Sphere R = 3,396.19 km)
  ├── Elevation Referencing (MOLA Gravity Areoid 0 km)
  └── Temporal Categorization (OBSERVED | HISTORICAL | DERIVED | MODELED | SIMULATED)
       ↓
UNIFIED MARTIAN SPATIAL REPOSITORY
  ├── Discrete Elevation & Slope Mesh
  ├── Spatial Proximity KD-Trees for Science & Hazards
  └── Bioenergetic Speed & Calorie Model (Margaria-Minetti 0.38g)
       ↓
SCIENCE-AWARE MULTI-OBJECTIVE ROUTING ENGINE
  └── Pareto Candidate Generator (Route A: Efficiency | Route B: Science | Route C: Safety)`}
            </div>
          </div>

          {/* NASA Dataset Catalog */}
          <div className="space-y-3">
            <div className="text-white font-bold uppercase text-xs flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              Verified NASA Planetary Data System (PDS) Datasets
            </div>

            <div className="space-y-3">
              {NASA_DATASET_CATALOG.map((ds) => (
                <div key={ds.id} className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-white text-xs">{ds.datasetTitle}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-500">{ds.category}</span>
                      <ProvenanceBadge status={ds.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-neutral-300">
                    <div>Mission: <strong className="text-orange-300">{ds.mission}</strong></div>
                    <div>Instrument: <strong className="text-cyan-300">{ds.instrument}</strong></div>
                    <div>Spatial: <span className="text-neutral-400">{ds.spatialCoverage}</span></div>
                    <div>Temporal: <span className="text-neutral-400">{ds.temporalCoverage}</span></div>
                  </div>

                  <div className="text-[11px] text-neutral-400">
                    <strong className="text-neutral-300">Processing Pipeline:</strong> {ds.processingPipeline}
                  </div>

                  <div className="text-[10px] text-amber-300/80 bg-amber-950/20 p-2 rounded border border-amber-900/30">
                    <strong>Uncertainty & Spatial Constraints:</strong> {ds.uncertaintyNotes}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scientific Honesty and Limitations */}
          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2.5">
            <div className="text-red-400 font-bold uppercase text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Scientific Honesty & Explicit Operational Limitations
            </div>
            <ul className="space-y-1.5 text-neutral-400 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-red-400 font-bold">•</span>
                <span><strong>No Flight Certification:</strong> MARSWAY is a conceptual decision-support system built for the 2026 NASA Space Apps Challenge and has not undergone flight readiness verification.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-red-400 font-bold">•</span>
                <span><strong>Orbital vs Surface Scale Gap:</strong> Orbital MOLA elevation (463 m/px) provides macroscopic regional topography. Sub-meter boulder obstacles are captured from HiRISE where available, but uncharacterized areas may harbor undetected micro-hazards.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-red-400 font-bold">•</span>
                <span><strong>Historical Weather vs Live Forecasting:</strong> In-situ MEDA and REMS records reflect historical diurnal baselines. They represent Martian climatology, not real-time weather forecasts.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-red-400 font-bold">•</span>
                <span><strong>Radiation Spatial Modeling:</strong> Primary radiation data originates from the MSL RAD instrument at Gale Crater. Measurements at Jezero Crater are modeled based on atmospheric column shielding.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-800 flex justify-end bg-neutral-900">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold transition-colors"
          >
            Close Methodology Explorer
          </button>
        </div>
      </div>
    </div>
  );
}
