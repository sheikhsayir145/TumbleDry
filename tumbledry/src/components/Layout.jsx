// src/components/Layout.jsx

import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../store/index.js'

const NAV = [
  { path: '/',           icon: '🧾', label: 'POS'         },
  { path: '/dashboard',  icon: '📊', label: 'Dashboard'   },
  { path: '/analytics',  icon: '📈', label: 'Analytics'   },
  { path: '/attendance', icon: '👷', label: 'Attendance'  },
]

export default function Layout({ children }) {
  const { darkMode, toggleDark, sidebarOpen, setSidebarOpen } = useStore()

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 64,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--bd-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        gap: 8,
        flexShrink: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, marginBottom: 16, flexShrink: 0,
          boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
        }}>
          👕
        </div>

        {/* Nav links */}
        {NAV.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            title={item.label}
            style={({ isActive }) => ({
              width: 44, height: 44, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, textDecoration: 'none',
              background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
              transition: 'var(--transition)',
            })}
          >
            {item.icon}
          </NavLink>
        ))}

        {/* Dark mode at bottom */}
        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={toggleDark}
            title={darkMode ? 'Light mode' : 'Dark mode'}
            style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'var(--bg-raised)', border: '1px solid var(--bd-subtle)',
              cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        background: 'var(--bg-base)',
      }}>
        {children}
      </main>
    </div>
  )
}
