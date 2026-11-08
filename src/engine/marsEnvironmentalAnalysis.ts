// Mars Planetary Environmental, Hydrological, Atmospheric & Safety Science Engine
// Grounded in data from NASA Mars Odyssey (GRS/HEND), MRO (SHARAD radar, CRISM),
// MSL Curiosity (SAM/REMS/RAD), Mars 2020 Perseverance (MOXIE/MEDA), and Phoenix Lander.

import { getMolaElevation } from './marsMolaElevation';

export interface MarsLocationScienceData {
  // Water & Subsurface Ice
  water: {
    presenceType: 'Exposed Surface Ice' | 'Shallow Subsurface Ice (<1m)' | 'Glacial Sheet Debris-Covered (1-10m)' | 'Deep Hydrated Clay/Salts' | 'Deep Subsurface Aquifer (>2.5km)' | 'Hyper-Arid Dry Regolith';
    depthMeters: number;
    depthDisplay: string;
    abundancePercentage: number;
    abundanceDisplay: string;
    probabilityChance: number; // 0 - 100%
    probabilityRating: 'Confirmed (95-99%)' | 'Very High (80-94%)' | 'Moderate (50-79%)' | 'Low (20-49%)' | 'Extremely Low (<20%)';
    summary: string;
    scientificNotes: string;
  };

  // Atmospheric Gas Composition
  atmosphere: {
    surfacePressureMbar: number;
    pressureDisplay: string;
    gases: Array<{
      name: string;
      formula: string;
      percentage: string;
      color: string;
      notes: string;
    }>;
    traceMethanePpb: number;
    waterVaporPpm: number;
    summary: string;
  };

  // Safety for Humans
  humanSafety: {
    isSafeWithoutSuit: false; // Always false on Mars
    suitRequirement: 'Class-IV Pressurized EVA Space Suit Mandatory';
    safetyRating: 'Lethal Unpressurized Environment' | 'Extreme Radiation & Cold' | 'Severe Hazard';
    radiationDoseMicroSvDay: number;
    radiationDisplay: string;
    surfaceTempMinC: number;
    surfaceTempMaxC: number;
    tempDisplay: string;
    perchlorateToxicity: 'High (0.5% - 1.0% in soil regolith, toxic to thyroid/lungs)';
    summary: string;
    survivalTimeWithoutSuitSeconds: number; // ~15 seconds due to ebullism and hypoxia
  };

  // Safety for Rovers & Vehicles
  vehicleSafety: {
    trafficabilityRating: 'Excellent Flat' | 'Good' | 'Moderate (Sand Dunes)' | 'High Hazard (Boulders/Scarp)' | 'Extreme (Cliff/Caldera)';
    wheelSlipRisk: 'Low' | 'Moderate' | 'Severe (Wheel Entrapment Danger)';
    slopeDegrees: number;
    terrainType: string;
    dustAccumulationRate: string;
    summary: string;
  };

  // Precipitation / Rain
  precipitation: {
    canLiquidRain: false; // Physically impossible due to triple point of water
    liquidRainProbability: '0% (Physically Impossible)';
    liquidRainExplanation: string;
    snowType: 'CO2 Dry Ice Snow in Polar Winter' | 'High-Altitude Water-Ice Virga Snow' | 'None (Arid Atmospheric Column)';
    snowChance: string;
    frostOccurrence: string;
    summary: string;
  };
}

/**
 * Computes location-specific Martian scientific parameters based on latitude, longitude, and elevation.
 */
