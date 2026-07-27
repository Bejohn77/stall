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
