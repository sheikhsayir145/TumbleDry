// src/pages/Analytics.jsx

import { useState } from 'react'
import { useStore } from '../store/index.js'
import { Card, Spinner } from '../components/ui/index.jsx'
import { BarChart2, DollarSign, Lightbulb, Clock, Calendar, TrendingUp, Scissors, Tag, Trophy, AlertCircle, Moon } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const TEAL = '#0D9488'
const TEAL_RGBA = (a) => `rgba(13,148,136,${a})`
const AMBER_RGBA = (a) => `rgba(245,158,11,${a})`
const EMERALD_RGBA = (a) => `rgba(16,185,129,${a})`

function chartOpts() {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ₹${(ctx.parsed.y ?? ctx.parsed).toLocaleString()}` } }
    },
    scales: {
      x: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => '₹' + v.toLocaleString() }, beginAtZero: true }
    }
  }
}

function countChartOpts() {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} orders` } }
    },
    scales: {
      x: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8', font: { size: 11 } }, beginAtZero: true }
    }
  }
}

export default function Analytics() {
  const { orders, ordersLoading } = useStore()
  const [tab, setTab] = useState('performance')

  const active = orders.filter(o => !o.deleted)
  const now    = new Date()

  const thirtyAgo    = new Date(Date.now() - 30 * 86400000)
  const recentOrders = active.filter(o => new Date(o.orderDate) >= thirtyAgo)
  const ordersPerDay = (recentOrders.length / 30).toFixed(1)
  const avgOrderVal  = active.length ? Math.round(active.reduce((s,o) => s+o.grandTotal, 0) / active.length) : 0

  const customerMap = {}
  active.forEach(o => {
    if (!customerMap[o.customerNumber]) customerMap[o.customerNumber] = { orders: 0, first: o.orderDate }
    customerMap[o.customerNumber].orders++
    if (o.orderDate < customerMap[o.customerNumber].first) customerMap[o.customerNumber].first = o.orderDate
  })
  const total     = Object.keys(customerMap).length
  const repeat    = Object.values(customerMap).filter(c => c.orders > 1).length
  const retention = total ? Math.round(repeat / total * 100) : 0
  const newCust   = Object.values(customerMap).filter(c => new Date(c.first) >= thirtyAgo).length

  const last7    = Array.from({length:7}, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6-i)); return d.toISOString().split('T')[0] })
  const dailyRev = last7.map(d => active.filter(o => o.orderDate.slice(0,10) === d).reduce((s,o) => s+o.grandTotal, 0))
  const dailyOrd = last7.map(d => active.filter(o => o.orderDate.slice(0,10) === d).length)

  const buckets = Array.from({length:6}, (_,i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5-i), 1)
    return { key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`, revenue: 0 }
  })
  active.forEach(o => {
    const d   = new Date(o.orderDate)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const b   = buckets.find(b => b.key === key)
    if (b) b.revenue += o.grandTotal
  })

  const svcMap    = {}
  active.forEach(o => { svcMap[o.serviceType] = (svcMap[o.serviceType]||0) + o.grandTotal })
  const svcLabels = Object.keys(svcMap)
  const svcVals   = Object.values(svcMap)

  const customerLast = {}
  active.forEach(o => {
    const t = new Date(o.orderDate).getTime()
    if (!customerLast[o.customerNumber] || t > customerLast[o.customerNumber].t) {
      customerLast[o.customerNumber] = { name: o.customerName, phone: o.customerNumber, t, orders: 0, total: 0 }
    }
    customerLast[o.customerNumber].orders++
    customerLast[o.customerNumber].total += o.grandTotal
  })

  const lapsed = Object.values(customerLast)
    .map(c => ({ ...c, daysSince: Math.floor((Date.now() - c.t) / 86400000) }))
    .filter(c => c.daysSince >= 60 && c.orders >= 2)
    .sort((a,b) => b.daysSince - a.daysSince)
    .slice(0, 10)

  const topCustomers = Object.values(customerLast)
    .sort((a,b) => b.total - a.total)
    .slice(0, 10)
  const maxSpend = topCustomers[0]?.total || 1

  const pending = active.filter(o => o.paymentStatus === 'Pending' || o.paymentStatus === 'Partial')
  const aging = [
    { label: '0–7 Days',  color: 'var(--emerald)', bg: EMERALD_RGBA(0.08), orders: pending.filter(o => (Date.now()-new Date(o.orderDate))/86400000 <= 7) },
    { label: '8–30 Days', color: 'var(--amber)',   bg: AMBER_RGBA(0.08),   orders: pending.filter(o => { const d=(Date.now()-new Date(o.orderDate))/86400000; return d>7&&d<=30 }) },
    { label: '30+ Days',  color: 'var(--rose)',    bg: 'rgba(244,63,94,0.08)', orders: pending.filter(o => (Date.now()-new Date(o.orderDate))/86400000 > 30) },
  ]

  // ── Peak hours heatmap ─────────────────────────────────────
  const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const SLOTS  = ['8–10','10–12','12–14','14–16','16–18','18–20','20+']
  const heatmap = Array.from({length:7}, () => Array(7).fill(0))
  active.forEach(o => {
    const d   = new Date(o.orderDate)
    const dow = (d.getDay() + 6) % 7          // 0=Mon … 6=Sun
    const hr  = d.getHours()
    const slot = hr < 10 ? 0 : hr < 12 ? 1 : hr < 14 ? 2 : hr < 16 ? 3 : hr < 18 ? 4 : hr < 20 ? 5 : 6
    heatmap[dow][slot]++
  })
  const heatMax = Math.max(1, ...heatmap.flat())

  const TABS = [
    { id: 'performance', label: 'Performance', icon: BarChart2   },
    { id: 'revenue',     label: 'Revenue',     icon: DollarSign  },
    { id: 'insights',    label: 'Insights',    icon: Lightbulb   },
    { id: 'heatmap',     label: 'Peak Hours',  icon: Clock       },
  ]

  if (ordersLoading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={40} /></div>

  return (
    <div className="page">
      <h1 style={{ fontSize:20, fontWeight:800, marginBottom:20, color:'var(--tx-primary)', letterSpacing:'-0.4px', display:'flex', alignItems:'center', gap:10 }}>
        <BarChart2 size={20} strokeWidth={2} /> Analytics
      </h1>

      {/* Tab switcher */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'var(--bg-card)', padding:4, borderRadius:10, border:'1px solid var(--bd-subtle)', width:'fit-content', maxWidth:'100%', overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'8px 14px', borderRadius:7, border:'none', cursor:'pointer',
            fontFamily:'inherit', fontWeight:600, fontSize:12, whiteSpace:'nowrap',
            background: tab === t.id ? 'var(--bg-raised)' : 'transparent',
            color: tab === t.id ? 'var(--tx-primary)' : 'var(--tx-secondary)',
            boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
            transition: 'background 0.15s, color 0.15s',
            display:'flex', alignItems:'center', gap:5,
          }}>
            <t.icon size={13} strokeWidth={2} />{t.label}
          </button>
        ))}
      </div>

      {/* ── Performance Tab ── */}
      {tab === 'performance' && (
        <>
          <div className="kpi-grid" style={{ marginBottom:20 }}>
            {[
              { label:'Avg Order Value',     value:`₹${avgOrderVal.toLocaleString()}`, color:'var(--indigo)' },
              { label:'Orders / Day (30d)',  value:ordersPerDay,                        color:'var(--amber)'  },
              { label:'Retention Rate',      value:`${retention}%`,                     color:'var(--emerald)'},
              { label:'New Customers (30d)', value:newCust,                             color:'var(--rose)'   },
            ].map(k => (
              <Card key={k.label} style={{ borderLeft:`3px solid ${k.color}`, padding:'16px 18px' }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--tx-secondary)', marginBottom:8 }}>{k.label}</div>
                <div className="mono" style={{ fontSize:26, fontWeight:800, color:'var(--tx-primary)', letterSpacing:'-0.5px' }}>{k.value}</div>
              </Card>
            ))}
          </div>

          <div className="chart-grid">
            <Card>
              <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-tertiary)', marginBottom:14, display:'flex', alignItems:'center', gap:5 }}><Calendar size={12} /> Daily Orders — Last 7 Days</div>
              <div style={{ height:200 }}>
                <Bar
                  data={{ labels: last7.map(d => d.slice(5)), datasets: [{ data: dailyOrd, backgroundColor: TEAL_RGBA(0.7), hoverBackgroundColor: TEAL_RGBA(0.9), borderRadius: 5 }] }}
                  options={countChartOpts()}
                />
              </div>
            </Card>
            <Card>
              <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-tertiary)', marginBottom:14, display:'flex', alignItems:'center', gap:5 }}><DollarSign size={12} /> Daily Revenue — Last 7 Days</div>
              <div style={{ height:200 }}>
                <Line
                  data={{ labels: last7.map(d => d.slice(5)), datasets: [{ data: dailyRev, borderColor: TEAL, backgroundColor: TEAL_RGBA(0.08), tension:0.4, fill:true, pointBackgroundColor: TEAL, pointRadius:4 }] }}
                  options={chartOpts()}
                />
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ── Revenue Tab ── */}
      {tab === 'revenue' && (
        <div className="chart-grid">
          <Card>
            <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-tertiary)', marginBottom:14, display:'flex', alignItems:'center', gap:5 }}><TrendingUp size={12} /> Revenue Growth — 6 Months</div>
            <div style={{ height:240 }}>
              <Line
                data={{ labels: buckets.map(b => b.label), datasets: [{ data: buckets.map(b => b.revenue), borderColor: TEAL, backgroundColor: TEAL_RGBA(0.07), tension:0.4, fill:true, pointBackgroundColor: TEAL, pointRadius:5 }] }}
                options={chartOpts()}
              />
            </div>
          </Card>
          <Card>
            <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-tertiary)', marginBottom:14, display:'flex', alignItems:'center', gap:5 }}><Scissors size={12} /> Revenue by Service Type</div>
            <div style={{ height:240 }}>
              <Doughnut
                data={{ labels: svcLabels, datasets: [{ data: svcVals, backgroundColor: [TEAL,'#F59E0B','#10B981','#F43F5E','#0EA5E9'], borderWidth:0 }] }}
                options={{ responsive:true, maintainAspectRatio:false, plugins: { legend: { position:'bottom', labels: { color:'#94a3b8', font:{size:11}, padding:14 } }, tooltip: { callbacks: { label: ctx => ` ₹${ctx.parsed.toLocaleString()}` } } } }}
              />
            </div>
          </Card>
        </div>
      )}

      {/* ── Heatmap Tab ── */}
      {tab === 'heatmap' && (
        <Card>
          <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-tertiary)', marginBottom:6, display:'flex', alignItems:'center', gap:5 }}><Clock size={12} /> Orders by Day & Time</div>
          <div style={{ fontSize:12, color:'var(--tx-secondary)', marginBottom:18 }}>Darker = more orders at that time</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ borderCollapse:'separate', borderSpacing:4, minWidth:420 }}>
              <thead>
                <tr>
                  <th style={{ width:40, fontSize:10, fontWeight:700, color:'var(--tx-tertiary)', textAlign:'left', paddingBottom:6 }} />
                  {SLOTS.map(s => (
                    <th key={s} style={{ fontSize:10, fontWeight:700, color:'var(--tx-tertiary)', textAlign:'center', paddingBottom:6, whiteSpace:'nowrap' }}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, di) => (
                  <tr key={day}>
                    <td style={{ fontSize:11, fontWeight:700, color:'var(--tx-secondary)', paddingRight:8, whiteSpace:'nowrap' }}>{day}</td>
                    {heatmap[di].map((count, si) => {
                      const intensity = count / heatMax
                      const bg = count === 0
                        ? 'var(--bg-raised)'
                        : `rgba(13,148,136,${0.1 + intensity * 0.85})`
                      const color = intensity > 0.5 ? 'white' : count > 0 ? 'var(--indigo)' : 'var(--tx-tertiary)'
                      return (
                        <td key={si} title={`${day} ${SLOTS[si]}: ${count} orders`} style={{
                          width:52, height:38, borderRadius:7, background:bg,
                          textAlign:'center', fontSize:11, fontWeight:700, color,
                          cursor:'default', transition:'background 0.2s',
                        }}>
                          {count > 0 ? count : ''}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:16, fontSize:11, color:'var(--tx-tertiary)' }}>
            <span>Low</span>
            {[0.1,0.3,0.5,0.7,0.9].map(v => (
              <div key={v} style={{ width:20, height:14, borderRadius:4, background:`rgba(13,148,136,${v})` }} />
            ))}
            <span>High</span>
          </div>
        </Card>
      )}

      {/* ── Insights Tab ── */}
      {tab === 'insights' && (
        <div style={{ display:'grid', gap:16 }}>

          {/* Discount Impact */}
          {(() => {
            const discountOrders = active.filter(o => (o.discountAmount||0) > 0)
            const totalDiscount  = discountOrders.reduce((s,o) => s+(o.discountAmount||0), 0)
            const totalGross     = active.reduce((s,o) => s+(o.grandTotal+(o.discountAmount||0)), 0)
            const discountRate   = totalGross > 0 ? (totalDiscount/totalGross*100).toFixed(1) : 0
            const avgDiscount    = discountOrders.length > 0 ? Math.round(totalDiscount/discountOrders.length) : 0
            return (
              <Card>
                <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-tertiary)', marginBottom:14, display:'flex', alignItems:'center', gap:5 }}><Tag size={12} /> Discount Impact Report</div>
                <div className="discount-grid" style={{ marginBottom:14 }}>
                  {[
                    { label:'Orders with Discount',   value:discountOrders.length,                              color:'var(--amber)'  },
                    { label:'Total Discount Given',   value:`₹${Math.round(totalDiscount).toLocaleString()}`,   color:'var(--rose)'   },
                    { label:'Avg Discount per Order', value:`₹${avgDiscount.toLocaleString()}`,                 color:'var(--indigo)' },
                    { label:'Effective Discount Rate',value:`${discountRate}%`,                                 color:'var(--emerald)'},
                  ].map(k => (
                    <div key={k.label} style={{ background:'var(--bg-raised)', borderRadius:8, padding:'12px 14px', borderLeft:`3px solid ${k.color}` }}>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--tx-secondary)', marginBottom:6 }}>{k.label}</div>
                      <div className="mono" style={{ fontSize:20, fontWeight:800, color:'var(--tx-primary)' }}>{k.value}</div>
                    </div>
                  ))}
                </div>
                {discountOrders.length > 0 && (
                  <div style={{ fontSize:13, color:'var(--tx-secondary)', padding:'10px 14px', background:AMBER_RGBA(0.06), borderRadius:8, border:'1px solid rgba(245,158,11,0.15)', lineHeight:1.6, display:'flex', alignItems:'flex-start', gap:6 }}>
                    <Lightbulb size={13} style={{flexShrink:0, opacity:0.7}} /> Discounts on <strong style={{color:'var(--tx-primary)'}}>{((discountOrders.length/active.length)*100).toFixed(1)}%</strong> of orders · total reduction <strong className="mono" style={{color:'var(--rose)'}}>₹{Math.round(totalDiscount).toLocaleString()}</strong> · gross before discounts <strong className="mono" style={{color:'var(--tx-primary)'}}>₹{Math.round(totalGross).toLocaleString()}</strong>
                  </div>
                )}
              </Card>
            )
          })()}

          <div className="chart-grid">
            {/* Top Customers */}
            <Card>
              <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-tertiary)', marginBottom:14, display:'flex', alignItems:'center', gap:5 }}><Trophy size={12} /> Top 10 Customers by Spend</div>
              {topCustomers.length === 0 ? (
                <div style={{ fontSize:13, color:'var(--tx-secondary)', padding:'20px 0', textAlign:'center' }}>No data yet</div>
              ) : topCustomers.map((c, i) => (
                <div key={c.phone} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--bd-subtle)' }}>
                  <div style={{ width:28, textAlign:'center', fontWeight:800, flexShrink:0, fontSize:i < 3 ? 14 : 13, color:i===0?'#F59E0B':i===1?'#94a3b8':i===2?'#b45309':'var(--tx-tertiary)' }}>
                    {i+1}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--tx-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</div>
                    <div style={{ fontSize:11, color:'var(--tx-secondary)', marginTop:1 }}>{c.phone} · {c.orders} orders</div>
                    <div style={{ height:3, background:'var(--bd-subtle)', borderRadius:99, marginTop:5 }}>
                      <div style={{ height:3, background:`linear-gradient(90deg, ${TEAL}, #14B8A6)`, borderRadius:99, width:`${c.total/maxSpend*100}%`, transition:'width 0.4s' }} />
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize:13, fontWeight:700, color:'var(--indigo)', flexShrink:0 }}>₹{c.total.toLocaleString()}</div>
                </div>
              ))}
            </Card>

            {/* Payment Aging + Lapsed */}
            <Card>
              <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-tertiary)', marginBottom:10, display:'flex', alignItems:'center', gap:5 }}><Clock size={12} /> Outstanding Payment Aging</div>
              <div style={{ fontSize:13, color:'var(--tx-secondary)', marginBottom:12 }}>
                Total: <strong className="mono" style={{color:'var(--rose)'}}>₹{pending.reduce((s,o) => s+o.grandTotal, 0).toLocaleString()}</strong> across {pending.length} orders
              </div>
              {aging.map(b => (
                <div key={b.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', borderRadius:9, marginBottom:8, background:b.bg, borderLeft:`3px solid ${b.color}` }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:'var(--tx-primary)' }}>{b.label}</div>
                    <div style={{ fontSize:11, color:'var(--tx-secondary)', marginTop:2 }}>{b.orders.length} orders</div>
                  </div>
                  <div className="mono" style={{ fontSize:18, fontWeight:800, color:b.color }}>₹{b.orders.reduce((s,o) => s+o.grandTotal, 0).toLocaleString()}</div>
                </div>
              ))}

              <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--tx-tertiary)', margin:'20px 0 12px', display:'flex', alignItems:'center', gap:5 }}><Moon size={12} /> Lapsed Customers (60+ days)</div>
              {lapsed.length === 0 ? (
                <div style={{ fontSize:13, color:'var(--tx-secondary)', padding:'8px 0' }}>No lapsed customers</div>
              ) : lapsed.map(c => (
                <div key={c.phone} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:7, marginBottom:6, background:'var(--bg-raised)' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--tx-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</div>
                    <div style={{ fontSize:11, color:'var(--tx-secondary)', marginTop:1 }}>{c.phone} · {c.orders} orders · ₹{c.total.toLocaleString()}</div>
                  </div>
                  <span style={{ background:c.daysSince >= 120 ? 'var(--rose)' : 'var(--amber)', color:'white', padding:'3px 9px', borderRadius:99, fontSize:10, fontWeight:700, flexShrink:0 }}>
                    {c.daysSince}d
                  </span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
