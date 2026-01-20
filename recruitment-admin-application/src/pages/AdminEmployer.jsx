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
} from "@mui/material";
import api from "../services/api";

const AdminEmployer = () => {
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

    /* =======================
       SUMMARY COUNTS
    ======================= */
    const summary = useMemo(() => {
        return {
            total: jobs.length,
            open: jobs.filter(j => j.status === "Open").length,
            closed: jobs.filter(j => j.status === "Closed").length,
            draft: jobs.filter(j => j.status === "Draft").length,
        };
    }, [jobs]);

    const getStatusColor = (status) => {
        if (status === "Open") return "success";
        if (status === "Closed") return "error";
        if (status === "Draft") return "warning";
        return "default";
    };

    return (
        <Box>
            {/* =======================
               PAGE TITLE
            ======================= */}
            <Typography variant="h6" fontWeight={600} mb={2}>
                Employer Jobs
            </Typography>

            {/* =======================
               SUMMARY CARDS
            ======================= */}
            <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                <Card sx={{ p: 2, minWidth: 160 }}>
                    <Typography variant="caption" color="text.secondary">
                        Total Jobs
                    </Typography>
                    <Typography variant="h6">{summary.total}</Typography>
                </Card>

                <Card sx={{ p: 2, minWidth: 160 }}>
                    <Typography variant="caption" color="text.secondary">
                        Open
                    </Typography>
                    <Typography variant="h6" color="success.main">
                        {summary.open}
                    </Typography>
                </Card>

                <Card sx={{ p: 2, minWidth: 160 }}>
                    <Typography variant="caption" color="text.secondary">
                        Closed
                    </Typography>
                    <Typography variant="h6" color="error.main">
                        {summary.closed}
                    </Typography>
                </Card>

                <Card sx={{ p: 2, minWidth: 160 }}>
                    <Typography variant="caption" color="text.secondary">
                        Draft
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                        {summary.draft}
                    </Typography>
                </Card>
            </Box>

            {/* =======================
               JOB GRID
            ======================= */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "repeat(1, 1fr)",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                        lg: "repeat(4, 1fr)",
                    },
                    gap: 2,
                }}
            >
                {jobs.map((job) => (
                    <Card
                        key={job.pk_id}
                        sx={{
                            borderRadius: 2,
                            minHeight: 240,
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: 2,
                            transition: "0.2s",
                            "&:hover": {
                                boxShadow: 6,
                                transform: "translateY(-2px)",
                            },
                        }}
                    >
                        <CardContent sx={{ flexGrow: 1 }}>
                            {/* HEADER */}
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                mb={1.5}
                            >
                                <Box display="flex" alignItems="center" gap={1.2}>
                                    <Avatar
                                        src={
                                            job.company_logo
                                                ? `${import.meta.env.VITE_API_BASE_URL}/uploads/employers/${job.company_logo}`
                                                : "/default-company.png"
                                        }
                                        alt={job.company_name}
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 1,
                                        }}
                                    />

                                    <Box minWidth={0}>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={600}
                                            noWrap
                                        >
                                            {job.job_title}
                                        </Typography>

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            noWrap
                                        >
                                            {job.company_name}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Chip
                                    label={job.status}
                                    size="small"
                                    color={getStatusColor(job.status)}
                                />
                            </Box>

                            <Divider sx={{ mb: 1.5 }} />

                            {/* META */}
                            <Stack direction="row" spacing={1} flexWrap="wrap" mb={1.5}>
                                <Chip label={job.job_type} size="small" variant="outlined" />
                                {job.level && (
                                    <Chip
                                        label={job.level}
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                    />
                                )}
                                <Chip
                                    label={job.location || "Remote"}
                                    size="small"
                                    variant="outlined"
                                />
                            </Stack>

                            {/* INFO */}
                            <Typography variant="body2" color="text.secondary">
                                💰 {job.salary_range || "Negotiable"}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                👥 Positions: {job.position_number || 1}
                            </Typography>

                            {/* DATES */}
                            <Typography
                                variant="caption"
                                color="text.disabled"
                                display="block"
                                mt={1}
                            >
                                Posted:{" "}
                                {job.posting_date
                                    ? new Date(job.posting_date).toLocaleDateString()
                                    : "-"}
                            </Typography>

                            <Typography
                                variant="caption"
                                color="text.disabled"
                                display="block"
                            >
                                Closing:{" "}
                                {job.closing_date
                                    ? new Date(job.closing_date).toLocaleDateString()
                                    : "-"}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}

                {/* EMPTY STATE */}
                {!loading && jobs.length === 0 && (
                    <Box
                        gridColumn="1 / -1"
                        textAlign="center"
                        py={8}
                        color="text.secondary"
                    >
                        <Typography variant="h6" mb={1}>
                            No jobs found
                        </Typography>
                        <Typography>
                            You haven’t posted any jobs yet.
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default AdminEmployer;
