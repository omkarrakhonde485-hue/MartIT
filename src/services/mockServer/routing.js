import { DISTANCE_METHOD, straightLineKm } from '@/utils/distance'

/**
 * Server-side distance lookup. A real deployment should call a routing service
 * (walking/road) here and return method: 'route'. No routing provider is wired in
 * the mock, so it returns straight-line distance and says so.
 */
export async function getDistanceKm(from, to, { routingProvider = null } = {}) {
  if (routingProvider) {
    const km = await routingProvider.routeKm(from, to)
    return { km, method: DISTANCE_METHOD.ROUTE }
  }
  return { km: straightLineKm(from, to), method: DISTANCE_METHOD.STRAIGHT_LINE }
}
