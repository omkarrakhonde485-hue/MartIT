import { request } from './api'

export const deliveryService = {
  /**
   * Authoritative delivery quote, calculated server-side from the selected store and
   * saved delivery location. Call again whenever either changes, before confirming checkout.
   * Rejects with ApiError code OUT_OF_SERVICE_AREA when beyond the service radius.
   */
  quote: ({ storeId, locationId }) => request('delivery.quote', { storeId, locationId }),
}
