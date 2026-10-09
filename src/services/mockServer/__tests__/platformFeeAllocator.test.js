import { beforeEach, describe, expect, it } from 'vitest'
import {
  createPlatformFeeAllocator,
  RESERVATION_STATUS,
} from '../platformFeeAllocator'
import { createMockServer } from '../handlers'
import { calculateOrderTotals } from '@/utils/orderTotals'
import { splitDeliveryFee } from '@/utils/deliveryFee'
import { formatINR } from '@/utils/currency'

describe('Dynamic Platform Fee Allocator Unit Tests', () => {
  let allocator

  beforeEach(() => {
    allocator = createPlatformFeeAllocator()
  })

  it('allocates the smallest currently available eligible fee first (10 paise = ₹0.10)', () => {
    const now = 1000000
    const first = allocator.allocate({ orderId: 'ord_1', now })
    expect(first.feePaise).toBe(10)
    expect(first.feeRupees).toBe(0.1)

    const second = allocator.allocate({ orderId: 'ord_2', now })
    expect(second.feePaise).toBe(11)
    expect(second.feeRupees).toBe(0.11)

    const third = allocator.allocate({ orderId: 'ord_3', now })
    expect(third.feePaise).toBe(12)
    expect(third.feeRupees).toBe(0.12)
  })

  it('ensures simultaneous active reservations never receive the same fee', () => {
    const now = 2000000
    const allocations = []
    for (let i = 0; i < 15; i++) {
      allocations.push(allocator.allocate({ orderId: `ord_${i}`, now }))
    }

    const paiseValues = allocations.map((a) => a.feePaise)
    const uniqueValues = new Set(paiseValues)
    expect(uniqueValues.size).toBe(15)
    // Starts at 10 and increases sequentially
    expect(paiseValues[0]).toBe(10)
    expect(paiseValues[14]).toBe(24)
  })

  it('allows all 90 eligible fees (10-99 paise) to be allocated and exhausts safely', () => {
    const now = 3000000
    // Allocate all 90 slots
    for (let i = 10; i <= 99; i++) {
      const res = allocator.allocate({ orderId: `ord_${i}`, now })
      expect(res.feePaise).toBe(i)
    }

    // The 91st allocation must fail safely
    expect(() => allocator.allocate({ orderId: 'ord_overflow', now })).toThrowError(
      /All dynamic payment fee slots are currently active/i,
    )
  })

  it('does not release a reservation before the 2-minute verification window expires', () => {
    const startTime = 1000000
    allocator.allocate({ orderId: 'ord_1', now: startTime })

    // 1 minute 59 seconds later (119,000 ms)
    const withinWindow = startTime + 119 * 1000
    expect(allocator.getStatus(10, withinWindow)).toBe(RESERVATION_STATUS.ACTIVE)
    expect(allocator.isAvailable(10, withinWindow)).toBe(false)

    // Next allocation must NOT reuse 10 paise
    const second = allocator.allocate({ orderId: 'ord_2', now: withinWindow })
    expect(second.feePaise).toBe(11)
  })

  it('begins 5-minute cooldown after the 2-minute verification window expires', () => {
    const startTime = 1000000
    allocator.allocate({ orderId: 'ord_1', now: startTime })

    // Exactly after 2 minutes (120,001 ms)
    const justExpired = startTime + 120 * 1000 + 1
    expect(allocator.getStatus(10, justExpired)).toBe(RESERVATION_STATUS.COOLDOWN)
    expect(allocator.isAvailable(10, justExpired)).toBe(false)

    // At 4 minutes from start (2 min window + 2 min into cooldown)
    const midCooldown = startTime + 240 * 1000
    expect(allocator.getStatus(10, midCooldown)).toBe(RESERVATION_STATUS.COOLDOWN)
    expect(allocator.isAvailable(10, midCooldown)).toBe(false)

    // At 6 minutes 59 seconds (just before 5-minute cooldown completes)
    const almostDone = startTime + (2 * 60 + 5 * 60) * 1000 - 1000
    expect(allocator.getStatus(10, almostDone)).toBe(RESERVATION_STATUS.COOLDOWN)
    expect(allocator.isAvailable(10, almostDone)).toBe(false)

    // Next allocation during cooldown must skip 10 paise
    const next = allocator.allocate({ orderId: 'ord_2', now: midCooldown })
    expect(next.feePaise).toBe(11)
  })

  it('re-enables the fee for reuse only after the full cooldown (7 minutes total)', () => {
    const startTime = 1000000
    allocator.allocate({ orderId: 'ord_1', now: startTime })

    // At exactly 7 minutes (420,000 ms)
    const cooldownComplete = startTime + 7 * 60 * 1000
    expect(allocator.getStatus(10, cooldownComplete)).toBe(RESERVATION_STATUS.AVAILABLE)
    expect(allocator.isAvailable(10, cooldownComplete)).toBe(true)

    // Next allocation now reuses the smallest available slot (10 paise)
    const reused = allocator.allocate({ orderId: 'ord_reused', now: cooldownComplete })
    expect(reused.feePaise).toBe(10)
    expect(reused.reservation.orderId).toBe('ord_reused')
  })

  it('ensures successful payment reservations cannot be reassigned as unverified', () => {
    const startTime = 1000000
    allocator.allocate({ orderId: 'ord_1', now: startTime })

    // Server marks payment as verified/paid
    const marked = allocator.markPaid({ orderId: 'ord_1', now: startTime + 30 * 1000 })
    expect(marked).toBe(true)

    // Fast forward to 10 minutes later (past 7-minute hold)
    const longAfter = startTime + 10 * 60 * 1000
    expect(allocator.getStatus(10, longAfter)).toBe(RESERVATION_STATUS.PAID)
    expect(allocator.isAvailable(10, longAfter)).toBe(false)

    // Next allocation must NOT reuse the paid fee
    const next = allocator.allocate({ orderId: 'ord_2', now: longAfter })
    expect(next.feePaise).toBe(11)
  })
})

