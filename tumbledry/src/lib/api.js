// src/lib/api.js — All Netlify Function calls

const BASE = '/.netlify/functions'
const SECRET = import.meta.env.VITE_API_SECRET

const headers = {
  'Content-Type': 'application/json',
  'x-api-secret': SECRET
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// ── Orders ────────────────────────────────────────────────────
export const api = {
  orders: {
    getAll:      ()        => request('/orders'),
    upsert:      (order)   => request('/orders', { method: 'POST', body: JSON.stringify({ order }) }),
    clearAll:    ()        => request('/orders', { method: 'POST', body: JSON.stringify({ action: 'CLEAR_ALL' }) }),
    insertBatch: (orders)  => request('/orders', { method: 'POST', body: JSON.stringify({ action: 'INSERT_BATCH', orders }) }),
  },
  attendance: {
    getAll: ()             => request('/attendance'),
    upsert: (date, attendance) =>
      request('/attendance', { method: 'POST', body: JSON.stringify({ date, attendance }) }),
  }
}
