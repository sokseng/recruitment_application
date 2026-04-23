// src/pages/AppliedCandidates.jsx
import {
  ArrowBack,
  CalendarToday as CalendarIcon,
  CancelOutlined,
  CheckCircleOutline,
  DescriptionOutlined,
  FileDownload as FileDownloadIcon,
  HourglassEmpty,
  PersonOutlineSharp,
  Visibility as VisibilityIcon,
  Work as WorkIcon,
} from "@mui/icons-material";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import { useTranslation } from "react-i18next";
import { FaFacebookMessenger } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

// ────────────────────────────────────────────────
//      Draggable Paper
// ────────────────────────────────────────────────
function DraggablePaper(props) {
  const nodeRef = useRef(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"], [class*="MuiButtonBase-root"]'}
    >
      <Paper ref={nodeRef} {...props} />
    </Draggable>
  );
}

const STATUS_MAP = {
  PENDING: { label: "Pending", color: "warning" },
  SHORTLISTED: { label: "Shortlisted", color: "primary" },
  REJECTED: { label: "Rejected", color: "error" },
  ACCEPTED: { label: "Accepted", color: "success" },
};

const TAB_LABELS = ["All", "Pending", "Shortlisted", "Rejected", "Accepted"];
// Use translation keys (recommended)
const TAB_KEYS = [
  "applications.tabs.all",
  "applications.tabs.pending",
  "applications.tabs.shortlisted",
  "applications.tabs.rejected",
  "applications.tabs.accepted",
];
const STATUS_FILTER = ["", "PENDING", "SHORTLISTED", "REJECTED", "ACCEPTED"];

