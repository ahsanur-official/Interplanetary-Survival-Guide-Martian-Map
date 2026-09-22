// MGS MOLA (Mars Global Surveyor - Mars Orbiter Laser Altimeter) Topographic Engine
// Computes continuous high-fidelity elevation, slope gradients, and terrain difficulty
// across the Martian surface referenced to the IAU 2000 MOLA 0m Areoid Datum.

import { ALL_MARS_FEATURES, MarsFeature } from '../data/marsNomenclature';
import { calculateMarsDistanceKm, MARS_RADIUS_KM } from './spatialMath';

export interface ElevationSamplePoint {
  index: number;
  lat: number;
  lng: number;
  distanceKm: number;
  elevationM: number;
  slopeDeg: number;
  difficultyLevel: 1 | 2 | 3 | 4;
  difficultyLabel: 'Planar / Gentle' | 'Moderate Slope' | 'Steep Incline' | 'Extreme Cliff';
  difficultyColor: string;
  astronautSpeedKmH: number;
  atmosphericPressureMbar: number;
}

export interface ElevationTransectProfile {
  startPoint: { lat: number; lng: number; name?: string };
  endPoint: { lat: number; lng: number; name?: string };
  totalDistanceKm: number;
  samples: ElevationSamplePoint[];
  minElevationM: number;
  maxElevationM: number;
  elevationSpanM: number;
  totalAscentM: number;
  totalDescentM: number;
  maxSlopeDeg: number;
  meanSlopeDeg: number;
  maxSlopeLocationKm: number;
  difficultyStats: {
    gentlePct: number;    // < 5°
    moderatePct: number;  // 5° - 15°
    steepPct: number;     // 15° - 25°
    extremePct: number;   // >= 25°
  };
  overallDifficulty: 'Level 1: Traversable Plains' | 'Level 2: Rolling Undulations' | 'Level 3: Rugged Escarpments' | 'Level 4: Extreme Chasm / Cliff Hazard';
  astronautTravelTimeHours: number;
  roverFeasibility: {
    status: 'Nominal' | 'Cautious' | 'Hazardous' | 'Impassable';
    description: string;
    color: string;
  };
}

// Iconic planetary transects for instant exploration
export interface PresetTransect {
  id: string;
  name: string;
  description: string;
  start: { lat: number; lng: number; name: string };
  end: { lat: number; lng: number; name: string };
  significance: string;
}

export const PRESET_MARS_TRANSECTS: PresetTransect[] = [
  {
    id: 'olympus-scarp',
    name: 'Olympus Mons: Summit to Basal Scarp',
    description: 'Descends from the 21.2 km summit caldera across volcanic flanks down the 7 km vertical basal cliff to the Amazonis plains.',
    start: { lat: 18.65, lng: -133.8, name: 'Olympus Mons Caldera' },
    end: { lat: 21.5, lng: -137.5, name: 'Amazonis Planitia Plains' },
    significance: 'Tallest volcanic relief in the Solar System; dramatic 25°+ cliff drop.',
  },
  {
    id: 'valles-marineris-cross',
    name: 'Valles Marineris: Rim to Abyss Floor',
    description: 'Crosses Coprates Chasma canyon rim (+3,200m) plunging down sheer walls to the canyon trough (-4,400m).',
    start: { lat: -9.5, lng: -60.0, name: 'Coprates North Rim' },
    end: { lat: -15.5, lng: -60.0, name: 'Coprates Chasma Floor' },
    significance: 'Deepest planetary rift canyon system, spanning over 7,500m of vertical relief.',
  },
  {
    id: 'jezero-delta-rim',
    name: 'Jezero Crater: Fan Delta to Crater Rim',
    description: 'Traverses from Perseverance rover delta lakebed (-2,560m) climbing the Jezero western rim scarp (-2,250m).',
    start: { lat: 18.38, lng: 77.58, name: 'Perseverance Landing Site' },
    end: { lat: 18.65, lng: 77.10, name: 'Jezero Western Rim Crest' },
    significance: 'Active Mars 2020 exploration corridor examining delta sediments and ancient crater walls.',
  },
  {
    id: 'hellas-basin-descent',
    name: 'Hellas Planitia: Rim Plateau to Deepest Abyss',
    description: 'Descends from the Southern Highlands cratered plateau (+1,800m) into the lowest depression on Mars (-8,200m).',
    start: { lat: -25.0, lng: 70.0, name: 'Noachis Terra Highland' },
    end: { lat: -42.4, lng: 70.5, name: 'Hellas Basin Floor' },
    significance: 'Giant 2,300 km impact basin with 10 km total depth and highest surface atmospheric pressure.',
  },
  {
    id: 'gale-sharp-traverse',
    name: 'Gale Crater: Floor to Mount Sharp Summit',
    description: 'Curiosity rover exploration path from northern crater floor (-4,450m) ascending Aeolis Mons layers to the central peak (+800m).',
    start: { lat: -4.59, lng: 137.44, name: 'Bradbury Landing Floor' },
    end: { lat: -5.08, lng: 137.85, name: 'Mount Sharp (Aeolis Mons)' },
    significance: 'Stratigraphic record of aqueous clay to sulfate climate transition spanning billions of years.',
  },
  {
    id: 'tharsis-montes-ridge',
    name: 'Tharsis Ridge: Ascraeus to Pavonis Mons',
    description: 'Traverses the volcanic plateau connecting giant shield volcanoes Ascraeus Mons (+18.2 km) and Pavonis Mons (+14.1 km).',
    start: { lat: 11.9, lng: -104.5, name: 'Ascraeus Mons Summit' },
    end: { lat: 0.8, lng: -112.9, name: 'Pavonis Mons Summit' },
    significance: 'Major equatorial volcanic rift axis dominating Martian gravitational and atmospheric dynamics.',
  },
];

