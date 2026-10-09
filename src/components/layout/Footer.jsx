import { Link } from 'react-router'
import { Logo } from '@/components/ui/Logo'

const COLUMNS = [
  {
    title: 'MartIT',
    links: [
      { to: '/#how-it-works', label: 'How it works' },
      { to: '/#categories', label: 'Categories' },
      { to: '/#about', label: 'About' },
      { to: '/#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/login', label: 'Log in' },
      { to: '/signup', label: 'Create account' },
    ],
  },
]

/** Footer with internal links only — no placeholder social or legal links until they exist. */
export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm text-ink-muted">
            Groceries and daily essentials for campuses, hostels and residential communities — delivered by student runners.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-sans text-sm font-semibold text-ink">{col.title}</h2>
            <ul className="mt-3 grid gap-2">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-ink-muted transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-[13px] text-ink-subtle md:px-6">
          © {new Date().getFullYear()} MartIT. Prices and products shown in this build are sample data.
        </p>
      </div>
    </footer>
  )
}
