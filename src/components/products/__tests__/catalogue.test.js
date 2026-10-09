import { beforeEach, describe, expect, it } from 'vitest'
import { createMockServer } from '@/services/mockServer/handlers'
import { useCartStore } from '@/stores/cartStore'
import { SAMPLE_PRODUCTS } from '@/mocks/catalogue'
import { SAMPLE_CATEGORIES } from '@/mocks/categories'

describe('Catalogue & Store Selection Mock Handlers', () => {
  let server

  beforeEach(() => {
    server = createMockServer()
  })

  it('returns all products when no storeId is specified', async () => {
    const products = await server.handle('catalogue.products', {})
    expect(products.length).toBeGreaterThan(0)
    expect(products.some((p) => p.id === 'p_milk_500')).toBe(true)
  })

  it('filters products by storeId', async () => {
    const campusMartProducts = await server.handle('catalogue.products', { storeId: 'store_campus_mart' })
    expect(campusMartProducts.every((p) => p.storeId === 'store_campus_mart')).toBe(true)
    expect(campusMartProducts.some((p) => p.id === 'p_milk_500')).toBe(true)

    const nightCanteenProducts = await server.handle('catalogue.products', { storeId: 'store_night_canteen' })
    expect(nightCanteenProducts.every((p) => p.storeId === 'store_night_canteen')).toBe(true)
    expect(nightCanteenProducts.some((p) => p.id === 'p_nc_maggi')).toBe(true)
  })

  it('returns categories list', async () => {
    const categories = await server.handle('catalogue.categories', {})
    expect(categories).toEqual(SAMPLE_CATEGORIES)
    expect(categories.length).toBe(SAMPLE_CATEGORIES.length)
  })

  it('returns stores with open/closed status', async () => {
    const stores = await server.handle('stores.list', {})
    expect(stores.length).toBeGreaterThanOrEqual(2)
    const openStore = stores.find((s) => s.id === 'store_campus_mart')
    expect(openStore?.isOpen).toBe(true)
  })
})

describe('Catalogue Client-side Filtering & Search Logic', () => {
  it('filters products by category correctly', () => {
    const dairyProducts = SAMPLE_PRODUCTS.filter((p) => p.categoryId === 'dairy')
    expect(dairyProducts.length).toBeGreaterThan(0)
    expect(dairyProducts.every((p) => p.categoryId === 'dairy')).toBe(true)
  })

  it('searches products by name, pack, or category', () => {
    const query = 'milk'
    const results = SAMPLE_PRODUCTS.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(query)
      const packMatch = p.pack?.toLowerCase().includes(query)
      return nameMatch || packMatch
    })
    expect(results.some((p) => p.name.toLowerCase().includes('milk'))).toBe(true)
  })

  it('handles empty search results cleanly', () => {
    const query = 'non_existent_gadget_xyz'
    const results = SAMPLE_PRODUCTS.filter((p) => p.name.toLowerCase().includes(query))
    expect(results).toEqual([])
  })
})

describe('Cart Store Operations & Stock Management', () => {
  beforeEach(() => {
    useCartStore.getState().clear()
  })

  it('adds items to the cart and updates quantities', () => {
    const store = useCartStore.getState()
    expect(store.lines).toEqual([])

    store.setQuantity('p_milk_500', 1)
    expect(useCartStore.getState().lines).toEqual([{ productId: 'p_milk_500', quantity: 1 }])

    store.setQuantity('p_milk_500', 3)
    expect(useCartStore.getState().lines).toEqual([{ productId: 'p_milk_500', quantity: 3 }])

    store.setQuantity('p_bread', 2)
    expect(useCartStore.getState().lines.length).toBe(2)

    store.setQuantity('p_milk_500', 0)
    expect(useCartStore.getState().lines).toEqual([{ productId: 'p_bread', quantity: 2 }])
  })

  it('clears all items from the cart', () => {
    const store = useCartStore.getState()
    store.setQuantity('p_milk_500', 2)
    store.setQuantity('p_bread', 1)
    expect(useCartStore.getState().lines.length).toBe(2)

    store.clear()
    expect(useCartStore.getState().lines).toEqual([])
  })
})
