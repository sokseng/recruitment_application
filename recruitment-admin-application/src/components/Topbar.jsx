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
} from '@mui/material'
import { useState } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'


export default function Topbar() {
  const [openLogin, setOpenLogin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev)
  }


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
          <Card sx={{ width: 310 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom align="center">
                Login
              </Typography>

              <TextField fullWidth size='small' label="Email" margin="normal" />
              <TextField
                fullWidth
                size="small"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleTogglePassword} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />


              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 2 }}
                onClick={handleLogin}
              >
                Login
              </Button>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  )
}
