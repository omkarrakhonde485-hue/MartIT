import { cn } from '@/utils/cn'

/** Base surface. `interactive` adds a hover lift (transform + shadow only). */
export function Card({ as: Comp = 'div', interactive = false, className, ...props }) {
  return (
    <Comp
      className={cn(
        'rounded-card border border-line bg-surface shadow-1',
        interactive && 'transition-[transform,box-shadow] duration-300 ease-out-soft hover:-translate-y-0.5 hover:shadow-2',
        className,
      )}
      {...props}
    />
  )
}

/**
 * MartIT signature: a receipt stub with a perforated bottom edge and a dashed tear line.
 * Used for order summaries, OTP handover and confirmations.
 */
export function ReceiptCard({ className, children, footer, ...props }) {
  return (
    <div className={cn('drop-shadow-[0_6px_14px_rgb(16_24_20/0.08)]', className)} {...props}>
      <div className="perforated rounded-t-card bg-surface pb-4">
        <div className="p-5">{children}</div>
        {footer && (
          <>
            <div className="mx-5 border-t-2 border-dashed border-line" aria-hidden="true" />
            <div className="p-5 pt-4">{footer}</div>
          </>
        )}
      </div>
    </div>
  )
}
