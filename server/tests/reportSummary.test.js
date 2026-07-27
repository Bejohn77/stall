const test = require('node:test')
const assert = require('node:assert/strict')
const { buildMonthlySummary } = require('../controllers/reportController')

test('monthly summary calculates sales, costs, damage loss, and net profit', () => {
  const summary = buildMonthlySummary(
    [{ grandTotal: 1000 }, { grandTotal: 500 }],
    [{ amount: 150 }, { amount: 50 }],
    [{ quantity: 2, costPrice: 100 }, { quantity: 1, costPrice: 50 }],
  )

  assert.equal(summary.totalMonthlySales, 1500)
  assert.equal(summary.totalMonthlyCosts, 200)
  assert.equal(summary.totalDamagedProductLoss, 250)
  assert.equal(summary.totalMonthlyNetProfit, 1050)
})
