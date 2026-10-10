import rateLimit from 'express-rate-limit'

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please slow down and try again shortly.',
  },
})

export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many sensitive requests. Please wait a moment before trying again.',
  },
})
