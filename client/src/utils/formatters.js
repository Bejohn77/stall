export function formatCurrency(value, currency = '৳') {
  const parsedValue = Number(value)
  const safeValue = Number.isFinite(parsedValue) ? parsedValue : 0
  return `${currency}${safeValue.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleString('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
