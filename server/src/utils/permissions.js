/**
 * Server-side Role-Based Access Control.
 * Mirrors src/utils/permissions.js as the authoritative security boundary.
 */

export const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  RUNNER: 'runner',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
})

export const PERMISSIONS = Object.freeze({
  SHOP: 'shop',
  RUNNER_DELIVER: 'runner.deliver',
  ADMIN_ACCESS: 'admin.access',
  USERS_READ: 'users.read',
  RUNNERS_APPROVE: 'runners.approve',
  ORDERS_READ_ALL: 'orders.readAll',
  ROLES_ASSIGN: 'roles.assign',
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
  for (const role of user?.roles ?? []) {
    for (const p of ROLE_PERMISSIONS[role] ?? []) {
      set.add(p)
    }
  }
  return set
}

export function hasPermission(user, permission) {
  if (!user) return false
  if (permission === P.RUNNER_DELIVER && user.runnerStatus !== 'approved') return false
  return permissionsFor(user).has(permission)
}
