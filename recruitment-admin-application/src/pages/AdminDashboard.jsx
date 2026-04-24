import AssignmentIcon from "@mui/icons-material/Assignment";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";
import {
  Box,
  Card,
  Chip,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import api from "../services/api";

/* ================= STAT CARD ================= */
const StatCard = ({ icon, label, value, color, loading }) => (
  <Card
    sx={{
      p: 2.5,
      borderRadius: 3,
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(239, 246, 255, 0.9) 100%)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(59, 130, 246, 0.15)',
      boxShadow: "0 6px 20px rgba(30, 58, 138, 0.08)",
      transition: "all 0.3s ease",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 12px 28px rgba(30, 58, 138, 0.15)",
        borderColor: '#f97316',
      },
    }}
  >
    <Stack direction="row" spacing={2} alignItems="center">
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: 2.5,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #f97316 100%)',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography fontSize={12} sx={{ color: '#3b82f6', fontWeight: 500 }}>
          {label}
        </Typography>
        {loading ? (
          <Skeleton width={60} />
        ) : (
          <Typography 
            fontSize={22} 
            fontWeight={800}
            sx={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {value}
          </Typography>
        )}
      </Box>
    </Stack>
  </Card>
);

/* ================= DASHBOARD ================= */
const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <Box 
      sx={{ 
        p: 3, 
        minHeight: "100vh",
        background: 'linear-gradient(180deg, rgba(239, 246, 255, 0.4) 0%, rgba(255, 255, 255, 0.9) 100%)',
      }}
    >
      
      {/* TOP STATS */}
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(5, 1fr)", // add 2 more cards
        }}
        gap={2.5}
        mb={3}
      >
        <Card
          onClick={() => navigate("/admin/user")}
          sx={{
            cursor: "pointer",
            "&:hover": { boxShadow: 6 },
          }}
        >
          <StatCard
            icon={<PeopleIcon />}
            label={t('total_users')}
            value={stats?.users.total}
            color="primary"
            loading={loading}
          />
        </Card>

        <Card
          onClick={() => navigate("/admin/employer")}
          sx={{
            cursor: "pointer",
            "&:hover": { boxShadow: 6 },
          }}
        >
          <StatCard
            icon={<BusinessIcon />}
            label={t('total_companies')}
            value={stats?.employers.total}
            color="secondary"
            loading={loading}
          />
        </Card>

        <Card
          onClick={() => navigate("/admin/jobs")}
          sx={{
            cursor: "pointer",
            "&:hover": { boxShadow: 6 },
          }}
        >
          <StatCard
            icon={<WorkIcon />}
            label={t('total_jobs')}
            value={stats?.jobs.total}
            color="success"
            loading={loading}
          />
        </Card>

        <Card
          onClick={() => navigate("/admin/candidate")}
          sx={{
            cursor: "pointer",
            "&:hover": { boxShadow: 6 },
          }}
        >
          <StatCard
            icon={<PersonIcon />}
            label={t('total_candidates')}
            value={stats?.candidates.total}
            color="info"
            loading={loading}
          />
        </Card>

        <Card>
          <StatCard
            icon={<AssignmentIcon />}
            label={t('applications_applied')}
            value={stats?.applications.total}
            color="warning"
            loading={loading}
          />
        </Card>
      </Box>

      {/* STATUS CARDS */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "repeat(3, 1fr)" }} // 3 columns on md+
        gap={2.5}
      >
        {/* USER STATUS */}
        <Card 
          sx={{ 
            p: 2.5, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(239, 246, 255, 0.9) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            boxShadow: '0 6px 20px rgba(30, 58, 138, 0.08)',
          }}
        >
          <Typography 
            fontSize={13} 
            fontWeight={700} 
            mb={1}
            sx={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('users_status')}
          </Typography>
          <Divider sx={{ mb: 2, borderColor: 'rgba(59, 130, 246, 0.15)' }} />

          {loading ? (
            <Skeleton height={28} />
          ) : (
            <Stack direction="row" spacing={1.5}>
              <Chip
                color="success"
                label={`${t('active')}: ${stats.users.active}`}
                sx={{
                  fontWeight: 600,
                  fontSize: 11,
                  py: 0.3,
                  bgcolor: '#10b981',
                  color: '#fff',
                }}
              />
              <Chip
                label={`${t('inactive')}: ${stats.users.inactive}`}
                sx={{
                  fontWeight: 600,
                  fontSize: 11,
                  py: 0.3,
                  bgcolor: '#f97316',
                  color: '#fff',
                }}
              />
            </Stack>
          )}
        </Card>

        {/* JOB STATUS */}
        <Card 
          sx={{ 
            p: 2.5, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(239, 246, 255, 0.9) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            boxShadow: '0 6px 20px rgba(30, 58, 138, 0.08)',
          }}
        >
          <Typography 
            fontSize={13} 
            fontWeight={700} 
            mb={1}
            sx={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('jobs_status')}
          </Typography>
          <Divider sx={{ mb: 2, borderColor: 'rgba(59, 130, 246, 0.15)' }} />

          {loading ? (
            <Skeleton height={28} />
          ) : (
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Chip
                color="success"
                label={`${t('open')}: ${stats.jobs.open}`}
                sx={{
                  fontWeight: 600,
                  fontSize: 11,
                  py: 0.3,
                  bgcolor: '#10b981',
                  color: '#fff',
                }}
              />
              <Chip
                color="error"
                label={`${t('closed')}: ${stats.jobs.closed}`}
                sx={{
                  fontWeight: 600,
                  fontSize: 11,
                  py: 0.3,
                  bgcolor: '#ef4444',
                  color: '#fff',
                }}
              />
            </Stack>
          )}
        </Card>

        {/* APPLICATION STATUS - Compact Version */}
        <Card 
          sx={{ 
            p: 2.5, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(239, 246, 255, 0.9) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            boxShadow: '0 6px 20px rgba(30, 58, 138, 0.08)',
          }}
        >
          <Typography 
            fontSize={13} 
            fontWeight={700} 
            mb={1}
            sx={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('applications_status')}
          </Typography>
          <Divider sx={{ mb: 2, borderColor: 'rgba(59, 130, 246, 0.15)' }} />

          {loading ? (
            <Skeleton height={24} />
          ) : (
            <Box
              display="grid"
              gridTemplateColumns={{ xs: "1fr 1fr", sm: "repeat(4, 1fr)" }}
              gap={1}
            >
              <Chip
                label={`${t('pending')}: ${stats.applications.pending}`}
                sx={{
                  bgcolor: '#f97316',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 11,
                  py: 0.3,
                }}
                fullWidth
              />
              <Chip
                label={`${t('shortlisted')}: ${stats.applications.shortlisted}`}
                sx={{
                  bgcolor: '#3b82f6',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 11,
                  py: 0.3,
                }}
                fullWidth
              />
              <Chip
                label={`${t('rejected')}: ${stats.applications.rejected}`}
                sx={{
                  bgcolor: '#ef4444',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 11,
                  py: 0.3,
                }}
                fullWidth
              />
              <Chip
                label={`${t('accepted')}: ${stats.applications.accepted}`}
                sx={{
                  bgcolor: '#10b981',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 11,
                  py: 0.3,
                }}
                fullWidth
              />
            </Box>
          )}
        </Card>
      </Box>
    </Box>
  );
};

export default AdminDashboard;