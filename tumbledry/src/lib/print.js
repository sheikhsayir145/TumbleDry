// src/lib/print.js — Receipt and tag printing utilities

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

// ── Shared receipt HTML builder ──────────────────────────────────────────────
function buildReceiptHTML(order) {
  const originalAmt = order.grandTotal + (order.discountAmount || 0)
  const subtotalRow = order.discountAmount > 0
    ? `<tr>
        <td colspan="3" style="padding:4px 0;border-bottom:1px dashed #000;font-size:12px;font-weight:700;">Original Amount</td>
        <td style="text-align:right;padding:4px 0;border-bottom:1px dashed #000;font-size:12px;font-weight:700;text-decoration:line-through;">&#8377;${originalAmt}</td>
       </tr>`
    : ''
  const discLine = order.discountAmount > 0
    ? `<tr>
        <td colspan="3" style="font-weight:700;padding:4px 0;border-bottom:1px dashed #000;font-size:13px;">Discount (${order.discountPct}%)</td>
        <td style="text-align:right;font-weight:700;padding:4px 0;border-bottom:1px dashed #000;font-size:13px;">-&#8377;${order.discountAmount}</td>
       </tr>`
    : ''

  const itemRows = (order.cart || []).map(item => `
    <tr>
      <td style="padding:5px 0;border-bottom:1px dashed #000;font-size:13px;font-weight:700;">${item.name}</td>
      <td style="text-align:center;padding:5px 0;border-bottom:1px dashed #000;font-size:13px;font-weight:700;">${item.qty}</td>
      <td style="text-align:center;padding:5px 0;border-bottom:1px dashed #000;font-size:13px;font-weight:700;">&#8377;${item.unitPrice}</td>
      <td style="text-align:right;padding:5px 0;border-bottom:1px dashed #000;font-size:13px;font-weight:900;">&#8377;${Math.round(item.net)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Courier New',monospace; width:75mm; padding:4mm; font-size:13px; font-weight:700; color:#000; }
      .center { text-align:center; }
      .divider { border-top:1.5px solid #000; margin:7px 0; }
      .divider-dash { border-top:1px dashed #000; margin:7px 0; }
      table { width:100%; border-collapse:collapse; }
      th { font-size:11px; text-transform:uppercase; padding:5px 0; border-bottom:2px solid #000; font-weight:900; }
      .total-row td { font-size:18px; font-weight:900; padding-top:9px; }
      @media print { @page { size:75mm auto; margin:0; } body { padding:4mm; } }
    </style></head><body>

    <div class="center" style="font-size:20px;font-weight:900;letter-spacing:1px;margin-bottom:2px;">TUMBLEDRY</div>
    <div class="center" style="font-size:12px;font-weight:700;margin-bottom:2px;">Premium Laundry Services</div>
    <div class="center" style="font-size:11px;font-weight:700;margin-bottom:1px;">Banday Lane, Dargah Hazratbal, 190006</div>
    <div class="center" style="font-size:11px;font-weight:700;margin-bottom:8px;">Ph: 8899912859</div>
    <div class="divider"></div>

    <div style="margin-bottom:7px;">
      <div style="font-size:16px;font-weight:900;">${order.customerName}</div>
      <div style="font-size:12px;font-weight:700;margin-top:2px;">${order.customerNumber}</div>
      ${order.customerAddress ? `<div style="font-size:12px;font-weight:700;margin-top:1px;">${order.customerAddress}${order.customerCity ? ', ' + order.customerCity : ''}</div>` : ''}
    </div>

    <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:3px;">
      <span>Tag: <span style="font-size:14px;font-weight:900;">${order.tagNumber}</span></span>
      <span>${new Date(order.orderDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span>
    </div>
    <div style="font-size:12px;font-weight:700;margin-bottom:3px;">Service: <span style="font-weight:900;">${order.serviceType}</span></div>
    <div style="font-size:12px;font-weight:700;margin-bottom:7px;">Delivery: <span style="font-weight:900;">${order.deliveryDate}</span></div>
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
        ${subtotalRow}
        ${discLine}
        <tr class="total-row">
          <td colspan="3" style="font-weight:900;">TOTAL</td>
          <td style="text-align:right;font-weight:900;">&#8377;${order.grandTotal}</td>
        </tr>
      </tbody>
    </table>

    <div class="divider"></div>
    <div style="font-size:13px;font-weight:700;">
      Payment: <span style="font-weight:900;">${order.paymentMethod}</span>
      &mdash;
      <span style="font-weight:900;">${order.paymentStatus}</span>
    </div>
    <div class="divider"></div>
    <div class="center" style="font-size:12px;font-weight:700;margin-top:5px;">Thank you for choosing Tumbledry!</div>
    <div class="center" style="font-size:11px;font-weight:700;margin-top:3px;">Keep this receipt for your records</div>
    </body></html>`
}

// ── Shared tag HTML builder ──────────────────────────────────────────────────
function buildTagsHTML(order) {
  const items = order.cart || []
  const svcCode = getServiceCode(order.serviceType)
  const totalGarments = items.reduce((s, i) => s + (i.qty || 1), 0)

  const tags = []
  let globalNum = 0
  items.forEach(item => {
    const count = item.qty || 1
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
        rackLocation: order.rackLocation || '',
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
      ${t.rackLocation ? `<div class="rack-loc">Rack: ${t.rackLocation}</div>` : ''}
      <div class="order-date">${t.orderDate}</div>
    </div>
  `).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:Arial,sans-serif; background:white; font-weight:700; color:#000; }

      .tag {
        width:38mm;
        min-height:34mm;
        border:2px solid #000;
        padding:2.5mm 3mm;
        display:inline-block;
        margin:1.5mm;
        vertical-align:top;
        page-break-inside:avoid;
      }

      .tag-num {
        font-size:22px;
        font-weight:900;
        letter-spacing:1px;
        line-height:1.1;
        margin-bottom:1.5mm;
      }

      .customer {
        font-size:13px;
        font-weight:800;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        margin-bottom:1.5mm;
        text-decoration:underline;
      }

      .divider {
        border-top:1.5px solid #000;
        margin:1.5mm 0;
      }

      .svc-row {
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:1.5mm;
      }

      .svc-code {
        font-size:18px;
        font-weight:900;
        letter-spacing:1px;
      }

      .piece-count {
        font-size:15px;
        font-weight:900;
      }

      .delivery {
        font-size:13px;
        font-weight:900;
        margin-bottom:1.5mm;
      }

      .item-name {
        font-size:12px;
        font-weight:800;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        margin-bottom:1mm;
      }

      .rack-loc {
        font-size:11px;
        font-weight:800;
        margin-bottom:1mm;
      }

      .order-date {
        font-size:10px;
        font-weight:700;
        color:#000;
        text-align:right;
        border-top:1px dashed #000;
        padding-top:1mm;
      }

      @media print {
        @page { size:auto; margin:5mm; }
        body { margin:0; }
      }
    </style></head><body>
    ${tagHTML}
    </body></html>`
}

// ── Public API ───────────────────────────────────────────────────────────────

export function printReceipt(order) {
  const win = window.open('', '_blank', 'width=300,height=600')
  win.document.write(buildReceiptHTML(order))
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 300)
}

export function printTags(order) {
  const win = window.open('', '_blank', 'width=700,height=500')
  win.document.write(buildTagsHTML(order))
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 300)
}

export function printTagsInWindow(win, order) {
  if (!win) return
  win.document.write(buildTagsHTML(order))
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 300)
}

export function printReceiptInWindow(win, order) {
  if (!win) return
  win.document.write(buildReceiptHTML(order))
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 300)
}
