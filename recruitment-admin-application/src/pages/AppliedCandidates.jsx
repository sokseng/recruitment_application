// src/pages/AppliedCandidates.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar,
  Chip,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CardContent,
  Tabs,
  Tab,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  DialogTitle,
  Paper,
  TextField,
} from "@mui/material";
import {
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  HourglassEmpty,
  Home,
  FileDownload as FileDownloadIcon,
  Visibility as VisibilityIcon,
  CancelOutlined,
  CheckCircleOutline,
  PersonOutlineSharp,
  DescriptionOutlined,
} from "@mui/icons-material";
import api from "../services/api";
import { FaFacebookMessenger } from "react-icons/fa";
import { DataGrid } from "@mui/x-data-grid";
import Draggable from "react-draggable";

// ────────────────────────────────────────────────
//      Draggable Paper
// ────────────────────────────────────────────────
function DraggablePaper(props) {
  const nodeRef = useRef(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
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
const STATUS_FILTER = ["", "PENDING", "SHORTLISTED", "REJECTED", "ACCEPTED"];

export default function AppliedCandidates() {
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
      loadCandidateImages(selectedCandidateApp.candidate_resume_id);
    } else {
      setCandidateImages([]);
    }
  }, [candidateDetailOpen, selectedCandidateApp]);

  const loadCandidateImages = async (resumeId) => {
    if (!resumeId) return;

    try {
      setLoadingImages(true);
      const res = await api.get(
        `/applications/attach-file/${selectedCandidateApp.pk_id}/resume-images`,
      );
      console.log("Loaded images from API:", res.data);
      setCandidateImages(res.data || []);
    } catch (err) {
      console.error("Image load error:", err?.response?.data);
      setCandidateImages([]);
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
        message: `Status updated to ${newStatusLabel}`,
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

  // ─── Job List ───────────────────────────────────────────────
  const JobListContent = () => (
    <Card
      sx={{
        height: { xs: "80vh", sm: "100%" },
        display: "flex",
        flexDirection: "column",
        border: "3px solid",
        borderColor: "divider",
        backgroundColor: "#FAFAFA",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h7" fontWeight={700} color="primary.dark">
          Your Jobs with Applications
        </Typography>
      </Box>
      <Divider />
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
            <WorkIcon sx={{ fontSize: 60, opacity: 0.3, mb: 2 }} />
            <Typography variant="subtitle2">
              No jobs with applications yet
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, textAlign: "center" }}>
              When candidates apply, their jobs will appear here.
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
                  bgcolor: isActive ? "action.selected" : "transparent",
                  borderLeft: isActive ? "4px solid" : "4px solid transparent",
                  borderColor: isActive ? "primary.main" : "transparent",
                  borderBottom: "1px solid",
                  borderBottomColor: "divider",
                  "&:hover": { bgcolor: "action.hover" },
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
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    {job.employer?.company_name?.[0]?.toUpperCase() || "?"}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
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
        sx={{ flex: 1, textAlign: "right" }}
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
        border: "3px solid",
        borderColor: "divider",
        backgroundColor: "#FAFAFA",
      }}
    >
      {isMobile && (
        <AppBar position="sticky" color="default" elevation={1}>
          <Toolbar variant="dense" />
        </AppBar>
      )}

      {selectedJobId ? (
        <>
          <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: "#FAFAFA" }}>
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
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                {selectedJob?.employer?.company_name?.[0]?.toUpperCase() || "?"}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight={700}>
                  {selectedJob?.job_title}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {selectedJob?.employer?.company_name} • {applications.length}{" "}
                  application
                  {applications.length !== 1 ? "s" : ""}
                </Typography>
              </Box>
              {isMobile && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleBackToList}
                  startIcon={<Home />}
                  sx={{ textTransform: "none" }}
                >
                  Back
                </Button>
              )}
            </Stack>
          </Box>
          <Divider />
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              px: { xs: 1.5, sm: 2 },
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              {TAB_LABELS.map((label, i) => (
                <Tab
                  key={label}
                  label={`${label} (${
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
                <CircularProgress />
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
                <HourglassEmpty sx={{ fontSize: 60, opacity: 0.4, mb: 2 }} />
                <Typography variant="h6">
                  {tabValue === 0
                    ? "No applications yet"
                    : `No ${TAB_LABELS[tabValue].toLowerCase()} applications`}
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
                        boxShadow: 1,
                        transition: "box-shadow 0.2s",
                        "&:hover": { boxShadow: 3 },
                        cursor: "pointer",
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
                                bgcolor: "primary.main",
                              }}
                            >
                              {candidateName?.[0]?.toUpperCase() || "?"}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight={600}>
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
                              sx={{ minWidth: { xs: "100%", sm: 140 } }}
                            >
                              <InputLabel>Status</InputLabel>
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
                                  gap: 1.5,
                                  alignItems: "center",
                                  mt: { xs: 1, sm: 0.5 },
                                }}
                              >
                                <Chip
                                  label="Canceled by the candidate"
                                  color="error"
                                  size="medium"
                                  sx={{
                                    fontWeight: 600,
                                    borderRadius: "12px",
                                    backgroundColor: "rgba(211, 47, 47, 0.14)",
                                    color: "error.dark",
                                    height: 36,
                                    px: 1.5,
                                  }}
                                />

                                {app.reason && (
  
                                <Chip
                                    label={`Reason: ${app.reason}`}
                                    variant="outlined"
                                    size="medium"
                                    sx={{
                                      borderRadius: "12px",
                                      borderColor: "error.light",
                                      color: "error.main",
                                      backgroundColor:
                                        "rgba(211, 47, 47, 0.05)",
                                      fontWeight: 500,
                                      height: 36,
                                      maxWidth: 380,
                                      "& .MuiChip-label": {
                                        paddingLeft: 1.5,
                                        paddingRight: 1.5,
                                      },
                                    }}
                                  />
                                  
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
                          <CalendarIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
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
          <Typography variant="h7">
            Select a job to view applications
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
        PaperProps={{ sx: { height: "90vh", overflow: "hidden" } }}
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
        <DialogActions>
          <Button onClick={() => setViewFileOpen(false)}>Close</Button>
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
        maxWidth="md"
        PaperProps={{ sx: { height: "85vh", overflow: "hidden" } }}
        PaperComponent={DraggablePaper}
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
            } else {
              documentRows.push({
                id: "cover-letter",
                documentType: "Cover Letter",
                fileName: "Not uploaded",
                hasFile: false,
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
                headerName: "Document",
                width: 160,
                renderCell: (params) => (
                  <Typography variant="body2" fontWeight={500}>
                    {params.value}
                  </Typography>
                ),
              },
              {
                field: "fileName",
                headerName: "File Name",
                flex: 1,
                minWidth: 220,
                renderCell: (params) => (
                  <Typography
                    variant="body2"
                    color={
                      params.row.hasFile ? "text.primary" : "text.disabled"
                    }
                  >
                    {params.value}
                  </Typography>
                ),
              },
              {
                field: "actions",
                headerName: "Actions",
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
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            params.row.view();
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {params.row.hasFile && params.row.download && (
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={(e) => {
                            e.stopPropagation();
                            params.row.download();
                          }}
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
                  direction="row"
                  sx={{
                    p: 1.5,
                    pb: 1.5,
                    borderBottom: 1,
                    borderColor: "divider",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  id="draggable-dialog-title"
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    Candidate Details
                  </Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setCandidateDetailOpen(false)}
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
                          width: 50,
                          height: 50,
                          bgcolor: "primary.dark",
                          fontSize: "1.6rem",
                          fontWeight: "bold",
                        }}
                      >
                        {candidateName?.[0]?.toUpperCase() || "?"}
                      </Avatar>

                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {candidateName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedCandidateApp.candidate?.user?.email || "—"}
                        </Typography>
                      </Box>

                      <Tooltip title={`Message ${candidateName}`}>
                        <IconButton
                          color="success"
                          size="large"
                          onClick={() => handleSelect(userId)}
                        >
                          <FaFacebookMessenger size={34} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    {/* Personal Information */}
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PersonOutlineSharp color="primary" />
                        <Typography variant="body1" fontWeight={700}>
                          Personal Information
                        </Typography>
                      </Stack>

                      <Divider sx={{ mb: 1 }} />

                      <Stack spacing={1.2} sx={{ pl: 1 }}>
                        <InfoRow
                          label="Phone"
                          value={
                            selectedCandidateApp.candidate?.user?.phone || "—"
                          }
                        />
                        <InfoRow
                          label="Gender"
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
                          label="Date of Birth"
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
                          label="Address"
                          value={
                            selectedCandidateApp.candidate?.user?.address || "—"
                          }
                        />
                      </Stack>
                      <Divider sx={{ mb: 1, mt: 1 }} />
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <DescriptionOutlined
                            fontSize="small"
                            color="primary"
                          />

                          <Typography variant="subtitle1" fontWeight={600}>
                            Application Documents
                          </Typography>
                        </Stack>

                        <Box sx={{ width: "100%" }}>
                          <DataGrid
                            rows={documentRows}
                            columns={documentColumns}
                            disableRowSelectionOnClick
                            autoHeight
                            density="compact"
                            rowHeight={40}
                            pageSizeOptions={[5, 10, 20]}
                            initialState={{
                              pagination: {
                                paginationModel: { pageSize: 5 },
                              },
                            }}
                            sx={{
                              border: 1,
                              borderColor: "divider",
                              borderRadius: 1.5,
                              bgcolor: "background.paper",
                              fontSize: 13,

                              "& .MuiDataGrid-columnHeaders": {
                                bgcolor: "action.hover",
                                borderBottom: 1,
                                borderColor: "divider",
                              },

                              "& .MuiDataGrid-columnHeaderTitle": {
                                fontWeight: 600,
                                width: "100%",
                                textAlign: "center",
                              },

                              "& .MuiDataGrid-cell": {
                                py: 0.5,
                              },

                              "& .MuiDataGrid-row:hover": {
                                bgcolor: "action.hover",
                              },

                              "& .MuiDataGrid-footerContainer": {
                                borderTop: 1,
                                borderColor: "divider",
                                minHeight: 32,
                              },

                              "& .MuiTablePagination-root": {
                                fontSize: 12,
                                minHeight: 32,
                              },

                              "& .MuiTablePagination-selectLabel": {
                                fontSize: 12,
                              },

                              "& .MuiTablePagination-displayedRows": {
                                fontSize: 12,
                              },

                              "& .MuiTablePagination-select": {
                                fontSize: 12,
                                paddingTop: 0,
                                paddingBottom: 0,
                              },

                              "& .MuiTablePagination-actions": {
                                transform: "scale(0.85)",
                              },

                              "& .MuiToolbar-root": {
                                minHeight: "28px !important",
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
                        sx={{ pl: 1, mt: 2 }}
                      >
                        <FormControl
                          sx={{
                            minWidth: 140,
                            "& .MuiInputBase-root": {
                              height: 30,
                              fontSize: 13,
                              paddingTop: 0,
                              paddingBottom: 0,
                            },
                            "& .MuiSelect-select": {
                              paddingTop: 4,
                              paddingBottom: 4,
                            },
                            "& .MuiInputLabel-root": {
                              fontSize: 13,
                            },
                          }}
                        >
                          <InputLabel>Application Status</InputLabel>
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
                          sx={{ fontWeight: 600, minWidth: 100 }}
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
      >
        {/* Title */}
        <DialogTitle
          sx={{
            fontWeight: 600,
            fontSize: 16,
            py: 1.2,
            px: 2,
          }}
        >
          Confirm Status Change
        </DialogTitle>
        <Divider />

        {/* Content */}
        <DialogContent sx={{ py: 1.5, px: 2 }}>
          <Box component="p" sx={{ fontSize: 14, lineHeight: 1.5 }}>
            Change status from{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>
              {STATUS_MAP[confirmDialog.currentStatus]?.label ||
                confirmDialog.currentStatus}
            </Box>{" "}
            to{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>
              {confirmDialog.newStatusLabel}
            </Box>
            ?
          </Box>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CancelOutlined />}
              onClick={() =>
                setConfirmDialog({ ...confirmDialog, open: false })
              }
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>

            <Button
              size="small"
              variant="contained"
              startIcon={<CheckCircleOutline />}
              sx={{ textTransform: "none" }}
              color={
                confirmDialog.newStatusLabel === "Rejected"
                  ? "error"
                  : confirmDialog.newStatusLabel === "Accepted"
                    ? "success"
                    : confirmDialog.newStatusLabel === "Shortlisted"
                      ? "primary"
                      : "warning"
              }
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
              Confirm
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
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
