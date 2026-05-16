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
  Banknote, Smartphone, List, LayoutGrid,
} from 'lucide-react'

const STATUS_ORDER = ['pending', 'inprocess', 'completed', 'delivered']
const TIMELINE = [
  { key: 'pending',   label: 'Received',   icon: Inbox       },
  { key: 'inprocess', label: 'In Process', icon: Settings2    },
  { key: 'completed', label: 'Ready',      icon: CheckCircle2 },
  { key: 'delivered', label: 'Delivered',  icon: Truck        },
]

const STATUS_COLORS = {
  pending:   { bg: 'rgba(245,158,11,0.12)',  color: '#D97706' },
  inprocess: { bg: 'rgba(14,165,233,0.12)',  color: '#0369A1' },
  completed: { bg: 'rgba(16,185,129,0.12)',  color: '#059669' },
  delivered: { bg: 'rgba(114,191,44,0.12)',  color: '#5FAD1A' },
}

const MONTH_IDX = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 }

function parseDeliveryDate(str) {
  if (!str) return null
  // Format stored by calcDeliveryDate: "19 May 26 Mon"
  const parts = str.trim().split(' ')
  const day   = parseInt(parts[0])
  const month = MONTH_IDX[parts[1]]
  const year  = 2000 + parseInt(parts[2])
  if (isNaN(day) || month === undefined || isNaN(year)) return null
  return new Date(year, month, day)
}

