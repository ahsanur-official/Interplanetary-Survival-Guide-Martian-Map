import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Navigation,
  MapPin,
  Mountain,
  Radio,
  Sparkles,
  Compass,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { ALL_MARS_FEATURES, MarsFeature } from '../../data/marsNomenclature';
import { MARS_MISSIONS_DATA } from '../../data/marsMissions';
import { HUMAN_CANDIDATE_SITES } from '../../data/humanLandingSites';
import { marsSonification } from '../../engine/marsSonification';

export interface SearchTargetResult {
  lat: number;
  lng: number;
  zoom?: number;
  name: string;
  elevationM?: number;
  type?: string;
  description?: string;
  category?: string;
}

interface MarsTopSearchBarProps {
  onFlyTo: (target: SearchTargetResult) => void;
  className?: string;
  placeholder?: string;
  compact?: boolean;
}

type FeatureCategory = 'All' | 'Crater' | 'Volcano' | 'Canyon' | 'Plain' | 'Mission';

interface UnifiedSearchItem {
  id: string;
  name: string;
  type: string;
  category: 'Crater' | 'Volcano' | 'Canyon' | 'Plain' | 'Mission' | 'Other';
  lat: number;
  lng: number;
  elevationM: number;
  description: string;
  featured?: boolean;
}

// Quick suggestions when search is focused but empty
const FEATURED_SUGGESTIONS: Array<{
  id: string;
  name: string;
  type: string;
  category: 'Crater' | 'Volcano' | 'Canyon' | 'Plain' | 'Mission';
  lat: number;
  lng: number;
  elevationM: number;
  description: string;
}> = [
  {
    id: 'olympus_mons',
    name: 'Olympus Mons',
    type: 'Shield Volcano',
    category: 'Volcano',
    lat: 18.65,
    lng: -134.0,
    elevationM: 21287,
    description: 'Tallest volcano & planetary peak in the Solar System (21.3 km high).',
  },
  {
    id: 'gale_crater',
    name: 'Gale Crater (Mount Sharp)',
    type: 'Impact Crater',
    category: 'Crater',
    lat: -5.37,
    lng: 137.81,
    elevationM: -4450,
    description: 'Ancient paleolake basin explored by NASA Curiosity rover.',
  },
  {
    id: 'jezero_crater',
    name: 'Jezero Crater (Delta)',
    type: 'Impact Crater',
    category: 'Crater',
    lat: 18.38,
    lng: 77.58,
    elevationM: -2560,
    description: 'Ancient river delta lakebed explored by Perseverance & Ingenuity.',
  },
  {
    id: 'valles_marineris',
    name: 'Valles Marineris',
    type: 'Grand Canyon System',
    category: 'Canyon',
    lat: -14.0,
    lng: -59.2,
    elevationM: -7000,
    description: 'Vast canyon network stretching 4,000 km across the Martian equator.',
  },
  {
    id: 'korolev_crater',
    name: 'Korolev Crater',
    type: 'Ice-Filled Impact Crater',
    category: 'Crater',
    lat: 73.0,
    lng: 165.0,
    elevationM: -1800,
    description: '82 km wide crater filled year-round with a 1.8 km thick pure water ice sheet.',
  },
  {
    id: 'hellas_planitia',
    name: 'Hellas Planitia',
    type: 'Giant Impact Basin',
    category: 'Plain',
    lat: -42.7,
    lng: 70.0,
    elevationM: -8200,
    description: 'Deepest impact basin on Mars with atmospheric pressure double the datum.',
  },
];

