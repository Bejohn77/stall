const test = require('node:test')
const assert = require('node:assert/strict')
const { summarizeServiceActivity } = require('../controllers/reportController')

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
