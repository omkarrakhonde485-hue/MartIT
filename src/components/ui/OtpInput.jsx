import { useEffect, useRef } from 'react'
import { m, useAnimationControls } from 'motion/react'
import { cn } from '@/utils/cn'
import { spring } from '@/utils/motion'

/**
 * Segmented OTP input. Auto-advances, supports paste and backspace across boxes.
 * Shakes when `errorKey` changes (bump it on every failed attempt), and turns green on `success`.
 * Verification itself must happen on the backend — this component only collects digits.
 */
export function OtpInput({
  length = 4,
  value,
  onChange,
  onComplete,
  disabled,
  success = false,
  errorKey = 0,
  label = 'One-time code',
  className,
}) {
  const refs = useRef([])
  const controls = useAnimationControls()
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')
  const hasError = errorKey > 0 && !success

  useEffect(() => {
    if (errorKey > 0) {
      controls.start({ x: [0, -8, 8, -5, 4, 0], transition: { duration: 0.42 } })
      refs.current[0]?.focus()
    }
  }, [errorKey, controls])

  const commit = (next) => {
    const clean = next.replace(/\D/g, '').slice(0, length)
    onChange(clean)
    if (clean.length === length) onComplete?.(clean)
    return clean
  }

  const handleInput = (i, e) => {
    const typed = e.target.value.replace(/\D/g, '')
    if (!typed) return
    const next = (value.slice(0, i) + typed + value.slice(i + typed.length)).slice(0, length)
    const clean = commit(next)
    refs.current[Math.min(clean.length, length - 1)]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[i]) commit(value.slice(0, i) + value.slice(i + 1))
      else if (i > 0) {
        commit(value.slice(0, i - 1) + value.slice(i))
        refs.current[i - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const clean = commit(e.clipboardData.getData('text'))
    refs.current[Math.min(clean.length, length - 1)]?.focus()
  }

  return (
    <m.div role="group" aria-label={label} animate={controls} className={cn('flex gap-2.5', className)}>
      {digits.map((d, i) => (
        <m.input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          onChange={(e) => handleInput(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          disabled={disabled || success}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={hasError || undefined}
          animate={success ? { scale: [1, 1.08, 1], transition: { delay: i * 0.05, ...spring.bouncy } } : { scale: 1 }}
          className={cn(
            'tabular size-14 rounded-tile border-2 bg-surface text-center font-display text-2xl font-semibold text-ink',
            'caret-brand transition-[border-color,background-color] duration-200 focus:outline-none',
            'border-line-strong focus:border-brand',
            d && 'border-ink-subtle',
            hasError && 'border-danger focus:border-danger',
            success && 'border-fresh bg-brand-soft text-fresh-ink',
          )}
        />
      ))}
    </m.div>
  )
}