/**
 * Global spherical pseudo-MOLA elevation model combining:
 * 1. Global crustal dichotomy gradient (IAU/MOLA datum)
 * 2. Major regional volcanic swells, deep basins, and rift canyons
 * 3. High-order RBF anchoring to hundreds of IAU/NASA gazetteer features
 * 4. Harmonic crater/ridge topographic micro-relief
 */
export function getMolaElevation(lat: number, lng: number): number {
  // Normalize lng to -180 to +180
  let normLng = ((((lng + 180) % 360) + 360) % 360) - 180;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (normLng * Math.PI) / 180;

  // 1. Planetary Dichotomy Baseline (Lowlands North: -4000m, Highlands South: +1500m)
  // Transition centered between 0° and 30°N with sinusoidal shift
  const dichotomyLatTransition = 12 - 8 * Math.sin(lngRad * 2);
  let baseElev = -1200;
  if (lat > dichotomyLatTransition + 15) {
    // Northern lowlands
    baseElev = -4200 + 400 * Math.sin(latRad * 2) * Math.cos(lngRad);
  } else if (lat < dichotomyLatTransition - 15) {
    // Southern highlands
    baseElev = 1800 + 700 * Math.cos(latRad * 1.5) * Math.sin(lngRad + 1.2);
  } else {
    // Smooth transition across dichotomy scarp
    const t = (lat - (dichotomyLatTransition - 15)) / 30; // 0 to 1
    baseElev = 1800 * (1 - t) + -4200 * t;
  }

  // 2. Polar Ice Caps
  if (lat > 80) {
    const polarDist = (90 - lat) / 10;
    baseElev = Math.max(baseElev, -1000 + (1 - polarDist) * 3200); // Planum Boreum dome
  } else if (lat < -80) {
    const polarDist = (lat + 90) / 10;
    baseElev = Math.max(baseElev, 1500 + (1 - polarDist) * 2200); // Planum Australe dome
  }

  // 3. Regional Physiographic Structures
  // A. Tharsis Volcanic Bulge (-135° to -75° lng, -20° to 30° lat)
  const tharsisDist = Math.hypot((lat - 2) / 25, (normLng - -105) / 30);
  if (tharsisDist < 1.0) {
    const tharsisRise = (1 - tharsisDist) * (1 - tharsisDist) * 8500;
    baseElev += tharsisRise;
  }

  // B. Elysium Rise (147° lng, 25° lat)
  const elysiumDist = Math.hypot((lat - 25) / 15, (normLng - 147) / 18);
  if (elysiumDist < 1.0) {
    const elysiumRise = (1 - elysiumDist) * 5200;
    baseElev += elysiumRise;
  }

  // C. Hellas Impact Basin (70° lng, -42.5° lat, deepest on Mars)
  const hellasDist = Math.hypot((lat - -42.4) / 18, (normLng - 70.5) / 22);
  if (hellasDist < 1.0) {
    const hellasDrop = (1 - hellasDist) * 7800;
    baseElev -= hellasDrop;
    baseElev = Math.max(-8200, Math.min(baseElev, -4000));
  } else if (hellasDist < 1.4) {
    // Elevated crater rim ejecta rampart
    const rimFactor = Math.sin(((hellasDist - 1.0) / 0.4) * Math.PI);
    baseElev += rimFactor * 1600;
  }

  // D. Argyre Impact Basin (-44° lng, -50° lat)
  const argyreDist = Math.hypot((lat - -50) / 10, (normLng - -44) / 14);
  if (argyreDist < 1.0) {
    baseElev -= (1 - argyreDist) * 5200;
  }

  // E. Isidis Impact Basin (87° lng, 13° lat)
  const isidisDist = Math.hypot((lat - 12.9) / 8, (normLng - 87) / 10);
  if (isidisDist < 1.0) {
    baseElev -= (1 - isidisDist) * 3800;
  }

  // F. Valles Marineris Canyon Troughs (-90° to -30° lng, -5° to -14° lat)
  if (normLng >= -92 && normLng <= -32 && lat >= -16 && lat <= -3) {
    // Central axis of the rift canyon
    const canyonAxisLat = -9.0 + (normLng - -90) * -0.06;
    const distToAxis = Math.abs(lat - canyonAxisLat);
    if (distToAxis < 4.0) {
      // Canyon floor plunges 5-8 km below surrounding plateau
      const wallProximity = distToAxis / 4.0;
      const canyonDepth = (1 - Math.pow(wallProximity, 1.8)) * 6800;
      baseElev -= canyonDepth;
    }
  }

  // 4. RBF Anchoring to Specific Prominent MOLA Features
  // Check if coordinates are near known IAU volcanoes, craters, or features
  let anchorInfluence = 0;
  let anchorDelta = 0;

  for (let i = 0; i < ALL_MARS_FEATURES.length; i++) {
    const feat = ALL_MARS_FEATURES[i];
    const dLat = lat - feat.lat;
    let dLng = normLng - feat.lng;
    if (dLng > 180) dLng -= 360;
    if (dLng < -180) dLng += 360;

    // Approximate angular distance in degrees
    const angularDist = Math.hypot(dLat, dLng * Math.cos(latRad));
    const radiusDeg = Math.max(0.6, (feat.diameterKm || 100) / 120);

    if (angularDist < radiusDeg * 2.5) {
      const normalizedDist = angularDist / (radiusDeg * 2.5);
      const weight = Math.pow(1 - normalizedDist, 2.5);

      // Volcano cone profile
      if (feat.type.includes('Mons') || feat.type.includes('Volcano')) {
        const heightM = feat.elevationM - baseElev;
        if (angularDist < radiusDeg) {
          // Summit caldera & cone
          const coneH = Math.cos((angularDist / radiusDeg) * (Math.PI / 2)) * heightM;
          baseElev += coneH * weight;
        } else {
          // Flank scarp
          const flankH = (1 - (angularDist - radiusDeg) / (radiusDeg * 1.5)) * (heightM * 0.4);
          baseElev += flankH * weight;
        }
      } else if (feat.type.includes('Crater')) {
        // Impact crater profile: elevated rim + depressed bowl + central peak
        const rimRadius = radiusDeg * 0.8;
        if (angularDist < rimRadius * 0.3 && (feat.diameterKm || 0) > 40) {
          // Central peak
          baseElev += 600 * weight;
        } else if (angularDist < rimRadius) {
          // Crater bowl
          baseElev = baseElev * (1 - weight) + feat.elevationM * weight;
        } else if (angularDist < radiusDeg * 1.3) {
          // Raised rim
          baseElev += 500 * weight;
        }
      } else {
        anchorDelta += (feat.elevationM - baseElev) * weight;
        anchorInfluence += weight;
      }
    }
  }

  if (anchorInfluence > 0) {
    baseElev += anchorDelta / (anchorInfluence + 1);
  }

  // 5. High-Frequency Micro-Topography (Craters, Ridges, Dunes)
  const microNoise =
    Math.sin(latRad * 80 + normLng * 0.5) * 65 +
    Math.cos(lngRad * 90 - latRad * 30) * 45 +
    Math.sin(latRad * 160 + lngRad * 160) * 25;
  baseElev += microNoise;

  // Clamp to valid Mars MOLA extremes: -8,200m (Hellas floor) to +21,229m (Olympus Mons summit)
  return Math.round(Math.max(-8200, Math.min(21229, baseElev)));
}

