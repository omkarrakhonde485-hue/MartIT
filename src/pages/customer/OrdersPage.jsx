import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  ShoppingBag,
  Store,
  MapPin,
  Clock,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  PackageCheck,
  CreditCard,
  ReceiptText,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { OrderStatusPill } from '@/components/ui/Badge'
import { OrderStatusTabs } from '@/components/orders/OrderStatusTabs'
import { OrderTrackingTimeline } from '@/components/orders/OrderTrackingTimeline'
import { OrderDetailDrawer } from '@/components/orders/OrderDetailDrawer'
import { CustomerDeliveryOtpCard } from '@/components/customer/CustomerDeliveryOtpCard'
import { orderService } from '@/services/orderService'
import { ORDER_STATUS } from '@/utils/orderMachine'
import { formatINR } from '@/utils/currency'
import { SAMPLE_STORES, SAMPLE_DELIVERY_LOCATIONS } from '@/mocks/campus'

export const ACTIVE_STATUSES = [
  ORDER_STATUS.AWAITING_PAYMENT,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.ON_THE_WAY,
]

export const PAST_STATUSES = [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED]

export function computeOrderCounts(orders = []) {
  let active = 0
  let past = 0
  for (const o of orders) {
    if (ACTIVE_STATUSES.includes(o.status)) {
      active++
    } else if (PAST_STATUSES.includes(o.status)) {
      past++
    }
  }
  return { all: orders.length, active, past }
}

