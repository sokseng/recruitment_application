import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

export default function ProtectedRoute({ children }) {
  const { access_token, hydrated } = useAuthStore()

  // ⏳ Wait until hydration finishes
  if (!hydrated) {
    return null // or loading spinner
  }

  // ❌ No token → login
  if (!access_token) {
    return <Navigate to="/" replace />
  }

  // ✅ Token exists
  return children
}
