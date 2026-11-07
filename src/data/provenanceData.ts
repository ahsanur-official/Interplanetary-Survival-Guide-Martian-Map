import { DataProvenance } from '../types/mars';

export interface DatasetCatalogItem {
  id: string;
  category: 'Topography & Terrain' | 'Surface Imagery' | 'Mineralogy & Resources' | 'Atmospheric & Climate' | 'Radiation' | 'Rover Exploration';
  datasetTitle: string;
  mission: string;
  instrument: string;
  pdsVolumeUrl: string;
  spatialCoverage: string;
  temporalCoverage: string;
  processingPipeline: string;
  status: 'OBSERVED' | 'HISTORICAL' | 'DERIVED' | 'MODELED' | 'SIMULATED';
  uncertaintyNotes: string;
}

export const NASA_DATASET_CATALOG: DatasetCatalogItem[] = [
  {
    id: 'mola-megdr',
    category: 'Topography & Terrain',
    datasetTitle: 'MGS MOLA Mission Experiment Gridded Data Record (MEGDR)',
    mission: 'Mars Global Surveyor (MGS)',
    instrument: 'MOLA (Mars Orbiter Laser Altimeter)',
    pdsVolumeUrl: 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/',
    spatialCoverage: 'Global Mars, 128 pixels/degree (~463 m at equator)',
    temporalCoverage: '1997 - 2006 (Orbital mapping campaign)',
    processingPipeline: 'Pulse round-trip time converted to planetary radii, normalized to MOLA Areoid 0 km gravity potential surface.',
    status: 'OBSERVED',
    uncertaintyNotes: 'Absolute radial accuracy ±1 meter; horizontal footprint ~150 meters. Local micro-boulders (<100m) are smoothed out.',
  },
  {
    id: 'hirise-dtm',
    category: 'Topography & Terrain',
    datasetTitle: 'MRO HiRISE Digital Terrain Models & Orthorectified Images',
    mission: 'Mars Reconnaissance Orbiter (MRO)',
    instrument: 'HiRISE (High Resolution Imaging Science Experiment)',
    pdsVolumeUrl: 'https://www.uahirise.org/dtm/dtm.php?ID=PSP_003442_1985',
    spatialCoverage: 'Targeted swathes in Jezero, Gale, and candidate landing zones (0.25 - 1.0 m/px)',
    temporalCoverage: '2006 - Present',
    processingPipeline: 'Photogrammetric stereo-pair correlation using USGS ISIS and SOCET SET software.',
    status: 'DERIVED',
    uncertaintyNotes: 'Stereo artifacts can occur in featureless dusty terrains or extreme shadows. Vertical precision ~0.2 meters.',
  },
  {
    id: 'crism-spectral',
    category: 'Mineralogy & Resources',
    datasetTitle: 'MRO CRISM Targeted Spectral Parameter Maps (TRDR/MTRDR)',
    mission: 'Mars Reconnaissance Orbiter (MRO)',
    instrument: 'CRISM (Compact Reconnaissance Imaging Spectrometer for Mars)',
    pdsVolumeUrl: 'https://pds-geosciences.wustl.edu/mro/mro-m-crism-3-rdr-targeted-v1/',
    spatialCoverage: 'Targeted tracks (~18 m/px, 0.36 - 3.92 micrometers, 544 channels)',
    temporalCoverage: '2006 - 2023',
    processingPipeline: 'Atmospheric transmission correction via volcano-scan ratioing, photometric normalization, and computation of summary band-depth parameters (e.g. BD1900, BD2200 for hydrated phyllosilicates).',
    status: 'DERIVED',
    uncertaintyNotes: 'Spectroscopy interrogates only the uppermost optical skin depth (~10-50 micrometers). Subsurface volume is inferred through geological dip.',
  },
  {
    id: 'm2020-meda',
    category: 'Atmospheric & Climate',
    datasetTitle: 'Mars 2020 MEDA Calibrated Environmental Data Records',
    mission: 'Perseverance Rover (Mars 2020)',
    instrument: 'MEDA (Mars Environmental Dynamics Analyzer)',
    pdsVolumeUrl: 'https://pds-atmospheres.nmsu.edu/data-and-services/atmospheres-data/mars/perseverance/meda.html',
    spatialCoverage: 'In-situ ground measurements across Jezero Crater traverse',
    temporalCoverage: 'Sol 1 (Feb 2021) - Sol 1200+ (Historical archive)',
    processingPipeline: 'Thermal sensor calibration, wind boom thermal trace correction, barometric pressure calibration to NIST traceable standards.',
    status: 'HISTORICAL',
    uncertaintyNotes: 'Historical ground truth. Must not be interpreted as real-time weather forecasting; diurnal averages represent climatological baseline.',
  },
  {
    id: 'msl-rad',
    category: 'Radiation',
    datasetTitle: 'MSL RAD Calibrated Dose Rate and Particle Flux Data',
    mission: 'Curiosity Rover (Mars Science Laboratory)',
    instrument: 'RAD (Radiation Assessment Detector)',
    pdsVolumeUrl: 'https://pds-ppi.igpp.ucla.edu/mission/MarsScienceLaboratory/MSL/RAD',
    spatialCoverage: 'In-situ measurement along Gale Crater traverse (-4.5 km MOLA datum)',
    temporalCoverage: 'Sol 10 (Aug 2012) - Sol 4000+',
    processingPipeline: 'Silicon detector telescope energy deposition spectra converted to tissue equivalent absorbed dose rate (uGy/day) and dose equivalent (uSv/day).',
    status: 'OBSERVED',
    uncertaintyNotes: 'Primary observation is strictly local to Gale Crater. In MARSWAY, Jezero Crater values are modeled by adjusting for atmospheric column shielding (+2 km elevation differential = ~8% reduced shielding).',
  },
  {
    id: 'm2020-pds-traverse',
    category: 'Rover Exploration',
    datasetTitle: 'Perseverance Rover Traverse & Science Target Archive',
    mission: 'Perseverance Rover (Mars 2020)',
    instrument: 'Mastcam-Z, SuperCam, PIXL, SHERLOC, RIMFAX',
    pdsVolumeUrl: 'https://pds-geosciences.wustl.edu/missions/mars2020/',
    spatialCoverage: 'Octavia E. Butler landing to Western Delta front & Margin Unit (>30 km traverse)',
    temporalCoverage: 'Sols 0 to 1250+',
    processingPipeline: 'Visual odometry + orbital tie-point bundle adjustment, instrument spectral fitting, and sample cache hermetic seal telemetry.',
    status: 'OBSERVED',
    uncertaintyNotes: 'Traverse waypoints accurate to < 0.5 meters relative to HiRISE base orthomosaics.',
  },
];
