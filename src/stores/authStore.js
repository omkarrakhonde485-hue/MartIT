import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { authService } from '@/services/authService'
import { setTokenProvider } from '@/services/api'
import { zustandSafeStorage } from '@/utils/storage'

/**
 * Session state. The user object is a cached copy for rendering only — every
 * permission is re-checked by the server using the token.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      async demoLogin(role) {
        const { token, user } = await authService.demoLogin(role)
        set({ token, user })
        return user
      },
      async logout() {
        try { await authService.logout() } catch { /* session may already be gone */ }
        set({ token: null, user: null })
      },
      hasRole: (role) => Boolean(get().user?.roles.includes(role)),
    }),
    { name: 'martit-session', partialize: (s) => ({ token: s.token, user: s.user }), storage: createJSONStorage(() => zustandSafeStorage) },
  ),
)

setTokenProvider(() => useAuthStore.getState().token)
