// src/components/JobPostDialog.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import api from '../services/api';

const JOB_TYPES = [
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Internship', label: 'Internship' },
];

const JOB_STATUSES = [
  { value: 'Open', label: 'Open (Publish now)' },
  { value: 'Closed', label: 'Closed' },
];

export default function JobPostDialog({ open, onClose, onJobCreated }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    job_title: '',
    job_type: 'Full-time',
    position_number: '',
    salary_range: '',
    location: '',
    job_description: '',
    closing_date: '',
    status: 'Open',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.job_title.trim()) return setError('Job title is required');
    if (!formData.job_description.trim()) return setError('Description is required');


    try {
      const payload = {
        ...formData,
        position_number: formData.position_number ? Number(formData.position_number) : undefined,
        closing_date: formData.closing_date || undefined,
        // posting_date is handled by backend
      };

      await api.post('/jobs/', payload);

      setSuccess(true);

      setTimeout(() => {
        onJobCreated?.(); // trigger refresh in parent component
        onClose();

        // Reset form for next opening
        setFormData({
          job_title: '',
          job_type: 'Full-time',
          position_number: '',
          salary_range: '',
          location: '',
          job_description: '',
          closing_date: '',
          status: 'Open',
        });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose} // prevent close while submitting
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      scroll="paper"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : 3,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          p: { xs: 2.5, sm: 3 },
          position: 'relative',
          textAlign: 'center',
        }}
      >
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
          Post a New Job
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
          Reach the right candidates quickly
        </Typography>

        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'white',
          }}
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 4 } }}>
        {
        (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Job posted successfully!
              </Alert>
            )}

            <form onSubmit={handleSubmit} id="job-post-form">
              <Grid container spacing={2.5}>

                {/* Job Title */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Job Title"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleChange}
                    placeholder="e.g. Senior React Developer"
                  />
                </Grid>

                {/* Job Type */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Job Type</InputLabel>
                    <Select
                      name="job_type"
                      value={formData.job_type}
                      label="Job Type"
                      onChange={handleChange}
                      startAdornment={
                        <InputAdornment position="start">
                          <WorkIcon fontSize="small" />
                        </InputAdornment>
                      }
                    >
                      {JOB_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Status */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      label="Status"
                      onChange={handleChange}
                    >
                      {JOB_STATUSES.map((s) => (
                        <MenuItem key={s.value} value={s.value}>
                          {s.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Number of Positions */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Number of Positions"
                    name="position_number"
                    type="number"
                    value={formData.position_number}
                    onChange={handleChange}
                    placeholder="e.g. 3"
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                {/* Salary Range */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Salary Range"
                    name="salary_range"
                    value={formData.salary_range}
                    onChange={handleChange}
                    placeholder="e.g. $1,000 – $2,000"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoneyIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Location */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Phnom Penh, Remote, Siem Reap"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Closing Date */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Application Closing Date"
                    name="closing_date"
                    type="date"
                    value={formData.closing_date}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Job Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Job Description"
                    name="job_description"
                    value={formData.job_description}
                    onChange={handleChange}
                    multiline
                    rows={6}
                    placeholder="Describe responsibilities, requirements, benefits, company culture..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5, ml: 0.5 }}>
                          <DescriptionIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </form>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 4 }, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          disabled={loading}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          form="job-post-form"
          variant="contained"
          color="primary"
          sx={{ minWidth: 140 }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
              Posting...
            </>
          ) : (
            'Post Job'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}