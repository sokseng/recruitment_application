import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Stack,
  Chip,
  Divider,
  Skeleton,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIcon from "@mui/icons-material/Assignment";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

/* ================= STAT CARD ================= */
const StatCard = ({ icon, label, value, color, loading }) => (
  <Card
    sx={{
      p: 2.5,
      borderRadius: 3,
      boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
      transition: "0.25s",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
      },
    }}
  >
    <Stack direction="row" spacing={2} alignItems="center">
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: 2.5,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette[color].light}, ${theme.palette[color].main})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography fontSize={12} color="text.secondary">
          {label}
        </Typography>
        {loading ? (
          <Skeleton width={60} />
        ) : (
          <Typography fontSize={22} fontWeight={800}>
            {value}
          </Typography>
        )}
      </Box>
    </Stack>
  </Card>
);

/* ================= DASHBOARD ================= */
const AdminDashboard = () => {
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
    <Box sx={{ p: 3, minHeight: "100vh" }}>
      

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
            label="Total Users"
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
            label="Total Companies"
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
            label="Total Jobs"
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
            label="Total Candidates"
            value={stats?.candidates.total}
            color="info"
            loading={loading}
          />
        </Card>

        <Card>
          <StatCard
            icon={<AssignmentIcon />}
            label="Applications Applied"
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
        <Card sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography fontSize={13} fontWeight={700} mb={1}>
            Users Status
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Skeleton height={28} />
          ) : (
            <Stack direction="row" spacing={1.5}>
              <Chip
                color="success"
                label={`Active: ${stats.users.active}`}
                sx={{
                  fontWeight: 600,
                  fontSize: 11,
                  py: 0.3,
                }}
              />
              <Chip
                label={`Inactive: ${stats.users.inactive}`}
                sx={{
                  fontWeight: 600,
                  fontSize: 11,
                  py: 0.3,
                }}
              />
            </Stack>
          )}
        </Card>

        {/* JOB STATUS */}
        <Card sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography fontSize={13} fontWeight={700} mb={1}>
            Job Status
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Skeleton height={28} />
          ) : (
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Chip
                color="success"
                label={`Open: ${stats.jobs.open}`}
                sx={{
                  fontWeight: 600,
                  fontSize: 11,
                  py: 0.3,
                }}
              />
              <Chip
                color="error"
                label={`Closed: ${stats.jobs.closed}`}
                sx={{
                  fontWeight: 600,
                  fontSize: 11,
                  py: 0.3,
                }}
              />
            </Stack>
          )}
        </Card>

        {/* APPLICATION STATUS - Compact Version */}
        <Card sx={{ p: 2.5, borderRadius: 3 }}> {/* smaller padding */}
          <Typography fontSize={13} fontWeight={700} mb={1}>
            Job Applications Applied Status
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Skeleton height={24} />
          ) : (
            <Box
              display="grid"
              gridTemplateColumns={{ xs: "1fr 1fr", sm: "repeat(4, 1fr)" }}
              gap={1} // tighter gap
            >
              <Chip
                label={`Pending: ${stats.applications.pending}`}
                sx={{
                  bgcolor: "#FFA500",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 11,  // smaller text
                  py: 0.3,       // shorter height
                }}
                fullWidth
              />
              <Chip
                label={`Shortlisted: ${stats.applications.shortlisted}`}
                sx={{
                  bgcolor: "#1976d2",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 11,
                  py: 0.3,
                }}
                fullWidth
              />
              <Chip
                label={`Rejected: ${stats.applications.rejected}`}
                sx={{
                  bgcolor: "#d32f2f",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 11,
                  py: 0.3,
                }}
                fullWidth
              />
              <Chip
                label={`Accepted: ${stats.applications.accepted}`}
                sx={{
                  bgcolor: "#388e3c",
                  color: "#fff",
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
