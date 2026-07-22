const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  buyingPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  stockQuantity: { type: Number, required: true, default: 0 },
  unit: { type: String, default: 'pcs' },
  barcode: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

productSchema.pre('save', function (next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model('Product', productSchema)
