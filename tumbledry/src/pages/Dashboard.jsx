// src/pages/Dashboard.jsx

import { useState } from 'react'
import { useStore } from '../store/index.js'
import { Card, Spinner, EmptyState, Modal } from '../components/ui/index.jsx'
import EditOrder from '../components/EditOrder.jsx'
import { printReceipt, printTags } from '../lib/print.js'
import {
  Inbox, Settings2, CheckCircle2, Truck,
  Phone, MapPin, Shirt, CreditCard, Tag, Package,
  Pencil, Printer, ChevronUp, ChevronDown,
  Check, Clock, AlertCircle, ClipboardList,
  Banknote, Smartphone,
} from 'lucide-react'

const STATUS_ORDER = ['pending', 'inprocess', 'completed', 'delivered']
const TIMELINE = [
  { key: 'pending',   label: 'Received',   icon: Inbox          },
  { key: 'inprocess', label: 'In Process', icon: Settings2       },
  { key: 'completed', label: 'Ready',      icon: CheckCircle2    },
  { key: 'delivered', label: 'Delivered',  icon: Truck           },
]

const STATUS_COLORS = {
  pending:   { bg: 'rgba(245,158,11,0.12)',  color: '#D97706' },
  inprocess: { bg: 'rgba(14,165,233,0.12)',  color: '#0369A1' },
  completed: { bg: 'rgba(16,185,129,0.12)',  color: '#059669' },
  delivered: { bg: 'rgba(13,148,136,0.12)',  color: '#0D9488' },
}

