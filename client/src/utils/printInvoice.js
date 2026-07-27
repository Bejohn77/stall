import { formatCurrency } from './formatters'

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

export function buildInvoicePrintHtml(invoice = {}, settings = {}) {
  const shopName = String(settings.storeName || '').trim()
  const shopAddress = String(settings.address || '').trim()
  const shopPhone = String(settings.phone || '').trim()
  const displayShopName = shopName || 'Shop Name'
  const displayShopPhone = shopPhone || 'Phone Number'

  const productRows = (invoice.items || []).filter((item) => item.type === 'product').map((item) => `
    <tr>
      <td>${escapeHtml(item.name || 'Product')}</td>
      <td>${escapeHtml(item.quantity || 0)}</td>
      <td>${formatCurrency(item.unitPrice || 0)}</td>
      <td>${formatCurrency(item.discount || 0)}</td>
      <td>${formatCurrency(item.total || 0)}</td>
    </tr>
  `).join('')

  const serviceRows = (invoice.items || []).filter((item) => item.type === 'service').map((item) => `
    <tr>
      <td>${escapeHtml(item.name || 'Service')}</td>
      <td>${escapeHtml(item.quantity || 0)}</td>
      <td>${formatCurrency(item.unitPrice || 0)}</td>
      <td>${formatCurrency(item.discount || 0)}</td>
      <td>${formatCurrency(item.total || 0)}</td>
    </tr>
  `).join('')

  const headerBlock = `<div class="shop-header">
      <div class="shop-name">${escapeHtml(displayShopName)}</div>
      <div class="shop-meta">${escapeHtml(displayShopPhone)}</div>
      ${shopAddress ? `<div class="shop-meta">${escapeHtml(shopAddress)}</div>` : ''}
      <div class="invoice-title">INVOICE</div>
    </div>`

  const productTable = productRows
    ? `<div class="section-block">
        <h3>Products</h3>
        <table>
          <thead><tr><th>Name</th><th>Qty</th><th>Price</th><th>Discount</th><th>Total</th></tr></thead>
          <tbody>${productRows || '<tr><td colspan="5">No products</td></tr>'}</tbody>
        </table>
      </div>`
    : ''

  const serviceTable = serviceRows
    ? `<div class="section-block">
        <h3>Services</h3>
        <table>
          <thead><tr><th>Name</th><th>Qty</th><th>Price</th><th>Discount</th><th>Total</th></tr></thead>
          <tbody>${serviceRows || '<tr><td colspan="5">No services</td></tr>'}</tbody>
        </table>
      </div>`
    : ''

  return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(invoice.invoiceNumber || 'Invoice')}</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#0f172a;margin:0}
          .shop-header{margin-bottom:18px;text-align:center;border-bottom:1px solid #e2e8f0;padding-bottom:14px}
          .shop-name{font-size:24px;font-weight:700;letter-spacing:0.02em;margin-bottom:6px}
          .shop-meta{font-size:13px;color:#475569;margin-bottom:2px}
          .invoice-title{margin-top:10px;font-size:18px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase}
          .meta{margin-bottom:12px;line-height:1.45}
          .meta p{margin:2px 0}
          .section-block{margin-top:16px}
          h3{margin:0 0 8px;font-size:15px}
          table{width:100%;border-collapse:collapse;margin-top:6px}
          th,td{padding:8px 6px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:13px}
          th{font-weight:700;color:#334155}
          .summary{margin-top:16px;display:grid;gap:4px}
          .summary div{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dashed #cbd5e1}
          .summary .grand{font-weight:700;font-size:15px}
          @media print { body{padding:18px} }
        </style>
      </head>
      <body>
        ${headerBlock}
        <div class="meta">
          <p><strong>Invoice Number:</strong> ${escapeHtml(invoice.invoiceNumber || '')}</p>
          <p><strong>Date & Time:</strong> ${escapeHtml(new Date(invoice.createdAt).toLocaleString('en-BD'))}</p>
          <p><strong>Customer Name:</strong> ${escapeHtml(invoice.customerName || 'Walk-in customer')}</p>
          ${invoice.customerPhone ? `<p><strong>Phone:</strong> ${escapeHtml(invoice.customerPhone)}</p>` : ''}
        </div>
        ${productRows ? productTable : ''}
        ${serviceRows ? serviceTable : ''}
        ${!productRows && !serviceRows ? '<div class="section-block"><h3>Items</h3><p>No items on this invoice.</p></div>' : ''}
        <div class="summary">
          <div><span>Subtotal</span><span>${formatCurrency(invoice.subtotal || 0)}</span></div>
          <div><span>Discount</span><span>${formatCurrency(invoice.discount || 0)}</span></div>
          <div><span>Tax</span><span>${formatCurrency(invoice.tax || 0)}</span></div>
          <div class="grand"><span>Grand Total</span><span>${formatCurrency(invoice.grandTotal || 0)}</span></div>
          <div><span>Payment Method</span><span>${escapeHtml(invoice.paymentMethod || 'Cash')}</span></div>
          <div><span>Paid</span><span>${formatCurrency(invoice.paidAmount || 0)}</span></div>
          <div><span>Due</span><span>${formatCurrency(invoice.dueAmount || 0)}</span></div>
          <div><span>Change</span><span>${formatCurrency(invoice.change || 0)}</span></div>
        </div>
      </body>
    </html>`
}
