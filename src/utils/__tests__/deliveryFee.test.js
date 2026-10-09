import { describe, expect, it } from 'vitest'
import { calculateDeliveryFee, splitDeliveryFee } from '@/utils/deliveryFee'

const fee = (km) => calculateDeliveryFee(km)

describe('calculateDeliveryFee — confirmed policy 2026-10-09', () => {
  it.each([
    [0.001, 10],
    [0.25, 10],
    [0.5, 10], // boundary → lower band
    [0.5000001, 15],
    [0.501, 15],
    [1, 15], // boundary → lower band
    [1.001, 20], // must NOT get ₹15
    [1.5, 20],
    [2, 20], // boundary → lower band
    [2.0000001, 25], // every started km beyond 2
    [2.3, 25],
    [3, 25],
    [3.0001, 30],
    [3.4, 30],
    [4, 30],
    [4.0001, 35],
    [4.99, 35],
    [5, 35], // max radius is inclusive
  ])('%s km → ₹%s', (km, expected) => {
    const r = fee(km)
    expect(r.ok).toBe(true)
    expect(r.fee).toBe(expected)
    expect(r.distanceKm).toBe(km) // unrounded distance is preserved
    expect(r.pricingVersion).toBeTruthy()
  })

  it('absorbs floating-point noise at band edges, not real distance', () => {
    expect(fee(0.1 + 0.2 + 2.7).fee).toBe(25) // 3.0000000000000004 is still 3 km
    expect(fee(3.000001).fee).toBe(30) // 1 m over is charged
  })

  it.each([5.0000001, 5.01, 6, 120])('blocks checkout beyond 5 km (%s km)', (km) => {
    expect(fee(km)).toMatchObject({ ok: false, reason: 'OUT_OF_SERVICE_AREA', maxKm: 5 })
  })

  it.each([0, -1, NaN, Infinity, '1', null, undefined])('rejects invalid distance %s', (km) => {
    expect(fee(km)).toMatchObject({ ok: false, reason: 'INVALID_DISTANCE' })
  })

  it('has no free delivery path', () => {
    for (let km = 0.05; km <= 5; km += 0.05) expect(fee(km).fee).toBeGreaterThan(0)
  })
})

describe('splitDeliveryFee', () => {
  it('keeps runner payout separate from the customer fee', () => {
    expect(splitDeliveryFee(10)).toEqual({ customerFee: 10, runnerPayout: 8, platformShare: 2 })
  })
  it('does not invent a payout for longer bands', () => {
    expect(splitDeliveryFee(20)).toEqual({ customerFee: 20, runnerPayout: null, platformShare: null })
  })
})
