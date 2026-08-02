const Sale = require('../models/Sale')
const ServiceBill = require('../models/ServiceBill')
const Damage = require('../models/Damage')
const MonthlyCost = require('../models/MonthlyCost')
const { getMode, getStore } = require('../utils/store')

function buildDateRange(type, from, to) {
  const now = new Date()
  const bangladeshTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = bangladeshTime.formatToParts(now)
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const bangladeshNow = new Date(
    Number(partMap.year),
    Number(partMap.month) - 1,
    Number(partMap.day),
    Number(partMap.hour),
    Number(partMap.minute),
    Number(partMap.second),
  )
  const start = new Date(bangladeshNow)
  const end = new Date(bangladeshNow)

  if (type === 'daily') {
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
  } else if (type === 'weekly') {
    const day = bangladeshNow.getDay()
    const diff = day === 0 ? -6 : 1 - day
    start.setDate(bangladeshNow.getDate() + diff)
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

function calculateServiceLineRevenue(item = {}) {
  const quantity = Number(item.quantity || 0)
  const unitPrice = Number(item.unitPrice ?? item.rate ?? item.price ?? item.amount ?? 0)
  const discount = Number(item.discount || 0)
  const tax = Number(item.tax || 0)
  const explicitLineTotal = Number(item.total ?? item.lineTotal ?? item.amount ?? 0)

  if (explicitLineTotal) return explicitLineTotal

  const baseLineTotal = quantity * unitPrice
  return Math.max(0, baseLineTotal - Math.min(discount, baseLineTotal) + tax)
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

  const totalServiceRevenue = serviceItems.reduce((sum, item) => sum + calculateServiceLineRevenue(item), 0)
  const serviceBillCount = sales.filter((sale) => (sale.items || []).some((item) => item.type === 'service')).length + bills.length

  return {
    totalServiceRevenue,
    serviceBillCount,
    serviceItemCount: serviceItems.length,
    mostUsedService: Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
  }
}

function buildMonthlySummaryRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

function buildMonthlySummary(monthlySales = [], monthlyServiceBills = [], monthlyCosts = [], damageEntries = []) {
  const totalMonthlySalesProfit = monthlySales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0)
  const serviceRevenueFromBills = monthlyServiceBills.reduce((sum, bill) => {
    const billTotal = (bill.items || []).reduce((lineSum, item) => lineSum + calculateServiceLineRevenue(item), 0)
    return sum + (Number(bill.subtotal || 0) || billTotal)
  }, 0)
  const serviceRevenueFromSales = monthlySales.reduce((sum, sale) => {
    const serviceItems = (sale.items || []).filter((item) => item.type === 'service')
    return sum + serviceItems.reduce((lineSum, item) => lineSum + calculateServiceLineRevenue(item), 0)
  }, 0)
  const totalMonthlyServiceRevenue = Number.isFinite(serviceRevenueFromBills + serviceRevenueFromSales)
    ? (serviceRevenueFromBills + serviceRevenueFromSales)
    : 0
  const totalMonthlyCosts = monthlyCosts.reduce((sum, cost) => sum + Number(cost.amount || 0), 0)
  const totalDamagedProductLoss = damageEntries.reduce((sum, damage) => sum + Number(damage.quantity || 0) * Number(damage.costPrice || 0), 0)
  const totalMonthlyNetProfit = (totalMonthlySalesProfit + totalMonthlyServiceRevenue) - (totalMonthlyCosts + totalDamagedProductLoss)

  return {
    totalMonthlySalesProfit,
    totalMonthlyServiceRevenue,
    totalMonthlyCosts,
    totalDamagedProductLoss,
    totalMonthlyNetProfit,
  }
}

async function getReport(req, res, next) {
  try {
    const type = req.params.type || 'daily'
    const { from, to } = req.query
    const range = buildDateRange(type, from, to)
    const monthlyRange = buildMonthlySummaryRange()

    let sales = []
    let serviceBills = []
    let monthlySales = []
    let monthlyServiceBills = []
    let monthlyCosts = []
    let damageEntries = []
    if (getMode() === 'memory') {
      const store = getStore()
      sales = store.sales.filter((sale) => new Date(sale.createdAt) >= range.start && new Date(sale.createdAt) <= range.end)
      sales.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      serviceBills = (store.serviceBills || []).filter((bill) => new Date(bill.createdAt) >= range.start && new Date(bill.createdAt) <= range.end)
      monthlySales = store.sales.filter((sale) => new Date(sale.createdAt) >= monthlyRange.start && new Date(sale.createdAt) <= monthlyRange.end)
      monthlyServiceBills = (store.serviceBills || []).filter((bill) => new Date(bill.createdAt) >= monthlyRange.start && new Date(bill.createdAt) <= monthlyRange.end)
      monthlyCosts = (store.monthlyCosts || []).filter((cost) => new Date(cost.date) >= monthlyRange.start && new Date(cost.date) <= monthlyRange.end)
      damageEntries = (store.damages || []).filter((damage) => new Date(damage.createdAt) >= monthlyRange.start && new Date(damage.createdAt) <= monthlyRange.end)
    } else {
      sales = await Sale.find({ createdAt: { $gte: range.start, $lte: range.end } }).sort({ createdAt: 1 })
      serviceBills = await ServiceBill.find({ createdAt: { $gte: range.start, $lte: range.end } }).sort({ createdAt: 1 })
      monthlySales = await Sale.find({ createdAt: { $gte: monthlyRange.start, $lte: monthlyRange.end } }).sort({ createdAt: 1 })
      monthlyServiceBills = await ServiceBill.find({ createdAt: { $gte: monthlyRange.start, $lte: monthlyRange.end } }).sort({ createdAt: 1 })
      monthlyCosts = await MonthlyCost.find({ date: { $gte: monthlyRange.start, $lte: monthlyRange.end } }).sort({ date: 1 })
      damageEntries = await Damage.find({ createdAt: { $gte: monthlyRange.start, $lte: monthlyRange.end } }).sort({ createdAt: 1 })
    }

    const summary = {
      sales: sales.reduce((sum, sale) => sum + sale.grandTotal, 0),
      profit: sales.reduce((sum, sale) => sum + sale.profit, 0),
      productsSold: sales.reduce((sum, sale) => sum + sale.items.reduce((count, item) => count + item.quantity, 0), 0),
    }

    const monthlySummary = buildMonthlySummary(monthlySales, monthlyServiceBills, monthlyCosts, damageEntries)

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
      monthlySummary,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { getReport, summarizeServiceActivity, buildMonthlySummary }
