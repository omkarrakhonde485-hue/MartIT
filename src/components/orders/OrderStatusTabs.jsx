import { Clock, CheckCircle2, ListFilter } from 'lucide-react'
import { cn } from '@/utils/cn'

export const ORDER_TABS = [
  { id: 'all', label: 'All Orders', icon: ListFilter },
  { id: 'active', label: 'Active Deliveries', icon: Clock },
  { id: 'past', label: 'Past Orders', icon: CheckCircle2 },
]

/**
 * OrderStatusTabs Component
 * Segmented filter tabs for customer order list.
 */
export function OrderStatusTabs({
  activeTab = 'all',
  onTabChange,
  counts = { all: 0, active: 0, past: 0 },
  className,
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter orders by status"
      className={cn(
        'inline-flex items-center gap-1 rounded-card border border-line bg-surface-2 p-1 text-xs select-none',
        className,
      )}
      data-testid="order-status-tabs"
    >
      {ORDER_TABS.map((tab) => {
        const isSelected = activeTab === tab.id
        const count = counts[tab.id] ?? 0
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`order-tab-${tab.id}`}
            aria-selected={isSelected}
            aria-controls={`order-panel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'group relative flex items-center gap-1.5 rounded-tile px-3 py-1.5 font-medium transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
              isSelected
                ? 'bg-surface text-ink font-semibold shadow-1'
                : 'text-ink-muted hover:text-ink hover:bg-surface/50',
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{tab.label}</span>
            <span
              className={cn(
                'tabular min-w-4.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold text-center transition-colors',
                isSelected
                  ? 'bg-brand-soft text-fresh-ink'
                  : 'bg-surface/80 text-ink-subtle group-hover:bg-surface group-hover:text-ink',
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
