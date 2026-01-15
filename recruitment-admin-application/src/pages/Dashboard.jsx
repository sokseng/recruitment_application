// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Stack,
  Divider,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import api from '../services/api';

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActiveJobs();
  }, []);

  const fetchActiveJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs/'); // GET /jobs/ returns active/open jobs
      setJobs(res.data || []);
      if (res.data?.length > 0) setSelectedJob(res.data[0]);
    } catch (err) {
      setError('Failed to load jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = (jobId) => {
    // TODO: implement favorite logic (call API if you have favorite endpoint)
    alert(`Favorited job ${jobId} (to be implemented)`);
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 10 }} />;

  if (error) {
    return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* LEFT - Job List */}
        <Grid item xs={12} md={5} lg={4}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Latest Jobs
          </Typography>

          <List sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
            {jobs.map((job) => (
              <ListItem
                key={job.pk_id}
                alignItems="flex-start"
                sx={{
                  bgcolor: selectedJob?.pk_id === job.pk_id ? 'action.selected' : 'transparent',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => setSelectedJob(job)}
              >
                <ListItemAvatar>
                  <Avatar
                    variant="rounded"
                    src={job.employer?.company_logo ? `/uploads/employers/${job.employer.company_logo}` : undefined}
                    alt={job.employer?.company_name}
                    sx={{ width: 56, height: 56, bgcolor: 'grey.300' }}
                  >
                    {job.employer?.company_name?.charAt(0) || '?'}
                  </Avatar>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight="medium">
                      {job.job_title}
                    </Typography>
                  }
                  secondary={
                    <Stack spacing={0.5} mt={0.5}>
                      <Typography variant="body2" color="text.primary">
                        {job.employer?.company_name || 'Company Name'}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {job.location || 'Phnom Penh'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          • {new Date(job.posting_date).toLocaleDateString('en-GB')}
                        </Typography>
                      </Stack>
                      {job.status === 'Open' && (
                        <Chip label="Top" color="warning" size="small" sx={{ width: 'fit-content' }} />
                      )}
                    </Stack>
                  }
                />

                <ListItemSecondaryAction>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavorite(job.pk_id);
                    }}
                    size="small"
                  >
                    <FavoriteBorderIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Grid>

        {/* RIGHT - Job Detail */}
        <Grid item xs={12} md={7} lg={8}>
          {selectedJob ? (
            <Card elevation={3}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <Avatar
                    variant="rounded"
                    src={selectedJob.employer?.company_logo ? `/uploads/employers/${selectedJob.employer.company_logo}` : undefined}
                    sx={{ width: 80, height: 80 }}
                  />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {selectedJob.job_title}
                    </Typography>
                    <Typography variant="subtitle1" color="primary">
                      {selectedJob.employer?.company_name}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack direction="row" spacing={4} mb={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Posting Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedJob.posting_date).toLocaleDateString('en-GB')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Closing Date
                    </Typography>
                    <Typography variant="body1">
                      {selectedJob.closing_date
                        ? new Date(selectedJob.closing_date).toLocaleDateString('en-GB')
                        : 'Open'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Job Type
                    </Typography>
                    <Typography variant="body1">{selectedJob.job_type}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1">{selectedJob.location || 'Phnom Penh'}</Typography>
                  </Box>
                </Stack>

                <Typography variant="h6" gutterBottom>
                  Job Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                  {selectedJob.job_description}
                </Typography>

                {/* You can add Company Info / Video & Photos tabs later */}
              </CardContent>
            </Card>
          ) : (
            <Alert severity="info">Select a job to view details</Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}