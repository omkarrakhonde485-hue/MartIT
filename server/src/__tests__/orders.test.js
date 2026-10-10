import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'
import { createMockSupabaseClient } from './testHelpers.js'
import { ROLES } from '../utils/permissions.js'

describe('Order History & Detail Endpoints', () => {
  let app

  const sampleOrder = {
    id: 'ord_123',
    customer_id: 'usr_alice',
    runner_id: 'usr_runner',
    delivery_location_id: 'loc_hostel_a',
    delivery_location_snapshot: { name: 'Hostel A' },
    status: 'CONFIRMED',
    payment_status: 'PAID',
    item_subtotal: '120.00',
    combined_delivery_fee: '15.00',
    base_amount: '135.00',
    platform_fee: '0.12',
    total_payable: '135.12',
    route_distance_km: '0.9000',
    route_stop_sequence: [],
    routing_provider: 'straight_line',
    routing_mode: 'walking',
    fee_policy_version: '2026-10-09.1',
    payment_attempt_id: 'att_1',
    fee_paise: 12,
    payment_allocated_at: new Date().toISOString(),
    payment_window_expires_at: new Date(Date.now() + 120000).toISOString(),
    payment_cooldown_expires_at: new Date(Date.now() + 420000).toISOString(),
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    order_fulfillment_groups: [
      {
        id: 'grp_1',
        store_id: 'store_campus_mart',
        store_snapshot: { name: 'Campus Mart' },
        status: 'READY_FOR_PICKUP',
        pickup_sequence_index: 0,
        order_items: [
          {
            id: 'item_1',
            product_id: 'p_milk',
            product_name: 'Toned Milk',
            product_pack: '500 ml',
            unit_price: '28.00',
            quantity: 2,
            line_subtotal: '56.00',
          },
        ],
      },
    ],
  }

  beforeEach(() => {
    createMockSupabaseClient({
      users: [
        { id: 'usr_alice', token: 'tok_alice', email: 'alice@campus.edu', name: 'Alice Customer' },
        { id: 'usr_bob', token: 'tok_bob', email: 'bob@campus.edu', name: 'Bob Intruder' },
        { id: 'usr_runner', token: 'tok_runner', email: 'runner@campus.edu', name: 'Runner Rob' },
        { id: 'usr_admin', token: 'tok_admin', email: 'admin@campus.edu', name: 'Admin Adam' },
      ],
      profiles: [
        { id: 'usr_alice', email: 'alice@campus.edu', name: 'Alice Customer' },
        { id: 'usr_bob', email: 'bob@campus.edu', name: 'Bob Intruder' },
        { id: 'usr_runner', email: 'runner@campus.edu', name: 'Runner Rob', runner_status: 'approved' },
        { id: 'usr_admin', email: 'admin@campus.edu', name: 'Admin Adam' },
      ],
      userRoles: [
        { user_id: 'usr_alice', role: ROLES.CUSTOMER },
        { user_id: 'usr_bob', role: ROLES.CUSTOMER },
        { user_id: 'usr_runner', role: ROLES.RUNNER },
        { user_id: 'usr_admin', role: ROLES.ADMIN },
      ],
      orders: [sampleOrder],
    })
    app = createApp()
  })

  it('allows order owner (Alice) to read her order details', async () => {
    const res = await request(app)
      .get('/api/v1/orders/ord_123')
      .set('Authorization', 'Bearer tok_alice')

    expect(res.status).toBe(200)
    expect(res.body.id).toBe('ord_123')
    expect(res.body.customerId).toBe('usr_alice')
    expect(res.body.pricing.total).toBe(135.12)
    expect(res.body.fulfillmentGroups.length).toBe(1)
  })

  it('also supports RPC-style POST /orders/get for frontend api.js compatibility', async () => {
    const res = await request(app)
      .post('/orders/get')
      .set('Authorization', 'Bearer tok_alice')
      .send({ orderId: 'ord_123' })

    expect(res.status).toBe(200)
    expect(res.body.id).toBe('ord_123')
  })

  it('blocks another customer (Bob) from reading Alice order with 403', async () => {
    const res = await request(app)
      .get('/api/v1/orders/ord_123')
      .set('Authorization', 'Bearer tok_bob')

    expect(res.status).toBe(403)
    expect(res.body.code).toBe('FORBIDDEN')
  })

  it('allows assigned runner to read order details', async () => {
    const res = await request(app)
      .get('/api/v1/orders/ord_123')
      .set('Authorization', 'Bearer tok_runner')

    expect(res.status).toBe(200)
    expect(res.body.id).toBe('ord_123')
  })

  it('allows admin to read any order details', async () => {
    const res = await request(app)
      .get('/api/v1/orders/ord_123')
      .set('Authorization', 'Bearer tok_admin')

    expect(res.status).toBe(200)
    expect(res.body.id).toBe('ord_123')
  })

  it('retrieves customer order history via GET /api/v1/orders', async () => {
    const res = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', 'Bearer tok_alice')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(1)
    expect(res.body[0].id).toBe('ord_123')
  })
})
