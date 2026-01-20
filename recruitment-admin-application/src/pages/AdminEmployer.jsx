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
        <Box>
            {/* GRID */}
            <Box
                display="grid"
                gridTemplateColumns={{
                    xs: "repeat(1, 1fr)",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)",
                }}
                gap={2}
            >
                {loading &&
                    Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} variant="rounded" height={200} />
                    ))}

                {!loading &&
                    employers.map((emp) => (
                        <Card
                            key={emp.pk_id}
                            sx={{
                                borderRadius: 2,
                                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                                transition: "0.2s",
                                "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
                                },
                            }}
                        >
                            <CardContent sx={{ p: 2 }}>
                                {/* HEADER */}
                                <Box display="flex" gap={1.5} mb={1.5}>
                                    <Avatar
                                        src={
                                            emp.company_logo
                                                ? `${import.meta.env.VITE_API_BASE_URL}/uploads/employers/${emp.company_logo}`
                                                : "/default-company.png"
                                        }
                                        sx={{ width: 40, height: 40, borderRadius: 1.5 }}
                                    />
                                    <Box minWidth={0}>
                                        <Typography fontWeight={600} noWrap>
                                            {emp.company_name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap>
                                            {emp.company_email || "—"}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ mb: 1.5 }} />

                                {/* META */}
                                <Stack spacing={0.5}>
                                    <Typography variant="body2" fontSize={13}>
                                        📞 {emp.company_contact || "—"}
                                    </Typography>

                                    <Typography variant="body2" fontSize={13}>
                                        🧾 Jobs: {emp.job_count || 0}
                                    </Typography>

                                    <Typography variant="caption" color="text.disabled">
                                        Created:{" "}
                                        {new Date(emp.created_date).toLocaleDateString()}
                                    </Typography>
                                </Stack>

                                {/* STATUS */}
                                <Box mt={1.5}>
                                    <Chip
                                        label={emp.is_active ? "Active" : "Inactive"}
                                        size="small"
                                        color={emp.is_active ? "success" : "error"}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    ))}

                {!loading && employers.length === 0 && (
                    <Box gridColumn="1 / -1" textAlign="center" py={8}>
                        <Typography variant="h6">No employers found</Typography>
                        <Typography color="text.secondary">
                            Companies will appear here once registered.
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default AdminEmployers;
