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
} from "@mui/material";
import { useState, useEffect } from "react";
import api from "../../services/api";

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
    };

    const [formData, setFormData] = useState(initialFormData);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLogoPreview(URL.createObjectURL(file));
        setLogoFile(file);
    };

    const handleResetLogo = () => {
        setLogoPreview(null);
    };

    const handleResetForm = () => {
        setFormData(initialFormData);
        setLogoPreview(null);
    };

    useEffect(() => {
        const fetchUserProfileEmployer = async () => {
            try {
                const response = await api.get("/employer/profile");
                const data = response.data;

                setFormData({
                    user_name: data.user_name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    gender: data.gender || "",
                    date_of_birth: data.date_of_birth || "",
                    address: data.address || "",
                    company_contact: data.company_contact || "",
                    company_address: data.company_address || "",
                    company_description: data.company_description || "",
                    company_website: data.company_website || "",
                });

            } catch (error) {
                console.error("Failed to load user profile employer:", error);
            }
        };

        fetchUserProfileEmployer();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();


    };

    return (
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
                            <SectionBox title="Company Information">
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                                    <Avatar
                                        src={logoPreview}
                                        sx={{ width: 60, height: 60, border: "2px solid", borderColor: "primary.main" }}
                                    />
                                    <Stack direction="column" spacing={1}>
                                        <Button variant="outlined" component="label" size="small" sx={{ minWidth: 100 }}>
                                            Upload Logo
                                            <input hidden type="file" accept="image/*" onChange={handleLogoChange} />
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            color="secondary"
                                            sx={{ minWidth: 100 }}
                                            onClick={handleResetLogo}
                                            disabled={!logoPreview}
                                        >
                                            Remove Logo
                                        </Button>
                                    </Stack>
                                </Box>
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                                    <TextField
                                        label="Company Name"
                                        name="company_name"
                                        required
                                        value={formData.company_name}
                                        onChange={handleChange}
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField
                                        label="Company Email"
                                        type="email"
                                        name="company_email"
                                        value={formData.company_email}
                                        onChange={handleChange}
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField
                                        label="Company Contact"
                                        name="company_contact"
                                        value={formData.company_contact}
                                        onChange={handleChange}
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField
                                        label="Company Website"
                                        name="company_website"
                                        value={formData.company_website}
                                        onChange={handleChange}
                                        size="small"
                                        fullWidth
                                    />
                                    <Box sx={{ gridColumn: "1 / -1" }}>
                                        <TextField
                                            label="Company Address"
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
                                            label="Company Description"
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

                            {/* Personal Info */}
                            <SectionBox title="Personal Information">
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                                    <TextField
                                        label="User Name"
                                        required
                                        name="user_name"
                                        value={formData.user_name}
                                        onChange={handleChange}
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField
                                        label="Email"
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
                                        label="Phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField
                                        select
                                        label="Gender"
                                        required
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        size="small"
                                        fullWidth
                                    >
                                        <MenuItem value="Male">Male</MenuItem>
                                        <MenuItem value="Female">Female</MenuItem>
                                    </TextField>
                                    <TextField
                                        label="Date of Birth"
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
                                            label="Address"
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
                                Save Changes
                            </Button>
                            <Button variant="outlined" size="small" color="secondary" type="button" onClick={handleResetForm}>
                                Reset Form
                            </Button>
                        </Stack>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default UpdateProfileEmployer;