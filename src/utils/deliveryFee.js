import {
  DELIVERY_FEE_BANDS,
  EXTENDED_DELIVERY,
  MAX_SERVICE_KM,
  PRICING_VERSION,
  RUNNER_PAYOUT_BY_FEE,
} from '@/config/fees'

/**
 * Absorbs binary floating-point noise only (1 micrometre). Without it, a value
 * such as 3.0000000000000004 km — produced by arithmetic, not by real distance —
 * would be charged an extra kilometre. Any real excess is charged.
 */
const FLOAT_TOLERANCE_KM = 1e-9

/**
 * Pure delivery-fee calculation. Shared shape with the backend; the server's result
 * is authoritative and the browser's copy is only ever shown as an estimate.
 *
 * Uses the UNROUNDED distance — never round before calling this.
 *
 * @param {number} distanceKm
 * @returns {{ ok: true, fee: number, distanceKm: number, label: string, pricingVersion: string }
 *         | { ok: false, reason: 'INVALID_DISTANCE' | 'OUT_OF_SERVICE_AREA', distanceKm: number, maxKm: number }}
 */
export function calculateDeliveryFee(distanceKm) {
  if (typeof distanceKm !== 'number' || !Number.isFinite(distanceKm) || distanceKm <= 0) {
    return { ok: false, reason: 'INVALID_DISTANCE', distanceKm, maxKm: MAX_SERVICE_KM }
  }
  if (distanceKm > MAX_SERVICE_KM) {
    return { ok: false, reason: 'OUT_OF_SERVICE_AREA', distanceKm, maxKm: MAX_SERVICE_KM }
  }

  const band = DELIVERY_FEE_BANDS.find((b) => distanceKm <= b.maxKm)
  if (band) {
    return { ok: true, fee: band.fee, distanceKm, label: band.label, pricingVersion: PRICING_VERSION }
  }

  const { fromKm, baseFee, perStartedKm, label } = EXTENDED_DELIVERY
  const startedKm = Math.ceil(distanceKm - fromKm - FLOAT_TOLERANCE_KM)
  return {
    ok: true,
    fee: baseFee + perStartedKm * startedKm,
    distanceKm,
    label,
    pricingVersion: PRICING_VERSION,
  }
}

/**
 * Splits a customer delivery fee into runner payout and platform share.
 * Returns nulls where the payout is not yet decided — callers must not invent one.
 * Store commission is a separate ledger and is deliberately not part of this split.
 */
export function splitDeliveryFee(fee) {
  const runnerPayout = RUNNER_PAYOUT_BY_FEE[fee] ?? null
  return {
    customerFee: fee,
    runnerPayout,
    platformShare: runnerPayout == null ? null : fee - runnerPayout,
  }
}

export const DELIVERY_FEE_MESSAGES = {
  OUT_OF_SERVICE_AREA: `This location is outside our ${MAX_SERVICE_KM} km delivery area, so we can't deliver here yet. Choose a closer delivery spot.`,
  INVALID_DISTANCE: "We couldn't work out the distance to this location. Check the delivery spot and try again.",
}
