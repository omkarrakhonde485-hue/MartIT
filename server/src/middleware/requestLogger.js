const SENSITIVE_KEYS = new Set([
  'authorization',
  'token',
  'password',
  'otp',
  'otp_hash',
  'secret',
  'cookie',
])

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const out = Array.isArray(obj) ? [] : {}
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = '[REDACTED]'
    } else if (typeof val === 'object' && val !== null) {
      out[key] = sanitize(val)
    } else {
      out[key] = val
    }
  }
  return out
}

export function requestLogger(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    // In test environment, keep logs quiet
    if (process.env.NODE_ENV === 'test') return
    const status = res.statusCode
    const logMethod = status >= 500 ? console.error : status >= 400 ? console.warn : console.log
    logMethod(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${status} - ${duration}ms`)
  })
  next()
}
