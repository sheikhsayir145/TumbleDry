// src/components/EditOrder.jsx
// Modal to edit an existing order's status, payment, delivery date, tag

import { useState } from 'react'
import { useStore } from '../store/index.js'
import { Modal } from './ui/index.jsx'
import { SERVICES } from '../lib/garments.js'

export default function EditOrder({ order, onClose }) {
  const { upsertOrder } = useStore()
  const [form, setForm] = useState({
    customerName:    order.customerName    || '',
    customerNumber:  order.customerNumber  || '',
    customerAddress: order.customerAddress || '',
    customerCity:    order.customerCity    || '',
    customerPincode: order.customerPincode || '',
    tagNumber:       order.tagNumber       || '',
    deliveryDate:    order.deliveryDate    || '',
    serviceType:     order.serviceType     || 'Dry Clean',
    status:          order.status          || 'pending',
    paymentMethod:   order.paymentMethod   || 'Cash',
    paymentStatus:   order.paymentStatus   || 'Pending',
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState('')

  const inp = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid var(--bd-subtle)', fontSize:13, fontFamily:'inherit', fontWeight:500, background:'var(--bg-input)', color:'var(--tx-primary)', outline:'none', boxSizing:'border-box' }
  const lbl = { display:'block', marginBottom:5, fontSize:11, fontWeight:700, color:'var(--tx-secondary)', textTransform:'uppercase', letterSpacing:'0.5px' }

  function set(k, v) { setForm(f => ({...f, [k]: v})) }

  async function save() {
    setSaving(true)
    try {
      await upsertOrder({ ...order, ...form })
      onClose()
    } catch(e) {
      setToast('❌ ' + e.message)
      setSaving(false)
    }
  }

  const STATUS_OPTIONS = [
    { value:'pending',   label:'📥 Received'   },
    { value:'inprocess', label:'⚙️ In Process' },
    { value:'completed', label:'✅ Ready'       },
    { value:'delivered', label:'🚚 Delivered'   },
  ]

  return (
    <Modal open={true} onClose={onClose} title={`✏️ Edit Order — ${order.tagNumber}`} maxWidth={580}>
      <div style={{display:'grid', gap:12}}>

        {/* Customer */}
        <div style={{fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-secondary)', marginBottom:4}}>👤 Customer</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <div><label style={lbl}>Name</label><input style={inp} value={form.customerName} onChange={e=>set('customerName',e.target.value)} /></div>
          <div><label style={lbl}>Phone</label><input style={inp} value={form.customerNumber} onChange={e=>set('customerNumber',e.target.value)} /></div>
          <div><label style={lbl}>Address</label><input style={inp} value={form.customerAddress} onChange={e=>set('customerAddress',e.target.value)} /></div>
          <div><label style={lbl}>City</label><input style={inp} value={form.customerCity} onChange={e=>set('customerCity',e.target.value)} /></div>
        </div>

        {/* Order details */}
        <div style={{fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-secondary)', marginTop:8, marginBottom:4}}>📦 Order</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
          <div><label style={lbl}>Tag #</label><input style={inp} value={form.tagNumber} onChange={e=>set('tagNumber',e.target.value)} /></div>
          <div><label style={lbl}>Delivery Date</label><input style={inp} value={form.deliveryDate} onChange={e=>set('deliveryDate',e.target.value)} /></div>
          <div>
            <label style={lbl}>Service</label>
            <select style={{...inp,cursor:'pointer'}} value={form.serviceType} onChange={e=>set('serviceType',e.target.value)}>
              {SERVICES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Status */}
        <div style={{fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-secondary)', marginTop:8, marginBottom:8}}>📋 Status & Payment</div>

        {/* Status buttons */}
        <div>
          <label style={lbl}>Order Status</label>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            {STATUS_OPTIONS.map(s => (
              <button key={s.value} onClick={()=>set('status',s.value)}
                style={{ padding:'8px 14px', borderRadius:8, border:`2px solid ${form.status===s.value?'var(--indigo)':'var(--bd-subtle)'}`, background:form.status===s.value?'rgba(99,102,241,0.12)':'transparent', color:form.status===s.value?'var(--indigo)':'var(--tx-secondary)', fontFamily:'inherit', fontWeight:600, fontSize:12, cursor:'pointer', transition:'var(--transition)' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <div>
            <label style={lbl}>Payment Method</label>
            <select style={{...inp,cursor:'pointer'}} value={form.paymentMethod} onChange={e=>set('paymentMethod',e.target.value)}>
              <option>Cash</option><option>Online</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Payment Status</label>
            <select style={{...inp,cursor:'pointer'}} value={form.paymentStatus} onChange={e=>set('paymentStatus',e.target.value)}>
              <option>Paid</option><option>Pending</option><option>Partial</option>
            </select>
          </div>
        </div>

        {/* Cart summary (read-only) */}
        {order.cart && order.cart.length > 0 && (
          <div style={{background:'var(--bg-raised)', borderRadius:8, padding:'12px 14px', border:'1px solid var(--bd-subtle)'}}>
            <div style={{fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--tx-secondary)', marginBottom:8}}>🛒 Items (read-only)</div>
            {order.cart.map((item,i) => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--tx-secondary)', padding:'3px 0', borderBottom:'1px dashed var(--bd-subtle)'}}>
                <span>{item.qty}x {item.name}</span>
                <span style={{fontFamily:'DM Mono'}}>₹{Math.round(item.net)}</span>
              </div>
            ))}
            <div style={{display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:800, fontFamily:'DM Mono', color:'var(--tx-primary)', marginTop:8}}>
              <span>Total</span>
              <span>₹{order.grandTotal}</span>
            </div>
          </div>
        )}

        {/* Save button */}
        <div style={{display:'flex', gap:10, marginTop:8}}>
          <button onClick={onClose} style={{flex:1, padding:12, background:'var(--bg-raised)', border:'1px solid var(--bd-subtle)', borderRadius:8, fontFamily:'inherit', fontWeight:600, cursor:'pointer', color:'var(--tx-secondary)', fontSize:13}}>
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            style={{flex:2, padding:12, background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:8, fontFamily:'inherit', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontSize:14, opacity:saving?0.7:1}}>
            {saving ? '⏳ Saving...' : '✅ Save Changes'}
          </button>
        </div>

        {toast && <div style={{fontSize:13, color:'var(--rose)', fontWeight:600}}>{toast}</div>}
      </div>
    </Modal>
  )
}
