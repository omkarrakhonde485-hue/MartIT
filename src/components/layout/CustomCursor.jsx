import { useEffect, useState } from 'react'
import { m, useMotionValue, useSpring } from 'motion/react'
import { useFinePointer, usePrefersReducedMotion } from '@/hooks/useMediaQuery'

const INTERACTIVE = 'a, button, [role="button"], [data-cursor="hover"], input, select, textarea, label'

/**
 * A soft follower ring that complements (never replaces) the native cursor.
 * Desktop fine pointers only; off under reduced motion.
 */
export function CustomCursor() {
  const fine = useFinePointer()
  const reduce = usePrefersReducedMotion()
  const enabled = fine && !reduce

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 900, damping: 50, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 900, damping: 50, mass: 0.4 })
  const [state, setState] = useState({ hover: false, visible: false, down: false })

  useEffect(() => {
    if (!enabled) return
    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
      const hover = Boolean(e.target.closest?.(INTERACTIVE))
      setState((s) => (s.hover === hover && s.visible ? s : { ...s, hover, visible: true }))
    }
    const leave = () => setState((s) => ({ ...s, visible: false }))
    const down = () => setState((s) => ({ ...s, down: true }))
    const up = () => setState((s) => ({ ...s, down: false }))
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  const scale = state.down ? 0.7 : state.hover ? 1.6 : 1
  return (
    <m.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] -ml-4 -mt-4 size-8 rounded-full border-[1.5px] border-brand"
      style={{ x: sx, y: sy }}
      animate={{
        scale,
        opacity: state.visible ? (state.hover ? 0.9 : 0.45) : 0,
        backgroundColor: state.hover ? 'color-mix(in oklab, var(--fresh) 14%, transparent)' : 'rgba(0,0,0,0)',
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  )
}
