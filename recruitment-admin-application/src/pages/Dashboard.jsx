// src/pages/Dashboard.jsx
import {
  Cancel,
  CheckBox,
  CheckBoxOutlineBlank,
  CheckCircle,
  EmailOutlined,
  Home,
  Info,
  LanguageOutlined,
  LocationCity,
  PhoneOutlined,
  PictureAsPdf,
  Send,
  UploadFile,
  HourglassEmpty,
} from "@mui/icons-material";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EventIcon from "@mui/icons-material/Event";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PaymentsIcon from "@mui/icons-material/Payments";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import {
  Alert,
  alpha,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from "@mui/material/ListItemText";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Popover from "@mui/material/Popover";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import "quill/dist/quill.snow.css";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import ReactQuill from "react-quill-new";
import { useParams } from 'react-router-dom';
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";

export default function Dashboard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { jobId } = useParams();

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
  const [sortBy, setSortBy] = useState("date-desc");

  const [categories, setCategories] = useState([]);

  const [categoryAnchor, setCategoryAnchor] = useState(null);
  const [typeAnchor, setTypeAnchor] = useState(null);
  const [dateSortAnchor, setDateSortAnchor] = useState(null);
  const [titleSortAnchor, setTitleSortAnchor] = useState(null);
  const [dateFilterAnchor, setDateFilterAnchor] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const openFilterMenu = Boolean(filterMenuAnchor);

  const openCategory = Boolean(categoryAnchor);
  const openType = Boolean(typeAnchor);
  const openDateSort = Boolean(dateSortAnchor);
  const openTitleSort = Boolean(titleSortAnchor);
  const openDateFilter = Boolean(dateFilterAnchor);

  const [dateFilterMode, setDateFilterMode] = useState("all");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [companyAnchor, setCompanyAnchor] = useState(null);
  const openCompanyPopover = Boolean(companyAnchor);

  const isCandidate = useAuthStore((state) => state.isCandidate());

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
  const [hasAppliedToThisJob, setHasAppliedToThisJob] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

  const [coverLetterFile, setCoverLetterFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [previousCoverLetterName, setPreviousCoverLetterName] = useState(null);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [coverLetterToDelete, setCoverLetterToDelete] = useState(false);
  const [originalResumeId, setOriginalResumeId] = useState(null);
  const canUploadNewCoverLetter = !previousCoverLetterName || coverLetterToDelete;
  const [checkButtonApply, setCheckButtonApply] = useState(true);

  const handleStageDeleteCoverLetter = () => {
    setCoverLetterToDelete(true);
    setCoverLetterFile(null);
  };

  const handleUndoDeleteCoverLetter = () => {
    setCoverLetterToDelete(false);
  };

  const handleStageDeleteImage = (imageId) => {
    if (!imagesToDelete.includes(imageId)) {
      setImagesToDelete((prev) => [...prev, imageId]);
    }
  };

  const handleUndoDeleteImage = (imageId) => {
    setImagesToDelete((prev) => prev.filter((id) => id !== imageId));
  };

  var job_id = jobId && !isNaN(Number(jobId)) ? Number(jobId) : null;

  const getDateRange = () => {
    const today = dayjs().startOf("day");

    if (dateFilterMode === "today") {
      return { from: today, to: today };
    }
    if (dateFilterMode === "last7") {
      return {
        from: today.subtract(7, "day"),
        to: today,
      };
    }
    if (dateFilterMode === "custom" && dateFrom && dateTo) {
      return {
        from: dayjs(dateFrom).startOf("day"),
        to: dayjs(dateTo).endOf("day"),
      };
    }
    return null;
  };

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

    let result = [...jobs];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    result = result.filter((job) => {
      if (!job.closing_date) return true;
      // modif by rathana
      if (job_id !== null && job_id !== undefined && (job.pk_id === job_id || job.id === job_id)) {
        return true;
      }
      // end modif
      const closing = new Date(job.closing_date);
      return closing >= today;
    });

    const term = searchTerm.toLowerCase().trim();

    result = result.filter((job) => {
      const title = job.job_title?.toLowerCase() || "";
      const company = job.employer?.company_name?.toLowerCase() || "";
      const location = job.location?.toLowerCase() || "";

      const keywordMatch =
        !term ||
        title.includes(term) ||
        company.includes(term) ||
        location.includes(term);

      const typeMatch =
        typeFilter.includes("All") || typeFilter.includes(job.job_type);

      const levelMatch = levelFilter === "All" || job.level === levelFilter;

      const categoryMatch =
        categoryFilter.includes("All") ||
        (job.categories || []).some((cat) =>
          categoryFilter.includes(cat.pk_id),
        );

      return keywordMatch && typeMatch && levelMatch && categoryMatch;
    });

    //Date range filter
    const range = getDateRange();
    if (range) {
      result = result.filter((job) => {
        if (!job.posting_date) return false;
        const postedDay = dayjs(job.posting_date).startOf("day");
        return (
          postedDay.isAfter(range.from.subtract(1, "day"), "day") &&
          postedDay.isBefore(range.to.add(1, "day"), "day")
        );
      });
    }

    //Sorting
    result = result.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.posting_date) - new Date(a.posting_date);
      }
      if (sortBy === "date-asc") {
        return new Date(a.posting_date) - new Date(b.posting_date);
      }
      if (sortBy === "title-asc") {
        return a.job_title.localeCompare(b.job_title);
      }
      if (sortBy === "title-desc") {
        return b.job_title.localeCompare(a.job_title);
      }
      return 0;
    });

    setFilteredJobs(result);

    if (selectedJob && !result.some((j) => j.pk_id === selectedJob.pk_id)) {
      setSelectedJob(result[0] || null);
    }
  }, [
    searchTerm,
    typeFilter,
    levelFilter,
    categoryFilter,
    dateFilterMode,
    dateFrom,
    dateTo,
    sortBy,
    jobs,
  ]);

  useEffect(() => {
    loadJobs(false);
  }, []);

  useEffect(() => {
    setSkip(0);
    setHasMore(true);
    loadJobs(false);
  }, [
    searchTerm,
    typeFilter,
    levelFilter,
    categoryFilter,
    dateFilterMode,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    if (applyDialogOpen && selectedResumeId) {
      loadResumeExtras(selectedResumeId);
    }
  }, [selectedResumeId, applyDialogOpen]);

  const loadResumeExtras = async (resumeId) => {
    if (!resumeId) {
      setExistingImages([]);
      setPreviousCoverLetterName(null);
      return;
    }

    try {
      const imagesRes = await api.get(
        `/applications/resumes/${resumeId}/images`,
      );
      setExistingImages(imagesRes.data || []);

      const foundResume = resumes.find(
        (r) => String(r.pk_id) === String(resumeId),
      );

      if (foundResume) {
        setPreviousCoverLetterName(foundResume.cover_letter_file || null);
      } else {
        console.warn(`Resume ${resumeId} not found in loaded resumes list`);
        setPreviousCoverLetterName(null);
      }
    } catch (err) {
      console.error("Failed to load resume extras:", err);
      setSnackbar({
        open: true,
        message: t('could_not_load_attachments'),
        severity: "warning",
      });

      setExistingImages([]);
      setPreviousCoverLetterName(null);
    }
  };

  const handleOpenApplyDialog = async () => {
    if (!selectedJob) return;

    setJobToApply(selectedJob);
    setApplyDialogOpen(true);

    setImagesToDelete([]);
    setImageFiles([]);
    setCoverLetterFile(null);
    setCoverLetterToDelete(null);

    try {
      const res = await api.get(
        `/applications/job/${selectedJob.pk_id}/my-status`,
      );
      const data = res.data;

      let initialResumeId = null;

      if (data.applied && data.resume_id) {
        initialResumeId = String(data.resume_id);
        setOriginalResumeId(initialResumeId);
        setPreviousCoverLetterName(data.cover_letter_filename || null);
      } else {
        const primary = resumes.find((r) => r.is_primary);
        if (primary) {
          initialResumeId = String(primary.pk_id);
        }
      }

      if (initialResumeId) {
        setSelectedResumeId(initialResumeId);
        await loadResumeExtras(initialResumeId);
      } else {
        setOriginalResumeId(null);
        setPreviousCoverLetterName(null);
        setExistingImages([]);
      }
    } catch (err) {
      const primary = resumes.find((r) => r.is_primary);
      if (primary) {
        const pid = String(primary.pk_id);
        setSelectedResumeId(pid);
        await loadResumeExtras(pid);
      }
    }
  };

  const [skip, setSkip] = useState(0);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadJobs = async (isLoadMore = false) => {
    try {
      const params = {
        skip: isLoadMore ? skip : 0,
        limit: limit,
        job_id: job_id,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (typeFilter !== "All" && typeFilter.length > 0) {
        const validTypes = ["Full-time", "Part-time", "Internship"];
        const safeTypes = typeFilter.filter((t) => validTypes.includes(t));
        if (safeTypes.length > 0) {
          params.job_types = safeTypes.join(",");
        }
      }

      if (levelFilter !== "All") {
        params.levels = levelFilter;
      }

      if (!categoryFilter.includes("All") && categoryFilter.length > 0) {
        params.category_ids = categoryFilter.join(",");
      }

      if (dateFilterMode !== "all") {
        const range = getDateRange();
        if (range) {
          params.posted_after = range.from.format("YYYY-MM-DD");
          params.posted_before = range.to.format("YYYY-MM-DD");
        }
      }

      const res = await api.get("/jobs/", { params });

      const newJobs = res.data || [];

      if (isLoadMore) {
        setJobs((prev) => [...prev, ...newJobs]);
        setFilteredJobs((prev) => [...prev, ...newJobs]);
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeJobs = newJobs.filter((job) => {
          if (!job.closing_date) return true;
          // modif by rathana
          if (job_id !== null && job_id !== undefined && (job.pk_id === job_id || job.id === job_id)) {
            return true;
          }
          // end modif
          const closing = new Date(job.closing_date);
          return closing >= today;
        });

        setJobs(activeJobs);
        setFilteredJobs(activeJobs);

        if (activeJobs.length > 0) {
          setSelectedJob(activeJobs[0]);
        } else {
          setSelectedJob(null);
        }
      }

      setHasMore(newJobs.length === limit);
      setSkip((prev) => (isLoadMore ? prev + limit : limit));
    } catch (err) {
      setError(t('failed_to_load_jobs'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!isCandidate || jobs.length === 0) return;

    const fetchAppliedJobIds = async () => {
      try {
        const res = await api.get("/applications/my-applied-job-ids");
        const jobIds = res.data?.job_ids || [];
        setAppliedJobIds(new Set(jobIds));
      } catch (err) {
        console.error("Failed to load applied job IDs:", err);
      }
    };

    fetchAppliedJobIds();
  }, [isCandidate, jobs.length]);

  useEffect(() => {
    if (!isCandidate) {
      setResumes([]);
      setSelectedResumeId("");
      return;
    }
    const loadResumes = async () => {
      try {
        const res = await api.get("/candidate/resumes/");
        setResumes(res.data || []);
        const primary = res.data?.find((r) => r.is_primary);
        if (primary) setSelectedResumeId(primary.pk_id);
      } catch (err) {
        setResumes([]);
      }
    };
    loadResumes();
  }, [isCandidate]);

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    if (isMobile) {
      setShowDetailMobile(true);
    }
  };

  const handleBackToList = () => {
    setShowDetailMobile(false);
  };

  useEffect(() => {
    if (!selectedJob || !isCandidate) {
      setHasAppliedToThisJob(false);
      return;
    }

    const checkApplication = async () => {
      try {
        const res = await api.get(
          `/applications/job/${selectedJob.pk_id}/my-status`,
        );
        const closeDate = res.data?.close_date;
        const jobStatus = res.data?.job_status?.toLowerCase?.() || '';

        let isClosedByDate = false;

        if (closeDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const closing = new Date(closeDate);
          closing.setHours(0, 0, 0, 0);

          isClosedByDate = closing < today;
        }

        const isClosedByStatus = jobStatus === "closed";

        const isClosed = isClosedByDate || isClosedByStatus;

        setCheckButtonApply(isClosed);
        setHasAppliedToThisJob(!!res.data?.applied);
      } catch (err) {
        setHasAppliedToThisJob(false);
      }
    };

    checkApplication();
  }, [selectedJob, isCandidate]);

  const handleNewResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError(null);

    const formData = new FormData();

    formData.append("resume_type", "Upload");
    formData.append("is_primary", "false");
    formData.append("resume_file", file);

    try {
      const res = await api.post("/candidate/resumes/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newResume = res.data;
      setResumes((prev) => [...prev, newResume]);
      setSelectedResumeId(newResume.pk_id.toString());

      setSnackbar({
        open: true,
        message: t('resume_uploaded'),
        severity: "success",
      });
    } catch (err) {
      const errorDetail = err.response?.data?.detail;

      if (Array.isArray(errorDetail)) {
        const firstError = errorDetail[0];
        setUploadError(`${firstError.loc?.join(".")}: ${firstError.msg}`);
      } else {
        setUploadError(errorDetail || t('upload_failed'));
      }

      console.error("Upload failed:", err);
    } finally {
      setUploadLoading(false);
      e.target.value = "";
    }
  };

  const handleApplyWithResume = async () => {
    if (!jobToApply || !selectedResumeId) return;

    try {
      setApplying((prev) => ({ ...prev, [jobToApply.pk_id]: true }));

      if (imagesToDelete.length > 0) {
        await Promise.all(
          imagesToDelete.map((imageId) =>
            api.delete(
              `/applications/resumes/${selectedResumeId}/images/${imageId}`,
            ),
          ),
        );
      }

      const formData = new FormData();
      formData.append("job_id", jobToApply.pk_id.toString());
      formData.append("candidate_resume_id", selectedResumeId);

      if (coverLetterToDelete && !coverLetterFile) {
        formData.append("delete_cover_letter", "true");
      }
      if (coverLetterFile) {
        formData.append("cover_letter_file", coverLetterFile);
      }

      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      await api.post("/applications/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const resumesRes = await api.get("/candidate/resumes/");
      setResumes(resumesRes.data || []);

      const statusRes = await api.get(
        `/applications/job/${jobToApply.pk_id}/my-status`,
      );
      const data = statusRes.data;

      setHasAppliedToThisJob(data.applied);

      if (data.applied && data.resume_id) {
        const newResumeId = String(data.resume_id);
        setSelectedResumeId(newResumeId);
        await loadResumeExtras(newResumeId);
      } else {
        setPreviousCoverLetterName(null);
        setExistingImages([]);
      }

      setCoverLetterFile(null);
      setCoverLetterToDelete(false);
      setImagesToDelete([]);
      setImageFiles([]);

      setSnackbar({
        open: true,
        message: hasAppliedToThisJob
          ? t('application_updated')
          : t('application_submitted'),
        severity: "success",
      });

      setApplyDialogOpen(false);
      setHasAppliedToThisJob(true);
      setAppliedJobIds((prev) => new Set([...prev, jobToApply.pk_id]));
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || t('application_failed'),
        severity: "error",
      });
    } finally {
      setApplying((prev) => ({ ...prev, [jobToApply.pk_id]: false }));
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
      <Stack
        direction="row"
        spacing={1}
        p={1}
        justifyContent="space-between"
        alignItems="center"
      >
        {/* title */}
        <TextField
          size="small"
          placeholder={t('search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          InputProps={{
            sx: {
              fontSize: 12,
              height: 34,
              borderRadius: 2,
            },
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm("")}
                  sx={{ p: 0.25 }}
                >
                  <Cancel sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {/* Single MoreVert button */}
        <Tooltip title={t('filters_sorting')} arrow placement="bottom">
          <IconButton
            size="small"
            onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
            sx={{
              p: 0.5,
              width: 34,
              height: 34,
              borderRadius: 1,
              bgcolor: "teal",
              color: "#fff",
              "&:hover": { bgcolor: "teal" },
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={filterMenuAnchor}
          open={openFilterMenu}
          onClose={() => setFilterMenuAnchor(null)}
          PaperProps={{
            sx: {
              width: 220,
              maxHeight: 480,
              mt: 1,
              borderRadius: 2,
              boxShadow: 4,
              border: "1px solid",
              borderColor: "teal",
            },
          }}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          {/* Header */}
          <Box p={1}>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              color="text.primary"
            >
              {t('filter_sort_jobs')}
            </Typography>
          </Box>

          <Divider />

          {/* FILTERS GROUP */}
          <Box p={1} sx={{ opacity: 1, py: 0.8 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={500}
            >
              {t('filters')}
            </Typography>
          </Box>

          {/* Categories */}
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              setCategoryAnchor(e.currentTarget);
            }}
            sx={{ py: 1.1 }}
          >
            <ListItemIcon>
              <CategoryRoundedIcon fontSize="small" color="action" />
            </ListItemIcon>
            <ListItemText
              primary={t('categories')}
              primaryTypographyProps={{ fontSize: "15px" }}
            />
            {!categoryFilter.includes("All") && categoryFilter.length > 0 && (
              <Chip
                size="small"
                label={categoryFilter.length}
                color="primary"
                sx={{
                  ml: "auto",
                  minWidth: 32,
                  height: 20,
                  fontSize: "0.75rem",
                }}
              />
            )}
          </MenuItem>

          {/* Job Type */}
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              setTypeAnchor(e.currentTarget);
            }}
            sx={{ py: 1.1 }}
          >
            <ListItemIcon>
              <WorkOutlineIcon fontSize="small" color="action" />
            </ListItemIcon>
            <ListItemText
              primary={t('job_type')}
              primaryTypographyProps={{ fontSize: "15px" }}
            />
            {Array.isArray(typeFilter) &&
              typeFilter.length > 0 &&
              typeFilter[0] !== "All" && (
                <Chip
                  size="small"
                  label={typeFilter.length}
                  color="primary"
                  sx={{
                    ml: "auto",
                    minWidth: 32,
                    height: 20,
                    fontSize: "0.75rem",
                  }}
                />
              )}
          </MenuItem>

          {/* Posted Date Filter */}
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              setDateFilterAnchor(e.currentTarget);
            }}
            sx={{ py: 1.1 }}
          >
            <ListItemIcon>
              <EventIcon fontSize="small" color="action" />
            </ListItemIcon>
            <ListItemText
              primary={t('posted_date')}
              primaryTypographyProps={{ fontSize: "15px" }}
            />
            {dateFilterMode !== "all" && (
              <Chip
                size="small"
                label={
                  dateFilterMode === "today"
                    ? t('today')
                    : dateFilterMode === "last7"
                      ? t('last_7_days')
                      : t('custom')
                }
                variant="outlined"
                sx={{
                  ml: "auto",
                  minWidth: 60,
                  height: 20,
                  fontSize: "0.75rem",
                }}
              />
            )}
          </MenuItem>
          {/* RESET OPTIONS */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<Cancel />}
              sx={{
                textTransform: "none",
                fontSize: "0.75rem",
                py: 0.25,
                px: 0.5,
                mt: 0.5,
              }}
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("All");
                setLevelFilter("All");
                setCategoryFilter(["All"]);
                setDateFilterMode("all");
                setDateFrom(null);
                setDateTo(null);
                setFilterMenuAnchor(null);
              }}
            >
              {t('reset')}
            </Button>
          </Box>

          <Divider variant="middle" sx={{ my: 1 }} />

          {/* SORT GROUP */}
          <Box p={1} sx={{ opacity: 1, py: 0.8 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={500}
            >
              {t('sort_by')}
            </Typography>
          </Box>

          {/* Sort by Date */}
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              setDateSortAnchor(e.currentTarget);
            }}
            sx={{ py: 1.1 }}
          >
            <ListItemIcon>
              <EventIcon fontSize="small" color="action" />
            </ListItemIcon>
            <ListItemText
              primary={t('date_posted')}
              primaryTypographyProps={{ fontSize: "15px" }}
            />
            {sortBy.startsWith("date-") && (
              <Chip
                size="small"
                label={sortBy === "date-desc" ? t('newest') : t('oldest')}
                variant="outlined"
                sx={{
                  ml: "auto",
                  minWidth: 60,
                  height: 20,
                  fontSize: "0.75rem",
                }}
              />
            )}
          </MenuItem>

          {/* Sort by Title */}
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              setTitleSortAnchor(e.currentTarget);
            }}
            sx={{ py: 1.1 }}
          >
            <ListItemIcon>
              <BadgeIcon fontSize="small" color="action" />
            </ListItemIcon>
            <ListItemText
              primary={t('job_title')}
              primaryTypographyProps={{ fontSize: "15px" }}
            />
            {sortBy.startsWith("title-") && (
              <Chip
                size="small"
                label={sortBy === "title-asc" ? t('a_to_z') : t('z_to_a')}
                variant="outlined"
                sx={{
                  ml: "auto",
                  minWidth: 60,
                  height: 20,
                  fontSize: "0.75rem",
                }}
              />
            )}
          </MenuItem>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              variant="outlined"
              color="warning"
              size="small"
              startIcon={<Cancel fontSize="small" />}
              sx={{
                textTransform: "none",
                fontSize: "0.75rem",
                py: 0.25,
                px: 0.5,
                mt: 0.5,
              }}
              onClick={() => {
                setSortBy("date-desc");
                setFilterMenuAnchor(null);
              }}
            >
              {t('reset')}
            </Button>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ display: "flex", justifyContent: "end" }} p={1}>
            <Button
              variant="contained"
              size="small"
              fullWidth
              startIcon={<Cancel fontSize="small" />}
              sx={{ textTransform: "none", fontWeight: 600 }}
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("All");
                setLevelFilter("All");
                setCategoryFilter(["All"]);
                setSortBy("date-desc");
                setDateFilterMode("all");
                setDateFrom(null);
                setDateTo(null);
                setFilterMenuAnchor(null);
              }}
            >
              {t('reset_all')}
            </Button>
          </Box>
        </Menu>

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
              width: 310,
              maxHeight: 420,
              borderRadius: 2,
              p: 2.5,
              overflowY: "auto",
              border: "3px solid",
              borderColor: "divider",
            },
          }}
        >
          <List dense disablePadding>
            {/* ALL */}
            <ListItemButton
              selected={categoryFilter.includes("All")}
              onClick={() => setCategoryFilter(["All"])}
              sx={{ borderRadius: 1, py: 0.5 }}
            >
              <Checkbox
                size="small"
                checked={categoryFilter.includes("All")}
                icon={<CheckBoxOutlineBlank fontSize="small" />}
                checkedIcon={<CheckBox fontSize="small" />}
              />
              <ListItemText primary={t('all')} />
            </ListItemButton>

            {categories.map((cat) => {
              const checked = categoryFilter.includes(cat.pk_id);

              return (
                <ListItemButton
                  key={cat.pk_id}
                  selected={checked}
                  sx={{ borderRadius: 1, py: 0.5 }}
                  onClick={() => {
                    let updated = [...categoryFilter];

                    if (checked) {
                      updated = updated.filter((v) => v !== cat.pk_id);
                    } else {
                      updated = updated.filter((v) => v !== "All");
                      updated.push(cat.pk_id);
                    }

                    setCategoryFilter(updated.length === 0 ? ["All"] : updated);
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={checked}
                    icon={<CheckBoxOutlineBlank fontSize="small" />}
                    checkedIcon={<CheckBox fontSize="small" />}
                  />
                  <ListItemText primary={cat.name} />
                </ListItemButton>
              );
            })}
          </List>
        </Popover>
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
              border: "3px solid",
              borderColor: "divider",
            },
          }}
        >
          <List dense disablePadding>
            {[t('all'), t('full_time'), t('part_time'), t('internship')].map((type) => {
              const checked = typeFilter.includes(type);

              return (
                <ListItemButton
                  key={type}
                  selected={checked}
                  sx={{ borderRadius: 1 }}
                  onClick={() => {
                    let updated = [...typeFilter];

                    if (type === t('all')) {
                      updated = [t('all')];
                    } else {
                      updated = updated.filter((v) => v !== t('all'));

                      if (updated.includes(type)) {
                        updated = updated.filter((v) => v !== type);
                      } else {
                        updated.push(type);
                      }

                      if (updated.length === 0) updated = [t('all')];
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
      </Stack>

      <Divider />

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
            <Box component="img" src="/No-Data.gif" alt={t('no_data')} />
          </Box>
        ) : (
          <>
            {filteredJobs.map((job) => {
              const active = selectedJob?.pk_id === job.pk_id;
              const companyName = job.employer?.company_name;
              const logoFilename = job.employer?.company_logo;
              const alreadyApplied =
                isCandidate && appliedJobIds.has(job.pk_id);
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
                      {companyName?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box minWidth={0} flex={1}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        width="100%"
                      >
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {job.job_title}
                        </Typography>

                        {alreadyApplied && (
                          <Chip
                            label={t('applied')}
                            size="small"
                            color="success"
                            variant="filled"
                            icon={<CheckCircle />}
                            sx={{
                              fontSize: "0.60rem",
                              fontWeight: 600,
                              minWidth: 50,
                              ml: 1,
                              bgcolor: alpha(theme.palette.success.main, 0.15),
                              color: theme.palette.success.dark,
                              border: `1px solid ${theme.palette.success.main}`,
                            }}
                          />
                        )}
                      </Stack>

                      {job.categories?.length > 0 && (
                        <Stack
                          direction="row"
                          spacing={0.3}
                          mt={0.75}
                          flexWrap="wrap"
                          alignItems="center"
                        >
                          <CategoryRoundedIcon
                            fontSize=""
                            sx={{ color: "text.secondary" }}
                          />

                          <Typography
                            variant="caption"
                            fontWeight={600}
                            color="text.secondary"
                          >
                            {t('categories')}:
                          </Typography>

                          {job.categories.slice(0, 2).map((cat) => (
                            <Chip
                              key={cat.pk_id}
                              label={cat.name}
                              size="small"
                              variant="outlined"
                              sx={(theme) => ({
                                fontSize: "0.65rem",
                                height: 18,
                                borderRadius: "8px",
                                borderColor: theme.palette.warning.light,
                                color: theme.palette.warning.dark,
                                bgcolor: theme.palette.warning.light + "22",
                                "& .MuiChip-label": {
                                  px: 0.7,
                                  fontWeight: 600,
                                },
                              })}
                            />
                          ))}

                          {job.categories.length > 2 && (
                            <Chip
                              label={`+${job.categories.length - 2}`}
                              size="small"
                              sx={{
                                fontSize: "0.65rem",
                                height: 18,
                                borderRadius: "8px",
                                fontWeight: 600,
                                bgcolor: "action.hover",
                                color: "text.secondary",
                              }}
                            />
                          )}
                        </Stack>
                      )}

                      <Stack direction="row" spacing={0.3} mt={0.5}>
                        <Chip
                          icon={<EventIcon />}
                          label={`${t('posted')}: ${job.posting_date ? new Date(job.posting_date).toISOString().split("T")[0] : "—"}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{
                            fontSize: 12,
                          }}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              );
            })}
            {/* ─── Load More Button ─── */}
            {hasMore && (
              <Box sx={{ p: 1, textAlign: "end" }}>
                <Tooltip title={t('show_more')} arrow placement="top">
                  <IconButton
                    size="small"
                    onClick={() => loadJobs(true)}
                    disabled={loadingMore}
                    sx={{
                      border: 2,
                      borderColor: "warning.main",
                      borderRadius: 2,
                    }}
                  >
                    {loadingMore ? (
                      <CircularProgress size={16} />
                    ) : (
                      <AutorenewRoundedIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            {!hasMore && filteredJobs.length > 0 && (
              <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
                <Typography variant="body2">{t('no_more_jobs')}</Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Card>
  );

  const DateFilterPopover = () => (
    <Popover
      open={openDateFilter}
      anchorEl={dateFilterAnchor}
      onClose={() => setDateFilterAnchor(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      PaperProps={{
        sx: {
          width: 320,
          borderRadius: 2,
          p: 3,
          boxShadow: 4,
          border: "3px solid",
          borderColor: "divider",
        },
      }}
    >
      <RadioGroup
        value={dateFilterMode}
        onChange={(e) => {
          const mode = e.target.value;
          setDateFilterMode(mode);
          if (mode !== "custom") {
            setDateFrom(null);
            setDateTo(null);
          }
        }}
      >
        <FormControlLabel value="all" control={<Radio />} label={t('all_dates')} />
        <FormControlLabel value="today" control={<Radio />} label={t('today')} />
        <FormControlLabel
          value="last7"
          control={<Radio />}
          label={t('last_7_days')}
        />
        <FormControlLabel
          value="custom"
          control={<Radio />}
          label={t('custom_range')}
        />
      </RadioGroup>

      {dateFilterMode === "custom" && (
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <DatePicker
            label={t('from')}
            value={dateFrom}
            onChange={(newValue) => setDateFrom(newValue)}
            format="YYYY-MM-DD"
            slotProps={{
              textField: { size: "small", fullWidth: true },
            }}
            maxDate={dateTo || dayjs()}
          />

          <DatePicker
            label={t('to')}
            value={dateTo}
            onChange={(newValue) => setDateTo(newValue)}
            format="YYYY-MM-DD"
            slotProps={{
              textField: { size: "small", fullWidth: true },
            }}
            minDate={dateFrom}
            maxDate={dayjs()}
          />
        </Box>
      )}

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          sx={{ textTransform: "none" }}
          startIcon={<Cancel />}
          color="error"
          onClick={() => {
            setDateFilterMode("all");
            setDateFrom(null);
            setDateTo(null);
            setDateFilterAnchor(null);
          }}
        >
          {t('clear')}
        </Button>
      </Box>
    </Popover>
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
                <Stack direction="row" spacing={2} alignItems="center" flex={1}>
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
                    {companyName?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Stack direction="column" spacing={1} flexWrap="wrap">
                    <Typography variant="h7" fontWeight={700} lineHeight={1.2}>
                      {selectedJob.job_title}
                    </Typography>
                    <Chip
                      icon={<BusinessRoundedIcon sx={{ fontSize: 16 }} />}
                      label={`${t('company')}: ${companyName}`}
                      size="small"
                      sx={(theme) => ({
                        height: 22,
                        fontSize: "0.72rem",
                        alignSelf: "flex-start",
                        px: 0.5,
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.08,
                        ),
                        color: alpha(theme.palette.primary.main, 0.9),

                        "& .MuiChip-icon": {
                          fontSize: 16,
                          color: alpha(theme.palette.primary.main, 0.7),
                          ml: 0.5,
                        },

                        "& .MuiChip-label": {
                          px: 0.5,
                        },
                      })}
                    />
                  </Stack>
                </Stack>

                {/* Apply button – only for candidates */}
                {!checkButtonApply && isCandidate && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<Send />}
                    onClick={handleOpenApplyDialog}
                    disabled={applying[selectedJob?.pk_id]}
                    sx={{
                      display: {  xs: "none", sm: "none", md: "none", lg: "inline-flex",},
                      whiteSpace: "nowrap",
                      textTransform: "none",
                    }}
                  >
                    {hasAppliedToThisJob ? t('reapply') : t('apply_now')}
                  </Button>
                )}
                {/* Mobile buttons */}
                {isMobile && (
                  <Stack
                    direction="column"
                    spacing={0.5}
                    sx={{ mt: 1 }}
                    justifyContent="flex-end"
                  >
                    {isCandidate && !checkButtonApply && (
                      <Tooltip
                        title={hasAppliedToThisJob ? t('reapply') : t('apply')}
                        arrow
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={handleOpenApplyDialog}
                          sx={{
                            minWidth: 36,
                            px: 1,
                          }}
                        >
                          <Send fontSize="small" />
                        </Button>
                      </Tooltip>
                    )}
                  </Stack>
                )}

                {/* Desktop */}
                <Tooltip title={t('company_information')} arrow>
                  <Button
                    variant="outlined"
                    onClick={(e) => setCompanyAnchor(e.currentTarget)}
                    size="small"
                    color="info"
                    sx={{
                      minWidth: 0,
                      px: 1,
                    }}
                  >
                    <InfoOutlinedIcon color="warning" />
                  </Button>
                </Tooltip>

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
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    spacing={1}
                    mb={3}
                  >
                    <Typography
                      variant="h7"
                      fontWeight={550}
                      sx={{
                        borderBottom: "2px solid",
                        borderColor: "primary.main",
                      }}
                    >
                      {t('company_information')}
                    </Typography>
                  </Stack>

                  <Stack spacing={2.5}>
                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                      <BadgeIcon color="action" sx={{ mt: 0.5 }} />
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="text.secondary"
                        >
                          {t('company_name')}:
                        </Typography>
                        <Chip
                          variant="outlined"
                          size="small"
                          label={selectedJob.employer?.company_name}
                        ></Chip>
                      </Box>
                    </Stack>

                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                      <LocationCity color="action" sx={{ mt: 0.5 }} />
                      <Stack>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="text.secondary"
                        >
                          {t('address')}:
                        </Typography>
                        <Typography variant="subtitle2">
                          {selectedJob.employer?.company_address}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={2}>
                      <EmailOutlined color="action" />
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="text.secondary"
                        >
                          {t('email')}:
                        </Typography>
                        <Typography variant="body1">
                          {selectedJob.employer?.company_email || ""}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={2}>
                      <PhoneOutlined color="action" />
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="text.secondary"
                        >
                          {t('contact')}:
                        </Typography>
                        <Typography variant="body1">
                          {selectedJob.employer?.company_contact || ""}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={2}>
                      <LanguageOutlined color="action" />
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="text.secondary"
                        >
                          {t('website')}:
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
                          <Typography variant="body1"></Typography>
                        )}
                      </Box>
                    </Stack>

                    <Box sx={{ borderRadius: 3 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={2}
                        mb={1}
                      >
                        <Info color="action" />
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="text.secondary"
                          mb={1}
                        >
                          {t('about_company')}
                        </Typography>
                      </Stack>

                      <ReactQuill
                        theme="snow"
                        value={selectedJob.employer?.company_description || ""}
                        readOnly
                        modules={{ toolbar: false }}
                      />
                    </Box>
                  </Stack>
                </Popover>
                {/* Apply Dialog with Resume Selection */}
                <Dialog
                  open={applyDialogOpen && isCandidate}
                  onClose={() => {
                    setApplyDialogOpen(false);
                  }}
                  fullWidth
                  maxWidth="sm"
                  PaperProps={{
                    sx: {
                      borderRadius: 3,
                      overflow: "hidden",
                    },
                  }}
                >
                  {/* Header */}
                  <DialogTitle
                    sx={{
                      background: "linear-gradient(135deg, #1976d2, #42a5f5)",
                      color: "white",
                      py: 1.8,
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    {hasAppliedToThisJob
                      ? t('update_application')
                      : t('apply_to_position')}
                  </DialogTitle>

                  <DialogContent sx={{ mt: 1 }}>
                    {hasAppliedToThisJob && originalResumeId && (
                      <>
                        {selectedResumeId !== originalResumeId ? (
                          <Alert
                            severity="info"
                            sx={{ mb: 2, fontSize: "0.9rem" }}
                          >
                            {t('changed_resume_notice')}
                          </Alert>
                        ) : (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 1 }}
                          >
                            {t('using_same_resume')}
                          </Typography>
                        )}
                      </>
                    )}

                    {/* Resume Selection */}
                    <Box
                      sx={{
                        position: "relative",
                        border: "2px solid",
                        borderRadius: 2,
                        borderColor: "divider",
                        p: 2,
                        pt: 3,
                        mt: 2,
                      }}
                    >
                      {resumes.length > 0 ? (
                        <>
                          {/* Floating Label */}
                          <Typography
                            sx={{
                              position: "absolute",
                              top: -10,
                              left: 14,
                              px: 0.8,
                              fontSize: 13,
                              fontWeight: 500,
                              backgroundColor: "background.paper",
                            }}
                          >
                            {t('select_resume')}
                          </Typography>

                          {/* Scrollable Resume List */}
                          <Box
                            sx={{
                              maxHeight: 180,
                              overflowY: "auto",
                              pr: 1,
                              mb: 1.5,
                            }}
                          >
                            <RadioGroup
                              value={selectedResumeId}
                              onChange={(e) =>
                                setSelectedResumeId(e.target.value)
                              }
                            >
                              {resumes.map((r) => {
                                const selected =
                                  selectedResumeId === r.pk_id.toString();

                                return (
                                  <FormControlLabel
                                    key={r.pk_id}
                                    value={r.pk_id.toString()}
                                    control={
                                      <Radio size="small" sx={{ p: 0.5 }} />
                                    }
                                    sx={{
                                      mx: 0,
                                      mb: 0.6,
                                      px: 1,
                                      py: 0.6,
                                      borderRadius: 1.5,
                                      border: "1px solid",
                                      borderColor: selected
                                        ? "primary.main"
                                        : "divider",
                                      backgroundColor: selected
                                        ? "rgba(25,118,210,0.08)"
                                        : "transparent",
                                      "& .MuiFormControlLabel-label": {
                                        width: "100%",
                                      },
                                    }}
                                    label={
                                      <Box
                                        sx={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          width: "100%",
                                        }}
                                      >
                                        <Box sx={{ lineHeight: 1 }}>
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              fontWeight: 500,
                                              fontSize: 12,
                                            }}
                                          >
                                            {r.resume_file || t('text_resume')}
                                          </Typography>

                                          {r.is_primary && (
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                fontSize: 10,
                                                color: "primary.main",
                                                display: "block",
                                              }}
                                            >
                                              {t('primary')}
                                            </Typography>
                                          )}
                                        </Box>

                                        <Typography
                                          variant="caption"
                                          sx={{
                                            fontSize: 10,
                                            color: "text.secondary",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          {new Date(
                                            r.created_date,
                                          ).toLocaleDateString()}
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                );
                              })}
                            </RadioGroup>
                          </Box>
                        </>
                      ) : (
                        <Alert severity="warning" sx={{ mb: 2, fontSize: 13 }}>
                          {t('no_resume_found')}
                        </Alert>
                      )}

                      {/* Fixed Upload Button */}
                      <Button
                        component="label"
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{
                          borderRadius: 1.5,
                          textTransform: "none",
                          py: 0.7,
                        }}
                      >
                        {uploadLoading ? t('uploading') : t('choose_new_resume')}
                        <input
                          type="file"
                          hidden
                          accept=".pdf"
                          onChange={handleNewResumeUpload}
                          disabled={uploadLoading}
                        />
                      </Button>
                    </Box>

                    {/* Cover Letter */}
                    <Box
                      sx={{
                        position: "relative",
                        border: "2px solid",
                        borderColor: coverLetterToDelete
                          ? "error.light"
                          : "divider",
                        borderRadius: 2,
                        p: 2.5,
                        mt: 3,
                        transition: "all 0.2s",
                      }}
                    >
                      <Typography
                        sx={{
                          position: "absolute",
                          top: -12,
                          left: 16,
                          px: 1,
                          fontSize: 13,
                          fontWeight: 500,
                          bgcolor: "background.paper",
                          color: coverLetterToDelete
                            ? "error.main"
                            : "text.secondary",
                        }}
                      >
                        {t('cover_letter_optional')}
                      </Typography>

                      {/* Current cover letter display + remove button */}
                      {hasAppliedToThisJob && previousCoverLetterName && (
                        <Box sx={{ mb: 2 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {t('current_cover_letter')}:
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  color: coverLetterToDelete
                                    ? "error.main"
                                    : "primary.main",
                                  textDecoration: coverLetterToDelete
                                    ? "line-through"
                                    : "none",
                                  wordBreak: "break-all",
                                }}
                              >
                                {previousCoverLetterName}
                              </Typography>
                            </Box>

                            <Tooltip
                              title={
                                coverLetterToDelete
                                  ? t('undo_remove')
                                  : t('remove_cover_letter')
                              }
                            >
                              <IconButton
                                size="small"
                                color={
                                  coverLetterToDelete ? "success" : "error"
                                }
                                onClick={
                                  coverLetterToDelete
                                    ? handleUndoDeleteCoverLetter
                                    : handleStageDeleteCoverLetter
                                }
                              >
                                {coverLetterToDelete ? (
                                  <CheckCircle fontSize="small" />
                                ) : (
                                  <Cancel fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Stack>

                          {coverLetterToDelete && (
                            <Typography
                              variant="caption"
                              color="error"
                              sx={{ mt: 0.5, display: "block" }}
                            >
                              {t('marked_for_deletion')}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Upload button – now conditionally disabled */}
                      <Tooltip
                        title={
                          !canUploadNewCoverLetter &&
                          previousCoverLetterName &&
                          !coverLetterToDelete
                            ? t('remove_cover_letter_first')
                            : ""
                        }
                        arrow
                      >
                        <span>
                          <Button
                            component="label"
                            variant="outlined"
                            color={coverLetterToDelete ? "primary" : "primary"}
                            size="small"
                            fullWidth
                            startIcon={
                              coverLetterFile ? (
                                <PictureAsPdf />
                              ) : (
                                <UploadFile />
                              )
                            }
                            disabled={!canUploadNewCoverLetter}
                            sx={{
                              justifyContent: "flex-start",
                              textTransform: "none",
                              py: 1,
                              borderStyle: coverLetterToDelete
                                ? "dashed"
                                : "solid",
                            }}
                          >
                            {coverLetterFile
                              ? `${t('new_file_selected')}: ${coverLetterFile.name}`
                              : hasAppliedToThisJob &&
                                  previousCoverLetterName &&
                                  !coverLetterToDelete
                                ? t('upload_new_cover_letter')
                                : t('upload_cover_letter_optional')}
                            <input
                              type="file"
                              hidden
                              accept=".pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                  setSnackbar({
                                    open: true,
                                    message: t('file_too_large'),
                                    severity: "error",
                                  });
                                  return;
                                }
                                setCoverLetterFile(file);
                                if (coverLetterToDelete) {
                                  setCoverLetterToDelete(false);
                                }
                              }}
                            />
                          </Button>
                        </span>
                      </Tooltip>

                      {coverLetterFile && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: "block" }}
                        >
                          {(coverLetterFile.size / (1024 * 1024)).toFixed(2)} MB
                        </Typography>
                      )}
                    </Box>

                    {/* Image */}
                    <Box
                      sx={{
                        mt: 3,
                        p: 2,
                        border: "2px solid #ccc",
                        borderRadius: 2,
                        position: "relative",
                      }}
                    >
                      <Typography
                        sx={{
                          position: "absolute",
                          top: -10,
                          left: 14,
                          px: 0.8,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: "background.paper",
                        }}
                      >
                        {t('attached_images_optional')}
                      </Typography>

                      {/* Existing images (from DB) */}
                      {existingImages.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            {t('attached_images_count', { count: existingImages.length })}:
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ mt: 1, flexWrap: "wrap" }}
                          >
                            {existingImages.map((img) => {
                              const willBeDeleted = imagesToDelete.includes(
                                img.id,
                              );

                              return (
                                <Chip
                                  key={img.id}
                                  label={img.original_name || img.filename}
                                  size="small"
                                  onDelete={
                                    willBeDeleted
                                      ? () => handleUndoDeleteImage(img.id) // Undo
                                      : () => handleStageDeleteImage(img.id) // Stage delete
                                  }
                                  color={willBeDeleted ? "error" : "default"}
                                  variant={
                                    willBeDeleted ? "filled" : "outlined"
                                  }
                                  deleteIcon={
                                    willBeDeleted ? (
                                      <CheckCircle fontSize="small" />
                                    ) : undefined
                                  }
                                  sx={{
                                    maxWidth: 220,
                                    opacity: willBeDeleted ? 0.6 : 1,
                                    textDecoration: willBeDeleted
                                      ? "line-through"
                                      : "none",
                                    bgcolor: willBeDeleted
                                      ? "error.light"
                                      : undefined,
                                  }}
                                  icon={
                                    willBeDeleted ? (
                                      <Cancel fontSize="small" />
                                    ) : undefined
                                  }
                                />
                              );
                            })}
                          </Stack>
                          {imagesToDelete.length > 0 && (
                            <Typography
                              variant="caption"
                              color="error"
                              sx={{ mt: 1, display: "block" }}
                            >
                              {t('images_marked_for_removal', { count: imagesToDelete.length })}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* New selected files (not yet uploaded) */}
                      <Button
                        component="label"
                        variant="outlined"
                        fullWidth
                        startIcon={<UploadFile />}
                        sx={{
                          mb: imageFiles.length > 0 ? 1.5 : 0,
                          textTransform: "none",
                        }}
                      >
                        {t('add_more_images')}
                        <input
                          type="file"
                          hidden
                          accept="image/jpeg,image/png,application/pdf"
                          multiple
                          onChange={(e) => {
                            const newFiles = Array.from(e.target.files || []);
                            setImageFiles((prev) => [...prev, ...newFiles]);
                          }}
                        />
                      </Button>

                      {imageFiles.length > 0 && (
                        <Box>
                          <Typography variant="caption">
                            {t('new_files_to_upload', { count: imageFiles.length })}:
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ mt: 1, flexWrap: "wrap" }}
                          >
                            {imageFiles.map((f, i) => (
                              <Chip
                                key={i}
                                label={f.name}
                                size="small"
                                onDelete={() =>
                                  setImageFiles((prev) =>
                                    prev.filter((_, idx) => idx !== i),
                                  )
                                }
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                  </DialogContent>

                  {/* Footer */}
                  <DialogActions>
                    <Button
                      onClick={() => setApplyDialogOpen(false)}
                      size="small"
                      variant="outlined"
                      color="error"
                      sx={{
                        textTransform: "none",
                      }}
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleApplyWithResume}
                      disabled={applying[jobToApply?.pk_id]}
                      size="small"
                      sx={{
                        textTransform: "none",
                      }}
                    >
                      {applying[jobToApply?.pk_id]
                        ? t('submitting')
                        : hasAppliedToThisJob
                          ? t('update')
                          : t('apply')}
                    </Button>
                  </DialogActions>
                </Dialog>
              </Stack>

              <Divider sx={{ mt: 1 }} />

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
                    {t('posting_date')}:
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
                    {t('closing_date')}:
                  </Typography>
                  <Chip
                    label={
                      selectedJob.closing_date
                        ? new Date(selectedJob.closing_date).toLocaleDateString(
                            "en-CA",
                          ) // yyyy-mm-dd
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
                    {t('job_type')}:
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
                    {t('level')}:
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
                    {t('salary')}:
                  </Typography>
                  <Chip
                    label={
                      selectedJob.salary_range
                        ? `${selectedJob.salary_range}$`
                        : t('negotiable')
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
                      {t('categories')}:
                    </Typography>
                    {selectedJob.categories.map((cat) => (
                      <Chip
                        key={cat.pk_id}
                        label={cat.name}
                        size="small"
                        variant="outlined"
                        color="warning"
                        sx={(theme) => ({
                          fontSize: "0.70rem",
                          height: 18,
                          borderRadius: "8px",
                          borderColor: theme.palette.warning.light,
                          color: theme.palette.warning.dark,
                          bgcolor: theme.palette.warning.light + "22",
                          "& .MuiChip-label": {
                            fontWeight: 600,
                          },
                        })}
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
                    {t('location')}:
                  </Typography>
                  <Typography variant="subtitle2" color="">
                    {selectedJob.location}
                  </Typography>
                </Stack>
                {isCandidate && selectedJob.applications?.length > 0 && selectedJob.applications[0]?.application_status && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <HourglassEmpty color="action" fontSize="small" />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      minWidth={110}
                      color="text.secondary"
                    >
                      {t('status')}:
                    </Typography>
                    <Chip
                      label={selectedJob.applications[0]?.application_status}
                      size="small"
                      variant="outlined"
                      color="info"
                    />
                  </Stack>
                )}
              </Stack>
            </Box>

            <Divider />

            {/* Description */}
            <Box
              sx={{
                p: 2.5,
                "& .ql-editor *": { backgroundColor: "transparent !important" },
              }}
            >
              <Box mb={4}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <DescriptionOutlinedIcon color="action" fontSize="medium" />
                  <Typography variant="h7" fontWeight={700}>
                    {t('job_description')}
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
                <Typography variant="h7" fontWeight={700}>
                  {t('requirements')}
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
              {t('select_job_to_view')}
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
                  textTransform: "none",
                }}
              >
                {t('home')}
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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          height: "calc(100vh - 120px)",
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
                          const updated = categoryFilter.filter(
                            (v) => v !== id,
                          );
                          setCategoryFilter(
                            updated.length === 0 ? ["All"] : updated,
                          );
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
                <Tooltip title={t('clear_all_filters')} arrow placement="top">
                  <IconButton
                    sx={{
                      p: 0.5, // 🔥 shrink padding
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      bgcolor: "gray",
                      color: "#fff",
                      "&:hover": {
                        bgcolor: "gray",
                      },
                    }}
                    onClick={() => {
                      setSearchTerm("");
                      setTypeFilter("All");
                      setLevelFilter("All");
                      setCategoryFilter(["All"]);
                    }}
                  >
                    <Cancel />
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
              height: { xs: "100%" },
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

        <DateFilterPopover />
        {/* Sort Date Popover */}
        <Popover
          open={openDateSort}
          anchorEl={dateSortAnchor}
          onClose={() => setDateSortAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          PaperProps={{
            sx: {
              width: 240,
              borderRadius: 2,
              p: 2,
              boxShadow: 4,
              border: "3px solid",
              borderColor: "divider",
            },
          }}
        >
          <List dense disablePadding>
            {[
              { label: t('newest_first'), value: "date-desc" },
              { label: t('oldest_first'), value: "date-asc" },
            ].map((item) => (
              <ListItemButton
                key={item.value}
                selected={sortBy === item.value}
                onClick={() => {
                  setSortBy(item.value);
                  setDateSortAnchor(null);
                }}
                sx={{ borderRadius: 1 }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Popover>

        {/* Sort Title Popover */}
        <Popover
          open={openTitleSort}
          anchorEl={titleSortAnchor}
          onClose={() => setTitleSortAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          PaperProps={{
            sx: {
              width: 220,
              borderRadius: 2,
              p: 2,
              boxShadow: 4,
              border: "3px solid",
              borderColor: "divider",
            },
          }}
        >
          <List dense disablePadding>
            {[
              { label: t('a_to_z'), value: "title-asc" },
              { label: t('z_to_a'), value: "title-desc" },
            ].map((item) => (
              <ListItemButton
                key={item.value}
                selected={sortBy === item.value}
                onClick={() => {
                  setSortBy(item.value);
                  setTitleSortAnchor(null);
                }}
                sx={{ borderRadius: 1 }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Popover>
        {/* Snackbar for apply feedback */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}