export function analyzeMarsLocationScience(lat: number, lng: number, elevationM?: number): MarsLocationScienceData {
  // If elevation is not provided or 0, dynamically sample MOLA topographic model
  const actualElevationM = (elevationM !== undefined && elevationM !== 0)
    ? elevationM
    : Math.round(getMolaElevation(lat, lng));

  const absLat = Math.abs(lat);

  // Normalize longitude to standard [-180, +180]
  let normLng = lng;
  while (normLng > 180) normLng -= 360;
  while (normLng < -180) normLng += 360;

  // 1. Water & Subsurface Ice Determination
  // Grounded in Mars Odyssey (GRS/HEND), MRO (SHARAD radar & CRISM), Phoenix Lander, and SWIM mapping project
  let presenceType: MarsLocationScienceData['water']['presenceType'];
  let depthMeters = 0;
  let depthDisplay = '';
  let abundancePercentage = 0;
  let abundanceDisplay = '';
  let probabilityChance = 0;
  let probabilityRating: MarsLocationScienceData['water']['probabilityRating'];
  let waterSummary = '';
  let waterNotes = '';

  // Special Geographic & Astrobiological Zones:
  const isKorolev = lat >= 71 && lat <= 75 && normLng >= 160 && normLng <= 170;
  const isArcadiaSubsurfaceIce = lat >= 35 && lat <= 58 && (normLng <= -145 || normLng >= 165);
  const isUtopiaSubsurfaceIce = lat >= 38 && lat <= 56 && normLng >= 95 && normLng <= 135;
  const isDeuteronilusGlaciers = lat >= 36 && lat <= 50 && normLng >= 15 && normLng <= 65;
  const isJezero = lat >= 17 && lat <= 20 && normLng >= 76 && normLng <= 79;
  const isGale = lat >= -6 && lat <= -3 && normLng >= 136 && normLng <= 139;
  const isEberswalde = lat >= -26 && lat <= -22 && normLng >= -36 && normLng <= -31;
  const isMawrthOxia = lat >= 15 && lat <= 26 && normLng >= -28 && normLng <= -16;
  const isMeridiani = lat >= -4 && lat <= 1 && normLng >= -9 && normLng <= -1;
  const isVallesMarineris = lat >= -18 && lat <= -4 && normLng >= -88 && normLng <= -38;
  const isHellasBasin = lat >= -52 && lat <= -30 && normLng >= 55 && normLng <= 88;
  const isArgyreBasin = lat >= -56 && lat <= -42 && normLng >= -48 && normLng <= -36;
  const isVolcanicShield = actualElevationM > 7000 || (lat >= 14 && lat <= 24 && normLng >= -140 && normLng <= -125);

  if (absLat >= 75) {
    // Polar ice caps (Planum Boreum / Planum Australe)
    presenceType = 'Exposed Surface Ice';
    depthMeters = 0.0;
    depthDisplay = '0.0 m (Directly exposed perennial surface ice)';
    abundancePercentage = 92;
    abundanceDisplay = '85% – 95% Pure Water & CO₂ Ice Sheet';
    probabilityChance = 99;
    probabilityRating = 'Confirmed (95-99%)';
    waterSummary = 'Directly exposed perennial ice cap containing millions of cubic kilometers of water ice stratified with atmospheric dust layers.';
    waterNotes = 'Confirmed by Mars Express OMEGA, MRO CRISM, and MARSIS/SHARAD orbital radar soundings.';
  } else if (isKorolev) {
    // Korolev Crater permanent water ice mound
    presenceType = 'Exposed Surface Ice';
    depthMeters = 0.0;
    depthDisplay = '0.0 m (Exposed pure water-ice dome in crater)';
    abundancePercentage = 95;
    abundanceDisplay = '90% – 98% Perennial Pure Water Ice Dome';
    probabilityChance = 98;
    probabilityRating = 'Confirmed (95-99%)';
    waterSummary = 'Massive 81-km wide impact crater filled with an exceptionally pure 1.8-km thick water-ice dome (estimated 2,200 km³ of water).';
    waterNotes = 'Cold-trap aerodynamic air barrier perpetually prevents sublimation (confirmed by ESA Mars Express HRSC).';
  } else if (isArcadiaSubsurfaceIce || isUtopiaSubsurfaceIce) {
    // Vast shallow subsurface ice sheets (NASA Subsurface Water Ice Mapping - SWIM)
    presenceType = 'Shallow Subsurface Ice (<1m)';
    depthMeters = Number((0.45 + (58 - lat) * 0.03).toFixed(2));
    depthDisplay = `${(depthMeters * 100).toFixed(0)} cm – 1.4 m beneath thin regolith`;
    abundancePercentage = 78;
    abundanceDisplay = '65% – 85% Core Glacial Sheet Ice';
    probabilityChance = 94;
    probabilityRating = 'Very High (80-94%)';
    waterSummary = 'Vast sheet of accessible subterranean ice shielded under centimeters of protective regolith. Premier candidate for human base ISRU.';
    waterNotes = 'Confirmed by SHARAD radar dielectric permittivity reflections and fresh orbital meteorite impact exposures.';
  } else if (isDeuteronilusGlaciers) {
    // Lobate Debris Aprons (Debris-covered glaciers)
    presenceType = 'Glacial Sheet Debris-Covered (1-10m)';
    depthMeters = 2.2;
    depthDisplay = '1.5 m – 3.5 m beneath rocky lag debris';
    abundancePercentage = 55;
    abundanceDisplay = '40% – 65% Glacial Core Ice';
    probabilityChance = 84;
    probabilityRating = 'Very High (80-94%)';
    waterSummary = 'Fossil alpine glaciers flowing down ancient massifs, preserved from evaporation by 1.5–3m of rocky boulder lag.';
    waterNotes = 'MRO SHARAD radar sounding verified near-pure water ice cores insulated by surface rock scree.';
  } else if (absLat >= 50) {
    // High-latitude continuous permafrost
    presenceType = 'Shallow Subsurface Ice (<1m)';
    depthMeters = Number((0.35 + (60 - absLat) * 0.02).toFixed(2));
    depthDisplay = `${(depthMeters * 100).toFixed(0)} cm – 1.1 m below surface`;
    abundancePercentage = 62;
    abundanceDisplay = '50% – 70% Water-Equivalent Hydrogen (Permafrost)';
    probabilityChance = 88;
    probabilityRating = 'Very High (80-94%)';
    waterSummary = 'Vast sheet of subterranean ice shielded under 30 cm to 1 m of protective regolith (excavated in-situ by NASA Phoenix).';
    waterNotes = 'Confirmed in-situ by NASA Phoenix Lander robotic arm trenching and MRO HiRISE fresh scarp observations.';
  } else if (absLat >= 35) {
    // Mid-latitude lobate debris aprons and fretted terrain
    presenceType = 'Glacial Sheet Debris-Covered (1-10m)';
    depthMeters = Number((1.5 + (45 - absLat) * 0.1).toFixed(2));
    depthDisplay = `${depthMeters} m – 4.2 m below surface`;
    abundancePercentage = 42;
    abundanceDisplay = '30% – 50% Subsurface Ice Deposits';
    probabilityChance = 74;
    probabilityRating = 'Moderate (50-79%)';
    waterSummary = 'Subsurface fossil glaciers insulated under 1.5 to 4 meters of rocky debris apron (detected by MRO SHARAD radar).';
    waterNotes = 'SHARAD radar reflections indicate high ice purity under protective surface lag deposits.';
  } else if (isJezero || isGale || isEberswalde) {
    // Ancient river deltas & lacustrine lakebeds
    presenceType = 'Deep Hydrated Clay/Salts';
    depthMeters = 0.05;
    depthDisplay = 'Surface hydrated smectite clays (0.05m); deep aquifer >2.5 km';
    abundancePercentage = 6.2;
    abundanceDisplay = '4% – 8% Structurally Bound Hydroxyl (OH) in Mudstones';
    probabilityChance = 68;
    probabilityRating = 'Moderate (50-79%)';
    waterSummary = 'Ancient lakebed sediments (smectite phyllosilicates, carbonates & sulfates) retain 4% to 8% bound water extractable via thermal baking at 400°C.';
    waterNotes = 'Confirmed by Mars 2020 Perseverance PIXL/SHERLOC & MSL Curiosity ChemCam in-situ sample drilling.';
  } else if (isMawrthOxia) {
    // Ancient Noachian phyllosilicate clay horizons
    presenceType = 'Deep Hydrated Clay/Salts';
    depthMeters = 0.1;
    depthDisplay = 'Exposed Noachian phyllosilicates (0.1m); deep aquifer >3.0 km';
    abundancePercentage = 5.5;
    abundanceDisplay = '4% – 7% Bound H₂O in Smectite Beds';
    probabilityChance = 62;
    probabilityRating = 'Moderate (50-79%)';
    waterSummary = 'One of the thickest layered clay sequences on Mars (smectite, nontronite & montmorillonite), recording prolonged aqueous alteration.';
    waterNotes = 'Targeted by ESA/Roscosmos ExoMars Rosalind Franklin rover mission.';
  } else if (isMeridiani) {
    // Hydrated sulfate plains (Meridiani Planum)
    presenceType = 'Deep Hydrated Clay/Salts';
    depthMeters = 0.15;
    depthDisplay = 'Hydrated jarosite/sulfate crust (0.15m); deep aquifer >3.5 km';
    abundancePercentage = 3.8;
    abundanceDisplay = '2.5% – 4.5% Bound Hydrated Sulfate Salts';
    probabilityChance = 52;
    probabilityRating = 'Moderate (50-79%)';
    waterSummary = 'Acidic groundwater evaporation deposits featuring hematite spherules ("blueberries") and jarosite salts confirmed by Opportunity rover.';
    waterNotes = 'MGS TES and Opportunity Mössbauer spectrometer confirmed jarosite requiring liquid water precipitation.';
  } else if (isVallesMarineris) {
    // Deep canyon system (Valles Marineris)
    presenceType = 'Deep Hydrated Clay/Salts';
    depthMeters = 0.25;
    depthDisplay = 'Canyon floor hydrated sulfates (0.25m); possible seasonal RSL brines';
    abundancePercentage = 4.5;
    abundanceDisplay = '3% – 5.5% Chemically Bound Water in Layered Deposits';
    probabilityChance = 48;
    probabilityRating = 'Low (20-49%)';
    waterSummary = 'Gigantic interior layered deposits (ILDs) with polyhydrated sulfates and candidate Recurring Slope Lineae (RSL) seasonal warm-season brines.';
    waterNotes = 'CRISM spectral maps show dense kieserite and gypsum along canyon floor chasmata.';
  } else if (isHellasBasin || isArgyreBasin) {
    // Deep impact basins
    presenceType = 'Glacial Sheet Debris-Covered (1-10m)';
    depthMeters = 2.8;
    depthDisplay = 'Buried basin floor glaciers 2.0 m – 4.5 m beneath debris';
    abundancePercentage = 28;
    abundanceDisplay = '20% – 35% Sub-Regolith Glacial Lenses';
    probabilityChance = 56;
    probabilityRating = 'Moderate (50-79%)';
    waterSummary = 'Deepest topography on Mars preserves debris-covered glacial flows along crater floor scarps under high atmospheric pressure.';
    waterNotes = 'Dense atmospheric column and floor topography create localized micro-climate.';
  } else if (isVolcanicShield) {
    // Volcanic calderas & shield slopes
    presenceType = 'Hyper-Arid Dry Regolith';
    depthMeters = 5000;
    depthDisplay = 'Hyper-arid desiccated volcanic shield; cryosphere >5.0 km deep';
    abundancePercentage = 0.8;
    abundanceDisplay = '0.5% – 1.2% Trapped Volcanic Glass Moisture';
    probabilityChance = 8;
    probabilityRating = 'Extremely Low (<20%)';
    waterSummary = 'Extremely dry, desiccated volcanic basalt and ash. High-altitude summit water-ice frost and orographic clouds condense seasonally.';
    waterNotes = 'Mars Express observed early-morning water frost on caldera rims of Olympus and Tharsis Montes.';
  } else {
    // Dynamic continuous formula for equatorial & tropical regolith
    const baseDepthKm = (3.5 - (absLat / 35) * 1.5 + (actualElevationM > 0 ? actualElevationM / 10000 : 0)).toFixed(1);
    const tracePct = (1.5 + Math.abs(Math.sin((normLng + 60) * (Math.PI / 180))) * 1.2 + (absLat / 35) * 1.0).toFixed(1);
    const prob = Math.round(18 + (absLat / 35) * 18 - (actualElevationM > 2000 ? 6 : 0) + (actualElevationM < -2000 ? 8 : 0));

    presenceType = 'Hyper-Arid Dry Regolith';
    depthMeters = Number(baseDepthKm) * 1000;
    depthDisplay = `Arid surface regolith; cryosphere aquifer ~${baseDepthKm} km deep`;
    abundancePercentage = Number(tracePct);
    abundanceDisplay = `${tracePct}% Bound Mineral & Adsorbed H₂O`;
    probabilityChance = Math.max(12, Math.min(42, prob));
    probabilityRating = probabilityChance >= 25 ? 'Low (20-49%)' : 'Extremely Low (<20%)';
    waterSummary = `Equatorial/tropical regolith with ~${tracePct}% adsorbed atmospheric moisture and deep crustal cryosphere.`;
    waterNotes = 'Desiccated basaltic sands and dust. Possible deep basaltic aquifers below cryosphere depth.';
  }

  // 2. Atmospheric Gas Composition & Barometric Pressure (Strictly Grounded in Real MOLA Elevation)
  const basePressure = 6.1; // mbar at 0m MOLA datum
  const scaleHeightM = 11100; // Mars atmospheric scale height
  const surfacePressureMbar = Number((basePressure * Math.exp(-actualElevationM / scaleHeightM)).toFixed(2));

  const traceMethanePpb = isGale ? 1.85 : isJezero ? 1.2 : isMawrthOxia ? 1.1 : 0.42;
  const waterVaporPpm = Math.round(
    absLat > 70 ? 40 : 160 + Math.sin((normLng * Math.PI) / 180) * 50 - (actualElevationM > 5000 ? 80 : 0)
  );

  const gases = [
    {
      name: 'Carbon Dioxide',
      formula: 'CO₂',
      percentage: '95.32%',
      color: '#f97316',
      notes: 'Dominant component; asphyxiant & lethal to unprotected humans',
    },
    {
      name: 'Nitrogen',
      formula: 'N₂',
      percentage: '2.60%',
      color: '#38bdf8',
      notes: 'Inert molecular dinitrogen buffer gas',
    },
    {
      name: 'Argon',
      formula: 'Ar',
      percentage: '1.90%',
      color: '#a855f7',
      notes: 'Radiogenic noble gas (Argon-40)',
    },
    {
      name: 'Oxygen',
      formula: 'O₂',
      percentage: '0.13%',
      color: '#22c55e',
      notes: 'Extremely scarce trace gas (harvested in-situ by NASA MOXIE)',
    },
    {
      name: 'Carbon Monoxide',
      formula: 'CO',
      percentage: '0.08%',
      color: '#eab308',
      notes: 'Photochemical dissociation byproduct',
    },
  ];

  // 3. Human Safety, Diurnal Temperatures & Radiation
  // Temperature lapse rate: ~1.8°C drop per 1,000m of elevation + latitude cooling
  const baseEquatorialMax = 18;
  const baseEquatorialMin = -82;
  const elevationLapseC = (actualElevationM / 1000) * 1.8;
  const latCoolingC = (absLat / 90) * 52;

  const tempMax = Math.round(baseEquatorialMax - latCoolingC - Math.max(0, elevationLapseC));
  const tempMin = Math.round(baseEquatorialMin - (absLat / 90) * 45 - elevationLapseC);

  // Atmospheric column radiation attenuation: lower elevation = thicker air shield
  const radiationDose = Math.round(
    235 + (actualElevationM > 0 ? (actualElevationM / 2500) * 35 : -(Math.abs(actualElevationM) / 2500) * 20) + (absLat / 90) * 25
  );

  // 4. Vehicle Safety & Trafficability
  let trafficability: MarsLocationScienceData['vehicleSafety']['trafficabilityRating'] = 'Good';
  let wheelSlip: MarsLocationScienceData['vehicleSafety']['wheelSlipRisk'] = 'Low';
  const slopeDeg = Math.min(32, Math.abs(Math.sin(lat * 0.15) * 8 + Math.cos(normLng * 0.15) * 7 + (actualElevationM > 6000 ? 14 : 0)));
  let vehicleSummary = '';
  let terrainType = 'Planar Basaltic Regolith';

  if (actualElevationM > 10000 || slopeDeg > 22) {
    trafficability = 'Extreme (Cliff/Caldera)';
    wheelSlip = 'Severe (Wheel Entrapment Danger)';
    terrainType = 'Volcanic Basalt Scarp & Caldera Wall';
    vehicleSummary = 'Extreme topographic slope with loose volcanic talus. High rollover and catastrophic wheel entrapment danger.';
  } else if (slopeDeg > 15) {
    trafficability = 'High Hazard (Boulders/Scarp)';
    wheelSlip = 'Moderate';
    terrainType = 'Rugged Scree Slope & Boulder Field';
    vehicleSummary = 'Steep gradient with impact ejecta blocks. Rover speed must be throttled to <0.5 km/h to prevent chassis bottoming.';
  } else if (absLat < 25 && actualElevationM < -2000 && !isJezero && !isGale) {
    trafficability = 'Moderate (Sand Dunes)';
    wheelSlip = 'Moderate';
    terrainType = 'Transverse Aeolian Sand Ripples';
    vehicleSummary = 'Active aeolian ripple fields and soft basaltic sand. Significant wheel sinkage risk (analogous to Spirit rover at Troy).';
  } else if (actualElevationM < -3000 && slopeDeg < 5) {
    trafficability = 'Excellent Flat';
    wheelSlip = 'Low';
    terrainType = 'Compact Smooth Lowland Pavement';
    vehicleSummary = 'Firm, flat sedimentary pavement offering optimal wheel traction and maximum daily traverse speed (>2.5 km/h).';
  } else {
    trafficability = 'Good';
    wheelSlip = 'Low';
    terrainType = actualElevationM > 2000 ? 'Highland Volcanic Basalt' : 'Planar Regolith with Scattered Pebbles';
    vehicleSummary = 'Firm basaltic regolith pavement. Optimal traversability for 6-wheeled rovers like Curiosity/Perseverance.';
  }

  // 5. Precipitation / Rain Possibility
  const rainExplanation = `Atmospheric surface pressure is ${surfacePressureMbar} mbar, which is ${
    surfacePressureMbar < 6.11 ? 'below' : 'near'
  } the thermodynamic triple point of pure water (6.11 mbar). Consequently, liquid raindrops cannot exist in a stable state; droplets spontaneously boil or freeze instantly into vapor or frost.`;

  let snowType: MarsLocationScienceData['precipitation']['snowType'] = 'None (Arid Atmospheric Column)';
  let snowChance = '0% (No precipitation)';
  let frostOccurrence = 'Diurnal micro-frost condensation observed at pre-dawn twilight.';
  let rainSummary = '';

  if (absLat >= 65) {
    snowType = 'CO2 Dry Ice Snow in Polar Winter';
    snowChance = '65% winter probability of microscopic CO2 dry-ice snowfall';
    frostOccurrence = 'Perennial CO2 and H2O frost layer accumulation.';
    rainSummary = 'Liquid rain is 0% impossible. However, polar winter clouds precipitate microscopic carbon dioxide dry-ice snow crystals directly onto the ice sheets.';
  } else if (isVolcanicShield) {
    snowType = 'High-Altitude Water-Ice Virga Snow';
    snowChance = 'Orographic water-ice clouds & summit condensation frost';
    frostOccurrence = 'Early-morning water frost observed on caldera rims by Mars Express.';
    rainSummary = 'Liquid rain is 0% impossible. Rising air cools over giant volcanic flanks, condensing into high-altitude orographic water-ice cirrus clouds.';
  } else if (isVallesMarineris) {
    snowType = 'High-Altitude Water-Ice Virga Snow';
    snowChance = 'Dense morning canyon fog & localized ground frost';
    frostOccurrence = 'Seasonal pre-dawn water frost blankets canyon floor chasmata.';
    rainSummary = 'Liquid rain is 0% impossible. Deep canyons trap atmospheric moisture, generating morning ground fogs and localized frost.';
  } else if (absLat >= 45) {
    snowType = 'High-Altitude Water-Ice Virga Snow';
    snowChance = 'High-altitude water-ice virga snowfall sublimes prior to reaching surface';
    frostOccurrence = 'Seasonal early-morning water frost blankets surface rocks.';
    rainSummary = 'Liquid rain is 0% impossible. Phoenix lander LIDAR detected high-altitude water-ice snow (virga) falling from clouds at ~4 km, vaporizing before ground contact.';
  } else {
    snowType = 'None (Arid Atmospheric Column)';
    snowChance = '0% (Hyper-arid atmospheric column)';
    frostOccurrence = 'Transient morning water-ice frost during aphelion cloud belt season.';
    rainSummary = 'Zero chance of rain or snowfall. Atmosphere is hyper-arid with transient micro-frost during peak winter dawn.';
  }

  return {
    water: {
      presenceType,
      depthMeters,
      depthDisplay,
      abundancePercentage,
      abundanceDisplay,
      probabilityChance,
      probabilityRating,
      summary: waterSummary,
      scientificNotes: waterNotes,
    },
    atmosphere: {
      surfacePressureMbar,
      pressureDisplay: `${surfacePressureMbar} mbar (${((surfacePressureMbar / 1013.25) * 100).toFixed(2)}% of Earth)`,
      gases,
      traceMethanePpb,
      waterVaporPpm,
      summary: `Atmosphere is 95.32% Carbon Dioxide and unbreathable. Surface pressure is ~${surfacePressureMbar} mbar (below the Armstrong Limit of 63 mbar), meaning unprotected human bodily fluids would boil at body temperature (ebullism).`,
    },
    humanSafety: {
      isSafeWithoutSuit: false,
      suitRequirement: 'Class-IV Pressurized EVA Space Suit Mandatory',
      safetyRating: 'Lethal Unpressurized Environment',
      radiationDoseMicroSvDay: radiationDose,
      radiationDisplay: `${radiationDose} µSv/day (~${Math.round(radiationDose / 1.0)}x higher than Earth surface)`,
      surfaceTempMinC: tempMin,
      surfaceTempMaxC: tempMax,
      tempDisplay: `${tempMin}°C to ${tempMax}°C`,
      perchlorateToxicity: 'High (0.5% - 1.0% in soil regolith, toxic to thyroid/lungs)',
      summary: 'Immediately lethal to unpressurized humans. Without a Class-IV EVA space suit, rapid hypoxia and ebullism cause unconsciousness within 15 seconds, followed by death. Chronic hazards include high galactic cosmic rays and toxic perchlorate salts in dust.',
      survivalTimeWithoutSuitSeconds: 15,
    },
    vehicleSafety: {
      trafficabilityRating: trafficability,
      wheelSlipRisk: wheelSlip,
      slopeDegrees: Number(slopeDeg.toFixed(1)),
      terrainType,
      dustAccumulationRate: '0.28% daily solar array obscuration rate',
      summary: vehicleSummary,
    },
    precipitation: {
      canLiquidRain: false,
      liquidRainProbability: '0% (Physically Impossible)',
      liquidRainExplanation: rainExplanation,
      snowType,
      snowChance,
      frostOccurrence,
      summary: rainSummary,
    },
  };
}
