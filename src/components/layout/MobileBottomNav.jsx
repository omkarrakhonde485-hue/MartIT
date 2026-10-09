import { NavLink } from 'react-router'
import { m } from 'motion/react'
import { ClipboardList, House, ShoppingBag, UserRound } from 'lucide-react'
import { useCartStore, selectCartCount } from '@/stores/cartStore'
import { cn } from '@/utils/cn'
import { spring } from '@/utils/motion'
import { CountBadge } from './CountBadge'

const ITEMS = [
  { to: '/app', label: 'Home', icon: House, end: true },
  { to: '/app/cart', label: 'Cart', icon: ShoppingBag, cart: true },
  { to: '/app/orders', label: 'Orders', icon: ClipboardList },
  { to: '/app/profile', label: 'Profile', icon: UserRound },
]

/** Customer bottom navigation (mobile only). The active pill glides between tabs. */
export function MobileBottomNav() {
  const cartCount = useCartStore(selectCartCount)
  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
        {ITEMS.map(({ to, label, icon: Icon, end, cart }) => (
          <li key={to}>
            <NavLink to={to} end={end} className="group relative grid h-full place-items-center">
              {({ isActive }) => (
                <span className="relative grid place-items-center gap-0.5">
                  {isActive && (
                    <m.span
                      layoutId="bottom-nav-pill"
                      transition={spring.snappy}
                      className="absolute -top-1 h-8 w-14 rounded-full bg-brand-soft"
                    />
                  )}
                  <span className="relative">
                    <Icon
                      className={cn('size-[22px] transition-colors', isActive ? 'text-fresh-ink' : 'text-ink-subtle')}
                      strokeWidth={isActive ? 2.3 : 1.9}
                      aria-hidden="true"
                    />
                    {cart && <CountBadge count={cartCount} className="absolute -right-2.5 -top-1.5" />}
                  </span>
                  <span className={cn('relative text-[11px] font-medium', isActive ? 'text-ink' : 'text-ink-subtle')}>
                    {label}
                    {cart && cartCount > 0 && <span className="sr-only">, {cartCount} items</span>}
                  </span>
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
