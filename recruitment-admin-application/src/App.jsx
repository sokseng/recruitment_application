import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import useAuthStore from './store/useAuthStore'
import { useGlobalWebSocket } from './hooks/useGlobalWebSocket';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate)
  useGlobalWebSocket();

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
