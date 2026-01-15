import {
    Box,
    Button,
    TextField,
    Typography,
    Avatar,
    Card,
    CardContent,
    Divider,
    Stack,
    MenuItem
} from "@mui/material"
import { useState } from "react"

const UpdateProfileAdmin = () => {
    const [formData, setFormData] = useState({
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
        company_website: ""
    })

    const [logoPreview, setLogoPreview] = useState(null)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()


    }

    return (
        <Box sx={{ maxWidth: 620, mx: "auto", mt: 4 }}>
            <Card elevation={3} sx={{ borderRadius: 2 }}>
                <CardContent  sx={{ px: 4, py: 3, overflowY: "auto" }} component="form" onSubmit={handleSubmit} id="update-profile-form">
                    <Typography variant="h6" fontWeight={600} mb={0.5}>
                        Update Profile
                    </Typography>

                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Manage your personal and company information
                    </Typography>

                    {/* Logo */}
                    <Stack alignItems="center" spacing={1.5} mb={4}>
                        <Avatar src={logoPreview} sx={{ width: 96, height: 96 }} />
                        <Button variant="outlined" component="label" size="small">
                            Upload Company Logo
                            <input hidden type="file" accept="image/*" />
                        </Button>
                    </Stack>

                    <Divider sx={{ mb: 3 }} />

                    {/* Personal Information */}
                    <Stack spacing={2.5}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Personal Information
                        </Typography>

                        <TextField
                            fullWidth
                            required
                            size="small"
                            label="User Name"
                            name="user_name"
                            value={formData.user_name}
                            onChange={handleChange}
                        />

                        <TextField
                            fullWidth
                            required
                            size="small"
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                        />

                        <TextField
                            fullWidth
                            size="small"
                            label="Phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />

                        <TextField
                            fullWidth
                            select
                            required
                            size="small"
                            label="Gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                        >
                            <MenuItem value="Male">Male</MenuItem>
                            <MenuItem value="Female">Female</MenuItem>
                        </TextField>

                        <TextField
                            fullWidth
                            size="small"
                            label="Date of Birth"
                            required
                            name="date_of_birth"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={formData.date_of_birth}
                            onChange={handleChange}
                        />

                        <TextField
                            fullWidth
                            size="small"
                            label="Address"
                            name="address"
                            multiline
                            rows={3}
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </Stack>

                    <Divider sx={{ my: 4 }} />

                    {/* Company Information */}
                    <Stack spacing={2.5}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Company Information
                        </Typography>

                        <TextField
                            fullWidth
                            required
                            size="small"
                            label="Company Name"
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleChange}
                        />

                        <TextField
                            fullWidth
                            size="small"
                            label="Company Email"
                            name="company_email"
                            value={formData.company_email}
                            onChange={handleChange}
                        />

                        <TextField
                            fullWidth
                            size="small"
                            label="Company Contact"
                            name="company_contact"
                            value={formData.company_contact}
                            onChange={handleChange}
                        />

                        <TextField
                            fullWidth
                            size="small"
                            label="Company Website"
                            name="company_website"
                            value={formData.company_website}
                            onChange={handleChange}
                        />

                        <TextField
                            fullWidth
                            size="small"
                            multiline
                            rows={3}
                            label="Company Address"
                            name="company_address"
                            value={formData.company_address}
                            onChange={handleChange}
                        />

                        <TextField
                            fullWidth
                            size="small"
                            multiline
                            rows={3}
                            label="Company Description"
                            name="company_description"
                            value={formData.company_description}
                            onChange={handleChange}
                        />


                    </Stack>

                    {/* Action */}
                    <Stack alignItems="flex-end" mt={4}>
                        <Button variant="contained" size="small" type="submit" disableElevation form="update-profile-form" >
                            Save Changes
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    )
}

export default UpdateProfileAdmin
