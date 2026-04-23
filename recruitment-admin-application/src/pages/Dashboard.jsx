/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
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
  Close,
  ArrowDownwardOutlined,
  ArrowDownwardTwoTone,
  ArrowDownward,
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
  Paper,
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
import { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import ReactQuill from "react-quill-new";
import { useParams } from 'react-router-dom';
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import Draggable from "react-draggable";

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

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDateFilterDropdown, setShowDateFilterDropdown] = useState(false);
  const [showDateSortDropdown, setShowDateSortDropdown] = useState(false);
  const [showTitleSortDropdown, setShowTitleSortDropdown] = useState(false);

  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [dateSortAnchor, setDateSortAnchor] = useState(null);
  const [titleSortAnchor, setTitleSortAnchor] = useState(null);
  const [dateFilterAnchor, setDateFilterAnchor] = useState(null);

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
  const [setUploadError] = useState(null);
  const [hasAppliedToThisJob, setHasAppliedToThisJob] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

  const [coverLetterFile, setCoverLetterFile] = useState(null);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [previousCoverLetterName, setPreviousCoverLetterName] = useState(null);
  const [attachmentsToDelete, setAttachmentsToDelete] = useState([]);
  const [coverLetterToDelete, setCoverLetterToDelete] = useState(false);
  const [originalResumeId, setOriginalResumeId] = useState(null);
  const canUploadNewCoverLetter = !previousCoverLetterName || coverLetterToDelete;
  const [checkButtonApply, setCheckButtonApply] = useState(true);
  const [currentApplicationId, setCurrentApplicationId] = useState(null);

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

  const handleStageDeleteCoverLetter = () => {
    setCoverLetterToDelete(true);
    setCoverLetterFile(null);
  };

  const handleUndoDeleteCoverLetter = () => {
    setCoverLetterToDelete(false);
  };

  const handleStageDeleteAttachment = (attId) => {
    if (!attachmentsToDelete.includes(attId)) {
      setAttachmentsToDelete((prev) => [...prev, attId]);
    }
  };

  const handleUndoDeleteAttachment = (attId) => {
    setAttachmentsToDelete((prev) => prev.filter((id) => id !== attId));
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

  const loadApplicationAttachments = async (applicationId) => {
    if (!applicationId) {
      setExistingAttachments([]);
      return;
    }

    try {
      const res = await api.get(`/applications/${applicationId}/attachments`);
      setExistingAttachments(res.data || []);

    } catch (err) {
      console.error("Failed to load resume extras:", err);
      if (err.response?.status >= 500 || err.response?.status === 403) {
        setSnackbar({
          open: true,
          message: t('could_not_load_attachments'),
          severity: "warning",
        });
      }

      setExistingAttachments([]);
    }
  };

  const handleOpenApplyDialog = async () => {
    if (!selectedJob) return;
    setJobToApply(selectedJob);
    setApplyDialogOpen(true);
    setAttachmentsToDelete([]);
    setAttachmentFiles([]);
    setCoverLetterFile(null);
    setCoverLetterToDelete(false);
    setCurrentApplicationId(null);
    setExistingAttachments([]);
    setPreviousCoverLetterName(null);

    try {
      const res = await api.get(
        `/applications/job/${selectedJob.pk_id}/my-status`,
      );
      const data = res.data;

      let initialResumeId = null;

      if (data.applied && data.resume_id && data.application_id) {
        initialResumeId = String(data.resume_id);
        setOriginalResumeId(initialResumeId);
        setPreviousCoverLetterName(data.cover_letter_filename || null);
        setCurrentApplicationId(data.application_id);
        await loadApplicationAttachments(data.application_id);
      } else {
        const primary = resumes.find((r) => r.is_primary);
        if (primary) initialResumeId = String(primary.pk_id);
        setExistingAttachments([]);
        setPreviousCoverLetterName(null);
      }

      if (initialResumeId) {
        setSelectedResumeId(initialResumeId);
      }
    } catch (err) {
      const primary = resumes.find((r) => r.is_primary);
      if (primary) setSelectedResumeId(String(primary.pk_id));
      setExistingAttachments([]);
      setPreviousCoverLetterName(null);
    }
  };

  const handleApplyWithResume = async () => {
    if (!jobToApply || !selectedResumeId) return;

    try {
      setApplying((prev) => ({ ...prev, [jobToApply.pk_id]: true }));

      if (attachmentsToDelete.length > 0 && currentApplicationId) {
        await Promise.all(
          attachmentsToDelete.map((attId) =>
            api.delete(
              `/applications/${currentApplicationId}/attachments/${attId}`,
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

      attachmentFiles.forEach((file) => {
        formData.append("attachments", file);
      });

      await api.post("/applications/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const statusRes = await api.get(`/applications/job/${jobToApply.pk_id}/my-status`);
      const data = statusRes.data;

      setHasAppliedToThisJob(data.applied);

      if (data.applied && data.application_id && Number.isInteger(data.application_id)) {
        const newAppId = data.application_id;
        setCurrentApplicationId(newAppId);

        await loadApplicationAttachments(newAppId);

      }else {
        setCurrentApplicationId(null);
        setExistingAttachments([]);
      }

      setCoverLetterFile(null);
      setCoverLetterToDelete(false);
      setAttachmentsToDelete([]);
      setAttachmentFiles([]);

      setSnackbar({
        open: true,
        message: hasAppliedToThisJob ? t('application_updated') : t('application_submitted'),
        severity: "success",
      });

      setApplyDialogOpen(false);
      setAppliedJobIds((prev) => new Set([...prev, jobToApply.pk_id]));
    } catch (err) {
      console.error("Apply failed:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || t('application_failed'),
        severity: "error",
      });
    } finally {
      setApplying((prev) => ({ ...prev, [jobToApply.pk_id]: false }));
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

  const ListContent = () => {
    const getPostedInfo = (postingDate) => {
      if (!postingDate) return { date: "—", daysAgo: null };
      
      const formattedDate = new Date(postingDate).toISOString().split("T")[0];
      const today = dayjs().startOf("day");
      const posted = dayjs(postingDate).startOf("day");
      const diffDays = today.diff(posted, "day");
      
      let daysAgoText = "";
      if (diffDays === 0) daysAgoText = t('Today');
      else if (diffDays === 1) daysAgoText = t('Yesterday');
      else if (diffDays < 7) daysAgoText = t('Days_ago', { count: diffDays });
      else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        daysAgoText = weeks === 1 ? t('Week_ago') : t('Weeks_ago', { count: weeks });
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        daysAgoText = months === 1 ? t('Month_ago') : t('Months_ago', { count: months });
      } else {
        const years = Math.floor(diffDays / 365);
        daysAgoText = years === 1 ? t('Year_ago') : t('Years_ago', { count: years });
      }
      
      return { date: formattedDate, daysAgo: daysAgoText };
    };
    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, rgba(30, 58, 138, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          boxShadow: "0 8px 32px rgba(30, 58, 138, 0.15)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          p={1}
          justifyContent="space-between"
          alignItems="center"
          sx={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(239, 246, 255, 0.9) 100%)",
            borderBottom: "1px solid rgba(59, 130, 246, 0.15)",
          }}
        >
          {/* Search Field - unchanged */}
          <TextField
            size="small"
            placeholder={t("search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            InputProps={{
              sx: {
                fontSize: 13,
                height: 38,
                borderRadius: 2.5,
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                "& fieldset": {
                  borderColor: "rgba(59, 130, 246, 0.2)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(59, 130, 246, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#3b82f6",
                },
              },
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: "#3b82f6" }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm("")}
                    sx={{ p: 0.25 }}
                  >
                    <Cancel sx={{ fontSize: 18, color: "#f97316" }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Filter Button */}
          <Tooltip title={t("filters_sorting")} arrow placement="bottom">
            <IconButton
              size="small"
              onClick={() => setFilterDialogOpen(true)}
              sx={{
                p: 1,
                width: 38,
                height: 38,
                borderRadius: 2.5,
                background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 0%, #f97316 90%)",
                color: "#fff",
                boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
                "&:hover": {
                  background: "linear-gradient(135deg, #1e40af 0%, #2563eb 0%, #ea580c 90%)",
                  transform: "scale(1.05)",
                  boxShadow: "0 6px 20px rgba(249, 115, 22, 0.4)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* MAIN FILTERS & SORTING DIALOG WITH DROPDOWNS */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <Dialog
            open={filterDialogOpen}
            onClose={(event, reason) => {
              if (reason === "backdropClick") return;
              setFilterDialogOpen(false);
              setShowCategoryDropdown(false);
              setShowTypeDropdown(false);
              setShowDateFilterDropdown(false);
              setShowDateSortDropdown(false);
              setShowTitleSortDropdown(false);
            }}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 4,
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(239, 246, 255, 0.85) 100%)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                boxShadow: "0 25px 50px -12px rgba(30, 58, 138, 0.3)",
                overflow: "hidden",
                maxHeight: "80vh",
              },
            }}
          >
            <DialogTitle
              sx={{
                background: "linear-gradient(135deg, rgba(30, 58, 138, 0.12) 0%, rgba(249, 115, 22, 0.08) 100%)",
                borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
                py: 2,
                px: 3,
                mb: 1,
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{
                    background: "#1e3a8a",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t('filter_sort_jobs')}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setFilterDialogOpen(false)}
                  sx={{
                    color: "#f97316",
                    "&:hover": {
                      bgcolor: "rgba(249, 115, 22, 0.1)",
                    },
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Stack>
            </DialogTitle>

            <DialogContent sx={{ p: 3, overflowY: "auto" }}>
              {/* FILTERS SECTION */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  sx={{
                    color: "#1e3a8a",
                    mb: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <CategoryRoundedIcon fontSize="small" sx={{ color: "#3b82f6" }} />
                  {t('filters')}
                </Typography>

                <Stack spacing={1}>
                  {/* CATEGORIES FILTER */}
                  <Box>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      sx={{
                        justifyContent: "flex-start",
                        py: 1.2,
                        px: 2,
                        borderRadius: 2,
                        textTransform: "none",
                        color: "#1e3a8a",
                        borderColor: "rgba(59, 130, 246, 0.3)",
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(239, 246, 255, 0.5) 100%)",
                        backdropFilter: "blur(8px)",
                        "&:hover": {
                          borderColor: "#3b82f6",
                          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)",
                        },
                      }}
                      startIcon={<CategoryRoundedIcon sx={{ color: "#3b82f6" }}/>}
                      endIcon={
                        <Stack direction="row" spacing={1} alignItems="center">
                          {!categoryFilter.includes("All") && categoryFilter.length > 0 && (
                            <Chip
                              size="small"
                              label={categoryFilter.length}
                              sx={{
                                background: "linear-gradient(135deg, #3b82f6 0%, #f97316 100%)",
                                color: "#fff",
                                height: 20,
                                fontSize: "0.7rem",
                              }}
                            />
                          )}
                          <ArrowDownward
                            sx={{
                              fontSize: 18,
                              color: "#f97316",
                              transform: showCategoryDropdown ? "rotate(180deg)" : "none",
                              transition: "transform 0.2s",
                            }}
                          />
                        </Stack>
                      }
                    >
                      <Box sx={{ flex: 1, textAlign: "left" }}>{t('categories')}</Box>
                    </Button>
                    
                    {/* Categories Dropdown List */}
                    {showCategoryDropdown && (
                      <Paper
                        elevation={0}
                        sx={{
                          mt: 1,
                          maxHeight: 250,
                          overflowY: "auto",
                          borderRadius: 2,
                          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(239, 246, 255, 0.75) 100%)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(59, 130, 246, 0.2)",
                        }}
                      >
                        <List dense disablePadding>
                          <ListItemButton
                            selected={categoryFilter.includes("All")}
                            onClick={() => setCategoryFilter(["All"])}
                            sx={{ 
                              borderRadius: 1, 
                              py: 1,
                              "&.Mui-selected": {
                                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(249, 115, 22, 0.08) 100%)",
                                "&:hover": {
                                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(249, 115, 22, 0.12) 100%)",
                                },
                              },
                            }}
                          >
                            <Checkbox
                              size="small"
                              checked={categoryFilter.includes("All")}
                              icon={<CheckBoxOutlineBlank fontSize="small" />}
                              checkedIcon={<CheckBox fontSize="small" sx={{ color: "#3b82f6" }}/>}
                            />
                            <ListItemText primary={t("all")} />
                          </ListItemButton>
                          {categories.map((cat) => {
                            const checked = categoryFilter.includes(cat.pk_id);
                            return (
                              <ListItemButton
                                key={cat.pk_id}
                                selected={checked}
                                sx={{ 
                                  borderRadius: 1, 
                                  py: 1,
                                  "&.Mui-selected": {
                                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(249, 115, 22, 0.08) 100%)",
                                  }, 
                                }}
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
                                  checkedIcon={<CheckBox fontSize="small" sx={{ color: "#3b82f6" }}/>}
                                />
                                <ListItemText primary={cat.name} />
                              </ListItemButton>
                            );
                          })}
                        </List>
                      </Paper>
                    )}
                  </Box>

                  {/* JOB TYPE FILTER */}
                  <Box>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                      sx={{
                        justifyContent: "flex-start",
                        py: 1.2,
                        px: 2,
                        borderRadius: 2,
                        textTransform: "none",
                        color: "#1e3a8a",
                        borderColor: "rgba(59, 130, 246, 0.3)",
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(239, 246, 255, 0.5) 100%)",
                        backdropFilter: "blur(8px)",
                        "&:hover": {
                          borderColor: "#3b82f6",
                          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)",
                        },
                      }}
                      startIcon={<WorkOutlineIcon sx={{ color: "#3b82f6" }}/>}
                      endIcon={
                        <Stack direction="row" spacing={1} alignItems="center">
                          {Array.isArray(typeFilter) && typeFilter.length > 0 && !typeFilter.includes("All") && (
                            <Chip
                              size="small"
                              label={typeFilter.length}
                              sx={{
                                background: "linear-gradient(135deg, #3b82f6 0%, #f97316 100%)",
                                color: "#fff",
                                height: 20,
                                fontSize: "0.7rem",
                              }}
                            />
                          )}
                          <ArrowDownward
                            sx={{
                              fontSize: 18,
                              color: "#f97316",
                              transform: showTypeDropdown ? "rotate(180deg)" : "none",
                              transition: "transform 0.2s",
                            }}
                          />
                        </Stack>
                      }
                    >
                      <Box sx={{ flex: 1, textAlign: "left" }}>
                        {Array.isArray(typeFilter) && typeFilter.includes("All") 
                          ? t('job_type')
                          : Array.isArray(typeFilter) && typeFilter.length > 0
                            ? typeFilter.map(type => {
                                if (type === "Full-time") return t('full_time');
                                if (type === "Part-time") return t('part_time');
                                if (type === "Internship") return t('internship');
                                return type;
                              }).join(", ")
                            : t('job_type')}
                      </Box>
                    </Button>
                    
                    {/* Job Type Dropdown List */}
                    {showTypeDropdown && (
                      <Paper
                        elevation={0}
                        sx={{
                          mt: 1,
                          maxHeight: 250,
                          overflowY: "auto",
                          borderRadius: 2,
                          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(239, 246, 255, 0.75) 100%)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(59, 130, 246, 0.2)",
                        }}
                      >
                        <List dense disablePadding>
                          <ListItemButton
                            selected={Array.isArray(typeFilter) ? typeFilter.includes("All") : typeFilter === "All"}
                            sx={{ 
                              borderRadius: 1,
                              py: 1,
                              "&.Mui-selected": {
                                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(249, 115, 22, 0.08) 100%)",
                              }, 
                            }}
                            onClick={() => setTypeFilter(["All"])}
                          >
                            <Checkbox 
                              checked={Array.isArray(typeFilter) ? typeFilter.includes("All") : typeFilter === "All"} 
                              size="small" 
                              sx={{ "&.Mui-checked": { color: "#3b82f6" } }}
                            />
                            <ListItemText primary={t("all")} />
                          </ListItemButton>
                          
                          <ListItemButton
                            selected={Array.isArray(typeFilter) && typeFilter.includes("Full-time")}
                            sx={{ 
                              borderRadius: 1, 
                              py: 1,
                              "&.Mui-selected": {
                                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(249, 115, 22, 0.08) 100%)",
                              }, 
                            }}
                            onClick={() => {
                              let currentFilter = Array.isArray(typeFilter) ? [...typeFilter] : [typeFilter];
                              let updated = currentFilter.filter(v => v !== "All");
                              
                              if (updated.includes("Full-time")) {
                                updated = updated.filter(v => v !== "Full-time");
                              } else {
                                updated.push("Full-time");
                              }
                              setTypeFilter(updated.length === 0 ? ["All"] : updated);
                            }}
                          >
                            <Checkbox 
                              checked={Array.isArray(typeFilter) && typeFilter.includes("Full-time")} 
                              size="small" 
                              sx={{ "&.Mui-checked": { color: "#3b82f6" } }}
                            />
                            <ListItemText primary={t("full_time")} />
                          </ListItemButton>
                          
                          <ListItemButton
                            selected={Array.isArray(typeFilter) && typeFilter.includes("Part-time")}
                            sx={{ 
                              borderRadius: 1, 
                              py: 1,
                              "&.Mui-selected": {
                                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(249, 115, 22, 0.08) 100%)",
                              }, 
                            }}
                            onClick={() => {
                              let currentFilter = Array.isArray(typeFilter) ? [...typeFilter] : [typeFilter];
                              let updated = currentFilter.filter(v => v !== "All");
                              
                              if (updated.includes("Part-time")) {
                                updated = updated.filter(v => v !== "Part-time");
                              } else {
                                updated.push("Part-time");
                              }
                              setTypeFilter(updated.length === 0 ? ["All"] : updated);
                            }}
                          >
                            <Checkbox 
                              checked={Array.isArray(typeFilter) && typeFilter.includes("Part-time")} 
                              size="small" 
                              sx={{ "&.Mui-checked": { color: "#3b82f6" } }}
                            />
                            <ListItemText primary={t("part_time")} />
                          </ListItemButton>
                          
                          <ListItemButton
                            selected={Array.isArray(typeFilter) && typeFilter.includes("Internship")}
                            sx={{ 
                              borderRadius: 1, 
                              py: 1,
                              "&.Mui-selected": {
                                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(249, 115, 22, 0.08) 100%)",
                              }, 
                            }}
                            onClick={() => {
                              let currentFilter = Array.isArray(typeFilter) ? [...typeFilter] : [typeFilter];
                              let updated = currentFilter.filter(v => v !== "All");
                              
                              if (updated.includes("Internship")) {
                                updated = updated.filter(v => v !== "Internship");
                              } else {
                                updated.push("Internship");
                              }
                              setTypeFilter(updated.length === 0 ? ["All"] : updated);
                            }}
                          >
                            <Checkbox 
                              checked={Array.isArray(typeFilter) && typeFilter.includes("Internship")} 
                              size="small" 
                              sx={{ "&.Mui-checked": { color: "#3b82f6" } }}
                            />
                            <ListItemText primary={t("internship")} />
                          </ListItemButton>
                        </List>
                      </Paper>
                    )}
                  </Box>

                  {/* POSTED DATE FILTER */}
                  <Box>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setShowDateFilterDropdown(!showDateFilterDropdown)}
                      sx={{
                        justifyContent: "flex-start",
                        py: 1.2,
                        px: 2,
                        borderRadius: 2,
                        textTransform: "none",
                        color: "#1e3a8a",
                        borderColor: "rgba(59, 130, 246, 0.3)",
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(239, 246, 255, 0.5) 100%)",
                        backdropFilter: "blur(8px)",
                        "&:hover": {
                          borderColor: "#3b82f6",
                          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)",
                        },
                      }}
                      startIcon={<EventIcon sx={{ color: "#3b82f6" }}/>}
                      endIcon={
                        <Stack direction="row" spacing={1} alignItems="center">
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
                                height: 20,
                                fontSize: "0.7rem",
                                borderColor: "#f97316",
                                color: "#f97316",
                              }}
                            />
                          )}
                          <ArrowDownward
                            sx={{
                              fontSize: 18,
                              color: "#f97316",
                              transform: showDateFilterDropdown ? "rotate(180deg)" : "none",
                              transition: "transform 0.2s",
                            }}
                          />
                        </Stack>
                      }
                    >
                      <Box sx={{ flex: 1, textAlign: "left" }}>{t('posted_date')}</Box>
                    </Button>
                    
                    {/* Date Filter Dropdown */}
                    {showDateFilterDropdown && (
                      <Paper
                        elevation={0}
                        sx={{
                          mt: 1,
                          p: 2,
                          borderRadius: 2,
                          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(239, 246, 255, 0.75) 100%)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(59, 130, 246, 0.2)",
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
                          <FormControlLabel value="all" control={<Radio size="small" sx={{ color: "#3b82f6", "&.Mui-checked": { color: "#3b82f6" } }}/>} label={t('all_dates')} />
                          <FormControlLabel value="today" control={<Radio size="small" sx={{ color: "#3b82f6", "&.Mui-checked": { color: "#3b82f6" } }}/>} label={t('today')} />
                          <FormControlLabel value="last7" control={<Radio size="small" sx={{ color: "#3b82f6", "&.Mui-checked": { color: "#3b82f6" } }}/>} label={t('last_7_days')} />
                          <FormControlLabel value="custom" control={<Radio size="small" sx={{ color: "#3b82f6", "&.Mui-checked": { color: "#3b82f6" } }}/>} label={t('custom_range')} />
                        </RadioGroup>

                        {dateFilterMode === "custom" && (
                          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                            <DatePicker
                              label={t('from')}
                              value={dateFrom}
                              onChange={(newValue) => setDateFrom(newValue)}
                              format="YYYY-MM-DD"
                              slotProps={{ 
                                textField: { 
                                  size: "small", 
                                  fullWidth: true,
                                  sx: {
                                    "& .MuiOutlinedInput-root": {
                                      "&.Mui-focused fieldset": {
                                        borderColor: "#3b82f6",
                                      },
                                    },
                                  }, 
                                } 
                              }}
                              maxDate={dateTo || dayjs()}
                            />
                            <DatePicker
                              label={t('to')}
                              value={dateTo}
                              onChange={(newValue) => setDateTo(newValue)}
                              format="YYYY-MM-DD"
                              slotProps={{ 
                                textField: { 
                                  size: "small", 
                                  fullWidth: true,
                                  sx: {
                                    "& .MuiOutlinedInput-root": {
                                      "&.Mui-focused fieldset": {
                                        borderColor: "#3b82f6",
                                      },
                                    },
                                  },
                                }  
                              }}
                              minDate={dateFrom}
                              maxDate={dayjs()}
                            />
                          </Box>
                        )}
                        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => {
                              setDateFilterMode("all");
                              setDateFrom(null);
                              setDateTo(null);
                            }}
                            sx={{ textTransform: "none", fontSize: "0.75rem" }}
                          >
                            {t('clear')}
                          </Button>
                        </Box>
                      </Paper>
                    )}
                  </Box>
                </Stack>
              </Box>

              <Divider sx={{ my: 2, borderColor: "rgba(59, 130, 246, 0.15)" }} />

              {/* SORT SECTION */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  sx={{
                    color: "#1e3a8a",
                    mb: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <AutorenewRoundedIcon fontSize="small" />
                  {t('sort_by')}
                </Typography>

                <Stack spacing={1}>
                  {/* SORT BY DATE */}
                  <Box>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setShowDateSortDropdown(!showDateSortDropdown)}
                      sx={{
                        justifyContent: "flex-start",
                        py: 1.2,
                        px: 2,
                        borderRadius: 2,
                        textTransform: "none",
                        color: "#1e3a8a",
                        borderColor: "rgba(59, 130, 246, 0.3)",
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(239, 246, 255, 0.5) 100%)",
                        backdropFilter: "blur(8px)",
                        "&:hover": {
                          borderColor: "#3b82f6",
                          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)",
                        },
                      }}
                      startIcon={<EventIcon sx={{ color: "#3b82f6" }}/>}
                      endIcon={
                        <Stack direction="row" spacing={1} alignItems="center">
                          {sortBy.startsWith("date-") && (
                            <Chip
                              size="small"
                              label={sortBy === "date-desc" ? t('newest') : t('oldest')}
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                borderColor: "#f97316",
                                color: "#f97316",
                              }}
                            />
                          )}
                          <ArrowDownward
                            sx={{
                              fontSize: 18,
                              color: "#f97316",
                              transform: showDateSortDropdown ? "rotate(180deg)" : "none",
                              transition: "transform 0.2s",
                            }}
                          />
                        </Stack>
                      }
                    >
                      <Box sx={{ flex: 1, textAlign: "left" }}>{t('date_posted')}</Box>
                    </Button>
                    
                    {/* Date Sort Dropdown */}
                    {showDateSortDropdown && (
                      <Paper
                        elevation={0}
                        sx={{
                          mt: 1,
                          borderRadius: 2,
                          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(239, 246, 255, 0.75) 100%)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(59, 130, 246, 0.2)",
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
                                setShowDateSortDropdown(false);
                              }}
                              sx={{ 
                                borderRadius: 1,
                                py: 1.5,
                                "&.Mui-selected": {
                                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(249, 115, 22, 0.08) 100%)",
                                }, 
                              }}
                            >
                              <ListItemText primary={item.label} />
                              {sortBy === item.value && (
                                <CheckCircle sx={{ fontSize: 18, color: "#3b82f6" }} />
                              )}
                            </ListItemButton>
                          ))}
                        </List>
                      </Paper>
                    )}
                  </Box>

                  {/* SORT BY TITLE */}
                  <Box>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setShowTitleSortDropdown(!showTitleSortDropdown)}
                      sx={{
                        justifyContent: "flex-start",
                        py: 1.2,
                        px: 2,
                        borderRadius: 2,
                        textTransform: "none",
                        color: "#1e3a8a",
                        borderColor: "rgba(59, 130, 246, 0.3)",
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(239, 246, 255, 0.5) 100%)",
                        backdropFilter: "blur(8px)",
                        "&:hover": {
                          borderColor: "#3b82f6",
                          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)",
                        },
                      }}
                      startIcon={<BadgeIcon sx={{ color: "#3b82f6" }} />}
                      endIcon={
                        <Stack direction="row" spacing={1} alignItems="center">
                          {sortBy.startsWith("title-") && (
                            <Chip
                              size="small"
                              label={sortBy === "title-asc" ? t('a_to_z') : t('z_to_a')}
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                borderColor: "#f97316",
                                color: "#f97316",
                              }}
                            />
                          )}
                          <ArrowDownward
                            sx={{
                              fontSize: 18,
                              color: "#f97316",
                              transform: showTitleSortDropdown ? "rotate(180deg)" : "none",
                              transition: "transform 0.2s",
                            }}
                          />
                        </Stack>
                      }
                    >
                      <Box sx={{ flex: 1, textAlign: "left" }}>{t('job_title')}</Box>
                    </Button>
                    
                    {/* Title Sort Dropdown */}
                    {showTitleSortDropdown && (
                      <Paper
                        elevation={0}
                        sx={{
                          mt: 1,
                          borderRadius: 2,
                          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(239, 246, 255, 0.75) 100%)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(59, 130, 246, 0.2)",
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
                                setShowTitleSortDropdown(false);
                              }}
                              sx={{ 
                                borderRadius: 1, 
                                py: 1.5,
                                "&.Mui-selected": {
                                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(249, 115, 22, 0.08) 100%)",
                                }, 
                              }}
                            >
                              <ListItemText primary={item.label} />
                              {sortBy === item.value && (
                                <CheckCircle sx={{ fontSize: 18, color: "#3b82f6" }} />
                              )}
                            </ListItemButton>
                          ))}
                        </List>
                      </Paper>
                    )}
                  </Box>
                </Stack>
              </Box>
            </DialogContent>

            <DialogActions
              sx={{
                pt: 0,
                gap: 1,
                borderTop: "1px solid rgba(59, 130, 246, 0.15)",
              }}
            >
              <Button
                variant="outlined"
                color="error"
                size="medium"
                startIcon={<Cancel />}
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("All");
                  setLevelFilter("All");
                  setCategoryFilter(["All"]);
                  setDateFilterMode("all");
                  setDateFrom(null);
                  setDateTo(null);
                  setSortBy("date-desc");
                  setShowCategoryDropdown(false);
                  setShowTypeDropdown(false);
                  setShowDateFilterDropdown(false);
                  setShowDateSortDropdown(false);
                  setShowTitleSortDropdown(false);
                }}
                sx={{
                  mt: 1,
                  textTransform: "none",
                  borderRadius: 2,
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                  "&:hover": {
                    borderColor: "#ef4444",
                    bgcolor: "rgba(239, 68, 68, 0.05)",
                  },
                }}
              >
                {t('reset_all')}
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setFilterDialogOpen(false);
                  setShowCategoryDropdown(false);
                  setShowTypeDropdown(false);
                  setShowDateFilterDropdown(false);
                  setShowDateSortDropdown(false);
                  setShowTitleSortDropdown(false);
                }}
                sx={{
                  mt: 1,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  background: "#1e3a8a",
                  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                  "&:hover": {
                    background: "#1e3a8a",
                    boxShadow: "0 6px 20px rgba(249, 115, 22, 0.4)",
                  },
                }}
              >
                {t('done')}
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>

        <Divider sx={{ borderColor: "rgba(59, 130, 246, 0.15)" }} />

        {/* Job List - exactly the same as before */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
            background: "linear-gradient(135deg, rgba(250, 250, 250, 0.6) 0%, rgba(239, 246, 255, 0.4) 100%)",
          }}
        >
          {/* ... rest of the job list code remains unchanged ... */}
          {filteredJobs.length === 0 ? (
            <Box
              sx={{
                p: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "text.secondary",
              }}
            >
              <Box
                component="img"
                src="/No-Data.gif"
                alt={t("no_data")}
                sx={{ maxWidth: 180, opacity: 0.7 }}
              />
            </Box>
          ) : (
            <>
              {filteredJobs.map((job) => {
                const active = selectedJob?.pk_id === job.pk_id;
                const companyName = job.employer?.company_name;
                const logoFilename = job.employer?.company_logo;
                const alreadyApplied = isCandidate && appliedJobIds.has(job.pk_id);
                const postedInfo = getPostedInfo(job.posting_date);
                return (
                  <Box
                    key={job.pk_id}
                    onClick={() => handleSelectJob(job)}
                    sx={{
                      px: 2,
                      py: { xs: 1, sm: 1.15 },
                      cursor: "pointer",
                      position: "relative",
                      backgroundColor: active
                        ? "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(249, 115, 22, 0.08) 100%)"
                        : "transparent",
                      borderLeft: active
                        ? "4px solid"
                        : "4px solid transparent",
                      borderImage: active
                        ? "linear-gradient(180deg, #3b82f6 0%, #f97316 100%) 1"
                        : "none",
                      borderBottom: "1px solid rgba(59, 130, 246, 0.1)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        background: active
                          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(249, 115, 22, 0.12) 100%)"
                          : "linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(239, 246, 255, 0.5) 100%)",
                        transform: "translateY(2px)",
                      },
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
                          border: "2px solid",
                          borderColor: "rgba(59, 130, 246, 0.3)",
                          boxShadow: "0 2px 8px rgba(30, 58, 138, 0.15)",
                          "& img": { objectFit: "contain" },
                        }}
                      >
                        {companyName?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box minWidth={0} flex={1}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          width="100%"
                        >
                          <Typography
                            variant="body1"
                            fontWeight={600}
                            noWrap
                            sx={{
                              fontSize: "0.95rem",
                              lineHeight: 1.3,
                              color: active ? "#1e3a8a" : "text.primary",
                            }}
                          >
                            {job.job_title}
                          </Typography>
                          {alreadyApplied && (
                            <Chip
                              label={t("applied")}
                              size="small"
                              color="success"
                              variant="filled"
                              icon={<CheckCircle />}
                              sx={{
                                fontSize: "0.60rem",
                                fontWeight: 600,
                                height: 24,
                                ml: 1,
                                bgcolor: "rgba(16, 185, 129, 0.15)",
                                color: "#10b981",
                                border: "1px solid #10b981",
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
                              sx={{
                                fontSize: 16,
                                color: "#3b82f6",
                                mr: 0.5,
                              }}
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
                                  fontSize: "0.68rem",
                                  height: 20,
                                  borderRadius: "6px",
                                  borderColor: "#3b82f6",
                                  color: "#1e3a8a",
                                  bgcolor: "rgba(59, 130, 246, 0.08)",
                                }}
                              />
                            ))}
                            {job.categories.length > 2 && (
                              <Chip
                                label={`+${job.categories.length - 2}`}
                                size="small"
                                sx={{
                                  fontSize: "0.68rem",
                                  height: 20,
                                  bgcolor: "rgba(249, 115, 22, 0.1)",
                                  color: "#f97316",
                                }}
                              />
                            )}
                          </Stack>
                        )}
                        <Stack direction="row" spacing={0.3} mt={0.5} alignItems="center" justifyContent="space-between" flexWrap="wrap">
                          <Chip
                            icon={<EventIcon sx={{ color: "#3b82f6" }}/>}
                            label={`${t("posted")}: ${postedInfo.date}`}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{
                              fontSize: "0.72rem",
                              height: 22,
                              borderColor: "rgba(59, 130, 246, 0.2)",
                              color: "#1e3a8a",
                            }}
                          />
                          {/* Days Count Chip - New addition */}
                          {postedInfo.daysAgo && (
                            <Tooltip title={postedInfo.date} arrow placement="top">
                              <Chip
                                label={postedInfo.daysAgo}
                                size="small"
                                sx={{
                                  fontSize: "0.68rem",
                                  height: 22,
                                  fontWeight: 500,
                                  background: "linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)",
                                  color: "#f97316",
                                  border: "1px solid rgba(249, 115, 22, 0.3)",
                                  cursor: "help",
                                  "& .MuiChip-label": {
                                    px: 1,
                                  },
                                }}
                              />
                            </Tooltip>
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
              {hasMore && (
                <Box sx={{ p: 2, textAlign: "end" }}>
                  <Tooltip title={t("show_more")} arrow>
                    <IconButton
                      size="small"
                      onClick={() => loadJobs(true)}
                      disabled={loadingMore}
                      sx={{
                        border: "2px solid",
                        borderColor: "#3b82f6",
                        color: "#3b82f6",
                        "&:hover": {
                          bgcolor: "rgba(59, 130, 246, 0.1)",
                          borderColor: "#f97316",
                          color: "#f97316",
                        },
                      }}
                    >
                      {loadingMore ? (
                        <CircularProgress size={18} sx={{ color: "#3b82f6" }}/>
                      ) : (
                        <ArrowDownward />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              {!hasMore && filteredJobs.length > 0 && (
                <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
                  <Typography variant="body2" sx={{ color: "#1e3a8a" }}>{t("no_more_jobs")}</Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </Card>
    );
  };

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
          background: "linear-gradient(135deg, rgba(30, 58, 138, 0.06) 0%, rgba(249, 115, 22, 0.04) 100%)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          boxShadow: "0 8px 32px rgba(30, 58, 138, 0.12)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* Mobile top bar */}
        {isMobile && (
          <AppBar 
            position="sticky" 
            color="default" 
            elevation={0}
            sx={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(239, 246, 255, 0.85) 100%)",
              backdropFilter: "blur(10px)",
              borderBottom: "1px solid rgba(59, 130, 246, 0.15)",
            }}
          >
            <Toolbar variant="dense" />
          </AppBar>
        )}

        {selectedJob ? (
          <Box sx={{ flex: 1, overflowY: "auto", pb: { xs: 10, sm: 4 } }}>
            {/* Hero section – like screenshot */}
            <Box 
              sx={{ 
                p: 3, 
                pb: 2.5, 
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(239, 246, 255, 0.9) 100%)",
                borderBottom: "1px solid rgba(59, 130, 246, 0.12)" 
              }}
            >
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
                      width: { xs: 56, sm: 62 },
                      height: { xs: 56, sm: 62 },
                      border: "3px solid",
                      borderColor: "rgba(59, 130, 246, 0.3)",
                      boxShadow: "0 4px 12px rgba(30, 58, 138, 0.15)",
                      "& img": { objectFit: "contain" },
                    }}
                  >
                    {companyName?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Stack direction="column" spacing={0.8} flex={1}>
                    <Typography 
                      variant="h6" 
                      fontWeight={700} 
                      lineHeight={1.3}
                      sx={{ 
                        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #f97316 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {selectedJob.job_title}
                    </Typography>
                    <Chip
                      icon={<BusinessRoundedIcon sx={{ fontSize: 18, color: "#3b82f6" }} />}
                      label={`${t('company')}: ${companyName}`}
                      size="small"
                      sx={{
                        height: 26,
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(249, 115, 22, 0.08) 100%)",
                        color: "#1e3a8a",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        alignSelf: "flex-start",
                      }}
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
                      display: {  xs: "none", md: "inline-flex"},
                      px: 3,
                      py: 1,
                      borderRadius: 2.5,
                      textTransform: "none",
                      fontWeight: 600,
                      background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 0%, #f97316 105%)",
                      boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #1e40af 0%, #2563eb 0%, #ea580c 105%)",
                        boxShadow: "0 6px 20px rgba(249, 115, 22, 0.4)",
                      },
                    }}
                  >
                    {hasAppliedToThisJob ? t('reapply') : t('apply_now')}
                  </Button>
                )}
                {/* Mobile buttons */}
                <Stack spacing={1}>
                  {isMobile && isCandidate && !checkButtonApply && (
                    <Tooltip title={hasAppliedToThisJob ? t('reapply') : t('apply')} arrow>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={handleOpenApplyDialog}
                        sx={{
                          minWidth: 42,
                          height: 42,
                          borderRadius: 2.5,
                          background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 0%, #f97316 105%)",
                          boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
                          "&:hover": {
                            background: "linear-gradient(135deg, #1e40af 0%, #2563eb 0%, #ea580c 105%)",
                          },
                        }}
                      >
                        <Send fontSize="small" />
                      </Button>
                    </Tooltip>
                  )}

                  {/* Desktop */}
                  <Tooltip title={t('company_information')} arrow>
                    <Button
                      variant="outlined"
                      onClick={() => setCompanyDialogOpen(true)}
                      size="small"
                      color="info"
                      sx={{
                        minWidth: 42,
                        height: 42,
                        borderRadius: 2.5,
                        borderColor: "rgba(59, 130, 246, 0.4)",
                        color: "#3b82f6",
                        "&:hover": {
                          borderColor: "#f97316",
                          color: "#f97316",
                          backgroundColor: "rgba(249, 115, 22, 0.08)",
                        },
                      }}
                    >
                      <InfoOutlinedIcon />
                    </Button>
                  </Tooltip>
                </Stack>
                

                {/* COMPANY INFORMATION DIALOG - Glassmorphism Style */}

                <Dialog
                  open={companyDialogOpen}
                  onClose={(env, reason) => {
                    if (reason !== "backdropClick")
                    setCompanyDialogOpen(false)
                  }}
                  maxWidth="md"
                  fullWidth
                  PaperProps={{
                    sx: {
                      borderRadius: 4,
                      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(239, 246, 255, 0.85) 100%)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(59, 130, 246, 0.25)",
                      boxShadow: "0 25px 50px -12px rgba(30, 58, 138, 0.3)",
                      overflow: "hidden",
                      maxHeight: "85vh",
                    },
                  }}
                  PaperComponent={DraggablePaper}
                >
                  <DialogTitle
                    id="draggable-dialog-title"
                    sx={{
                      background: "linear-gradient(135deg, rgba(30, 58, 138, 0.12) 0%, rgba(249, 115, 22, 0.08) 100%)",
                      borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
                      py: 2,
                      px: 3,
                      cursor: "move",
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar
                          src={
                            logoFilename
                              ? `${baseURL}/uploads/employers/${logoFilename}`
                              : undefined
                          }
                          alt={`${companyName} logo`}
                          sx={{
                            width: 48,
                            height: 48,
                            border: "2px solid",
                            borderColor: "rgba(59, 130, 246, 0.3)",
                            "& img": { objectFit: "contain" },
                          }}
                        >
                          {companyName?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{
                            background: "#1e3a8a",
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          {t('company_information')}
                        </Typography>
                      </Stack>
                      <IconButton
                        size="small"
                        onClick={() => setCompanyDialogOpen(false)}
                        sx={{
                          color: "#f97316",
                          "&:hover": {
                            bgcolor: "rgba(249, 115, 22, 0.1)",
                          },
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Stack>
                  </DialogTitle>

                  <DialogContent sx={{ p: 3, overflowY: "auto", mt: 1 }}>
                    <Stack spacing={3}>
                      {/* Company Name */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(239, 246, 255, 0.5) 100%)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(59, 130, 246, 0.15)",
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ bgcolor: "rgba(59, 130, 246, 0.15)", width: 40, height: 40 }}>
                            <BadgeIcon sx={{ color: "#3b82f6" }} />
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="text.secondary"
                            >
                              {t('company_name')}:
                            </Typography>
                            <Typography variant="body1" fontWeight={500} sx={{ color: "#1e3a8a", mt: 0.5 }}>
                              {selectedJob.employer?.company_name || "—"}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>

                      {/* Address */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(239, 246, 255, 0.5) 100%)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(59, 130, 246, 0.15)",
                        }}
                      >
                        <Stack direction="row" alignItems="flex-start" spacing={2}>
                          <Avatar sx={{ bgcolor: "rgba(249, 115, 22, 0.12)", width: 40, height: 40 }}>
                            <LocationCity sx={{ color: "#f97316" }} />
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="text.secondary"
                            >
                              {t('address')}:
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5, color: "#1e3a8a" }}>
                              {selectedJob.employer?.company_address || "—"}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>

                      {/* Email */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(239, 246, 255, 0.5) 100%)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(59, 130, 246, 0.15)",
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ bgcolor: "rgba(59, 130, 246, 0.12)", width: 40, height: 40 }}>
                            <EmailOutlined sx={{ color: "#3b82f6" }} />
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="text.secondary"
                            >
                              {t('email')}:
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5, color: "#3b82f6" }}>
                              {selectedJob.employer?.company_email || "—"}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>

                      {/* Contact */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(239, 246, 255, 0.5) 100%)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(59, 130, 246, 0.15)",
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ bgcolor: "rgba(249, 115, 22, 0.12)", width: 40, height: 40 }}>
                            <PhoneOutlined sx={{ color: "#f97316" }} />
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="text.secondary"
                            >
                              {t('contact')}:
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5, color: "#1e3a8a" }}>
                              {selectedJob.employer?.company_contact || "—"}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>

                      {/* Website */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(239, 246, 255, 0.5) 100%)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(59, 130, 246, 0.15)",
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ bgcolor: "rgba(59, 130, 246, 0.12)", width: 40, height: 40 }}>
                            <LanguageOutlined sx={{ color: "#3b82f6" }} />
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="text.secondary"
                            >
                              {t('website')}:
                            </Typography>
                            {selectedJob.employer?.company_website ? (
                              <Button
                                component="a"
                                href={selectedJob.employer.company_website}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  mt: 0.5,
                                  textTransform: "none",
                                  color: "#3b82f6",
                                  p: 0,
                                  minWidth: 0,
                                  fontWeight: 500,
                                  "&:hover": {
                                    bgcolor: "transparent",
                                    color: "#f97316",
                                    textDecoration: "underline",
                                  },
                                }}
                              >
                                {selectedJob.employer.company_website}
                              </Button>
                            ) : (
                              <Typography variant="body1" sx={{ mt: 0.5, color: "#1e3a8a" }}>—</Typography>
                            )}
                          </Box>
                        </Stack>
                      </Paper>

                      {/* About Company */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(239, 246, 255, 0.5) 100%)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(59, 130, 246, 0.15)",
                        }}
                      >
                        <Stack direction="row" alignItems="flex-start" spacing={2}>
                          <Avatar sx={{ bgcolor: "rgba(249, 115, 22, 0.12)", width: 40, height: 40 }}>
                            <Info sx={{ color: "#f97316" }} />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="text.secondary"
                              mb={1.5}
                            >
                              {t('about_company')}:
                            </Typography>
                            <Box
                              sx={{
                                "& .ql-editor": {
                                  padding: 0,
                                  fontSize: "0.95rem",
                                  color: "#1e3a8a",
                                },
                                "& .ql-container": {
                                  border: "none",
                                },
                              }}
                            >
                              <ReactQuill
                                theme="snow"
                                value={selectedJob.employer?.company_description || ""}
                                readOnly
                                modules={{ toolbar: false }}
                              />
                            </Box>
                          </Box>
                        </Stack>
                      </Paper>
                    </Stack>
                  </DialogContent>

                  <DialogActions
                    sx={{
                      pt: 1,
                      borderTop: "1px solid rgba(59, 130, 246, 0.15)",
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={() => setCompanyDialogOpen(false)}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 2,
                        background: "#1e3a8a",
                        boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                        "&:hover": {
                          background: "#1e3a8a",
                          boxShadow: "0 6px 20px rgba(249, 115, 22, 0.4)",
                        },
                      }}
                    >
                      {t('close')}
                    </Button>
                  </DialogActions>
                </Dialog>
                {/* Apply Dialog with Resume Selection */}
                <Dialog
                  open={applyDialogOpen && isCandidate}
                  onClose={(event, reason) => {
                    if (reason === "backdropClick" || reason === "escapeKeyDown") return;
                    setApplyDialogOpen(false);
                  }}
                  fullScreen={isMobile}
                  fullWidth
                  maxWidth="md"
                  PaperProps={{
                    sx: {
                      maxHeight: "95vh",
                      borderRadius: 3,
                      overflow: "hidden",
                      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(239, 246, 255, 0.9) 100%)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(59, 130, 246, 0.25)",
                      boxShadow: "0 25px 50px -12px rgba(30, 58, 138, 0.3)",
                    },
                  }}
                  PaperComponent={DraggablePaper}
                >
                  {/* Header */}
                  <DialogTitle
                    id="draggable-dialog-title"
                    sx={{
                      borderBottom: "2px solid",
                      borderImage: "linear-gradient(90deg, #3b82f6 0%, #f97316 50%, #3b82f6 100%) 1",
                      py: 2,
                      px: 3,
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: "move",
                      background: "linear-gradient(135deg, rgba(30, 58, 138, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)",
                    }}
                  >
                    {hasAppliedToThisJob
                      ? t('update_application')
                      : t('apply_to_position')}
                    {/* icon close dialog */}
                  </DialogTitle>
                  <IconButton
                    aria-label="close"
                    size="small"
                    onClick={() => setApplyDialogOpen(false)}
                    sx={{
                      position: "absolute",
                      right: 8,
                      top: 10,
                      color: "#f97316",
                      "&:hover": {
                        bgcolor: "rgba(249, 115, 22, 0.1)",
                      },
                    }}
                  >
                    <Cancel />
                  </IconButton>

                  <DialogContent sx={{ mt: 0.5, px: 3, pb: 2 }}>
                    {hasAppliedToThisJob && originalResumeId && (
                      <>
                        {selectedResumeId !== originalResumeId ? (
                          <Alert
                            severity="info"
                            sx={{
                              borderRadius: 2,
                              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)",
                              border: "1px solid rgba(59, 130, 246, 0.2)",
                              color: "#1e3a8a",
                              "& .MuiAlert-icon": { color: "#3b82f6" },
                            }}
                          >
                            {t('changed_resume_notice')}
                          </Alert>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{ 
                              display: "block", 
                              mb: 1, 
                              color: "#1e3a8a",
                              fontStyle: "italic",
                            }}
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
                        borderImage: "linear-gradient(135deg, #3b82f6 0%, #f97316 100%) 1",
                        borderRadius: 2,
                        p: 2.5,
                        pt: 3,
                        mt: 2,
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(239, 246, 255, 0.4) 100%)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      {resumes.length > 0 ? (
                        <>
                          {/* Floating Label */}
                          <Typography
                            sx={{
                              position: "absolute",
                              top: -12,
                              left: 16,
                              px: 1.5,
                              fontSize: 13,
                              fontWeight: 600,
                              background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                              backgroundClip: "text",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              bgcolor: "background.paper",
                              borderRadius: 1,
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
                                      <Radio 
                                        size="small" 
                                        sx={{ 
                                          p: 0.5,
                                          color: "#3b82f6",
                                          "&.Mui-checked": { color: "#f97316" },
                                        }} 
                                      />
                                    }
                                    sx={{
                                      mx: 0,
                                      mb: 0.8,
                                      px: 1.5,
                                      py: 0.8,
                                      borderRadius: 2,
                                      border: "1px solid",
                                      borderColor: selected
                                        ? "#f97316"
                                        : "rgba(59, 130, 246, 0.2)",
                                      background: selected
                                        ? "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(249, 115, 22, 0.08) 100%)"
                                        : "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(239, 246, 255, 0.4) 100%)",
                                      "&:hover": {
                                        borderColor: "#f97316",
                                        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)",
                                      },
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
                                        <Box sx={{ lineHeight: 1, gap: 0.5, display: "flex" }}>
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              fontWeight: 500,
                                              fontSize: 12,
                                              color: selected ? "#1e3a8a" : "text.primary",
                                            }}
                                          >
                                            {r.resume_file || t('text_resume')}
                                          </Typography>

                                          {r.is_primary && (
                                            <Chip
                                              label={t('primary')}
                                              size="small"
                                              sx={{
                                                fontSize: 9,
                                                height: 16,
                                                mt: 0.3,
                                                background: "linear-gradient(135deg, #3b82f6 0%, #f97316 100%)",
                                                color: "#fff",
                                              }}
                                            />
                                          )}
                                        </Box>

                                        <Typography
                                          variant="caption"
                                          sx={{
                                            fontSize: 10,
                                            color: "#f97316",
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
                        <Alert 
                          severity="warning" 
                          sx={{ 
                            mb: 2, 
                            fontSize: 13,
                            borderRadius: 2,
                            background: "linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)",
                            border: "1px solid rgba(249, 115, 22, 0.2)",
                            color: "#ea580c",
                            "& .MuiAlert-icon": { color: "#f97316" },
                          }}
                        >
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
                          borderRadius: 2,
                          textTransform: "none",
                          py: 0.8,
                          fontWeight: 500,
                          color: "#1e3a8a",
                          borderColor: "rgba(59, 130, 246, 0.3)",
                          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(239, 246, 255, 0.5) 100%)",
                          "&:hover": {
                            borderColor: "#f97316",
                            color: "#f97316",
                            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)",
                          },
                        }}
                      >
                        {uploadLoading ? (
                          <CircularProgress size={16} sx={{ color: "#3b82f6", mr: 1 }} />
                        ) : (
                          <UploadFile sx={{ fontSize: 16, mr: 1, color: "#3b82f6" }} />
                        )}
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
                        borderImage: coverLetterToDelete
                          ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%) 1"
                          : "linear-gradient(135deg, #3b82f6 0%, #f97316 100%) 1",
                        borderRadius: 2,
                        p: 2.5,
                        mt: 3,
                        transition: "all 0.2s",
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(239, 246, 255, 0.4) 100%)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <Typography
                        sx={{
                          position: "absolute",
                          top: -12,
                          left: 16,
                          px: 1.5,
                          fontSize: 13,
                          fontWeight: 600,
                          bgcolor: "background.paper",
                          borderRadius: 1,
                          color: coverLetterToDelete ? "#ef4444" : "#1e3a8a",
                          background: coverLetterToDelete
                            ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                            : "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
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
                                  color: coverLetterToDelete ? "#ef4444" : "#3b82f6",
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
                                sx={{
                                  "&:hover": {
                                    bgcolor: coverLetterToDelete
                                      ? "rgba(16, 185, 129, 0.1)"
                                      : "rgba(239, 68, 68, 0.1)",
                                  },
                                }}
                              >
                                {coverLetterToDelete ? (
                                  <CheckCircle fontSize="small" sx={{ color: "#10b981" }}/>
                                ) : (
                                  <Cancel fontSize="small" sx={{ color: "#ef4444" }}/>
                                )}
                              </IconButton>
                            </Tooltip>
                          </Stack>

                          {coverLetterToDelete && (
                            <Typography
                              variant="caption"
                              color="error"
                              sx={{ mt: 0.5, display: "block", color: "#ef4444" }}
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
                            size="small"
                            fullWidth
                            startIcon={
                              coverLetterFile ? (
                                <PictureAsPdf sx={{ color: "#ef4444" }}/>
                              ) : (
                                <UploadFile sx={{ color: "#3b82f6" }}/>
                              )
                            }
                            disabled={!canUploadNewCoverLetter}
                            sx={{
                              justifyContent: "flex-start",
                              textTransform: "none",
                              py: 1,
                              borderRadius: 2,
                              borderStyle: coverLetterToDelete ? "dashed" : "solid",
                              color: coverLetterFile ? "#ef4444" : "#1e3a8a",
                              borderColor: coverLetterFile
                                ? "rgba(239, 68, 68, 0.3)"
                                : "rgba(59, 130, 246, 0.3)",
                              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(239, 246, 255, 0.4) 100%)",
                              "&:hover": {
                                borderColor: coverLetterFile ? "#ef4444" : "#f97316",
                                background: coverLetterFile
                                  ? "rgba(239, 68, 68, 0.05)"
                                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)",
                              },
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
                          sx={{ mt: 1, display: "block", color: "#1e3a8a" }}
                        >
                          {(coverLetterFile.size / (1024 * 1024)).toFixed(2)} MB
                        </Typography>
                      )}
                    </Box>

                    {/* Image */}
                    <Box
                      sx={{
                        mt: 3,
                        p: 2.5,
                        borderImage: "linear-gradient(135deg, #3b82f6 0%, #f97316 100%) 1",
                        borderRadius: 2,
                        position: "relative",
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(239, 246, 255, 0.4) 100%)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <Typography
                        sx={{
                          position: "absolute",
                          top: -12,
                          left: 16,
                          px: 1.5,
                          fontSize: 13,
                          fontWeight: 600,
                          background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          bgcolor: "background.paper",
                          borderRadius: 1,
                        }}
                      >
                        {t('attached_files_optional')}
                      </Typography>

                      {/* Existing images (from DB) */}
                      {existingAttachments.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            {t('attached_files_count')}: {existingAttachments.length}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ mt: 1, flexWrap: "wrap" }}
                          >
                            {existingAttachments.map((att) => {
                              const willBeDeleted = attachmentsToDelete.includes(att.id);

                              return (
                                <Chip
                                  key={att.id}
                                  label={att.original_name || att.filename}
                                  size="small"
                                  onDelete={
                                    willBeDeleted
                                      ? () => handleUndoDeleteAttachment(att.id) // Undo
                                      : () => handleStageDeleteAttachment(att.id) // Stage delete
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
                                      ? "rgba(239, 68, 68, 0.1)"
                                      : undefined,
                                    borderColor: willBeDeleted
                                      ? "#ef4444"
                                      : "#3b82f6",
                                    color: willBeDeleted ? "#ef4444" : "#1e3a8a",
                                  }}
                                  icon={
                                    willBeDeleted ? (
                                      <Cancel fontSize="small" sx={{ color: "#ef4444" }} />
                                    ) : undefined
                                  }
                                />
                              );
                            })}
                          </Stack>
                          {attachmentsToDelete.length > 0 && (
                            <Typography
                              variant="caption"
                              color="error"
                              sx={{ mt: 1, display: "block", color: "#ef4444" }}
                            >
                              {t('files_marked_for_removal', { count: attachmentsToDelete.length })}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* New selected files (not yet uploaded) */}
                      <Button
                        component="label"
                        variant="outlined"
                        fullWidth
                        startIcon={<UploadFile sx={{ color: "#3b82f6" }}/>}
                        sx={{
                          mb: attachmentFiles.length > 0 ? 1.5 : 0,
                          textTransform: "none",
                          borderRadius: 2,
                          color: "#1e3a8a",
                          borderColor: "rgba(59, 130, 246, 0.3)",
                          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(239, 246, 255, 0.4) 100%)",
                          "&:hover": {
                            borderColor: "#f97316",
                            color: "#f97316",
                            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)",
                          },
                        }}
                      >
                        {t('add_more_files')}
                        <input
                          type="file"
                          hidden
                          accept="image/jpeg,image/png,application/pdf"
                          multiple
                          onChange={(e) => {
                            const newFiles = Array.from(e.target.files || []);
                            setAttachmentFiles((prev) => [...prev, ...newFiles]);
                          }}
                        />
                      </Button>

                      {attachmentFiles.length > 0 && (
                        <Box>
                          <Typography variant="caption" sx={{ color: "#1e3a8a" }}> 
                            {t('new_files_selected')}: {attachmentFiles.length}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ mt: 1, flexWrap: "wrap" }}
                          >
                            {attachmentFiles.map((f, i) => (
                              <Chip
                                key={i}
                                label={f.name}
                                size="small"
                                onDelete={() =>
                                  setAttachmentFiles((prev) => prev.filter((_, idx) => idx !== i))
                                }
                                variant="outlined"
                                sx={{
                                  bgcolor: "rgba(59, 130, 246, 0.1)",
                                  borderColor: "#3b82f6",
                                  color: "#1e3a8a",
                                  "& .MuiChip-deleteIcon": {
                                    color: "#f97316",
                                    "&:hover": { color: "#ea580c" },
                                  },
                                }}  
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                  </DialogContent>

                  {/* Footer */}
                  <DialogActions
                    sx={{
                      borderTop: "2px solid",
                      borderImage: "linear-gradient(90deg, #3b82f6 0%, #f97316 50%, #3b82f6 100%) 1",
                      px: 3,
                      py: 2,
                      background: "linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(249, 115, 22, 0.03) 100%)",
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => setApplyDialogOpen(false)}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        px: 3,
                        color: "#1e3a8a",
                        borderColor: "rgba(59, 130, 246, 0.3)",
                        "&:hover": {
                          borderColor: "#f97316",
                          color: "#f97316",
                          bgcolor: "rgba(249, 115, 22, 0.05)",
                        },
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
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 4,
                        background: "#1e3a8a",
                        boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                        "&:hover": {
                          background: "#1e3a8a",
                          boxShadow: "0 6px 20px rgba(249, 115, 22, 0.4)",
                        },
                        "&:disabled": {
                          background: "linear-gradient(135deg, #9ca3af 0%, #a1a1aa 100%)",
                        },
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

              <Divider sx={{ mt: 2, borderColor: "rgba(59, 130, 246, 0.15)" }} />

              {/* Quick info chips / rows */}
              
              <Stack spacing={1.2} sx={{ mt: 3 }}>
                {[
                  { icon: <EventIcon sx={{ color: "#3b82f6" }}/>, label: t('posting_date'), value: selectedJob.posting_date ? new Date(selectedJob.posting_date).toISOString().split("T")[0] : "—" },
                  { icon: <EventIcon sx={{ color: "#f97316" }}/>, label: t('closing_date'), value: selectedJob.closing_date ? new Date(selectedJob.closing_date).toLocaleDateString("en-CA") : "—" },
                  { icon: <WorkOutlineIcon sx={{ color: "#3b82f6" }}/>, label: t('job_type'), value: selectedJob.job_type || "—" },
                  { icon: <TrendingUpIcon sx={{ color: "#f97316" }}/>, label: t('level'), value: selectedJob.level || "—" },
                  { icon: <PaymentsIcon sx={{ color: "#3b82f6" }}/>, label: t('salary'), value: selectedJob.salary_range ? `${selectedJob.salary_range}$` : t('negotiable') },
                ].map((item, idx) => (
                  <Stack key={idx} direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ color: "text.secondary", minWidth: 24 }}>{item.icon}</Box>
                    <Typography variant="body2" fontWeight={600} minWidth={110} color="text.secondary">
                      {item.label}:
                    </Typography>
                    <Chip
                      label={item.value}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: "0.78rem",
                        borderColor: "rgba(59, 130, 246, 0.2)",
                        color: "#1e3a8a",
                        backgroundColor: "rgba(255, 255, 255, 0.7)",
                      }}
                    />
                  </Stack>
                ))}

                {/* Location */}
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <LocationOnIcon sx={{ color: "#f97316" }} fontSize="small" />
                  <Typography variant="body2" fontWeight={600} minWidth={110} color="text.secondary">
                    {t('location')}:
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: "#1e3a8a" }}>{selectedJob.location}</Typography>
                </Stack>

                {/* Categories */}
                {selectedJob.categories?.length > 0 && (
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <CategoryRoundedIcon sx={{ color: "#3b82f6", mt: 0.3 }} fontSize="small" />
                    <Typography variant="body2" fontWeight={600} minWidth={110} color="text.secondary" sx={{ mt: 0.3 }}>
                      {t('categories')}:
                    </Typography>
                    <Stack direction="row" spacing={0.6} flexWrap="wrap">
                      {selectedJob.categories.map((cat) => (
                        <Chip
                          key={cat.pk_id}
                          label={cat.name}
                          size="small"
                          sx={{
                            fontSize: "0.73rem",
                            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(249, 115, 22, 0.06) 100%)",
                            color: "#1e3a8a",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                          }}
                        />
                      ))}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Box>

            <Divider sx={{ borderColor: "rgba(59, 130, 246, 0.12)" }}/>

            {/* Job Description & Requirements */}
            <Box
              sx={{
                p: 3,
                "& .ql-editor *": { backgroundColor: "transparent !important" },
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                    <Avatar sx={{ bgcolor: "rgba(59, 130, 246, 0.12)", width: 32, height: 32 }}>
                      <DescriptionOutlinedIcon sx={{ color: "#3b82f6", fontSize: 18 }} />
                    </Avatar>
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
                      {t('job_description')}
                    </Typography>
                  </Stack>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(239, 246, 255, 0.5) 100%)",
                      border: "1px solid rgba(59, 130, 246, 0.12)",
                      borderRadius: 2,
                      "& .ql-editor": {
                        backgroundColor: "transparent !important",
                        padding: 0,
                        color: "#1e3a8a",
                      },
                      "& .ql-container": {
                        border: "none",
                      },
                    }}
                  >
                    <ReactQuill
                      theme="snow"
                      value={selectedJob.job_description || ""}
                      readOnly
                      modules={{ toolbar: false }}
                    />
                  </Paper>
                </Box>
                {/* Requirements */}
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                    <Avatar sx={{ bgcolor: "rgba(249, 115, 22, 0.12)", width: 32, height: 32 }}>
                      <ChecklistOutlinedIcon sx={{ color: "#f97316", fontSize: 18 }} />
                    </Avatar>
                    <Typography 
                      variant="h6" 
                      fontWeight={700} 
                      sx={{
                        background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {t('requirements')}
                    </Typography>
                  </Stack>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(239, 246, 255, 0.5) 100%)",
                      border: "1px solid rgba(249, 115, 22, 0.12)",
                      borderRadius: 2,
                      "& .ql-editor": {
                        backgroundColor: "transparent !important",
                        padding: 0,
                        color: "#1e3a8a",
                      },
                      "& .ql-container": {
                        border: "none",
                      },
                    }}
                  >
                    <ReactQuill
                      theme="snow"
                      value={selectedJob.experience_required || ""}
                      readOnly
                      modules={{ toolbar: false }}
                    />
                  </Paper>
                </Box>
              </Stack>
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
              color: "text.secondary",
            }}
          >
            <Typography variant="body1" sx={{ color: "#1e3a8a" }}>{t('select_job_to_view')}</Typography>
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
              p: 1.5,
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(239, 246, 255, 0.9) 100%)",
              backdropFilter: "blur(12px)",
              borderTop: "1px solid rgba(59, 130, 246, 0.15)",
              zIndex: 10,
            }}
          >
            <Button
              variant="outlined"
              size="small"
              onClick={handleBackToList}
              startIcon={<Home sx={{ color: "#3b82f6" }}/>}
              fullWidth
              sx={{
                borderRadius: 2.5,
                textTransform: "none",
                py: 1,
                borderColor: "rgba(59, 130, 246, 0.3)",
                color: "#1e3a8a",
                "&:hover": {
                  borderColor: "#f97316",
                  color: "#f97316",
                  bgcolor: "rgba(249, 115, 22, 0.08)",
                },
              }}
            >
              {t('home')}
            </Button>
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