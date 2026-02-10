
import React, { useState } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Paper,
    Stepper,
    Step,
    StepLabel,
    IconButton,
    InputAdornment,
    Snackbar,
    Alert
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import api from "../services/api";
import CircularProgress from "@mui/material/CircularProgress";

const ForgotPassword = () => {
    const [step, setStep] = useState(0);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((show) => !show);

    const [severity, setSeverity] = useState('error')
    const [openSnackbar, setOpenSnackbar] = useState(false)
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false);


    const steps = ["Enter email", "Verify code", "Reset password"];

    // Step 1: Request reset code
    const handleRequestCode = async () => {
        setLoading(true);
        try {
            await api.post("/forgot_password", { email: email });
            setStep(1);
        } catch (err) {

            if (err.response && err.response.status === 404 && err.response.data.detail === "Email not found") {
                setSeverity('success')
                setMessage('Email address not found. Please check and try again.')
                setOpenSnackbar(true)
            } else if (err.response && err.response.status === 429 && err.response.data.detail === "System email limit reached for today. Please try again tomorrow.") {
                setSeverity('warning')
                setMessage('System email limit reached for today. Please try again tomorrow.')
                setOpenSnackbar(true)
            } else {
                setSeverity('error')
                setMessage('Error sending code. Please try again.')
                setOpenSnackbar(true)
                console.error(err)
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify code
    const handleVerifyCode = async () => {
        try {
            await api.post("/forgot_password/verify_code", {
                email: email,
                code: code
            });
            setStep(2);
        } catch (err) {
            if (err.response && err.response.status === 400 && err.response.data.detail === "code and email not provided") {
                setSeverity('error')
                setMessage('code and email not provided')
                setOpenSnackbar(true)
            } else if (err.response && err.response.status === 400 && err.response.data.detail === "Invalid email or code") {
                setSeverity('error')
                setMessage('invalid email or code')
                setOpenSnackbar(true)
            } else if (err.response && err.response.status === 400 && err.response.data.detail === "Code has expired") {
                setSeverity('error')
                setMessage('code has expired')
                setOpenSnackbar(true)
            }
            else {
                setSeverity('error')
                setMessage('Error verifying code. Please try again.')
                setOpenSnackbar(true)
                console.error(err)
            }
        }
    };

    // Step 3: Reset password
    const handleResetPassword = async () => {

        if (newPassword !== confirmPassword) {
            setSeverity('error')
            setMessage('Passwords do not match. Please try again.')
            setOpenSnackbar(true)
            return;
        }
        try {
            await api.post("/forgot_password/reset_password", {
                email,
                new_password: newPassword
            });

            setSeverity('success')
            setMessage('Password reset successfully')
            setOpenSnackbar(true)
            window.location.href = "/"; // auto redirect
        } catch (err) {
            if (err.response && err.response.status === 400 && err.response.data.detail === "Email not found") {
                setSeverity('error')
                setMessage('Email address not found. Please check and try again.')
                setOpenSnackbar(true)
            } else {
                setSeverity('error')
                setMessage('Error resetting password. Please try again.')
                setOpenSnackbar(true)
                console.error(err);
            }
        }
    };

    // Handle Back
    const handleBack = () => {
        if (step === 0) {
            window.location.href = "/"; // go back to login if on first step
        } else {
            setStep(step - 1);
        }
    };

    return (
        <>
            {/* Snackbar */}
            <Snackbar
                open={openSnackbar}
                autoHideDuration={2500}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={severity} variant="filled">
                    {message}
                </Alert>
            </Snackbar>

            <Container maxWidth="sm">
                <Paper elevation={4} sx={{ p: 4, mt: 8, borderRadius: 3 }}>
                    <Box display="flex" alignItems="center" mb={2}>

                        <Typography variant="h5" align="center" sx={{ flexGrow: 1 }}>
                            Forgot Password
                        </Typography>
                    </Box>

                    {/* Stepper progress bar */}
                    <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {/* Step 1 */}
                    {step === 0 && (
                        <Box
                            component="form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleRequestCode();
                            }}
                            display="flex"
                            flexDirection="column"
                            gap={2}

                        >
                            <TextField
                                label="Email"
                                required
                                type="email"
                                size="small"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                }}
                                fullWidth
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                size="small"
                            >
                                {loading ? (
                                    <CircularProgress size={22} color="inherit" />
                                ) : (
                                    "Send Code"
                                )}
                            </Button>
                        </Box>
                    )}

                    {/* Step 2 */}
                    {step === 1 && (
                        <Box
                            component="form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleVerifyCode();
                            }}
                            display="flex"
                            flexDirection="column"
                            gap={2}
                        >
                            <TextField
                                label="Verification Code"
                                required
                                name="code"
                                size="small"
                                type="text"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value);
                                }}
                                fullWidth
                            />
                            <Button size="small" variant="contained" type="submit">
                                Verify
                            </Button>
                        </Box>
                    )}

                    {/* Step 3 */}
                    {step === 2 && (
                        <Box
                            component="form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleResetPassword();
                            }}
                            display="flex"
                            flexDirection="column"
                            gap={2}
                        >

                            <TextField
                                fullWidth
                                size="small"
                                label="Password"
                                required
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                }}
                                margin="normal"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={togglePasswordVisibility} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                fullWidth
                                size="small"
                                label="Confirm Password"
                                required
                                name="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                }}
                                margin="normal"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={togglePasswordVisibility} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}

                            />

                            <Button size="small" variant="contained" type="submit">
                                Reset Password
                            </Button>
                        </Box>
                    )}

                    {/* Optional Back Button (if you want manual navigation) */}
                    <Box mt={3} display="flex" justifyContent="flex-start">
                        <IconButton onClick={handleBack}>
                            <ArrowBack />
                        </IconButton>
                    </Box>

                </Paper>
            </Container>
        </>

    );
};

export default ForgotPassword;
