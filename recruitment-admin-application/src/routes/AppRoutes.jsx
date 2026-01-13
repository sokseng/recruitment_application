import { Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import AdminDashboard from '../pages/AdminDashboard'
import EmployerDashboard from '../pages/EmployerDashboard'
import CandidateDashboard from '../pages/CandidateDashboard'
import MainLayout from '../layouts/MainLayout'

export default function AppRoutes() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/employer" element={<EmployerDashboard />} />
        <Route path="/candidate" element={<CandidateDashboard />} />
      </Routes>
    </MainLayout>
  )
}