export const MarsTopSearchBar: React.FC<MarsTopSearchBarProps> = ({
  onFlyTo,
  className = '',
  placeholder = 'Search craters, volcanoes, canyons, missions...',
  compact = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<FeatureCategory>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build unified search database once
  const allItems = useMemo<UnifiedSearchItem[]>(() => {
    const items: UnifiedSearchItem[] = [];

    // 1. IAU Nomenclature Features & Craters
    ALL_MARS_FEATURES.forEach((f) => {
      let cat: 'Crater' | 'Volcano' | 'Canyon' | 'Plain' | 'Other' = 'Other';
      if (f.type.includes('Crater')) cat = 'Crater';
      else if (f.type.includes('Mons') || f.type.includes('Volcano') || f.type.includes('Tholus') || f.type.includes('Patera')) cat = 'Volcano';
      else if (f.type.includes('Chasma') || f.type.includes('Vallis') || f.type.includes('Canyon') || f.type.includes('Labyrinth')) cat = 'Canyon';
      else if (f.type.includes('Planitia') || f.type.includes('Plain') || f.type.includes('Terra')) cat = 'Plain';

      items.push({
        id: `feat-${f.id}`,
        name: f.name,
        type: f.type,
        category: cat,
        lat: f.lat,
        lng: f.lng,
        elevationM: f.elevationM,
        description: f.description,
        featured: f.featured,
      });
    });

    // 2. Robotic Exploration Missions & Landers
    MARS_MISSIONS_DATA.forEach((m) => {
      if (m.lat !== undefined && m.lng !== undefined) {
        items.push({
          id: `mission-${m.id}`,
          name: `${m.name} (${m.type.toUpperCase()})`,
          type: `${m.agency} ${m.type} • ${m.landingSiteName || 'Surface Site'}`,
          category: 'Mission',
          lat: m.lat,
          lng: m.lng,
          elevationM: m.elevationM || -2500,
          description: m.landingSiteName ? `Landing Site: ${m.landingSiteName}` : m.objectives[0] || '',
          featured: true,
        });
      }
    });

    // 3. Human Base Candidate Exploration Zones
    HUMAN_CANDIDATE_SITES.forEach((h) => {
      items.push({
        id: `human-${h.id}`,
        name: `${h.name} (Human Base Candidate)`,
        type: 'Human Exploration Zone',
        category: 'Plain',
        lat: h.lat,
        lng: h.lng,
        elevationM: h.elevationM,
        description: `${h.primaryAdvantage} • Ice: ${h.iceEvidence?.type || 'Subsurface Ice'}`,
        featured: false,
      });
    });

    return items;
  }, []);

  // Coordinate Input Detection (e.g., "18.38, 77.58" or "-4.59 137.44")
  const parsedCoordinates = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return null;

    // Matches patterns like "18.38, 77.58" or "18.38 -134.0" or "18.38°N, 77.58°E"
    const coordRegex = /^([+-]?\d+(?:\.\d+)?)\s*(?:°?\s*[NnSs]?)?\s*[,/ ]\s*([+-]?\d+(?:\.\d+)?)\s*(?:°?\s*[EeWw]?)?$/;
    const match = trimmed.match(coordRegex);
    if (match) {
      let lat = parseFloat(match[1]);
      let lng = parseFloat(match[2]);

      // Handle N/S / E/W if specified
      if (/[Ss]/i.test(trimmed) && lat > 0) lat = -lat;
      if (/[Ww]/i.test(trimmed) && lng > 0) lng = -lng;

      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 360) {
        // Normalize lng to -180..+180
        const normalizedLng = lng > 180 ? lng - 360 : lng;
        return { lat, lng: normalizedLng };
      }
    }
    return null;
  }, [query]);

  // Filtered Results
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      // Return suggestions filtered by category
      return FEATURED_SUGGESTIONS.filter(
        (item) => categoryFilter === 'All' || item.category === categoryFilter
      );
    }

    const matched = allItems.filter((item) => {
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;

      const nameMatch = item.name.toLowerCase().includes(q);
      const typeMatch = item.type.toLowerCase().includes(q);
      const descMatch = item.description.toLowerCase().includes(q);

      return nameMatch || typeMatch || descMatch;
    });

    // Smart Sorting: Exact name start match > Exact word match > Featured > Alphabetical
    return matched.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      const aStarts = aName.startsWith(q);
      const bStarts = bName.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      return aName.localeCompare(bName);
    }).slice(0, 10);
  }, [allItems, query, categoryFilter]);

  // Handle clicking outside to close dropdown (supporting both mouse and touch)
  useEffect(() => {
    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, []);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, categoryFilter]);

  // Execute Flight to target
  const handleSelect = (target: {
    lat: number;
    lng: number;
    name: string;
    elevationM?: number;
    type?: string;
    description?: string;
    category?: string;
  }) => {
    let zoomLevel = 6;
    if (target.category === 'Volcano' || target.name.toLowerCase().includes('mons')) {
      zoomLevel = 5;
    } else if (target.category === 'Canyon' || target.name.toLowerCase().includes('valles')) {
      zoomLevel = 5;
    } else if (target.category === 'Plain') {
      zoomLevel = 4;
    } else if (target.category === 'Crater') {
      zoomLevel = 7;
    } else if (target.category === 'Mission') {
      zoomLevel = 8;
    }

    if (target.elevationM !== undefined) {
      marsSonification.sonifyLocation(target.elevationM, 2);
    }

    onFlyTo({
      lat: target.lat,
      lng: target.lng,
      zoom: zoomLevel,
      name: target.name,
      elevationM: target.elevationM,
      type: target.type,
      description: target.description,
      category: target.category,
    });

    setQuery(target.name);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const maxLen = parsedCoordinates ? filteredResults.length + 1 : filteredResults.length;
      if (maxLen > 0) {
        setSelectedIndex((prev) => (prev + 1) % maxLen);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const maxLen = parsedCoordinates ? filteredResults.length + 1 : filteredResults.length;
      if (maxLen > 0) {
        setSelectedIndex((prev) => (prev - 1 + maxLen) % maxLen);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (parsedCoordinates && selectedIndex === 0) {
        handleSelect({
          lat: parsedCoordinates.lat,
          lng: parsedCoordinates.lng,
          name: `Coordinates (${parsedCoordinates.lat.toFixed(2)}°, ${parsedCoordinates.lng.toFixed(2)}°)`,
          type: 'Manual Coordinates Target',
          category: 'Other',
        });
      } else {
        const itemIdx = parsedCoordinates ? selectedIndex - 1 : selectedIndex;
        const chosen = filteredResults[itemIdx] || filteredResults[0];
        if (chosen) {
          handleSelect(chosen);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Crater':
        return {
          label: 'Crater',
          color: 'bg-purple-950/80 text-purple-300 border-purple-800',
          glyph: '☄️',
        };
      case 'Volcano':
        return {
          label: 'Volcano',
          color: 'bg-rose-950/80 text-rose-300 border-rose-800',
          glyph: '🌋',
        };
      case 'Canyon':
        return {
          label: 'Canyon',
          color: 'bg-blue-950/80 text-blue-300 border-blue-800',
          glyph: '🏜️',
        };
      case 'Plain':
        return {
          label: 'Plain',
          color: 'bg-amber-950/80 text-amber-300 border-amber-800',
          glyph: '🪐',
        };
      case 'Mission':
        return {
          label: 'Mission',
          color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
          glyph: '🚀',
        };
      default:
        return {
          label: 'Feature',
          color: 'bg-neutral-800 text-neutral-300 border-neutral-700',
          glyph: '📍',
        };
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Top Search Bar Input Box */}
      <div
        className={`relative flex items-center bg-[#070b14]/85 backdrop-blur-2xl border transition-all duration-300 ${
          compact ? 'rounded-full py-0.5 shadow-lg shadow-black/50' : 'rounded-full py-1 shadow-2xl shadow-black/70'
        } ${
          isOpen
            ? 'border-orange-500/80 ring-2 ring-orange-500/20 bg-[#090f1d]/95'
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        <div className={`${compact ? 'pl-3 pr-1.5 py-1' : 'pl-4 pr-2 py-1.5'} flex items-center text-orange-400/90 shrink-0 pointer-events-none`}>
          <Search className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full ${
            compact ? 'py-1 sm:py-1.5 pr-6 text-[11px] sm:text-xs' : 'py-1.5 sm:py-2 pr-8 text-xs sm:text-sm'
          } bg-transparent text-neutral-100 placeholder-neutral-400/70 font-medium focus:outline-none min-w-0 tracking-tight`}
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="p-1 mr-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/80 transition-colors cursor-pointer shrink-0"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : !compact ? (
          <div className="mr-2.5 hidden sm:flex items-center gap-1 text-[10px] font-mono text-neutral-500 bg-neutral-800/60 px-1.5 py-0.5 rounded border border-neutral-700/50 shrink-0">
            <span>Fly To</span>
            <Navigation className="w-2.5 h-2.5 text-orange-400" />
          </div>
        ) : null}
      </div>

      {/* Autocomplete Dropdown Menu */}
      {isOpen && (
        <div className={`absolute top-full mt-2 bg-[#080d19]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[70vh] flex flex-col ${
          compact
            ? 'left-1/2 -translate-x-1/2 w-[92vw] sm:w-[380px] md:w-[440px] max-w-[460px]'
            : 'left-0 right-0'
        }`}>
          {/* Quick Category Filter Controls */}
          <div className="p-2 border-b border-white/5 bg-[#0a1122]/90 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            {(['All', 'Crater', 'Volcano', 'Canyon', 'Plain', 'Mission'] as FeatureCategory[]).map(
              (cat) => {
                const isSelected = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-orange-500 text-white font-semibold shadow-md shadow-orange-950/50'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                    }`}
                  >
                    <span>
                      {cat === 'All'
                        ? 'All'
                        : cat === 'Crater'
                        ? '☄️ Craters'
                        : cat === 'Volcano'
                        ? '🌋 Volcanoes'
                        : cat === 'Canyon'
                        ? '🏜️ Canyons'
                        : cat === 'Plain'
                        ? '🪐 Plains'
                        : '🚀 Missions'}
                    </span>
                  </button>
                );
              }
            )}
          </div>

          {/* Results List */}
          <div className="overflow-y-auto p-1.5 space-y-1 divide-y divide-neutral-800/40">
            {/* Coordinate parsed direct entry */}
            {parsedCoordinates && (
              <div
                onClick={() =>
                  handleSelect({
                    lat: parsedCoordinates.lat,
                    lng: parsedCoordinates.lng,
                    name: `Martian Coordinates (${parsedCoordinates.lat.toFixed(2)}°, ${parsedCoordinates.lng.toFixed(2)}°)`,
                    type: 'Custom Geographic Target',
                    category: 'Other',
                  })
                }
                className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                  selectedIndex === 0
                    ? 'bg-orange-950/60 border border-orange-500/80 text-white'
                    : 'hover:bg-neutral-800/70 text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-orange-600/20 border border-orange-500/50 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-white">
                        Fly to Coordinates
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-orange-950 text-orange-400 border border-orange-800 text-[9px] font-mono">
                        Direct
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      Lat: {parsedCoordinates.lat.toFixed(4)}° • Lng: {parsedCoordinates.lng.toFixed(4)}°
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-950/50 px-2 py-1 rounded-lg border border-orange-800/60 shrink-0">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Fly</span>
                </div>
              </div>
            )}

            {/* Empty state title */}
            {!query.trim() && (
              <div className="px-2.5 pt-2 pb-1 text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Featured Planetary Destinations</span>
              </div>
            )}

            {filteredResults.length === 0 && !parsedCoordinates ? (
              <div className="p-6 text-center text-neutral-400 text-xs">
                <p className="font-semibold text-neutral-300">No Martian features matched "{query}"</p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Try searching for <span className="text-orange-400">Gale</span>, <span className="text-orange-400">Jezero</span>, <span className="text-orange-400">Olympus</span>, or enter coordinates like <span className="font-mono text-neutral-300">18.4, 77.6</span>
                </p>
              </div>
            ) : (
              filteredResults.map((item, index) => {
                const adjIndex = parsedCoordinates ? index + 1 : index;
                const isSelected = selectedIndex === adjIndex;
                const badge = getCategoryBadge(item.category);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(adjIndex)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-orange-950/60 border border-orange-500/80 text-white shadow'
                        : 'hover:bg-neutral-800/70 text-neutral-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-neutral-800/80 border border-neutral-700/80 flex items-center justify-center shrink-0 text-base">
                        <span>{badge.glyph}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-white truncate">
                            {item.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded border text-[9.5px] font-semibold whitespace-nowrap ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                          {item.elevationM !== undefined && (
                            <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">
                              {item.elevationM > 0 ? `+${item.elevationM.toLocaleString()}` : item.elevationM.toLocaleString()} m
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {item.description || item.type}
                        </p>
                        <div className="text-[10px] font-mono text-neutral-400 mt-0.5 flex items-center gap-2">
                          <span>
                            {Math.abs(item.lat).toFixed(2)}°{item.lat >= 0 ? 'N' : 'S'},{' '}
                            {Math.abs(item.lng).toFixed(2)}°{item.lng >= 0 ? 'E' : 'W'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-orange-400 bg-orange-950/40 hover:bg-orange-900/60 px-2 py-1 rounded-lg border border-orange-800/50 shrink-0 transition-colors">
                      <Navigation className="w-3 h-3 text-orange-400" />
                      <span className="hidden xs:inline">Fly</span>
                      <ArrowRight className="w-3 h-3 opacity-60" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar with Keyboard Shortcuts & Status */}
          <div className="px-3 py-1.5 border-t border-neutral-800/80 bg-[#0a0e19] text-[10px] text-neutral-400 flex items-center justify-between shrink-0 font-mono">
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Press <kbd className="px-1 py-0.2 bg-neutral-800 rounded border border-neutral-700 text-white">↑</kbd> <kbd className="px-1 py-0.2 bg-neutral-800 rounded border border-neutral-700 text-white">↓</kbd> to navigate</span>
              <span className="hidden sm:inline">•</span>
              <span>Press <kbd className="px-1 py-0.2 bg-neutral-800 rounded border border-neutral-700 text-white">Enter</kbd> to Fly</span>
            </div>
            <span className="text-orange-400 font-semibold">{allItems.length}+ Martian Locations</span>
          </div>
        </div>
      )}
    </div>
  );
};
