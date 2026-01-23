import React, { useEffect, useState } from "react";
import {
    Box,
    Stack,
    IconButton,
    Chip,
    Typography,
    Snackbar,
    Alert,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Divider
} from "@mui/material";
import { Visibility, Download } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import api from "../services/api";

const ROLE_META = {
    3: { label: "Candidate", color: "success" },
};

const AdminCandidate = () => {
    const [candidates, setCandidates] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('success');

    // View modal
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    /* ================= Fetch Candidates ================= */
    const fetchCandidates = async () => {
        try {
            debugger
            const res = await api.get("/admin/candidates"); // API returns candidates with resume info
            setCandidates(res.data || []);
        } catch (err) {
            console.error(err);
            setMessage("Failed to fetch candidates");
            setSeverity("error");
            setOpenSnackbar(true);
        }
    };

    useEffect(() => {
        fetchCandidates();
    }, []);

    /* ================= Download Resume ================= */
    const handleDownload = async (resumeId, fileName) => {
        if (!resumeId) {
            setMessage("No resume to download");
            setSeverity("error");
            setOpenSnackbar(true);
            return;
        }

        try {
            const res = await api.get(`/admin/candidate/resumes/${resumeId}/file`, {
                responseType: "blob", // Important: tells axios to treat it as a file
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("access_token")}` // or sessionStorage
                }
            });

            // Try to get the filename from response headers if not provided
            const disposition = res.headers["content-disposition"];
            let actualFileName = fileName;
            if (disposition && disposition.includes("filename=")) {
                const matches = disposition.match(/filename="?(.+)"?/);
                if (matches && matches[1]) {
                    actualFileName = matches[1];
                }
            }

            // Create a URL for the file blob
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", actualFileName || "resume.pdf"); // default filename
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // free memory
        } catch (err) {
            console.error(err);
            setMessage("Failed to download resume");
            setSeverity("error");
            setOpenSnackbar(true);
        }
    };


    /* ================= Columns ================= */
    const columns = [
        { field: "created_date", headerName: "Create date", flex: 1.5 },
        { field: "user_name", headerName: "Candidate name", flex: 1.5 },
        { field: "email", headerName: "Email", flex: 2 },
        {
            field: "primary_resume",
            headerName: "Primary CV",
            flex: 1.5,
            renderCell: ({ row }) =>
                row.primary_resume ? (
                    <Typography fontSize={12}>{row.primary_resume.file_name}</Typography>
                ) : (
                    <Typography fontSize={12} color="text.secondary">—</Typography>
                ),
        },
        {
            field: "is_active",
            headerName: "Status",
            minWidth: 120,
            renderCell: ({ row }) => (
                <Chip
                    size="small"
                    label={row.is_active ? "Active" : "Inactive"}
                    color={row.is_active ? "success" : "default"}
                />
            ),
        },
        {
            field: "actions",
            headerName: "Actions",
            minWidth: 150,
            renderCell: ({ row }) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="View Candidate">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                                setSelectedCandidate(row);
                                setViewDialogOpen(true);
                            }}
                            sx={{
                                border: "1px solid rgba(25,118,210,0.3)",
                                "&:hover": { bgcolor: "rgba(25,118,210,0.1)" },
                            }}
                        >
                            <Visibility fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Download Primary Resume">
                        <span>
                            <IconButton
                                size="small"
                                color="success"
                                onClick={() =>
                                    handleDownload(
                                        row.primary_resume?.pk_id,
                                        row.primary_resume?.file_name
                                    )
                                }
                                disabled={!row.primary_resume}
                                sx={{
                                    border: "1px solid rgba(46,125,50,0.3)",
                                    "&:hover": { bgcolor: "rgba(46,125,50,0.1)" },
                                }}
                            >
                                <Download fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Stack>
            ),
        },
    ];

    return (
        <>
            {/* Snackbar */}
            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={severity} variant="filled">{message}</Alert>
            </Snackbar>

            {/* DataGrid */}
            <Box sx={{ height: "calc(100vh - 120px)" }}>
                <DataGrid
                    rows={candidates}
                    columns={columns}
                    getRowId={(row) => row.pk_id}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                    density="compact"
                    sx={{
                        bgcolor: "#fff",
                        borderRadius: 3,
                        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                    }}
                />
            </Box>

            {/* View Candidate Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Candidate Details</DialogTitle>
                <DialogContent dividers>
                    {selectedCandidate && (
                        <>
                            <Typography variant="subtitle1"><strong>Name:</strong> {selectedCandidate.user_name}</Typography>
                            <Typography variant="subtitle1"><strong>Email:</strong> {selectedCandidate.email}</Typography>
                            <Typography variant="subtitle1" gutterBottom>
                                <strong>Status:</strong> {selectedCandidate.is_active ? "Active" : "Inactive"}
                            </Typography>

                            <Divider sx={{ my: 1 }} />

                            <Typography variant="subtitle2" gutterBottom><strong>Resumes:</strong></Typography>
                            {selectedCandidate.resumes && selectedCandidate.resumes.length > 0 ? (
                                selectedCandidate.resumes.map((r) => (
                                    <Stack
                                        key={r.pk_id}
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{ mb: 1 }}
                                    >
                                        <Box>
                                            <Typography fontSize={13}>
                                                {r.resume_type} - {r.resume_file || "Text Resume"}
                                            </Typography>
                                            {r.recommendation_letter && (
                                                <Typography fontSize={12} color="text.secondary">
                                                    Recommendation: {r.recommendation_letter}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleDownload(r.pk_id, r.resume_file)}
                                            disabled={!r.resume_file}
                                        >
                                            Download
                                        </Button>
                                    </Stack>
                                ))
                            ) : (
                                <Typography fontSize={12} color="text.secondary">
                                    No resumes uploaded
                                </Typography>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default AdminCandidate;
