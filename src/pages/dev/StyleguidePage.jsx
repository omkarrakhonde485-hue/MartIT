import { useState } from 'react'
import { Link } from 'react-router'
import { Mail, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, PasswordInput } from '@/components/ui/Input'
import { OtpInput } from '@/components/ui/OtpInput'
import { Card, ReceiptCard } from '@/components/ui/Card'
import { Badge, OrderStatusPill, PaymentStatusPill } from '@/components/ui/Badge'
import { ProductCardSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { Price } from '@/components/ui/Price'
import { Switch } from '@/components/ui/Switch'
import { Logo } from '@/components/ui/Logo'
import { Dialog, DialogContent, DialogTrigger, DialogClose, SheetContent } from '@/components/ui/Dialog'
import { toast } from '@/components/ui/Toaster'
import { ORDER_STATUS } from '@/utils/orderMachine'
import { PAYMENT_STATUS } from '@/utils/paymentMachine'
import { useAuthStore } from '@/stores/authStore'
import { DeliveryFeeLab } from './DeliveryFeeLab'

const COLORS = [
  ['bg', 'Off-white'], ['surface', 'Surface'], ['surface-2', 'Tint'], ['line', 'Line'],
  ['ink', 'Charcoal'], ['ink-muted', 'Muted'], ['brand', 'Forest'], ['brand-deep', 'Logo green'],
  ['fresh', 'Fresh'], ['accent', 'Sun (accent)'], ['danger', 'Danger'], ['warning', 'Warning'],
]

function Section({ id, title, children, note }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-t border-line py-10">
      <h2 id={`${id}-h`} className="font-display text-2xl font-bold tracking-tight">{title}</h2>
      {note && <p className="mt-1 text-sm text-ink-subtle">{note}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}

export default function StyleguidePage() {
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpErr, setOtpErr] = useState(0)
  const [otpOk, setOtpOk] = useState(false)
  const [available, setAvailable] = useState(true)
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const emailError = emailTouched && !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email, like name@college.edu' : null

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 md:px-6">
      <Badge tone="outline" size="md">Internal · not linked from the site</Badge>
      <h1 className="mt-4 font-display text-5xl font-bold tracking-display md:text-6xl">Design system</h1>
      <p className="mt-3 max-w-xl text-ink-muted">Phase 1 foundation: tokens, primitives, states and the delivery-fee rules, in one place for review at 375 / 768 / 1440px.</p>

      <Section id="brand" title="Brand & colour" note="Sampled from the MartIT logo. One accent element per viewport.">
        <div className="flex flex-wrap items-center gap-8">
          <Logo size="lg" />
          <img src="/brand/logo-lockup.png" alt="MartIT logo lockup" className="h-24 w-auto rounded-tile bg-white p-2" width="351" height="228" />
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {COLORS.map(([token, name]) => (
            <li key={token} className="overflow-hidden rounded-tile border border-line bg-surface">
              <div className="h-16" style={{ background: `var(--${token})` }} />
              <div className="p-2.5">
                <p className="text-sm font-medium">{name}</p>
                <p className="font-mono text-xs text-ink-subtle">--{token}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="type" title="Typography" note="Bricolage Grotesque (display, tight tracking) + Geist (UI). Prices use tabular figures.">
        <div className="grid gap-4">
          <p className="font-display text-6xl font-bold leading-none tracking-display">Campus, sorted.</p>
          <p className="font-display text-4xl font-bold tracking-display">Heading two</p>
          <p className="font-display text-2xl font-semibold tracking-tight">Heading three</p>
          <p className="max-w-prose text-lg text-ink-muted">Body large — order essentials and get them handed over with a one-time code.</p>
          <p className="max-w-prose">Body — Geist at 16px for interface text and longer reading.</p>
          <p className="text-sm text-ink-subtle">Caption — supporting detail and hints.</p>
          <div className="flex flex-wrap gap-6">
            <Price amount={28} />
            <Price amount={45} mrp={50} />
            <Price amount={1249.5} size="lg" />
          </div>
        </div>
      </Section>

      <Section id="buttons" title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="accent">Accent CTA</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button
            loading={loading}
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 1600)
            }}
          >
            Click to load
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section id="inputs" title="Inputs & validation" note="Errors appear beside the field and are announced to screen readers.">
        <div className="grid max-w-md gap-5">
          <Field label="College email" hint="We'll send order updates here." error={emailError}>
            <Input
              type="email"
              icon={Mail}
              placeholder="name@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
            />
          </Field>
          <Field label="Password">
            <PasswordInput placeholder="At least 8 characters" />
          </Field>
          <Field label="Search" optional>
            <Input icon={Search} placeholder="Search milk, bread, notebooks…" />
          </Field>
        </div>
      </Section>

      <Section id="otp" title="OTP input" note="UI demo only — real delivery OTPs are short-lived, attempt-limited and verified on the server. Sample code: 2468.">
        <div className="grid max-w-md gap-4">
          <OtpInput
            value={otp}
            onChange={(v) => {
              setOtp(v)
              setOtpOk(false)
            }}
            onComplete={(v) => (v === '2468' ? setOtpOk(true) : setOtpErr((n) => n + 1))}
            errorKey={otpErr}
            success={otpOk}
            label="Delivery code"
          />
          <p className="min-h-5 text-sm" aria-live="polite">
            {otpOk ? <span className="font-medium text-fresh-ink">Code accepted.</span> : otpErr > 0 ? <span className="text-danger">That code didn't match. Try again.</span> : null}
          </p>
          <Button variant="secondary" size="sm" className="w-fit" onClick={() => { setOtp(''); setOtpOk(false); setOtpErr(0) }}>
            Reset
          </Button>
        </div>
      </Section>

      <Section id="status" title="Status pills" note="Order and payment are separate state machines; each gets its own pill.">
        <div className="flex flex-wrap gap-2">
          {Object.values(ORDER_STATUS).map((s) => <OrderStatusPill key={s} status={s} />)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.values(PAYMENT_STATUS).map((s) => <PaymentStatusPill key={s} status={s} />)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>Neutral</Badge><Badge tone="brand">Brand</Badge><Badge tone="accent">Accent</Badge><Badge tone="info">Info</Badge><Badge tone="outline">Outline</Badge>
        </div>
      </Section>

      <Section id="cards" title="Cards">
        <div className="grid gap-5 md:grid-cols-3">
          <Card className="p-5">
            <p className="font-semibold">Plain card</p>
            <p className="mt-1 text-sm text-ink-muted">Radius 20, hairline border, soft shadow.</p>
          </Card>
          <Card interactive className="p-5" tabIndex={0}>
            <p className="font-semibold">Interactive card</p>
            <p className="mt-1 text-sm text-ink-muted">Lifts on hover with transform only.</p>
          </Card>
          <ReceiptCard footer={<div className="flex justify-between text-sm"><span className="text-ink-muted">Total</span><Price amount={71} /></div>}>
            <p className="font-display text-lg font-semibold">Receipt stub</p>
            <p className="mt-1 text-sm text-ink-muted">Signature card for orders and handover.</p>
          </ReceiptCard>
        </div>
      </Section>

      <Section id="skeletons" title="Skeletons">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <div className="col-span-2 grid content-start gap-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </Section>

      <Section id="overlays" title="Toasts, dialogs & sheets">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => toast.success('Added to cart', { description: 'Toned Milk · 500 ml (sample)' })}>Success toast</Button>
          <Button variant="secondary" onClick={() => toast.error("Couldn't reach the store", { description: 'Check your connection and try again.' })}>Error toast</Button>
          <Dialog>
            <DialogTrigger asChild><Button variant="secondary">Dialog</Button></DialogTrigger>
            <DialogContent title="Cancel this order?" description="You can cancel until the store starts preparing it.">
              <div className="flex justify-end gap-2">
                <DialogClose asChild><Button variant="ghost">Keep order</Button></DialogClose>
                <DialogClose asChild><Button variant="danger">Cancel order</Button></DialogClose>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild><Button variant="secondary">Sheet</Button></DialogTrigger>
            <SheetContent title="Product details" description="Bottom sheet on mobile, side panel on desktop.">
              <div className="grid gap-3 py-2">
                <Skeleton className="aspect-[4/3] rounded-card" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            </SheetContent>
          </Dialog>
        </div>
      </Section>

      <Section id="switch" title="Switch">
        <label className="flex w-fit cursor-pointer items-center gap-3">
          <Switch checked={available} onCheckedChange={setAvailable} />
          <span className="font-medium">{available ? 'Available for deliveries' : 'Offline'}</span>
        </label>
      </Section>

      <Section id="fees" title="Delivery fee rules" note="Confirmed policy 2026-10-09. Server quote is authoritative; the slider is a client-side estimate.">
        <DeliveryFeeLab />
      </Section>

      <AccessSection />
    </div>
  )
}

function AccessSection() {
  const { user, demoLogin, logout } = useAuthStore()
  return (
    <Section id="access" title="Access rules" note="Customer and runner routes have separate checks. Runner = assigned + approved, never self-selected.">
      <p className="text-sm">
        Session: <strong>{user ? `${user.name} · roles: ${user.roles.join(', ')}` : 'signed out'}</strong>
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="secondary" size="sm" onClick={() => demoLogin('customer').catch((e) => toast.error(e.message))}>Sign in as sample customer</Button>
        <Button variant="secondary" size="sm" onClick={() => demoLogin('runner').catch((e) => toast.error(e.message))}>Sign in as sample runner</Button>
        <Button variant="ghost" size="sm" onClick={logout} disabled={!user}>Sign out</Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link className="font-medium text-fresh-ink underline underline-offset-4" to="/app">Open /app (customer)</Link>
        <Link className="font-medium text-fresh-ink underline underline-offset-4" to="/runner">Open /runner (runner)</Link>
        <Link className="font-medium text-fresh-ink underline underline-offset-4" to="/this-page-does-not-exist">Branded 404</Link>
      </div>
    </Section>
  )
}
