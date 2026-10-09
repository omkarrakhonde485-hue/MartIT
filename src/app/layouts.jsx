import { MarketingNavbar } from '@/components/layout/MarketingNavbar'
import { Footer } from '@/components/layout/Footer'
import { PageTransition } from '@/components/layout/PageTransition'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Link } from 'react-router'

export function MarketingLayout() {
  return (
    <>
      <MarketingNavbar />
      <main id="main">
        <PageTransition />
      </main>
      <Footer />
    </>
  )
}

export function AuthLayout() {
  return (
    <>
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link to="/" aria-label="MartIT home" className="rounded-tile">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main id="main">
        <PageTransition />
      </main>
    </>
  )
}
