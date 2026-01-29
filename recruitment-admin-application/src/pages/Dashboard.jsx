// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Avatar,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar,
  MenuItem,
  Chip,
  alpha,
  IconButton,
  Tooltip,
  Badge,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  RadioGroup,
  FormControlLabel,
  DialogActions,
  Radio,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import api from "../services/api";
import ReactQuill from "react-quill-new";
import "quill/dist/quill.snow.css";
import EventIcon from "@mui/icons-material/Event";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PaymentsIcon from "@mui/icons-material/Payments";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import Popover from "@mui/material/Popover";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BadgeIcon from '@mui/icons-material/Badge';
import { DescriptionOutlined, EmailOutlined, Home, Info, LanguageOutlined, LocationCity, PhoneOutlined, Send, SendAndArchive, UploadFileSharp } from "@mui/icons-material";

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailMobile, setShowDetailMobile] = useState(false);

  const [typeFilter, setTypeFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState(["All"]);

  const [categories, setCategories] = useState([]);

  const [categoryAnchor, setCategoryAnchor] = useState(null);
  const openCategory = Boolean(categoryAnchor);

  const [typeAnchor, setTypeAnchor] = useState(null);
  const openType = Boolean(typeAnchor);

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [companyAnchor, setCompanyAnchor] = useState(null);
  const openCompanyPopover = Boolean(companyAnchor);

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(""); // for apply modal
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [jobToApply, setJobToApply] = useState(null);
  const [applying, setApplying] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    const loadResumes = async () => {
      try {
        const res = await api.get("/candidate/resumes/");
        setResumes(res.data || []);
        const primary = res.data?.find(r => r.is_primary);
        if (primary) setSelectedResumeId(primary.pk_id);
      } catch (err) {
        console.log("No resumes or not candidate yet");
      }
    };
    loadResumes();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories/");
        setCategories(res.data || []);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!jobs.length) return;

    const term = searchTerm.toLowerCase().trim();

    const filtered = jobs.filter((job) => {
      const title = job.job_title?.toLowerCase() || "";
      const company = job.employer?.company_name?.toLowerCase() || "";
      const location = job.location?.toLowerCase() || "";

      const keywordMatch =
        !term ||
        title.includes(term) ||
        company.includes(term) ||
        location.includes(term);

      const typeMatch = typeFilter.includes("All") || typeFilter.includes(job.job_type);

      const levelMatch = levelFilter === "All" || job.level === levelFilter;

      const categoryMatch =
        categoryFilter.includes("All") ||
        (job.categories || []).some((cat) =>
          categoryFilter.includes(cat.pk_id),
        );

      return keywordMatch && typeMatch && levelMatch && categoryMatch;
    });

    setFilteredJobs(filtered);

    if (selectedJob && !filtered.some((j) => j.pk_id === selectedJob.pk_id)) {
      setSelectedJob(filtered[0] || null);
    }
  }, [searchTerm, typeFilter, levelFilter, categoryFilter, jobs, selectedJob]);

  const loadJobs = async () => {
    try {
      const res = await api.get("/jobs/");
      const data = res.data || [];
      setJobs(data);
      setFilteredJobs(data);
      if (data.length) setSelectedJob(data[0]);
    } catch {
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    if (isMobile) {
      setShowDetailMobile(true);
    }
  };

  const handleBackToList = () => {
    setShowDetailMobile(false);
  };

  const handleNewResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("resume_file", file);
    formData.append("is_primary", false);

    try {
      const res = await api.post("/candidate/resumes/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Add new resume to list
      setResumes((prev) => [...prev, res.data]);

      // Auto-select the newly uploaded resume
      setSelectedResumeId(res.data.pk_id.toString());

      setSnackbar({
        open: true,
        message: "Resume uploaded successfully!",
        severity: "success",
      });
    } catch (err) {
      setUploadError(
        err.response?.data?.detail ||
        "Failed to upload resume. Please try again."
      );
    } finally {
      setUploadLoading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleApplyWithResume = async (jobId, resumeId) => {
    try {
      setApplying(prev => ({ ...prev, [jobId]: true }));
      await api.post("/applications/", {
        job_id: jobId,
        candidate_resume_id: parseInt(resumeId)
      });
      setSnackbar({ open: true, message: "Applied successfully!", severity: "success" });
      setApplyDialogOpen(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || "Failed to apply",
        severity: "error"
      });
    } finally {
      setApplying(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, height: "100%" }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // ────────────────────────────────────────────────
  // Job List Content (shared between mobile & desktop)
  // ────────────────────────────────────────────────
  const ListContent = () => (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: "3px solid",
        borderColor: "divider",
        backgroundColor: "#FAFAFA",
      }}
    >
      {/* New: Category - multi select */}
      <Stack direction="row" spacing={1} p={1} justifyContent="space-between" alignItems="center" >
        {/* title */}
        <TextField
            size="small"
            placeholder="Search jobs, companies, locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            fullWidth
          />
        <Stack direction="row" spacing={1}>
          <Tooltip title="Filter by Categories" arrow placement="top">
            <IconButton
              size="small"   
              onClick={(e) => setCategoryAnchor(e.currentTarget)}
              sx={{
                borderRadius: 1.5,
                bgcolor: "teal",
                color: "#fff",
                "&:hover": {
                  bgcolor: "teal",
                },
              }}
            >
              <CategoryRoundedIcon />
            </IconButton>
          </Tooltip>
          <Popover
            open={openCategory}
            anchorEl={categoryAnchor}
            onClose={() => setCategoryAnchor(null)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            PaperProps={{
              sx: {
                width: 520, // ⬅ wider like image
                maxHeight: 420,
                borderRadius: 2,
                p: 2.5,
                overflowY: "auto",
                backgroundColor: "#DFE6DF",
              },
            }}
          >
            <Typography fontWeight={700} mb={1.5}>
              Categories
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <List dense disablePadding>
              {/* ALL */}
              <ListItemButton
                selected={categoryFilter.includes("All")}
                onClick={() => setCategoryFilter(["All"])}
                sx={{ borderRadius: 1 }}
              >
                <Checkbox checked={categoryFilter.includes("All")} />
                <ListItemText primary="All" />
              </ListItemButton>

              {categories.map((cat) => {
                const checked = categoryFilter.includes(cat.pk_id);

                return (
                  <ListItemButton
                    key={cat.pk_id}
                    selected={checked}
                    sx={{ borderRadius: 1 }}
                    onClick={() => {
                      let updated = [...categoryFilter];

                      if (checked) {
                        updated = updated.filter((v) => v !== cat.pk_id);
                      } else {
                        updated = updated.filter((v) => v !== "All");
                        updated.push(cat.pk_id);
                      }

                      setCategoryFilter(
                        updated.length === 0 ? ["All"] : updated,
                      );
                    }}
                  >
                    <Checkbox checked={checked} />
                    <ListItemText primary={cat.name} />
                  </ListItemButton>
                );
              })}
            </List>
          </Popover>
          {/* Job Type – popover */}
          <Tooltip title="Filter by Job Type" arrow placement="top">
            <IconButton
              size="small"   
              onClick={(e) => setTypeAnchor(e.currentTarget)}
              sx={{
                borderRadius: 1.5,
                color: "#fff",
                bgcolor: "teal",
                "&:hover": {
                  bgcolor: "teal", // same as normal, disables hover effect
                },
              }}
            >
              <WorkOutlineIcon />
            </IconButton>
          </Tooltip>
          <Popover
            open={openType}
            anchorEl={typeAnchor}
            onClose={() => setTypeAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            PaperProps={{
              sx: {
                width: 300,
                maxHeight: 320,
                borderRadius: 2,
                p: 2.5,
                overflowY: "auto",
                backgroundColor: "#DFE6DF",
              },
            }}
          >
            <Typography fontWeight={700} mb={1.5}>
              Job Type
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List dense disablePadding>
              {["All", "Full-time", "Part-time", "Internship"].map((type) => {
                const checked = typeFilter.includes(type);

                return (
                  <ListItemButton
                    key={type}
                    selected={checked}
                    sx={{ borderRadius: 1 }}
                    onClick={() => {
                    let updated = [...typeFilter];

                    if (type === "All") {
                      // clicking "All" selects only All
                      updated = ["All"];
                    } else {
                      // Remove "All" if it exists
                      updated = updated.filter((v) => v !== "All");

                      if (updated.includes(type)) {
                        // uncheck this type
                        updated = updated.filter((v) => v !== type);
                      } else {
                        // check this type
                        updated.push(type);
                      }

                      // fallback to All if nothing selected
                      if (updated.length === 0) updated = ["All"];
                    }

                    setTypeFilter(updated);
                  }}


                  >
                    <Checkbox checked={checked} />
                    <ListItemText primary={type} />
                  </ListItemButton>
                );
              })}
            </List>
          </Popover>
          <Tooltip title="Clear all filter" arrow placement="top">
            <IconButton
              onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("All");
                  setLevelFilter("All");
                  setCategoryFilter(["All"]);
                }}
              >
                <AutorenewRoundedIcon color="primary" />
              </IconButton>
          </Tooltip>
          
        </Stack>
      </Stack>
      <Divider/>
          
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {filteredJobs.length === 0 ? (
          <Box
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            <Box
              component="img"
              src="/No-Data.gif"
              alt="No data"
            />
          </Box>
        ) : (
          filteredJobs.map((job) => {
            const active = selectedJob?.pk_id === job.pk_id;
            const companyName = job.employer?.company_name;
            const logoFilename = job.employer?.company_logo;
            return (
              
              <Box
                key={job.pk_id}
                onClick={() => handleSelectJob(job)}
                sx={{
                  px: 1,
                  py: { xs: 1, sm: 1.15 },
                  cursor: "pointer",
                  bgcolor: active ? "action.selected" : "transparent",
                  borderLeft: active ? "3px solid" : "3px solid transparent",
                  borderColor: active ? "primary.main" : "transparent",
                  borderBottom: "1px solid",
                  borderBottomColor: "divider",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={
                      logoFilename
                        ? `${baseURL}/uploads/employers/${logoFilename}`
                        : undefined
                    }
                    alt={`${companyName} logo`}
                    sx={{
                      width: { xs: 40, sm: 50 },
                      height: { xs: 40, sm: 50 },
                      fontSize: "0.9rem",
                      border: "1px solid",
                      borderColor: "divider",
                      "& img": {
                        objectFit: "contain",
                      },
                    }}
                  >
                    {companyName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box minWidth={0}>
                    <Typography variant="body2" fontWeight={600}>
                      {job.job_title}
                    </Typography>
                    <Stack direction="column" spacing={0.3} mt={0.5}>
                      <Chip
                        icon={<EventIcon />}
                        label={`Posted: ${job.posting_date ? new Date(job.posting_date).toISOString().split("T")[0] : "—"}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{
                          fontSize: 12
                        }}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            );
          })
        )}
      </Box>
    </Card>
  );

  // ────────────────────────────────────────────────
  // Job Detail Content (shared, but with mobile back bar)
  // ────────────────────────────────────────────────
  const DetailContent = () => {
    const companyName = selectedJob?.employer?.company_name;
    const logoFilename = selectedJob?.employer?.company_logo;
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          border: "3px solid",
          borderColor: "divider",
          borderRadius: 1,
          backgroundColor: "#FAFAFA",
        }}
      >
        {/* Mobile top bar */}
        {isMobile && (
          <AppBar position="sticky" color="default" elevation={1}>
            <Toolbar variant="dense"></Toolbar>
          </AppBar>
        )}

        {selectedJob ? (
          <Box sx={{ flex: 1, overflowY: "auto", pb: { xs: 10, sm: 4 } }}>
            {/* Hero section – like screenshot */}
            <Box sx={{ p: 3, pb: 2, bgcolor: "#FAFAFA" }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={
                    logoFilename
                      ? `${baseURL}/uploads/employers/${logoFilename}`
                      : undefined
                  }
                  alt={`${companyName} logo`}
                  sx={{
                    width: { xs: 50, sm: 50 },
                    height: { xs: 50, sm: 50 },
                    border: "1px solid",
                    borderColor: "divider",
                    "& img": {
                      objectFit: "contain",
                    },
                  }}
                >
                  {companyName.charAt(0).toUpperCase()}
                </Avatar>

                <Box flex={1}>
                  <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                    {selectedJob.job_title}
                  </Typography>
                  <Chip
                    icon={<BusinessRoundedIcon />}
                    label={`Company: ${companyName}`}
                    size="small"
                    sx={(theme) => ({
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: alpha(theme.palette.primary.main, 0.9),
                      "& .MuiChip-icon": {
                        color: alpha(theme.palette.primary.main, 0.7),
                      },
                    })}
                  />
                </Box>
                {/* Mobile */}
                <Stack spacing={1}>
                  {selectedJob && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<Send />}
                      onClick={() => {
                        setJobToApply(selectedJob);
                        setApplyDialogOpen(true);
                      }}
                      sx={{ 
                        display: { xs: "inline-flex", sm: "none" },
                        textTransform: "none" 
                      }}
                    >
                      Apply
                    </Button>
                  )}
                  {/* Mobile */}
                  <Button
                    variant="outlined"
                    startIcon={<InfoOutlinedIcon />}
                    onClick={(e) => setCompanyAnchor(e.currentTarget)}
                    size="small"
                    sx={{
                      display: { xs: "inline-flex", sm: "none" },
                      textTransform: "none",
                    }}
                  >
                    Info
                  </Button>
                </Stack>
                {/* Apply Now Button */}
                {selectedJob && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<Send />}
                      onClick={() => {
                        setJobToApply(selectedJob);
                        setApplyDialogOpen(true);
                      }}
                      sx={{
                        whiteSpace: "nowrap",
                        display: { xs: "none", sm: "inline-flex" },
                        textTransform: "none",
                      }}
                    >
                      Apply Now
                    </Button>
                )}
                {/* Desktop */}
                <Button
                  variant="outlined"
                  startIcon={<InfoOutlinedIcon />}
                  onClick={(e) => setCompanyAnchor(e.currentTarget)}
                  size="small"
                  sx={{
                    whiteSpace: "nowrap",
                    display: { xs: "none", sm: "inline-flex" },
                    textTransform: "none",
                  }}
                >
                  Company Info
                </Button>
                {/* // Popover component */}
                <Popover
                  open={openCompanyPopover}
                  anchorEl={companyAnchor}
                  onClose={() => setCompanyAnchor(null)}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                  PaperProps={{
                    sx: {
                      width: { xs: "80vw", sm: 600 },
                      height: { xs: "90vh", sm: 600 },
                      maxHeight: 500,
                      borderRadius: 2,
                      p: 2.5,
                      overflowY: "auto",
                      backgroundColor: "#FAFAFA",
                      border: "3px solid",
                      borderColor: "divider",
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={3}>
                    <Typography 
                      variant="h7" 
                      fontWeight={550} 
                      sx={{
                        borderBottom: "2px solid",
                        borderColor: "primary.main",
                      }}
                    >
                      Company Information
                    </Typography>
                  </Stack>

                  <Stack spacing={2.5}>
                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                      <BadgeIcon color="action" sx={{ mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          Company Name:
                        </Typography>
                        <Chip
                          variant="outlined"
                          size="small"
                          label={selectedJob.employer?.company_name}
                        >
                        </Chip>
                      </Box>
                    </Stack>

                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                      <LocationCity color="action" sx={{ mt: 0.5 }} />
                      <Stack>

                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          Address:
                        </Typography>
                        <Typography variant="subtitle2">
                          {selectedJob.employer?.company_address}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={2}>
                      <EmailOutlined color="action" />
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          Email:
                        </Typography>
                        <Typography variant="body1">
                          {selectedJob.employer?.company_email || "Not provided"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={2}>
                      <PhoneOutlined color="action" />
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          Contact:
                        </Typography>
                        <Typography variant="body1">
                          {selectedJob.employer?.company_contact || "Not provided"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={2}>
                      <LanguageOutlined color="action" />
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          Website:
                        </Typography>
                        {selectedJob.employer?.company_website ? (
                          <a
                            href={selectedJob.employer.company_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: theme.palette.primary.main }}
                          >
                            {selectedJob.employer.company_website}
                          </a>
                        ) : (
                          <Typography variant="body1">Not provided</Typography>
                        )}
                      </Box>
                    </Stack>

                    <Box sx={{ borderRadius: 3 }}>
                      <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                        <Info color="action" />
                        <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1}>
                          About the Company
                        </Typography>
                      </Stack>
                      
                      <ReactQuill
                        theme="snow"
                        value={
                          selectedJob.employer?.company_description ||
                          "No company description available."
                        }
                        readOnly
                        modules={{ toolbar: false }}
                      />
                    </Box>
                  </Stack>
                </Popover>
                {/* Apply Dialog with Resume Selection */}
                <Dialog open={applyDialogOpen} onClose={() => setApplyDialogOpen(false)} fullWidth maxWidth="xs">
                  <DialogTitle variant="body2">Select Resume to Apply</DialogTitle>
                  <Divider />
                  <DialogContent>
                    {resumes.length === 0 ? (
                      <Alert severity="warning">
                        You don't have any resume yet. Please upload one first.
                      </Alert>
                    ) : (
                      <RadioGroup value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)}>
                        {resumes.map((resume) => (
                          <FormControlLabel
                            key={resume.pk_id}
                            value={resume.pk_id.toString()}
                            control={<Radio />}
                            label={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1}}>
                                <DescriptionOutlined color="primary" />
                                <Box>
                                  <Typography fontWeight={600} variant="body2">
                                    {resume.resume_file || "Text Resume"}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {resume.is_primary ? "Primary Resume" : "Uploaded on " + new Date(resume.created_date).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        ))}
                      </RadioGroup>
                    )}
                    {/* ── New resume upload section ── */}
                    <Box sx={{ mt: 3, borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Or upload a new resume right now
                      </Typography>

                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<UploadFileSharp />}
                        sx={{ mt: 1 }}
                      >
                        Choose PDF / DOCX file
                        <input
                          type="file"
                          hidden
                          accept=".pdf,.doc,.docx"
                          onChange={handleNewResumeUpload}
                        />
                      </Button>

                      {uploadLoading && <CircularProgress size={24} sx={{ ml: 2 }} />}
                      {uploadError && (
                        <Alert severity="error" sx={{ mt: 1.5 }}>
                          {uploadError}
                        </Alert>
                      )}
                    </Box>
                  </DialogContent>
                  <Divider />
                  <DialogActions>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      sx={{
                        textTransform: "none"
                      }}
                      onClick={() => setApplyDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        textTransform: "none"
                      }}
                      disabled={!selectedResumeId || applying[jobToApply?.pk_id]}
                      onClick={() => handleApplyWithResume(jobToApply.pk_id, selectedResumeId)}
                    >
                      {applying[jobToApply?.pk_id] ? "Applying..." : "Submit"}
                    </Button>
                  </DialogActions>
                </Dialog>
              </Stack>

              <Divider sx={{mt: 1}}/>

              {/* Quick info chips / rows */}
              <Stack spacing={1.5} sx={{ mt: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EventIcon color="action" fontSize="small" />
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    minWidth={110}
                    color="text.secondary"
                  >
                    Posting Date:
                  </Typography>
                  <Chip
                    label={
                      selectedJob.posting_date
                        ? new Date(selectedJob.posting_date)
                            .toISOString()
                            .split("T")[0]
                        : "—"
                    }
                    size="small"
                    variant="outlined"
                    color="default"
                  />
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <EventIcon color="action" fontSize="small" />
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    minWidth={110}
                    color="text.secondary"
                  >
                    Closing Date:
                  </Typography>
                  <Chip
                    label={
                      selectedJob.closing_date
                        ? new Date(selectedJob.closing_date)
                            .toISOString()
                            .split("T")[0]
                        : "—"
                    }
                    size="small"
                    variant="outlined"
                    color="default"
                  />
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <WorkOutlineIcon color="action" fontSize="small" />
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    minWidth={110}
                    color="text.secondary"
                  >
                    Job Type:
                  </Typography>
                  <Chip
                    label={selectedJob.job_type || "—"}
                    size="small"
                    variant="outlined"
                    color="default"
                  />
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <TrendingUpIcon color="action" fontSize="small" />
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    minWidth={110}
                    color="text.secondary"
                  >
                    Level:
                  </Typography>
                  <Chip
                    label={selectedJob.level || "—"}
                    size="small"
                    variant="outlined"
                    color="default"
                  />
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <PaymentsIcon color="action" fontSize="small" />
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    minWidth={110}
                    color="text.secondary"
                  >
                    Salary:
                  </Typography>
                  <Chip
                    label={
                      selectedJob.salary_range
                        ? `${selectedJob.salary_range}$`
                        : "Negotiable"
                    }
                    size="small"
                    variant="outlined"
                    color="default"
                  />
                </Stack>

                {selectedJob.categories?.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <CategoryRoundedIcon color="action" fontSize="small" />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      minWidth={110}
                      color="text.secondary"
                    >
                      Categories:
                    </Typography>
                    {selectedJob.categories.map((cat) => (
                      <Chip
                        key={cat.pk_id}
                        label={cat.name}
                        size="small"
                        variant="outlined"
                        color="default"
                      />
                    ))}
                  </Stack>
                )}
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LocationOnIcon color="action" fontSize="small" />
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    minWidth={110}
                    color="text.secondary"
                  >
                    Location:
                  </Typography>
                  <Typography variant="subtitle2" color="">
                      {selectedJob.location }
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            <Divider />

            {/* Description */}
            <Box sx={{ p: 2.5, "& .ql-editor *": { backgroundColor: "transparent !important"}, }}>
              <Box mb={4}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <DescriptionOutlinedIcon color="action" fontSize="medium" />
                  <Typography variant="h6" fontWeight={700}>
                    Job Description
                  </Typography>
                </Stack>
                <ReactQuill
                  theme="snow"
                  value={selectedJob.job_description || ""}
                  readOnly
                  modules={{ toolbar: false }}
                />
              </Box>

              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <ChecklistOutlinedIcon color="action" fontSize="medium" />
                <Typography variant="h6" fontWeight={700}>
                  Requirements
                </Typography>
              </Stack>
              <ReactQuill
                theme="snow"
                value={selectedJob.experience_required || ""}
                readOnly
                modules={{ toolbar: false }}
              />
            </Box>
            
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 4,
            }}
          >
            <Typography color="text.secondary">
              Select a job to view details
            </Typography>
          </Box>
        )}

        {/* Floating / Home on mobile */}
        {isMobile && selectedJob && (
          <Box
            sx={{
              position: "sticky",
              bottom: 0,
              left: 0,
              right: 0,
              p: 1,
              bgcolor: "#FAFAFA",
              borderTop: "1px solid",
              borderColor: "divider",
              zIndex: 10,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleBackToList}
                startIcon={<Home />}
                sx={{
                  textTransform: "none"
                }}
              >
                Home
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
      
    );
  };

  // ────────────────────────────────────────────────
  // Main Layout
  // ────────────────────────────────────────────────
  return (
    <Box
      sx={{
        height: "calc(103vh - 120px)",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        gap: 0.5,
      }}
    >
      {!categoryFilter.includes("All") && categoryFilter.length > 0 && (
        <Card
          sx={{
            p: 0.9,
            border: "3px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction={{ xs: "row", sm: "row" }}
            spacing={1}
            flexWrap="wrap"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            {/* LEFT: category chips */}
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              sx={{ flex: 1 }}
            >
              {!categoryFilter.includes("All") &&
                categoryFilter.map((id) => {
                  const cat = categories.find((c) => c.pk_id === id);
                  if (!cat) return null;

                  return (
                    <Chip
                      key={id}
                      label={cat.name}
                      onDelete={() => {
                        const updated = categoryFilter.filter((v) => v !== id);
                        setCategoryFilter(updated.length === 0 ? ["All"] : updated);
                      }}
                    />
                  );
                })}
            </Stack>

            {/* RIGHT: reset button */}
            <Stack
              direction="row"
              justifyContent={{ xs: "flex-end", sm: "flex-end" }}
            >
              <Tooltip title="Clear all filter" arrow placement="top">
                <IconButton
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("All");
                    setLevelFilter("All");
                    setCategoryFilter(["All"]);
                  }}
                >
                  <AutorenewRoundedIcon color="primary" />
                </IconButton>
              </Tooltip>
              
            </Stack>
          </Stack>

        </Card>
      )}

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 0.5,
          minHeight: 0,
        }}
      >
        {/* Job List – hidden on mobile when detail is open */}

        <Box
          sx={{
            width: { xs: "100%", md: 450 },
            height: {xs: "100%"},
            flexShrink: 0,
            display: isMobile && showDetailMobile ? "none" : "block",
          }}
        >
          {ListContent()}
        </Box>

        {/* Job Detail – full-screen on mobile when selected */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            ...(isMobile
              ? {
                  position: "fixed",
                  inset: 0,
                  zIndex: showDetailMobile ? 20 : -1,
                  transform: showDetailMobile
                    ? "translateX(0)"
                    : "translateX(100%)",
                  transition: "transform 0.3s ease-in-out",
                  bgcolor: "background.default",
                  overflowY: "auto",
                }
              : {
                  borderRadius: 2,
                  boxShadow: 1,
                }),
          }}
        >
          {DetailContent()}
        </Box>
      </Box>
      {/* Snackbar for apply feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
