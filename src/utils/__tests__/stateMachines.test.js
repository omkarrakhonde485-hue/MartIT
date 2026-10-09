import { describe, expect, it } from 'vitest'
import { ORDER_STATUS as O, canTransitionOrder, transitionOrder } from '@/utils/orderMachine'
import { PAYMENT_SOURCE as SRC, PAYMENT_STATUS as P, canTransitionPayment, transitionPayment } from '@/utils/paymentMachine'
import { calculateOrderTotals } from '@/utils/orderTotals'
import { straightLineKm } from '@/utils/distance'

describe('order machine', () => {
  it('follows the lifecycle', () => {
    let s = O.AWAITING_PAYMENT
    for (const next of [O.CONFIRMED, O.PREPARING, O.PICKED_UP, O.ON_THE_WAY, O.DELIVERED]) s = transitionOrder(s, next)
    expect(s).toBe(O.DELIVERED)
  })
  it('rejects skipping steps', () => {
    expect(canTransitionOrder(O.CONFIRMED, O.DELIVERED)).toBe(false)
    expect(() => transitionOrder(O.AWAITING_PAYMENT, O.PREPARING)).toThrow()
  })
})

describe('payment machine', () => {
  it('only a server-verified source can mark PAID', () => {
    expect(canTransitionPayment(P.PENDING, P.PAID, SRC.CLIENT)).toBe(false)
    expect(canTransitionPayment(P.PROCESSING, P.PAID, SRC.CLIENT)).toBe(false)
    expect(transitionPayment(P.PROCESSING, P.PAID, SRC.SERVER_VERIFIED)).toBe(P.PAID)
  })
  it('a client "I have paid" tap can only move to PROCESSING', () => {
    expect(transitionPayment(P.PENDING, P.PROCESSING, SRC.CLIENT)).toBe(P.PROCESSING)
    expect(canTransitionPayment(P.PENDING, P.FAILED, SRC.CLIENT)).toBe(false)
  })
  it('terminal states are final', () => {
    expect(canTransitionPayment(P.PAID, P.FAILED, SRC.SERVER_VERIFIED)).toBe(false)
    expect(canTransitionPayment(P.EXPIRED, P.PAID, SRC.SERVER_VERIFIED)).toBe(false)
  })
})

describe('order totals', () => {
  it('total = item subtotal + delivery fee', () => {
    const t = calculateOrderTotals({ lines: [{ unitPrice: 28, quantity: 2 }, { unitPrice: 45.5, quantity: 1 }], deliveryFee: 15 })
    expect(t).toEqual({ itemSubtotal: 101.5, deliveryFee: 15, total: 116.5 })
  })
  it('rejects bad quantities', () => {
    expect(() => calculateOrderTotals({ lines: [{ unitPrice: 10, quantity: 0 }], deliveryFee: 10 })).toThrow()
  })
})

describe('straightLineKm', () => {
  it('0.001° of latitude ≈ 111 m', () => {
    expect(straightLineKm({ lat: 12.97, lng: 77.59 }, { lat: 12.971, lng: 77.59 })).toBeCloseTo(0.1112, 3)
  })
})
