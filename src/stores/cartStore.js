import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { zustandSafeStorage } from '@/utils/storage'

/**
 * Cart holds product IDs and quantities only. Prices shown in the cart come from the
 * catalogue query and are re-validated by the server when the order is created.
 */
export const useCartStore = create(
  persist(
    (set) => ({
      lines: [], // [{ productId, quantity }]
      setQuantity(productId, quantity) {
        set((s) => {
          const rest = s.lines.filter((l) => l.productId !== productId)
          return { lines: quantity > 0 ? [...rest, { productId, quantity }] : rest }
        })
      },
      clear: () => set({ lines: [] }),
    }),
    { name: 'martit-cart', partialize: (s) => ({ lines: s.lines }), storage: createJSONStorage(() => zustandSafeStorage) },
  ),
)

export const selectCartCount = (s) => s.lines.reduce((n, l) => n + l.quantity, 0)
