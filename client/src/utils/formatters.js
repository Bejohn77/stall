export function formatCurrency(value, currency = '৳') {
  return `${currency}${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`
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
