// Planetary GIS Engine: MGS MOLA & High-Resolution Mars Digital Terrain Model (DTM) Availability
// Grounded in NASA PDS Geosciences Node, USGS Astrogeology, and ESA Planetary Science Archive

export type ElevationResolutionTier =
  | 'ULTRA_HIGH'      // HiRISE DTMs (0.25m - 1.0m / px)
  | 'HIGH'            // HRSC & CTX Stereo DTMs (12.5m - 50m / px)
  | 'MEDIUM_HIGH'     // MOLA Polar High-Density Grids (512 px/deg, ~115m / px)
  | 'STANDARD_BASE'   // Global MOLA MEGDR Base (128 px/deg, ~463m / px)
  | 'LOW_RES_BASE';   // Sparse laser altimeter interpolation (>1.8 km / px)

export interface ElevationDatasetFootprint {
  id: string;
  name: string;
  mission: string;
  instrument: string;
  tier: ElevationResolutionTier;
  resolutionMetersPerPixel: number;
  relativeGainVsBaseMola: number; // e.g. 463 / 0.25 = 1852x
  intensity: number;              // 0.0 to 1.0 for heatmap rendering
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  center: { lat: number; lng: number };
  verticalPrecisionMeters: number;
  datum: string;
  pdsUrl: string;
  productId: string;
  geologicalContext: string;
  description: string;
}

export interface ElevationPointAvailability {
  lat: number;
  lng: number;
  tier: ElevationResolutionTier;
  tierLabel: string;
  resolutionMetersPerPixel: number;
  relativeGainVsBaseMola: number;
  intensity: number;
  color: string;
  fillOpacity: number;
  activeDataset: {
    id: string;
    name: string;
    mission: string;
    instrument: string;
    productId: string;
    pdsUrl: string;
    verticalPrecisionMeters: number;
    datum: string;
  };
  baselineDataset: {
    name: string;
    resolutionMetersPerPixel: number;
    instrument: string;
  };
  comparisonSummary: string;
}

