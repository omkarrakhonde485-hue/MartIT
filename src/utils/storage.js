/** Storage can throw (private mode, blocked site data). Never rely on it for important state. */
export const safeStorage = {
  get(key) {
    try { return localStorage.getItem(key) } catch { return null }
  },
  set(key, value) {
    try { localStorage.setItem(key, value) } catch { /* ignore */ }
  },
  remove(key) {
    try { localStorage.removeItem(key) } catch { /* ignore */ }
  },
}

/** zustand `persist` storage adapter that tolerates unavailable storage. */
export const zustandSafeStorage = {
  getItem: (name) => safeStorage.get(name),
  setItem: (name, value) => safeStorage.set(name, value),
  removeItem: (name) => safeStorage.remove(name),
}
