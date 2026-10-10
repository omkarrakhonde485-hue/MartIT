import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Validates environment variables according to NODE_ENV mode.
 * In production: strictly enforces HTTPS URLs, non-placeholder secrets, and safe CORS origins.
 * In test: provides safe in-memory test defaults without network calls.
 * In development: permits local development defaults.
 *
 * Security: NEVER prints credential values in error messages.
 */
export function validateEnv(raw = process.env) {
  const nodeEnv = raw.NODE_ENV || 'development'

  if (nodeEnv === 'test') {
    return {
      PORT: Number(raw.PORT) || 4000,
      NODE_ENV: 'test',
      SUPABASE_URL: raw.SUPABASE_URL || 'http://localhost:54321',
      SUPABASE_ANON_KEY: raw.SUPABASE_ANON_KEY || 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: raw.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key',
      FRONTEND_ORIGINS: raw.FRONTEND_ORIGINS || 'http://localhost:5173,http://localhost:3000',
      FEATURE_MULTI_STORE_CHECKOUT: raw.FEATURE_MULTI_STORE_CHECKOUT === 'true',
      ROUTING_PROVIDER: raw.ROUTING_PROVIDER || '',
      ROUTING_MODE: raw.ROUTING_MODE || 'walking',
      MAKE_VERIFICATION_WEBHOOK_URL: raw.MAKE_VERIFICATION_WEBHOOK_URL || '',
    }
  }

  if (nodeEnv === 'production') {
    const prodSchema = z.object({
      PORT: z.coerce.number().default(10000),
      NODE_ENV: z.literal('production'),
      SUPABASE_URL: z
        .string({ required_error: 'SUPABASE_URL is required in production' })
        .url('SUPABASE_URL must be a valid URL')
        .refine((url) => url.startsWith('https://'), {
          message: 'SUPABASE_URL must use HTTPS in production',
        }),
      SUPABASE_ANON_KEY: z
        .string({ required_error: 'SUPABASE_ANON_KEY is required in production' })
        .min(20, 'SUPABASE_ANON_KEY appears too short')
        .refine((k) => !k.toLowerCase().includes('placeholder') && !k.toLowerCase().includes('test'), {
          message: 'SUPABASE_ANON_KEY cannot be a placeholder in production',
        }),
      SUPABASE_SERVICE_ROLE_KEY: z
        .string({ required_error: 'SUPABASE_SERVICE_ROLE_KEY is required in production' })
        .min(20, 'SUPABASE_SERVICE_ROLE_KEY appears too short')
        .refine((k) => !k.toLowerCase().includes('placeholder') && !k.toLowerCase().includes('test'), {
          message: 'SUPABASE_SERVICE_ROLE_KEY cannot be a placeholder in production',
        }),
      FRONTEND_ORIGINS: z
        .string({ required_error: 'FRONTEND_ORIGINS is required in production' })
        .refine(
          (origins) => {
            const list = origins.split(',').map((o) => o.trim())
            return list.length > 0 && !list.includes('*') && !list.some((o) => o.startsWith('http://localhost'))
          },
          {
            message: 'FRONTEND_ORIGINS must be explicit HTTPS production URLs (no wildcard or localhost allowed)',
          },
        ),
      FEATURE_MULTI_STORE_CHECKOUT: z.coerce.boolean().default(false),
      ROUTING_PROVIDER: z.string().optional().default(''),
      ROUTING_MODE: z.string().default('walking'),
      MAKE_VERIFICATION_WEBHOOK_URL: z.string().optional().default(''),
    })

    return prodSchema.parse(raw)
  }

  // Development schema
  const devSchema = z.object({
    PORT: z.coerce.number().default(4000),
    NODE_ENV: z.literal('development').default('development'),
    SUPABASE_URL: z.string().url().default('http://localhost:54321'),
    SUPABASE_ANON_KEY: z.string().default('dev-anon-key'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().default('dev-service-role-key'),
    FRONTEND_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
    FEATURE_MULTI_STORE_CHECKOUT: z.coerce.boolean().default(false),
    ROUTING_PROVIDER: z.string().optional().default(''),
    ROUTING_MODE: z.string().default('walking'),
    MAKE_VERIFICATION_WEBHOOK_URL: z.string().optional().default(''),
  })

  return devSchema.parse(raw)
}

let parsedEnv
try {
  parsedEnv = validateEnv(process.env)
} catch (err) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ Environment validation failed:')
    if (err instanceof z.ZodError) {
      for (const issue of err.issues) {
        // Log field path and message only; NEVER log raw input values
        console.error(`   - [${issue.path.join('.') || 'config'}]: ${issue.message}`)
      }
    } else {
      console.error(`   - ${err.message}`)
    }
    process.exit(1)
  }

  // Fallback in test
  parsedEnv = validateEnv({ NODE_ENV: 'test' })
}

export const env = parsedEnv
export const allowedOrigins = parsedEnv.FRONTEND_ORIGINS.split(',').map((o) => o.trim())
