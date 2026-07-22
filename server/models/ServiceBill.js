const mongoose = require('mongoose')

const serviceBillSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  items: [{
    serviceId: String,
    serviceName: String,
    unit: String,
    quantity: Number,
    rate: Number,
    total: Number,
  }],
  subtotal: Number,
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('ServiceBill', serviceBillSchema)
