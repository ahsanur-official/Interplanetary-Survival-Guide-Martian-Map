// Earth vs. Mars Scale Comparison Dataset
// Inspired by Esri Explore Mars (explore-mars.esri.com)
// Provides physical geometric overlays and scale metrics comparing Martian geological giants
// to famous Earth landmarks (Mount Everest, Grand Canyon, Continental USA, Hawaii, Lake Tahoe).

export interface EarthComparisonItem {
  id: string;
  marsFeatureId: string;
  marsName: string;
  earthName: string;
  earthCategory: 'Mountain' | 'Canyon' | 'Continent' | 'Lake' | 'Volcanic Island' | 'Megaflood';
  headline: string;
  ratioSummary: string;
  marsMetrics: {
    heightOrLength: string;
    widthOrDiameter: string;
    depthOrRelief?: string;
    areaKm2?: string;
  };
  earthMetrics: {
    heightOrLength: string;
    widthOrDiameter: string;
    depthOrRelief?: string;
    areaKm2?: string;
  };
  keyTakeaways: string[];
  // Physical scale geometry representation for rendering on the Mars map
  overlayType: 'circle' | 'polygon' | 'rectangle';
  overlayBoundsKm: {
    centerLat: number;
    centerLng: number;
    radiusKm?: number;
    lengthKm?: number;
    widthKm?: number;
    bearingDeg?: number;
  };
  color: string;
}

