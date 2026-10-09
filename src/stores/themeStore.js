import { create } from 'zustand'
import { safeStorage } from '@/utils/storage'

const KEY = 'martit-theme'
const current = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

function apply(theme) {
  document.documentElement.dataset.theme = theme
  safeStorage.set(KEY, theme)
}

export const useThemeStore = create((set) => ({
  theme: typeof document === 'undefined' ? 'light' : current(),
  /**
   * Switches theme with a circular reveal from `origin` (View Transitions API).
   * Falls back to an instant swap when unsupported or reduced motion is preferred.
   */
  setTheme(theme, origin) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const commit = () => {
      apply(theme)
      set({ theme })
    }
    if (reduce || !document.startViewTransition || !origin) return commit()

    const { x, y } = origin
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const t = document.startViewTransition(commit)
    t.ready
      .then(() =>
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 520, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
        ),
      )
      .catch(() => {})
  },
}))
