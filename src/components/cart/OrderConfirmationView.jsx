import { Link } from 'react-router'
import { CheckCircle2, Clock, MapPin, Store, ArrowRight, Package, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Price } from '@/components/ui/Price'
import { formatINR } from '@/utils/currency'
import { formatDistanceKm } from '@/utils/distance'
import { SAMPLE_STORES } from '@/mocks/campus'
import { useLocations } from '@/hooks/useLocations'

/**
 * OrderConfirmationView displays the authoritative order confirmation
 * immediately following order creation.
 */
export function OrderConfirmationView({ order, onStartNew }) {
  const { data: locations = [] } = useLocations()

  const store = SAMPLE_STORES.find((s) => s.id === order.storeId)
  const location = locations.find((l) => l.id === order.locationId)

  const distanceMethodLabel =
    order.pricing?.distanceMethod === 'straight_line'
      ? 'straight-line distance'
      : order.pricing?.distanceMethod === 'route'
      ? 'route distance'
      : 'distance'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12 space-y-6">
      {/* Success Banner */}
      <div className="rounded-card border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-3">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-fresh text-ink-inverse shadow-2">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Order Created!
          </h1>
          <p className="text-sm text-ink-muted">
            Your order has been recorded and is currently awaiting payment.
          </p>
        </div>

        {/* Order ID & Status Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="rounded-full bg-surface border border-line px-3 py-1 font-mono text-xs font-bold text-ink shadow-1">
            Order #{order.id}
          </span>
          <Badge tone="warning" size="md" className="gap-1 font-semibold">
            <Clock className="size-3.5" aria-hidden="true" />
            <span>Awaiting Payment</span>
          </Badge>
          <Badge tone="info" size="md" className="font-semibold">
            Payment: Pending
          </Badge>
        </div>
      </div>

      {/* Payment Phase 3 Scope Notice */}
      <div className="flex items-start gap-3 rounded-tile border border-sky-500/30 bg-sky-500/5 p-4 text-xs text-ink-muted">
        <ShieldCheck className="size-4 shrink-0 text-sky-500 mt-0.5" aria-hidden="true" />
        <div>
          <strong className="font-semibold text-ink">Payment milestone notice:</strong>{' '}
          Payment collection (UPI QR, verification, and runner assignment) will be enabled in the upcoming milestone. No payment has been charged yet.
        </div>
      </div>

      {/* Order Details & Authoritative Pricing */}
      <div className="rounded-card border border-line bg-surface p-5 sm:p-6 shadow-2 space-y-6">
        <div className="flex items-center justify-between border-b border-line/60 pb-4">
          <h2 className="font-display text-lg font-bold text-ink">Order Summary</h2>
          <span className="text-xs text-ink-subtle">
            Created: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Store & Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-surface-2/60 rounded-card p-3.5 border border-line/60">
          <div className="flex items-start gap-2.5">
            <Store className="size-4 text-brand shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-ink-subtle">Store</p>
              <p className="font-semibold text-ink">{store ? store.name : order.storeId}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="size-4 text-fresh-ink shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-ink-subtle">Delivery Location</p>
              <p className="font-semibold text-ink">{location ? location.name : order.locationId}</p>
            </div>
          </div>
        </div>

        {/* Order Line Items */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-subtle flex items-center gap-1.5">
            <Package className="size-3.5" aria-hidden="true" />
            <span>Items Ordered ({order.lines.length})</span>
          </h3>

          <div className="divide-y divide-line/60 rounded-tile border border-line/60 bg-surface px-4 py-1">
            {order.lines.map((item) => (
              <div key={item.productId} className="flex items-center justify-between py-2.5 text-sm">
                <div className="min-w-0 pr-2">
                  <p className="font-medium text-ink truncate">{item.name}</p>
                  <p className="text-xs text-ink-subtle">
                    {item.pack && `${item.pack} • `}
                    {formatINR(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <span className="tabular font-semibold text-ink shrink-0">
                  {formatINR(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Server Authoritative Pricing Snapshot */}
        <div className="space-y-2.5 pt-2 border-t border-line/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-subtle">
            Authoritative Pricing Snapshot
          </h3>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Item Subtotal</span>
              <span className="tabular font-medium text-ink">
                {formatINR(order.pricing.itemSubtotal)}
              </span>
            </div>

            <div className="flex justify-between text-ink-muted">
              <div>
                <span>Delivery Fee</span>
                {order.pricing.distanceKm != null && (
                  <span className="text-xs text-ink-subtle block">
                    {`(${formatDistanceKm(order.pricing.distanceKm)} km ${distanceMethodLabel})`}
                  </span>
                )}
              </div>
              <span className="tabular font-medium text-ink">
                {formatINR(order.pricing.deliveryFee)}
              </span>
            </div>

            {order.pricing.platformFee != null && (
              <div className="flex justify-between text-ink-muted">
                <span>Platform Fee</span>
                <span className="tabular font-medium text-ink">
                  {formatINR(order.pricing.platformFee)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t border-line font-bold text-base text-ink">
              <span>Total Amount</span>
              <Price amount={order.pricing.total} size="lg" className="text-brand" />
            </div>

            {order.pricing.pricingVersion && (
              <p className="text-[11px] text-ink-subtle text-right pt-0.5">
                Pricing Policy: {order.pricing.pricingVersion}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button asChild variant="primary" size="lg" block className="sm:flex-1">
          <Link to="/app" onClick={onStartNew}>
            <span>Continue Shopping</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>

        <Button asChild variant="secondary" size="lg" block className="sm:w-auto">
          <Link to="/app/orders">
            View All Orders
          </Link>
        </Button>
      </div>
    </div>
  )
}
