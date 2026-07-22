const fallbackProducts = [
  {
    _id: 'fallback-product-1',
    name: 'Pen',
    category: 'Stationery',
    buyingPrice: 3,
    sellingPrice: 5,
    stockQuantity: 10,
    unit: 'pcs',
    barcode: '',
  },
  {
    _id: 'fallback-product-2',
    name: 'Notebook',
    category: 'Stationery',
    buyingPrice: 80,
    sellingPrice: 120,
    stockQuantity: 8,
    unit: 'pcs',
    barcode: '',
  },
  {
    _id: 'fallback-product-3',
    name: 'Bottle',
    category: 'Household',
    buyingPrice: 120,
    sellingPrice: 180,
    stockQuantity: 6,
    unit: 'pcs',
    barcode: '',
  },
]

const fallbackDamages = []

export function getFallbackData(url) {
  const normalizedUrl = (url || '').replace(/^\/+/, '/').replace(/^\/api/, '')

  if (normalizedUrl === '/products') {
    return fallbackProducts
  }

  if (normalizedUrl === '/damages') {
    return fallbackDamages
  }

  return null
}
