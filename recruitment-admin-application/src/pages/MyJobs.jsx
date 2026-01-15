// src/pages/MyJobs.jsx
import React, { useState, useEffect } from 'react';
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
  Grid,
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
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';
import JobPostDialog from '../components/JobPostDialog';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const JOB_STATUSES = ['Draft', 'Open', 'Closed'];

export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/jobs/my-jobs?limit=100');
      setJobs(res.data || []);
    } catch (err) {
      setError('Failed to load your posted jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs((prev) => prev.filter((job) => job.pk_id !== jobId));
      alert('Job deleted successfully');
    } catch (err) {
      alert('Failed to delete job: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleOpenEdit = (job) => {
    setEditingJob({ ...job }); // deep copy to avoid mutating original
    setOpenEditDialog(true);
  };

  const handleCloseEdit = () => {
    setOpenEditDialog(false);
    setEditingJob(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingJob((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingJob) return;

    try {
      const payload = {
        job_title: editingJob.job_title?.trim(),
        job_type: editingJob.job_type,
        position_number: editingJob.position_number ? Number(editingJob.position_number) : undefined,
        salary_range: editingJob.salary_range?.trim() || undefined,
        location: editingJob.location?.trim() || undefined,
        job_description: editingJob.job_description?.trim(),
        closing_date: editingJob.closing_date || undefined,
        status: editingJob.status,
      };

      const res = await api.put(`/jobs/${editingJob.pk_id}`, payload);

      // Update local state with fresh data from server
      setJobs((prev) =>
        prev.map((j) => (j.pk_id === editingJob.pk_id ? res.data : j))
      );

      alert('Job updated successfully');
      handleCloseEdit();
    } catch (err) {
      alert('Failed to update job: ' + (err.response?.data?.detail || 'Error'));
    }
  };

  const handleJobCreated = () => {
    fetchMyJobs(); // refresh list after new job is posted
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        mb={4}
      >
        <Typography variant="h4" fontWeight="bold" color="primary">
          My Posted Jobs
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenPostDialog(true)}
          sx={{ minWidth: 180 }}
        >
          Post New Job
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {jobs.length === 0 ? (
        <Alert severity="info" sx={{ mt: 4 }}>
          You haven't posted any jobs yet. Click "Post New Job" to create your first listing!
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {jobs.map((job) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={job.pk_id}>
              <Card
                elevation={3}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                }}
              >
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {job.job_title}
                  </Typography>

                  <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
                    <Chip
                      label={job.job_type}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={job.status}
                      color={
                        job.status === 'Open' ? 'success' :
                        job.status === 'Closed' ? 'error' :
                        'default'
                      }
                      size="small"
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Location:</strong> {job.location || 'Not specified'}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Salary:</strong> {job.salary_range || 'Negotiable'}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Posted: {new Date(job.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => handleOpenEdit(job)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => handleDelete(job.pk_id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Post New Job Dialog */}
      <JobPostDialog
        open={openPostDialog}
        onClose={() => setOpenPostDialog(false)}
        onJobCreated={handleJobCreated}
      />

      {/* Edit Job Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEdit} maxWidth="md" fullWidth>
        <DialogTitle>Edit Job</DialogTitle>
        <DialogContent dividers>
          {editingJob && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Job Title"
                  name="job_title"
                  value={editingJob.job_title || ''}
                  onChange={handleEditChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Job Type</InputLabel>
                  <Select
                    name="job_type"
                    value={editingJob.job_type || 'Full-time'}
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
                    value={editingJob.status || 'Draft'}
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
                  label="Number of Positions"
                  name="position_number"
                  type="number"
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
                  placeholder="e.g. $1,200 - $2,000"
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
                  rows={6}
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
          <Button onClick={handleCloseEdit}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}