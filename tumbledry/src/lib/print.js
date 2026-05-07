// src/lib/print.js — Receipt and tag printing utilities

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

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
          font-family: 'Courier New', monospace;
          width: 75mm;
          padding: 4mm;
          font-size: 12px;
        }
        .center { text-align: center; }
        .bold   { font-weight: 700; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 10px; text-transform: uppercase; padding: 4px 0; border-bottom: 1px solid #000; }
        .total-row td { font-size: 16px; font-weight: 900; padding-top: 8px; }
        @media print {
          @page { size: 75mm auto; margin: 0; }
          body { padding: 4mm; }
        }
      </style>
    </head>
    <body>
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
        <thead>
          <tr>
            <th style="text-align:left;">Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:center;">Rate</th>
            <th style="text-align:right;">Amt</th>
          </tr>
        </thead>
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
    </body>
    </html>
  `

  const win = window.open('', '_blank', 'width=300,height=600')
  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.focus(); win.print(); }, 300)
}

export function printTags(order) {
  const items = order.cart || []

  // Build one tag per garment (expanded by qty)
  const tags = []
  items.forEach(item => {
    const count = item.type === 'kg' ? 1 : (item.qty || 1)
    for (let i = 0; i < count; i++) {
      tags.push({
        name:     item.printedTagName || item.name,
        tag:      order.tagNumber,
        customer: order.customerName,
        date:     new Date(order.orderDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}),
        delivery: order.deliveryDate,
        service:  order.serviceType,
        num:      i + 1,
        total:    count,
      })
    }
  })

  const tagHTML = tags.map(t => `
    <div class="tag">
      <div class="shop">TUMBLEDRY</div>
      <div class="tag-num">${t.tag}</div>
      <div class="item">${t.name}</div>
      <div class="customer">${t.customer}</div>
      <div class="meta">${t.service}</div>
      <div class="dates">
        <span>${t.date}</span>
        <span>→ ${t.delivery.slice(0,9)}</span>
      </div>
      ${t.total > 1 ? `<div class="piece">${t.num}/${t.total}</div>` : ''}
    </div>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Arial, sans-serif; }
        .tag {
          width: 20mm;
          height: 20mm;
          border: 1px solid #000;
          padding: 1.5mm;
          display: inline-block;
          margin: 1mm;
          vertical-align: top;
          overflow: hidden;
          page-break-inside: avoid;
        }
        .shop     { font-size: 5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
        .tag-num  { font-size: 8px; font-weight: 900; color: #333; margin: 1px 0; }
        .item     { font-size: 5.5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .customer { font-size: 5px; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .meta     { font-size: 4.5px; color: #777; }
        .dates    { font-size: 4.5px; display: flex; justify-content: space-between; margin-top: 1px; }
        .piece    { font-size: 5px; font-weight: 700; text-align: right; margin-top: 1px; }
        @media print {
          @page { size: auto; margin: 5mm; }
        }
      </style>
    </head>
    <body>
      ${tagHTML}
    </body>
    </html>
  `

  const win = window.open('', '_blank', 'width=600,height=400')
  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.focus(); win.print(); }, 300)
}
