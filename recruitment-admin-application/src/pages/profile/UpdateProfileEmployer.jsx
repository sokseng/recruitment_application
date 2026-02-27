import {
    Box,
    Button,
    TextField,
    Typography,
    Avatar,
    Divider,
    Stack,
    MenuItem,
    Paper,
    Card,
    CardContent,
    Snackbar,
    Alert,
} from "@mui/material";
import { useState, useEffect } from "react";
import api from "../../services/api";
import { useRef } from "react";
import { Autocomplete, Chip, InputAdornment } from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useTranslation } from 'react-i18next';
import useAuthStore from "../../store/useAuthStore"

const SectionBox = ({ title, children }) => (
    <Paper
        elevation={0}
        sx={{
            p: 1,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "#fafafa",
        }}
    >
        <Typography variant="subtitle1" fontWeight={600} mb={1}>
            {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {children}
    </Paper>
);

const UpdateProfileEmployer = () => {
    const { t } = useTranslation();
    
    const initialFormData = {
        user_name: "",
        email: "",
        phone: "",
        gender: "",
        date_of_birth: "",
        address: "",
        company_name: "",
        company_email: "",
        company_contact: "",
        company_address: "",
        company_description: "",
        company_website: "",
        category_ids: [],
    };

    const {
        setUserData,
        user_data
    } = useAuthStore()
    const [formData, setFormData] = useState(initialFormData);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [severity, setSeverity] = useState('error')
    const [openSnackbar, setOpenSnackbar] = useState(false)
    const [message, setMessage] = useState('')
    const [categories, setCategories] = useState([]);
    const [removeLogo, setRemoveLogo] = useState(false);

    const originalFormRef = useRef(null);
    const originalLogoRef = useRef(null);

    const selectedCategories = categories.filter(cat =>
        formData.category_ids.includes(cat.pk_id)
    );

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLogoPreview(URL.createObjectURL(file));
        setLogoFile(file);
        setRemoveLogo(false);
    };

    const handleResetLogo = () => {
        setLogoPreview(null);
        setLogoFile(null);
        setRemoveLogo(true);
    };

    const fetchUserProfileEmployer = async () => {
        try {
            const response = await api.get("/employer/profile/update");
            const data = response.data;

            const mappedData = {
                user_name: data.user_name || "",
                email: data.email || "",
                phone: data.phone || "",
                gender: data.gender || "",
                date_of_birth: data.date_of_birth || "",
                address: data.address || "",
                company_name: data.company_name || "",
                company_email: data.company_email || "",
                company_contact: data.company_contact || "",
                company_address: data.company_address || "",
                company_description: data.company_description || "",
                company_website: data.company_website || "",
                category_ids: data.categories?.map(c => c.id) || [],
            };

            // ✅ save ORIGINAL (once)
            originalFormRef.current = mappedData;

            setFormData(mappedData);

            // ✅ logo
            if (data.company_logo) {
                const logoUrl = `${import.meta.env.VITE_API_BASE_URL}/uploads/employers/${data.company_logo}`;
                setLogoPreview(logoUrl);
                originalLogoRef.current = logoUrl;
            } else {
                setLogoPreview(null);
                originalLogoRef.current = null;
            }

        } catch (error) {
            console.error("Failed to load user profile employer:", error);
        }
    };

    useEffect(() => {
        fetchUserProfileEmployer();

        const fetchCategories = async () => {
            try {
                const res = await api.get("/categories/");
                const normalized = (res.data || []).map(cat => ({
                    ...cat,
                    id: Number(cat.id),
                }));
                setCategories(normalized);
            } catch (err) {
                console.error("Failed to load categories");
            }
        };

        fetchCategories();
    }, []);


    const handleResetForm = () => {
        if (!originalFormRef.current) return;

        setFormData({ ...originalFormRef.current });
        setLogoPreview(originalLogoRef.current);
        setRemoveLogo(false);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        const submitData = new FormData();

        // Personal info
        submitData.append("user_name", formData.user_name);
        submitData.append("gender", formData.gender);
        submitData.append("phone", formData.phone);
        submitData.append("date_of_birth", formData.date_of_birth);
        submitData.append("address", formData.address);

        // Company info
        submitData.append("company_name", formData.company_name);
        submitData.append("company_email", formData.company_email);
        submitData.append("company_contact", formData.company_contact);
        submitData.append("company_address", formData.company_address);
        submitData.append("company_description", formData.company_description);
        submitData.append("company_website", formData.company_website);

        // Logo file
        if (logoFile) {
            submitData.append("company_logo", logoFile);
        }

        submitData.append("remove_logo", removeLogo);

        formData.category_ids.forEach((id) => {
            submitData.append("category_ids", id);
        });

        try {
            const response = await api.post("/employer/profile/updates", submitData, {
                headers: {
                    // Override headers for FormData
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status == 200) {
                setUserData({
                    ...user_data,
                    user_data: {
                        ...response.data,
                    },
                });
                setOpenSnackbar(true)
                setSeverity("success")
                setMessage(t('update_success'))
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
                    maxWidth: 1200,
                    mx: "auto",
                    p: 2,
                    bgcolor: "#f0f2f5",
                    borderRadius: 3,
                }}
            >
                <Card elevation={4} sx={{ borderRadius: 4 }}>
                    <CardContent>
                        {/* Wrap in form */}
                        <form onSubmit={handleSubmit}>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                                    gap: 3,
                                }}
                            >
                                {/* Company Info */}
                                <SectionBox title={t('company_information')}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                                        {/* Hidden file input */}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            id="company-logo-input"
                                            onChange={handleLogoChange}
                                        />

                                        {/* Avatar clickable */}
                                        <Box sx={{ position: "relative" }}>
                                            <Tooltip title={t('click_to_change_logo')}>
                                                <Avatar
                                                    src={logoPreview}
                                                    onClick={() => document.getElementById("company-logo-input").click()}
                                                    sx={{
                                                        width: 72,
                                                        height: 72,
                                                        cursor: "pointer",
                                                        border: "2px dashed",
                                                        borderColor: "primary.main",
                                                        bgcolor: "#f5f5f5",
                                                    }}
                                                />
                                            </Tooltip>

                                            {/* Upload icon */}
                                            <Tooltip title={t('upload_logo')}>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => document.getElementById("company-logo-input").click()}
                                                    sx={{
                                                        position: "absolute",
                                                        bottom: -6,
                                                        right: -6,
                                                        bgcolor: "white",
                                                        boxShadow: 2,
                                                    }}
                                                >
                                                    <PhotoCameraIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            {/* Remove icon */}
                                            {logoPreview && (
                                                <Tooltip title={t('remove_logo')}>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={handleResetLogo}
                                                        sx={{
                                                            position: "absolute",
                                                            top: -6,
                                                            right: -6,
                                                            bgcolor: "white",
                                                            boxShadow: 2,
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>


                                    </Box>

                                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                                        <TextField
                                            label={t('company_name')}
                                            name="company_name"
                                            required
                                            value={formData.company_name}
                                            onChange={handleChange}
                                            size="small"
                                            fullWidth
                                        />
                                        <TextField
                                            label={t('company_email')}
                                            type="email"
                                            name="company_email"
                                            value={formData.company_email}
                                            onChange={handleChange}
                                            size="small"
                                            fullWidth
                                        />
                                        <TextField
                                            label={t('company_phone')}
                                            name="company_contact"
                                            value={formData.company_contact}
                                            onChange={handleChange}
                                            size="small"
                                            fullWidth
                                        />
                                        <TextField
                                            label={t('company_website')}
                                            name="company_website"
                                            value={formData.company_website}
                                            onChange={handleChange}
                                            size="small"
                                            fullWidth
                                        />

                                        <Box sx={{ gridColumn: "1 / -1" }}>
                                            <Autocomplete
                                                multiple
                                                fullWidth
                                                size="small"
                                                options={categories}
                                                value={categories.filter(cat => formData.category_ids.includes(cat.pk_id))}
                                                getOptionLabel={(option) => option.name}
                                                isOptionEqualToValue={(option, value) => option.pk_id === value.pk_id}
                                                onChange={(_, newValue) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        category_ids: newValue.map(cat => cat.pk_id),
                                                    }));
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label={t('company_categories')}
                                                        placeholder={t('select_categories')}
                                                        size="small"
                                                        fullWidth
                                                    />
                                                )}
                                                renderTags={(value, getTagProps) =>
                                                    value.map((option, index) => (
                                                        <Chip
                                                            key={option.pk_id}
                                                            label={option.name}
                                                            size="small"
                                                            {...getTagProps({ index })}
                                                        />
                                                    ))
                                                }
                                            />


                                        </Box>


                                        <Box sx={{ gridColumn: "1 / -1" }}>
                                            <TextField
                                                label={t('company_address')}
                                                name="company_address"
                                                value={formData.company_address}
                                                onChange={handleChange}
                                                multiline
                                                rows={2}
                                                size="small"
                                                fullWidth
                                            />
                                        </Box>
                                        <Box sx={{ gridColumn: "1 / -1" }}>
                                            <TextField
                                                label={t('company_description')}
                                                name="company_description"
                                                value={formData.company_description}
                                                onChange={handleChange}
                                                multiline
                                                rows={2}
                                                size="small"
                                                fullWidth
                                            />
                                        </Box>
                                    </Box>
                                </SectionBox>

                                {/* User Info */}
                                <SectionBox title={t('user_information')}>
                                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
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
                                            required
                                            disabled
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
                                                rows={2}
                                                size="small"
                                                fullWidth
                                            />
                                        </Box>
                                    </Box>
                                </SectionBox>
                            </Box>

                            {/* Action Buttons */}
                            <Stack direction="row" justifyContent="flex-end" mt={2} spacing={1}>
                                <Button variant="contained" size="small" type="submit">
                                    {t('save_changes')}
                                </Button>
                                <Button variant="outlined" size="small" color="secondary" type="button" onClick={handleResetForm}>
                                    {t('reset_form')}
                                </Button>
                            </Stack>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </>

    );
};

export default UpdateProfileEmployer;