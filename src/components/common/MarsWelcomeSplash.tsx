import { useEffect, useState } from 'react';
import { Orbit, Radio, Sparkles } from 'lucide-react';

/** Short first-load welcome moment for the MarsWay mission console. */
export function MarsWelcomeSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="mars-splash" role="status" aria-live="polite" aria-label="Welcome to MarsWay">
      <div className="mars-splash-stars" aria-hidden="true" />
      <div className="mars-splash-orbit mars-splash-orbit-one" aria-hidden="true" />
      <div className="mars-splash-orbit mars-splash-orbit-two" aria-hidden="true" />

      <div className="mars-splash-card">
        <div className="mars-splash-radar" aria-hidden="true">
          <div className="mars-splash-radar-grid" />
          <div className="mars-splash-planet">
            <img src="/assets/aistudio/image_5c943629.png" alt="" />
          </div>
          <span className="mars-splash-signal signal-one" />
          <span className="mars-splash-signal signal-two" />
          <Orbit className="mars-splash-orbit-icon" />
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-300">
          <Sparkles className="h-3.5 w-3.5" />
          Mission intelligence console
        </div>
        <h1 className="mt-2 text-4xl font-black tracking-[0.16em] text-white sm:text-5xl">MarsWay</h1>
        <p className="mt-2 text-xs text-slate-300 sm:text-sm">Explore Mars. Understand missions. Plan the future.</p>

        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-300/80">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          Connecting to planetary systems
        </div>
        <div className="mx-auto mt-3 h-1 w-44 overflow-hidden rounded-full bg-white/10">
          <div className="mars-splash-progress h-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