export default function AppliedCandidates() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedJobFromUrl = searchParams.get("job");
  const navigate = useNavigate();

  const [myJobs, setMyJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [error, setError] = useState(null);

  const [showDetailMobile, setShowDetailMobile] = useState(false);
  const [viewFileOpen, setViewFileOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    appId: null,
    currentStatus: "",
    newStatusLabel: "",
    newStatusKey: "",
  });

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [candidateDetailOpen, setCandidateDetailOpen] = useState(false);
  const [selectedCandidateApp, setSelectedCandidateApp] = useState(null);

  const [candidateImages, setCandidateImages] = useState([]); // ← new
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    loadMyJobsWithApplicationCounts();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadApplications(selectedJobId);
      setTabValue(0);
    }
  }, [selectedJobId]);

  useEffect(() => {
    if (candidateDetailOpen && selectedCandidateApp?.candidate_resume_id) {
      loadCandidateAttach(selectedCandidateApp.candidate_resume_id);
    } else {
      setCandidateImages([]);
    }
  }, [candidateDetailOpen, selectedCandidateApp]);

  const getProfileImageUrl = (app) => {
    const filename = app?.candidate?.user?.profile_image;

    if (
      !filename ||
      filename === null ||
      filename === "null" ||
      filename === "undefined" ||
      typeof filename !== "string" ||
      filename.trim() === ""
    ) {
      return null;
    }

    return `${baseURL}/uploads/user/profile/${filename}`;
  };

  const loadCandidateAttach = async (resumeId) => {
    if (!resumeId || !selectedCandidateApp?.pk_id) return;

    try {
      setLoadingImages(true);
      const res = await api.get(
        `/applications/attach-file/${selectedCandidateApp.pk_id}/attachments`,
      );
      setCandidateImages(res.data || []);
    } catch (err) {
      setCandidateImages([]);
      setSnackbar({
        open: true,
        message: "Failed to load candidate attachments",
        severity: "error",
      });
    } finally {
      setLoadingImages(false);
    }
  };

  const loadMyJobsWithApplicationCounts = async () => {
    try {
      setLoadingJobs(true);
      setError(null);

      const jobsRes = await api.get("/jobs/my-jobs?limit=100");
      const allMyJobs = jobsRes.data || [];

      if (allMyJobs.length === 0) {
        setMyJobs([]);
        setLoadingJobs(false);
        return;
      }

      const countsRes = await api.get("/applications/my-jobs/counts");
      const countsMap = {};
      (countsRes.data || []).forEach((item) => {
        countsMap[item.job_id] = item.count || 0;
      });

      const jobsWithApplications = allMyJobs.filter(
        (job) => (countsMap[job.pk_id] || 0) >= 1,
      );

      setMyJobs(jobsWithApplications);

      if (jobsWithApplications.length > 0) {
        let initialJobId;
        if (selectedJobFromUrl) {
          const found = jobsWithApplications.find(
            (j) => j.pk_id === Number(selectedJobFromUrl),
          );
          initialJobId = found ? found.pk_id : jobsWithApplications[0].pk_id;
        } else {
          initialJobId = jobsWithApplications[0].pk_id;
        }

        setSelectedJobId(initialJobId);

        if (!selectedJobFromUrl) {
          setSearchParams({ job: initialJobId.toString() }, { replace: true });
        }
      }
    } catch (err) {
      console.error("Failed to load jobs or counts:", err);
      setError("Failed to load your posted jobs or application data");
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadApplications = async (jobId) => {
    try {
      setLoadingApps(true);
      const res = await api.get(`/applications/job/${jobId}`);
      const normalizedApps = (res.data || []).map((app) => ({
        ...app,
        application_status: (app.application_status || "PENDING").toUpperCase(),
      }));
      setApplications(normalizedApps);
    } catch (err) {
      setError("Failed to load applications");
    } finally {
      setLoadingApps(false);
    }
  };

  const handleStatusChange = async (appId, newStatusLabel) => {
    const newKey = Object.keys(STATUS_MAP).find(
      (k) => STATUS_MAP[k].label === newStatusLabel,
    );
    if (!newKey) return;

    try {
      await api.patch(`/applications/${appId}/status`, {
        new_status: newStatusLabel,
      });

      setApplications((prev) =>
        prev.map((app) =>
          app.pk_id === appId ? { ...app, application_status: newKey } : app,
        ),
      );

      // Update currently viewed candidate detail
      if (selectedCandidateApp?.pk_id === appId) {
        setSelectedCandidateApp((prev) =>
          prev ? { ...prev, application_status: newKey } : prev,
        );
      }

      setSnackbar({
        open: true,
        message: `${t("applications.status_updated_to")} ${newStatusLabel}`,
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.detail || "Failed to update status",
        severity: "error",
      });
    }
  };

  // ────────────────────────────────────────────────
  // one by one PDF – View & Download
  // ────────────────────────────────────────────────
  const handleDownload = async (resumeId, fileName) => {
    if (!resumeId) return;

    try {
      const res = await api.get(`/applications/resumes/${resumeId}/file`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: res.headers["content-type"],
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName || "resume");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to download resume",
        severity: "error",
      });
    }
  };

  const handleViewFile = async (resumeId, fileName) => {
    if (!resumeId) return;

    try {
      const res = await api.get(`/applications/resumes/${resumeId}/file`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: res.headers["content-type"],
      });

      const url = URL.createObjectURL(blob);

      setFileUrl(url);
      setFileName(fileName);
      setFileType(blob.type);
      setViewFileOpen(true);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Unable to view file",
        severity: "error",
      });
    }
  };

  const handleViewCoverLetter = async (applicationId, candidateName) => {
    if (!applicationId) return;

    try {
      const res = await api.get(`/applications/${applicationId}/cover-letter`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const url = URL.createObjectURL(blob);

      setFileUrl(url);
      setFileName(
        `Cover_Letter_${candidateName.replace(/\s+/g, "_")}${blob.type.includes("pdf") ? ".pdf" : ""}`,
      );
      setFileType(blob.type);
      setViewFileOpen(true);
    } catch (err) {
      if (err?.response?.status === 404) {
        setSnackbar({
          open: true,
          message: "This candidate did not upload a cover letter",
          severity: "info",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Failed to load cover letter",
          severity: "error",
        });
      }
    }
  };

  const handleDownloadCoverLetter = async (applicationId, candidateName) => {
    try {
      const res = await api.get(`/applications/${applicationId}/cover-letter`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Cover_Letter_${candidateName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setSnackbar({
        open: true,
        message: "Cover letter downloaded",
        severity: "success",
      });
    } catch (err) {
      if (err?.response?.status === 404) {
        setSnackbar({
          open: true,
          message: "No cover letter available",
          severity: "info",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Failed to download cover letter",
          severity: "error",
        });
      }
    }
  };

  const handleSelect = async (userId) => {
    if (!userId) return;

    try {
      const res = await api.post("/chat/get-or-create-room", {
        other_user_id: userId,
      });
      const room = res.data;
      navigate("/chat", { state: { roomId: room.room_id } });
    } catch (err) {
      console.error("Chat room creation failed:", err);
      setSnackbar({
        open: true,
        message: "Failed to start chat",
        severity: "error",
      });
    }
  };

  const handleSelectJob = (job) => {
    setSelectedJobId(job.pk_id);
    setSearchParams({ job: job.pk_id.toString() }, { replace: true });
    if (isMobile) setShowDetailMobile(true);
  };

  const handleBackToList = () => {
    setShowDetailMobile(false);
  };

  const selectedJob = myJobs.find((j) => j.pk_id === selectedJobId);

  const filteredApplications =
    tabValue === 0
      ? applications
      : applications.filter(
          (app) => app.application_status === STATUS_FILTER[tabValue],
        );

  if (loadingJobs) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#3b82f6" }}/>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, height: "100%" }}>
        <Alert severity="error" sx={{ borderLeft: "4px solid #f97316" }}>{error}</Alert>
      </Box>
    );
  }

  // ─── Job List ───────────────────────────────────────────────
  const JobListContent = () => (
    <Card
      sx={{
        height: { xs: "80vh", sm: "100%" },
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(239, 246, 255, 0.9) 100%)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(59, 130, 246, 0.2)",
        boxShadow: "0 8px 32px rgba(30, 58, 138, 0.12)",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography 
          variant="h7" 
          fontWeight={700} 
          sx={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {t('your_applications')}
        </Typography>
      </Box>
      <Divider sx={{ borderColor: "rgba(59, 130, 246, 0.15)" }} />
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {myJobs.length === 0 ? (
          <Box
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            <WorkIcon sx={{ fontSize: 60, opacity: 0.3, mb: 2, color: "#3b82f6" }} />
            <Typography variant="subtitle2" sx={{ color: "#1e3a8a" }}>
              {t('no_jobs_with_applications_yet')}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, textAlign: "center", color: "#f97316" }}>
              {t('no_jobs_with_applications_yet_desc')}
            </Typography>
          </Box>
        ) : (
          myJobs.map((job) => {
            const isActive = selectedJobId === job.pk_id;
            return (
              <Box
                key={job.pk_id}
                onClick={() => handleSelectJob(job)}
                sx={{
                  px: 2,
                  py: 1.5,
                  cursor: "pointer",
                  bgcolor: isActive ? "rgba(59, 130, 246, 0.08)" : "transparent",
                  borderLeft: isActive ? "4px solid" : "4px solid transparent",
                  borderImage: isActive ? "linear-gradient(180deg, #3b82f6 0%, #f97316 100%) 1" : "none",
                  borderBottom: "1px solid",
                  borderBottomColor: "rgba(59, 130, 246, 0.1)",
                  transition: "all 0.2s ease",
                  "&:hover": { 
                    bgcolor: "rgba(249, 115, 22, 0.06)",
                    transform: "translateY(2px)",
                  },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={
                      job.employer?.company_logo
                        ? `${baseURL}/uploads/employers/${job.employer.company_logo}`
                        : undefined
                    }
                    sx={{
                      width: 48,
                      height: 48,
                      border: "2px solid",
                      borderColor: "rgba(59, 130, 246, 0.3)",
                      boxShadow: "0 2px 8px rgba(30, 58, 138, 0.1)",
                    }}
                  >
                    {job.employer?.company_name?.[0]?.toUpperCase() || "?"}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ color: "#1e3a8a" }}>
                      {job.job_title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {job.employer?.company_name || "—"} •{" "}
                      {job.location || "—"}
                    </Typography>
                  </Box>
                  <Chip
                    label={job.status || "Open"}
                    size="small"
                    color={
                      job.status === "Open"
                        ? "success"
                        : job.status === "Closed"
                          ? "error"
                          : "warning"
                    }
                    variant="outlined"
                    sx={{
                      borderColor: job.status === "Open" ? "#10b981" : "#ef4444",
                      color: job.status === "Open" ? "#10b981" : "#ef4444",
                    }}
                  />
                </Stack>
              </Box>
            );
          })
        )}
      </Box>
    </Card>
  );

  const InfoRow = ({ label, value }) => (
    <Stack direction="row">
      <Typography variant="body2" color="text.secondary">
        {label}:
      </Typography>
      <Typography
        variant="body2"
        fontWeight={500}
        sx={{ flex: 1, textAlign: "right", color: "#1e3a8a" }}
      >
        {value}
      </Typography>
    </Stack>
  );

  // ─── Applications Detail ────────────────────────────────────
  const ApplicationsDetailContent = () => (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(239, 246, 255, 0.9) 100%)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(59, 130, 246, 0.2)",
        boxShadow: "0 8px 32px rgba(30, 58, 138, 0.12)",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      {isMobile && (
        <AppBar 
          position="sticky" 
          olor="default" 
          elevation={1}
          sx={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(239, 246, 255, 0.85) 100%)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(59, 130, 246, 0.15)",
          }}
        >
          <Toolbar variant="dense" />
        </AppBar>
      )}

      {selectedJobId ? (
        <>
          <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: "transparent" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={
                  selectedJob?.employer?.company_logo
                    ? `${baseURL}/uploads/employers/${selectedJob.employer.company_logo}`
                    : undefined
                }
                sx={{
                  width: 60,
                  height: 60,
                  border: "2px solid",
                  borderColor: "rgba(59, 130, 246, 0.3)",
                  boxShadow: "0 4px 12px rgba(30, 58, 138, 0.15)",
                }}
              >
                {selectedJob?.employer?.company_name?.[0]?.toUpperCase() || "?"}
              </Avatar>
              <Box flex={1}>
                <Typography 
                  variant="h6" 
                  fontWeight={700}
                  sx={{
                    background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {selectedJob?.job_title}
                </Typography>
                <Typography variant="subtitle2" sx={{ color: "#f97316" }}>
                  {selectedJob?.employer?.company_name} • {applications.length}{" "}
                  {t('application')}
                  {/* {applications.length !== 1} */}
                </Typography>
              </Box>
              {isMobile && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleBackToList}
                  startIcon={<ArrowBack />}
                  sx={{ 
                    textTransform: "none",
                    borderColor: "#3b82f6",
                    color: "#3b82f6",
                    "&:hover": {
                      borderColor: "#f97316",
                      color: "#f97316",
                      bgcolor: "rgba(249, 115, 22, 0.08)",
                    },
                  }}
                >
                  {t('back_to_jobs')}
                </Button>
              )}
            </Stack>
          </Box>
          <Divider sx={{ borderColor: "rgba(59, 130, 246, 0.15)" }} />
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "rgba(59, 130, 246, 0.15)",
              px: { xs: 1.5, sm: 2 },
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                "& .MuiTab-root": {
                  color: "#1e3a8a",
                  "&.Mui-selected": { color: "#f97316" },
                },
                "& .MuiTabs-indicator": {
                  background: "linear-gradient(90deg, #3b82f6 0%, #f97316 120%)",
                },
              }}
            >
              {TAB_KEYS.map((key, i) => (
                <Tab
                  key={key}
                  label={`${t(key)} (${
                    i === 0
                      ? applications.length
                      : applications.filter(
                          (a) => a.application_status === STATUS_FILTER[i],
                        ).length
                  })`}
                  sx={{ textTransform: "none" }}
                />
              ))}
            </Tabs>
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 1.5, sm: 2 } }}>
            {loadingApps ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100%"
              >
                <CircularProgress sx={{ color: "#3b82f6" }}/>
              </Box>
            ) : filteredApplications.length === 0 ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="100%"
                color="text.secondary"
              >
                <HourglassEmpty sx={{ fontSize: 60, opacity: 0.4, mb: 2, color: "#f97316" }} />
                <Typography variant="h6" sx={{ color: "#1e3a8a" }}>
                  {tabValue === 0
                    ? t("applications.no_applications_yet")
                    : t("applications.no_status_applications", {
                        status: t(TAB_KEYS[tabValue]).toLowerCase(),
                      })}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {filteredApplications.map((app) => {
                  const candidateName =
                    app.candidate?.user?.user_name ||
                    `Candidate #${app.candidate_id}`;
                  const candidateEmail =
                    app.candidate?.user?.email || "No email";

                  return (
                    <Card
                      key={app.pk_id}
                      variant="outlined"
                      onClick={() => {
                        setSelectedCandidateApp(app);
                        setCandidateDetailOpen(true);
                      }}
                      sx={{
                        borderRadius: 2,
                        boxShadow: "0 2px 12px rgba(30, 58, 138, 0.08)",
                        transition: "all 0.2s",
                        cursor: "pointer",
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(239, 246, 255, 0.6) 100%)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(59, 130, 246, 0.15)",
                        "&:hover": { 
                          boxShadow: "0 6px 20px rgba(59, 130, 246, 0.15)",
                          borderColor: "#f97316",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={{ xs: 1.5, sm: 2 }}
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          justifyContent="space-between"
                        >
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                border: "2px solid",
                                borderColor: "rgba(59, 130, 246, 0.3)",
                              }}
                              src={getProfileImageUrl(app)}
                              imgProps={{
                                onError: (e) => {
                                  e.target.onerror = null;
                                  e.target.src = "";
                                },
                              }}
                            >
                              {candidateName?.[0]?.toUpperCase() || "?"}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight={600} sx={{ color: "#1e3a8a" }}>
                                {candidateName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {candidateEmail}
                              </Typography>
                            </Box>
                          </Stack>

                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            alignItems={{ xs: "stretch", sm: "center" }}
                            sx={{
                              width: { xs: "100%", sm: "auto" },
                              mt: { xs: 1, sm: 0 },
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FormControl
                              size="small"
                              sx={{ 
                                minWidth: { xs: "100%", sm: 140 },
                                "& .MuiOutlinedInput-root": {
                                  "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                                }, 
                              }}
                            >
                              <InputLabel sx={{ color: "#1e3a8a" }}>{t('status')}</InputLabel>
                              <Select
                                value={app.application_status || "PENDING"}
                                label="Status"
                                onChange={(e) => {
                                  const newKey = e.target.value;
                                  const newLabel = STATUS_MAP[newKey]?.label;

                                  if (
                                    !newLabel ||
                                    newKey === app.application_status
                                  ) {
                                    return;
                                  }

                                  setConfirmDialog({
                                    open: true,
                                    appId: app.pk_id,
                                    currentStatus: app.application_status,
                                    newStatusLabel: newLabel,
                                    newStatusKey: newKey,
                                  });
                                }}
                              >
                                {Object.entries(STATUS_MAP).map(
                                  ([key, { label }]) => (
                                    <MenuItem key={key} value={key}>
                                      {label}
                                    </MenuItem>
                                  ),
                                )}
                              </Select>
                            </FormControl>

                            {app.cancelled && (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 1,
                                  alignItems: "center",
                                  mt: { xs: 1, sm: 0.5 },
                                }}
                              >
                                <Chip
                                  label={t("canceled_by_the_candidate")}
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  sx={{
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    backgroundColor: "rgba(239, 68, 68, 0.04)",
                                    color: "#ef4444",
                                    height: 36,
                                    px: 1.5,
                                    cursor: "auto",
                                    borderColor: "#ef4444",
                                  }}
                                />

                                {app.reason && (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      p: 0.9,
                                      border: "1px solid",
                                      borderColor: "#ef4444",
                                      borderRadius: 2,
                                      maxWidth: 380,
                                      backgroundColor: "rgba(239, 68, 68, 0.04)",
                                    }}
                                  >
                                    {/* Label */}
                                    <Typography
                                      sx={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#ef4444",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {t("reason")}:
                                    </Typography>

                                    {/* Content */}
                                    <Typography
                                      sx={{
                                        fontSize: 14,
                                        color: "#dc2626",
                                        wordBreak: "break-word",
                                        flex: 1,
                                      }}
                                    >
                                      {app.reason}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            )}
                          </Stack>
                        </Stack>

                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          mt={1.5}
                        >
                          <CalendarIcon fontSize="small" sx={{ color: "#3b82f6" }} />
                          <Typography variant="caption" sx={{ color: "#f97316" }}>
                            Applied:
                            {new Date(app.applied_date).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Box>
        </>
      ) : (
        <Box
          flex={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="text.secondary"
        >
          <Typography 
            variant="h7"
            sx={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t('select_a_job_to_view_applications')}
          </Typography>
        </Box>
      )}
    </Card>
  );

  return (
    <Box
      sx={{
        height: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 0.5,
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            width: { xs: "100%", md: 450 },
            flexShrink: 0,
            display: isMobile && showDetailMobile ? "none" : "block",
          }}
        >
          {JobListContent()}
        </Box>

        <Box
          sx={{
            flex: 1,
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
              : { borderRadius: 2, boxShadow: 1 }),
          }}
        >
          {ApplicationsDetailContent()}
        </Box>
      </Box>

      <Dialog
        open={viewFileOpen}
        onClose={() => {
          setViewFileOpen(false);
        }}
        fullWidth
        maxWidth="md"
        PaperProps={{ 
          sx: { 
            height: "90vh", 
            overflow: "hidden",
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(239, 246, 255, 0.95) 100%)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
          }
        }}
      >
        <DialogContent
          sx={{ p: 0, height: "100%", overflow: "hidden", display: "flex" }}
        >
          {fileType?.startsWith("image/") ? (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8f8f8",
                p: 2,
              }}
            >
              <img
                src={fileUrl}
                alt={fileName}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            </Box>
          ) : fileType === "application/pdf" ? (
            <iframe
              src={fileUrl}
              title="File Preview"
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "text.secondary",
              }}
            >
              <Typography>
                Preview not available for this file type ({fileType})
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(59, 130, 246, 0.15)" }}>
          <Button 
            onClick={() => setViewFileOpen(false)}
            sx={{
              color: "#f97316",
              "&:hover": { color: "#ea580c" },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail candidate */}
      <Dialog
        open={candidateDetailOpen}
        onClose={(even, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") return;
          setCandidateDetailOpen(false);
          setSelectedCandidateApp(null);
        }}
        fullScreen={isMobile}
        fullWidth
        maxWidth="md"
        PaperComponent={DraggablePaper}
        PaperProps={{
          sx: {
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(239, 246, 255, 0.95) 100%)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        {selectedCandidateApp &&
          (() => {
            const candidateName =
              selectedCandidateApp.candidate?.user?.user_name ||
              `Candidate #${selectedCandidateApp.candidate_id}`;
            const userId =
              selectedCandidateApp.candidate?.user?.pk_id ||
              selectedCandidateApp.candidate?.user_id;

            // ─── Prepare rows for DataGrid ───────────────────────────────────────
            const documentRows = [];

            // 1. Resume
            if (selectedCandidateApp.candidate_resume_id) {
              documentRows.push({
                id: "resume",
                documentType: "Resume",
                fileName: `${candidateName}_Resume.pdf`,
                hasFile: true,
                view: () =>
                  handleViewFile(
                    selectedCandidateApp.candidate_resume_id,
                    `${candidateName}_resume`,
                  ),
                download: () =>
                  handleDownload(
                    selectedCandidateApp.candidate_resume_id,
                    `${candidateName}_resume`,
                  ),
              });
            }
            // ─── 2. Cover Letter ──────────────────────────────────
            if (selectedCandidateApp.has_cover_letter) {
              documentRows.push({
                id: "cover-letter",
                documentType: "Cover Letter",
                fileName: `${candidateName}_Cover_Letter.pdf`,
                hasFile: true,
                view: () =>
                  handleViewCoverLetter(
                    selectedCandidateApp.pk_id,
                    candidateName,
                  ),
                download: () =>
                  handleDownloadCoverLetter(
                    selectedCandidateApp.pk_id,
                    candidateName,
                  ),
              });
            } 

            // 3. Attached Images / Files
            (candidateImages || []).forEach((img, index) => {
              const isPdf = img.filename?.toLowerCase().endsWith(".pdf");
              const isImage = /\.(jpg|jpeg|png)$/i.test(img.filename || "");

              const attachmentViewUrl = `${baseURL}/applications/attachments/${img.filename}?disposition=inline`;
              const attachmentDownloadUrl = `${baseURL}/applications/attachments/${img.filename}?disposition=attachment`;

              documentRows.push({
                id: `attachment-${img.id || index}`,
                documentType: isPdf
                  ? "Attached PDF"
                  : isImage
                    ? "Attached Image"
                    : "Attachment",
                fileName:
                  img.original_name || img.filename || `File ${index + 1}`,
                hasFile: true,

                // ─── VIEW ───────────────────────────────────────────────
                view: () => {
                  setFileUrl(attachmentViewUrl);
                  setFileName(img.original_name || img.filename);
                  setFileType(
                    isPdf
                      ? "application/pdf"
                      : isImage
                        ? "image/jpeg"
                        : "application/octet-stream",
                  );
                  setViewFileOpen(true);
                },

                // ─── DOWNLOAD ─────
                download: async () => {
                  try {
                    const res = await api.get(attachmentDownloadUrl, {
                      responseType: "blob",
                    });

                    const blob = new Blob([res.data], {
                      type: res.headers["content-type"],
                    });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = img.original_name || img.filename;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    URL.revokeObjectURL(url);

                    setSnackbar({
                      open: true,
                      message: "File downloaded",
                      severity: "success",
                    });
                  } catch (err) {
                    setSnackbar({
                      open: true,
                      message: "Failed to download attachment",
                      severity: "error",
                    });
                  }
                },
              });
            });

            const documentColumns = [
              {
                field: "documentType",
                headerName: t("applications.documents"),
                width: 160,
                renderCell: (params) => (
                  <Typography 
                    variant="caption" 
                    fontWeight={500}
                    sx={{ 
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      width: "100%",
                      height: "100%", 
                      color: "#1e3a8a",
                    }}
                  >
                    {params.value}
                  </Typography>
                ),
              },
              {
                field: "fileName",
                headerName: t("applications.file_name"),
                flex: 1,
                minWidth: 220,
                renderCell: (params) => (
                  <Typography
                    variant="caption"
                    color={
                      params.row.hasFile ? "text.primary" : "text.disabled"
                    }
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {params.value}
                  </Typography>
                ),
              },
              {
                field: "actions",
                headerName: t("applications.actions"),
                width: 140,
                sortable: false,
                align: "center",
                renderCell: (params) => (
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {params.row.hasFile && params.row.view && (
                      <Tooltip title={t("applications.view")}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            params.row.view();
                          }}
                          sx={{ color: "#3b82f6", "&:hover": { color: "#1e3a8a" } }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {params.row.hasFile && params.row.download && (
                      <Tooltip title={t("download")}>
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={(e) => {
                            e.stopPropagation();
                            params.row.download();
                          }}
                          sx={{ color: "#f97316", "&:hover": { color: "#ea580c" } }}
                        >
                          <FileDownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {!params.row.hasFile && (
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ py: 1 }}
                      >
                        Not uploaded
                      </Typography>
                    )}
                  </Stack>
                ),
              },
            ];

            return (
              <>
                {/* Header */}
                <Stack
                  id="draggable-dialog-title"
                  direction="row"
                  sx={{
                    p: 1.5,
                    pb: 1.5,
                    borderBottom: "2px solid",
                    borderImage: "linear-gradient(90deg, #3b82f6 0%, #f97316 100%) 1",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "move",
                    background: "linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(249, 115, 22, 0.03) 100%)",
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    fontWeight={600}
                    sx={{
                      background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {t('applications.candidate_details')}
                  </Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setCandidateDetailOpen(false)}
                    sx={{ color: "#f97316", "&:hover": { color: "#ea580c" } }}
                  >
                    <CancelOutlined fontSize="small" />
                  </IconButton>
                </Stack>

                {/* Content */}
                <DialogContent
                  dividers={false}
                  sx={{ px: 3, py: 1.5, overflow: "visible" }}
                >
                  <Stack spacing={2.5}>
                    {/* Candidate basic info + message button */}
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                          fontSize: "2rem",
                          border: "3px solid",
                          borderColor: "rgba(59, 130, 246, 0.4)",
                          boxShadow: "0 4px 12px rgba(30, 58, 138, 0.15)",
                        }}
                        src={getProfileImageUrl(selectedCandidateApp)}
                        imgProps={{
                          onError: (e) => {
                            e.target.onerror = null;
                            e.target.src = "";
                          },
                        }}
                      >
                        {candidateName?.[0]?.toUpperCase() || "?"}
                      </Avatar>

                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1e3a8a" }}>
                          {candidateName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#f97316" }}>
                          {selectedCandidateApp.candidate?.user?.email || "—"}
                        </Typography>
                      </Box>

                      <Tooltip title={`${t("message")} ${candidateName}`}>
                        <IconButton
                          color="success"
                          size="large"
                          onClick={() => handleSelect(userId)}
                          sx={{
                            color: "#3b82f6",
                            "&:hover": { color: "#f97316", transform: "scale(1.1)" },
                            transition: "all 0.2s",
                          }}
                        >
                          <FaFacebookMessenger size={34} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    {/* Personal Information */}
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PersonOutlineSharp sx={{ color: "#3b82f6" }} />
                        <Typography variant="body1" fontWeight={700} sx={{ color: "#1e3a8a" }}>
                          {t('applications.personal_information')}
                        </Typography>
                      </Stack>

                      <Divider sx={{ mb: 1, borderColor: "rgba(59, 130, 246, 0.15)" }} />

                      <Stack spacing={1.2} sx={{ pl: 1 }}>
                        <InfoRow
                          label={t("phone")}
                          value={
                            selectedCandidateApp.candidate?.user?.phone || "—"
                          }
                        />
                        <InfoRow
                          label={t("gender")}
                          value={
                            selectedCandidateApp.candidate?.user?.gender
                              ? selectedCandidateApp.candidate.user.gender
                                  .charAt(0)
                                  .toUpperCase() +
                                selectedCandidateApp.candidate.user.gender
                                  .slice(1)
                                  .toLowerCase()
                              : "—"
                          }
                        />
                        <InfoRow
                          label={t("date_of_birth")}
                          value={
                            selectedCandidateApp.candidate?.user?.date_of_birth
                              ? new Date(
                                  selectedCandidateApp.candidate.user
                                    .date_of_birth,
                                ).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"
                          }
                        />
                        <InfoRow
                          label={t("address")}
                          value={
                            selectedCandidateApp.candidate?.user?.address || "—"
                          }
                        />
                      </Stack>
                      <Divider sx={{ mb: 1, mt: 1, borderColor: "rgba(59, 130, 246, 0.15)" }} />
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <DescriptionOutlined
                            fontSize="small"
                            sx={{ color: "#f97316" }}
                          />

                          <Typography variant="subtitle1" fontWeight={600} sx={{ color: "#1e3a8a" }}>
                            {t('applications.application_documents')}
                          </Typography>
                        </Stack>

                        <Box
                          sx={{
                            height: "calc(50vh - 100px)",
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: "rgba(59, 130, 246, 0.2)",
                            boxShadow: "0 1px 4px rgba(30, 58, 138, 0.06)",
                            "& .MuiDataGrid-root": {
                              border: "none",
                            },
                            "& .MuiDataGrid-columnHeaders": {
                              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(249, 115, 22, 0.04) 100%)",
                              borderBottom: "1px solid rgba(59, 130, 246, 0.15)",
                            },
                            "& .MuiDataGrid-row:hover": {
                              background: "rgba(59, 130, 246, 0.04)",
                            },
                          }}
                        >
                          <DataGrid
                            rows={documentRows}
                            columns={documentColumns}
                            disableRowSelectionOnClick
                            rowHeight={45}
                            density="compact"
                            pageSizeOptions={[5, 10]}
                            initialState={{
                              pagination: {
                                paginationModel: { pageSize: 5 },
                              },
                            }}
                          />
                        </Box>
                      </Box>
                      {/* Status Selector in Detail Dialog */}

                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        justifyContent="center"
                        sx={{mt: 2 }}
                      >
                        <FormControl
                          sx={{
                            minWidth: 140,
                            "& .MuiOutlinedInput-root": {
                              "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                            },
                          }}
                        >
                          <InputLabel sx={{ color: "#1e3a8a" }}>{t("applications.application_status")}</InputLabel>
                          <Select
                            value={
                              selectedCandidateApp.application_status ||
                              "PENDING"
                            }
                            label="Application Status"
                            size="small"
                            onChange={(e) => {
                              const newKey = e.target.value;
                              const newLabel = STATUS_MAP[newKey]?.label;

                              if (
                                !newLabel ||
                                newKey ===
                                  selectedCandidateApp.application_status
                              ) {
                                return;
                              }

                              setConfirmDialog({
                                open: true,
                                appId: selectedCandidateApp.pk_id,
                                currentStatus:
                                  selectedCandidateApp.application_status,
                                newStatusLabel: newLabel,
                                newStatusKey: newKey,
                              });
                            }}
                          >
                            {Object.entries(STATUS_MAP).map(
                              ([key, { label }]) => (
                                <MenuItem key={key} value={key}>
                                  {label}
                                </MenuItem>
                              ),
                            )}
                          </Select>
                        </FormControl>

                        <Chip
                          label={
                            STATUS_MAP[selectedCandidateApp.application_status]
                              ?.label || "Pending"
                          }
                          color={
                            STATUS_MAP[selectedCandidateApp.application_status]
                              ?.color || "warning"
                          }
                          size="small"
                          sx={{ 
                            fontWeight: 600, 
                            minWidth: 100,
                            ...(selectedCandidateApp.application_status === "ACCEPTED" && {
                              bgcolor: "#10b981",
                              color: "white",
                            }),
                            ...(selectedCandidateApp.application_status === "SHORTLISTED" && {
                              bgcolor: "#3b82f6",
                              color: "white",
                            }),
                            ...(selectedCandidateApp.application_status === "REJECTED" && {
                              bgcolor: "#ef4444",
                              color: "white",
                            }),
                            ...(selectedCandidateApp.application_status === "PENDING" && {
                              bgcolor: "#f97316",
                              color: "white",
                            }),
                          }}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </DialogContent>
              </>
            );
          })()}
      </Dialog>

      {/* Confirm status */}
      <Dialog
        open={confirmDialog.open}
        onClose={(even, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") return;
          setConfirmDialog({ ...confirmDialog, open: false });
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(239, 246, 255, 0.95) 100%)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: 3,
          },
        }}
      >
        {/* Title */}
        <DialogTitle
          sx={{
            fontWeight: 600,
            fontSize: 16,
            py: 1.2,
            px: 2,
            color: "#1e3a8a",
            borderBottom: "1px solid rgba(59, 130, 246, 0.15)",
          }}
        >
          {t('applications.confirm_status_change')}
        </DialogTitle>
        <Divider />

        {/* Content */}
        <DialogContent sx={{ py: 1.5, px: 2 }}>
          <Box component="p" sx={{ fontSize: 14, lineHeight: 1.5, color: "#1e3a8a" }}>
            {t('applications.confirm_status_change_message')}{" "}
            <Box component="span" sx={{ fontWeight: 600, color: "#f97316" }}>
              {STATUS_MAP[confirmDialog.currentStatus]?.label ||
                confirmDialog.currentStatus}
            </Box>{" "}
            {t('applications.to')}{" "}
            <Box component="span" sx={{ fontWeight: 600, color: "#f97316" }}>
              {confirmDialog.newStatusLabel}
            </Box>
            ?
          </Box>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ px: 2, pb: 2, borderTop: "1px solid rgba(59, 130, 246, 0.1)" }}>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CancelOutlined />}
              onClick={() =>
                setConfirmDialog({ ...confirmDialog, open: false })
              }
              sx={{ 
                textTransform: "none",
                borderColor: "#3b82f6",
                color: "#3b82f6",
                "&:hover": { borderColor: "#f97316", color: "#f97316" },
              }}
            >
              {t('cancel')}
            </Button>

            <Button
              size="small"
              variant="contained"
              startIcon={<CheckCircleOutline />}
              sx={{ 
                textTransform: "none",
                background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 0%, #f97316 120%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #1e40af 0%, #2563eb 0%, #ea580c 120%)",
                },
              }}
              onClick={async () => {
                if (!confirmDialog.appId || !confirmDialog.newStatusLabel)
                  return;

                await handleStatusChange(
                  confirmDialog.appId,
                  confirmDialog.newStatusLabel,
                );

                setConfirmDialog({ ...confirmDialog, open: false });
              }}
            >
              {t('confirm')}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ 
            width: "100%",
            ...(snackbar.severity === "success" && {
              bgcolor: "#10b981",
              color: "white",
            }),
            ...(snackbar.severity === "error" && {
              bgcolor: "#ef4444",
              color: "white",
            }),
            ...(snackbar.severity === "warning" && {
              bgcolor: "#f97316",
              color: "white",
            }),
            ...(snackbar.severity === "info" && {
              bgcolor: "#3b82f6",
              color: "white",
            }),
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
