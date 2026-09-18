import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  MarsRegion,
  MarsCoordinate,
  ScienceTarget,
  RoverObservation,
  HazardZone,
  ResourceSite,
  CandidateRoute,
  MapLayerConfig,
} from '../../types/mars';
import { getInterpolatedElevation } from '../../engine/multiObjectiveRouter';
import { calculateMarsDistanceMeters } from '../../engine/spatialMath';
import { ZoomIn, ZoomOut, Maximize2, Compass, Eye, ShieldAlert, Sparkles } from 'lucide-react';

interface MarsMapCanvasProps {
  region: MarsRegion;
  layers: MapLayerConfig;
  scienceTargets: ScienceTarget[];
  roverObservations: RoverObservation[];
  hazardZones: HazardZone[];
  resourceSites: ResourceSite[];
  candidateRoutes: CandidateRoute[];
  activeRouteId: string;
  selectedCoordinate: MarsCoordinate | null;
  onSelectCoordinate: (coord: MarsCoordinate, elevation: number, slope: number) => void;
  onSelectScienceTarget: (target: ScienceTarget) => void;
  onSelectHazard: (hazard: HazardZone) => void;
  onSelectResource: (resource: ResourceSite) => void;
  startCoordinate: MarsCoordinate;
  destCoordinate: MarsCoordinate;
  startName: string;
  destName: string;
}

