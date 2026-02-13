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
  Collapse,
  Link,
  Chip
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useState, useEffect } from "react";
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
import DownloadIcon from "@mui/icons-material/Download";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { useTheme, useMediaQuery } from "@mui/material";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import {
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { createRoot } from "react-dom/client";
import BlueSidebarModern from '../pages/cv_template/BlueSidebarModern';
import SidebarTechTemplate from '../pages/cv_template/SidebarTechTemplate';
import ClassicSoftwareCV from "../pages/cv_template/ClassicCV";
import { useUnreadStore } from "../store/unreadStore";
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';

export default function Topbar() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const globalUnread = useUnreadStore(state => state.globalCount);

  //const [failedAttempts, setFailedAttempts] = useState(0);
  const [showRobotCheck, setShowRobotCheck] = useState(false);
  const [isHuman, setIsHuman] = useState(false);
  const [robotAnswer, setRobotAnswer] = useState([]);
  const [robotError, setRobotError] = useState(false);

  const robotOptions = [
    { id: 1, label: "🍎 Apple", isCorrect: true },
    { id: 2, label: "🚗 Car", isCorrect: false },
    { id: 3, label: "🍌 Banana", isCorrect: true },
    { id: 4, label: "🐶 Dog", isCorrect: false },
  ];

  useEffect(() => {
    const fetchUnreadData = async () => {
      const unreadData = await api.get("/chat/messages/unread/count");

      const countsByRoom = unreadData.data.count;

      const countsObject = typeof countsByRoom === "number"
        ? { 0: countsByRoom }
        : countsByRoom;

      useUnreadStore.getState().setAllChats(countsObject);

    };

    fetchUnreadData();
  }, []);

  const handleForgotPassword = (e) => {
    e.preventDefault();
    navigate('/forgot_password');
    handleCloseLoginForm();
  };


  const {
    access_token,
    setAccessToken,
    clearAccessToken,
    setUserType,
    user_type,
    setUserData,
    user_data,
  } = useAuthStore();

  // 🔹 Settings menu (AppBar)
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const openSettings = Boolean(settingsAnchor);
  const location = useLocation();
  const [openDrawerSettings, setOpenDrawerSettings] = useState(false);

  const toggleDrawerSettings = () =>
    setOpenDrawerSettings((prev) => !prev);

  // 🔹 is settings active?
  const isSettingsActive = location.pathname.startsWith("/system_parameter");

  const handleOpenSettings = (event) => {
    setSettingsAnchor(event.currentTarget);
  };

  const handleCloseSettings = () => {
    setSettingsAnchor(null);
  };


  const [openLogin, setOpenLogin] = useState(false);
  const handleCloseLoginForm = () => {
    setOpenLogin(false);
    setFormData({ email: "", password: "" });

  };
  const [showPassword, setShowPassword] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [message, setMessage] = useState("");
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
    guest: [
      { label: "Home", path: "/", icon: <HomeIcon /> },
    ],
    1: [
      { label: "Home", path: "/", icon: <HomeIcon /> },
      { label: "Dashboard", path: "/admin/dashboard", icon: <DashboardIcon /> },
      { label: "Chat", path: "/chat", icon: <ChatBubbleIcon /> },
      { label: "Users", path: "/admin/user", icon: <PeopleIcon /> },
      { label: "Jobs", path: "/admin/jobs", icon: <PersonIcon /> },
      { label: "Companies", path: "/admin/employer", icon: <BusinessIcon /> },
      { label: "Candidates", path: "/admin/candidate", icon: <PersonIcon /> },
    ],
    2: [
      { label: "Home", path: "/", icon: <HomeIcon /> },
      { label: "Chat", path: "/chat", icon: <ChatBubbleIcon /> },
      { label: "Applied candidates", path: "/applied_candidates", icon: <PersonIcon /> },
      { label: "Job posts", path: "/employer", icon: <BusinessIcon /> },
    ],
    3: [
      { label: "Home", path: "/", icon: <HomeIcon /> },
      { label: "Chat", path: "/chat", icon: <ChatBubbleIcon /> },
      { label: "Profile", path: "/update_profile", icon: <PersonIcon /> },
      // { label: "Dashboard", path: "/candidate", icon: <DashboardIcon /> },
      { label: "Candidate Apply", path: "/candidate_apply", icon: <BusinessIcon /> },
    ],
  };

  const [openCv, setOpenCv] = useState(false);

  const toggleCv = () => setOpenCv((prev) => !prev);
  const cvTemplates = [
    { name: "Blue Sidebar Modern", id: "blue-sidebar-modern" },
    { name: "Sidebar Tech Template", id: "sidebar-tech-template" },
    { name: "Classic Software CV", id: "classic-software" },
  ];
  const cvTemplateMap = {
    "blue-sidebar-modern": BlueSidebarModern,
    "sidebar-tech-template": SidebarTechTemplate,
    "classic-software": ClassicSoftwareCV,
  };

  const menuItems = access_token ? MENU_BY_ROLE[user_type] || [] : MENU_BY_ROLE.guest;

  const goTo = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleRobotConfirm = () => {
    const correctIds = robotOptions
      .filter(o => o.isCorrect)
      .map(o => o.id)
      .sort();

    const selected = [...robotAnswer].sort();

    const isValid =
      JSON.stringify(correctIds) === JSON.stringify(selected);

    if (!isValid) {
      setRobotError(true);
      return;
    }

    setIsHuman(true);
    setShowRobotCheck(false);
    setRobotAnswer([]);
    setRobotError(false);
  };


  useEffect(() => {
    if (isSettingsActive) {
      setOpenDrawerSettings(true);
    }
  }, [isSettingsActive]);

  /* =====================
     Login
     ===================== */

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // block if robot check not done
    if (showRobotCheck && !isHuman) {
      setMessage("Please complete the security check");
      setSeverity("warning");
      setOpenSnackbar(true);
      return;
    }

    try {
      const res = await api.post("/user/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      // ✅ SUCCESS
      setShowRobotCheck(false);
      setIsHuman(false);
      setRobotAnswer([]);
      setRobotError(false);

      setAccessToken(res.data.access_token);
      setUserType(res.data.user_type);
      setUserData(res.data);
      setProfileAnchor(null);
      setOpenLogin(false);
      setFormData({ email: "", password: "" });

      switch (res.data.user_type) {
        case 1:
          navigate("/admin/dashboard", { replace: true });
          break;
        case 2:
          navigate("/employer", { replace: true });
          break;
        case 3:
          navigate("/update_profile", { replace: true });
          break;
        default:
          navigate("/", { replace: true });
      }

    } catch (err) {

      // BACKEND says: robot check required
      if (err.response?.status === 429) {
        setShowRobotCheck(true);
        setIsHuman(false);
        setMessage(err.response.data.detail);
        setSeverity("warning");
        setOpenSnackbar(true);
        return;
      }

      if (
        err.response?.status === 400 &&
        err.response?.data?.detail === "Invalid password"
      ) {
        setSeverity("error");
        setMessage("Invalid password");
        setOpenSnackbar(true);
        return;
      }

      if (
        err.response?.status === 404 &&
        err.response?.data?.detail === "Email not found"
      ) {
        setSeverity("error");
        setMessage("Email not found");
        setOpenSnackbar(true);
        return;
      }

      setMessage(err.response?.data?.detail || "Login failed");
      setOpenSnackbar(true);
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
      const status = err.response?.status
      const detail = err.response?.data?.detail

      if (status === 400 && detail?.message) {
        setSeverity('info')
        setMessage(detail.message)
        setOpenSnackbar(true)
      } else {
        setSeverity('error')
        setMessage('Failed to create or update user')
        setOpenSnackbar(true)
        console.error(err)
      }
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

  const DownloadCvTemplate = async (template) => {
    try {
      const [candidateRes, profileRes] = await Promise.all([
        api.get("/candidate/me"),
        api.get("/user/profile")
      ]);

      const candidate = candidateRes.data || {};
      const profile = profileRes.data || {};

      const mergedData = { ...candidate, ...profile };

      const TemplateComponent = cvTemplateMap[template.id];
      if (!TemplateComponent) throw new Error("Template not found");

      exportPdfFromComponent(
        TemplateComponent,
        mergedData,
        `cv-${template.id}.pdf`
      );
    } catch (error) {
      console.error("Error downloading CV template:", error);
      setSeverity("error");
      setMessage("Failed to download cv");
      setOpenSnackbar(true);
    }
  };

  const exportPdfFromComponent = (Component, data, filename = "cv.pdf") => {
    // Create a temporary container (not added to DOM)
    const tempDiv = document.createElement("div");

    // Render React component into it
    const root = createRoot(tempDiv);
    root.render(<Component candidate={data} />);

    // Wait a tick to ensure React finishes rendering
    setTimeout(() => {
      html2pdf()
        .set({
          margin: 0,
          filename,
          html2canvas: { scale: 2, useCORS: true },
          pagebreak: { mode: 'avoid-all' },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(tempDiv)
        .save()
        .then(() => {
          root.unmount(); // clean up
          tempDiv.remove();
          console.log("PDF exported successfully");
        })
        .catch(err => console.error("PDF export failed:", err));
    }, 50);
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
        bgcolor: "background.default",
      }}
    >
      {/* ── Profile Header ── */}
      {access_token && (
        <Box
          sx={{
            p: 3,
            position: 'relative',
            overflow: 'hidden',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            // subtle gradient background (very light)
            background: 'linear-gradient(135deg, rgba(245,247,255,0.8) 0%, rgba(255,255,255,0.95) 100%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          {/* Optional: very subtle decorative accent */}
          <Box
            sx={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(33,150,243,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <Stack direction="row" spacing={2.5} alignItems="center">
            {/* Avatar with nice ring effect */}
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                fontSize: 28,
                fontWeight: 700,
                boxShadow: '0 6px 20px rgba(0,0,0,0.14)',
                border: '3px solid',
                borderColor: 'background.paper',
                outline: '2px solid',
                outlineColor: 'primary.light',
                outlineOffset: '-2px',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.06)',
                },
              }}
            >
              {user_data?.user_data?.user_name?.[0]?.toUpperCase() || '?'}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              {/* Name – slightly larger + better weight */}
              <Typography
                variant="h6"
                fontWeight={700}
                noWrap
                sx={{
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                  color: 'text.primary',
                }}
              >
                {user_data?.user_data?.user_name || 'User'}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
                sx={{
                  mt: 0.4,
                  fontWeight: 400,
                  opacity: 0.85,
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    opacity: 1,
                    color: 'text.primary',
                  },
                }}
              >
                {user_data?.user_data?.email || '—'}
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}

      {/* ── Navigation / Menu ── */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", px: 2, py: 2 }}>
        <List disablePadding>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.label}
              onClick={() => goTo(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                mb: 0.75,
                py: 1.4,
                px: 2.5,
                transition: "all 0.2s ease",
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "white",
                  boxShadow: "0 4px 14px rgba(25, 118, 210, 0.25)",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                },
                "&:hover": {
                  bgcolor: "action.hover",
                  transform: "translateX(4px)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 44,
                  color: location.pathname === item.path ? "white" : "primary.main",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItemButton>
          ))}

          {/* ✅ SETTINGS (Admin only) */}
          {access_token && user_type === 1 && (
            <>
              <ListItemButton
                onClick={toggleDrawerSettings}
                selected={isSettingsActive}
                sx={{
                  borderRadius: 2,
                  mb: 0.75,
                  py: 1.4,
                  px: 2.5,
                  transition: "all 0.2s ease",

                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "black",
                    boxShadow: "0 4px 14px rgba(25,118,210,0.25)",
                    "& .MuiListItemIcon-root": {
                      color: "white",
                    },
                  },

                  "&:hover": {
                    bgcolor: "action.hover",
                    transform: "translateX(4px)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 44,
                    color: isSettingsActive ? "black" : "primary.main",
                  }}
                >
                  <Settings />
                </ListItemIcon>

                <ListItemText
                  primary="Settings"
                  primaryTypographyProps={{ fontWeight: 500 }}
                />

                {openDrawerSettings ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>

              <Collapse in={openDrawerSettings} timeout="auto" unmountOnExit>
                <Box sx={{ pl: 3, pr: 2, pb: 0.5 }}>
                  <ListItemButton
                    onClick={() => {
                      goTo("/system_parameter");
                      setOpenDrawerSettings(false);
                    }}
                    selected={location.pathname === "/system_parameter"}
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                      px: 2,

                      "&.Mui-selected": {
                        bgcolor: "primary.lighter",
                        color: "black",
                      },

                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                      <Settings fontSize="small" />
                    </ListItemIcon>

                    <ListItemText primary="System Parameter" />
                  </ListItemButton>
                </Box>
              </Collapse>
            </>
          )}

          {/* ── CV Templates (collapsible) ── */}
          {access_token && user_data.user_data?.user_type === 3 && (
            <>
              <ListItemButton
                onClick={toggleCv}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  py: 1.4,
                  px: 2.5,
                  mt: 2,
                  backgroundColor: openCv ? "action.selected" : "transparent",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ListItemIcon sx={{ color: "primary.main", minWidth: 44 }}>
                  <DownloadIcon />
                </ListItemIcon>
                <ListItemText
                  primary="CV Templates"
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                {openCv ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>

              <Collapse in={openCv} timeout={300}>
                <Box sx={{ pl: 3, pr: 2, pb: 1 }}>
                  {cvTemplates.map((template) => (
                    <ListItemButton
                      key={template.name}
                      onClick={() => DownloadCvTemplate(template)}
                      sx={{
                        borderRadius: 1.5,
                        py: 1.1,
                        px: 2,
                        my: 0.5,
                        color: "text.secondary",
                        fontSize: "0.9rem",
                        "&:hover": {
                          bgcolor: "primary.lighter",
                          color: "primary.main",
                          pl: 3,
                        },
                      }}
                    >
                      {template.name}
                    </ListItemButton>
                  ))}
                </Box>
              </Collapse>
            </>
          )}

          {/* ── Auth actions (when not logged in) ── */}
          {!access_token && (
            <Box sx={{ mt: 1.5 }}>
              <ListItemButton
                onClick={() => setopenRegisterForm(true)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  border: "2px solid",
                  borderColor: "primary.main",
                  color: "primary.main",
                  mb: 1.5,
                  "&:hover": { bgcolor: "primary.lighter" },
                }}
              >
                <ListItemIcon sx={{ color: "primary.main", minWidth: 44 }}>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Sign Up" />
              </ListItemButton>

              <ListItemButton
                onClick={() => setOpenLogin(true)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  border: "2px solid",
                  borderColor: "primary.main",
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: "primary.lighter",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "primary.main", minWidth: 44 }}>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Login" />
              </ListItemButton>
            </Box>
          )}
        </List>
      </Box>

      {/* ── Logout at bottom ── */}
      {access_token && (
        <Box sx={{ px: 2, py: 1, borderTop: "1px solid", borderColor: "divider" }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              py: 1.5,
              color: "error.main",
              "&:hover": {
                bgcolor: "error.lighter",
                color: "error.dark",
              },
            }}
          >
            <ListItemIcon sx={{ color: "error.main", minWidth: 44 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Log out" primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        </Box>
      )}

    </Box>
  );

  return (
    <>
      <Dialog
        open={showRobotCheck}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >

        <DialogTitle sx={{ fontWeight: 600 }}>
          🤖 Security Check
        </DialogTitle>

        <DialogContent>
          <Typography mb={2}>
            Please select <b>all fruits</b> to continue
          </Typography>

          <Stack direction="row" flexWrap="wrap" gap={1}>
            {robotOptions.map(option => {
              const selected = robotAnswer.includes(option.id);

              return (
                <Chip
                  key={option.id}
                  label={option.label}
                  clickable
                  color={selected ? "primary" : "default"}
                  variant={selected ? "filled" : "outlined"}
                  onClick={() => {
                    setRobotError(false);
                    setRobotAnswer(prev =>
                      selected
                        ? prev.filter(id => id !== option.id)
                        : [...prev, option.id]
                    );
                  }}
                  sx={{ fontSize: 16 }}
                />
              );
            })}
          </Stack>

          {robotError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Incorrect selection. Please try again.
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button sx={{ textTransform: "none" }} size="small" variant="outlined" onClick={() => setShowRobotCheck(false)}>
            Cancel
          </Button>
          <Button sx={{ textTransform: "none" }} variant="contained" size="small" onClick={handleRobotConfirm}>
            Verify
          </Button>
        </DialogActions>
      </Dialog>




      {/* Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2500}
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
          background: "white",
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {/* ☰ Mobile Drawer */}
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo – shown on both mobile & desktop */}
          <Box
            sx={{
              display: "flex",
              justifyContent: { xs: "center", sm: "flex-start" },
              width: { xs: "100%", sm: "0" }
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="Company Logo"
              sx={{
                height: 50,
                width: { xs: 120, sm: 155 },
                objectFit: "contain",
                borderRadius: "0.6rem",
                cursor: "pointer",
                p: 0.5
              }}
              onClick={() => navigate("/")}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* 📱 Mobile Right Action */}
          {isMobile && access_token && (
            <>
              {/* Profile Avatar & Menu */}
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <IconButton onClick={() => navigate("/chat")} sx={{ p: 0, ml: 1 }}>
                  <ChatBubbleIcon color="primary" />
                </IconButton>

                {globalUnread > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 15,
                      height: 15,
                      bgcolor: 'red',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: 10,
                    }}
                  >
                    {globalUnread > 9 ? '9+' : globalUnread}
                  </Box>
                )}
              </Box>
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
                MenuListProps={{ disablePadding: true }}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    width: isMobile ? "92vw" : 340,
                    maxWidth: 360,
                    borderRadius: 3,
                    height: "fit-content",
                    background: "rgba(255, 255, 255, 0.98)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
                  },
                }}
              >

                {/* Header */}
                <Box
                  sx={{
                    position: "relative",
                    px: isMobile ? 3 : 4,
                    py: isMobile ? 3 : 3.5,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.22) 0%, transparent 70%)",
                      pointerEvents: "none",
                    }}
                  />
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Avatar
                      sx={{
                        width: isMobile ? 56 : 64,
                        height: isMobile ? 56 : 64,
                        bgcolor: "rgba(255,255,255,0.28)",
                        fontSize: isMobile ? 26 : 32,
                        fontWeight: 700,
                        border: "3px solid rgba(255,255,255,0.55)",
                        boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
                      }}
                    >
                      {user_data?.user_data?.user_name?.[0]?.toUpperCase() || "?"}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        sx={{ lineHeight: 1.2 }}
                        noWrap
                      >
                        {user_data?.user_data?.user_name || "User"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.92, mt: 0.6 }}
                        noWrap
                      >
                        {user_data?.user_data?.email || "user@example.com"}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Menu items */}
                <Box sx={{ py: 1 }}>
                  <MenuItem
                    onClick={() => {
                      navigate("/update_profile");
                      handleProfileClose();
                    }}
                    sx={{
                      py: isMobile ? 2 : 1.6,
                      px: isMobile ? 3 : 4,
                      fontSize: "1rem",
                      fontWeight: 500,
                      "&:hover": {
                        bgcolor: "rgba(102,126,234,0.12)",
                        color: "#667eea",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: "inherit" }}>
                      <Settings fontSize="medium" />
                    </ListItemIcon>
                    Update Profile
                  </MenuItem>

                  {user_data.user_data?.user_type === 3 && (
                    <>
                      <MenuItem
                        onClick={toggleCv}
                        sx={{
                          py: isMobile ? 2 : 1.6,
                          px: isMobile ? 3 : 4,
                          fontSize: "1rem",
                          fontWeight: 500,
                          "&:hover": {
                            bgcolor: "rgba(102,126,234,0.12)",
                            color: "#667eea",
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: "inherit" }}>
                          <Download fontSize="medium" />
                        </ListItemIcon>
                        Download CV Templates
                        <Box sx={{ ml: "auto", opacity: 0.7 }}>
                          {openCv ? <ExpandLess /> : <ExpandMore />}
                        </Box>
                      </MenuItem>

                      <Collapse in={openCv} timeout={280} unmountOnExit>
                        <Box sx={{ bgcolor: "rgba(0,0,0,0.03)", py: 0.5 }}>
                          {cvTemplates.map((template) => (
                            <MenuItem
                              key={template.name}
                              onClick={() => DownloadCvTemplate(template)}
                              sx={{
                                pl: isMobile ? 7 : 9,
                                py: 1.3,
                                fontSize: "0.93rem",
                                color: "text.secondary",
                                "&:hover": {
                                  color: "#667eea",
                                  bgcolor: "rgba(102,126,234,0.08)",
                                },
                              }}
                            >
                              {template.name}
                            </MenuItem>
                          ))}
                        </Box>
                      </Collapse>
                    </>
                  )}

                  <MenuItem
                    onClick={() => {
                      setOpenChangePassword(true);
                      handleProfileClose();
                    }}
                    sx={{
                      py: isMobile ? 2 : 1.6,
                      px: isMobile ? 3 : 4,
                      fontSize: "1rem",
                      fontWeight: 500,
                      "&:hover": {
                        bgcolor: "rgba(102,126,234,0.12)",
                        color: "#667eea",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: "inherit" }}>
                      <VpnKey fontSize="medium" />
                    </ListItemIcon>
                    Change Password
                  </MenuItem>
                </Box>

                <Divider sx={{ borderColor: "rgba(0,0,0,0.12)" }} />

                {/* Logout */}
                <MenuItem
                  onClick={handleLogout}
                  sx={{
                    py: isMobile ? 2.2 : 1.8,
                    px: isMobile ? 3 : 4,
                    fontWeight: 600,
                    color: "#d32f2f",
                    "&:hover": {
                      bgcolor: "rgba(211,47,47,0.09)",
                      color: "#b71c1c",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <Logout fontSize="medium" />
                  </ListItemIcon>
                  Log out
                </MenuItem>
              </Menu>
            </>
          )}

          {/* 🖥 Desktop Menu */}
          {!isMobile && (
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              {menuItems.map((item) => (
                <Button
                  key={item.label}
                  onClick={() => goTo(item.path)}
                  startIcon={item.icon}
                  sx={{
                    fontWeight: 500,
                    color: "teal",
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
                  <Box sx={{ textTransform: "none" }}>
                    {item.path === "/chat" && globalUnread > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 15,
                          height: 15,
                          bgcolor: 'red',
                          color: 'white',
                          borderRadius: '50%',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Typography
                          sx={{ fontSize: 10, mt: 0.25 }}>
                          {globalUnread > 9 ? '9+' : globalUnread}
                        </Typography>
                      </Box>
                    )}
                    {item.label}
                  </Box>
                </Button>
              ))}

              {/* ⚙️ SETTINGS  */}
              {access_token && user_type === 1 && (
                <Button
                  onClick={handleOpenSettings}
                  startIcon={<Settings />}
                  sx={{
                    fontWeight: 500,
                    color: "teal",
                    textTransform: "none",
                    position: "relative",

                    "&::after": {
                      content: '""',
                      position: "absolute",
                      width: isSettingsActive ? "100%" : "0%",
                      height: "2px",
                      bottom: 0,
                      left: 0,
                      backgroundColor: "#00B0FF",
                      transition: "width 0.3s",
                    },
                    "&:hover::after": {
                      width: "100%",
                    },
                  }}
                >
                  Settings
                </Button>
              )}



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
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    MenuListProps={{
                      disablePadding: true,
                    }}
                    PaperProps={{
                      elevation: 0,
                      sx: {
                        width: 340,
                        mt: 1.5,
                        borderRadius: 3,
                        overflow: "hidden",
                        border: "1px solid #e0e0e0",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
                        background: "rgba(255, 255, 255, 0.98)",
                        backdropFilter: "blur(12px)",
                      },
                    }}
                  >

                    {/* Header – vibrant gradient + subtle shine */}
                    <Box
                      sx={{
                        position: "relative",
                        px: 4,
                        py: 3.5,
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        overflow: "hidden",
                      }}
                    >
                      {/* Light radial glow */}
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          background: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.22) 0%, transparent 70%)",
                          pointerEvents: "none",
                        }}
                      />

                      <Stack direction="row" spacing={3} alignItems="center">
                        <Avatar
                          sx={{
                            width: 64,
                            height: 64,
                            bgcolor: "rgba(255,255,255,0.28)",
                            fontSize: 32,
                            fontWeight: 700,
                            border: "3px solid rgba(255,255,255,0.55)",
                            boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
                          }}
                        >
                          {user_data?.user_data?.user_name?.[0]?.toUpperCase() || "?"}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="h5"
                            fontWeight={700}
                            sx={{ lineHeight: 1.2, letterSpacing: "-0.01em" }}
                            noWrap
                          >
                            {user_data?.user_data?.user_name || "User"}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ opacity: 0.92, mt: 0.6, fontWeight: 400 }}
                            noWrap
                          >
                            {user_data?.user_data?.email || "user@example.com"}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    {/* Menu Items */}
                    <Box sx={{ py: 1 }}>
                      <MenuItem
                        onClick={() => { navigate("/update_profile"); handleProfileClose(); }}
                        sx={{
                          py: 1.6,
                          px: 4,
                          fontSize: "1rem",
                          fontWeight: 500,
                          "&:hover": {
                            bgcolor: "rgba(102, 126, 234, 0.12)",
                            color: "#667eea",
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: "inherit" }}>
                          <Settings fontSize="medium" />
                        </ListItemIcon>
                        Update Profile
                      </MenuItem>

                      {user_data.user_data?.user_type === 3 && (
                        <>
                          <MenuItem
                            onClick={toggleCv}
                            sx={{
                              py: 1.6,
                              px: 4,
                              fontSize: "1rem",
                              fontWeight: 500,
                              "&:hover": {
                                bgcolor: "rgba(102, 126, 234, 0.12)",
                                color: "#667eea",
                              },
                            }}
                          >
                            <ListItemIcon sx={{ color: "inherit" }}>
                              <Download fontSize="medium" />
                            </ListItemIcon>
                            Download CV Templates
                            <Box component="span" sx={{ ml: "auto", opacity: 0.7 }}>
                              {openCv ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                            </Box>
                          </MenuItem>

                          <Collapse in={openCv} timeout={280} unmountOnExit>
                            <Box sx={{ bgcolor: "rgba(0,0,0,0.03)", py: 0.5 }}>
                              {cvTemplates.map((template) => (
                                <MenuItem
                                  key={template.name}
                                  onClick={() => DownloadCvTemplate(template)}
                                  sx={{
                                    pl: 9,
                                    py: 1.3,
                                    fontSize: "0.93rem",
                                    color: "text.secondary",
                                    "&:hover": {
                                      color: "#667eea",
                                      bgcolor: "rgba(102,126,234,0.08)",
                                    },
                                  }}
                                >
                                  {template.name}
                                </MenuItem>
                              ))}
                            </Box>
                          </Collapse>
                        </>
                      )}

                      <MenuItem
                        onClick={() => { setOpenChangePassword(true); handleProfileClose(); }}
                        sx={{
                          py: 1.6,
                          px: 4,
                          fontSize: "1rem",
                          fontWeight: 500,
                          "&:hover": {
                            bgcolor: "rgba(102, 126, 234, 0.12)",
                            color: "#667eea",
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: "inherit" }}>
                          <VpnKey fontSize="medium" />
                        </ListItemIcon>
                        Change Password
                      </MenuItem>
                    </Box>

                    <Divider sx={{ borderColor: "rgba(0,0,0,0.12)" }} />

                    {/* Logout */}
                    <MenuItem
                      onClick={handleLogout}
                      sx={{
                        py: 1.8,
                        px: 4,
                        color: "#d32f2f",
                        fontWeight: 600,
                        "&:hover": {
                          bgcolor: "rgba(211, 47, 47, 0.09)",
                          color: "#b71c1c",
                        },
                      }}
                    >
                      <ListItemIcon>
                        <Logout fontSize="medium" sx={{ color: "red" }} />
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
                    sx={{ textTransform: "none" }}
                  >
                    Login
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setopenRegisterForm(true)}
                    sx={{ textTransform: "none" }}
                  >
                    Sign Up
                  </Button>
                </Stack>
              )}
            </Box>
          )}
        </Toolbar>

        <Menu
          anchorEl={settingsAnchor}
          open={openSettings}
          onClose={handleCloseSettings}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              width: 260,
              borderRadius: 2,
              mt: 1,
            },
          }}
        >
          <MenuItem disabled sx={{ fontWeight: 600 }}>
            Settings
          </MenuItem>

          <Divider />

          <MenuItem
            onClick={() => {
              navigate("/system_parameter");
              handleCloseSettings();
            }}
          >
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            System Parameter
          </MenuItem>
        </Menu>


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
          >
            {/* Logo */}
            <Stack alignItems="center">
              <Box
                component="img"
                src="/logo.png"
                alt="Logo"
                sx={{
                  height: 50,
                  width: { xs: 120, sm: 140 },
                  objectFit: "contain",
                  border: "2px solid #1976d2",
                  borderRadius: "0.6rem",
                  boxShadow: 2,
                  cursor: "pointer",
                  p: 0.5
                }}
              />
            </Stack>

            {/* Header */}
            <Box textAlign="start">
              <Typography variant="h7" fontWeight={700}>
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
            <Box
              display="flex"
              justifyContent="flex-end"
              sx={{ mt: 1, mb: 1 }}
            >
              <Link
                type="button"
                component="button"
                variant="body2"
                onClick={handleForgotPassword}
                sx={{
                  color: "#764ba2",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Forgot Password
              </Link>
            </Box>
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
                  src="/logo.png"
                  alt="Logo"
                  alignItems="center"
                  sx={{
                    height: 50,
                    width: { xs: 120, sm: 140 },
                    objectFit: "contain",
                    border: "2px solid #1976d2",
                    borderRadius: "0.6rem",
                    boxShadow: 2,
                    cursor: "pointer",
                    p: 0.5
                  }}
                />
              </Stack>

              {/* Form Header */}
              <Box textAlign="start">
                <Typography variant="h7" fontWeight={700}>
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
