import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m, useInView } from 'motion/react'
import { BadgeCheck, Bike } from 'lucide-react'
import { ORDER_STATUS, ORDER_STATUS_LABEL, ORDER_TIMELINE } from '@/utils/orderMachine'
import { formatINR } from '@/utils/currency'
import { cn } from '@/utils/cn'
import { spring } from '@/utils/motion'
import { LiveDot } from '@/components/ui/Badge'
import { BreadLoaf, MilkCarton, NoodleCup } from './Illustrations'

const STEP_MS = 2200
const DETAIL = {
  [ORDER_STATUS.CONFIRMED]: 'Payment confirmed. Store notified.',
  [ORDER_STATUS.PREPARING]: 'Campus Mart is packing your items.',
  [ORDER_STATUS.PICKED_UP]: 'Meera picked up your order.',
  [ORDER_STATUS.ON_THE_WAY]: 'Heading to Hostel B, Block 3.',
  [ORDER_STATUS.DELIVERED]: 'Handed over with your OTP.',
}
const LINES = [
  { Icon: MilkCarton, name: 'Toned Milk', qty: 2, price: 28 },
  { Icon: BreadLoaf, name: 'Wheat Bread', qty: 1, price: 45 },
  { Icon: NoodleCup, name: 'Instant Noodles', qty: 2, price: 14 },
]
const SUBTOTAL = LINES.reduce((s, l) => s + l.qty * l.price, 0)
const FEE = 15 // Hostel B sample distance band (0.5–1 km)

/**
 * Demo order card that loops through the real order lifecycle.
 * Pauses when off-screen or when the tab is hidden. Sample data, clearly labelled.
 */
export function LiveOrderCard({ className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { amount: 0.4 })
  const [i, setI] = useState(0)

  useEffect(() => {
    if (!inView) return
    let id
    const tick = () => {
      if (!document.hidden) setI((n) => (n + 1) % ORDER_TIMELINE.length)
    }
    id = setInterval(tick, STEP_MS)
    return () => clearInterval(id)
  }, [inView])

  const status = ORDER_TIMELINE[i]
  const progress = i / (ORDER_TIMELINE.length - 1)
  const delivered = status === ORDER_STATUS.DELIVERED

  return (
    <div ref={ref} className={cn('drop-shadow-[0_24px_40px_rgb(16_24_20/0.18)]', className)}>
      <div className="perforated relative rounded-t-card bg-surface pb-5">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">Sample order</p>
            <p className="font-display text-lg font-semibold">#MT-0420</p>
          </div>
          <div className="relative h-7 overflow-hidden" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              <m.span
                key={status}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -24, opacity: 0 }}
                transition={spring.snappy}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium',
                  delivered ? 'bg-surface-2 text-ink-muted' : 'bg-brand-soft text-fresh-ink',
                )}
              >
                <LiveDot live={!delivered} />
                {ORDER_STATUS_LABEL[status]}
              </m.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress rail */}
        <div className="mt-4 px-5">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-sunk">
            <m.div
              className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-fresh"
              animate={{ scaleX: Math.max(0.04, progress) }}
              transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </div>
          <ol className="mt-2 flex justify-between" aria-label="Order progress">
            {ORDER_TIMELINE.map((s, idx) => (
              <li key={s} className={cn('size-1.5 rounded-full transition-colors duration-300', idx <= i ? 'bg-fresh' : 'bg-line-strong')}>
                <span className="sr-only">
                  {ORDER_STATUS_LABEL[s]}
                  {idx <= i ? ' (done)' : ''}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 flex min-h-5 items-center gap-1.5 text-sm text-ink-muted">
            {status === ORDER_STATUS.PICKED_UP || status === ORDER_STATUS.ON_THE_WAY ? (
              <Bike className="size-4 text-fresh-ink" aria-hidden="true" />
            ) : delivered ? (
              <BadgeCheck className="size-4 text-fresh-ink" aria-hidden="true" />
            ) : null}
            {DETAIL[status]}
          </p>
        </div>

        <div className="mx-5 my-4 border-t-2 border-dashed border-line" aria-hidden="true" />

        <ul className="grid gap-2 px-5">
          {LINES.map(({ Icon, name, qty, price }) => (
            <li key={name} className="flex items-center gap-3 text-sm">
              <span className="grid size-9 place-items-center rounded-[10px] bg-surface-2">
                <Icon className="size-7" />
              </span>
              <span className="flex-1 truncate">
                {name} <span className="text-ink-subtle">× {qty}</span>
              </span>
              <span className="tabular font-medium">{formatINR(qty * price)}</span>
            </li>
          ))}
        </ul>
        <dl className="tabular mt-4 grid gap-1 px-5 text-sm">
          <div className="flex justify-between text-ink-muted">
            <dt>Delivery (0.5–1 km)</dt>
            <dd>{formatINR(FEE)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Total</dt>
            <dd>{formatINR(SUBTOTAL + FEE)}</dd>
          </div>
        </dl>

        {/* OTP stamp lands on delivery */}
        <AnimatePresence>
          {delivered && (
            <m.div
              initial={{ scale: 1.8, opacity: 0, rotate: -18 }}
              animate={{ scale: 1, opacity: 1, rotate: -10 }}
              exit={{ opacity: 0 }}
              transition={spring.bouncy}
              className="pointer-events-none absolute bottom-16 right-5 rounded-[10px] border-[3px] border-fresh-ink px-2.5 py-1 font-display text-sm font-extrabold uppercase tracking-wider text-fresh-ink"
              aria-hidden="true"
            >
              OTP verified
            </m.div>
          )}
        </AnimatePresence>
      </div>
      <p className="mt-3 text-center text-[11px] text-ink-subtle">Demo animation · sample data</p>
    </div>
  )
}
