// src/pages/Analytics.jsx

import { useEffect, useState } from 'react'
import { useStore } from '../store/index.js'
import { Card, Spinner, EmptyState } from '../components/ui/index.jsx'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function chartOpts(title) {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ₹${ctx.parsed.y?.toLocaleString() || ctx.parsed.toLocaleString()}` } } },
    scales: {
      x: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#64748b', font: { size: 11 } } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#64748b', font: { size: 11 }, callback: v => '₹' + v.toLocaleString() }, beginAtZero: true }
    }
  }
}

export default function Analytics() {
  const { orders, ordersLoading } = useStore()
  const [tab, setTab] = useState('performance')

  const active = orders.filter(o => !o.deleted)
  const now    = new Date()

  // ── KPIs ──────────────────────────────────────────────────
  const thirtyAgo = new Date(Date.now() - 30 * 86400000)
  const recentOrders = active.filter(o => new Date(o.orderDate) >= thirtyAgo)
  const ordersPerDay = (recentOrders.length / 30).toFixed(1)
  const avgOrderVal  = active.length ? Math.round(active.reduce((s,o) => s+o.grandTotal, 0) / active.length) : 0

  const customerMap = {}
  active.forEach(o => {
    if (!customerMap[o.customerNumber]) customerMap[o.customerNumber] = { orders: 0, first: o.orderDate }
    customerMap[o.customerNumber].orders++
    if (o.orderDate < customerMap[o.customerNumber].first) customerMap[o.customerNumber].first = o.orderDate
  })
  const total = Object.keys(customerMap).length
  const repeat = Object.values(customerMap).filter(c => c.orders > 1).length
  const retention = total ? Math.round(repeat / total * 100) : 0
  const newCust = Object.values(customerMap).filter(c => new Date(c.first) >= thirtyAgo).length

  // ── 7-day trend ────────────────────────────────────────────
  const last7 = Array.from({length:7}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i))
    return d.toISOString().split('T')[0]
  })
  const dailyRev = last7.map(d => active.filter(o => o.orderDate.slice(0,10) === d).reduce((s,o) => s+o.grandTotal, 0))
  const dailyOrd = last7.map(d => active.filter(o => o.orderDate.slice(0,10) === d).length)

  // ── Monthly 6-month ────────────────────────────────────────
  const buckets = Array.from({length:6}, (_,i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5-i), 1)
    return { key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, revenue: 0 }
  })
  active.forEach(o => {
    const d = new Date(o.orderDate)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const b = buckets.find(b => b.key === key)
    if (b) b.revenue += o.grandTotal
  })

  // ── Service breakdown ──────────────────────────────────────
  const svcMap = {}
  active.forEach(o => { svcMap[o.serviceType] = (svcMap[o.serviceType]||0) + o.grandTotal })
  const svcLabels = Object.keys(svcMap)
  const svcVals   = Object.values(svcMap)

  // ── Lapsed customers ──────────────────────────────────────
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

  // ── Top customers ──────────────────────────────────────────
  const topCustomers = Object.values(customerLast)
    .map(c => ({ ...c, total: c.total }))
    .sort((a,b) => b.total - a.total)
    .slice(0, 10)
  const maxSpend = topCustomers[0]?.total || 1

  // ── Pending aging ──────────────────────────────────────────
  const pending = active.filter(o => o.paymentStatus === 'Pending' || o.paymentStatus === 'Partial')
  const aging = [
    { label: '0–7 Days', cls: 'fresh', orders: pending.filter(o => (Date.now()-new Date(o.orderDate))/86400000 <= 7) },
    { label: '8–30 Days', cls: 'medium', orders: pending.filter(o => { const d=(Date.now()-new Date(o.orderDate))/86400000; return d>7&&d<=30 }) },
    { label: '30+ Days', cls: 'old', orders: pending.filter(o => (Date.now()-new Date(o.orderDate))/86400000 > 30) },
  ]
  const agingColors = { fresh: 'var(--emerald)', medium: 'var(--amber)', old: 'var(--rose)' }

  const TABS = ['performance', 'revenue', 'insights']

  if (ordersLoading) return <div style={{ display:'flex', justifyContent:'center', padding: 80 }}><Spinner size={40} /></div>

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, color: 'var(--tx-primary)', letterSpacing: '-0.5px' }}>Analytics</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card)', padding: 4, borderRadius: 10, border: '1px solid var(--bd-subtle)', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontWeight: 600, fontSize: 12, textTransform: 'capitalize',
            background: tab === t ? 'var(--bg-raised)' : 'transparent',
            color: tab === t ? 'var(--tx-primary)' : 'var(--tx-secondary)',
            boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
          }}>
            {t === 'performance' ? '📊 Performance' : t === 'revenue' ? '💰 Revenue' : '🔍 Insights'}
          </button>
        ))}
      </div>

      {/* Performance Tab */}
      {tab === 'performance' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Avg Order Value', value: `₹${avgOrderVal.toLocaleString()}`, color: 'var(--indigo)' },
              { label: 'Orders / Day', value: ordersPerDay, color: 'var(--amber)' },
              { label: 'Retention %', value: `${retention}%`, color: 'var(--emerald)' },
              { label: 'New Customers (30d)', value: newCust, color: 'var(--rose)' },
            ].map(k => (
              <Card key={k.label} style={{ borderLeft: `3px solid ${k.color}`, padding: '16px 20px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--tx-secondary)', marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'DM Mono', color: 'var(--tx-primary)', letterSpacing: '-0.5px' }}>{k.value}</div>
              </Card>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card>
              <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--tx-primary)', marginBottom: 16 }}>📅 Daily Orders (7d)</h4>
              <div style={{ height: 220 }}>
                <Bar data={{ labels: last7.map(d => d.slice(5)), datasets: [{ data: dailyOrd, backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 5 }] }}
                  options={{ ...chartOpts(), plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#64748b', font:{size:11} } }, y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#64748b', font:{size:11} }, beginAtZero: true } } }} />
              </div>
            </Card>
            <Card>
              <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--tx-primary)', marginBottom: 16 }}>💰 Daily Revenue (7d)</h4>
              <div style={{ height: 220 }}>
                <Line data={{ labels: last7.map(d => d.slice(5)), datasets: [{ data: dailyRev, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true, pointBackgroundColor: '#10b981', pointRadius: 4 }] }}
                  options={chartOpts()} />
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Revenue Tab */}
      {tab === 'revenue' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card>
            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--tx-primary)', marginBottom: 16 }}>📈 Revenue Growth (6 Months)</h4>
            <div style={{ height: 260 }}>
              <Line data={{ labels: buckets.map(b => b.label), datasets: [{ data: buckets.map(b => b.revenue), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', tension: 0.4, fill: true, pointBackgroundColor: '#10b981', pointRadius: 5 }] }}
                options={chartOpts()} />
            </div>
          </Card>
          <Card>
            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--tx-primary)', marginBottom: 16 }}>🧹 Revenue by Service</h4>
            <div style={{ height: 260 }}>
              <Doughnut data={{ labels: svcLabels, datasets: [{ data: svcVals, backgroundColor: ['#6366f1','#10b981','#f59e0b','#f43f5e','#38bdf8'], borderWidth: 0 }] }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: {size:11}, padding: 16 } }, tooltip: { callbacks: { label: ctx => ` ₹${ctx.parsed.toLocaleString()}` } } } }} />
            </div>
          </Card>
        </div>
      )}

      {/* Insights Tab */}
      {tab === 'insights' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Discount Impact */}
          {(() => {
            const discountOrders  = active.filter(o => (o.discountAmount||0) > 0)
            const totalDiscount   = discountOrders.reduce((s,o) => s+(o.discountAmount||0), 0)
            const totalGross      = active.reduce((s,o) => s+(o.grandTotal+(o.discountAmount||0)), 0)
            const discountRate    = totalGross > 0 ? (totalDiscount/totalGross*100).toFixed(1) : 0
            const avgDiscount     = discountOrders.length > 0 ? Math.round(totalDiscount/discountOrders.length) : 0
            return (
              <Card style={{ gridColumn: '1 / -1' }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16, color: 'var(--tx-primary)' }}>🏷️ Discount Impact Report</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Orders with Discount', value: discountOrders.length, color: 'var(--amber)' },
                    { label: 'Total Discount Given', value: `₹${Math.round(totalDiscount).toLocaleString()}`, color: 'var(--rose)' },
                    { label: 'Avg Discount per Order', value: `₹${avgDiscount.toLocaleString()}`, color: 'var(--indigo)' },
                    { label: 'Effective Discount Rate', value: `${discountRate}%`, color: 'var(--emerald)' },
                  ].map(k => (
                    <div key={k.label} style={{ background: 'var(--bg-raised)', borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${k.color}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--tx-secondary)', marginBottom: 6 }}>{k.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'DM Mono', color: 'var(--tx-primary)' }}>{k.value}</div>
                    </div>
                  ))}
                </div>
                {discountOrders.length > 0 && (
                  <div style={{ fontSize: 13, color: 'var(--tx-secondary)', padding: '10px 14px', background: 'rgba(245,158,11,0.06)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.15)' }}>
                    💡 You gave discounts on <strong style={{ color: 'var(--tx-primary)' }}>{((discountOrders.length/active.length)*100).toFixed(1)}%</strong> of orders, totalling <strong style={{ color: 'var(--rose)', fontFamily: 'DM Mono' }}>₹{Math.round(totalDiscount).toLocaleString()}</strong> in revenue reduction.
                    Gross revenue before discounts: <strong style={{ color: 'var(--tx-primary)', fontFamily: 'DM Mono' }}>₹{Math.round(totalGross).toLocaleString()}</strong>
                  </div>
                )}
              </Card>
            )
          })()}
          {/* Top customers */}
          <Card>
            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16, color: 'var(--tx-primary)' }}>🏆 Top 10 Customers by Spend</h4>
            {topCustomers.map((c, i) => (
              <div key={c.phone} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--bd-subtle)' }}>
                <div style={{ fontSize: i < 3 ? 18 : 14, width: 28, textAlign: 'center', fontWeight: 800, color: i===0?'#f59e0b':i===1?'#94a3b8':i===2?'#b45309':'var(--tx-secondary)' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i+1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-secondary)' }}>{c.phone} · {c.orders} orders</div>
                  <div style={{ height: 3, background: 'var(--bd-subtle)', borderRadius: 99, marginTop: 4 }}>
                    <div style={{ height: 3, background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: 99, width: `${c.total/maxSpend*100}%` }} />
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'DM Mono', color: 'var(--indigo)' }}>₹{c.total.toLocaleString()}</div>
              </div>
            ))}
          </Card>

          {/* Pending aging */}
          <Card>
            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16, color: 'var(--tx-primary)' }}>⏳ Outstanding Payment Aging</h4>
            <div style={{ fontSize: 13, color: 'var(--tx-secondary)', marginBottom: 14 }}>
              Total outstanding: <strong style={{ color: 'var(--rose)', fontFamily: 'DM Mono' }}>₹{pending.reduce((s,o) => s+o.grandTotal, 0).toLocaleString()}</strong> across {pending.length} orders
            </div>
            {aging.map(bucket => (
              <div key={bucket.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, marginBottom: 10, background: `rgba(${bucket.cls==='fresh'?'16,185,129':bucket.cls==='medium'?'245,158,11':'244,63,94'},0.08)`, borderLeft: `3px solid ${agingColors[bucket.cls]}` }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--tx-primary)' }}>{bucket.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-secondary)', marginTop: 2 }}>{bucket.orders.length} orders</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'DM Mono', color: agingColors[bucket.cls] }}>
                  ₹{bucket.orders.reduce((s,o) => s+o.grandTotal, 0).toLocaleString()}
                </div>
              </div>
            ))}

            {/* Lapsed customers */}
            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '20px 0 14px', color: 'var(--tx-primary)' }}>😴 Lapsed Customers (60+ days)</h4>
            {lapsed.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--tx-secondary)' }}>🎉 No lapsed customers!</div>
            ) : lapsed.map(c => (
              <div key={c.phone} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, marginBottom: 6, background: 'var(--bg-raised)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-secondary)' }}>{c.phone} · {c.orders} orders · ₹{c.total.toLocaleString()}</div>
                </div>
                <span style={{ background: c.daysSince >= 120 ? 'var(--rose)' : 'var(--amber)', color: 'white', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, fontFamily: 'DM Mono' }}>
                  {c.daysSince}d
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}
