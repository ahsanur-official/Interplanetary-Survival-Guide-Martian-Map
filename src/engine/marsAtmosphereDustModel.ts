/**
 * MARS ATMOSPHERIC OPACITY & DUST STORM SIMULATION ENGINE
 * 
 * Grounded in authentic planetary science from:
 * - NASA Mars Global Surveyor (MGS) Thermal Emission Spectrometer (TES) Dust Climatology
 * - NASA Mars Reconnaissance Orbiter (MRO) Mars Climate Sounder (MCS)
 * - NASA Mars Science Laboratory (MSL) Curiosity REMS & Mastcam Tau records
 * - NASA Mars 2020 Perseverance MEDA (Mars Environmental Dynamics Analyzer)
 * - NASA InSight TWINS Atmospheric Package
 * 
 * Physics Principles:
 * 1. Seasonal Solar Longitude (Ls):
 *    - Aphelion (Ls ~ 71°): Mars furthest from Sun (1.666 AU). Cooler atmosphere, low dust opacity (tau ~ 0.2-0.4),
 *      formation of the equatorial Aphelion Cloud Belt (water-ice clouds over Tharsis and Olympus Mons).
 *    - Perihelion (Ls ~ 251°): Mars closest to Sun (1.381 AU). Mars receives 45% more solar flux, driving intense
 *      thermal convection, Hadley cell circulation, and triggering the annual Southern Spring/Summer dust storm season (Ls ~ 180°-340°).
 * 2. Barometric Scale Height & Topography:
 *    - Atmospheric scale height H ~ 11.1 km. Deeper basins (Hellas: -8.2 km, Chryse: -4 km) hold a denser atmospheric
 *      column, elevating column optical depth. High volcanic summits (Olympus: +21.2 km) protrude above the planetary boundary layer.
 * 3. Beer-Lambert Solar Attenuation:
 *    - Direct solar transmission I / I0 = exp(-tau / cos(theta_zenith)).
 */

import { computeRealtimeMarsEphemeris, MarsOrbitalTelemetry } from './nasaMarsService';

export interface DustStormCell {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  peakTau: number;
  driftVelocityKmH: number;
  driftHeadingDeg: number;
  status: 'Incipient Squall' | 'Expanding Regional Storm' | 'Intense Vortex' | 'Dissipating Front';
  affectedLandmarks: string[];
  description: string;
}

export interface AtmosphericPointTelemetry {
  lat: number;
  lng: number;
  elevationM: number;
  solarLongitudeLs: number;
  tau: number;
  visibilityKm: number;
  solarAttenuationPercent: number;
  airDensityKgM3: number;
  estimatedWindSpeedMps: number;
  windHeadingDeg: number;
  dustHazardLevel: 'Low' | 'Moderate' | 'High' | 'Severe' | 'Extreme';
  hazardColor: string;
  skyTint: string;
  description: string;
  nearestStorm?: {
    name: string;
    distanceKm: number;
  };
}

export interface SeasonalDustState {
  currentLs: number;
  isRealtimeSync: boolean;
  activeScenario: 'realtime' | 'aphelion_clear' | 'equinox_transition' | 'perihelion_storms' | 'global_pede';
  globalMeanTau: number;
  seasonName: string;
  stormSeasonPhase: 'Low Dust / Clear Season' | 'Pre-Storm Warming' | 'Peak Dust Storm Season' | 'Post-Perihelion Decay';
  activeStorms: DustStormCell[];
  globalStormActive: boolean;
  roverTelemetry: {
    perseveranceJezero: { tau: number; status: string; visibilityKm: number };
    curiosityGale: { tau: number; status: string; visibilityKm: number };
    insightElysium: { tau: number; status: string; visibilityKm: number };
  };
}

