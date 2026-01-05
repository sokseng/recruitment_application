import {
  AppBar,
  Toolbar,
  Button,
  TextField,
  Box,
  Dialog,
  DialogContent,
  Card,
  CardContent,
  Typography,
  Divider,
} from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import { useState } from 'react'

export default function Topbar() {
  const [openLogin, setOpenLogin] = useState(false)

  // Open modal
  const handleSignIn = () => {
    setOpenLogin(true)
  }

  // Close modal
  const handleClose = () => {
    setOpenLogin(false)
  }

  // Placeholder login actions
  const handleLogin = () => {
    alert('Login clicked!')
    handleClose()
  }
  const handleGoogleLogin = () => {
    alert('Login with Google clicked!')
    handleClose()
  }

  return (
    <>
      {/* TOPBAR */}
      <AppBar position="static">
        <Toolbar>
          {/* SEARCH – LEFT */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search jobs..."
              variant="outlined"
              sx={{
                bgcolor: 'white',
                borderRadius: 1,
                mr: 1,
              }}
            />
            <Button variant="contained" color="secondary">
              Search
            </Button>
          </Box>

          {/* SPACER */}
          <Box sx={{ flexGrow: 1 }} />

          {/* RIGHT – SIGN IN */}
          <Button color="inherit" onClick={handleSignIn}>
            Sign In
          </Button>
        </Toolbar>
      </AppBar>

      {/* LOGIN MODAL */}
      <Dialog open={openLogin} onClose={handleClose}>
        <DialogContent>
          <Card sx={{ width: 360 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom align="center">
                Login
              </Typography>

              <TextField fullWidth size='small' label="Email" margin="normal" />
              <TextField fullWidth size='small' label="Password" type="password" margin="normal" />

              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 2 }}
                onClick={handleLogin}
              >
                Login
              </Button>

              <Divider sx={{ my: 2 }}>OR</Divider>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleLogin}
              >
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  )
}
