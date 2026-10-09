import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { Menu } from 'lucide-react'
import { m, useMotionValueEvent, useScroll } from 'motion/react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogTrigger, SheetContent, DialogClose } from '@/components/ui/Dialog'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils/cn'
import { homePathFor } from '@/utils/permissions'
import { ThemeToggle } from './ThemeToggle'

export const MARKETING_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/#how-it-works', label: 'How It Works' },
  { to: '/#categories', label: 'Categories' },
  { to: '/#about', label: 'About' },
  { to: '/#faq', label: 'FAQ' },
]

/** Marketing navbar: transparent at top, condenses into a floating pill after scrolling. */
export function MarketingNavbar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24))
  const user = useAuthStore((s) => s.user)
  const appHref = user ? homePathFor(user) : '/app'

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
          <MobileMenu user={user} appHref={appHref} />
        </div>
      </nav>
    </header>
  )
}

function MobileMenu({ user, appHref }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const close = () => mql.matches && setOpen(false)
    mql.addEventListener('change', close)
    return () => mql.removeEventListener('change', close)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-[22px]" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <SheetContent title="Menu" side="right">
        <nav aria-label="Mobile">
          <ul className="grid gap-1 py-2">
            {MARKETING_LINKS.map((l, i) => (
              <m.li
                key={l.to}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0, transition: { delay: 0.08 + i * 0.04 } }}
              >
                <DialogClose asChild>
                  <Link
                    to={l.to}
                    className="flex h-14 items-center rounded-tile px-3 font-display text-2xl font-semibold tracking-tight transition-colors hover:bg-surface-2"
                  >
                    {l.label}
                  </Link>
                </DialogClose>
              </m.li>
            ))}
          </ul>
        </nav>
        <div className="mt-6 grid gap-2.5">
          {user ? (
            <DialogClose asChild>
              <Button asChild variant="accent" size="lg" block>
                <Link to={appHref}>Open app</Link>
              </Button>
            </DialogClose>
          ) : (
            <>
              <DialogClose asChild>
                <Button asChild variant="accent" size="lg" block>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button asChild variant="secondary" size="lg" block>
                  <Link to="/login">Log In</Link>
                </Button>
              </DialogClose>
            </>
          )}
        </div>
      </SheetContent>
    </Dialog>
  )
}
