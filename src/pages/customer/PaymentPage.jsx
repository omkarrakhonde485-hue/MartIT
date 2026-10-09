import { useState, useEffect } from 'react'
import { useLocation, useSearchParams, Link } from 'react-router'
import { ShoppingBag, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react'
import { orderService } from '@/services/orderService'
import { CustomerPaymentView } from '@/components/payment/CustomerPaymentView'
import { Button } from '@/components/ui/Button'

export default function PaymentPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const orderFromState = location.state?.order
  const orderId = searchParams.get('orderId') || orderFromState?.id

  const [order, setOrder] = useState(orderFromState || null)
  const [isLoading, setIsLoading] = useState(!orderFromState && Boolean(orderId))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!orderId) return

    // If we already have the order from navigation state, fetch fresh authoritative status
    let isCurrent = true
    setIsLoading(!order)

    orderService
      .get(orderId)
      .then((data) => {
        if (isCurrent) {
          setOrder(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (isCurrent && !order) {
          setError(err.message || 'Unable to retrieve order details.')
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [orderId])

  // 1. Missing Order Reference
  if (!orderId) {
    return (
      <div
        data-testid="payment-missing-order-view"
        className="mx-auto max-w-md px-4 py-16 text-center space-y-4"
      >
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-surface-2 text-ink-subtle border border-line shadow-1">
          <ShoppingBag className="size-8" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">Missing Order Reference</h1>
        <p className="text-sm text-ink-muted">
          No order reference was provided in the payment request. Please return to your cart or select an order from your history.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
          <Button asChild variant="primary">
            <Link to="/app">
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>Back to Shopping</span>
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/app/orders">
              <span>View Orders</span>
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // 2. Loading State
  if (isLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center space-y-3">
        <RefreshCw className="size-8 animate-spin mx-auto text-brand" aria-hidden="true" />
        <h2 className="font-display text-lg font-semibold text-ink">Loading Payment Details</h2>
        <p className="text-xs text-ink-subtle">
          Fetching authoritative pricing and payment status for order #{orderId}...
        </p>
      </div>
    )
  }

  // 3. Error / Order Not Found
  if (error || !order) {
    return (
      <div
        data-testid="payment-error-view"
        className="mx-auto max-w-md px-4 py-16 text-center space-y-4"
      >
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-red-500/10 text-danger border border-red-500/20">
          <AlertCircle className="size-8" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">Order Not Found</h1>
        <p className="text-sm text-ink-muted">
          {error || `We could not find an active order matching reference "${orderId}".`}
        </p>
        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
          <Button asChild variant="primary">
            <Link to="/app">
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>Back to Shopping</span>
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/app/orders">
              <span>View Orders</span>
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // 4. Render Customer Payment Screen
  return <CustomerPaymentView initialOrder={order} onOrderUpdate={setOrder} />
}
