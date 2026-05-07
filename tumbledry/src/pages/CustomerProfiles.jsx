// src/pages/CustomerProfiles.jsx

import { useEffect, useState } from 'react'
import { useStore } from '../store/index.js'
import { Card, Badge, Spinner, EmptyState } from '../components/ui/index.jsx'

export default function CustomerProfiles() {
  const { orders, ordersLoading, fetchOrders } = useStore()
  const [search, setSearch] = useState('')
  const [selectedPhone, setSelectedPhone] = useState(null)

  useEffect(() => { fetchOrders() }, [])

  const active = orders.filter(o => !o.deleted)

  // Build customer map
  const customerMap = {}
  active.forEach(o => {
    const p = o.customerNumber || ''
    if (!customerMap[p]) {
      customerMap[p] = { name: o.customerName, phone: p, orders: [], totalSpend: 0, address: o.customerAddress, city: o.customerCity }
    }
    customerMap[p].orders.push(o)
    customerMap[p].totalSpend += o.grandTotal
    if (o.orderDate > (customerMap[p].lastOrder||'')) {
      customerMap[p].lastOrder = o.orderDate
      customerMap[p].name = o.customerName
      customerMap[p].address = o.customerAddress
      customerMap[p].city = o.customerCity
    }
  })

  const customers = Object.values(customerMap)
    .sort((a, b) => b.totalSpend - a.totalSpend)

  const filtered = search.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
      )
    : customers

  const selected = selectedPhone ? customerMap[selectedPhone] : null

  if (ordersLoading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={40} /></div>

  const STATUS_COLORS = {
    pending:   { bg:'rgba(245,158,11,0.12)',  color:'#d97706' },
    inprocess: { bg:'rgba(99,102,241,0.12)',  color:'#6366f1' },
    completed: { bg:'rgba(16,185,129,0.12)',  color:'#059669' },
    delivered: { bg:'rgba(56,189,248,0.12)',  color:'#0284c7' },
  }

  return (
    <div style={{ padding:24 }}>
      <h1 style={{ fontSize:22, fontWeight:800, marginBottom:8, color:'var(--tx-primary)', letterSpacing:'-0.5px' }}>👥 Customer Profiles</h1>
      <p style={{ fontSize:13, color:'var(--tx-secondary)', marginBottom:24 }}>{customers.length} unique customers</p>

      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20, alignItems:'start' }}>
        {/* Customer list */}
        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid var(--bd-subtle)' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search customers..."
              style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid var(--bd-subtle)', fontSize:13, fontFamily:'inherit', background:'var(--bg-input)', color:'var(--tx-primary)', outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ maxHeight:600, overflowY:'auto' }}>
            {filtered.length === 0 ? (
              <EmptyState icon="👥" title="No customers found" />
            ) : filtered.map(c => {
              const pending = c.orders.filter(o => o.paymentStatus === 'Pending' || o.paymentStatus === 'Partial')
              const isSelected = selectedPhone === c.phone
              return (
                <div key={c.phone} onClick={() => setSelectedPhone(c.phone)}
                  style={{ padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid var(--bd-subtle)', background: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent', borderLeft: isSelected ? '3px solid var(--indigo)' : '3px solid transparent', transition:'var(--transition)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:'var(--tx-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</div>
                      <div style={{ fontSize:11, color:'var(--tx-secondary)', marginTop:2 }}>{c.phone}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0, marginLeft:8 }}>
                      <div style={{ fontSize:13, fontWeight:700, fontFamily:'DM Mono', color:'var(--indigo)' }}>₹{c.totalSpend.toLocaleString()}</div>
                      <div style={{ fontSize:10, color:'var(--tx-tertiary)' }}>{c.orders.length} orders</div>
                    </div>
                  </div>
                  {pending.length > 0 && (
                    <div style={{ marginTop:4, display:'inline-block', padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700, background:'rgba(244,63,94,0.1)', color:'var(--rose)', border:'1px solid rgba(244,63,94,0.2)' }}>
                      {pending.length} pending payment{pending.length>1?'s':''}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Customer detail */}
        {selected ? (
          <div style={{ display:'grid', gap:16 }}>
            {/* Profile header */}
            <Card>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
                <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,var(--indigo),var(--indigo-light))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:'white', flexShrink:0 }}>
                  {selected.name.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:20, fontWeight:800, color:'var(--tx-primary)', letterSpacing:'-0.3px' }}>{selected.name}</div>
                  <div style={{ fontSize:13, color:'var(--tx-secondary)' }}>{selected.phone}</div>
                  {selected.address && <div style={{ fontSize:12, color:'var(--tx-tertiary)', marginTop:2 }}>📍 {[selected.address, selected.city].filter(Boolean).join(', ')}</div>}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                {[
                  { label:'Total Orders',  value: selected.orders.length },
                  { label:'Lifetime Spend', value: `₹${selected.totalSpend.toLocaleString()}` },
                  { label:'Avg Order',     value: `₹${Math.round(selected.totalSpend/selected.orders.length).toLocaleString()}` },
                  { label:'Last Visit',    value: new Date(selected.lastOrder).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) },
                ].map(s => (
                  <div key={s.label} style={{ background:'var(--bg-raised)', borderRadius:8, padding:'12px 14px', border:'1px solid var(--bd-subtle)' }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--tx-secondary)', marginBottom:6 }}>{s.label}</div>
                    <div style={{ fontSize:18, fontWeight:800, fontFamily:'DM Mono', color:'var(--tx-primary)' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Pending payments alert */}
              {selected.orders.filter(o => o.paymentStatus==='Pending'||o.paymentStatus==='Partial').length > 0 && (
                <div style={{ marginTop:16, padding:'12px 14px', background:'rgba(244,63,94,0.06)', border:'1px solid rgba(244,63,94,0.15)', borderRadius:8, fontSize:13, color:'var(--rose)' }}>
                  ⚠️ {selected.orders.filter(o=>o.paymentStatus==='Pending'||o.paymentStatus==='Partial').length} pending payment(s) totalling
                  <strong style={{ fontFamily:'DM Mono', marginLeft:4 }}>
                    ₹{selected.orders.filter(o=>o.paymentStatus==='Pending'||o.paymentStatus==='Partial').reduce((s,o)=>s+o.grandTotal,0).toLocaleString()}
                  </strong>
                </div>
              )}
            </Card>

            {/* Order history */}
            <Card>
              <div style={{ fontSize:12, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-secondary)', marginBottom:14 }}>Order History</div>
              <div style={{ display:'grid', gap:8 }}>
                {[...selected.orders].sort((a,b)=>new Date(b.orderDate)-new Date(a.orderDate)).map(o => {
                  const sc = STATUS_COLORS[o.status] || STATUS_COLORS.pending
                  const isPending = o.paymentStatus==='Pending'||o.paymentStatus==='Partial'
                  return (
                    <div key={o.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'var(--bg-raised)', borderRadius:8, border:'1px solid var(--bd-subtle)' }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontFamily:'DM Mono', fontSize:12, fontWeight:700, color:'var(--indigo)' }}>{o.tagNumber}</span>
                          <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700, background:sc.bg, color:sc.color }}>
                            {o.status}
                          </span>
                          {isPending && (
                            <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700, background:'rgba(244,63,94,0.1)', color:'var(--rose)' }}>
                              {o.paymentStatus}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize:11, color:'var(--tx-secondary)', marginTop:3 }}>
                          {new Date(o.orderDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})} · {o.serviceType} · {o.totalGarments} garments
                        </div>
                        {o.deliveryDate && <div style={{ fontSize:11, color:'var(--tx-tertiary)' }}>Delivery: {o.deliveryDate}</div>}
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:16, fontWeight:800, fontFamily:'DM Mono', color: isPending?'var(--rose)':'var(--tx-primary)' }}>₹{o.grandTotal.toLocaleString()}</div>
                        <div style={{ fontSize:11, color:'var(--tx-secondary)' }}>{o.paymentMethod}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <EmptyState icon="👆" title="Select a customer" subtitle="Click any customer from the list to view their profile and order history" />
          </Card>
        )}
      </div>
    </div>
  )
}
