import { m } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { ease } from '@/utils/motion'
import { SectionHeading } from './SectionHeading'

const ROWS = [
  ['A long walk to the nearest shop after classes', 'Order from your room in a few taps'],
  ['Cash only, and nobody has change', 'Pay by UPI — confirmed by the payment system'],
  ['No idea when a friend’s errand will be back', 'See every step: confirmed, preparing, on the way'],
  ['Handing money to whoever happens to be going', 'Handover only with your one-time code'],
]

/**
 * Problem → solution as a ledger: each "old way" line is struck through as it scrolls
 * into view, and the MartIT way slides in beside it.
 */
export function ProblemSolution() {
  return (
    <section aria-labelledby="problem-title" className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
      <SectionHeading
        id="problem-title"
        eyebrow="Why MartIT"
        title={
          <>
            Running out of essentials
            <br className="hidden md:block" /> shouldn’t cost you an evening.
          </>
        }
      />

      <ol className="mt-12 divide-y divide-line border-y border-line">
        {ROWS.map(([before, after], i) => (
          <li key={before} className="grid gap-3 py-6 md:grid-cols-[2.5rem_1fr_auto_1fr] md:items-center md:gap-6">
            <span className="tabular font-display text-sm font-semibold text-ink-subtle">0{i + 1}</span>
            <p className="relative w-fit text-lg text-ink-subtle">
              <span className="sr-only">Before: </span>
              {before}
              <m.span
                aria-hidden="true"
                className="absolute left-0 top-1/2 h-[2px] w-full origin-left bg-danger/70"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 1 }}
                transition={{ duration: 0.5, delay: 0.25, ease: ease.outSoft }}
              />
            </p>
            <ArrowRight className="hidden size-5 text-ink-subtle md:block" aria-hidden="true" />
            <m.p
              className="text-lg font-semibold"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 1 }}
              transition={{ duration: 0.5, delay: 0.55, ease: ease.outSoft }}
            >
              <span className="sr-only">With MartIT: </span>
              {after}
            </m.p>
          </li>
        ))}
      </ol>
    </section>
  )
}
