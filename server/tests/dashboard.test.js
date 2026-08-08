const test = require('node:test')
const assert = require('node:assert/strict')
const { calculateNetProfit, getSaleValue } = require('../controllers/dashboardController')

test('dashboard net profit subtracts business costs from gross profit', () => {
  const netProfit = calculateNetProfit(1200, 150)

  assert.equal(netProfit, 1050)
})

test('dashboard sales use the sale grand total rather than the pre-discount subtotal', () => {
  const sale = { subtotal: 120, discount: 20, grandTotal: 100 }

  assert.equal(getSaleValue(sale), 100)
})
