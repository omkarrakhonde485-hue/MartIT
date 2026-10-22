import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrdersPage, {
  ACTIVE_STATUSES,
  PAST_STATUSES,
  computeOrderCounts,
  getOrderRefetchInterval,
} from '@/pages/customer/OrdersPage'
import { OrderTrackingTimeline } from '@/components/orders/OrderTrackingTimeline'
import { OrderStatusTabs, ORDER_TABS } from '@/components/orders/OrderStatusTabs'
import { OrderDetailReceipt } from '@/components/orders/OrderDetailDrawer'
import { ORDER_STATUS } from '@/utils/orderMachine'
import { PAYMENT_STATUS } from '@/utils/paymentMachine'
import { orderService } from '@/services/orderService'

// Sample test orders representing various lifecycle stages
const MOCK_CONFIRMED_ORDER = {
  id: 'ord_test_confirmed_1',
  customerId: 'u_customer_1',
  storeId: 'store_campus_mart',
  locationId: 'loc_hostel_a',
  status: ORDER_STATUS.CONFIRMED,
  paymentStatus: PAYMENT_STATUS.PAID,
  lines: [
    { productId: 'p_milk_500', name: 'Toned Milk', pack: '500 ml', unitPrice: 28, quantity: 2, lineSubtotal: 56 },
    { productId: 'p_bread', name: 'Whole Wheat Bread', pack: '400 g', unitPrice: 45, quantity: 1, lineSubtotal: 45 },
  ],
  customerDetails: {
    fullName: 'Aarav Patel',
    phoneNumber: '9876543210',
    selectedDestination: 'A Block',
    detailedAddress: 'Room 204, 2nd Floor',
  },
  pricing: {
    itemSubtotal: 101,
    deliveryFee: 10,
    platformFee: 0.12,
    total: 111.12,
  },
  createdAt: '2026-10-22T10:00:00.000Z',
}

const MOCK_AWAITING_PAYMENT_ORDER = {
  id: 'ord_test_pending_2',
  customerId: 'u_customer_1',
  storeId: 'store_campus_mart',
  locationId: 'loc_hostel_b',
  status: ORDER_STATUS.AWAITING_PAYMENT,
  paymentStatus: PAYMENT_STATUS.PENDING,
  lines: [
    { productId: 'p_chips', name: 'Salted Chips', pack: '50 g', unitPrice: 20, quantity: 1, lineSubtotal: 20 },
  ],
  customerDetails: {
    fullName: 'Aarav Patel',
    phoneNumber: '9876543210',
    selectedDestination: 'B Block',
    detailedAddress: 'Room 101',
  },
  pricing: {
    itemSubtotal: 20,
    deliveryFee: 10,
    platformFee: 0.05,
    total: 30.05,
  },
  createdAt: '2026-10-22T10:15:00.000Z',
}

const MOCK_ON_THE_WAY_ORDER = {
  id: 'ord_test_transit_3',
  customerId: 'u_customer_1',
  storeId: 'store_night_canteen',
  locationId: 'loc_library',
  status: ORDER_STATUS.ON_THE_WAY,
  paymentStatus: PAYMENT_STATUS.PAID,
  lines: [
    { productId: 'p_noodles', name: 'Cheese Maggi', pack: 'Single', unitPrice: 65, quantity: 1, lineSubtotal: 65 },
  ],
  customerDetails: {
    fullName: 'Aarav Patel',
    phoneNumber: '9876543210',
    selectedDestination: 'Central Library',
    detailedAddress: 'Reading Hall Desk 4',
  },
  pricing: {
    itemSubtotal: 65,
    deliveryFee: 15,
    platformFee: 0.25,
    total: 80.25,
  },
  createdAt: '2026-10-22T10:20:00.000Z',
}

