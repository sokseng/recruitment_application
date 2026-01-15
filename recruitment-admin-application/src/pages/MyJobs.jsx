import React, { useEffect, useState } from 'react'
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
  Grid,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import api from '../services/api'
import JobPostDialog from '../components/JobPostDialog'

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship']
const JOB_STATUSES = ['Draft', 'Open', 'Closed']

export default function MyJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [openPostDialog, setOpenPostDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [editingJob, setEditingJob] = useState(null)

  /* ================= FETCH JOBS ================= */
  useEffect(() => {
    fetchMyJobs()
  }, [])

  const fetchMyJobs = async () => {
    try {
      setLoading(true)
      const res = await api.get('/jobs/my-jobs?limit=100')
      setJobs(res.data || [])
    } catch {
      setError('Failed to load your posted jobs')
    } finally {
      setLoading(false)
    }
  }

  /* ================= DELETE ================= */
  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return
    await api.delete(`/jobs/${jobId}`)
    setJobs((prev) => prev.filter((j) => j.pk_id !== jobId))
  }

  /* ================= EDIT ================= */
  const openEdit = (job) => {
    setEditingJob({ ...job })
    setOpenEditDialog(true)
  }

  const closeEdit = () => {
    setOpenEditDialog(false)
    setEditingJob(null)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditingJob((prev) => ({ ...prev, [name]: value }))
  }

  const saveEdit = async () => {
    const payload = {
      job_title: editingJob.job_title,
      job_type: editingJob.job_type,
      position_number: Number(editingJob.position_number),
      salary_range: editingJob.salary_range,
      location: editingJob.location,
      job_description: editingJob.job_description,
      status: editingJob.status,
    }

    const res = await api.put(`/jobs/${editingJob.pk_id}`, payload)

    setJobs((prev) =>
      prev.map((j) => (j.pk_id === editingJob.pk_id ? res.data : j))
    )

    closeEdit()
  }

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress />
      </Box>
    )
  }

  /* ================= RENDER ================= */
  return (
    <Box
      sx={{
        maxWidth: 1400,
        mx: 'auto',
        py: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ================= HEADER ================= */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        mb={2}
        px={2}

      >
        <Typography variant="h4" fontWeight={700}>
          My Posted Jobs
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenPostDialog(true)}
        >
          Post New Job
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {/* ================= GRID ================= */}
      <Box
        sx={{
            flexGrow: 1,
            height: '70vh', // or whatever fits your layout
            overflowY: 'auto',
        }}
      >
        <Box
            sx={{
            display: 'grid',
            gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
            },
            gap: 1,
            px:{xs: 2}
            }}
        >
            {jobs.map((job) => (
            <Card
                key={job.pk_id}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    height: '100%',
                    border: "1px solid",
                    borderColor: 'divider',

                }}
            >
                {/* ===== CONTENT ===== */}
                <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" fontWeight={600} noWrap>
                    {job.job_title}
                </Typography>

                <Stack direction="row" spacing={1} my={1} flexWrap="wrap">
                    <Chip label={job.job_type} size="small" />
                    <Chip
                    label={job.status}
                    size="small"
                    color={
                        job.status === 'Open'
                        ? 'success'
                        : job.status === 'Closed'
                        ? 'error'
                        : 'default'
                    }
                    />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                    Location: {job.location || 'N/A'}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    Salary: {job.salary_range || 'Negotiable'}
                </Typography>

                <Typography
                    variant="caption"
                    color="text.secondary"
                    mt={2}
                    display="block"
                >
                    Posted {new Date(job.created_at).toLocaleDateString()}
                </Typography>
                </CardContent>

                {/* ===== ACTIONS ===== */}
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                <IconButton onClick={() => openEdit(job)}>
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton color="error" onClick={() => handleDelete(job.pk_id)}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
                </CardActions>
            </Card>
            ))}
        </Box>
      </Box>
      

      {/* ================= CREATE JOB ================= */}
      <JobPostDialog
        open={openPostDialog}
        onClose={() => setOpenPostDialog(false)}
        onJobCreated={fetchMyJobs}
      />

      {/* ================= EDIT JOB ================= */}
      <Dialog open={openEditDialog} onClose={closeEdit} maxWidth="md" fullWidth>
        <DialogTitle>Edit Job</DialogTitle>

        <DialogContent dividers>
          {editingJob && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Job Title"
                  name="job_title"
                  value={editingJob.job_title}
                  onChange={handleEditChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Job Type</InputLabel>
                  <Select
                    name="job_type"
                    value={editingJob.job_type}
                    label="Job Type"
                    onChange={handleEditChange}
                  >
                    {JOB_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={editingJob.status}
                    label="Status"
                    onChange={handleEditChange}
                  >
                    {JOB_STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Position Number"
                  name="position_number"
                  value={editingJob.position_number || ''}
                  onChange={handleEditChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Salary Range"
                  name="salary_range"
                  value={editingJob.salary_range || ''}
                  onChange={handleEditChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={editingJob.location || ''}
                  onChange={handleEditChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  label="Job Description"
                  name="job_description"
                  value={editingJob.job_description || ''}
                  onChange={handleEditChange}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeEdit}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
