// src/App.jsx

import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStore } from './store/index.js'
import Layout from './components/Layout.jsx'
import Login, { isAuthenticated } from './pages/Login.jsx'
import POS from './pages/POS.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Analytics from './pages/Analytics.jsx'
import Attendance from './pages/Attendance.jsx'
import PendingPayments from './pages/PendingPayments.jsx'
import CustomerProfiles from './pages/CustomerProfiles.jsx'
import Reports from './pages/Reports.jsx'
import RateCard from './pages/RateCard.jsx'

export default function App() {
  const { darkMode, fetchOrders } = useStore()
  const [authed, setAuthed] = useState(isAuthenticated())

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [darkMode])

  useEffect(() => {
    if (authed) fetchOrders()
  }, [authed])

  // Show login page until authenticated
  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/"           element={<POS />}             />
        <Route path="/dashboard"  element={<Dashboard />}       />
        <Route path="/analytics"  element={<Analytics />}       />
        <Route path="/pending"    element={<PendingPayments />}  />
        <Route path="/customers"  element={<CustomerProfiles />} />
        <Route path="/reports"    element={<Reports />}          />
        <Route path="/rates"      element={<RateCard />}         />
        <Route path="/attendance" element={<Attendance />}      />
      </Routes>
    </Layout>
  )
}
