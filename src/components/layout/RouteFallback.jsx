import { Skeleton } from '@/components/ui/Skeleton'

/** Shown while a code-split route loads. Shaped like a generic page to limit layout shift. */
export function RouteFallback() {
  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:px-6" role="status" aria-label="Loading page">
      <Skeleton className="h-9 w-2/3 max-w-sm" />
      <Skeleton className="h-4 w-1/2 max-w-xs" />
      <Skeleton className="mt-4 h-48 rounded-card" />
    </div>
  )
}
