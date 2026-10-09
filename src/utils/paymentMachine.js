/**
 * Payment state machine — independent from order status.
 *
 * A QR code or an "I have paid" tap is NOT proof of payment. Only a verified
 * server-side source (gateway webhook / reconciliation) may move a payment to PAID.
 * Anything client-originated can at most move PENDING → PROCESSING ("checking").
 */

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
})

export const PAYMENT_SOURCE = Object.freeze({
  CLIENT: 'client',
  SERVER_VERIFIED: 'server_verified',
  SYSTEM_TIMER: 'system_timer',
})

const P = PAYMENT_STATUS

const TRANSITIONS = {
  [P.PENDING]: [P.PROCESSING, P.PAID, P.FAILED, P.EXPIRED],
  [P.PROCESSING]: [P.PAID, P.FAILED, P.EXPIRED, P.PENDING],
  [P.PAID]: [],
  [P.FAILED]: [],   // retry = new payment attempt, not a transition
  [P.EXPIRED]: [],  // retry = new payment attempt
}

/** Which sources may cause each target state. */
const ALLOWED_SOURCES = {
  [P.PROCESSING]: [PAYMENT_SOURCE.CLIENT, PAYMENT_SOURCE.SERVER_VERIFIED],
  [P.PENDING]: [PAYMENT_SOURCE.SERVER_VERIFIED],
  [P.PAID]: [PAYMENT_SOURCE.SERVER_VERIFIED],
  [P.FAILED]: [PAYMENT_SOURCE.SERVER_VERIFIED],
  [P.EXPIRED]: [PAYMENT_SOURCE.SERVER_VERIFIED, PAYMENT_SOURCE.SYSTEM_TIMER],
}

export const PAYMENT_STATUS_LABEL = {
  [P.PENDING]: 'Waiting for payment',
  [P.PROCESSING]: 'Checking payment',
  [P.PAID]: 'Paid',
  [P.FAILED]: 'Payment failed',
  [P.EXPIRED]: 'Payment window expired',
}

export function canTransitionPayment(from, to, source) {
  return (TRANSITIONS[from]?.includes(to) ?? false) && (ALLOWED_SOURCES[to]?.includes(source) ?? false)
}

export function transitionPayment(from, to, source) {
  if (!canTransitionPayment(from, to, source)) {
    throw new Error(`Illegal payment transition ${from} → ${to} from source "${source}"`)
  }
  return to
}
