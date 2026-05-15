// src/pages/Attendance.jsx

import { useEffect, useState } from 'react'
import { useStore } from '../store/index.js'
import { Card, Spinner } from '../components/ui/index.jsx'
import { EMPLOYEES, ATT_STATUSES } from '../lib/garments.js'
import { HardHat, Calendar } from 'lucide-react'

const ATT_COLORS = {
  Working:    { bg: 'rgba(16,185,129,0.12)',  color: '#059669', border: 'rgba(16,185,129,0.25)'  },
  Absent:     { bg: 'rgba(244,63,94,0.10)',   color: '#E11D48', border: 'rgba(244,63,94,0.22)'   },
  Leave:      { bg: 'rgba(245,158,11,0.10)',  color: '#D97706', border: 'rgba(245,158,11,0.22)'  },
  'Half Day': { bg: 'rgba(251,146,60,0.10)',  color: '#EA580C', border: 'rgba(251,146,60,0.22)'  },
  Holiday:    { bg: 'rgba(14,165,233,0.10)',  color: '#0369A1', border: 'rgba(14,165,233,0.22)'  },
}

const BADGE_SHORT = { Working: 'W', Absent: 'A', Leave: 'L', 'Half Day': 'H/D', Holiday: 'H' }

function todayStr() { return new Date().toISOString().split('T')[0] }

export default function Attendance() {
  const { attendance, attendanceLoading, fetchAttendance, setAttendance } = useStore()
  const [date,  setDate]  = useState(todayStr())
  const [toast, setToast] = useState('')

  useEffect(() => { fetchAttendance() }, [])

  const dayData = attendance[date] || {}

  const counts = { Working: 0, Absent: 0, Leave: 0, 'Half Day': 0, Holiday: 0 }
  EMPLOYEES.forEach(e => counts[dayData[e] || 'Working']++)

  async function markStatus(emp, status) {
    const current = dayData[emp] || 'Working'
    if (current === status) return
    await setAttendance(date, emp, status)
    showToast(`${emp}: ${status}`)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  if (attendanceLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={40} /></div>

  return (
    <div className="page" style={{ maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--tx-primary)', letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <HardHat size={20} strokeWidth={2} /> Staff Attendance
        </h1>
        <input
          type="date" value={date}
          onChange={e => setDate(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--bd-subtle)', fontFamily: 'inherit', fontSize: 13, background: 'var(--bg-input)', color: 'var(--tx-primary)', outline: 'none', cursor: 'pointer' }}
        />
      </div>

      {/* Summary pills */}
      <div className="att-stat-row">
        {Object.entries(counts).map(([status, count]) => {
          const c = ATT_COLORS[status]
          return (
            <span key={status} style={{
              padding: '5px 13px', borderRadius: 99, fontSize: 11, fontWeight: 700,
              background: c.bg, color: c.color, border: `1px solid ${c.border}`,
              textTransform: 'uppercase', letterSpacing: '0.4px',
            }}>
              {status}: {count}
            </span>
          )
        })}
      </div>

      {/* Employee cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {EMPLOYEES.map(emp => {
          const current = dayData[emp] || 'Working'
          const cc = ATT_COLORS[current]
          return (
            <Card key={emp} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${cc.border}`, flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${cc.color}33, ${cc.color}11)`,
                border: `2px solid ${cc.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: cc.color,
              }}>
                {emp.slice(0, 2).toUpperCase()}
              </div>

              {/* Name */}
              <div style={{ minWidth: 90 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--tx-primary)' }}>{emp}</div>
                <div style={{ fontSize: 11, color: cc.color, fontWeight: 600, marginTop: 1 }}>{current}</div>
              </div>

              {/* Status buttons */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {ATT_STATUSES.map(s => {
                  const sc = ATT_COLORS[s]
                  const isActive = current === s
                  return (
                    <button key={s} onClick={() => markStatus(emp, s)} style={{
                      padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                      fontFamily: 'inherit', fontWeight: 700, fontSize: 11,
                      textTransform: 'uppercase', letterSpacing: '0.3px',
                      background: isActive ? sc.bg : 'transparent',
                      color: isActive ? sc.color : 'var(--tx-tertiary)',
                      border: `1.5px solid ${isActive ? sc.border : 'var(--bd-subtle)'}`,
                      transition: 'all 0.15s',
                    }}>
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
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--bd-subtle)' }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--tx-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={12} /> Last 7 Days
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 480 }}>
            <thead>
              <tr style={{ background: 'var(--bg-raised)' }}>
                <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--tx-secondary)', borderBottom: '1px solid var(--bd-subtle)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date</th>
                {EMPLOYEES.map(e => (
                  <th key={e} style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 700, color: 'var(--tx-secondary)', borderBottom: '1px solid var(--bd-subtle)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{e}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {last7.map(d => {
                const day = attendance[d] || {}
                const dayLabel = new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', weekday: 'short' })
                const isToday = d === todayStr()
                return (
                  <tr key={d} style={{ background: isToday ? 'rgba(13,148,136,0.04)' : 'transparent' }}>
                    <td style={{ padding: '9px 14px', borderBottom: '1px solid var(--bd-subtle)', fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--indigo)' : 'var(--tx-primary)', whiteSpace: 'nowrap' }}>
                      {dayLabel}{isToday ? ' (Today)' : ''}
                    </td>
                    {EMPLOYEES.map(e => {
                      const status = day[e] || 'Working'
                      const sc = ATT_COLORS[status]
                      return (
                        <td key={e} style={{ padding: '9px 14px', textAlign: 'center', borderBottom: '1px solid var(--bd-subtle)' }}>
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
        <div style={{ position: 'fixed', bottom: 80, right: 16, background: 'var(--bg-card)', border: '1px solid var(--bd-subtle)', borderLeft: '3px solid var(--emerald)', borderRadius: 10, padding: '10px 16px', boxShadow: 'var(--shadow-lg)', fontSize: 13, fontWeight: 600, zIndex: 9999, color: 'var(--tx-primary)', animation: 'fadeUp 0.25s var(--ease-out)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
