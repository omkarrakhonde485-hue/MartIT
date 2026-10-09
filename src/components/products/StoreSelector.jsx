import { Store, ChevronDown, Check, Clock, AlertCircle } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

/**
 * StoreSelector dropdown allowing customers to choose between available campus stores.
 */
export function StoreSelector({
  stores = [],
  selectedStoreId,
  onSelectStore,
  className,
}) {
  const activeStore = stores.find((s) => s.id === selectedStoreId) || stores[0]

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          'group flex h-11 items-center justify-between gap-2.5 rounded-tile border border-line-strong bg-surface px-3.5 shadow-1 transition-all',
          'hover:border-ink-subtle hover:bg-surface-2 focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] select-none',
          className,
        )}
        aria-label="Select store"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-brand-soft text-fresh-ink">
            <Store className="size-4" aria-hidden="true" />
          </span>
          <div className="text-left min-w-0">
            <p className="truncate text-xs font-medium text-ink-subtle leading-none">Store</p>
            <p className="truncate text-sm font-semibold text-ink leading-tight mt-0.5">
              {activeStore ? activeStore.name : 'Loading stores...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {activeStore && (
            <Badge tone={activeStore.isOpen ? 'brand' : 'danger'} size="sm">
              {activeStore.isOpen ? 'Open' : 'Closed'}
            </Badge>
          )}
          <ChevronDown className="size-4 text-ink-subtle transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
        </div>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 min-w-64 max-w-sm rounded-card border border-line bg-surface p-1.5 shadow-2 data-[state=open]:animate-fade-in"
        >
          <div className="px-3 py-2 border-b border-line/60">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-subtle">Campus Stores</p>
            <p className="text-xs text-ink-muted mt-0.5">Select a store to view its local inventory.</p>
          </div>

          <div className="py-1 space-y-0.5">
            {stores.map((store) => {
              const isSelected = store.id === selectedStoreId
              return (
                <DropdownMenu.Item
                  key={store.id}
                  onSelect={() => onSelectStore(store.id)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-tile px-3 py-2.5 text-sm cursor-pointer outline-none transition-colors',
                    isSelected ? 'bg-brand-soft text-brand-ink' : 'data-[highlighted]:bg-surface-2',
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Store className={cn('size-4 shrink-0', isSelected ? 'text-fresh-ink' : 'text-ink-subtle')} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className={cn('truncate font-medium', isSelected && 'font-bold text-ink')}>
                        {store.name}
                      </p>
                      <p className="text-xs text-ink-subtle flex items-center gap-1 mt-0.5">
                        {store.isOpen ? (
                          <span className="text-fresh-ink flex items-center gap-0.5">
                            <Clock className="size-3" /> Ready for delivery
                          </span>
                        ) : (
                          <span className="text-danger flex items-center gap-0.5">
                            <AlertCircle className="size-3" /> Closed
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && <Check className="size-4 text-fresh-ink" aria-hidden="true" />}
                  </div>
                </DropdownMenu.Item>
              )
            })}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
