import React, { useEffect, useState } from 'react';
import L from 'leaflet';

interface MarsScaleBarProps {
  map: L.Map | null;
}

const MARS_RADIUS_METERS = 3389500; // IAU standard volumetric mean radius of Mars

const SCALE_CANDIDATES_METERS = [
  50, 100, 200, 500, 1000, 2000, 5000, 10000, 25000, 50000,
  100000, 250000, 500000, 1000000, 2000000, 5000000
];

export const MarsScaleBar: React.FC<MarsScaleBarProps> = ({ map }) => {
  const [scaleData, setScaleData] = useState<{
    widthPx: number;
    distanceMeters: number;
    label: string;
    halfLabel: string;
    milesLabel: string;
    latitude: number;
  } | null>(null);

  useEffect(() => {
    if (!map) return;

    const updateScale = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const lat = Math.max(-85, Math.min(85, center.lat));
      const latRad = (lat * Math.PI) / 180;

      // Ground resolution on Mars spheroid in meters per pixel:
      const metersPerPixel =
        (2 * Math.PI * MARS_RADIUS_METERS * Math.cos(latRad)) / (256 * Math.pow(2, zoom));

      // Target bar width ~ 100px
      const targetMeters = 100 * metersPerPixel;

      // Find closest standard round distance
      let selectedMeters = SCALE_CANDIDATES_METERS[0];
      for (const cand of SCALE_CANDIDATES_METERS) {
        if (cand >= targetMeters * 0.7) {
          selectedMeters = cand;
          break;
        }
      }

      const widthPx = Math.max(65, Math.min(160, Math.round(selectedMeters / metersPerPixel)));
      const halfMeters = selectedMeters / 2;

      // Formatting labels
      let label = '';
      let halfLabel = '';
      if (selectedMeters >= 1000) {
        const km = selectedMeters / 1000;
        label = `${km} km`;
        halfLabel = `${km / 2}`;
      } else {
        label = `${selectedMeters} m`;
        halfLabel = `${halfMeters}`;
      }

      const miles = (selectedMeters / 1609.344).toFixed(selectedMeters < 3000 ? 1 : 0);
      const milesLabel = `${miles} mi`;

      setScaleData({
        widthPx,
        distanceMeters: selectedMeters,
        label,
        halfLabel,
        milesLabel,
        latitude: +lat.toFixed(1),
      });
    };

    updateScale();

    map.on('zoom', updateScale);
    map.on('move', updateScale);
    map.on('zoomend', updateScale);
    map.on('moveend', updateScale);

    return () => {
      map.off('zoom', updateScale);
      map.off('move', updateScale);
      map.off('zoomend', updateScale);
      map.off('moveend', updateScale);
    };
  }, [map]);

  if (!scaleData) return null;

  return (
    <div className="pointer-events-auto select-none bg-[#0c101a]/92 backdrop-blur-md border border-neutral-700/80 rounded-xl px-2.5 py-1.5 shadow-2xl text-[10px] flex flex-col gap-1 transition-all">
      {/* Top Labels: 0, midpoint, and max metric distance */}
      <div
        className="flex justify-between font-mono font-bold text-neutral-300 text-[9px] leading-none"
        style={{ width: `${scaleData.widthPx}px` }}
      >
        <span>0</span>
        <span className="text-neutral-500">{scaleData.halfLabel}</span>
        <span className="text-cyan-300">{scaleData.label}</span>
      </div>

      {/* Stepped Ruler Graphic */}
      <div
        className="relative h-2 border-b border-cyan-400/90 flex items-end"
        style={{ width: `${scaleData.widthPx}px` }}
      >
        {/* Left Tick */}
        <div className="absolute left-0 bottom-0 w-[1.5px] h-2 bg-cyan-400" />
        {/* Middle Tick */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[1px] h-1.5 bg-cyan-400/70" />
        {/* Right Tick */}
        <div className="absolute right-0 bottom-0 w-[1.5px] h-2 bg-cyan-400" />
        {/* Sub-divider bars */}
        <div className="w-1/2 h-0.5 bg-cyan-500/25" />
        <div className="w-1/2 h-0.5 bg-cyan-500/10" />
      </div>

      {/* Bottom Subtitle: Imperial miles & Mars Areoid tag */}
      <div
        className="flex items-center justify-between text-[8.5px] font-mono text-neutral-400 mt-0.5"
        style={{ width: `${scaleData.widthPx}px` }}
      >
        <span className="text-neutral-400">{scaleData.milesLabel}</span>
        <span className="text-orange-400/80 tracking-tighter">Mars R=3,389.5km</span>
      </div>
    </div>
  );
};
