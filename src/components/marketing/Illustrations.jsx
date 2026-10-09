/**
 * Custom grocery illustrations (MartIT originals). Soft "clay" style: flat base,
 * one highlight, one shade, a contact shadow. All share a 96×96 viewBox so they
 * compose at the same scale. Decorative — always aria-hidden.
 */

const Shadow = ({ cx = 48, cy = 88, rx = 26 }) => <ellipse cx={cx} cy={cy} rx={rx} ry="4.5" fill="#0b1410" opacity=".14" />

function Svg({ children, className, title }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" focusable="false">
      {title && <title>{title}</title>}
      {children}
    </svg>
  )
}

export function MilkCarton({ className }) {
  return (
    <Svg className={className}>
      <Shadow rx="22" />
      <path d="M30 30 40 16h16l10 14v54a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4z" fill="#f8fafc" />
      <path d="M48 30h18v54a4 4 0 0 1-4 4H48z" fill="#e2e8f0" />
      <path d="M40 16h16v-4a2 2 0 0 0-2-2H42a2 2 0 0 0-2 2z" fill="#22c55e" />
      <path d="M30 30 40 16h8l-8 14z" fill="#ffffff" />
      <rect x="30" y="46" width="36" height="22" fill="#2f7cf6" />
      <rect x="48" y="46" width="18" height="22" fill="#1d5fd0" />
      <path d="M38 62c3-7 6-7 10-2s7 4 10-2" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  )
}

export function BreadLoaf({ className }) {
  return (
    <Svg className={className}>
      <Shadow rx="30" />
      <path d="M16 52c0-14 14-24 32-24s32 10 32 24v26a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z" fill="#d98b3a" />
      <path d="M20 54c0-11 12-19 28-19s28 8 28 19v22a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill="#f3c27a" />
      <path d="M48 35c16 0 28 8 28 19v22a4 4 0 0 1-4 4H48z" fill="#e8ad5e" />
      <path d="M32 40c4 4 4 9 0 13M46 37c4 4 4 9 0 13M60 40c4 4 4 9 0 13" fill="none" stroke="#c4762c" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  )
}

export function Bananas({ className }) {
  return (
    <Svg className={className}>
      <Shadow rx="28" />
      <path d="M18 40c4 26 26 40 56 36 4-1 4-6 0-7-22 2-38-10-46-31-2-5-11-4-10 2z" fill="#f4c21b" />
      <path d="M26 38c6 20 22 30 46 31 4 0 5 5 1 6-24 3-42-9-50-33z" fill="#e0a800" />
      <path d="M24 30c8 22 26 34 52 32 4 0 5-5 1-6-22 0-36-11-44-29-2-5-10-3-9 3z" fill="#ffd84a" />
      <path d="M20 33c-1-4-5-6-4-10 1-2 5-2 6 0 2 3 1 7-2 10z" fill="#6b4f12" />
    </Svg>
  )
}

export function NoodleCup({ className }) {
  return (
    <Svg className={className}>
      <Shadow rx="22" />
      <path d="M22 28h52l-7 56a4 4 0 0 1-4 3H33a4 4 0 0 1-4-3z" fill="#ef4444" />
      <path d="M48 28h26l-7 56a4 4 0 0 1-4 3H48z" fill="#dc2626" />
      <rect x="18" y="20" width="60" height="10" rx="4" fill="#f8fafc" />
      <rect x="48" y="20" width="30" height="10" rx="4" fill="#e2e8f0" />
      <path d="M28 46h40l-1.5 12h-37z" fill="#fcbe0f" />
      <path d="M34 52c3-3 5 3 8 0s5 3 8 0 5 3 8 0" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  )
}

export function Notebook({ className }) {
  return (
    <Svg className={className}>
      <Shadow rx="24" />
      <rect x="24" y="14" width="50" height="70" rx="5" fill="#166534" />
      <rect x="49" y="14" width="25" height="70" rx="5" fill="#14532d" />
      <rect x="30" y="14" width="6" height="70" fill="#0f3f22" />
      <rect x="42" y="28" width="24" height="14" rx="3" fill="#f8fafc" />
      <path d="M46 33h16M46 37h10" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <path d="M62 56 78 40l6 6-16 16-8 2z" fill="#fcbe0f" />
      <path d="m78 40 6 6 3-3a2 2 0 0 0 0-3l-3-3a2 2 0 0 0-3 0z" fill="#ef4444" />
    </Svg>
  )
}

