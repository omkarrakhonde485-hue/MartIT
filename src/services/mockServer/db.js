import { SAMPLE_DELIVERY_LOCATIONS, SAMPLE_STORES } from '@/mocks/campus'
import { SAMPLE_PRODUCTS } from '@/mocks/catalogue'
import { SAMPLE_USERS } from '@/mocks/users'

/** In-memory tables standing in for the backend database. Reset on reload. */
export function createDb() {
  const clone = (x) => structuredClone(x)
  return {
    stores: clone(SAMPLE_STORES),
    locations: clone(SAMPLE_DELIVERY_LOCATIONS),
    products: clone(SAMPLE_PRODUCTS),
    users: clone(SAMPLE_USERS),
    sessions: new Map(), // token -> userId
    orders: [],
  }
}
