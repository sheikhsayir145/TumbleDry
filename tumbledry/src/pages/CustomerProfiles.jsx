// src/pages/CustomerProfiles.jsx

import { useState } from 'react'
import { useStore } from '../store/index.js'
import { Card, Spinner, EmptyState, Modal } from '../components/ui/index.jsx'
import { Users, MapPin, AlertTriangle, MousePointerClick } from 'lucide-react'

const STATUS_COLORS = {
  pending:   { bg: 'rgba(245,158,11,0.12)',  color: '#D97706' },
  inprocess: { bg: 'rgba(14,165,233,0.12)',  color: '#0369A1' },
  completed: { bg: 'rgba(16,185,129,0.12)',  color: '#059669' },
  delivered: { bg: 'rgba(114,191,44,0.12)',  color: '#5FAD1A' },
}

export default function CustomerProfiles() {
  const { orders, ordersLoading } = useStore()
  const [search,        setSearch]        = useState('')
  const [selectedPhone, setSelectedPhone] = useState(null)
  const [mobileDetail,  setMobileDetail]  = useState(false)

  const active = orders.filter(o => !o.deleted)

  const customerMap = {}
  active.forEach(o => {
    const p = o.customerNumber || ''
    if (!customerMap[p]) {
      customerMap[p] = { name: o.customerName, phone: p, orders: [], totalSpend: 0, address: o.customerAddress, city: o.customerCity }
    }
    customerMap[p].orders.push(o)
    customerMap[p].totalSpend += o.grandTotal
    if (o.orderDate > (customerMap[p].lastOrder || '')) {
      customerMap[p].lastOrder = o.orderDate
      customerMap[p].name      = o.customerName
      customerMap[p].address   = o.customerAddress
      customerMap[p].city      = o.customerCity
    }
  })

  const customers = Object.values(customerMap).sort((a, b) => b.totalSpend - a.totalSpend)
  const filtered  = search.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
    : customers

  const selected = selectedPhone ? customerMap[selectedPhone] : null

  function selectCustomer(phone) {
    setSelectedPhone(phone)
    setMobileDetail(true)
  }

  if (ordersLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={40} /></div>

  return (
    <div className="page">
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: 'var(--tx-primary)', letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Users size={20} strokeWidth={2} /> Customer Profiles
      </h1>
      <p style={{ fontSize: 13, color: 'var(--tx-secondary)', marginBottom: 20 }}>{customers.length} unique customers</p>

      <div className="profile-grid">
        {/* Customer list */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--bd-subtle)' }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search customers…"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--bd-subtle)', fontSize: 13, fontFamily: 'inherit', background: 'var(--bg-input)', color: 'var(--tx-primary)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ maxHeight: 560, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <EmptyState icon={<Users size={38} strokeWidth={1.5} />} title="No customers found" />
            ) : filtered.map(c => {
              const pending    = c.orders.filter(o => o.paymentStatus === 'Pending' || o.paymentStatus === 'Partial')
              const isSelected = selectedPhone === c.phone
              return (
                <div
                  key={c.phone}
                  onClick={() => selectCustomer(c.phone)}
                  style={{
                    padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid var(--bd-subtle)',
                    background: isSelected ? 'rgba(13,148,136,0.06)' : 'transparent',
                    borderLeft: `3px solid ${isSelected ? 'var(--indigo)' : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--tx-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--tx-secondary)', marginTop: 2 }}>{c.phone}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                      <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--indigo)' }}>₹{c.totalSpend.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: 'var(--tx-tertiary)' }}>{c.orders.length} orders</div>
                    </div>
                  </div>
                  {pending.length > 0 && (
                    <div style={{ marginTop: 5, display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'rgba(244,63,94,0.1)', color: 'var(--rose)', border: '1px solid rgba(244,63,94,0.2)' }}>
                      {pending.length} pending payment{pending.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Detail panel — desktop */}
        <div className="hide-mobile">
          {selected ? <CustomerDetail selected={selected} /> : (
            <Card>
              <EmptyState icon={<MousePointerClick size={38} strokeWidth={1.5} />} title="Select a customer" subtitle="Click any customer from the list to view their profile and order history" />
            </Card>
          )}
        </div>
      </div>

      {/* Detail modal — mobile */}
      <Modal open={mobileDetail && !!selected} onClose={() => setMobileDetail(false)} title={selected?.name || ''} maxWidth={560}>
        {selected && <CustomerDetail selected={selected} />}
      </Modal>
    </div>
  )
}

function CustomerDetail({ selected }) {
  const pending = selected.orders.filter(o => o.paymentStatus === 'Pending' || o.paymentStatus === 'Partial')

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Profile header */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, var(--indigo), var(--indigo-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'white', flexShrink: 0 }}>
            {selected.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--tx-primary)', letterSpacing: '-0.3px' }}>{selected.name}</div>
            <div style={{ fontSize: 13, color: 'var(--tx-secondary)' }}>{selected.phone}</div>
            {selected.address && (
              <div style={{ fontSize: 12, color: 'var(--tx-tertiary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={11} style={{ opacity: 0.5 }} /> {[selected.address, selected.city].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>

        <div className="profile-stats">
          {[
            { label: 'Total Orders',   value: selected.orders.length },
            { label: 'Lifetime Spend', value: `₹${selected.totalSpend.toLocaleString()}` },
            { label: 'Avg Order',      value: `₹${Math.round(selected.totalSpend / selected.orders.length).toLocaleString()}` },
            { label: 'Last Visit',     value: new Date(selected.lastOrder).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-raised)', borderRadius: 9, padding: '10px 12px', border: '1px solid var(--bd-subtle)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--tx-secondary)', marginBottom: 5 }}>{s.label}</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx-primary)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {pending.length > 0 && (
          <div style={{ marginTop: 14, padding: '11px 13px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 9, fontSize: 13, color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <AlertTriangle size={13} strokeWidth={2} /> {pending.length} pending payment(s) totalling
            <strong className="mono" style={{ marginLeft: 4 }}>
              ₹{pending.reduce((s, o) => s + o.grandTotal, 0).toLocaleString()}
            </strong>
          </div>
        )}
      </Card>

      {/* Order history */}
      <Card>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--tx-tertiary)', marginBottom: 14 }}>Order History</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...selected.orders]
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .map(o => {
              const sc = STATUS_COLORS[o.status] || STATUS_COLORS.pending
              const isPending = o.paymentStatus === 'Pending' || o.paymentStatus === 'Partial'
              return (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 13px', background: 'var(--bg-raised)', borderRadius: 9, border: '1px solid var(--bd-subtle)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--indigo)' }}>{o.tagNumber}</span>
                      <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.color }}>{o.status}</span>
                      {isPending && <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'rgba(244,63,94,0.1)', color: 'var(--rose)' }}>{o.paymentStatus}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--tx-secondary)', marginTop: 3 }}>
                      {new Date(o.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {o.serviceType} · {o.totalGarments} garments
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 800, color: isPending ? 'var(--rose)' : 'var(--tx-primary)' }}>₹{o.grandTotal.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-secondary)' }}>{o.paymentMethod}</div>
                  </div>
                </div>
              )
            })}
        </div>
      </Card>
    </div>
  )
}
