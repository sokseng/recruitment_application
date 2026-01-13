import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import Dashboard from '../pages/Dashboard'
import AdminDashboard from '../pages/AdminDashboard'
import EmployerDashboard from '../pages/EmployerDashboard'
import CandidateDashboard from '../pages/CandidateDashboard'
import MainLayout from '../layouts/MainLayout'

export default function AppRoutes() {
  return (
    <MainLayout>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Dashboard />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer"
          element={
            <ProtectedRoute>
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate"
          element={
            <ProtectedRoute>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />

        {/* Optional */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  )
}
