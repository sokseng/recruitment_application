import { Box } from '@mui/material';
import Topbar from '../components/Topbar';

export default function MainLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', backgroundColor: "#F6F7F8", height: "100vh" }}>
      <Box sx={{ flexGrow: 1 }}>
        <Topbar />
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}