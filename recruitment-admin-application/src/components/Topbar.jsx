import {
  AppBar,
  Toolbar,
  Button,
  TextField,
  Box,
  Dialog,
  DialogContent,
  Typography,
  Snackbar,
  Alert,
  DialogTitle,
  Stack,
  MenuItem,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  Drawer,
  Avatar,
  Menu,
  ListItemIcon,
  Divider
} from '@mui/material'
import { useState } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import MenuIcon from '@mui/icons-material/Menu'
import Download from '@mui/icons-material/Download'
import Settings from '@mui/icons-material/Settings'
import VpnKey from '@mui/icons-material/VpnKey'
import Logout from '@mui/icons-material/Logout'
import { useNavigate } from 'react-router-dom'
import { useTheme, useMediaQuery } from "@mui/material";
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'

export default function Topbar() {
  const navigate = useNavigate()
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    access_token,
    setAccessToken,
    clearAccessToken,
    setUserType,
    user_type,
    setUserData,
    user_data
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
  const handleCloseRegisterForm = () => setopenRegisterForm(false);
  const [severity, setSeverity] = useState('error')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileAnchor, setProfileAnchor] = useState(null)
  const handleProfileClick = (event) => {
    setProfileAnchor(event.currentTarget)
  }
  const [openChangePassword, setOpenChangePassword] = useState(false)
  const [showPass, setShowPass] = useState({
    old: false,
    new: false,
    confirm: false,
  })
  const handleProfileClose = () => {
    setProfileAnchor(null)
  }
  const MENU_BY_ROLE = {
    guest: [
      { label: 'Home', path: '/' },
      { label: 'All Companies', path: '/' },
      { label: 'Default', path: '/' },
    ],
    1: [
      { label: 'Home', path: '/' },
      { label: 'Dashboard', path: '/' },
      { label: 'Users', path: '/' },
      { label: 'Employers', path: '/' },
      { label: 'Candidates', path: '/' },
      { label: 'All Companies', path: '/' },
    ],
    2: [
      { label: 'Home', path: '/' },
      { label: 'Dashboard', path: '/' },
      { label: 'Candidate', path: '/' },
      { label: 'Employer', path: '/employer' },
    ],
    3: [
      { label: 'Home', path: '/' },
      { label: 'Profile', path: '/' },
      { label: 'Candidate', path: '/' },
    ],
  }

  const menuItems = access_token ? MENU_BY_ROLE[user_type] || [] : MENU_BY_ROLE.guest

  const goTo = (path) => {
    navigate(path)
    setDrawerOpen(false)
  }

  /* =====================
     Login
     ===================== */
  const handleLogin = async (e) => {
    e.preventDefault() // ⭐️ REQUIRED

    try {
      const res = await api.post('/user/login', {
        email: formData.email.trim(),
        password: formData.password,
      })

      // save token
      setAccessToken(res.data.access_token)
      setUserType(res.data.user_type)
      setUserData(res.data)
      setProfileAnchor(null)
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
      if (err.response && err.response?.status === 404 && err.response?.data?.detail === "Email not found") {
        setMessage(err.response?.data?.detail)
        setOpenSnackbar(true)
      } else if (err.response && err.response?.status === 400 && err.response?.data?.detail === "Invalid password") {
        setMessage(err.response?.data?.detail)
        setOpenSnackbar(true)
      } else {
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
      setProfileAnchor(null)
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

  const handleSubmitChangePassword = async (e) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)

    const old_password = formData.get('old_password')
    const new_password = formData.get('new_password')
    const confirm_password = formData.get('confirm_password')

    // Basic validation
    if (!old_password || !new_password || !confirm_password) {
      setSeverity('error')
      setMessage('All fields are required')
      setOpenSnackbar(true)
      return
    }

    if (new_password !== confirm_password) {
      setSeverity('error')
      setMessage('New passwords do not match')
      setOpenSnackbar(true)
      return
    }

    try {
      await api.post('/user/change-password', {
        old_password,
        new_password,
      })

      setSeverity('success')
      setMessage('Password changed successfully')
      setOpenSnackbar(true)
      setOpenChangePassword(false)
    } catch (err) {
      setSeverity('error')
      setMessage(err.response?.data?.detail || 'Failed to change password')
      setOpenSnackbar(true)
    }
  }

  /* =====================
     Drawer Content
     ===================== */
  const drawerContent = (
    <Box sx={{ width: 250 }}>
      <List>
        {menuItems.map((item) => (
          <ListItemButton key={item.label} onClick={() => goTo(item.path)}>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}




        {!access_token && (
          <>
            <ListItemButton onClick={() => setopenRegisterForm(true)}>
              <ListItemText primary="Sign Up" />
            </ListItemButton>
            <ListItemButton onClick={() => setOpenLogin(true)}>
              <ListItemText primary="Login" />
            </ListItemButton>
          </>
        )}

        {access_token && (
          <ListItemButton onClick={handleLogout}>
            <ListItemText primary="Logout" />
          </ListItemButton>
        )}
      </List>
    </Box>
  )

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

      <AppBar position="sticky" color="inherit" elevation={1}>
        <Toolbar sx={{ gap: 1 }}>

          {/* ☰ Mobile Drawer */}
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo – shown on both mobile & desktop */}
          <Box
            component="img"
            src="/LOGO.png"  // Place your logo in the public folder
            alt="Company Logo"
            sx={{
              height: { xs: 36, sm: 44 },
              width: 'auto',
            }}
          />


          <Box sx={{ flexGrow: 1 }} />

          {/* 📱 Mobile Right Action */}
          {isMobile && access_token && (
            <>
              {/* Profile Avatar & Menu */}
              <IconButton onClick={handleProfileClick} sx={{ p: 0, ml: 1 }}>
                <Avatar>{user_data?.user_name ? user_data.user_name.charAt(0).toUpperCase() : '?'}</Avatar>
              </IconButton>
              <Menu
                anchorEl={profileAnchor}
                open={Boolean(profileAnchor)}
                onClose={handleProfileClose}
                PaperProps={{ sx: { width: 280 } }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {user_data.user_name}
                  </Typography>
                  <Typography variant="body2" color="primary.main">
                    {user_data.email}
                  </Typography>
                </Box>
                <MenuItem
                  onClick={() => {
                    navigate('/update-profile')
                    handleProfileClose()
                  }}
                >
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  Update Profile
                </MenuItem>
                <MenuItem>
                  <ListItemIcon>
                    <Download fontSize="small" />
                  </ListItemIcon>
                  Download CV Templates
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setOpenChangePassword(true)
                    handleProfileClose()
                  }}
                >
                  <ListItemIcon>
                    <VpnKey fontSize="small" />
                  </ListItemIcon>
                  Change Password
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <ListItemIcon>
                    <Logout fontSize="small" color='error' />
                  </ListItemIcon>
                  Log out
                </MenuItem>
              </Menu>
            </>
          )}




          {/* 🖥 Desktop Menu */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {menuItems.map((item) => (
                <Button
                  key={item.label}
                  onClick={() => goTo(item.path)}
                  sx={{
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    color:
                      location.pathname === item.path
                        ? 'primary.main'
                        : 'inherit',
                  }}
                >
                  {item.label}
                </Button>
              ))}

              {access_token ? (
                <>
                  {/* Profile Avatar & Menu */}
                  <IconButton onClick={handleProfileClick} sx={{ p: 0, ml: 1 }}>
                    <Avatar>{user_data?.user_name ? user_data.user_name.charAt(0).toUpperCase() : '?'}</Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={profileAnchor}
                    open={Boolean(profileAnchor)}
                    onClose={handleProfileClose}
                    PaperProps={{ sx: { width: 280 } }}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {user_data.user_name}
                      </Typography>
                      <Typography variant="body2" color="primary.main">
                        {user_data.email}
                      </Typography>
                    </Box>
                    <MenuItem
                      onClick={() => {
                        navigate('/update-profile')
                        handleProfileClose()
                      }}
                    >
                      <ListItemIcon>
                        <Settings fontSize="small" />
                      </ListItemIcon>
                      Update Profile
                    </MenuItem>
                    <MenuItem>
                      <ListItemIcon>
                        <Download fontSize="small" />
                      </ListItemIcon>
                      Download CV Templates
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setOpenChangePassword(true)
                        handleProfileClose()
                      }}
                    >
                      <ListItemIcon>
                        <VpnKey fontSize="small" />
                      </ListItemIcon>
                      Change Password
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                      <ListItemIcon>
                        <Logout fontSize="small" color='error' />
                      </ListItemIcon>
                      Log out
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setOpenLogin(true)}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setopenRegisterForm(true)}
                  >
                    Sign Up
                  </Button>
                </Stack>
              )}
            </Box>
          )}

        </Toolbar>
      </AppBar>

      {/* DRAWER */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        anchor="left"
      >
        {drawerContent}
      </Drawer>

      {/* LOGIN MODAL */}
      <Dialog
        open={openLogin}
        onClose={() => setOpenLogin(false)}
        maxWidth="xs"
        fullScreen={isMobile}
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
                      type="button"   // ⭐️ prevents accidental submit
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
      <Dialog open={openRegisterForm} onClose={handleCloseRegisterForm} maxWidth="xs" fullWidth fullScreen={isMobile} scroll="paper">
        <DialogTitle>Sign Up</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} component="form" onSubmit={handleSubmit} id="register-form">
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
          <Button type="submit" variant="contained" disableElevation form="register-form">
            Register
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openChangePassword}
        onClose={() => setOpenChangePassword(false)}
        maxWidth="xs"
        fullWidth fullScreen={isMobile} scroll="paper"
      >
        <DialogTitle>Change Password</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} component="form" onSubmit={handleSubmitChangePassword} id="change-password-form">
            <TextField
              size="small"
              label="Old Password"
              name="old_password"
              type={showPass.old ? 'text' : 'password'}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowPass((p) => ({ ...p, old: !p.old }))
                      }
                    >
                      {showPass.old ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              fullWidth
            />

            <TextField
              size="small"
              label="New Password"
              name="new_password"
              type={showPass.new ? 'text' : 'password'}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowPass((p) => ({ ...p, new: !p.new }))
                      }
                    >
                      {showPass.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              fullWidth
            />

            <TextField
              size="small"
              label="Confirm New Password"
              name="confirm_password"
              type={showPass.confirm ? 'text' : 'password'}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowPass((p) => ({ ...p, confirm: !p.confirm }))
                      }
                    >
                      {showPass.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ borderTop: 1, borderColor: "divider" }}>
          <Button onClick={() => setOpenChangePassword(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disableElevation form="change-password-form">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}