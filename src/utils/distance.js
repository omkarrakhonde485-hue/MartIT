const EARTH_RADIUS_KM = 6371.0088

const toRad = (deg) => (deg * Math.PI) / 180

/**
 * Great-circle ("straight-line") distance in km between two { lat, lng } points.
 * This is NOT walking or road distance and usually under-estimates the real route.
 * Anything shown to users from this must say "straight-line".
 */
export function straightLineKm(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

export const DISTANCE_METHOD = Object.freeze({
  ROUTE: 'route',
  STRAIGHT_LINE: 'straight_line',
})

export const DISTANCE_METHOD_LABEL = {
  [DISTANCE_METHOD.ROUTE]: 'route distance',
  [DISTANCE_METHOD.STRAIGHT_LINE]: 'straight-line distance',
}

/** Display only. Never pass a formatted/rounded value into fee calculation. */
export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(km < 10 ? 2 : 1)} km`
}

/** Formats distance in km to exactly two decimal places for UI display (e.g., "0.80"). */
export function formatDistanceKm(km) {
  if (typeof km !== 'number' || !Number.isFinite(km)) return '0.00'
  return km.toFixed(2)
}

