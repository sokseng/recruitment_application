import { Box } from '@mui/material'
import Topbar from '../components/Topbar'

export default function MainLayout({ children }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <Box sx={{ flexGrow: 1 }}>
        <Topbar />
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
