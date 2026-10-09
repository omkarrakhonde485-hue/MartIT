import { m } from 'motion/react'
import { Badge } from '@/components/ui/Badge'

/**
 * Honest placeholder for routes whose screens arrive in a later build phase.
 * Keeps navigation working (no dead links) without faking content.
 */
export function PhasePlaceholder({ phase, title, children }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <Badge tone="outline" size="md">Built in Phase {phase}</Badge>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-display md:text-5xl">{title}</h1>
      <div className="mt-8 grid max-w-xl place-items-center rounded-sheet border-2 border-dashed border-line-strong px-6 py-14 text-center">
        <m.svg
          viewBox="0 0 64 64"
          className="size-16 text-fresh-ink"
          aria-hidden="true"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M14 22h36l-3 32H17z" fill="currentColor" opacity=".14" />
          <path d="M14 22h36l-3 32H17zM24 22v-4a8 8 0 0 1 16 0v4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        </m.svg>
        <p className="mt-4 text-ink-muted">{children ?? 'This screen is part of a later phase.'}</p>
      </div>
    </section>
  )
}
