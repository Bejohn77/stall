import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiMinus, FiPlus, FiPrinter, FiSearch, FiTrash2 } from 'react-icons/fi'
import Topbar from '../components/Topbar'
import api from '../services/api'
import { formatCurrency } from '../utils/formatters'

const paymentMethods = ['Cash', 'Mobile Banking', 'Card']

export default function NewSalePage() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [lineItems, setLineItems] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paidAmount, setPaidAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [transactionLoading, setTransactionLoading] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [productQuantity, setProductQuantity] = useState(1)
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', quantity: 1, unitPrice: '', discount: '', tax: '' })
  const [invoice, setInvoice] = useState(null)

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const { data: productData } = await api.get('/products')
        setProducts(productData)
        if (!selectedProductId && productData.length) setSelectedProductId(productData[0]._id)
      } catch (error) {
        toast.error('Could not load catalog')
      } finally {
        setLoading(false)
      }
    }

    loadCatalog()
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase()))
  }, [products, search])

  const selectedProduct = useMemo(() => products.find((product) => product._id === selectedProductId), [products, selectedProductId])

  const calculateLineTotal = (item) => {
    const quantity = Number(item.quantity || 0)
    const unitPrice = Number(item.unitPrice || 0)
    const discount = Number(item.discount || 0)
    const tax = Number(item.tax || 0)
    const lineSubtotal = quantity * unitPrice
    return Math.max(0, lineSubtotal - Math.min(discount, lineSubtotal) + tax)
  }

  const addProductItem = (product = selectedProduct) => {
    if (!product) return toast.error('Select a product first')
    const quantity = Number(productQuantity || 0)
    if (quantity <= 0) return toast.error('Quantity must be greater than zero')
    if (product.stockQuantity < quantity) return toast.error('Insufficient stock for this product')

    setLineItems((current) => {
      const existingItem = current.find((item) => item.type === 'product' && item.productId === product._id)

      if (existingItem) {
        return current.map((item) => {
          if (item.type !== 'product' || item.productId !== product._id) return item
          return { ...item, quantity: Number(item.quantity || 0) + quantity }
        })
      }

      const newItem = {
        id: `${product._id}-${Date.now()}`,
        type: 'product',
        productId: product._id,
        name: product.name,
        quantity,
        unitPrice: Number(product.sellingPrice || 0),
        discount: 0,
        tax: 0,
      }
      return [...current, newItem]
    })
    setProductQuantity(1)
  }

  const addServiceItem = () => {
    const serviceName = `${serviceForm.name || ''}`.trim()
    const quantity = Number(serviceForm.quantity || 0)
    const unitPrice = Number(serviceForm.unitPrice || 0)
    const discount = Number(serviceForm.discount || 0)
    const tax = Number(serviceForm.tax || 0)

    if (!serviceName) return toast.error('Service name is required')
    if (quantity <= 0) return toast.error('Service quantity must be greater than zero')
    if (Number.isNaN(unitPrice) || unitPrice < 0) return toast.error('Service unit price must be a valid non-negative number')
    if (Number.isNaN(discount) || discount < 0) return toast.error('Service discount must be a valid non-negative number')
    if (Number.isNaN(tax) || tax < 0) return toast.error('Service tax must be a valid non-negative number')

    const newItem = {
      id: `service-${Date.now()}`,
      type: 'service',
      serviceId: null,
      name: serviceName,
      description: `${serviceForm.description || ''}`.trim(),
      quantity,
      unitPrice,
      discount,
      tax,
    }
    setLineItems((current) => [...current, newItem])
    setServiceForm({ name: '', description: '', quantity: 1, unitPrice: '', discount: '', tax: '' })
  }

  const updateLineItem = (id, field, value) => {
    setLineItems((current) => current.map((item) => {
      if (item.id !== id) return item
      const updatedItem = { ...item, [field]: Number(value || 0) }
      return { ...updatedItem, total: calculateLineTotal(updatedItem) }
    }))
  }

  const removeLineItem = (id) => {
    setLineItems((current) => current.filter((item) => item.id !== id))
  }

  const summary = useMemo(() => {
    const items = lineItems.map((item) => {
      const lineTotal = calculateLineTotal(item)
      return { ...item, total: lineTotal }
    })

    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0)
    const discount = items.reduce((sum, item) => sum + Math.min(Number(item.discount || 0), (Number(item.quantity || 0) * Number(item.unitPrice || 0))), 0)
    const tax = items.reduce((sum, item) => sum + Number(item.tax || 0), 0)
    const grandTotal = Math.max(0, subtotal - discount + tax)
    const paid = Number(paidAmount || 0)

    return {
      items,
      subtotal,
      discount,
      tax,
      grandTotal,
      paidAmount: paid,
      dueAmount: Math.max(0, grandTotal - paid),
      change: Math.max(0, paid - grandTotal),
    }
  }, [lineItems, paidAmount])

  const validateInvoiceItems = (items) => {
    for (const item of items) {
      const quantity = Number(item.quantity || 0)
      const unitPrice = Number(item.unitPrice || 0)
      const discount = Number(item.discount || 0)
      const tax = Number(item.tax || 0)

      if (!`${item.name || ''}`.trim()) return `${item.type === 'service' ? 'Service' : 'Product'} name is required`
      if (quantity <= 0) return `${item.type === 'service' ? 'Service' : 'Product'} quantity must be greater than zero`
      if (Number.isNaN(unitPrice) || unitPrice < 0) return `${item.type === 'service' ? 'Service' : 'Product'} unit price must be a valid non-negative number`
      if (Number.isNaN(discount) || discount < 0) return `${item.type === 'service' ? 'Service' : 'Product'} discount must be a valid non-negative number`
      if (Number.isNaN(tax) || tax < 0) return `${item.type === 'service' ? 'Service' : 'Product'} tax must be a valid non-negative number`
    }

    return null
  }

  const completeTransaction = async () => {
    if (!lineItems.length) return toast.error('Add at least one product or service before saving the bill')

    const validationMessage = validateInvoiceItems(summary.items)
    if (validationMessage) return toast.error(validationMessage)

    setTransactionLoading(true)
    try {
      const payload = {
        items: summary.items.map((item) => ({
          type: item.type,
          productId: item.productId,
          serviceId: item.serviceId,
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          tax: item.tax,
        })),
        customerName,
        customerPhone,
        paymentMethod,
        paidAmount: Number(paidAmount || 0),
      }

      const { data } = await api.post('/sales', payload)
      setInvoice(data)
      setLineItems([])
      setCustomerName('')
      setCustomerPhone('')
      setPaidAmount(0)
      setPaymentMethod('Cash')
      setSearch('')
      const { data: updatedProducts } = await api.get('/products')
      setProducts(updatedProducts)
      toast.success('Mixed invoice created successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invoice creation failed')
    } finally {
      setTransactionLoading(false)
    }
  }

  const printInvoice = () => {
    if (!invoice) return
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return toast.error('Please allow pop-ups to print the invoice')

    const productRows = (invoice.items || []).filter((item) => item.type === 'product').map((item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.unitPrice)}</td>
        <td>${formatCurrency(item.discount || 0)}</td>
        <td>${formatCurrency(item.tax || 0)}</td>
        <td>${formatCurrency(item.total)}</td>
      </tr>
    `).join('')

    const serviceRows = (invoice.items || []).filter((item) => item.type === 'service').map((item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.unitPrice)}</td>
        <td>${formatCurrency(item.discount || 0)}</td>
        <td>${formatCurrency(item.tax || 0)}</td>
        <td>${formatCurrency(item.total)}</td>
      </tr>
    `).join('')

    printWindow.document.write(`<!DOCTYPE html>
      <html>
        <head>
          <title>${invoice.invoiceNumber}</title>
          <style>body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}h1,h2,h3,p{margin:0 0 8px} .summary{margin-top:16px;display:grid;gap:4px} .summary div{display:flex;justify-content:space-between}</style>
        </head>
        <body>
          <h1>Invoice</h1>
          <p><strong>${invoice.invoiceNumber}</strong></p>
          <p>${invoice.customerName || 'Walk-in customer'}</p>
          <p>${invoice.customerPhone || ''}</p>
          <p>${new Date(invoice.createdAt).toLocaleString('en-BD')}</p>
          <h3>Products</h3>
          <table>
            <thead><tr><th>Name</th><th>Qty</th><th>Unit</th><th>Discount</th><th>Tax</th><th>Total</th></tr></thead>
            <tbody>${productRows || '<tr><td colspan="6">No products</td></tr>'}</tbody>
          </table>
          <h3 style="margin-top:16px">Services</h3>
          <table>
            <thead><tr><th>Name</th><th>Qty</th><th>Unit</th><th>Discount</th><th>Tax</th><th>Total</th></tr></thead>
            <tbody>${serviceRows || '<tr><td colspan="6">No services</td></tr>'}</tbody>
          </table>
          <div class="summary">
            <div><span>Subtotal</span><span>${formatCurrency(invoice.subtotal || 0)}</span></div>
            <div><span>Discount</span><span>${formatCurrency(invoice.discount || 0)}</span></div>
            <div><span>Tax</span><span>${formatCurrency(invoice.tax || 0)}</span></div>
            <div><span>Grand Total</span><span>${formatCurrency(invoice.grandTotal || 0)}</span></div>
            <div><span>Paid</span><span>${formatCurrency(invoice.paidAmount || 0)}</span></div>
            <div><span>Due</span><span>${formatCurrency(invoice.dueAmount || 0)}</span></div>
            <div><span>Change</span><span>${formatCurrency(invoice.change || 0)}</span></div>
          </div>
        </body>
      </html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="space-y-6">
      <Topbar title="Sales & Services" subtitle="Create custom service lines and mixed invoices" />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Products</h3>
                <p className="text-sm text-slate-500">Select products to add to the mixed bill</p>
              </div>
            </div>
            <label className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <FiSearch />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or category" className="w-full border-0 bg-transparent outline-none" />
            </label>
            {loading ? (
              <div className="grid gap-3 md:grid-cols-2">{[...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-[20px] bg-slate-200 dark:bg-slate-800" />)}</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredProducts.map((product) => (
                  <button key={product._id} onClick={() => {
                    setSelectedProductId(product._id)
                    addProductItem(product)
                  }} className={`rounded-[20px] border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${selectedProductId === product._id ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/40' : 'border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-slate-500">{product.category}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${product.stockQuantity <= 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {product.stockQuantity <= 0 ? 'Out' : `${product.stockQuantity} left`}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span>{formatCurrency(product.sellingPrice)}</span>
                      <span className="text-slate-400">{product.unit}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5 rounded-[24px] border border-slate-200 p-4 dark:border-slate-800">
              <label className="block text-sm font-medium">
                Quantity
                <input type="number" min="1" value={productQuantity} onChange={(e) => setProductQuantity(Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" />
              </label>
              <button onClick={addProductItem} className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 font-medium text-white dark:bg-slate-800">
                <FiPlus /> Add Product Line
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Custom Services</h3>
              <p className="text-sm text-slate-500">Add any service manually with its own quantity, price, discount, and tax</p>
            </div>
            <label className="block text-sm font-medium">
              Service name
              <input value={serviceForm.name} onChange={(e) => setServiceForm((current) => ({ ...current, name: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" placeholder="e.g. Repair, Delivery, Setup" />
            </label>
            <label className="mt-4 block text-sm font-medium">
              Description (optional)
              <textarea value={serviceForm.description} onChange={(e) => setServiceForm((current) => ({ ...current, description: e.target.value }))} className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" placeholder="Describe the service" />
            </label>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-medium">
                Quantity / hours
                <input type="number" min="1" value={serviceForm.quantity} onChange={(e) => setServiceForm((current) => ({ ...current, quantity: Number(e.target.value) }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" />
              </label>
              <label className="block text-sm font-medium">
                Unit price
                <input type="number" min="0" value={serviceForm.unitPrice} onChange={(e) => setServiceForm((current) => ({ ...current, unitPrice: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" />
              </label>
              <label className="block text-sm font-medium">
                Discount
                <input type="number" min="0" value={serviceForm.discount} onChange={(e) => setServiceForm((current) => ({ ...current, discount: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" />
              </label>
              <label className="block text-sm font-medium">
                Tax
                <input type="number" min="0" value={serviceForm.tax} onChange={(e) => setServiceForm((current) => ({ ...current, tax: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" />
              </label>
            </div>
            <button onClick={addServiceItem} className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 font-medium text-white dark:bg-slate-800">
              <FiPlus /> Add Service Line
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Mixed Invoice</h3>
              <p className="text-sm text-slate-500">Products and services appear as separate lines in one invoice</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium">
                Customer name
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" />
              </label>
              <label className="text-sm font-medium">
                Customer phone
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" />
              </label>
            </div>

            <div className="mt-5 space-y-3">
              {lineItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">No items added yet. Add products or services to build the invoice.</div>
              ) : lineItems.map((item) => (
                <div key={item.id} className="rounded-[20px] border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-slate-500">{item.type === 'product' ? 'Product' : 'Service'}</p>
                    </div>
                    <button onClick={() => removeLineItem(item.id)} className="rounded-full bg-rose-100 p-2 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"><FiTrash2 /></button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="text-sm font-medium">
                      Qty / Hours
                      <input type="number" min="0" value={item.quantity} onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900" />
                    </label>
                    <label className="text-sm font-medium">
                      Unit price
                      <input type="number" min="0" value={item.unitPrice} onChange={(e) => updateLineItem(item.id, 'unitPrice', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900" />
                    </label>
                    <label className="text-sm font-medium">
                      Discount
                      <input type="number" min="0" value={item.discount} onChange={(e) => updateLineItem(item.id, 'discount', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900" />
                    </label>
                    <label className="text-sm font-medium">
                      Tax
                      <input type="number" min="0" value={item.tax} onChange={(e) => updateLineItem(item.id, 'tax', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900" />
                    </label>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(calculateLineTotal(item))}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[24px] bg-slate-50 p-4 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2">
                {paymentMethods.map((method) => (
                  <button key={method} onClick={() => setPaymentMethod(method)} className={`rounded-full px-3 py-1.5 text-sm ${paymentMethod === method ? 'bg-slate-900 text-white dark:bg-slate-700' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {method}
                  </button>
                ))}
              </div>
              <label className="mb-3 block text-sm font-medium">
                Paid amount
                <input type="number" min="0" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950" />
              </label>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(summary.subtotal)}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(summary.discount)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(summary.tax)}</span></div>
                <div className="flex justify-between"><span>Grand Total</span><span>{formatCurrency(summary.grandTotal)}</span></div>
                <div className="flex justify-between"><span>Due</span><span>{formatCurrency(summary.dueAmount)}</span></div>
                <div className="flex justify-between"><span>Change</span><span>{formatCurrency(summary.change)}</span></div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={completeTransaction} disabled={transactionLoading} className="rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-70">
                {transactionLoading ? 'Saving...' : 'Save Mixed Invoice'}
              </button>
              <button onClick={printInvoice} disabled={!invoice} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-70 dark:bg-slate-800">
                <FiPrinter /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