const MOCK_DELIVERED_ORDER = {
  id: 'ord_test_delivered_4',
  customerId: 'u_customer_1',
  storeId: 'store_campus_mart',
  locationId: 'loc_hostel_a',
  status: ORDER_STATUS.DELIVERED,
  paymentStatus: PAYMENT_STATUS.PAID,
  lines: [
    { productId: 'p_water', name: 'Mineral Water', pack: '1 L', unitPrice: 20, quantity: 2, lineSubtotal: 40 },
  ],
  customerDetails: {
    fullName: 'Aarav Patel',
    phoneNumber: '9876543210',
    selectedDestination: 'A Block',
    detailedAddress: 'Room 204',
  },
  pricing: {
    itemSubtotal: 40,
    deliveryFee: 10,
    platformFee: 0.1,
    total: 50.1,
  },
  handoverVerifiedAt: '2026-10-22T10:45:00.000Z',
  createdAt: '2026-10-22T09:30:00.000Z',
}

const MOCK_CANCELLED_ORDER = {
  id: 'ord_test_cancelled_5',
  customerId: 'u_customer_1',
  storeId: 'store_campus_mart',
  locationId: 'loc_hostel_a',
  status: ORDER_STATUS.CANCELLED,
  paymentStatus: PAYMENT_STATUS.EXPIRED,
  lines: [
    { productId: 'p_coffee', name: 'Cold Coffee', pack: '200 ml', unitPrice: 40, quantity: 1, lineSubtotal: 40 },
  ],
  customerDetails: {
    fullName: 'Aarav Patel',
    phoneNumber: '9876543210',
    selectedDestination: 'A Block',
  },
  pricing: {
    itemSubtotal: 40,
    deliveryFee: 10,
    platformFee: 0.1,
    total: 50.1,
  },
  createdAt: '2026-10-22T08:00:00.000Z',
}

