import { createContext, useContext, useEffect, useState } from 'react'
import Lenis from 'lenis'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'

const LenisContext = createContext(null)

/** Lenis smooth scrolling, disabled under prefers-reduced-motion (native scroll is used instead). */
export function SmoothScroll({ children }) {
  const reduce = usePrefersReducedMotion()
  const [lenis, setLenis] = useState(null)

  useEffect(() => {
    if (reduce) return
    const instance = new Lenis({ autoRaf: true, lerp: 0.12, wheelMultiplier: 1 })
    setLenis(instance)
    return () => {
      instance.destroy()
      setLenis(null)
    }
  }, [reduce])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}

/** The active Lenis instance, or null when native scrolling is in use. */
export const useLenis = () => useContext(LenisContext)

/** Scroll helper that uses Lenis when active, native scrolling otherwise. */
export function useScrollTo() {
  const lenis = useContext(LenisContext)
  return (target, { offset = -88, immediate = false } = {}) => {
    if (lenis) return lenis.scrollTo(target, { offset, immediate })
    if (typeof target === 'number') return window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' })
    const el = typeof target === 'string' ? document.querySelector(target) : target
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: immediate ? 'auto' : 'smooth' })
  }
}
