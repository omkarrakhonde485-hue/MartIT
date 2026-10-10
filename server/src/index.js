import { createApp } from './app.js'
import { env } from './config/env.js'

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`🚀 MartIT API server running on port ${env.PORT} in ${env.NODE_ENV} mode`)
})

function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`)
  server.close(() => {
    console.log('Server closed. Process terminating.')
    process.exit(0)
  })
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
