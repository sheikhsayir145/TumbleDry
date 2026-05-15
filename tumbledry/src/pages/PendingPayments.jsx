// src/pages/PendingPayments.jsx

import { useState } from 'react'
import { useStore } from '../store/index.js'
import { Card, Spinner, EmptyState, Modal } from '../components/ui/index.jsx'
import { CreditCard, Clock, Phone, Truck, CheckCircle2, PartyPopper } from 'lucide-react'

export default function PendingPayments() {
  const { orders, ordersLoading, upsertOrder } = useStore()
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy,       setSortBy]       = useState('oldest')
  const [toast,        setToast]        = useState('')
  const [confirmOrder, setConfirmOrder] = useState(null)

  const pending  = orders.filter(o => !o.deleted && (o.paymentStatus === 'Pending' || o.paymentStatus === 'Partial'))
  const unpaid   = pending.filter(o => o.paymentStatus === 'Pending')
  const partial  = pending.filter(o => o.paymentStatus === 'Partial')
  const totalOut = pending.reduce((s, o) => s + o.grandTotal, 0)

  let filtered = pending
  if (statusFilter) filtered = filtered.filter(o => o.paymentStatus === statusFilter)
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(o =>
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.customerNumber || '').includes(q) ||
      (o.tagNumber || '').toLowerCase().includes(q)
    )
  }

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'oldest')      return new Date(a.orderDate) - new Date(b.orderDate)
    if (sortBy === 'newest')      return new Date(b.orderDate) - new Date(a.orderDate)
    if (sortBy === 'amount_desc') return b.grandTotal - a.grandTotal
    if (sortBy === 'amount_asc')  return a.grandTotal - b.grandTotal
    return 0
  })

  const now   = Date.now()
  const aging = [
    { label: '0–7 Days',  color: 'var(--emerald)', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  orders: pending.filter(o => (now - new Date(o.orderDate)) / 86400000 <= 7) },
    { label: '8–30 Days', color: 'var(--amber)',   bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  orders: pending.filter(o => { const d = (now - new Date(o.orderDate)) / 86400000; return d > 7 && d <= 30 }) },
    { label: '30+ Days',  color: 'var(--rose)',    bg: 'rgba(244,63,94,0.08)',   border: 'rgba(244,63,94,0.2)',   orders: pending.filter(o => (now - new Date(o.orderDate)) / 86400000 > 30) },
  ]

  async function collectPayment(order) {
    await upsertOrder({ ...order, paymentStatus: 'Paid' })
    setConfirmOrder(null)
    showToast(`✅ Payment collected from ${order.customerName}`)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function highlight(text) {
    if (!search.trim()) return text
    const re    = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = String(text).split(re)
    return parts.map((p, i) =>
      re.test(p) ? <mark key={i} style={{ background: '#fef08a', borderRadius: 2, padding: '0 1px' }}>{p}</mark> : p
    )
  }

  if (ordersLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={40} /></div>

  return (
    <div className="page">
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, color: 'var(--tx-primary)', letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <CreditCard size={20} strokeWidth={2} /> Pending Payments
      </h1>

      {/* Summary stats */}
      <div className="three-col" style={{ marginBottom: 20 }}>
        {[
          { label: 'Unpaid Orders',     value: unpaid.length,              color: 'var(--rose)',    bg: 'rgba(244,63,94,0.06)',  border: 'rgba(244,63,94,0.15)'  },
          { label: 'Partial Orders',    value: partial.length,             color: 'var(--amber)',   bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)' },
          { label: 'Total Outstanding', value: `₹${totalOut.toLocaleString()}`, color: 'var(--indigo)', bg: 'rgba(13,148,136,0.06)', border: 'rgba(13,148,136,0.15)' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '14px 18px', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: s.color, opacity: 0.8, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Aging buckets */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--tx-tertiary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={12} /> Payment Aging</div>
        <div className="aging-grid">
          {aging.map(b => (
            <div key={b.label} style={{ background: b.bg, borderLeft: `3px solid ${b.color}`, borderRadius: 9, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--tx-primary)' }}>{b.label}</div>
                <div style={{ fontSize: 11, color: 'var(--tx-secondary)', marginTop: 2 }}>{b.orders.length} orders</div>
              </div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 800, color: b.color }}>
                ₹{b.orders.reduce((s, o) => s + o.grandTotal, 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Search + filters + list */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--bd-subtle)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search by name, phone or tag…"
            style={{ flex: 1, minWidth: 160, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--bd-subtle)', fontSize: 13, background: 'var(--bg-input)', color: 'var(--tx-primary)', fontFamily: 'inherit', outline: 'none' }}
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--bd-subtle)', fontSize: 13, background: 'var(--bg-input)', color: 'var(--tx-primary)', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
            <option value="">All Pending</option>
            <option value="Pending">Unpaid Only</option>
            <option value="Partial">Partial Only</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--bd-subtle)', fontSize: 13, background: 'var(--bg-input)', color: 'var(--tx-primary)', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
            <option value="oldest">Oldest First</option>
            <option value="newest">Newest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>

        {(search || statusFilter) && (
          <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--tx-secondary)', borderBottom: '1px solid var(--bd-subtle)', background: 'var(--bg-raised)' }}>
            Showing {filtered.length} of {pending.length} pending orders
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState icon={<PartyPopper size={38} strokeWidth={1.5} />} title="No pending payments" subtitle={search ? `No results for "${search}"` : 'All payments collected!'} />
        ) : (
          filtered.map(order => {
            const badgeColor = order.paymentStatus === 'Pending' ? 'var(--rose)' : 'var(--amber)'
            const daysSince  = Math.floor((Date.now() - new Date(order.orderDate)) / 86400000)
            return (
              <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--bd-subtle)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--tx-primary)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                    {highlight(order.customerName)}
                    <span className="mono" style={{ fontSize: 11, color: 'var(--indigo)', fontWeight: 600 }}>{highlight(order.tagNumber)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--tx-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <Phone size={10} style={{ opacity: 0.5 }} /> {highlight(order.customerNumber)} · {new Date(order.orderDate).toLocaleDateString('en-IN')} · {daysSince}d ago
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--tx-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Truck size={10} style={{ opacity: 0.5 }} /> {order.deliveryDate} · {order.serviceType}
                  </div>
                </div>

                <span style={{ background: `${badgeColor}22`, color: badgeColor, border: `1px solid ${badgeColor}44`, padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {order.paymentStatus}
                </span>

                <div className="mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--rose)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  ₹{order.grandTotal.toLocaleString()}
                </div>

                <button onClick={() => setConfirmOrder(order)} style={{
                  padding: '8px 14px', background: 'linear-gradient(135deg,#059669,#10B981)',
                  color: 'white', border: 'none', borderRadius: 8, fontWeight: 700,
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.2)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <CheckCircle2 size={13} strokeWidth={2.5} /> Collect
                </button>
              </div>
            )
          })
        )}
      </Card>

      {/* Confirm modal */}
      <Modal open={!!confirmOrder} onClose={() => setConfirmOrder(null)} title="Collect Payment" maxWidth={400}>
        {confirmOrder && (
          <div>
            <div style={{ background: 'var(--bg-raised)', borderRadius: 10, padding: '16px 18px', marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{confirmOrder.customerName}</div>
              <div style={{ fontSize: 13, color: 'var(--tx-secondary)' }}>Tag: {confirmOrder.tagNumber} · {confirmOrder.serviceType}</div>
              <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--emerald)', marginTop: 8 }}>₹{confirmOrder.grandTotal.toLocaleString()}</div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--tx-secondary)', marginBottom: 18 }}>Mark this order as Paid?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmOrder(null)} style={{ flex: 1, padding: 12, background: 'var(--bg-raised)', border: '1px solid var(--bd-subtle)', borderRadius: 9, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', color: 'var(--tx-secondary)', fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={() => collectPayment(confirmOrder)} style={{ flex: 2, padding: 12, background: 'linear-gradient(135deg,#059669,#10B981)', color: 'white', border: 'none', borderRadius: 9, fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <CheckCircle2 size={15} strokeWidth={2.5} /> Yes, Collect
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <div style={{ position: 'fixed', bottom: 80, right: 16, background: 'var(--bg-card)', border: '1px solid var(--bd-subtle)', borderLeft: '3px solid var(--emerald)', borderRadius: 10, padding: '10px 16px', boxShadow: 'var(--shadow-lg)', fontSize: 13, fontWeight: 600, zIndex: 9999, color: 'var(--tx-primary)', animation: 'fadeUp 0.25s var(--ease-out)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
