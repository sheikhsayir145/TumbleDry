// src/components/ui/index.jsx — Shared UI primitives

import { clsx } from 'clsx'

export function Card({ children, className, ...props }) {
  return (
    <div
      className={clsx('card', className)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--bd-subtle)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-md)',
        padding: 24,
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function Button({ children, variant = 'primary', size = 'md', className, style, ...props }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'inherit',
    fontWeight: 600,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    transition: 'var(--transition)',
    textDecoration: 'none',
    letterSpacing: '0.1px',
  }
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '10px 18px', fontSize: 13 },
    lg: { padding: '13px 24px', fontSize: 14, fontWeight: 700 },
    full: { padding: '13px 24px', fontSize: 14, fontWeight: 700, width: '100%' },
  }
  const variants = {
    primary:  { background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', boxShadow: '0 4px 20px rgba(99,102,241,0.25)' },
    success:  { background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', boxShadow: '0 2px 8px rgba(16,185,129,0.2)' },
    danger:   { background: 'rgba(244,63,94,0.1)', color: 'var(--rose)', border: '1px solid rgba(244,63,94,0.2)' },
    ghost:    { background: 'var(--bg-raised)', color: 'var(--tx-secondary)', border: '1px solid var(--bd-subtle)' },
    amber:    { background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: 'white', boxShadow: '0 2px 8px rgba(245,158,11,0.25)' },
    sky:      { background: 'rgba(56,189,248,0.1)', color: 'var(--sky)', border: '1px solid rgba(56,189,248,0.2)' },
  }
  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({ label, error, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{
          display: 'block', marginBottom: 6, fontSize: 11,
          fontWeight: 700, color: 'var(--tx-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8,
          border: `1.5px solid ${error ? 'var(--rose)' : 'var(--bd-subtle)'}`,
          fontSize: 14, fontFamily: 'inherit', fontWeight: 500,
          background: 'var(--bg-input)', color: 'var(--tx-primary)',
          outline: 'none', transition: 'var(--transition)',
        }}
        {...props}
      />
      {error && <div style={{ fontSize: 11, color: 'var(--rose)', marginTop: 4 }}>{error}</div>}
    </div>
  )
}

export function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{
          display: 'block', marginBottom: 6, fontSize: 11,
          fontWeight: 700, color: 'var(--tx-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          {label}
        </label>
      )}
      <select
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8,
          border: '1.5px solid var(--bd-subtle)',
          fontSize: 14, fontFamily: 'inherit', fontWeight: 500,
          background: 'var(--bg-input)', color: 'var(--tx-primary)',
          outline: 'none', cursor: 'pointer',
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

export function Badge({ children, color = 'indigo' }) {
  const colors = {
    indigo:  { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8', border: 'rgba(99,102,241,0.2)' },
    amber:   { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
    emerald: { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.2)' },
    rose:    { bg: 'rgba(244,63,94,0.10)',   color: '#fb7185', border: 'rgba(244,63,94,0.2)'  },
    sky:     { bg: 'rgba(56,189,248,0.10)',  color: '#38bdf8', border: 'rgba(56,189,248,0.2)' },
    gray:    { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.2)'},
  }
  const c = colors[color] || colors.indigo
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 99,
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`
    }}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    pending:   { label: 'Received',  color: 'amber'   },
    inprocess: { label: 'In Process',color: 'indigo'  },
    completed: { label: 'Ready',     color: 'emerald' },
    delivered: { label: 'Delivered', color: 'sky'     },
    deleted:   { label: 'Deleted',   color: 'rose'    },
  }
  const s = map[status] || { label: status, color: 'gray' }
  return <Badge color={s.color}>{s.label}</Badge>
}

export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid var(--bd-subtle)`,
      borderTopColor: 'var(--indigo)',
      animation: 'spin 0.8s linear infinite',
    }} />
  )
}

export function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--tx-secondary)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx-primary)', marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13 }}>{subtitle}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, maxWidth = 600 }) {
  if (!open) return null
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(10,15,30,0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16,
        border: '1px solid var(--bd-subtle)',
        boxShadow: 'var(--shadow-xl)',
        width: '100%', maxWidth, maxHeight: '85vh', overflowY: 'auto',
        padding: 28, animation: 'fadeUp 0.3s var(--ease-out)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--bd-subtle)',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx-primary)' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-raised)', border: 'none', borderRadius: 6,
              width: 32, height: 32, cursor: 'pointer', fontSize: 18,
              color: 'var(--tx-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Toast({ message, type = 'info' }) {
  const colors = { info: 'var(--indigo)', success: 'var(--emerald)', error: 'var(--rose)' }
  if (!message) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: 'var(--bg-card)', border: '1px solid var(--bd-subtle)',
      borderLeft: `3px solid ${colors[type]}`,
      borderRadius: 10, padding: '10px 18px',
      boxShadow: 'var(--shadow-lg)',
      fontSize: 13, fontWeight: 600, color: 'var(--tx-primary)',
      maxWidth: 280, animation: 'fadeUp 0.3s var(--ease-out)',
    }}>
      {message}
    </div>
  )
}