export function Apple({ className }) {
  return (
    <Svg className={className}>
      <Shadow rx="22" />
      <path d="M48 32c-8-6-26-6-28 14-2 18 10 38 22 38 3 0 4-2 6-2s3 2 6 2c12 0 24-20 22-38-2-20-20-20-28-14z" fill="#e5484d" />
      <path d="M48 32c8-6 26-6 28 14 2 18-10 38-22 38-3 0-4-2-6-2z" fill="#c9333a" />
      <ellipse cx="33" cy="47" rx="5" ry="8" fill="#ff8a8e" opacity=".7" />
      <path d="M48 32c0-6 2-12 6-16" fill="none" stroke="#6b4f12" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M52 24c4-8 14-10 18-6-4 8-12 10-18 6z" fill="#22c55e" />
    </Svg>
  )
}

export function SodaCan({ className }) {
  return (
    <Svg className={className}>
      <Shadow rx="18" />
      <rect x="30" y="18" width="36" height="68" rx="7" fill="#22c55e" />
      <rect x="48" y="18" width="18" height="68" rx="0" fill="#16a34a" />
      <path d="M48 18h11a7 7 0 0 1 7 7v54a7 7 0 0 1-7 7H48z" fill="#16a34a" />
      <rect x="32" y="12" width="32" height="8" rx="3" fill="#cbd5e1" />
      <path d="M30 44h36v14H30z" fill="#f8fafc" />
      <path d="M48 44h18v14H48z" fill="#e2e8f0" />
      <path d="M36 51h10" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
      <rect x="33" y="22" width="5" height="60" rx="2.5" fill="#fff" opacity=".35" />
    </Svg>
  )
}

export function Eggs({ className }) {
  return (
    <Svg className={className}>
      <Shadow rx="30" />
      <path d="M14 56h68l-6 26a4 4 0 0 1-4 3H24a4 4 0 0 1-4-3z" fill="#c9a77c" />
      <path d="M48 56h34l-6 26a4 4 0 0 1-4 3H48z" fill="#b8956a" />
      {[26, 42, 58, 72].map((cx, i) => (
        <g key={cx}>
          <ellipse cx={cx} cy={50 - (i % 2) * 3} rx="8" ry="10" fill="#fff7ed" />
          <ellipse cx={cx + 2.5} cy={52 - (i % 2) * 3} rx="5" ry="7.5" fill="#fde7cf" />
        </g>
      ))}
    </Svg>
  )
}

export function SoapBottle({ className }) {
  return (
    <Svg className={className}>
      <Shadow rx="20" />
      <rect x="44" y="12" width="8" height="14" rx="2" fill="#94a3b8" />
      <path d="M40 12h22a3 3 0 0 1 0 6H40z" fill="#cbd5e1" />
      <rect x="28" y="26" width="40" height="60" rx="12" fill="#a78bfa" />
      <path d="M48 26h8a12 12 0 0 1 12 12v36a12 12 0 0 1-12 12h-8z" fill="#8b5cf6" />
      <rect x="34" y="46" width="28" height="20" rx="5" fill="#f8fafc" />
      <circle cx="30" cy="22" r="4" fill="#e0f2fe" />
      <circle cx="22" cy="30" r="2.5" fill="#e0f2fe" />
    </Svg>
  )
}

export function SprayBottle({ className }) {
  return (
    <Svg className={className}>
      <Shadow rx="20" />
      <path d="M36 40h26l4 42a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4z" fill="#38bdf8" />
      <path d="M49 40h13l4 42a4 4 0 0 1-4 4H49z" fill="#0ea5e9" />
      <path d="M40 26h18v14H40z" fill="#f8fafc" />
      <path d="M40 18h26l6 6-4 4H40z" fill="#22c55e" />
      <path d="M58 30h10l-6 10" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
      <rect x="38" y="56" width="22" height="14" rx="3" fill="#f8fafc" opacity=".9" />
    </Svg>
  )
}

export const ITEM_ILLUSTRATIONS = { MilkCarton, BreadLoaf, Bananas, NoodleCup, Notebook, Apple, SodaCan, Eggs, SoapBottle, SprayBottle }