// Canonical regional dust storm genesis centers based on PDS MGS/MRO climatology
export const MARS_DUST_CORRIDORS: Array<{
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  baseRadiusKm: number;
  baseTau: number;
  genesisLsMin: number;
  genesisLsMax: number;
  description: string;
  affectedLandmarks: string[];
}> = [
  {
    id: 'hellas_basin',
    name: 'Hellas Planitia Deep Basin Vortex',
    centerLat: -42.5,
    centerLng: 70.5,
    baseRadiusKm: 1200,
    baseTau: 2.8,
    genesisLsMin: 180,
    genesisLsMax: 330,
    description: 'Deepest impact basin on Mars (down to -8.2 km). Intense thermal gradients and high surface pressure generate massive cyclonic dust storms that often trigger planet-wide dust events.',
    affectedLandmarks: ['Hellas Planitia', 'Dao Vallis', 'Hadriaca Patera', 'Promethei Terra'],
  },
  {
    id: 'argyre_basin',
    name: 'Argyre Planitia Southern Front',
    centerLat: -49.7,
    centerLng: 316.0,
    baseRadiusKm: 850,
    baseTau: 2.2,
    genesisLsMin: 195,
    genesisLsMax: 315,
    description: 'Second-largest southern impact basin. Frequent dust lifting and dust devil swarms caused by katabatic downslope winds along the rim mountains.',
    affectedLandmarks: ['Argyre Planitia', 'Galle Crater (Happy Face)', 'Charitum Montes'],
  },
  {
    id: 'chryse_acidalia',
    name: 'Chryse–Acidalia Outflow Corridor',
    centerLat: 26.5,
    centerLng: 320.0,
    baseRadiusKm: 950,
    baseTau: 1.9,
    genesisLsMin: 210,
    genesisLsMax: 320,
    description: 'Lowland highway where cold northerly frontal systems collide with warm equatorial air, channeling fast-moving dust squalls across ancient outflow channels.',
    affectedLandmarks: ['Viking 1 Landing Site', 'Pathfinder / Ares Vallis', 'Chryse Planitia', 'Kasei Valles'],
  },
  {
    id: 'solis_claritas',
    name: 'Solis Planum & Claritas Fossae Inception',
    centerLat: -27.0,
    centerLng: 270.0,
    baseRadiusKm: 750,
    baseTau: 2.4,
    genesisLsMin: 220,
    genesisLsMax: 300,
    description: 'Historically known as the "Eye of Mars". High thermal inertia contrast against surrounding volcanic plains sparks vigorous localized dust storms.',
    affectedLandmarks: ['Valles Marineris South Rim', 'Solis Planum', 'Claritas Fossae', 'Thaumasia Planum'],
  },
  {
    id: 'isidis_syrtis',
    name: 'Isidis–Syrtis Major Boundary Front',
    centerLat: 12.9,
    centerLng: 87.0,
    baseRadiusKm: 650,
    baseTau: 1.6,
    genesisLsMin: 185,
    genesisLsMax: 310,
    description: 'The dramatic albedo contrast between dark basaltic Syrtis Major and bright dusty Isidis Planitia creates regional sea-breeze-like wind circulations that lift dust toward Jezero Crater.',
    affectedLandmarks: ['Perseverance Landing Site (Jezero Crater)', 'Isidis Planitia', 'Syrtis Major Planum'],
  },
  {
    id: 'south_polar_retreat',
    name: 'South Polar Cap Edge Sublimation Squall',
    centerLat: -76.0,
    centerLng: 180.0,
    baseRadiusKm: 1400,
    baseTau: 2.1,
    genesisLsMin: 200,
    genesisLsMax: 270,
    description: 'As the seasonal dry ice (CO2) cap rapidly sublimates under springtime sunlight, fierce circumpolar katabatic winds fling towering plumes of dust along the ice margin.',
    affectedLandmarks: ['Planum Australe', 'Australe Montes', 'South Polar Layered Deposits'],
  },
];

/**
 * Calculates global baseline dust optical depth (tau) as a function of Martian Solar Longitude Ls (0-360°).
 */
export function getBaselineGlobalTau(Ls: number): number {
  const normLs = ((Ls % 360) + 360) % 360;
  
  // Aphelion minimum around Ls = 70° (~0.28)
  // Perihelion peak around Ls = 250° (~0.85 background)
  const angleRad = ((normLs - 250) * Math.PI) / 180;
  const seasonalCurve = Math.pow((1 + Math.cos(angleRad)) / 2, 2.2);
  
  const minTau = 0.28;
  const maxTau = 0.88;
  return +(minTau + (maxTau - minTau) * seasonalCurve).toFixed(3);
}

/**
 * Approximate elevation in meters for major Martian coordinates based on MOLA datum.
 */
