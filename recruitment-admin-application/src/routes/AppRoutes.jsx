import { Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import MainLayout from '../layouts/MainLayout'

export default function AppRoutes() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </MainLayout>
  )
}
