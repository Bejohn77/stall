const test = require('node:test')
const assert = require('node:assert/strict')
const { buildDamageReport } = require('../controllers/damageController')

test('damage report aggregates quantity, loss and most damaged product', () => {
  const damages = [
    { productName: 'Milk', quantity: 2, totalLoss: 80, createdAt: '2026-07-10T00:00:00.000Z' },
    { productName: 'Milk', quantity: 1, totalLoss: 40, createdAt: '2026-07-11T00:00:00.000Z' },
    { productName: 'Bread', quantity: 3, totalLoss: 60, createdAt: '2026-07-11T00:00:00.000Z' },
  ]

  const report = buildDamageReport(damages)

  assert.equal(report.totalDamagedQuantity, 6)
  assert.equal(report.totalFinancialLoss, 180)
  assert.equal(report.mostDamagedProduct, 'Milk')
  assert.equal(report.trend[0].quantity, 2)
})
