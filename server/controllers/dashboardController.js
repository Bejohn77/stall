const Product = require('../models/Product')
const Sale = require('../models/Sale')
const ServiceBill = require('../models/ServiceBill')
const Damage = require('../models/Damage')
const MonthlyCost = require('../models/MonthlyCost')
const { calculateSaleProfit, calculatePeriodProfitMetrics } = require('../utils/invoice')
const { getMode, getStore } = require('../utils/store')

function toNumber(value) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function buildDateRange(type, baseDate = new Date()) {
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
  const parts = bangladeshTime.formatToParts(baseDate)
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

  if (type === 'today') {
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
  } else if (type === 'month') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    end.setMonth(end.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
  } else if (type === 'yesterday') {
    start.setDate(start.getDate() - 1)
    start.setHours(0, 0, 0, 0)
    end.setDate(end.getDate() - 1)
    end.setHours(23, 59, 59, 999)
  } else if (type === 'lastMonth') {
    start.setMonth(start.getMonth() - 1, 1)
    start.setHours(0, 0, 0, 0)
    end.setMonth(end.getMonth(), 0)
    end.setHours(23, 59, 59, 999)
  }

  return { start, end }
}

function summarizeServiceActivity(bills) {
  const items = bills.flatMap((bill) => bill.items || [])
  const serviceCounts = items.reduce((acc, item) => {
    const name = item.serviceName || item.serviceType || 'Custom service'
    acc[name] = (acc[name] || 0) + item.quantity
    return acc
  }, {})

  const mostUsedService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  return {
    totalServiceRevenue: bills.reduce((sum, bill) => sum + toNumber(bill.subtotal || 0), 0),
    serviceBillCount: bills.length,
    serviceItemCount: items.length,
    mostUsedService,
  }
}

function calculateProfitValue({ salesValue = 0, discountValue = 0, productCostValue = 0, damageCostValue = 0, businessCostValue = 0 }) {
  // Gross Profit = Total Sales - Total Product Cost (COGS)
  const grossProfitValue = toNumber(salesValue) - toNumber(productCostValue)
  // Net Profit = Gross Profit - Operating Cost - Damage Cost
  return toNumber(grossProfitValue) - toNumber(businessCostValue) - toNumber(damageCostValue)
}

function calculatePercentageChange(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return ((current - previous) / previous) * 100
}

function getCostCategory(costName = '') {
  const normalized = String(costName || '').trim().toLowerCase()
  if (normalized.includes('rent')) return 'Rent'
  if (normalized.includes('salary') || normalized.includes('payroll')) return 'Salary'
  if (normalized.includes('electric')) return 'Electricity'
  if (normalized.includes('internet') || normalized.includes('wifi')) return 'Internet'
  if (normalized.includes('transport') || normalized.includes('fuel') || normalized.includes('delivery')) return 'Transport'
  return 'Others'
}

function buildCostBreakdown(costs = []) {
  const breakdown = {
    Rent: 0,
    Salary: 0,
    Electricity: 0,
    Internet: 0,
    Transport: 0,
    Others: 0,
  }

  for (const cost of costs) {
    const category = getCostCategory(cost.costName)
    breakdown[category] += toNumber(cost.amount || 0)
  }

  return Object.entries(breakdown)
    .filter(([, total]) => total > 0)
    .map(([name, total]) => ({ name, total }))
}

function getSaleValue(sale = {}) {
  return toNumber(sale.grandTotal ?? sale.subtotal ?? 0)
}

