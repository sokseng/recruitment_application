import {
    ArrowForward as ArrowIcon,
    CalendarToday,
    Cancel,
    CheckCircle,
    Close as CloseIcon,
    HourglassEmpty,
    LocationOn,
    Search as SearchIcon,
    StarBorder,
    Visibility,
    WarningAmber as WarningAmberIcon,
    WorkOutline as WorkIcon,
} from '@mui/icons-material';
import {
    Alert,
    alpha,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { isValidElement, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../services/api";
import { useTranslation } from 'react-i18next';

// Reusable InfoRow
function InfoRow({ icon, label, value, color = 'inherit', fontWeight = 600 }) {
    const { t } = useTranslation();
    let tooltipText = '';

    if (typeof value === 'string' || typeof value === 'number') {
        tooltipText = value;
    } else if (isValidElement(value) && value.props?.label) {
        tooltipText = value.props.label;
    }

    return (
        <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ color: 'text.secondary', lineHeight: 0 }}>{icon}</Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {t(label)}:
            </Typography>
            <Box flexGrow={1} />
            <Tooltip title={tooltipText} placement="top" arrow>
                <Typography
                    component="span"
                    variant="body2"
                    color={color}
                    fontWeight={fontWeight}
                    sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        display: 'inline-block',
                        verticalAlign: 'middle',
                    }}
                >
                    {value}
                </Typography>
            </Tooltip>
        </Stack>
    );
}

