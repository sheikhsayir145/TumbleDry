// src/pages/Attendance.jsx

import { useState, useEffect } from 'react'
import { useStore } from '../store/index.js'
import { Card, Button, Spinner } from '../components/ui/index.jsx'
import { EMPLOYEES, ATT_STATUSES } from '../lib/garments.js'

const ATT_COLORS = {
  Working:  { bg: 'rgba(16,185,129,0.12)',  color: '#059669', border: 'rgba(16,185,129,0.3)'  },
  Absent:   { bg: 'rgba(244,63,94,0.10)',   color: '#f43f5e', border: 'rgba(244,63,94,0.25)'  },
  Leave:    { bg: 'rgba(245,158,11,0.10)',  color: '#d97706', border: 'rgba(245,158,11,0.25)' },
  'Half Day': { bg: 'rgba(251,146,60,0.10)', color: '#ea580c', border: 'rgba(251,146,60,0.25)' },
  Holiday:  { bg: 'rgba(56,189,248,0.10)',  color: '#0284c7', border: 'rgba(56,189,248,0.25)' },
}

const BADGE_SHORT = { Working: 'W', Absent: 'A', Leave: 'L', 'Half Day': 'H/D', Holiday: 'H' }

function todayStr() { return new Date().toISOString().split('T')[0] }

export default function Attendance() {
  const { attendance, attendanceLoading, fetchAttendance, setAttendance } = useStore()
  const [date, setDate] = useState(todayStr())
  const [toast, setToast] = useState('')

  useEffect(() => { fetchAttendance() }, [])

  const dayData = attendance[date] || {}

  // Summary counts
  const counts = { Working: 0, Absent: 0, Leave: 0, 'Half Day': 0, Holiday: 0 }
  EMPLOYEES.forEach(e => counts[dayData[e] || 'Working']++)

  async function markStatus(emp, status) {
    const current = dayData[emp] || 'Working'
    if (current === status) return
    await setAttendance(date, emp, status)
    showToast(`${emp}: ${status}`)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // Last 7 days for history
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  if (attendanceLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={40} /></div>

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--tx-primary)', letterSpacing: '-0.5px' }}>
          👷 Staff Attendance
        </h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="date" value={date}
            onChange={e => setDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--bd-subtle)', fontFamily: 'inherit', fontSize: 13, background: 'var(--bg-card)', color: 'var(--tx-primary)' }}
          />
        </div>
      </div>

      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([status, count]) => {
          const c = ATT_COLORS[status]
          return (
            <span key={status} style={{
              padding: '5px 14px', borderRadius: 99, fontSize: 11, fontWeight: 700,
              background: c.bg, color: c.color, border: `1px solid ${c.border}`,
              textTransform: 'uppercase', letterSpacing: '0.3px',
            }}>
              {status}: {count}
            </span>
          )
        })}
      </div>

      {/* Employee cards */}
      <div style={{ display: 'grid', gap: 10, marginBottom: 32 }}>
        {EMPLOYEES.map(emp => {
          const current = dayData[emp] || 'Working'
          const cc = ATT_COLORS[current]
          return (
            <Card key={emp} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, border: `1px solid ${cc.border}` }}>
              {/* Avatar */}
              <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${cc.color}33, ${cc.color}11)`,
                border: `2px solid ${cc.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: cc.color,
              }}>
                {emp.slice(0, 2).toUpperCase()}
              </div>

              {/* Name */}
              <div style={{ minWidth: 100 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--tx-primary)' }}>{emp}</div>
                <div style={{ fontSize: 11, color: cc.color, fontWeight: 600, marginTop: 2 }}>{current}</div>
              </div>

              {/* Status buttons */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {ATT_STATUSES.map(s => {
                  const sc = ATT_COLORS[s]
                  const isActive = current === s
                  return (
                    <button
                      key={s}
                      onClick={() => markStatus(emp, s)}
                      style={{
                        padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                        fontFamily: 'inherit', fontWeight: 700, fontSize: 11,
                        textTransform: 'uppercase', letterSpacing: '0.3px',
                        background: isActive ? sc.bg : 'transparent',
                        color: isActive ? sc.color : 'var(--tx-tertiary)',
                        border: `1.5px solid ${isActive ? sc.border : 'var(--bd-subtle)'}`,
                        transition: 'var(--transition)',
                      }}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      {/* History table */}
      <Card>
        <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--tx-secondary)', marginBottom: 16 }}>
          📅 Last 7 Days
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg-raised)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--tx-secondary)', borderBottom: '1px solid var(--bd-subtle)', fontSize: 11, textTransform: 'uppercase' }}>Date</th>
                {EMPLOYEES.map(e => (
                  <th key={e} style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--tx-secondary)', borderBottom: '1px solid var(--bd-subtle)', fontSize: 11, textTransform: 'uppercase' }}>{e}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {last7.map(d => {
                const day = attendance[d] || {}
                const dayLabel = new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', weekday: 'short' })
                const isToday = d === todayStr()
                return (
                  <tr key={d} style={{ background: isToday ? 'rgba(99,102,241,0.04)' : 'transparent' }}>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--bd-subtle)', fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--indigo)' : 'var(--tx-primary)' }}>
                      {dayLabel} {isToday && '(Today)'}
                    </td>
                    {EMPLOYEES.map(e => {
                      const status = day[e] || 'Working'
                      const sc = ATT_COLORS[status]
                      return (
                        <td key={e} style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid var(--bd-subtle)' }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                            {BADGE_SHORT[status]}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--bg-card)', border: '1px solid var(--bd-subtle)', borderLeft: '3px solid var(--emerald)', borderRadius: 10, padding: '10px 18px', boxShadow: 'var(--shadow-lg)', fontSize: 13, fontWeight: 600, zIndex: 9999 }}>
          💾 {toast} — press Save to sync to DB
        </div>
      )}
    </div>
  )
}
