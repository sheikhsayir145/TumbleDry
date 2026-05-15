// src/pages/Login.jsx

import { useState } from 'react'

const STORE_ID    = 'Dargah001'
const PASSWORD    = 'tumbledry@2026'
const SESSION_KEY = 'td-authenticated'

export function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === 'true'
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY)
  window.location.reload()
}

export default function Login({ onLogin }) {
  const [storeId,   setStoreId]   = useState('')
  const [password,  setPassword]  = useState('')
  const [error,     setError]     = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 500))

    if (storeId.trim() === STORE_ID && password === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      onLogin()
    } else {
      setError(storeId.trim() !== STORE_ID ? 'Invalid Store ID' : 'Incorrect password')
    }
    setLoading(false)
  }

  const fieldStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1.5px solid var(--bd-subtle)',
    fontSize: 15,
    fontFamily: 'inherit',
    fontWeight: 500,
    background: 'var(--bg-input)',
    color: 'var(--tx-primary)',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--tx-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '50vmin',
        height: '50vmin',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-8%',
        width: '40vmin',
        height: '40vmin',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp 0.4s var(--ease-out) both' }}>

        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #0D9488, #14B8A6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            margin: '0 auto 16px',
            boxShadow: 'var(--shadow-teal)',
          }}>
            👕
          </div>
          <h1 style={{
            fontSize: 26,
            fontWeight: 800,
            color: 'var(--tx-primary)',
            letterSpacing: '-0.5px',
            marginBottom: 5,
          }}>
            Tumbledry
          </h1>
          <p style={{ fontSize: 14, color: 'var(--tx-secondary)', fontWeight: 500 }}>
            Sign in to your store
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 18,
          border: '1px solid var(--bd-subtle)',
          boxShadow: 'var(--shadow-xl)',
          padding: '28px 28px 24px',
        }}>
          <form onSubmit={handleLogin}>

            {/* Store ID */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Store ID</label>
              <input
                style={fieldStyle}
                type="text"
                value={storeId}
                onChange={e => { setStoreId(e.target.value); setError('') }}
                placeholder="e.g. Dargah001"
                autoFocus
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...fieldStyle, paddingRight: 46 }}
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
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 17,
                    color: 'var(--tx-tertiary)',
                    padding: 4,
                    lineHeight: 1,
                    minHeight: 'auto',
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginBottom: 14,
                padding: '10px 13px',
                background: 'var(--rose-dim)',
                border: '1px solid rgba(244,63,94,0.2)',
                borderRadius: 9,
                fontSize: 13,
                color: 'var(--rose)',
                fontWeight: 600,
                animation: 'fadeUp 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
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
                padding: '14px',
                background: loading || !storeId || !password
                  ? 'var(--bg-raised)'
                  : 'linear-gradient(135deg, #0D9488, #14B8A6)',
                color: loading || !storeId || !password
                  ? 'var(--tx-tertiary)'
                  : 'white',
                border: '1.5px solid var(--bd-subtle)',
                borderRadius: 10,
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: 14,
                cursor: loading || !storeId || !password ? 'not-allowed' : 'pointer',
                boxShadow: loading || !storeId || !password
                  ? 'none'
                  : 'var(--shadow-teal)',
                transition: 'all 0.2s var(--ease-out)',
                letterSpacing: '0.2px',
              }}
            >
              {loading ? '⏳ Signing in…' : '🔐 Sign In'}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: 18,
          fontSize: 12,
          color: 'var(--tx-tertiary)',
          lineHeight: 1.5,
        }}>
          Store ID and password provided by your store manager
        </p>
      </div>
    </div>
  )
}
