import React, { useEffect, useState } from "react";
import {
    Box,
    Stack,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Snackbar,
    Alert
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import api from "../services/api";
import UserDialog from "./UserDialog";

/* ================= Role Meta ================= */
const ROLE_META = {
    1: { label: "Admin", color: "primary" },
    2: { label: "Employer", color: "secondary" },
    3: { label: "Candidate", color: "success" },
};

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState('error')

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionType, setActionType] = useState(null); // "enable" | "disable"

    const confirmDisable = (row) => {
        setSelectedUser(row);
        setActionType("disable");
        setConfirmDialogOpen(true);
    };

    const confirmEnable = (row) => {
        setSelectedUser(row);
        setActionType("enable");
        setConfirmDialogOpen(true);
    };



    const fetchUsers = async () => {
        const res = await api.get("/user");
        setUsers(res.data || []);
    };

    useEffect(() => {
        fetchUsers();
    }, []);



    const handleConfirmAction = async () => {
        if (!selectedUser || !actionType) return;

        try {

            if (actionType === "disable") {
                await api.delete("/user/delete", {
                    data: { ids: [selectedUser.pk_id] },

                });
                setMessage("User disabled successfully");
            } else {
                await api.delete("/user/enable", {
                    data: { ids: [selectedUser.pk_id] }
                });
                setMessage("User enabled successfully");
            }

            setSeverity("success");
            fetchUsers();
        } catch (err) {
            setSeverity("error");
            setMessage(
                err.response?.data?.detail ||
                `Failed to ${actionType} user`
            );
        } finally {
            setOpenSnackbar(true);
            setConfirmDialogOpen(false);
            setSelectedUser(null);
            setActionType(null);
        }
    };


    /* ================= Columns ================= */
    const columns = [
        {
            field: "user_name",
            headerName: "User Name",
            flex: 1.5,
            minWidth: 150,
            sortable: true,
        },
        {
            field: "email",
            headerName: "Email",
            flex: 2,
            minWidth: 200,
            sortable: true,
        },
        {
            field: "user_type",
            headerName: "User Type",
            flex: 1,
            minWidth: 140,
            renderCell: ({ row }) => {
                const role = ROLE_META[row.user_type];
                const roleStyles = {
                    primary: { bgcolor: "rgba(25,118,210,0.1)", color: "#1976d2" },
                    secondary: { bgcolor: "rgba(156,39,176,0.1)", color: "#9c27b0" },
                    success: { bgcolor: "rgba(46,125,50,0.1)", color: "#2e7d32" },
                };
                const styles = roleStyles[role?.color] || {};
                return (
                    <Chip
                        label={role?.label}
                        size="small"
                        sx={{
                            fontWeight: 600,
                            fontSize: 12,
                            borderRadius: 1.5,
                            px: 1.5,
                            py: 0.3,
                            backgroundColor: styles.bgcolor,
                            color: styles.color,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                        }}
                    />
                );
            },
        },
        {
            field: "status",
            headerName: "Status",
            flex: 0.8,
            minWidth: 120,
            renderCell: ({ row }) => (
                <Chip
                    size="small"
                    label={row.is_active ? "Active" : "Inactive"}
                    sx={{
                        fontWeight: 600,
                        fontSize: 12,
                        borderRadius: 1.5,
                        px: 1.2,
                        py: 0.3,
                        bgcolor: row.is_active ? "#e8f5e9" : "#f5f5f5",
                        color: row.is_active ? "#2e7d32" : "#616161",
                    }}
                />
            ),
        },
        {
            field: "actions",
            headerName: "Actions",
            flex: 1.4,
            minWidth: 180,
            sortable: false,
            renderCell: ({ row }) => {
                const isActive = row.is_active;

                return (
                    <Box
                        sx={{
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,       // slightly smaller spacing
                            py: 0,
                        }}
                    >
                        {/* Edit Button */}
                        <Button
                            size="small"
                            variant="outlined"
                            sx={{
                                fontSize: 10,
                                px: 1,
                                py: 0.4,
                                borderRadius: 2,
                                textTransform: "none",
                                color: "#1976d2",
                                borderColor: "rgba(25,118,210,0.5)",
                                "&:hover": {
                                    bgcolor: "rgba(25,118,210,0.08)",
                                    borderColor: "rgba(25,118,210,0.7)",
                                },
                            }}
                            onClick={() => {
                                setEditingUser(row);
                                setOpen(true);
                            }}
                        >
                            Edit
                        </Button>

                        {/* Disable Button */}
                        <Button
                            size="small"
                            variant="outlined"
                            disabled={!isActive}
                            onClick={() => confirmDisable(row)}
                            sx={{
                                fontSize: 10,
                                px: 1,
                                py: 0.4,
                                borderRadius: 2,
                                textTransform: "none",
                                bgcolor: "#e53935",
                                color: "#fff",
                                opacity: isActive ? 1 : 0.45,
                                borderColor: "transparent",
                                "&:hover": {
                                    bgcolor: isActive ? "#d32f2f" : "#e53935",
                                },
                            }}
                        >
                            Disable
                        </Button>

                        {/* Enable Button */}
                        <Button
                            size="small"
                            variant="outlined"
                            disabled={isActive}
                            onClick={() => confirmEnable(row)}
                            sx={{
                                fontSize: 10,
                                px: 1,
                                py: 0.4,
                                borderRadius: 2,
                                textTransform: "none",
                                bgcolor: "#2e7d32",
                                color: "#fff",
                                opacity: isActive ? 0.45 : 1,
                                borderColor: "transparent",
                                "&:hover": {
                                    bgcolor: !isActive ? "#1b5e20" : "#2e7d32",
                                },
                            }}
                        >
                            Enable
                        </Button>
                    </Box>
                );
            },
        }

    ];

    return (
        <>
            {/* Snackbar */}
            <Snackbar
                open={openSnackbar}
                autoHideDuration={2000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={severity} variant="filled">
                    {message}
                </Alert>
            </Snackbar>

            <Box sx={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
                {/* Top Bar */}
                <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} mb={1}>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setEditingUser(null);
                            setOpen(true);
                        }}
                    >
                        Create User
                    </Button>
                </Stack>

                {/* DataGrid */}
                <Box sx={{ flex: 1, border: "3px solid", borderColor: "divider", borderRadius: 4 }}>
                    <DataGrid
                        rows={users}
                        columns={columns}
                        getRowId={(row) => row.pk_id}
                        pageSizeOptions={[10, 25, 50, 100]}
                        initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                        disableRowSelectionOnClick
                        rowHeight={52}
                        density="compact"

                        sx={{
                            bgcolor: "#fff",
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                            "& .MuiDataGrid-columnHeaders": { background: "linear-gradient(180deg, #f9fafb, #f1f5f9)", fontWeight: 700, fontSize: 13, borderBottom: "1px solid rgba(0,0,0,0.08)" },
                            "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(25,118,210,0.06)" },
                        }}
                    />
                </Box>

                {/* Dialogs */}
                <UserDialog open={open} onClose={() => setOpen(false)} user={editingUser} refresh={fetchUsers} />

                {/* MUI Confirm Dialog */}
                <Dialog
                    open={confirmDialogOpen}
                    onClose={() => setConfirmDialogOpen(false)}
                >
                    <DialogTitle>
                        Confirm {actionType === "disable" ? "Disable" : "Enable"}
                    </DialogTitle>

                    <DialogContent>
                        <Typography>
                            Are you sure you want to{" "}
                            <strong>
                                {actionType === "disable" ? "disable" : "enable"}
                            </strong>{" "}
                            <strong>{selectedUser?.user_name}</strong>?
                        </Typography>
                    </DialogContent>

                    <DialogActions>
                        <Button
                            onClick={() => setConfirmDialogOpen(false)}
                            color="inherit"
                            size="small"
                            variant="outlined"
                            sx={{ textTransform: "none" }}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleConfirmAction}
                            sx={{ textTransform: "none" }}
                            variant="contained"
                            size="small"
                            color={actionType === "disable" ? "error" : "success"}
                        >
                            {actionType === "disable" ? "Disable" : "Enable"}
                        </Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </>

    );
};

export default AdminUsers;
