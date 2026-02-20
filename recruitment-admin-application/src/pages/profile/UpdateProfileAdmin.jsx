import {
    Box,
    Button,
    TextField,
    Typography,
    Divider,
    Stack,
    MenuItem,
    Paper,
    Snackbar,
    Alert,
} from "@mui/material";
import { useState, useEffect } from "react";
import api from "../../services/api";
import useAuthStore from "../../store/useAuthStore";
import { useRef } from "react";
import { useTranslation } from 'react-i18next';

const SectionBox = ({ title, children }) => (
    <Paper
        elevation={0}
        sx={{
            p: 2,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "#fafafa",
            mb: 2,
        }}
    >
        <Typography variant="h6" fontWeight={600} mb={2}>
            {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {children}
    </Paper>
);

const UpdateProfileAdmin = () => {
    const { t } = useTranslation();
    const initialFormData = {
        user_name: "",
        email: "",
        phone: "",
        gender: "",
        date_of_birth: "",
        address: "",
    };

    const originalFormRef = useRef(null);
    const [formData, setFormData] = useState(initialFormData);
    const [severity, setSeverity] = useState('error')
    const [openSnackbar, setOpenSnackbar] = useState(false)
    const [message, setMessage] = useState('')
    const {
        setUserData,
    } = useAuthStore()

    // Load data from API on mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get("/user/profile");
                const data = response.data;

                setFormData({
                    user_name: data.user_name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    gender: data.gender || "",
                    date_of_birth: data.date_of_birth || "",
                    address: data.address || "",
                });

                const mappedData = {
                    user_name: data.user_name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    gender: data.gender || "",
                    date_of_birth: data.date_of_birth || "",
                    address: data.address || "",
                };

                // ✅ save ORIGINAL (once)
                originalFormRef.current = mappedData;

                setFormData(mappedData);

            } catch (error) {
                console.error("Failed to load profile:", error);
            }
        };

        fetchUserData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleResetForm = () => {
        if (!originalFormRef.current) return;

        setFormData({ ...originalFormRef.current });
        
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put("/user/profile", formData);
            if (response.status === 200) {
                setOpenSnackbar(true)
                setSeverity("success")
                setMessage(t('update_success'))
                setUserData(response.data)
            }

        } catch (error) {
            setOpenSnackbar(true)
            setSeverity("error")
            setMessage(error.response?.data?.detail || t('update_failed'))
        }
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

            <Box
                sx={{
                    minHeight: "auto",
                    bgcolor: "#f0f2f5",
                    py: { xs: 4, md: 6 },
                    px: { xs: 2, md: 4 },
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                }}
            >
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        width: "100%",
                        maxWidth: 700,
                    }}
                >
                    <Paper
                        sx={{
                            p: { xs: 3, md: 4 },
                            borderRadius: 4,
                            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                            bgcolor: "#fff",
                        }}
                    >
                        <SectionBox title={t('personal_information')}>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                    gap: 2,
                                }}
                            >
                                <TextField
                                    label={t('user_name')}
                                    required
                                    name="user_name"
                                    value={formData.user_name}
                                    onChange={handleChange}
                                    size="small"
                                    fullWidth
                                />
                                <TextField
                                    label={t('email')}
                                    name="email"
                                    disabled
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    size="small"
                                    fullWidth
                                />
                                <TextField
                                    label={t('phone')}
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    size="small"
                                    fullWidth
                                />
                                <TextField
                                    select
                                    label={t('gender')}
                                    required
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    size="small"
                                    fullWidth
                                >
                                    <MenuItem value="Male">{t('male')}</MenuItem>
                                    <MenuItem value="Female">{t('female')}</MenuItem>
                                </TextField>
                                <TextField
                                    label={t('date_of_birth')}
                                    required
                                    name="date_of_birth"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.date_of_birth}
                                    onChange={handleChange}
                                    size="small"
                                    fullWidth
                                />
                                <Box sx={{ gridColumn: "1 / -1" }}>
                                    <TextField
                                        label={t('address')}
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        multiline
                                        rows={3}
                                        size="small"
                                        fullWidth
                                    />
                                </Box>
                            </Box>
                        </SectionBox>

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="flex-end"
                            spacing={2}
                            mt={2}
                        >
                            <Button
                                variant="contained"
                                size="small"
                                type="submit"
                                fullWidth={{ xs: true, sm: false }}
                            >
                                {t('save_changes')}
                            </Button>
                            <Button
                                variant="outlined"
                                color="secondary"
                                type="button"
                                size="small"
                                onClick={handleResetForm}
                                fullWidth={{ xs: true, sm: false }}
                            >
                                {t('reset_form')}
                            </Button>
                        </Stack>
                    </Paper>
                </Box>
            </Box>
        </>

    );
};

export default UpdateProfileAdmin;