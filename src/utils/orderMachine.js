/**
 * Order fulfilment state machine — independent from payment status.
 * An order only becomes CONFIRMED after payment is verified server-side
 * (see paymentMachine.js); before that it is AWAITING_PAYMENT.
 */

export const ORDER_STATUS = Object.freeze({
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  PICKED_UP: 'PICKED_UP',
  ON_THE_WAY: 'ON_THE_WAY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
})

const S = ORDER_STATUS

const TRANSITIONS = {
  [S.AWAITING_PAYMENT]: [S.CONFIRMED, S.CANCELLED],
  [S.CONFIRMED]: [S.PREPARING, S.CANCELLED],
  [S.PREPARING]: [S.PICKED_UP, S.CANCELLED],
  [S.PICKED_UP]: [S.ON_THE_WAY],
  [S.ON_THE_WAY]: [S.DELIVERED], // DELIVERED requires backend OTP verification
  [S.DELIVERED]: [],
  [S.CANCELLED]: [],
}

/** Customer-visible lifecycle, in order. */
export const ORDER_TIMELINE = [S.CONFIRMED, S.PREPARING, S.PICKED_UP, S.ON_THE_WAY, S.DELIVERED]

export const ORDER_STATUS_LABEL = {
  [S.AWAITING_PAYMENT]: 'Awaiting payment',
  [S.CONFIRMED]: 'Confirmed',
  [S.PREPARING]: 'Preparing',
  [S.PICKED_UP]: 'Picked up',
  [S.ON_THE_WAY]: 'On the way',
  [S.DELIVERED]: 'Delivered',
  [S.CANCELLED]: 'Cancelled',
}

export function canTransitionOrder(from, to) {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function transitionOrder(from, to) {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`Illegal order transition ${from} → ${to}`)
  }
  return to
}
