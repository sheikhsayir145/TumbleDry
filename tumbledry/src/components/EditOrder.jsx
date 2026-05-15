// src/components/EditOrder.jsx

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
  const [error,  setError]  = useState('')

  const inp = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid var(--bd-subtle)', fontSize:13, fontFamily:'inherit', fontWeight:500, background:'var(--bg-input)', color:'var(--tx-primary)', outline:'none', boxSizing:'border-box' }
  const lbl = { display:'block', marginBottom:5, fontSize:11, fontWeight:700, color:'var(--tx-secondary)', textTransform:'uppercase', letterSpacing:'0.5px' }

  function set(k, v) { setForm(f => ({...f, [k]: v})) }

  async function save() {
    setSaving(true)
    setError('')
    try {
      await upsertOrder({ ...order, ...form })
      onClose()
    } catch(e) {
      setError('❌ ' + e.message)
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
    <Modal open={true} onClose={onClose} title={`✏️ Edit — ${order.tagNumber}`} maxWidth={580}>
      <div style={{ display:'grid', gap:12 }}>

        {/* Customer section */}
        <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-tertiary)', marginBottom:2 }}>👤 Customer</div>
        <div className="form-two">
          <div><label style={lbl}>Name</label><input style={inp} value={form.customerName} onChange={e=>set('customerName',e.target.value)} /></div>
          <div><label style={lbl}>Phone</label><input style={inp} value={form.customerNumber} onChange={e=>set('customerNumber',e.target.value)} /></div>
          <div><label style={lbl}>Address</label><input style={inp} value={form.customerAddress} onChange={e=>set('customerAddress',e.target.value)} /></div>
          <div><label style={lbl}>City</label><input style={inp} value={form.customerCity} onChange={e=>set('customerCity',e.target.value)} /></div>
        </div>

        {/* Order section */}
        <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-tertiary)', marginTop:6, marginBottom:2 }}>📦 Order Details</div>
        <div className="form-three">
          <div><label style={lbl}>Tag #</label><input style={inp} value={form.tagNumber} onChange={e=>set('tagNumber',e.target.value)} /></div>
          <div><label style={lbl}>Delivery Date</label><input style={inp} value={form.deliveryDate} onChange={e=>set('deliveryDate',e.target.value)} /></div>
          <div>
            <label style={lbl}>Service</label>
            <select style={{...inp, cursor:'pointer'}} value={form.serviceType} onChange={e=>set('serviceType',e.target.value)}>
              {SERVICES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Status & Payment */}
        <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-tertiary)', marginTop:6, marginBottom:2 }}>📋 Status & Payment</div>

        <div>
          <label style={lbl}>Order Status</label>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {STATUS_OPTIONS.map(s => {
              const active = form.status === s.value
              return (
                <button key={s.value} onClick={()=>set('status',s.value)} style={{
                  padding:'8px 13px', borderRadius:8, cursor:'pointer',
                  fontFamily:'inherit', fontWeight:600, fontSize:12,
                  background: active ? 'rgba(13,148,136,0.1)' : 'transparent',
                  color: active ? 'var(--indigo)' : 'var(--tx-secondary)',
                  border: `2px solid ${active ? 'var(--indigo)' : 'var(--bd-subtle)'}`,
                  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                }}>
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="form-two">
          <div>
            <label style={lbl}>Payment Method</label>
            <select style={{...inp, cursor:'pointer'}} value={form.paymentMethod} onChange={e=>set('paymentMethod',e.target.value)}>
              <option>Cash</option><option>Online</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Payment Status</label>
            <select style={{...inp, cursor:'pointer'}} value={form.paymentStatus} onChange={e=>set('paymentStatus',e.target.value)}>
              <option>Paid</option><option>Pending</option><option>Partial</option>
            </select>
          </div>
        </div>

        {/* Cart summary (read-only) */}
        {order.cart && order.cart.length > 0 && (
          <div style={{ background:'var(--bg-raised)', borderRadius:9, padding:'12px 14px', border:'1px solid var(--bd-subtle)', marginTop:4 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--tx-tertiary)', marginBottom:8 }}>🛒 Items (read-only)</div>
            {order.cart.map((item,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--tx-secondary)', padding:'4px 0', borderBottom:'1px dashed var(--bd-subtle)' }}>
                <span>{item.qty}x {item.name}</span>
                <span className="mono">₹{Math.round(item.net)}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:800, color:'var(--tx-primary)', marginTop:8 }}>
              <span>Total</span>
              <span className="mono">₹{order.grandTotal}</span>
            </div>
          </div>
        )}

        {error && <div style={{ fontSize:13, color:'var(--rose)', fontWeight:600, padding:'8px 12px', background:'rgba(244,63,94,0.06)', borderRadius:8 }}>{error}</div>}

        {/* Actions */}
        <div style={{ display:'flex', gap:10, marginTop:4 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, background:'var(--bg-raised)', border:'1px solid var(--bd-subtle)', borderRadius:9, fontFamily:'inherit', fontWeight:600, cursor:'pointer', color:'var(--tx-secondary)', fontSize:13 }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} style={{ flex:2, padding:12, background:'linear-gradient(135deg,var(--indigo),#14B8A6)', color:'white', border:'none', borderRadius:9, fontFamily:'inherit', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontSize:14, opacity:saving?0.7:1 }}>
            {saving ? '⏳ Saving...' : '✅ Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
