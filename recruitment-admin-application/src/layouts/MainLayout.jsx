import { Box } from '@mui/material';
import Topbar from '../components/Topbar';

export default function MainLayout({ children }) {
  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#F4F1F1', }}>
      <Topbar />
      <Box sx={{ p: 2 }}>
        {children}
      </Box>
    </Box>
  );
}