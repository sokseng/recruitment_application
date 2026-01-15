import { Box } from '@mui/material';
import Topbar from '../components/Topbar';

export default function MainLayout({ children }) {
  return (
    <Box
      sx={{
        height: '100vh',           // ← full viewport height
        display: 'flex',
        flexDirection: 'column',   // vertical stack
        overflow: 'hidden',        // prevent double scrollbar
      }}
    >
      <Topbar />                   {/* assumed fixed or sticky height (usually 64px) */}

      {/* Main content takes remaining space */}
      <Box
        component="main"
        sx={{
          flex: 1,                  // ← grows to fill remaining height
          overflow: 'hidden',       // important: prevents outer scroll
          display: 'flex',          // now we can use flex inside pages
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}