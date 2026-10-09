import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Menu } from 'lucide-react'
import { m } from 'motion/react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogTrigger, SheetContent, DialogClose } from '@/components/ui/Dialog'
import { MARKETING_LINKS } from './marketingLinks'

export default function MobileMenu({ user, appHref }) {
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
