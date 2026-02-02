// AppliedCandidates.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
} from "@mui/material";
import {
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  HourglassEmpty,
  Home,
  FileDownload as FileDownloadIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import api from "../services/api";

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

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    loadMyJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadApplications(selectedJobId);
      setTabValue(0);
    }
  }, [selectedJobId]);

  const loadMyJobs = async () => {
    try {
      setLoadingJobs(true);
      const res = await api.get("/jobs/my-jobs?limit=100");
      const jobs = res.data || [];
      setMyJobs(jobs);
      if (jobs.length > 0) {
        let initialJobId;
        if (selectedJobFromUrl) {
          const found = jobs.find((j) => j.pk_id === Number(selectedJobFromUrl));
          initialJobId = found ? found.pk_id : jobs[0].pk_id;
        } else {
          initialJobId = jobs[0].pk_id;
        }
        setSelectedJobId(initialJobId);
        if (!selectedJobFromUrl) {
          setSearchParams({ job: initialJobId.toString() }, { replace: true });
        }
      }
    } catch (err) {
      setError("Failed to load your posted jobs");
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
      (k) => STATUS_MAP[k].label === newStatusLabel
    );
    if (!newKey) return;

    try {
      await api.patch(`/applications/${appId}/status`, {
        new_status: newStatusLabel,
      });
      setApplications((prev) =>
        prev.map((app) =>
          app.pk_id === appId ? { ...app, application_status: newKey } : app
        )
      );
      setSnackbar({
        open: true,
        message: `Status updated to ${newStatusLabel}`,
        severity: "success",
      });
    } catch (err) {
      console.error("Update failed:", err?.response?.data);
      setSnackbar({
        open: true,
        message: err?.response?.data?.detail || "Failed to update status",
        severity: "error",
      });
    }
  };

  const handleDownload = async (resumeId, fileName = "resume.pdf") => {
    if (!resumeId) return;

    try {
      const res = await api.get(`/applications/resumes/${resumeId}/file`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to download resume",
        severity: "error",
      });
    }
  };

  const handleViewFile = async (resumeId, fileName = "resume") => {
    if (!resumeId) return;

    try {
      const res = await api.get(`/applications/resumes/${resumeId}/file`, {
        responseType: "blob",
      });

      const contentType = res.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([res.data], { type: contentType });
      const url = URL.createObjectURL(blob);

      // Office documents → better to download than try to preview
      if (
        contentType.includes("word") ||
        contentType.includes("officedocument") ||
        contentType.includes("spreadsheet") ||
        contentType.includes("excel")
      ) {
        handleDownload(resumeId, fileName);
        return;
      }

      setFileUrl(url);
      setFileName(fileName);
      setFileType(contentType);
      setViewFileOpen(true);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Unable to load resume preview",
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
          (app) => app.application_status === STATUS_FILTER[tabValue]
        );

  if (loadingJobs)
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

  if (error)
    return (
      <Box sx={{ p: 3, height: "100%" }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );

  // ─── Job List ───────────────────────────────────────────────
  const JobListContent = () => (
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
      <Box sx={{ p: 2 }}>
        <Typography variant="h7" fontWeight={700} color="primary.dark">
          Your Posted Jobs
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
            <Typography variant="subtitle1">No jobs posted yet</Typography>
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
                    label={job.status}
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

  // ─── Applications with Tabs ─────────────────────────────────
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
                <Typography variant="h7" fontWeight={700}>
                  {selectedJob?.job_title}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {selectedJob?.employer?.company_name} • {applications.length}{" "}
                  application{applications.length !== 1 ? "s" : ""}
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
                  sx={{ textTransform: "none" }}
                  key={label}
                  label={`${label} (${
                    i === 0
                      ? applications.length
                      : applications.filter(
                          (a) => a.application_status === STATUS_FILTER[i]
                        ).length
                  })`}
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
                  const statusObj =
                    STATUS_MAP[app.application_status] || {
                      label: app.application_status,
                      color: "default",
                    };

                  const candidateName =
                    app.candidate?.user?.user_name ||
                    `Candidate #${app.candidate_id}`;
                  const candidateEmail =
                    app.candidate?.user?.email || "No email available";

                  const resumeId = app.candidate_resume_id;
                  const resumeFileName =
                    app.resume?.resume_file ||
                    `resume-${candidateName.replace(/\s+/g, "-").toLowerCase()}.pdf`;

                  const hasResume = !!resumeId;

                  return (
                    <Card
                      key={app.pk_id}
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        boxShadow: 1,
                        transition: "box-shadow 0.2s",
                        "&:hover": { boxShadow: 3 },
                        overflow: "hidden",
                      }}
                    >
                      <CardContent
                        sx={{ p: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 } }}
                      >
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={{ xs: 1.5, sm: 2 }}
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          justifyContent="space-between"
                          mb={{ xs: 1.5, sm: 1.5 }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                fontSize: "1rem",
                                bgcolor: "primary.main",
                              }}
                            >
                              {candidateName?.[0]?.toUpperCase() || "?"}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="body1"
                                fontWeight={600}
                                lineHeight={1.2}
                              >
                                {candidateName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.25 }}
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
                                  const key = e.target.value;
                                  const label = STATUS_MAP[key]?.label;
                                  if (label) handleStatusChange(app.pk_id, label);
                                }}
                                sx={{ fontSize: "0.875rem", height: 36 }}
                              >
                                {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                                  <MenuItem key={key} value={key}>
                                    {label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>

                            {hasResume ? (
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Tooltip title="View Resume">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleViewFile(resumeId, resumeFileName)}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Download Resume">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleDownload(resumeId, resumeFileName)}
                                  >
                                    <FileDownloadIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            ) : (
                              <Tooltip title="Candidate applied without attaching a resume">
                                <Chip
                                  label="No resume"
                                  size="small"
                                  color="default"
                                  variant="outlined"
                                  sx={{ height: 36, fontSize: "0.875rem" }}
                                />
                              </Tooltip>
                            )}
                          </Stack>
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                          <CalendarIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            Applied: {new Date(app.applied_date).toLocaleDateString()}
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
          <Typography variant="h6">
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
        boxSizing: "border-box",
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
              : { borderRadius: 2, boxShadow: 1 }),
          }}
        >
          {ApplicationsDetailContent()}
        </Box>
      </Box>

      {/* View File Dialog */}
      <Dialog
        open={viewFileOpen}
        onClose={() => {
          setViewFileOpen(false);
          if (fileUrl) URL.revokeObjectURL(fileUrl);
        }}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            height: "90vh",
            overflow: "hidden",
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            height: "100%",
            overflow: "hidden",
          }}
        >
          {fileType.startsWith("image") ? (
            <Box
              component="img"
              src={fileUrl}
              alt="Resume"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <iframe
              src={fileUrl}
              title="Resume Viewer"
              width="100%"
              height="100%"
              style={{
                border: "none",
                overflow: "auto",
              }}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ py: 0.5, px: 2 }}>
          <Button size="small" onClick={() => setViewFileOpen(false)}>
            Close
          </Button>
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