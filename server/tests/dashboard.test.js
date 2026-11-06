const test = require('node:test')
const assert = require('node:assert/strict')
const { buildOutstandingInvoiceSummary, calculateNetProfit, getDashboard, getSaleValue } = require('../controllers/dashboardController')

test('dashboard net profit subtracts business costs from gross profit', () => {
  const netProfit = calculateNetProfit(1200, 150)

  assert.equal(netProfit, 1050)
})

test('dashboard sales use the sale grand total rather than the pre-discount subtotal', () => {
  const sale = { subtotal: 120, discount: 20, grandTotal: 100 }

  assert.equal(getSaleValue(sale), 100)
})

test('monthly outstanding invoice summary excludes previous and future invoices', () => {
  const { dueInvoices, dueSummary } = buildOutstandingInvoiceSummary([
    {
      _id: 'paid',
      invoiceNumber: 'INV-1',
      grandTotal: 100,
      payments: [{ amount: 100 }],
    },
    {
      _id: 'partial',
      invoiceNumber: 'INV-2',
      customerName: 'Customer A',
      customerPhone: '0123',
      grandTotal: 200,
      createdAt: '2026-11-02T10:00:00.000Z',
      payments: [{ amount: 50 }],
      items: [{ name: 'Item', quantity: 2 }],
    },
    {
      _id: 'unpaid',
      invoiceNumber: 'INV-3',
      grandTotal: 300,
      createdAt: '2026-11-03T10:00:00.000Z',
      payments: [],
    },
    {
      _id: 'previous-month',
      invoiceNumber: 'INV-4',
      grandTotal: 500,
      createdAt: '2026-10-31T23:59:59.999Z',
      payments: [],
    },
    {
      _id: 'future',
      invoiceNumber: 'INV-5',
      grandTotal: 700,
      createdAt: '2026-11-16T00:00:00.000Z',
      payments: [],
    },
  ], new Date('2026-11-01T00:00:00.000Z'), new Date('2026-11-15T23:59:59.999Z'))

  assert.deepEqual(dueInvoices.map((invoice) => invoice.invoiceNumber), ['INV-3', 'INV-2'])
  assert.equal(dueInvoices[1].invoiceId, 'partial')
  assert.equal(dueInvoices[1].dueAmount, 150)
  assert.equal(dueInvoices[1].paymentStatus, 'Partial')
  assert.equal(dueSummary.totalDueAmount, 450)
  assert.equal(dueSummary.totalDueInvoices, 2)
  assert.equal(dueSummary.partialPaymentInvoices, 1)
  assert.equal(dueSummary.unpaidInvoices, 1)
})

test('dashboard totals invoice sales once and separates collected payments from outstanding due', async () => {
  const previousMode = global.__dbMode
  const previousStore = global.__stallStore
  const now = new Date()
  const previousMonthPayment = new Date(now.getFullYear(), now.getMonth() - 1, 15)
  global.__dbMode = 'memory'
  global.__stallStore = {
    products: [],
    serviceBills: [],
    damages: [],
    monthlyCosts: [],
    sales: [
      {
        _id: 'paid',
        invoiceNumber: 'INV-1',
        grandTotal: 100,
        paidAmount: 100,
        dueAmount: 0,
        createdAt: now,
        items: [{ type: 'product', quantity: 1, unitPrice: 100, buyingPrice: 60, discount: 0 }],
        payments: [{ amount: 100, paidAt: now }],
      },
      {
        _id: 'partial',
        invoiceNumber: 'INV-2',
        grandTotal: 200,
        paidAmount: 50,
        dueAmount: 150,
        createdAt: new Date(now.getTime() - 60 * 1000),
        items: [{ type: 'product', quantity: 2, unitPrice: 100, buyingPrice: 60, discount: 0 }],
        payments: [
          { amount: 20, paidAt: previousMonthPayment },
          { amount: 30, paidAt: now },
        ],
      },
      {
        _id: 'unpaid',
        invoiceNumber: 'INV-3',
        grandTotal: 300,
        paidAmount: 0,
        dueAmount: 300,
        createdAt: now,
        items: [{ type: 'product', quantity: 3, unitPrice: 100, buyingPrice: 60, discount: 0 }],
        payments: [],
      },
    ],
  }

  try {
    let dashboard
    await getDashboard({}, { json: (payload) => { dashboard = payload } }, (error) => { throw error })
    assert.equal(dashboard.totalSales, 600)
    assert.equal(dashboard.totalCollected, 150)
    assert.equal(dashboard.totalOutstandingDue, 450)
    assert.equal(dashboard.dueSummary.totalDueInvoices, 2)
    assert.equal(dashboard.dueSummary.partialPaymentInvoices, 1)
    assert.equal(dashboard.dueSummary.unpaidInvoices, 1)
    assert.deepEqual(dashboard.dueInvoices.map((invoice) => invoice.invoiceNumber), ['INV-3', 'INV-2'])
    assert.equal(dashboard.totalProfit, 240)
    assert.equal(dashboard.todayCollected, 130)
  } finally {
    global.__dbMode = previousMode
    global.__stallStore = previousStore
  }
})