function buildPeriodMetrics(sales = [], damages = [], costs = []) {
  const salesValue = sales.reduce((sum, sale) => sum + getSaleValue(sale), 0)
  const discountValue = sales.reduce((sum, sale) => sum + toNumber(sale.discount || 0), 0)
  const productCostValue = sales.reduce((sum, sale) => {
    const saleCost = (sale.items || []).reduce((itemSum, item) => {
      if (item.type !== 'product') return itemSum
      return itemSum + toNumber(item.quantity || 0) * toNumber(item.buyingPrice || 0)
    }, 0)
    return sum + saleCost
  }, 0)
  const damageCostValue = damages.reduce((sum, damage) => sum + toNumber(damage.totalLoss || 0), 0)
  const businessCostValue = costs.reduce((sum, cost) => sum + toNumber(cost.amount || 0), 0)
  const profitMetrics = calculatePeriodProfitMetrics({ sales, damages, costs })
  const grossProfitValue = profitMetrics.grossProfitValue
  const profitValue = profitMetrics.netProfitValue
  const ordersCount = sales.length
  const productsSoldCount = sales.reduce((sum, sale) => sum + (sale.items || []).reduce((count, item) => count + (item.type === 'product' ? toNumber(item.quantity || 0) : 0), 0), 0)

  const productSales = (sales || []).flatMap((sale) => (sale.items || []).filter((item) => item.type === 'product'))
  const bestSeller = productSales.reduce((acc, item) => {
    const key = item.name || 'Unknown Product'
    const existing = acc.find((entry) => entry.name === key)
    if (existing) {
      existing.quantity += toNumber(item.quantity || 0)
      existing.revenue += toNumber(item.unitPrice || 0) * toNumber(item.quantity || 0)
    } else {
      acc.push({ name: key, quantity: toNumber(item.quantity || 0), revenue: toNumber(item.unitPrice || 0) * toNumber(item.quantity || 0) })
    }
    return acc
  }, []).sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)[0] || null

  const highestSale = [...sales].sort((a, b) => toNumber(b.grandTotal || 0) - toNumber(a.grandTotal || 0))[0] || null

  return {
    salesValue,
    discountValue,
    productCostValue,
    damageCostValue,
    businessCostValue,
    grossProfitValue,
    profitValue,
    ordersCount,
    productsSoldCount,
    bestSeller,
    highestSale,
    profitMargin: salesValue > 0 ? (profitValue / salesValue) * 100 : 0,
    discountPercentage: salesValue > 0 ? (discountValue / salesValue) * 100 : 0,
  }
}

