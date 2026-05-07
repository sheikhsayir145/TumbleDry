// src/pages/Login.jsx

import { useState } from 'react'

const STORE_ID = 'Dargah001'
const PASSWORD = 'tumbledry@2026'
const SESSION_KEY = 'td-authenticated'

export function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === 'true'
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY)
  window.location.reload()
}

export default function Login({ onLogin }) {
  const [storeId, setStoreId]   = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Small delay for feel
    await new Promise(r => setTimeout(r, 600))

    if (storeId.trim() === STORE_ID && password === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      onLogin()
    } else {
      setError(
        storeId.trim() !== STORE_ID
          ? 'Invalid Store ID'
          : 'Incorrect password'
      )
    }
    setLoading(false)
  }

  const inp = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    border: '1.5px solid var(--bd-subtle)',
    fontSize: 14,
    fontFamily: 'inherit',
    fontWeight: 500,
    background: 'var(--bg-input)',
    color: 'var(--tx-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  const lbl = {
    display: 'block',
    marginBottom: 6,
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--tx-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        animation: 'fadeUp 0.5s var(--ease-out) both',
      }}>

        {/* Logo + branding */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img
            src="/logo.png"
            alt="Tumbledry"
            onError={e => {
              e.target.style.display = 'none'
              e.target.parentElement.insertAdjacentHTML('afterbegin', '<div style="font-size:64px;margin-bottom:16px">👕</div>')
            }}
            style={{ height: 90, width: 'auto', objectFit: 'contain', marginBottom: 16, display: 'block', margin: '0 auto 16px' }}
          />
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--tx-primary)',
            letterSpacing: '-0.5px',
            marginBottom: 6,
          }}>
            Tumbledry POS
          </h1>
          <p style={{ fontSize: 14, color: 'var(--tx-secondary)', fontWeight: 500 }}>
            Sign in to your store
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 20,
          border: '1px solid var(--bd-subtle)',
          boxShadow: 'var(--shadow-xl)',
          padding: 32,
        }}>
          <form onSubmit={handleLogin}>
            {/* Store ID */}
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Store ID</label>
              <input
                style={inp}
                type="text"
                value={storeId}
                onChange={e => { setStoreId(e.target.value); setError('') }}
                placeholder="e.g. Dargah001"
                autoFocus
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={lbl}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...inp, paddingRight: 48 }}
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 18, color: 'var(--tx-tertiary)', padding: 4,
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginBottom: 16,
                padding: '10px 14px',
                background: 'rgba(244,63,94,0.08)',
                border: '1px solid rgba(244,63,94,0.2)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--rose)',
                fontWeight: 600,
                animation: 'fadeUp 0.2s ease',
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !storeId || !password}
              style={{
                width: '100%',
                padding: 14,
                background: loading || !storeId || !password
                  ? 'var(--bg-raised)'
                  : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: loading || !storeId || !password
                  ? 'var(--tx-tertiary)'
                  : 'white',
                border: '1px solid var(--bd-subtle)',
                borderRadius: 10,
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: 14,
                cursor: loading || !storeId || !password ? 'not-allowed' : 'pointer',
                boxShadow: loading || !storeId || !password
                  ? 'none'
                  : '0 4px 20px rgba(99,102,241,0.3)',
                transition: 'all 0.2s',
                letterSpacing: '0.3px',
              }}
            >
              {loading ? '⏳ Signing in...' : '🔐 Sign In'}
            </button>
          </form>
        </div>

        {/* Store ID hint */}
        <p style={{
          textAlign: 'center',
          marginTop: 20,
          fontSize: 12,
          color: 'var(--tx-tertiary)',
        }}>
          Store ID and password are provided by your store manager
        </p>
      </div>
    </div>
  )
}
