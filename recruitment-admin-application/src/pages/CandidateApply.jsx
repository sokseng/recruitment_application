import { useState, useEffect } from 'react';
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
    alpha,
    useTheme,
} from '@mui/material';
import {
    WorkOutline as WorkIcon,
    CalendarToday as CalendarIcon,
    Description as DescriptionIcon,
    Visibility as ViewIcon,
    Cancel as CancelIcon,
    ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useNavigate } from "react-router-dom";

// Mock data – replace with real API
const mockMyApplications = [];

export default function MyApplicationsToCompanies() {
    const navigate = useNavigate();
    const theme = useTheme();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setApplications(mockMyApplications);
            setLoading(false);
        }, 800);
    }, []);

    const handleViewDetails = (app) => {
        alert(`Opening full details for ${app.jobTitle} at ${app.company}`);
    };

    const handleWithdraw = (id) => {
        if (window.confirm('Are you sure you want to withdraw this application?')) {
            setApplications((prev) => prev.filter((app) => app.id !== id));
            alert('Application withdrawn successfully');
        }
    };

    if (loading) {
        return (
            <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography color="text.secondary">Loading your applications...</Typography>
            </Box>
        );
    }

    if (applications.length === 0) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: { xs: 3, md: 6 },
                    py: 8,
                }}
            >
                <Box
                    sx={{
                        maxWidth: 480,
                        width: '100%',
                        textAlign: 'center',
                        p: { xs: 4, md: 6 },
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.background.paper, 0.7),
                        backdropFilter: 'blur(16px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(168,85,247,0.04) 100%)',
                            zIndex: -1,
                        }}
                    />

                    <Box
                        sx={{
                            width: 90,
                            height: 90,
                            mx: 'auto',
                            mb: 4,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: 'primary.main',
                            boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.08)}`,
                            animation: 'pulse 2.5s infinite ease-in-out',
                            '@keyframes pulse': {
                                '0%, 100%': { boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.08)}` },
                                '50%': { boxShadow: `0 0 0 14px ${alpha(theme.palette.primary.main, 0)}` },
                            },
                        }}
                    >
                        <WorkIcon sx={{ fontSize: 48 }} />
                    </Box>

                    <Typography
                        variant="h5"
                        fontWeight={700}
                        gutterBottom
                        sx={{
                            background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.4px',
                        }}
                    >
                        No applications yet
                    </Typography>

                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ mb: 4, maxWidth: 360, mx: 'auto', lineHeight: 1.6 }}
                    >
                        Your journey starts here. Apply to exciting opportunities and watch your applications appear in this space.
                    </Typography>

                    <Button
                        variant="contained"
                        color="primary"
                        endIcon={<ArrowIcon />}
                        sx={{
                            px: 5,
                            py: 1.5,
                            borderRadius: 50,
                            fontWeight: 600,
                            textTransform: 'none',
                            boxShadow: '0 8px 24px rgba(99,102,241,0.25)',
                            '&:hover': {
                                boxShadow: '0 12px 32px rgba(99,102,241,0.35)',
                                transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.3s ease',
                        }}
                        onClick={() => navigate('/home')}
                    >
                        Browse Jobs Now
                    </Button>

                    <Typography variant="caption" color="text.disabled" sx={{ mt: 4, display: 'block' }}>
                        New opportunities are added daily — don't miss out!
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                py: { xs: 4, md: 6 },
                px: { xs: 2, md: 4 },
            }}
        >
            {/* Header */}
            <Box sx={{ mb: 5, textAlign: 'center' }}>
                <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{
                        background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.5px',
                    }}
                >
                    My Applications
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    All positions you've applied for
                </Typography>
            </Box>

            <Grid container spacing={2.5}>
                {applications.map((app) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={app.id}>
                        <Card
                            elevation={0}
                            sx={{
                                height: '100%',
                                borderRadius: 3,
                                overflow: 'hidden',
                                bgcolor: alpha(theme.palette.background.paper, 0.65),
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                transition: 'all 0.3s ease',
                                boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                                '&:hover': {
                                    transform: 'translateY(-6px)',
                                    boxShadow: '0 16px 40px rgba(99,102,241,0.18)',
                                    borderColor: alpha(theme.palette.primary.main, 0.3),
                                },
                            }}
                        >
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                                    <Avatar
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            bgcolor: alpha(theme.palette.primary.main, 0.15),
                                            color: 'primary.main',
                                        }}
                                    >
                                        <WorkIcon fontSize="medium" />
                                    </Avatar>

                                    <Box flexGrow={1}>
                                        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                                            {app.jobTitle}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                            {app.company}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Divider sx={{ my: 1.5, opacity: 0.4 }} />

                                <Stack spacing={1.2} sx={{ fontSize: '0.875rem' }}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CalendarIcon fontSize="small" color="action" />
                                        <Typography color="text.secondary">
                                            Applied: {new Date(app.appliedDate).toLocaleDateString()}
                                        </Typography>
                                    </Stack>

                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <DescriptionIcon fontSize="small" color="action" />
                                        <Typography fontWeight={500}>
                                            {app.salary} • {app.location}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </CardContent>

                            <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0, justifyContent: 'space-between' }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ViewIcon fontSize="small" />}
                                    onClick={() => handleViewDetails(app)}
                                    sx={{
                                        borderRadius: 20,
                                        px: 2.5,
                                        py: 0.5,
                                        fontSize: '0.8125rem',
                                        textTransform: 'none',
                                    }}
                                >
                                    View
                                </Button>

                                <Button
                                    variant="text"
                                    size="small"
                                    color="error"
                                    startIcon={<CancelIcon fontSize="small" />}
                                    onClick={() => handleWithdraw(app.id)}
                                    sx={{
                                        fontSize: '0.8125rem',
                                        textTransform: 'none',
                                    }}
                                >
                                    Withdraw
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}