export default function Dashboard() {
  const { orders, ordersLoading, upsertOrder } = useStore()
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expanded,     setExpanded]     = useState(null)
  const [revenueView,  setRevenueView]  = useState('mtd')
  const [paymentModal, setPaymentModal] = useState(null)
  const [editOrder,    setEditOrder]    = useState(null)
  const [toast,        setToast]        = useState('')

  const active   = orders.filter(o => !o.deleted)
  const now      = new Date()
  const todayStr = now.toISOString().split('T')[0]

  const totalRevenue = active.reduce((s, o) => s + o.grandTotal, 0)
  const mtdRevenue   = active
    .filter(o => { const d = new Date(o.orderDate); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
    .reduce((s, o) => s + o.grandTotal, 0)
  const todayRevenue = active.filter(o => o.orderDate.slice(0, 10) === todayStr).reduce((s, o) => s + o.grandTotal, 0)

  const revenueValue = revenueView === 'today' ? todayRevenue : revenueView === 'mtd' ? mtdRevenue : totalRevenue
  const revenueLabel = revenueView === 'today' ? 'Today' : revenueView === 'mtd' ? 'Month to Date' : 'All Time'

  const totalOrders     = active.length
  const totalGarments   = active.reduce((s, o) => s + (o.totalGarments || 0), 0)
  const uniqueCustomers = new Set(active.map(o => o.customerNumber)).size

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const ms = !q || (o.customerName || '').toLowerCase().includes(q) || (o.customerNumber || '').includes(q) || (o.tagNumber || '').toLowerCase().includes(q)
    return ms && (!statusFilter || o.status === statusFilter)
  })

  async function updateStatus(order, newStatus) {
    await upsertOrder({ ...order, status: newStatus })
    showToast(`Status → ${newStatus}`)
    if (newStatus === 'completed') {
      setTimeout(() => sendReadyWhatsApp(order), 400)
    }
  }

  function sendReadyWhatsApp(order) {
    const msg = `Hello ${order.customerName}! 👋\n\nYour laundry is *ready for pickup* ✅\n\n🏷️ *Tag #:* ${order.tagNumber}\n👕 *Garments:* ${order.totalGarments}\n💰 *Amount:* ₹${order.grandTotal}\n\nPlease visit us to collect your order.\n\nThank you for choosing Tumbledry! 🙏`
    window.open(`https://web.whatsapp.com/send?phone=91${order.customerNumber}&text=${encodeURIComponent(msg)}`, '_blank')
  }

  async function updatePayment(order, paymentStatus) {
    await upsertOrder({ ...order, paymentStatus })
    setPaymentModal(null)
    showToast(`Payment marked as ${paymentStatus}`)
  }

  async function deleteOrder(order) {
    if (!confirm(`Delete order ${order.tagNumber}?`)) return
    await upsertOrder({ ...order, deleted: true })
    setExpanded(null)
    showToast('Order deleted')
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const STAT_CARDS = [
    {
      label: 'Revenue', value: `₹${revenueValue.toLocaleString()}`, sub: revenueLabel,
      gradient: 'linear-gradient(135deg, #D97706, #F59E0B)',
      shadow: 'var(--shadow-amber)',
      extra: (
        <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
          {[['today', 'Today'], ['mtd', 'MTD'], ['total', 'All']].map(([v, l]) => (
            <button key={v} onClick={() => setRevenueView(v)} style={{
              padding: '2px 7px', borderRadius: 5, border: 'none', cursor: 'pointer',
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', fontFamily: 'inherit',
              background: revenueView === v ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0)',
              color: 'white', letterSpacing: '0.3px',
            }}>{l}</button>
          ))}
        </div>
      ),
    },
    { label: 'Orders',    value: totalOrders.toLocaleString(),     sub: 'Total orders',     gradient: 'linear-gradient(135deg, #0284C7, #0EA5E9)', shadow: '0 4px 20px rgba(14,165,233,0.25)' },
    { label: 'Garments',  value: totalGarments.toLocaleString(),   sub: 'Total garments',   gradient: 'linear-gradient(135deg, #059669, #10B981)', shadow: '0 4px 20px rgba(16,185,129,0.25)' },
    { label: 'Customers', value: uniqueCustomers.toLocaleString(), sub: 'Unique customers', gradient: 'linear-gradient(135deg, #0D9488, #14B8A6)', shadow: 'var(--shadow-teal)' },
  ]

  if (ordersLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={40} /></div>

  return (
    <div className="page">
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, color: 'var(--tx-primary)', letterSpacing: '-0.4px' }}>Dashboard</h1>

      {/* Stat cards */}
      <div className="stat-grid">
        {STAT_CARDS.map(c => (
          <div key={c.label} style={{
            background: c.gradient, borderRadius: 14, padding: '16px 18px',
            boxShadow: c.shadow, color: 'white', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-20%', right: '-8%', width: 70, height: 70, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
            {c.extra}
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.1 }}>{c.value}</div>
            <div style={{ fontSize: 10, opacity: 0.85, marginTop: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {c.label} · {c.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Orders list */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {/* Filters */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bd-subtle)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-primary)', marginRight: 'auto' }}>Recent Orders</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone or tag…"
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--bd-subtle)', fontSize: 13, background: 'var(--bg-input)', color: 'var(--tx-primary)', fontFamily: 'inherit', width: 200, outline: 'none' }}
          />
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--bd-subtle)', fontSize: 13, background: 'var(--bg-input)', color: 'var(--tx-primary)', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
          >
            <option value="">All Status</option>
            <option value="pending">Received</option>
            <option value="inprocess">In Process</option>
            <option value="completed">Ready</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<ClipboardList size={38} strokeWidth={1.5} />} title="No orders found" subtitle="Try adjusting your search or filters" />
        ) : (
          <div>
            {filtered.slice(0, 100).map(order => {
              const curIdx    = STATUS_ORDER.indexOf(order.status)
              const isExpanded = expanded === order.id
              return (
                <div key={order.id} style={{ borderBottom: '1px solid var(--bd-subtle)', borderLeft: `3px solid ${isExpanded ? 'var(--indigo)' : 'transparent'}`, transition: 'border-left-color 0.2s' }}>

                  {/* Row header */}
                  <div onClick={() => setExpanded(isExpanded ? null : order.id)} style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-primary)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {order.customerName}
                        <span className="mono" style={{ fontSize: 11, color: 'var(--indigo)', fontWeight: 600 }}>{order.tagNumber}</span>
                        {order.paymentStatus !== 'Paid' && (
                          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: 'rgba(244,63,94,0.1)', color: 'var(--rose)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                            {order.paymentStatus}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--tx-secondary)', marginTop: 2 }}>
                        {order.customerNumber} · {new Date(order.orderDate).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: 15, fontWeight: 800, color: 'var(--tx-primary)', flexShrink: 0 }}>
                      ₹{order.grandTotal?.toLocaleString()}
                    </div>
                    <div style={{ color: 'var(--tx-tertiary)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {/* Timeline */}
                  {!order.deleted && (
                    <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center' }}>
                      {TIMELINE.map((step, i) => {
                        const isDone   = i < curIdx
                        const isActive = i === curIdx
                        const Icon     = step.icon
                        return (
                          <div key={step.key} style={{ display: 'flex', flex: 1, alignItems: 'center', position: 'relative' }}>
                            <div onClick={e => { e.stopPropagation(); updateStatus(order, step.key) }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flex: 1 }}>
                              <div style={{
                                width: 26, height: 26, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                zIndex: 1, position: 'relative',
                                background: isDone ? 'var(--emerald)' : isActive ? 'var(--indigo)' : 'var(--bg-raised)',
                                border: `2px solid ${isDone ? 'var(--emerald)' : isActive ? 'var(--indigo)' : 'var(--bd-default)'}`,
                                color: (isDone || isActive) ? 'white' : 'var(--tx-tertiary)',
                                boxShadow: isActive ? '0 0 0 4px rgba(13,148,136,0.15)' : 'none',
                                transition: 'all 0.25s',
                              }}>
                                <Icon size={12} strokeWidth={2.5} />
                              </div>
                              <div style={{ fontSize: 9, fontWeight: 700, color: (isDone || isActive) ? 'var(--tx-primary)' : 'var(--tx-tertiary)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                {step.label}
                              </div>
                            </div>
                            {i < TIMELINE.length - 1 && (
                              <div style={{ position: 'absolute', top: 13, left: '50%', width: '100%', height: 2, background: isDone ? 'var(--emerald)' : 'var(--bd-subtle)', transition: 'background 0.35s', zIndex: 0 }} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--bd-subtle)', background: 'var(--bg-raised)', fontSize: 12, color: 'var(--tx-secondary)', lineHeight: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <Phone size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
                        {order.customerNumber}
                        {order.customerAddress && (
                          <><span style={{ opacity: 0.4 }}>·</span><MapPin size={11} style={{ opacity: 0.5, flexShrink: 0 }} />{order.customerAddress}</>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <Shirt size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
                        {order.serviceType}
                        <span style={{ opacity: 0.4 }}>·</span>
                        {order.totalGarments} garments
                        <span style={{ opacity: 0.4 }}>·</span>
                        <Truck size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
                        {order.deliveryDate}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <CreditCard size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
                        {order.paymentMethod} —{' '}
                        <span style={{ color: order.paymentStatus === 'Paid' ? 'var(--emerald)' : 'var(--rose)', fontWeight: 700 }}>{order.paymentStatus}</span>
                        {order.paymentMethod === 'Split' && (order.cashAmount > 0 || order.onlineAmount > 0) && (
                          <span style={{ color: 'var(--tx-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            (<Banknote size={10} style={{ opacity: 0.6 }} /> ₹{order.cashAmount} +
                            <Smartphone size={10} style={{ opacity: 0.6 }} /> ₹{order.onlineAmount})
                          </span>
                        )}
                      </div>
                      {order.discountAmount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Tag size={11} style={{ opacity: 0.5 }} />
                          Discount: -₹{order.discountAmount} ({order.discountPct}%)
                        </div>
                      )}
                      {order.rackLocation && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 2, padding: '2px 10px', background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 99, fontSize: 11, fontWeight: 700, color: 'var(--indigo)' }}>
                          <Package size={11} /> Rack: {order.rackLocation}
                        </div>
                      )}

                      {order.cart && order.cart.length > 0 && (
                        <div style={{ margin: '8px 0', padding: '8px 10px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--bd-subtle)' }}>
                          {order.cart.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0', borderBottom: '1px dashed var(--bd-subtle)' }}>
                              <span>{item.qty}x {item.name}</span>
                              <span className="mono">₹{Math.round(item.net)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="action-row" style={{ marginTop: 10 }}>
                        {[
                          { label: 'Edit',    icon: Pencil,  color: 'var(--indigo)',  bg: 'var(--indigo-dim)',  border: 'rgba(13,148,136,0.2)', action: e => { e.stopPropagation(); setEditOrder(order) } },
                          { label: 'Receipt', icon: Printer, color: 'var(--emerald)', bg: 'var(--emerald-dim)', border: 'rgba(16,185,129,0.2)', action: e => { e.stopPropagation(); printReceipt(order) } },
                          { label: 'Tags',    icon: Tag,     color: 'var(--sky)',     bg: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.2)', action: e => { e.stopPropagation(); printTags(order) } },
                          { label: 'Payment', icon: CreditCard, color: 'var(--amber)', bg: 'var(--amber-dim)', border: 'rgba(245,158,11,0.2)', action: e => { e.stopPropagation(); setPaymentModal(order) } },
                        ].map(btn => (
                          <button key={btn.label} onClick={btn.action} style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${btn.border}`, background: btn.bg, color: btn.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <btn.icon size={12} strokeWidth={2} />
                            {btn.label}
                          </button>
                        ))}
                        {!order.deleted && (
                          <button onClick={e => { e.stopPropagation(); deleteOrder(order) }} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.08)', color: 'var(--rose)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Payment modal */}
      <Modal open={!!paymentModal} onClose={() => setPaymentModal(null)} title="Update Payment" maxWidth={400}>
        {paymentModal && (
          <div>
            <div style={{ background: 'var(--bg-raised)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>
              <span style={{ fontWeight: 700 }}>{paymentModal.customerName}</span>
              <span className="mono" style={{ color: 'var(--indigo)', marginLeft: 8, fontSize: 12 }}>{paymentModal.tagNumber}</span>
              <span className="mono" style={{ fontWeight: 800, fontSize: 16, marginLeft: 'auto', float: 'right' }}>₹{paymentModal.grandTotal}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { s: 'Paid',    icon: Check,       color: 'var(--emerald)' },
                { s: 'Pending', icon: Clock,        color: 'var(--amber)'  },
                { s: 'Partial', icon: AlertCircle,  color: 'var(--rose)'   },
              ].map(({ s, icon: Icon, color }) => (
                <button key={s} onClick={() => updatePayment(paymentModal, s)} style={{
                  padding: '12px 14px', borderRadius: 9,
                  border: `2px solid ${paymentModal.paymentStatus === s ? 'var(--indigo)' : 'var(--bd-subtle)'}`,
                  background: paymentModal.paymentStatus === s ? 'var(--indigo-dim)' : 'transparent',
                  color: paymentModal.paymentStatus === s ? 'var(--indigo)' : 'var(--tx-primary)',
                  fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'left', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Icon size={15} color={color} strokeWidth={2} />
                  {s}
                  {paymentModal.paymentStatus === s ? ' (current)' : ''}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {editOrder && <EditOrder order={editOrder} onClose={() => setEditOrder(null)} />}

      {toast && (
        <div style={{ position: 'fixed', bottom: 80, right: 16, background: 'var(--bg-card)', border: '1px solid var(--bd-subtle)', borderLeft: '3px solid var(--emerald)', borderRadius: 10, padding: '10px 16px', boxShadow: 'var(--shadow-lg)', fontSize: 13, fontWeight: 600, zIndex: 9999, color: 'var(--tx-primary)', animation: 'fadeUp 0.25s var(--ease-out)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
