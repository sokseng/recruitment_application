import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Avatar,
    Stack,
    Divider,
    Alert,
    alpha,
    CircularProgress,
    Chip,
    AlertTitle
} from '@mui/material';
import {
    WorkOutline as WorkIcon,
    CalendarToday,
    Description,
    Visibility,
    Cancel,
    ArrowForward as ArrowIcon,
    LocationOn,
} from '@mui/icons-material';
import api from "../services/api";
import { useTheme, useMediaQuery } from "@mui/material";

export default function MyApplicationsToCompanies() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                setLoading(true);
                setError(null);

                const { data } = await api.get('/candidate/me/applications');

                setApplications(data);
            } catch (err) {
                console.error('Fetch applications error:', err);
                if (err.response?.status === 404) {
                    setError('Candidate profile not found. Please complete your profile first.');
                } else {
                    setError('Unable to load applications. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    const handleViewDetails = (app) => {
        alert(`Opening details for "${app.job?.job_title || 'Job'}" at ${app.job?.company_name || 'Company'}`);
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this application?')) return;

        try {
            await api.delete(`/applications/${id}`);
            setApplications((prev) => prev.filter((app) => app.id !== id));
            alert('Application cancelled successfully');
        } catch (err) {
            alert('Failed to cancel application. Please try again.');
        }
    };

    if (loading) {
        return (
            <Box sx={{ py: 12, textAlign: 'center' }}>
                <CircularProgress size={56} thickness={4} />
                <Typography mt={4} variant="h6" color="text.secondary">
                    Loading your applications...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert
                severity="error"
                variant="outlined"
                icon={false}
                sx={{
                    m: { xs: 2, sm: 4 },
                    p: { xs: 3, sm: 4 },
                    borderRadius: 4,
                    borderWidth: '2px',
                    borderColor: alpha('#ef4444', 0.4),
                    bgcolor: alpha('#ef4444', 0.08),
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 10px 30px rgba(239, 68, 68, 0.12)',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(239,68,68,0) 100%)',
                        pointerEvents: 'none',
                    },
                    '& .MuiAlert-message': {
                        overflow: 'visible',
                    },
                }}
            >
                {/* Custom icon + title */}
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            bgcolor: alpha('#ef4444', 0.15),
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 0 8px ${alpha('#ef4444', 0.08)}`,
                        }}
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </Box>

                    <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                            color: '#ef4444',
                            letterSpacing: '-0.3px',
                        }}
                    >
                        Something went wrong
                    </Typography>
                </Stack>

                {/* Error message */}
                <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{
                        mb: 3,
                        lineHeight: 1.6,
                        opacity: 0.95,
                    }}
                >
                    An unexpected error occurred while loading your applications.
                </Typography>

                {/* Action button */}
                <Button
                    variant="contained"
                    color="error"
                    size="medium"
                    onClick={() => window.location.reload()}
                    sx={{
                        px: 5,
                        py: 1.2,
                        borderRadius: 50,
                        fontWeight: 600,
                        textTransform: 'none',
                        background: 'linear-gradient(90deg, #ef4444, #dc2626)',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            background: 'linear-gradient(90deg, #dc2626, #ef4444)',
                        },
                        transition: 'all 0.25s ease',
                    }}
                >
                    Try Again
                </Button>
            </Alert>
        );
    }

    if (applications.length === 0) {
        return (
            <Box
                sx={{
                    minHeight: '70vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 2,
                }}
            >
                <Box
                    sx={{
                        maxWidth: 420,
                        width: '100%',
                        textAlign: 'center',
                        p: { xs: 4, md: 5 },
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.background.paper, 0.75),
                        backdropFilter: 'blur(16px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            width: 80,                        // ← smaller icon container (was 90–100)
                            height: 80,
                            mx: 'auto',
                            mb: 3,                            // reduced margin
                            borderRadius: '50%',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.08)}`,
                            animation: 'pulse 2.8s infinite ease-in-out',
                            '@keyframes pulse': {
                                '0%, 100%': { boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.08)}` },
                                '50%': { boxShadow: `0 0 0 14px ${alpha(theme.palette.primary.main, 0)}` },
                            },
                        }}
                    >
                        <WorkIcon sx={{ fontSize: 40 }} />  {/* smaller icon */}
                    </Box>

                    <Typography
                        variant="h5"                        // ← slightly smaller heading (was h4)
                        fontWeight={800}
                        gutterBottom
                        sx={{
                            background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.3px',
                        }}
                    >
                        No applications yet
                    </Typography>

                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{
                            mb: 4,
                            maxWidth: 340,                    // tighter text width
                            mx: 'auto',
                            lineHeight: 1.6,
                            fontSize: '0.95rem',              // slightly smaller text
                        }}
                    >
                        Your journey starts here. Browse open positions and apply — your applications will appear in this space.
                    </Typography>

                    <Button
                        variant="contained"
                        size="medium"                       // ← smaller button (was large)
                        endIcon={<ArrowIcon />}
                        onClick={() => navigate('/')}
                        sx={{
                            px: 5,
                            py: 1.2,                          // reduced height
                            borderRadius: 50,
                            fontWeight: 700,
                            fontSize: '0.95rem',              // smaller text
                            textTransform: 'none',
                            boxShadow: '0 8px 24px rgba(99,102,241,0.2)',
                            '&:hover': {
                                boxShadow: '0 12px 32px rgba(99,102,241,0.3)',
                                transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.3s ease',
                        }}
                    >
                        Explore Jobs
                    </Button>

                    <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ mt: 4, display: 'block', fontSize: '0.8rem' }}
                    >
                        New opportunities added daily — don't miss out!
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ py: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 5, textAlign: 'center' }}>
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 4,
                        py: 1,
                        borderRadius: 50,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                            background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        My Applications
                    </Typography>

                    <Chip
                        label={applications.length}
                        size="small"
                        color="primary"
                        sx={{
                            fontWeight: 700,
                            minWidth: 32,
                            height: 24,
                            borderRadius: '12px',
                        }}
                    />
                </Box>
            </Box>

            <Grid container spacing={3}>
                {applications.map((app) => {
                    const job = app.job || {};
                    const isClosed = job.status === 'Closed';  

                    const accentColor = isClosed ? '#ef4444' : theme.palette.primary.main;

                    return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={app.pk_id} sx={{ width: isMobile ? '100%' : 'auto', px: 1 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    height: '100%',
                                    minWidth: 280,
                                    borderRadius: { xs: 3, sm: 4 },
                                    overflow: 'hidden',
                                    position: 'relative',
                                    bgcolor: alpha(theme.palette.background.paper, 0.65),
                                    backdropFilter: 'blur(16px)',
                                    border: `1px solid ${alpha(accentColor, 0.18)}`,
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    '&:hover': {
                                        transform: 'translateY(-12px) scale(1.03)',
                                        boxShadow: `0 24px 48px ${alpha(accentColor, 0.22)}`,
                                        borderColor: alpha(accentColor, 0.5),
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        height: 5,
                                        background: `linear-gradient(90deg, ${accentColor}, ${alpha(accentColor, 0.4)})`,
                                    }}
                                />

                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction="row" spacing={2.5} alignItems="center" mb={2}>
                                        <Avatar
                                            sx={{
                                                width: 56,
                                                height: 56,
                                                bgcolor: alpha(accentColor, 0.15),
                                                color: accentColor,
                                                boxShadow: `0 4px 12px ${alpha(accentColor, 0.2)}`,
                                                border: `2px solid ${alpha(accentColor, 0.3)}`,
                                            }}
                                        >
                                            <WorkIcon fontSize="medium" />
                                        </Avatar>

                                        <Box flexGrow={1}>
                                            <Typography
                                                variant="h6"
                                                fontWeight={700}
                                                lineHeight={1.2}
                                                sx={{
                                                    color: isClosed ? 'error.main' : 'text.primary',
                                                }}
                                            >
                                                {job.job_title || 'Job Title'}
                                            </Typography>

                                            <Typography variant="body2" color="text.secondary" fontWeight={500} mt={0.25}>
                                                {job.employer?.company_name || ''}
                                            </Typography>
                                        </Box>

                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                bgcolor: accentColor,
                                                boxShadow: `0 0 0 4px ${alpha(accentColor, 0.2)}`,
                                                transition: 'all 0.3s ease',
                                            }}
                                        />
                                    </Stack>

                                    <Divider sx={{ my: 2, opacity: 0.4 }} />

                                    <Stack spacing={1.5} sx={{ fontSize: '0.875rem' }}>
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <CalendarToday fontSize="small" sx={{ color: 'text.secondary' }} />
                                            <Typography color="text.secondary" fontWeight={500}>
                                                Applied: {new Date(app.applied_date).toLocaleDateString()}
                                            </Typography>
                                        </Stack>

                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <Description fontSize="small" sx={{ color: 'text.secondary' }} />
                                            <Typography fontWeight={600}>
                                                {job.salary_range || 'N/A'}$
                                            </Typography>
                                        </Stack>

                                        {/* Job type & level */}
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <WorkIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                            <Typography color="text.secondary">
                                                {job.job_type || 'N/A'} • {job.level || 'N/A'}
                                            </Typography>
                                        </Stack>

                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <LocationOn fontSize="small" sx={{ color: 'text.secondary' }} />
                                            <Typography color="text.secondary">
                                                {job.location || 'N/A'}
                                            </Typography>
                                        </Stack>

                                        {/* Closing date with red if job is Closed */}
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <CalendarToday fontSize="small" sx={{ color: isClosed ? 'error.main' : 'text.secondary' }} />
                                            <Typography color={isClosed ? 'error.main' : 'text.secondary'} fontWeight={isClosed ? 600 : 500}>
                                                Closes: {job.closing_date ? new Date(job.closing_date).toLocaleDateString() : 'No deadline'}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </CardContent>

                                <CardActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<Visibility fontSize="small" />}
                                        onClick={() => handleViewDetails(app)}
                                        sx={{
                                            borderRadius: 50,
                                            px: 3,
                                            py: 0.6,
                                            fontSize: '0.8125rem',
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            borderColor: alpha(accentColor, 0.4),
                                            color: accentColor,
                                            '&:hover': {
                                                borderColor: accentColor,
                                                bgcolor: alpha(accentColor, 0.08),
                                            },
                                        }}
                                    >
                                        View
                                    </Button>

                                    <Button
                                        variant="text"
                                        color="error"
                                        size="small"
                                        startIcon={<Cancel fontSize="small" />}
                                        onClick={() => handleCancel(app.pk_id || app.id)}
                                        sx={{
                                            fontSize: '0.8125rem',
                                            textTransform: 'none',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}