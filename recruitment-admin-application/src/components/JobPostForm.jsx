// src/components/JobPostForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  FormHelperText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

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

export default function JobPostForm() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    employer_id: '',
    job_title: '',
    job_type: 'Full-time',
    position_number: '',
    salary_range: '',
    location: '',
    job_description: '',
    closing_date: '',
    status: 'Open',
  });

  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch user's employers
  useEffect(() => {
    const fetchEmployers = async () => {
      try {
        const res = await api.get('/employer/');
        const data = res.data || [];
        setEmployers(data);

        // Auto-select if only one company
        if (data.length === 1) {
          setFormData((prev) => ({ ...prev, employer_id: data[0].pk_id }));
        }
      } catch (err) {
        setError('Failed to load your companies');
      } finally {
        setFormLoading(false);
      }
    };
    fetchEmployers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.employer_id) {
      setError('Please select a company');
      return;
    }
    if (!formData.job_title.trim()) {
      setError('Job title is required');
      return;
    }
    if (!formData.job_description.trim()) {
      setError('Job description is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        position_number: formData.position_number ? Number(formData.position_number) : undefined,
        closing_date: formData.closing_date || undefined,
        // posting_date is usually set by backend → we don't send it
      };

      await api.post('/jobs/', payload);

      setSuccess(true);
      setTimeout(() => {
        navigate('/employer/my-jobs'); // or wherever you want
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create job posting');
    } finally {
      setLoading(false);
    }
  };

  if (formLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
      <Paper
        elevation={4}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            py: 3,
            px: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold">
            Post a New Job
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
            Fill in the details to reach the right candidates
          </Typography>
        </Box>

        {/* Form Content */}
        <Box sx={{ p: { xs: 3, md: 5 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Job posted successfully! Redirecting...
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Company / Employer */}
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="employer-label">Company</InputLabel>
                  <Select
                    labelId="employer-label"
                    name="employer_id"
                    value={formData.employer_id}
                    label="Company"
                    onChange={handleChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="" disabled>
                      Select your company
                    </MenuItem>
                    {employers.map((emp) => (
                      <MenuItem key={emp.pk_id} value={emp.pk_id}>
                        {emp.company_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Job Title */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Job Title"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  placeholder="e.g. Senior Frontend Developer"
                  variant="outlined"
                />
              </Grid>

              {/* Job Type + Status */}
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
                  <FormHelperText>
                    {formData.status === 'Open'
                      ? 'Visible to candidates immediately'
                      : 'Hidden from public'}
                  </FormHelperText>
                </FormControl>
              </Grid>

              {/* Position Number + Salary */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Number of Positions"
                  name="position_number"
                  type="number"
                  value={formData.position_number}
                  onChange={handleChange}
                  inputProps={{ min: 1 }}
                  placeholder="e.g. 2"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Salary Range"
                  name="salary_range"
                  value={formData.salary_range}
                  onChange={handleChange}
                  placeholder="e.g. $800 – $1,500"
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
                  label="Job Location"
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

              {/* Submit Button */}
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{
                    py: 1.8,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderRadius: 2,
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1.5 }} color="inherit" />
                      Posting...
                    </>
                  ) : (
                    'Post Job'
                  )}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Paper>
    </Box>
  );
}