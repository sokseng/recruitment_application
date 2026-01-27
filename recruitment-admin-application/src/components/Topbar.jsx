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
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useState } from "react";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import MenuIcon from "@mui/icons-material/Menu";
import Download from "@mui/icons-material/Download";
import Settings from "@mui/icons-material/Settings";
import VpnKey from "@mui/icons-material/VpnKey";
import Logout from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { useTheme, useMediaQuery } from "@mui/material";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";

export default function Topbar() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
  const handleCloseLoginForm = () => {
    setOpenLogin(false);
    setFormData({ email: "", password: "" });
    setError({});
  };
  const [showPassword, setShowPassword] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [openRegisterForm, setopenRegisterForm] = useState(false);
  const handleCloseRegisterForm = () => setopenRegisterForm(false);
  const [severity, setSeverity] = useState("error");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const handleProfileClick = (event) => {
    setProfileAnchor(event.currentTarget);
  };
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [showPass, setShowPass] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const handleProfileClose = () => {
    setProfileAnchor(null);
  };
  const MENU_BY_ROLE = {
    guest: [{ label: "Home", path: "/", icon: <HomeIcon /> }],
    1: [
      { label: "Home", path: "/", icon: <HomeIcon /> },
      { label: "Users", path: "/admin/user", icon: <PeopleIcon /> },
      { label: "Jobs", path: "/admin/jobs", icon: <PersonIcon /> },
      { label: "Employers", path: "/admin/employer", icon: <BusinessIcon /> },
      { label: "Candidates", path: "/admin/candidate", icon: <PersonIcon /> },
    ],
    2: [
      { label: "Home", path: "/", icon: <HomeIcon /> },
      { label: "Candidate", path: "/", icon: <PersonIcon /> },
      { label: "Employer", path: "/employer", icon: <BusinessIcon /> },
    ],
    3: [
      { label: "Home", path: "/", icon: <HomeIcon /> },
      { label: "Profile", path: "/update_profile", icon: <PersonIcon /> },
      { label: "Dashboard", path: "/candidate", icon: <DashboardIcon /> },
      { label: "All Companies", path: "/company", icon: <BusinessIcon /> },
    ],
  };

  const menuItems = access_token
    ? MENU_BY_ROLE[user_type] || []
    : MENU_BY_ROLE.guest;

  const goTo = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  /* =====================
     Login
     ===================== */
  const handleLogin = async (e) => {
    e.preventDefault(); // ⭐️ REQUIRED

    try {
      const res = await api.post("/user/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      // save token
      setAccessToken(res.data.access_token);
      setUserType(res.data.user_type);
      setUserData(res.data);
      setProfileAnchor(null);
      setOpenLogin(false);
      setFormData({ email: "", password: "" });

      // navigate by role
      switch (res.data.user_type) {
        case 1:
          navigate("/admin/employer", { replace: true });
          break;
        case 2:
          navigate("/employer", { replace: true });
          break;
        case 3:
          navigate("/candidate", { replace: true });
          break;
        default:
          navigate("/", { replace: true });
      }
    } catch (err) {
      if (
        err.response &&
        err.response?.status === 404 &&
        err.response?.data?.detail === "Email not found"
      ) {
        setMessage(err.response?.data?.detail);
        setOpenSnackbar(true);
      } else if (
        err.response &&
        err.response?.status === 400 &&
        err.response?.data?.detail === "Invalid password"
      ) {
        setMessage(err.response?.data?.detail);
        setOpenSnackbar(true);
      } else if (
        err.response && 
        err.response?.status === 400 && 
        err.response?.data?.detail === "User is currently disabled!"
      ){
        setMessage(err.response?.data?.detail);
        setOpenSnackbar(true);
        setSeverity('info')
      }
      
      else {
        setMessage(err.response?.data?.detail || "Login failed");
        setOpenSnackbar(true);
      }
    }
  };

  /* =====================
     Logout
     ===================== */
  const handleLogout = async () => {
    try {
      await api.post("/user/logout");
    } catch (err) {
      console.warn("Logout API failed, clearing session anyway");
    } finally {
      clearAccessToken();
      setProfileAnchor(null);
      navigate("/");
    }
  };

  /* =====================
     Input Change
     ===================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError((prev) => ({ ...prev, [name]: "" }));
  };

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
        setOpenSnackbar(true);
        setSeverity("success");
        setMessage("Register Successfully!");
      }
      handleCloseRegisterForm();
    } catch (err) {
      setOpenSnackbar(true);
      setSeverity("error");
      setMessage(err.response?.data?.detail || "Register failed");
    }
  };

  const handleSubmitChangePassword = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const old_password = formData.get("old_password");
    const new_password = formData.get("new_password");
    const confirm_password = formData.get("confirm_password");

    // Basic validation
    if (!old_password || !new_password || !confirm_password) {
      setSeverity("error");
      setMessage("All fields are required");
      setOpenSnackbar(true);
      return;
    }

    if (new_password !== confirm_password) {
      setSeverity("error");
      setMessage("New passwords do not match");
      setOpenSnackbar(true);
      return;
    }

    try {
      await api.post("/user/change-password", {
        old_password,
        new_password,
      });

      setSeverity("success");
      setMessage("Password changed successfully");
      setOpenSnackbar(true);
      setOpenChangePassword(false);
    } catch (err) {
      setSeverity("error");
      setMessage(err.response?.data?.detail || "Failed to change password");
      setOpenSnackbar(true);
    }
  };

  /* =====================
     Drawer Content
     ===================== */
  const drawerContent = (
    <Box
      sx={{
        width: 280,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F6F7F8",
        p: 1,
      }}
    >
      {/* Profile Header */}
      {access_token && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 2,
            mb: 2,
            backgroundColor: "white",
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: "primary.main",
              fontSize: 20,
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            {user_data?.user_data?.user_name
              ? user_data.user_data.user_name.charAt(0).toUpperCase()
              : "?"}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              noWrap
              sx={{ textOverflow: "ellipsis", overflow: "hidden" }}
            >
              {user_data?.user_data?.user_name}
            </Typography>
            <Typography
              variant="body2"
              color="primary.main"
              noWrap
              sx={{ textOverflow: "ellipsis", overflow: "hidden" }}
            >
              {user_data?.user_data?.email}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Scrollable Menu Items */}
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.label}
              onClick={() => goTo(item.path)}
              sx={{
                borderRadius: 2,
                my: 0.5,
                mx: 2,
                transition: "0.3s",
                backgroundColor:
                  location.pathname === item.path ? "primary.main" : "white",
                color:
                  location.pathname === item.path ? "white" : "text.primary",
                boxShadow:
                  location.pathname === item.path
                    ? "0 4px 12px rgba(0,0,0,0.08)"
                    : "0 2px 6px rgba(0,0,0,0.04)",
                "&:hover": {
                  backgroundColor: "primary.light",
                  color: "white",
                  boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color:
                    location.pathname === item.path ? "white" : "primary.main",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}

          {!access_token && (
            <>
              <ListItemButton
                onClick={() => setopenRegisterForm(true)}
                sx={{
                  borderRadius: 2,
                  my: 0.5,
                  mx: 2,
                  backgroundColor: "white",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  transition: "0.3s",
                  "&:hover": {
                    backgroundColor: "primary.light",
                    color: "white",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "primary.main", minWidth: 40 }}>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Sign Up" />
              </ListItemButton>

              <ListItemButton
                onClick={() => setOpenLogin(true)}
                sx={{
                  borderRadius: 2,
                  my: 0.5,
                  mx: 2,
                  backgroundColor: "white",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  transition: "0.3s",
                  "&:hover": {
                    backgroundColor: "primary.light",
                    color: "white",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "primary.main", minWidth: 40 }}>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Login" />
              </ListItemButton>
            </>
          )}

          {access_token && user_data.user_data?.user_type === 3 && (
            <ListItemButton
              onClick={() => console.log("Download CV")}
              sx={{
                borderRadius: 2,
                my: 0.5,
                mx: 2,
                transition: "0.3s",
                backgroundColor:
                  location.pathname === "/download-cv"
                    ? "primary.main"
                    : "white",
                color:
                  location.pathname === "/download-cv"
                    ? "white"
                    : "text.primary",
                boxShadow:
                  location.pathname === "/download-cv"
                    ? "0 4px 12px rgba(0,0,0,0.08)"
                    : "0 2px 6px rgba(0,0,0,0.04)",
                "&:hover": {
                  backgroundColor: "primary.light",
                  color: "white",
                  boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color:
                    location.pathname === "/download-cv"
                      ? "white"
                      : "primary.main",
                }}
              >
                <DownloadIcon />
              </ListItemIcon>
              <ListItemText primary="Download CV Templates" />
            </ListItemButton>
          )}
        </List>
      </Box>

      {/* Logout at bottom */}
      {access_token && (
        <Box sx={{ p: 2, mt: "auto" }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              backgroundColor: "white",
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              transition: "0.3s",
              "&:hover": { backgroundColor: "error.light", color: "white" },
              color: "error.main",
            }}
          >
            <ListItemIcon sx={{ color: "error.main", minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Log out" />
          </ListItemButton>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {/* Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={severity} variant="filled">
          {message}
        </Alert>
      </Snackbar>

      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          background: "#023F6B",
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {/* ☰ Mobile Drawer */}
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)}>
              <MenuIcon
                sx={{
                  color: "white",
                }}
              />
            </IconButton>
          )}

          {/* Logo – shown on both mobile & desktop */}
          <Box
            component="img"
            src="/logo.jpg" // Place your logo in the public folder
            alt="Company Logo"
            sx={{
              height: { xs: 40, sm: 50 },
              width: { xs: 40, sm: 50 },
              objectFit: "cover",
              borderRadius: "2rem",
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          />

          <Box sx={{ flexGrow: 1 }} />

          {/* 📱 Mobile Right Action */}
          {isMobile && access_token && (
            <>
              {/* Profile Avatar & Menu */}
              <IconButton onClick={handleProfileClick} sx={{ p: 0, ml: 1 }}>
                <Avatar>
                  {user_data?.user_data?.user_name
                    ? user_data.user_data?.user_name.charAt(0).toUpperCase()
                    : "?"}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={profileAnchor}
                open={Boolean(profileAnchor)}
                onClose={handleProfileClose}
                PaperProps={{ sx: { width: 280 } }}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      {user_data?.user_data?.user_name
                        ? user_data.user_data?.user_name.charAt(0).toUpperCase()
                        : "?"}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        noWrap
                        sx={{
                          maxWidth: { xs: 150, sm: 250, md: 350 },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {user_data.user_data?.user_name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="primary.main"
                        noWrap
                        sx={{
                          maxWidth: { xs: 150, sm: 250, md: 350 },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {user_data.user_data?.email}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                <MenuItem
                  onClick={() => {
                    navigate("/update_profile");
                    handleProfileClose();
                  }}
                >
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  Update Profile
                </MenuItem>
                {user_data.user_data?.user_type === 3 && (
                  <MenuItem>
                    <ListItemIcon>
                      <Download fontSize="small" />
                    </ListItemIcon>
                    Download CV Templates
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    setOpenChangePassword(true);
                    handleProfileClose();
                  }}
                >
                  <ListItemIcon>
                    <VpnKey fontSize="small" />
                  </ListItemIcon>
                  Change Password
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                  <ListItemIcon>
                    <Logout fontSize="small" color="error" />
                  </ListItemIcon>
                  Log out
                </MenuItem>
              </Menu>
            </>
          )}

          {/* 🖥 Desktop Menu */}
          {!isMobile && (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {menuItems.map((item) => (
                <Button
                  key={item.label}
                  onClick={() => goTo(item.path)}
                  startIcon={item.icon}
                  sx={{
                    fontWeight: 500,
                    color: "white",
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      width: location.pathname === item.path ? "100%" : "0%",
                      height: "2px",
                      bottom: 0,
                      left: 0,
                      backgroundColor: "#00B0FF",
                      transition: "width 0.5s",
                    },
                    "&:hover::after": {
                      width: "100%",
                    },           
                  }}
                >
                  <Box sx={{textTransform: "none"}}>
                    {item.label}
                  </Box>
                </Button>
              ))}

              {access_token ? (
                <>
                  {/* Profile Avatar & Menu */}
                  <IconButton onClick={handleProfileClick} sx={{ p: 0, ml: 1 }}>
                    <Avatar>
                      {user_data?.user_data?.user_name
                        ? user_data?.user_data?.user_name
                            .charAt(0)
                            .toUpperCase()
                        : "?"}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={profileAnchor}
                    open={Boolean(profileAnchor)}
                    onClose={handleProfileClose}
                    PaperProps={{ sx: { width: 280 } }}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                  >
                    <Box
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: "primary.main",
                            fontSize: 18,
                          }}
                        >
                          {user_data?.user_data?.user_name
                            ? user_data.user_data.user_name
                                .charAt(0)
                                .toUpperCase()
                            : "?"}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            noWrap
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {user_data?.user_data?.user_name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="primary.main"
                            noWrap
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {user_data?.user_data?.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                    <MenuItem
                      onClick={() => {
                        navigate("/update_profile");
                        handleProfileClose();
                      }}
                    >
                      <ListItemIcon>
                        <Settings fontSize="small" />
                      </ListItemIcon>
                      Update Profile
                    </MenuItem>
                    {user_data.user_data?.user_type === 3 && (
                      <MenuItem>
                        <ListItemIcon>
                          <Download fontSize="small" />
                        </ListItemIcon>
                        Download CV Templates
                      </MenuItem>
                    )}
                    <MenuItem
                      onClick={() => {
                        setOpenChangePassword(true);
                        handleProfileClose();
                      }}
                    >
                      <ListItemIcon>
                        <VpnKey fontSize="small" />
                      </ListItemIcon>
                      Change Password
                    </MenuItem>
                    <Divider />
                    <MenuItem
                      onClick={handleLogout}
                      sx={{ color: "error.main" }}
                    >
                      <ListItemIcon>
                        <Logout fontSize="small" color="error" />
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
        PaperProps={{
          sx: {
            backgroundColor: "#F6F7F8",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* LOGIN MODAL */}
      <Dialog
        open={openLogin}
        onClose={(event, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") return;
        }}
        maxWidth="xs"
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: 3, // rounded modal corners
            p: 3, // padding inside modal
            boxShadow: 3, // soft shadow
          },
        }}
      >
        <DialogContent>
          <Stack
            spacing={3}
            component="form"
            onSubmit={handleLogin}
            id="login-form"
            alignItems="center"
          >
            {/* Logo */}
            <Box
              component="img"
              src="/logo.jpg"
              alt="Logo"
              sx={{
                width: 80,
                height: 80,
                objectFit: "cover",
                border: "2px solid #1976d2", // MUI primary color border
                borderRadius: "3rem",
                p: 1,
                mb: 1,
                boxShadow: 2,
              }}
            />

            {/* Header */}
            <Box textAlign="center">
              <Typography variant="h6" fontWeight={700}>
                Login Account 🚀
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Join us and get started today
              </Typography>
            </Box>

            {/* Email */}
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
              sx={{ borderRadius: 2 }}
            />

            {/* Password */}
            <TextField
              fullWidth
              size="small"
              label="Password"
              name="password"
              required
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ borderRadius: 2 }}
            />

            {/* Actions */}
            <Stack
              direction="row"
              spacing={1}
              sx={{ width: "100%", mt: 2, justifyContent: "flex-end" }}
            >
              <Button
                onClick={handleCloseLoginForm}
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                type="submit"
                fullWidth
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                Login
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* REGISTER MODAL */}
      <Dialog
        open={openRegisterForm}
        onClose={(event, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") return;
          handleCloseRegisterForm();
        }}
        maxWidth="lg"
        fullScreen={isMobile}
        scroll="paper"
      >
        <DialogContent sx={{ p: { xs: 3, sm: 2 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            alignItems="center"
          >
            {/* -------------------- RIGHT: Register Form -------------------- */}
            <Stack
              component="form"
              onSubmit={handleSubmit}
              id="register-form"
              spacing={1}
              sx={{
                flex: 1,
                width: "100%",
                p: { xs: 0, sm: 1 },
                maxHeight: { sm: "70vh" },
                overflowY: "auto",

                // Custom scrollbar
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#c1c1c1",
                  borderRadius: 8,
                },
              }}
            >
              <Stack alignItems="center">
                <Box
                  component="img"
                  src="/logo.jpg"
                  alt="Logo"
                  alignItems="center"
                  sx={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    border: "2px solid #1976d2", // MUI primary color border
                    borderRadius: "3rem",
                    p: 0.3,
                    boxShadow: 2,
                  }}
                />
              </Stack>

              {/* Form Header */}
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700}>
                  Create Account 🚀
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Join us and get started today
                </Typography>
              </Box>

              {/* -------------------- Row 1: User Type & Username -------------------- */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  size="small"
                  name="user_type"
                  label="User Type"
                  select
                  required
                  defaultValue=""
                  fullWidth
                >
                  <MenuItem value="" disabled>
                    Select User Type
                  </MenuItem>
                  <MenuItem value={2}>Employer</MenuItem>
                  <MenuItem value={3}>Candidate</MenuItem>
                </TextField>

                <TextField
                  size="small"
                  name="user_name"
                  label="Username"
                  required
                  fullWidth
                />
              </Stack>

              {/* -------------------- Row 2: Email & Password -------------------- */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  size="small"
                  name="email"
                  label="Email"
                  type="email"
                  required
                  fullWidth
                />

                <TextField
                  size="small"
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  required
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>

              {/* -------------------- Row 3: Gender & Phone -------------------- */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  size="small"
                  name="gender"
                  label="Gender"
                  select
                  fullWidth
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </TextField>

                <TextField size="small" name="phone" label="Phone" fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                {/* -------------------- Date of Birth -------------------- */}
                <DatePicker
                  label="Date of Birth"
                  format="YYYY-MM-DD"
                  name="date_of_birth"
                  slotProps={{
                    textField: { size: "small", fullWidth: true },
                  }}
                />

                {/* -------------------- Address -------------------- */}
                <TextField
                  size="small"
                  name="address"
                  label="Address"
                  multiline
                  fullWidth
                />
              </Stack>

              {/* -------------------- Form Actions -------------------- */}
              <DialogActions>
                <Button
                  onClick={handleCloseRegisterForm}
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: "none",
                    background: "linear-gradient(135deg, #023F6B, #0A6BA8)",
                  }}
                >
                  Register
                </Button>
              </DialogActions>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openChangePassword}
        onClose={() => setOpenChangePassword(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        scroll="paper"
      >
        <DialogTitle>Change Password</DialogTitle>

        <DialogContent dividers>
          <Stack
            spacing={2}
            component="form"
            onSubmit={handleSubmitChangePassword}
            id="change-password-form"
          >
            <TextField
              size="small"
              label="Old Password"
              name="old_password"
              type={showPass.old ? "text" : "password"}
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
              type={showPass.new ? "text" : "password"}
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
              type={showPass.confirm ? "text" : "password"}
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
          <Button onClick={() => setOpenChangePassword(false)}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            form="change-password-form"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
