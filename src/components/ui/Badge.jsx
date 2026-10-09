import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { ORDER_STATUS, ORDER_STATUS_LABEL } from '@/utils/orderMachine'
import { PAYMENT_STATUS, PAYMENT_STATUS_LABEL } from '@/utils/paymentMachine'

const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap', {
  variants: {
    tone: {
      neutral: 'bg-surface-2 text-ink-muted',
      brand: 'bg-brand-soft text-fresh-ink',
      accent: 'bg-accent text-accent-ink',
      warning: 'bg-warning-soft text-warning',
      danger: 'bg-danger-soft text-danger',
      info: 'bg-info-soft text-info',
      outline: 'border border-line-strong text-ink-muted',
    },
    size: {
      sm: 'h-6 px-2.5 text-xs',
      md: 'h-7 px-3 text-[13px]',
    },
  },
  defaultVariants: { tone: 'neutral', size: 'sm' },
})

export function Badge({ tone, size, className, ...props }) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />
}

/** Dot that pulses (transform/opacity) while a state is live. */
export function LiveDot({ live = true, className }) {
  return (
    <span className={cn('relative inline-flex size-2', className)} aria-hidden="true">
      {live && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-current" />}
      <span className="relative size-2 rounded-full bg-current" />
    </span>
  )
}

const ORDER_TONE = {
  [ORDER_STATUS.AWAITING_PAYMENT]: 'warning',
  [ORDER_STATUS.CONFIRMED]: 'info',
  [ORDER_STATUS.PREPARING]: 'info',
  [ORDER_STATUS.PICKED_UP]: 'brand',
  [ORDER_STATUS.ON_THE_WAY]: 'brand',
  [ORDER_STATUS.DELIVERED]: 'neutral',
  [ORDER_STATUS.CANCELLED]: 'danger',
}
const ORDER_LIVE = new Set([ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.PICKED_UP, ORDER_STATUS.ON_THE_WAY])

export function OrderStatusPill({ status, className }) {
  return (
    <Badge tone={ORDER_TONE[status]} size="md" className={className}>
      <LiveDot live={ORDER_LIVE.has(status)} />
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  )
}

const PAYMENT_TONE = {
  [PAYMENT_STATUS.PENDING]: 'warning',
  [PAYMENT_STATUS.PROCESSING]: 'info',
  [PAYMENT_STATUS.PAID]: 'brand',
  [PAYMENT_STATUS.FAILED]: 'danger',
  [PAYMENT_STATUS.EXPIRED]: 'neutral',
}

export function PaymentStatusPill({ status, className }) {
  const live = status === PAYMENT_STATUS.PENDING || status === PAYMENT_STATUS.PROCESSING
  return (
    <Badge tone={PAYMENT_TONE[status]} size="md" className={className}>
      <LiveDot live={live} />
      {PAYMENT_STATUS_LABEL[status]}
    </Badge>
  )
}
