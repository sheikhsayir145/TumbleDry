// src/store/index.js — Global state with Zustand

import { create } from 'zustand'
import { api } from '../lib/api.js'

export const useStore = create((set, get) => ({
  // ── Orders ────────────────────────────────────────────────
  orders: [],
  ordersLoading: false,
  ordersError: null,

  fetchOrders: async () => {
    set({ ordersLoading: true, ordersError: null })
    try {
      const { orders } = await api.orders.getAll()
      set({ orders, ordersLoading: false })
    } catch (e) {
      set({ ordersError: e.message, ordersLoading: false })
    }
  },

  upsertOrder: async (order) => {
    await api.orders.upsert(order)
    // Optimistic update
    set(state => {
      const idx = state.orders.findIndex(o => o.id === order.id)
      if (idx >= 0) {
        const updated = [...state.orders]
        updated[idx] = order
        return { orders: updated }
      }
      return { orders: [order, ...state.orders] }
    })
  },

  // ── Attendance ─────────────────────────────────────────────
  attendance: {},          // { "2026-05-01": { Jamil: "Working", ... } }
  attendanceLoading: false,

  fetchAttendance: async () => {
    set({ attendanceLoading: true })
    try {
      const { attendance } = await api.attendance.getAll()
      const map = {}
      attendance.forEach(row => {
        map[row.date] = {
          Jamil:  row.jamil,
          Ajaz:   row.ajaz,
          Moomin: row.moomin,
          Shahid: row.shahid,
          Shabir: row.shabir,
        }
      })
      set({ attendance: map, attendanceLoading: false })
    } catch (e) {
      set({ attendanceLoading: false })
    }
  },

  setAttendance: async (date, employee, status) => {
    // Optimistic update
    set(state => ({
      attendance: {
        ...state.attendance,
        [date]: { ...(state.attendance[date] || {}), [employee]: status }
      }
    }))
    // Persist to DB
    const day = get().attendance[date] || {}
    await api.attendance.upsert(date, day)
  },

  // ── Cart ──────────────────────────────────────────────────
  cart: [],
  orderDiscount: 0,

  addToCart: (item) => set(state => ({ cart: [...state.cart, item] })),
  removeFromCart: (idx) => set(state => ({ cart: state.cart.filter((_, i) => i !== idx) })),
  clearCart: () => set({ cart: [], orderDiscount: 0 }),
  setOrderDiscount: (pct) => set({ orderDiscount: pct }),

  // ── UI ─────────────────────────────────────────────────────
  darkMode: localStorage.getItem('td-dark') === 'true',
  toggleDark: () => set(state => {
    const next = !state.darkMode
    localStorage.setItem('td-dark', next)
    if (next) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    return { darkMode: next }
  }),

  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}))
