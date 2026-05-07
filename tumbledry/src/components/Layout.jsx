// src/components/Layout.jsx

import { NavLink } from 'react-router-dom'
import { useStore } from '../store/index.js'

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
    <div style={{display:'flex', height:'100vh', overflow:'hidden'}}>
      {/* Sidebar */}
      <aside style={{width:64, background:'var(--bg-card)', borderRight:'1px solid var(--bd-subtle)', display:'flex', flexDirection:'column', alignItems:'center', padding:'20px 0', gap:6, flexShrink:0, zIndex:100, overflowY:'auto'}}>
        
        {/* Logo */}
        <div style={{width:40, height:40, borderRadius:10, overflow:'hidden', marginBottom:14, flexShrink:0}}>
          <img src="/logo.png" alt="Tumbledry"
            onError={e => {
              // Fallback to text logo if image not found
              e.target.style.display = 'none'
              e.target.parentElement.style.background = 'linear-gradient(135deg,#6366f1,#4f46e5)'
              e.target.parentElement.style.display = 'flex'
              e.target.parentElement.style.alignItems = 'center'
              e.target.parentElement.style.justifyContent = 'center'
              e.target.parentElement.style.fontSize = '18px'
              e.target.parentElement.innerHTML = '👕'
            }}
            style={{width:'100%', height:'100%', objectFit:'cover'}}
          />
        </div>

        {/* Nav links */}
        {NAV.map(item => (
          <NavLink key={item.path} to={item.path} end={item.path==='/'} title={item.label}
            style={({isActive}) => ({
              width:44, height:44, borderRadius:10,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, textDecoration:'none',
              background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
              transition:'var(--transition)', flexShrink:0,
            })}>
            {item.icon}
          </NavLink>
        ))}

        {/* Dark mode toggle */}
        <div style={{marginTop:'auto', paddingTop:8}}>
          <button onClick={toggleDark} title={darkMode ? 'Light mode' : 'Dark mode'}
            style={{width:44, height:44, borderRadius:10, background:'var(--bg-raised)', border:'1px solid var(--bd-subtle)', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center'}}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{flex:1, overflow:'auto', background:'var(--bg-base)'}}>
        {/* Loading bar — shows when orders are being fetched */}
        {ordersLoading && (
          <div style={{position:'fixed', top:0, left:64, right:0, height:3, zIndex:999, background:'var(--bd-subtle)'}}>
            <div style={{height:3, background:'linear-gradient(90deg, #6366f1, #10b981)', animation:'loadingBar 1.5s ease infinite', backgroundSize:'200% 100%'}} />
          </div>
        )}
        <style>{`
          @keyframes loadingBar {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        {children}
      </main>
    </div>
  )
}