function renderWithProviders(ui, { queryClient } = {}) {
  const client =
    queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    })

  return renderToString(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Customer Orders Page & Order Tracking Milestone', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // 1. Loading, Error & Retry, and Contextual Empty States
  describe('Page States (Loading, Error, Empty)', () => {
    it('renders loading skeleton when query is executing', () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      // Query is in loading state
      queryClient.setQueryDefaults(['customer-orders'], {
        queryFn: () => new Promise(() => {}),
      })

      const html = renderWithProviders(<OrdersPage />, { queryClient })

      expect(html).toContain('data-testid="orders-loading-skeleton"')
      expect(html).toContain('My Orders')
      expect(html).toContain('Track active deliveries')
    })

    it('renders error card with retry button when query fails', () => {
      const queryClient = new QueryClient()
      queryClient.setQueryDefaults(['customer-orders'], { enabled: false })
      const options = queryClient.defaultQueryOptions({ queryKey: ['customer-orders'] })
      const query = queryClient.getQueryCache().build(queryClient, options)
      query.setState({
        status: 'error',
        error: new Error('Network error connecting to order service'),
        fetchStatus: 'idle',
        errorUpdatedAt: Date.now(),
      })

      const html = renderWithProviders(<OrdersPage />, { queryClient })

      expect(html).toContain('data-testid="orders-error-card"')
      expect(html).toContain('Failed to load order history')
      expect(html).toContain('Network error connecting to order service')
      expect(html).toContain('Retry')
    })

    it('renders global empty state when order history is completely empty', () => {
      const queryClient = new QueryClient()
      queryClient.setQueryData(['customer-orders'], [])

      const html = renderWithProviders(<OrdersPage />, { queryClient })

      expect(html).toContain('data-testid="orders-empty-state"')
      expect(html).toContain('No Orders Placed Yet')
      expect(html).toContain('Start Shopping')
      expect(html).toContain('href="/app"')
    })

    it('renders order cards and status filter tabs when orders exist', () => {
      const queryClient = new QueryClient()
      queryClient.setQueryData(['customer-orders'], [MOCK_CONFIRMED_ORDER, MOCK_DELIVERED_ORDER])

      const html = renderWithProviders(<OrdersPage />, { queryClient })

      expect(html).toContain('data-testid="order-status-tabs"')
      expect(html).toContain('data-testid="orders-list"')
      expect(html).toContain(`customer-order-card-${MOCK_CONFIRMED_ORDER.id}`)
      expect(html).toContain(`customer-order-card-${MOCK_DELIVERED_ORDER.id}`)
    })
  })

  // 2. All, Active, and Past Filtering & Counts
  describe('OrderStatusTabs & Order Categorization', () => {
    it('defines correct status categorizations matching orderMachine', () => {
      expect(ACTIVE_STATUSES).toEqual([
        ORDER_STATUS.AWAITING_PAYMENT,
        ORDER_STATUS.CONFIRMED,
        ORDER_STATUS.PREPARING,
        ORDER_STATUS.PICKED_UP,
        ORDER_STATUS.ON_THE_WAY,
      ])
      expect(PAST_STATUSES).toEqual([ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED])
    })

    it('computes order counts consistently across All, Active, and Past', () => {
      const orders = [
        MOCK_AWAITING_PAYMENT_ORDER, // active
        MOCK_CONFIRMED_ORDER,        // active
        MOCK_ON_THE_WAY_ORDER,       // active
        MOCK_DELIVERED_ORDER,        // past
        MOCK_CANCELLED_ORDER,        // past
      ]

      const counts = computeOrderCounts(orders)
      expect(counts.all).toBe(5)
      expect(counts.active).toBe(3)
      expect(counts.past).toBe(2)
    })

    it('renders OrderStatusTabs with accessible ARIA semantics and counts', () => {
      const html = renderToString(
        <OrderStatusTabs
          activeTab="active"
          onTabChange={vi.fn()}
          counts={{ all: 5, active: 3, past: 2 }}
        />,
      )

      expect(html).toContain('role="tablist"')
      expect(html).toContain('aria-label="Filter orders by status"')

      // Tab active: aria-selected="true"
      expect(html).toContain('id="order-tab-active"')
      expect(html).toContain('aria-selected="true"')
      expect(html).toContain('Active Deliveries')
      expect(html).toContain('3')

      // Other tabs: aria-selected="false"
      expect(html).toContain('id="order-tab-all"')
      expect(html).toContain('aria-selected="false"')
      expect(html).toContain('All Orders')
      expect(html).toContain('5')

      expect(html).toContain('id="order-tab-past"')
      expect(html).toContain('aria-selected="false"')
      expect(html).toContain('Past Orders')
      expect(html).toContain('2')
    })
  })

  // 3. OrderTrackingTimeline Rendering across Statuses
  describe('OrderTrackingTimeline Lifecycle Stepper', () => {
    it('renders distinct notice for CANCELLED orders without active steps', () => {
      const html = renderToString(
        <OrderTrackingTimeline status={ORDER_STATUS.CANCELLED} />,
      )

      expect(html).toContain('data-testid="order-timeline-cancelled"')
      expect(html).toContain('Order Cancelled')
      expect(html).toContain('No delivery handover or runner dispatch is active')
      expect(html).not.toContain('Step 1 of 5')
    })

    it('renders distinct notice for AWAITING_PAYMENT orders', () => {
      const html = renderToString(
        <OrderTrackingTimeline status={ORDER_STATUS.AWAITING_PAYMENT} />,
      )

      expect(html).toContain('data-testid="order-timeline-awaiting-payment"')
      expect(html).toContain('Payment Pending Verification')
      expect(html).toContain('Complete UPI payment to confirm your order')
      expect(html).not.toContain('Step 1 of 5')
    })

    it('renders 5-step progress stepper with CONFIRMED as active step 1', () => {
      const html = renderToString(
        <OrderTrackingTimeline status={ORDER_STATUS.CONFIRMED} />,
      )

      expect(html).toContain('data-testid="order-tracking-timeline"')
      expect(html).toContain('Step 1 of 5')
      expect(html).toContain('Confirmed')
      expect(html).toContain('Preparing')
      expect(html).toContain('Picked Up')
      expect(html).toContain('On The Way')
      expect(html).toContain('Delivered')
      expect(html).toContain('aria-current="step"')
    })

    it('renders PREPARING with step 1 completed and step 2 active', () => {
      const html = renderToString(
        <OrderTrackingTimeline status={ORDER_STATUS.PREPARING} />,
      )

      expect(html).toContain('Step 2 of 5')
      expect(html).toContain('Store is packing items')
    })

    it('renders PICKED_UP with steps 1 and 2 completed and step 3 active', () => {
      const html = renderToString(
        <OrderTrackingTimeline status={ORDER_STATUS.PICKED_UP} />,
      )

      expect(html).toContain('Step 3 of 5')
      expect(html).toContain('Collected by student runner')
    })

    it('renders ON_THE_WAY with step 4 active', () => {
      const html = renderToString(
        <OrderTrackingTimeline status={ORDER_STATUS.ON_THE_WAY} />,
      )

      expect(html).toContain('Step 4 of 5')
      expect(html).toContain('En route to your campus spot')
    })

    it('renders DELIVERED with "Order complete"', () => {
      const html = renderToString(
        <OrderTrackingTimeline status={ORDER_STATUS.DELIVERED} />,
      )

      expect(html).toContain('Order complete')
      expect(html).toContain('Handover complete')
    })
  })

  // 4. Order Details & Historical Pricing Display
  describe('OrderDetailReceipt & Historical Fee Breakdown', () => {
    it('renders items with pack sizes, quantities, unit prices, and subtotals', () => {
      const html = renderToString(<OrderDetailReceipt order={MOCK_CONFIRMED_ORDER} />)

      expect(html).toContain('Toned Milk')
      expect(html).toContain('500 ml')
      expect(html).toContain('₹28')
      expect(html).toContain('₹56')

      expect(html).toContain('Whole Wheat Bread')
      expect(html).toContain('400 g')
      expect(html).toContain('₹45')
    })

    it('renders store info, destination, and recipient details', () => {
      const html = renderToString(<OrderDetailReceipt order={MOCK_CONFIRMED_ORDER} />)

      expect(html).toContain('Campus Mart')
      expect(html).toContain('A Block')
      expect(html).toContain('Room 204, 2nd Floor')
      expect(html).toContain('Aarav Patel')
      expect(html).toContain('9876543210')
    })

    it('displays authoritative recorded fees without recalculating or hardcoding', () => {
      // Custom fees that differ from standard ₹10 delivery or ₹0 platform fee
      const customOrder = {
        ...MOCK_CONFIRMED_ORDER,
        pricing: {
          itemSubtotal: 250,
          deliveryFee: 15,
          platformFee: 0.75,
          total: 265.75,
        },
      }

      const html = renderToString(<OrderDetailReceipt order={customOrder} />)

      expect(html).toContain('Item Subtotal')
      expect(html).toContain('₹250')
      expect(html).toContain('Delivery Fee')
      expect(html).toContain('₹15')
      expect(html).toContain('Platform Fee')
      expect(html).toContain('₹0.75')
      expect(html).toContain('Total Amount')
      expect(html).toContain('₹265.75')
    })

    it('displays verified delivery timestamp only when real timestamp exists', () => {
      const htmlWithTimestamp = renderToString(
        <OrderDetailReceipt order={MOCK_DELIVERED_ORDER} />,
      )
      expect(htmlWithTimestamp).toContain('Verified delivery on')

      const orderWithoutTimestamp = {
        ...MOCK_DELIVERED_ORDER,
        handoverVerifiedAt: null,
        deliveredAt: null,
      }
      const htmlWithoutTimestamp = renderToString(
        <OrderDetailReceipt order={orderWithoutTimestamp} />,
      )
      expect(htmlWithoutTimestamp).not.toContain('Verified delivery on')
    })
  })

  // 5. Pay Now Navigation
  describe('Pay Now Navigation', () => {
    it('renders Pay Now button with exact path and query param for awaiting payment orders', () => {
      const queryClient = new QueryClient()
      queryClient.setQueryData(['customer-orders'], [MOCK_AWAITING_PAYMENT_ORDER])

      const html = renderWithProviders(<OrdersPage />, { queryClient })

      expect(html).toContain('Pay Now')
      expect(html).toContain(`href="/app/payment?orderId=${MOCK_AWAITING_PAYMENT_ORDER.id}"`)
    })

    it('does not render Pay Now button for confirmed or delivered orders', () => {
      const queryClient = new QueryClient()
      queryClient.setQueryData(['customer-orders'], [MOCK_CONFIRMED_ORDER, MOCK_DELIVERED_ORDER])

      const html = renderWithProviders(<OrdersPage />, { queryClient })

      expect(html).not.toContain('Pay Now')
    })
  })

  // 6. Customer Delivery OTP Card Visibility
  describe('Customer Delivery OTP Card Visibility', () => {
    it('renders CustomerDeliveryOtpCard exclusively for ON_THE_WAY orders', () => {
      const queryClient = new QueryClient()
      queryClient.setQueryData(['customer-orders'], [MOCK_ON_THE_WAY_ORDER])
      queryClient.setQueryData(['delivery-otp', MOCK_ON_THE_WAY_ORDER.id], {
        otp: '724915',
        expiresAt: Date.now() + 600000,
        demoMode: true,
      })

      const html = renderWithProviders(<OrdersPage />, { queryClient })

      // OTP Card for transit order
      expect(html).toContain(`customer-order-card-${MOCK_ON_THE_WAY_ORDER.id}`)
      expect(html).toContain(`customer-otp-card-${MOCK_ON_THE_WAY_ORDER.id}`)
      expect(html).toContain('Delivery Handover OTP')
      expect(html).toContain('724915')
    })

    it('does not render CustomerDeliveryOtpCard for CONFIRMED, PREPARING, DELIVERED, or CANCELLED orders', () => {
      const queryClient = new QueryClient()
      queryClient.setQueryData(['customer-orders'], [
        MOCK_CONFIRMED_ORDER,
        MOCK_DELIVERED_ORDER,
        MOCK_CANCELLED_ORDER,
      ])

      const html = renderWithProviders(<OrdersPage />, { queryClient })

      expect(html).not.toContain('Delivery Handover OTP')
    })
  })

  // 7. Dynamic Polling Behavior
  describe('Polling Convention (getOrderRefetchInterval)', () => {
    it('enables 5000ms polling when at least one active order exists', () => {
      const ordersWithActive = [MOCK_DELIVERED_ORDER, MOCK_CONFIRMED_ORDER]
      expect(getOrderRefetchInterval(ordersWithActive)).toBe(5000)

      const ordersWithAwaitingPayment = [MOCK_AWAITING_PAYMENT_ORDER]
      expect(getOrderRefetchInterval(ordersWithAwaitingPayment)).toBe(5000)

      const ordersWithTransit = [MOCK_ON_THE_WAY_ORDER]
      expect(getOrderRefetchInterval(ordersWithTransit)).toBe(5000)
    })

    it('stops polling (returns false) when all orders are terminal', () => {
      const terminalOrders = [MOCK_DELIVERED_ORDER, MOCK_CANCELLED_ORDER]
      expect(getOrderRefetchInterval(terminalOrders)).toBe(false)
    })

    it('stops polling (returns false) when order list is empty or not an array', () => {
      expect(getOrderRefetchInterval([])).toBe(false)
      expect(getOrderRefetchInterval(null)).toBe(false)
      expect(getOrderRefetchInterval(undefined)).toBe(false)
    })
  })

  // 8. Accessibility & Semantics
  describe('Accessibility & Controls', () => {
    it('provides accessible names on all major interactive buttons', () => {
      const queryClient = new QueryClient()
      queryClient.setQueryData(['customer-orders'], [MOCK_CONFIRMED_ORDER])

      const html = renderWithProviders(<OrdersPage />, { queryClient })

      expect(html).toContain('aria-label="Refresh orders"')
      expect(html).toContain(`aria-label="View receipt and details for order #${MOCK_CONFIRMED_ORDER.id}"`)
      expect(html).toContain('aria-label="Order fulfillment progress"')
    })

    it('renders a single top-level h1 heading', () => {
      const queryClient = new QueryClient()
      queryClient.setQueryData(['customer-orders'], [MOCK_CONFIRMED_ORDER])

      const html = renderWithProviders(<OrdersPage />, { queryClient })

      const h1Count = (html.match(/<h1/g) || []).length
      expect(h1Count).toBe(1)
      expect(html).toContain('<h1')
      expect(html).toContain('My Orders')
    })
  })
})
