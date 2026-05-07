// src/lib/print.js — Receipt and tag printing utilities

// Service code abbreviations matching old CRM style
const SERVICE_CODE = {
  'Dry Clean':             'CL',
  'Steam Iron':            'SI',
  'Premium Laundry':       'PL',
  'Wash & Fold (Per KG)':  'WF',
  'Wash & Iron (Per KG)':  'WSI',
}

function getServiceCode(serviceType) {
  return SERVICE_CODE[serviceType] || serviceType.slice(0, 3).toUpperCase()
}

export function printReceipt(order) {
  const discLine = order.discountAmount > 0
    ? `<tr><td colspan="3" style="color:#dc2626;padding:3px 0;border-bottom:1px dashed #eee;">Discount (${order.discountPct}%)</td><td style="text-align:right;color:#dc2626;padding:3px 0;border-bottom:1px dashed #eee;">-₹${order.discountAmount}</td></tr>`
    : ''

  const itemRows = (order.cart || []).map(item => `
    <tr>
      <td style="padding:4px 0;border-bottom:1px dashed #eee;font-size:12px;">${item.name}</td>
      <td style="text-align:center;padding:4px 0;border-bottom:1px dashed #eee;font-size:12px;">${item.qty}</td>
      <td style="text-align:center;padding:4px 0;border-bottom:1px dashed #eee;font-size:12px;">₹${item.unitPrice}</td>
      <td style="text-align:right;padding:4px 0;border-bottom:1px dashed #eee;font-size:12px;font-weight:700;">₹${Math.round(item.net)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Courier New',monospace; width:75mm; padding:4mm; font-size:12px; }
      .center { text-align:center; }
      .bold   { font-weight:700; }
      .divider { border-top:1px dashed #000; margin:6px 0; }
      table { width:100%; border-collapse:collapse; }
      th { font-size:10px; text-transform:uppercase; padding:4px 0; border-bottom:1px solid #000; }
      .total-row td { font-size:16px; font-weight:900; padding-top:8px; }
      @media print { @page { size:75mm auto; margin:0; } body { padding:4mm; } }
    </style></head><body>
    <div class="center bold" style="font-size:18px;margin-bottom:2px;">TUMBLEDRY</div>
    <div class="center" style="font-size:11px;color:#555;margin-bottom:8px;">Premium Laundry Services</div>
    <div class="divider"></div>
    <div style="margin-bottom:6px;">
      <div class="bold" style="font-size:14px;">${order.customerName}</div>
      <div style="font-size:11px;color:#555;">${order.customerNumber}</div>
      ${order.customerAddress ? `<div style="font-size:11px;color:#555;">${order.customerAddress}${order.customerCity ? ', ' + order.customerCity : ''}</div>` : ''}
    </div>
    <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;">
      <span>Tag: <strong>${order.tagNumber}</strong></span>
      <span>${new Date(order.orderDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span>
    </div>
    <div style="font-size:11px;margin-bottom:2px;">Service: <strong>${order.serviceType}</strong></div>
    <div style="font-size:11px;margin-bottom:6px;">Delivery: <strong>${order.deliveryDate}</strong></div>
    <div class="divider"></div>
    <table>
      <thead><tr>
        <th style="text-align:left;">Item</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:center;">Rate</th>
        <th style="text-align:right;">Amt</th>
      </tr></thead>
      <tbody>
        ${itemRows}
        ${discLine}
        <tr class="total-row">
          <td colspan="3" class="bold">TOTAL</td>
          <td style="text-align:right;" class="bold">₹${order.grandTotal}</td>
        </tr>
      </tbody>
    </table>
    <div class="divider"></div>
    <div style="font-size:11px;">
      <div>Payment: <strong>${order.paymentMethod}</strong> — <strong style="color:${order.paymentStatus==='Paid'?'green':'red'}">${order.paymentStatus}</strong></div>
    </div>
    <div class="divider"></div>
    <div class="center" style="font-size:11px;margin-top:4px;">Thank you for choosing Tumbledry! 🙏</div>
    <div class="center" style="font-size:10px;color:#888;margin-top:2px;">Keep this receipt for your records</div>
    </body></html>`

  const win = window.open('', '_blank', 'width=300,height=600')
  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 300)
}

