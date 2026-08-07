const test = require('node:test')
const assert = require('node:assert/strict')
const { calculateNetProfit } = require('../controllers/dashboardController')

test('dashboard net profit subtracts business costs from gross profit', () => {
  const netProfit = calculateNetProfit(1200, 150)

  assert.equal(netProfit, 1050)
})
