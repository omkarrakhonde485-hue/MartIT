import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { allowedOrigins } from './config/env.js'
import { requestLogger } from './middleware/requestLogger.js'
import { apiLimiter } from './middleware/rateLimiter.js'
import { errorHandler } from './middleware/errorHandler.js'
import { ApiError } from './utils/errors.js'

import { healthRouter } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { catalogueRouter } from './routes/catalogue.js'
import { storesRouter } from './routes/stores.js'
import { deliveryRouter } from './routes/delivery.js'
import { ordersRouter } from './routes/orders.js'
import { adminRouter } from './routes/admin.js'

export function createApp() {
  const app = express()

  // Trust proxy for Render / Cloudflare deployments
  app.set('trust proxy', 1)

  // Security headers
  app.use(helmet())

  // CORS configuration for explicitly allowed frontend origins
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true)
        }
        return callback(new ApiError('CORS_FORBIDDEN', 'Origin not allowed by CORS policy.', 403))
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )

  // Request size limit & JSON parser
  app.use(express.json({ limit: '1mb' }))

  // Sanitized request logging
  app.use(requestLogger)

  // Rate limiting
  app.use(apiLimiter)

  // Mount routers
  app.use(healthRouter)
  app.use(authRouter)
  app.use(catalogueRouter)
  app.use(storesRouter)
  app.use(deliveryRouter)
  app.use(ordersRouter)
  app.use(adminRouter)

  // 404 catch-all
  app.use((req, res, next) => {
    next(ApiError.notFound(`Endpoint ${req.method} ${req.originalUrl} not found.`))
  })

  // Centralized error handling
  app.use(errorHandler)

  return app
}
