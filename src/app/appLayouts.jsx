import { AppHeader } from '@/components/layout/AppHeader'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { PageTransition } from '@/components/layout/PageTransition'

// Signed-in shells live in their own chunk so the public landing page doesn't download them.

export function CustomerLayout() {
  return (
    <>
      <AppHeader variant="customer" />
      {/* bottom padding clears the mobile bottom nav */}
      <main id="main" className="pb-24 md:pb-10">
        <PageTransition />
      </main>
      <MobileBottomNav />
    </>
  )
}

export function RunnerLayout() {
  return (
    <>
      <AppHeader variant="runner" />
      <main id="main" className="pb-10">
        <PageTransition />
      </main>
    </>
  )
}
