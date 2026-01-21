import React, { useEffect, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Stack,
    Divider,
    Chip,
    Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import api from "../services/api";
import UserDialog from "./UserDialog";

/* ================= Role Color Styles ================= */
const ROLE_STYLES = {
    primary: {
        bg: "linear-gradient(135deg, #e3f2fd, #f8fbff)",
        header: "#1976d2",
    },
    secondary: {
        bg: "linear-gradient(135deg, #f3e5f5, #fcf7fd)",
        header: "#9c27b0",
    },
    success: {
        bg: "linear-gradient(135deg, #e8f5e9, #f6fff7)",
        header: "#2e7d32",
    },
};

/* ================= User Card ================= */
const UserCard = ({ user, onEdit }) => (
    <Card
        sx={{
            mb: 1.5,
            borderRadius: 3,
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            transition: "0.25s",
            "&:hover": {
                boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
                transform: "translateY(-3px)",
            },
        }}
    >
        <CardContent sx={{ py: 1.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                    sx={{
                        width: 46,
                        height: 46,
                        fontWeight: 700,
                        bgcolor: "primary.main",
                    }}
                >
                    {user.user_name?.[0]?.toUpperCase()}
                </Avatar>

                <Box flex={1} minWidth={0}>
                    <Typography fontWeight={600} noWrap>
                        {user.user_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {user.email}
                    </Typography>
                </Box>

                <Stack spacing={0.5} alignItems="flex-end">
                    <Chip
                        size="small"
                        label={user.is_active ? "Active" : "Inactive"}
                        sx={{
                            fontSize: 11,
                            height: 20,
                            bgcolor: user.is_active ? "#e8f5e9" : "#f5f5f5",
                        }}
                    />
                    <Button size="small" variant="text" onClick={() => onEdit(user)}>
                        Edit
                    </Button>
                </Stack>
            </Stack>
        </CardContent>
    </Card>
);

/* ================= Column ================= */
const RoleColumn = ({ title, color, users, onEdit }) => {
    const styles = ROLE_STYLES[color];

    return (
        <Card
            sx={{
                height: "100%",
                borderRadius: 4, // ⬅ was 5
                display: "flex",
                flexDirection: "column",
                background: styles.bg,
                backdropFilter: "blur(6px)",
                boxShadow: "0 8px 22px rgba(0,0,0,0.06)", // ⬅ softer & smaller
            }}
        >
            {/* Sticky Header */}
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    px: 1.5,   // ⬅ was 2
                    py: 1,     // ⬅ was 1.5
                    background: "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(8px)",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                }}
            >
                <Typography
                    variant="subtitle1" // ⬅ was h6
                    fontWeight={700}    // ⬅ slightly lighter
                    sx={{ color: styles.header }}
                >
                    {title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {users.length} users
                </Typography>
            </Box>

            {/* Scroll Area */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 1.5 }}> {/* ⬅ was 2 */}
                {users.length ? (
                    users.map((user) => (
                        <UserCard key={user.pk_id} user={user} onEdit={onEdit} />
                    ))
                ) : (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                        mt={4} // ⬅ was 6
                    >
                        No users
                    </Typography>
                )}
            </Box>
        </Card>

    );
};

/* ================= Main Component ================= */
const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = async () => {
        const res = await api.get("/user");
        setUsers(res.data);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <Box
            sx={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                background:
                    "linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%)",
            }}
        >
            {/* Top Bar */}
            <Stack
                direction="row"
                justifyContent="flex-end"
                px={2}
                py={0.75}
                sx={{
                    background: "#fff",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                }}
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
                    Create User
                </Button>
            </Stack>

            {/* 3 Columns */}
            <Box
                sx={{
                    flex: 1,
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 1.25,
                    p: 0.75,
                    minHeight: 0,
                }}
            >
                <RoleColumn
                    title="Admins"
                    color="primary"
                    users={users.filter((u) => u.user_type === 1)}
                    onEdit={(u) => {
                        setEditingUser(u);
                        setOpen(true);
                    }}
                />

                <RoleColumn
                    title="Employers"
                    color="secondary"
                    users={users.filter((u) => u.user_type === 2)}
                    onEdit={(u) => {
                        setEditingUser(u);
                        setOpen(true);
                    }}
                />

                <RoleColumn
                    title="Candidates"
                    color="success"
                    users={users.filter((u) => u.user_type === 3)}
                    onEdit={(u) => {
                        setEditingUser(u);
                        setOpen(true);
                    }}
                />
            </Box>

            {/* Create / Update Dialog */}
            <UserDialog
                open={open}
                onClose={() => setOpen(false)}
                user={editingUser}
                refresh={fetchUsers}
            />
        </Box>
    );
};

export default AdminUsers;