function dateUrgency(deliveryDate, status) {
  if (status === 'delivered' || !deliveryDate) return {}
  const parsed = parseDeliveryDate(deliveryDate)
  if (!parsed) return {}
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff  = parsed.getTime() - today.getTime()
  if (diff < 0)  return { color: 'var(--rose)',  fontWeight: 700 }
  if (diff === 0) return { color: 'var(--amber)', fontWeight: 700 }
  return {}
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
  const [viewMode,     setViewMode]     = useState('list')

  const active   = orders.filter(o => !o.deleted)
  const now      = new Date()
  const todayStr = now.toISOString().split('T')[0]

  const totalRevenue = active.reduce((s, o) => s + o.grandTotal, 0)
  const mtdRevenue   = active
    .filter(o => { const d = new Date(o.orderDate); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
    .reduce((s, o) => s + o.grandTotal, 0)
  const todayOrders  = active.filter(o => o.orderDate.slice(0, 10) === todayStr)
  const todayRevenue = todayOrders.reduce((s, o) => s + o.grandTotal, 0)
  const activeCount  = active.filter(o => o.status !== 'delivered').length

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
    if (newStatus === 'completed') setTimeout(() => sendReadyWhatsApp(order), 400)
  }

  function sendReadyWhatsApp(order) {
    const msg = `Hello ${order.customerName}! 👋\n\nYour laundry is *ready for pickup* ✅\n\n🏷️ *Tag #:* ${order.tagNumber}\n👕 *Garments:* ${order.totalGarments}\n💰 *Amount:* ₹${order.grandTotal}\n\nPlease visit us to collect your order.\n\n━━━━━━━━━━━━━━━━━━\n📍 *Banday Lane, Dargah Hazratbal, 190006*\n📞 *8899912859*\n📸 *Instagram:* https://www.instagram.com/tumbledryhazratbal?igsh=OGw2NTFyZmI4dmpi\n━━━━━━━━━━━━━━━━━━\n\n⭐ *Loved our service? Leave us a review:*\nhttps://share.google/Ks8Li9bHkiT3Aiixz\n\nThank you for choosing Tumbledry! 🙏`
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
    { label: 'Customers', value: uniqueCustomers.toLocaleString(), sub: 'Unique customers', gradient: 'linear-gradient(135deg, #72BF2C, #8DD446)', shadow: 'var(--shadow-teal)' },
  ]

  if (ordersLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={40} /></div>

  return (
    <div className="page">
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14, color: 'var(--tx-primary)', letterSpacing: '-0.4px' }}>Dashboard</h1>

      {/* ── Sticky Today Summary ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'var(--bg-card)', border: '1px solid var(--bd-subtle)',
        borderRadius: 12, padding: '10px 16px', marginBottom: 16,
        display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--tx-tertiary)' }}>Today</span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'baseline' }}>
          <span className="mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand-green)', letterSpacing: '-0.5px' }}>₹{todayRevenue.toLocaleString()}</span>
          <span style={{ fontSize: 11, color: 'var(--tx-tertiary)', fontWeight: 600 }}>revenue</span>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'baseline' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx-primary)' }}>{todayOrders.length}</span>
          <span style={{ fontSize: 11, color: 'var(--tx-tertiary)', fontWeight: 600 }}>orders today</span>
        </div>
        <div style={{ height: 16, width: 1, background: 'var(--bd-subtle)' }} />
        <div style={{ display: 'flex', gap: 5, alignItems: 'baseline' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: activeCount > 0 ? 'var(--amber)' : 'var(--emerald)' }}>{activeCount}</span>
          <span style={{ fontSize: 11, color: 'var(--tx-tertiary)', fontWeight: 600 }}>active orders</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {STAT_CARDS.map(c => (
          <div key={c.label} className="lift-hover" style={{
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

      {/* Orders card */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>

        {/* Filter bar + view toggle */}
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

          {/* List / Board toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-raised)', borderRadius: 8, padding: 3, border: '1px solid var(--bd-subtle)', gap: 2 }}>
            {[{ mode: 'list', Icon: List, label: 'List' }, { mode: 'board', Icon: LayoutGrid, label: 'Board' }].map(({ mode, Icon, label }) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 600, fontSize: 11,
                background: viewMode === mode ? 'var(--bg-card)' : 'transparent',
                color: viewMode === mode ? 'var(--indigo)' : 'var(--tx-tertiary)',
                boxShadow: viewMode === mode ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Icon size={13} strokeWidth={2} />{label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<ClipboardList size={38} strokeWidth={1.5} />} title="No orders found" subtitle="Try adjusting your search or filters" />

        ) : viewMode === 'board' ? (

          /* ── Kanban board ── */
          <div style={{ padding: 16 }}>
            <div className="kanban-board">
              {TIMELINE.map(col => {
                const colOrders = filtered.filter(o => o.status === col.key)
                const Icon      = col.icon
                const sc        = STATUS_COLORS[col.key]
                return (
                  <div key={col.key}>
                    {/* Column header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
                      padding: '8px 10px', borderRadius: 9,
                      background: sc.bg, border: `1px solid ${sc.color}22`,
                    }}>
                      <Icon size={13} color={sc.color} strokeWidth={2.5} />
                      <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: sc.color, flex: 1 }}>{col.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, background: `${sc.color}22`, color: sc.color, borderRadius: 99, padding: '1px 7px' }}>{colOrders.length}</span>
                    </div>

                    {colOrders.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--tx-tertiary)', fontSize: 12 }}>Empty</div>
                    ) : (
                      colOrders.slice(0, 50).map(order => {
                        const urgStyle = dateUrgency(order.deliveryDate, order.status)
                        return (
                          <div
                            key={order.id}
                            className="kanban-card"
                            onClick={() => setEditOrder(order)}
                            style={{
                              background: 'var(--bg-card)', border: '1px solid var(--bd-subtle)',
                              borderRadius: 10, padding: '10px 12px', marginBottom: 8, cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 6 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customerName}</div>
                              <div className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--indigo)', flexShrink: 0 }}>{order.tagNumber}</div>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--tx-secondary)', marginBottom: 8 }}>{order.customerNumber}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div className="mono" style={{ fontSize: 14, fontWeight: 800, color: 'var(--tx-primary)' }}>₹{order.grandTotal?.toLocaleString()}</div>
                              {order.deliveryDate && (
                                <div style={{ fontSize: 10, fontWeight: 600, ...urgStyle }}>{order.deliveryDate}</div>
                              )}
                            </div>
                            {order.paymentStatus !== 'Paid' && (
                              <div style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: 'rgba(244,63,94,0.1)', color: 'var(--rose)', fontWeight: 700, marginTop: 6, display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{order.paymentStatus}</div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        ) : (

          /* ── List view ── */
          <div>
            {filtered.slice(0, 100).map(order => {
              const curIdx     = STATUS_ORDER.indexOf(order.status)
              const isExpanded = expanded === order.id
              const urgStyle   = dateUrgency(order.deliveryDate, order.status)
              const isOverdue  = urgStyle.color === 'var(--rose)'
              const isDueToday = urgStyle.color === 'var(--amber)'
              return (
                <div key={order.id} className="lift-hover" style={{ borderBottom: '1px solid var(--bd-subtle)', borderLeft: `3px solid ${isExpanded ? 'var(--indigo)' : 'transparent'}`, transition: 'border-left-color 0.2s, transform 0.18s var(--ease-out), box-shadow 0.18s' }}>

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
                        {isOverdue && (
                          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: 'rgba(244,63,94,0.1)', color: 'var(--rose)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Overdue</span>
                        )}
                        {isDueToday && (
                          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: 'rgba(245,158,11,0.12)', color: 'var(--amber)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Due Today</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--tx-secondary)', marginTop: 2 }}>
                        {order.customerNumber} · {new Date(order.orderDate).toLocaleDateString('en-IN')}
                        {order.deliveryDate && (
                          <span style={{ marginLeft: 6, ...urgStyle }}>· Delivery {order.deliveryDate}</span>
                        )}
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
                        <span style={dateUrgency(order.deliveryDate, order.status)}>{order.deliveryDate}</span>
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
                          { label: 'Edit',    icon: Pencil,    color: 'var(--indigo)',  bg: 'var(--indigo-dim)',    border: 'rgba(13,148,136,0.2)',  action: e => { e.stopPropagation(); setEditOrder(order) } },
                          { label: 'Receipt', icon: Printer,   color: 'var(--emerald)', bg: 'var(--emerald-dim)',   border: 'rgba(16,185,129,0.2)',  action: e => { e.stopPropagation(); printReceipt(order) } },
                          { label: 'Tags',    icon: Tag,       color: 'var(--sky)',     bg: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.2)',  action: e => { e.stopPropagation(); printTags(order) } },
                          { label: 'Payment', icon: CreditCard,color: 'var(--amber)',   bg: 'var(--amber-dim)',     border: 'rgba(245,158,11,0.2)',  action: e => { e.stopPropagation(); setPaymentModal(order) } },
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
                  {s}{paymentModal.paymentStatus === s ? ' (current)' : ''}
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