export const EARTH_MARS_COMPARISONS: EarthComparisonItem[] = [
  {
    id: 'olympus_vs_everest',
    marsFeatureId: 'olympus_mons',
    marsName: 'Olympus Mons',
    earthName: 'Mount Everest & Hawaii (Mauna Kea)',
    earthCategory: 'Mountain',
    headline: 'Olympus Mons dwarfs Mount Everest by nearly 2.5× in height and spans the entire State of Arizona.',
    ratioSummary: '2.4× taller than Everest • Base equals France / Arizona • Summit caldera fits Los Angeles',
    marsMetrics: {
      heightOrLength: '21,229 m (21.2 km)',
      widthOrDiameter: '624 km across',
      depthOrRelief: 'Outer basal scarp up to 8 km sheer cliff',
      areaKm2: '~300,000 km²',
    },
    earthMetrics: {
      heightOrLength: '8,849 m (Everest) / 10,210 m (Mauna Kea base-to-peak)',
      widthOrDiameter: 'Everest base ~20 km; Mauna Kea ~100 km',
      depthOrRelief: 'Everest peak prominence 8,849 m',
      areaKm2: 'Hawaii Big Island: 10,432 km²',
    },
    keyTakeaways: [
      'Olympus Mons is the largest planetary mountain and volcano known in the Solar System.',
      'The volcano is so vast that an observer standing at the edge of the summit caldera cannot see the base because it slopes past the Martian horizon.',
      'Its 80-km-wide summit caldera complex contains 6 overlapping collapse pits, spacious enough to swallow London or Los Angeles.',
      'The basal scarp forms an almost vertical wall up to 8 km high—higher than Mount Kilimanjaro rising from sea level.',
    ],
    overlayType: 'circle',
    overlayBoundsKm: {
      centerLat: 18.65,
      centerLng: -133.8,
      radiusKm: 312, // 624 km diameter
    },
    color: '#38bdf8', // Cyan for Earth overlay
  },
  {
    id: 'valles_vs_grand_canyon',
    marsFeatureId: 'valles_marineris',
    marsName: 'Valles Marineris',
    earthName: 'Grand Canyon, Arizona (USA)',
    earthCategory: 'Canyon',
    headline: 'Valles Marineris is 10× longer, 7× wider, and 4× deeper than Earth’s Grand Canyon.',
    ratioSummary: '10× longer • 7× wider • 4× deeper • Stretches New York to Los Angeles',
    marsMetrics: {
      heightOrLength: '4,000 km long',
      widthOrDiameter: 'Up to 200 km wide',
      depthOrRelief: '7,000 to 10,000 m deep (7–10 km)',
      areaKm2: '~400,000 km²',
    },
    earthMetrics: {
      heightOrLength: '446 km long',
      widthOrDiameter: 'Up to 29 km wide',
      depthOrRelief: '1,828 m deep (1.8 km)',
      areaKm2: '4,926 km²',
    },
    keyTakeaways: [
      'If Valles Marineris were placed on Earth, it would stretch from New York City to Los Angeles or across the entirety of Europe.',
      'Earth’s Grand Canyon could be placed inside just one tributary branch (such as Ophir or Melas Chasma) and be completely lost inside.',
      'The canyon formed by tectonic rifting during the volcanic uplift of the Tharsis bulge, later widened by landslides and colossal glacial/water outflow.',
    ],
    overlayType: 'rectangle',
    overlayBoundsKm: {
      centerLat: -14.0,
      centerLng: -61.5,
      lengthKm: 446, // Earth Grand Canyon size for overlay
      widthKm: 29,
      bearingDeg: 95,
    },
    color: '#22c55e', // Emerald
  },
  {
    id: 'hellas_vs_usa',
    marsFeatureId: 'hellas_planitia',
    marsName: 'Hellas Planitia (Impact Basin)',
    earthName: 'Continental United States & Australia',
    earthCategory: 'Continent',
    headline: 'Hellas Basin is one of the deepest and largest impact craters in the Solar System, spanning 2,300 km.',
    ratioSummary: '2,300 km wide • 7.1 km deep • Spans from New York to Dallas',
    marsMetrics: {
      heightOrLength: '2,300 km diameter',
      widthOrDiameter: '2,300 km × 1,600 km',
      depthOrRelief: 'Plunges 7,152 m below Martian datum',
      areaKm2: '~3,000,000 km²',
    },
    earthMetrics: {
      heightOrLength: 'USA east-to-west: ~4,500 km; Australia: ~4,000 km',
      widthOrDiameter: 'Australia north-to-south: ~3,200 km',
      depthOrRelief: 'Mariana Trench on Earth: 11,034 m deep',
      areaKm2: 'Australia: 7,692,000 km²; USA: 9,834,000 km²',
    },
    keyTakeaways: [
      'At the bottom of Hellas Basin, atmospheric pressure reaches 1,240 Pa (12.4 mbar), more than double the Martian datum average (610 Pa).',
      'It is the only place on Mars where the atmospheric pressure is high enough for liquid water to briefly exist without instantly boiling away at temperatures above 0°C.',
      'The impact occurred ~4 billion years ago during the Late Heavy Bombardment, ejecting enough crustal material to bury the entire planet under 100 meters of rock.',
    ],
    overlayType: 'circle',
    overlayBoundsKm: {
      centerLat: -42.7,
      centerLng: 70.0,
      radiusKm: 1150,
    },
    color: '#f59e0b', // Amber
  },
  {
    id: 'gale_vs_london',
    marsFeatureId: 'curiosity',
    marsName: 'Gale Crater (Mount Sharp / Aeolis Mons)',
    earthName: 'Greater London / Island of Hawaii',
    earthCategory: 'Canyon',
    headline: 'Gale Crater is 154 km wide with a central mountain taller than the European Alps.',
    ratioSummary: '154 km diameter • Mount Sharp rises 5.5 km • Fits all of Greater London & Home Counties',
    marsMetrics: {
      heightOrLength: '154 km diameter',
      widthOrDiameter: 'Central Peak: Mount Sharp (Aeolis Mons) rises 5,500 m',
      depthOrRelief: 'Floor is -4,450 m below datum',
      areaKm2: '~18,600 km²',
    },
    earthMetrics: {
      heightOrLength: 'Greater London M25 orbital: ~60 km across',
      widthOrDiameter: 'Island of Hawaii: ~150 km across',
      depthOrRelief: 'Mont Blanc (Alps): 4,809 m; Mount Rainier (USA): 4,392 m',
      areaKm2: 'Greater London: 1,572 km²',
    },
    keyTakeaways: [
      'Gale Crater could comfortably hold the entire metropolitan area of London, Paris, or Los Angeles within its rim walls.',
      'Its central mound, Mount Sharp (Aeolis Mons), is higher than Mont Blanc and Mount Rainier, composed of billions of years of sedimentary mudstones.',
      'NASA’s Curiosity rover confirmed ancient long-lived lake and stream systems that persisted for millions of years.',
    ],
    overlayType: 'circle',
    overlayBoundsKm: {
      centerLat: -4.59,
      centerLng: 137.44,
      radiusKm: 77,
    },
    color: '#a855f7', // Purple
  },
  {
    id: 'jezero_vs_tahoe',
    marsFeatureId: 'perseverance',
    marsName: 'Jezero Crater & Neretva Delta',
    earthName: 'Lake Tahoe & Crater Lake (USA)',
    earthCategory: 'Lake',
    headline: 'Jezero Crater once hosted an ancient open-basin lake 45 km wide and 250 m deep.',
    ratioSummary: '45 km diameter • Lake held ~1,000 km³ of water • Similar in scale to Lake Tahoe',
    marsMetrics: {
      heightOrLength: '45 km diameter',
      widthOrDiameter: 'Delta fan: 15 km wide × 10 km long',
      depthOrRelief: 'Floor at -2,560 m below datum; crater rim 500 m high',
      areaKm2: '~1,600 km²',
    },
    earthMetrics: {
      heightOrLength: 'Lake Tahoe: 35 km long × 19 km wide; Crater Lake: 9.6 km wide',
      widthOrDiameter: 'Lake Tahoe max depth: 501 m; Crater Lake depth: 594 m',
      depthOrRelief: 'Lake Tahoe water volume: 150 km³',
      areaKm2: 'Lake Tahoe surface: 490 km²',
    },
    keyTakeaways: [
      'Jezero was flooded by water breaches through its crater rim over 3.5 billion years ago, creating a braided river delta.',
      'NASA’s Perseverance rover has sampled delta clay minerals and sedimentary conglomerates capable of preserving microscopic fossils.',
      'The crater is roughly the size of the city of San Francisco or the Lake Tahoe basin.',
    ],
    overlayType: 'circle',
    overlayBoundsKm: {
      centerLat: 18.38,
      centerLng: 77.58,
      radiusKm: 22.5,
    },
    color: '#06b6d4', // Cyan
  },
  {
    id: 'tharsis_vs_hawaii',
    marsFeatureId: 'ascraeus_mons',
    marsName: 'Tharsis Volcanic Plateau & Montes',
    earthName: 'Hawaiian-Emperor Seamount Chain',
    earthCategory: 'Volcanic Island',
    headline: 'The Tharsis Bulge is a colossal volcanic dome 5,000 km wide that tilted the planet’s crust.',
    ratioSummary: '5,000 km wide • Rises 10 km above Mars • Weighs billions of billions of tons',
    marsMetrics: {
      heightOrLength: '5,000 km diameter plateau',
      widthOrDiameter: 'Contains 4 mega-volcanoes (Olympus, Ascraeus, Pavonis, Arsia)',
      depthOrRelief: 'Plateau stands 7 to 10 km above Martian datum',
      areaKm2: '~30,000,000 km² (size of North America)',
    },
    earthMetrics: {
      heightOrLength: 'Hawaiian chain: ~2,400 km long',
      widthOrDiameter: 'Individual shields 80–120 km',
      depthOrRelief: 'Rises 5,000 m from Pacific seafloor to sea level',
      areaKm2: 'North America continent: 24,709,000 km²',
    },
    keyTakeaways: [
      'The Tharsis volcanic plateau is so massive that its weight shifted the entire crust of Mars relative to its spin axis (True Polar Wander).',
      'It contains the three Tharsis Montes (Ascraeus, Pavonis, Arsia) lined up along a tectonic rift, each rising 14–18 km high.',
      'Unlike Earth, Mars lacks plate tectonics, meaning volcanic magma plumes remained fixed under the same crust for hundreds of millions of years.',
    ],
    overlayType: 'circle',
    overlayBoundsKm: {
      centerLat: 0.0,
      centerLng: -110.0,
      radiusKm: 1500,
    },
    color: '#ec4899', // Pink
  },
];
