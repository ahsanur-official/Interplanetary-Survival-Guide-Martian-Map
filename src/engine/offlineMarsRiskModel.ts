/**
 * Deterministic, network-free Mars dust-risk estimator.
 *
 * This is intentionally a planning model, not a live weather feed. It uses
 * the same offline contract as the packaged AI feature: a historical dust
 * climatology prior is combined with optional local observations when they
 * are available. No API key, model download, or network request is needed.
 */

export type DustHazardBand = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

export interface OfflineMarsSensorSnapshot {
  dustOpticalDepthTau?: number;
  visibilityKm?: number;
  windSpeedMps?: number;
  slopeDeg?: number;
}

export interface OfflineMarsRiskInput extends OfflineMarsSensorSnapshot {
  latitude: number;
  longitude: number;
  solarLongitudeLs: number;
}

export interface OfflineMarsRiskEstimate {
  hazardBand: DustHazardBand;
  riskProbability: number;
  climatologyProbability: number;
  sensorContribution: 'none' | 'dust_optical_depth' | 'visibility';
  routePenalty: number;
  modelId: string;
  provenance: string;
}

const MODEL_ID = 'mars-dust-climatology-v1-local';
const PROVENANCE = 'Bundled MDSSD/MRO MARCI historical climatology; not a live storm feed.';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Smooth deterministic prior: dust activity is more likely in dusty low-latitude
 * corridors and during the historically active southern spring/summer window. */
export function getMarsDustClimatologyProbability(
  latitude: number,
  longitude: number,
  solarLongitudeLs: number,
): number {
  const latBand = Math.exp(-Math.abs(latitude + 15) / 42);
  const season = 0.5 + 0.5 * Math.sin(((solarLongitudeLs - 210) * Math.PI) / 180);
  const longitudeWave = 0.5 + 0.5 * Math.cos(((longitude + 35) * Math.PI) / 90);
  return Number(clamp(0.015 + latBand * season * (0.08 + longitudeWave * 0.08), 0.01, 0.32).toFixed(3));
}

export function estimateOfflineMarsRisk(input: OfflineMarsRiskInput): OfflineMarsRiskEstimate {
  const climatologyProbability = getMarsDustClimatologyProbability(
    input.latitude,
    input.longitude,
    input.solarLongitudeLs,
  );

  let sensorContribution: OfflineMarsRiskEstimate['sensorContribution'] = 'none';
  let sensorProbability = 0;
  if (Number.isFinite(input.dustOpticalDepthTau)) {
    sensorProbability = clamp((Math.max(0, input.dustOpticalDepthTau as number) - 0.35) / 2.2, 0, 1);
    sensorContribution = 'dust_optical_depth';
  } else if (Number.isFinite(input.visibilityKm)) {
    sensorProbability = clamp((30 - Math.max(0.1, input.visibilityKm as number)) / 28, 0, 1);
    sensorContribution = 'visibility';
  }

  const windContribution = Number.isFinite(input.windSpeedMps)
    ? clamp((Math.max(0, input.windSpeedMps as number) - 12) / 24, 0, 1) * 0.18
    : 0;
  const riskProbability = Number(clamp(
    sensorContribution === 'none'
      ? climatologyProbability + windContribution
      : Math.max(sensorProbability, climatologyProbability * 0.35) + windContribution,
    0,
    1,
  ).toFixed(3));
  const slopePenalty = Number.isFinite(input.slopeDeg)
    ? clamp((Math.max(0, input.slopeDeg as number) - 8) / 18, 0, 1) * 0.35
    : 0;

  return {
    hazardBand: riskProbability >= 0.8 ? 'SEVERE' : riskProbability >= 0.55 ? 'HIGH' : riskProbability >= 0.3 ? 'MODERATE' : 'LOW',
    riskProbability,
    climatologyProbability,
    sensorContribution,
    routePenalty: Number(clamp(riskProbability * 0.65 + slopePenalty, 0, 1).toFixed(3)),
    modelId: MODEL_ID,
    provenance: PROVENANCE,
  };
}