export function getApproximateElevationM(lat: number, lng: number): number {
  // Normalize lon to -180..180
  let lon = lng;
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;

  // Olympus Mons (+21,229m)
  const dOlympus = Math.hypot(lat - 18.65, lon - (-133.8));
  if (dOlympus < 4.0) return 21229 * (1 - dOlympus / 4.0);

  // Tharsis Montes (+14,000 to +18,000m)
  const dAscraeus = Math.hypot(lat - 11.9, lon - (-104.5));
  if (dAscraeus < 3.5) return 18225 * (1 - dAscraeus / 3.5);
  const dPavonis = Math.hypot(lat - 0.8, lon - (-113.0));
  if (dPavonis < 3.5) return 14058 * (1 - dPavonis / 3.5);
  const dArsia = Math.hypot(lat - (-8.4), lon - (-120.9));
  if (dArsia < 3.5) return 17761 * (1 - dArsia / 3.5);

  // Elysium Mons (+14,127m)
  const dElysium = Math.hypot(lat - 25.0, lon - 147.2);
  if (dElysium < 3.5) return 14127 * (1 - dElysium / 3.5);

  // Hellas Basin (-8,200m)
  const dHellas = Math.hypot(lat - (-42.5), lon - 70.5);
  if (dHellas < 16.0) return -8200 * (1 - dHellas / 16.0);

  // Argyre Basin (-5,200m)
  const dArgyre = Math.hypot(lat - (-49.7), lon - (-44.0));
  if (dArgyre < 10.0) return -5200 * (1 - dArgyre / 10.0);

  // Valles Marineris (-4,000m to -7,000m)
  if (lat >= -15 && lat <= -4 && lon >= -90 && lon <= -40) {
    return -4500;
  }

  // Northern Lowlands (Vastitas Borealis / Chryse / Utopia / Isidis)
  if (lat > 20) {
    return -3800 + Math.sin(lat * 0.1) * 600;
  }

  // Southern Highlands
  return 1500 + Math.sin(lon * 0.05) * 800;
}

/**
 * Compute active dust storm cells for a given Ls and global PEDE state.
 */
export function getActiveStormCells(Ls: number, isGlobalStorm: boolean = false): DustStormCell[] {
  const normLs = ((Ls % 360) + 360) % 360;
  const activeCells: DustStormCell[] = [];

  for (const corridor of MARS_DUST_CORRIDORS) {
    // Check if current Ls is within the corridor's active season
    let inSeason = false;
    if (corridor.genesisLsMin <= corridor.genesisLsMax) {
      inSeason = normLs >= corridor.genesisLsMin && normLs <= corridor.genesisLsMax;
    } else {
      inSeason = normLs >= corridor.genesisLsMin || normLs <= corridor.genesisLsMax;
    }

    if (inSeason || isGlobalStorm) {
      // Calculate seasonal intensity scaling factor
      const midPoint = (corridor.genesisLsMin + corridor.genesisLsMax) / 2;
      const seasonalDist = Math.abs(normLs - midPoint);
      const intensityFactor = isGlobalStorm
        ? 1.4
        : Math.max(0.4, 1.0 - seasonalDist / 90);

      const cellTau = +(corridor.baseTau * intensityFactor).toFixed(2);
      const radius = isGlobalStorm
        ? corridor.baseRadiusKm * 1.8
        : corridor.baseRadiusKm * (0.8 + 0.4 * intensityFactor);

      let status: DustStormCell['status'] = 'Expanding Regional Storm';
      if (cellTau > 2.5) status = 'Intense Vortex';
      else if (cellTau < 1.4) status = 'Incipient Squall';

      activeCells.push({
        id: corridor.id,
        name: corridor.name,
        lat: corridor.centerLat,
        lng: corridor.centerLng,
        radiusKm: Math.round(radius),
        peakTau: cellTau,
        driftVelocityKmH: Math.round(28 + Math.random() * 22),
        driftHeadingDeg: Math.round(110 + (corridor.centerLat > 0 ? 30 : -30)),
        status,
        affectedLandmarks: corridor.affectedLandmarks,
        description: corridor.description,
      });
    }
  }

  return activeCells;
}

/**
 * Returns comprehensive atmospheric and dust opacity telemetry for any Martian coordinate.
 */
