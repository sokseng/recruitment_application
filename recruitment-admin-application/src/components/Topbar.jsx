// Topbar.jsx
import {
  AppBar,
  Toolbar,
  Button,
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
  Divider,
  IconButton,
} from '@mui/material';
import { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import Download from '@mui/icons-material/Download';
import Settings from '@mui/icons-material/Settings';
import VpnKey from '@mui/icons-material/VpnKey';
import Logout from '@mui/icons-material/Logout';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { useTheme, useMediaQuery } from '@mui/material';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';

export default function Topbar() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    access_token,
    setAccessToken,
    clearAccessToken,
    setUserType,
    user_type,
    setUserData,
    user_data,
  } = useAuthStore();

  const [openLogin, setOpenLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('error');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [showPass, setShowPass] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [openRegisterForm, setopenRegisterForm] = useState(false);
  const handleCloseRegisterForm = () => setopenRegisterForm(false);

  // You can add these back if you still need formData / error state for login/register
  // const [formData, setFormData] = useState({ email: '', password: '' });
  // const [error, setError] = useState({});

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
  };

  const menuItems = access_token ? MENU_BY_ROLE[user_type] || [] : MENU_BY_ROLE.guest;

  const goTo = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleProfileClick = (event) => setProfileAnchor(event.currentTarget);
  const handleProfileClose = () => setProfileAnchor(null);

  const handleLogout = async () => {
    try {
      await api.post('/user/logout');
    } catch (err) {
      console.warn('Logout API failed, clearing session anyway');
    } finally {
      clearAccessToken();
      setProfileAnchor(null);
      navigate('/');
    }
  };

  // ────────────────────────────────────────────────
  //   LOGIN HANDLER (example – adjust as needed)
  // ────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    // Add your login logic here (same as before)
    // For now just closing as placeholder
    setOpenLogin(false);
    setOpenSnackbar(true);
    setSeverity('success');
    setMessage('Login simulation – implement actual logic');
  };

  // ────────────────────────────────────────────────
  //   REGISTER HANDLER (example stub)
  // ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Add your register logic here
    setopenRegisterForm(false);
    setOpenSnackbar(true);
    setSeverity('success');
    setMessage('Registration simulation – implement actual logic');
  };

  // ────────────────────────────────────────────────
  //   CHANGE PASSWORD HANDLER (example stub)
  // ────────────────────────────────────────────────
  const handleSubmitChangePassword = async (e) => {
    e.preventDefault();
    // Add your change password logic here
    setOpenChangePassword(false);
    setOpenSnackbar(true);
    setSeverity('success');
    setMessage('Password change simulation – implement actual logic');
  };

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
  );

  return (
    <>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={severity} variant="filled">
          {message}
        </Alert>
      </Snackbar>

      <AppBar position="sticky" color="inherit" elevation={1}>
        <Toolbar sx={{ gap: 2, justifyContent: 'space-between' }}>
          {/* Left: Mobile menu + Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(true)} edge="start">
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
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop: Menu items + Auth buttons / Profile */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              {menuItems.map((item) => (
                <Button
                  key={item.label}
                  onClick={() => goTo(item.path)}
                  sx={{
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    color: location.pathname === item.path ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.label}
                </Button>
              ))}

              {access_token ? (
                <>
                  <IconButton onClick={handleProfileClick} sx={{ p: 0, ml: 1 }}>
                    <Avatar sx={{ width: 38, height: 38 }}>
                      {user_data?.user_name?.charAt(0)?.toUpperCase() || '?'}
                    </Avatar>
                  </IconButton>

                  <Menu
                    anchorEl={profileAnchor}
                    open={Boolean(profileAnchor)}
                    onClose={handleProfileClose}
                    PaperProps={{ sx: { width: 280 } }}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {user_data?.user_name || 'User'}
                      </Typography>
                      <Typography variant="body2" color="primary.main">
                        {user_data?.email || 'email@example.com'}
                      </Typography>
                    </Box>

                    <MenuItem>
                      <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
                      Update Profile
                    </MenuItem>

                    <MenuItem>
                      <ListItemIcon><Download fontSize="small" /></ListItemIcon>
                      Download CV Templates
                    </MenuItem>

                    <MenuItem onClick={() => { setOpenChangePassword(true); handleProfileClose(); }}>
                      <ListItemIcon><VpnKey fontSize="small" /></ListItemIcon>
                      Change Password
                    </MenuItem>

                    <Divider />

                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                      <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
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

          {/* Mobile: Profile avatar (if logged in) */}
          {isMobile && access_token && (
            <IconButton onClick={handleProfileClick} sx={{ p: 0 }}>
              <Avatar sx={{ width: 36, height: 36 }}>
                {user_data?.user_name?.charAt(0)?.toUpperCase() || '?'}
              </Avatar>
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* ──────────────── DRAWER (mobile) ──────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        anchor="left"
      >
        {drawerContent}
      </Drawer>

      {/* ──────────────── LOGIN DIALOG ──────────────── */}
      <Dialog
        open={openLogin}
        onClose={() => setOpenLogin(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Login</DialogTitle>
        <DialogContent>
          {/* Add your login form fields here */}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography color="text.secondary">Implement login form</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLogin(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleLogin}>Login</Button>
        </DialogActions>
      </Dialog>

      {/* ──────────────── REGISTER DIALOG ──────────────── */}
      <Dialog
        open={openRegisterForm}
        onClose={handleCloseRegisterForm}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Sign Up</DialogTitle>
        <DialogContent>
          {/* Add your register form fields here */}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography color="text.secondary">Implement registration form</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRegisterForm}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Register</Button>
        </DialogActions>
      </Dialog>

      {/* ──────────────── CHANGE PASSWORD DIALOG ──────────────── */}
      <Dialog
        open={openChangePassword}
        onClose={() => setOpenChangePassword(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {/* Add password change fields here */}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography color="text.secondary">Implement change password form</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChangePassword(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitChangePassword}>
            Update Password
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}