// Authentic High-Resolution Elevation Products across Mars
export const ELEVATION_DATASET_CATALOG: ElevationDatasetFootprint[] = [
  // 1. ULTRA_HIGH TIER: MRO HiRISE DTMs (0.25 - 1.0 m/px)
  {
    id: 'hirise-jezero-delta',
    name: 'Jezero Delta Front & Western Crater Rim HiRISE DTM',
    mission: 'Mars Reconnaissance Orbiter (MRO)',
    instrument: 'HiRISE (High Resolution Imaging Science Experiment)',
    tier: 'ULTRA_HIGH',
    resolutionMetersPerPixel: 0.25,
    relativeGainVsBaseMola: 1852,
    intensity: 1.0,
    bounds: {
      minLat: 18.25,
      maxLat: 18.65,
      minLng: 77.20,
      maxLng: 77.65,
    },
    center: { lat: 18.44, lng: 77.45 },
    verticalPrecisionMeters: 0.2,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://www.uahirise.org/dtm/dtm.php?ID=PSP_003442_1985',
    productId: 'DTEEC_003442_1985_003297_1985_U01',
    geologicalContext: 'Lacustrine delta fan deposit and carbonate-bearing margin unit explored by Perseverance.',
    description: 'Ultra-high resolution stereo photogrammetric DTM resolving meter-scale boulders, scarps, and delta layering at 25 cm/pixel.',
  },
  {
    id: 'hirise-gale-mount-sharp',
    name: 'Gale Crater Aeolis Mons / Mount Sharp Traverse DTM',
    mission: 'Mars Reconnaissance Orbiter (MRO)',
    instrument: 'HiRISE (High Resolution Imaging Science Experiment)',
    tier: 'ULTRA_HIGH',
    resolutionMetersPerPixel: 1.0,
    relativeGainVsBaseMola: 463,
    intensity: 0.96,
    bounds: {
      minLat: -5.40,
      maxLat: -4.40,
      minLng: 137.20,
      maxLng: 137.60,
    },
    center: { lat: -4.65, lng: 137.40 },
    verticalPrecisionMeters: 0.3,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://www.uahirise.org/dtm/dtm.php?ID=PSP_001752_1750',
    productId: 'DTEEC_001752_1750_001501_1750_A01',
    geologicalContext: 'Mount Sharp sedimentary sulfate and hematite stratigraphic sections in Gale Crater.',
    description: 'Steropair DTM providing 1m spatial grid for Curiosity rover wheel traction analysis and ascent navigation.',
  },
  {
    id: 'hirise-gusev-columbia-hills',
    name: 'Gusev Crater & Columbia Hills HiRISE DTM',
    mission: 'Mars Reconnaissance Orbiter (MRO)',
    instrument: 'HiRISE',
    tier: 'ULTRA_HIGH',
    resolutionMetersPerPixel: 1.0,
    relativeGainVsBaseMola: 463,
    intensity: 0.94,
    bounds: {
      minLat: -14.85,
      maxLat: -14.45,
      minLng: 175.25,
      maxLng: 175.65,
    },
    center: { lat: -14.60, lng: 175.45 },
    verticalPrecisionMeters: 0.35,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://www.uahirise.org/dtm/dtm.php?ID=PSP_001513_1655',
    productId: 'DTEEC_001513_1655_001777_1655_A01',
    geologicalContext: 'Ancient hydrothermal silica vents at Home Plate and Spirit rover Husband Hill route.',
    description: 'Targeted DTM revealing micro-faulting and pyroclastic tephra layering around Columbia Hills.',
  },
  {
    id: 'hirise-meridiani-victoria',
    name: 'Meridiani Planum Victoria & Endurance Craters DTM',
    mission: 'Mars Reconnaissance Orbiter (MRO)',
    instrument: 'HiRISE',
    tier: 'ULTRA_HIGH',
    resolutionMetersPerPixel: 0.5,
    relativeGainVsBaseMola: 926,
    intensity: 0.98,
    bounds: {
      minLat: -2.35,
      maxLat: -1.85,
      minLng: 354.20,
      maxLng: 354.75,
    },
    center: { lat: -2.05, lng: 354.45 },
    verticalPrecisionMeters: 0.25,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://www.uahirise.org/dtm/dtm.php?ID=PSP_001414_1780',
    productId: 'DTEEC_001414_1780_001612_1780_A01',
    geologicalContext: 'Sulfate-rich evaporite plains and vertical crater alcove promontories visited by Opportunity.',
    description: 'Sub-meter DTM mapping vertical crater cliff escarpments and cross-bedded sandstones.',
  },
  {
    id: 'hirise-oxia-planum',
    name: 'Oxia Planum Rosalind Franklin Landing Site DTM',
    mission: 'Mars Reconnaissance Orbiter (MRO)',
    instrument: 'HiRISE',
    tier: 'ULTRA_HIGH',
    resolutionMetersPerPixel: 1.0,
    relativeGainVsBaseMola: 463,
    intensity: 0.95,
    bounds: {
      minLat: 17.80,
      maxLat: 18.50,
      minLng: 335.30,
      maxLng: 336.20,
    },
    center: { lat: 18.15, lng: 335.75 },
    verticalPrecisionMeters: 0.3,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://www.uahirise.org/dtm/dtm.php?ID=ESP_037188_1985',
    productId: 'DTEEC_037188_1985_037887_1985_A01',
    geologicalContext: 'Clay-rich ancient fluvio-deltaic plain chosen for ESA/NASA ExoMars rover mission.',
    description: 'Detailed terrain DTM certifying boulder distributions and slope hazards for planetary landing.',
  },
  {
    id: 'hirise-mawrth-vallis',
    name: 'Mawrth Vallis Layered Phyllosilicate Incline DTM',
    mission: 'Mars Reconnaissance Orbiter (MRO)',
    instrument: 'HiRISE',
    tier: 'ULTRA_HIGH',
    resolutionMetersPerPixel: 1.0,
    relativeGainVsBaseMola: 463,
    intensity: 0.93,
    bounds: {
      minLat: 23.40,
      maxLat: 24.60,
      minLng: 340.40,
      maxLng: 341.60,
    },
    center: { lat: 24.00, lng: 341.00 },
    verticalPrecisionMeters: 0.3,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://www.uahirise.org/dtm/dtm.php?ID=PSP_001534_2040',
    productId: 'DTEEC_001534_2040_002061_2040_A01',
    geologicalContext: 'One of the thickest stratified clay sequences on Mars spanning nontronite to kaolinite units.',
    description: 'Stereo terrain profile showing 200m vertical staircase of alteration minerals.',
  },
  {
    id: 'hirise-eberswalde-delta',
    name: 'Eberswalde Crater Sinuous Meander Delta DTM',
    mission: 'Mars Reconnaissance Orbiter (MRO)',
    instrument: 'HiRISE',
    tier: 'ULTRA_HIGH',
    resolutionMetersPerPixel: 1.0,
    relativeGainVsBaseMola: 463,
    intensity: 0.94,
    bounds: {
      minLat: -24.40,
      maxLat: -23.60,
      minLng: 326.40,
      maxLng: 327.30,
    },
    center: { lat: -24.00, lng: 326.85 },
    verticalPrecisionMeters: 0.3,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://www.uahirise.org/dtm/dtm.php?ID=PSP_001534_1560',
    productId: 'DTEEC_001534_1560_002127_1560_A01',
    geologicalContext: 'Inverted channel meander loops proving persistent liquid river flow in early Mars history.',
    description: 'Micro-relief DTM resolving channel-fill point bars and delta lobe stratigraphy.',
  },
  {
    id: 'hirise-candor-chasma',
    name: 'Candor Chasma Layered Sediments HiRISE DTM',
    mission: 'Mars Reconnaissance Orbiter (MRO)',
    instrument: 'HiRISE',
    tier: 'ULTRA_HIGH',
    resolutionMetersPerPixel: 1.0,
    relativeGainVsBaseMola: 463,
    intensity: 0.95,
    bounds: {
      minLat: -6.80,
      maxLat: -5.80,
      minLng: 284.00,
      maxLng: 285.50,
    },
    center: { lat: -6.30, lng: 284.75 },
    verticalPrecisionMeters: 0.35,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://www.uahirise.org/dtm/dtm.php?ID=PSP_001641_1735',
    productId: 'DTEEC_001641_1735_002142_1735_A01',
    geologicalContext: 'Interior layered deposits within the deep Valles Marineris canyon trough.',
    description: 'Sheer canyon interior topography resolving rhythmic sulfate layers and active dune slips.',
  },

  // 2. HIGH TIER: Mars Express HRSC & MRO CTX DTMs (12.5 - 50m / px)
  {
    id: 'hrsc-olympus-mons',
    name: 'Olympus Mons Caldera & Basal Scarp HRSC High-Res DTM',
    mission: 'Mars Express (MEX)',
    instrument: 'HRSC (High Resolution Stereo Camera)',
    tier: 'HIGH',
    resolutionMetersPerPixel: 12.5,
    relativeGainVsBaseMola: 37,
    intensity: 0.86,
    bounds: {
      minLat: 15.00,
      maxLat: 22.00,
      minLng: 222.00, // or -138 to -130
      maxLng: 230.00,
    },
    center: { lat: 18.65, lng: 226.20 },
    verticalPrecisionMeters: 5.0,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://pds-geosciences.wustl.edu/missions/mex/hrsc.htm',
    productId: 'MEX_HRSC_DTM_ORB0143_H0143_0000',
    geologicalContext: 'Summit calderas and catastrophic 7-km basal collapse scarp of the Solar System giant.',
    description: 'High-resolution stereo DTM capturing collapsed lava pit craters, lava terraces, and vertical scarp facings.',
  },
  {
    id: 'hrsc-valles-marineris',
    name: 'Valles Marineris Grand Canyon Complex HRSC DTM Mosaic',
    mission: 'Mars Express (MEX)',
    instrument: 'HRSC',
    tier: 'HIGH',
    resolutionMetersPerPixel: 25.0,
    relativeGainVsBaseMola: 18.5,
    intensity: 0.82,
    bounds: {
      minLat: -16.00,
      maxLat: -2.00,
      minLng: 270.00, // -90 to -40
      maxLng: 320.00,
    },
    center: { lat: -9.00, lng: 295.00 },
    verticalPrecisionMeters: 8.0,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://pds-geosciences.wustl.edu/missions/mex/hrsc.htm',
    productId: 'MEX_HRSC_DTM_VALLES_MOSAIC_V2',
    geologicalContext: '4,000-km tectonic rift system with 8-km sheer relief plunging into Coprates and Melas chasms.',
    description: 'Continuous stereo elevation mosaic spanning entire Valles Marineris rift, outperforming base MOLA in narrow gorges.',
  },
  {
    id: 'hrsc-tharsis-volcanoes',
    name: 'Tharsis Montes Volcanic Axis HRSC DTM Corridor',
    mission: 'Mars Express (MEX)',
    instrument: 'HRSC',
    tier: 'HIGH',
    resolutionMetersPerPixel: 50.0,
    relativeGainVsBaseMola: 9.3,
    intensity: 0.78,
    bounds: {
      minLat: -12.00,
      maxLat: 14.00,
      minLng: 235.00,
      maxLng: 260.00,
    },
    center: { lat: 0.00, lng: 247.50 },
    verticalPrecisionMeters: 10.0,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://pds-geosciences.wustl.edu/missions/mex/hrsc.htm',
    productId: 'MEX_HRSC_DTM_THARSIS_MONTES_REGIONAL',
    geologicalContext: 'Ascraeus, Pavonis, and Arsia Mons aligned along the primary equatorial volcano-tectonic swell.',
    description: 'Regional multi-orbit DTM tracking rift grabens, volcanic collapse pits, and flank lava tubes.',
  },
  {
    id: 'hrsc-elysium-cerberus',
    name: 'Elysium Mons & Cerberus Fossae HRSC DTM Corridor',
    mission: 'Mars Express (MEX)',
    instrument: 'HRSC',
    tier: 'HIGH',
    resolutionMetersPerPixel: 50.0,
    relativeGainVsBaseMola: 9.3,
    intensity: 0.77,
    bounds: {
      minLat: 5.00,
      maxLat: 28.00,
      minLng: 140.00,
      maxLng: 165.00,
    },
    center: { lat: 15.00, lng: 152.00 },
    verticalPrecisionMeters: 10.0,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://pds-geosciences.wustl.edu/missions/mex/hrsc.htm',
    productId: 'MEX_HRSC_DTM_CERBERUS_FOSSAE_ORB1254',
    geologicalContext: 'Youngest volcanic and flood-water fissures on Mars; seismic epicenters detected by InSight.',
    description: 'Detailed elevation corridor modeling water-flood debouchments and active tectonic rift walls.',
  },
  {
    id: 'hrsc-kasei-valles',
    name: 'Kasei Valles Cataclysmic Outflow Channel HRSC DTM',
    mission: 'Mars Express (MEX)',
    instrument: 'HRSC',
    tier: 'HIGH',
    resolutionMetersPerPixel: 50.0,
    relativeGainVsBaseMola: 9.3,
    intensity: 0.79,
    bounds: {
      minLat: 20.00,
      maxLat: 32.00,
      minLng: 285.00,
      maxLng: 302.00,
    },
    center: { lat: 25.50, lng: 294.00 },
    verticalPrecisionMeters: 9.0,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://pds-geosciences.wustl.edu/missions/mex/hrsc.htm',
    productId: 'MEX_HRSC_DTM_KASEI_VALLES_ORB2100',
    geologicalContext: 'Largest mega-flood cataract system on Mars carved by catastrophic glacial/ice discharge.',
    description: 'Elevation model showing streamlined islands, dry waterfalls, and terraced flood canyons.',
  },
  {
    id: 'hrsc-chryse-outflow',
    name: 'Chryse Planitia Outflow Debouchment Basin HRSC DTM',
    mission: 'Mars Express (MEX)',
    instrument: 'HRSC',
    tier: 'HIGH',
    resolutionMetersPerPixel: 50.0,
    relativeGainVsBaseMola: 9.3,
    intensity: 0.75,
    bounds: {
      minLat: 18.00,
      maxLat: 28.00,
      minLng: 315.00,
      maxLng: 330.00,
    },
    center: { lat: 22.50, lng: 322.00 },
    verticalPrecisionMeters: 10.0,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://pds-geosciences.wustl.edu/missions/mex/hrsc.htm',
    productId: 'MEX_HRSC_DTM_CHRYSE_PLANITIA_V1',
    geologicalContext: 'Viking 1 and Mars Pathfinder landing region where catastrophic floods entered northern basin.',
    description: 'Multi-orbit DTM tracking sediment deposition plains, impact craters, and terminal river mouths.',
  },

  // 3. MEDIUM_HIGH TIER: MOLA Polar High-Density Convergence Grids (512 px/deg, ~115m/px)
  {
    id: 'mola-north-polar-cap',
    name: 'Planum Boreum (North Polar Cap) MOLA 512 px/deg Grid',
    mission: 'Mars Global Surveyor (MGS)',
    instrument: 'MOLA (Laser Altimeter Polar Mode)',
    tier: 'MEDIUM_HIGH',
    resolutionMetersPerPixel: 115.0,
    relativeGainVsBaseMola: 4.0,
    intensity: 0.62,
    bounds: {
      minLat: 72.00,
      maxLat: 90.00,
      minLng: 0.00,
      maxLng: 360.00,
    },
    center: { lat: 84.00, lng: 0.00 },
    verticalPrecisionMeters: 1.0,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/',
    productId: 'MEGDR_POLAR_NORTH_512_V1',
    geologicalContext: 'Spiral trough scarps and perennial water ice layered deposits (NPLD) of Planum Boreum.',
    description: 'Highest-density laser altimeter track convergence grid on Mars with over 200 million laser soundings.',
  },
  {
    id: 'mola-south-polar-cap',
    name: 'Planum Australe (South Polar Cap) MOLA 512 px/deg Grid',
    mission: 'Mars Global Surveyor (MGS)',
    instrument: 'MOLA',
    tier: 'MEDIUM_HIGH',
    resolutionMetersPerPixel: 115.0,
    relativeGainVsBaseMola: 4.0,
    intensity: 0.60,
    bounds: {
      minLat: -90.00,
      maxLat: -72.00,
      minLng: 0.00,
      maxLng: 360.00,
    },
    center: { lat: -84.00, lng: 0.00 },
    verticalPrecisionMeters: 1.0,
    datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    pdsUrl: 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/',
    productId: 'MEGDR_POLAR_SOUTH_512_V1',
    geologicalContext: 'CO2-ice cap and perennial layered deposits (SPLD) with basal meltwater proxies.',
    description: 'High-density polar orbital convergence altimetry mapping sub-meter vertical elevation nuances.',
  },
];

