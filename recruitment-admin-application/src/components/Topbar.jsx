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
  DialogTitle,
  Stack,
  MenuItem,
  DialogActions
} from '@mui/material'
import { useState } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useNavigate } from 'react-router-dom'
import { useTheme, useMediaQuery } from "@mui/material";
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'

export default function Topbar() {
  const navigate = useNavigate()
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

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
  const [openRegisterForm, setopenRegisterForm] = useState(false);
  const handleOpenRegisterForm = () => setopenRegisterForm(true);
  const handleCloseRegisterForm = () => setopenRegisterForm(false);
  const [severity, setSeverity] = useState('error')

  /* =====================
     Login
     ===================== */
  const handleLogin = async (e) => {
    e.preventDefault() // ⭐ REQUIRED

    try {
      const res = await api.post('/user/login', {
        email: formData.email.trim(),
        password: formData.password,
      })

      // save token
      setAccessToken(res.data.access_token)

      setOpenLogin(false)
      setFormData({ email: '', password: '' })

      // navigate by role
      switch (res.data.user_type) {
        case 1:
          navigate('/admin', { replace: true })
          break
        case 2:
          navigate('/employer', { replace: true })
          break
        case 3:
          navigate('/candidate', { replace: true })
          break
        default:
          navigate('/', { replace: true })
      }
    } catch (err) {
      if(err.response && err.response?.status === 404 && err.response?.data?.detail === "Email not found") {
        setMessage(err.response?.data?.detail)
        setOpenSnackbar(true)
      }else if(err.response && err.response?.status === 400 && err.response?.data?.detail === "Invalid password"){
        setMessage(err.response?.data?.detail)
        setOpenSnackbar(true)
      }else{
        setMessage(err.response?.data?.detail || 'Login failed')
        setOpenSnackbar(true)
      }
      
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload = {
      user_name: formData.get("user_name"),
      email: formData.get("email"),
      password: formData.get("password"),
      user_type: Number(formData.get("user_type")),
      gender: formData.get("gender") || null,
      phone: formData.get("phone") || null,
      date_of_birth: formData.get("date_of_birth") || null,
      address: formData.get("address") || null,
    };

    try {
      const res = await api.post("/user/", payload);
      if (res.status == 200) {
        setOpenSnackbar(true)
        setSeverity("success")
        setMessage('Register Successfully!')
      }
      handleCloseRegisterForm();
    } catch (err) {
      setOpenSnackbar(true)
      setSeverity("error")
      setMessage(err.response?.data?.detail || 'Register failed')
    }
  };

  return (
    <>
      {/* Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={severity} variant="filled">
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
            <>
              <Button color="inherit" onClick={handleOpenRegisterForm}>
                Sign Up
              </Button>
              <Button color="inherit" onClick={() => setOpenLogin(true)}>
                Sign In
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* LOGIN MODAL */}
      <Dialog
        open={openLogin}
        onClose={() => setOpenLogin(false)}
        maxWidth="xs"
        fullScreen={fullScreen}
        scroll="paper"
      >
        <DialogContent>
          <Stack
            spacing={2}
            component="form"
            onSubmit={handleLogin}
            id="login-form"
          >
            <Typography variant="h5" align="center" gutterBottom>
              Login
            </Typography>

            <TextField
              fullWidth
              size="small"
              label="Email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              margin="normal"
            />

            <TextField
              fullWidth
              size="small"
              label="Password"
              name="password"
              required
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"   // ⭐ prevents accidental submit
                      onClick={() => setShowPassword(!showPassword)}
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
              type="submit"
              sx={{ mt: 2 }}
            >
              Login
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>


      {/* REGISTER MODAL */}
      <Dialog open={openRegisterForm} onClose={handleCloseRegisterForm} maxWidth="xs" fullWidth fullScreen={fullScreen} scroll="paper">
        <DialogTitle>Sign Up</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} component="form" onSubmit={handleSubmit} id="register-form">
            <TextField size="small" name="user_name" label="Username" required />
            <TextField size="small" name="email" label="Email" type="email" required />
            <TextField
              size="small"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              required
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

            <TextField
              size="small"
              name="user_type"
              label="User Type"
              select
              required
              defaultValue=""
            >
              <MenuItem value="" disabled>
                Select User Type
              </MenuItem>
              <MenuItem value={2}>Employer</MenuItem>
              <MenuItem value={3}>Candidate</MenuItem>
            </TextField>

            <TextField
              size="small"
              name="gender"
              label="Gender"
              select
              required
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </TextField>

            <TextField size="small" name="phone" label="Phone" />
            <TextField
              size="small"
              name="date_of_birth"
              label="Date of Birth"
              type="date"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              size="small"
              name="address"
              label="Address"
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: "divider" }}>
          <Button onClick={handleCloseRegisterForm}>Cancel</Button>
          <Button type="submit" variant="contained" form="register-form">
            Register
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
