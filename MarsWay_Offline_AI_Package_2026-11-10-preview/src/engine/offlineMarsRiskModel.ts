import { OFFLINE_DUST_RISK_MODEL } from '../data/offlineDustRiskModel';

export type DustHazardBand = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

export interface OfflineMarsSensorSnapshot {
  /** Surface dust optical depth (tau), when the rover has a calibrated dust sensor. */
  dustOpticalDepthTau?: number;
  /** Surface visibility in kilometres, when directly measured. */
  visibilityKm?: number;
  /** Surface wind speed in metres per second, when directly measured. */
  windSpeedMps?: number;
  /** Locally measured terrain slope in degrees. */
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

const { latitudeBins, longitudeBins, solarLongitudeBins } = OFFLINE_DUST_RISK_MODEL.dimensions;
const { latitudeDegrees, longitudeDegrees, solarLongitudeDegrees } = OFFLINE_DUST_RISK_MODEL.resolution;
const table = OFFLINE_DUST_RISK_MODEL.climatologicalPrior;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getCellIndex(latitudeIndex: number, longitudeIndex: number, solarLongitudeIndex: number): number {
  const latIndex = clamp(latitudeIndex, 0, latitudeBins - 1);
  const lonIndex = ((longitudeIndex % longitudeBins) + longitudeBins) % longitudeBins;
  const lsIndex = ((solarLongitudeIndex % solarLongitudeBins) + solarLongitudeBins) % solarLongitudeBins;
  return (lsIndex * latitudeBins + latIndex) * longitudeBins + lonIndex;
}

/** Historical event frequency around a point, from the bundled MARCI training table. */
export function getMarsDustClimatologyProbability(latitude: number, longitude: number, solarLongitudeLs: number): number {
  const latIndex = Math.floor((clamp(latitude, -90, 89.999) + 90) / latitudeDegrees);
  const lonIndex = Math.floor((((longitude + 180) % 360 + 360) % 360) / longitudeDegrees);
  const lsIndex = Math.floor(((solarLongitudeLs % 360) + 360) % 360 / solarLongitudeDegrees);
  return table[getCellIndex(latIndex, lonIndex, lsIndex)] ?? OFFLINE_DUST_RISK_MODEL.globalOccurrenceRate;
}

/**
 * Offline dust-risk estimate. A fresh local sensor observation takes precedence over
 * climatology; the historical prior only supplies context when sensors are absent.
 * This estimates dust hazard, not suit-certified EVA safety.
 */
export function estimateOfflineMarsRisk(input: OfflineMarsRiskInput): OfflineMarsRiskEstimate {
  const climatologyProbability = getMarsDustClimatologyProbability(
    input.latitude,
    input.longitude,
    input.solarLongitudeLs,
  );

  let sensorContribution: OfflineMarsRiskEstimate['sensorContribution'] = 'none';
  let sensorProbability = 0;
  if (Number.isFinite(input.dustOpticalDepthTau)) {
    const tau = Math.max(0, input.dustOpticalDepthTau as number);
    sensorProbability = clamp((tau - 0.35) / 2.2, 0, 1);
    sensorContribution = 'dust_optical_depth';
  } else if (Number.isFinite(input.visibilityKm)) {
    const visibility = Math.max(0.1, input.visibilityKm as number);
    sensorProbability = clamp((30 - visibility) / 28, 0, 1);
    sensorContribution = 'visibility';
  }

  const riskProbability = Number(clamp(
    sensorContribution === 'none'
      ? climatologyProbability
      : Math.max(sensorProbability, climatologyProbability * 0.35),
    0,
    1,
  ).toFixed(3));
  const hazardBand: DustHazardBand = riskProbability >= 0.8
    ? 'SEVERE'
    : riskProbability >= 0.55
      ? 'HIGH'
      : riskProbability >= 0.3
        ? 'MODERATE'
        : 'LOW';
  const slopePenalty = Number.isFinite(input.slopeDeg)
    ? clamp((Math.max(0, input.slopeDeg as number) - 8) / 18, 0, 1) * 0.35
    : 0;

  return {
    hazardBand,
    riskProbability,
    climatologyProbability: Number(climatologyProbability.toFixed(3)),
    sensorContribution,
    routePenalty: Number(clamp(riskProbability * 0.65 + slopePenalty, 0, 1).toFixed(3)),
    modelId: OFFLINE_DUST_RISK_MODEL.modelId,
    provenance: OFFLINE_DUST_RISK_MODEL.observationSource,
  };
}
