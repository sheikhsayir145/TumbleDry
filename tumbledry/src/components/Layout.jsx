// src/components/Layout.jsx

import { NavLink } from 'react-router-dom'
import { useStore } from '../store/index.js'
import { logout } from '../pages/Login.jsx'

const NAV = [
  { path:'/',           icon:'🧾', label:'POS'              },
  { path:'/dashboard',  icon:'📊', label:'Dashboard'        },
  { path:'/analytics',  icon:'📈', label:'Analytics'        },
  { path:'/pending',    icon:'💳', label:'Pending Payments' },
  { path:'/customers',  icon:'👥', label:'Customers'        },
  { path:'/reports',    icon:'📄', label:'Reports'          },
  { path:'/rates',      icon:'💰', label:'Rate Card'        },
  { path:'/attendance', icon:'👷', label:'Attendance'       },
]

export default function Layout({ children }) {
  const { darkMode, toggleDark, ordersLoading } = useStore()

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>

      {/* Sidebar */}
      <aside style={{
        width: 64,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--bd-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        gap: 6,
        flexShrink: 0,
        zIndex: 100,
        overflowY: 'auto',
      }}>

        {/* Logo mark — small icon only in sidebar */}
        <div style={{ fontSize: 26, marginBottom: 14, flexShrink: 0 }}>👕</div>

        {/* Nav */}
        {NAV.map(item => (
          <NavLink key={item.path} to={item.path} end={item.path==='/'} title={item.label}
            style={({isActive}) => ({
              width: 44, height: 44, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, textDecoration: 'none', flexShrink: 0,
              background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
              transition: 'var(--transition)',
            })}>
            {item.icon}
          </NavLink>
        ))}

        {/* Bottom controls */}
        <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:6, paddingTop:8 }}>
          <button onClick={toggleDark} title={darkMode ? 'Light mode' : 'Dark mode'}
            style={{ width:44, height:44, borderRadius:10, background:'var(--bg-raised)', border:'1px solid var(--bd-subtle)', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={logout} title="Sign out"
            style={{ width:44, height:44, borderRadius:10, background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.15)', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
            🚪
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, overflow:'auto', background:'var(--bg-base)' }}>
        {/* Loading bar */}
        {ordersLoading && (
          <div style={{ position:'fixed', top:0, left:64, right:0, height:3, zIndex:999 }}>
            <div style={{ height:3, background:'linear-gradient(90deg,#6366f1,#10b981,#6366f1)', backgroundSize:'200% 100%', animation:'loadingBar 1.5s ease infinite' }} />
          </div>
        )}
        <style>{`@keyframes loadingBar { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        {children}
      </main>
    </div>
  )
}
