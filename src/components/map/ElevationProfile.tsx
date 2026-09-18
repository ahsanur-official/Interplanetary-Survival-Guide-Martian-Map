import React, { useRef, useEffect, useState } from 'react';
import { CandidateRoute } from '../../types/mars';
import { Activity, Mountain, TrendingUp, AlertTriangle } from 'lucide-react';

interface ElevationProfileProps {
  route: CandidateRoute | null;
}

export function ElevationProfile({ route }: ElevationProfileProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    distKm: number;
    elevM: number;
    slopeDeg: number;
    name?: string;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !route || route.waypoints.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padX = 40;
    const padY = 25;

    ctx.fillStyle = '#0f131c';
    ctx.fillRect(0, 0, width, height);

    const waypoints = route.waypoints;
    const totalDist = route.metrics.totalDistanceKm || 1;

    let minElev = Infinity;
    let maxElev = -Infinity;
    waypoints.forEach((w) => {
      if (w.elevation < minElev) minElev = w.elevation;
      if (w.elevation > maxElev) maxElev = w.elevation;
    });

    // Add padding to elevation scale
    const elevSpan = Math.max(30, maxElev - minElev);
    const yMin = minElev - elevSpan * 0.15;
    const yMax = maxElev + elevSpan * 0.15;

    const getX = (distKm: number) => padX + (distKm / totalDist) * (width - padX * 2);
    const getY = (elev: number) => height - padY - ((elev - yMin) / (yMax - yMin)) * (height - padY * 2);

    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.font = '9px monospace';
    ctx.fillStyle = '#737373';
    ctx.textAlign = 'right';

    const numYLines = 4;
    for (let i = 0; i <= numYLines; i++) {
      const e = Math.round(yMin + (i / numYLines) * (yMax - yMin));
      const y = getY(e);
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(width - padX, y);
      ctx.stroke();
      ctx.fillText(`${e}m`, padX - 6, y + 3);
    }

    // Draw Terrain Gradient Area
    const grad = ctx.createLinearGradient(0, padY, 0, height - padY);
    grad.addColorStop(0, 'rgba(234, 88, 12, 0.35)');
    grad.addColorStop(1, 'rgba(30, 27, 75, 0.15)');

    ctx.beginPath();
    ctx.moveTo(getX(waypoints[0].cumulativeDistanceKm), height - padY);
    waypoints.forEach((w) => {
      ctx.lineTo(getX(w.cumulativeDistanceKm), getY(w.elevation));
    });
    ctx.lineTo(getX(waypoints[waypoints.length - 1].cumulativeDistanceKm), height - padY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw Profile Line
    ctx.beginPath();
    ctx.strokeStyle = route.color;
    ctx.lineWidth = 2.5;
    waypoints.forEach((w, idx) => {
      const x = getX(w.cumulativeDistanceKm);
      const y = getY(w.elevation);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Mark steep slopes along the profile with danger bars
    waypoints.forEach((w) => {
      if (w.slope > 10) {
        const x = getX(w.cumulativeDistanceKm);
        const y = getY(w.elevation);
        ctx.fillStyle = w.slope > 15 ? '#ef4444' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mark visited science targets
      if (w.visitedScienceTarget) {
        const x = getX(w.cumulativeDistanceKm);
        const y = getY(w.elevation);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SCI', x, y - 8);
      }
    });

    // Distance ticks at bottom
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a3a3a3';
    ctx.fillText('0 km', padX, height - 8);
    ctx.fillText(`${(totalDist / 2).toFixed(1)} km`, width / 2, height - 8);
    ctx.fillText(`${totalDist.toFixed(1)} km`, width - padX, height - 8);
  }, [route]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !route || route.waypoints.length < 2) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const padX = 40;
    const width = rect.width;

    if (mouseX < padX || mouseX > width - padX) {
      setHoveredPoint(null);
      return;
    }

    const t = (mouseX - padX) / (width - padX * 2);
    const targetDist = t * route.metrics.totalDistanceKm;

    // Find nearest waypoint
    let best = route.waypoints[0];
    let bestDiff = Math.abs(best.cumulativeDistanceKm - targetDist);
    for (const w of route.waypoints) {
      const diff = Math.abs(w.cumulativeDistanceKm - targetDist);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = w;
      }
    }

    setHoveredPoint({
      distKm: best.cumulativeDistanceKm,
      elevM: best.elevation,
      slopeDeg: best.slope,
      name: best.name,
    });
  };

  if (!route) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center text-xs text-neutral-500 font-mono">
        Select a route to inspect elevation & slope cross-section
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3 text-xs font-mono text-neutral-300 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-400" />
          <span className="font-bold text-neutral-200 uppercase tracking-wide">
            Traverse Cross-Section Profile: {route.name}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span>Max Slope: <strong className={route.metrics.maxSlopeDegrees > 14 ? 'text-red-400' : 'text-amber-400'}>{route.metrics.maxSlopeDegrees}°</strong></span>
          <span>Avg Slope: <strong className="text-emerald-400">{route.metrics.averageSlopeDegrees}°</strong></span>
          <span>Energy: <strong className="text-cyan-400">{route.metrics.metabolicEnergyCostKcal} kcal</strong></span>
        </div>
      </div>

      <div className="relative h-28 w-full">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          className="w-full h-full block rounded bg-neutral-950 cursor-crosshair"
        />

        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-neutral-900/95 border border-neutral-700 px-2.5 py-1 rounded text-[10px] pointer-events-none shadow-md">
            <div>Dist: <strong className="text-white">{hoveredPoint.distKm} km</strong> | Elev: <strong className="text-cyan-300">{hoveredPoint.elevM} m</strong></div>
            <div>Slope: <strong className={hoveredPoint.slopeDeg > 12 ? 'text-red-400' : 'text-emerald-400'}>{hoveredPoint.slopeDeg}°</strong> {hoveredPoint.name && `(${hoveredPoint.name})`}</div>
          </div>
        )}
      </div>
    </div>
  );
}
