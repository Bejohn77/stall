const Product = require('../models/Product')
const Sale = require('../models/Sale')
const ServiceBill = require('../models/ServiceBill')
const { getMode, getStore } = require('../utils/store')

function buildDateRange(type) {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  if (type === 'today') {
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
  } else if (type === 'month') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    end.setMonth(end.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
  } else if (type === 'week') {
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    start.setDate(now.getDate() + diff)
    start.setHours(0, 0, 0, 0)
    end.setDate(start.getDate() + 6)
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
    totalServiceRevenue: bills.reduce((sum, bill) => sum + (bill.subtotal || 0), 0),
    serviceBillCount: bills.length,
    serviceItemCount: items.length,
    mostUsedService,
  }
}

async function getDashboard(req, res, next) {
  try {
    if (getMode() === 'memory') {
      const store = getStore()
      const todayRange = buildDateRange('today')
      const monthRange = buildDateRange('month')
      const todaySales = store.sales.filter((sale) => new Date(sale.createdAt) >= todayRange.start && new Date(sale.createdAt) <= todayRange.end)
      const monthlySales = store.sales.filter((sale) => new Date(sale.createdAt) >= monthRange.start && new Date(sale.createdAt) <= monthRange.end)
      const totalProducts = store.products.length
      const lowStockProducts = store.products.filter((product) => product.stockQuantity <= 3).length
      const recentSales = [...store.sales].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
      const lowStockItems = store.products.filter((product) => product.stockQuantity <= 3).slice(0, 5)
      const todayServiceBills = (store.serviceBills || []).filter((bill) => new Date(bill.createdAt) >= todayRange.start && new Date(bill.createdAt) <= todayRange.end)

      const todaySalesValue = todaySales.reduce((sum, sale) => sum + sale.grandTotal, 0)
      const todayProfitValue = todaySales.reduce((sum, sale) => sum + sale.profit, 0)
      const monthlySalesValue = monthlySales.reduce((sum, sale) => sum + sale.grandTotal, 0)
      const monthlyProfitValue = monthlySales.reduce((sum, sale) => sum + sale.profit, 0)

      return res.json({
        todaySales: todaySalesValue,
        todayProfit: todayProfitValue,
        monthlySales: monthlySalesValue,
        monthlyProfit: monthlyProfitValue,
        totalProducts,
        lowStockProducts,
        recentSales,
        lowStockItems,
        serviceStats: summarizeServiceActivity(todayServiceBills),
        dailySalesChart: [
          { name: 'Mon', sales: 3200 },
          { name: 'Tue', sales: 4200 },
          { name: 'Wed', sales: 3100 },
          { name: 'Thu', sales: 4800 },
          { name: 'Fri', sales: 5200 },
          { name: 'Sat', sales: 6100 },
          { name: 'Sun', sales: 4700 },
        ],
        revenueChart: [
          { name: 'Jan', revenue: 125000, profit: 31000 },
          { name: 'Feb', revenue: 140000, profit: 36000 },
          { name: 'Mar', revenue: 118000, profit: 30000 },
          { name: 'Apr', revenue: 150000, profit: 40000 },
        ],
      })
    }

    const [todaySales, monthlySales, totalProducts, lowStockProducts, recentSales, lowStockItems, todayServiceBills] = await Promise.all([
      Sale.find({ createdAt: { $gte: buildDateRange('today').start, $lte: buildDateRange('today').end } }),
      Sale.find({ createdAt: { $gte: buildDateRange('month').start, $lte: buildDateRange('month').end } }),
      Product.countDocuments(),
      Product.countDocuments({ stockQuantity: { $lte: 3 } }),
      Sale.find().sort({ createdAt: -1 }).limit(5),
      Product.find({ stockQuantity: { $lte: 3 } }).limit(5),
      ServiceBill.find({ createdAt: { $gte: buildDateRange('today').start, $lte: buildDateRange('today').end } }),
    ])

    const todaySalesValue = todaySales.reduce((sum, sale) => sum + sale.grandTotal, 0)
    const todayProfitValue = todaySales.reduce((sum, sale) => sum + sale.profit, 0)
    const monthlySalesValue = monthlySales.reduce((sum, sale) => sum + sale.grandTotal, 0)
    const monthlyProfitValue = monthlySales.reduce((sum, sale) => sum + sale.profit, 0)

    const dailySalesChart = [
      { name: 'Mon', sales: 3200 },
      { name: 'Tue', sales: 4200 },
      { name: 'Wed', sales: 3100 },
      { name: 'Thu', sales: 4800 },
      { name: 'Fri', sales: 5200 },
      { name: 'Sat', sales: 6100 },
      { name: 'Sun', sales: 4700 },
    ]

    const revenueChart = [
      { name: 'Jan', revenue: 125000, profit: 31000 },
      { name: 'Feb', revenue: 140000, profit: 36000 },
      { name: 'Mar', revenue: 118000, profit: 30000 },
      { name: 'Apr', revenue: 150000, profit: 40000 },
    ]

    res.json({
      todaySales: todaySalesValue,
      todayProfit: todayProfitValue,
      monthlySales: monthlySalesValue,
      monthlyProfit: monthlyProfitValue,
      totalProducts,
      lowStockProducts,
      recentSales,
      lowStockItems,
      serviceStats: summarizeServiceActivity(todayServiceBills),
      dailySalesChart,
      revenueChart,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { getDashboard }
