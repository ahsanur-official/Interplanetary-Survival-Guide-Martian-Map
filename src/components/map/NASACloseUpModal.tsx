import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ExternalLink,
  Sparkles,
  Layers,
  Camera,
  Compass,
  RefreshCw,
  Info,
  Grid,
} from 'lucide-react';
import {
  NASACloseUpImage,
  VERIFIED_NASA_CLOSEUPS,
  fetchNASAFeatureCloseUps,
} from '../../engine/nasaMarsService';

interface NASACloseUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  featureName?: string;
}

export const NASACloseUpModal: React.FC<NASACloseUpModalProps> = ({
  isOpen,
  onClose,
  initialQuery = 'Jezero',
  featureName,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'microscopic' | 'surface' | 'hirise' | 'panorama'>('all');
  const [searchQuery, setSearchQuery] = useState(featureName || initialQuery || 'Jezero');
  const [images, setImages] = useState<NASACloseUpImage[]>(VERIFIED_NASA_CLOSEUPS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<NASACloseUpImage | null>(VERIFIED_NASA_CLOSEUPS[0]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showScaleGrid, setShowScaleGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileView, setMobileView] = useState<'viewer' | 'gallery'>('viewer');

  // Sync initial query if prop changes
  useEffect(() => {
    if (featureName) {
      setSearchQuery(featureName);
      loadImages(featureName, activeTab);
    }
  }, [featureName]);

  const loadImages = async (query: string, tab: typeof activeTab) => {
    setIsLoading(true);
    try {
      const results = await fetchNASAFeatureCloseUps(query, tab);
      setImages(results);
      if (results.length > 0) {
        setSelectedImage(results[0]);
        setZoomLevel(1);
      }
    } catch (err) {
      console.error('Failed to load NASA close-ups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadImages(searchQuery, activeTab);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full bg-[#0c101a] border border-neutral-700/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-200 transition-all ${
          isFullscreen ? 'fixed inset-2 z-50 h-[calc(100vh-1rem)]' : 'max-w-6xl h-[92vh] max-h-[900px]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-[#0f1422] border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-orange-600/20 border border-orange-500/40 text-orange-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  NASA Mars In-Situ Surface Explorer
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-[10px] font-mono text-emerald-300 font-semibold hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Direct NASA Live API
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Centimeter & microscopic close-ups directly from JPL Rovers & MRO HiRISE (25cm/pixel)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer hidden sm:block"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Header */}
        <div className="px-4 py-2.5 bg-[#0a0d16] border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'All Close-Ups', icon: Sparkles },
              { id: 'microscopic', label: 'Microscopic (WATSON/MAHLI)', icon: Sparkles },
              { id: 'surface', label: 'Rover Surface (Mastcam-Z)', icon: Camera },
              { id: 'hirise', label: 'HiRISE 25cm/px Orbit', icon: Layers },
              { id: 'panorama', label: '360° Horizon Panoramas', icon: Compass },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-950'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input for NASA Database */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadImages(searchQuery, activeTab);
            }}
            className="flex items-center gap-1.5 w-full sm:w-auto"
          >
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search NASA features (e.g. Jezero, Rock, Gale)..."
                className="w-full pl-8 pr-3 py-1 text-xs bg-neutral-900 border border-neutral-700/80 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1"
            >
              {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Fetch'}
            </button>
          </form>
        </div>

        {/* Quick Landmark Chips */}
        <div className="px-4 py-1.5 bg-[#080b12] border-b border-neutral-800/60 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0 text-neutral-400">
          <span className="text-neutral-500 font-mono text-[10px] shrink-0">QUICK SITES:</span>
          {['Jezero Crater', 'Gale Crater', 'Olympus Mons', 'Valles Marineris', 'Victoria Crater', 'Séítah Rock Core'].map(
            (site) => (
              <button
                key={site}
                onClick={() => {
                  setSearchQuery(site);
                  loadImages(site, activeTab);
                }}
                className="px-2 py-0.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 hover:text-orange-400 border border-neutral-800 text-neutral-300 whitespace-nowrap transition-colors cursor-pointer text-[10px]"
              >
                {site}
              </button>
            )
          )}
        </div>

        {/* Mobile View Switcher (Viewer vs Gallery) */}
        <div className="flex lg:hidden items-center justify-center p-1.5 bg-[#080b12] border-b border-neutral-800 shrink-0">
          <div className="flex bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 w-full max-w-xs">
            <button
              onClick={() => setMobileView('viewer')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mobileView === 'viewer'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Inspection View</span>
            </button>
            <button
              onClick={() => setMobileView('gallery')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mobileView === 'gallery'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Captures ({images.length})</span>
            </button>
          </div>
        </div>

        {/* Main Split Body: Interactive Deep Zoom Viewer on Left, Image Grid on Right */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Main Inspection Viewport (col 7/8 on lg) */}
          <div
            className={`lg:col-span-7 xl:col-span-8 flex-col bg-neutral-950 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-neutral-800 ${
              mobileView === 'viewer' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {selectedImage ? (
              <div className="relative flex-1 flex items-center justify-center overflow-hidden p-2 select-none group">
                {/* Deep Zoomable Surface Image Container */}
                <div
                  className="relative transition-transform duration-150 ease-out cursor-grab active:cursor-grabbing max-h-full max-w-full flex items-center justify-center"
                  style={{
                    transform: `scale(${zoomLevel})`,
                  }}
                >
                  <img
                    src={selectedImage.imgSrc}
                    alt={selectedImage.title}
                    referrerPolicy="no-referrer"
                    className="max-h-[50vh] lg:max-h-[65vh] w-auto object-contain rounded shadow-2xl transition-all"
                  />

                  {/* Millimeter / Centimeter Scale Grid Overlay */}
                  {showScaleGrid && (
                    <div className="absolute inset-0 border border-cyan-400/50 pointer-events-none grid grid-cols-6 grid-rows-6">
                      {[...Array(36)].map((_, i) => (
                        <div key={i} className="border border-cyan-400/20" />
                      ))}
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300">
                        Scale: {selectedImage.scaleResolution}
                      </div>
                    </div>
                  )}
                </div>

                {/* Floating Image Inspection HUD Controls */}
                <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-[#0c101a]/95 backdrop-blur-md border border-neutral-700/80 rounded-xl p-1.5 shadow-2xl">
                  <button
                    onClick={() => setZoomLevel((prev) => Math.min(prev + 0.5, 4))}
                    className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-white transition-colors cursor-pointer"
                    title="Zoom in 50%"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-[11px] text-orange-400 px-1 font-bold">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((prev) => Math.max(prev - 0.5, 1))}
                    disabled={zoomLevel <= 1}
                    className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="px-2 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-[10px] font-mono transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                  <div className="h-4 w-[1px] bg-neutral-700 mx-0.5" />
                  <button
                    onClick={() => setShowScaleGrid(!showScaleGrid)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                      showScaleGrid
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-neutral-800/80 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <Grid className="w-3 h-3" />
                    <span>Grid</span>
                  </button>
                </div>

                {/* NASA Verified Scientific Tag */}
                <div className="absolute top-3 left-3 z-20 bg-[#0c101a]/95 backdrop-blur-md border border-neutral-700/80 rounded-lg px-2.5 py-1 text-[10px] font-mono text-neutral-300 shadow-xl flex items-center gap-2">
                  <span className="text-orange-400 font-bold">{selectedImage.id}</span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-cyan-300">{selectedImage.scaleResolution}</span>
                </div>

                {/* Full Uncompressed NASA File Link */}
                <a
                  href={selectedImage.origImgSrc || selectedImage.imgSrc}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-300 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-mono transition-colors shadow-xl"
                  title="Open original uncompressed full-res image on NASA servers"
                >
                  <span>Raw NASA TIFF/JPG</span>
                  <ExternalLink className="w-3 h-3 text-orange-400" />
                </a>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-500 text-xs">
                Select an image to inspect
              </div>
            )}

            {/* Scientific Metadata Drawer */}
            {selectedImage && (
              <div className="p-3.5 bg-[#0e1322] border-t border-neutral-800/80 text-xs space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white text-sm leading-snug">{selectedImage.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-neutral-400 mt-1">
                      <span className="text-orange-300">{selectedImage.mission}</span>
                      <span>•</span>
                      <span className="text-cyan-300">{selectedImage.instrument}</span>
                      {selectedImage.sol && (
                        <>
                          <span>•</span>
                          <span className="text-amber-300">Sol {selectedImage.sol}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-neutral-400">Date: {selectedImage.earthDate}</span>
                    </div>
                  </div>
                </div>
                <p className="text-neutral-300 text-[11px] leading-relaxed line-clamp-3">
                  {selectedImage.description}
                </p>
              </div>
            )}
          </div>

          {/* Right Thumbnails / Gallery Grid (col 5/4 on lg) */}
          <div
            className={`lg:col-span-5 xl:col-span-4 flex-col bg-[#0b0e18] overflow-hidden ${
              mobileView === 'gallery' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <div className="px-3.5 py-2 bg-[#0d1220] border-b border-neutral-800 flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-300">
                NASA In-Situ Captures ({images.length})
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                Click to inspect & zoom
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-48 text-neutral-400 gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-orange-400" />
                  <span className="text-xs">Fetching real NASA imagery stream...</span>
                </div>
              ) : images.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 text-xs space-y-2">
                  <p>No NASA imagery found for "{searchQuery}".</p>
                  <button
                    onClick={() => {
                      setSearchQuery('Jezero');
                      loadImages('Jezero', activeTab);
                    }}
                    className="px-3 py-1 bg-neutral-800 text-orange-400 rounded-lg text-xs"
                  >
                    Reset to Jezero Crater
                  </button>
                </div>
              ) : (
                images.map((img) => {
                  const isSelected = selectedImage?.id === img.id;
                  return (
                    <div
                      key={img.id}
                      onClick={() => {
                        setSelectedImage(img);
                        setZoomLevel(1);
                        setMobileView('viewer');
                      }}
                      className={`group p-2 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                        isSelected
                          ? 'bg-[#151c2e] border-orange-500/80 shadow-lg shadow-orange-950/40'
                          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800">
                        <img
                          src={img.imgSrc}
                          alt={img.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 font-mono text-[8.5px] text-cyan-300 font-semibold">
                          {img.type}
                        </span>
                      </div>

                      {/* Meta */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <h4
                            className={`text-xs font-semibold truncate ${
                              isSelected ? 'text-white' : 'text-neutral-200 group-hover:text-white'
                            }`}
                          >
                            {img.title}
                          </h4>
                          <span className="text-[10px] text-orange-400/90 font-mono block mt-0.5 truncate">
                            {img.instrument}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9.5px] font-mono text-neutral-400 pt-1">
                          <span className="text-neutral-400">{img.id}</span>
                          <span className="text-emerald-400">{img.scaleResolution}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
