import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = path.join(projectRoot, 'data', 'mdssd.txt');
const outputPath = path.join(projectRoot, 'src', 'data', 'offlineDustRiskModel.ts');

const LAT_STEP = 5;
const LON_STEP = 10;
const LS_STEP = 15;
const LAT_BINS = 36;
const LON_BINS = 36;
const LS_BINS = 24;
const MARS_RADIUS_KM = 3389.5;
const MIN_CONFIDENCE = 2;
const SMOOTHING = 3;

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function indexForPosition(lat, lon, ls) {
  const normalizedLon = ((lon + 180) % 360 + 360) % 360;
  const normalizedLs = ((ls % 360) + 360) % 360;
  const latIndex = clamp(Math.floor((lat + 90) / LAT_STEP), 0, LAT_BINS - 1);
  const lonIndex = clamp(Math.floor(normalizedLon / LON_STEP), 0, LON_BINS - 1);
  const lsIndex = clamp(Math.floor(normalizedLs / LS_STEP), 0, LS_BINS - 1);
  return (lsIndex * LAT_BINS + latIndex) * LON_BINS + lonIndex;
}

function centerForCell(latIndex, lonIndex) {
  return {
    lat: -90 + (latIndex + 0.5) * LAT_STEP,
    lon: -180 + (lonIndex + 0.5) * LON_STEP,
  };
}

