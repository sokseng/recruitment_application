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
  Alert 
} from '@mui/material'
import { useState } from 'react'
import {
  Edit as EditIcon,
  Add as AddIcon,
  LocationOn as LocationOnIcon,
  Email as EmailIcon,
  UploadFile as UploadFileIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import useAuthStore from '../../store/useAuthStore'
import api from '../../services/api'

export default function CandidateProfileDashboard() {
  const { user_data } = useAuthStore()
  const [cvFile, setCvFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState('error')

  // ----- CV Upload -----
  const handleCvChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
    ]

    if (!allowed.includes(file.type)) {
      return alert('Only PDF, DOC, DOCX, JPEG, PNG, GIF allowed')
    }

    if (file.size > 5 * 1024 * 1024) return alert('Max file size is 5MB')

    setCvFile(file)
  }

  const handleUpload = async () => {
    if (!cvFile) return
    const formData = new FormData()
    formData.append('resume_type', 'Upload')       
    formData.append('resume_content', '')           
    formData.append('recommendation_letter', '') 
    formData.append('is_primary', true)          
    formData.append('resume_file', cvFile) 

    try {
      setLoading(true)
      const response = await api.post('/candidate/resumes/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setMessage('CV uploaded successfully')
      setSeverity('success')
      setOpenSnackbar(true)
      setCvFile(null)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Upload failed')
      setSeverity('error')
      setOpenSnackbar(true)
    } finally {
      setLoading(false)
    }
  }

  const summaryFields = {
    Gender: user_data?.gender,
    'Date of Birth': user_data?.date_of_birth,
    Phone: user_data?.phone,
    Status: user_data?.is_active ? 'Open To Work' : 'Not Open To Work',
  }

  return (
    <Box
      sx={{
        mx: 'auto',
        py: 4,
        px: 2,
        bgcolor: '#f0f2f5',
        minHeight: '100vh',
        borderRadius: 3,
      }}
    >
      {/* Profile Header */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          bgcolor: '#fff',
          boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)',
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center" mb={3}>
          <Avatar
            sx={{
              width: 72,
              height: 72,
              bgcolor: '#3b5998',
              fontSize: 32,
              fontWeight: 'bold',
              boxShadow: '0 2px 6px rgb(0 0 0 / 0.15)',
            }}
          >
            {user_data?.user_name?.charAt(0).toUpperCase() || '?'}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700} mb={0.3}>
              {user_data?.user_name}
            </Typography>

            {user_data?.address && (
              <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mb={0.5}>
                <LocationOnIcon fontSize="small" />
                <Typography variant="body2">{user_data.address}</Typography>
              </Stack>
            )}

            <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
              <EmailIcon fontSize="small" />
              <Typography variant="body2">{user_data?.email}</Typography>
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Summary Fields */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 3,
          }}
        >
          {Object.entries(summaryFields).map(([label, value]) => (
            <Box key={label}>
              <Typography variant="subtitle2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {value || 'Not set'}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* CV Upload */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          bgcolor: '#fff',
          boxShadow: '0 2px 8px rgb(0 0 0 / 0.05)',
        }}
      >
        <Typography variant="h6" fontWeight={700} mb={2}>
          Resume / CV
        </Typography>

        {!cvFile ? (
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            sx={{ width: '100%', borderStyle: 'dashed', p: 2, textTransform: 'none' }}
          >
            Upload CV (PDF, DOC, DOCX)
            <input hidden type="file" onChange={handleCvChange} />
          </Button>
        ) : (
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <UploadFileIcon color="primary" />
              <Typography>{cvFile.name}</Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
              <IconButton onClick={() => setCvFile(null)} color="error">
                <DeleteIcon />
              </IconButton>
              <Button variant="contained" onClick={handleUpload} disabled={loading}>
                {loading ? 'Uploading...' : 'Upload'}
              </Button>
            </Stack>
          </Stack>
        )}
      </Paper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={severity} variant="filled">
          {message}
        </Alert>
      </Snackbar>

      {/* Profile Sections */}
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

// Reusable Section Component
function Section({ title, description, buttonText, onAdd, isEdit }) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        bgcolor: '#fff',
        boxShadow: '0 2px 8px rgb(0 0 0 / 0.05)',
      }}
    >
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

      <Typography variant="body2" color="text.secondary" mb={2}>
        {description}
      </Typography>

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
