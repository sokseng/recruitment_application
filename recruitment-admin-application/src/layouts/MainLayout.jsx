import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Footer from '../components/Footer';

export default function MainLayout({ children }) {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: '#F4F1F1',
      }}
    >
      <Topbar />
      <Box sx={{ p: isChatPage ? 0 : 1.5 }}>
        {children}
      </Box>
      {!isChatPage && (
        <Footer />
      )}
    </Box>
  );
}
