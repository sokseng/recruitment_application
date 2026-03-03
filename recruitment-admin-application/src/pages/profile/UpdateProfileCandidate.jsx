import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  EmailOutlined,
  FileDownload as FileDownloadIcon,
  LocationOnOutlined,
  MoreVert as MoreVertIcon,
  PhotoCamera,
  Star as StarIcon
} from '@mui/icons-material'
import UploadIcon from "@mui/icons-material/Upload"
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  SpeedDial,
  SpeedDialAction,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import { styled } from '@mui/material/styles'
import "quill/dist/quill.snow.css"
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactQuill from "react-quill-new"
import api from '../../services/api'
import useAuthStore from '../../store/useAuthStore'
import DeleteProfileDialog from "./dialog/DeleteProfileDialog"
import ViewProfileDialog from './dialog/ViewProfileDialog'

export default function CandidateProfileDashboard() {
  const { t } = useTranslation();
  const { user_data, setUserData } = useAuthStore()
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [openDeleteProfile, setOpenDeleteProfile] = useState(false);

  // ----- States -----
  const [cvFile, setCvFile] = useState([])
  const [uploadedCvs, setUploadedCvs] = useState([])
  const [cvToDelete, setCvToDelete] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState('error')
  const [editOpen, setEditOpen] = useState(false)
  const [anchorEls, setAnchorEls] = useState({});
  const [activeSection, setActiveSection] = useState(t('overview'));
  const [sectionOpen, setSectionOpen] = useState(false);
  const [overviewText, setOverviewText] = useState('');
  const [careerText, setCareerText] = useState('');
  const [workExpText, setWorkExpText] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [educationText, setEducationText] = useState('');
  const [languagesText, setLanguagesText] = useState('');
  const [referencesText, setReferencesText] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  const [openProfile, setOpenProfile] = useState(false);

  const handleOpenSection = (section) => {
    setActiveSection(section);
    setSectionOpen(true);
  };

  const handleCloseSection = () => {
    setSectionOpen(false);
  };

  const setAnchorEl = (cvId, el) => {
    setAnchorEls((prev) => ({ ...prev, [cvId]: el }));
  };

  // ----- CV Handlers -----
  const handleCvChange = (e) => {
    const files = Array.from(e.target.files)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    const validFiles = files.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        setMessage(t('file_not_allowed', { filename: file.name }))
        setSeverity('error')
        setOpenSnackbar(true)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage(t('file_exceeds_limit', { filename: file.name }))
        setSeverity('error')
        setOpenSnackbar(true)
        return false
      }
      return true
    })

    setCvFile((prev) => [...prev, ...validFiles])
  }

  // Upload a single staged file
  const handleUploadSingle = async (fileIndex) => {
    const file = cvFile[fileIndex]
    if (!file) return

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('resume_type', 'Upload')
      formData.append('resume_content', '')
      formData.append('recommendation_letter', '')
      formData.append('is_primary', false)
      formData.append('resume_file', file)

      const { data } = await api.post('/candidate/resumes/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setUploadedCvs((prev) => [...prev, data])
      setMessage(t('cv_upload_success'))
      setSeverity('success')

      // Remove the uploaded file from staged list
      setCvFile((prev) => prev.filter((_, i) => i !== fileIndex))
    } catch (err) {
      setMessage(err.response?.data?.detail || t('upload_failed'))
      setSeverity('error')
    } finally {
      setOpenSnackbar(true)
      setLoading(false)
    }
  }

  // Delete CV
  const handleDeleteCv = async (cvId) => {
    if (!cvId) return

    try {
      await api.delete(`/candidate/resumes/${cvId}`)
      setUploadedCvs((prev) => prev.filter((cv) => cv.pk_id !== cvId))
      setMessage(t('cv_delete_success'))
      setSeverity('success')
    } catch (err) {
      setMessage(err.response?.data?.detail || t('cv_delete_failed'))
      setSeverity('error')
    } finally {
      setOpenSnackbar(true)
    }
  }

  const confirmDelete = async () => {
    if (!cvToDelete) return
    await handleDeleteCv(cvToDelete)
    setConfirmOpen(false)
    setCvToDelete(null)
  }

  const downloadFile = async (resumeId, fileName) => {
    try {
      const response = await api.get(`/candidate/resumes/${resumeId}/file`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(t('download_failed'));
      setSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const setDefaultCv = async (cvId) => {
    try {
      setLoading(true)

      await api.post(`/candidate/resumes/${cvId}/set-primary`)

      setUploadedCvs((prev) =>
        prev.map((cv) => ({
          ...cv,
          is_primary: cv.pk_id === cvId,
        }))
      )

      setMessage(t('default_cv_updated'))
      setSeverity('success')
    } catch (err) {
      setMessage(err.response?.data?.detail || t('default_cv_failed'))
      setSeverity('error')
    } finally {
      setOpenSnackbar(true)
      setLoading(false)
    }
  }

  const showSnackbar = (msg, severityType = 'success') => {
    setMessage(msg)
    setSeverity(severityType)
    setOpenSnackbar(true)
  }

  useEffect(() => {
    const fetchCvs = async () => {
      try {
        const { data } = await api.get('/candidate/resumes/')
        setUploadedCvs(data || [])
      } catch (err) {
        console.error('Failed to fetch CVs')
      }
    };

    const fetchData = async () => {
      try {
        const [categoriesRes, candidatesRes] = await Promise.all([
          api.get("/categories/"),
          api.get("/candidate/me")
        ]);

        setJobCategories(categoriesRes.data);
        const candidate = Array.isArray(candidatesRes.data) ? candidatesRes.data[0] : candidatesRes.data;

        // Ensure profile_image is null, not "null" string
        if (candidate?.user?.profile_image === 'null' || candidate?.user?.profile_image === 'undefined') {
          candidate.user.profile_image = null;
        }

        // merge candidate profile into form
        setUserData({
          ...user_data,
          user_data: {
            ...user_data.user_data,
            ...candidate.user,
            experience_level: candidate?.profile?.experience_level || "",
            min_monthly_salary: candidate?.profile?.expected_salary || "",
            jobCategoryId: candidate?.profile?.job_category_id || "",
          },
        });

        setCandidates(candidate);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };

    fetchData();
    fetchCvs()
  }, [])

  useEffect(() => {
    if (sectionOpen && candidates?.profile) {
      setOverviewText(candidates.profile.about_me || null);
      setCareerText(candidates.profile.career_objective || null);
      setWorkExpText(candidates.profile.experience || null);
      setEducationText(candidates.profile.education || null);
      setSkillsText(candidates.profile.skills || null);
      setLanguagesText(candidates.profile.languages || null);
      setReferencesText(candidates.profile.reference_text || null);
    }
  }, [sectionOpen, candidates]);

  const handleSaveSection = async () => {
    try {
      const payload = {
        candidate_id: candidates.pk_id,
        about_me: overviewText || null,
        career_objective: careerText || null,
        experience: workExpText || null,
        education: educationText || null,
        skills: skillsText || null,
        languages: languagesText || null,
        reference_text: referencesText || null,
      };

      const { data } = await api.post("/candidate/profile", payload);

      setCandidates((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          about_me: data.about_me,
          career_objective: data.career_objective,
          experience: data.experience,
          education: data.education,
          skills: data.skills,
          languages: data.languages,
          reference_text: data.reference_text,
        },
      }));

      showSnackbar(t('section_saved', { section: activeSection }), "success");
      handleCloseSection();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || t('section_save_failed', { section: activeSection });
      showSnackbar(errorMsg, "error");
    }
  };

  const profile = candidates?.profile;

  const summaryFields = {
    [t('gender')]: user_data.user_data?.gender,
    [t('date_of_birth')]: user_data.user_data?.date_of_birth,
    [t('phone')]: user_data.user_data?.phone,
    [t('status')]: user_data.user_data?.is_active ? t('open_to_work') : t('not_open_to_work'),
    [t('experience_level')]: profile?.experience_level,
    [t('expected_salary')]: profile?.expected_salary,
    [t('job_category')]: jobCategories.find(cat => cat.pk_id === profile?.job_category_id)?.name || null,
  }

  const sectionDialogs = {
    [t('overview')]: () => (
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          {t('describe_yourself')} <span style={{ color: 'red' }}>*</span>
        </Typography>
        <Typography variant="body2" mb={1}>
          {t('describe_yourself_hint')}
        </Typography>
        <ReactQuill
          theme="snow"
          value={overviewText}
          onChange={setOverviewText}
          className="quill-editor"
        />

        <Typography variant="subtitle1" fontWeight={600}>
          {t('career_objectives')}
        </Typography>
        <Typography variant="body2" mb={1}>
          {t('career_objectives_hint')}
        </Typography>
        <ReactQuill
          theme="snow"
          value={careerText}
          onChange={setCareerText}
          className="quill-editor"
        />
      </Box>
    ),

    [t('work_experiences')]: () => (
      <Box>
        <Typography variant="body2" mb={1}>
          {t('work_experiences_hint')}
        </Typography>
        <ReactQuill
          theme="snow"
          value={workExpText}
          onChange={setWorkExpText}
          className="quill-editor"
        />
      </Box>
    ),

    [t('education_qualifications')]: () => (
      <Box>
        <Typography variant="body2" mb={1}>
          {t('education_hint')}
        </Typography>
        <ReactQuill
          theme="snow"
          value={educationText}
          onChange={setEducationText}
          className="quill-editor"
        />
      </Box>
    ),

    [t('skills')]: () => (
      <Box>
        <Typography variant="body2" mb={1}>
          {t('skills_hint')}
        </Typography>
        <ReactQuill
          theme="snow"
          value={skillsText}
          onChange={setSkillsText}
          className="quill-editor"
        />
      </Box>
    ),

    [t('languages')]: () => (
      <Box>
        <Typography variant="body2" mb={1}>
          {t('languages_hint')}
        </Typography>
        <ReactQuill
          theme="snow"
          value={languagesText}
          onChange={setLanguagesText}
          className="quill-editor"
        />
      </Box>
    ),

    [t('references')]: () => (
      <Box>
        <Typography variant="body2" mb={1}>
          {t('references_hint')}
        </Typography>
        <ReactQuill
          theme="snow"
          value={referencesText}
          onChange={setReferencesText}
          className="quill-editor"
        />
      </Box>
    ),
  };

  const sections = [
    {
      title: t('overview'),
      subtitle: t('describe_yourself'),
      subtitle1: t('describe_yourself_hint'),
      description: t('overview_description', { name: user_data.user_data?.user_name }),
      buttonText: t('edit_overview'),
      hasData: Boolean(profile?.about_me || profile?.career_objective),
      content: (
        <>
          {profile?.about_me && (
            <>
              <Typography fontWeight={600}>
                {t('about_user', { name: user_data.user_data?.user_name })}
              </Typography>
              <Box
                sx={{ mt: 1 }}
                dangerouslySetInnerHTML={{ __html: profile.about_me }}
              />
            </>
          )}

          {profile?.career_objective && (
            <>
              <Typography fontWeight={600} sx={{ mt: 2 }}>
                {t('career_objectives')}
              </Typography>
              <Box
                sx={{ mt: 1 }}
                dangerouslySetInnerHTML={{ __html: profile.career_objective }}
              />
            </>
          )}
        </>
      ),
    },

    {
      title: t('work_experiences'),
      description: t('work_experiences_description'),
      buttonText: t('add_work_experience'),
      hasData: Boolean(profile?.experience),
      content: profile?.experience && (
        <Box dangerouslySetInnerHTML={{ __html: profile.experience }} />
      ),
    },

    {
      title: t('education_qualifications'),
      description: t('education_description'),
      buttonText: t('add_education'),
      hasData: Boolean(profile?.education),
      content: profile?.education && (
        <Box dangerouslySetInnerHTML={{ __html: profile.education }} />
      ),
    },

    {
      title: t('skills'),
      description: t('skills_description'),
      buttonText: t('add_skill'),
      hasData: Boolean(profile?.skills),
      content:
        profile?.skills && (
          <Stack direction="row" flexWrap="wrap">
            {profile.skills.split(',').map((skill, i) => (
              <Chip key={i} label={<p dangerouslySetInnerHTML={{ __html: skill.trim() }} />} color="primary" sx={{ m: 0.5 }} />
            ))}
          </Stack>
        ),
    },

    {
      title: t('languages'),
      description: t('languages_description'),
      buttonText: t('add_language'),
      hasData: Boolean(profile?.languages),
      content: profile?.languages && (
        <Box dangerouslySetInnerHTML={{ __html: profile.languages }} />
      ),
    },

    {
      title: t('references'),
      description: t('references_description'),
      buttonText: t('add_reference'),
      hasData: Boolean(profile?.reference_text),
      content: profile?.reference_text && (
        <Box dangerouslySetInnerHTML={{ __html: profile.reference_text }} />
      ),
    },
  ];

  const [secondAnchor, setSecondAnchor] = useState(null);
  const open = Boolean(secondAnchor);

  // Safe profile URL construction - CRITICAL FIX
  const getSafeProfileUrl = () => {
    const profileImage = user_data?.user_data?.profile_image;

    // Check for null, undefined, or string "null"/"undefined"
    if (!profileImage ||
      profileImage === 'null' ||
      profileImage === 'undefined' ||
      profileImage.trim() === '') {
      return null;
    }

    return `${import.meta.env.VITE_API_BASE_URL}/uploads/user/profile/${profileImage}`;
  };

  const profileUrl = getSafeProfileUrl();

  const handleMenuOpen = (event) => {
    setSecondAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setSecondAnchor(null);
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      await uploadProfile(file);
      handleMenuClose();
    }
  };

  const handleDelete = async () => {
    setOpenDeleteProfile(true);
    handleMenuClose();
  };

  const handleView = () => {
    if (profileUrl) {
      setOpenProfile(true);
    } else {
      showSnackbar(t('no_profile_image'), 'info');
    }
    handleMenuClose();
  };

  const uploadProfile = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/user/upload-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Ensure we're setting the actual filename, not a string "null"
      const newProfileImage = res.data.profile_image || res.data.profile_image_url || res.data.filename;

      setUserData({
        ...user_data,
        user_data: {
          ...user_data.user_data,
          profile_image: newProfileImage, // This should be the actual filename
        }
      });

      showSnackbar(t('profile_image_uploaded'), 'success');
    } catch (error) {
      console.error("Upload failed:", error);
      showSnackbar(t('profile_image_upload_failed'), 'error');
    }
  };

  const handleDeleteUserProfile = async () => {
    setLoading(true);
    try {
      const response = await api.delete("/user/delete-profile");

      if (response.status === 200) {
        // CRITICAL: Set to null, NOT empty string or "null"
        setUserData({
          ...user_data,
          user_data: {
            ...user_data.user_data,
            profile_image: null  // This MUST be null, not "null"
          }
        });

        showSnackbar(t('profile_image_deleted'), 'success');
      }
    } catch (error) {
      console.error("Delete failed:", error);
      showSnackbar(t('profile_image_delete_failed'), 'error');
    } finally {
      setLoading(false);
      setOpenDeleteProfile(false);
      setSecondAnchor(null);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Profile Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          bgcolor: '#fff',
          boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 3, sm: 4 }}
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          {/* Avatar and Basic Info - THIS PART STAYS INSIDE */}
          <Stack direction="row" spacing={3} alignItems="center" flexGrow={1}>
            <Box sx={{ position: 'relative' }}>
              <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: '#1976d2',
                    fontSize: 32,
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                  src={profileUrl || undefined}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                >
                  {user_data?.user_data?.user_name?.charAt(0).toUpperCase() || '?'}
                </Avatar>
              </IconButton>

              {/* Camera icon overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'primary.main',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
                onClick={handleMenuOpen}
              >
                <PhotoCamera sx={{ color: 'white', fontSize: 16 }} />
              </Box>
            </Box>

            <Menu
              anchorEl={secondAnchor}
              open={open}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleView}>
                <VisibilityIcon sx={{ mr: 1 }} /> View
              </MenuItem>
              <MenuItem>
                <label htmlFor="upload-file" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <UploadIcon sx={{ mr: 1 }} /> Upload
                </label>
                <input
                  type="file"
                  id="upload-file"
                  style={{ display: 'none' }}
                  onChange={handleUpload}
                  accept="image/*"
                />
              </MenuItem>
              <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
                <DeleteIcon sx={{ mr: 1 }} /> Delete
              </MenuItem>
            </Menu>

            <Box>
              <Typography variant="h5" fontWeight={700}>
                {user_data.user_data?.user_name || t('unnamed')}
              </Typography>
              {user_data?.user_data?.address && (
                <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mt={0.5}>
                  <LocationOnOutlined fontSize="small" />
                  <Typography variant="body2">{user_data?.user_data?.address}</Typography>
                </Stack>
              )}
              <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mt={0.5}>
                <EmailOutlined fontSize="small" />
                <Typography variant="body2">{user_data?.user_data?.email}</Typography>
              </Stack>
            </Box>
          </Stack>

          {/* Edit Profile Button - NOW INSIDE THE MAIN STACK */}
          <Button
            size="medium"
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => setEditOpen(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 18px rgba(25, 118, 210, 0.5)',
              },
              borderRadius: 2,
              minWidth: { xs: '100%', sm: 140 },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            {t('edit_profile')}
          </Button>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Summary Info */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(160px, 1fr))' },
            gap: 3,
          }}
        >
          {Object.entries(summaryFields).filter(([_, value]) => value).map(([label, value]) => (
            <Paper
              key={label}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#f9f9f9',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#f0f4ff',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                },
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {value || t('not_set')}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>

      {/* CV Upload Section */}
      <Paper sx={{ borderRadius: 3, bgcolor: '#fff', mb: 3, boxShadow: '0 8px 20px rgba(0,0,0,0.1)', width: '100%', boxSizing: 'border-box', p: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>{t('resume_cv')}</Typography>

        {/* Uploaded CVs with scroll */}
        {uploadedCvs.length > 0 && (
          <Box
            sx={{
              maxHeight: 4 * 72,
              overflowY: 'auto',
              mb: 1,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Stack spacing={1}>
              {uploadedCvs.slice().sort((a, b) => b.is_primary - a.is_primary).map((cv) => (
                <Stack
                  key={cv.pk_id}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ border: '1px solid #eee', borderRadius: 2, width: '100%', flexWrap: 'nowrap', boxSizing: 'border-box', flexShrink: 0, p: 1 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DescriptionIcon color="success" />
                    <Typography
                      sx={{
                        maxWidth: { xs: '180px', sm: '260px', md: '100%' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cv.file_name || cv.resume_file?.split('/').pop() || t('uploaded_cv')}
                    </Typography>
                    <Chip
                      label={cv.is_primary ? t('active') : t('inactive')}
                      size="small"
                      color={cv.is_primary ? 'success' : 'error'}
                      sx={{ ml: 1 }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {isMobile ? (
                      <>
                        <IconButton
                          aria-controls={`cv-menu-${cv.pk_id}`}
                          aria-haspopup="true"
                          onClick={(e) => setAnchorEl(cv.pk_id, e.currentTarget)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                        <Menu
                          id={`cv-menu-${cv.pk_id}`}
                          anchorEl={anchorEls[cv.pk_id] || null}
                          open={Boolean(anchorEls[cv.pk_id])}
                          onClose={() => setAnchorEl(cv.pk_id, null)}
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                          }}
                          transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                          }}
                          PaperProps={{
                            sx: {
                              borderRadius: 2,
                              minWidth: 180,
                              boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
                              bgcolor: 'background.paper',
                              py: 0.5,
                            },
                          }}
                        >
                          {!cv.is_primary && (
                            <MenuItem
                              onClick={() => { setDefaultCv(cv.pk_id); setAnchorEl(cv.pk_id, null); }}
                              sx={{
                                px: 2,
                                py: 1,
                                '&:hover': { bgcolor: 'action.hover' },
                              }}
                            >
                              <StarIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
                              {t('set_default')}
                            </MenuItem>
                          )}

                          {cv.download_url && (
                            <MenuItem
                              onClick={() => { downloadFile(cv.pk_id, cv.resume_file); setAnchorEl(cv.pk_id, null); }}
                              sx={{ px: 2, py: 1, '&:hover': { bgcolor: 'action.hover' } }}
                            >
                              <FileDownloadIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                              {t('download')}
                            </MenuItem>
                          )}

                          <MenuItem sx={{ px: 2, py: 1 }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' }}>
                              <EditIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                              {t('replace')}
                              <input
                                type="file"
                                hidden
                                accept=".pdf,.doc,.docx"
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;

                                  const allowedTypes = [
                                    'application/pdf',
                                    'application/msword',
                                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                  ];
                                  if (!allowedTypes.includes(file.type)) {
                                    setMessage(t('file_not_allowed', { filename: file.name }));
                                    setSeverity('error');
                                    setOpenSnackbar(true);
                                    return;
                                  }
                                  if (file.size > 5 * 1024 * 1024) {
                                    setMessage(t('file_exceeds_limit', { filename: file.name }));
                                    setSeverity('error');
                                    setOpenSnackbar(true);
                                    return;
                                  }

                                  try {
                                    setLoading(true);
                                    const formData = new FormData();
                                    formData.append('resume_type', 'Upload');
                                    formData.append('resume_content', cv.resume_content || '');
                                    formData.append('recommendation_letter', cv.recommendation_letter || '');
                                    formData.append('is_primary', cv.is_primary);
                                    formData.append('resume_file', file);

                                    const { data } = await api.put(`/candidate/resumes/${cv.pk_id}`, formData, {
                                      headers: { 'Content-Type': 'multipart/form-data' },
                                    });

                                    setUploadedCvs((prev) =>
                                      prev.map((c) => (c.pk_id === cv.pk_id ? data : c))
                                    );

                                    setMessage(t('cv_replace_success'));
                                    setSeverity('success');
                                  } catch (err) {
                                    setMessage(err.response?.data?.detail || t('cv_replace_failed'));
                                    setSeverity('error');
                                  } finally {
                                    setOpenSnackbar(true);
                                    setLoading(false);
                                  }
                                }}
                              />
                            </label>
                          </MenuItem>

                          <MenuItem
                            onClick={() => { setCvToDelete(cv.pk_id); setConfirmOpen(true); setAnchorEl(cv.pk_id, null); }}
                            sx={{ px: 2, py: 1, '&:hover': { bgcolor: 'action.hover' } }}
                          >
                            <DeleteIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
                            {t('delete')}
                          </MenuItem>
                        </Menu>
                      </>
                    ) : (
                      <SpeedDial
                        ariaLabel={t('cv_actions')}
                        icon={<MoreVertIcon />}
                        direction={'left'}
                        FabProps={{ size: 'small' }}
                        sx={{
                          '& .MuiSpeedDial-fab': {
                            boxShadow: 'none',
                            bgcolor: 'transparent',
                            color: 'text.primary',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              boxShadow: 'none',
                            },
                          },
                          '& .MuiSpeedDialAction-fab': {
                            width: 40,
                            height: 40,
                            bgcolor: 'background.paper',
                            color: 'text.primary',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            },
                          },
                          '& .MuiSpeedDialAction-staticTooltipLabel': {
                            bgcolor: 'background.paper',
                            color: 'text.primary',
                            boxShadow: 2,
                            fontSize: '0.875rem',
                          },
                        }}
                      >
                        {!cv.is_primary && (
                          <SpeedDialAction
                            icon={<StarIcon />}
                            tooltipTitle={t('set_default')}
                            onClick={() => setDefaultCv(cv.pk_id)}
                          />
                        )}

                        {cv.download_url && (
                          <SpeedDialAction
                            icon={<FileDownloadIcon />}
                            tooltipTitle={t('download')}
                            onClick={() =>
                              downloadFile(cv.pk_id, cv.resume_file)
                            }
                          />
                        )}

                        <SpeedDialAction
                          icon={
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                              <EditIcon />
                              <input
                                type="file"
                                hidden
                                accept=".pdf,.doc,.docx"
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;

                                  const allowedTypes = [
                                    'application/pdf',
                                    'application/msword',
                                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                  ];
                                  if (!allowedTypes.includes(file.type)) {
                                    setMessage(t('file_not_allowed', { filename: file.name }));
                                    setSeverity('error');
                                    setOpenSnackbar(true);
                                    return;
                                  }
                                  if (file.size > 5 * 1024 * 1024) {
                                    setMessage(t('file_exceeds_limit', { filename: file.name }));
                                    setSeverity('error');
                                    setOpenSnackbar(true);
                                    return;
                                  }

                                  try {
                                    setLoading(true);
                                    const formData = new FormData();
                                    formData.append('resume_type', 'Upload');
                                    formData.append('resume_content', cv.resume_content || '');
                                    formData.append('recommendation_letter', cv.recommendation_letter || '');
                                    formData.append('is_primary', cv.is_primary);
                                    formData.append('resume_file', file);

                                    const { data } = await api.put(`/candidate/resumes/${cv.pk_id}`, formData, {
                                      headers: { 'Content-Type': 'multipart/form-data' },
                                    });

                                    setUploadedCvs((prev) =>
                                      prev.map((c) => (c.pk_id === cv.pk_id ? data : c))
                                    );

                                    setMessage(t('cv_replace_success'));
                                    setSeverity('success');
                                  } catch (err) {
                                    setMessage(err.response?.data?.detail || t('cv_replace_failed'));
                                    setSeverity('error');
                                  } finally {
                                    setOpenSnackbar(true);
                                    setLoading(false);
                                  }
                                }}
                              />
                            </label>
                          }
                          tooltipTitle={t('replace')}
                        />

                        <SpeedDialAction
                          icon={<DeleteIcon color="error" />}
                          tooltipTitle={t('delete')}
                          onClick={() => {
                            setCvToDelete(cv.pk_id)
                            setConfirmOpen(true)
                          }}
                        />
                      </SpeedDial>
                    )
                    }
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

        {/* Selected Files for New Upload */}
        {cvFile.length > 0 && (
          <Stack spacing={1} mb={1}>
            {cvFile.map((file, idx) => (
              <Stack
                key={idx}
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{ p: 1, border: '1px solid #eee', borderRadius: 2, width: '100%', flexWrap: 'wrap', boxSizing: 'border-box', }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <UploadIcon color="primary" />
                  <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleUploadSingle(idx)}
                    disabled={loading}
                  >
                    {loading ? t('uploading') : t('upload')}
                  </Button>
                  <Button
                    variant="contained"
                    color='error'
                    size="small"
                    onClick={() =>
                      setCvFile((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    {t('remove')}
                  </Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}

        {/* Upload Button (select files) */}
        <Button
          component="label"
          variant="outlined"
          startIcon={<UploadIcon />}
          sx={{ width: '100%', borderStyle: 'dashed', p: 2 }}
        >
          {t('upload_cv_button')}
          <input hidden type="file" accept=".pdf,.doc,.docx" multiple onChange={handleCvChange} />
        </Button>
      </Paper>

      {/* Snackbar */}
      <Snackbar open={openSnackbar} autoHideDuration={2000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={severity} variant="filled">{message}</Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('delete_cv')}</DialogTitle>
        <DialogContent>
          <Typography>{t('delete_cv_confirmation')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t('cancel')}</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>{t('delete')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={sectionOpen}
        onClose={handleCloseSection}
        fullWidth={true}
        maxWidth={"sm"}
        fullScreen={isMobile}
      >
        <DialogTitle fontWeight={700}>{activeSection}</DialogTitle>
        <DialogContent dividers sx={{ height: 'auto' }}>
          {sectionDialogs[activeSection] ? (
            sectionDialogs[activeSection]()
          ) : (
            <Typography>{t('no_ui_defined')}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSection}>{t('cancel')}</Button>
          <Button variant="contained" onClick={handleSaveSection}>{t('save')}</Button>
        </DialogActions>
      </Dialog>
      <style>
        {`
          .quill-editor .ql-container {
            min-height: 180px;
            max-height: 400px;
          }

          .quill-editor .ql-editor {
            min-height: 180px;
            max-height: 400px;
            overflow-y: auto;
          }
        `}
      </style>

      <EditProfileDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        showSnackbar={showSnackbar}
        candidates={candidates}
        setCandidates={setCandidates}
        jobCategories={jobCategories}
      />

      {sections.map((section) => (
        <Section
          key={section.title}
          {...section}
          onAdd={() => handleOpenSection(section.title)}
        />
      ))}

      <ViewProfileDialog
        open={openProfile}
        onClose={() => setOpenProfile(false)}
        imageUrl={profileUrl}
        userName={user_data?.user_data?.user_name}
      />
      <DeleteProfileDialog
        open={openDeleteProfile}
        onClose={() => setOpenDeleteProfile(false)}
        loading={loading}
        onConfirm={handleDeleteUserProfile}
      />
    </Box>
  )
}

function EditProfileDialog({ open, onClose, showSnackbar, candidates, setCandidates, jobCategories }) {
  const { t } = useTranslation();
  const { user_data, setUserData } = useAuthStore()
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [form, setForm] = useState(user_data || {})
  const [loading, setLoading] = useState(false)

  // Safe profile URL construction for dialog
  const getDialogProfileUrl = () => {
    const profileImage = form?.profile_image;
    if (!profileImage || profileImage === 'null' || profileImage === 'undefined' || profileImage.trim() === '') {
      return null;
    }
    return `${import.meta.env.VITE_API_BASE_URL}/uploads/user/profile/${profileImage}`;
  };

  const dialogProfileUrl = getDialogProfileUrl();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = async (e) => {
  e.preventDefault();
  try {
    form.password = "123";
    setLoading(true)
    const { data } = await api.post('/user', form)
    showSnackbar(t('profile_updated'), 'success')
    
    // CRITICAL FIX: Preserve the existing profile_image if not returned in response
    const updatedUserData = {
      ...data,
      // If the API doesn't return profile_image, keep the existing one
      profile_image: data.profile_image || form.profile_image || user_data?.user_data?.profile_image,
      experience_level: form.experience_level || "",
      min_monthly_salary: form.min_monthly_salary || "",
      jobCategoryId: form.jobCategoryId || "",
    };
    
    // If profile_image is "null" string, convert to null
    if (updatedUserData.profile_image === 'null' || updatedUserData.profile_image === 'undefined') {
      updatedUserData.profile_image = null;
    }
    
    setUserData({
      ...user_data,
      user_data: updatedUserData,
    });
    
    setCandidates((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        experience_level: form.experience_level || "",
        expected_salary: form.min_monthly_salary || "",
        job_category_id: form.jobCategoryId || "",
      },
    }));
    onClose()
  } catch (err) {
    const errorMsg = err.response?.data?.detail || t('profile_update_failed')
    showSnackbar(errorMsg, 'error')
  } finally {
    setLoading(false)
  }
}
  useEffect(() => {
    if (open && user_data?.user_data) {
      // Ensure we don't set "null" string in form
      const userData = { ...user_data.user_data };
      if (userData.profile_image === 'null' || userData.profile_image === 'undefined') {
        userData.profile_image = null;
      }
      setForm(userData);
    }
  }, [open, user_data])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile} scroll="paper">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {t('edit_profile')}
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent dividers>
        <Stack spacing={2} component="form" onSubmit={handleSave} id="edit-form">
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Fixed Avatar - Now shows image if available */}
            <Avatar 
              sx={{ 
                width: 64, 
                height: 64, 
                bgcolor: '#3b5998', 
                fontSize: 24 
              }}
              src={dialogProfileUrl || undefined}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            >
              {form.user_name?.charAt(0)?.toUpperCase() || '?'}
            </Avatar>
            <TextField size="small" fullWidth label={t('full_name')} name="user_name" required value={form.user_name} onChange={handleChange} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField size="small" fullWidth label={t('email')} name="email" type="email" required value={form.email} onChange={handleChange} />
            <TextField size="small" fullWidth label={t('phone')} name="phone" value={form.phone || ""} onChange={handleChange} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField size="small" fullWidth label={t('date_of_birth')} name="date_of_birth" type="date" value={form.date_of_birth ?? ""} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            <TextField
              fullWidth
              size="small"
              name="gender"
              label={t('gender')}
              select
              required
              value={form.gender} onChange={handleChange}
            >
              <MenuItem value="Male">{t('male')}</MenuItem>
              <MenuItem value="Female">{t('female')}</MenuItem>
            </TextField>
          </Stack>
          <TextField size="small" fullWidth label={t('address')} name="address" value={form.address || ""} onChange={handleChange} multiline rows={2} />
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="job-category-label">
                {t('job_category')}
              </InputLabel>
              <Select
                name="jobCategoryId"
                value={form.jobCategoryId || ''}
                label={t('job_category')}
                onChange={handleChange}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      overflowY: 'auto',
                    },
                  },
                }}
              >
                {jobCategories.map((cat) => (
                  <MenuItem key={cat.pk_id} value={cat.pk_id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField size="small" fullWidth label={t('experience_level')} name="experience_level" value={form.experience_level ?? ''} onChange={(e) => setForm(prev => ({ ...prev, experience_level: e.target.value === "" ? null : e.target.value }))} />
            <TextField size="small" fullWidth label={t('min_monthly_salary')} name="min_monthly_salary" type='number' value={form.min_monthly_salary ?? ''} onChange={(e) => setForm(prev => ({ ...prev, min_monthly_salary: e.target.value === "" ? null : e.target.value }))} />
          </Stack>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              bgcolor: '#f9f9f9',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography fontWeight={600}>{t('profile_status')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('profile_status_description')}
                </Typography>
              </Box>

              <IOSSwitch
                sx={{ m: 1 }}
                checked={!!form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">{t('cancel')}</Button>
        <Button variant="contained" type="submit" form="edit-form" color="primary" disableElevation loading={loading} loadingPosition="end" disabled={loading}>{t('save')}</Button>
      </DialogActions>
    </Dialog>
  )
}

function Section({ title, description, buttonText, onAdd, isEdit, content, hasData }) {
  const { t } = useTranslation();

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        bgcolor: '#fff',
        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>

        {(isEdit || hasData) && (
          <IconButton size="small" color="primary" onClick={onAdd}>
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Divider ONLY when data exists */}
      {hasData && <Divider sx={{ my: 2 }} />}

      {/* Content */}
      {hasData ? (
        <Box>
          {content}
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {description}
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgb(59 89 152 / 0.2)',
              '&:hover': {
                boxShadow: '0 4px 12px rgb(59 89 152 / 0.4)',
              },
              borderRadius: 2,
              px: 3,
            }}
          >
            {buttonText}
          </Button>
        </>
      )}
    </Paper>
  );
}

const IOSSwitch = styled((props) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#65C466',
        opacity: 1,
        border: 0,
        ...theme.applyStyles('dark', {
          backgroundColor: '#2ECA45',
        }),
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: '#33cf4d',
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.grey[100],
      ...theme.applyStyles('dark', {
        color: theme.palette.grey[600],
      }),
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: 0.7,
      ...theme.applyStyles('dark', {
        opacity: 0.3,
      }),
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22,
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: '#E9E9EA',
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
    ...theme.applyStyles('dark', {
      backgroundColor: '#39393D',
    }),
  },
}));