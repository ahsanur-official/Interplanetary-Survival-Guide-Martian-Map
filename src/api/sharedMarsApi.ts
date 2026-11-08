// Shared Mars gazetteer used by both the local server and the Vercel API entrypoint.
export const CANONICAL_MARS_LOCATIONS: Record<
  string,
  { lat: number; lng: number; zoom: number; elevationM: number; name: string }
> = {
  'olympus mons': { lat: 18.65, lng: -133.8, zoom: 5, elevationM: 21229, name: 'Olympus Mons' },
  olympus: { lat: 18.65, lng: -133.8, zoom: 5, elevationM: 21229, name: 'Olympus Mons' },
  'jezero crater': { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Jezero Crater' },
  jezero: { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Jezero Crater' },
  perseverance: { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Perseverance Rover (Jezero Crater)' },
  ingenuity: { lat: 18.38, lng: 77.58, zoom: 7, elevationM: -2560, name: 'Ingenuity Helicopter (Jezero Crater)' },
  'gale crater': { lat: -4.59, lng: 137.44, zoom: 7, elevationM: -4450, name: 'Gale Crater (Mount Sharp)' },
  gale: { lat: -4.59, lng: 137.44, zoom: 7, elevationM: -4450, name: 'Gale Crater (Mount Sharp)' },
  curiosity: { lat: -4.59, lng: 137.44, zoom: 7, elevationM: -4450, name: 'Curiosity Rover (Gale Crater)' },
  'mount sharp': { lat: -5.08, lng: 137.85, zoom: 6, elevationM: 5500, name: 'Mount Sharp (Aeolis Mons)' },
  'aeolis mons': { lat: -5.08, lng: 137.85, zoom: 6, elevationM: 5500, name: 'Mount Sharp (Aeolis Mons)' },
  'valles marineris': { lat: -13.9, lng: -59.2, zoom: 5, elevationM: -7000, name: 'Valles Marineris' },
  marineris: { lat: -13.9, lng: -59.2, zoom: 5, elevationM: -7000, name: 'Valles Marineris' },
  'grand canyon': { lat: -13.9, lng: -59.2, zoom: 5, elevationM: -7000, name: 'Valles Marineris' },
  'elysium mons': { lat: 25.02, lng: 147.21, zoom: 5, elevationM: 14100, name: 'Elysium Mons' },
  elysium: { lat: 25.02, lng: 147.21, zoom: 5, elevationM: 14100, name: 'Elysium Mons' },
  'arsia mons': { lat: -8.4, lng: -121.1, zoom: 5, elevationM: 17761, name: 'Arsia Mons' },
  'pavonis mons': { lat: 0.8, lng: -113.4, zoom: 5, elevationM: 14058, name: 'Pavonis Mons' },
  'ascraeus mons': { lat: 11.9, lng: -104.5, zoom: 5, elevationM: 18225, name: 'Ascraeus Mons' },
  'hellas planitia': { lat: -42.7, lng: 70.0, zoom: 4, elevationM: -8200, name: 'Hellas Planitia' },
  hellas: { lat: -42.7, lng: 70.0, zoom: 4, elevationM: -8200, name: 'Hellas Planitia' },
  'utopia planitia': { lat: 25.066, lng: 109.925, zoom: 6, elevationM: -4000, name: 'Utopia Planitia' },
  utopia: { lat: 25.066, lng: 109.925, zoom: 6, elevationM: -4000, name: 'Utopia Planitia' },
  zhurong: { lat: 25.066, lng: 109.925, zoom: 7, elevationM: -4000, name: 'Zhurong Rover (Utopia Planitia)' },
  'meridiani planum': { lat: -1.95, lng: -5.53, zoom: 7, elevationM: -1440, name: 'Meridiani Planum' },
  meridiani: { lat: -1.95, lng: -5.53, zoom: 7, elevationM: -1440, name: 'Meridiani Planum' },
  opportunity: { lat: -1.95, lng: -5.53, zoom: 7, elevationM: -1440, name: 'Opportunity Rover (Meridiani Planum)' },
  'gusev crater': { lat: -14.57, lng: 175.47, zoom: 7, elevationM: -1930, name: 'Gusev Crater' },
  gusev: { lat: -14.57, lng: 175.47, zoom: 7, elevationM: -1930, name: 'Gusev Crater' },
  spirit: { lat: -14.57, lng: 175.47, zoom: 7, elevationM: -1930, name: 'Spirit Rover (Gusev Crater)' },
  'chryse planitia': { lat: 22.48, lng: -47.97, zoom: 6, elevationM: -3627, name: 'Chryse Planitia' },
  'viking 1': { lat: 22.48, lng: -47.97, zoom: 7, elevationM: -3627, name: 'Viking 1 Lander (Chryse Planitia)' },
  'viking 2': { lat: 48.27, lng: 134.0, zoom: 7, elevationM: -4100, name: 'Viking 2 Lander (Utopia Planitia)' },
  pathfinder: { lat: 19.33, lng: -33.55, zoom: 7, elevationM: -3650, name: 'Mars Pathfinder & Sojourner' },
  sojourner: { lat: 19.33, lng: -33.55, zoom: 7, elevationM: -3650, name: 'Mars Pathfinder & Sojourner' },
  phoenix: { lat: 68.22, lng: -125.7, zoom: 7, elevationM: -4150, name: 'Phoenix Lander (Green Valley)' },
  insight: { lat: 4.502, lng: 135.623, zoom: 7, elevationM: -2600, name: 'InSight Lander (Elysium Planitia)' },
  'arcadia planitia': { lat: 39.2, lng: -170.3, zoom: 5, elevationM: -4100, name: 'Arcadia Planitia' },
  arcadia: { lat: 39.2, lng: -170.3, zoom: 5, elevationM: -4100, name: 'Arcadia Planitia' },
  cydonia: { lat: 40.74, lng: -9.46, zoom: 6, elevationM: -1200, name: 'Cydonia Mensae (Face on Mars)' },
  'cydonia mensae': { lat: 40.74, lng: -9.46, zoom: 6, elevationM: -1200, name: 'Cydonia Mensae' },
  korolev: { lat: 73.0, lng: 165.0, zoom: 5, elevationM: -1800, name: 'Korolev Crater (Water Ice)' },
  'korolev crater': { lat: 73.0, lng: 165.0, zoom: 5, elevationM: -1800, name: 'Korolev Crater' },
  'planum boreum': { lat: 85.0, lng: 0.0, zoom: 4, elevationM: -2000, name: 'Planum Boreum (North Polar Ice Cap)' },
  'north pole': { lat: 85.0, lng: 0.0, zoom: 4, elevationM: -2000, name: 'Planum Boreum (North Polar Ice Cap)' },
  'planum australe': { lat: -85.0, lng: 0.0, zoom: 4, elevationM: 1000, name: 'Planum Australe (South Polar Ice Cap)' },
  'south pole': { lat: -85.0, lng: 0.0, zoom: 4, elevationM: 1000, name: 'Planum Australe (South Polar Ice Cap)' },
  'alba mons': { lat: 40.5, lng: -109.9, zoom: 5, elevationM: 6770, name: 'Alba Mons' },
  'noctis labyrinthus': { lat: -7.0, lng: -101.2, zoom: 5, elevationM: 2000, name: 'Noctis Labyrinthus' },
  'kasei valles': { lat: 24.6, lng: -65.0, zoom: 5, elevationM: -3000, name: 'Kasei Valles' },
  'syrtis major': { lat: 8.4, lng: 69.5, zoom: 5, elevationM: 1000, name: 'Syrtis Major Planum' },
  'isidis planitia': { lat: 12.9, lng: 87.0, zoom: 5, elevationM: -3800, name: 'Isidis Planitia' },
  schiaparelli: { lat: -2.7, lng: 16.7, zoom: 6, elevationM: -1500, name: 'Schiaparelli Crater' },
  'mawrth vallis': { lat: 23.99, lng: -18.96, zoom: 6, elevationM: -2240, name: 'Mawrth Vallis' },
  'oxia planum': { lat: 18.2, lng: -24.3, zoom: 6, elevationM: -3000, name: 'Oxia Planum' },
  'beagle 2': { lat: 11.53, lng: 90.43, zoom: 7, elevationM: -3800, name: 'Beagle 2 (Isidis Planitia)' },
};

export function resolveCanonicalMarsLocation(queryOrName: string) {
  if (!queryOrName) return null;
  const q = queryOrName.toLowerCase().trim();
  if (CANONICAL_MARS_LOCATIONS[q]) {
    return CANONICAL_MARS_LOCATIONS[q];
  }
  for (const [key, loc] of Object.entries(CANONICAL_MARS_LOCATIONS)) {
    if (key.length >= 4 && (q.includes(key) || key.includes(q))) {
      return loc;
    }
  }
  return null;
}



