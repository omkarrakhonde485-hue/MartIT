import { getSupabaseAdmin } from '../config/supabase.js'
import { ApiError } from '../utils/errors.js'
import { ROLES, hasPermission } from '../utils/permissions.js'

/**
 * Extracts Bearer token from Authorization header.
 */
function extractBearerToken(req) {
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

/**
 * Verifies Supabase Auth token, fetches profile and roles, and attaches req.user.
 */
export async function authenticate(req, res, next) {
  try {
    const token = extractBearerToken(req)
    if (!token) {
      throw ApiError.unauthenticated('Authorization token is required.')
    }

    const supabase = getSupabaseAdmin()

    // Supported Supabase Auth mechanism: verifies token with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.getUser(token)

    if (authError || !authData?.user) {
      throw ApiError.unauthenticated('Invalid or expired authentication session.')
    }

    const authUser = authData.user

    // Fetch user profile from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name, phone, runner_status, default_location_id')
      .eq('id', authUser.id)
      .maybeSingle()

    // Fetch user roles
    const { data: roleRecords } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUser.id)

    const roles = (roleRecords && roleRecords.length > 0)
      ? roleRecords.map((r) => r.role)
      : [ROLES.CUSTOMER] // Default fallback role

    req.user = {
      id: authUser.id,
      email: authUser.email || profile?.email || '',
      name: profile?.name || authUser.user_metadata?.name || 'User',
      phone: profile?.phone || null,
      roles: Array.from(new Set(roles)),
      runnerStatus: profile?.runner_status || null,
      defaultLocationId: profile?.default_location_id || null,
    }

    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Middleware: requires user to have a specific permission.
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthenticated())
    }
    if (!hasPermission(req.user, permission)) {
      return next(ApiError.forbidden("You don't have access to do that."))
    }
    next()
  }
}

/**
 * Middleware: requires user to have a specific role.
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthenticated())
    }
    if (!req.user.roles.includes(role)) {
      return next(ApiError.forbidden("You don't have the required role."))
    }
    next()
  }
}
