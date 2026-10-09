import { Switch as S } from 'radix-ui'
import { cn } from '@/utils/cn'

/** Radix Switch. The thumb moves with transform and a slight overshoot. */
export function Switch({ className, ...props }) {
  return (
    <S.Root
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-transparent',
        'bg-line-strong transition-colors duration-200 data-[state=checked]:bg-brand',
        'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <S.Thumb className="block size-6 translate-x-0.5 rounded-full bg-white shadow-1 transition-transform duration-300 ease-spring data-[state=checked]:translate-x-[22px]" />
    </S.Root>
  )
}
