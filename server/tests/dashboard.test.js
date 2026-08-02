const test = require('node:test')
const assert = require('node:assert/strict')
const { calculateNetProfit } = require('../controllers/dashboardController')

test('dashboard net profit uses monthly profit minus monthly damage and cost', () => {
  const netProfit = calculateNetProfit(1200, 300, 150)

  assert.equal(netProfit, 750)
})
