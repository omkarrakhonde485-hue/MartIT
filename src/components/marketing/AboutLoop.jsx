import { Bike, House, Store } from 'lucide-react'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { SectionHeading } from './SectionHeading'

const SIDES = [
  { icon: House, title: 'Customers', body: 'Students and residents order essentials and receive them at their block, room or gate.' },
  { icon: Store, title: 'Stores', body: 'Local stores and campus shops get orders from the community they already serve.' },
  { icon: Bike, title: 'Runners', body: 'Approved students earn by delivering within the community, around their own schedule.' },
]

// Triangle loop in a 360×300 space: Store (top) → Runner (right) → Customer (left) → Store
const NODES = { store: [180, 46], runner: [300, 236], customer: [60, 236] }
const PATHS = [
  'M180 46 Q 270 110 300 236',
  'M300 236 Q 180 290 60 236',
  'M60 236 Q 90 110 180 46',
]

/**
 * About: the three sides of MartIT connected by animated beams
 * (concept adapted from Magic UI "Animated Beam", magicui.design).
 * Beams are static under reduced motion.
 */
export function AboutLoop() {
  const reduce = usePrefersReducedMotion()
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-20 px-4 md:px-6">
      <div className="mx-auto grid max-w-6xl items-center gap-12 overflow-hidden rounded-sheet bg-panel-deep px-6 py-16 text-panel-deep-ink md:grid-cols-2 md:px-12 md:py-20">
        <div>
          <SectionHeading
            id="about-title"
            invert
            eyebrow="About MartIT"
            title="Three sides, one loop."
            lede="MartIT connects people who need everyday essentials with stores nearby and students who deliver them — all inside the same community."
          />
          <ul className="mt-10 grid gap-6">
            {SIDES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-tile bg-white/10 text-accent">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-panel-deep-ink/75">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <svg viewBox="0 0 360 300" className="mx-auto w-full max-w-md" aria-hidden="true">
          <defs>
            <linearGradient id="beam-grad" x1="0" x2="1">
              <stop offset="0" stopColor="#22c55e" stopOpacity="0" />
              <stop offset=".5" stopColor="#4ade80" />
              <stop offset="1" stopColor="#fcbe0f" />
            </linearGradient>
          </defs>
          {PATHS.map((d) => (
            <path key={d} d={d} fill="none" stroke="rgb(255 255 255 / .32)" strokeWidth="3" strokeDasharray="0.1 9" strokeLinecap="round" />
          ))}
          {!reduce &&
            PATHS.map((d, i) => (
              <circle key={`dot-${d}`} r="5" fill="url(#beam-grad)">
                <animateMotion dur="3.6s" begin={`${i * 1.2}s`} repeatCount="indefinite" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".4 0 .2 1" />
              </circle>
            ))}
          {[
            [NODES.store, Store, 'Store'],
            [NODES.runner, Bike, 'Runner'],
            [NODES.customer, House, 'You'],
          ].map(([[x, y], Icon, label]) => (
            <g key={label} transform={`translate(${x - 30} ${y - 30})`}>
              <rect width="60" height="60" rx="18" fill="#14532d" stroke="rgb(255 255 255 / .18)" />
              <Icon x="18" y="14" width="24" height="24" color="#fcbe0f" />
              <text x="30" y="80" textAnchor="middle" fill="#f0fdf4" fontSize="13" fontFamily="var(--font-sans)" fontWeight="600">
                {label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  )
}
