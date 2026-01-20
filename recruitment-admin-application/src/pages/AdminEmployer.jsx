import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Stack,
  Skeleton,
  Divider,
} from "@mui/material";
import api from "../services/api";

const AdminEmployers = () => {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/employer");
      setEmployers(res.data || []);
    } catch (err) {
      console.error("Failed to load employers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployers();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: "repeat(1, 1fr)",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
        }}
        gap={3}
      >
        {/* Loading Skeletons */}
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={220} />
          ))}

        {/* Employer Cards */}
        {!loading &&
          employers.map((emp) => (
            <Card
              key={emp.pk_id}
              sx={{
                borderRadius: 3,
                boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                transition: "0.3s",
                bgcolor: "#fff",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                },
              }}
            >
              <CardContent sx={{ p: 2 }}>
                {/* Header */}
                <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                  <Avatar
                    src={
                      emp.company_logo
                        ? `${import.meta.env.VITE_API_BASE_URL}/uploads/employers/${emp.company_logo}`
                        : "/default-company.png"
                    }
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 2,
                      border: "2px solid",
                      borderColor: "primary.light",
                    }}
                  />
                  <Box minWidth={0}>
                    <Typography fontWeight={600} noWrap fontSize={16}>
                      {emp.company_name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                    >
                      {emp.company_email || "—"}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 1.5 }} />

                {/* Details */}
                <Stack spacing={0.5}>
                  <Typography variant="body2" fontSize={13}>
                    📞 {emp.company_contact || "—"}
                  </Typography>
                  <Typography variant="body2" fontSize={13}>
                    🧾 Jobs: {emp.job_count || 0}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    fontSize={12}
                  >
                    Created: {new Date(emp.created_date).toLocaleDateString()}
                  </Typography>
                </Stack>

                {/* Status Badge */}
                <Box mt={2}>
                  <Chip
                    label={emp.is_active ? "Active" : "Inactive"}
                    size="small"
                    color={emp.is_active ? "success" : "error"}
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
              </CardContent>
            </Card>
          ))}

        {/* Empty State */}
        {!loading && employers.length === 0 && (
          <Box gridColumn="1 / -1" textAlign="center" py={10}>
            <Typography variant="h6">No employers found</Typography>
            <Typography color="text.secondary" mt={1}>
              Companies will appear here once registered.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdminEmployers;
