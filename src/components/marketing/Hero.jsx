import { useRef } from 'react'
import { Link } from 'react-router'
import { m, useMotionValue, useSpring, useTransform } from 'motion/react'
import { ArrowRight, KeyRound, QrCode, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useFinePointer, usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { LiveOrderCard } from './LiveOrderCard'
import { Apple, Bananas, Eggs, Notebook, SodaCan } from './Illustrations'

const LINES = [
  { text: 'Your Campus.', className: '' },
  { text: 'Your Essentials.', className: '' },
  { text: 'Delivered.', className: 'text-fresh-ink' },
]

// depth: how strongly an item follows the pointer (negative = moves against it)
const FLOATERS = [
  { Item: Apple, className: '-left-[6%] top-[4%] size-20 md:size-24', depth: 26, r: '-8deg', delay: '0s' },
  { Item: SodaCan, className: '-right-[4%] top-[14%] size-16 md:size-20', depth: -20, r: '10deg', delay: '-1.5s' },
  { Item: Bananas, className: '-left-[12%] bottom-[22%] size-20 md:size-28', depth: -30, r: '6deg', delay: '-3s' },
  { Item: Notebook, className: '-right-[10%] bottom-[30%] size-20 md:size-24', depth: 32, r: '-12deg', delay: '-2.2s' },
  { Item: Eggs, className: 'left-[8%] -bottom-[1%] size-16 md:size-20', depth: 16, r: '4deg', delay: '-4s' },
]

/**
 * Hero: kinetic headline (CSS, so it starts at first paint and doesn't hold back LCP),
 * a live demo order card that tilts toward the pointer, and illustrated items with
 * pointer parallax layered over a gentle idle float.
 */
export function Hero() {
  const stage = useRef(null)
  const fine = useFinePointer()
  const reduce = usePrefersReducedMotion()
  const interactive = fine && !reduce

  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 120, damping: 20 })
  const sy = useSpring(py, { stiffness: 120, damping: 20 })
  const rotateY = useTransform(sx, [-1, 1], [-7, 7])
  const rotateX = useTransform(sy, [-1, 1], [6, -6])

  const onMove = (e) => {
    if (!interactive) return
    const r = stage.current.getBoundingClientRect()
    px.set(((e.clientX - r.left) / r.width) * 2 - 1)
    py.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }
  const onLeave = () => {
    px.set(0)
    py.set(0)
  }

  return (
    <section aria-labelledby="hero-title" className="px-4 pt-4 md:px-6">
      <div className="grain relative mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-sheet border border-line bg-surface-2 px-5 pb-10 pt-12 lg:grid-cols-[1.1fr_1fr] lg:gap-6 md:px-12 md:py-16 lg:py-20">
        {/* soft brand glow + dotted campus grid, both static */}
        <div aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(70%_60%_at_75%_45%,#000,transparent)]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-1/4 -z-10 size-[28rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--fresh)_22%,transparent),transparent_65%)]" />

        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-muted">
            <span className="size-1.5 rounded-full bg-fresh" aria-hidden="true" />
            For campuses, hostels &amp; residential societies
          </p>

          <h1
            id="hero-title"
            className="mt-5 font-display text-[clamp(2.9rem,6.6vw,5.2rem)] font-bold leading-[0.92] tracking-display"
          >
            {LINES.map((l, i) => (
              <span key={l.text} className="block overflow-hidden pb-[0.06em]">
                <span className={`inline-block animate-rise ${l.className}`} style={{ animationDelay: `${80 + i * 90}ms` }}>
                  {l.text}
                </span>
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-md text-lg text-ink-muted animate-fade-in [animation-delay:380ms] [animation-fill-mode:both]">
            Order groceries and daily essentials from your room, pay by UPI, and get them from a student runner — handed over only when you share your one-time code.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="accent" size="lg">
              <Link to="/signup">
                Get Started <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/#how-it-works">See how it works</Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted">
            {[
              [QrCode, 'UPI payments'],
              [KeyRound, 'OTP handover'],
              [ShieldCheck, 'Approved student runners'],
            ].map(([Icon, label]) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon className="size-4 text-fresh-ink" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div
          ref={stage}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          className="relative mx-auto w-full max-w-[24rem] py-6 [perspective:1200px]"
        >
          {FLOATERS.map(({ Item, className, depth, r, delay }) => (
            <Floater key={depth} sx={sx} sy={sy} depth={depth} className={className} r={r} delay={delay}>
              <Item className="size-full drop-shadow-[0_10px_14px_rgb(16_24_20/0.18)]" />
            </Floater>
          ))}
          <m.div style={{ rotateX, rotateY }} className="relative z-10 mx-auto w-[82%] [transform-style:preserve-3d]">
            <LiveOrderCard />
          </m.div>
        </div>
      </div>
    </section>
  )
}

function Floater({ sx, sy, depth, className, r, delay, children }) {
  const x = useTransform(sx, (v) => v * depth)
  const y = useTransform(sy, (v) => v * depth)
  return (
    // Floaters sit behind the card (z-0) and peek out around its edges, so they never cover text.
    <m.div style={{ x, y }} className={`absolute z-0 ${className}`} aria-hidden="true">
      <div className="size-full animate-float" style={{ '--r': r, animationDelay: delay }}>
        {children}
      </div>
    </m.div>
  )
}
