import { m, LayoutGroup } from 'motion/react'
import { SAMPLE_CATEGORIES } from '@/mocks/categories'
import { cn } from '@/utils/cn'
import { spring } from '@/utils/motion'

/**
 * Category filter pills with gliding active indicator and product count badges.
 */
export function CategoryPills({
  selectedCategory,
  onSelectCategory,
  products = [],
  className,
}) {
  // Compute counts per category for the current store's products
  const categoryCounts = products.reduce((acc, p) => {
    if (p.categoryId) {
      acc[p.categoryId] = (acc[p.categoryId] || 0) + 1
    }
    return acc
  }, {})

  const totalCount = products.length

  const allCategories = [
    { id: 'all', name: 'All Products', count: totalCount },
    ...SAMPLE_CATEGORIES.map((cat) => ({
      ...cat,
      count: categoryCounts[cat.id] || 0,
    })),
  ]

  return (
    <div className={cn('relative w-full', className)}>
      <LayoutGroup id="category-pills">
        <div
          role="group"
          aria-label="Filter products by category"
          className="no-scrollbar flex w-full items-center gap-2 overflow-x-auto py-1 px-0.5"
        >
          {allCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectCategory(cat.id)}
                className={cn(
                  'group relative flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors select-none',
                  isSelected ? 'text-brand-ink font-semibold' : 'text-ink-muted hover:text-ink hover:bg-surface-2 bg-surface border border-line',
                )}
              >
                {isSelected && (
                  <m.span
                    layoutId="active-cat-pill"
                    transition={spring.snappy}
                    className="absolute inset-0 rounded-full bg-brand shadow-1"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>{cat.name}</span>
                  <span
                    className={cn(
                      'tabular rounded-full px-1.5 py-0.2 text-[11px] font-semibold transition-colors',
                      isSelected ? 'bg-white/25 text-white' : 'bg-surface-2 text-ink-subtle group-hover:bg-line',
                    )}
                  >
                    {cat.count}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </LayoutGroup>
    </div>
  )
}
