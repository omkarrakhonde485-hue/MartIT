import { lazy, Suspense, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { Menu } from 'lucide-react'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils/cn'
import { homePathFor } from '@/utils/permissions'
import { whenIdle } from '@/utils/idle'
import { useHydrated } from '@/hooks/useHydrated'
import { ThemeToggle } from './ThemeToggle'
import { MARKETING_LINKS } from './marketingLinks'

// The mobile menu (Radix Dialog + sheet) loads on idle, not in the first bundle.
const loadMobileMenu = () => import('./MobileMenu')
const MobileMenu = lazy(loadMobileMenu)
whenIdle(loadMobileMenu)

/** Marketing navbar: transparent at top, condenses into a floating pill after scrolling. */
export function MarketingNavbar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24))
  const hydrated = useHydrated()
  const storedUser = useAuthStore((s) => s.user)
  const user = hydrated ? storedUser : null // pre-rendered HTML is always signed-out
  const appHref = user ? homePathFor(user) : '/app'
  // Stand-in until the lazy menu chunk is ready; clicking it starts the load.
  const menuButton = (
    <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={loadMobileMenu}>
      <Menu className="size-[22px]" aria-hidden="true" />
    </Button>
  )

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 md:px-6">
      <nav
        aria-label="Main"
        className={cn(
          'mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 rounded-card px-3 pl-4 transition-[background-color,box-shadow,border-color] duration-300',
          'border',
          scrolled ? 'border-line bg-surface/85 shadow-2 backdrop-blur-xl' : 'border-transparent bg-transparent',
        )}
      >
        <Link to="/" aria-label="MartIT home" className="rounded-tile">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {MARKETING_LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className="rounded-full px-3.5 py-2 text-[15px] text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {user ? (
            <Button asChild variant="accent" size="sm" className="hidden sm:inline-flex">
              <Link to={appHref}>Open app</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild variant="accent" size="sm" className="hidden sm:inline-flex">
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
          {hydrated ? (
            <Suspense fallback={menuButton}>
              <MobileMenu user={user} appHref={appHref} />
            </Suspense>
          ) : (
            menuButton
          )}
        </div>
      </nav>
    </header>
  )
}
