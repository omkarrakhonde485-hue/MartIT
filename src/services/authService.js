import { request } from './api'

export const authService = {
  /** Mock-only: signs in as a sample account for the given role. Replaced by real login in Phase 3. */
  demoLogin: (role) => request('auth.demoLogin', { role }),
  logout: () => request('auth.logout'),
  me: () => request('auth.me'),
}
