import { MapLayerConfig } from '../../types/mars';
import { Layers, Mountain, Activity, AlertTriangle, Disc, Radio, Eye, Droplets, MapPin } from 'lucide-react';

interface MapLayerControlsProps {
  layers: MapLayerConfig;
  onToggleLayer: (layerKey: keyof MapLayerConfig) => void;
}

export function MapLayerControls({ layers, onToggleLayer }: MapLayerControlsProps) {
  const layerList: {
    key: keyof MapLayerConfig;
    label: string;
    icon: any;
    source: string;
    color: string;
  }[] = [
    {
      key: 'terrainElevation',
      label: 'Elevation Topography',
      icon: Mountain,
      source: 'MGS MOLA & HRSC',
      color: 'text-amber-400',
    },
    {
      key: 'slopeHeatmap',
      label: 'Slope Risk Gradient',
      icon: Activity,
      source: 'HiRISE & MOLA Derived',
      color: 'text-red-400',
    },
    {
      key: 'hazardZones',
      label: 'Terrain Hazards & Scarps',
      icon: AlertTriangle,
      source: 'MRO HiRISE & Rover Hazcams',
      color: 'text-orange-400',
    },
    {
      key: 'scienceTargets',
      label: 'Scientific Targets',
      icon: Disc,
      source: 'PDS Science Archives',
      color: 'text-amber-300',
    },
    {
      key: 'roverTraverse',
      label: 'Rover Traverse & Sols',
      icon: Radio,
      source: 'NASA In-Situ Traverse Logs',
      color: 'text-purple-400',
    },
    {
      key: 'resourceLocations',
      label: 'Water/Clay Resources',
      icon: Droplets,
      source: 'MRO CRISM Hyperspectral',
      color: 'text-cyan-400',
    },
    {
      key: 'candidateRoutes',
      label: 'Marswalk Candidate Routes',
      icon: MapPin,
      source: 'MARSWAY Multi-Objective Engine',
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3 text-xs font-mono text-neutral-200 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
        <div className="flex items-center gap-1.5 font-bold tracking-wider text-neutral-300 uppercase">
          <Layers className="w-3.5 h-3.5 text-orange-400" />
          <span>Integrated Map Layers</span>
        </div>
        <span className="text-[10px] text-neutral-500">TOGGLE VIEW</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {layerList.map((item) => {
          const Icon = item.icon;
          const isChecked = layers[item.key];
          return (
            <button
              key={item.key}
              id={`layer-toggle-${item.key}`}
              onClick={() => onToggleLayer(item.key)}
              className={`flex items-center justify-between p-2 rounded border text-left transition-all ${
                isChecked
                  ? 'bg-neutral-800/90 border-neutral-700 text-white shadow-sm'
                  : 'bg-neutral-950/40 border-neutral-800/60 text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isChecked ? item.color : 'text-neutral-600'}`} />
                <div className="truncate">
                  <div className="truncate font-medium">{item.label}</div>
                  <div className="text-[9px] text-neutral-500 truncate">{item.source}</div>
                </div>
              </div>
              <div
                className={`w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center text-[9px] ml-1.5 ${
                  isChecked
                    ? 'bg-orange-600 border-orange-500 text-white font-bold'
                    : 'border-neutral-700 bg-neutral-900'
                }`}
              >
                {isChecked ? '✓' : ''}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