export function MarsMapCanvas({
  region,
  layers,
  scienceTargets,
  roverObservations,
  hazardZones,
  resourceSites,
  candidateRoutes,
  activeRouteId,
  selectedCoordinate,
  onSelectCoordinate,
  onSelectScienceTarget,
  onSelectHazard,
  onSelectResource,
  startCoordinate,
  destCoordinate,
  startName,
  destName,
}: MarsMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Viewport transform: pan offset & zoom
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredCoord, setHoveredCoord] = useState<{ lat: number; lon: number; elev: number; slope: number } | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  // Coordinate to screen mapping
  const coordToScreen = useCallback(
    (coord: MarsCoordinate, width: number, height: number) => {
      const u = (coord.longitude - region.bounds.minLon) / (region.bounds.maxLon - region.bounds.minLon);
      const v = (region.bounds.maxLat - coord.latitude) / (region.bounds.maxLat - region.bounds.minLat);
      const cx = width / 2 + pan.x;
      const cy = height / 2 + pan.y;
      const size = Math.min(width, height) * 0.9 * zoom;
      const x = cx + (u - 0.5) * size;
      const y = cy + (v - 0.5) * size;
      return { x, y };
    },
    [region, pan, zoom]
  );

  const screenToCoord = useCallback(
    (screenX: number, screenY: number, width: number, height: number): MarsCoordinate => {
      const cx = width / 2 + pan.x;
      const cy = height / 2 + pan.y;
      const size = Math.min(width, height) * 0.9 * zoom;
      const u = (screenX - cx) / size + 0.5;
      const v = (screenY - cy) / size + 0.5;
      const lon = region.bounds.minLon + u * (region.bounds.maxLon - region.bounds.minLon);
      const lat = region.bounds.maxLat - v * (region.bounds.maxLat - region.bounds.minLat);
      return { latitude: lat, longitude: lon };
    },
    [region, pan, zoom]
  );

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI retina display
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // 1. Background (Deep Space / Mars Onyx)
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, width, height);

    // 2. Base Topography Terrain Rendering
    const gridSize = 45; // Mesh density
    const cx = width / 2 + pan.x;
    const cy = height / 2 + pan.y;
    const mapSize = Math.min(width, height) * 0.9 * zoom;

    // Precompute elevation mesh grid
    const elevMin = region.elevationRange[0];
    const elevMax = region.elevationRange[1];

    if (layers.terrainElevation) {
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const u = i / gridSize;
          const v = j / gridSize;
          const x0 = cx + (u - 0.5) * mapSize;
          const y0 = cy + (v - 0.5) * mapSize;
          const stepX = mapSize / gridSize;
          const stepY = mapSize / gridSize;

          const lon = region.bounds.minLon + u * (region.bounds.maxLon - region.bounds.minLon);
          const lat = region.bounds.maxLat - v * (region.bounds.maxLat - region.bounds.minLat);
          const elev = getInterpolatedElevation({ latitude: lat, longitude: lon }, region);

          // Hypsometric tinting for Mars (deep floor: aubergine/indigo, mids: ochre/terracotta, high rim: golden-buff)
          const normElev = Math.max(0, Math.min(1, (elev - elevMin) / (elevMax - elevMin)));
          
          let r = 0, g = 0, b = 0;
          if (normElev < 0.3) {
            // Low floor (-2570m to -2500m)
            const t = normElev / 0.3;
            r = Math.round(35 + t * 40);
            g = Math.round(25 + t * 25);
            b = Math.round(45 + t * 20);
          } else if (normElev < 0.7) {
            // Delta front & fan deposits (-2500m to -2400m)
            const t = (normElev - 0.3) / 0.4;
            r = Math.round(75 + t * 85);
            g = Math.round(50 + t * 45);
            b = Math.round(40 + t * 20);
          } else {
            // Elevated crater rim / buttes (-2400m to -2300m)
            const t = (normElev - 0.7) / 0.3;
            r = Math.round(160 + t * 65);
            g = Math.round(95 + t * 50);
            b = Math.round(55 + t * 30);
          }

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x0, y0, stepX + 0.5, stepY + 0.5);
        }
      }

      // Contour isolines overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 0.5;
      const contourSteps = 6;
      for (let s = 1; s < contourSteps; s++) {
        ctx.beginPath();
        // Subtle contour lines in the canvas area
        const rNorm = s / contourSteps;
        ctx.arc(cx, cy, (mapSize / 2) * rNorm, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 3. Slope Heatmap Layer (if enabled)
    if (layers.slopeHeatmap) {
      for (let i = 0; i < 28; i++) {
        for (let j = 0; j < 28; j++) {
          const u = i / 28;
          const v = j / 28;
          const x0 = cx + (u - 0.5) * mapSize;
          const y0 = cy + (v - 0.5) * mapSize;
          const stepX = mapSize / 28;
          const stepY = mapSize / 28;

          const lon = region.bounds.minLon + u * (region.bounds.maxLon - region.bounds.minLon);
          const lat = region.bounds.maxLat - v * (region.bounds.maxLat - region.bounds.minLat);
          const elev = getInterpolatedElevation({ latitude: lat, longitude: lon }, region);
          const elevN = getInterpolatedElevation({ latitude: lat + 0.003, longitude: lon }, region);
          const slope = Math.min(30, (Math.abs(elevN - elev) / 180) * 90);

          if (slope > 16) {
            // Impassable / Critical (>16°)
            ctx.fillStyle = 'rgba(239, 68, 68, 0.40)'; // Red
            ctx.fillRect(x0, y0, stepX, stepY);
          } else if (slope > 9) {
            // Caution / Moderate slope (9°-16°)
            ctx.fillStyle = 'rgba(245, 158, 11, 0.28)'; // Amber
            ctx.fillRect(x0, y0, stepX, stepY);
          }
        }
      }
    }

    // Map Boundary Box
    ctx.strokeStyle = '#e2714b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - mapSize / 2, cy - mapSize / 2, mapSize, mapSize);

    // 4. Hazard Zones Layer
    if (layers.hazardZones) {
      hazardZones.forEach((haz) => {
        const p = coordToScreen(haz.coordinate, width, height);
        // Convert meters radius to pixels
        const meterScale = mapSize / (calculateMarsDistanceMeters(
          { latitude: region.bounds.minLat, longitude: region.bounds.minLon },
          { latitude: region.bounds.minLat, longitude: region.bounds.maxLon }
        ));
        const radiusPx = Math.max(16, haz.radiusMeters * meterScale);

        // Pattern / Circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, radiusPx, 0, Math.PI * 2);
        if (haz.riskLevel === 'CRITICAL') {
          ctx.fillStyle = 'rgba(220, 38, 38, 0.25)';
          ctx.strokeStyle = '#ef4444';
        } else if (haz.riskLevel === 'HIGH') {
          ctx.fillStyle = 'rgba(249, 115, 22, 0.22)';
          ctx.strokeStyle = '#f97316';
        } else {
          ctx.fillStyle = 'rgba(234, 179, 8, 0.18)';
          ctx.strokeStyle = '#eab308';
        }
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        // Hazard symbol badge
        ctx.fillStyle = haz.riskLevel === 'CRITICAL' ? '#ef4444' : '#f97316';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', p.x, p.y);

        // Label
        ctx.fillStyle = '#fca5a5';
        ctx.font = '10px monospace';
        ctx.fillText(haz.name, p.x, p.y + radiusPx + 12);
      });
    }

    // 5. Rover Traverse & Historical Observations
    if (layers.roverTraverse && roverObservations.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#a855f7'; // Purple rover track
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      roverObservations.forEach((obs, idx) => {
        const pt = coordToScreen(obs.coordinate, width, height);
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Rover observation stops
      roverObservations.forEach((obs) => {
        const pt = coordToScreen(obs.coordinate, width, height);
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#e9d5ff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Sol ${obs.sol}`, pt.x, pt.y - 9);
      });
    }

    // 6. Resource Interest Sites
    if (layers.resourceLocations) {
      resourceSites.forEach((res) => {
        const pt = coordToScreen(res.coordinate, width, height);
        // Blue Diamond
        const sz = 7;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y - sz);
        ctx.lineTo(pt.x + sz, pt.y);
        ctx.lineTo(pt.x, pt.y + sz);
        ctx.lineTo(pt.x - sz, pt.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#7dd3fc';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(res.name.slice(0, 18), pt.x, pt.y + 14);
      });
    }

    // 7. Candidate Routes
    if (layers.candidateRoutes && candidateRoutes.length > 0) {
      candidateRoutes.forEach((route) => {
        const isActive = route.id === activeRouteId;
        ctx.beginPath();
        ctx.strokeStyle = route.color;
        ctx.lineWidth = isActive ? 3.5 : 1.8;
        ctx.globalAlpha = isActive ? 1.0 : 0.45;

        route.waypoints.forEach((wp, idx) => {
          const pt = coordToScreen(wp, width, height);
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Draw waypoint markers if active route
        if (isActive) {
          route.waypoints.forEach((wp, idx) => {
            const pt = coordToScreen(wp, width, height);
            ctx.fillStyle = wp.hazardRisk === 'HIGH' ? '#ef4444' : wp.hazardRisk === 'MEDIUM' ? '#f59e0b' : '#38bdf8';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, idx === 0 || idx === route.waypoints.length - 1 ? 5 : 3, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        ctx.globalAlpha = 1.0;
      });
    }

    // 8. Science Targets
    if (layers.scienceTargets) {
      scienceTargets.forEach((st) => {
        const pt = coordToScreen(st.coordinate, width, height);
        // Glowing science node
        ctx.fillStyle = '#fbbf24'; // Gold amber
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Target name tag
        ctx.fillStyle = '#fef3c7';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(st.name, pt.x + 8, pt.y + 3);
      });
    }

    // 9. Start & Destination Markers
    const startPt = coordToScreen(startCoordinate, width, height);
    const destPt = coordToScreen(destCoordinate, width, height);

    // Start Marker (Emerald Hexagon)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(startPt.x, startPt.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', startPt.x, startPt.y);

    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`START: ${startName}`, startPt.x, startPt.y - 14);

    // Destination Marker (Crimson Target)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(destPt.x, destPt.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('B', destPt.x, destPt.y);

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`DEST: ${destName}`, destPt.x, destPt.y - 14);

    // 10. User Selected Location Crosshair
    if (selectedCoordinate) {
      const sp = coordToScreen(selectedCoordinate, width, height);
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sp.x - 20, sp.y);
      ctx.lineTo(sp.x + 20, sp.y);
      ctx.moveTo(sp.x, sp.y - 20);
      ctx.lineTo(sp.x, sp.y + 20);
      ctx.stroke();
    }
  }, [
    region,
    layers,
    scienceTargets,
    roverObservations,
    hazardZones,
    resourceSites,
    candidateRoutes,
    activeRouteId,
    selectedCoordinate,
    startCoordinate,
    destCoordinate,
    startName,
    destName,
    pan,
    zoom,
    coordToScreen,
  ]);

  // Handle Mouse Events: Pan, Zoom, Click
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    // Update coordinate readout
    const coord = screenToCoord(mouseX, mouseY, rect.width, rect.height);
    if (
      coord.latitude >= region.bounds.minLat &&
      coord.latitude <= region.bounds.maxLat &&
      coord.longitude >= region.bounds.minLon &&
      coord.longitude <= region.bounds.maxLon
    ) {
      const elev = getInterpolatedElevation(coord, region);
      const elevN = getInterpolatedElevation({ latitude: coord.latitude + 0.002, longitude: coord.longitude }, region);
      const slope = Math.min(32, Math.round((Math.abs(elevN - elev) / 120) * 90 * 10) / 10);
      setHoveredCoord({
        lat: Math.round(coord.latitude * 10000) / 10000,
        lon: Math.round(coord.longitude * 10000) / 10000,
        elev,
        slope,
      });
    } else {
      setHoveredCoord(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicked on a science target
    for (const st of scienceTargets) {
      const pt = coordToScreen(st.coordinate, rect.width, rect.height);
      if (Math.hypot(mouseX - pt.x, mouseY - pt.y) < 14) {
        onSelectScienceTarget(st);
        return;
      }
    }

    // Check if clicked on a hazard
    for (const haz of hazardZones) {
      const pt = coordToScreen(haz.coordinate, rect.width, rect.height);
      if (Math.hypot(mouseX - pt.x, mouseY - pt.y) < 16) {
        onSelectHazard(haz);
        return;
      }
    }

    // Check if clicked on resource
    for (const res of resourceSites) {
      const pt = coordToScreen(res.coordinate, rect.width, rect.height);
      if (Math.hypot(mouseX - pt.x, mouseY - pt.y) < 14) {
        onSelectResource(res);
        return;
      }
    }

    // Otherwise select coordinate
    const coord = screenToCoord(mouseX, mouseY, rect.width, rect.height);
    const elev = getInterpolatedElevation(coord, region);
    const elevN = getInterpolatedElevation({ latitude: coord.latitude + 0.002, longitude: coord.longitude }, region);
    const slope = Math.min(32, Math.round((Math.abs(elevN - elev) / 120) * 90 * 10) / 10);
    onSelectCoordinate(coord, elev, slope);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    setZoom((prev) => Math.max(0.6, Math.min(4.5, prev * zoomFactor)));
  };

  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0d14] overflow-hidden select-none">
      <canvas
        id="mars-viewport-canvas"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Floating Viewport Controls */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        <button
          id="btn-map-zoom-in"
          onClick={() => setZoom((z) => Math.min(4.5, z * 1.25))}
          className="w-8 h-8 rounded bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-white flex items-center justify-center transition-colors shadow-lg"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-map-zoom-out"
          onClick={() => setZoom((z) => Math.max(0.6, z * 0.8))}
          className="w-8 h-8 rounded bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-white flex items-center justify-center transition-colors shadow-lg"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="btn-map-reset-view"
          onClick={resetView}
          className="w-8 h-8 rounded bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-white flex items-center justify-center transition-colors shadow-lg"
          title="Reset View Centering"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* North Arrow & Scale Indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-2 bg-neutral-950/85 border border-neutral-800/80 rounded px-2.5 py-1 text-xs font-mono text-neutral-300 pointer-events-none z-10">
        <Compass className="w-4 h-4 text-orange-400" />
        <span className="font-bold text-orange-400">N</span>
        <span className="text-neutral-500">|</span>
        <span>Scale: ~{Math.round(1800 / zoom)} m</span>
      </div>

      {/* Live Coordinate & Elevation Readout Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 bg-neutral-950/90 border border-neutral-800/80 rounded-lg px-3 py-1.5 text-xs font-mono text-neutral-300 pointer-events-none z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">QUAD:</span>
            <span className="text-white font-medium">{region.name}</span>
          </div>
          {hoveredCoord ? (
            <div className="flex items-center gap-2.5 text-neutral-300">
              <span>LAT: <strong className="text-orange-300">{hoveredCoord.lat}°N</strong></span>
              <span>LON: <strong className="text-orange-300">{hoveredCoord.lon}°E</strong></span>
              <span>ELEV: <strong className="text-cyan-300">{hoveredCoord.elev} m</strong></span>
              <span>SLOPE: <strong className={hoveredCoord.slope > 14 ? 'text-red-400' : hoveredCoord.slope > 8 ? 'text-amber-400' : 'text-emerald-400'}>{hoveredCoord.slope}°</strong></span>
            </div>
          ) : (
            <span className="text-neutral-500 italic">Hover map to inspect surface coordinates & elevation</span>
          )}
        </div>
        <div className="text-[11px] text-neutral-500">
          DATUM: MOLA AREOID 0 KM | IAU 2000
        </div>
      </div>
    </div>
  );
}
