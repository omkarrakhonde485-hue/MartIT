import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react'
import { Bike, Check, House, KeyRound, ShoppingBasket, Store, WalletCards } from 'lucide-react'
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { useLenis } from '@/components/layout/SmoothScroll'
import { cn } from '@/utils/cn'
import { ease, spring } from '@/utils/motion'
import { SectionHeading } from './SectionHeading'
import { FauxQr } from '@/components/ui/FauxQr'
import { Apple, BreadLoaf, MilkCarton, NoodleCup } from './Illustrations'

const STEPS = [
  { key: 'browse', icon: ShoppingBasket, title: 'Browse', body: 'Pick essentials from stores that deliver to your campus or society.' },
  { key: 'order', icon: WalletCards, title: 'Order', body: 'See the delivery fee for your spot before you pay by UPI.' },
  { key: 'deliver', icon: Bike, title: 'Deliver', body: 'An approved student runner picks up your order and heads your way.' },
  { key: 'receive', icon: KeyRound, title: 'Receive', body: 'Share your one-time code at the door. No code, no handover.' },
]

// Store → Home route through the campus, in the stage's 400×120 SVG space.
const ROUTE = 'M24 92 C 90 92, 96 30, 160 34 S 240 96, 290 70 S 350 24, 376 28'

/**
 * "How it works" scroll story.
 * md+ (and motion allowed): the section pins while scroll progress (GSAP ScrollTrigger)
 * drives the active step and draws the Store → Home route.
 * Mobile / reduced motion: a plain stacked list — no pinning, nothing scroll-jacked.
 */
export function HowItWorks() {
  const desktop = useMediaQuery('(min-width: 768px)')
  const reduce = usePrefersReducedMotion()
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20">
      {desktop && !reduce ? <PinnedStory /> : <StackedSteps />}
    </section>
  )
}

function PinnedStory() {
  const outer = useRef(null)
  const lenis = useLenis()
  const progress = useMotionValue(0)
  const [active, setActive] = useState(0)

  useMotionValueEvent(progress, 'change', (p) => {
    const next = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length))
    setActive((cur) => (cur === next ? cur : next))
  })

  useEffect(() => {
    let trigger
    let cancelled = false
    let onLenisScroll
    // GSAP is loaded only when this section mounts, keeping it out of the initial bundle.
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)
      trigger = ScrollTrigger.create({
        trigger: outer.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => progress.set(self.progress),
      })
      if (lenis) {
        onLenisScroll = ScrollTrigger.update
        lenis.on('scroll', onLenisScroll)
      }
    })
    return () => {
      cancelled = true
      trigger?.kill()
      if (lenis && onLenisScroll) lenis.off('scroll', onLenisScroll)
    }
  }, [lenis, progress])

  return (
    <div ref={outer} className="relative h-[340vh]">
      <div className="sticky top-0 flex h-dvh items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_1.15fr] items-center gap-12 px-6 pt-20">
          <div>
            <SectionHeading id="how-title" eyebrow="How it works" title="From your cart to your door, in four steps." />
            <ol className="relative mt-10 grid gap-2 pl-6">
              {/* progress rail */}
              <span aria-hidden="true" className="absolute bottom-3 left-[7px] top-3 w-0.5 rounded-full bg-line" />
              <m.span
                aria-hidden="true"
                style={{ scaleY: progress }}
                className="absolute bottom-3 left-[7px] top-3 w-0.5 origin-top rounded-full bg-fresh"
              />
              {STEPS.map((s, i) => (
                <li key={s.key} aria-current={i === active ? 'step' : undefined} className="relative py-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute -left-6 top-[18px] size-4 rounded-full border-2 transition-colors duration-300',
                      i <= active ? 'border-fresh bg-fresh' : 'border-line-strong bg-bg',
                    )}
                  />
                  <div className={cn('transition-opacity duration-300', i === active ? 'opacity-100' : 'opacity-45')}>
                    <h3 className="font-display text-2xl font-semibold tracking-tight">
                      <span className="tabular mr-2 text-ink-subtle">0{i + 1}</span>
                      {s.title}
                    </h3>
                    <p className="mt-1 max-w-sm text-ink-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <Stage active={active} progress={progress} />
        </div>
      </div>
    </div>
  )
}

function Stage({ active, progress }) {
  const pathRef = useRef(null)
  const runnerX = useMotionValue(24)
  const runnerY = useMotionValue(92)
  useMotionValueEvent(progress, 'change', (p) => {
    const path = pathRef.current
    if (!path) return
    const pt = path.getPointAtLength(path.getTotalLength() * p)
    runnerX.set(pt.x)
    runnerY.set(pt.y)
  })
  const reveal = useTransform(progress, [0, 1], [0.02, 1])

  return (
    <div className="grain relative overflow-hidden rounded-sheet border border-line bg-surface-2 p-6">
      <div className="relative grid h-[min(340px,44vh)] place-items-center">
        <AnimatePresence mode="wait">
          <m.div
            key={STEPS[active].key}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: ease.outSoft }}
            className="w-full max-w-sm"
          >
            <StepVisual step={STEPS[active].key} />
          </m.div>
        </AnimatePresence>
      </div>

      <svg viewBox="0 0 400 120" className="mt-2 w-full" aria-hidden="true">
        <mask id="how-route-mask">
          <m.path d={ROUTE} fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" style={{ pathLength: reveal }} />
        </mask>
        <path d={ROUTE} fill="none" stroke="var(--line-strong)" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.1 10" />
        <path ref={pathRef} d={ROUTE} mask="url(#how-route-mask)" fill="none" stroke="var(--fresh)" strokeWidth="4" strokeLinecap="round" strokeDasharray="0.1 10" />
        <g transform="translate(6 74)">
          <rect width="36" height="36" rx="10" fill="var(--brand)" />
          <Store x="8" y="8" width="20" height="20" color="var(--brand-ink)" />
        </g>
        <g transform="translate(358 10)">
          <rect width="36" height="36" rx="10" fill="var(--accent)" />
          <House x="8" y="8" width="20" height="20" color="var(--accent-ink)" />
        </g>
        <m.g style={{ x: runnerX, y: runnerY }}>
          <circle r="11" fill="var(--surface)" stroke="var(--fresh)" strokeWidth="3" />
          <circle r="4" fill="var(--fresh)" />
        </m.g>
      </svg>
    </div>
  )
}

