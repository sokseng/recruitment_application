import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  IconButton,
  Stack,
  Avatar,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  TextField,
  MenuItem,
  Switch
} from '@mui/material'
import { useState, useEffect } from 'react'
import {
  Edit as EditIcon,
  Add as AddIcon,
  LocationOn as LocationOnIcon,
  Email as EmailIcon,
  UploadFile as UploadFileIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import useAuthStore from '../../store/useAuthStore'
import api from '../../services/api'
import { useTheme, useMediaQuery } from "@mui/material";
import { styled } from '@mui/material/styles';

export default function CandidateProfileDashboard() {
  const { user_data } = useAuthStore()

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
        alert(`${file.name} is not allowed.`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} exceeds 5MB.`)
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
      formData.append('is_primary', true)
      formData.append('resume_file', file)

      const { data } = await api.post('/candidate/resumes/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setUploadedCvs((prev) => [...prev, data])
      setMessage('CV uploaded successfully')
      setSeverity('success')

      // Remove the uploaded file from staged list
      setCvFile((prev) => prev.filter((_, i) => i !== fileIndex))
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Upload failed')
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
      setMessage('CV deleted successfully')
      setSeverity('success')
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to delete CV')
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
      console.error(error);
      setMessage('Failed to download file');
      setSeverity('error');
      setOpenSnackbar(true);
    }
  };

  // Inside CandidateProfileDashboard
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
    }
    fetchCvs()
  }, [])

  const summaryFields = {
    Gender: user_data.user_data?.gender,
    'Date of Birth': user_data.user_data?.date_of_birth,
    Phone: user_data.user_data?.phone,
    Status: user_data.user_data?.is_active ? 'Open To Work' : 'Not Open To Work',
  }

  return (
    <Box sx={{ mx: 'auto', py: 4, px: 2, bgcolor: '#f0f2f5', minHeight: '100vh', borderRadius: 3 }}>
      {/* Profile Header */}
      <Paper
        sx={{
          p: 4,
          mb: 5,
          borderRadius: 4,
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
          {/* Avatar and Basic Info */}
          <Stack direction="row" spacing={3} alignItems="center" flexGrow={1}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: '#1976d2',
                fontSize: 32,
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {user_data?.user_name?.charAt(0).toUpperCase() || '?'}
            </Avatar>

            <Box>
              <Typography variant="h5" fontWeight={700}>
                {user_data?.user_name || 'Unnamed'}
              </Typography>

              {user_data?.user_data?.address && (
                <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mt={0.5}>
                  <LocationOnIcon fontSize="small" />
                  <Typography variant="body2">{user_data?.user_data?.address}</Typography>
                </Stack>
              )}

              <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mt={0.5}>
                <EmailIcon fontSize="small" />
                <Typography variant="body2">{user_data?.user_data?.email}</Typography>
              </Stack>
            </Box>
          </Stack>

          {/* Edit Profile Button */}
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
              minWidth: 140,
            }}
          >
            Edit Profile
          </Button>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Summary Info */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 3,
          }}
        >
          {Object.entries(summaryFields).map(([label, value]) => (
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
                {value || 'Not set'}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>

      {/* CV Upload Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#fff' }}>
        <Typography variant="h6" fontWeight={700} mb={2}>Resume / CV</Typography>

        {/* Uploaded CVs with scroll */}
        {uploadedCvs.length > 0 && (
          <Box
            sx={{
              maxHeight: 4 * 72, // approx 5 items height (72px each) + spacing
              overflowY: 'auto',
              mb: 2,
              pr: 1,
            }}
          >
            <Stack spacing={2}>
              {uploadedCvs.map((cv) => (
                <Stack
                  key={cv.pk_id}
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <UploadFileIcon color="success" />
                    <Typography>{cv.file_name || cv.resume_file?.split('/').pop() || 'Uploaded CV'}</Typography>
                    <Chip
                      label={cv.is_primary ? 'Active' : 'Inactive'}
                      size="small"
                      color={cv.is_primary ? 'success' : 'error'}
                      sx={{ ml: 1 }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    {cv.download_url && (
                      <Button
                        size="small"
                        variant="outlined"
                        component="a"
                        onClick={() => downloadFile(cv.pk_id, cv.resume_file)}
                        rel="noopener noreferrer"
                        startIcon={<UploadFileIcon />}
                      >
                        Download
                      </Button>
                    )}
                    {/* Replace CV */}
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      startIcon={<EditIcon />}
                    >
                      Replace
                      <input
                        hidden
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={async (e) => {
                          const file = e.target.files[0]
                          if (!file) return
                          const allowedTypes = [
                            'application/pdf',
                            'application/msword',
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          ]
                          if (!allowedTypes.includes(file.type)) {
                            alert(`${file.name} is not allowed.`)
                            return
                          }
                          if (file.size > 5 * 1024 * 1024) {
                            alert(`${file.name} exceeds 5MB.`)
                            return
                          }
                          try {
                            setLoading(true)
                            const formData = new FormData()
                            formData.append('resume_type', 'Upload')
                            formData.append('resume_content', '')
                            formData.append('recommendation_letter', '')
                            formData.append('is_primary', true)
                            formData.append('resume_file', file)

                            const { data } = await api.put(`/candidate/resumes/${cv.pk_id}`, formData, {
                              headers: { 'Content-Type': 'multipart/form-data' },
                            })

                            setUploadedCvs((prev) =>
                              prev.map((c) => (c.pk_id === cv.pk_id ? data : c))
                            )

                            setMessage('CV replaced successfully')
                            setSeverity('success')
                          } catch (err) {
                            setMessage(err.response?.data?.detail || 'Replace failed')
                            setSeverity('error')
                          } finally {
                            setOpenSnackbar(true)
                            setLoading(false)
                          }
                        }}
                      />
                    </Button>

                    {/* Delete CV */}
                    <IconButton
                      color="error"
                      onClick={() => { setCvToDelete(cv.pk_id); setConfirmOpen(true) }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

        {/* Selected Files for New Upload */}
        {cvFile.length > 0 && (
          <Stack spacing={1} mb={2}>
            {cvFile.map((file, idx) => (
              <Stack
                key={idx}
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{ p: 1, border: '1px solid #eee', borderRadius: 2 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <UploadFileIcon color="primary" />
                  <Typography>{file.name}</Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleUploadSingle(idx)}
                    disabled={loading}
                  >
                    {loading ? 'Uploading...' : 'Upload'}
                  </Button>
                  <IconButton
                    color="error"
                    onClick={() =>
                      setCvFile((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}

        {/* Upload Button (select files) */}
        <Button
          component="label"
          variant="outlined"
          startIcon={<UploadFileIcon />}
          sx={{ width: '100%', borderStyle: 'dashed', p: 2 }}
        >
          Upload CV (PDF, DOC, DOCX)
          <input hidden type="file" accept=".pdf,.doc,.docx" multiple onChange={handleCvChange} />
        </Button>
      </Paper>

      {/* Snackbar */}
      <Snackbar open={openSnackbar} autoHideDuration={2000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={severity} variant="filled">{message}</Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete CV</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this CV?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <EditProfileDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        showSnackbar={showSnackbar}
      />

      {/* Other Profile Sections */}
      {[
        { title: 'Overview', description: `About ${user_data?.user_name}. Career Objectives.`, buttonText: 'Edit Overview', isEdit: true },
        { title: 'Work Experiences', description: 'Add Work Experience to be found by more Employers', buttonText: 'Add Work Experience' },
        { title: 'Education & Qualifications', description: 'Add Education to be found by more Employers', buttonText: 'Add Education' },
        { title: 'Skills', description: 'Add Skills to be found by more Employers', buttonText: 'Add Skill' },
        { title: 'Languages', description: 'Add Languages to be found by more Employers', buttonText: 'Add Language', isEdit: true },
        { title: 'References', description: 'Add References to make your profile look more professional', buttonText: 'Add Reference' },
        { title: 'Preferred Industries to work', description: 'Add Preferred Industries to make your profile look more professional', buttonText: 'Add Preferred Industry', isEdit: true },
      ].map((section) => (
        <Section key={section.title} {...section} />
      ))}
    </Box>
  )
}

function EditProfileDialog({ open, onClose, showSnackbar }) {
  const { user_data, setUserData } = useAuthStore()
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [form, setForm] = useState(user_data || {})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      form.password = "123";
      setLoading(true)
      const { data } = await api.post('/user', form)
      showSnackbar('Profile updated successfully', 'success')
      setUserData({
        ...user_data,
        user_data: data,
      });
      onClose()
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to update profile'
      showSnackbar(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setForm(user_data.user_data || {})
    }
  }, [open, user_data])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth fullScreen={isMobile} scroll="paper">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Edit Profile
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent dividers>
        <Stack spacing={3} mt={2} component="form" onSubmit={handleSave} id="edit-form">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 64, height: 64, bgcolor: '#3b5998', fontSize: 24 }}>
              {form.user_name?.charAt(0)?.toUpperCase() || '?'}
            </Avatar>
            <TextField size="small" fullWidth label="Full Name" name="user_name" required value={form.user_name} onChange={handleChange} />
          </Stack>
          <TextField size="small" fullWidth label="Email" name="email" type="email" required value={form.email} onChange={handleChange} />
          <TextField size="small" fullWidth label="Phone" name="phone" value={form.phone} onChange={handleChange} />
          <Stack direction="row" spacing={2}>
            <TextField size="small" fullWidth label="Date of Birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            <TextField
              fullWidth
              size="small"
              name="gender"
              label="Gender"
              select
              required
              value={form.gender} onChange={handleChange}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </TextField>
          </Stack>
          <TextField size="small" fullWidth label="Address" name="address" value={form.address} onChange={handleChange} multiline rows={2} />
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              bgcolor: '#f9f9f9',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography fontWeight={600}>Profile Status</Typography>
                <Typography variant="body2" color="text.secondary">
                  Control whether your profile is visible to employers
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
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button variant="contained" type="submit" form="edit-form" color="primary" disableElevation loading={loading} loadingPosition="end" disabled={loading}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

// Reusable Section Component
function Section({ title, description, buttonText, onAdd, isEdit }) {
  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#fff', boxShadow: '0 2px 8px rgb(0 0 0 / 0.05)' }}>
      <Typography
        variant="h6"
        fontWeight={700}
        mb={1}
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        {title}
        {isEdit && (
          <IconButton size="small" color="primary" onClick={onAdd || (() => alert(title))}>
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={2}>{description}</Typography>

      {!isEdit && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd || (() => alert(title))}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgb(59 89 152 / 0.2)',
            '&:hover': { boxShadow: '0 4px 12px rgb(59 89 152 / 0.4)' },
            borderRadius: 2,
            px: 3,
          }}
        >
          {buttonText}
        </Button>
      )}
    </Paper>
  )
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