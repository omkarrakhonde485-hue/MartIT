import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'
import { createMockSupabaseClient } from './testHelpers.js'

describe('Health & Readiness Endpoints', () => {
  let app

  beforeEach(() => {
    createMockSupabaseClient({
      locations: [{ id: 'loc_test', name: 'Test Location', is_active: true }],
    })
    app = createApp()
  })

  it('GET /healthz returns 200 with status ok', async () => {
    const res = await request(app).get('/healthz')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.timestamp).toBeDefined()
  })

  it('GET /readyz returns 200 when database probe succeeds', async () => {
    const res = await request(app).get('/readyz')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ready')
    expect(res.body.timestamp).toBeDefined()
  })
})