function StackedSteps() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
      <SectionHeading id="how-title" eyebrow="How it works" title="From your cart to your door, in four steps." />
      <ol className="relative mt-10 grid gap-10 pl-8">
        <m.span
          aria-hidden="true"
          className="absolute bottom-2 left-[11px] top-2 w-0.5 origin-top rounded-full bg-fresh"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.6, ease: ease.outSoft }}
        />
        {STEPS.map((s, i) => (
          <m.li
            key={s.key}
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: ease.outSoft }}
          >
            <span aria-hidden="true" className="absolute -left-8 top-1 grid size-6 place-items-center rounded-full bg-fresh text-[11px] font-bold text-brand-ink dark:text-ink-inverse">
              {i + 1}
            </span>
            <h3 className="font-display text-2xl font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-1 text-ink-muted">{s.body}</p>
            <div className="mt-5 rounded-card border border-line bg-surface-2 p-4">
              <StepVisual step={s.key} />
            </div>
          </m.li>
        ))}
      </ol>
    </div>
  )
}

/* ---- Step vignettes (illustrative, sample data) ---------------------------- */

function StepVisual({ step }) {
  if (step === 'browse') return <BrowseVisual />
  if (step === 'order') return <OrderVisual />
  if (step === 'deliver') return <DeliverVisual />
  return <ReceiveVisual />
}

function MiniCard({ children, className }) {
  return <div className={cn('rounded-card border border-line bg-surface p-3 shadow-1', className)}>{children}</div>
}

function BrowseVisual() {
  const items = [
    [MilkCarton, 'Toned Milk', '₹28'],
    [BreadLoaf, 'Wheat Bread', '₹45'],
    [Apple, 'Apples', '₹60'],
    [NoodleCup, 'Noodles', '₹14'],
  ]
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(([Icon, name, price], i) => (
        <MiniCard key={name}>
          <div className="grid aspect-[4/3] place-items-center rounded-[12px] bg-surface-2">
            <Icon className="size-14" />
          </div>
          <p className="tabular mt-2 text-sm font-semibold">{price}</p>
          <p className="truncate text-xs text-ink-subtle">{name}</p>
          <div className={cn('mt-2 flex h-7 items-center justify-center rounded-[9px] text-xs font-semibold', i === 1 ? 'bg-brand text-brand-ink' : 'border border-brand text-fresh-ink')}>
            {i === 1 ? '−   2   +' : 'ADD'}
          </div>
        </MiniCard>
      ))}
    </div>
  )
}

function OrderVisual() {
  return (
    <MiniCard className="p-5">
      <div className="flex gap-4">
        <FauxQr seed={3} className="size-24 shrink-0 rounded-[12px] border border-line p-1.5" />
        <div className="tabular grid flex-1 content-start gap-1 text-sm">
          <div className="flex justify-between text-ink-muted"><span>Items</span><span>₹101</span></div>
          <div className="flex justify-between text-ink-muted"><span>Delivery</span><span>₹15</span></div>
          <div className="mt-1 flex justify-between border-t border-dashed border-line pt-2 font-semibold"><span>Total</span><span>₹116</span></div>
        </div>
      </div>
      <p className="mt-4 rounded-[10px] bg-warning-soft px-3 py-2 text-xs font-medium text-warning">Waiting for payment confirmation…</p>
      <p className="mt-2 text-[11px] text-ink-subtle">Sample QR — not scannable</p>
    </MiniCard>
  )
}

function DeliverVisual() {
  return (
    <MiniCard className="p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-brand-soft font-display text-lg font-bold text-fresh-ink">M</span>
        <div className="flex-1">
          <p className="font-semibold">Meera</p>
          <p className="text-xs text-ink-subtle">Approved runner · sample</p>
        </div>
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-brand-soft px-3 text-xs font-medium text-fresh-ink">
          <Bike className="size-3.5" aria-hidden="true" /> On the way
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-ink-subtle">
        {['Picked up', 'Main road', 'Hostel B'].map((t, i) => (
          <div key={t} className="grid gap-1.5">
            <span className={cn('h-1.5 rounded-full', i < 2 ? 'bg-fresh' : 'bg-surface-sunk')} />
            {t}
          </div>
        ))}
      </div>
    </MiniCard>
  )
}

function ReceiveVisual() {
  return (
    <MiniCard className="p-5 text-center">
      <p className="text-sm font-medium text-ink-muted">Your delivery code</p>
      <div className="mt-3 flex justify-center gap-2">
        {['2', '4', '6', '8'].map((d, i) => (
          <m.span
            key={i}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...spring.snappy, delay: 0.1 + i * 0.06 }}
            className="tabular grid size-12 place-items-center rounded-tile border-2 border-fresh bg-brand-soft font-display text-2xl font-semibold text-fresh-ink"
          >
            {d}
          </m.span>
        ))}
      </div>
      <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-fresh-ink">
        <Check className="size-4" aria-hidden="true" /> Share only when your items are in your hands
      </p>
      <p className="mt-1 text-[11px] text-ink-subtle">Sample code</p>
    </MiniCard>
  )
}
