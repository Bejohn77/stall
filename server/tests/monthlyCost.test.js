const test = require('node:test')
const assert = require('node:assert/strict')
const { calculateMonthlyCostSummary } = require('../controllers/monthlyCostController')

test('monthly cost summaries aggregate selected month totals and return zero when empty', () => {
  const costs = [
    { costName: 'Rent', amount: 1500, month: '2026-07' },
    { costName: 'Electricity', amount: 250, month: '2026-07' },
    { costName: 'Internet', amount: 100, month: '2026-08' },
  ]

  const julySummary = calculateMonthlyCostSummary(costs, '2026-07')
  const emptySummary = calculateMonthlyCostSummary(costs, '2026-09')

  assert.equal(julySummary.totalMonthlyCost, 1750)
  assert.equal(julySummary.costs.length, 2)
  assert.equal(emptySummary.totalMonthlyCost, 0)
  assert.equal(emptySummary.costs.length, 0)
})
