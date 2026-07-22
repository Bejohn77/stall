const test = require('node:test')
const assert = require('node:assert/strict')
const { shouldSendLowStockNotification } = require('../services/telegramService')

test('sends a low-stock alert only on the first threshold crossing', () => {
  const state = { key: 'product-1' }

  assert.equal(shouldSendLowStockNotification({ _id: 'product-1', stockQuantity: 8 }, 12, state), true)
  assert.equal(shouldSendLowStockNotification({ _id: 'product-1', stockQuantity: 7 }, 8, state), false)
  assert.equal(shouldSendLowStockNotification({ _id: 'product-1', stockQuantity: 15 }, 7, state), false)
  assert.equal(shouldSendLowStockNotification({ _id: 'product-1', stockQuantity: 9 }, 15, state), true)
})
