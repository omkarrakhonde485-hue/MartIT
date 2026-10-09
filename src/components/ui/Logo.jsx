import { cn } from '@/utils/cn'

/**
 * MartIT logo: raster mark (from the supplied logo artwork) + live-text wordmark,
 * so the wordmark adapts to dark mode. Replace /brand/logo-mark.png with an SVG
 * export when the original vector file is available.
 */
export function Logo({ className, markOnly = false, size = 'md' }) {
  const h = size === 'lg' ? 'h-9' : size === 'sm' ? 'h-6' : 'h-7'
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <img src="/brand/logo-mark.png" alt={markOnly ? 'MartIT' : ''} className={cn(h, 'w-auto')} width="351" height="134" decoding="async" />
      {!markOnly && (
        <span
          className={cn(
            'font-display font-extrabold leading-none tracking-[-0.04em]',
            size === 'lg' ? 'text-[28px]' : size === 'sm' ? 'text-lg' : 'text-[22px]',
          )}
        >
          <span className="text-brand-deep">Mart</span>
          <span className="text-fresh-ink italic">IT</span>
        </span>
      )}
    </span>
  )
}
