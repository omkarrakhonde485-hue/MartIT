import { SAMPLE_DELIVERY_LOCATIONS, SAMPLE_STORES } from '@/mocks/campus'
import { SAMPLE_PRODUCTS } from '@/mocks/catalogue'
import { SAMPLE_USERS } from '@/mocks/users'
import { safeStorage } from '@/utils/storage'
import { createPlatformFeeAllocator } from './platformFeeAllocator'

const SESSIONS_KEY = 'martit-mock-sessions'

/** Mock-only: keeps demo sessions across page reloads. A real backend owns sessions. */
function persistedSessions() {
  let entries = []
  try { entries = JSON.parse(safeStorage.get(SESSIONS_KEY) ?? '[]') } catch { entries = [] }
  const map = new Map(entries)
  const save = () => safeStorage.set(SESSIONS_KEY, JSON.stringify([...map]))
  return {
    get: (k) => map.get(k),
    set: (k, v) => { map.set(k, v); save() },
    delete: (k) => { map.delete(k); save() },
  }
}

/** In-memory tables standing in for the backend database. Reset on reload. */
export function createDb() {
  const clone = (x) => structuredClone(x)
  return {
    stores: clone(SAMPLE_STORES),
    locations: clone(SAMPLE_DELIVERY_LOCATIONS),
    products: clone(SAMPLE_PRODUCTS),
    users: clone(SAMPLE_USERS),
    sessions: persistedSessions(), // token -> userId
    orders: [],
    feeAllocator: createPlatformFeeAllocator(),
  }
}
