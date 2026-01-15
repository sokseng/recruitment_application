import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import Dashboard from '../pages/Dashboard'
import AdminDashboard from '../pages/AdminDashboard'
// import EmployerDashboard from '../pages/EmployerDashboard'
import CandidateDashboard from '../pages/CandidateDashboard'
import UpdateProfile from '../pages/profile/UpdateProfile'
import MainLayout from '../layouts/MainLayout'
import PostJob from '../pages/PostJob'
import MyJobs from '../pages/MyJobs'

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
              <MyJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/post-job"
          element={
            <ProtectedRoute>
              <PostJob />
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
        <Route
          path="/update-profile"
          element={
            <ProtectedRoute>
              <UpdateProfile />
            </ProtectedRoute>
          }
        />

        {/* Optional */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  )
}
