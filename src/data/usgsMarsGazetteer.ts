export interface UsgsMarsFeature {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  diameterKm?: number;
  origin: string;
  approvalDate: string;
  officialUrl: string;
}

let gazetteerPromise: Promise<UsgsMarsFeature[]> | null = null;

const decodeField = (bytes: Uint8Array) => new TextDecoder('utf-8').decode(bytes).replace(/\0/g, '').trim();

function toNumber(value: string) {
  const number = Number(value.replace(/[^0-9eE+\-.]/g, ''));
  return Number.isFinite(number) ? number : 0;
}

export function parseOfficialMarsGazetteer(buffer: ArrayBuffer): UsgsMarsFeature[] {
  const view = new DataView(buffer);
  const recordCount = view.getUint32(4, true);
  const headerLength = view.getUint16(8, true);
  const recordLength = view.getUint16(10, true);
  const bytes = new Uint8Array(buffer);
  const fields: Array<{ name: string; offset: number; length: number }> = [];
  let offset = 1; // Every DBF record starts with a deletion flag byte.

  for (let cursor = 32; cursor < headerLength - 1; cursor += 32) {
    const name = decodeField(bytes.slice(cursor, cursor + 11));
    if (!name) break;
    const length = bytes[cursor + 16];
    fields.push({ name, offset, length });
    offset += length;
  }

  const fieldMap = new Map(fields.map((field) => [field.name, field]));
  const read = (recordStart: number, name: string) => {
    const field = fieldMap.get(name);
    return field ? decodeField(bytes.slice(recordStart + field.offset, recordStart + field.offset + field.length)) : '';
  };

  const features: UsgsMarsFeature[] = [];
  for (let index = 0; index < recordCount; index += 1) {
    const recordStart = headerLength + index * recordLength;
    if (bytes[recordStart] === 0x2a) continue;

    const rawLongitude = toNumber(read(recordStart, 'center_lon'));
    const latitude = toNumber(read(recordStart, 'center_lat'));
    if (latitude < -90 || latitude > 90 || rawLongitude < 0 || rawLongitude > 360) continue;

    const officialUrl = read(recordStart, 'link');
    const idMatch = officialUrl.match(/Feature\/(\d+)/i);
    const cleanName = read(recordStart, 'clean_name') || read(recordStart, 'name');
    features.push({
      id: `usgs-${idMatch?.[1] || `${index}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}`,
      name: cleanName,
      type: read(recordStart, 'type').replace(/^\d+/, ''),
      lat: Number(latitude.toFixed(5)),
      lng: Number((rawLongitude > 180 ? rawLongitude - 360 : rawLongitude).toFixed(5)),
      diameterKm: toNumber(read(recordStart, 'diameter')) || undefined,
      origin: read(recordStart, 'origin'),
      approvalDate: read(recordStart, 'approvaldt').slice(0, 10),
      officialUrl,
    });
  }

  return features;
}

/** Loads the official USGS/IAU Mars center-point gazetteer shipped with the app. */
export function loadOfficialMarsGazetteer(): Promise<UsgsMarsFeature[]> {
  if (gazetteerPromise) return gazetteerPromise;

  gazetteerPromise = fetch('/data/mars-nomenclature.dbf')
    .then((response) => {
      if (!response.ok) throw new Error(`USGS gazetteer download failed: ${response.status}`);
      return response.arrayBuffer();
    })
    .then(parseOfficialMarsGazetteer)
    .catch((error) => {
      gazetteerPromise = null;
      throw error;
    });

  return gazetteerPromise;
}
