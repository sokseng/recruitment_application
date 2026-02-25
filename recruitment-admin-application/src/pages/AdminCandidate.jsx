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
    Divider,
} from "@mui/material";
import { Visibility, Download } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import api from "../services/api";
import { useTranslation } from 'react-i18next';

const AdminCandidate = () => {
    const { t } = useTranslation();
    const [candidates, setCandidates] = useState([]);

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState("success");

    /* ================= View Resume States ================= */
    const [viewFileOpen, setViewFileOpen] = useState(false);
    const [fileUrl, setFileUrl] = useState(null);
    const [fileName, setFileName] = useState("");
    const [fileType, setFileType] = useState("");

    /* ================= Fetch Candidates ================= */
    const fetchCandidates = async () => {
        try {
            const res = await api.get("/admin/candidates");
            setCandidates(res.data || []);
        } catch (err) {
            setMessage(t('fetch_candidates_failed'));
            setSeverity("error");
            setOpenSnackbar(true);
        }
    };

    useEffect(() => {
        fetchCandidates();
    }, []);

    /* ================= Download Resume ================= */
    const handleDownload = async (resumeId, fileName) => {
        if (!resumeId) return;

        try {
            const res = await api.get(
                `/admin/candidate/resumes/${resumeId}/file`,
                {
                    responseType: "blob",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "access_token"
                        )}`,
                    },
                }
            );

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName || "resume");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setMessage(t('download_failed'));
            setSeverity("error");
            setOpenSnackbar(true);
        }
    };

    /* ================= View Resume ================= */
    const handleViewFile = async (resumeId, fileName) => {
        if (!resumeId) return;

        try {
            const res = await api.get(
                `/admin/candidate/resumes/${resumeId}/file`,
                {
                    responseType: "blob",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "access_token"
                        )}`,
                    },
                }
            );

            const contentType = res.headers["content-type"];
            const blob = new Blob([res.data], { type: contentType });
            const url = URL.createObjectURL(blob);

            // DOC / DOCX → Download instead of preview
            if (
                contentType.includes("word") ||
                contentType.includes("officedocument")
            ) {
                handleDownload(resumeId, fileName);
                return;
            }

            setFileUrl(url);
            setFileName(fileName);
            setFileType(contentType);
            setViewFileOpen(true);
        } catch (err) {
            setMessage(t('view_file_failed'));
            setSeverity("error");
            setOpenSnackbar(true);
        }
    };

    /* ================= Columns ================= */
    const columns = [
        { field: "created_date", headerName: t('create_date'), flex: 1.2 },
        { field: "user_name", headerName: t('candidate'), flex: 1.5 },
        { field: "email", headerName: t('email'), flex: 2 },
        {
            field: "primary_resume",
            headerName: t('primary_cv'),
            flex: 1.5,
            renderCell: ({ row }) =>
                row.primary_resume ? (
                    <Typography fontSize={12}>
                        {row.primary_resume.file_name}
                    </Typography>
                ) : (
                    <Typography fontSize={12} color="text.secondary">
                        —
                    </Typography>
                ),
        },
        {
            field: "is_active",
            headerName: t('status'),
            minWidth: 120,
            renderCell: ({ row }) => (
                <Chip
                    size="small"
                    label={row.is_active ? t('active') : t('inactive')}
                    color={row.is_active ? "success" : "default"}
                />
            ),
        },
        {
            field: "actions",
            headerName: t('actions'),
            minWidth: 160,
            renderCell: ({ row }) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title={t('view_resume')}>
                        <span>
                            <IconButton
                                size="small"
                                color="primary"
                                disabled={!row.primary_resume}
                                onClick={() =>
                                    handleViewFile(
                                        row.primary_resume?.pk_id,
                                        row.primary_resume?.file_name
                                    )
                                }
                            >
                                <Visibility fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Tooltip title={t('download_resume')}>
                        <span>
                            <IconButton
                                size="small"
                                color="success"
                                disabled={!row.primary_resume}
                                onClick={() =>
                                    handleDownload(
                                        row.primary_resume?.pk_id,
                                        row.primary_resume?.file_name
                                    )
                                }
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
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert severity={severity} variant="filled">
                    {message}
                </Alert>
            </Snackbar>

            {/* Table */}
            <Box sx={{ height: "calc(100vh - 120px)" }}>
                <DataGrid
                    rows={candidates}
                    columns={columns}
                    getRowId={(row) => row.pk_id}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                    density="compact"
                />
            </Box>

            {/* View File Dialog */}
            <Dialog
                open={viewFileOpen}
                onClose={() => {
                    setViewFileOpen(false);
                    if (fileUrl) URL.revokeObjectURL(fileUrl);
                }}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        height: "90vh",
                        overflow: "hidden",   // 🔥 disable outer scrollbar
                    },
                }}
            >
                <DialogContent
                    sx={{
                        p: 0,
                        height: "100%",
                        overflow: "hidden",  // 🔥 no scroll here
                    }}
                >
                    {fileType.startsWith("image") ? (
                        <Box
                            component="img"
                            src={fileUrl}
                            alt="Resume"
                            sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                            }}
                        />
                    ) : (
                        <iframe
                            src={fileUrl}
                            title="Resume Viewer"
                            width="100%"
                            height="100%"
                            style={{
                                border: "none",
                                overflow: "auto", // ✅ only iframe scrolls
                            }}
                        />
                    )}
                </DialogContent>

                <DialogActions sx={{ py: 0.5 }}>
                    <Button size="small" onClick={() => setViewFileOpen(false)}>
                        {t('close')}
                    </Button>
                </DialogActions>
            </Dialog>

        </>
    );
};

export default AdminCandidate;