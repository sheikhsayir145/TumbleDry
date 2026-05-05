// src/App.jsx

import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from './store/index.js'
import Layout from './components/Layout.jsx'
import POS from './pages/POS.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Analytics from './pages/Analytics.jsx'
import Attendance from './pages/Attendance.jsx'

export default function App() {
  const { darkMode } = useStore()

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [darkMode])

  return (
    <Layout>
      <Routes>
        <Route path="/"           element={<POS />}        />
        <Route path="/dashboard"  element={<Dashboard />}  />
        <Route path="/analytics"  element={<Analytics />}  />
        <Route path="/attendance" element={<Attendance />} />
      </Routes>
    </Layout>
  )
}
