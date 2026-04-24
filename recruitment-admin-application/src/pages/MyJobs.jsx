//MyJobs.jsx
import { useEffect, useRef, useState } from "react";
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
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
  InputAdornment,
  DialogContentText,
  Avatar,
  Autocomplete,
  Tooltip,
  Divider,
  Paper,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import WorkIcon from "@mui/icons-material/Work";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Badge from "@mui/material/Badge";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SearchIcon from "@mui/icons-material/Search";
import AllInboxRoundedIcon from "@mui/icons-material/AllInboxRounded";
import ReactQuill from "react-quill-new";
import "quill/dist/quill.snow.css";
import api from "../services/api";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import {
  Cancel,
  CategoryRounded,
  PostAdd,
  Save,
  WarningAmber,
} from "@mui/icons-material";
import Draggable from "react-draggable";
import { useTranslation } from "react-i18next";
import { t } from "i18next";

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


const JOB_STATUSES_EDIT = ["Open", "Closed"];

// ────────────────────────────────────────────────
//       Shared Job Form Dialog (Create + Edit)
// ────────────────────────────────────────────────
function JobFormDialog({
  open,
  onClose,
  onSuccess,
  initialData = null,
  isEdit = false,
  isDuplicate = false,
  categories = [],
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
    category_ids: [],
  };

  const [formData, setFormData] = useState(
    initialData ? { ...initialData } : defaultData,
  );

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open && initialData) {
      const today = new Date().toISOString().split("T")[0];
      let adjustedStatus = initialData.status;

      if (initialData.closing_date && initialData.closing_date < today) {
        adjustedStatus = "Closed";
      }
      setFormData({
        ...initialData,
        closing_date: initialData.closing_date
          ? initialData.closing_date.slice(0, 10)
          : "",
        status: adjustedStatus,
        category_ids: initialData.categories?.map((c) => c.pk_id) || [],
      });
    } else if (open) {
      setFormData({
        ...defaultData,
        status: "Open",
      });
    }
  }, [open, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isQuillEmpty = (value) => {
    if (!value) return true;
    const text = value.replace(/<(.|\n)*?>/g, "").trim();
    return text.length === 0;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.job_title?.trim()) {
      newErrors.job_title = t("job_title_required");
    }

    if (isQuillEmpty(formData.job_description)) {
      newErrors.job_description = t("job_description_required");
    }

    if (!formData.category_ids?.length) {
      newErrors.category_ids = t("select_at_least_one_category");
    }

    if (!formData.location?.trim()) newErrors.location = t("location_required");

    if (!formData.position_number || formData.position_number <= 0) {
      newErrors.position_number = t("position_number_greater_than_zero");
    }

    if (!formData.closing_date) {
      newErrors.closing_date = t("closing_date_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleCloseDialog = () => {
    setErrors({});
    setFormData(defaultData);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
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
      console.error("Job save failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const title = isEdit
    ? t("edit_job")
    : isDuplicate
      ? t("duplicate_job")
      : t("post_job");
  const submitText = isEdit
    ? t("save_changes")
    : isDuplicate
      ? t("duplicate")
      : t("post_job");

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (loading) return;

        if (reason === "backdropClick") {
          return; 
        }

        handleCloseDialog();
      }}
      
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      scroll="paper"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: isMobile ? 0 : 3,
          overflow: "hidden",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(239, 246, 255, 0.95) 100%)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
        },
      }}
      PaperComponent={DraggablePaper}
    >
      <DialogTitle
        id="draggable-dialog-title"
        sx={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 0%, #f97316 150%)",
          color: "white",
          position: "relative",
          cursor: "move",
        }}
      >
        <div>
          <Typography variant={isMobile ? "h6" : "h7"} fontWeight="bold">
            {title}
          </Typography>
        </div>

        <IconButton
          aria-label="close"
          onClick={handleCloseDialog}
          sx={{ position: "absolute", right: 16, top: 16, color: "white" }}
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ backgroundColor: "#FAFAFA" }}>
        <form onSubmit={handleSubmit} id="job-form">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Autocomplete
              multiple
              size="small"
              options={categories}
              getOptionLabel={(option) => option.name}
              value={categories.filter((cat) =>
                formData.category_ids?.includes(cat.pk_id),
              )}
              onChange={(_, newValue) => {
                const ids = newValue.map((cat) => cat.pk_id);
                setFormData((prev) => ({ ...prev, category_ids: ids }));

                if (errors.category_ids) {
                  setErrors((prev) => ({ ...prev, category_ids: undefined }));
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("category")}
                  placeholder={t("select_categories")}
                  error={!!errors.category_ids}
                  helperText={errors.category_ids}
                  InputLabelProps={{ required: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <WorkIcon fontSize="small" sx={{ color: "#3b82f6" }}/>
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index }); // ← extract key
                  return (
                    <Chip
                      key={key} // ← pass explicitly
                      label={option.name}
                      size="small"
                      sx={{
                        bgcolor: "rgba(59, 130, 246, 0.1)",
                        borderColor: "#3b82f6",
                        color: "#1e3a8a",
                      }}
                      {...tagProps} // ← spread the rest (no key inside)
                    />
                  );
                })
              }
            />

            {/* Job Title */}
            <TextField
              fullWidth
              label={t("job_title") + " *"}
              name="job_title"
              value={formData.job_title || ""}
              onChange={handleChange}
              error={!!errors.job_title}
              helperText={errors.job_title}
              placeholder={t("please_enter_job_title")}
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                },
              }}
            />

            {/* Job Type */}
            <Autocomplete
              size="small"
              options={JOB_TYPES}
              getOptionLabel={(opt) => opt.label}
              value={
                JOB_TYPES.find((t) => t.value === formData.job_type) || null
              }
              onChange={(_, newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  job_type: newValue?.value,
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("job_type") + " *"}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <WorkIcon fontSize="small" sx={{ color: "#3b82f6" }}/>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            {/* Job Level */}
            <Autocomplete
              size="small"
              options={JOB_LEVELS}
              getOptionLabel={(opt) => opt.label}
              value={JOB_LEVELS.find((t) => t.value === formData.level) || null}
              onChange={(_, newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  level: newValue?.value,
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("level") + " *"}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <WorkIcon fontSize="small" sx={{ color: "#3b82f6" }}/>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            {/* Status */}
            <Autocomplete
              size="small"
              options={JOB_STATUSES_EDIT.map((s) => ({ value: s, label: s }))}
              getOptionLabel={(option) => option.label}
              value={
                JOB_STATUSES_EDIT.map((s) => ({ value: s, label: s })).find(
                  (s) => s.value === (formData.status || "Open"),
                ) || null
              }
              onChange={(_, newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  status: newValue?.value || "Open",
                }));
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label={t("status") + " *"} 
                  fullWidth 
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                    },
                  }}
                />
              )}
            />

            {/* Number of Positions */}
            <TextField
              fullWidth
              label={t("number_of_positions") + " *"}
              name="position_number"
              type="number"
              value={formData.position_number || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  position_number:
                    e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              placeholder={t("number_of_positions")}
              inputProps={{ min: 1 }}
              size="small"
              error={!!errors.position_number}
              helperText={errors.position_number}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                },
              }}
            />

            {/* Salary Range */}
            <TextField
              fullWidth
              label={t("salary")}
              name="salary_range"
              value={formData.salary_range || ""}
              onChange={handleChange}
              placeholder={t("salary")}
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoneyIcon fontSize="small" sx={{ color: "#f97316" }}/>
                  </InputAdornment>
                ),
              }}
            />

            <DatePicker
              label={t("closing_date") + " *"}
              format="YYYY-MM-DD"
              value={
                formData.closing_date ? dayjs(formData.closing_date) : null
              }
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
                  error: !!errors.closing_date,
                  helperText: errors.closing_date,
                  sx: {
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                    },
                  },
                },
              }}
            />

            {/* Location */}
            <TextField
              sx={{ 
                gridColumn: { xs: "1 / -1", sm: "1 / 3" },
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                },
              }}
              fullWidth
              label={t("location") + " *"}
              name="location"
              value={formData.location || ""}
              onChange={handleChange}
              placeholder={t("location")}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOnIcon fontSize="small" sx={{ color: "#f97316" }}/>
                  </InputAdornment>
                ),
              }}
              error={!!errors.location}
              helperText={errors.location}
              size="small"
            />
          </Box>
          {/* Job Description - Rich Text Editor */}
          <Box mb={2} mt={2}>
            <FormControl fullWidth error={!!errors.job_description}>
              <InputLabel shrink sx={{ bgcolor: "#FAFAFA", px: 1, color: "#1e3a8a" }}>
                {t("job_description") + " *"}
              </InputLabel>

              <Box
                sx={{
                  border: 1,
                  borderColor: errors.job_description ? "#ef4444" : "rgba(59, 130, 246, 0.3)",
                  borderRadius: 1,
                  overflow: "hidden",
                  "&:hover": { borderColor: "#3b82f6" },
                  "& .ql-container": {
                    minHeight: 170,
                    height: "auto",
                  },
                  "& .ql-editor": {
                    minHeight: 170,
                    maxHeight: 300,
                    overflowY: "auto",
                  },
                }}
              >
                <ReactQuill
                  theme="snow"
                  value={formData.job_description || ""}
                  placeholder={t("enter_job_description")}
                  onChange={(content) => {
                    setFormData((prev) => ({
                      ...prev,
                      job_description: content,
                    }));

                    if (errors.job_description) {
                      setErrors((prev) => ({
                        ...prev,
                        job_description: undefined,
                      }));
                    }
                  }}
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
              {errors.job_description && (
                <Typography variant="caption" color="error">
                  {errors.job_description}
                </Typography>
              )}
            </FormControl>
          </Box>

          {/* Requirements - Rich Text Editor */}
          <Box>
            <FormControl fullWidth>
              <InputLabel shrink sx={{ bgcolor: "#FAFAFA", px: 1, color: "#1e3a8a" }}>
                {t("experience_required")}
              </InputLabel>

              <Box
                sx={{
                  border: 1,
                  borderColor: "rgba(59, 130, 246, 0.3)",
                  borderRadius: 1,
                  overflow: "hidden",
                  "&:hover": { borderColor: "#3b82f6" },
                  "& .ql-container": {
                    minHeight: 170,
                    height: "auto",
                  },
                  "& .ql-editor": {
                    minHeight: 170,
                    maxHeight: 300,
                    overflowY: "auto",
                  },
                }}
              >
                <ReactQuill
                  theme="snow"
                  value={formData.experience_required || ""}
                  placeholder={t("enter_experience_requirements")}
                  onChange={(content) =>
                    setFormData((prev) => ({
                      ...prev,
                      experience_required: content,
                    }))
                  }
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
        </form>
      </DialogContent>

      <DialogActions
        sx={{
          background: "#FAFAFA",
          borderTop: "1px solid",
          borderColor: "rgba(59, 130, 246, 0.2)",
        }}
      >
        <Button
          type="submit"
          form="job-form"
          variant="contained"
          size="small"
          disabled={loading}
          sx={{
            textTransform: "none",
            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 0%, #f97316 150%)",
            boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #1e40af 0%, #2563eb 0%, #ea580c 150%)",
              boxShadow: "0 6px 20px rgba(249, 115, 22, 0.4)",
            },
          }}
          startIcon={<Save />}
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
// ────────────────────────────────────────────────
//                   My Jobs Page
// ────────────────────────────────────────────────
export default function MyJobs() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const [openCloseDialog, setOpenCloseDialog] = useState(false);
  const [closingJob, setClosingJob] = useState(null);

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("Open");
  const [typeFilter, setTypeFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState(["All"]);

  const statusCounts = {
    Open: jobs.filter((j) => j.status === "Open").length,
    Closed: jobs.filter((j) => j.status === "Closed").length,
  };

  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
  const [duplicateJob, setDuplicateJob] = useState(null);
  const [categories, setCategories] = useState([]);
  const [approved, setApproved] = useState(null);
  const [openApprovalWarning, setOpenApprovalWarning] = useState(false);

  useEffect(() => {
    getApprove();
    fetchMyJobs();
    fetchCategories();
  }, []);

    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories/"); 
        setCategories(res.data || []);
      } catch (err) {
        console.error("Failed to load categories");
      }
    };


  const getApprove = async () => {
    try{
      const res = await api.get("/jobs/approve/");
      setApproved(res.data.approved)
    }catch(e){
      console.log(e)
    }
  }

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/jobs/my-jobs?limit=100");
      setJobs(res.data || []);
      const autoClosedCount = res.data.filter(
        (j) =>
          j.status === "Closed" &&
          j.closing_date &&
          new Date(j.closing_date) < new Date(),
      ).length;
      if (autoClosedCount > 0) {
        toast.info(
          `${autoClosedCount} job(s) were automatically closed due to expiry`,
        );
      }
    } catch {
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
    if (!approved){
      setOpenApprovalWarning(true)
      return
    }
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
        prev.map((j) => (j.pk_id === updatedJob.pk_id ? updatedJob : j)),
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
        prev.map((j) => (j.pk_id === closingJob.pk_id ? res.data : j)),
      );
      setOpenCloseDialog(false);
    } catch {
      console.error("Failed to close job");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress sx={{ color: "#3b82f6" }}/>
      </Box>
    );
  }

  const filteredJobs = jobs.filter((job) => {
    const keywordMatch =
      job.job_title.toLowerCase().includes(search.toLowerCase()) ||
      (job.location || "").toLowerCase().includes(search.toLowerCase());

    const statusMatch = statusTab === "All" || job.status === statusTab;

    const typeMatch = typeFilter === "All" || job.job_type === typeFilter;

    const levelMatch = levelFilter === "All" || job.level === levelFilter;

    const categoryMatch =
      categoryFilter.includes("All") || // "All" selected → show everything
      (job.categories || []).some((cat) => categoryFilter.includes(cat.pk_id));

    return (
      keywordMatch && statusMatch && typeMatch && levelMatch && categoryMatch
    );
  });

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(1, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(4, 1fr)",
            lg: "repeat(7, 1fr)",
          },
          gap: 1.5,
          mb: 0.5,
          alignItems: "center",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{
            gridColumn: { xs: "1 / -1" },
            mb: -0.5,
          }}
        >
          <PostAdd sx={{ color: "#3b82f6" }}/>

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
            {t("job_posts")}
          </Typography>
        </Stack>
        {/* Search */}
        <TextField
          size="small"
          placeholder={t("search_by_title_or_location")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            gridColumn: { xs: "1 / -1", sm: "span 2" },
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#3b82f6" }} />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch("")}>
                  <Cancel fontSize="small" sx={{ color: "#f97316" }}/>
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Category Filter - Multi select with Autocomplete */}
        <Autocomplete
          multiple
          size="small"
          options={categories}
          getOptionLabel={(option) => option.name}
          sx={{
            gridColumn: { xs: "1 / -1", sm: "span 2" },
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
            },
          }}
          value={
            categoryFilter.includes("All")
              ? []
              : categories.filter((cat) => categoryFilter.includes(cat.pk_id))
          }
          onChange={(event, newValue) => {
            if (newValue.length === 0) {
              setCategoryFilter(["All"]);
              return;
            }

            const selectedIds = newValue.map((cat) => cat.pk_id);
            setCategoryFilter(selectedIds);
          }}
          isOptionEqualToValue={(option, value) => option.pk_id === value.pk_id}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("category")}
              placeholder={t("select_categories")}
              size="small"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <AllInboxRoundedIcon sx={{ color: "#3b82f6" }} fontSize="small" />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                },
              }}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option.name}
                size="small"
                {...getTagProps({ index })}
                sx={{ 
                  maxWidth: 140,
                  bgcolor: "rgba(59, 130, 246, 0.1)",
                  borderColor: "#3b82f6",
                  color: "#1e3a8a",
                }}
              />
            ))
          }
          noOptionsText="No categories found"
          disableCloseOnSelect
        />
        {/* Job Type */}
        <Autocomplete
          size="small"
          options={["All", ...JOB_TYPES.map((t) => t.value)]}
          value={typeFilter}
          onChange={(e, newValue) => setTypeFilter(newValue || "All")}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("job_type")}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <WorkOutlineIcon sx={{ color: "#3b82f6" }} fontSize="small" />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                },
              }}
            />
          )}
        />

        {/* Level */}
        <Autocomplete
          size="small"
          options={["All", ...JOB_LEVELS.map((l) => l.value)]}
          value={levelFilter}
          onChange={(e, newValue) => setLevelFilter(newValue || "All")}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("level")}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <TrendingUpIcon sx={{ color: "#f97316" }} fontSize="small" />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                },
              }}
            />
          )}
        />

        {/* Reset */}
        <Stack
          direction="row"
          spacing={0.5}
          width="100%"
          justifyContent={{ xs: "flex-end", sm: "flex-end" }}
          sx={{
            gridColumn: {
              xs: "1 / -1",
              sm: "span 1",
            },
          }}
        >
          <Tooltip title={t("reset")} arrow placement="top">
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              size="small"
              color="error"
              sx={{
                borderRadius: 3,
                textTransform: "none",
                borderColor: "#ef4444",
                color: "#ef4444",
                "&:hover": {
                  borderColor: "#dc2626",
                  bgcolor: "rgba(239, 68, 68, 0.05)",
                },
                "& .MuiButton-startIcon": {
                  marginRight: 0.5,
                },
              }}
              onClick={() => {
                setSearch("");
                setStatusTab("Open");
                setTypeFilter("All");
                setLevelFilter("All");
                setCategoryFilter(["All"]);
              }}
            >
              {t("reset")}
            </Button>
          </Tooltip>
          <Tooltip title={t("post_job")} arrow placement="top">
            <Button
              variant="contained"
              startIcon={<PostAdd />}
              onClick={openCreate}
               sx={{
                borderRadius: 3,
                textTransform: "none",
                background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 0%, #f97316 150%)",
                boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #1e40af 0%, #2563eb 0%, #ea580c 150%)",
                  boxShadow: "0 6px 20px rgba(249, 115, 22, 0.4)",
                },
                "& .MuiButton-startIcon": {
                  marginRight: 0.5,
                },
              }}
            >
              {t("post")}
            </Button>
          </Tooltip>
        </Stack>
      </Box>
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
            textTransform: "none",
            color: "#1e3a8a",
            "&.Mui-selected": { color: "#f97316" },
          },
          "& .MuiTabs-indicator": {
            background: "linear-gradient(90deg, #3b82f6 0%, #f97316 120%)",
          },
          "& .MuiBadge-root": { mr: 0.5 },
          mb: 0.5,
        }}
      >
        <Tab
          label={
            <Badge
              badgeContent={statusCounts.Open}
              color="success"
              sx={{
                "& .MuiBadge-badge": {
                  minWidth: 16,
                  height: 16,
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  bgcolor: "#10b981",
                },
              }}
            >
              Open
            </Badge>
          }
          value="Open"
        />

        <Tab
          label={
            <Badge
              badgeContent={statusCounts.Closed}
              color="error"
              sx={{
                "& .MuiBadge-badge": {
                  minWidth: 16,
                  height: 16,
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  bgcolor: "#ef4444",
                },
              }}
            >
              Closed
            </Badge>
          }
          value="Closed"
        />
      </Tabs>
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
              boxShadow: "0 2px 12px rgba(30, 58, 138, 0.08)",
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(239, 246, 255, 0.9) 100%)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(59, 130, 246, 0.15)",
              transition: "all 0.2s",
              "&:hover": {
                boxShadow: "0 6px 20px rgba(59, 130, 246, 0.15)",
                borderColor: "#f97316",
                transform: "translateY(-2px)",
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
              {/* Title + Status */}
              <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                <Avatar
                  src={
                    job.employer?.company_logo
                      ? `${import.meta.env.VITE_API_BASE_URL}/uploads/employers/${job.employer.company_logo}`
                      : undefined
                  }
                  alt={`${job.employer?.company_name || "Company"} logo`}
                  sx={{
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 },
                    border: "2px solid",
                    borderColor: "rgba(59, 130, 246, 0.3)",
                    bgcolor: "grey.200",
                    fontWeight: 600,
                    fontSize: "1.1rem",
                  }}
                >
                  {(job.employer?.company_name || "?").charAt(0).toUpperCase()}
                </Avatar>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                    flexGrow: 1,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ color: "#1e3a8a" }}
                    fontWeight={500}
                  >
                    {job.job_title}
                  </Typography>

                  <Chip
                    label={job.status}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontWeight: 500,
                      justifyContent: "center",
                      borderWidth: 1.5,
                      color: job.status === "Open" ? "#10b981" : "#ef4444",
                      borderColor: job.status === "Open" ? "#10b981" : "#ef4444",
                      bgcolor: job.status === "Open" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                    }}
                  />
                </Box>
              </Stack>

              {/* Type & Level */}
              <Stack direction="row" spacing={1} mb={1.5} flexWrap="wrap">
                <Chip
                  icon={<WorkIcon fontSize="small" sx={{ color: "#3b82f6" }}/>}
                  label={job.job_type}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "#3b82f6", color: "#3b82f6" }}
                />
                {job.level && (
                  <Chip
                    icon={<TrendingUpIcon fontSize="small" sx={{ color: "#f97316" }}/>}
                    label={job.level}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ borderColor: "#f97316", color: "#f97316" }}
                  />
                )}
                <Chip
                  icon={<AttachMoneyIcon sx={{ color: "#10b981" }} fontSize="small" />}
                  label={
                    job.salary_range ? `${job.salary_range}$` : "Negotiable"
                  }
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "#10b981", color: "#10b981" }}
                />
              </Stack>
              <Stack direction="row" spacing={0.5} mt={1}>
                <LocationOnIcon
                  fontSize="small"
                  sx={{ color: "#f97316", mr: 0.5, opacity: 0.7 }}
                />
                <Typography variant="caption" sx={{ color: "#1e3a8a" }}>
                  {job.location || "—"}
                </Typography>
              </Stack>

              {job.categories?.length > 0 && (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={1}>
                  <CategoryRounded
                    fontSize=""
                    sx={{ color: "#3b82f6" }}
                  />
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="text.secondary"
                  >
                    {t("categories")}:
                  </Typography>
                  {job.categories.slice(0, 2).map((cat) => (
                    <Chip
                      key={cat.pk_id}
                      label={cat.name}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: "0.70rem",
                        height: 18,
                        borderRadius: "8px",
                        borderColor: "#f97316",
                        color: "#f97316",
                        bgcolor: "rgba(249, 115, 22, 0.06)",
                        "& .MuiChip-label": {
                          px: 0.7,
                          fontWeight: 600,
                        },
                      }}
                    />
                  ))}
                  {job.categories.length > 2 && (
                    <Chip
                      label={`+${job.categories.length - 2}`}
                      size="small"
                      sx={{
                        fontSize: "0.70rem",
                        height: 18,
                        borderRadius: "8px",
                        fontWeight: 600,
                        bgcolor: "rgba(59, 130, 246, 0.1)",
                        color: "#3b82f6",
                      }}
                    />
                  )}
                </Stack>
              )}

              <Stack direction="row" spacing={1} mt={1}>
                <Typography
                  variant="caption"
                  sx={{ color: "#3b82f6" }}
                  mt={1.5}
                  display="block"
                >
                  {t("posted_date")}:{" "}
                  {job.posting_date
                    ? new Date(job.posting_date).toISOString().split("T")[0]
                    : "—"}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{ color: "#f97316" }}
                  mt={1.5}
                  display="block"
                >
                  {t("closing_date")}:{" "}
                  {job.closing_date
                    ? new Date(job.closing_date).toISOString().split("T")[0]
                    : "—"}
                </Typography>
              </Stack>
            </CardContent>

            <CardActions sx={{ justifyContent: "flex-end", px: 1, pb: 1 }}>
              <Tooltip title={t("edit_job")} arrow placement="bottom">
                <IconButton size="small" onClick={() => openEdit(job)}>
                  <EditIcon fontSize="small" sx={{ color: "#3b82f6", "&:hover": { color: "#1e3a8a" } }} />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("duplicate_job")} arrow placement="bottom">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => openDuplicate(job)}
                >
                  <ContentCopyIcon fontSize="small" sx={{ color: "#f97316", "&:hover": { color: "#ea580c" } }}/>
                </IconButton>
              </Tooltip>

              {job.status !== "Closed" && (
                <Tooltip title={t("close_job")} arrow placement="bottom">
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => openClose(job)}
                  >
                    <CloseIcon fontSize="small" sx={{ color: "#ef4444", "&:hover": { color: "#dc2626" } }}/>
                  </IconButton>
                </Tooltip>
              )}
            </CardActions>
          </Card>
        ))}

        {jobs.length === 0 && (
          <Box
            gridColumn="1 / -1"
            textAlign="center"
            py={6}
            sx={{ color: "#1e3a8a", opacity: 0.7 }}
          >
            {t("no_jobs_posted")}
          </Box>
        )}
      </Box>
      {/* DIALOGS */}
      <JobFormDialog
        open={openFormDialog}
        onClose={(event, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") return;
          setOpenFormDialog(false);
          setEditingJob(null);
        }}
        onSuccess={handleFormSuccess}
        initialData={editingJob}
        isEdit={!!editingJob && !!editingJob.pk_id}
        isDuplicate={!!editingJob && !editingJob.pk_id}
        categories={categories}
      />

      <Dialog
        open={openCloseDialog}
        onClose={() => setOpenCloseDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 16px 48px rgba(30, 58, 138, 0.2)",
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(239, 246, 255, 0.95) 100%)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
          },
        }}
      >
        {/* Title */}
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)",
            fontWeight: 600,
            color: "#ef4444",
            borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
          }}
        >
          <CloseIcon color="warning" />
          {t("close_job_posting")}
        </DialogTitle>

        <Divider />

        {/* Content */}
        <DialogContent
          sx={{
            py: 3,
            backgroundColor: "#FAFAFA",
          }}
        >
          <DialogContentText sx={{ fontSize: "1rem", color: "#1e3a8a" }}>
            {t("are_you_sure_close")}
            <Box component="span" sx={{ fontWeight: 600, mx: 0.5, color: "#f97316" }}>
              {closingJob?.job_title}
            </Box>
            ?
          </DialogContentText>

          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor: "rgba(249, 115, 22, 0.08)",
              fontSize: "0.9rem",
              color: "#1e3a8a",
              border: "1px solid rgba(249, 115, 22, 0.2)",
            }}
          >
            ⚠️ {t("close_warning")}
          </Box>
        </DialogContent>

        {/* Actions */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            backgroundColor: "#FAFAFA", 
            borderTop: "1px solid rgba(59, 130, 246, 0.1)"
          }}
        >
          <Button
            onClick={() => setOpenCloseDialog(false)}
            variant="outlined"
            color="error"
            size="small"
            startIcon={<Cancel />}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              borderColor: "#3b82f6",
              color: "#3b82f6",
              "&:hover": { borderColor: "#f97316", color: "#f97316" },
            }}
          >
            {t("cancel")}
          </Button>

          <Button
            variant="contained"
            onClick={confirmClose}
            startIcon={<CloseIcon />}
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 2.5,
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              },
            }}
          >
            {t("close")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDuplicateDialog}
        onClose={() => setOpenDuplicateDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 16px 48px rgba(30, 58, 138, 0.2)",
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(239, 246, 255, 0.95) 100%)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
          },
        }}
      >
        {/* Title */}
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(249, 115, 22, 0.08) 100%)",
            fontWeight: 600,
            color: "#1e3a8a",
            borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
          }}
        >
          <ContentCopyIcon sx={{ color: "#3b82f6" }} />
          {t("duplicate_job_posting")}
        </DialogTitle>

        <Divider />

        {/* Content */}
        <DialogContent
          sx={{
            py: 3,
            backgroundColor: "#FAFAFA",
          }}
        >
          <DialogContentText sx={{ fontSize: "1rem", color: "#1e3a8a" }}>
            {t("are_you_sure_duplicate")}
            <Box component="span" sx={{ fontWeight: 600, mx: 0.5, color: "#f97316" }}>
              {duplicateJob?.job_title}
            </Box>
            ?
          </DialogContentText>

          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor: "rgba(59, 130, 246, 0.06)",
              fontSize: "0.9rem",
              color: "#1e3a8a",
              border: "1px solid rgba(59, 130, 246, 0.15)",
            }}
          >
            ⚠️ {t("duplicate_warning")}
          </Box>
        </DialogContent>

        {/* Actions */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            backgroundColor: "#FAFAFA", 
            borderTop: "1px solid rgba(59, 130, 246, 0.1)"
          }}
        >
          <Button
            onClick={() => setOpenDuplicateDialog(false)}
            variant="outlined"
            color="error"
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              borderColor: "#ef4444",
              color: "#ef4444",
              "&:hover": { borderColor: "#dc2626" },
            }}
            startIcon={<Cancel />}
          >
            {t("cancel")}
          </Button>

          <Button
            variant="contained"
            onClick={confirmDuplicate}
            startIcon={<ContentCopyIcon />}
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 2.5,
              background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 0%, #f97316 150%)",
              "&:hover": {
                background: "linear-gradient(135deg, #1e40af 0%, #2563eb 0%, #ea580c 150%)",
              },
            }}
          >
            {t("duplicate")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog approve */}
      <Dialog
        open={openApprovalWarning}
        onClose={() => setOpenApprovalWarning(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 16px 48px rgba(30, 58, 138, 0.2)",
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(239, 246, 255, 0.95) 100%)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            background: "linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.1) 100%)",
            fontWeight: 600,
            color: "#ea580c",
            borderBottom: "1px solid rgba(249, 115, 22, 0.2)",
          }}
        >
          <WarningAmber sx={{ color: "#f97316" }} />
          Account Awaiting Approval
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ py: 3, backgroundColor: "#FAFAFA" }}>
          <DialogContentText
            sx={{ fontSize: "1rem", color: "#1e3a8a", mb: 2 }}
          >
            Your employer account has not been approved yet.
          </DialogContentText>

          <Box
            sx={{
              mt: 1,
              p: 2.5,
              borderRadius: 2,
              backgroundColor: "rgba(249, 115, 22, 0.06)",
              border: "1px solid",
              borderColor: "#f97316",
              fontSize: "0.95rem",
              color: "#1e3a8a",
            }}
          >
            <strong style={{ color: "#ea580c" }}>
              You cannot post new jobs until admin approval is complete.
            </strong>
            <br />
            <br />
            Please wait for the administrator to review and approve your
            account.
            <Box sx={{ mt: 2.5, fontWeight: 500 }}>
              Need help or want to check status?
              <br />
              Contact us at:{" "}
              <Box sx={{ mt: 2 }}>
                <Box>📞 Phone: <strong style={{ color: "#3b82f6" }}>+855 12 345 678</strong></Box>
                <Box sx={{ mt: 0.5 }}>
                  ✉️ Email: <strong style={{ color: "#f97316" }}>truematch360@gmail.com</strong>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Optional: smaller support note */}
          <Typography
            variant="caption"
            sx={{
              mt: 2,
              display: "block",
              color: "#3b82f6",
              textAlign: "center",
            }}
          >
            We're here to help!
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            backgroundColor: "#FAFAFA",
            justifyContent: "center",
            borderTop: "1px solid rgba(59, 130, 246, 0.1)",
          }}
        >
          <Button
            onClick={() => setOpenApprovalWarning(false)}
            variant="contained"
            color="warning"
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 5,
              minWidth: 140,
              background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 0%, #f97316 150%)",
              "&:hover": {
                background: "linear-gradient(135deg, #1e40af 0%, #2563eb 0%, #ea580c 150%)",
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
