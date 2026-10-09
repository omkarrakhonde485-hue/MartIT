import { AnimatePresence, m } from 'motion/react'
import { cn } from '@/utils/cn'
import { spring } from '@/utils/motion'

/** Numeric badge that bounces whenever the count changes. Hidden at zero. */
export function CountBadge({ count, className }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <m.span
          key={count}
          aria-hidden="true"
          initial={{ scale: 0.4, y: -4 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={spring.bouncy}
          className={cn(
            'tabular grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-ink',
            className,
          )}
        >
          {count > 99 ? '99+' : count}
        </m.span>
      )}
    </AnimatePresence>
  )
}
