const inrWhole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const inrPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** ₹ formatting, Indian digit grouping. Amounts are whole rupees or paise-precise numbers. */
export function formatINR(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '₹0'
  const hasPaise = Math.abs(Math.round(amount * 100) % 100) > 0
  return hasPaise ? inrPaise.format(amount) : inrWhole.format(amount)
}

/** Avoids float drift when summing rupee amounts that may carry paise. */
export function sumRupees(values) {
  return Math.round(values.reduce((acc, v) => acc + Math.round(v * 100), 0)) / 100
}
