/**
 * Role-based access control shared by the UI (for showing/hiding) and the server
 * (for enforcing). The server check is the security boundary; the UI only mirrors it.
 *
 * Roles are never self-selected: sign-up creates a customer, and every other role
 * is granted by someone holding `roles.assign` (super admin).
 */

export const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  RUNNER: 'runner',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
})

export const ROLE_LABEL = {
  [ROLES.CUSTOMER]: 'Customer',
  [ROLES.RUNNER]: 'Runner',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.SUPER_ADMIN]: 'Super admin',
}

export const PERMISSIONS = Object.freeze({
  SHOP: 'shop',                         // browse, cart, order, own orders only
  RUNNER_DELIVER: 'runner.deliver',     // accept & deliver orders (also needs approval)
  ADMIN_ACCESS: 'admin.access',         // open the admin console
  USERS_READ: 'users.read',
  RUNNERS_APPROVE: 'runners.approve',   // approve / suspend runner applicants
  ORDERS_READ_ALL: 'orders.readAll',
  ROLES_ASSIGN: 'roles.assign',         // grant/revoke any role, incl. admin & super admin
  PRICING_MANAGE: 'pricing.manage',
})

const P = PERMISSIONS

const ROLE_PERMISSIONS = {
  [ROLES.CUSTOMER]: [P.SHOP],
  [ROLES.RUNNER]: [P.RUNNER_DELIVER],
  [ROLES.ADMIN]: [P.ADMIN_ACCESS, P.USERS_READ, P.RUNNERS_APPROVE, P.ORDERS_READ_ALL],
  [ROLES.SUPER_ADMIN]: Object.values(P),
}

export function permissionsFor(user) {
  const set = new Set()
  for (const role of user?.roles ?? []) for (const p of ROLE_PERMISSIONS[role] ?? []) set.add(p)
  return set
}

export function hasPermission(user, permission) {
  if (!user) return false
  if (permission === P.RUNNER_DELIVER && user.runnerStatus !== 'approved') return false
  return permissionsFor(user).has(permission)
}

/** Which area a user lands in after sign-in (most privileged first). */
export function homePathFor(user) {
  if (hasPermission(user, P.ADMIN_ACCESS)) return '/admin'
  if (hasPermission(user, P.RUNNER_DELIVER)) return '/runner'
  return '/app'
}
