// Topbar.jsx
import {
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import BusinessIcon from "@mui/icons-material/Business";
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import DashboardIcon from "@mui/icons-material/Dashboard";
import { default as Download, default as DownloadIcon } from "@mui/icons-material/Download";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import HomeIcon from "@mui/icons-material/Home";
import { default as Logout, default as LogoutIcon } from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import Settings from "@mui/icons-material/Settings";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import VpnKey from "@mui/icons-material/VpnKey";
import WorkIcon from "@mui/icons-material/Work";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { DatePicker } from "@mui/x-date-pickers";
import html2pdf from "html2pdf.js";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from "react-router-dom";
import BlueSidebarModern from '../pages/cv_template/BlueSidebarModern';
import ClassicSoftwareCV from "../pages/cv_template/ClassicCV";
import SidebarTechTemplate from '../pages/cv_template/SidebarTechTemplate';
import api from "../services/api";
import { useUnreadStore } from "../store/unreadStore";
import useAuthStore from "../store/useAuthStore";
import LanguageSwitcher from './LanguageSwitcher';
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export default function Topbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const globalUnread = useUnreadStore(state => state.globalCount);

  const [showRobotCheck, setShowRobotCheck] = useState(false);
  const [isHuman, setIsHuman] = useState(false);
  const [robotAnswer, setRobotAnswer] = useState([]);
  const [robotError, setRobotError] = useState(false);
  const [robotOptions, setRobotOptions] = useState([]);
  const [robotType, setRobotType] = useState("");

  const ROBOT_POOL = [
    // 🍎 Fruits
    { label: "🍎 Apple", type: "fruit" },
    { label: "🍌 Banana", type: "fruit" },
    { label: "🍇 Grape", type: "fruit" },
    { label: "🍊 Orange", type: "fruit" },
    { label: "🍓 Strawberry", type: "fruit" },
    { label: "🍍 Pineapple", type: "fruit" },
    { label: "🥭 Mango", type: "fruit" },
    { label: "🍉 Watermelon", type: "fruit" },
    { label: "🍒 Cherry", type: "fruit" },
    { label: "🥝 Kiwi", type: "fruit" },

    // 🐶 Animals
    { label: "🐶 Dog", type: "animal" },
    { label: "🐱 Cat", type: "animal" },
    { label: "🐭 Mouse", type: "animal" },
    { label: "🐰 Rabbit", type: "animal" },
    { label: "🐼 Panda", type: "animal" },
    { label: "🦁 Lion", type: "animal" },
    { label: "🐯 Tiger", type: "animal" },
    { label: "🐵 Monkey", type: "animal" },

    // 🚗 Vehicles
    { label: "🚗 Car", type: "vehicle" },
    { label: "🚕 Taxi", type: "vehicle" },
    { label: "🚙 SUV", type: "vehicle" },
    { label: "🚌 Bus", type: "vehicle" },
    { label: "🏍️ Motorcycle", type: "vehicle" },
    { label: "🚲 Bicycle", type: "vehicle" },
    { label: "✈️ Plane", type: "vehicle" },
    { label: "🚀 Rocket", type: "vehicle" },

    // 📱 Electronics
    { label: "📱 Phone", type: "electronics" },
    { label: "💻 Laptop", type: "electronics" },
    { label: "⌚ Watch", type: "electronics" },
    { label: "📺 TV", type: "electronics" },
  ];

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

  const profileUrl = `${import.meta.env.VITE_API_BASE_URL}/uploads/user/profile/${user_data?.user_data?.profile_image}`

  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const openSettings = Boolean(settingsAnchor);
  const location = useLocation();
  const [openDrawerSettings, setOpenDrawerSettings] = useState(false);

  const toggleDrawerSettings = () =>
    setOpenDrawerSettings((prev) => !prev);

  const isSettingsActive = location.pathname.startsWith("/system_parameter");

  const [managementAnchor, setManagementAnchor] = useState(null);
  const openManagement = Boolean(managementAnchor);
  const [openDrawerManagement, setOpenDrawerManagement] = useState(false);

  const toggleDrawerManagement = () =>
    setOpenDrawerManagement((prev) => !prev);

  const isManagementActive =
    location.pathname.startsWith("/admin/user") ||
    location.pathname.startsWith("/admin/jobs") ||
    location.pathname.startsWith("/admin/employer") ||
    location.pathname.startsWith("/admin/candidate") ||
    location.pathname.startsWith("/audit");

  const handleOpenManagement = (event) => {
    setManagementAnchor(event.currentTarget);
  };

  const handleCloseManagement = () => {
    setManagementAnchor(null);
  };

  const MANAGEMENT_ITEMS = [
    { label: t('users'), path: "/admin/user", icon: <PeopleIcon fontSize="small" /> },
    { label: t('jobs'), path: "/admin/jobs", icon: <WorkIcon fontSize="small" /> },
    { label: t('companies'), path: "/admin/employer", icon: <BusinessIcon fontSize="small" /> },
    { label: t('candidates'), path: "/admin/candidate", icon: <PersonIcon fontSize="small" /> },
    { label: t('audit'), path: "/audit", icon: <FactCheckIcon fontSize="small" /> },
  ];

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
      { label: t('home'), path: "/", icon: <HomeIcon /> },
    ],
    1: [
      { label: t('home'), path: "/", icon: <HomeIcon /> },
      { label: t('dashboard'), path: "/admin/dashboard", icon: <DashboardIcon /> },
      { label: t('chat'), path: "/chat", icon: <ChatBubbleIcon /> },
    ],
    2: [
      { label: t('home'), path: "/", icon: <HomeIcon /> },
      { label: t('chat'), path: "/chat", icon: <ChatBubbleIcon /> },
      { label: t('applied_candidates'), path: "/applied_candidates", icon: <PersonIcon /> },
      { label: t('job_posts'), path: "/employer", icon: <BusinessIcon /> },
    ],
    3: [
      { label: t('home'), path: "/", icon: <HomeIcon /> },
      { label: t('chat'), path: "/chat", icon: <ChatBubbleIcon /> },
      { label: t('update_profile'), path: "/update_profile", icon: <PersonIcon /> },
      { label: t('candidate_apply'), path: "/candidate_apply", icon: <BusinessIcon /> },
    ],
  };

  const [openCv, setOpenCv] = useState(false);

  const toggleCv = () => setOpenCv((prev) => !prev);
  const cvTemplates = [
    { name: t('blue_sidebar_modern'), id: "blue-sidebar-modern" },
    { name: t('sidebar_tech_template'), id: "sidebar-tech-template" },
    { name: t('classic_software_cv'), id: "classic-software" },
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

  // Map readable names to your ROBOT_POOL types
  const TYPE_MAP = {
    [t('fruits')]: "fruit",
    [t('animals')]: "animal",
    [t('vehicles')]: "vehicle",
    [t('electronics')]: "electronics",
  };

  const generateRobotOptions = () => {
    const readableTypes = Object.keys(TYPE_MAP);

    // Pick a random readable type
    const randomReadableType =
      readableTypes[Math.floor(Math.random() * readableTypes.length)];

    // Get the actual type in ROBOT_POOL
    const poolType = TYPE_MAP[randomReadableType];

    setRobotType(randomReadableType);

    // Filter correct and wrong items
    const correctItems = ROBOT_POOL.filter((item) => item.type === poolType);
    const wrongItems = ROBOT_POOL.filter((item) => item.type !== poolType);

    // Pick 2 correct randomly
    const selectedCorrect = correctItems
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    // Pick 2 wrong randomly
    const selectedWrong = wrongItems
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    // Mix and shuffle
    const mixedOptions = [...selectedCorrect, ...selectedWrong]
      .sort(() => 0.5 - Math.random())
      .map((item, index) => ({
        id: index + 1,
        label: item.label,
        isCorrect: item.type === poolType,
      }));

    setRobotOptions(mixedOptions);
  };

  const toggleRobotOption = (id) => {
    setRobotError(false);
    setRobotAnswer((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const verifyHuman = () => {
    const correct = robotOptions
      .filter(o => o.isCorrect)
      .map(o => o.id)
      .sort();

    const selected = [...robotAnswer].sort();

    if (JSON.stringify(correct) !== JSON.stringify(selected)) {
      setRobotError(true);
      return;
    }

    setIsHuman(true);
    setShowRobotCheck(false);
    setRobotAnswer([]);
    setRobotError(false);
  };

  const isTokenExpired = async () => {
    try {
      const resp = await api.post("/user/verify_token");
      if(!resp.data){
        clearAccessToken();
        navigate("/");
      }
    } catch {
      console.log("Token expired");
    }
  };


  useEffect(() => {
    if(access_token){
      isTokenExpired();
    }
    if (isSettingsActive) {
      setOpenDrawerSettings(true);
    }

    if (isManagementActive) {
      setOpenDrawerManagement(true);
    }
  }, [isSettingsActive, isManagementActive]);

  /* =====================
     Login
     ===================== */

  const handleLogin = async (e) => {
    e.preventDefault();

    // block if robot check not done
    if (showRobotCheck && !isHuman) {
      setMessage(t('complete_security_check'));
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
        generateRobotOptions();
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
        setMessage(t('invalid_password'));
        setOpenSnackbar(true);
        return;
      }

      if (
        err.response?.status === 404 &&
        err.response?.data?.detail === "Email not found"
      ) {
        setSeverity("error");
        setMessage(t('email_not_found'));
        setOpenSnackbar(true);
        return;
      }

      setMessage(err.response?.data?.detail || t('login_failed'));
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
        setMessage(t('register_success'));
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
        setMessage(t('register_failed'))
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
      setMessage(t('all_fields_required'));
      setOpenSnackbar(true);
      return;
    }

    if (new_password !== confirm_password) {
      setSeverity("error");
      setMessage(t('passwords_do_not_match'));
      setOpenSnackbar(true);
      return;
    }

    try {
      await api.post("/user/change-password", {
        old_password,
        new_password,
      });

      setSeverity("success");
      setMessage(t('password_changed_success'));
      setOpenSnackbar(true);
      setOpenChangePassword(false);
    } catch (err) {
      setSeverity("error");
      setMessage(err.response?.data?.detail || t('password_change_failed'));
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
      setMessage(t('download_cv_failed'));
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
            background: 'linear-gradient(135deg, rgba(245,247,255,0.8) 0%, rgba(255,255,255,0.95) 100%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
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
              src={profileUrl}
            >
              {user_data?.user_data?.user_name?.[0]?.toUpperCase() || '?'}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
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
                {user_data?.user_data?.user_name || t('user')}
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

          {/* MANAGEMENT in Drawer */}
          {access_token && user_type === 1 && (
            <>
              <ListItemButton
                onClick={toggleDrawerManagement}
                selected={isManagementActive}
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
                    color: isManagementActive ? "black" : "primary.main",
                  }}
                >
                  <ArrowDropDownIcon />
                </ListItemIcon>

                <ListItemText
                  primary={t('management')}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />

                {openDrawerManagement ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>

              <Collapse in={openDrawerManagement} timeout="auto" unmountOnExit>
                <Box sx={{ pl: 3, pr: 2, pb: 0.5 }}>
                  {MANAGEMENT_ITEMS.map((item) => (
                    <ListItemButton
                      key={item.path}
                      onClick={() => {
                        goTo(item.path);
                        setOpenDrawerManagement(false);
                      }}
                      selected={location.pathname.startsWith(item.path)}
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
                        {item.icon}
                      </ListItemIcon>

                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  ))}
                </Box>
              </Collapse>
            </>
          )}

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
                  primary={t('settings')}
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

                    <ListItemText primary={t('system_parameter')} />
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
                  primary={t('cv_templates')}
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
                <ListItemText primary={t('register')} />
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
                <ListItemText primary={t('login')} />
              </ListItemButton>
            </Box>
          )}
        </List>
      </Box>

      {/* 🌐 Language Switcher in Drawer */}
      <Box sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {t('language')}
        </Typography>
        <LanguageSwitcher />
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
            <ListItemText primary={t('logout')} primaryTypographyProps={{ fontWeight: 500 }} />
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

              {/* 🌐 Mobile Language Switcher - Compact version */}
              <LanguageSwitcher />

              <IconButton onClick={handleProfileClick} sx={{ p: 0, ml: 1 }}>
                <Avatar
                src={profileUrl}
                >
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
                      src={profileUrl}
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
                        {user_data?.user_data?.user_name || t('user')}
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
                    {t('update_profile')}
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
                        {t('cv_templates')}
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
                    {t('change_password')}
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
                  {t('logout')}
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

              {/* Management */}
              {access_token && user_type === 1 && (
                <Button
                  onClick={handleOpenManagement}
                  startIcon={<ArrowDropDownIcon />}
                  sx={{
                    fontWeight: 500,
                    color: "teal",
                    textTransform: "none",
                    position: "relative",

                    // make the arrow bigger
                    "& .MuiButton-startIcon": {
                      fontSize: 30,
                      "& svg": {
                        fontSize: 30,
                      },
                    },

                    "&::after": {
                      content: '""',
                      position: "absolute",
                      width: isManagementActive ? "100%" : "0%",
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
                  {t('management')}
                </Button>
              )}

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
                  {t('settings')}
                </Button>
              )}

              {/* 🌐 Language Switcher for Desktop */}
              <Box sx={{ ml: 1 }}>
                <LanguageSwitcher />
              </Box>

              {access_token ? (
                <>
                  {/* Profile Avatar & Menu */}
                  <IconButton onClick={handleProfileClick} sx={{ p: 0, ml: 1 }}>
                    <Avatar
                    src={profileUrl}
                    >
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
                          src={profileUrl}
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
                            {user_data?.user_data?.user_name || t('user')}
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
                        {t('update_profile')}
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
                            {t('cv_templates')}
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
                        {t('change_password')}
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
                      {t('logout')}
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
                    {t('login')}
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setopenRegisterForm(true)}
                    sx={{ textTransform: "none" }}
                  >
                    {t('register')}
                  </Button>
                </Stack>
              )}
            </Box>
          )}
        </Toolbar>

        {/* management menu */}
        <Menu
          anchorEl={managementAnchor}
          open={openManagement}
          onClose={handleCloseManagement}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              width: 250,
              borderRadius: 2,
              mt: 1,
            },
          }}
        >
          <MenuItem disabled sx={{ fontWeight: 600 }}>
            {t('management')}
          </MenuItem>

          <Divider />

          {MANAGEMENT_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);

            return (
              <MenuItem
                key={item.path}
                selected={isActive}
                onClick={() => {
                  navigate(item.path);
                  handleCloseManagement();
                }}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  ...(isActive && {
                    backgroundColor: 'primary.lighter',
                    color: 'primary.dark',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    }
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? "primary.dark" : "primary.main",
                    minWidth: 36,
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                {item.label}
              </MenuItem>
            );
          })}
        </Menu>

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
            {t('settings')}
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
            {t('system_parameter')}
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
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 3,
            maxHeight: isMobile ? "100vh" : "85vh",
          },
        }}
      >
        <DialogContent
          sx={{
            p: 3,
            overflowY: "auto",
            transition: "all 0.3s ease",
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: 3,
            },
          }}
        >
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
                  width: { xs: 120, sm: 170 },
                  objectFit: "contain",
                  borderRadius: "0.6rem",
                  cursor: "pointer",
                  p: 0.5,
                }}
              />
            </Stack>

            {/* Header */}
            <Box textAlign="start">
              <Typography variant="h7" fontWeight={700}>
                {t("login_account")} 🚀
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("join_us")}
              </Typography>
            </Box>

            {/* Email */}
            <TextField
              fullWidth
              size="small"
              label={t("email")}
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
              label={t("password")}
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

            {/* Robot Section with Smooth Collapse */}
            <Collapse in={showRobotCheck} sx={{ border: "2px solid rgba(0,0,0,0.1)", borderRadius: 2 }}>
              <Box sx={{ p: 1, bgcolor: "grey.50", borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  {t("security_check")}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('select')} {robotType}
                </Typography>

                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                  {robotOptions.map((opt) => {
                    const selected = robotAnswer.includes(opt.id);
                    return (
                      <Chip
                        key={opt.id}
                        label={opt.label}
                        clickable
                        size="small"
                        color={selected ? "primary" : "default"}
                        variant={selected ? "filled" : "outlined"}
                        onClick={() => toggleRobotOption(opt.id)}
                      />
                    );
                  })}
                </Stack>

                {robotError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {t("incorrect_selection")}
                  </Alert>
                )}

                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  onClick={verifyHuman}
                  disabled={robotAnswer.length === 0}
                  sx={{ textTransform: "none" }}
                >
                  {t("verify")}
                </Button>
              </Box>
            </Collapse>

            {/* Actions */}
            <Stack direction="row" spacing={1} sx={{ width: "100%", mt: 2 }}>
              <Button
                onClick={handleCloseLoginForm}
                variant="outlined"
                size="small"
                fullWidth
                color="error"
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                {t("cancel")}
              </Button>

              <Button
                size="small"
                variant="contained"
                type="submit"
                fullWidth
                disabled={showRobotCheck && !isHuman}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                {t("login")}
              </Button>
            </Stack>

            {/* Forgot Password */}
            <Box display="flex" justifyContent="flex-end">
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
                {t("forgot_password")}
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
                    width: { xs: 120, sm: 170 },
                    objectFit: "contain",
                    borderRadius: "0.6rem",
                    cursor: "pointer",
                    p: 0.5
                  }}
                />
              </Stack>

              {/* Form Header */}
              <Box textAlign="start">
                <Typography variant="h7" fontWeight={700}>
                  {t('create_account')} 🚀
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('join_us')}
                </Typography>
              </Box>

              {/* -------------------- Row 1: User Type & Username -------------------- */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  size="small"
                  name="user_type"
                  label={t('user_type')}
                  select
                  required
                  defaultValue=""
                  fullWidth
                >
                  <MenuItem value="" disabled>
                    {t('select_user_type')}
                  </MenuItem>
                  <MenuItem value={2}>{t('employer')}</MenuItem>
                  <MenuItem value={3}>{t('candidate')}</MenuItem>
                </TextField>

                <TextField
                  size="small"
                  name="user_name"
                  label={t('username')}
                  required
                  fullWidth
                />
              </Stack>

              {/* -------------------- Row 2: Email & Password -------------------- */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  size="small"
                  name="email"
                  label={t('email')}
                  type="email"
                  required
                  fullWidth
                />

                <TextField
                  size="small"
                  name="password"
                  label={t('password')}
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
                  label={t('gender')}
                  select
                  fullWidth
                >
                  <MenuItem value="Male">{t('male')}</MenuItem>
                  <MenuItem value="Female">{t('female')}</MenuItem>
                </TextField>

                <TextField size="small" name="phone" label={t('phone')} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                {/* -------------------- Date of Birth -------------------- */}
                <DatePicker
                  label={t('date_of_birth')}
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
                  label={t('address')}
                  multiline
                  fullWidth
                />
              </Stack>

              {/* -------------------- Form Actions -------------------- */}
              <DialogActions>
                <Button
                  onClick={handleCloseRegisterForm}
                  variant="outlined"
                  color="error"
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  {t('cancel')}
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
                  {t('register')}
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
        <DialogTitle>{t('change_password')}</DialogTitle>

        <DialogContent dividers>
          <Stack
            spacing={2}
            component="form"
            onSubmit={handleSubmitChangePassword}
            id="change-password-form"
          >
            <TextField
              size="small"
              label={t('old_password')}
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
              label={t('new_password')}
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
              label={t('confirm_password')}
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
          <Button onClick={() => setOpenChangePassword(false)}>{t('cancel')}</Button>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            form="change-password-form"
          >
            {t('submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}