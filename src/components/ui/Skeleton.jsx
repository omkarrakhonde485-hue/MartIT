import { cn } from '@/utils/cn'

/** Shimmer skeleton — the highlight moves via transform, so it stays on the compositor. */
export function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative overflow-hidden rounded-tile bg-surface-sunk', className)}
      {...props}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/[0.06]" />
    </div>
  )
}

/** Product-card shaped placeholder; its proportions match the real card to avoid layout shift. */
export function ProductCardSkeleton() {
  return (
    <div className="grid gap-3 rounded-card border border-line bg-surface p-3" role="status" aria-label="Loading product">
      <Skeleton className="aspect-square rounded-[14px]" />
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3.5 w-1/3" />
    </div>
  )
}
