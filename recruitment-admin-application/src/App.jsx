import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useGlobalWebSocket } from './hooks/useGlobalWebSocket';
import AppRoutes from './routes/AppRoutes';
import useAuthStore from './store/useAuthStore';

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
