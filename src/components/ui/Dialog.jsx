import { Dialog as D } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

// Radix Dialog (focus trap, Esc, aria) with CSS data-state animations. Pattern after shadcn/ui Dialog & Sheet.

export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close

function Overlay() {
  return (
    <D.Overlay className="fixed inset-0 z-50 bg-[rgb(8_14_11/0.48)] backdrop-blur-[2px] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
  )
}

function CloseButton() {
  return (
    <D.Close
      className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
      aria-label="Close"
    >
      <X className="size-[18px]" aria-hidden="true" />
    </D.Close>
  )
}

export function DialogContent({ title, description, className, children, ...props }) {
  return (
    <D.Portal>
      <Overlay />
      <D.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2',
          'rounded-sheet border border-line bg-surface p-6 shadow-3 focus:outline-none',
          'data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out',
          className,
        )}
        {...props}
      >
        <D.Title className="pr-8 font-display text-xl font-semibold tracking-tight">{title}</D.Title>
        {description ? (
          <D.Description className="mt-1.5 text-sm text-ink-muted">{description}</D.Description>
        ) : (
          <D.Description className="sr-only">{title}</D.Description>
        )}
        <div className="mt-5">{children}</div>
        <CloseButton />
      </D.Content>
    </D.Portal>
  )
}

/**
 * Sheet: bottom sheet on mobile, right-side panel from `md` up.
 */
export function SheetContent({ title, description, side = 'responsive', className, children, ...props }) {
  const sideClass =
    side === 'right'
      ? 'inset-y-0 right-0 h-full w-[min(420px,100%)] rounded-l-sheet data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out'
      : [
          'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-sheet data-[state=open]:animate-sheet-up data-[state=closed]:animate-sheet-down',
          'md:inset-x-auto md:inset-y-0 md:right-0 md:max-h-none md:h-full md:w-[420px] md:rounded-t-none md:rounded-l-sheet',
          'md:data-[state=open]:animate-sheet-in md:data-[state=closed]:animate-sheet-out',
        ].join(' ')
  return (
    <D.Portal>
      <Overlay />
      <D.Content
        className={cn('fixed z-50 flex flex-col border border-line bg-surface shadow-3 focus:outline-none', sideClass, className)}
        data-lenis-prevent
        {...props}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong md:hidden" aria-hidden="true" />
        <div className="px-6 pb-2 pt-5">
          <D.Title className="pr-8 font-display text-xl font-semibold tracking-tight">{title}</D.Title>
          {description ? (
            <D.Description className="mt-1 text-sm text-ink-muted">{description}</D.Description>
          ) : (
            <D.Description className="sr-only">{title}</D.Description>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-[max(24px,env(safe-area-inset-bottom))]">{children}</div>
        <CloseButton />
      </D.Content>
    </D.Portal>
  )
}
