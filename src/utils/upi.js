/**
 * UPI URI Generator and Validator.
 *
 * Adheres strictly to NPCI UPI Deep Linking specifications:
 * Format: upi://pay?pa={payeeVPA}&pn={payeeName}&am={amount}&cu=INR&tn={note}&tr={reference}
 *
 * SAFETY RULES:
 * 1. Never hardcode fake UPI IDs or invent credentials.
 * 2. Fail safely when payee VPA configuration is missing.
 * 3. Encode the exact authoritative total, formatted strictly to 2 decimal places.
 */

/**
 * Builds and validates a standard UPI payment URI from authoritative order parameters.
 *
 * @param {Object} params
 * @param {string} params.payeeVpa - Payee UPI address (e.g. from env.upiPayeeVpa).
 * @param {string} [params.payeeName='MartIT'] - Payee display name.
 * @param {number} params.amount - Exact authoritative order total (including platform fee).
 * @param {string} params.orderId - Unique authoritative order identifier.
 * @param {string} [params.note] - Optional transaction note.
 * @returns {{ ok: boolean, uri?: string, error?: string, message?: string, amountFormatted?: string }}
 */
export function buildUpiPayload({
  payeeVpa,
  payeeName = 'MartIT',
  amount,
  orderId,
  note,
}) {
  const vpa = typeof payeeVpa === 'string' ? payeeVpa.trim() : ''

  if (!vpa) {
    return {
      ok: false,
      error: 'MISSING_PAYEE_VPA',
      message:
        'UPI Payee VPA is not configured. Live UPI QR generation requires an approved merchant VPA (set VITE_UPI_PAYEE_VPA).',
    }
  }

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false,
      error: 'INVALID_AMOUNT',
      message: 'Authoritative payable amount must be a positive number.',
    }
  }

  if (!orderId || typeof orderId !== 'string') {
    return {
      ok: false,
      error: 'MISSING_ORDER_ID',
      message: 'A valid order reference is required to generate a payment UPI payload.',
    }
  }

  // Exact 2-decimal formatted amount according to UPI spec
  const amountFormatted = amount.toFixed(2)
  const transactionNote = note || `MartIT Order ${orderId}`

  const params = new URLSearchParams()
  params.set('pa', vpa)
  params.set('pn', payeeName || 'MartIT')
  params.set('am', amountFormatted)
  params.set('cu', 'INR')
  params.set('tn', transactionNote)
  params.set('tr', orderId)

  // Standard UPI URI format
  const uri = `upi://pay?${params.toString()}`

  return {
    ok: true,
    uri,
    amountFormatted,
    payeeVpa: vpa,
    payeeName,
    orderId,
  }
}
