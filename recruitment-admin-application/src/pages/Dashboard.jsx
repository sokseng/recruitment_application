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
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import EmailIcon from '@mui/icons-material/Email';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (!jobs.length) return;

    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredJobs(jobs);
      return;
    }

    const filtered = jobs.filter((job) => {
      const title = job.job_title?.toLowerCase() || '';
      const company = job.employer?.company_name?.toLowerCase() || '';
      const location = job.location?.toLowerCase() || '';
      return title.includes(term) || company.includes(term) || location.includes(term);
    });

    setFilteredJobs(filtered);

    // If selected job is no longer in filtered list → clear selection
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

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
        overflow: 'hidden',
      }}
    >
      {/* Main content – list + detail */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
        }}
      >
        <Card
          sx={{
            width: { xs: '100%', md: 420 },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: { xs: '45vh', md: '100%' },
            border: "1px solid",
            borderColor: 'divider',
          }}
        >
          {/* Filters / Icons (example colored blocks) */}
          <Stack direction="row" spacing={1.5} p={2}>
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
                sx={{
                  bgcolor: 'white',
                  borderRadius: 1,
                  maxWidth: 500,
                  alignSelf: { xs: 'center', md: 'flex-start' },
                  width: { xs: '100%', sm: '80%', md: 420 },
                }}
              />
          </Stack>

          <Divider />

          {/* Scrollable job list */}
          <Box sx={{ flex: 1, overflowY: 'auto', }}>
            {filteredJobs.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                No jobs found matching your search
              </Box>
            ) : (
              filteredJobs.map((job) => {
                const active = selectedJob?.pk_id === job.pk_id;

                return (
                  <Box
                    key={job.pk_id}
                    onClick={() => setSelectedJob(job)}
                    sx={{
                      px: 2,
                      py: 2,
                      cursor: 'pointer',
                      bgcolor: active ? '#f0f7ff' : 'transparent',
                      borderLeft: active ? '4px solid #1976d2' : '4px solid transparent',
                      '&:hover': { bgcolor: '#f5f5f5' },
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
                          {new Date(job.posting_date).toLocaleDateString('en-GB')} ·{' '}
                          {job.location || 'Phnom Penh'}
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

        {/* RIGHT – JOB DETAIL */}
        <Card
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: { xs: '55vh', md: '100%' },
            border: "1px solid",
            borderColor: 'divider',
          }}
        >
          {selectedJob ? (
            <>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Job Description" />
                <Tab label="Company Info" />
                <Tab label="Video & Photos" />
              </Tabs>

              <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
                  <Avatar sx={{ width: 72, height: 72 }} />
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight={700}>
                      {selectedJob.job_title}
                    </Typography>
                    <Typography color="text.secondary">
                      {selectedJob.employer?.company_name}
                    </Typography>
                  </Box>

                  <Stack spacing={1} alignItems="flex-end">
                    <Button variant="contained" color="warning">
                      Direct Apply
                    </Button>
                    <IconButton>
                      <EmailIcon />
                    </IconButton>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Stack spacing={1.2} maxWidth={520}>
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

                  <Stack direction="row" spacing={2}>
                    <Typography fontWeight={600}>Ad Type:</Typography>
                    <Chip label="★★★★★ Top" color="warning" />
                  </Stack>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Typography sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                  {selectedJob.job_description}
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
      </Box>
    </Box>
  );
}