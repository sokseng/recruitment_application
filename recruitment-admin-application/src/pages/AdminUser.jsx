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

    // Confirm Dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const fetchUsers = async () => {
        const res = await api.get("/user");
        setUsers(res.data || []);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Open confirm dialog
    const confirmDelete = (row) => {
        setUserToDelete(row);
        setDeleteDialogOpen(true);
    };

    // Actually delete user
    const handleDelete = async () => {
        if (!userToDelete) return;

        try {
            await api.delete("/user/delete", {
                data: { ids: [userToDelete.pk_id] }
            });
            fetchUsers();
            setOpenSnackbar(true)
            setSeverity('success')
            setMessage('User disabled successfully')
        } catch (err) {
            console.error("Failed to delete user", err);
            setOpenSnackbar(true)
            setSeverity('error')
            setMessage(err.response?.data?.detail || 'Failed to disable user')
        } finally {
            setDeleteDialogOpen(false);
            setUserToDelete(null);
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
            flex: 1.3,
            minWidth: 180,
            sortable: false,
            renderCell: ({ row }) => (
                <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ height: "100%", alignItems: "center"}}
                >
                    {/* Edit Button */}
                    <Button
                        size="small"
                        variant="outlined"
                        sx={{
                            textTransform: "none",
                            fontSize: 10,
                            minWidth: 0,
                            px: 1,
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
                        variant="contained"
                        color="error"
                        sx={{
                            textTransform: "none",
                            fontSize: 10,
                            minWidth: 0,
                            px: 1,
                        }}
                        onClick={() => confirmDelete(row)}
                    >
                        Disable
                    </Button>
                </Stack>
            ),
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

            <Box sx={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column"}}>
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
                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                    <DialogTitle>Confirm Disable</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to disable <strong>{userToDelete?.user_name}</strong>?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
                            Cancel
                        </Button>
                        <Button onClick={handleDelete} color="error" variant="contained">
                            Disable
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </>

    );
};

export default AdminUsers;
