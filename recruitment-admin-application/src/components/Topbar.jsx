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
  Alert
} from '@mui/material'
import { useState } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { useNavigate } from 'react-router-dom'


export default function Topbar() {
  const setGlobalToken = useAuthStore((state) => state.setAccessToken)
  const [openLogin, setOpenLogin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState({})
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate()

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
  const handleLogin = async () => {
    try {
      debugger
      if (formData.email === '') {
        setError({ email: 'Email is required' });
        return
      }

      if (formData.password === '') {
        setError({ password: 'Password is required' });
        return
      }

      const res = await api.post('/user/login', {
        email: formData.email,
        password: formData.password
      })

      if (res.status === 200) {

        // store token in global state
        setGlobalToken(res.data.access_token)

        localStorage.setItem('access_token', res.data.access_token)
        handleClose()
        if(res.data.user_type === 1) {
          navigate('/admin');
        }else if(res.data.user_type === 2) {
          navigate('/employer');
        }
        else if(res.data.user_type === 3) {
          navigate('/candidate');
        }
        
      } else {
        setOpenSnackbar(true)
        setMessage('Login failed')
      }
    } catch (err) {
      if (err.response && err.response.status === 404 && err.response.data.detail === "Email not found") {
        setOpenSnackbar(true)
        setMessage(err.response.data.detail)
      } else if (err.response && err.response.status === 400 && err.response.data.detail === "Invalid password") {
        setOpenSnackbar(true)
        setMessage(err.response.data.detail)
      } else {
        console.error(err)
      }

    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;   //get field name + value
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    //clear only this field’s error
    setError((prev) => ({
      ...prev,
      [name]: "",
    }));
  }

  return (
    <>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={1500}
        onClose={() => setOpenSnackbar(false)}
        message={message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}

      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>


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

              <TextField
                fullWidth
                size="small"
                required
                error={!!error.email}
                name="email"
                label="Email"
                margin="normal"
                value={formData.email}
                onChange={handleChange}
                helperText={error.email}
              />

              <TextField
                fullWidth
                size="small"
                label="Password"
                name="password"
                required
                error={!!error.password}
                type={showPassword ? 'text' : 'password'}
                margin="normal"
                helperText={error.password}
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                      >
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
