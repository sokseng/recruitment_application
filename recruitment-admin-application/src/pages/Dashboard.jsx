// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Avatar,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';
import TelegramIcon from '@mui/icons-material/Telegram';

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailMobile, setShowDetailMobile] = useState(false);
  const [openApplyDialog, setOpenApplyDialog] = useState(false)

  const baseURL = import.meta.env.VITE_API_BASE_URL;

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
            const companyName = job.employer?.company_name;
            const logoFilename = job.employer?.company_logo;
            return (
              <Box
                key={job.pk_id}
                onClick={() => handleSelectJob(job)}
                sx={{
                  px: 2,
                  py: 2,
                  cursor: 'pointer',
                  bgcolor: active ? 'action.selected' : 'transparent',
                  borderLeft: active ? '4px solid' : '4px solid transparent',
                  borderColor: active ? 'primary.main' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={logoFilename ? `${baseURL}/uploads/employers/${logoFilename}` : undefined}
                    alt={`${companyName} logo`}
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: 'primary.main',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                      {companyName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {job.job_title}
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {companyName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(job.posting_date).toLocaleDateString('en-GB')} · {job.location || 'Phnom Penh'}
                    </Typography>
                  </Box>
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
  const DetailContent = () => {
    const companyName = selectedJob?.employer?.company_name;
    const logoFilename = selectedJob?.employer?.company_logo;
    return(
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        {/* Mobile top bar */}
        {isMobile && (
          <AppBar position="sticky" color="default" elevation={1}>
            <Toolbar variant="dense"></Toolbar>
          </AppBar>
        )}

        {selectedJob ? (
          <Box sx={{ flex: 1, overflowY: 'auto', pb: { xs: 10, sm: 4 } }}>
            {/* Hero section – like screenshot */}
            <Box sx={{ p: 3, pb: 2, bgcolor: 'background.paper' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={logoFilename ? `${baseURL}/uploads/employers/${logoFilename}` : undefined}
                  alt={`${companyName} logo`}
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: 'primary.main',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {companyName.charAt(0).toUpperCase()}
                </Avatar>
                
                <Box flex={1}>
                  <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
                    {selectedJob.job_title}
                  </Typography>
                  <Typography variant="subtitle1" color="primary.main" fontWeight={500}>
                    {companyName}
                  </Typography>
                </Box>
              </Stack>

              {/* Quick info chips / rows */}
              <Stack spacing={1.5} sx={{ mt: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight={600} minWidth={110} color="text.secondary">
                    Posting Date:
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedJob.posting_date).toLocaleDateString('en-GB')}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight={600} minWidth={110} color="text.secondary">
                    Closing Date:
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedJob.closing_date).toLocaleDateString('en-GB')}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight={600} minWidth={110} color="text.secondary">
                    Job Type:
                  </Typography>
                  <Typography variant="body2">{selectedJob.job_type}</Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight={600} minWidth={110} color="text.secondary">
                    Location:
                  </Typography>
                  <Typography variant="body2">{selectedJob.location || 'Phnom Penh'}</Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight={600} minWidth={110} color="text.secondary">
                    Level:
                  </Typography>
                  <Typography variant="body2">{selectedJob.level}</Typography>
                </Stack>

                {selectedJob.salary_range && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" fontWeight={600} minWidth={110} color="text.secondary">
                      Salary:
                    </Typography>
                    <Typography variant="body2" color="success.main" fontWeight={600}>
                      {selectedJob.salary_range} $
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>

            <Divider />

            {/* Description */}
            <Box sx={{ p: 3 }}>
              <Typography variant="h7" fontWeight={700} gutterBottom>
                Job Description
              </Typography>

              <Box
                sx={{
                  '& .ql-editor': {
                    fontSize: '0.95rem',
                    lineHeight: 1.8,
                    color: 'text.primary',
                  },
                }}
              >
                <ReactQuill
                  theme="snow"
                  value={selectedJob.job_description}
                  readOnly
                  modules={{ toolbar: false }}
                />
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <Typography color="text.secondary">Select a job to view details</Typography>
          </Box>
        )}
        {/* Desktop Apply Action */}
        {!isMobile && (
          <Stack direction="row" justifyContent="flex-end" p={1}>
            <Button
              variant="contained"
              color="warning"
              startIcon={<EmailIcon />}
              onClick={() => setOpenApplyDialog(true)}
              size='small'
            >
              Direct Apply
            </Button>
          </Stack>
        )}

        {/* Floating / Sticky Apply button on mobile */}
        {isMobile && selectedJob && (
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              bgcolor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider',
              zIndex: 10,
            }}
          >
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                size="medium"
                onClick={handleBackToList}
              >
                Home
              </Button>

              <Button
                fullWidth
                variant="contained"
                color="warning"
                size="medium"
                onClick={() => setOpenApplyDialog(true)}
              >
                Direct Apply
              </Button>
            </Stack>
          </Box>
        )}
        {/* Apply via Dialog */}
        <Dialog
          open={openApplyDialog}
          onClose={() => setOpenApplyDialog(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Apply via</DialogTitle>

          <DialogContent>
            <Stack spacing={2} mt={1}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<EmailIcon />}
                onClick={() => {
                  setOpenApplyDialog(false)
                  window.location.href = `mailto:${selectedJob?.contactEmail}`
                }}
              >
                Email
              </Button>

              <Button
                variant="outlined"
                fullWidth
                startIcon={<TelegramIcon />}
                onClick={() => {
                  setOpenApplyDialog(false)
                  window.open(
                    `https://t.me/${selectedJob?.telegramUsername}`,
                  )
                }}
              >
                Telegram
              </Button>
            </Stack>
          </DialogContent>
        </Dialog>
      </Box>
  )};

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
            // width: { xs: '100%', md: 420 },
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
                  position: 'fixed',
                  inset: 0,
                  zIndex: showDetailMobile ? 20 : -1,
                  transform: showDetailMobile ? 'translateX(0)' : 'translateX(100%)',
                  transition: 'transform 0.3s ease-in-out',
                  bgcolor: 'background.default',
                  overflowY: 'auto',
                }
              : {
                borderRadius: 2,
                boxShadow: 1,
              }),
          }}
        >
          {DetailContent()}
        </Box>
      </Box>
    </Box>
  );
}