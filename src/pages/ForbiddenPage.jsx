import { Link } from 'react-router'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'

const COPY = {
  runner: {
    title: 'Runner access is by approval',
    body: "Runner accounts are assigned by the MartIT team after verification. You can't choose this role at sign-up. If you've applied, we'll let you know once you're approved.",
  },
  admin: { title: 'Admins only', body: 'This area is for the MartIT team.' },
  customer: { title: 'Not available for this account', body: 'This area needs a customer account.' },
}

export function ForbiddenPage({ role }) {
  const copy = COPY[role] ?? COPY.customer
  return (
    <main id="main" className="mx-auto grid min-h-dvh max-w-lg content-center px-4 py-16">
      <Link to="/" aria-label="MartIT home" className="mb-10 w-fit rounded-tile">
        <Logo />
      </Link>
      <span className="grid size-14 place-items-center rounded-card bg-warning-soft text-warning">
        <ShieldAlert className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-6 font-display text-4xl font-bold tracking-display">{copy.title}</h1>
      <p className="mt-3 text-ink-muted">{copy.body}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/app">Go to shopping</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/">Home</Link>
        </Button>
      </div>
    </main>
  )
}
