/** Runs `fn` when the browser is idle (or after a short delay where unsupported). */
export function whenIdle(fn, timeout = 2000) {
  if (typeof window === 'undefined') return
  if ('requestIdleCallback' in window) window.requestIdleCallback(() => fn(), { timeout })
  else setTimeout(fn, 200)
}
