// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Avatar,
  Stack,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import EmailIcon from '@mui/icons-material/Email';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // xs + sm = mobile/tablet portrait

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailMobile, setShowDetailMobile] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (!jobs.length) return;

    const term = searchTerm.toLowerCase().trim();
    let filtered = jobs;

    if (term) {
      filtered = jobs.filter((job) => {
        const title = job.job_title?.toLowerCase() || '';
        const company = job.employer?.company_name?.toLowerCase() || '';
        const location = job.location?.toLowerCase() || '';
        return title.includes(term) || company.includes(term) || location.includes(term);
      });
    }

    setFilteredJobs(filtered);

    // Reset selected job if it's no longer in the filtered list
    if (selectedJob && !filtered.some(j => j.pk_id === selectedJob.pk_id)) {
      setSelectedJob(filtered[0] || null);
    }
  }, [searchTerm, jobs, selectedJob]);

  const loadJobs = async () => {
    try {
      const res = await api.get('/jobs/');
      const data = res.data || [];
      setJobs(data);
      setFilteredJobs(data);
      if (data.length) setSelectedJob(data[0]);
    } catch {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    if (isMobile) {
      setShowDetailMobile(true);
    }
  };

  const handleBackToList = () => {
    setShowDetailMobile(false);
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, height: '100%' }}>
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
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={1.5} p={2} flexShrink={0}>
        <TextField
          size="small"
          placeholder="Search jobs, companies, locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          fullWidth
          sx={{ bgcolor: 'InfoBackground', borderRadius: 1 }}
        />
      </Stack>

      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {filteredJobs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            No jobs found matching your search
          </Box>
        ) : (
          filteredJobs.map((job) => {
            const active = selectedJob?.pk_id === job.pk_id;
            return (
              <Box
                key={job.pk_id}
                onClick={() => handleSelectJob(job)}
                sx={{
                  px: 2,
                  py: 2.5,
                  cursor: 'pointer',
                  bgcolor: active ? 'action.selected' : 'transparent',
                  borderLeft: active ? '4px solid' : '4px solid transparent',
                  borderColor: active ? 'primary.main' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={
                      job.employer?.company_logo
                        ? `/uploads/employers/${job.employer.company_logo}`
                        : undefined
                    }
                    sx={{ width: 48, height: 48 }}
                  />
                  <Box flex={1}>
                    <Typography fontWeight={600}>{job.job_title}</Typography>
                    <Typography variant="body2">{job.employer?.company_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(job.posting_date).toLocaleDateString('en-GB')} · {job.location || 'Phnom Penh'}
                    </Typography>
                    {job.status === 'Open' && (
                      <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
                        Top
                      </Typography>
                    )}
                  </Box>
                  <IconButton size="small">
                    <FavoriteBorderIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            );
          })
        )}
      </Box>
    </Card>
  );

  // ────────────────────────────────────────────────
  // Job Detail Content (shared, but with mobile back bar)
  // ────────────────────────────────────────────────
  const DetailContent = () => (
    <Card
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {isMobile && (
        <AppBar position="static" color="default" elevation={0}>
          <Toolbar variant="dense">
            <IconButton edge="start" onClick={handleBackToList} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Job Details
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {selectedJob ? (
        <>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, minHeight: 0 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Avatar sx={{ width: 72, height: 72 }} />
              <Box flex={1}>
                <Typography variant="h6" fontWeight={700}>
                  {selectedJob.job_title}
                </Typography>
                <Typography color="text.secondary">
                  {selectedJob.employer?.company_name}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button variant="contained" color="warning">
                  Direct Apply
                </Button>

                <IconButton color="primary">
                  <EmailIcon />
                </IconButton>
              </Stack>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Stack spacing={1.5} sx={{ mb: 4, maxWidth: 600 }}>
              {[
                ['Posting Date', selectedJob.posting_date],
                ['Closing Date', selectedJob.closing_date],
                ['Salary Range', selectedJob.salary_range || '$700–800'],
                ['Job Type', selectedJob.job_type],
                ['Seniority Level', selectedJob.seniority || 'Experienced Level'],
                ['Job Location', selectedJob.location || 'Phnom Penh'],
              ].map(([label, value]) => (
                <Stack direction="row" key={label} spacing={2}>
                  <Typography fontWeight={600} minWidth={140}>
                    {label}:
                  </Typography>
                  <Typography>
                    {label.includes('Date')
                      ? new Date(value).toLocaleDateString('en-GB')
                      : value}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
              {selectedJob.job_description || 'No description available.'}
            </Typography>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Alert severity="info">Select a job to view details</Alert>
        </Box>
      )}
    </Card>
  );

  // ────────────────────────────────────────────────
  // Main Layout
  // ────────────────────────────────────────────────
  return (
    <Box
      sx={{
        height: 'calc(103vh - 120px)', // ← adjust this value based on your actual header height
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        gap: 2,
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          minHeight: 0,
        }}
      >
        {/* Job List – hidden on mobile when detail is open */}
        <Box
          sx={{
            width: { xs: '100%', md: 420 },
            flexShrink: 0,
            display: isMobile && showDetailMobile ? 'none' : 'block',
          }}
        >
          {ListContent()}
        </Box>

        {/* Job Detail – full-screen on mobile when selected */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            ...(isMobile
              ? {
                  position: 'relative',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 10,
                  transform: showDetailMobile ? 'translateX(0)' : 'translateX(100%)',
                  transition: 'transform 0.3s ease-in-out',
                  bgcolor: 'background.default',
                }
              : {}),
          }}
        >
          {DetailContent()}
        </Box>
      </Box>
    </Box>
  );
}