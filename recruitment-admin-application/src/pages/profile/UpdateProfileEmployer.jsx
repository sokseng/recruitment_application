import {
    Box,
    Button,
    TextField,
    Typography,
    Avatar,
    Divider,
    Stack,
    Menu,
    MenuItem,
    Paper,
    Card,
    CardContent,
    Snackbar,
    Alert,
    Dialog,
    DialogContent,
} from "@mui/material";
import { useState, useEffect } from "react";
import api from "../../services/api";
import { useRef } from "react";
import { Autocomplete, Chip } from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useTranslation } from 'react-i18next';
import VisibilityIcon from "@mui/icons-material/Visibility";
import UploadIcon from "@mui/icons-material/Upload";
import CloseIcon from '@mui/icons-material/Close';

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
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const initialFormData = {
        user_name: "",
        profile_image: "",
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

    const [formData, setFormData] = useState(initialFormData);

    const [severity, setSeverity] = useState('error')
    const [openSnackbar, setOpenSnackbar] = useState(false)
    const [message, setMessage] = useState('')
    const [categories, setCategories] = useState([]);

    const [companyLogoPreview, setCompanyLogoPreview] = useState(null);
    const [companyLogoFile, setCompanyLogoFile] = useState(null);
    const [removeCompanyLogo, setRemoveCompanyLogo] = useState(false);

    const [userProfilePreview, setUserProfilePreview] = useState(null);

    const originalFormRef = useRef(null);
    const originalLogoRef = useRef(null);

    const [companyAnchorEl, setCompanyAnchorEl] = useState(null);
    const openCompanyMenu = Boolean(companyAnchorEl);

    const [openCompanyDialog, setOpenCompanyDialog] = useState(false);

    const handleOpenCompanyMenu = (event) => {
        setCompanyAnchorEl(event.currentTarget);
    };

    const handleCloseCompanyMenu = () => {
        setCompanyAnchorEl(null);
    };

    const handleOpenCompanyDialog = () => {
        setOpenCompanyDialog(true);
    };

    const handleCloseCompanyDialog = () => {
        setOpenCompanyDialog(false);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCompanyLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setCompanyLogoPreview(URL.createObjectURL(file));
        setCompanyLogoFile(file);
        setRemoveCompanyLogo(false);
    };

    const fetchUserProfileEmployer = async () => {
        try {
            const response = await api.get("/employer/profile/update");
            const data = response.data;

            const mappedData = {
                user_name: data.user_name || "",
                profile_image: data.profile_image || "",
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

            originalFormRef.current = mappedData;

            setFormData(mappedData);

            if (data.profile_image) {
                setUserProfilePreview(
                    `${BASE_URL}/uploads/user/profile/${data.profile_image}`
                );
            }

            if (data.company_logo) {
                const logoUrl = `${BASE_URL}/uploads/employers/${data.company_logo}`;
                setCompanyLogoPreview(logoUrl);
                originalLogoRef.current = logoUrl;
            } else {
                setCompanyLogoPreview(null);
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
        setCompanyLogoPreview(originalLogoRef.current);
        setCompanyLogoFile(null);
        setRemoveCompanyLogo(false);

        setUserProfilePreview(
            originalFormRef.current.profile_image
                ? `${BASE_URL}/uploads/user/profile/${originalFormRef.current.profile_image}`
                : null
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const submitData = new FormData();

        submitData.append("user_name", formData.user_name);
        submitData.append("gender", formData.gender);
        submitData.append("phone", formData.phone);
        submitData.append("date_of_birth", formData.date_of_birth);
        submitData.append("address", formData.address);

        submitData.append("company_name", formData.company_name);
        submitData.append("company_email", formData.company_email);
        submitData.append("company_contact", formData.company_contact);
        submitData.append("company_address", formData.company_address);
        submitData.append("company_description", formData.company_description);
        submitData.append("company_website", formData.company_website);

        submitData.append("remove_logo", removeCompanyLogo ? "true" : "false");

        if (companyLogoFile) {
            submitData.append("company_logo", companyLogoFile);
        }

        formData.category_ids.forEach((id) => {
            submitData.append("category_ids", id);
        });

        try {
            const response = await api.post("/employer/profile/updates", submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) {
                setOpenSnackbar(true);
                setSeverity("success");
                setMessage(t('update_success'));

                originalFormRef.current = { ...formData };
                originalLogoRef.current = companyLogoFile
                    ? URL.createObjectURL(companyLogoFile)
                    : companyLogoPreview;
            }
        } catch (error) {
            setOpenSnackbar(true);
            setSeverity("error");
            setMessage(error.response?.data?.detail || t('update_failed'));
        }
    };

    const handleRemoveCompanyLogo = async () => {
        try {
            await api.delete("/employer/profile/company-logo");

            setCompanyLogoPreview(null);
            setCompanyLogoFile(null);
            setFormData(prev => ({ ...prev, company_logo: "" }));
            setRemoveCompanyLogo(false);

            setOpenSnackbar(true);
            setSeverity("success");
            setMessage(t("logo_deleted_success"));
        } catch (err) {
            setOpenSnackbar(true);
            setSeverity("error");
            setMessage(err.response?.data?.detail || t("delete_failed"));
        }
    };

    const uploadProfile = async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await api.post("/user/upload-profile", formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const imageUrl = `${BASE_URL}${res.data.profile_image}`;

            setUserProfilePreview(imageUrl);

        } catch (error) {
            setOpenSnackbar(true);
            setSeverity("error");
            setMessage(error.response?.data?.detail || "Upload failed");
        }
    };

    const handleDeleteUserProfile = async () => {
        try {
            await api.delete("/user/delete-profile");

            setUserProfilePreview(null);
            setFormData(prev => ({ ...prev, profile_image: "" }));

            setOpenSnackbar(true);
            setSeverity("success");
            setMessage("Profile image deleted successfully");
        } catch (error) {
            setOpenSnackbar(true);
            setSeverity("error");
            setMessage(error.response?.data?.detail || "Delete failed");
        }
    };

    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
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
                                    <Box sx={{ gridColumn: "1 / -1", display: 'flex', justifyContent: 'center', mb: 3 }}>
                                        {/* Hidden file input */}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            id="company-logo-input"
                                            onChange={handleCompanyLogoChange}
                                        />

                                        {/* Avatar clickable */}
                                        <Box sx={{ position: "relative" }}>
                                            <Tooltip title={t('click_to_change_logo')}>
                                                <Avatar
                                                    src={companyLogoPreview}
                                                    onClick={handleOpenCompanyMenu}
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

                                            <Menu
                                                anchorEl={companyAnchorEl}
                                                open={openCompanyMenu}
                                                onClose={handleCloseCompanyMenu}
                                                anchorOrigin={{
                                                    vertical: "bottom",
                                                    horizontal: "center",
                                                }}
                                                transformOrigin={{
                                                    vertical: "top",
                                                    horizontal: "center",
                                                }}
                                            >
                                                {companyLogoPreview && (
                                                    <MenuItem
                                                        onClick={() => {
                                                            handleOpenCompanyDialog();
                                                            handleCloseCompanyMenu();
                                                        }}
                                                    >
                                                        <VisibilityIcon sx={{ mr: 1 }} /> View
                                                    </MenuItem>
                                                )}

                                                <MenuItem
                                                    onClick={() => {
                                                        document.getElementById("company-logo-input").click();
                                                        handleCloseCompanyMenu();
                                                    }}
                                                >
                                                    <UploadIcon sx={{ mr: 1 }} /> Upload
                                                </MenuItem>

                                                {companyLogoPreview && (
                                                    <MenuItem
                                                        onClick={() => {
                                                            handleRemoveCompanyLogo();
                                                            handleCloseCompanyMenu();
                                                        }}
                                                        sx={{ color: "error.main" }}
                                                    >
                                                        <DeleteIcon sx={{ mr: 1 }} /> Delete
                                                    </MenuItem>
                                                )}
                                            </Menu>
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
                                        <Box sx={{ gridColumn: "1 / -1", display: 'flex', justifyContent: 'center', mb: 1 }}>
                                            <Box sx={{ position: "relative" }}>

                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    hidden
                                                    id="user-profile-input"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            uploadProfile(file);
                                                        }
                                                        handleCloseMenu();
                                                    }}
                                                />

                                                <Avatar
                                                    onClick={handleOpenMenu}
                                                    sx={{
                                                        width: 72,
                                                        height: 72,
                                                        cursor: "pointer",
                                                        border: "2px dashed",
                                                        borderColor: "primary.main",
                                                        bgcolor: "#f5f5f5",
                                                    }}
                                                    src={
                                                        userProfilePreview ||
                                                        (formData.profile_image
                                                            ? `${BASE_URL}/uploads/user/profile/${formData.profile_image}`
                                                            : null)
                                                    }
                                                >
                                                    {formData.user_name.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Tooltip title={t('upload_logo')}>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => document.getElementById("user-profile-input").click()}
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

                                                <Menu
                                                    anchorEl={anchorEl}
                                                    open={openMenu}
                                                    onClose={handleCloseMenu}
                                                    anchorOrigin={{
                                                        vertical: "bottom",
                                                        horizontal: "center",
                                                    }}
                                                    transformOrigin={{
                                                        vertical: "top",
                                                        horizontal: "center",
                                                    }}
                                                >
                                                    {userProfilePreview && (
                                                        <MenuItem
                                                            onClick={() => {
                                                                window.open(userProfilePreview, "_blank");
                                                                handleCloseMenu();
                                                            }}
                                                        >
                                                            <VisibilityIcon sx={{ mr: 1 }} /> View
                                                        </MenuItem>
                                                    )}

                                                    <MenuItem
                                                        onClick={() => {
                                                            document.getElementById("user-profile-input").click();
                                                        }}
                                                    >
                                                        <UploadIcon sx={{ mr: 1 }} /> Upload
                                                    </MenuItem>

                                                    {userProfilePreview && (
                                                        <MenuItem
                                                            onClick={handleDeleteUserProfile}
                                                            sx={{ color: "error.main" }}
                                                        >
                                                            <DeleteIcon sx={{ mr: 1 }} /> Delete
                                                        </MenuItem>
                                                    )}
                                                </Menu>
                                            </Box>
                                        </Box>
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
                                <Button variant="outlined" size="small" color="secondary" type="button" onClick={handleResetForm}>
                                    {t('reset_form')}
                                </Button>
                                <Button variant="contained" size="small" type="submit">
                                    {t('save_changes')}
                                </Button>
                            </Stack>
                        </form>
                    </CardContent>
                </Card>
            </Box>

            <Dialog
                open={openCompanyDialog}
                onClose={handleCloseCompanyDialog}
                maxWidth="sm"
                fullWidth
            >

                <DialogContent sx={{ textAlign: "center" }}>
                    {companyLogoPreview && (
                        <Box
                            component="img"
                            src={companyLogoPreview}
                            alt="Company Logo"
                            sx={{
                                maxWidth: "100%",
                                maxHeight: 400,
                                borderRadius: 2,
                            }}
                        />
                    )}
                </DialogContent>

                <IconButton
                    onClick={handleCloseCompanyDialog}
                    sx={{
                        position: 'absolute',
                        top: 5,
                        right: 5
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </Dialog>
        </>

    );
};

export default UpdateProfileEmployer;