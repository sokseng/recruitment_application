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
  Alert,
  Switch,
  styled,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import api from "../services/api";
import UserDialog from "./UserDialog";
import { Edit } from "@mui/icons-material";
import { useTranslation } from 'react-i18next';

/* ================= Role Meta ================= */
const ROLE_META = {
  1: { label: "Admin", color: "primary" },
  2: { label: "Employer", color: "secondary" },
  3: { label: "Candidate", color: "success" },
};

const AdminUsers = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("error");

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(null); // "enable" | "disable"
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);

  const confirmApprove = (row) => {
    setSelectedEmployer(row);
    setOpenApproveDialog(true);
  };

  const handleApprove = async () => {
    try {
      if (!selectedEmployer) return;
      const pk_id = selectedEmployer.pk_id;
      await api.put(`/user/approve/${pk_id}`);

      setMessage(t('employer_approved_success'));
      setSeverity("success");
      setOpenSnackbar(true);
      setOpenApproveDialog(false);

      fetchUsers();
    } catch (err) {
      console.log(err);
    }
  };

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
        setMessage(t('user_disabled_success'));
      } else {
        await api.delete("/user/enable", {
          data: { ids: [selectedUser.pk_id] },
        });
        setMessage(t('user_enabled_success'));
      }

      setSeverity("success");
      fetchUsers();
    } catch (err) {
      setSeverity("error");
      setMessage(err.response?.data?.detail || t('user_action_failed', { action: actionType }));
    } finally {
      setOpenSnackbar(true);
      setConfirmDialogOpen(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const OnOffSwitch = styled(Switch)(({ theme }) => ({
    width: 42, // ⬅ smaller width
    height: 20, // ⬅ smaller height
    padding: 0,
    display: "flex",

    "& .MuiSwitch-switchBase": {
      padding: 2,
      marginLeft: -1,
      "&.Mui-checked": {
        transform: "translateX(22px)", // ⬅ adjusted for smaller width
        color: "#1976d2",
        "& + .MuiSwitch-track": {
          backgroundColor: "#1976d2",
          opacity: 1,
        },
      },
    },

    "& .MuiSwitch-thumb": {
      width: 16, // ⬅ smaller thumb
      height: 16,
      backgroundColor: "#fff",
    },

    "& .MuiSwitch-track": {
      borderRadius: 10,
      backgroundColor: "#000",
      opacity: 1,
    },
  }));

  const ApproveSwitch = styled(Switch)(({ theme }) => ({
    width: 42,
    height: 20,
    padding: 0,
    display: "flex",

    "& .MuiSwitch-switchBase": {
      padding: 2,
      marginLeft: -1,
      "&.Mui-checked": {
        transform: "translateX(22px)",
        color: "#2e7d32", // ✅ green thumb when checked
        "& + .MuiSwitch-track": {
          backgroundColor: "#2e7d32", // ✅ green track
          opacity: 1,
        },
      },
    },

    "& .MuiSwitch-thumb": {
      width: 16,
      height: 16,
      backgroundColor: "#fff",
    },

    "& .MuiSwitch-track": {
      borderRadius: 10,
      backgroundColor: "#ef6c00", // 🟠 orange for pending
      opacity: 0.5,
    },
  }));


  /* ================= Columns ================= */
  const columns = [
    {
      field: "user_name",
      headerName: t('user_name'),
      flex: 1.5,
      minWidth: 150,
      sortable: true,
    },
    {
      field: "email",
      headerName: t('email'),
      flex: 1.5,
      minWidth: 200,
      sortable: true,
    },
    {
      field: "phone",
      headerName: t('phone'),
      flex: 1.5,
      minWidth: 100,
      sortable: true,
    },
    {
      field: "user_type",
      headerName: t('user_type'),
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
      headerName: t('active_status'),
      flex: 1,
      minWidth: 120,
      renderCell: ({ row }) => {
        const isActive = row.is_active;

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center", // vertical center
              justifyContent: "center", // horizontal center
              gap: 1,
              width: "100%", // IMPORTANT
              height: "100%", // ensure full cell height
            }}
          >
            <Chip
              size="small"
              label={isActive ? t('active') : t('inactive')}
              sx={{
                fontWeight: 600,
                fontSize: 12,
                borderRadius: 1.5,
                px: 1.2,
                py: 0.3,
                bgcolor: isActive ? "#e8f5e9" : "#f5f5f5",
                color: isActive ? "#2e7d32" : "#616161",
              }}
            />

            <OnOffSwitch
              checked={isActive}
              onChange={() =>
                isActive ? confirmDisable(row) : confirmEnable(row)
              }
            />
          </Box>
        );
      },
    },

    {
      field: "approved",
      headerName: t('approval'),
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: ({ row }) => {
        if (row.user_type !== 2) return null;

        const isApproved = row.approved === true;

        const handleToggle = () => {
          if (!isApproved) {
            confirmApprove(row);
          }
        };

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center", // vertical center
              justifyContent: "center",
              gap: 1,
              width: "100%", // IMPORTANT
              height: "100%",
            }}
          >
            {/* Status Chip */}
            <Chip
              size="small"
              label={isApproved ? t('approved') : t('pending')}
              sx={{
                fontWeight: 600,
                fontSize: 12,
                borderRadius: 2,
                px: 1.2,
                bgcolor: isApproved ? "#e8f5e9" : "#fff3e0",
                color: isApproved ? "#2e7d32" : "#ef6c00",
              }}
            />

            {/* Switch */}
            <ApproveSwitch
              checked={isApproved}
              onChange={handleToggle}
              disabled={isApproved}
            />
          </Box>
        );
      },
    },

    {
      field: "actions",
      headerName: t('actions'),
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Tooltip title={t('edit')}>
            <IconButton
              size="small"
              onClick={() => {
                setEditingUser(row);
                setOpen(true);
              }}
              sx={{
                color: "#1976d2",
                "&:hover": {
                  bgcolor: "rgba(25,118,210,0.08)",
                },
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Dialog
        open={openApproveDialog}
        onClose={() => setOpenApproveDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            {t('approve_employer')}
          </Typography>

          <Typography sx={{ mt: 1, color: "text.secondary" }}>
            {t('confirm_approve_message', { name: selectedEmployer?.user_name })}
          </Typography>

          <Stack direction="row" spacing={1.5} justifyContent="flex-end" mt={3}>
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: "none" }}
              onClick={() => setOpenApproveDialog(false)}
            >
              {t('cancel')}
            </Button>

            <Button
              variant="contained"
              color="success"
              size="small"
              sx={{ textTransform: "none" }}
              onClick={handleApprove}
            >
              {t('approve')}
            </Button>
          </Stack>
        </Box>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={severity} variant="filled">
          {message}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          height: "calc(100vh - 120px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top Bar */}
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="center"
          spacing={2}
          mb={1}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingUser(null);
              setOpen(true);
            }}
          >
            {t('create_user')}
          </Button>
        </Stack>

        {/* DataGrid */}
        <Box
          sx={{
            flex: 1,
            border: "3px solid",
            borderColor: "divider",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <DataGrid
            rows={users}
            columns={columns}
            getRowId={(row) => row.pk_id}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
            }}
            disableRowSelectionOnClick
            rowHeight={52}
            density="compact"
            sx={{
              bgcolor: "#fff",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              "& .MuiDataGrid-columnHeaders": {
                background: "linear-gradient(180deg, #f9fafb, #f1f5f9)",
                fontWeight: 700,
                fontSize: 13,
                borderBottom: "1px solid rgba(0,0,0,0.08)",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "rgba(25,118,210,0.06)",
              },
            }}
          />
        </Box>

        {/* Dialogs */}
        <UserDialog
          open={open}
          onClose={() => setOpen(false)}
          user={editingUser}
          refresh={fetchUsers}
        />

        {/* MUI Confirm Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
        >
          <DialogTitle>
            {actionType === "disable" ? t('confirm_disable') : t('confirm_enable')}
          </DialogTitle>

          <DialogContent>
            <Typography>
              {actionType === "disable" 
                ? t('confirm_disable_message', { name: selectedUser?.user_name })
                : t('confirm_enable_message', { name: selectedUser?.user_name })}
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
              {t('cancel')}
            </Button>

            <Button
              onClick={handleConfirmAction}
              sx={{ textTransform: "none" }}
              variant="contained"
              size="small"
              color={actionType === "disable" ? "error" : "success"}
            >
              {actionType === "disable" ? t('disable') : t('enable')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default AdminUsers;