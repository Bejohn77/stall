const test = require('node:test')
const assert = require('node:assert/strict')
const { summarizeServiceActivity, buildDateRange } = require('../controllers/reportController')

test('custom report dates cover complete Bangladesh calendar days', () => {
  const { start, end } = buildDateRange('custom', '2026-09-03', '2026-09-03')

  assert.equal(start.toISOString(), '2026-09-02T18:00:00.000Z')
  assert.equal(end.toISOString(), '2026-09-03T17:59:59.999Z')
})

test('service summaries use service items from mixed sales', () => {
  const sales = [
    {
      _id: 'sale-1',
      items: [
        { type: 'product', quantity: 2, total: 200 },
        { type: 'service', quantity: 2, total: 150 },
      ],
    },
    {
      _id: 'sale-2',
      items: [
        { type: 'service', quantity: 1, total: 80 },
      ],
    },
  ]

  const result = summarizeServiceActivity(sales, [])

  assert.equal(result.totalServiceRevenue, 230)
  assert.equal(result.serviceBillCount, 2)
  assert.equal(result.mostUsedService, 'Custom service')
})
