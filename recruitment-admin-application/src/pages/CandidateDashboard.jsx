import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';

export default function CandidateDashboard() {
  const profileCompletion = 90;

  const profileSections = [
    { label: 'Personal Details', value: 20, completed: true },
    { label: 'Work History', value: 35, completed: true },
    { label: 'Education', value: 15, completed: true },
    { label: 'Skills (x3)', value: 15, completed: false },
    { label: 'About Yourself', value: 10, completed: true },
    { label: 'Languages', value: 3, completed: false },
    { label: 'References', value: 2, completed: false },
  ];

  const recommendedJobs = [
    {
      title: 'Assistant Manager, IT Business Analyst',
      company: 'Dynamic Advanced Group Co., Ltd',
      location: 'Phnom Penh • IT Hardware, Software',
      posted: '',
      salary: '',
      buttonText: 'Apply Now',
      logoColor: '#6366f1',
    },
    {
      title: 'Assistant Manager, IT Security Compliance',
      company: 'Woori Bank Cambodia',
      location: 'Phnom Penh • IT Hardware, Software',
      posted: '19.01.2026',
      salary: 'Negotiable',
      logoColor: '#3b82f6',
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        overflowY: 'auto',
      }}
    >
      <Grid
        container
        spacing={{ xs: 2, md: 2 }}
        direction={{ xs: 'column-reverse', lg: 'row' }}
      >
        {/* LEFT - Profile */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: '#5b21b6',
              color: 'white',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
            }}
          >
            <CardContent
              sx={{
                p: { xs: 3, sm: 4, lg: 5 },
                textAlign: 'center',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 100, md: 120 },
                  height: { xs: 100, md: 120 },
                  mx: 'auto',
                  bgcolor: 'white',
                  color: '#5b21b6',
                  fontSize: { xs: 48, md: 60 },
                  fontWeight: 'bold',
                  mb: 2,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                }}
              >
                B
              </Avatar>

              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Bro Berk
              </Typography>

              <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                081558087
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 3 }}>
                nim.rathana9999@gmail.com
              </Typography>

              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="Open to Work opportunity" color="success" size="small" />
                <Chip label="Yes" color="primary" size="small" />
              </Box>

              <Divider sx={{ bgcolor: 'rgba(255,255,255,0.25)', my: 1 }} />

              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3, alignSelf: 'center' }}>
                <CircularProgress
                  variant="determinate"
                  value={profileCompletion}
                  size={130}
                  thickness={5}
                  sx={{ color: '#fbbf24' }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4" fontWeight="bold" color="#fbbf24">
                    {profileCompletion}%
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" sx={{ mb: 2 }}>
                Update your profile to get more jobs
              </Typography>

              <List dense disablePadding sx={{ mb: 2 }}>
                {profileSections.map((item) => (
                  <ListItem key={item.label} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {item.completed ? (
                        <CheckCircleIcon sx={{ color: '#4ade80' }} />
                      ) : (
                        <RadioButtonUncheckedIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${item.label} • ${item.value}%`}
                      primaryTypographyProps={{ fontSize: '0.95rem' }}
                    />
                  </ListItem>
                ))}
              </List>

              <Button
                variant="contained"
                fullWidth
                sx={{
                  mt: 'auto',
                  bgcolor: '#7c3aed',
                  '&:hover': { bgcolor: '#6d28d9' },
                  boxShadow: '0 6px 18px rgba(124,58,237,0.3)',
                }}
              >
                Update Your Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT - Main content */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2 } }}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)'
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  My Applications (last 12 months)
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  Assistant Penh • IT Support Engineer
                </Typography>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)'
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Jobs You Will Love
                </Typography>

                <Box sx={{ mt: 3 }}>
                  {recommendedJobs.map((job, index) => (
                    <Card
                      key={index}
                      variant="outlined"
                      sx={{
                        mb: 2,
                        borderRadius: 2,
                        borderColor: 'rgba(0,0,0,0.08)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                        transition: 'all 0.25s ease',
                        '&:hover': {
                          borderColor: '#7c3aed',
                          boxShadow: '0 12px 40px rgba(124,58,237,0.15)',
                          transform: 'translateY(-5px)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            justifyContent: 'space-between',
                            gap: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                            <Avatar
                              sx={{
                                bgcolor: job.logoColor,
                                width: 50,
                                height: 50,
                                fontWeight: 'bold',
                              }}
                            >
                              {job.company.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {job.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {job.company}
                              </Typography>
                            </Box>
                          </Box>

                          <Button
                            variant="contained"
                            sx={{
                              bgcolor: '#7c3aed',
                              minWidth: { xs: '100%', sm: 'auto' },
                              '&:hover': { bgcolor: '#6d28d9' },
                              borderRadius: 20,
                              px: 4,
                              textTransform: 'none',
                              boxShadow: '0 4px 12px rgba(124,58,237,0.25)',
                            }}
                          >
                            {job.buttonText || 'Apply Now'}
                          </Button>
                        </Box>

                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                          <Chip icon={<LocationOnIcon />} label={job.location} size="small" variant="outlined" />
                          {job.posted && (
                            <Chip icon={<CalendarTodayIcon />} label={job.posted} size="small" variant="outlined" />
                          )}
                          {job.salary && (
                            <Chip
                              icon={<MonetizationOnIcon />}
                              label={job.salary}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button variant="outlined" color="primary" sx={{ px: 4 }}>
                    View More Jobs
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}