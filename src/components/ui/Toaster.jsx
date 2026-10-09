import { Toaster as Sonner } from 'sonner'
import { useThemeStore } from '@/stores/themeStore'

export { toast } from 'sonner'

export function Toaster() {
  const theme = useThemeStore((s) => s.theme)
  return (
    <Sonner
      theme={theme}
      position="top-center"
      offset={16}
      mobileOffset={{ top: 12 }}
      toastOptions={{
        classNames: {
          toast: '!rounded-card !border-line !bg-surface !text-ink !shadow-2 !font-sans',
          description: '!text-ink-muted',
          actionButton: '!bg-brand !text-brand-ink !rounded-[10px]',
        },
      }}
    />
  )
}
