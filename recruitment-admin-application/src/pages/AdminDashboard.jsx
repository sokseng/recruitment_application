import React from "react";
import {
  Box,
  Card,
  Typography,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";

const StatCard = ({ icon, label, value, color }) => (
  <Card
    sx={{
      p: 2,
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
      transition: "0.2s",
      cursor: "pointer",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
      },
    }}
  >
    <Stack direction="row" spacing={2} alignItems="center">
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: `${color}.lighter`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: `${color}.main`,
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography fontSize={12} color="text.secondary">
          {label}
        </Typography>
        <Typography fontSize={18} fontWeight={700}>
          {value}
        </Typography>
      </Box>
    </Stack>
  </Card>
);

const AdminDashboard = () => {
  // 🔒 STATIC DATA
  const stats = {
    total_users: 128,
    total_employers: 42,
    total_jobs: 316,
    active_users: 110,
    inactive_users: 18,
    open_jobs: 245,
    closed_jobs: 51,
    draft_jobs: 20,
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* TITLE */}
      <Typography fontSize={18} fontWeight={700} mb={2}>
        Admin Dashboard
      </Typography>

      {/* TOP STATS */}
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
        }}
        gap={2}
        mb={3}
      >
        <StatCard
          icon={<PeopleIcon fontSize="small" />}
          label="Total Users"
          value={stats.total_users}
          color="primary"
        />
        <StatCard
          icon={<BusinessIcon fontSize="small" />}
          label="Employers"
          value={stats.total_employers}
          color="secondary"
        />
        <StatCard
          icon={<WorkIcon fontSize="small" />}
          label="Jobs"
          value={stats.total_jobs}
          color="success"
        />
      </Box>

      {/* STATUS CARDS */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
        gap={2}
      >
        {/* USERS STATUS */}
        <Card sx={{ p: 2, borderRadius: 3 }}>
          <Typography fontSize={14} fontWeight={600} mb={1}>
            Users Status
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Stack direction="row" spacing={1}>
            <Chip size="small" color="success" label={`Active: ${stats.active_users}`} />
            <Chip size="small" label={`Inactive: ${stats.inactive_users}`} />
          </Stack>
        </Card>

        {/* JOB STATUS */}
        <Card sx={{ p: 2, borderRadius: 3 }}>
          <Typography fontSize={14} fontWeight={600} mb={1}>
            Job Status
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Stack direction="row" spacing={1}>
            <Chip size="small" color="success" label={`Open: ${stats.open_jobs}`} />
            <Chip size="small" color="error" label={`Closed: ${stats.closed_jobs}`} />
            <Chip size="small" color="warning" label={`Draft: ${stats.draft_jobs}`} />
          </Stack>
        </Card>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
