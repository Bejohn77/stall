const mongoose = require('mongoose')

const saleSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customerName: String,
  customerPhone: String,
  items: [
    {
      type: { type: String, enum: ['product', 'service'], default: 'product' },
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      serviceId: String,
      name: String,
      description: String,
      quantity: Number,
      unitPrice: Number,
      discount: Number,
      tax: Number,
      total: Number,
      buyingPrice: Number,
      profit: Number,
    },
  ],
  subtotal: Number,
  discount: Number,
  tax: Number,
  grandTotal: Number,
  profit: Number,
  paymentMethod: String,
  paidAmount: Number,
  dueAmount: Number,
  change: Number,
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Sale', saleSchema)
