import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Avatar,
  Divider,
  Skeleton,
} from "@mui/material";
import api from "../services/api";
import { useTranslation } from 'react-i18next';

const AdminJobs = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/user/my-jobs");
      setJobs(res.data || []);
    } catch (error) {
      console.error("Failed to load jobs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const summary = useMemo(
    () => ({
      total: jobs.length,
      open: jobs.filter((j) => j.status === "Open").length,
      closed: jobs.filter((j) => j.status === "Closed").length,
      draft: jobs.filter((j) => j.status === "Draft").length,
    }),
    [jobs]
  );

  const getStatusColor = (status) => {
    if (status === "Open") return "success";
    if (status === "Closed") return "error";
    if (status === "Draft") return "warning";
    return "default";
  };

  const getStatusLabel = (status) => {
    if (status === "Open") return t('open');
    if (status === "Closed") return t('closed');
    if (status === "Draft") return t('draft');
    return status;
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* SUMMARY CARDS */}
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: "repeat(2, 1fr)",
          sm: "repeat(4, 1fr)",
        }}
        gap={1.5}
        mb={2}
      >
        {[
          { label: t('total_jobs'), value: summary.total, color: "text.primary" },
          { label: t('open'), value: summary.open, color: "success.main" },
          { label: t('closed'), value: summary.closed, color: "error.main" },
          { label: t('draft'), value: summary.draft, color: "warning.main" },
        ].map((item, idx) => (
          <Card
            key={idx}
            sx={{
              p: 1.2,
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              transition: "0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.07)",
              },
              border: "3px solid",
              borderColor: "divider"
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: item.color }}>
              {item.value}
            </Typography>
          </Card>
        ))}
      </Box>

      {/* JOB CARDS */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(1, 1fr)",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 1.5,
        }}
      >
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={180} />
          ))}

        {!loading &&
          jobs.map((job) => (
            <Card
              key={job.pk_id}
              sx={{
                borderRadius: 2.5,
                boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
                transition: "0.2s",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
                },
                bgcolor: "#fff",
                border: "3px solid",
                borderColor: "divider"
              }}
            >
              <CardContent sx={{ p: 1.5 }}>
                {/* HEADER */}
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Box display="flex" gap={1}>
                    <Avatar
                      src={
                        job.company_logo
                          ? `${import.meta.env.VITE_API_BASE_URL}/uploads/employers/${job.company_logo}`
                          : "/default-company.png"
                      }
                      sx={{ width: 32, height: 32, borderRadius: 1.5 }}
                    />
                    <Box minWidth={0}>
                      <Typography fontWeight={600} fontSize={13} noWrap>
                        {job.job_title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {job.company_name}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={getStatusLabel(job.status)} 
                    size="small" 
                    color={getStatusColor(job.status)} 
                  />
                </Box>

                <Divider sx={{ mb: 1 }} />

                {/* TAGS */}
                <Stack direction="row" spacing={0.4} flexWrap="wrap" mb={1}>
                  <Chip label={job.job_type} size="small" color="primary" variant="outlined" />
                  {job.level && (
                    <Chip label={job.level} size="small" color="secondary" variant="outlined" />
                  )}
                  <Chip label={job.location || t('remote')} size="small" variant="outlined" />
                </Stack>

                {/* DETAILS */}
                <Stack spacing={0.2}>
                  <Typography variant="body2" fontSize={12} color="text.secondary">
                    💰 {t('salary')}: {job.salary_range || t('negotiable')}
                  </Typography>
                  <Typography variant="body2" fontSize={12} color="text.secondary">
                    👥 {t('positions')}: {job.position_number || 1}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {t('posted')}: {job.posting_date ? new Date(job.posting_date).toLocaleDateString() : "-"}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {t('closing')}: {job.closing_date ? new Date(job.closing_date).toLocaleDateString() : "-"}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}

        {!loading && jobs.length === 0 && (
          <Box gridColumn="1 / -1" textAlign="center" py={6}>
            <Typography variant="h6">{t('no_jobs_available')}</Typography>
            <Typography color="text.secondary">
              {t('job_postings_will_appear')}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdminJobs;