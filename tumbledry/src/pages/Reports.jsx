// src/pages/Reports.jsx

import { useState } from 'react'
import { useStore } from '../store/index.js'
import { api } from '../lib/api.js'
import { Card, Spinner } from '../components/ui/index.jsx'
import { FileText, Download, Upload, ClipboardList, AlertTriangle, Printer } from 'lucide-react'

export default function Reports() {
  const { orders, ordersLoading, fetchOrders } = useStore()
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] })
  const [toDate,      setToDate]      = useState(new Date().toISOString().split('T')[0])
  const [reportDate,  setReportDate]  = useState(new Date().toISOString().split('T')[0])
  const [toast,       setToast]       = useState('')
  const [importing,   setImporting]   = useState(false)
  const [importResult,setImportResult]= useState(null)

  const active = orders.filter(o => !o.deleted)

  async function handleImportCSV(e) {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const text    = await file.text()
      const lines   = text.split('\n').filter(l => l.trim())
      const headers = lines[0].split(',').map(h => h.replace(/"/g,'').trim())
      const parsed  = []
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        if (!line.trim()) continue
        const vals = []
        let cur = '', inQuote = false
        for (let c = 0; c < line.length; c++) {
          if (line[c] === '"') { inQuote = !inQuote }
          else if (line[c] === ',' && !inQuote) { vals.push(cur.trim()); cur = '' }
          else cur += line[c]
        }
        vals.push(cur.trim())
        const row = {}
        headers.forEach((h, idx) => { row[h] = vals[idx] || '' })
        parsed.push({
          id:              row['Order ID'] || `IMP${i}`,
          customerName:    row['Customer Name'] || '',
          customerNumber:  row['Phone'] || '',
          customerAddress: row['Address'] || '',
          customerCity:    row['City'] || '',
          customerPincode: '',
          tagNumber:       row['Tag #'] || '',
          serviceType:     row['Service'] || 'Dry Clean',
          status:          row['Status'] || 'delivered',
          paymentMethod:   row['Payment Method'] || 'Cash',
          paymentStatus:   row['Payment Status'] || 'Paid',
          grandTotal:      parseFloat(row['Grand Total (₹)']) || 0,
          totalGarments:   parseInt(row['Total Garments']) || 1,
          discountAmount:  parseFloat(row['Discount (₹)']) || 0,
          discountPct:     parseFloat(row['Discount %']) || 0,
          orderDate:       (() => { try { const d = new Date(row['Order Date']); return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString() } catch { return new Date().toISOString() } })(),
          deliveryDate:    row['Delivery Date'] || '',
          cart: [], deleted: false,
        })
      }
      if (parsed.length === 0) throw new Error('No valid orders found in CSV')
      await api.orders.clearAll()
      const BATCH = 50
      let imported = 0
      for (let i = 0; i < parsed.length; i += BATCH) {
        await api.orders.insertBatch(parsed.slice(i, i + BATCH))
        imported += Math.min(BATCH, parsed.length - i)
        setImportResult({ success: null, count: imported, total: parsed.length })
      }
      await fetchOrders()
      setImportResult({ success: true, count: parsed.length })
      showToast(`✅ Imported ${parsed.length} orders successfully`)
    } catch(err) {
      setImportResult({ success: false, error: err.message })
      showToast('❌ Import failed: ' + err.message)
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  function exportCSV() {
    const from = new Date(fromDate + 'T00:00:00')
    const to   = new Date(toDate   + 'T23:59:59')
    const rangeOrders = active.filter(o => { const d = new Date(o.orderDate); return d >= from && d <= to })
    if (rangeOrders.length === 0) return showToast('No orders in selected date range')
    const headers = ['Order ID','Customer Name','Phone','Tag #','Delivery Date','Grand Total (₹)','Total Garments','Order Date','Status','Service','Payment Method','Payment Status','Discount (₹)','Discount %','Address','City','Items']
    const rows = rangeOrders.map(o => [
      o.id,
      `"${(o.customerName||'').replace(/"/g,'""')}"`,
      o.customerNumber,
      o.tagNumber,
      `"${o.deliveryDate||''}"`,
      o.grandTotal,
      o.totalGarments,
      new Date(o.orderDate).toISOString(),
      o.status, o.serviceType, o.paymentMethod, o.paymentStatus,
      o.discountAmount||0, o.discountPct||0,
      `"${(o.customerAddress||'').replace(/"/g,'""')}"`,
      `"${(o.customerCity||'').replace(/"/g,'""')}"`,
      `"${(o.cart||[]).map(i=>`${i.qty}x ${i.name} @₹${i.unitPrice}`).join(' | ').replace(/"/g,'""')}"`,
    ])
    const csv  = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `tumbledry-orders-${fromDate}-to-${toDate}.csv`; a.click()
    URL.revokeObjectURL(url)
    showToast(`✅ Exported ${rangeOrders.length} orders`)
  }

  function getReportData() {
    const dayOrders       = active.filter(o => o.orderDate.slice(0,10) === reportDate)
    const totalRevenue    = dayOrders.reduce((s,o) => s+o.grandTotal, 0)
    const totalGarments   = dayOrders.reduce((s,o) => s+(o.totalGarments||0), 0)
    const cashOrders      = dayOrders.filter(o => o.paymentMethod === 'Cash')
    const onlineOrders    = dayOrders.filter(o => o.paymentMethod === 'Online')
    const paidOrders      = dayOrders.filter(o => o.paymentStatus === 'Paid')
    const pendingOrders   = dayOrders.filter(o => o.paymentStatus !== 'Paid')
    const uniqueCustomers = new Set(dayOrders.map(o=>o.customerNumber)).size
    const totalDiscount   = dayOrders.reduce((s,o) => s+(o.discountAmount||0), 0)
    const serviceBreakdown = {}
    dayOrders.forEach(o => {
      if (!serviceBreakdown[o.serviceType]) serviceBreakdown[o.serviceType] = { count:0, revenue:0 }
      serviceBreakdown[o.serviceType].count++
      serviceBreakdown[o.serviceType].revenue += o.grandTotal
    })
    return { dayOrders, totalRevenue, totalGarments, cashOrders, onlineOrders, paidOrders, pendingOrders, uniqueCustomers, totalDiscount, serviceBreakdown }
  }

  function printReport() {
    const d         = getReportData()
    const dateLabel = new Date(reportDate+'T12:00:00').toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      body{font-family:'Courier New',monospace;max-width:600px;margin:0 auto;padding:20px;color:#000}
      h1{font-size:18px;text-align:center;margin-bottom:4px}
      .sub{text-align:center;font-size:13px;color:#555;margin-bottom:20px}
      .section{margin-bottom:18px}
      .section h2{font-size:13px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px}
      .row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;border-bottom:1px dashed #eee}
      .total{font-size:20px;font-weight:bold;text-align:right;margin-top:8px}
      @media print{@page{margin:10mm}}
    </style></head><body>
    <h1>TUMBLEDRY — Daily Closing Report</h1>
    <div class="sub">${dateLabel}</div>
    <div class="section"><h2>📊 Summary</h2>
      <div class="row"><span>Total Orders</span><strong>${d.dayOrders.length}</strong></div>
      <div class="row"><span>Total Garments</span><strong>${d.totalGarments}</strong></div>
      <div class="row"><span>Unique Customers</span><strong>${d.uniqueCustomers}</strong></div>
      <div class="row"><span>Discounts Given</span><strong>-₹${Math.round(d.totalDiscount).toLocaleString()}</strong></div>
    </div>
    <div class="section"><h2>💰 Revenue</h2>
      <div class="row"><span>💵 Cash (${d.cashOrders.length})</span><strong>₹${d.cashOrders.reduce((s,o)=>s+o.grandTotal,0).toLocaleString()}</strong></div>
      <div class="row"><span>📲 Online (${d.onlineOrders.length})</span><strong>₹${d.onlineOrders.reduce((s,o)=>s+o.grandTotal,0).toLocaleString()}</strong></div>
      <div class="row"><span>✅ Collected</span><strong>₹${d.paidOrders.reduce((s,o)=>s+o.grandTotal,0).toLocaleString()}</strong></div>
      <div class="row"><span>⏳ Pending</span><strong style="color:red">₹${d.pendingOrders.reduce((s,o)=>s+o.grandTotal,0).toLocaleString()}</strong></div>
      <div class="total">Grand Total: ₹${d.totalRevenue.toLocaleString()}</div>
    </div>
    <div class="section"><h2>🧹 Services</h2>
      ${Object.entries(d.serviceBreakdown).map(([svc,{count,revenue}])=>`<div class="row"><span>${svc}</span><strong>${count} · ₹${revenue.toLocaleString()}</strong></div>`).join('')||'<div class="row"><span>No orders today</span></div>'}
    </div>
    <div class="section"><h2>📋 Orders</h2>
      ${d.dayOrders.map(o=>`<div class="row"><span>${o.tagNumber} · ${o.customerName}</span><strong>₹${o.grandTotal} <span style="font-weight:400;font-size:11px">${o.paymentMethod} · ${o.paymentStatus}</span></strong></div>`).join('')||'<div class="row"><span>No orders</span></div>'}
    </div>
    </body></html>`
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 300)
  }

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(''), 3000) }

  const inp = { padding:'9px 12px', borderRadius:8, border:'1.5px solid var(--bd-subtle)', fontSize:13, fontFamily:'inherit', background:'var(--bg-input)', color:'var(--tx-primary)', outline:'none', width:'100%', boxSizing:'border-box' }
  const lbl = { display:'block', marginBottom:5, fontSize:11, fontWeight:700, color:'var(--tx-secondary)', textTransform:'uppercase', letterSpacing:'0.5px' }

  const reportData = getReportData()

  const rangeFrom  = new Date(fromDate+'T00:00:00')
  const rangeTo    = new Date(toDate+'T23:59:59')
  const rangeOrds  = active.filter(o => { const d=new Date(o.orderDate); return d>=rangeFrom&&d<=rangeTo })
  const rangeRev   = rangeOrds.reduce((s,o)=>s+o.grandTotal,0)

  if (ordersLoading) return <div style={{display:'flex',justifyContent:'center',padding:80}}><Spinner size={40}/></div>

  return (
    <div className="page">
      <h1 style={{ fontSize:20, fontWeight:800, marginBottom:20, color:'var(--tx-primary)', letterSpacing:'-0.4px', display:'flex', alignItems:'center', gap:10 }}>
        <FileText size={20} strokeWidth={2} /> Reports
      </h1>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16 }}>

        {/* CSV Export */}
        <Card>
          <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', color:'var(--tx-tertiary)', marginBottom:18, display:'flex', alignItems:'center', gap:6 }}><Download size={12} /> Export to CSV</div>
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>From Date</label>
            <input type="date" style={inp} value={fromDate} onChange={e=>setFromDate(e.target.value)} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={lbl}>To Date</label>
            <input type="date" style={inp} value={toDate} onChange={e=>setToDate(e.target.value)} />
          </div>
          <div style={{ padding:'10px 14px', background:'var(--bg-raised)', borderRadius:8, marginBottom:16, fontSize:13, color:'var(--tx-secondary)', border:'1px solid var(--bd-subtle)' }}>
            <strong style={{color:'var(--tx-primary)'}}>{rangeOrds.length} orders</strong> · ₹{rangeRev.toLocaleString()} revenue in range
          </div>
          <button onClick={exportCSV} style={{ width:'100%', padding:12, background:'linear-gradient(135deg,#0284c7,#38bdf8)', color:'white', border:'none', borderRadius:10, fontFamily:'inherit', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 4px 14px rgba(56,189,248,0.25)', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
            <Download size={15} strokeWidth={2.5} /> Download CSV
          </button>
          <div style={{ marginTop:12, fontSize:12, color:'var(--tx-tertiary)', lineHeight:1.6 }}>
            Exports all order fields. Opens directly in Excel or Google Sheets.
          </div>
        </Card>

        {/* CSV Import */}
        <Card>
          <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', color:'var(--tx-tertiary)', marginBottom:18, display:'flex', alignItems:'center', gap:6 }}><Upload size={12} /> Import from CSV</div>
          <div style={{ padding:'12px 14px', background:'var(--bg-raised)', borderRadius:8, marginBottom:16, fontSize:13, color:'var(--tx-secondary)', border:'1px solid var(--bd-subtle)', lineHeight:1.7, display:'flex', alignItems:'flex-start', gap:8 }}>
            <AlertTriangle size={13} style={{flexShrink:0, color:'var(--amber)'}} /> <span><strong style={{color:'var(--tx-primary)'}}>Warning:</strong> This will <strong style={{color:'var(--rose)'}}>replace ALL existing orders</strong>. Use only for initial migration.</span>
          </div>
          <label style={{ display:'block', cursor:'pointer' }}>
            <input type="file" accept=".csv" onChange={handleImportCSV} style={{display:'none'}} disabled={importing} />
            <div style={{ width:'100%', padding:12, background: importing ? 'var(--bg-raised)' : 'linear-gradient(135deg,#72BF2C,#8DD446)', color: importing ? 'var(--tx-secondary)' : 'white', border: importing ? '1px solid var(--bd-subtle)' : 'none', borderRadius:10, fontFamily:'inherit', fontWeight:700, fontSize:14, cursor: importing ? 'not-allowed' : 'pointer', boxShadow: importing ? 'none' : '0 4px 14px rgba(114,191,44,0.28)', textAlign:'center', boxSizing:'border-box' }}>
              <span style={{display:'flex', alignItems:'center', justifyContent:'center', gap:7}}>
                <Upload size={15} strokeWidth={2.5} />
                {importing ? 'Importing...' : 'Choose CSV File to Import'}
              </span>
            </div>
          </label>
          {importResult && (
            <div style={{ marginTop:12, padding:'12px 14px', borderRadius:8,
              background: importResult.success === true ? 'rgba(16,185,129,0.08)' : importResult.success === false ? 'rgba(244,63,94,0.08)' : 'rgba(13,148,136,0.08)',
              border: `1px solid ${importResult.success === true ? 'rgba(16,185,129,0.2)' : importResult.success === false ? 'rgba(244,63,94,0.2)' : 'rgba(13,148,136,0.2)'}`,
              fontSize:13, color: importResult.success === true ? 'var(--emerald)' : importResult.success === false ? 'var(--rose)' : 'var(--indigo)' }}>
              {importResult.success === true
                ? `✅ ${importResult.count} orders imported successfully`
                : importResult.success === false
                ? `❌ Error: ${importResult.error}`
                : `⏳ Importing... ${importResult.count} / ${importResult.total} orders`}
            </div>
          )}
          <div style={{ marginTop:12, fontSize:12, color:'var(--tx-tertiary)', lineHeight:1.6 }}>
            Upload <strong>tumbledry_orders_import.csv</strong> — must match the export column headers.
          </div>
        </Card>

        {/* Daily Closing Report */}
        <Card>
          <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', color:'var(--tx-tertiary)', marginBottom:18, display:'flex', alignItems:'center', gap:6 }}><ClipboardList size={12} /> Daily Closing Report</div>
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Report Date</label>
            <input type="date" style={inp} value={reportDate} onChange={e=>setReportDate(e.target.value)} />
          </div>

          {/* Live preview */}
          <div style={{ background:'var(--bg-raised)', borderRadius:10, padding:14, marginBottom:16, border:'1px solid var(--bd-subtle)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              {[
                {label:'Orders',    value:reportData.dayOrders.length},
                {label:'Revenue',   value:`₹${reportData.totalRevenue.toLocaleString()}`},
                {label:'Cash',      value:`₹${reportData.cashOrders.reduce((s,o)=>s+o.grandTotal,0).toLocaleString()}`},
                {label:'Online',    value:`₹${reportData.onlineOrders.reduce((s,o)=>s+o.grandTotal,0).toLocaleString()}`},
                {label:'Collected', value:`₹${reportData.paidOrders.reduce((s,o)=>s+o.grandTotal,0).toLocaleString()}`},
                {label:'Pending',   value:`₹${reportData.pendingOrders.reduce((s,o)=>s+o.grandTotal,0).toLocaleString()}`},
              ].map(s => (
                <div key={s.label} style={{textAlign:'center'}}>
                  <div className="mono" style={{fontSize:15, fontWeight:800, color:'var(--tx-primary)'}}>{s.value}</div>
                  <div style={{fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--tx-secondary)', marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>
            {Object.keys(reportData.serviceBreakdown).length > 0 && (
              <div style={{borderTop:'1px solid var(--bd-subtle)', paddingTop:10}}>
                {Object.entries(reportData.serviceBreakdown).map(([svc,{count,revenue}]) => (
                  <div key={svc} style={{display:'flex', justifyContent:'space-between', fontSize:12, padding:'3px 0', color:'var(--tx-secondary)'}}>
                    <span>{svc}</span>
                    <span className="mono">{count} · ₹{revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={printReport} style={{ width:'100%', padding:12, background:'linear-gradient(135deg,#d97706,#f59e0b)', color:'white', border:'none', borderRadius:10, fontFamily:'inherit', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 4px 14px rgba(245,158,11,0.25)', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
            <Printer size={15} strokeWidth={2.5} /> Print / Save as PDF
          </button>
        </Card>
      </div>

      {toast && (
        <div style={{ position:'fixed', bottom:'calc(var(--nav-h) + 16px)', right:16, background:'var(--bg-card)', border:'1px solid var(--bd-subtle)', borderLeft:'3px solid var(--emerald)', borderRadius:10, padding:'10px 16px', boxShadow:'var(--shadow-lg)', fontSize:13, fontWeight:600, zIndex:9999, color:'var(--tx-primary)', animation:'fadeUp 0.25s var(--ease-out)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
