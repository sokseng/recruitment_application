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
  Snackbar,
  Alert,
} from '@mui/material'
import { useState } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useNavigate } from 'react-router-dom'

import api from '../services/api'
import useAuthStore from '../store/useAuthStore'

export default function Topbar() {
  const navigate = useNavigate()

  const {
    access_token,
    setAccessToken,
    clearAccessToken,
  } = useAuthStore()

  const [openLogin, setOpenLogin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState({})
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  /* =====================
     Login
     ===================== */
  const handleLogin = async () => {
    try {
      if (!formData.email) {
        setError({ email: 'Email is required' })
        return
      }

      if (!formData.password) {
        setError({ password: 'Password is required' })
        return
      }

      const res = await api.post('/user/login', {
        email: formData.email.trim(),
        password: formData.password,
      })

      // ✅ save token (zustand + localStorage)
      setAccessToken(res.data.access_token)

      setOpenLogin(false)
      setFormData({ email: '', password: '' })

      // ✅ navigate by role
      switch (res.data.user_type) {
        case 1:
          navigate('/admin')
          break
        case 2:
          navigate('/employer')
          break
        case 3:
          navigate('/candidate')
          break
        default:
          navigate('/')
      }

    } catch (err) {
      setMessage(err.response?.data?.detail || 'Login failed')
      setOpenSnackbar(true)
    }
  }

  /* =====================
     Logout
     ===================== */
  const handleLogout = async () => {
    try {
      await api.post('/user/logout')
    } catch (err) {
      console.warn('Logout API failed, clearing session anyway')
    } finally {
      clearAccessToken()
      navigate('/')
    }
  }

  /* =====================
     Input Change
     ===================== */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError((prev) => ({ ...prev, [name]: '' }))
  }

  return (
    <>
      {/* Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled">
          {message}
        </Alert>
      </Snackbar>

      {/* TOPBAR */}
      <AppBar position="static">
        <Toolbar>
          {/* LEFT */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search jobs..."
              sx={{ bgcolor: 'white', borderRadius: 1, mr: 1 }}
            />
            <Button variant="contained" color="secondary">
              Search
            </Button>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate('/')}
            sx={{ mr: 1 }}
          >
            Home
          </Button>

          {/* AUTH BUTTON */}
          {access_token ? (
            <Button variant="contained" color="secondary" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Button color="inherit" onClick={() => setOpenLogin(true)}>
              Sign In
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* LOGIN MODAL */}
      <Dialog open={openLogin} onClose={() => setOpenLogin(false)}>
        <DialogContent>
          <Card sx={{ width: 320 }}>
            <CardContent>
              <Typography variant="h5" align="center" gutterBottom>
                Login
              </Typography>

              <TextField
                fullWidth
                size="small"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={!!error.email}
                helperText={error.email}
                margin="normal"
              />

              <TextField
                fullWidth
                size="small"
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={!!error.password}
                helperText={error.password}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
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
