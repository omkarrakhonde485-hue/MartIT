import { Link } from 'react-router'
import { m } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ease } from '@/utils/motion'
import { Bananas, MilkCarton, SodaCan } from './Illustrations'

/** Closing call to action: big type, two CTAs, items peeking in from the edge. */
export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="px-4 md:px-6">
      <div className="grain relative mx-auto max-w-6xl overflow-hidden rounded-sheet border border-line bg-surface-2 px-6 py-16 md:px-12 md:py-24">
        <m.h2
          id="cta-title"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: ease.outSoft }}
          className="max-w-3xl font-display text-[clamp(2.4rem,6vw,4.6rem)] font-bold leading-[0.95] tracking-display"
        >
          Your community’s corner store, <span className="text-fresh-ink">now in your pocket.</span>
        </m.h2>
        <p className="mt-5 max-w-md text-lg text-ink-muted">Create an account, add your delivery spot, and start ordering.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="accent" size="lg">
            <Link to="/signup">
              Get Started <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link to="/login">Log In</Link>
          </Button>
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute -bottom-6 right-4 hidden items-end gap-1 sm:flex md:right-12">
          {[
            [MilkCarton, 'size-28 md:size-36', '-6deg', 0.1],
            [SodaCan, 'size-24 md:size-28', '8deg', 0.2],
            [Bananas, 'size-28 md:size-36', '-4deg', 0.3],
          ].map(([Item, size, r, delay]) => (
            <m.div
              key={size + r}
              initial={{ y: 80 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 220, damping: 18, delay }}
              style={{ rotate: r }}
            >
              <Item className={size} />
            </m.div>
          ))}
        </div>
      </div>
    </section>
  )
}
