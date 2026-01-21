import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
  InputAdornment,
  DialogContentText,
  OutlinedInput,
} from "@mui/material";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import WorkIcon from "@mui/icons-material/Work";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Badge from "@mui/material/Badge";
import EventIcon from "@mui/icons-material/Event";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PaymentsIcon from "@mui/icons-material/Payments"
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import SearchIcon from "@mui/icons-material/Search";

// Rich text editor
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';

import api from "../services/api";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

const JOB_TYPES = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Internship", label: "Internship" },
];

const JOB_LEVELS = [
  { value: "Entry Level", label: "Entry Level" },
  { value: "Junior", label: "Junior" },
  { value: "Mid Level", label: "Mid Level" },
  { value: "Senior", label: "Senior" },
  { value: "Lead", label: "Lead" },
];

const JOB_STATUSES_CREATE = [
  { value: "Open", label: "Open (Publish now)" },
  { value: "Closed", label: "Closed" },
  { value: "Draft", label: "Draft" },
];

const JOB_STATUSES_EDIT = ["Draft", "Open", "Closed"];

// ────────────────────────────────────────────────
//       Shared Job Form Dialog (Create + Edit)
// ────────────────────────────────────────────────
function JobFormDialog({
  open,
  onClose,
  onSuccess,
  initialData = null,
  isEdit = false,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const defaultData = {
    job_title: "",
    job_type: "Full-time",
    level: "Mid Level",
    position_number: "",
    salary_range: "",
    location: "",
    job_description: "",
    experience_required: "",
    closing_date: "",
    status: isEdit ? "Open" : "Open",
  };

  const [formData, setFormData] = useState(
    initialData ? { ...initialData } : defaultData
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        ...initialData,
        closing_date: initialData.closing_date
          ? initialData.closing_date.slice(0, 10)
          : "",
      });
    } else if (open) {
      setFormData(defaultData);
    }
  }, [open, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Strip HTML tags for basic required check
    const textOnly = (formData.job_description || "")
      .replace(/<[^>]+>/g, "")
      .trim();
    const requirementsOnly = (formData.experience_required || "")
      .replace(/<[^>]+>/g, "")
      .trim();

    if (!formData.job_title?.trim()) return setError("Job title is required");
    if (!textOnly) return setError("Description is required");
    if (!requirementsOnly) return setError("Requirements are required");

    setLoading(true);

    try {
      const payload = {
        ...formData,
        position_number: formData.position_number
          ? Number(formData.position_number)
          : undefined,
        closing_date: formData.closing_date || undefined,
      };

      let res;
      if (isEdit && initialData?.pk_id) {
        res = await api.put(`/jobs/${initialData.pk_id}`, payload);
      } else {
        res = await api.post("/jobs/", payload);
      }

      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          `Failed to ${isEdit ? "update" : "create"} job`
      );
    } finally {
      setLoading(false);
    }
  };

  const title = isEdit ? "Edit Job" : "Post a New Job";
  const submitText = isEdit ? "Save Changes" : "Post Job";
  const statuses = isEdit ? JOB_STATUSES_EDIT : JOB_STATUSES_CREATE;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      scroll="paper"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: isMobile ? 0 : 3,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: "#023F6B",
          color: "white",
          position: "relative",
        }}
      >
        <div>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            {title}
          </Typography>
        </div>
       
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 16, top: 16, color: "white" }}
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} id="job-form">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            {/* Job Title */}
            <TextField
              fullWidth
              required
              label="Job Title"
              name="job_title"
              value={formData.job_title || ""}
              onChange={handleChange}
              placeholder="Please enter job title"
              size="small"
            />

            {/* Job Type */}
            <FormControl fullWidth>
              <InputLabel>Job Type</InputLabel>
              <Select
                name="job_type"
                value={formData.job_type || "Full-time"}
                label="Job Type"
                onChange={handleChange}
                startAdornment={
                  <InputAdornment position="start">
                    <WorkIcon fontSize="small" />
                  </InputAdornment>
                }
                size="small"
              >
                {JOB_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Job Level */}
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                name="level"
                value={formData.level || "Mid Level"}
                label="Level"
                onChange={handleChange}
                size="small"
              >
                {JOB_LEVELS.map((lvl) => (
                  <MenuItem key={lvl.value} value={lvl.value}>
                    {lvl.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Status */}
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status || "Open"}
                label="Status"
                onChange={handleChange}
                size="small"
              >
                {statuses.map((s) =>
                  typeof s === "string" ? (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ) : (
                    <MenuItem key={s.value} value={s.value}>
                      {s.label}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            {/* Number of Positions */}
            <TextField
              fullWidth
              label="Number of Positions"
              name="position_number"
              type="number"
              value={formData.position_number || ""}
              onChange={handleChange}
              placeholder="Please enter Number of Positions"
              inputProps={{ min: 1 }}
              size="small"
            />

            {/* Salary Range */}
            <TextField
              fullWidth
              label="Salary Range"
              name="salary_range"
              value={formData.salary_range || ""}
              onChange={handleChange}
              placeholder="e.g. $2000 - $3500"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoneyIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Closing Date */}
            {/* <TextField
              fullWidth
              label="Application Closing Date"
              name="closing_date"
              type="date"
              value={formData.closing_date || ""}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            /> */}

            <DatePicker
              label="Application Closing Date"
              format="YYYY-MM-DD"
              value={formData.closing_date ? dayjs(formData.closing_date) : null}
              onChange={(newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  closing_date: newValue ? newValue.format("YYYY-MM-DD") : "",
                }));
              }}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
            />

            {/* Location */}
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location || ""}
              onChange={handleChange}
              placeholder="e.g. Phnom Penh, Cambodia"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOnIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              size="small"
            />

            {/* Job Description - Rich Text Editor */}
            <Box sx={{ gridColumn: "1 / -1" }}>
              <FormControl fullWidth>
                <InputLabel shrink sx={{ bgcolor: "background.paper", px: 1 }}>
                  Job Description *
                </InputLabel>

                <Box
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    overflow: "hidden",
                    "& .ql-toolbar": {
                      borderBottom: 1,
                      borderColor: "divider",
                      bgcolor: "grey.50",
                    },
                    "& .ql-container": {
                      minHeight: 180,
                      maxHeight: 400,
                      overflowY: "auto",
                      fontFamily: theme.typography.fontFamily,
                      fontSize: "0.95rem",
                    },
                    "& .ql-editor": {
                      minHeight: 160,
                      px: 2,
                      py: 1.5,
                    },
                  }}
                >
                  <ReactQuill
                    theme="snow"
                    value={formData.job_description || ""}
                    onChange={(content) =>
                      setFormData((prev) => ({
                        ...prev,
                        job_description: content,
                      }))
                    }
                    placeholder="Describe responsibilities, requirements, benefits, qualifications..."
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline", "strike"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        [{ align: [] }],
                        ["link"],
                        ["clean"],
                      ],
                    }}
                  />
                </Box>
              </FormControl>
            </Box>

            {/* Requirements - Rich Text Editor */}
            <Box sx={{ gridColumn: "1 / -1" }}>
              <FormControl fullWidth>
                <InputLabel shrink sx={{ bgcolor: "background.paper", px: 1 }}>
                  Requirements
                </InputLabel>

                <Box
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    overflow: "hidden",
                    "& .ql-toolbar": {
                      borderBottom: 1,
                      borderColor: "divider",
                      bgcolor: "grey.50",
                    },
                    "& .ql-container": {
                      minHeight: 180,
                      maxHeight: 400,
                      overflowY: "auto",
                      fontFamily: theme.typography.fontFamily,
                      fontSize: "0.95rem",
                    },
                    "& .ql-editor": {
                      minHeight: 160,
                      px: 2,
                      py: 1.5,
                    },
                  }}
                >
                  <ReactQuill
                    theme="snow"
                    value={formData.experience_required || ""}
                    onChange={(content) =>
                      setFormData((prev) => ({
                        ...prev,
                        experience_required: content,
                      }))
                    }
                    placeholder="Describe responsibilities, requirements, benefits, qualifications..."
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline", "strike"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        [{ align: [] }],
                        ["link"],
                        ["clean"],
                      ],
                    }}
                  />
                </Box>
              </FormControl>
            </Box>
          </Box>
        </form>
      </DialogContent>

      <DialogActions
        sx={{
          background: "#023F6B",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Button
          type="submit"
          form="job-form"
          variant="contained"
          color="primary"
          size="small"
          disabled={loading}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
              {isEdit ? "Saving..." : "Posting..."}
            </>
          ) : (
            submitText
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ────────────────────────────────────────────────
//                   My Jobs Page
// ────────────────────────────────────────────────
export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const [openCloseDialog, setOpenCloseDialog] = useState(false);
  const [closingJob, setClosingJob] = useState(null);

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("Open");
  const [typeFilter, setTypeFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");

  const statusCounts = {
    Draft: jobs.filter(j => j.status === "Draft").length,
    Open: jobs.filter(j => j.status === "Open").length,
    Closed: jobs.filter(j => j.status === "Closed").length,
  };

  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
  const [duplicateJob, setDuplicateJob] = useState(null);

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/jobs/my-jobs?limit=100");
      setJobs(res.data || []);
    } catch {
      setError("Failed to load your posted jobs");
    } finally {
      setLoading(false);
    }
  };

  const openDuplicate = (job) => {
    setDuplicateJob(job);
    setOpenDuplicateDialog(true);
  };

  const confirmDuplicate = () => {
    const clonedJob = {
      ...duplicateJob,
      pk_id: undefined,
      posting_date: undefined,
      closing_date: duplicateJob.closing_date || "",
    };

    setEditingJob(clonedJob);
    setOpenFormDialog(true);
    setOpenDuplicateDialog(false);
  };

  const openCreate = () => {
    setEditingJob(null);
    setOpenFormDialog(true);
  };

  const openEdit = (job) => {
    setEditingJob(job);
    setOpenFormDialog(true);
  };

  const handleFormSuccess = (updatedJob) => {
    if (editingJob?.pk_id) {
      setJobs((prev) =>
        prev.map((j) => (j.pk_id === updatedJob.pk_id ? updatedJob : j))
      );
    } else {
      // fetchMyJobs();
      setJobs((prev) => [updatedJob, ...prev]);
    }
  };

  const openClose = (job) => {
    setClosingJob(job);
    setOpenCloseDialog(true);
  };

  const confirmClose = async () => {
    try {
      const res = await api.put(`/jobs/${closingJob.pk_id}`, {
        status: "Closed",
      });
      setJobs((prev) =>
        prev.map((j) => (j.pk_id === closingJob.pk_id ? res.data : j))
      );
      setOpenCloseDialog(false);
    } catch {
      setError("Failed to close job");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredJobs = jobs.filter((job) => {
    const keywordMatch =
      job.job_title.toLowerCase().includes(search.toLowerCase()) ||
      (job.location || "").toLowerCase().includes(search.toLowerCase());

    const statusMatch =
      statusTab === "All" || job.status === statusTab;

    const typeMatch =
      typeFilter === "All" || job.job_type === typeFilter;

    const levelMatch =
      levelFilter === "All" || job.level === levelFilter;

    return keywordMatch && statusMatch && typeMatch && levelMatch;
  });

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        mb={2}
      >
        <Typography variant="h6" fontWeight={700}>
          My Posted Jobs
        </Typography>
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search by title or location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        {/* Job Type */}
        <FormControl size="small" sx={{ minWidth: 200 }} >
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={(e) => setTypeFilter(e.target.value)}
            input={
              <OutlinedInput
                startAdornment={
                  <InputAdornment position="start">
                    <WorkOutlineIcon color="action" fontSize="small" />
                  </InputAdornment>
                }
                label="Type"
              />
            }
          >
            <MenuItem value="All">All</MenuItem>
            {JOB_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Level */}
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Level</InputLabel>
          <Select
            value={levelFilter}
            label="Level"
            onChange={(e) => setLevelFilter(e.target.value)}
            input={
              <OutlinedInput
                startAdornment={
                  <InputAdornment position="start">
                    <TrendingUpIcon color="action" fontSize="small" />
                  </InputAdornment>
                }
                label="Level"
              />
            }
          >
            <MenuItem value="All">All</MenuItem>
            {JOB_LEVELS.map((l) => (
              <MenuItem key={l.value} value={l.value}>
                {l.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Reset */}
        <Button
          variant="outlined"
          startIcon={<AutorenewRoundedIcon />}
          onClick={() => {
            setSearch("");
            setStatusTab("Open");
            setTypeFilter("All");
            setLevelFilter("All");
          }}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          startIcon={<AddCircleIcon />}
          onClick={openCreate}
          fullWidth={{ xs: true, sm: false }}
          sx={{ borderRadius: 2 }}
        >
          Post
        </Button>
      </Stack>
      {/* Small Responsive Tabs */}
      <Tabs
        value={statusTab}
        onChange={(_, newValue) => setStatusTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: 36,
          "& .MuiTab-root": {
            minHeight: 36,
            fontSize: "0.875rem",
            px: 1.5,
          },
          "& .MuiBadge-root": { mr: 0.5 },
          mb: 1,
        }}
      >
        <Tab
          label={<Badge badgeContent={statusCounts.Open} color="success">Open</Badge>}
          value="Open"
        />
        <Tab
          label={<Badge badgeContent={statusCounts.Closed} color="error">Closed</Badge>}
          value="Closed"
        />
        <Tab
          label={<Badge badgeContent={statusCounts.Draft} color="warning">Draft</Badge>}
          value="Draft"
        />
      </Tabs>


      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* JOBS GRID */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(1, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(4, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 1,
        }}
      >
        {filteredJobs.map((job) => (
          <Card
            key={job.pk_id}
            variant="outlined"
            sx={{
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              boxShadow: 1,
            }}
          >
            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
              {/* Title + Status */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 1,
                }}
              >
                <Typography
                  variant="subtitle1"
                  color="primary"
                  fontWeight={500}
                >
                  {job.job_title}
                </Typography>

                <Chip
                  label={job.status}
                  size="small"
                  color={
                    job.status === "Open"
                      ? "success"
                      : job.status === "Closed"
                        ? "error"
                        : job.status === "Draft"
                          ? "warning"
                          : "default"
                  }
                  sx={{
                    fontWeight: 500,
                    justifyContent: "center",
                  }}
                />
              </Box>

              {/* Type & Level */}
              <Stack direction="row" spacing={1} mb={1.5} flexWrap="wrap">
                <Chip label={job.job_type} size="small" variant="outlined" />
                {job.level && (
                  <Chip
                    label={job.level}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Stack>

              <Typography variant="body2" color="text.secondary">
                {"location: "}
                {job.location || "—"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {"Salary: "}
                {job.salary_range ? `${job.salary_range}$` : "Negotiable"}
              </Typography>


              <Typography
                variant="caption"
                color="text.disabled"
                mt={1.5}
                display="block"
              >
                Posted: {job.posting_date ? new Date(job.posting_date).toISOString().split("T")[0] : "—"}
              </Typography>
            </CardContent>

            <CardActions sx={{ justifyContent: "flex-end", px: 1, pb: 1 }}>
              <IconButton size="small" onClick={() => openEdit(job)}>
                <EditIcon fontSize="small" sx={{ color: "teal" }} />
              </IconButton>

              <IconButton
                size="small"
                color="primary"
                onClick={() => openDuplicate(job)}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>

              {job.status !== "Closed" && (
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => openClose(job)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </CardActions>
          </Card>
        ))}

        {jobs.length === 0 && (
          <Box
            gridColumn="1 / -1"
            textAlign="center"
            py={6}
            color="text.secondary"
          >
            You haven't posted any jobs yet.
          </Box>
        )}
      </Box>

      {/* DIALOGS */}
      <JobFormDialog
        open={openFormDialog}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          setOpenFormDialog(false);
            setEditingJob(null);
        }}
        
        onSuccess={handleFormSuccess}
        initialData={editingJob}
        isEdit={!!editingJob}
      />

      <Dialog open={openCloseDialog} onClose={() => setOpenCloseDialog(false)}>
        <DialogTitle>Close Job Posting</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to close{" "}
            <strong>{closingJob?.job_title}</strong>?<br />
            It will no longer accept new applications.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCloseDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={confirmClose}
            startIcon={<CloseIcon />}
          >
            Close Job
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDuplicateDialog}
        onClose={() => setOpenDuplicateDialog(false)}
      >
        <DialogTitle>Duplicate Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to duplicate{" "}
            <strong>{duplicateJob?.job_title}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDuplicateDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmDuplicate}
            startIcon={<ContentCopyIcon />}
          >
            Duplicate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}