// Helper to normalize longitude to 0..360 or -180..180
export function normalizeLongitude(lng: number, range: '0_to_360' | 'neg180_to_pos180' = '0_to_360'): number {
  if (range === '0_to_360') {
    return ((lng % 360) + 360) % 360;
  }
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

// Check if a point falls within dataset footprint bounds
function isPointInBounds(lat: number, lng: number, bounds: ElevationDatasetFootprint['bounds']): boolean {
  if (lat < bounds.minLat || lat > bounds.maxLat) return false;
  
  const norm360 = normalizeLongitude(lng, '0_to_360');
  const bMin = normalizeLongitude(bounds.minLng, '0_to_360');
  const bMax = normalizeLongitude(bounds.maxLng, '0_to_360');

  if (bMin <= bMax) {
    return norm360 >= bMin && norm360 <= bMax;
  } else {
    // Crosses prime meridian / anti-meridian
    return norm360 >= bMin || norm360 <= bMax;
  }
}

// Known sparse-data interpolation sectors where MOLA laser shots were spaced >2km apart
const LOW_RES_SPARSE_SECTORS = [
  { minLat: -35, maxLat: -20, minLng: 15, maxLng: 35, name: 'Noachis Terra Rough Cratered Highlands' },
  { minLat: -10, maxLat: 5, minLng: 200, maxLng: 215, name: 'Memnonia Inter-Crater Rugged Plains' },
  { minLat: 30, maxLat: 45, minLng: 180, maxLng: 200, name: 'Amazonis Planitia Distal Dust Depressions' },
  { minLat: -55, maxLat: -45, minLng: 100, maxLng: 120, name: 'Promethei Terra Hilly Terrain Gaps' },
];

function isPointInSparseSector(lat: number, lng: number): boolean {
  const norm360 = normalizeLongitude(lng, '0_to_360');
  return LOW_RES_SPARSE_SECTORS.some(
    (sec) => lat >= sec.minLat && lat <= sec.maxLat && norm360 >= sec.minLng && norm360 <= sec.maxLng
  );
}

/**
 * Returns the highest-resolution elevation dataset available at the given coordinate,
 * comparing local high-resolution products (HiRISE, HRSC, Polar 512) against base MOLA tiles.
 */
export function getElevationAvailabilityAtCoord(lat: number, lng: number): ElevationPointAvailability {
  // Check Ultra-High (HiRISE) first
  const ultraHigh = ELEVATION_DATASET_CATALOG.find(
    (ds) => ds.tier === 'ULTRA_HIGH' && isPointInBounds(lat, lng, ds.bounds)
  );
  if (ultraHigh) {
    return {
      lat,
      lng,
      tier: 'ULTRA_HIGH',
      tierLabel: 'Ultra-High Res (HiRISE DTM)',
      resolutionMetersPerPixel: ultraHigh.resolutionMetersPerPixel,
      relativeGainVsBaseMola: ultraHigh.relativeGainVsBaseMola,
      intensity: ultraHigh.intensity,
      color: '#ff0055', // Blazing magenta/neon red
      fillOpacity: 0.78,
      activeDataset: {
        id: ultraHigh.id,
        name: ultraHigh.name,
        mission: ultraHigh.mission,
        instrument: ultraHigh.instrument,
        productId: ultraHigh.productId,
        pdsUrl: ultraHigh.pdsUrl,
        verticalPrecisionMeters: ultraHigh.verticalPrecisionMeters,
        datum: ultraHigh.datum,
      },
      baselineDataset: {
        name: 'NASA MGS MOLA Global Tile',
        resolutionMetersPerPixel: 463,
        instrument: 'MOLA (Laser Altimeter)',
      },
      comparisonSummary: `${ultraHigh.relativeGainVsBaseMola}× sharper than baseline MOLA tile (${ultraHigh.resolutionMetersPerPixel}m/px vs 463m/px). Sub-meter obstacle fidelity.`,
    };
  }

  // Check High (HRSC / CTX)
  const high = ELEVATION_DATASET_CATALOG.find(
    (ds) => ds.tier === 'HIGH' && isPointInBounds(lat, lng, ds.bounds)
  );
  if (high) {
    return {
      lat,
      lng,
      tier: 'HIGH',
      tierLabel: 'High Res (HRSC Stereo DTM)',
      resolutionMetersPerPixel: high.resolutionMetersPerPixel,
      relativeGainVsBaseMola: high.relativeGainVsBaseMola,
      intensity: high.intensity,
      color: '#f59e0b', // Vivid Amber / Golden Yellow
      fillOpacity: 0.65,
      activeDataset: {
        id: high.id,
        name: high.name,
        mission: high.mission,
        instrument: high.instrument,
        productId: high.productId,
        pdsUrl: high.pdsUrl,
        verticalPrecisionMeters: high.verticalPrecisionMeters,
        datum: high.datum,
      },
      baselineDataset: {
        name: 'NASA MGS MOLA Global Tile',
        resolutionMetersPerPixel: 463,
        instrument: 'MOLA (Laser Altimeter)',
      },
      comparisonSummary: `${high.relativeGainVsBaseMola}× resolution improvement over MOLA baseline (${high.resolutionMetersPerPixel}m/px vs 463m/px). Resolves scarp slopes & rift gorges.`,
    };
  }

  // Check Medium High (Polar 512 px/deg)
  const polar = ELEVATION_DATASET_CATALOG.find(
    (ds) => ds.tier === 'MEDIUM_HIGH' && isPointInBounds(lat, lng, ds.bounds)
  );
  if (polar) {
    return {
      lat,
      lng,
      tier: 'MEDIUM_HIGH',
      tierLabel: 'Polar Dense Grid (MOLA 512 px/deg)',
      resolutionMetersPerPixel: polar.resolutionMetersPerPixel,
      relativeGainVsBaseMola: polar.relativeGainVsBaseMola,
      intensity: polar.intensity,
      color: '#10b981', // Emerald green
      fillOpacity: 0.52,
      activeDataset: {
        id: polar.id,
        name: polar.name,
        mission: polar.mission,
        instrument: polar.instrument,
        productId: polar.productId,
        pdsUrl: polar.pdsUrl,
        verticalPrecisionMeters: polar.verticalPrecisionMeters,
        datum: polar.datum,
      },
      baselineDataset: {
        name: 'NASA MGS MOLA Equatorial Base',
        resolutionMetersPerPixel: 463,
        instrument: 'MOLA (Laser Altimeter)',
      },
      comparisonSummary: `4× denser laser shot sampling due to polar orbital track convergence (~115m/px vs 463m/px base).`,
    };
  }

  // Check if Sparse Interpolated sector
  if (isPointInSparseSector(lat, lng)) {
    return {
      lat,
      lng,
      tier: 'LOW_RES_BASE',
      tierLabel: 'Low-Res Base / Sparse Track Gap',
      resolutionMetersPerPixel: 1850,
      relativeGainVsBaseMola: 0.25,
      intensity: 0.16,
      color: '#6366f1', // Indigo / Purple
      fillOpacity: 0.35,
      activeDataset: {
        id: 'mola-sparse-interp',
        name: 'MGS MOLA Interpolated Relief Mesh',
        mission: 'Mars Global Surveyor',
        instrument: 'MOLA Altimeter',
        productId: 'MEGDR_SPARSE_FILL_V1',
        pdsUrl: 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/',
        verticalPrecisionMeters: 5.0,
        datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
      },
      baselineDataset: {
        name: 'Standard MOLA 128 px/deg Tile',
        resolutionMetersPerPixel: 463,
        instrument: 'MOLA',
      },
      comparisonSummary: `Interpolated baseline gap. Laser pulse spacing >2 km; micro-topography smoothed out. Caution advised for rover route planning.`,
    };
  }

  // Default: Standard Global MOLA MEGDR Base (128 px/deg, 463 m/px)
  return {
    lat,
    lng,
    tier: 'STANDARD_BASE',
    tierLabel: 'Global MOLA MEGDR Base (463m/px)',
    resolutionMetersPerPixel: 463,
    relativeGainVsBaseMola: 1.0,
    intensity: 0.38,
    color: '#06b6d4', // Cyan
    fillOpacity: 0.42,
    activeDataset: {
      id: 'mola-megdr-128',
      name: 'MGS MOLA Mission Experiment Gridded Data Record',
      mission: 'Mars Global Surveyor (NASA)',
      instrument: 'MOLA Laser Altimeter',
      productId: 'MEG128_GLOBAL_463M',
      pdsUrl: 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/',
      verticalPrecisionMeters: 1.0,
      datum: 'IAU 2000 Mars Areoid (MOLA 0m)',
    },
    baselineDataset: {
      name: 'Standard Base Tile (MOLA 463m)',
      resolutionMetersPerPixel: 463,
      instrument: 'MOLA',
    },
    comparisonSummary: `Standard NASA planetary baseline. Continuous global 128 px/deg coverage (~463m/px at equator). Validated macro-topography.`,
  };
}

/**
 * Heatmap gradient color interpolator for transparent map overlay.
 * Maps intensity (0.0 to 1.0) into a scientifically calibrated elevation data availability spectrum:
 *  - 0.10 - 0.25: Cool Indigo / Violet (Low-res interpolated base)
 *  - 0.25 - 0.45: Deep Cyan / Sky Blue (Standard MOLA MEGDR 463m base)
 *  - 0.45 - 0.65: Emerald / Bright Green (Polar convergence 115m dense)
 *  - 0.65 - 0.85: Radiant Amber / Golden Orange (HRSC/CTX 12.5-50m High-Res)
 *  - 0.85 - 1.00: Blazing Neon Pink / Magenta Red (HiRISE 0.25-1.0m Ultra-High Res)
 */
export function getAvailabilityHeatmapColor(intensity: number, opacity: number = 0.6): string {
  if (intensity >= 0.90) {
    // Ultra-High Res HiRISE
    return `rgba(255, 0, 85, ${opacity})`;
  } else if (intensity >= 0.70) {
    // High Res HRSC / CTX
    return `rgba(245, 158, 11, ${opacity})`;
  } else if (intensity >= 0.50) {
    // Polar MOLA 512
    return `rgba(16, 185, 129, ${opacity})`;
  } else if (intensity >= 0.28) {
    // Standard MOLA Base
    return `rgba(6, 182, 212, ${opacity * 0.85})`;
  } else {
    // Low-Res Sparse Gap
    return `rgba(99, 102, 241, ${opacity * 0.75})`;
  }
}

/**
 * Global Grid Points Generator for Heatmap Rendering.
 * Creates regularly spaced global sampling points across Mars with denser sampling in high-gradient areas.
 */
export interface HeatmapGridCell {
  lat: number;
  lng: number;
  radiusKm: number;
  availability: ElevationPointAvailability;
}

export function generateElevationAvailabilityGrid(): HeatmapGridCell[] {
  const cells: HeatmapGridCell[] = [];

  // 1. Regular planetary grid
  for (let lat = -80; lat <= 80; lat += 20) {
    for (let lng = -170; lng <= 170; lng += 25) {
      const avail = getElevationAvailabilityAtCoord(lat, lng);
      cells.push({
        lat,
        lng,
        radiusKm: 700,
        availability: avail,
      });
    }
  }

  // 2. Focused sampling over polar caps
  for (let lng = -160; lng <= 160; lng += 40) {
    cells.push({
      lat: 82,
      lng,
      radiusKm: 550,
      availability: getElevationAvailabilityAtCoord(82, lng),
    });
    cells.push({
      lat: -82,
      lng,
      radiusKm: 550,
      availability: getElevationAvailabilityAtCoord(-82, lng),
    });
  }

  // 3. Dense sub-grid around all major regional high-res DTM corridors (HRSC)
  const hrscCorridors = ELEVATION_DATASET_CATALOG.filter((ds) => ds.tier === 'HIGH');
  hrscCorridors.forEach((c) => {
    const latSpan = c.bounds.maxLat - c.bounds.minLat;
    const lngSpan = c.bounds.maxLng - c.bounds.minLng;
    const latStep = Math.max(3, latSpan / 3);
    const lngStep = Math.max(5, lngSpan / 4);

    for (let lat = c.bounds.minLat + 1; lat <= c.bounds.maxLat; lat += latStep) {
      for (let lng = c.bounds.minLng + 2; lng <= c.bounds.maxLng; lng += lngStep) {
        cells.push({
          lat,
          lng: normalizeLongitude(lng, 'neg180_to_pos180'),
          radiusKm: 320,
          availability: getElevationAvailabilityAtCoord(lat, lng),
        });
      }
    }
  });

  // 4. Targeted hotspot points for Ultra-High HiRISE sites
  const hiriseSites = ELEVATION_DATASET_CATALOG.filter((ds) => ds.tier === 'ULTRA_HIGH');
  hiriseSites.forEach((site) => {
    cells.push({
      lat: site.center.lat,
      lng: normalizeLongitude(site.center.lng, 'neg180_to_pos180'),
      radiusKm: 95,
      availability: getElevationAvailabilityAtCoord(site.center.lat, site.center.lng),
    });
  });

  return cells;
}

// Preset Quick Navigation Sites for High-Resolution DTMs
export interface HighResElevationSite {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  tier: ElevationResolutionTier;
  resolutionText: string;
  gainText: string;
  lat: number;
  lng: number;
  zoom: number;
  mission: string;
  instrument: string;
  description: string;
}

export const PRESET_HIGH_RES_ELEVATION_SITES: HighResElevationSite[] = [
  {
    id: 'jezero-hirise',
    name: 'Jezero Crater Delta (Perseverance Traverse)',
    shortName: 'Jezero Delta',
    badge: 'HiRISE 0.25m',
    tier: 'ULTRA_HIGH',
    resolutionText: '0.25 m/pixel',
    gainText: '1,852× vs Base Tile',
    lat: 18.4447,
    lng: 77.4509,
    zoom: 9,
    mission: 'MRO HiRISE & Mars 2020',
    instrument: 'HiRISE DTM',
    description: 'Sub-meter stereo model of Perseverance rover delta deposits and carbonate rim.',
  },
  {
    id: 'gale-hirise',
    name: 'Gale Crater Mount Sharp (Curiosity Traverse)',
    shortName: 'Gale Mt Sharp',
    badge: 'HiRISE 1.0m',
    tier: 'ULTRA_HIGH',
    resolutionText: '1.0 m/pixel',
    gainText: '463× vs Base Tile',
    lat: -4.65,
    lng: 137.40,
    zoom: 9,
    mission: 'MRO HiRISE & MSL',
    instrument: 'HiRISE DTM',
    description: 'Stereo DTM tracing Curiosity climb along sulfate and clay sedimentary layers.',
  },
  {
    id: 'olympus-hrsc',
    name: 'Olympus Mons Caldera & Basal Scarp',
    shortName: 'Olympus Caldera',
    badge: 'HRSC 12.5m',
    tier: 'HIGH',
    resolutionText: '12.5 m/pixel',
    gainText: '37× vs Base Tile',
    lat: 18.65,
    lng: -133.80,
    zoom: 6,
    mission: 'Mars Express HRSC',
    instrument: 'HRSC Stereo DTM',
    description: 'High-resolution topographic relief of the 21 km volcanic summit caldera and basal cliffs.',
  },
  {
    id: 'valles-coprates-hrsc',
    name: 'Valles Marineris (Coprates Chasma Rift)',
    shortName: 'Coprates Rift',
    badge: 'HRSC 25m',
    tier: 'HIGH',
    resolutionText: '25 m/pixel',
    gainText: '18.5× vs Base Tile',
    lat: -14.00,
    lng: -60.00,
    zoom: 6,
    mission: 'Mars Express HRSC',
    instrument: 'HRSC DTM Mosaic',
    description: 'Precision depth profile capturing the 8-km deep sheer canyon floor and wall gullies.',
  },
  {
    id: 'north-pole-mola',
    name: 'Planum Boreum (North Polar Cap)',
    shortName: 'North Polar Cap',
    badge: 'MOLA 512 px/deg',
    tier: 'MEDIUM_HIGH',
    resolutionText: '115 m/pixel',
    gainText: '4× vs Base Tile',
    lat: 84.00,
    lng: 0.00,
    zoom: 5,
    mission: 'MGS MOLA',
    instrument: 'MOLA Polar Convergence',
    description: 'Highest-density laser altimeter track convergence mapping spiral ice troughs.',
  },
  {
    id: 'oxia-planum-hirise',
    name: 'Oxia Planum (ExoMars Rosalind Franklin Site)',
    shortName: 'Oxia Planum',
    badge: 'HiRISE 1.0m',
    tier: 'ULTRA_HIGH',
    resolutionText: '1.0 m/pixel',
    gainText: '463× vs Base Tile',
    lat: 18.15,
    lng: -24.25,
    zoom: 9,
    mission: 'MRO HiRISE & ExoMars',
    instrument: 'HiRISE DTM',
    description: 'Ancient phyllosilicate rich plains surveyed for biosignature-hunting rover landing.',
  },
  {
    id: 'meridiani-victoria-hirise',
    name: 'Victoria Crater (Opportunity In-Situ Site)',
    shortName: 'Victoria Crater',
    badge: 'HiRISE 0.5m',
    tier: 'ULTRA_HIGH',
    resolutionText: '0.50 m/pixel',
    gainText: '926× vs Base Tile',
    lat: -2.05,
    lng: -5.55,
    zoom: 10,
    mission: 'MRO HiRISE & MER-B',
    instrument: 'HiRISE DTM',
    description: 'Detailed cliff face alcoves and sand dunes explored inside Victoria Crater.',
  },
  {
    id: 'kasei-valles-hrsc',
    name: 'Kasei Valles Cataclysmic Cataracts',
    shortName: 'Kasei Valles',
    badge: 'HRSC 50m',
    tier: 'HIGH',
    resolutionText: '50 m/pixel',
    gainText: '9.3× vs Base Tile',
    lat: 25.50,
    lng: -66.00,
    zoom: 6,
    mission: 'Mars Express HRSC',
    instrument: 'HRSC DTM',
    description: 'Mega-flood erosion channels and streamlined bedrock islands carved by prehistoric floods.',
  },
];
