import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import Dashboard from '../pages/Dashboard'
import AdminDashboard from '../pages/AdminDashboard'
import AdminEmployer from '../pages/AdminEmployer'
import AdminJobs from '../pages/AdminJobs'
import AdminUsers from '../pages/AdminUser'
import AdminCandidate from '../pages/AdminCandidate'
import CandidateDashboard from '../pages/CandidateDashboard'
import UpdateProfile from '../pages/profile/UpdateProfile'
import MainLayout from '../layouts/MainLayout'
import MyJobs from '../pages/MyJobs'
import ChatPage from '../pages/ChatPage'
import AppliedCandidates from '../pages/AppliedCandidates'
import SystemParameter from '../pages/SystemParameter'

export default function AppRoutes() {
  return (
    <MainLayout>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Dashboard />} />

        <Route
          path="/system_parameter"
          element={
            <ProtectedRoute>
              <SystemParameter />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/employer"
          element={
            <ProtectedRoute>
              <AdminEmployer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/jobs"
          element={
            <ProtectedRoute>
              <AdminJobs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/user"
          element={
            <ProtectedRoute>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/candidate"
          element={
            <ProtectedRoute>
              <AdminCandidate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applied_candidates"
          element={
            <ProtectedRoute>
              <AppliedCandidates />
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
          path="/candidate"
          element={
            <ProtectedRoute>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/update_profile"
          element={
            <ProtectedRoute>
              <UpdateProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />


        {/* Optional */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  )
}
