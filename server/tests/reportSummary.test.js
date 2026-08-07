const test = require('node:test')
const assert = require('node:assert/strict')
const { buildMonthlySummary } = require('../controllers/reportController')

test('monthly summary calculates sales, costs, damage loss, and net profit from sales and service bills', () => {
  const summary = buildMonthlySummary(
    [{ grandTotal: 1000, profit: 400 }, { grandTotal: 500, profit: 100 }],
    [{ items: [{ quantity: 3, unitPrice: 100, discount: 0, tax: 0 }] }, { items: [{ quantity: 2, unitPrice: 50, discount: 0, tax: 0 }] }],
    [{ amount: 150 }, { amount: 50 }],
    [{ quantity: 2, costPrice: 100 }, { quantity: 1, costPrice: 50 }],
  )

  assert.equal(summary.totalMonthlySalesProfit, 500)
  assert.equal(summary.totalMonthlyServiceRevenue, 400)
  assert.equal(summary.totalMonthlyCosts, 200)
  assert.equal(summary.totalDamagedProductLoss, 250)
  assert.equal(summary.totalMonthlyNetProfit, 450)
})

test('monthly summary includes service revenue from invoice service items', () => {
  const summary = buildMonthlySummary(
    [{ items: [{ type: 'service', quantity: 2, total: 120 }, { type: 'product', quantity: 1, total: 80 }] }],
    [{ items: [{ quantity: 1, unitPrice: 80, discount: 0, tax: 0 }] }],
    [],
    [],
  )

  assert.equal(summary.totalMonthlyServiceRevenue, 200)
})

test('monthly summary defaults service revenue to zero for empty data', () => {
  const summary = buildMonthlySummary([], [], [], [])

  assert.equal(summary.totalMonthlyServiceRevenue, 0)
  assert.equal(summary.totalMonthlySalesProfit, 0)
  assert.equal(summary.totalMonthlyNetProfit, 0)
})

test('monthly summary recomputes sales profit from invoice items instead of stale sale profit values', () => {
  const summary = buildMonthlySummary(
    [{ profit: 999, items: [{ type: 'product', quantity: 2, unitPrice: 100, discount: 20, buyingPrice: 40 }] }],
    [],
    [],
    [],
  )

  assert.equal(summary.totalMonthlySalesProfit, 100)
  assert.equal(summary.totalMonthlyNetProfit, 100)
})

test('monthly summary calculates net profit from gross profit minus discount, business cost, and damage cost', () => {
  const summary = buildMonthlySummary(
    [{ items: [{ type: 'product', quantity: 1, unitPrice: 100, discount: 10, buyingPrice: 40 }] }],
    [],
    [{ amount: 20 }],
    [{ quantity: 1, costPrice: 5 }],
  )

  assert.equal(summary.monthlyGrossProfit, 60)
  assert.equal(summary.monthlyDiscount, 10)
  assert.equal(summary.monthlyBusinessCost, 20)
  assert.equal(summary.monthlyDamageCost, 5)
  assert.equal(summary.monthlyNetProfit, 25)
})
