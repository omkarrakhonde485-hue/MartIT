import { formatINR } from '@/utils/currency'
import { cn } from '@/utils/cn'

/** ₹ amount with tabular figures. Shows MRP struck through only when it's higher. */
export function Price({ amount, mrp, className, size = 'md' }) {
  const showMrp = typeof mrp === 'number' && mrp > amount
  return (
    <span className={cn('tabular inline-flex items-baseline gap-1.5', className)}>
      <span className={cn('font-semibold text-ink', size === 'lg' ? 'text-2xl font-display' : size === 'sm' ? 'text-sm' : 'text-base')}>
        {formatINR(amount)}
      </span>
      {showMrp && (
        <span className="text-[13px] text-ink-subtle line-through">
          <span className="sr-only">MRP </span>
          {formatINR(mrp)}
        </span>
      )}
    </span>
  )
}
