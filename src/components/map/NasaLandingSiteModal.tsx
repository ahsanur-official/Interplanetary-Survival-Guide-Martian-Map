import React from 'react';
import {
  X,
  Compass,
  Navigation,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  MapPin,
  Calendar,
  Sparkles,
  Mountain,
  Gauge,
  Activity,
  Copy,
  Check,
  Footprints,
  Rocket,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { MarsMission } from '../../data/marsMissions';
import { getMolaElevation, getMarsPressureMbar } from '../../engine/marsMolaElevation';

export interface NasaLandingSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: MarsMission | null;
  onFlyToLocation: (lat: number, lng: number, zoom?: number, name?: string) => void;
  onExploreTraverse?: (mission: MarsMission) => void;
  onMeasureElevationProfile?: (mission: MarsMission) => void;
}

// Rich scientific context on NASA landing site selection rationale
const NASA_LANDING_SITE_DOSSIER: Record<
  string,
  {
    officialSiteDesignation: string;
    siteRationale: string;
    targetEllipseKm: string;
    instruments: { name: string; desc: string }[];
    highlightQuote?: string;
  }
> = {
  perseverance: {
    officialSiteDesignation: 'Octavia E. Butler Landing (Jezero Crater floor)',
    siteRationale:
      'Ancient river-fed paleolake basin (~3.7 billion years ago) with a preserved fan delta. The delta mudstones and clay minerals provide maximum preservation potential for biosignatures and organic carbon molecules, ideal for sample caching.',
    targetEllipseKm: '7.7 × 6.6 km (guided by Terrain-Relative Navigation)',
    instruments: [
      { name: 'Mastcam-Z', desc: 'Stereoscopic panoramic multispectral camera system.' },
      { name: 'SuperCam', desc: 'Laser-induced breakdown spectroscopy & Raman spectrometer.' },
      { name: 'PIXL', desc: 'X-ray fluorescence spectrometer for fine-scale chemical mapping.' },
      { name: 'SHERLOC', desc: 'UV Raman & luminescence spectrometer for organic molecules.' },
      { name: 'MOXIE', desc: 'In-situ resource utilization generating O2 from CO2.' },
      { name: 'RIMFAX', desc: 'Ground-penetrating radar imaging subsurface strata up to 10m.' },
      { name: 'MEDA', desc: 'Environmental & meteorological atmospheric sensor suite.' },
      { name: 'Ingenuity', desc: 'First extraterrestrial rotorcraft technology demonstration (72 flights).' },
    ],
    highlightQuote:
      '"We chose Jezero because the crater walls preserved a prominent lake delta where ancient microbial life, if it ever existed on Mars, would have been fossilized in fine-grained muds."',
  },
  curiosity: {
    officialSiteDesignation: 'Bradbury Landing (Gale Crater floor)',
    siteRationale:
      'Gale Crater hosts Mount Sharp (Aeolis Mons), a 5.5 km high layered mountain composed of sedimentary strata recording Mars transition from a wet, warm planet (clays) to an arid, cold desert (sulfates and hematite).',
    targetEllipseKm: '20 × 7 km (guided lifting-body atmospheric entry with Sky Crane)',
    instruments: [
      { name: 'Mastcam', desc: 'True-color high-resolution stereoscopic imaging mast.' },
      { name: 'ChemCam', desc: 'Laser-induced breakdown spectrometer with telescopic micro-imager.' },
      { name: 'SAM', desc: 'Sample Analysis at Mars: gas chromatograph, mass spectrometer, tunable laser.' },
      { name: 'CheMin', desc: 'X-ray diffraction and fluorescence for mineralogy determination.' },
      { name: 'APXS', desc: 'Alpha Particle X-Ray Spectrometer for elemental composition.' },
      { name: 'MAHLI', desc: 'Microscopic handheld imager on robotic arm turret.' },
      { name: 'RAD', desc: 'Radiation Assessment Detector for astronaut cruise & surface risk.' },
      { name: 'REMS', desc: 'Rover Environmental Monitoring Station (weather, UV, humidity).' },
    ],
    highlightQuote:
      '"Gale Crater was chosen because it was an ancient lake that could have supported microbial life, with a multi-layered mountain that acts as a billion-year stratigraphic geological book."',
  },
  viking1: {
    officialSiteDesignation: 'Thomas Mutch Memorial Station (Chryse Planitia)',
    siteRationale:
      'Low-elevation (-3.7 km) volcanic and flood channel basin (Chryse "Golden Plains") where catastrophic outflow channels like Ares, Tiu, and Simud emptied. Low altitude provided maximum atmospheric density for parachute braking.',
    targetEllipseKm: '100 × 50 km (uncontrolled atmospheric entry)',
    instruments: [
      { name: 'Surface Cameras', desc: 'Dual facsimile scanning cameras producing first color Mars panoramas.' },
      { name: 'Biology Package', desc: 'Gas Exchange, Labeled Release, and Pyrolytic Release life tests.' },
      { name: 'GCMS', desc: 'Gas Chromatograph-Mass Spectrometer for organic chemical detection.' },
      { name: 'Meteorology Boom', desc: 'Pressure, temperature, and wind speed/direction sensors.' },
      { name: 'Seismometer', desc: 'Surface ground motion detector (failed to unclamp on Lander 1).' },
      { name: 'Magnetic Collector', desc: 'Magnets on sampling arm to detect iron minerals in soil.' },
    ],
    highlightQuote:
      '"July 20, 1976: Viking 1 became humanity’s first successful spacecraft to land on Mars and operate long-term, sending back the iconic first color views of a red desert under pinkish skies."',
  },
  viking2: {
    officialSiteDesignation: 'Gerald Soffen Memorial Station (Utopia Planitia)',
    siteRationale:
      'Northern lowlands high plains (48°N) selected to investigate a cooler, higher-latitude Martian environment with higher atmospheric water vapor content and potential winter ice frost.',
    targetEllipseKm: '100 × 50 km (uncontrolled entry)',
    instruments: [
      { name: 'Surface Cameras', desc: 'Dual facsimile scanning cameras capturing Utopia boulder fields.' },
      { name: 'Biology Package', desc: 'Automated metabolic experiment chambers with nutrient broth.' },
      { name: 'GCMS', desc: 'Atmosphere and soil volatile analysis.' },
      { name: 'Seismometer', desc: 'Recorded one genuine marsquake on its deck.' },
      { name: 'X-Ray Fluorescence', desc: 'Analyzed elemental inorganic composition of soils.' },
    ],
    highlightQuote:
      '"Viking 2 confirmed that Mars was chemically reactive and observed seasonal water-ice frost coating the Utopia boulders during Martian winter."',
  },
  opportunity: {
    officialSiteDesignation: 'Challenger Memorial Station / Eagle Crater (Meridiani Planum)',
    siteRationale:
      'Orbital spectrometer data from Mars Global Surveyor discovered massive regional exposures of coarse-grained crystalline gray hematite, a mineral that on Earth almost always forms in liquid water.',
    targetEllipseKm: '80 × 12 km (airbag cushioned impact landing)',
    instruments: [
      { name: 'Pancam', desc: 'High-resolution multispectral panoramic imaging camera.' },
      { name: 'Microscopic Imager', desc: 'High-resolution close-up camera for rock textures.' },
      { name: 'Mini-TES', desc: 'Miniature Thermal Emission Spectrometer for mineralogy.' },
      { name: 'Mössbauer Spectrometer', desc: 'Iron mineralogy and oxidation state analyzer.' },
      { name: 'APXS', desc: 'Alpha Particle X-Ray Spectrometer.' },
      { name: 'RAT', desc: 'Rock Abrasion Tool grinding fresh rock interiors.' },
    ],
    highlightQuote:
      '"Opportunity achieved a literal interplanetary hole-in-one, rolling to a stop inside the 22m Eagle Crater, where exposed bedrock immediately proved past acidic groundwater on Mars."',
  },
  spirit: {
    officialSiteDesignation: 'Columbia Memorial Station (Gusev Crater)',
    siteRationale:
      'Giant 160 km wide impact basin breached by Ma\'adim Vallis, a 900 km long dried outflow gorge, suggesting Gusev was once an ancient crater lake.',
    targetEllipseKm: '80 × 12 km (airbag cushioned impact landing)',
    instruments: [
      { name: 'Pancam', desc: 'Multispectral panoramic stereo imaging cameras.' },
      { name: 'Mini-TES', desc: 'Thermal emission spectrometer for mineral identifying.' },
      { name: 'Microscopic Imager', desc: 'Extreme macro geological lens.' },
      { name: 'Mössbauer & APXS', desc: 'Dual nuclear spectrometer suite for rock chemistry.' },
      { name: 'RAT', desc: 'Rock Abrasion Tool.' },
    ],
    highlightQuote:
      '"While Gusev floor was covered by volcanic basalt, Spirit climbed the Columbia Hills and discovered pure silica deposits from ancient hot springs."',
  },
  pathfinder: {
    officialSiteDesignation: 'Carl Sagan Memorial Station (Ares Vallis)',
    siteRationale:
      'Catastrophic outflow plain where mega-floods from southern highlands drained into northern lowlands, depositing rocks from hundreds of miles away in a single grab-bag gravel deposit.',
    targetEllipseKm: '200 × 100 km (airbag bounce landing)',
    instruments: [
      { name: 'IMP Camera', desc: 'Imager for Mars Pathfinder with color filters and windsocks.' },
      { name: 'Sojourner Rover', desc: 'First planetary micro-rover (10.6 kg, 6-wheeled rocker-bogie).' },
      { name: 'APXS', desc: 'Alpha Proton X-Ray Spectrometer mounted on Sojourner arm.' },
      { name: 'ASI/MET', desc: 'Atmospheric Structure and Meteorology sensor mast.' },
    ],
    highlightQuote:
      '"July 4, 1997: Mars Pathfinder proved airbag touchdowns and released Sojourner, demonstrating that planetary mobility was feasible on Mars."',
  },
  phoenix: {
    officialSiteDesignation: 'Green Valley (Vastitas Borealis Arctic Plains)',
    siteRationale:
      'High northern arctic latitude (68°N) where orbital Mars Odyssey neutron spectrometers detected vast quantities of shallow subsurface hydrogen/water-ice.',
    targetEllipseKm: '86 × 25 km (pulsed hydrazine rocket thruster soft touchdown)',
    instruments: [
      { name: 'Robotic Arm', desc: '2.35m arm with backhoe scoop and rasp drill.' },
      { name: 'TEGA', desc: 'Thermal and Evolved-Gas Analyzer baking soil to 1,000°C.' },
      { name: 'MECA', desc: 'Microscopy, Electrochemistry, and Conductivity Analyzer.' },
      { name: 'SSI / RAC', desc: 'Surface Stereo Imager and Robotic Arm Camera.' },
      { name: 'MET', desc: 'Canadian Space Agency meteorological LiDAR station.' },
    ],
    highlightQuote:
      '"Phoenix scraped away soil in the arctic plains and exposed pure white water-ice that sublimated over days, providing the first ground truth proof of Martian ice."',
  },
  insight: {
    officialSiteDesignation: 'InSight Touchdown Site (Elysium Planitia)',
    siteRationale:
      'Extremely flat, smooth, rock-free volcanic basalt plain at low elevation (-2.6 km) to ensure safe landing and deep ground contact for sensitive seismic probes.',
    targetEllipseKm: '130 × 27 km (pulsed thruster soft landing)',
    instruments: [
      { name: 'SEIS', desc: 'Ultra-sensitive French CNES seismometer with vacuum sphere.' },
      { name: 'HP3', desc: 'German DLR "Mole" heat flow and physical properties probe.' },
      { name: 'RISE', desc: 'Rotation and Interior Structure Experiment using radio Doppler.' },
      { name: 'APSS', desc: 'Auxiliary Payload Sensor Suite measuring atmospheric waves.' },
      { name: 'IDC / ICC', desc: 'Instrument Deployment and Instrument Context Cameras.' },
    ],
    highlightQuote:
      '"InSight listened to the heartbeat of Mars, detecting over 1,300 marsquakes and measuring Mars’ liquid iron core and crustal layering."',
  },
};

