import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Bike, ShoppingBasket } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { toast } from '@/components/ui/Toaster'
import { useAuthStore } from '@/stores/authStore'
import { isMockBackend } from '@/config/env'

/** Only allow same-site relative redirects (prevents open-redirects via ?next=). */
function safeNext(next) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null
}

/**
 * Phase 1: demo sign-in with sample accounts so access rules can be tested.
 * Phase 3 replaces this with the real email/password form.
 */
export default function LoginPage() {
  const demoLogin = useAuthStore((s) => s.demoLogin)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [pending, setPending] = useState(null)

  const signIn = async (role) => {
    setPending(role)
    try {
      const user = await demoLogin(role)
      toast.success(`Signed in as ${user.name}`)
      navigate(safeNext(params.get('next')) ?? (role === 'runner' ? '/runner' : '/app'), { replace: true })
    } catch (e) {
      toast.error(e.message)
    } finally {
      setPending(null)
    }
  }

  const options = [
    { role: 'customer', icon: ShoppingBasket, title: 'Sample customer', body: 'Browse, order and track.' },
    { role: 'runner', icon: Bike, title: 'Sample runner (approved)', body: 'Accept and deliver orders.' },
  ]

  return (
    <section className="mx-auto max-w-lg px-4 py-10 md:py-16">
      <Badge tone="outline" size="md">Full login form arrives in Phase 3</Badge>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-display">Log in</h1>
      <p className="mt-2 text-ink-muted">
        {isMockBackend
          ? 'This build runs on sample data. Pick a sample account to explore.'
          : 'Demo sign-in is only available with the mock backend.'}
      </p>

      {isMockBackend && (
        <ul className="mt-8 grid gap-3">
          {options.map(({ role, icon: Icon, title, body }) => (
            <li key={role}>
              <Card
                as="button"
                type="button"
                interactive
                disabled={Boolean(pending)}
                onClick={() => signIn(role)}
                className="flex w-full items-center gap-4 p-4 text-left disabled:opacity-60"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-tile bg-brand-soft text-fresh-ink">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-ink-muted">{body}</span>
                </span>
                {pending === role && <Spinner />}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-sm text-ink-muted">
        New to MartIT?{' '}
        <Link to="/signup" className="font-medium text-fresh-ink underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </section>
  )
}