export default function MyApplicationsToCompanies() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { t } = useTranslation();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [cancelDialog, setCancelDialog] = useState({
        open: false,
        applicationId: null,
        loading: false,
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });
    const [cancelReason, setCancelReason] = useState('');

    const statusTabs = [
        { label: t('all'), value: 'all', color: 'grey' },
        { label: t('pending'), value: 'pending', color: 'warning' },
        { label: t('shortlisted'), value: 'shortlisted', color: 'info' },
        { label: t('accepted'), value: 'accepted', color: 'success' },
        { label: t('rejected'), value: 'rejected', color: 'error' },
        { label: t('cancelled'), value: 'cancelled', color: 'grey' },
        { label: t('closed'), value: 'closed', color: 'error' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/candidate/me/applications');
                setApplications(data || []);
            } catch (err) {
                console.error(err);
                setError(
                    err.response?.status === 404
                        ? t('complete_profile_first')
                        : t('failed_to_load_applications')
                );
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getComputedStatus = (app) => {
        const job = app.job || {};
        const today = new Date();

        const isClosed =
            job.status === 'Closed' ||
            (job.closing_date && new Date(job.closing_date) < today);

        const status = (app.application_status || '').toLowerCase();

        return {
            status,
            isCancelled: !!app.cancelled,
            isClosed,
        };
    };

    const getStatusConfig = (status, isClosed = false) => {
        const s = (status || '').toLowerCase();
        const map = {
            accepted: { color: 'success', icon: <CheckCircle fontSize="small" />, label: t('accepted') },
            rejected: { color: 'error', icon: <Cancel fontSize="small" />, label: t('rejected') },
            shortlisted: { color: 'info', icon: <StarBorder fontSize="small" />, label: t('shortlisted') },
            pending: { color: 'warning', icon: <HourglassEmpty fontSize="small" />, label: t('pending') },
            cancelled: { color: 'default', icon: <CloseIcon fontSize="small" />, label: t('cancelled') },
        };

        if (isClosed && !['accepted', 'rejected', 'cancelled'].includes(s)) {
            return { color: 'error', icon: <CloseIcon fontSize="small" />, label: t('closed') };
        }

        return map[s] || { color: 'default', icon: null, label: status || t('unknown') };
    };

    const counts = useMemo(() => {
        const c = {
            all: applications.length,
            pending: 0,
            shortlisted: 0,
            accepted: 0,
            rejected: 0,
            cancelled: 0,
            closed: 0,
        };

        applications.forEach((app) => {
            const { status, isCancelled, isClosed } = getComputedStatus(app);

            if (!isClosed && status in c) c[status] += 1;
            if (isCancelled) c.cancelled += 1;
            if (isClosed) c.closed += 1;
        });

        return c;
    }, [applications]);

    const filteredApplications = useMemo(() => {
        let list = applications;

        if (tabValue !== 0) {
            const target = statusTabs[tabValue].value.toLowerCase();

            list = list.filter((app) => {
                const { status, isCancelled, isClosed } = getComputedStatus(app);

                if (target === 'closed') return isClosed;
                if (target === 'cancelled') return isCancelled;

                return !isClosed && status === target;
            });
        }

        if (searchText.trim()) {
            const term = searchText.toLowerCase().trim();

            list = list.filter((app) => {
                const job = app.job || {};
                const { status, isCancelled, isClosed } = getComputedStatus(app);

                const searchableTexts = [
                    job.job_title || '',
                    job.employer?.company_name || '',
                    job.location || '',
                    job.job_type || '',
                    job.level || '',
                    job.salary_range || '',
                    status,
                    isCancelled ? 'cancelled' : '',
                    isClosed ? 'closed' : '',
                    app.applied_date ? new Date(app.applied_date).toLocaleDateString() : '',
                    job.closing_date ? new Date(job.closing_date).toLocaleDateString() : '',
                ];

                return searchableTexts.join(' ').toLowerCase().includes(term);
            });
        }

        return list;
    }, [applications, tabValue, searchText]);

    const handleChangeTab = (_, newValue) => setTabValue(newValue);

    const getAccentColor = (app) => {
        const today = new Date();
        const job = app.job || {};
        const isClosed = job.status === 'Closed' || (job.closing_date && new Date(job.closing_date) < today);

        if (app.cancelled) return theme.palette.grey[600];
        if (isClosed) return theme.palette.error.main;
        const status = (app.application_status || '').toLowerCase();
        if (status === 'accepted') return theme.palette.success.main;
        if (status === 'rejected') return theme.palette.error.main;
        if (status === 'shortlisted') return theme.palette.info.main;
        if (status === 'pending') return theme.palette.warning.main;
        return theme.palette.primary.main;
    };

    const handleOpenCancelDialog = (id) => {
        setCancelDialog({ open: true, applicationId: id, loading: false });
        setCancelReason('');
    };

    const handleCloseCancelDialog = () => {
        if (cancelDialog.loading) return;
        setCancelDialog({ open: false, applicationId: null, loading: false });
        setCancelReason('');
    };

    const handleConfirmCancel = async () => {
        const id = cancelDialog.applicationId;
        if (!id) return;

        setCancelDialog((prev) => ({ ...prev, loading: true }));

        try {
            await api.put(`/candidate/me/applications/${id}/cancel`, {
                reason: cancelReason.trim() || undefined,
            });

            setApplications((prev) => prev.map((app) =>
                (app.pk_id || app.id) === id ? { ...app, cancelled: true } : app
            ));

            setSnackbar({
                open: true,
                message: t('application_cancelled_success'),
                severity: 'success',
            });

            handleCloseCancelDialog();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.response?.data?.detail || t('cancel_failed'),
                severity: 'error',
            });
            setCancelDialog((prev) => ({ ...prev, loading: false }));
        }
    };

    if (loading) {
        return (
            <Box sx={{ py: 10, textAlign: 'center' }}>
                <CircularProgress size={60} thickness={4} />
                <Typography mt={3} variant="h6" color="text.secondary">
                    {t('loading_applications')}
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
                        {t('something_went_wrong')}
                    </Typography>
                </Stack>

                <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{
                        mb: 3,
                        lineHeight: 1.6,
                        opacity: 0.95,
                    }}
                >
                    {error}
                </Typography>

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
                    {t('try_again')}
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
                            width: 80,
                            height: 80,
                            mx: 'auto',
                            mb: 3,
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
                        <WorkIcon sx={{ fontSize: 40 }} />
                    </Box>

                    <Typography
                        variant="h5"
                        fontWeight={800}
                        gutterBottom
                        sx={{
                            background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.3px',
                        }}
                    >
                        {t('no_applications_yet')}
                    </Typography>

                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{
                            mb: 4,
                            maxWidth: 340,
                            mx: 'auto',
                            lineHeight: 1.6,
                            fontSize: '0.95rem',
                        }}
                    >
                        {t('new_opportunities_added_daily')}
                    </Typography>

                    <Button
                        variant="contained"
                        size="medium"
                        endIcon={<ArrowIcon />}
                        onClick={() => navigate('/')}
                        sx={{
                            px: 5,
                            py: 1.2,
                            borderRadius: 50,
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            textTransform: 'none',
                            boxShadow: '0 8px 24px rgba(99,102,241,0.2)',
                            '&:hover': {
                                boxShadow: '0 12px 32px rgba(99,102,241,0.3)',
                                transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {t('explore_jobs')}
                    </Button>

                    <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ mt: 4, display: 'block', fontSize: '0.8rem' }}
                    >
                        {t('new_opportunities_added')}
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ px: { xs: 1.5 } }}>
            <Stack
                spacing={1}
                sx={{
                    mb: 2,
                    position: 'sticky',
                    top: 10,
                    zIndex: 20,
                    py: 1,
                }}
            >
                <TextField
                    fullWidth
                    size='small'
                    variant="outlined"
                    placeholder={t('search')}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: 3 },
                    }}
                />

                <Tabs
                    value={tabValue}
                    onChange={handleChangeTab}
                    variant={isMobile ? "scrollable" : "fullWidth"}
                    scrollButtons={isMobile ? "auto" : false}
                    allowScrollButtonsMobile
                    TabIndicatorProps={{ style: { display: 'none' } }}
                    sx={{
                        minHeight: 0,
                        borderRadius: '16px',
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        backdropFilter: 'blur(12px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                        boxShadow: `0 6px 20px ${alpha(theme.palette.common.black, 0.08)}`,
                        overflow: 'hidden',
                        WebkitOverflowScrolling: 'touch',
                        p: 0.75,
                        '& .MuiTabs-flexContainer': { gap: { xs: 0.5, sm: 1 } },
                        '& .MuiTab-root': {
                            minHeight: 42,
                            minWidth: { xs: 90, sm: 110 },
                            px: { xs: 2, sm: 3 },
                            py: 1,
                            mx: 0.25,
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontSize: { xs: '0.875rem', sm: '0.95rem' },
                            fontWeight: 600,
                            color: 'text.secondary',
                            transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.07),
                                color: theme.palette.primary.main,
                            },
                            '&.Mui-selected': {
                                background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                                color: '#ffffff !important',
                                fontWeight: 700,
                                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
                                transform: 'translateY(-1px)',
                            },
                        },
                        '& .MuiTabs-scrollButtons': {
                            color: theme.palette.primary.main,
                            opacity: 0.7,
                            '&:hover': { opacity: 1 },
                        },
                    }}
                >
                    {statusTabs.map((tab) => {
                        const count = counts[tab.value] || 0;
                        const isSelected = tabValue === statusTabs.findIndex(t => t.value === tab.value);

                        return (
                            <Tab
                                key={tab.value}
                                disableRipple
                                label={
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Box
                                            component="span"
                                            sx={{
                                                background: isSelected ? 'linear-gradient(90deg, #ffffff, #f0f0ff)' : 'none',
                                                WebkitBackgroundClip: isSelected ? 'text' : 'none',
                                                WebkitTextFillColor: isSelected ? 'transparent' : 'inherit',
                                            }}
                                        >
                                            {tab.label}
                                        </Box>
                                        {count > 0 && (
                                            <Chip
                                                label={count}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    minWidth: 20,
                                                    fontSize: '0.72rem',
                                                    fontWeight: 700,
                                                    borderRadius: '10px',
                                                    px: 1,
                                                    backgroundColor: isSelected
                                                        ? 'rgba(255,255,255,0.28)'
                                                        : alpha(
                                                            theme.palette[tab.color === 'grey' ? 'primary' : tab.color].main,
                                                            isSelected ? 0.25 : 0.12
                                                        ),
                                                    color: isSelected ? '#fff' : theme.palette[tab.color === 'grey' ? 'primary' : tab.color].main,
                                                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
                                                    transition: 'all 0.25s ease',
                                                    border: isSelected ? '1px solid rgba(255,255,255,0.4)' : 'none',
                                                }}
                                            />
                                        )}
                                    </Stack>
                                }
                            />
                        );
                    })}
                </Tabs>
            </Stack>

            <Grid container spacing={2}>
                {filteredApplications.length === 0 && !loading ? (
                    <Grid item xs={12} sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                overflow: 'hidden',
                                bgcolor: alpha(theme.palette.background.paper, 0.7),
                                backdropFilter: 'blur(14px)',
                                border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
                                minHeight: 340,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                p: { xs: 5, sm: 7 },
                                textAlign: 'center',
                            }}
                        >
                            <Box sx={{ height: 5, width: '80px', bgcolor: alpha(theme.palette.primary.main, 0.4), borderRadius: '0 0 4px 4px', mb: 4 }} />

                            <Stack spacing={3} alignItems="center">
                                <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {searchText.trim() ? <SearchIcon sx={{ fontSize: 40 }} /> : <WorkIcon sx={{ fontSize: 40 }} />}
                                </Box>

                                <Typography variant="h6" fontWeight={600}>
                                    {searchText.trim() ? t('nothing_matches_search') : t('no_applications_here')}
                                </Typography>
                                {(tabValue === 0 || searchText.trim()) && (
                                    <Button
                                        variant="contained"
                                        size="medium"
                                        disableElevation
                                        onClick={() => searchText.trim() ? setSearchText('') : navigate('/')}
                                        sx={{ mt: 2, borderRadius: 50, px: 5 }}
                                    >
                                        {searchText.trim() ? t('clear_search') : t('find_jobs')}
                                    </Button>
                                )}
                            </Stack>
                        </Card>
                    </Grid>
                ) : (filteredApplications.map((app) => {
                    const job = app.job || {};
                    const today = new Date();
                    const isClosed = job.status === 'Closed' || (job.closing_date && new Date(job.closing_date) < today);
                    const accent = getAccentColor(app);
                    const statusCfg = getStatusConfig(app.application_status, isClosed);

                    return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={app.pk_id || app.id} sx={{ width: '100%', maxWidth: 400, minWidth: 320, mx: isMobile ? 'auto' : 0 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    height: '100%',
                                    width: '100%',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    bgcolor: alpha(theme.palette.background.paper, 0.7),
                                    backdropFilter: 'blur(12px)',
                                    border: `1px solid ${alpha(accent, 0.2)}`,
                                    transition: 'all 0.36s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    '&:hover': {
                                        transform: 'translateY(-10px)',
                                        boxShadow: `0 20px 40px ${alpha(accent, 0.18)}`,
                                        borderColor: alpha(accent, 0.45),
                                    },
                                }}
                            >
                                <Box sx={{ height: 6, background: `linear-gradient(90deg, ${accent}, ${alpha(accent, 0.4)})` }} />

                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                                        <Avatar
                                            sx={{
                                                width: 54,
                                                height: 54,
                                                bgcolor: alpha(accent, 0.12),
                                                color: accent,
                                                border: `2px solid ${alpha(accent, 0.3)}`,
                                                flexShrink: 0,
                                            }}
                                        >
                                            <WorkIcon />
                                        </Avatar>

                                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                            <Tooltip title={job.job_title || '—'} placement="top" arrow>
                                                <Typography variant="h6" fontWeight={700} lineHeight={1.2} noWrap>
                                                    {job.job_title || '—'}
                                                </Typography>
                                            </Tooltip>
                                            <Tooltip title={job.employer?.company_name || '—'} placement="top" arrow>
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {job.employer?.company_name || '—'}
                                                </Typography>
                                            </Tooltip>
                                        </Box>

                                        {app.cancelled && (
                                            <Tooltip title={t('cancelled')} placement="top" arrow>
                                                <Chip
                                                    label={t('cancelled')}
                                                    size="small"
                                                    color="default"
                                                    sx={{
                                                        maxWidth: 100,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                />
                                            </Tooltip>
                                        )}
                                    </Stack>

                                    <Divider sx={{ my: 2, opacity: 0.5 }} />

                                    <Stack spacing={1.4} sx={{ fontSize: '0.9rem' }}>
                                        <InfoRow
                                            icon={<CalendarToday fontSize="small" />}
                                            label="applied"
                                            value={new Date(app.applied_date).toLocaleDateString()}
                                        />
                                        <InfoRow
                                            icon={<LocationOn fontSize="small" />}
                                            label="location"
                                            value={job.location || '—'}
                                        />
                                        <InfoRow
                                            icon={<WorkIcon fontSize="small" />}
                                            label="type_level"
                                            value={`${job.job_type || '—'} • ${job.level || '—'}`}
                                        />
                                        <InfoRow
                                            icon={statusCfg.icon}
                                            label="status"
                                            value={
                                                <Chip
                                                    label={statusCfg.label}
                                                    color={statusCfg.color}
                                                    size="small"
                                                    sx={{ fontWeight: 600, minWidth: 90 }}
                                                />
                                            }
                                        />
                                        {job.closing_date && (
                                            <InfoRow
                                                icon={<CalendarToday fontSize="small" />}
                                                label="closes"
                                                value={new Date(job.closing_date).toLocaleDateString()}
                                                color={isClosed ? 'error.main' : 'inherit'}
                                                fontWeight={isClosed ? 700 : 600}
                                            />
                                        )}
                                    </Stack>
                                </CardContent>

                                <Stack direction="row" spacing={1.5} sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<Visibility fontSize="small" />}
                                        onClick={() => job.pk_id && navigate(`/job/${job.pk_id}`)}
                                        sx={{
                                            borderRadius: 20,
                                            borderColor: alpha(accent, 0.5),
                                            color: accent,
                                            '&:hover': { bgcolor: alpha(accent, 0.08) },
                                        }}
                                    >
                                        {t('view_job')}
                                    </Button>

                                    {!app.cancelled &&
                                        (app.application_status || '').toLowerCase() !== 'rejected' &&
                                        !isClosed && (
                                            <Button
                                                variant="text"
                                                color="error"
                                                size="small"
                                                startIcon={<Cancel fontSize="small" />}
                                                onClick={() => handleOpenCancelDialog(app.pk_id || app.id)}
                                                sx={{ fontWeight: 600 }}
                                            >
                                                {t('cancel')}
                                            </Button>
                                        )}
                                </Stack>
                            </Card>
                        </Grid>
                    );
                }))}
            </Grid>

            <Dialog
                open={cancelDialog.open}
                onClose={handleCloseCancelDialog}
                fullScreen={isMobile}
                maxWidth="xs"
                fullWidth={!isMobile}
                TransitionProps={{ timeout: { enter: 320, exit: 240 } }}
                sx={{
                    '& .MuiBackdrop-root': {
                        backgroundColor: alpha('#000', isMobile ? 0.72 : 0.68),
                        backdropFilter: 'blur(6px)',
                    },
                    '& .MuiDialog-paper': {
                        borderRadius: isMobile ? 0 : 3,
                        boxShadow: isMobile
                            ? 'none'
                            : '0 20px 60px rgba(0,0,0,0.28), 0 0 0 1px rgba(239,68,68,0.08)',
                        overflow: 'hidden',
                    },
                }}
            >
                <Box
                    sx={{
                        bgcolor: alpha(theme.palette.error.main, 0.08),
                        px: { xs: 3, sm: 4 },
                        py: 2.5,
                        borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.18)}`,
                        position: 'relative',
                    }}
                >
                    <DialogTitle
                        sx={{
                            p: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.8,
                            color: theme.palette.error.dark,
                            fontWeight: 700,
                            fontSize: '1.28rem',
                        }}
                    >
                        <WarningAmberIcon
                            color="error"
                            sx={{
                                fontSize: 32,
                                animation: 'pulseWarning 2s infinite',
                                '@keyframes pulseWarning': {
                                    '0%, 100%': { transform: 'scale(1)' },
                                    '50%': { transform: 'scale(1.15)' },
                                },
                            }}
                        />
                        {t('cancel_application')}
                    </DialogTitle>

                    <IconButton
                        aria-label={t('close')}
                        onClick={handleCloseCancelDialog}
                        disabled={cancelDialog.loading}
                        sx={{
                            position: 'absolute',
                            right: 16,
                            top: 16,
                            color: theme.palette.error.main,
                            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12) },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                <DialogContent sx={{ px: { xs: 3, sm: 4 }, py: 3.5, pb: isMobile ? 4 : 3 }}>
                    <DialogContentText sx={{ color: 'text.primary', fontSize: '1.03rem', lineHeight: 1.65 }}>
                        {t('confirm_cancel_application')}
                    </DialogContentText>
                    <TextField
                        autoFocus={!isMobile}
                        margin="dense"
                        label={t('reason')}
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        disabled={cancelDialog.loading}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                            },
                        }}
                        FormHelperTextProps={{ sx: { fontSize: '0.82rem', mt: 1 } }}
                    />
                </DialogContent>

                <DialogActions
                    sx={{
                        px: { xs: 2.5, sm: 3.5 },
                        pb: { xs: 3, sm: 2.5 },
                        pt: 1.5,
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: isMobile ? 'stretch' : 'flex-end',
                        gap: { xs: 2, sm: 1.5 },
                        borderTop: `1px solid ${theme.palette.divider}`,
                        bgcolor: alpha(theme.palette.background.paper, isMobile ? 0.5 : 0.3),
                    }}
                >
                    <Button
                        fullWidth={isMobile}
                        onClick={handleCloseCancelDialog}
                        disabled={cancelDialog.loading}
                        variant={isMobile ? "outlined" : "text"}
                        color="inherit"
                        size={isMobile ? "medium" : "small"}
                        sx={{
                            borderRadius: isMobile ? 28 : 2,
                            px: isMobile ? 4 : 2.5,
                            py: isMobile ? 1.1 : 0.5,
                            fontWeight: isMobile ? 600 : 500,
                            textTransform: 'none',
                            minWidth: 'auto',
                        }}
                    >
                        {t('no_keep_it')}
                    </Button>

                    <Button
                        fullWidth={isMobile}
                        variant="contained"
                        color="error"
                        size={isMobile ? "medium" : "small"}
                        loading={cancelDialog.loading}
                        loadingIndicator={<CircularProgress color="inherit" size={isMobile ? 20 : 16} thickness={5} />}
                        onClick={handleConfirmCancel}
                        disabled={cancelDialog.loading || !cancelReason.trim()}
                        autoFocus
                        sx={{
                            borderRadius: isMobile ? 28 : 2,
                            px: isMobile ? 4 : 3,
                            py: isMobile ? 1.1 : 0.6,
                            fontWeight: 600,
                            textTransform: 'none',
                            minWidth: 'auto',
                            boxShadow: isMobile
                                ? '0 3px 14px rgba(239,68,68,0.28)'
                                : '0 1px 6px rgba(239,68,68,0.16)',
                            '&:hover': {
                                boxShadow: isMobile
                                    ? '0 6px 20px rgba(239,68,68,0.38)'
                                    : '0 2px 10px rgba(239,68,68,0.24)',
                                transform: isMobile ? 'translateY(-1px)' : 'none',
                                bgcolor: theme.palette.error.dark,
                            },
                            transition: 'all 0.18s ease',
                            ...(!isMobile && {
                                background: `linear-gradient(135deg, ${theme.palette.error.main} 20%, ${theme.palette.error.dark} 100%)`,
                                '&:hover': {
                                    background: `linear-gradient(135deg, ${theme.palette.error.dark} 20%, ${theme.palette.error.main} 100%)`,
                                },
                            }),
                        }}
                    >
                        {cancelDialog.loading ? t('cancelling') : t('yes_cancel')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}