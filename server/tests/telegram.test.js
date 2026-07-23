const test = require('node:test')
const assert = require('node:assert/strict')
const { shouldSendLowStockNotification, getTelegramMessageText } = require('../services/telegramService')

test('sends a low-stock alert only on the first threshold crossing', () => {
  const state = { key: 'product-1' }

  assert.equal(shouldSendLowStockNotification({ _id: 'product-1', stockQuantity: 8 }, 12, state), true)
  assert.equal(shouldSendLowStockNotification({ _id: 'product-1', stockQuantity: 7 }, 8, state), false)
  assert.equal(shouldSendLowStockNotification({ _id: 'product-1', stockQuantity: 15 }, 7, state), false)
  assert.equal(shouldSendLowStockNotification({ _id: 'product-1', stockQuantity: 9 }, 15, state), true)
})

test('formats a sale-deleted Telegram message with invoice details', () => {
  const text = getTelegramMessageText('sale-deleted', {
    invoiceNumber: 'INV-00001',
    customerName: 'John Doe',
    grandTotal: 1200,
    deletedAt: new Date('2024-01-01T00:00:00.000Z'),
  }, { currency: '৳' })

  assert.match(text, /SALE DELETED/i)
  assert.match(text, /INV-00001/)
  assert.match(text, /John Doe/)
  assert.match(text, /৳1200/)
})
