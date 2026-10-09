import { m } from 'motion/react'
import { BadgeCheck, KeyRound, Lock, Receipt, ShieldCheck } from 'lucide-react'
import { ease } from '@/utils/motion'

const POINTS = [
  { icon: ShieldCheck, title: 'Payment confirmed by the system', body: 'An order moves forward only after the payment is verified on our side. Screenshots and “I’ve paid” taps don’t count.' },
  { icon: KeyRound, title: 'One-time code at the door', body: 'Delivery completes only when you share your code. Codes are short-lived, allow limited tries and are checked on our servers.' },
  { icon: BadgeCheck, title: 'Runners are approved, not self-declared', body: 'Runner access is granted by the MartIT team. Two runners can never claim the same order.' },
  { icon: Receipt, title: 'Prices checked when you order', body: 'Item prices, stock and the delivery fee are re-checked when the order is placed, and saved with your order.' },
  { icon: Lock, title: 'Your orders are yours', body: 'Only you can see your orders. Runners see what they need to deliver, nothing more.' },
]

/** Sticky statement on the left, numbered commitments on the right that draw in on scroll. */
export function TrustSection() {
  return (
    <section aria-labelledby="trust-title" className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-[1fr_1.3fr] md:px-6 md:py-28">
      <div className="md:sticky md:top-28 md:self-start">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-fresh-ink">Trust</p>
        <h2 id="trust-title" className="mt-3 font-display text-[clamp(2rem,4.6vw,3.4rem)] font-bold leading-[1] tracking-display">
          Checks built into every order, not bolted on.
        </h2>
        <p className="mt-4 max-w-sm text-lg text-ink-muted">How MartIT keeps payments, handovers and your data honest.</p>
      </div>

      <ol className="grid">
        {POINTS.map(({ icon: Icon, title, body }, i) => (
          <m.li
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: ease.outSoft }}
            className="relative grid grid-cols-[auto_1fr] gap-5 pb-10 last:pb-0"
          >
            <div className="relative flex flex-col items-center">
              <span className="grid size-12 place-items-center rounded-tile border border-line bg-surface text-fresh-ink shadow-1">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              {i < POINTS.length - 1 && (
                <m.span
                  aria-hidden="true"
                  className="mt-2 w-px flex-1 origin-top bg-line-strong"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.7, delay: 0.2, ease: ease.outSoft }}
                />
              )}
            </div>
            <div className="pt-2">
              <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-1.5 text-ink-muted">{body}</p>
            </div>
          </m.li>
        ))}
      </ol>
    </section>
  )
}
