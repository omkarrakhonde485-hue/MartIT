/**
 * Delivery pricing configuration — single source of truth for the client.
 * The backend MUST mirror these values; the server's calculation is authoritative.
 * Policy: docs/fee-policy.md (confirmed by product owner, 2026-10-09).
 *
 * Bump PRICING_VERSION whenever any value below changes. Orders store the version
 * they were priced with, so later changes never alter existing orders.
 */

export const PRICING_VERSION = '2026-10-09.1'

/** Flat bands. Upper bound inclusive (boundary distances get the lower fee). */
export const DELIVERY_FEE_BANDS = Object.freeze([
  Object.freeze({ maxKm: 0.5, fee: 10, label: 'Short campus delivery' }),
  Object.freeze({ maxKm: 1, fee: 15, label: 'Nearby hostel or campus location' }),
  Object.freeze({ maxKm: 2, fee: 20, label: 'Longer delivery' }),
])

/** Beyond the last flat band: base fee + per started kilometre. */
export const EXTENDED_DELIVERY = Object.freeze({
  fromKm: 2,
  baseFee: 20,
  perStartedKm: 5,
  label: 'Extended delivery',
})

/** Maximum delivery radius. Beyond this, checkout is blocked. */
export const MAX_SERVICE_KM = 5

/** No free delivery regardless of cart value (confirmed). */
export const FREE_DELIVERY_THRESHOLD = null

/**
 * Charges that are NOT yet defined. They stay null and are excluded from totals
 * until the product owner sets real values.
 */
export const TAX_RATE = null
export const PLATFORM_FEE = null

/**
 * Runner compensation is a separate value from the customer delivery fee.
 * PROVISIONAL: only the short-distance example (₹8 of a ₹10 fee) has been given,
 * and it was described as illustrative. Longer bands must pay more for distance and
 * effort, but their amounts are not decided — they stay null and the UI must show
 * "payout confirmed at assignment" instead of inventing a number.
 */
export const RUNNER_PAYOUT_PROVISIONAL = true
export const RUNNER_PAYOUT_BY_FEE = Object.freeze({
  10: 8,
  15: null,
  20: null,
  25: null,
  30: null,
  35: null,
})
