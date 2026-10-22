import { Store, MapPin, Package, CheckCircle2, Clock, CreditCard, ShieldCheck } from 'lucide-react'
import { Dialog, SheetContent } from '@/components/ui/Dialog'
import { OrderStatusPill, Badge } from '@/components/ui/Badge'
import { Price } from '@/components/ui/Price'
import { formatINR } from '@/utils/currency'
import { SAMPLE_STORES, SAMPLE_DELIVERY_LOCATIONS } from '@/mocks/campus'
import { ORDER_STATUS } from '@/utils/orderMachine'

/**
 * OrderDetailReceipt Component
 * Renders the authoritative itemized receipt, delivery spot, and recorded financial breakdown.
 */
export function OrderDetailReceipt({ order, className }) {
  if (!order) return null

  const store = SAMPLE_STORES.find((s) => s.id === order.storeId)
  const location = SAMPLE_DELIVERY_LOCATIONS.find((l) => l.id === order.locationId)
  const destinationName =
    order.customerDetails?.selectedDestination ||
    order.customerDetails?.deliveryLocation?.selectedDestination ||
    order.customerDetails?.deliveryLocation?.formattedAddress ||
    (location ? location.name : order.locationId) ||
    'Campus Destination'

  const detailedAddress =
    order.customerDetails?.detailedAddress ||
    order.customerDetails?.deliveryLocation?.detailedAddress ||
    ''

  const recipientName = order.customerDetails?.fullName || ''
  const recipientPhone =
    order.customerDetails?.phoneNumber ||
    order.customerDetails?.mobileNumber ||
    ''

  const lines = Array.isArray(order.lines) ? order.lines : []

  // Authoritative recorded pricing fields without recalculation
  const itemSubtotal = order.pricing?.itemSubtotal ?? order.item_subtotal ?? 0
  const deliveryFee =
    order.pricing?.deliveryFee ??
    order.pricing?.combined_delivery_fee ??
    order.combined_delivery_fee ??
    0
  const platformFee =
    order.pricing?.platformFee ??
    order.pricing?.platform_fee ??
    order.platform_fee ??
    0
  const total = order.pricing?.total ?? order.total_payable ?? 0

  const isDelivered = order.status === ORDER_STATUS.DELIVERED
  const verifiedTimestamp = order.handoverVerifiedAt || order.deliveredAt

  return (
    <div className={className} data-testid="order-detail-receipt">
      <div className="space-y-5 pt-2">
        {/* Order Status Badge Row */}
        <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
          <span className="text-xs font-medium text-ink-subtle">Fulfillment Status</span>
          <OrderStatusPill status={order.status} />
        </div>

        {/* Delivery & Store Metadata */}
        <div className="rounded-card border border-line bg-surface-2/60 p-3.5 space-y-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Store className="size-4 text-brand shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-ink-subtle">Fulfillment Store</p>
              <p className="font-semibold text-ink">{store ? store.name : order.storeId}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 border-t border-line/50 pt-2.5">
            <MapPin className="size-4 text-fresh-ink shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-ink-subtle">Delivery Destination</p>
              <p className="font-semibold text-ink">{destinationName}</p>
              {detailedAddress && (
                <p className="text-[11px] text-ink-muted mt-0.5 truncate">{detailedAddress}</p>
              )}
              {(recipientName || recipientPhone) && (
                <p className="text-[11px] text-ink-subtle mt-0.5">
                  {recipientName} {recipientPhone && `(${recipientPhone})`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Lines */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-subtle">
            <span className="flex items-center gap-1.5">
              <Package className="size-3.5" aria-hidden="true" />
              <span>Items ({lines.length})</span>
            </span>
          </div>

          {lines.length === 0 ? (
            <div className="rounded-tile border border-dashed border-line bg-surface-2/40 p-3 text-center text-xs text-ink-muted">
              Item details not recorded.
            </div>
          ) : (
            <div className="divide-y divide-line/60 rounded-card border border-line bg-surface px-3 py-1 shadow-1">
              {lines.map((item, idx) => {
                const unitPrice = Number(item.unitPrice ?? item.unit_price ?? 0)
                const quantity = Number(item.quantity ?? 1)
                const lineSubtotal = Number(
                  item.lineSubtotal ?? item.line_subtotal ?? unitPrice * quantity,
                )

                return (
                  <div
                    key={item.productId || `item-${idx}`}
                    className="flex items-center justify-between py-2 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-ink truncate">{item.name || 'Product item'}</p>
                      <p className="text-[11px] text-ink-subtle">
                        {item.pack && `${item.pack} • `}
                        {formatINR(unitPrice)} × {quantity}
                      </p>
                    </div>
                    <span className="tabular font-semibold text-ink shrink-0">
                      {formatINR(lineSubtotal)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recorded Financial Snapshot */}
        <div className="rounded-card border border-line bg-surface p-3.5 shadow-1 space-y-2 text-xs">
          <div className="flex justify-between text-ink-muted">
            <span>Item Subtotal</span>
            <span className="tabular font-medium text-ink">{formatINR(itemSubtotal)}</span>
          </div>

          <div className="flex justify-between text-ink-muted">
            <span>Delivery Fee</span>
            <span className="tabular font-medium text-ink">{formatINR(deliveryFee)}</span>
          </div>

          {platformFee > 0 && (
            <div className="flex justify-between text-ink-muted">
              <span>Platform Fee</span>
              <span className="tabular font-medium text-ink">{formatINR(platformFee)}</span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-line/60 pt-2 text-sm font-bold">
            <span className="text-ink">Total Amount</span>
            <span className="tabular font-mono text-ink text-base">{formatINR(total)}</span>
          </div>
        </div>

        {/* Handover Verification Notice */}
        {isDelivered && verifiedTimestamp && (
          <div className="flex items-center gap-2 rounded-tile bg-fresh/10 border border-fresh/30 p-3 text-xs text-fresh-ink">
            <CheckCircle2 className="size-4 text-fresh shrink-0" aria-hidden="true" />
            <span>
              Verified delivery on{' '}
              {new Date(verifiedTimestamp).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * OrderDetailDrawer Component
 * Displays complete order receipt inside an accessible slide-over sheet / drawer.
 */
export function OrderDetailDrawer({ order, open, onOpenChange }) {
  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={`Order #${order.id}`}
        description={`Placed on ${new Date(order.createdAt).toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })} at ${new Date(order.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`}
        className="w-full sm:max-w-md"
        data-testid="order-detail-drawer"
      >
        <OrderDetailReceipt order={order} />
      </SheetContent>
    </Dialog>
  )
}

