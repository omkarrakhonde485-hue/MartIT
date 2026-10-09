import { PLATFORM_FEE, TAX_RATE } from '@/config/fees'
import { sumRupees } from './currency'

/**
 * Customer total = item subtotal + delivery fee.
 * Taxes, platform fees and discounts are excluded until explicitly defined in config/fees.js.
 *
 * @param {{ lines: Array<{ unitPrice: number, quantity: number }>, deliveryFee: number }} input
 */
export function calculateOrderTotals({ lines, deliveryFee }) {
  if (TAX_RATE != null || PLATFORM_FEE != null) {
    // Guard so that defining a value in config can't silently skip the totals logic.
    throw new Error('Tax/platform fee defined in config but not implemented in calculateOrderTotals')
  }
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) throw new Error('Invalid quantity')
    if (typeof line.unitPrice !== 'number' || !(line.unitPrice >= 0)) throw new Error('Invalid unit price')
  }
  const itemSubtotal = sumRupees(lines.map((l) => l.unitPrice * l.quantity))
  return {
    itemSubtotal,
    deliveryFee,
    total: sumRupees([itemSubtotal, deliveryFee]),
  }
}
