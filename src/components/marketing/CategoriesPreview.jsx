import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, LayoutGroup, m, useSpring } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { CATEGORY_GROUPS, SAMPLE_CATEGORIES } from '@/mocks/categories'
import { useFinePointer, usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { cn } from '@/utils/cn'
import { spring } from '@/utils/motion'
import { SectionHeading } from './SectionHeading'
import { ITEM_ILLUSTRATIONS } from './Illustrations'

/**
 * Category preview: filter tabs with a gliding indicator, tiles that re-flow with
 * layout animations, and a magnetic pull toward the pointer on hover.
 */
export function CategoriesPreview() {
  const [group, setGroup] = useState('all')
  const visible = SAMPLE_CATEGORIES.filter((c) => group === 'all' || c.group === group)

  return (
    <section id="categories" aria-labelledby="categories-title" className="scroll-mt-20 bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading id="categories-title" eyebrow="Categories" title="Everyday stuff, one tap away." />
          <Link to="/signup" className="inline-flex items-center gap-1.5 font-medium text-fresh-ink underline-offset-4 hover:underline">
            Sign up to browse stores near you <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <LayoutGroup>
          <div role="group" aria-label="Filter categories" className="no-scrollbar mt-10 flex gap-1 overflow-x-auto rounded-full border border-line bg-bg p-1 sm:w-fit">
            {CATEGORY_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={group === g.id}
                aria-controls="category-grid"
                onClick={() => setGroup(g.id)}
                className={cn(
                  'relative h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors',
                  group === g.id ? 'text-brand-ink' : 'text-ink-muted hover:text-ink',
                )}
              >
                {group === g.id && <m.span layoutId="cat-tab" transition={spring.snappy} className="absolute inset-0 rounded-full bg-brand" />}
                <span className="relative">{g.label}</span>
              </button>
            ))}
          </div>

          <m.ul id="category-grid" aria-live="polite" layout className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((c) => (
                <m.li
                  key={c.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={spring.soft}
                >
                  <CategoryTile category={c} />
                </m.li>
              ))}
            </AnimatePresence>
          </m.ul>
        </LayoutGroup>
        <p className="mt-6 text-sm text-ink-subtle">Sample categories. What’s available depends on the stores serving your community.</p>
      </div>
    </section>
  )
}

function CategoryTile({ category }) {
  const ref = useRef(null)
  const fine = useFinePointer()
  const reduce = usePrefersReducedMotion()
  const x = useSpring(0, { stiffness: 300, damping: 18 })
  const y = useSpring(0, { stiffness: 300, damping: 18 })
  const Art = ITEM_ILLUSTRATIONS[category.art]

  const onMove = (e) => {
    if (!fine || reduce) return
    const r = ref.current.getBoundingClientRect()
    x.set(((e.clientX - r.left) / r.width - 0.5) * 12)
    y.set(((e.clientY - r.top) / r.height - 0.5) * 12)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <m.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x, y, '--tint': category.tint }}
      data-cursor="hover"
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-card bg-[color-mix(in_oklab,var(--tint)_80%,var(--surface))] p-4 dark:bg-[color-mix(in_oklab,var(--tint)_9%,var(--surface))]"
    >
      <p className="max-w-[9rem] font-display text-base font-semibold leading-tight tracking-tight md:text-lg">{category.name}</p>
      <Art className="ml-auto mt-4 size-20 transition-transform duration-500 ease-spring group-hover:-translate-y-1.5 group-hover:-rotate-6 group-hover:scale-110 md:size-24" />
    </m.div>
  )
}
