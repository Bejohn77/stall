const Sale = require('../models/Sale')
const ServiceBill = require('../models/ServiceBill')
const { getMode, getStore } = require('../utils/store')

function buildDateRange(type, from, to) {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  if (type === 'daily') {
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
  } else if (type === 'weekly') {
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    start.setDate(now.getDate() + diff)
    start.setHours(0, 0, 0, 0)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
  } else if (type === 'monthly') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    end.setMonth(end.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
  } else if (type === 'custom' && from && to) {
    start.setTime(new Date(from).getTime())
    end.setTime(new Date(to).getTime())
    end.setHours(23, 59, 59, 999)
  }

  return { start, end }
}

function summarizeServiceActivity(sales = [], bills = []) {
  const serviceItems = []

  for (const sale of sales) {
    for (const item of sale.items || []) {
      if (item.type === 'service') {
        serviceItems.push(item)
      }
    }
  }

  for (const bill of bills) {
    for (const item of bill.items || []) {
      if (item.type === 'service' || item.serviceName || item.serviceType) {
        serviceItems.push(item)
      }
    }
  }

  const counts = serviceItems.reduce((acc, item) => {
    const name = item.name || item.serviceName || item.serviceType || 'Custom service'
    acc[name] = (acc[name] || 0) + (Number(item.quantity || 0))
    return acc
  }, {})

  const totalServiceRevenue = serviceItems.reduce((sum, item) => sum + (Number(item.total || 0) || Number(item.subtotal || 0) || 0), 0)
  const serviceBillCount = sales.filter((sale) => (sale.items || []).some((item) => item.type === 'service')).length + bills.length

  return {
    totalServiceRevenue,
    serviceBillCount,
    serviceItemCount: serviceItems.length,
    mostUsedService: Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
  }
}

async function getReport(req, res, next) {
  try {
    const type = req.params.type || 'daily'
    const { from, to } = req.query
    const range = buildDateRange(type, from, to)

    let sales = []
    let serviceBills = []
    if (getMode() === 'memory') {
      const store = getStore()
      sales = store.sales.filter((sale) => new Date(sale.createdAt) >= range.start && new Date(sale.createdAt) <= range.end)
      sales.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      serviceBills = (store.serviceBills || []).filter((bill) => new Date(bill.createdAt) >= range.start && new Date(bill.createdAt) <= range.end)
    } else {
      sales = await Sale.find({ createdAt: { $gte: range.start, $lte: range.end } }).sort({ createdAt: 1 })
      serviceBills = await ServiceBill.find({ createdAt: { $gte: range.start, $lte: range.end } }).sort({ createdAt: 1 })
    }

    const summary = {
      sales: sales.reduce((sum, sale) => sum + sale.grandTotal, 0),
      profit: sales.reduce((sum, sale) => sum + sale.profit, 0),
      productsSold: sales.reduce((sum, sale) => sum + sale.items.reduce((count, item) => count + item.quantity, 0), 0),
    }

    const chartData = sales.length
      ? sales.map((sale) => ({ name: sale.invoiceNumber, revenue: sale.grandTotal, profit: sale.profit }))
      : [{ name: 'No data', revenue: 0, profit: 0 }]

    const bestProducts = sales.flatMap((sale) => sale.items).reduce((acc, item) => {
      const existing = acc.find((entry) => entry._id === item.name)
      if (existing) existing.quantity += item.quantity
      else acc.push({ _id: item.name, name: item.name, quantity: item.quantity })
      return acc
    }, []).sort((a, b) => b.quantity - a.quantity).slice(0, 5)

    res.json({
      period: type,
      summary,
      chartData,
      bestProducts,
      serviceSummary: summarizeServiceActivity(sales, serviceBills),
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { getReport, summarizeServiceActivity }
