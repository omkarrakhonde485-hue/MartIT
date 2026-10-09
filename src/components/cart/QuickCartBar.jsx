import { useMemo } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, m } from 'motion/react'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { useCartStore, selectCartCount } from '@/stores/cartStore'
import { Price } from '@/components/ui/Price'
import { SAMPLE_PRODUCTS } from '@/mocks/catalogue'
import { spring } from '@/utils/motion'
import { cn } from '@/utils/cn'

/**
 * Floating quick cart bar displayed at the bottom of the catalogue when items are in the cart.
 */
export function QuickCartBar({ className }) {
  const lines = useCartStore((s) => s.lines)
  const cartCount = useCartStore(selectCartCount)

  // Calculate cart subtotal from current catalogue
  const subtotal = useMemo(() => {
    return lines.reduce((sum, line) => {
      const product = SAMPLE_PRODUCTS.find((p) => p.id === line.productId)
      const unitPrice = product?.price || 0
      return sum + unitPrice * line.quantity
    }, 0)
  }, [lines])

  return (
    <AnimatePresence>
      {cartCount > 0 && (
        <m.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={spring.snappy}
          className={cn(
            'fixed inset-x-4 bottom-20 md:bottom-6 z-30 mx-auto max-w-xl',
            className,
          )}
        >
          <div className="flex items-center justify-between gap-4 rounded-card bg-panel-deep p-3.5 sm:px-5 sm:py-4 text-panel-deep-ink shadow-3 border border-brand/40 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-white/15 text-fresh">
                <ShoppingBag className="size-5" aria-hidden="true" />
                <span className="absolute -top-1 -right-1 grid min-w-4.5 h-4.5 place-items-center rounded-full bg-fresh px-1 text-[10px] font-bold text-ink">
                  {cartCount}
                </span>
              </span>

              <div className="min-w-0">
                <p className="text-xs font-medium text-emerald-200/90">
                  {cartCount} item{cartCount === 1 ? '' : 's'} added
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xs text-emerald-100">Subtotal:</span>
                  <Price amount={subtotal} size="md" className="text-white [&_span]:text-white" />
                </div>
              </div>
            </div>

            <Link
              to="/app/cart"
              className={cn(
                'inline-flex items-center gap-2 rounded-tile bg-fresh px-4 py-2.5 text-sm font-bold text-ink-inverse shadow-1',
                'transition-transform duration-200 hover:scale-105 active:scale-95 shrink-0 select-none',
              )}
            >
              <span>View Cart</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
