import { describe, it, expect } from 'vitest'
import { validateEnv } from '../config/env.js'

describe('Environment Variable Validation Hardening', () => {
  it('provides safe in-memory defaults in test mode', () => {
    const config = validateEnv({ NODE_ENV: 'test' })
    expect(config.NODE_ENV).toBe('test')
    expect(config.SUPABASE_URL).toBe('http://localhost:54321')
    expect(config.SUPABASE_SERVICE_ROLE_KEY).toBe('test-service-key')
  })

  it('fails safely in production if SUPABASE_URL is missing', () => {
    expect(() => {
      validateEnv({
        NODE_ENV: 'production',
        SUPABASE_ANON_KEY: 'valid-long-anon-key-1234567890',
        SUPABASE_SERVICE_ROLE_KEY: 'valid-long-service-role-key-1234567890',
        FRONTEND_ORIGINS: 'https://martit.vercel.app',
      })
    }).toThrow()
  })

  it('fails safely in production if SUPABASE_URL is HTTP or localhost', () => {
    expect(() => {
      validateEnv({
        NODE_ENV: 'production',
        SUPABASE_URL: 'http://localhost:54321',
        SUPABASE_ANON_KEY: 'valid-long-anon-key-1234567890',
        SUPABASE_SERVICE_ROLE_KEY: 'valid-long-service-role-key-1234567890',
        FRONTEND_ORIGINS: 'https://martit.vercel.app',
      })
    }).toThrow(/HTTPS/)
  })

  it('fails safely in production if keys are placeholder defaults', () => {
    expect(() => {
      validateEnv({
        NODE_ENV: 'production',
        SUPABASE_URL: 'https://project.supabase.co',
        SUPABASE_ANON_KEY: 'placeholder-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'placeholder-service-role-key',
        FRONTEND_ORIGINS: 'https://martit.vercel.app',
      })
    }).toThrow(/placeholder/)
  })

  it('fails safely in production if FRONTEND_ORIGINS is wildcard or localhost', () => {
    expect(() => {
      validateEnv({
        NODE_ENV: 'production',
        SUPABASE_URL: 'https://project.supabase.co',
        SUPABASE_ANON_KEY: 'valid-long-anon-key-1234567890',
        SUPABASE_SERVICE_ROLE_KEY: 'valid-long-service-role-key-1234567890',
        FRONTEND_ORIGINS: '*',
      })
    }).toThrow(/wildcard/)
  })

  it('succeeds in production when all credentials and HTTPS origins are valid', () => {
    const config = validateEnv({
      NODE_ENV: 'production',
      PORT: '10000',
      SUPABASE_URL: 'https://valid-project.supabase.co',
      SUPABASE_ANON_KEY: 'valid-production-anon-key-1234567890',
      SUPABASE_SERVICE_ROLE_KEY: 'valid-production-service-role-key-1234567890',
      FRONTEND_ORIGINS: 'https://martit.vercel.app,https://martit-preview.vercel.app',
    })

    expect(config.NODE_ENV).toBe('production')
    expect(config.PORT).toBe(10000)
    expect(config.SUPABASE_URL).toBe('https://valid-project.supabase.co')
  })
})
