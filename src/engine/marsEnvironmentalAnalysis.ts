// Mars Planetary Environmental, Hydrological, Atmospheric & Safety Science Engine
// Grounded in data from NASA Mars Odyssey (GRS/HEND), MRO (SHARAD radar, CRISM),
// MSL Curiosity (SAM/REMS/RAD), Mars 2020 Perseverance (MOXIE/MEDA), and Phoenix Lander.

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
export function analyzeMarsLocationScience(lat: number, lng: number, elevationM = 0): MarsLocationScienceData {
  const absLat = Math.abs(lat);

  // 1. Water & Subsurface Ice Determination
  // Grounded in Mars Odyssey Gamma Ray Spectrometer (GRS) and MRO SHARAD radar:
  // - Polar Regions (>60°): Vast water-ice and dry-ice caps right at surface (0 - 0.2m depth)
  // - Mid-Latitudes (40° - 60°): Widespread subsurface glaciers protected by 0.5 - 2m of rocky dust
  // - Low Latitudes (<40°): Arid surface; hydrated sulfate/clay minerals at depth, deep aquifers at kilometers depth
  let presenceType: MarsLocationScienceData['water']['presenceType'];
  let depthMeters = 0;
  let depthDisplay = '';
  let abundancePercentage = 0;
  let abundanceDisplay = '';
  let probabilityChance = 0;
  let probabilityRating: MarsLocationScienceData['water']['probabilityRating'];
  let waterSummary = '';
  let waterNotes = '';

  if (absLat >= 75) {
    // Polar ice caps (Planum Boreum / Planum Australe)
    presenceType = 'Exposed Surface Ice';
    depthMeters = 0.0;
    depthDisplay = '0.0 m (Directly exposed on surface)';
    abundancePercentage = 88;
    abundanceDisplay = '85% – 95% Pure Water & CO2 Ice';
    probabilityChance = 99;
    probabilityRating = 'Confirmed (95-99%)';
    waterSummary = 'Directly exposed surface ice sheets. In summer, seasonal CO2 sublimes, revealing massive perennial water-ice deposits.';
    waterNotes = 'Polar perennial ice caps (Planum Boreum & Australe) contain ~2-3 million km³ of water and dry ice.';
  } else if (absLat >= 50) {
    // High-latitude permafrost & glaciated scarps (Arcadia, Utopia Planitia)
    presenceType = 'Shallow Subsurface Ice (<1m)';
    depthMeters = 0.35 + (60 - absLat) * 0.02;
    depthDisplay = `${(depthMeters * 100).toFixed(0)} cm – 1.2 m below surface`;
    abundancePercentage = 65;
    abundanceDisplay = '50% – 70% Water-Equivalent Hydrogen';
    probabilityChance = 92;
    probabilityRating = 'Very High (80-94%)';
    waterSummary = 'Vast sheet of subterranean ice shielded under 30 cm to 1 m of protective regolith (excavated in-situ by NASA Phoenix).';
    waterNotes = 'Confirmed by Phoenix Lander trench scraping & fresh impact craters observed by MRO HiRISE.';
  } else if (absLat >= 35) {
    // Mid-latitudes: Lobate Debris Aprons & Fretted Terrain (Deuteronilus Mensae, Protonilus)
    presenceType = 'Glacial Sheet Debris-Covered (1-10m)';
    depthMeters = 1.5 + (50 - absLat) * 0.15;
    depthDisplay = `${depthMeters.toFixed(1)} m – 4.5 m below surface`;
    abundancePercentage = 45;
    abundanceDisplay = '35% – 60% Core Glacial Ice';
    probabilityChance = 78;
    probabilityRating = 'Moderate (50-79%)';
    waterSummary = 'Subsurface fossil glaciers insulated under 1.5 to 4 meters of rocky debris apron (detected by MRO SHARAD radar).';
    waterNotes = 'SHARAD orbital radar soundings confirm pure water-ice glaciers under insulating rocky lag deposits.';
  } else {
    // Equatorial & Tropical regions (<35° latitude)
    const isAncientRiverBed = (lat > 15 && lat < 22 && lng > 70 && lng < 85) || // Jezero
                              (lat > -10 && lat < 0 && lng > 130 && lng < 145); // Gale
    if (isAncientRiverBed) {
      presenceType = 'Deep Hydrated Clay/Salts';
      depthMeters = 0.05;
      depthDisplay = 'Hydrated minerals at surface; deep liquid aquifer >3.0 km';
      abundancePercentage = 3.5;
      abundanceDisplay = '2% – 4% Chemically Bound Molecular H₂O';
      probabilityChance = 45;
      probabilityRating = 'Moderate (50-79%)';
      waterSummary = 'Ancient lakebed minerals (smectite clays and sulfates) retain 2% to 4% bound water extractable via thermal baking.';
      waterNotes = 'Curiosity & Perseverance confirmed smectite clays and magnesium sulfates with bound water molecules.';
    } else {
      presenceType = 'Hyper-Arid Dry Regolith';
      depthMeters = 3500;
      depthDisplay = 'Hyper-arid surface; subterranean aquifers 3.5 – 5.0 km deep';
      abundancePercentage = 1.2;
      abundanceDisplay = '1% – 2% Trace Mineral Bound';
      probabilityChance = 15;
      probabilityRating = 'Extremely Low (<20%)';
      waterSummary = 'Hyper-arid surface regolith with minimal moisture. Deep crustal aquifers may exist below the cryosphere.';
      waterNotes = 'Desiccated basaltic sands and dust. Possible deep basaltic aquifers below cryosphere depth.';
    }
  }

  // 2. Atmospheric Gas Composition & Pressure
  const basePressure = 6.1; // mbar at 0m datum
  const scaleHeightM = 11100;
  const surfacePressureMbar = Number((basePressure * Math.exp(-elevationM / scaleHeightM)).toFixed(2));

  const isGaleArea = absLat < 10 && lng > 130 && lng < 145;
  const traceMethanePpb = isGaleArea ? 1.85 : 0.42;
  const waterVaporPpm = absLat > 60 ? 45 : 180 + Math.sin((lng * Math.PI) / 180) * 40;

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

  // 3. Human Safety
  const radiationDose = 240 + Math.round(Math.random() * 50); // ~240-290 µSv/day
  const tempMin = absLat > 70 ? -125 : -95;
  const tempMax = absLat < 20 ? 18 : -15;

  // 4. Vehicle Safety
  let trafficability: MarsLocationScienceData['vehicleSafety']['trafficabilityRating'] = 'Good';
  let wheelSlip: MarsLocationScienceData['vehicleSafety']['wheelSlipRisk'] = 'Low';
  const slopeDeg = Math.min(32, Math.abs(Math.sin(lat * 0.1) * 8 + Math.cos(lng * 0.1) * 6));
  let vehicleSummary = '';

  if (elevationM > 10000 || slopeDeg > 22) {
    trafficability = 'Extreme (Cliff/Caldera)';
    wheelSlip = 'Severe (Wheel Entrapment Danger)';
    vehicleSummary = 'Extreme topographic slope with loose basalt talus. Severe rollover and catastrophic wheel entrapment risk.';
  } else if (absLat < 25 && elevationM < -2000) {
    trafficability = 'Moderate (Sand Dunes)';
    wheelSlip = 'Moderate';
    vehicleSummary = 'Active aeolian ripple fields and soft sand dunes. Significant wheel sinkage risk (analogous to Spirit rover at Troy).';
  } else {
    trafficability = 'Good';
    wheelSlip = 'Low';
    vehicleSummary = 'Firm basaltic bedrock and planar regolith pavement. Optimal traversability for 6-wheeled rovers like Curiosity/Perseverance.';
  }

  // 5. Precipitation / Rain Possibility
  const rainExplanation = `Atmospheric surface pressure is approximately ${surfacePressureMbar} mbar, which sits at or below the thermodynamic triple point of pure water (6.11 mbar). Consequently, liquid raindrops cannot exist in a stable state. Any hypothetical liquid droplet spontaneously vaporizes or freezes instantaneously before descending to the surface.`;
  
  let snowType: MarsLocationScienceData['precipitation']['snowType'] = 'None (Arid Atmospheric Column)';
  let snowChance = '0% (No precipitation)';
  let frostOccurrence = 'Diurnal micro-frost condensation observed at pre-dawn twilight.';
  let rainSummary = '';

  if (absLat >= 65) {
    snowType = 'CO2 Dry Ice Snow in Polar Winter';
    snowChance = '60% winter probability of microscopic CO2 dry-ice snowfall';
    frostOccurrence = 'Perennial CO2 and H2O frost layer accumulation.';
    rainSummary = 'Liquid rain is 0% impossible. However, polar winter clouds precipitate microscopic carbon dioxide dry-ice snow crystals.';
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
      summary: `Atmosphere is 95.32% Carbon Dioxide and unbreathable. Surface pressure is only ~${surfacePressureMbar} mbar (below the Armstrong Limit), meaning unprotected human bodily fluids would boil at body temperature (ebullism).`,
    },
    humanSafety: {
      isSafeWithoutSuit: false,
      suitRequirement: 'Class-IV Pressurized EVA Space Suit Mandatory',
      safetyRating: 'Lethal Unpressurized Environment',
      radiationDoseMicroSvDay: radiationDose,
      radiationDisplay: `${radiationDose} µSv/day (~250x higher than Earth surface)`,
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
      terrainType: elevationM > 2000 ? 'Highland Volcanic Basalt' : 'Planar Basaltic Dust & Sedimentary Crust',
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