export function printTags(order) {
  const items = order.cart || []
  const svcCode = getServiceCode(order.serviceType)

  // Total garments across entire order
  const totalGarments = items.reduce((s, i) => s + (i.type === 'kg' ? 1 : (i.qty || 1)), 0)

  // Build one tag per garment piece
  const tags = []
  let globalNum = 0
  items.forEach(item => {
    const count = item.type === 'kg' ? 1 : (item.qty || 1)
    for (let i = 0; i < count; i++) {
      globalNum++
      tags.push({
        tagNumber:    order.tagNumber,
        customerName: order.customerName,
        itemName:     item.printedTagName || item.name,
        svcCode,
        delivery:     order.deliveryDate || '',
        orderDate:    new Date(order.orderDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }),
        num:          globalNum,
        total:        totalGarments,
      })
    }
  })

  // Format delivery date short — "10 May 26 Sun" → "10 May 26"
  function shortDate(dateStr) {
    if (!dateStr) return ''
    const parts = dateStr.split(' ')
    return parts.slice(0, 3).join(' ') + (parts[3] ? ' ' + parts[3] : '')
  }

  const tagHTML = tags.map(t => `
    <div class="tag">
      <div class="tag-num">${t.tagNumber}</div>
      <div class="customer">${t.customerName}</div>
      <div class="divider"></div>
      <div class="svc-row">
        <span class="svc-code">${t.svcCode}</span>
        <span class="piece-count">${t.num}/${t.total}</span>
      </div>
      <div class="delivery">${shortDate(t.delivery)}</div>
      <div class="item-name">${t.itemName}</div>
      <div class="order-date">${t.orderDate}</div>
    </div>
  `).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: Arial, sans-serif; background: white; }

      .tag {
        width: 38mm;
        min-height: 32mm;
        border: 1.5px solid #000;
        padding: 2mm 2.5mm;
        display: inline-block;
        margin: 1.5mm;
        vertical-align: top;
        page-break-inside: avoid;
      }

      /* Tag Number — biggest, boldest, top */
      .tag-num {
        font-size: 18px;
        font-weight: 900;
        letter-spacing: 1px;
        line-height: 1.1;
        margin-bottom: 1mm;
      }

      /* Customer name */
      .customer {
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 1.5mm;
        text-decoration: underline;
      }

      .divider {
        border-top: 1px solid #000;
        margin: 1mm 0;
      }

      /* Service code + piece count row */
      .svc-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1mm;
      }

      .svc-code {
        font-size: 14px;
        font-weight: 900;
        letter-spacing: 1px;
      }

      .piece-count {
        font-size: 12px;
        font-weight: 700;
      }

      /* Delivery date */
      .delivery {
        font-size: 11px;
        font-weight: 700;
        margin-bottom: 1mm;
      }

      /* Item name */
      .item-name {
        font-size: 10px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 1mm;
      }

      /* Order date — small, bottom */
      .order-date {
        font-size: 8px;
        color: #555;
        text-align: right;
        border-top: 1px dashed #ccc;
        padding-top: 0.5mm;
        margin-top: auto;
      }

      @media print {
        @page { size: auto; margin: 5mm; }
        body { margin: 0; }
      }
    </style></head><body>
    ${tagHTML}
    </body></html>`

  const win = window.open('', '_blank', 'width=700,height=500')
  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 300)
}

// ── Window-based versions for auto-print (window opened by caller) ──
// Browser only allows window.open during user gesture — so caller opens
// the window, then passes it here to write content and trigger print

export function printTagsInWindow(win, order) {
  if (!win) return
  const items = order.cart || []
  const svcCode = getServiceCode(order.serviceType)
  const totalGarments = items.reduce((s, i) => s + (i.type === 'kg' ? 1 : (i.qty || 1)), 0)

  const tags = []
  let globalNum = 0
  items.forEach(item => {
    const count = item.type === 'kg' ? 1 : (item.qty || 1)
    for (let i = 0; i < count; i++) {
      globalNum++
      tags.push({
        tagNumber:    order.tagNumber,
        customerName: order.customerName,
        itemName:     item.printedTagName || item.name,
        svcCode,
        delivery:     order.deliveryDate || '',
        orderDate:    new Date(order.orderDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }),
        num:          globalNum,
        total:        totalGarments,
      })
    }
  })

  function shortDate(dateStr) {
    if (!dateStr) return ''
    const parts = dateStr.split(' ')
    return parts.slice(0, 4).join(' ')
  }

  const tagHTML = tags.map(t => `
    <div class="tag">
      <div class="tag-num">${t.tagNumber}</div>
      <div class="customer">${t.customerName}</div>
      <div class="divider"></div>
      <div class="svc-row">
        <span class="svc-code">${t.svcCode}</span>
        <span class="piece-count">${t.num}/${t.total}</span>
      </div>
      <div class="delivery">${shortDate(t.delivery)}</div>
      <div class="item-name">${t.itemName}</div>
      <div class="order-date">${t.orderDate}</div>
    </div>
  `).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:Arial,sans-serif; background:white; }
      .tag { width:38mm; min-height:32mm; border:1.5px solid #000; padding:2mm 2.5mm; display:inline-block; margin:1.5mm; vertical-align:top; page-break-inside:avoid; }
      .tag-num { font-size:18px; font-weight:900; letter-spacing:1px; line-height:1.1; margin-bottom:1mm; }
      .customer { font-size:11px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:1.5mm; text-decoration:underline; }
      .divider { border-top:1px solid #000; margin:1mm 0; }
      .svc-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:1mm; }
      .svc-code { font-size:14px; font-weight:900; letter-spacing:1px; }
      .piece-count { font-size:12px; font-weight:700; }
      .delivery { font-size:11px; font-weight:700; margin-bottom:1mm; }
      .item-name { font-size:10px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:1mm; }
      .order-date { font-size:8px; color:#555; text-align:right; border-top:1px dashed #ccc; padding-top:0.5mm; }
      @media print { @page { size:auto; margin:5mm; } }
    </style></head><body>${tagHTML}</body></html>`

  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 300)
}

