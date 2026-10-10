import { Router } from 'express'
import { getSupabaseAdmin } from '../config/supabase.js'

export const healthRouter = Router()

/**
 * Liveness probe: returns 200 as long as the process is running.
 */
healthRouter.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

/**
 * Readiness probe: checks if database connection can be established.
 * Does NOT expose internal database URLs or credentials.
 */
healthRouter.get('/readyz', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin()
    // Perform a lightweight query to check connectivity
    const { error } = await supabase.from('locations').select('id').limit(1)

    if (error && error.code !== 'PGRST116') {
      return res.status(503).json({
        status: 'not_ready',
        reason: 'Database connectivity probe failed.',
        timestamp: new Date().toISOString(),
      })
    }

    return res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return res.status(503).json({
      status: 'not_ready',
      reason: 'Readiness check exception.',
      timestamp: new Date().toISOString(),
    })
  }
})
