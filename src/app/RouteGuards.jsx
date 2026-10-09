import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { ForbiddenPage } from '@/pages/ForbiddenPage'

/**
 * Client-side route gating for UX only. Every API call is independently authorised
 * by the server; hiding a route is never the security boundary.
 *
 * Each area has its own check:
 *  - customer: signed in with the 'customer' role
 *  - runner:   'runner' role assigned by an admin AND runnerStatus === 'approved'
 *  - admin:    reserved for a future phase
 */
const CHECKS = {
  customer: (u) => u.roles.includes('customer'),
  runner: (u) => u.roles.includes('runner') && u.runnerStatus === 'approved',
  admin: (u) => u.roles.includes('admin'),
}

export function RequireRole({ role }) {
  const { token, user } = useAuthStore()
  const location = useLocation()

  if (!token || !user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  if (!CHECKS[role]?.(user)) return <ForbiddenPage role={role} />
  return <Outlet />
}

/** Sends signed-in users away from login/signup to their home area. */
export function RedirectIfAuthed() {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to={user.roles.includes('runner') && user.runnerStatus === 'approved' ? '/runner' : '/app'} replace />
  return <Outlet />
}
