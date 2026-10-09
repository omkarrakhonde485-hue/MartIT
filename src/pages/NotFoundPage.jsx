import { Link } from 'react-router'
import { m } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ease } from '@/utils/motion'

const ROUTE = 'M78 236 C 140 236, 130 150, 190 150 S 250 220, 290 170 S 300 80, 330 76'

/** Branded 404: a delivery route that wanders off and dead-ends at a "?" pin. */
export function NotFoundPage() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
      <div className="order-2 md:order-1">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-fresh-ink">Error 404</p>
        <h1 className="mt-3 font-display text-5xl font-bold tracking-display md:text-6xl">This route doesn't deliver.</h1>
        <p className="mt-4 max-w-md text-lg text-ink-muted">
          The page you're looking for isn't on our map. It may have moved, or the link might be mistyped.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/">
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to home
          </Link>
        </Button>
      </div>

      <svg viewBox="0 0 400 300" className="order-1 w-full max-w-md justify-self-center md:order-2" aria-hidden="true">
        <defs>
          <pattern id="nf-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="var(--line-strong)" />
          </pattern>
        </defs>
        <rect width="400" height="300" rx="28" fill="url(#nf-grid)" />
        {/* store */}
        <rect x="34" y="214" width="44" height="44" rx="12" fill="var(--brand)" />
        <path d="M46 234h20M46 244h14" stroke="var(--brand-ink)" strokeWidth="4" strokeLinecap="round" />
        {/* Dotted route revealed by an animated mask (pathLength would overwrite the dash pattern). */}
        <mask id="nf-reveal">
          <m.path
            d={ROUTE}
            fill="none"
            stroke="#fff"
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: ease.outSoft }}
          />
        </mask>
        <path d={ROUTE} mask="url(#nf-reveal)" fill="none" stroke="var(--fresh)" strokeWidth="5" strokeLinecap="round" strokeDasharray="0.1 14" />
        <m.g
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.3, type: 'spring', stiffness: 400, damping: 14 }}
        >
          <path d="M330 22c-19 0-34 15-34 34 0 26 34 52 34 52s34-26 34-52c0-19-15-34-34-34z" fill="var(--accent)" />
          <text x="330" y="70" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="34" fill="var(--accent-ink)">
            ?
          </text>
        </m.g>
      </svg>
    </section>
  )
}
