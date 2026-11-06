const test = require('node:test')
const assert = require('node:assert/strict')
const { recordSalePayment } = require('../controllers/saleController')

function createResponse() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

test('records previous-due and multiple-invoice payments without losing the legacy balance', async () => {
  const previousMode = global.__dbMode
  const previousStore = global.__stallStore
  global.__dbMode = 'memory'
  global.__stallStore = {
    sales: [
      {
        _id: 'legacy-partial',
        grandTotal: 100,
        paidAmount: 20,
        dueAmount: 80,
        paymentMethod: 'Cash',
        createdAt: '2026-10-01T10:00:00.000Z',
        payments: [],
      },
      {
        _id: 'second-invoice',
        grandTotal: 75,
        paidAmount: 0,
        dueAmount: 75,
        createdAt: '2026-11-01T10:00:00.000Z',
        payments: [],
      },
    ],
  }

  try {
    const firstResponse = createResponse()
    await recordSalePayment(
      { params: { id: 'legacy-partial' }, body: { amount: 30, paymentMethod: 'Card' } },
      firstResponse,
      (error) => { throw error },
    )
    assert.equal(firstResponse.body.paidAmount, 50)
    assert.equal(firstResponse.body.dueAmount, 50)
    assert.equal(firstResponse.body.paymentStatus, 'Partial')
    assert.equal(firstResponse.body.payments.length, 2)

    const secondResponse = createResponse()
    await recordSalePayment(
      { params: { id: 'second-invoice' }, body: { amount: 75, paymentMethod: 'Mobile Banking' } },
      secondResponse,
      (error) => { throw error },
    )
    assert.equal(secondResponse.body.paidAmount, 75)
    assert.equal(secondResponse.body.dueAmount, 0)
    assert.equal(secondResponse.body.paymentStatus, 'Paid')
  } finally {
    global.__dbMode = previousMode
    global.__stallStore = previousStore
  }
})

test('rejects zero, negative, and over-due payments without changing the sale', async () => {
  const previousMode = global.__dbMode
  const previousStore = global.__stallStore
  global.__dbMode = 'memory'
  const sale = { _id: 'due-sale', grandTotal: 50, paidAmount: 10, dueAmount: 40, payments: [] }
  global.__stallStore = { sales: [sale] }

  try {
    for (const amount of [0, -1, 41]) {
      const response = createResponse()
      await recordSalePayment(
        { params: { id: sale._id }, body: { amount } },
        response,
        (error) => { throw error },
      )
      assert.equal(response.statusCode, 400)
    }
    assert.equal(sale.paidAmount, 10)
    assert.equal(sale.payments.length, 0)
  } finally {
    global.__dbMode = previousMode
    global.__stallStore = previousStore
  }
})