export function getAtmosphericTelemetryAtCoord(
  lat: number,
  lng: number,
  Ls: number,
  isGlobalStorm: boolean = false
): AtmosphericPointTelemetry {
  const elevation = getApproximateElevationM(lat, lng);
  const baseTau = getBaselineGlobalTau(Ls);

  // Scale height correction (H = 11,100 m)
  // Deeper valleys have thicker dust columns; high volcanic peaks rise above the dust
  const scaleHeightM = 11100;
  const elevationCorrection = Math.exp(-elevation / scaleHeightM);
  let localTau = baseTau * Math.min(1.9, Math.max(0.18, elevationCorrection));

  // If global planet-encircling dust event (PEDE), dramatically elevate background opacity
  if (isGlobalStorm) {
    localTau = Math.max(2.6, localTau * 3.4);
  }

  // Check proximity to active regional dust storms
  const storms = getActiveStormCells(Ls, isGlobalStorm);
  let nearestStorm: AtmosphericPointTelemetry['nearestStorm'] | undefined;
  let minStormDist = Infinity;

  for (const storm of storms) {
    // Great circle approximate distance in km on Mars (R = 3389.5 km)
    const dLat = ((storm.lat - lat) * Math.PI) / 180;
    const dLon = ((storm.lng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((storm.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = 3389.5 * c;

    if (distKm < minStormDist) {
      minStormDist = distKm;
      nearestStorm = {
        name: storm.name,
        distanceKm: Math.round(distKm),
      };
    }

    if (distKm <= storm.radiusKm) {
      // Gaussian radial decay inside storm envelope
      const radialFactor = Math.exp(-Math.pow(distKm / (storm.radiusKm * 0.7), 2));
      const stormBoost = (storm.peakTau - baseTau) * radialFactor;
      localTau = Math.max(localTau, localTau + stormBoost);
    }
  }

  // Bound realistic Martian tau
  localTau = +Math.max(0.12, Math.min(6.5, localTau)).toFixed(2);

  // Surface direct solar attenuation (Beer-Lambert Law)
  // Assuming typical midday solar zenith angle ~ 30° -> cos(30) ~ 0.866
  const directSolarFluxRatio = Math.exp(-localTau / 0.866);
  const solarAttenuationPercent = Math.round((1 - directSolarFluxRatio) * 100);

  // Meteorological visual range (Koschmieder equation)
  // In clear dust conditions tau ~ 0.3, visibility ~ 50 km; in dust storm tau ~ 3.0, visibility < 2 km
  const visibilityKm = +Math.max(0.3, Math.min(85, 20 / Math.max(0.22, localTau))).toFixed(1);

  // Surface air density approximation (kg/m^3)
  // Mars mean ~ 0.015 kg/m^3; varies with pressure / elevation
  const airDensity = +(0.0165 * Math.exp(-elevation / scaleHeightM)).toFixed(4);

  // Wind speed estimation (m/s) based on pressure gradients and storm proximity
  let estimatedWind = 4.2 + (localTau > 1.0 ? localTau * 4.5 : 0);
  if (minStormDist < 500) {
    estimatedWind += Math.max(0, (500 - minStormDist) * 0.035);
  }
  estimatedWind = +Math.min(36, estimatedWind).toFixed(1);

  // Prevailing wind direction
  // Hadley circulation on Mars: cross-equatorial drift towards sub-solar latitude
  const subSolarLat = 25.19 * Math.sin((Ls * Math.PI) / 180);
  let windHeading = lat > subSolarLat ? 180 : 0;
  windHeading = (windHeading + (lng % 60) - 30 + 360) % 360;

  // Hazard categorization
  let dustHazardLevel: AtmosphericPointTelemetry['dustHazardLevel'] = 'Low';
  let hazardColor = '#10b981'; // emerald-500
  let skyTint = 'rgba(78, 160, 220, 0.15)'; // faint bluish/clear
  let description = 'Crisp Martian atmosphere. Minimal dust haze, optimum solar power generation, and clear horizon visibility.';

  if (localTau >= 3.0) {
    dustHazardLevel = 'Extreme';
    hazardColor = '#ef4444'; // red-500
    skyTint = 'rgba(185, 28, 28, 0.72)'; // dense reddish-brown dust
    description = 'Severe Planet-Encircling Dust Event (PEDE). Sunlight blocked by 95%+, zero solar rover generation, and extreme surface obscuration.';
  } else if (localTau >= 1.8) {
    dustHazardLevel = 'Severe';
    hazardColor = '#f97316'; // orange-500
    skyTint = 'rgba(194, 65, 12, 0.58)'; // deep ochre
    description = 'Intense regional dust storm active. Heavy atmospheric opacity, diffuse yellowish sky, and sharp reduction in EVA visibility.';
  } else if (localTau >= 0.8) {
    dustHazardLevel = 'High';
    hazardColor = '#eab308'; // yellow-500
    skyTint = 'rgba(217, 119, 6, 0.40)'; // amber
    description = 'Elevated dust squalls and airborne aerosols. Dimmed solar disk, yellow-tinted horizon, and noticeable photovoltaic dust deposition.';
  } else if (localTau >= 0.45) {
    dustHazardLevel = 'Moderate';
    hazardColor = '#38bdf8'; // sky-400
    skyTint = 'rgba(234, 179, 8, 0.22)'; // pale amber
    description = 'Typical Martian midday haze. Mild atmospheric scattering with steady rover solar collection efficiency.';
  }

  return {
    lat,
    lng,
    elevationM: Math.round(elevation),
    solarLongitudeLs: Ls,
    tau: localTau,
    visibilityKm,
    solarAttenuationPercent,
    airDensityKgM3: airDensity,
    estimatedWindSpeedMps: estimatedWind,
    windHeadingDeg: windHeading,
    dustHazardLevel,
    hazardColor,
    skyTint,
    description,
    nearestStorm,
  };
}

/**
 * Returns full simulation state for a chosen season or real-time ephemeris.
 */
export function getSeasonalDustSimulation(
  mode: 'realtime' | 'aphelion_clear' | 'equinox_transition' | 'perihelion_storms' | 'global_pede' = 'realtime',
  customLs?: number
): SeasonalDustState {
  let Ls = 0;
  let isGlobalStorm = false;

  if (mode === 'aphelion_clear') {
    Ls = 71; // Aphelion (Northern Summer / Southern Winter)
  } else if (mode === 'equinox_transition') {
    Ls = 180; // Autumnal Equinox (Dust lifting begins)
  } else if (mode === 'perihelion_storms') {
    Ls = 251; // Perihelion (Peak storm season)
  } else if (mode === 'global_pede') {
    Ls = 265; // Major planet-encircling event (like 2018 storm)
    isGlobalStorm = true;
  } else {
    // Realtime mode
    const ephemeris = computeRealtimeMarsEphemeris();
    Ls = customLs !== undefined ? customLs : ephemeris.solarLongitudeLs;
  }

  // Active storms
  const storms = getActiveStormCells(Ls, isGlobalStorm);
  const globalMean = getBaselineGlobalTau(Ls);

  // Season name
  let seasonName = 'Northern Spring / Southern Autumn';
  let phase: SeasonalDustState['stormSeasonPhase'] = 'Low Dust / Clear Season';

  if (Ls >= 90 && Ls < 180) {
    seasonName = 'Northern Summer / Southern Winter';
    phase = 'Pre-Storm Warming';
  } else if (Ls >= 180 && Ls < 270) {
    seasonName = 'Northern Autumn / Southern Spring';
    phase = 'Peak Dust Storm Season';
  } else if (Ls >= 270 && Ls < 360) {
    seasonName = 'Northern Winter / Southern Summer';
    phase = 'Post-Perihelion Decay';
  }

  // In-situ rover coordinates:
  // Perseverance (Jezero Crater): 18.38°N, 77.58°E
  const jezeroTelemetry = getAtmosphericTelemetryAtCoord(18.38, 77.58, Ls, isGlobalStorm);
  // Curiosity (Gale Crater): 4.59°S, 137.44°E
  const galeTelemetry = getAtmosphericTelemetryAtCoord(-4.59, 137.44, Ls, isGlobalStorm);
  // InSight (Elysium Planitia): 4.50°N, 135.62°E
  const insightTelemetry = getAtmosphericTelemetryAtCoord(4.5, 135.62, Ls, isGlobalStorm);

  return {
    currentLs: Ls,
    isRealtimeSync: mode === 'realtime' && customLs === undefined,
    activeScenario: mode,
    globalMeanTau: isGlobalStorm ? 3.4 : globalMean,
    seasonName,
    stormSeasonPhase: phase,
    activeStorms: storms,
    globalStormActive: isGlobalStorm,
    roverTelemetry: {
      perseveranceJezero: {
        tau: jezeroTelemetry.tau,
        status: jezeroTelemetry.dustHazardLevel,
        visibilityKm: jezeroTelemetry.visibilityKm,
      },
      curiosityGale: {
        tau: galeTelemetry.tau,
        status: galeTelemetry.dustHazardLevel,
        visibilityKm: galeTelemetry.visibilityKm,
      },
      insightElysium: {
        tau: insightTelemetry.tau,
        status: insightTelemetry.dustHazardLevel,
        visibilityKm: insightTelemetry.visibilityKm,
      },
    },
  };
}

/**
 * Generates an SVG or Canvas color ramp representation for an atmospheric tau value.
 */
export function getTauColor(tau: number, opacity: number = 0.65): string {
  if (tau < 0.35) {
    return `rgba(56, 189, 248, ${opacity * 0.4})`; // light sky blue (clear)
  }
  if (tau < 0.65) {
    return `rgba(234, 179, 8, ${opacity * 0.6})`; // amber yellow
  }
  if (tau < 1.2) {
    return `rgba(249, 115, 22, ${opacity * 0.75})`; // orange
  }
  if (tau < 2.2) {
    return `rgba(220, 38, 38, ${opacity * 0.85})`; // deep red
  }
  return `rgba(136, 19, 55, ${opacity * 0.95})`; // dark crimson / brown (PEDE)
}
