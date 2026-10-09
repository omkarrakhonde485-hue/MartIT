import { useEffect } from 'react'
import { useLocation, useOutlet } from 'react-router'
import { AnimatePresence, m } from 'motion/react'
import { ease } from '@/utils/motion'
import { useScrollTo } from './SmoothScroll'

/**
 * Route transitions + scroll management.
 * - New path: fade/slide in, scroll to top.
 * - Hash link (/#faq): smooth-scroll to the section.
 */
export function PageTransition() {
  const location = useLocation()
  const outlet = useOutlet()
  const scrollTo = useScrollTo()

  useEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1))
      // After a route change the target mounts only once the exit transition finishes.
      let tries = 0
      let raf
      const seek = () => {
        const el = document.getElementById(id)
        if (el) {
          scrollTo(el)
          el.setAttribute('tabindex', '-1')
          el.focus({ preventScroll: true })
        } else if (tries++ < 240) raf = requestAnimationFrame(seek) // ~4s: target may be in a lazy chunk
      }
      raf = requestAnimationFrame(seek)
      return () => cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.hash])

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      // Jump to top between pages (while nothing is visible), unless a hash target will handle scrolling.
      onExitComplete={() => !location.hash && scrollTo(0, { immediate: true })}
    >
      <m.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.32, ease: ease.outSoft } }}
        exit={{ opacity: 0, y: -6, transition: { duration: 0.16, ease: ease.inSoft } }}
      >
        {outlet}
      </m.div>
    </AnimatePresence>
  )
}