function formatLabel(date) {
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

function buildTrendData(sales = [], labelPrefix = 'day') {
  const data = []
  const now = new Date()
  for (let index = 6; index >= 0; index -= 1) {
    const currentDate = new Date(now)
    currentDate.setDate(now.getDate() - index)
    const start = new Date(currentDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(currentDate)
    end.setHours(23, 59, 59, 999)
    const matchingSales = sales.filter((sale) => new Date(sale.createdAt) >= start && new Date(sale.createdAt) <= end)
    const periodValue = matchingSales.reduce((sum, sale) => sum + getSaleValue(sale), 0)
    data.push({ name: labelPrefix === 'month' ? currentDate.toLocaleDateString('en-CA', { month: 'short' }) : formatLabel(currentDate), sales: periodValue })
  }
  return data
}

function buildRevenueChart(sales = []) {
  const data = []
  const now = new Date()
  for (let index = 5; index >= 0; index -= 1) {
    const currentDate = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999)
    const matchingSales = sales.filter((sale) => new Date(sale.createdAt) >= start && new Date(sale.createdAt) <= end)
    const salesValue = matchingSales.reduce((sum, sale) => sum + getSaleValue(sale), 0)
    const profitValue = matchingSales.reduce((sum, sale) => sum + calculateSaleProfit(sale), 0)
    data.push({ name: currentDate.toLocaleDateString('en-CA', { month: 'short' }), revenue: salesValue, profit: profitValue })
  }
  return data
}

function calculateNetProfit(grossProfit, businessCostValue = 0, damageCostValue = 0, discountValue = 0) {
  // Net Profit = Gross Profit - Discount - Damage Cost - Operating/Business Cost
  return toNumber(grossProfit) - toNumber(discountValue) - toNumber(damageCostValue) - toNumber(businessCostValue)
}

function buildComparison(current, previous) {
  const change = calculatePercentageChange(current, previous)
  const isPositive = change >= 0
  return {
    current,
    previous,
    change,
    isPositive,
    label: `${isPositive ? '+' : '-'}${Math.abs(change).toFixed(1)}%`,
  }
}

async function getDashboard(req, res, next) {
  try {
    const monthRange = buildDateRange('month')
    const todayRange = buildDateRange('today')
    const yesterdayRange = buildDateRange('yesterday')
    const lastMonthRange = buildDateRange('lastMonth')
    const selectedMonth = `${monthRange.start.getFullYear()}-${String(monthRange.start.getMonth() + 1).padStart(2, '0')}`

    if (getMode() === 'memory') {
      const store = getStore()
      const todaySales = store.sales.filter((sale) => new Date(sale.createdAt) >= todayRange.start && new Date(sale.createdAt) <= todayRange.end)
      const yesterdaySales = store.sales.filter((sale) => new Date(sale.createdAt) >= yesterdayRange.start && new Date(sale.createdAt) <= yesterdayRange.end)
      const monthlySales = store.sales.filter((sale) => new Date(sale.createdAt) >= monthRange.start && new Date(sale.createdAt) <= monthRange.end)
      const lastMonthSales = store.sales.filter((sale) => new Date(sale.createdAt) >= lastMonthRange.start && new Date(sale.createdAt) <= lastMonthRange.end)
      const todayCosts = (store.monthlyCosts || []).filter((cost) => new Date(cost.date) >= todayRange.start && new Date(cost.date) <= todayRange.end)
      const monthlyCosts = (store.monthlyCosts || []).filter((cost) => String(cost.month || '').trim() === selectedMonth)
      const lastMonthCosts = (store.monthlyCosts || []).filter((cost) => {
        const month = `${lastMonthRange.start.getFullYear()}-${String(lastMonthRange.start.getMonth() + 1).padStart(2, '0')}`
        return String(cost.month || '').trim() === month
      })
      const totalProducts = store.products.length
      const lowStockProducts = store.products.filter((product) => toNumber(product.stockQuantity || 0) <= 3).length
      const outOfStockProducts = store.products.filter((product) => toNumber(product.stockQuantity || 0) <= 0).length
      const inventoryValue = store.products.reduce((sum, product) => sum + toNumber(product.stockQuantity || 0) * toNumber(product.buyingPrice || 0), 0)
      const recentSales = [...store.sales].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
      const lowStockItems = store.products.filter((product) => toNumber(product.stockQuantity || 0) <= 3).slice(0, 5)
      const todayServiceBills = (store.serviceBills || []).filter((bill) => new Date(bill.createdAt) >= todayRange.start && new Date(bill.createdAt) <= todayRange.end)
      const todayDamages = (store.damages || []).filter((damage) => new Date(damage.createdAt) >= todayRange.start && new Date(damage.createdAt) <= todayRange.end)
      const yesterdayDamages = (store.damages || []).filter((damage) => new Date(damage.createdAt) >= yesterdayRange.start && new Date(damage.createdAt) <= yesterdayRange.end)
      const monthlyDamages = (store.damages || []).filter((damage) => new Date(damage.createdAt) >= monthRange.start && new Date(damage.createdAt) <= monthRange.end)
      const lastMonthDamages = (store.damages || []).filter((damage) => new Date(damage.createdAt) >= lastMonthRange.start && new Date(damage.createdAt) <= lastMonthRange.end)

      const todayMetrics = buildPeriodMetrics(todaySales, todayDamages, todayCosts)
      const yesterdayMetrics = buildPeriodMetrics(yesterdaySales, yesterdayDamages, [])
      const monthlyMetrics = buildPeriodMetrics(monthlySales, monthlyDamages, monthlyCosts)
      const lastMonthMetrics = buildPeriodMetrics(lastMonthSales, lastMonthDamages, lastMonthCosts)
      const allTimeDiscount = store.sales.reduce((sum, sale) => sum + toNumber(sale.discount || 0), 0)

      const dashboardPayload = {
        todaySales: todayMetrics.salesValue,
        todayDiscount: todayMetrics.discountValue,
        todayProfit: todayMetrics.profitValue,
        todayCost: todayMetrics.businessCostValue,
        todayOrders: todayMetrics.ordersCount,
        productsSoldToday: todayMetrics.productsSoldCount,
        monthlySales: monthlyMetrics.salesValue,
        monthlyDiscount: monthlyMetrics.discountValue,
        monthlyProfit: monthlyMetrics.profitValue,
        monthlyCost: monthlyMetrics.businessCostValue,
        totalDiscounts: allTimeDiscount,
        netProfit: monthlyMetrics.netProfitValue,
        totalProducts,
        totalStockQuantity: store.products.reduce((sum, product) => sum + toNumber(product.stockQuantity || 0), 0),
        lowStockProducts,
        outOfStockProducts,
        inventoryValue,
        profitMargin: monthlyMetrics.profitMargin,
        discountPercentage: monthlyMetrics.discountPercentage,
        todayDiscountPercentage: todayMetrics.discountPercentage,
        monthlyDiscountPercentage: monthlyMetrics.discountPercentage,
        bestSellingProductToday: todayMetrics.bestSeller,
        bestSellingProductThisMonth: monthlyMetrics.bestSeller,
        highestProfitProduct: monthlyMetrics.bestSeller,
        highestSaleToday: todayMetrics.highestSale,
        summaryToday: {
          sales: todayMetrics.salesValue,
          profit: todayMetrics.profitValue,
          discount: todayMetrics.discountValue,
          cost: todayMetrics.businessCostValue,
          damage: todayMetrics.damageCostValue,
          orders: todayMetrics.ordersCount,
          productsSold: todayMetrics.productsSoldCount,
        },
        summaryMonthly: {
          sales: monthlyMetrics.salesValue,
          profit: monthlyMetrics.profitValue,
          discount: monthlyMetrics.discountValue,
          cost: monthlyMetrics.businessCostValue,
          damage: monthlyMetrics.damageCostValue,
          netProfit: monthlyMetrics.netProfitValue,
        },
        comparisons: {
          sales: buildComparison(todayMetrics.salesValue, yesterdayMetrics.salesValue),
          profit: buildComparison(todayMetrics.profitValue, yesterdayMetrics.profitValue),
          discount: buildComparison(todayMetrics.discountValue, yesterdayMetrics.discountValue),
          cost: buildComparison(todayMetrics.businessCostValue, yesterdayMetrics.businessCostValue),
          damage: buildComparison(todayMetrics.damageCostValue, yesterdayMetrics.damageCostValue),
          monthly: {
            sales: buildComparison(monthlyMetrics.salesValue, lastMonthMetrics.salesValue),
            profit: buildComparison(monthlyMetrics.profitValue, lastMonthMetrics.profitValue),
            discount: buildComparison(monthlyMetrics.discountValue, lastMonthMetrics.discountValue),
            cost: buildComparison(monthlyMetrics.businessCostValue, lastMonthMetrics.businessCostValue),
            damage: buildComparison(monthlyMetrics.damageCostValue, lastMonthMetrics.damageCostValue),
          },
        },
        serviceStats: summarizeServiceActivity(todayServiceBills),
        damageStats: {
          todayDamagedItems: todayDamages.reduce((sum, damage) => sum + toNumber(damage.quantity || 0), 0),
          todayDamageCost: todayDamages.reduce((sum, damage) => sum + toNumber(damage.totalLoss || 0), 0),
          monthlyDamageCost: monthlyDamages.reduce((sum, damage) => sum + toNumber(damage.totalLoss || 0), 0),
        },
        costBreakdown: buildCostBreakdown(monthlyCosts),
        recentSales,
        lowStockItems,
        dailySalesChart: buildTrendData(todaySales),
        revenueChart: buildRevenueChart(monthlySales),
      }

      return res.json(dashboardPayload)
    }

    const [todaySales, yesterdaySales, monthlySales, lastMonthSales, totalProducts, lowStockProducts, recentSales, lowStockItems, todayServiceBills, todayDamages, yesterdayDamages, monthlyDamages, lastMonthDamages, monthlyCosts, lastMonthCosts] = await Promise.all([
      Sale.find({ createdAt: { $gte: todayRange.start, $lte: todayRange.end } }),
      Sale.find({ createdAt: { $gte: yesterdayRange.start, $lte: yesterdayRange.end } }),
      Sale.find({ createdAt: { $gte: monthRange.start, $lte: monthRange.end } }),
      Sale.find({ createdAt: { $gte: lastMonthRange.start, $lte: lastMonthRange.end } }),
      Product.countDocuments(),
      Product.countDocuments({ stockQuantity: { $lte: 3 } }),
      Sale.find().sort({ createdAt: -1 }).limit(5),
      Product.find({ stockQuantity: { $lte: 3 } }).limit(5),
      ServiceBill.find({ createdAt: { $gte: todayRange.start, $lte: todayRange.end } }),
      Damage.find({ createdAt: { $gte: todayRange.start, $lte: todayRange.end } }),
      Damage.find({ createdAt: { $gte: yesterdayRange.start, $lte: yesterdayRange.end } }),
      Damage.find({ createdAt: { $gte: monthRange.start, $lte: monthRange.end } }),
      Damage.find({ createdAt: { $gte: lastMonthRange.start, $lte: lastMonthRange.end } }),
      MonthlyCost.find({ month: selectedMonth }),
      MonthlyCost.find({ month: `${lastMonthRange.start.getFullYear()}-${String(lastMonthRange.start.getMonth() + 1).padStart(2, '0')}` }),
    ])

    const [todayMetrics, yesterdayMetrics, monthlyMetrics, lastMonthMetrics] = [
      buildPeriodMetrics(todaySales, todayDamages, []),
      buildPeriodMetrics(yesterdaySales, yesterdayDamages, []),
      buildPeriodMetrics(monthlySales, monthlyDamages, monthlyCosts),
      buildPeriodMetrics(lastMonthSales, lastMonthDamages, lastMonthCosts),
    ]
    const allTimeDiscount = (await Sale.find({})).reduce((sum, sale) => sum + toNumber(sale.discount || 0), 0)
    const inventoryCount = await Product.countDocuments()
    const totalStockQuantity = await Product.aggregate([{ $group: { _id: null, total: { $sum: '$stockQuantity' } } }])
    const inventoryValue = await Product.aggregate([{ $group: { _id: null, total: { $sum: { $multiply: ['$stockQuantity', '$buyingPrice'] } } } }])
    const outOfStockProducts = await Product.countDocuments({ stockQuantity: { $lte: 0 } })

    res.json({
      todaySales: todayMetrics.salesValue,
      todayDiscount: todayMetrics.discountValue,
      todayProfit: todayMetrics.profitValue,
      todayCost: todayMetrics.businessCostValue,
      todayOrders: todayMetrics.ordersCount,
      productsSoldToday: todayMetrics.productsSoldCount,
      monthlySales: monthlyMetrics.salesValue,
      monthlyDiscount: monthlyMetrics.discountValue,
      monthlyProfit: monthlyMetrics.profitValue,
      monthlyCost: monthlyMetrics.businessCostValue,
      totalDiscounts: allTimeDiscount,
      netProfit: monthlyMetrics.netProfitValue,
      totalProducts: inventoryCount,
      totalStockQuantity: totalStockQuantity[0]?.total || 0,
      lowStockProducts,
      outOfStockProducts,
      inventoryValue: inventoryValue[0]?.total || 0,
      profitMargin: monthlyMetrics.profitMargin,
      discountPercentage: monthlyMetrics.discountPercentage,
      todayDiscountPercentage: todayMetrics.discountPercentage,
      monthlyDiscountPercentage: monthlyMetrics.discountPercentage,
      bestSellingProductToday: todayMetrics.bestSeller,
      bestSellingProductThisMonth: monthlyMetrics.bestSeller,
      highestProfitProduct: monthlyMetrics.bestSeller,
      highestSaleToday: todayMetrics.highestSale,
      summaryToday: {
        sales: todayMetrics.salesValue,
        profit: todayMetrics.profitValue,
        discount: todayMetrics.discountValue,
        cost: todayMetrics.businessCostValue,
        damage: todayMetrics.damageCostValue,
        orders: todayMetrics.ordersCount,
        productsSold: todayMetrics.productsSoldCount,
      },
      summaryMonthly: {
        sales: monthlyMetrics.salesValue,
        profit: monthlyMetrics.profitValue,
        discount: monthlyMetrics.discountValue,
        cost: monthlyMetrics.businessCostValue,
        damage: monthlyMetrics.damageCostValue,
        netProfit: monthlyMetrics.netProfitValue,
      },
      comparisons: {
        sales: buildComparison(todayMetrics.salesValue, yesterdayMetrics.salesValue),
        profit: buildComparison(todayMetrics.profitValue, yesterdayMetrics.profitValue),
        discount: buildComparison(todayMetrics.discountValue, yesterdayMetrics.discountValue),
        cost: buildComparison(todayMetrics.businessCostValue, yesterdayMetrics.businessCostValue),
        damage: buildComparison(todayMetrics.damageCostValue, yesterdayMetrics.damageCostValue),
        monthly: {
          sales: buildComparison(monthlyMetrics.salesValue, lastMonthMetrics.salesValue),
          profit: buildComparison(monthlyMetrics.profitValue, lastMonthMetrics.profitValue),
          discount: buildComparison(monthlyMetrics.discountValue, lastMonthMetrics.discountValue),
          cost: buildComparison(monthlyMetrics.businessCostValue, lastMonthMetrics.businessCostValue),
          damage: buildComparison(monthlyMetrics.damageCostValue, lastMonthMetrics.damageCostValue),
        },
      },
      serviceStats: summarizeServiceActivity(todayServiceBills),
      damageStats: {
        todayDamagedItems: todayDamages.reduce((sum, damage) => sum + toNumber(damage.quantity || 0), 0),
        todayDamageCost: todayDamages.reduce((sum, damage) => sum + toNumber(damage.totalLoss || 0), 0),
        monthlyDamageCost: monthlyDamages.reduce((sum, damage) => sum + toNumber(damage.totalLoss || 0), 0),
      },
      costBreakdown: buildCostBreakdown(monthlyCosts),
      recentSales,
      lowStockItems,
      dailySalesChart: buildTrendData(todaySales),
      revenueChart: buildRevenueChart(monthlySales),
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { getDashboard, calculateNetProfit, calculateProfitValue, calculatePercentageChange, getSaleValue }
