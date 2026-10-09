/**
 * MOCK SERVER — stands in for the backend until Base44 / a real API is connected.
 * Everything here models what the server must do: it never trusts prices, fees or
 * totals sent by the browser, and it derives the user from the session token.
 */
import { calculateDeliveryFee, splitDeliveryFee, DELIVERY_FEE_MESSAGES } from '@/utils/deliveryFee'
import { calculateOrderTotals } from '@/utils/orderTotals'
import { ORDER_STATUS } from '@/utils/orderMachine'
import { PAYMENT_STATUS } from '@/utils/paymentMachine'
import { createDb } from './db'
import { ApiError } from './errors'
import { getDistanceKm } from './routing'
import { PERMISSIONS, ROLES, hasPermission } from '@/utils/permissions'

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  roles: [...u.roles],
  runnerStatus: u.runnerStatus ?? null,
  defaultLocationId: u.defaultLocationId ?? null,
})

const newId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`

export function createMockServer({ routingProvider = null } = {}) {
  const db = createDb()

  function requireUser(token) {
    const userId = token && db.sessions.get(token)
    const user = userId && db.users.find((u) => u.id === userId)
    if (!user) throw new ApiError('UNAUTHENTICATED', 'Please log in again.', 401)
    return user
  }

  function requirePermission(token, permission) {
    const user = requireUser(token)
    if (!hasPermission(user, permission)) throw new ApiError('FORBIDDEN', "You don't have access to do that.", 403)
    return user
  }

  const findUser = (id) => {
    const u = db.users.find((x) => x.id === id)
    if (!u) throw new ApiError('USER_NOT_FOUND', 'User not found.', 404)
    return u
  }

  async function computeDeliveryQuote(storeId, locationId) {
    const store = db.stores.find((s) => s.id === storeId)
    if (!store) throw new ApiError('STORE_NOT_FOUND', 'That store is not available.', 404)
    if (!store.isOpen) throw new ApiError('STORE_CLOSED', 'This store is closed right now.', 409)
    const location = db.locations.find((l) => l.id === locationId)
    if (!location) throw new ApiError('LOCATION_NOT_FOUND', 'Choose a delivery spot first.', 404)

    const { km, method } = await getDistanceKm(store.coords, location.coords, { routingProvider })
    const fee = calculateDeliveryFee(km)
    if (!fee.ok) {
      throw new ApiError(fee.reason, DELIVERY_FEE_MESSAGES[fee.reason], 422, {
        distanceKm: km,
        distanceMethod: method,
        maxKm: fee.maxKm,
      })
    }
    return {
      storeId,
      locationId,
      distanceKm: km,
      distanceMethod: method,
      deliveryFee: fee.fee,
      feeLabel: fee.label,
      pricingVersion: fee.pricingVersion,
    }
  }

  const handlers = {
    // ---- auth (demo only) -------------------------------------------------
    'auth.demoLogin': ({ role }) => {
      const user = db.users.find((u) => u.demoKey === role)
      if (!user) throw new ApiError('NO_DEMO_USER', 'No sample account for that role.', 404)
      const token = newId('tok')
      db.sessions.set(token, user.id)
      return { token, user: publicUser(user) }
    },
    'auth.logout': (_payload, { token }) => {
      db.sessions.delete(token)
      return { ok: true }
    },
    'auth.me': (_payload, { token }) => publicUser(requireUser(token)),

    // ---- admin --------------------------------------------------------------
    'admin.users.list': (_payload, { token }) => {
      requirePermission(token, PERMISSIONS.USERS_READ)
      return db.users.map(publicUser)
    },

    /** Approve or suspend a runner applicant. Approval grants the runner role. */
    'admin.runners.setStatus': ({ userId, status }, { token }) => {
      requirePermission(token, PERMISSIONS.RUNNERS_APPROVE)
      if (!['approved', 'suspended'].includes(status)) throw new ApiError('INVALID_STATUS', 'Invalid runner status.', 422)
      const target = findUser(userId)
      if (target.runnerStatus == null) throw new ApiError('NOT_AN_APPLICANT', 'This user has not applied to be a runner.', 409)
      target.runnerStatus = status
      if (status === 'approved' && !target.roles.includes(ROLES.RUNNER)) target.roles.push(ROLES.RUNNER)
      return publicUser(target)
    },

    /** Grant or revoke a role. Only `roles.assign` (super admin) may do this. */
    'admin.roles.set': ({ userId, role, granted }, { token }) => {
      const actor = requirePermission(token, PERMISSIONS.ROLES_ASSIGN)
      if (!Object.values(ROLES).includes(role)) throw new ApiError('INVALID_ROLE', 'Unknown role.', 422)
      const target = findUser(userId)
      if (!granted && role === ROLES.SUPER_ADMIN) {
        if (target.id === actor.id) throw new ApiError('SELF_DEMOTION', "You can't remove your own super admin role.", 409)
        const remaining = db.users.filter((u) => u.roles.includes(ROLES.SUPER_ADMIN) && u.id !== target.id)
        if (remaining.length === 0) throw new ApiError('LAST_SUPER_ADMIN', 'There must always be at least one super admin.', 409)
      }
      if (role === ROLES.RUNNER && granted) target.runnerStatus = 'approved'
      target.roles = granted ? [...new Set([...target.roles, role])] : target.roles.filter((r) => r !== role)
      return publicUser(target)
    },

    // ---- locations ----------------------------------------------------------
    'locations.list': () => db.locations.map(({ id, name, group }) => ({ id, name, group })),
    'stores.list': () => db.stores.map(({ id, name, isOpen }) => ({ id, name, isOpen })),

    // ---- delivery quote -----------------------------------------------------
    'delivery.quote': ({ storeId, locationId }) => computeDeliveryQuote(storeId, locationId),

    // ---- orders -------------------------------------------------------------
    /**
     * Creates an order from product IDs + quantities only. Any price, fee or total
     * in the payload is ignored; everything is recomputed here and snapshotted so
     * later price/fee changes never alter this order.
     */
    'orders.create': async ({ storeId, locationId, lines }, { token }) => {
      const user = requirePermission(token, PERMISSIONS.SHOP)
      if (!Array.isArray(lines) || lines.length === 0) {
        throw new ApiError('EMPTY_CART', 'Your cart is empty.', 422)
      }

      const pricedLines = lines.map(({ productId, quantity }) => {
        const product = db.products.find((p) => p.id === productId && p.storeId === storeId)
        if (!product) throw new ApiError('PRODUCT_UNAVAILABLE', 'An item in your cart is no longer available.', 409, { productId })
        if (!Number.isInteger(quantity) || quantity < 1) throw new ApiError('INVALID_QUANTITY', 'Invalid quantity.', 422, { productId })
        if (product.stock < quantity) {
          throw new ApiError('OUT_OF_STOCK', `Only ${product.stock} left of ${product.name}.`, 409, { productId, available: product.stock })
        }
        return { productId, name: product.name, pack: product.pack, unitPrice: product.price, quantity }
      })

      const quote = await computeDeliveryQuote(storeId, locationId)
      const totals = calculateOrderTotals({ lines: pricedLines, deliveryFee: quote.deliveryFee })
      const split = splitDeliveryFee(quote.deliveryFee)

      const order = {
        id: newId('ord'),
        customerId: user.id,
        storeId,
        locationId,
        lines: pricedLines,
        pricing: {
          itemSubtotal: totals.itemSubtotal,
          deliveryFee: totals.deliveryFee,
          total: totals.total,
          distanceKm: quote.distanceKm,
          distanceMethod: quote.distanceMethod,
          pricingVersion: quote.pricingVersion,
        },
        // Internal ledger — never sent to the customer.
        ledger: {
          runnerPayout: split.runnerPayout,
          platformDeliveryShare: split.platformShare,
          storeCommission: null, // separate ledger, not derived from delivery fee
        },
        status: ORDER_STATUS.AWAITING_PAYMENT,
        paymentStatus: PAYMENT_STATUS.PENDING,
        createdAt: new Date().toISOString(),
      }
      db.orders.push(order)

      const { ledger: _ledger, ...customerView } = order
      return customerView
    },
  }

  return {
    db,
    async handle(name, payload = {}, ctx = {}) {
      const handler = handlers[name]
      if (!handler) throw new ApiError('NOT_FOUND', `Unknown endpoint ${name}`, 404)
      return handler(payload, ctx)
    },
  }
}
