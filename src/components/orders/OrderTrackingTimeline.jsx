import { CheckCircle2, Clock, AlertCircle, PackageCheck, Bike, Home, Sparkles } from 'lucide-react'
import { ORDER_STATUS } from '@/utils/orderMachine'
import { cn } from '@/utils/cn'

const STEPS = [
  {
    key: ORDER_STATUS.CONFIRMED,
    label: 'Confirmed',
    description: 'Order confirmed & paid',
    icon: Sparkles,
  },
  {
    key: ORDER_STATUS.PREPARING,
    label: 'Preparing',
    description: 'Store is packing items',
    icon: PackageCheck,
  },
  {
    key: ORDER_STATUS.PICKED_UP,
    label: 'Picked Up',
    description: 'Collected by student runner',
    icon: PackageCheck,
  },
  {
    key: ORDER_STATUS.ON_THE_WAY,
    label: 'On The Way',
    description: 'En route to your campus spot',
    icon: Bike,
  },
  {
    key: ORDER_STATUS.DELIVERED,
    label: 'Delivered',
    description: 'Handover complete',
    icon: Home,
  },
]

const STEP_INDEX = {
  [ORDER_STATUS.AWAITING_PAYMENT]: -1,
  [ORDER_STATUS.CONFIRMED]: 0,
  [ORDER_STATUS.PREPARING]: 1,
  [ORDER_STATUS.PICKED_UP]: 2,
  [ORDER_STATUS.ON_THE_WAY]: 3,
  [ORDER_STATUS.DELIVERED]: 4,
}

/**
 * OrderTrackingTimeline Component
 * Renders an accessible, responsive lifecycle timeline based on the canonical order state machine.
 */
export function OrderTrackingTimeline({ status, paymentStatus, className }) {
  // If order was cancelled, render distinct cancellation status notice
  if (status === ORDER_STATUS.CANCELLED) {
    return (
      <div
        data-testid="order-timeline-cancelled"
        className={cn(
          'flex items-center gap-3 rounded-tile border border-danger/30 bg-danger/5 p-3.5 text-xs text-danger',
          className,
        )}
      >
        <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold text-danger">Order Cancelled</p>
          <p className="text-[11px] text-ink-muted mt-0.5">
            This order was cancelled. No delivery handover or runner dispatch is active.
          </p>
        </div>
      </div>
    )
  }

  // If order is awaiting payment
  if (status === ORDER_STATUS.AWAITING_PAYMENT) {
    return (
      <div
        data-testid="order-timeline-awaiting-payment"
        className={cn(
          'flex items-center gap-3 rounded-tile border border-warning/40 bg-warning/5 p-3.5 text-xs text-warning',
          className,
        )}
      >
        <Clock className="size-5 shrink-0 animate-pulse text-warning" aria-hidden="true" />
        <div>
          <p className="font-semibold text-ink">Payment Pending Verification</p>
          <p className="text-[11px] text-ink-muted mt-0.5">
            Complete UPI payment to confirm your order and begin store fulfillment.
          </p>
        </div>
      </div>
    )
  }

  const currentIdx = STEP_INDEX[status] ?? 0
  const isDelivered = status === ORDER_STATUS.DELIVERED

  return (
    <div className={cn('w-full space-y-2 py-1', className)} data-testid="order-tracking-timeline">
      <div className="flex items-center justify-between text-xs text-ink-subtle pb-1">
        <span className="font-semibold text-ink">Delivery Progress</span>
        <span className="font-medium text-[11px]">
          {isDelivered
            ? 'Order complete'
            : `Step ${Math.min(currentIdx + 1, STEPS.length)} of ${STEPS.length}`}
        </span>
      </div>

      <ol
        aria-label="Order fulfillment progress"
        className="grid grid-cols-5 gap-1 sm:gap-2 text-center"
      >
        {STEPS.map((step, idx) => {
          const isCompleted = currentIdx > idx
          const isCurrent = currentIdx === idx
          const isUpcoming = currentIdx < idx
          const StepIcon = step.icon

          return (
            <li
              key={step.key}
              aria-current={isCurrent ? 'step' : undefined}
              className="relative flex flex-col items-center"
            >
              {/* Connector line between steps */}
              {idx > 0 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'absolute top-3.5 sm:top-4 -left-1/2 w-full h-0.5 -z-0 transition-colors',
                    isCompleted || isCurrent ? 'bg-fresh' : 'bg-line',
                  )}
                />
              )}

              {/* Step indicator node */}
              <div
                className={cn(
                  'relative z-10 grid size-7 sm:size-8 place-items-center rounded-full text-xs font-bold transition-all shadow-1 select-none',
                  isCompleted
                    ? 'bg-fresh text-ink-inverse ring-2 ring-fresh/30'
                    : isCurrent
                    ? 'bg-brand text-brand-ink ring-4 ring-brand/25 animate-pulse'
                    : 'bg-surface-2 text-ink-subtle border border-line',
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="size-4 sm:size-4.5" aria-hidden="true" />
                ) : (
                  <StepIcon className="size-3.5 sm:size-4" aria-hidden="true" />
                )}
              </div>

              {/* Step label */}
              <div className="mt-1.5 min-w-0 max-w-[80px]">
                <p
                  className={cn(
                    'truncate text-[10px] sm:text-[11px] leading-tight font-medium',
                    isCompleted
                      ? 'text-ink font-semibold'
                      : isCurrent
                      ? 'text-brand font-bold'
                      : 'text-ink-subtle',
                  )}
                >
                  {step.label}
                </p>
                <p className="hidden md:block truncate text-[9px] text-ink-subtle/80 mt-0.5">
                  {step.description}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
