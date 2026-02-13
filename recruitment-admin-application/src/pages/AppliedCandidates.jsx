// src/pages/AppliedCandidates.jsx
import { useEffect, useState } from "react";
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
} from "@mui/material";
import {
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  HourglassEmpty,
  Home,
  FileDownload as FileDownloadIcon,
  Visibility as VisibilityIcon,
  ChatBubble as ChatBubbleIcon,
  CancelOutlined,
  CheckCircleOutline,
  Cancel,
  PersonOutlineOutlined,
  PersonOutline,
  PersonOutlineSharp,
  CancelPresentationOutlined,
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

  useEffect(() => {
    loadMyJobsWithApplicationCounts();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadApplications(selectedJobId);
      setTabValue(0);
    }
  }, [selectedJobId]);

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
        (job) => (countsMap[job.pk_id] || 0) >= 1
      );

      setMyJobs(jobsWithApplications);

      if (jobsWithApplications.length > 0) {
        let initialJobId;
        if (selectedJobFromUrl) {
          const found = jobsWithApplications.find(
            (j) => j.pk_id === Number(selectedJobFromUrl)
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
      setSnackbar({
        open: true,
        message: err?.response?.data?.detail || "Failed to update status",
        severity: "error",
      });
    }
  };

  // ────────────────────────────────────────────────
  // Combined PDF – View & Download
  // ────────────────────────────────────────────────

  const getCombinedPdfUrl = (applicationId) =>
    `${baseURL}/applications/${applicationId}/combined-pdf`;

  const handleViewCombined = (appId, candidateName) => {
    const url = getCombinedPdfUrl(appId);
    setFileUrl(url);
    setFileName(`Application - ${candidateName.replace(/\s+/g, "_")}.pdf`);
    setFileType("application/pdf");
    setViewFileOpen(true);
  };

  const handleDownloadCombined = async (appId, candidateName) => {
    try {
      const res = await api.get(`/applications/${appId}/combined-pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Application_${candidateName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setSnackbar({
        open: true,
        message: "Combined PDF downloaded",
        severity: "success",
      });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Could not download combined PDF",
        severity: "error",
      });
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
          (app) => app.application_status === STATUS_FILTER[tabValue]
        );

  if (loadingJobs) {
    return (
      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
            <Typography variant="subtitle2">No jobs with applications yet</Typography>
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
                    sx={{ width: 48, height: 48, border: "1px solid", borderColor: "divider" }}
                  >
                    {job.employer?.company_name?.[0]?.toUpperCase() || "?"}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {job.job_title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {job.employer?.company_name || "—"} • {job.location || "—"}
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
    <Stack direction="row" justifyContent="space-between" sx={{ maxWidth: 400 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
        {label}:
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ flex: 1, textAlign: "right" }}>
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
                sx={{ width: 60, height: 60, border: "1px solid", borderColor: "divider" }}
              >
                {selectedJob?.employer?.company_name?.[0]?.toUpperCase() || "?"}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight={700}>
                  {selectedJob?.job_title}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {selectedJob?.employer?.company_name} • {applications.length} application
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
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: { xs: 1.5, sm: 2 } }}>
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
                  label={`${label} (${i === 0
                    ? applications.length
                    : applications.filter((a) => a.application_status === STATUS_FILTER[i]).length
                  })`}
                  sx={{ textTransform: "none" }}
                />
              ))}
            </Tabs>
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 1.5, sm: 2 } }}>
            {loadingApps ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
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
                    app.candidate?.user?.user_name || `Candidate #${app.candidate_id}`;
                  const candidateEmail = app.candidate?.user?.email || "No email";
                  const resumeId = app.candidate_resume_id;
                  const hasResume = !!resumeId;
                  const userId = app.candidate?.user?.pk_id || app.candidate?.user_id;

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
                              <Chip
                                label="Canceled by the candidate"
                                color="error"
                                size="small"
                                variant="filled"
                                sx={{ fontWeight: 500 }}
                              />
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
                            Applied:{" "}
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
          <Typography variant="h7">Select a job to view applications</Typography>
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
                  transform: showDetailMobile ? "translateX(0)" : "translateX(100%)",
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

      {/* Combined PDF Viewer Dialog */}
      <Dialog
        open={viewFileOpen}
        onClose={() => {
          setViewFileOpen(false);
          if (fileUrl && !fileUrl.startsWith("blob:")) {
            // Only revoke blob URLs
          }
        }}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { height: "90vh", overflow: "hidden" } }}
      >
        <DialogContent sx={{ p: 0, height: "100%", overflow: "hidden" }}>
          {fileType === "application/pdf" ? (
            <iframe
              src={fileUrl}
              title="Combined Application PDF"
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "text.secondary",
              }}
            >
              <Typography>Preview not available for this file type</Typography>
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
        onClose={() => {
          setCandidateDetailOpen(false);
          setSelectedCandidateApp(null);
        }}
        fullWidth
        maxWidth="xs"
        scroll="body"
      >
        {selectedCandidateApp && (() => {
          const candidateName =
            selectedCandidateApp.candidate?.user?.user_name ||
            `Candidate #${selectedCandidateApp.candidate_id}`;
          const resumeId = selectedCandidateApp.candidate_resume_id;
          const hasResume = !!resumeId;
          const userId =
            selectedCandidateApp.candidate?.user?.pk_id ||
            selectedCandidateApp.candidate?.user_id;

          return (
            <>
              <Stack direction={"row"} sx={{ p: 1.5, pb: 1, borderBottom: 1, borderColor: "divider", justifyContent: "space-between" }}>
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

              <DialogContent dividers sx={{ px: 1.5, py: 1.5 }}>
                <Stack spacing={2}>
                  {/* Basic Info */}
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: "primary.dark",
                        fontSize: "1.4rem",
                        fontWeight: "bold",
                      }}
                    >
                      {candidateName?.[0]?.toUpperCase() || "?"}
                    </Avatar>

                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {candidateName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedCandidateApp.candidate?.user?.email || "—"}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Personal Information */}
                  <Box>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.7}
                      sx={{ mb: 0.5 }}
                    >
                      <PersonOutlineSharp color="primary" sx={{ fontSize: 18 }} />

                      <Typography variant="body2" fontWeight={700}>
                        Personal Information
                      </Typography>
                    </Stack>
                    <Divider sx={{mb: 1}}/>
                    <Stack spacing={1} sx={{ pl: 0.5 }}>
                      <InfoRow
                        label="Phone"
                        value={selectedCandidateApp.candidate?.user?.phone || ""}
                      />
                      <InfoRow
                        label="Gender"
                        value={
                          selectedCandidateApp.candidate?.user?.gender
                            ? selectedCandidateApp.candidate.user.gender.charAt(0).toUpperCase() +
                              selectedCandidateApp.candidate.user.gender.slice(1).toLowerCase()
                            : ""
                        }
                      />
                      <InfoRow
                        label="Date of Birth"
                        value={
                          selectedCandidateApp.candidate?.user?.date_of_birth
                            ? new Date(
                                selectedCandidateApp.candidate.user.date_of_birth
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : ""
                        }
                      />
                      <InfoRow
                        label="Address"
                        value={selectedCandidateApp.candidate?.user?.address || ""}
                      />
                    </Stack>
                  </Box>

                  {/* Professional Summary */}
                  {selectedCandidateApp.candidate?.description && (
                    <Box>
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        Professional Summary
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                        {selectedCandidateApp.candidate.description}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </DialogContent>

              {/* Actions Footer */}
              <DialogActions sx={{ px: 2, py: 1.5, justifyContent: "space-between" }}>
                <Box></Box>
                <Stack direction="row" spacing={1}>
                  {hasResume ? (
                    <>
                      <Tooltip title={`Message ${candidateName}`}>
                        <IconButton
                          color="success"
                          size="small"
                          onClick={() => handleSelect(userId)}
                        >
                          <ChatBubbleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="View Combined PDF">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() =>
                            handleViewCombined(selectedCandidateApp.pk_id, candidateName)
                          }
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Download Combined PDF">
                        <IconButton
                          color="warning"
                          size="small"
                          onClick={() =>
                            handleDownloadCombined(selectedCandidateApp.pk_id, candidateName)
                          }
                        >
                          <FileDownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <Chip
                      label="No resume available"
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>


      {/* Confirm status */}
      <Dialog
        open={confirmDialog.open}
        onClose={(even, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") return;
          setConfirmDialog({ ...confirmDialog, open: false })
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
            px: 2
          }}
        >
          Confirm Status Change
        </DialogTitle>
        <Divider/>

        {/* Content */}
        <DialogContent sx={{ py: 1.5, px: 2 }}>
          <Typography variant="body2">
            Change status from{" "}
            <strong>
              {STATUS_MAP[confirmDialog.currentStatus]?.label ||
                confirmDialog.currentStatus}
            </strong>{" "}
            to <strong>{confirmDialog.newStatusLabel}</strong>?
          </Typography>
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
              sx={{textTransform: "none"}}
            >
              Cancel
            </Button>

            <Button
              size="small"
              variant="contained"
              startIcon={<CheckCircleOutline />}
              sx={{textTransform: "none"}}
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
                if (!confirmDialog.appId || !confirmDialog.newStatusLabel) return;

                await handleStatusChange(
                  confirmDialog.appId,
                  confirmDialog.newStatusLabel
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