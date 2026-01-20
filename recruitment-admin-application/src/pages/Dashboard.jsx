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
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';

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

  const [typeFilter, setTypeFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (!jobs.length) return;

    const term = searchTerm.toLowerCase().trim();

    const filtered = jobs.filter((job) => {
      const title = job.job_title?.toLowerCase() || "";
      const company = job.employer?.company_name?.toLowerCase() || "";
      const location = job.location?.toLowerCase() || "";

      const keywordMatch =
        !term ||
        title.includes(term) ||
        company.includes(term) ||
        location.includes(term);

      const typeMatch = typeFilter === "All" || job.job_type === typeFilter;

      const levelMatch = levelFilter === "All" || job.level === levelFilter;

      const locationMatch =
        locationFilter === "All" || job.location === locationFilter;

      return keywordMatch && typeMatch && levelMatch && locationMatch;
    });

    setFilteredJobs(filtered);

    if (selectedJob && !filtered.some((j) => j.pk_id === selectedJob.pk_id)) {
      setSelectedJob(filtered[0] || null);
    }
  }, [searchTerm, typeFilter, levelFilter, locationFilter, jobs, selectedJob]);

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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
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
                  px: 1,
                  py: { xs: 1, sm: 1.15 },               
                  cursor: "pointer",
                  bgcolor: active ? "action.selected" : "transparent",
                  borderLeft: active ? "3px solid" : "3px solid transparent",
                  borderColor: active ? "primary.main" : "transparent",
                  borderBottom: "1px solid",
                  borderBottomColor: "divider",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={logoFilename ? `${baseURL}/uploads/employers/${logoFilename}` : undefined}
                    alt={`${companyName} logo`}
                    sx={{
                      width: { xs: 32, sm: 36 },
                      height: { xs: 32, sm: 36 },
                      fontSize: "0.9rem",
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                      {companyName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={600}>
                      {job.job_title}
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      Company: {companyName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Posted: {job.posting_date ? new Date(job.posting_date).toISOString().split("T")[0] : "—"}
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
                    width: { xs: 40, sm: 50 },
                    height: { xs: 40, sm: 50 },
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {companyName.charAt(0).toUpperCase()}
                </Avatar>
                
                <Box flex={1}>
                  <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
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
                    {selectedJob.posting_date ? new Date(selectedJob.posting_date).toISOString().split("T")[0] : "—"}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight={600} minWidth={110} color="text.secondary">
                    Closing Date:
                  </Typography>
                  <Typography variant="body2">
                    {selectedJob.closing_date ? new Date(selectedJob.closing_date).toISOString().split("T")[0] : "—"}
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

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" fontWeight={600} minWidth={110} color="text.secondary">
                      Salary:
                    </Typography>
                    <Typography variant="body2" color="success.main" fontWeight={600}>
                      {selectedJob.salary_range ? `${selectedJob.salary_range}$` : "Negotiable"}
                    </Typography>
                  </Stack>
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
              <br />
              <Typography variant="h7" fontWeight={700} gutterBottom>
                Requirements
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
                  value={selectedJob.experience_required}
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

        {/* Floating / Sticky Apply button on mobile */}
        {isMobile && selectedJob && (
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              p: 1,
              bgcolor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider',
              zIndex: 10,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Stack direction="row" spacing={1}>
              <Button
                // fullWidth
                variant="outlined"
                size="small"
                onClick={handleBackToList}
              >
                Home
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
  )};

  // ────────────────────────────────────────────────
  // Main Layout
  // ────────────────────────────────────────────────
  return (
      <Box
        sx={{
          height: "calc(103vh - 120px)",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          gap: 2,
        }}
      >
        <Card
          sx={{
            p: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.25}
            alignItems="stretch"
          >
            {/* Search */}
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
            />

            {/* Job Type */}
            <TextField
              select
              size="small"
              label="Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Full-time">Full-time</MenuItem>
              <MenuItem value="Part-time">Part-time</MenuItem>
              <MenuItem value="Contract">Contract</MenuItem>
              <MenuItem value="Internship">Internship</MenuItem>
            </TextField>

            {/* Location */}
            <TextField
              select
              size="small"
              label="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="All">All</MenuItem>
              {[...new Set(jobs.map((j) => j.location).filter(Boolean))].map(
                (loc) => (
                  <MenuItem key={loc} value={loc}>
                    {loc}
                  </MenuItem>
                ),
              )}
            </TextField>

            {/* Reset */}
            <Button
              variant="outlined"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("All");
                setLevelFilter("All");
                setLocationFilter("All");
              }}
            >
              Reset
            </Button>
          </Stack>
        </Card>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            minHeight: 0,
          }}
        >
          {/* Job List – hidden on mobile when detail is open */}

          <Box
            sx={{
              width: { xs: '100%', md: 400 },
              flexShrink: 0,
              display: isMobile && showDetailMobile ? "none" : "block",
            }}
          >
            {ListContent()}
          </Box>

          {/* Job Detail – full-screen on mobile when selected */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              ...(isMobile
                ? {
                    position: "fixed",
                    inset: 0,
                    zIndex: showDetailMobile ? 20 : -1,
                    transform: showDetailMobile
                      ? "translateX(0)"
                      : "translateX(100%)",
                    transition: "transform 0.3s ease-in-out",
                    bgcolor: "background.default",
                    overflowY: "auto",
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