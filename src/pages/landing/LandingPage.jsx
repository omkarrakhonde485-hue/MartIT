import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge, OrderStatusPill } from '@/components/ui/Badge'
import { ReceiptCard } from '@/components/ui/Card'
import { ORDER_STATUS } from '@/utils/orderMachine'

const SECTIONS = [
  { id: 'how-it-works', title: 'How it works' },
  { id: 'categories', title: 'Categories' },
  { id: 'about', title: 'About MartIT' },
  { id: 'faq', title: 'FAQ' },
]

/**
 * Phase 1 shell of the landing page: real hero copy and the section anchors the
 * navbar links to. The full landing experience is built in Phase 2.
 */
export function LandingPage() {
  return (
    <>
      <div className="px-4 pt-4 md:px-6">
      <section className="grain mx-auto grid max-w-6xl items-center gap-12 overflow-hidden rounded-sheet border border-line bg-surface-2 px-5 py-12 md:grid-cols-[1.25fr_1fr] md:px-12 md:py-20">
        <div>
          <Badge tone="brand" size="md">For campuses, hostels &amp; residential societies</Badge>
          <h1 className="mt-5 font-display text-[clamp(2.75rem,7vw,5rem)] font-bold leading-[0.95] tracking-display">
            Your Campus.
            <br />
            Your Essentials.
            <br />
            <span className="text-fresh-ink">Delivered.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-ink-muted">
            Order groceries and daily essentials, pay by UPI, and get them from a student runner — handed over with a one-time code.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="accent" size="lg">
              <Link to="/signup">
                Get Started <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/#how-it-works">How it works</Link>
            </Button>
          </div>
        </div>

        <ReceiptCard
          className="mx-auto w-full max-w-sm rotate-[1.5deg]"
          footer={
            <p className="text-[13px] text-ink-subtle">
              Sample order — illustrates the live status card coming in Phase 2.
            </p>
          }
        >
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-semibold">Order #SAMPLE</p>
            <OrderStatusPill status={ORDER_STATUS.ON_THE_WAY} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">Hostel B, Block 3 · 3 items</p>
        </ReceiptCard>
      </section>
      </div>

      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 md:px-6">
          <h2 id={`${s.id}-title`} className="font-display text-3xl font-bold tracking-display md:text-4xl">
            {s.title}
          </h2>
          <p className="mt-3 text-ink-subtle">This section is designed and built in Phase 2.</p>
        </section>
      ))}
    </>
  )
}