/**
 * Calculates atmospheric pressure (mbar) at a given MOLA elevation using
 * Mars barometric scale height formula: P(z) = P0 * exp(-z / H)
 * Where P0 = 6.1 mbar (at 0m datum), H = 11,100 m (atmospheric scale height)
 */
export function getMarsPressureMbar(elevationM: number): number {
  const P0 = 6.1; // mbar at 0m MOLA areoid datum
  const H = 11100; // Mars scale height in meters
  const pressure = P0 * Math.exp(-elevationM / H);
  return Number(pressure.toFixed(2));
}

/**
 * Generate high-resolution elevation profile along great-circle line between Point A and Point B
 */
export function generateElevationTransect(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  numSamples = 120,
  startName?: string,
  endName?: string
): ElevationTransectProfile {
  const totalDistanceKm = calculateMarsDistanceKm(
    { latitude: startLat, longitude: startLng },
    { latitude: endLat, longitude: endLng }
  );

  const samples: ElevationSamplePoint[] = [];

  // Great-circle interpolation points using spherical trigonometry
  const lat1 = (startLat * Math.PI) / 180;
  const lon1 = (startLng * Math.PI) / 180;
  const lat2 = (endLat * Math.PI) / 180;
  const lon2 = (endLng * Math.PI) / 180;

  // Central angular distance
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const delta = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));

  let minElev = Infinity;
  let maxElev = -Infinity;
  let totalAscent = 0;
  let totalDescent = 0;

  for (let i = 0; i <= numSamples; i++) {
    const f = i / numSamples;
    let sampleLat: number;
    let sampleLng: number;

    if (delta < 1e-6) {
      sampleLat = startLat;
      sampleLng = startLng;
    } else {
      const A = Math.sin((1 - f) * delta) / Math.sin(delta);
      const B = Math.sin(f * delta) / Math.sin(delta);
      const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
      const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
      const z = A * Math.sin(lat1) + B * Math.sin(lat2);

      sampleLat = (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI;
      sampleLng = (Math.atan2(y, x) * 180) / Math.PI;
    }

    const distFromStartKm = totalDistanceKm * f;
    const elevationM = getMolaElevation(sampleLat, sampleLng);

    if (elevationM < minElev) minElev = elevationM;
    if (elevationM > maxElev) maxElev = elevationM;

    // Default slope to 0 initially; will compute in second pass
    samples.push({
      index: i,
      lat: Number(sampleLat.toFixed(4)),
      lng: Number(sampleLng.toFixed(4)),
      distanceKm: Number(distFromStartKm.toFixed(2)),
      elevationM,
      slopeDeg: 0,
      difficultyLevel: 1,
      difficultyLabel: 'Planar / Gentle',
      difficultyColor: '#10b981',
      astronautSpeedKmH: 3.2,
      atmosphericPressureMbar: getMarsPressureMbar(elevationM),
    });
  }

  // Second pass: compute slope angles and difficulty classifications
  let maxSlopeDeg = 0;
  let maxSlopeLocationKm = 0;
  let slopeSum = 0;
  let gentleCount = 0;
  let moderateCount = 0;
  let steepCount = 0;
  let extremeCount = 0;
  let totalWalkingHours = 0;

  for (let i = 0; i < samples.length; i++) {
    let slope = 0;
    const cur = samples[i];

    if (i === 0) {
      const next = samples[1];
      const distM = (next.distanceKm - cur.distanceKm) * 1000;
      if (distM > 0.1) {
        slope = (Math.atan(Math.abs(next.elevationM - cur.elevationM) / distM) * 180) / Math.PI;
      }
    } else if (i === samples.length - 1) {
      const prev = samples[i - 1];
      const distM = (cur.distanceKm - prev.distanceKm) * 1000;
      if (distM > 0.1) {
        slope = (Math.atan(Math.abs(cur.elevationM - prev.elevationM) / distM) * 180) / Math.PI;
      }
    } else {
      const prev = samples[i - 1];
      const next = samples[i + 1];
      const distM = (next.distanceKm - prev.distanceKm) * 1000;
      if (distM > 0.1) {
        slope = (Math.atan(Math.abs(next.elevationM - prev.elevationM) / distM) * 180) / Math.PI;
      }
    }

    // Cumulative ascent / descent
    if (i > 0) {
      const elevDelta = samples[i].elevationM - samples[i - 1].elevationM;
      if (elevDelta > 0) totalAscent += elevDelta;
      else totalDescent += Math.abs(elevDelta);
    }

    slope = Number(slope.toFixed(1));
    cur.slopeDeg = slope;
    slopeSum += slope;

    if (slope > maxSlopeDeg) {
      maxSlopeDeg = slope;
      maxSlopeLocationKm = cur.distanceKm;
    }

    // Difficulty classification
    if (slope < 5) {
      cur.difficultyLevel = 1;
      cur.difficultyLabel = 'Planar / Gentle';
      cur.difficultyColor = '#10b981'; // Green
      cur.astronautSpeedKmH = 3.2;
      gentleCount++;
    } else if (slope < 15) {
      cur.difficultyLevel = 2;
      cur.difficultyLabel = 'Moderate Slope';
      cur.difficultyColor = '#eab308'; // Amber / Yellow
      cur.astronautSpeedKmH = Math.max(1.8, 3.2 - (slope - 5) * 0.14);
      moderateCount++;
    } else if (slope < 25) {
      cur.difficultyLevel = 3;
      cur.difficultyLabel = 'Steep Incline';
      cur.difficultyColor = '#f97316'; // Orange
      cur.astronautSpeedKmH = Math.max(0.6, 1.8 - (slope - 15) * 0.12);
      steepCount++;
    } else {
      cur.difficultyLevel = 4;
      cur.difficultyLabel = 'Extreme Cliff';
      cur.difficultyColor = '#ef4444'; // Red
      cur.astronautSpeedKmH = 0.2; // effectively requiring rappelling
      extremeCount++;
    }

    // Step walking time
    if (i > 0) {
      const stepDistKm = cur.distanceKm - samples[i - 1].distanceKm;
      const avgSpeed = (cur.astronautSpeedKmH + samples[i - 1].astronautSpeedKmH) / 2;
      totalWalkingHours += stepDistKm / avgSpeed;
    }
  }

  const meanSlopeDeg = Number((slopeSum / samples.length).toFixed(1));
  const totalPoints = samples.length;

  const difficultyStats = {
    gentlePct: Math.round((gentleCount / totalPoints) * 100),
    moderatePct: Math.round((moderateCount / totalPoints) * 100),
    steepPct: Math.round((steepCount / totalPoints) * 100),
    extremePct: Math.round((extremeCount / totalPoints) * 100),
  };

  let overallDifficulty: ElevationTransectProfile['overallDifficulty'] = 'Level 1: Traversable Plains';
  if (difficultyStats.extremePct > 5 || maxSlopeDeg >= 28) {
    overallDifficulty = 'Level 4: Extreme Chasm / Cliff Hazard';
  } else if (difficultyStats.steepPct > 15 || maxSlopeDeg >= 18) {
    overallDifficulty = 'Level 3: Rugged Escarpments';
  } else if (difficultyStats.moderatePct > 25 || maxSlopeDeg >= 8) {
    overallDifficulty = 'Level 2: Rolling Undulations';
  }

  // Rover Feasibility Assessment
  let roverFeasibility: ElevationTransectProfile['roverFeasibility'];
  if (maxSlopeDeg >= 28) {
    roverFeasibility = {
      status: 'Impassable',
      description: `Exceeds NASA Mars 2020 & MSL rocker-bogie limit (~30°). High risk of wheel slippage and chassis rollover at km ${maxSlopeLocationKm.toFixed(0)}.`,
      color: 'text-red-400 border-red-500/50 bg-red-950/40',
    };
  } else if (maxSlopeDeg >= 18) {
    roverFeasibility = {
      status: 'Hazardous',
      description: `Steep terrain (${maxSlopeDeg}° max). Requires high-torque autonomous AutoNav drive mode and avoidance of loose scree talus.`,
      color: 'text-orange-400 border-orange-500/50 bg-orange-950/40',
    };
  } else if (maxSlopeDeg >= 10) {
    roverFeasibility = {
      status: 'Cautious',
      description: 'Moderate undulating grades. Traversable by wheeled rovers with nominal motor currents and traction monitoring.',
      color: 'text-yellow-400 border-yellow-500/50 bg-yellow-950/40',
    };
  } else {
    roverFeasibility = {
      status: 'Nominal',
      description: 'Gentle planar relief (<10° throughout). Ideal terrain for long-distance autonomous rover traverses and astronaut EVAs.',
      color: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40',
    };
  }

  return {
    startPoint: { lat: startLat, lng: startLng, name: startName },
    endPoint: { lat: endLat, lng: endLng, name: endName },
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    samples,
    minElevationM: minElev,
    maxElevationM: maxElev,
    elevationSpanM: maxElev - minElev,
    totalAscentM: Math.round(totalAscent),
    totalDescentM: Math.round(totalDescent),
    maxSlopeDeg,
    meanSlopeDeg,
    maxSlopeLocationKm: Number(maxSlopeLocationKm.toFixed(1)),
    difficultyStats,
    overallDifficulty,
    astronautTravelTimeHours: Number(totalWalkingHours.toFixed(1)),
    roverFeasibility,
  };
}
