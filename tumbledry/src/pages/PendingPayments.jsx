// src/pages/PendingPayments.jsx

import { useEffect, useState } from 'react'
import { useStore } from '../store/index.js'
import { Card, Badge, Spinner, EmptyState, Modal } from '../components/ui/index.jsx'

export default function PendingPayments() {
  const { orders, ordersLoading, fetchOrders, upsertOrder } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('oldest')
  const [toast, setToast] = useState('')
  const [confirmOrder, setConfirmOrder] = useState(null)

  useEffect(() => { fetchOrders() }, [])

  const pending = orders.filter(o =>
    !o.deleted && (o.paymentStatus === 'Pending' || o.paymentStatus === 'Partial')
  )

  const unpaid  = pending.filter(o => o.paymentStatus === 'Pending')
  const partial = pending.filter(o => o.paymentStatus === 'Partial')
  const totalOutstanding = pending.reduce((s, o) => s + o.grandTotal, 0)

  // Filter + search
  let filtered = pending
  if (statusFilter) filtered = filtered.filter(o => o.paymentStatus === statusFilter)
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(o =>
      (o.customerName||'').toLowerCase().includes(q) ||
      (o.customerNumber||'').includes(q) ||
      (o.tagNumber||'').toLowerCase().includes(q)
    )
  }

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'oldest')      return new Date(a.orderDate) - new Date(b.orderDate)
    if (sortBy === 'newest')      return new Date(b.orderDate) - new Date(a.orderDate)
    if (sortBy === 'amount_desc') return b.grandTotal - a.grandTotal
    if (sortBy === 'amount_asc')  return a.grandTotal - b.grandTotal
    return 0
  })

  // Outstanding aging buckets
  const now = Date.now()
  const aging = [
    { label: '0–7 Days',  cls: 'fresh',  color: 'var(--emerald)', bg: 'rgba(16,185,129,0.08)',  orders: pending.filter(o => (now-new Date(o.orderDate))/86400000 <= 7)  },
    { label: '8–30 Days', cls: 'medium', color: 'var(--amber)',   bg: 'rgba(245,158,11,0.08)',  orders: pending.filter(o => { const d=(now-new Date(o.orderDate))/86400000; return d>7&&d<=30 }) },
    { label: '30+ Days',  cls: 'old',    color: 'var(--rose)',    bg: 'rgba(244,63,94,0.08)',   orders: pending.filter(o => (now-new Date(o.orderDate))/86400000 > 30)  },
  ]

  async function collectPayment(order) {
    await upsertOrder({ ...order, paymentStatus: 'Paid' })
    setConfirmOrder(null)
    showToast(`✅ Payment collected from ${order.customerName}`)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function highlight(text) {
    if (!search.trim()) return text
    const re = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi')
    const parts = String(text).split(re)
    return parts.map((p, i) =>
      re.test(p) ? <mark key={i} style={{ background:'#fef08a', borderRadius:2, padding:'0 1px' }}>{p}</mark> : p
    )
  }

  if (ordersLoading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={40} /></div>

  return (
    <div style={{ padding:24 }}>
      <h1 style={{ fontSize:22, fontWeight:800, marginBottom:24, color:'var(--tx-primary)', letterSpacing:'-0.5px' }}>
        💳 Pending Payments
      </h1>

      {/* Summary stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Unpaid Orders',    value: unpaid.length,              color:'var(--rose)',    bg:'rgba(244,63,94,0.06)',  border:'rgba(244,63,94,0.15)'  },
          { label:'Partial Orders',   value: partial.length,             color:'var(--amber)',   bg:'rgba(245,158,11,0.06)', border:'rgba(245,158,11,0.15)' },
          { label:'Total Outstanding', value:`₹${totalOutstanding.toLocaleString()}`, color:'var(--indigo)', bg:'rgba(99,102,241,0.06)', border:'rgba(99,102,241,0.15)' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:'16px 20px', textAlign:'center' }}>
            <div style={{ fontSize:24, fontWeight:800, fontFamily:'DM Mono', color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:s.color, opacity:0.8, marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Aging buckets */}
      <Card style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-secondary)', marginBottom:14 }}>⏳ Payment Aging</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {aging.map(b => (
            <div key={b.label} style={{ background:b.bg, borderLeft:`3px solid ${b.color}`, borderRadius:8, padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:'var(--tx-primary)' }}>{b.label}</div>
                <div style={{ fontSize:11, color:'var(--tx-secondary)', marginTop:2 }}>{b.orders.length} orders</div>
              </div>
              <div style={{ fontSize:18, fontWeight:800, fontFamily:'DM Mono', color:b.color }}>
                ₹{b.orders.reduce((s,o)=>s+o.grandTotal,0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Search + filters */}
      <Card>
        <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 Search by name, phone or tag..."
            style={{ flex:1, minWidth:200, padding:'9px 14px', borderRadius:8, border:'1px solid var(--bd-subtle)', fontSize:13, background:'var(--bg-input)', color:'var(--tx-primary)', fontFamily:'inherit' }} />
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            style={{ padding:'9px 14px', borderRadius:8, border:'1px solid var(--bd-subtle)', fontSize:13, background:'var(--bg-input)', color:'var(--tx-primary)', fontFamily:'inherit' }}>
            <option value="">All Pending</option>
            <option value="Pending">Unpaid Only</option>
            <option value="Partial">Partial Only</option>
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
            style={{ padding:'9px 14px', borderRadius:8, border:'1px solid var(--bd-subtle)', fontSize:13, background:'var(--bg-input)', color:'var(--tx-primary)', fontFamily:'inherit' }}>
            <option value="oldest">Oldest First</option>
            <option value="newest">Newest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>

        {search || statusFilter ? (
          <div style={{ fontSize:12, color:'var(--tx-secondary)', marginBottom:10 }}>
            Showing {filtered.length} of {pending.length} pending orders
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState icon="🎉" title="No pending payments" subtitle={search ? `No results for "${search}"` : "All payments collected!"} />
        ) : (
          <div style={{ border:'1px solid var(--bd-subtle)', borderRadius:10, overflow:'hidden' }}>
            {filtered.map(order => {
              const badgeColor = order.paymentStatus === 'Pending' ? 'var(--rose)' : 'var(--amber)'
              const daysSince  = Math.floor((Date.now()-new Date(order.orderDate))/86400000)
              return (
                <div key={order.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid var(--bd-subtle)', flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:160 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:'var(--tx-primary)' }}>
                      {highlight(order.customerName)}
                      <span style={{ fontFamily:'DM Mono', fontSize:11, color:'var(--indigo)', marginLeft:8 }}>{highlight(order.tagNumber)}</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--tx-secondary)', marginTop:2 }}>
                      📞 {highlight(order.customerNumber)} · 📅 {new Date(order.orderDate).toLocaleDateString('en-IN')} · {order.serviceType}
                    </div>
                    <div style={{ fontSize:11, color:'var(--tx-secondary)' }}>
                      🚚 {order.deliveryDate} · {daysSince}d ago
                    </div>
                  </div>
                  <span style={{ background:`${badgeColor}22`, color:badgeColor, border:`1px solid ${badgeColor}44`, padding:'3px 10px', borderRadius:99, fontSize:10, fontWeight:700, textTransform:'uppercase', whiteSpace:'nowrap' }}>
                    {order.paymentStatus}
                  </span>
                  <div style={{ fontSize:18, fontWeight:800, fontFamily:'DM Mono', color:'var(--rose)', whiteSpace:'nowrap' }}>
                    ₹{order.grandTotal.toLocaleString()}
                  </div>
                  <button onClick={() => setConfirmOrder(order)}
                    style={{ padding:'8px 16px', background:'linear-gradient(135deg,#10b981,#059669)', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(16,185,129,0.2)' }}>
                    ✅ Collect
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Confirm collect modal */}
      <Modal open={!!confirmOrder} onClose={() => setConfirmOrder(null)} title="💳 Collect Payment">
        {confirmOrder && (
          <div>
            <div style={{ background:'var(--bg-raised)', borderRadius:10, padding:'16px 20px', marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{confirmOrder.customerName}</div>
              <div style={{ fontSize:13, color:'var(--tx-secondary)' }}>Tag: {confirmOrder.tagNumber} · {confirmOrder.serviceType}</div>
              <div style={{ fontSize:24, fontWeight:800, fontFamily:'DM Mono', color:'var(--emerald)', marginTop:8 }}>₹{confirmOrder.grandTotal.toLocaleString()}</div>
            </div>
            <p style={{ fontSize:13, color:'var(--tx-secondary)', marginBottom:20 }}>Mark this order as Paid?</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setConfirmOrder(null)}
                style={{ flex:1, padding:12, background:'var(--bg-raised)', border:'1px solid var(--bd-subtle)', borderRadius:8, fontFamily:'inherit', fontWeight:600, cursor:'pointer', color:'var(--tx-secondary)' }}>
                Cancel
              </button>
              <button onClick={() => collectPayment(confirmOrder)}
                style={{ flex:2, padding:12, background:'linear-gradient(135deg,#10b981,#059669)', color:'white', border:'none', borderRadius:8, fontFamily:'inherit', fontWeight:700, cursor:'pointer', fontSize:14 }}>
                ✅ Yes, Collect Payment
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'var(--bg-card)', border:'1px solid var(--bd-subtle)', borderLeft:'3px solid var(--emerald)', borderRadius:10, padding:'10px 18px', boxShadow:'var(--shadow-lg)', fontSize:13, fontWeight:600, zIndex:9999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
