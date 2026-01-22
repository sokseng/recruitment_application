import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    TextField,
    MenuItem,
    InputAdornment,
    IconButton,
    Snackbar,
    Alert,
    Box
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useState, useEffect } from "react";
import api from "../services/api";

const EMPTY_FORM = {
    pk_id: null,
    user_type: "",
    user_name: "",
    email: "",
    password: "",
    gender: "",
    phone: "",
    date_of_birth: "",
    address: "",
};

const UserDialog = ({ open, onClose, user, refresh }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [severity, setSeverity] = useState('error')
    const [openSnackbar, setOpenSnackbar] = useState(false)
    const [message, setMessage] = useState('')

    /* ================= Load edit data ================= */
    useEffect(() => {
        if (user) {
            setForm({
                pk_id: user.pk_id, // ⭐ IMPORTANT
                user_type: user.user_type ?? "",
                user_name: user.user_name ?? "",
                email: user.email ?? "",
                password: "",
                gender: user.gender ?? "",
                phone: user.phone ?? "",
                date_of_birth: user.date_of_birth ?? "",
                address: user.address ?? "",
            });
        } else {
            setForm(EMPTY_FORM);
        }
    }, [user]);

    /* ================= Handle change ================= */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    /* ================= Build payload ================= */
    const buildPayload = () => {
        const payload = {
            user_name: form.user_name,
            password: form.password,
            email: form.email,
            user_type: form.user_type,
            gender: form.gender || null,
            phone: form.phone || null,
            date_of_birth: form.date_of_birth || null,
            address: form.address || null,
            is_active: true,
        };

        // UPDATE → include pk_id
        if (form.pk_id) {
            payload.pk_id = form.pk_id;
        }

        // CREATE → require password
        if (!form.pk_id) {
            payload.password = form.password;
        }

        return payload;
    };

    /* ================= Submit ================= */
    const handleSubmit = async (e) => {
        try {
            e.preventDefault();

            const payload = buildPayload();

            // ⭐ ALWAYS POST
            const res = await api.post("/user/create-or-update", payload);

            if (res.status == 200) {
                refresh();
                onClose();
                setSeverity('success')
                setMessage('Create or Update successfully')
                setOpenSnackbar(true)
            }
        } catch (err) {
            if (err.response && err.response.status === 400 && err.response.data?.detail === 'Email already exists') {
                setSeverity('error')
                setMessage(err.response?.data?.detail || 'Email already exists')
                setOpenSnackbar(true)
            } else {
                setSeverity('error')
                setMessage(err.response?.data?.detail || 'Failed to update user')
                setOpenSnackbar(true)
                console.log(err)
            }

        };
    };

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

            <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
                <DialogTitle>
                    {form.pk_id ? "Update User" : "Create User"}
                </DialogTitle>

                {/* ✅ FORM wrapper */}
                <Box component="form" onSubmit={handleSubmit}>
                    <DialogContent dividers
                        sx={{
                            maxHeight: "65vh",
                            overflowY: "auto",
                            pr: 2,

                            /* Scrollbar width */
                            "&::-webkit-scrollbar": {
                                width: "6px",
                            },

                            /* Scrollbar track */
                            "&::-webkit-scrollbar-track": {
                                background: "transparent",
                            },

                            /* Scrollbar thumb */
                            "&::-webkit-scrollbar-thumb": {
                                backgroundColor: "#c1c1c1",
                                borderRadius: "10px",
                            },

                            "&::-webkit-scrollbar-thumb:hover": {
                                backgroundColor: "#a8a8a8",
                            },
                        }}
                    >
                        <Stack spacing={2}>
                            <TextField
                                size="small"
                                name="user_type"
                                label="User Type"
                                select
                                value={form.user_type}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value={1}>Admin</MenuItem>
                                <MenuItem value={2}>Employer</MenuItem>
                                <MenuItem value={3}>Candidate</MenuItem>
                            </TextField>

                            <TextField
                                size="small"
                                name="user_name"
                                label="Username"
                                value={form.user_name}
                                onChange={handleChange}
                                required
                            />

                            <TextField
                                size="small"
                                name="email"
                                label="Email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />

                            {!form.pk_id && (
                                <TextField
                                    size="small"
                                    name="password"
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            )}

                            <TextField
                                size="small"
                                name="gender"
                                label="Gender"
                                select
                                value={form.gender}
                                onChange={handleChange}
                            >
                                <MenuItem value="Male">Male</MenuItem>
                                <MenuItem value="Female">Female</MenuItem>
                            </TextField>

                            <TextField
                                size="small"
                                name="phone"
                                label="Phone"
                                value={form.phone}
                                onChange={handleChange}
                            />

                            <DatePicker
                                label="Date of Birth"
                                format="YYYY-MM-DD"
                                value={form.date_of_birth ? dayjs(form.date_of_birth) : null}
                                onChange={(newValue) => {
                                    setForm((prev) => ({
                                        ...prev,
                                        date_of_birth: newValue ? newValue.format("YYYY-MM-DD") : "",
                                    }));
                                }}
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        fullWidth: true,
                                    },
                                }}
                            />

                            <TextField
                                size="small"
                                name="address"
                                label="Address"
                                multiline
                                rows={2}
                                value={form.address}
                                onChange={handleChange}
                            />
                        </Stack>
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={onClose}>Cancel</Button>

                        {/* ✅ submit triggers browser validation */}
                        <Button variant="contained" type="submit">
                            {form.pk_id ? "Update" : "Create"}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>


        </>

    );
};

export default UserDialog;
