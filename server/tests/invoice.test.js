const test = require('node:test')
const assert = require('node:assert/strict')
const { calculateInvoiceProfit, calculateInvoiceSummary, getInventoryUpdates, validateInvoicePayload } = require('../utils/invoice')

test('mixed invoice totals are calculated without affecting service inventory', () => {
  const items = [
    {
      type: 'product',
      productId: 'prod-1',
      name: 'Notebook',
      quantity: 2,
      unitPrice: 120,
      discount: 10,
      tax: 8,
    },
    {
      type: 'service',
      serviceId: 'svc-1',
      name: 'Printing',
      description: 'Color printout',
      quantity: 3,
      unitPrice: 50,
      discount: 5,
      tax: 2,
    },
  ]

  const summary = calculateInvoiceSummary(items, 300)
  const inventoryUpdates = getInventoryUpdates(items)

  assert.equal(summary.subtotal, 240 + 150)
  assert.equal(summary.discount, 15)
  assert.equal(summary.tax, 10)
  assert.equal(summary.grandTotal, 385)
  assert.equal(summary.paidAmount, 300)
  assert.equal(summary.dueAmount, 85)
  assert.equal(summary.change, 0)
  assert.deepEqual(inventoryUpdates, [{ productId: 'prod-1', quantity: 2 }])
})

test('service lines contribute their full amount to profit', () => {
  const items = [
    {
      type: 'product',
      quantity: 2,
      unitPrice: 120,
      buyingPrice: 80,
    },
    {
      type: 'service',
      quantity: 3,
      unitPrice: 50,
    },
  ]

  assert.equal(calculateInvoiceProfit(items), 80 + 150)
})

test('custom service validation rejects incomplete entries', () => {
  const result = validateInvoicePayload({
    items: [
      {
        type: 'service',
        quantity: 0,
        unitPrice: -5,
      },
    ],
  })

  assert.equal(result.ok, false)
  assert.match(result.message, /service name|quantity|unit price/i)
})
