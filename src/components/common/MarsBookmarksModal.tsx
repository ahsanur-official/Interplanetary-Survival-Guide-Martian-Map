import { useState, useEffect } from 'react';
import {
  X,
  Bookmark,
  Compass,
  Trash2,
  Plus,
  MapPin,
  Mountain,
} from 'lucide-react';
import { marsSonification } from '../../engine/marsSonification';

export interface MarsBookmark {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevationM?: number;
  notes?: string;
  savedAt: string;
}

const DEFAULT_BOOKMARKS: MarsBookmark[] = [
  {
    id: 'bm-olympus',
    name: 'Olympus Mons Summit Caldera',
    lat: 18.65,
    lng: 226.2,
    elevationM: 21229,
    notes: 'Highest shield volcano in the Solar System (21.2 km altitude).',
    savedAt: 'Catalog Default',
  },
  {
    id: 'bm-jezero',
    name: 'Jezero Crater River Delta',
    lat: 18.38,
    lng: 77.58,
    elevationM: -2560,
    notes: 'Perseverance Rover cache site with ancient clay delta layers.',
    savedAt: 'Catalog Default',
  },
  {
    id: 'bm-marineris',
    name: 'Valles Marineris (Melas Chasma)',
    lat: -9.8,
    lng: 283.6,
    elevationM: -4500,
    notes: 'Deepest central chasma of the Grand Canyon of Mars (~9 km deep).',
    savedAt: 'Catalog Default',
  },
  {
    id: 'bm-gale',
    name: 'Gale Crater (Mount Sharp)',
    lat: -4.59,
    lng: 137.44,
    elevationM: -4450,
    notes: 'MSL Curiosity rover landing site and 5.5 km central peak.',
    savedAt: 'Catalog Default',
  },
];

interface MarsBookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlyToLocation: (lat: number, lng: number, zoom?: number, name?: string) => void;
  currentLocation?: { lat: number; lng: number; name?: string; elevationM?: number } | null;
}

export function MarsBookmarksModal({
  isOpen,
  onClose,
  onFlyToLocation,
  currentLocation,
}: MarsBookmarksModalProps) {
  const [bookmarks, setBookmarks] = useState<MarsBookmark[]>(() => {
    try {
      const saved = localStorage.getItem('marsway_bookmarks_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_BOOKMARKS;
  });

  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isAddingCurrent, setIsAddingCurrent] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('marsway_bookmarks_v1', JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks]);

  if (!isOpen) return null;

  const handleAddCurrent = () => {
    if (!currentLocation) return;
    const item: MarsBookmark = {
      id: Date.now().toString(),
      name: newTitle.trim() || currentLocation.name || `Mars Location (${currentLocation.lat.toFixed(2)}°, ${currentLocation.lng.toFixed(2)}°)`,
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      elevationM: currentLocation.elevationM,
      notes: newNotes.trim() || 'Saved from interactive explorer.',
      savedAt: new Date().toLocaleDateString(),
    };

    setBookmarks((prev) => [item, ...prev]);
    setNewTitle('');
    setNewNotes('');
    setIsAddingCurrent(false);
  };

  const handleDelete = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleFly = (bm: MarsBookmark) => {
    if (bm.elevationM !== undefined) {
      marsSonification.sonifyLocation(bm.elevationM, 2);
    }
    onFlyToLocation(bm.lat, bm.lng, 6, bm.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-2xl bg-[#0c1017] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-neutral-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
                Saved Locations & Bookmarks
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                  Local Store
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Quick-access waypoints, custom points of interest, and study sites
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

        {/* Action to bookmark current location */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/40">
          {!isAddingCurrent ? (
            <button
              onClick={() => setIsAddingCurrent(true)}
              disabled={!currentLocation}
              className="w-full py-2 px-3 rounded-lg border border-dashed border-neutral-700 hover:border-orange-500 text-xs text-neutral-300 hover:text-white flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4 text-orange-400" />
              <span>
                {currentLocation
                  ? `Bookmark Current Point (${currentLocation.name || `${currentLocation.lat.toFixed(2)}°N, ${currentLocation.lng.toFixed(2)}°E`})`
                  : 'Click anywhere on Mars to bookmark a location'}
              </span>
            </button>
          ) : (
            <div className="space-y-2 bg-neutral-900/80 p-3 rounded-lg border border-neutral-800 text-xs">
              <span className="font-semibold text-white block">Bookmark This Location</span>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Bookmark Name (e.g. Western Rim Outcrop)"
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded p-2 focus:outline-none focus:border-orange-500"
              />
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Notes / Scientific interest"
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded p-2 focus:outline-none focus:border-orange-500"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsAddingCurrent(false)}
                  className="px-3 py-1 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCurrent}
                  className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded"
                >
                  Save Bookmark
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between gap-3 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{bm.name}</span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {bm.savedAt}
                  </span>
                </div>
                {bm.notes && <p className="text-xs text-neutral-400">{bm.notes}</p>}
                <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500">
                  <span>
                    {bm.lat.toFixed(2)}°N, {bm.lng.toFixed(2)}°E
                  </span>
                  {bm.elevationM !== undefined && (
                    <>
                      <span>•</span>
                      <span className="text-orange-400/80">
                        {bm.elevationM.toLocaleString()} m
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleFly(bm)}
                  className="px-2.5 py-1.5 rounded bg-neutral-800 hover:bg-orange-600 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1 transition"
                  title="Fly to Location"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Fly
                </button>

                <button
                  onClick={() => handleDelete(bm.id)}
                  className="p-1.5 rounded hover:bg-red-950/60 text-neutral-500 hover:text-red-400 transition"
                  title="Delete Bookmark"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
