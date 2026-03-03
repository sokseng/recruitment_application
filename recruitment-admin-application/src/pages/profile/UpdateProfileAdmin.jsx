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
    Tooltip,
    Avatar,
    IconButton, Menu
} from "@mui/material";
import { useState, useEffect } from "react";
import api from "../../services/api";
import useAuthStore from "../../store/useAuthStore";
import { useRef } from "react";
import { useTranslation } from 'react-i18next';
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import UploadIcon from "@mui/icons-material/Upload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import ViewProfileDialog from "./dialog/ViewProfileDialog";
import DeleteProfileDialog from "./dialog/DeleteProfileDialog";

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
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const initialFormData = {
        user_name: "",
        profile_image: "",
        email: "",
        phone: "",
        gender: "",
        date_of_birth: "",
        address: "",
    };
    const [userProfilePreview, setUserProfilePreview] = useState(null);
    const [openProfilePreview, setOpenProfilePreview] = useState(false);
    const [openDeleteProfile, setOpenDeleteProfile] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const [isDirty, setIsDirty] = useState(false);

    const originalFormRef = useRef(null);
    const [formData, setFormData] = useState(initialFormData);
    const [severity, setSeverity] = useState('error')
    const [openSnackbar, setOpenSnackbar] = useState(false)
    const [message, setMessage] = useState('')
    const {
        setUserData,
        user_data
    } = useAuthStore()

    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);

    useEffect(() => {
        if (!originalFormRef.current) return;

        const isChanged =
            JSON.stringify(formData) !==
            JSON.stringify(originalFormRef.current);

        setIsDirty(isChanged);
    }, [formData]);

    // Load data from API on mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get("/user/profile");
                const data = response.data;

                const mappedData = {
                    user_name: data.user_name || "",
                    profile_image: data.profile_image || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    gender: data.gender || "",
                    date_of_birth: data.date_of_birth || "",
                    address: data.address || "",
                };

                setUserData({
                    ...user_data,
                    user_data: {
                        ...data,
                    },
                });

                if (data.profile_image) {
                    setUserProfilePreview(
                        `${BASE_URL}/uploads/user/profile/${data.profile_image}`
                    );
                }

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

        const original = originalFormRef.current;

        if (original.profile_image) {
            setUserProfilePreview(
                `${BASE_URL}/uploads/user/profile/${original.profile_image}`
            );
        } else {
            setUserProfilePreview(null);
        }

        setFormData({ ...original });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put("/user/profile", formData);
            if (response.status === 200) {
                setOpenSnackbar(true)
                setSeverity("success")
                setMessage(t('update_success'))

                setUserData({
                    ...user_data,
                    user_data: {
                        ...response.data,
                    },
                });
                originalFormRef.current = formData;
                setIsDirty(false);
            }

        } catch (error) {
            setOpenSnackbar(true)
            setSeverity("error")
            setMessage(error.response?.data?.detail || t('update_failed'))
        }
    };

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const uploadProfile = async (file) => {
        try {
            const formDataObj = new FormData();
            formDataObj.append("file", file);

            const res = await api.post("/user/upload-profile", formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const filename = res.data.profile_image;

            setFormData(prev => ({
                ...prev,
                profile_image: filename
            }));

            setUserProfilePreview(
                `${BASE_URL}/uploads/user/profile/${filename}`
            );

            setUserData({
                ...user_data,
                profile_image: filename,
            });

        } catch (error) {
            console.error("Upload failed:", error);
        }
    };

    const handleDeleteUserProfile = async () => {
        setLoading(true);
        try {
            await api.delete("/user/delete-profile");

            setFormData(prev => ({
                ...prev,
                profile_image: ""
            }));

            setUserProfilePreview(null);

            setUserData({
                ...user_data,
                user_data: {
                    ...user_data.user_data,
                    profile_image: null,
                }
            });

            handleCloseMenu();
            setOpenDeleteProfile(false);

        } catch (error) {
            console.error("Delete failed:", error);
        } finally {
            setLoading(false);
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
                                <Box sx={{ gridColumn: "1 / -1", display: 'flex', justifyContent: 'center', mb: 1 }}>
                                    <Box sx={{ position: "relative" }}>

                                        <input
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            ref={fileInputRef}
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    uploadProfile(file);
                                                }

                                                // reset
                                                e.target.value = null;
                                                handleCloseMenu();
                                            }}
                                        />
                                        <Tooltip title={t('click_to_change_logo')}>
                                            <Avatar
                                                onClick={handleOpenMenu}
                                                sx={{
                                                    width: 72,
                                                    height: 72,
                                                    cursor: "pointer",
                                                    border: "2px dashed",
                                                    borderColor: "primary.main",
                                                    bgcolor: "grey.300",
                                                    transition: 'transform 0.1s ease-in-out',
                                                    '&:hover': {
                                                        transform: 'scale(1.1)'
                                                    }
                                                }}
                                                src={
                                                    userProfilePreview
                                                        ? userProfilePreview
                                                        : formData.profile_image
                                                            ? `${BASE_URL}/uploads/user/profile/${formData.profile_image}`
                                                            : undefined
                                                }
                                            >
                                                {formData.user_name.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </Tooltip>
                                        <Tooltip title={t('upload_logo')}>
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => document.getElementById("user-profile-input").click()}
                                                sx={{
                                                    position: "absolute",
                                                    bottom: 0,
                                                    right: 0,
                                                    bgcolor: "white",
                                                    border: 1,
                                                    width: 24,
                                                    height: 24,
                                                    '&:hover': {
                                                        backgroundColor: '#f4f4f4ff'
                                                    }
                                                }}
                                            >
                                                <PhotoCameraIcon sx={{ fontSize: 16 }} />
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
                                                        setOpenProfilePreview(true);
                                                        handleCloseMenu();
                                                    }}
                                                >
                                                    <VisibilityIcon sx={{ mr: 1 }} /> View
                                                </MenuItem>
                                            )}

                                            <MenuItem
                                                onClick={() => {
                                                    fileInputRef.current?.click()
                                                }}
                                            >
                                                <UploadIcon sx={{ mr: 1 }} /> Upload
                                            </MenuItem>

                                            {userProfilePreview && (
                                                <MenuItem
                                                    onClick={() => {
                                                        setOpenDeleteProfile(true);
                                                        handleCloseMenu();
                                                    }}
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
                                variant="outlined"
                                color="secondary"
                                type="button"
                                size="small"
                                onClick={handleResetForm}
                                fullWidth={{ xs: true, sm: false }}
                                disabled={!isDirty}
                            >
                                {t('reset_form')}
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                type="submit"
                                fullWidth={{ xs: true, sm: false }}
                                disabled={!isDirty}
                            >
                                {t('save_changes')}
                            </Button>

                        </Stack>
                    </Paper>
                </Box>
            </Box>
            <ViewProfileDialog
                open={openProfilePreview}
                onClose={() => setOpenProfilePreview(false)}
                imageUrl={userProfilePreview
                    ? userProfilePreview
                    : formData.profile_image
                        ? `${BASE_URL}/uploads/user/profile/${formData.profile_image}`
                        : undefined}
            />
            <DeleteProfileDialog
                open={openDeleteProfile}
                onClose={() => setOpenDeleteProfile(false)}
                loading={loading}
                onConfirm={handleDeleteUserProfile}
            />
        </>

    );
};

export default UpdateProfileAdmin;