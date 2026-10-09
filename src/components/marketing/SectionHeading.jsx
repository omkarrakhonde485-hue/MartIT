import { m } from 'motion/react'
import { cn } from '@/utils/cn'
import { ease } from '@/utils/motion'

/** Eyebrow + display title + optional lede. Reveals once when scrolled into view. */
export function SectionHeading({ id, eyebrow, title, lede, align = 'left', className, invert = false }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.6, ease: ease.outSoft }}
      className={cn(align === 'center' && 'mx-auto text-center', 'max-w-2xl', className)}
    >
      {eyebrow && (
        <p className={cn('font-display text-sm font-semibold uppercase tracking-[0.18em]', invert ? 'text-accent' : 'text-fresh-ink')}>
          {eyebrow}
        </p>
      )}
      <h2 id={id} className="mt-3 font-display text-[clamp(2rem,4.6vw,3.4rem)] font-bold leading-[1] tracking-display">
        {title}
      </h2>
      {lede && <p className={cn('mt-4 text-lg', invert ? 'text-panel-deep-ink/80' : 'text-ink-muted')}>{lede}</p>}
    </m.div>
  )
}
