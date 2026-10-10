import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SUPABASE_URL: z.string().url().or(
    z.string().min(1).refine(() => process.env.NODE_ENV === 'test', {
      message: 'SUPABASE_URL must be a valid URL outside of test mode',
    }),
  ).default(process.env.NODE_ENV === 'test' ? 'http://localhost:54321' : 'http://localhost:54321'),
  SUPABASE_ANON_KEY: z.string().default('placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('placeholder-service-role-key'),
  FRONTEND_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  FEATURE_MULTI_STORE_CHECKOUT: z.coerce.boolean().default(false),
  ROUTING_PROVIDER: z.string().optional().default(''),
  ROUTING_MODE: z.string().default('walking'),
  MAKE_VERIFICATION_WEBHOOK_URL: z.string().optional().default(''),
})

let parsedEnv
try {
  parsedEnv = envSchema.parse({
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    FRONTEND_ORIGINS: process.env.FRONTEND_ORIGINS,
    FEATURE_MULTI_STORE_CHECKOUT: process.env.FEATURE_MULTI_STORE_CHECKOUT,
    ROUTING_PROVIDER: process.env.ROUTING_PROVIDER,
    ROUTING_MODE: process.env.ROUTING_MODE,
    MAKE_VERIFICATION_WEBHOOK_URL: process.env.MAKE_VERIFICATION_WEBHOOK_URL,
  })
} catch (err) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ Environment validation error:', err.format ? err.format() : err.message)
    process.exit(1)
  }
  // In test, fallback to defaults
  parsedEnv = envSchema.parse({
    NODE_ENV: 'test',
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  })
}

export const env = parsedEnv
export const allowedOrigins = parsedEnv.FRONTEND_ORIGINS.split(',').map((o) => o.trim())