describe('Server Authoritative Orders Integration with Platform Fee', () => {
  let server, token

  beforeEach(async () => {
    server = createMockServer()
    token = (await server.handle('auth.demoLogin', { role: 'customer' })).token
  })

  it('ignores any browser-supplied platform fee or total and uses server allocation', async () => {
    const payload = {
      storeId: 'store_campus_mart',
      locationId: 'loc_hostel_b',
      lines: [{ productId: 'p_milk_500', quantity: 2 }],
      platformFee: 0.99, // Browser tries to claim 0.99
      total: 50,         // Browser tries to claim bogus total
    }

    const order = await server.handle('orders.create', payload, { token })

    // Authoritative calculation:
    // Milk: 28 * 2 = 56
    // Delivery: loc_hostel_b = 15
    // Smallest platform fee: 0.10
    // Authoritative total: 56 + 15 + 0.10 = 71.10
    expect(order.pricing.itemSubtotal).toBe(56)
    expect(order.pricing.deliveryFee).toBe(15)
    expect(order.pricing.platformFee).toBe(0.1)
    expect(order.pricing.total).toBe(71.1)
  })

  it('computes exact order totals for the browser test case (item 97, delivery 15, fee 0.10 -> 112.10)', async () => {
    // 2 x p_bread (45 each = 90) + not matching 97 directly, so let's check calculateOrderTotals directly
    const totals = calculateOrderTotals({
      lines: [
        { unitPrice: 97, quantity: 1 },
      ],
      deliveryFee: 15,
      platformFee: 0.1,
    })

    expect(totals.itemSubtotal).toBe(97)
    expect(totals.deliveryFee).toBe(15)
    expect(totals.platformFee).toBe(0.1)
    expect(totals.total).toBe(112.1)

    // Currency formatting checks
    expect(formatINR(totals.itemSubtotal)).toBe('₹97')
    expect(formatINR(totals.deliveryFee)).toBe('₹15')
    expect(formatINR(totals.platformFee)).toBe('₹0.10')
    expect(formatINR(totals.total)).toBe('₹112.10')
  })

  it('fails safely and creates no order when platform fee allocation is exhausted', async () => {
    // Fill all 90 slots directly in server's allocator
    for (let p = 10; p <= 99; p++) {
      server.feeAllocator.allocate({ orderId: `dummy_${p}` })
    }

    const initialOrdersCount = server.db.orders.length

    // Attempt to create an order
    await expect(
      server.handle(
        'orders.create',
        {
          storeId: 'store_campus_mart',
          locationId: 'loc_hostel_b',
          lines: [{ productId: 'p_milk_500', quantity: 1 }],
        },
        { token },
      ),
    ).rejects.toMatchObject({
      code: 'PLATFORM_FEE_EXHAUSTED',
      status: 503,
    })

    // No order was added
    expect(server.db.orders.length).toBe(initialOrdersCount)
  })

  it('keeps delivery-fee split and runner payouts strictly independent of platform fee', () => {
    const deliveryFee = 15
    const split = splitDeliveryFee(deliveryFee)
    // Runner payout policy remains intact
    expect(split.customerFee).toBe(15)
    expect(split.runnerPayout).toBeNull() // Undecided in config for 15 band
    expect(split.platformShare).toBeNull()

    const split10 = splitDeliveryFee(10)
    expect(split10.runnerPayout).toBe(8)
    expect(split10.platformShare).toBe(2)
  })
})
