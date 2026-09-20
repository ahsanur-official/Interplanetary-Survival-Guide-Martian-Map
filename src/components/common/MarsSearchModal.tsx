import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  MapPin,
  Radio,
  Mountain,
  Compass,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ALL_MARS_FEATURES, MarsFeature } from '../../data/marsNomenclature';
import { MARS_MISSIONS_DATA } from '../../data/marsMissions';
import { HUMAN_CANDIDATE_SITES } from '../../data/humanLandingSites';
import { marsSonification } from '../../engine/marsSonification';

interface MarsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (target: {
    lat: number;
    lng: number;
    zoom?: number;
    name: string;
    elevationM?: number;
    type?: string;
    description?: string;
  }) => void;
}

export function MarsSearchModal({
  isOpen,
  onClose,
  onSelectResult,
}: MarsSearchModalProps) {
  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    // 1. Gather all searchable items into a unified structure
    const items: Array<{
      id: string;
      name: string;
      type: string;
      category: 'Mission' | 'Volcano' | 'Crater' | 'Canyon' | 'Plain' | 'Human Site' | 'Other';
      lat: number;
      lng: number;
      elevationM: number;
      description: string;
    }> = [];

    // Missions
    MARS_MISSIONS_DATA.forEach((m) => {
      if (m.lat !== undefined && m.lng !== undefined) {
        items.push({
          id: m.id,
          name: m.name,
          type: `${m.agency} ${m.type.toUpperCase()}`,
          category: 'Mission',
          lat: m.lat,
          lng: m.lng,
          elevationM: m.elevationM || 0,
          description: m.landingSiteName || m.objectives[0] || '',
        });
      }
    });

    // Human Candidate Sites
    HUMAN_CANDIDATE_SITES.forEach((h) => {
      items.push({
        id: h.id,
        name: h.name,
        type: 'Human Candidate Exploration Zone',
        category: 'Human Site',
        lat: h.lat,
        lng: h.lng,
        elevationM: h.elevationM,
        description: h.primaryAdvantage,
      });
    });

    // IAU Features
    ALL_MARS_FEATURES.forEach((f) => {
      let cat: 'Volcano' | 'Crater' | 'Canyon' | 'Plain' | 'Other' = 'Other';
      if (f.type.includes('Mons') || f.type.includes('Volcano')) cat = 'Volcano';
      else if (f.type.includes('Crater')) cat = 'Crater';
      else if (f.type.includes('Chasma') || f.type.includes('Vallis') || f.type.includes('Canyon')) cat = 'Canyon';
      else if (f.type.includes('Planitia') || f.type.includes('Plain') || f.type.includes('Terra')) cat = 'Plain';

      items.push({
        id: f.id,
        name: f.name,
        type: f.type,
        category: cat,
        lat: f.lat,
        lng: f.lng,
        elevationM: f.elevationM,
        description: f.description,
      });
    });

    return items.filter((item) => {
      if (filterCategory !== 'All' && item.category !== filterCategory) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [query, filterCategory]);

  if (!isOpen) return null;

  const handleSelect = (item: (typeof searchResults)[0]) => {
    marsSonification.sonifyLocation(item.elevationM, 2);
    onSelectResult({
      lat: item.lat,
      lng: item.lng,
      zoom: item.category === 'Volcano' || item.category === 'Canyon' ? 5 : 7,
      name: item.name,
      elevationM: item.elevationM,
      type: item.type,
      description: item.description,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      <div className="w-full max-w-2xl bg-[#0c1017] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header Input */}
        <div className="p-4 border-b border-neutral-800 flex items-center gap-3 bg-neutral-900/60">
          <Search className="w-5 h-5 text-orange-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search craters, volcanoes, canyons, missions, or human landing zones..."
            className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-neutral-500 hover:text-white text-xs px-2 py-1 rounded hover:bg-neutral-800"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-4 py-2.5 border-b border-neutral-800/80 bg-neutral-950/50 flex gap-1.5 overflow-x-auto text-xs font-mono">
          {['All', 'Mission', 'Volcano', 'Crater', 'Canyon', 'Plain', 'Human Site'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-md capitalize whitespace-nowrap transition ${
                filterCategory === cat
                  ? 'bg-orange-600 text-white font-semibold shadow'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {cat === 'All' ? 'All Features' : cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/70 p-2">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              No Martian features found matching "{query}"
            </div>
          ) : (
            searchResults.slice(0, 40).map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className="p-3 rounded-lg hover:bg-neutral-900/80 cursor-pointer flex items-center justify-between group transition"
              >
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white group-hover:text-orange-300 transition">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-1">{item.description}</p>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500">
                    <span>
                      {item.lat >= 0 ? `${item.lat.toFixed(2)}°N` : `${Math.abs(item.lat).toFixed(2)}°S`},{' '}
                      {item.lng >= 0 ? `${item.lng.toFixed(2)}°E` : `${(item.lng + 360).toFixed(2)}°E`}
                    </span>
                    <span>•</span>
                    <span className="text-orange-400/80">
                      Elev: {item.elevationM.toLocaleString()} m
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 text-xs font-mono text-neutral-500 group-hover:text-orange-400 transition">
                  <span>Fly to</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
