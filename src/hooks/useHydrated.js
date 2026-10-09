import { useSyncExternalStore } from 'react'

const noop = () => () => {}

/**
 * false on the server and during hydration, true afterwards. Use it for UI that
 * depends on browser-only state (session, saved theme) so pre-rendered HTML and
 * the first client render match.
 */
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false)
