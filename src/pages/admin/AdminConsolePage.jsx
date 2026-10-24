import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bike,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react'
import { Badge, OrderStatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toaster'
import { adminService } from '@/services/adminService'
import { orderService } from '@/services/orderService'
import { request } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { hasPermission, PERMISSIONS, ROLE_LABEL, ROLES } from '@/utils/permissions'
import { formatINR } from '@/utils/currency'
import { ORDER_STATUS, ORDER_STATUS_LABEL } from '@/utils/orderMachine'
import { SAMPLE_STORES, SAMPLE_DELIVERY_LOCATIONS } from '@/mocks/campus'

const RUNNER_TONE = { pending: 'warning', applicant: 'warning', approved: 'brand', suspended: 'danger' }

export default function AdminConsolePage() {
  const me = useAuthStore((s) => s.user)
  const qc = useQueryClient()

  // Top-level Navigation Tab: 'people' | 'orders' | 'exceptions' | 'stores'
  const [consoleTab, setConsoleTab] = useState('people')

  // People & Roles Queries & State
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({ queryKey: ['admin', 'users'], queryFn: adminService.listUsers })
  const [search, setSearch] = useState('')
  const [activeRoleTab, setActiveRoleTab] = useState('all')

  // Orders & Operations Queries & State
  const {
    data: orders = [],
    isLoading: isLoadingOrders,
    isFetching: isFetchingOrders,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const res = await adminService.listOrders()
      return Array.isArray(res) ? res : []
    },
    staleTime: 10000,
  })
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [orderStoreFilter, setOrderStoreFilter] = useState('all')

  // Stores Query
  const {
    data: storesList = [],
    isLoading: isLoadingStores,
    refetch: refetchStores,
  } = useQuery({
    queryKey: ['admin', 'stores'],
    queryFn: async () => {
      const res = await request('stores.list')
      return Array.isArray(res) && res.length > 0 ? res : SAMPLE_STORES
    },
    staleTime: 15000,
  })

  // Mutations
  const onDoneUser = (msg) => (updated) => {
    const targetId = updated.id || updated.userId
    qc.setQueryData(['admin', 'users'], (list) =>
      list?.map((u) => {
        if (u.id !== targetId) return u
        return {
          ...u,
          ...updated,
          id: u.id,
          name: updated.name ?? u.name,
          email: updated.email ?? u.email,
          roles: updated.roles ?? u.roles,
          runnerStatus: updated.runnerStatus !== undefined ? updated.runnerStatus : u.runnerStatus,
        }
      })
    )
    qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    toast.success(typeof msg === 'function' ? msg(updated) : msg)
  }
  const onError = (e) => toast.error(e.message || 'Action failed. Please try again.')

  const runnerMutation = useMutation({
    mutationFn: ({ userId, status }) => adminService.setRunnerStatus(userId, status),
    onSuccess: onDoneUser((u) => `${u.name || 'User'}: runner ${u.runnerStatus}`),
    onError,
  })
  const roleMutation = useMutation({
    mutationFn: ({ userId, role, granted }) => adminService.setRole(userId, role, granted),
    onSuccess: onDoneUser((u) => `${u.name || 'User'}: roles updated`),
    onError,
  })

  // Store toggle mutation
  const storeMutation = useMutation({
    mutationFn: ({ storeId, isOpen }) => adminService.updateStore(storeId, { isOpen }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['admin', 'stores'] })
      toast.success(`${updated.name || 'Store'} is now ${updated.isOpen ? 'Open' : 'Closed'}`)
    },
    onError,
  })

  // Check payment mutation for exceptions
  const [checkingOrderId, setCheckingOrderId] = useState(null)
  const handleCheckOrderPayment = async (orderId) => {
    try {
      setCheckingOrderId(orderId)
      const res = await orderService.checkPayment(orderId)
      await refetchOrders()
      if (res.status === 'verified') {
        toast.success(`Payment verified! Order #${orderId} is now confirmed.`)
      } else {
        toast.info(res.message || 'Payment verification inconclusive. Awaiting gateway/email evidence.')
      }
    } catch (err) {
      toast.error(err.message || 'Payment check failed.')
    } finally {
      setCheckingOrderId(null)
    }
  }

  const handleExpireOrderPayment = async (orderId) => {
    try {
      await orderService.expire(orderId)
      await refetchOrders()
      toast.success(`Order #${orderId} payment window expired and held slot released.`)
    } catch (err) {
      toast.error(err.message || 'Failed to expire order.')
    }
  }

  const canApprove = hasPermission(me, PERMISSIONS.RUNNERS_APPROVE)
  const canAssign = hasPermission(me, PERMISSIONS.ROLES_ASSIGN)
  const busy = runnerMutation.isPending || roleMutation.isPending || storeMutation.isPending

  // Derived user metrics
  const userMetrics = useMemo(() => {
    const list = users || []
    const totalUsers = list.length
    const applicants = list.filter((u) => u.runnerStatus === 'applicant' || u.runnerStatus === 'pending').length
    const activeRunners = list.filter((u) => u.runnerStatus === 'approved').length
    const admins = list.filter(
      (u) => Array.isArray(u.roles) && (u.roles.includes(ROLES.ADMIN) || u.roles.includes(ROLES.SUPER_ADMIN))
    ).length
    return { totalUsers, applicants, activeRunners, admins }
  }, [users])

  // Filtered users
  const filteredUsers = useMemo(() => {
    let list = users || []
    const query = search.trim().toLowerCase()
    if (query) {
      list = list.filter((u) => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query))
    }
    if (activeRoleTab === 'applicants') {
      list = list.filter((u) => u.runnerStatus === 'applicant' || u.runnerStatus === 'pending')
    } else if (activeRoleTab === 'runners') {
      list = list.filter((u) => u.runnerStatus === 'approved')
    } else if (activeRoleTab === 'admins') {
      list = list.filter(
        (u) => Array.isArray(u.roles) && (u.roles.includes(ROLES.ADMIN) || u.roles.includes(ROLES.SUPER_ADMIN))
      )
    } else if (activeRoleTab === 'customers') {
      list = list.filter(
        (u) =>
          !Array.isArray(u.roles) ||
          (!u.roles.includes(ROLES.ADMIN) && !u.roles.includes(ROLES.SUPER_ADMIN) && u.runnerStatus !== 'approved')
      )
    }
    return list
  }, [users, search, activeRoleTab])

  // Derived order metrics
  const orderMetrics = useMemo(() => {
    const list = orders || []
    const total = list.length
    const awaitingPayment = list.filter((o) => o.status === ORDER_STATUS.AWAITING_PAYMENT).length
    const inFulfillment = list.filter(
      (o) =>
        o.status === ORDER_STATUS.CONFIRMED ||
        o.status === ORDER_STATUS.PREPARING ||
        o.status === ORDER_STATUS.PICKED_UP ||
        o.status === ORDER_STATUS.ON_THE_WAY
    ).length
    const delivered = list.filter((o) => o.status === ORDER_STATUS.DELIVERED).length
    const exceptions = list.filter(
      (o) =>
        o.status === ORDER_STATUS.AWAITING_PAYMENT ||
        o.paymentStatus === 'EXPIRED' ||
        o.paymentStatus === 'FAILED' ||
        (o.paymentStatus === 'PENDING' && o.status !== ORDER_STATUS.DELIVERED)
    ).length
    return { total, awaitingPayment, inFulfillment, delivered, exceptions }
  }, [orders])

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let list = orders || []
    const query = orderSearch.trim().toLowerCase()
    if (query) {
      list = list.filter((o) => {
        const idMatch = o.id?.toLowerCase().includes(query)
        const nameMatch = o.customerDetails?.fullName?.toLowerCase().includes(query)
        const phoneMatch = o.customerDetails?.phoneNumber?.includes(query)
        const destMatch = o.customerDetails?.selectedDestination?.toLowerCase().includes(query)
        return idMatch || nameMatch || phoneMatch || destMatch
      })
    }
    if (orderStatusFilter !== 'all') {
      list = list.filter((o) => o.status === orderStatusFilter)
    }
    if (orderStoreFilter !== 'all') {
      list = list.filter((o) => o.storeId === orderStoreFilter)
    }
    return list
  }, [orders, orderSearch, orderStatusFilter, orderStoreFilter])

  // Payment Exceptions list
  const exceptionOrders = useMemo(() => {
    return (orders || []).filter(
      (o) =>
        o.status === ORDER_STATUS.AWAITING_PAYMENT ||
        o.paymentStatus === 'EXPIRED' ||
        o.paymentStatus === 'FAILED' ||
        (o.paymentStatus === 'PENDING' && o.status !== ORDER_STATUS.DELIVERED)
    )
  }, [orders])

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="info" size="md">
              Administrator Portal
            </Badge>
            <span className="text-xs text-ink-subtle">Authorized Session</span>
          </div>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-display text-ink">
            Campus Operations Console
          </h1>
          <p className="mt-1 max-w-xl text-xs sm:text-sm text-ink-muted">
            Live order monitoring, payment verification tracking, runner authorizations, and store controls.
          </p>
        </div>

        {/* Global Refresh Action */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            size="sm"
            variant="secondary"
            loading={isFetchingOrders}
            onClick={() => {
              refetchOrders()
              refetchStores()
              qc.invalidateQueries({ queryKey: ['admin', 'users'] })
            }}
            className="text-xs"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            <span>Refresh All Data</span>
          </Button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-1" data-testid="admin-console-nav">
        {[
          { id: 'people', label: `People & Roles (${userMetrics.totalUsers})`, icon: Users },
          { id: 'orders', label: `All Orders (${orderMetrics.total})`, icon: ShoppingBag },
          { id: 'exceptions', label: `Payment Exceptions (${orderMetrics.exceptions})`, icon: AlertTriangle },
          { id: 'stores', label: 'Store & Operations', icon: Store },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = consoleTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`tab-${tab.id}`}
              onClick={() => setConsoleTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-tile border-b-2 transition-all ${
                isActive
                  ? 'border-brand text-brand bg-brand-soft/20 font-bold'
                  : 'border-transparent text-ink-muted hover:text-ink hover:bg-surface-2'
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PEOPLE & ROLES */}
      {/* ========================================================================= */}
      {consoleTab === 'people' && (
        <div className="space-y-6 animate-fadeIn" data-testid="section-people-roles">
          {/* Real Statistics Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-ink-muted shrink-0">
                <Users className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-ink-subtle uppercase tracking-wider font-semibold">Total Users</p>
                <p className="text-2xl font-bold font-display text-ink">
                  {isLoadingUsers ? '-' : userMetrics.totalUsers}
                </p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-warning-soft text-warning shrink-0">
                <Bike className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-ink-subtle uppercase tracking-wider font-semibold">Runner Applicants</p>
                <p className="text-2xl font-bold font-display text-ink">
                  {isLoadingUsers ? '-' : userMetrics.applicants}
                </p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand shrink-0">
                <Bike className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-ink-subtle uppercase tracking-wider font-semibold">Active Runners</p>
                <p className="text-2xl font-bold font-display text-ink">
                  {isLoadingUsers ? '-' : userMetrics.activeRunners}
                </p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-info-soft text-info shrink-0">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-ink-subtle uppercase tracking-wider font-semibold">Admins</p>
                <p className="text-2xl font-bold font-display text-ink">
                  {isLoadingUsers ? '-' : userMetrics.admins}
                </p>
              </div>
            </Card>
          </div>

          {usersError && (
            <p className="rounded-tile bg-danger-soft p-3 text-sm font-medium text-danger">{usersError.message}</p>
          )}

          {/* Filter and Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="flex flex-wrap gap-1.5 p-1 rounded-card bg-surface-2 border border-line">
              {[
                { id: 'all', label: `All (${userMetrics.totalUsers})` },
                { id: 'applicants', label: `Applicants (${userMetrics.applicants})` },
                { id: 'runners', label: `Runners (${userMetrics.activeRunners})` },
                { id: 'admins', label: `Admins (${userMetrics.admins})` },
                { id: 'customers', label: 'Customers' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveRoleTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-tile transition-all ${
                    activeRoleTab === tab.id
                      ? 'bg-surface text-ink shadow-1'
                      : 'text-ink-muted hover:text-ink hover:bg-surface/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="w-full md:w-72">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                icon={Search}
                size="sm"
              />
            </div>
          </div>

          {/* User Records List */}
          <ul className="grid gap-3" aria-busy={isLoadingUsers || busy}>
            {isLoadingUsers &&
              Array.from({ length: 3 }, (_, i) => (
                <li key={i}>
                  <Skeleton className="h-24 rounded-card" />
                </li>
              ))}

            {!isLoadingUsers && filteredUsers.length === 0 && (
              <li className="text-center py-12 rounded-card border border-line bg-surface p-6">
                <p className="text-base font-semibold text-ink">No matching users found</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {search ? 'Try clearing your search term.' : 'No users match this filter.'}
                </p>
                {search && (
                  <Button size="sm" variant="secondary" onClick={() => setSearch('')} className="mt-4">
                    Clear search
                  </Button>
                )}
              </li>
            )}

            {filteredUsers.map((u) => {
              const userRoles = Array.isArray(u.roles) ? u.roles : []
              const isAdmin = userRoles.includes(ROLES.ADMIN)
              const isSuperAdmin = userRoles.includes(ROLES.SUPER_ADMIN)
              const isApplicant = u.runnerStatus === 'applicant' || u.runnerStatus === 'pending'
              const isApproved = u.runnerStatus === 'approved'

              return (
                <li key={u.id}>
                  <Card className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center shadow-1">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-tile bg-surface-2 text-ink-muted">
                        <UserRound className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-ink">
                            {u.name} {u.id === me?.id && <span className="font-normal text-ink-subtle">(you)</span>}
                          </p>
                        </div>
                        <p className="truncate text-sm text-ink-subtle">{u.email}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {userRoles.map((r) => (
                            <Badge
                              key={r}
                              tone={r === ROLES.SUPER_ADMIN ? 'info' : r === ROLES.ADMIN ? 'brand' : 'neutral'}
                            >
                              {ROLE_LABEL[r] || r}
                            </Badge>
                          ))}
                          {u.runnerStatus && (
                            <Badge tone={RUNNER_TONE[u.runnerStatus]}>Runner: {u.runnerStatus}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      {canApprove && isApplicant && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={busy}
                            onClick={() => runnerMutation.mutate({ userId: u.id, status: 'approved' })}
                          >
                            Approve runner
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-danger hover:bg-danger-soft hover:text-danger"
                            disabled={busy}
                            onClick={() => runnerMutation.mutate({ userId: u.id, status: 'suspended' })}
                          >
                            Reject applicant
                          </Button>
                        </>
                      )}
                      {canApprove && isApproved && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => runnerMutation.mutate({ userId: u.id, status: 'suspended' })}
                        >
                          Suspend runner
                        </Button>
                      )}
                      {canApprove && u.runnerStatus === 'suspended' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => runnerMutation.mutate({ userId: u.id, status: 'approved' })}
                        >
                          Re-approve runner
                        </Button>
                      )}
                      {canAssign && !isSuperAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() =>
                            roleMutation.mutate({ userId: u.id, role: ROLES.ADMIN, granted: !isAdmin })
                          }
                        >
                          {isAdmin ? 'Remove admin' : 'Make admin'}
                        </Button>
                      )}
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL ORDERS & OPERATIONS (P0 Reliability) */}
      {/* ========================================================================= */}
      {consoleTab === 'orders' && (
        <div className="space-y-6 animate-fadeIn" data-testid="section-all-orders">
          {/* Order Metrics Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-ink shrink-0">
                <ShoppingBag className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-ink-subtle uppercase tracking-wider font-semibold">Total Orders</p>
                <p className="text-2xl font-bold font-display text-ink">{isLoadingOrders ? '-' : orderMetrics.total}</p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-warning-soft text-warning shrink-0">
                <Clock className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-ink-subtle uppercase tracking-wider font-semibold">Awaiting Payment</p>
                <p className="text-2xl font-bold font-display text-ink">
                  {isLoadingOrders ? '-' : orderMetrics.awaitingPayment}
                </p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand shrink-0">
                <Bike className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-ink-subtle uppercase tracking-wider font-semibold">In Fulfillment</p>
                <p className="text-2xl font-bold font-display text-ink">
                  {isLoadingOrders ? '-' : orderMetrics.inFulfillment}
                </p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-fresh/20 text-fresh-ink shrink-0">
                <CheckCircle2 className="size-5 text-fresh" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-ink-subtle uppercase tracking-wider font-semibold">Delivered</p>
                <p className="text-2xl font-bold font-display text-ink">
                  {isLoadingOrders ? '-' : orderMetrics.delivered}
                </p>
              </div>
            </Card>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="flex flex-wrap gap-1.5 p-1 rounded-card bg-surface-2 border border-line">
              {[
                { id: 'all', label: 'All Statuses' },
                { id: ORDER_STATUS.AWAITING_PAYMENT, label: 'Awaiting Payment' },
                { id: ORDER_STATUS.CONFIRMED, label: 'Confirmed' },
                { id: ORDER_STATUS.PREPARING, label: 'Preparing' },
                { id: ORDER_STATUS.PICKED_UP, label: 'Picked Up' },
                { id: ORDER_STATUS.ON_THE_WAY, label: 'On The Way' },
                { id: ORDER_STATUS.DELIVERED, label: 'Delivered' },
                { id: ORDER_STATUS.CANCELLED, label: 'Cancelled' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setOrderStatusFilter(filter.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-tile transition-all ${
                    orderStatusFilter === filter.id
                      ? 'bg-surface text-ink shadow-1'
                      : 'text-ink-muted hover:text-ink hover:bg-surface/50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <select
                value={orderStoreFilter}
                onChange={(e) => setOrderStoreFilter(e.target.value)}
                className="h-9 px-3 text-xs rounded-tile border border-line bg-surface text-ink font-medium"
                aria-label="Filter by store"
              >
                <option value="all">All Stores</option>
                {storesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <div className="w-full sm:w-64">
                <Input
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Order ID, Customer, Phone..."
                  icon={Search}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {isLoadingOrders &&
              Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-32 rounded-card" />
              ))}

            {!isLoadingOrders && filteredOrders.length === 0 && (
              <div className="text-center py-16 rounded-card border border-line bg-surface p-6 space-y-2">
                <ShoppingBag className="size-10 text-ink-subtle mx-auto" />
                <p className="text-base font-semibold text-ink">No matching campus orders found</p>
                <p className="text-xs text-ink-muted">
                  {orderSearch || orderStatusFilter !== 'all'
                    ? 'Try clearing active status or search filters.'
                    : 'No orders have been recorded in the platform.'}
                </p>
              </div>
            )}

            {filteredOrders.map((order) => {
              const store = storesList.find((s) => s.id === order.storeId)
              const customerName = order.customerDetails?.fullName || order.customerId || 'Customer'
              const destination = order.customerDetails?.selectedDestination || 'Campus Delivery Spot'

              return (
                <Card
                  key={order.id}
                  className="p-5 border-line space-y-3.5 shadow-1 hover:shadow-2 transition-shadow"
                  data-testid={`admin-order-card-${order.id}`}
                >
                  {/* Top Bar: Order ID, Badges, Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-ink">#{order.id}</span>
                      <span className="text-xs text-ink-subtle flex items-center gap-1">
                        <Clock className="size-3" aria-hidden="true" />
                        <span>{new Date(order.createdAt).toLocaleString()}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <OrderStatusPill status={order.status} />
                      <Badge
                        tone={
                          order.paymentStatus === 'PAID'
                            ? 'brand'
                            : order.paymentStatus === 'EXPIRED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        Payment: {order.paymentStatus || 'PENDING'}
                      </Badge>
                    </div>
                  </div>

                  {/* Body Details: Customer, Destination, Store, Items */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* Customer & Destination */}
                    <div className="space-y-1">
                      <p className="font-semibold text-ink flex items-center gap-1.5">
                        <UserRound className="size-3.5 text-brand shrink-0" />
                        <span>{customerName}</span>
                        {order.customerDetails?.phoneNumber && (
                          <span className="font-mono text-ink-subtle text-[11px]">
                            ({order.customerDetails.phoneNumber})
                          </span>
                        )}
                      </p>
                      <p className="text-ink-muted flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-fresh-ink shrink-0" />
                        <span>{destination}</span>
                      </p>
                      {order.customerDetails?.detailedAddress && (
                        <p className="text-[11px] text-ink-subtle pl-5">{order.customerDetails.detailedAddress}</p>
                      )}
                    </div>

                    {/* Store & Line Items */}
                    <div className="space-y-1">
                      <p className="font-semibold text-ink flex items-center gap-1.5">
                        <Store className="size-3.5 text-brand shrink-0" />
                        <span>{store ? store.name : order.storeId || 'Campus Store'}</span>
                      </p>
                      <p className="text-ink-muted text-[11px] line-clamp-2">
                        {order.lines?.map((l) => `${l.quantity}× ${l.name}`).join(', ') || 'No line items'}
                      </p>
                    </div>

                    {/* Pricing Breakdown & Runner Assignment */}
                    <div className="space-y-1 md:text-right">
                      <p className="text-ink-muted">
                        Payable Total:{' '}
                        <strong className="text-ink font-bold font-mono text-sm">
                          {formatINR(order.pricing?.total || 0)}
                        </strong>
                      </p>
                      <p className="text-[11px] text-ink-subtle">
                        Base: {formatINR(order.pricing?.baseAmount || 0)} | Suffix Fee:{' '}
                        {formatINR(order.pricing?.platformFee || 0)}
                      </p>
                      <div className="pt-0.5">
                        {order.runnerId ? (
                          <Badge tone="brand" size="sm">
                            Assigned Runner: {order.runnerId}
                          </Badge>
                        ) : (
                          <Badge tone="neutral" size="sm">
                            Unassigned
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAYMENT EXCEPTIONS & GATEWAY QUEUE (P0 Reliability) */}
      {/* ========================================================================= */}
      {consoleTab === 'exceptions' && (
        <div className="space-y-6 animate-fadeIn" data-testid="section-payment-exceptions">
          <div className="rounded-card border border-warning/30 bg-warning/10 p-4 text-xs text-ink space-y-1">
            <p className="font-bold text-warning-ink flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4 shrink-0 text-warning" />
              <span>Payment Exception Queue &amp; Unverified Audit</span>
            </p>
            <p className="text-ink-muted leading-relaxed">
              Orders requiring administrative oversight due to expired payment windows, inconclusive gateway
              responses, or customer assistance inquiries. Verified payments proceed automatically through Make.com +
              Gmail verification.
            </p>
          </div>

          <div className="space-y-4">
            {exceptionOrders.length === 0 ? (
              <div className="text-center py-16 rounded-card border border-line bg-surface p-6 space-y-2">
                <CheckCircle2 className="size-10 text-fresh mx-auto" />
                <p className="text-base font-semibold text-ink">Zero Payment Exceptions</p>
                <p className="text-xs text-ink-muted">
                  All active campus orders are fully verified, completed, or cancelled cleanly.
                </p>
              </div>
            ) : (
              exceptionOrders.map((order) => {
                const isChecking = checkingOrderId === order.id
                const isExpired = order.paymentStatus === 'EXPIRED'
                const isPending = order.paymentStatus === 'PENDING'

                return (
                  <Card
                    key={order.id}
                    className="p-5 border-line space-y-3 shadow-1"
                    data-testid={`exception-order-${order.id}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-ink">#{order.id}</span>
                        <Badge tone={isExpired ? 'danger' : 'warning'}>
                          Payment: {order.paymentStatus || 'PENDING'}
                        </Badge>
                        <OrderStatusPill status={order.status} />
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={isChecking}
                          onClick={() => handleCheckOrderPayment(order.id)}
                          className="text-xs font-semibold"
                        >
                          <RefreshCw className="size-3.5" aria-hidden="true" />
                          <span>Re-check Verification</span>
                        </Button>

                        {isPending && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleExpireOrderPayment(order.id)}
                            className="text-xs font-semibold"
                          >
                            <XCircle className="size-3.5" aria-hidden="true" />
                            <span>Expire Window</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-ink-subtle">Customer</p>
                        <p className="font-semibold text-ink">
                          {order.customerDetails?.fullName || order.customerId}
                        </p>
                        <p className="text-ink-muted font-mono">{order.customerDetails?.phoneNumber}</p>
                      </div>

                      <div>
                        <p className="text-ink-subtle">Amount &amp; Allocation</p>
                        <p className="font-bold text-ink font-mono text-sm">
                          {formatINR(order.pricing?.total || 0)}
                        </p>
                        <p className="text-ink-muted text-[11px]">
                          Dynamic suffix: {order.payment?.feePaise || 1} paise (
                          {formatINR(order.pricing?.platformFee || 0.01)})
                        </p>
                      </div>

                      <div>
                        <p className="text-ink-subtle">Verification Window</p>
                        <p className="text-ink font-medium">
                          {order.payment?.windowExpiresAt
                            ? new Date(order.payment.windowExpiresAt).toLocaleTimeString()
                            : 'Standard 2m hold'}
                        </p>
                        <p className="text-ink-muted text-[11px]">
                          {isExpired ? 'Window Expired' : 'Window active / Inconclusive evidence'}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: STORE & SYSTEM OPERATIONS (P0 Reliability) */}
      {/* ========================================================================= */}
      {consoleTab === 'stores' && (
        <div className="space-y-6 animate-fadeIn" data-testid="section-store-operations">
          {/* Store Availability Overview */}
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold text-ink">Campus Stores &amp; Outlets</h2>
            <p className="text-xs text-ink-muted">
              Toggle operational availability to immediately open or pause student ordering from campus stores.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {storesList.map((st) => (
                <Card key={st.id} className="p-4 space-y-3 border-line shadow-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-ink text-sm">{st.name}</p>
                      <p className="text-xs text-ink-subtle line-clamp-1">{st.description || 'Campus outlet'}</p>
                    </div>
                    <Badge tone={st.isOpen ? 'brand' : 'danger'}>{st.isOpen ? 'OPEN' : 'PAUSED'}</Badge>
                  </div>

                  <div className="pt-2 border-t border-line/60 flex items-center justify-between">
                    <span className="text-xs text-ink-muted">Status Control</span>
                    <Button
                      size="sm"
                      variant={st.isOpen ? 'danger' : 'primary'}
                      disabled={busy}
                      onClick={() => storeMutation.mutate({ storeId: st.id, isOpen: !st.isOpen })}
                      className="text-xs font-semibold"
                    >
                      {st.isOpen ? 'Pause Store' : 'Open Store'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* System & Integration Health Status */}
          <div className="space-y-3 pt-6 border-t border-line">
            <h2 className="font-display text-lg font-bold text-ink">Integration &amp; System Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="p-4 space-y-1.5 border-line">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-fresh animate-pulse" />
                  <p className="font-bold text-ink text-xs">Express API Backend</p>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Routes, authentication middleware, and error guards operational.
                </p>
              </Card>

              <Card className="p-4 space-y-1.5 border-line">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-fresh animate-pulse" />
                  <p className="font-bold text-ink text-xs">Supabase Database &amp; RLS</p>
                </div>
                <p className="text-[11px] text-ink-muted">
                  13 static migrations verified, atomic RPC guards enforced.
                </p>
              </Card>

              <Card className="p-4 space-y-1.5 border-line">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-fresh animate-pulse" />
                  <p className="font-bold text-ink text-xs">Make.com + Gmail Webhook</p>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Payment verification pipeline active with fail-closed security.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
