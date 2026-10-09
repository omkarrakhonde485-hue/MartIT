import { request } from './api'

export const orderService = {
  /**
   * Sends product IDs and quantities ONLY. The server re-prices items, re-checks stock,
   * recalculates the delivery fee and snapshots it on the order.
   */
  create: ({ storeId, locationId, lines }) =>
    request('orders.create', {
      storeId,
      locationId,
      lines: lines.map(({ productId, quantity }) => ({ productId, quantity })),
    }),
}
