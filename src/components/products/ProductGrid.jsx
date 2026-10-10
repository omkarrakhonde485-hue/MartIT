import { AnimatePresence, m } from 'motion/react'
import { AlertTriangle, PackageSearch, RefreshCw } from 'lucide-react'
import { ProductCard } from './ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { spring } from '@/utils/motion'
import { cn } from '@/utils/cn'

/**
 * Responsive ProductGrid with loading skeletons, empty states, and store closed notices.
 */
export function ProductGrid({
  products = [],
  isLoading = false,
  isStoreClosed = false,
  searchQuery = '',
  selectedCategory = 'all',
  onResetFilters,
  className,
}) {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4', className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Store Closed Warning Notice */}
      {isStoreClosed && (
        <div className="flex items-center gap-3 rounded-card border border-warning/30 bg-warning-soft p-4 text-warning">
          <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold">This store is currently closed</p>
            <p className="text-xs text-warning/90 mt-0.5">
              You can browse the catalogue, but new checkout orders cannot be placed until the store opens.
            </p>
          </div>
        </div>
      )}

      {/* Empty States */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface py-16 px-4 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-surface-2 text-ink-subtle">
            <PackageSearch className="size-7" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-ink">No items found</h3>
          <p className="mt-1.5 max-w-sm text-sm text-ink-muted">
            {searchQuery
              ? `We couldn't find any products matching "${searchQuery}". Try checking the spelling or searching another term.`
              : selectedCategory !== 'all'
              ? 'No products available in this category.'
              : 'There are currently no products listed in the catalogue.'}
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onResetFilters}
              className="mt-5 gap-1.5 shadow-1"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" /> Reset filters
            </Button>
          )}
        </div>
      ) : (
        /* Product Items Grid */
        <m.div
          layout
          className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4', className)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {products.map((product) => (
              <m.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={spring.soft}
              >
                <ProductCard product={product} />
              </m.div>
            ))}
          </AnimatePresence>
        </m.div>
      )}
    </div>
  )
}
