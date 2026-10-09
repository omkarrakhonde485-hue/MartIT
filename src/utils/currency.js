const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** ₹ formatting, Indian digit grouping. Amounts are whole rupees or paise-precise numbers. */
export function formatINR(amount) {
  return inr.format(amount)
}

/** Avoids float drift when summing rupee amounts that may carry paise. */
export function sumRupees(values) {
  return Math.round(values.reduce((acc, v) => acc + Math.round(v * 100), 0)) / 100
}
