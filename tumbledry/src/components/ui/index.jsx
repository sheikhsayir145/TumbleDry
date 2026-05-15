// src/components/ui/index.jsx — Shared UI primitives v2

import { clsx } from 'clsx'

/* ── Card ── */
export function Card({ children, className, style, ...props }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--bd-subtle)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-sm)',
        padding: 20,
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
}

/* ── Button ── */
export function Button({ children, variant = 'primary', size = 'md', className, style, ...props }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    fontFamily: 'inherit',
    fontWeight: 700,
    borderRadius: 9,
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.15s, transform 0.15s',
    textDecoration: 'none',
    letterSpacing: '0.1px',
    whiteSpace: 'nowrap',
  }

  const sizes = {
    sm:   { padding: '6px 12px',  fontSize: 12 },
    md:   { padding: '10px 18px', fontSize: 13 },
    lg:   { padding: '13px 24px', fontSize: 14 },
    full: { padding: '13px 20px', fontSize: 14, width: '100%' },
  }

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #72BF2C, #8DD446)',
      color: 'white',
      boxShadow: 'var(--shadow-teal)',
    },
    success: {
      background: 'linear-gradient(135deg, #059669, #10B981)',
      color: 'white',
      boxShadow: '0 2px 10px rgba(16,185,129,0.22)',
    },
    danger: {
      background: 'var(--rose-dim)',
      color: 'var(--rose)',
      border: '1px solid rgba(244,63,94,0.2)',
    },
    ghost: {
      background: 'var(--bg-raised)',
      color: 'var(--tx-secondary)',
      border: '1px solid var(--bd-subtle)',
    },
    amber: {
      background: 'linear-gradient(135deg, #D97706, #F59E0B)',
      color: 'white',
      boxShadow: 'var(--shadow-amber)',
    },
    sky: {
      background: 'rgba(14,165,233,0.1)',
      color: 'var(--sky)',
      border: '1px solid rgba(14,165,233,0.2)',
    },
    indigo: {
      background: 'var(--indigo-dim)',
      color: 'var(--indigo)',
      border: '1px solid rgba(13,148,136,0.2)',
    },
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

/* ── Input ── */
export function Input({ label, error, style, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: 5,
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--tx-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
        }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%',
          padding: '10px 13px',
          borderRadius: 9,
          border: `1.5px solid ${error ? 'var(--rose)' : 'var(--bd-subtle)'}`,
          fontSize: 14,
          fontFamily: 'inherit',
          fontWeight: 500,
          background: 'var(--bg-input)',
          color: 'var(--tx-primary)',
          outline: 'none',
          transition: 'border-color 0.2s',
          ...style,
        }}
        {...props}
      />
      {error && (
        <div style={{ fontSize: 11, color: 'var(--rose)', marginTop: 4, fontWeight: 600 }}>
          {error}
        </div>
      )}
    </div>
  )
}

/* ── Select ── */
export function Select({ label, children, style, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: 5,
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--tx-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
        }}>
          {label}
        </label>
      )}
      <select
        style={{
          width: '100%',
          padding: '10px 13px',
          borderRadius: 9,
          border: '1.5px solid var(--bd-subtle)',
          fontSize: 14,
          fontFamily: 'inherit',
          fontWeight: 500,
          background: 'var(--bg-input)',
          color: 'var(--tx-primary)',
          outline: 'none',
          cursor: 'pointer',
          ...style,
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

/* ── Badge ── */
export function Badge({ children, color = 'teal' }) {
  const colors = {
    teal:    { bg: 'rgba(114,191,44,0.12)',  color: '#5FAD1A', border: 'rgba(114,191,44,0.25)'  },
    indigo:  { bg: 'rgba(114,191,44,0.12)',  color: '#5FAD1A', border: 'rgba(114,191,44,0.25)'  },
    amber:   { bg: 'rgba(245,158,11,0.12)',  color: '#B45309', border: 'rgba(245,158,11,0.2)'  },
    emerald: { bg: 'rgba(16,185,129,0.12)',  color: '#059669', border: 'rgba(16,185,129,0.2)'  },
    rose:    { bg: 'rgba(244,63,94,0.10)',   color: '#E11D48', border: 'rgba(244,63,94,0.2)'   },
    sky:     { bg: 'rgba(14,165,233,0.10)',  color: '#0369A1', border: 'rgba(14,165,233,0.2)'  },
    gray:    { bg: 'rgba(120,113,108,0.12)', color: '#78716C', border: 'rgba(120,113,108,0.2)' },
  }
  const c = colors[color] || colors.teal
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 9px',
      borderRadius: 99,
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      lineHeight: 1.5,
    }}>
      {children}
    </span>
  )
}

/* ── StatusBadge ── */
export function StatusBadge({ status }) {
  const map = {
    pending:   { label: 'Received',   color: 'amber'   },
    inprocess: { label: 'In Process', color: 'sky'     },
    completed: { label: 'Ready',      color: 'emerald' },
    delivered: { label: 'Delivered',  color: 'teal'    },
    deleted:   { label: 'Deleted',    color: 'rose'    },
  }
  const s = map[status] || { label: status, color: 'gray' }
  return <Badge color={s.color}>{s.label}</Badge>
}

/* ── Spinner ── */
export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      border: `2px solid var(--bd-subtle)`,
      borderTopColor: 'var(--indigo)',
      animation: 'spin 0.75s linear infinite',
    }} />
  )
}

/* ── EmptyState ── */
export function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--tx-secondary)' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', color: 'var(--tx-tertiary)', opacity: 0.7 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx-primary)', marginBottom: 5 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--tx-secondary)', maxWidth: 280, margin: '0 auto', lineHeight: 1.5 }}>{subtitle}</div>}
    </div>
  )
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children, maxWidth = 580 }) {
  if (!open) return null
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      className="modal-wrap"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(14,13,10,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.18s ease',
      }}
    >
      <div
        className="modal-inner"
        style={{
          background: 'var(--bg-card)',
          borderRadius: 16,
          border: '1px solid var(--bd-subtle)',
          boxShadow: 'var(--shadow-xl)',
          width: '100%',
          maxWidth,
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: 24,
          animation: 'popIn 0.25s var(--ease-spring)',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
          paddingBottom: 14,
          borderBottom: '1px solid var(--bd-subtle)',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--tx-primary)', letterSpacing: '-0.2px' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-raised)',
              border: '1px solid var(--bd-subtle)',
              borderRadius: 8,
              width: 30,
              height: 30,
              cursor: 'pointer',
              fontSize: 16,
              color: 'var(--tx-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ── Toast ── */
export function Toast({ message, type = 'info' }) {
  const colors = {
    info:    'var(--indigo)',
    success: 'var(--emerald)',
    error:   'var(--rose)',
  }
  if (!message) return null
  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      right: 16,
      zIndex: 9999,
      background: 'var(--bg-card)',
      border: '1px solid var(--bd-subtle)',
      borderLeft: `3px solid ${colors[type]}`,
      borderRadius: 10,
      padding: '10px 16px',
      boxShadow: 'var(--shadow-lg)',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--tx-primary)',
      maxWidth: 260,
      animation: 'fadeUp 0.25s var(--ease-out)',
    }}>
      {message}
    </div>
  )
}

/* ── SectionHeader ── */
export function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: 10,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      color: 'var(--tx-tertiary)',
      marginBottom: 12,
    }}>
      {children}
    </div>
  )
}

/* ── PageHeader ── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <div>
        <h1 style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--tx-primary)',
          letterSpacing: '-0.4px',
          lineHeight: 1.2,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: 'var(--tx-secondary)', marginTop: 3 }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
