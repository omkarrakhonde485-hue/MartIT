import { AnimatePresence, m } from 'motion/react'
import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import { cn } from '@/utils/cn'
import { useHydrated } from '@/hooks/useHydrated'

export function ThemeToggle({ className }) {
  const { theme: storedTheme, setTheme } = useThemeStore()
  const theme = useHydrated() ? storedTheme : 'light' // matches pre-rendered HTML until hydrated
  const next = theme === 'dark' ? 'light' : 'dark'
  const Icon = theme === 'dark' ? Moon : Sun

  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setTheme(next, { x: r.left + r.width / 2, y: r.top + r.height / 2 })
      }}
      aria-label={`Switch to ${next} mode`}
      className={cn(
        'relative grid size-10 place-items-center overflow-hidden rounded-full text-ink transition-colors hover:bg-surface-2',
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span
          key={theme}
          initial={{ y: 16, rotate: -45, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -16, rotate: 45, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          className="grid place-items-center"
        >
          <Icon className="size-[19px]" aria-hidden="true" />
        </m.span>
      </AnimatePresence>
    </button>
  )
}
