export type SpaceWeatherScenario = 'quiet' | 'sep_watch' | 'major_sep';

export interface MarsSpaceWeatherState {
  scenario: SpaceWeatherScenario;
  label: string;
  alertLevel: 'NOMINAL' | 'WATCH' | 'WARNING';
  radiationDoseMicroGyPerDay: number;
  doseMultiplierVsMslRad: number;
  shelterReturnRequired: boolean;
  recommendedAction: string;
  sourceStatus: 'OBSERVED_BASELINE' | 'MODELED_SCENARIO';
  source: string;
}

const MSL_RAD_GALE_BASELINE = 635;

export function getMarsSpaceWeatherState(scenario: SpaceWeatherScenario): MarsSpaceWeatherState {
  if (scenario === 'major_sep') {
    return {
      scenario,
      label: 'Major Solar Particle Event (SEP) Scenario',
      alertLevel: 'WARNING',
      radiationDoseMicroGyPerDay: MSL_RAD_GALE_BASELINE * 5,
      doseMultiplierVsMslRad: 5,
      shelterReturnRequired: true,
      recommendedAction: 'Terminate EVA, stop exposed-surface work, and follow the calculated return-to-shelter route immediately.',
      sourceStatus: 'MODELED_SCENARIO',
      source: 'Modeled SEP stress test calibrated against MSL RAD Gale baseline',
    };
  }

  if (scenario === 'sep_watch') {
    return {
      scenario,
      label: 'Elevated Solar Particle Event Watch',
      alertLevel: 'WATCH',
      radiationDoseMicroGyPerDay: Math.round(MSL_RAD_GALE_BASELINE * 1.8),
      doseMultiplierVsMslRad: 1.8,
      shelterReturnRequired: false,
      recommendedAction: 'Pause non-essential sampling, monitor dosimeter trend, and prepare the shelter return vector.',
      sourceStatus: 'MODELED_SCENARIO',
      source: 'Modeled SEP watch calibrated against MSL RAD Gale baseline',
    };
  }

  return {
    scenario,
    label: 'Quiet Galactic Cosmic Ray Baseline',
    alertLevel: 'NOMINAL',
    radiationDoseMicroGyPerDay: MSL_RAD_GALE_BASELINE,
    doseMultiplierVsMslRad: 1,
    shelterReturnRequired: false,
    recommendedAction: 'Nominal EVA radiation protocol; continue monitoring dosimeter and solar alerts.',
    sourceStatus: 'OBSERVED_BASELINE',
    source: 'MSL RAD calibrated Gale Crater baseline (~635 microGy/day)',
  };
}