export const NasaLandingSiteModal: React.FC<NasaLandingSiteModalProps> = ({
  isOpen,
  onClose,
  mission,
  onFlyToLocation,
  onExploreTraverse,
  onMeasureElevationProfile,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !mission) return null;

  const lat = mission.lat ?? 0;
  const lng = mission.lng ?? 0;
  const elevation = mission.elevationM ?? getMolaElevation(lat, lng);
  const pressure = getMarsPressureMbar(elevation);

  const dossier = NASA_LANDING_SITE_DOSSIER[mission.id] || {
    officialSiteDesignation: mission.landingSiteName || `${mission.name} Landing Site`,
    siteRationale:
      'Selected based on planetary habitability, safety constraints, atmospheric density, and high-priority geological objectives.',
    targetEllipseKm: 'Entry-Descent-Landing Error Ellipse',
    instruments: mission.objectives.map((obj, i) => ({ name: `Objective ${i + 1}`, desc: obj })),
  };

  const handleCopyCoords = async () => {
    const text = `${mission.name} Landing Site: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (Elev: ${elevation}m)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const isRover = mission.type === 'rover';
  const hasTraverse = mission.traverseTrack && mission.traverseTrack.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#090d16]/98 border border-orange-500/50 rounded-3xl shadow-2xl shadow-orange-950/50 text-neutral-100 overflow-hidden flex flex-col max-h-[92vh] font-sans">
        {/* Header Ribbon */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-neutral-950 via-orange-950/40 to-neutral-950 border-b border-white/10 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-red-600 p-0.5 shadow-lg shadow-blue-950/80 ring-1 ring-white/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#070b14] flex items-center justify-center">
                {isRover ? (
                  <Rocket className="w-6 h-6 text-orange-400" />
                ) : (
                  <Radio className="w-6 h-6 text-sky-400" />
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-500/40 uppercase tracking-wider">
                  NASA Mars Exploration Program
                </span>
                <span
                  className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    mission.status === 'active'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 animate-pulse'
                      : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {mission.statusDisplay}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white mt-1 tracking-tight">
                {mission.name}
              </h2>
              <div className="text-xs text-orange-300/90 font-medium flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>{dossier.officialSiteDesignation}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 no-scrollbar text-xs">
          {/* Geodetic Coordinates & Telemetry Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
            <div className="p-2.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-[9px] uppercase tracking-wider text-neutral-400">Coordinates</div>
              <div className="text-xs font-bold text-white mt-0.5">
                {lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`},{' '}
                {lng >= 0 ? `${lng.toFixed(2)}°E` : `${Math.abs(lng).toFixed(2)}°W`}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-[9px] uppercase tracking-wider text-neutral-400">MOLA Elevation</div>
              <div className="text-xs font-bold text-cyan-300 mt-0.5">
                {elevation > 0 ? `+${elevation.toLocaleString()}m` : `${elevation.toLocaleString()}m`}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-[9px] uppercase tracking-wider text-neutral-400">Surface Pressure</div>
              <div className="text-xs font-bold text-sky-300 mt-0.5">{pressure} mbar</div>
            </div>

            <div className="p-2.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-[9px] uppercase tracking-wider text-neutral-400">Landing Date</div>
              <div className="text-xs font-bold text-amber-300 mt-0.5">{mission.arrivalDate}</div>
            </div>
          </div>

          {/* Highlight Quote if available */}
          {dossier.highlightQuote && (
            <div className="p-3 rounded-2xl bg-orange-950/30 border border-orange-500/30 text-neutral-300 italic text-[11px] leading-relaxed">
              {dossier.highlightQuote}
            </div>
          )}

          {/* Scientific Landing Site Selection Rationale */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-orange-400 text-xs">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>NASA Landing Site Selection Rationale</span>
            </div>
            <p className="text-neutral-300 leading-relaxed text-xs">{dossier.siteRationale}</p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono">
              <span className="font-semibold text-neutral-300">Target EDL Ellipse:</span>
              <span>{dossier.targetEllipseKm}</span>
            </div>
          </div>

          {/* Key Discoveries */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-xs">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Key Scientific Discoveries at this Site</span>
            </div>
            <ul className="space-y-1.5 pl-1">
              {mission.keyDiscoveries.map((discovery, i) => (
                <li key={i} className="flex items-start gap-2 text-neutral-300 text-xs leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{discovery}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Scientific Instruments Payload */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-neutral-200 text-xs">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Science Payloads & Instruments</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dossier.instruments.map((inst, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/80 flex flex-col gap-0.5"
                >
                  <div className="font-mono font-bold text-white text-xs text-orange-300">{inst.name}</div>
                  <div className="text-[11px] text-neutral-400 leading-tight">{inst.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rover Traverse Track Information (if applicable) */}
          {hasTraverse && (
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                  <Footprints className="w-4 h-4 text-cyan-400" />
                  <span>Active Surface Traverse Available</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Contains {mission.traverseTrack?.length} cataloged milestone waypoints along the driving path.
                </div>
              </div>
              {onExploreTraverse && (
                <button
                  type="button"
                  onClick={() => {
                    onExploreTraverse(mission);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-md cursor-pointer shrink-0"
                >
                  Explore Traverse
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCoords}
              className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Copy landing coordinates"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Coordinates' : 'Copy Coordinates'}</span>
            </button>

            {onMeasureElevationProfile && (
              <button
                type="button"
                onClick={() => {
                  onMeasureElevationProfile(mission);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Measure local terrain elevation gradient"
              >
                <Mountain className="w-3.5 h-3.5 text-cyan-400" />
                <span>Elevation Profile</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onFlyToLocation(lat, lng, 7, mission.name);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-orange-950/60 flex items-center gap-2 transition cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>Fly to Landing Site</span>
          </button>
        </div>
      </div>
    </div>
  );
};
