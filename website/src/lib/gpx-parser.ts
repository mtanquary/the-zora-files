// Lightweight client-side GPX parser. Extracts track points, computes total
// distance via haversine, and sums positive elevation deltas for gain.
//
// AllTrails / Garmin / Strava all export the standard GPX 1.1 schema:
//   <gpx><trk><trkseg><trkpt lat="..." lon="..."><ele>...</ele></trkpt>...
// We support multiple <trk> and <trkseg> elements; segments are joined into a
// single LineString since the use case (one expedition = one route) doesn't
// need MultiLineString separation.

export interface ParsedGpx {
  // [lng, lat, ele?] in GeoJSON order. Elevation in meters when present.
  coordinates: Array<[number, number, number?]>;
  distanceMiles: number;
  elevationGainFt: number;
  pointCount: number;
  startTime?: string;
  endTime?: string;
}

const METERS_PER_MILE = 1609.344;
const METERS_PER_FOOT = 0.3048;
const EARTH_RADIUS_M = 6371000;

function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function parseGpx(xmlText: string): ParsedGpx {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    throw new Error("parseGpx must run in a browser context.");
  }

  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error("GPX file is not valid XML.");
  }

  const trkpts = Array.from(doc.getElementsByTagName("trkpt"));
  if (trkpts.length === 0) {
    throw new Error("No <trkpt> elements found in this GPX file.");
  }

  const coords: Array<[number, number, number?]> = [];
  let distanceM = 0;
  let elevationGainM = 0;
  let lastLat: number | null = null;
  let lastLng: number | null = null;
  let lastEle: number | null = null;
  let startTime: string | undefined;
  let endTime: string | undefined;

  // Smooth elevation noise — only count gain after a small threshold to filter
  // GPS jitter (a 1-meter threshold catches most spurious wobble).
  const ELE_NOISE_M = 1;

  for (const trkpt of trkpts) {
    const lat = parseFloat(trkpt.getAttribute("lat") || "");
    const lng = parseFloat(trkpt.getAttribute("lon") || "");
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const eleEl = trkpt.getElementsByTagName("ele")[0];
    const ele = eleEl ? parseFloat(eleEl.textContent || "") : NaN;
    const eleNum = Number.isFinite(ele) ? ele : undefined;

    const timeEl = trkpt.getElementsByTagName("time")[0];
    const time = timeEl?.textContent?.trim();
    if (time) {
      if (!startTime) startTime = time;
      endTime = time;
    }

    coords.push(eleNum != null ? [lng, lat, eleNum] : [lng, lat]);

    if (lastLat !== null && lastLng !== null) {
      distanceM += haversineMeters(lastLat, lastLng, lat, lng);
    }
    if (eleNum != null && lastEle !== null) {
      const delta = eleNum - lastEle;
      if (delta > ELE_NOISE_M) elevationGainM += delta;
    }

    lastLat = lat;
    lastLng = lng;
    if (eleNum != null) lastEle = eleNum;
  }

  if (coords.length < 2) {
    throw new Error("GPX track has fewer than two valid points.");
  }

  return {
    coordinates: coords,
    distanceMiles: distanceM / METERS_PER_MILE,
    elevationGainFt: elevationGainM / METERS_PER_FOOT,
    pointCount: coords.length,
    startTime,
    endTime,
  };
}

export function gpxToGeoJsonLineString(parsed: ParsedGpx): {
  type: "LineString";
  coordinates: Array<[number, number, number?]>;
} {
  return { type: "LineString", coordinates: parsed.coordinates };
}
