/** Public, non-secret runtime config. Secrets never belong in client code. */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.trim() || '',
  upiPayeeName: import.meta.env.VITE_UPI_PAYEE_NAME?.trim() || 'MartIT',
  upiPayeeVpa: import.meta.env.VITE_UPI_PAYEE_VPA?.trim() || '',
}

export const isMockBackend = !env.apiBaseUrl
