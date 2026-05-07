// src/pages/Dashboard.jsx

import { useState, useEffect } from 'react'
import { useStore } from '../store/index.js'
import { Card, Spinner, EmptyState, Modal } from '../components/ui/index.jsx'
import EditOrder from '../components/EditOrder.jsx'
import { printReceipt, printTags } from '../lib/print.js'

const STATUS_ORDER = ['pending', 'inprocess', 'completed', 'delivered']
const TIMELINE = [
  { key:'pending',   label:'Received',   icon:'📥' },
  { key:'inprocess', label:'In Process', icon:'⚙️' },
  { key:'completed', label:'Ready',      icon:'✅' },
  { key:'delivered', label:'Delivered',  icon:'🚚' },
]

export default function Dashboard() {
  const { orders, ordersLoading, upsertOrder } = useStore()
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expanded, setExpanded]     = useState(null)
  const [revenueView, setRevenueView] = useState('mtd')
  const [paymentModal, setPaymentModal] = useState(null)
  const [editOrder, setEditOrder]   = useState(null)
  const [toast, setToast]           = useState('')

  const active = orders.filter(o => !o.deleted)
  const now    = new Date()
  const todayStr = now.toISOString().split('T')[0]

  const totalRevenue = active.reduce((s,o) => s+o.grandTotal, 0)
  const mtdRevenue   = active.filter(o => { const d=new Date(o.orderDate); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear() }).reduce((s,o)=>s+o.grandTotal,0)
  const todayRevenue = active.filter(o => o.orderDate.slice(0,10)===todayStr).reduce((s,o)=>s+o.grandTotal,0)

  const revenueValue = revenueView==='today' ? todayRevenue : revenueView==='mtd' ? mtdRevenue : totalRevenue
  const revenueLabel = revenueView==='today' ? "Today" : revenueView==='mtd' ? "Month to Date" : "All Time"

  const totalOrders     = active.length
  const totalGarments   = active.reduce((s,o) => s+(o.totalGarments||0), 0)
  const uniqueCustomers = new Set(active.map(o=>o.customerNumber)).size

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const ms = !q || (o.customerName||'').toLowerCase().includes(q) || (o.customerNumber||'').includes(q) || (o.tagNumber||'').toLowerCase().includes(q)
    const mst = !statusFilter || o.status === statusFilter
    return ms && mst
  })

  async function updateStatus(order, newStatus) {
    await upsertOrder({...order, status: newStatus})
    showToast(`Status → ${newStatus}`)
  }

  async function updatePayment(order, paymentStatus) {
    await upsertOrder({...order, paymentStatus})
    setPaymentModal(null)
    showToast(`Payment marked as ${paymentStatus}`)
  }

  async function deleteOrder(order) {
    if (!confirm(`Delete order ${order.tagNumber}?`)) return
    await upsertOrder({...order, deleted: true})
    setExpanded(null)
    showToast('Order deleted')
  }

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(''),3000) }

  const statCards = [
    { label:'Revenue', value:`₹${revenueValue.toLocaleString()}`, sub:revenueLabel,
      gradient:'linear-gradient(135deg,#d97706,#f59e0b)', shadow:'0 4px 20px rgba(245,158,11,0.25)',
      extra:(
        <div style={{display:'flex',gap:4,marginBottom:8}}>
          {[['today','Today'],['mtd','MTD'],['total','Total']].map(([v,l]) => (
            <button key={v} onClick={()=>setRevenueView(v)} style={{padding:'2px 8px',borderRadius:4,border:'none',cursor:'pointer',fontSize:10,fontWeight:700,background:revenueView===v?'rgba(255,255,255,0.35)':'rgba(255,255,255,0)',color:'white',textTransform:'uppercase',fontFamily:'inherit'}}>
              {l}
            </button>
          ))}
        </div>
      )
    },
    { label:'Orders',    value:totalOrders.toLocaleString(),    sub:'Total orders',      gradient:'linear-gradient(135deg,#0284c7,#38bdf8)', shadow:'0 4px 20px rgba(56,189,248,0.25)' },
    { label:'Garments',  value:totalGarments.toLocaleString(),  sub:'Total garments',    gradient:'linear-gradient(135deg,#059669,#10b981)', shadow:'0 4px 20px rgba(16,185,129,0.25)' },
    { label:'Customers', value:uniqueCustomers.toLocaleString(),sub:'Unique customers',  gradient:'linear-gradient(135deg,#be185d,#f43f5e)', shadow:'0 4px 20px rgba(244,63,94,0.25)' },
  ]

  const STATUS_COLORS = {
    pending:   {bg:'rgba(245,158,11,0.12)',  color:'#d97706'},
    inprocess: {bg:'rgba(99,102,241,0.12)',  color:'#6366f1'},
    completed: {bg:'rgba(16,185,129,0.12)',  color:'#059669'},
    delivered: {bg:'rgba(56,189,248,0.12)',  color:'#0284c7'},
  }

  if (ordersLoading) return <div style={{display:'flex',justifyContent:'center',padding:80}}><Spinner size={40}/></div>

  return (
    <div style={{padding:24}}>
      <h1 style={{fontSize:22,fontWeight:800,marginBottom:24,color:'var(--tx-primary)',letterSpacing:'-0.5px'}}>Dashboard</h1>

      {/* Stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {statCards.map(c => (
          <div key={c.label} style={{background:c.gradient,borderRadius:14,padding:'18px 20px',boxShadow:c.shadow,color:'white',position:'relative',overflow:'hidden',transition:'var(--transition)'}}>
            <div style={{position:'absolute',top:'-20%',right:'-5%',width:80,height:80,background:'rgba(255,255,255,0.08)',borderRadius:'50%'}}/>
            {c.extra}
            <div style={{fontSize:28,fontWeight:800,fontFamily:'DM Mono',letterSpacing:'-1px',lineHeight:1.1}}>{c.value}</div>
            <div style={{fontSize:11,opacity:0.85,marginTop:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>{c.label} · {c.sub}</div>
          </div>
        ))}
      </div>

      {/* Orders list */}
      <Card>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
          <h3 style={{fontSize:14,fontWeight:700,color:'var(--tx-primary)',marginRight:'auto'}}>Recent Orders</h3>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Name, phone or tag..."
            style={{padding:'8px 14px',borderRadius:8,border:'1px solid var(--bd-subtle)',fontSize:13,background:'var(--bg-input)',color:'var(--tx-primary)',fontFamily:'inherit',width:240}} />
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            style={{padding:'8px 14px',borderRadius:8,border:'1px solid var(--bd-subtle)',fontSize:13,background:'var(--bg-input)',color:'var(--tx-primary)',fontFamily:'inherit'}}>
            <option value="">All Status</option>
            <option value="pending">📥 Received</option>
            <option value="inprocess">⚙️ In Process</option>
            <option value="completed">✅ Ready</option>
            <option value="delivered">🚚 Delivered</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="📋" title="No orders found" subtitle="Try adjusting your search or filters"/>
        ) : (
          <div style={{border:'1px solid var(--bd-subtle)',borderRadius:10,overflow:'hidden'}}>
            {filtered.slice(0,100).map(order => {
              const curIdx   = STATUS_ORDER.indexOf(order.status)
              const isExpanded = expanded === order.id
              const sc       = STATUS_COLORS[order.status] || {bg:'var(--bg-raised)',color:'var(--tx-secondary)'}
              return (
                <div key={order.id} style={{borderBottom:'1px solid var(--bd-subtle)',borderLeft:isExpanded?'3px solid var(--indigo)':'3px solid transparent',transition:'border 0.2s'}}>

                  {/* Row header */}
                  <div onClick={()=>setExpanded(isExpanded?null:order.id)}
                    style={{padding:'12px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:'var(--tx-primary)',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                        {order.customerName}
                        <span style={{fontFamily:'DM Mono',fontSize:12,color:'var(--indigo)'}}>{order.tagNumber}</span>
                        {order.paymentStatus !== 'Paid' && (
                          <span style={{fontSize:10,padding:'2px 7px',borderRadius:99,background:'rgba(244,63,94,0.1)',color:'var(--rose)',fontWeight:700}}>
                            {order.paymentStatus}
                          </span>
                        )}
                      </div>
                      <div style={{fontSize:11,color:'var(--tx-secondary)',marginTop:2}}>
                        {order.customerNumber} · {new Date(order.orderDate).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div style={{fontSize:16,fontWeight:800,fontFamily:'DM Mono',color:'var(--tx-primary)',flexShrink:0}}>
                      ₹{order.grandTotal?.toLocaleString()}
                    </div>
                  </div>

                  {/* Timeline */}
                  {!order.deleted && (
                    <div style={{padding:'0 16px 10px',display:'flex',alignItems:'center'}}>
                      {TIMELINE.map((step,i) => {
                        const isDone   = i < curIdx
                        const isActive = i === curIdx
                        return (
                          <div key={step.key} style={{display:'flex',flex:1,alignItems:'center',position:'relative'}}>
                            <div onClick={e=>{e.stopPropagation();updateStatus(order,step.key)}}
                              style={{display:'flex',flexDirection:'column',alignItems:'center',cursor:'pointer',flex:1}}>
                              <div style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,zIndex:1,position:'relative',background:isDone?'var(--emerald)':isActive?'var(--indigo)':'var(--bg-raised)',border:`2px solid ${isDone?'var(--emerald)':isActive?'var(--indigo)':'var(--bd-default)'}`,color:(isDone||isActive)?'white':'var(--tx-tertiary)',boxShadow:isActive?'0 0 0 4px rgba(99,102,241,0.15)':'none',transition:'all 0.3s'}}>
                                {step.icon}
                              </div>
                              <div style={{fontSize:9,fontWeight:700,color:(isDone||isActive)?'var(--tx-primary)':'var(--tx-tertiary)',marginTop:3,textTransform:'uppercase',letterSpacing:'0.3px'}}>
                                {step.label}
                              </div>
                            </div>
                            {i < TIMELINE.length-1 && (
                              <div style={{position:'absolute',top:13,left:'50%',width:'100%',height:2,background:isDone?'var(--emerald)':'var(--bd-subtle)',transition:'background 0.4s',zIndex:0}}/>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{padding:'12px 16px 16px',borderTop:'1px solid var(--bd-subtle)',background:'var(--bg-raised)',fontSize:12,color:'var(--tx-secondary)',lineHeight:2}}>
                      <div>📞 {order.customerNumber}{order.customerAddress?` · 📍 ${order.customerAddress}`:''}</div>
                      <div>🧹 {order.serviceType} · 👕 {order.totalGarments} garments · 🚚 {order.deliveryDate}</div>
                      <div>💳 {order.paymentMethod} — <span style={{color:order.paymentStatus==='Paid'?'var(--emerald)':'var(--rose)',fontWeight:700}}>{order.paymentStatus}</span></div>
                      {order.discountAmount>0 && <div>🏷️ Discount: -₹{order.discountAmount} ({order.discountPct}%)</div>}

                      {/* Cart items */}
                      {order.cart && order.cart.length > 0 && (
                        <div style={{margin:'8px 0',padding:'8px 10px',background:'var(--bg-card)',borderRadius:6,border:'1px solid var(--bd-subtle)'}}>
                          {order.cart.map((item,i) => (
                            <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'2px 0',borderBottom:'1px dashed var(--bd-subtle)'}}>
                              <span>{item.qty}x {item.name}</span>
                              <span style={{fontFamily:'DM Mono'}}>₹{Math.round(item.net)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                        <button onClick={e=>{e.stopPropagation();setEditOrder(order)}}
                          style={{padding:'6px 12px',borderRadius:6,border:'1px solid rgba(99,102,241,0.3)',background:'rgba(99,102,241,0.1)',color:'var(--indigo)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                          ✏️ Edit
                        </button>
                        <button onClick={e=>{e.stopPropagation();printReceipt(order)}}
                          style={{padding:'6px 12px',borderRadius:6,border:'1px solid rgba(16,185,129,0.3)',background:'rgba(16,185,129,0.1)',color:'var(--emerald)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                          🖨️ Receipt
                        </button>
                        <button onClick={e=>{e.stopPropagation();printTags(order)}}
                          style={{padding:'6px 12px',borderRadius:6,border:'1px solid rgba(56,189,248,0.3)',background:'rgba(56,189,248,0.1)',color:'var(--sky)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                          🏷️ Tags
                        </button>
                        <button onClick={e=>{e.stopPropagation();setPaymentModal(order)}}
                          style={{padding:'6px 12px',borderRadius:6,border:'1px solid rgba(245,158,11,0.3)',background:'rgba(245,158,11,0.1)',color:'var(--amber)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                          💳 Payment
                        </button>
                        {!order.deleted && (
                          <button onClick={e=>{e.stopPropagation();deleteOrder(order)}}
                            style={{padding:'6px 12px',borderRadius:6,border:'1px solid rgba(244,63,94,0.2)',background:'rgba(244,63,94,0.08)',color:'var(--rose)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
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
      <Modal open={!!paymentModal} onClose={()=>setPaymentModal(null)} title="💳 Update Payment">
        {paymentModal && (
          <div>
            <div style={{background:'var(--bg-raised)',borderRadius:8,padding:'12px 16px',marginBottom:16,fontSize:13}}>
              <span style={{fontWeight:700}}>{paymentModal.customerName}</span>
              <span style={{fontFamily:'DM Mono',color:'var(--indigo)',marginLeft:8}}>{paymentModal.tagNumber}</span>
              <span style={{fontFamily:'DM Mono',fontWeight:800,fontSize:16,marginLeft:'auto',float:'right'}}>₹{paymentModal.grandTotal}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {['Paid','Pending','Partial'].map(s => (
                <button key={s} onClick={()=>updatePayment(paymentModal,s)}
                  style={{padding:'12px 16px',borderRadius:8,border:`2px solid ${paymentModal.paymentStatus===s?'var(--indigo)':'var(--bd-subtle)'}`,background:paymentModal.paymentStatus===s?'rgba(99,102,241,0.1)':'transparent',color:paymentModal.paymentStatus===s?'var(--indigo)':'var(--tx-primary)',fontWeight:600,fontSize:14,cursor:'pointer',fontFamily:'inherit',textAlign:'left',transition:'var(--transition)'}}>
                  {s==='Paid'?'✅':s==='Pending'?'⏳':'🔶'} {s} {paymentModal.paymentStatus===s?'(current)':''}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit order modal */}
      {editOrder && <EditOrder order={editOrder} onClose={()=>setEditOrder(null)} />}

      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,background:'var(--bg-card)',border:'1px solid var(--bd-subtle)',borderLeft:'3px solid var(--emerald)',borderRadius:10,padding:'10px 18px',boxShadow:'var(--shadow-lg)',fontSize:13,fontWeight:600,zIndex:9999}}>
          {toast}
        </div>
      )}
    </div>
  )
}