function distanceKm(aLat, aLon, bLat, bLon) {
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * MARS_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

function parseRecords(text) {
  const days = new Map();
  let discardedLowConfidence = 0;
  for (const line of text.split(/\r?\n/).slice(1)) {
    const fields = line.trim().split(/\s+/);
    if (fields.length < 9) continue;
    const [mapDay, yearText, lsText, stormId, , lonText, latText, areaText, confidenceText] = fields;
    const record = {
      mapDay,
      year: Number(yearText),
      ls: Number(lsText),
      stormId,
      lon: Number(lonText),
      lat: Number(latText),
      areaKm2: Number(areaText),
      confidence: Number(confidenceText),
    };
    if (!Number.isFinite(record.year + record.ls + record.lon + record.lat + record.areaKm2 + record.confidence)) continue;
    if (record.confidence < MIN_CONFIDENCE) {
      discardedLowConfidence += 1;
      continue;
    }
    const key = `${record.year}:${record.mapDay}`;
    if (!days.has(key)) days.set(key, { year: record.year, ls: record.ls, mapDay: record.mapDay, storms: [] });
    days.get(key).storms.push(record);
  }
  return { days: [...days.values()], discardedLowConfidence };
}

function makeCounts(days) {
  const positive = new Uint32Array(LS_BINS * LAT_BINS * LON_BINS);
  const observed = new Uint32Array(positive.length);
  for (const day of days) {
    for (let latIndex = 0; latIndex < LAT_BINS; latIndex += 1) {
      for (let lonIndex = 0; lonIndex < LON_BINS; lonIndex += 1) {
        const { lat, lon } = centerForCell(latIndex, lonIndex);
        const index = indexForPosition(lat, lon, day.ls);
        observed[index] += 1;
        const stormPresent = day.storms.some((storm) => {
          const stormRadius = Math.max(20, Math.sqrt(storm.areaKm2 / Math.PI));
          return distanceKm(lat, lon, storm.lat, storm.lon) <= stormRadius;
        });
        if (stormPresent) positive[index] += 1;
      }
    }
  }
  return { positive, observed };
}

function learnTable(days) {
  const { positive, observed } = makeCounts(days);
  const totalPositive = positive.reduce((sum, n) => sum + n, 0);
  const totalObserved = observed.reduce((sum, n) => sum + n, 0);
  const globalRate = totalObserved ? totalPositive / totalObserved : 0;
  const probabilities = Array.from(positive, (n, i) => {
    const denominator = observed[i] + SMOOTHING;
    return Number(((n + SMOOTHING * globalRate) / denominator).toFixed(5));
  });
  return {
    probabilities,
    counts: { positive: totalPositive, observed: totalObserved },
    globalRate: Number(globalRate.toFixed(6)),
  };
}

function validate(days, probabilities) {
  const { positive, observed } = makeCounts(days);
  let brierTotal = 0;
  let n = 0;
  const decisions = [0.05, 0.1, 0.2].map((threshold) => ({ threshold, tp: 0, fp: 0, fn: 0 }));
  for (let i = 0; i < observed.length; i += 1) {
    if (!observed[i]) continue;
    const y = positive[i] > 0 ? 1 : 0;
    const p = probabilities[i];
    brierTotal += (p - y) ** 2;
    for (const result of decisions) {
      const prediction = p >= result.threshold;
      if (prediction && y) result.tp += 1;
      else if (prediction) result.fp += 1;
      else if (y) result.fn += 1;
    }
    n += 1;
  }
  return {
    observedCells: n,
    positiveCells: positive.reduce((sum, value) => sum + (value > 0 ? 1 : 0), 0),
    brierScore: n ? Number((brierTotal / n).toFixed(5)) : null,
    thresholdMetrics: decisions.map(({ threshold, tp, fp, fn }) => ({
      threshold,
      precision: tp + fp ? Number((tp / (tp + fp)).toFixed(4)) : 0,
      recall: tp + fn ? Number((tp / (tp + fn)).toFixed(4)) : 0,
    })),
  };
}

const text = await readFile(inputPath, 'utf8');
const { days, discardedLowConfidence } = parseRecords(text);
if (days.length < 10) throw new Error(`Expected at least 10 labeled map-days; found ${days.length}.`);

const years = [...new Set(days.map((day) => day.year))].sort((a, b) => a - b);
const holdoutYear = years.at(-1);
const trainingDays = days.filter((day) => day.year !== holdoutYear);
const validationDays = days.filter((day) => day.year === holdoutYear);
const trained = learnTable(trainingDays);
const validation = validate(validationDays, trained.probabilities);
const allData = learnTable(days);

const model = {
  modelId: 'mars-dust-climatology-v1',
  modelType: 'smoothed spatiotemporal frequency table',
  trainingDataset: 'Mars Dust Storm Sequence Dataset (MDSSD), Version 6',
  observationSource: 'MRO MARCI Mars Daily Global Maps archived by NASA PDS; labels curated by Saidel et al. (2024 release).',
  datasetCoverage: 'Selected Mars years 28–34; this is historical climatology, not a live storm feed.',
  trainingYears: years.filter((year) => year !== holdoutYear),
  validationYear: holdoutYear,
  minConfidence: MIN_CONFIDENCE,
  discardedLowConfidenceRecords: discardedLowConfidence,
  resolution: { latitudeDegrees: LAT_STEP, longitudeDegrees: LON_STEP, solarLongitudeDegrees: LS_STEP },
  dimensions: { latitudeBins: LAT_BINS, longitudeBins: LON_BINS, solarLongitudeBins: LS_BINS },
  smoothing: SMOOTHING,
  validation,
  sampleCounts: { trainingMapDays: trainingDays.length, validationMapDays: validationDays.length, allMapDays: days.length },
  climatologicalPrior: allData.probabilities,
  globalOccurrenceRate: allData.globalRate,
};

const generated = `// Generated by scripts/train_offline_dust_risk.mjs from data/mdssd.txt.\n// Do not edit by hand; rerun the trainer to refresh the learned risk table.\nexport const OFFLINE_DUST_RISK_MODEL = ${JSON.stringify(model)} as const;\n`;
await writeFile(outputPath, generated, 'utf8');
console.log(JSON.stringify({ outputPath, modelId: model.modelId, sampleCounts: model.sampleCounts, validation: model.validation, globalOccurrenceRate: model.globalOccurrenceRate }, null, 2));
