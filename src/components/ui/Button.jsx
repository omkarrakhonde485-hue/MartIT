import { Slot } from 'radix-ui'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { Spinner } from './Spinner'

// Variant API follows shadcn/ui's Button (https://ui.shadcn.com/docs/components/button), restyled for MartIT.
export const buttonVariants = cva(
  [
    'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium',
    'transition-[background-color,color,box-shadow,transform] duration-200 ease-out-soft',
    'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-ink shadow-1 hover:bg-brand-hover',
        accent: 'bg-accent text-accent-ink shadow-1 hover:bg-accent-hover',
        secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-2',
        ghost: 'text-ink hover:bg-surface-2',
        danger: 'bg-danger text-white hover:opacity-90 dark:text-ink-inverse',
        link: 'text-fresh-ink underline-offset-4 hover:underline px-0! h-auto!',
      },
      size: {
        sm: 'h-9 rounded-tile px-3.5 text-sm',
        md: 'h-11 rounded-tile px-5 text-[15px]',
        lg: 'h-14 rounded-card px-7 text-base',
        icon: 'size-11 rounded-tile',
        'icon-sm': 'size-9 rounded-tile',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

/**
 * @param {{ loading?: boolean, asChild?: boolean } & import('react').ButtonHTMLAttributes<HTMLButtonElement>} props
 * `loading` keeps the button's width (label is hidden, not removed) so nothing shifts.
 */
export function Button({ className, variant, size, block, asChild = false, loading = false, disabled, children, ...props }) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      data-cursor="hover"
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          <span className={cn('inline-flex items-center gap-2', loading && 'invisible')}>{children}</span>
          {loading && (
            <span className="absolute inset-0 grid place-items-center">
              <Spinner className="size-5" />
              <span className="sr-only">Loading</span>
            </span>
          )}
        </>
      )}
    </Comp>
  )
}