export function getOrderRefetchInterval(orders) {
  if (!Array.isArray(orders) || orders.length === 0) return false
  const hasActive = orders.some((o) => ACTIVE_STATUSES.includes(o.status))
  return hasActive ? 5000 : false
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['customer-orders'],
    queryFn: async () => {
      const res = await orderService.listMyOrders()
      return Array.isArray(res) ? res : []
    },
    staleTime: 5000,
    // Poll every 5s while eligible non-terminal orders exist; pause when all orders are terminal
    refetchInterval: (query) => getOrderRefetchInterval(query.state.data),
  })

  // Tab counts
  const counts = useMemo(() => computeOrderCounts(orders), [orders])

  // Filtered orders based on selected tab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'active') {
      return orders.filter((o) => ACTIVE_STATUSES.includes(o.status))
    }
    if (activeTab === 'past') {
      return orders.filter((o) => PAST_STATUSES.includes(o.status))
    }
    return orders
  }, [orders, activeTab])

  const handleOpenDetails = (order) => {
    setSelectedOrder(order)
    setIsDrawerOpen(true)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            My Orders
          </h1>
          <p className="text-xs sm:text-sm text-ink-subtle mt-1">
            Track active deliveries, view receipt summaries, and manage handover verification.
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => refetch()}
          loading={isFetching}
          className="text-xs self-start sm:self-auto gap-1.5"
          aria-label="Refresh orders"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Status Filter Tabs (rendered when orders exist or loaded) */}
      {!isLoading && !isError && orders.length > 0 && (
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <OrderStatusTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={counts}
          />
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4 animate-pulse" data-testid="orders-loading-skeleton">
          <div className="h-44 rounded-card bg-surface-2" />
          <div className="h-44 rounded-card bg-surface-2" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="p-6 text-center border-danger/30 bg-danger/5 space-y-3" data-testid="orders-error-card">
          <p className="font-bold text-danger text-sm">Failed to load order history</p>
          <p className="text-xs text-ink-muted">
            {error?.message || 'Could not retrieve your orders. Please check your connection and try again.'}
          </p>
          <Button size="sm" variant="danger" onClick={() => refetch()} className="gap-1.5 shadow-1">
            <RefreshCw className="size-3.5" aria-hidden="true" />
            <span>Retry</span>
          </Button>
        </Card>
      )}

      {/* Global Empty State: No orders in history at all */}
      {!isLoading && !isError && orders.length === 0 && (
        <div className="mx-auto max-w-md py-16 text-center space-y-4" data-testid="orders-empty-state">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-surface-2 text-ink-subtle">
            <ShoppingBag className="size-8" aria-hidden="true" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink">No Orders Placed Yet</h2>
          <p className="text-sm text-ink-muted">
            You don&apos;t have any past or active campus delivery orders.
          </p>
          <div className="pt-2">
            <Button asChild variant="primary">
              <Link to="/app">
                <span>Start Shopping</span>
                <ArrowRight className="size-4 ml-1.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Tab Contextual Empty State: Tab filtered to 0 items */}
      {!isLoading && !isError && orders.length > 0 && filteredOrders.length === 0 && (
        <div
          className="mx-auto max-w-md py-12 text-center space-y-3 rounded-card border border-dashed border-line bg-surface p-6"
          data-testid="orders-tab-empty-state"
        >
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-surface-2 text-ink-subtle">
            <PackageCheck className="size-6" aria-hidden="true" />
          </div>
          <h3 className="font-display text-base font-bold text-ink">
            {activeTab === 'active' ? 'No Active Deliveries' : 'No Past Orders'}
          </h3>
          <p className="text-xs text-ink-muted">
            {activeTab === 'active'
              ? 'You do not have any orders currently in progress.'
              : 'You have not completed any orders yet.'}
          </p>
          <div className="pt-1 flex justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setActiveTab('all')}>
              <span>View All Orders</span>
            </Button>
            {activeTab === 'active' && (
              <Button asChild size="sm" variant="primary">
                <Link to="/app">
                  <span>Start New Order</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Order Cards List */}
      {!isLoading && !isError && filteredOrders.length > 0 && (
        <div className="space-y-6" data-testid="orders-list">
          {filteredOrders.map((order) => {
            const store = SAMPLE_STORES.find((s) => s.id === order.storeId)
            const location = SAMPLE_DELIVERY_LOCATIONS.find((l) => l.id === order.locationId)
            const destinationName =
              order.customerDetails?.selectedDestination ||
              order.customerDetails?.deliveryLocation?.selectedDestination ||
              order.customerDetails?.deliveryLocation?.formattedAddress ||
              (location ? location.name : order.locationId) ||
              'Campus Destination'

            const isOnTheWay = order.status === ORDER_STATUS.ON_THE_WAY
            const isDelivered = order.status === ORDER_STATUS.DELIVERED
            const isCancelled = order.status === ORDER_STATUS.CANCELLED
            const isPendingPayment =
              order.paymentStatus !== 'PAID' && order.status === ORDER_STATUS.AWAITING_PAYMENT

            const lines = Array.isArray(order.lines) ? order.lines : []
            const totalRecordedAmount = Number(order.pricing?.total ?? order.total_payable ?? 0)

            return (
              <Card
                key={order.id}
                className="p-5 sm:p-6 border-line space-y-4 shadow-1 hover:shadow-2 transition-shadow"
                data-testid={`customer-order-card-${order.id}`}
              >
                {/* Header: Order ID, Status, Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-ink" data-testid={`order-id-${order.id}`}>
                      #{order.id}
                    </span>
                    <span className="text-xs text-ink-subtle flex items-center gap-1">
                      <Clock className="size-3" aria-hidden="true" />
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <OrderStatusPill status={order.status} />
                </div>

                {/* Body: Store, Destination, Items summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2 text-ink-muted">
                    <Store className="size-4 text-brand shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{store ? store.name : order.storeId}</p>
                      <p className="text-[11px] text-ink-subtle truncate">
                        {lines.map((l) => `${l.quantity}× ${l.name}`).join(', ') || 'Campus products'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-ink-muted">
                    <MapPin className="size-4 text-fresh-ink shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{destinationName}</p>
                      {order.customerDetails?.detailedAddress && (
                        <p className="text-[11px] text-ink-subtle truncate">
                          {order.customerDetails.detailedAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Timeline for non-delivered, non-cancelled orders OR cancelled status */}
                {(!isDelivered || isCancelled) && (
                  <div className="pt-1 border-t border-line/40">
                    <OrderTrackingTimeline
                      status={order.status}
                      paymentStatus={order.paymentStatus}
                    />
                  </div>
                )}

                {/* Total and Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/40 text-xs">
                  <span className="text-ink-muted">
                    Total Amount:{' '}
                    <strong className="text-ink font-bold font-mono">
                      {formatINR(totalRecordedAmount)}
                    </strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenDetails(order)}
                      className="text-xs font-semibold gap-1.5"
                      aria-label={`View receipt and details for order #${order.id}`}
                    >
                      <ReceiptText className="size-3.5" aria-hidden="true" />
                      <span>View Details</span>
                    </Button>

                    {isPendingPayment && (
                      <Button asChild size="sm" variant="primary" className="text-xs font-semibold">
                        <Link to={`/app/payment?orderId=${order.id}`} state={{ order }}>
                          <CreditCard className="size-3.5 mr-1" aria-hidden="true" />
                          <span>Pay Now</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Handover OTP Verification Panel for ON_THE_WAY orders */}
                {isOnTheWay && (
                  <div className="pt-2">
                    <CustomerDeliveryOtpCard orderId={order.id} />
                  </div>
                )}

                {/* Delivered confirmation with real timestamp if available */}
                {isDelivered && (
                  <div
                    className="flex items-center gap-2 rounded-tile bg-fresh/10 border border-fresh/30 p-3 text-xs text-fresh-ink"
                    data-testid={`delivered-banner-${order.id}`}
                  >
                    <CheckCircle2 className="size-4 text-fresh shrink-0" aria-hidden="true" />
                    <div>
                      <strong className="font-bold">Delivered Successfully!</strong>
                      <span className="text-ink-muted block text-[11px]">
                        Order was handed over and verified via secure delivery OTP.
                        {order.handoverVerifiedAt &&
                          ` Verified at ${new Date(order.handoverVerifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`}
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Detailed Receipt Drawer / Modal */}
      <OrderDetailDrawer
        order={selectedOrder}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  )
}
