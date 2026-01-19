import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    Stack,
    Avatar,
} from "@mui/material";
import api from "../services/api";

const AdminEmployer = () => {
    const [jobs, setJobs] = useState([]);

    const fetchMyJobs = async () => {
        try {
            const res = await api.get("/user/my-jobs");
            setJobs(res.data || []);
        } catch (error) {
            console.error("Failed to load your posted jobs", error);
        }
    };

    useEffect(() => {
        fetchMyJobs();
    }, []);

    return (
        <Box>
            {/* JOB GRID */}
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
                        variant="outlined"
                        sx={{
                            borderRadius: 2,
                            minHeight: 220,
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
                                            {job.location || "Remote"}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Chip
                                    label={job.status}
                                    size="small"
                                    color={
                                        job.status === "Open"
                                            ? "success"
                                            : job.status === "Closed"
                                                ? "error"
                                                : job.status === "Draft"
                                                    ? "warning"
                                                    : "default"
                                    }
                                    sx={{ fontWeight: 500 }}
                                />
                            </Box>

                            {/* JOB META */}
                            <Stack direction="row" spacing={1} mb={1.5} flexWrap="wrap">
                                <Chip label={job.job_type} size="small" variant="outlined" />
                                {job.level && (
                                    <Chip
                                        label={job.level}
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                    />
                                )}
                            </Stack>

                            {/* SALARY */}
                            <Typography variant="body2" color="text.secondary">
                                💰 {job.salary_range || "Negotiable"}
                            </Typography>

                            {/* DATE */}
                            <Typography
                                variant="caption"
                                color="text.disabled"
                                display="block"
                                mt={1}
                            >
                                Posting Date: {new Date(job.posting_date).toLocaleDateString()}
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.disabled"
                                display="block"
                                mt={1}
                            >
                                Closing Date: {new Date(job.closing_date).toLocaleDateString()}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}

                {/* EMPTY STATE */}
                {jobs.length === 0 && (
                    <Box
                        gridColumn="1 / -1"
                        textAlign="center"
                        py={6}
                        color="text.secondary"
                    >
                        You haven't posted any jobs yet.
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default AdminEmployer;
