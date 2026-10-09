import { lazy, Suspense } from 'react'
import { Hero } from '@/components/marketing/Hero'
import { whenIdle } from '@/utils/idle'
import { useHydrated } from '@/hooks/useHydrated'

const loadBelowTheFold = () => import('./BelowTheFold')
const BelowTheFold = lazy(loadBelowTheFold)
whenIdle(loadBelowTheFold)

/**
 * Landing page. Each section has its own layout and motion idea:
 * kinetic hero · strike-through ledger · pinned scroll story · spotlight bento ·
 * magnetic filter grid · sticky trust list · beam loop · accordion · peeking CTA.
 * Only the hero ships in the first bundle; the rest streams in while idle.
 */
export function LandingPage() {
  // Lazy content isn't part of the pre-rendered HTML; mount it once hydrated.
  const hydrated = useHydrated()
  // min height keeps the footer from flashing up while the chunk loads
  const placeholder = <div className="min-h-dvh" aria-hidden="true" />
  return (
    <>
      <Hero />
      {hydrated ? (
        <Suspense fallback={placeholder}>
          <BelowTheFold />
        </Suspense>
      ) : (
        placeholder
      )}
    </>
  )
}
