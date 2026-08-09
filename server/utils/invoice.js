function calculateInvoiceProfit(items = []) {
  return (items || []).reduce((profit, item) => {
    const quantity = Number(item.quantity || 0)
    const unitPrice = Number(item.unitPrice || 0)
    const discount = Number(item.discount || 0)

    if (item.type === 'service') {
      const lineTotal = quantity * unitPrice
      const itemDiscount = Math.min(discount, lineTotal)
      return profit + Math.max(0, lineTotal - itemDiscount)
    }

    const buyingPrice = Number(item.buyingPrice || 0)
    const grossProfit = (unitPrice - buyingPrice) * quantity
    const itemDiscount = Math.min(discount, quantity * unitPrice)
    return profit + Math.max(0, grossProfit - itemDiscount)
  }, 0)
}

function calculateSaleGrossProfit(sale = {}) {
  const normalizedItems = (sale?.items || []).filter((item) => item && typeof item === 'object')
  if (normalizedItems.length) {
    return normalizedItems.reduce((profit, item) => {
      const quantity = Number(item.quantity || 0)
      const unitPrice = Number(item.unitPrice || 0)

      if (item.type === 'service') {
        return profit + quantity * unitPrice
      }

      const buyingPrice = Number(item.buyingPrice || 0)
      return profit + Math.max(0, (unitPrice - buyingPrice) * quantity)
    }, 0)
  }

  return Number.isFinite(Number(sale?.profit)) ? Number(sale.profit) : 0
}

function calculateSaleDiscount(sale = {}) {
  const normalizedItems = (sale?.items || []).filter((item) => item && typeof item === 'object')
  if (normalizedItems.length) {
    return normalizedItems.reduce((sum, item) => sum + Number(item.discount || 0), 0)
  }

  return Number.isFinite(Number(sale?.discount)) ? Number(sale.discount) : 0
}

function calculateSaleProfit(sale = {}) {
  const normalizedItems = (sale?.items || []).filter((item) => item && typeof item === 'object')
  if (normalizedItems.length) {
    return calculateInvoiceProfit(normalizedItems)
  }
  return Number.isFinite(Number(sale?.profit)) ? Number(sale.profit) : 0
}

function calculatePeriodProfitMetrics({ sales = [], damages = [], costs = [] } = {}) {
  const salesProfitValue = (sales || []).reduce((sum, sale) => sum + calculateSaleProfit(sale), 0)
  const salesGrossProfitValue = (sales || []).reduce((sum, sale) => sum + calculateSaleGrossProfit(sale), 0)
  const salesDiscountValue = (sales || []).reduce((sum, sale) => sum + calculateSaleDiscount(sale), 0)
  const damageCostValue = (damages || []).reduce((sum, damage) => sum + Number(damage?.totalLoss || (damage?.quantity && damage?.costPrice ? Number(damage.quantity) * Number(damage.costPrice) : 0) || damage?.amount || 0), 0)
  const businessCostValue = (costs || []).reduce((sum, cost) => sum + Number(cost?.amount || 0), 0)
  // Gross profit should reflect Total Sales - Product Cost
  // salesGrossProfitValue = (Total Product Selling Price - Total Product Cost) + Service Revenue (from sales)
  // salesDiscountValue = Total Discount
  // Therefore Gross Profit = salesGrossProfitValue - salesDiscountValue
  const grossProfitValue = salesGrossProfitValue - salesDiscountValue
  // Net Profit = Gross Profit - Damage Cost - Business/Operating Cost
  const netProfitValue = grossProfitValue - damageCostValue - businessCostValue

  return {
    salesProfitValue,
    salesDiscountValue,
    damageCostValue,
    businessCostValue,
    grossProfitValue,
    netProfitValue,
  }
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

  const hasSupportedItems = items.some((item) => item?.type === 'service' || item?.type === 'product')
  if (!hasSupportedItems) {
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

  const rawPaidAmount = payload?.paidAmount
  let normalizedPaidAmount = null

  if (rawPaidAmount === '' || rawPaidAmount === null || rawPaidAmount === undefined) {
    normalizedPaidAmount = null
  } else if (typeof rawPaidAmount === 'string' && rawPaidAmount.trim() === '') {
    normalizedPaidAmount = null
  } else {
    normalizedPaidAmount = Number(rawPaidAmount)
  }

  if (normalizedPaidAmount === null || Number.isNaN(normalizedPaidAmount) || normalizedPaidAmount <= 0) {
    return { ok: false, message: 'Paid amount is required before saving the invoice.' }
  }

  return { ok: true }
}

module.exports = { calculateInvoiceProfit, calculateSaleGrossProfit, calculateSaleDiscount, calculateSaleProfit, calculatePeriodProfitMetrics, calculateInvoiceSummary, getInventoryUpdates, validateInvoicePayload }