export function printReceiptInWindow(win, order) {
  if (!win) return

  const discLine = order.discountAmount > 0
    ? `<tr><td colspan="3" style="color:#dc2626;padding:3px 0;border-bottom:1px dashed #eee;">Discount (${order.discountPct}%)</td><td style="text-align:right;color:#dc2626;padding:3px 0;border-bottom:1px dashed #eee;">-₹${order.discountAmount}</td></tr>`
    : ''

  const itemRows = (order.cart || []).map(item => `
    <tr>
      <td style="padding:4px 0;border-bottom:1px dashed #eee;font-size:12px;">${item.name}</td>
      <td style="text-align:center;padding:4px 0;border-bottom:1px dashed #eee;font-size:12px;">${item.qty}</td>
      <td style="text-align:center;padding:4px 0;border-bottom:1px dashed #eee;font-size:12px;">₹${item.unitPrice}</td>
      <td style="text-align:right;padding:4px 0;border-bottom:1px dashed #eee;font-size:12px;font-weight:700;">₹${Math.round(item.net)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Courier New',monospace; width:75mm; padding:4mm; font-size:12px; }
      .center { text-align:center; } .bold { font-weight:700; }
      .divider { border-top:1px dashed #000; margin:6px 0; }
      table { width:100%; border-collapse:collapse; }
      th { font-size:10px; text-transform:uppercase; padding:4px 0; border-bottom:1px solid #000; }
      .total-row td { font-size:16px; font-weight:900; padding-top:8px; }
      @media print { @page { size:75mm auto; margin:0; } body { padding:4mm; } }
    </style></head><body>
    <div class="center bold" style="font-size:18px;margin-bottom:2px;">TUMBLEDRY</div>
    <div class="center" style="font-size:11px;color:#555;margin-bottom:8px;">Premium Laundry Services</div>
    <div class="divider"></div>
    <div style="margin-bottom:6px;">
      <div class="bold" style="font-size:14px;">${order.customerName}</div>
      <div style="font-size:11px;color:#555;">${order.customerNumber}</div>
      ${order.customerAddress ? `<div style="font-size:11px;color:#555;">${order.customerAddress}${order.customerCity ? ', '+order.customerCity : ''}</div>` : ''}
    </div>
    <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;">
      <span>Tag: <strong>${order.tagNumber}</strong></span>
      <span>${new Date(order.orderDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span>
    </div>
    <div style="font-size:11px;margin-bottom:2px;">Service: <strong>${order.serviceType}</strong></div>
    <div style="font-size:11px;margin-bottom:6px;">Delivery: <strong>${order.deliveryDate}</strong></div>
    <div class="divider"></div>
    <table>
      <thead><tr>
        <th style="text-align:left;">Item</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:center;">Rate</th>
        <th style="text-align:right;">Amt</th>
      </tr></thead>
      <tbody>
        ${itemRows}
        ${discLine}
        <tr class="total-row">
          <td colspan="3" class="bold">TOTAL</td>
          <td style="text-align:right;" class="bold">₹${order.grandTotal}</td>
        </tr>
      </tbody>
    </table>
    <div class="divider"></div>
    <div style="font-size:11px;">Payment: <strong>${order.paymentMethod}</strong> — <strong style="color:${order.paymentStatus==='Paid'?'green':'red'}">${order.paymentStatus}</strong></div>
    <div class="divider"></div>
    <div class="center" style="font-size:11px;margin-top:4px;">Thank you for choosing Tumbledry! 🙏</div>
    <div class="center" style="font-size:10px;color:#888;margin-top:2px;">Keep this receipt for your records</div>
    </body></html>`

  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 300)
}
