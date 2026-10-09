import { request } from './api'

export const locationService = {
  list: () => request('locations.list'),
  stores: () => request('stores.list'),
}
