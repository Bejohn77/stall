function calculateInvoiceProfit(items = []) {
  return (items || []).reduce((profit, item) => {
    const quantity = Number(item.quantity || 0)
    const unitPrice = Number(item.unitPrice || 0)

    if (item.type === 'service') {
      return profit + quantity * unitPrice
    }

    const buyingPrice = Number(item.buyingPrice || 0)
    return profit + (unitPrice - buyingPrice) * quantity
  }, 0)
}

function calculateInvoiceSummary(items = [], paidAmount = 0) {
  const normalizedItems = (items || []).map((item) => {
    const quantity = Number(item.quantity || 0)
    const unitPrice = Number(item.unitPrice || 0)
    const discount = Number(item.discount || 0)
    const tax = Number(item.tax || 0)
    const lineTotal = quantity * unitPrice
    const itemDiscount = Math.min(discount, lineTotal)
    const itemTax = tax
    const netTotal = Math.max(0, lineTotal - itemDiscount + itemTax)

    return {
      ...item,
      description: item.description || '',
      quantity,
      unitPrice,
      discount: itemDiscount,
      tax: itemTax,
      total: netTotal,
    }
  })

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const discount = normalizedItems.reduce((sum, item) => sum + item.discount, 0)
  const tax = normalizedItems.reduce((sum, item) => sum + item.tax, 0)
  const grandTotal = Math.max(0, subtotal - discount + tax)
  const amountPaid = Number(paidAmount || 0)
  const dueAmount = Math.max(0, grandTotal - amountPaid)
  const change = Math.max(0, amountPaid - grandTotal)

  return {
    items: normalizedItems,
    subtotal,
    discount,
    tax,
    grandTotal,
    paidAmount: amountPaid,
    dueAmount,
    change,
  }
}

function getInventoryUpdates(items = []) {
  return (items || [])
    .filter((item) => item.type === 'product' && item.productId)
    .map((item) => ({ productId: item.productId, quantity: Number(item.quantity || 0) }))
}

function validateInvoicePayload(payload) {
  const items = payload?.items || []
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, message: 'Add at least one product or service item to the invoice.' }
  }

  for (const item of items) {
    if (item.type === 'service') {
      const name = `${item.name || ''}`.trim()
      const quantity = Number(item.quantity || 0)
      const unitPrice = Number(item.unitPrice || 0)
      if (!name) return { ok: false, message: 'Service name is required.' }
      if (quantity <= 0) return { ok: false, message: 'Service quantity must be greater than zero.' }
      if (Number.isNaN(unitPrice) || unitPrice < 0) return { ok: false, message: 'Service unit price must be a valid non-negative number.' }
    }

    if (item.type === 'product') {
      const name = `${item.name || ''}`.trim()
      const quantity = Number(item.quantity || 0)
      const unitPrice = Number(item.unitPrice || 0)
      if (!name) return { ok: false, message: 'Product name is required.' }
      if (quantity <= 0) return { ok: false, message: 'Product quantity must be greater than zero.' }
      if (Number.isNaN(unitPrice) || unitPrice < 0) return { ok: false, message: 'Product unit price must be a valid non-negative number.' }
    }
  }

  return { ok: true }
}

module.exports = { calculateInvoiceProfit, calculateInvoiceSummary, getInventoryUpdates, validateInvoicePayload }
