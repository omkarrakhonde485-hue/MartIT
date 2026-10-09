import { useLocation, Link } from 'react-router'
import { ShoppingBag, ArrowLeft } from 'lucide-react'
import { OrderConfirmationView } from '@/components/cart/OrderConfirmationView'
import { Button } from '@/components/ui/Button'

export default function OrderConfirmationPage() {
  const location = useLocation()
  const order = location.state?.order

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-surface-2 text-ink-subtle">
          <ShoppingBag className="size-8" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">No Recent Order Found</h1>
        <p className="text-sm text-ink-muted">
          Looking for past orders? You can explore items in the catalogue or check your order history.
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

  return <OrderConfirmationView order={order} />
}
