
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
    InputAdornment
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import api from "../services/api";

const ForgotPassword = () => {
    const [step, setStep] = useState(0);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((show) => !show);


    const steps = ["Enter email", "Verify code", "Reset password"];

    // Step 1: Request reset code
    const handleRequestCode = async () => {
        if (email === "") {
            alert("Please enter your email");
            return;
        }
        try {
            await api.post("/forgot_password", { email: email });
            setStep(1);
        } catch (err) {
            if (err.response && err.response.status === 404 && err.response.data.detail === "Email not found") {
                alert("Email address not found. Please check and try again.");
            }
            else {
                alert("Error sending code. Please try again.");
            }
        }
    };

    // Step 2: Verify code
    const handleVerifyCode = async () => {
        if (code === "") {
            alert("Please enter the code");
            return;
        }
        try {
            await api.post("/forgot_password/verify_code", {
                email: email,
                code: code
            });
            setStep(2);
        } catch (err) {
            if (err.response && err.response.status === 400 && err.response.data.detail === "code and email not provided") {
                alert("code and email not provided");
            } else if (err.response && err.response.status === 400 && err.response.data.detail === "Invalid email or code") {
                alert("invalid email or code");
            } else if (err.response && err.response.status === 400 && err.response.data.detail === "Code has expired") {
                alert("code has expired");
            }
            else {
                alert("Error verifying code. Please try again.");
            }
        }
    };

    // Step 3: Reset password
    const handleResetPassword = async () => {
        if (newPassword === "") {
            alert("Please enter a new password");
            return;
        }
        if (confirmPassword === "") {
            alert("Please confirm your new password");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match. Please try again.");
            return;
        }
        try {
            await api.post("/forgot_password/reset_password", {
                email,
                new_password: newPassword
            });
            alert("Password reset successfully");
            window.location.href = "/"; // auto redirect
        } catch (err) {
            if (err.response && err.response.status === 400 && err.response.data.detail === "Email not found") {
                alert("Email address not found. Please check and try again.");
            } else {
                alert("Error resetting password. Please try again.");
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
                    <Box display="flex" flexDirection="column" gap={2}>
                        <TextField
                            label="Email"
                            type="email"
                            size="small"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                            }}
                            fullWidth
                        />
                        <Button size="small" variant="contained" onClick={handleRequestCode}>
                            Send Code
                        </Button>
                    </Box>
                )}

                {/* Step 2 */}
                {step === 1 && (
                    <Box display="flex" flexDirection="column" gap={2}>
                        <TextField
                            label="Verification Code"
                            size="small"
                            type="text"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value);
                            }}
                            fullWidth
                            error={!!errors.verifyCode}
                        />
                        <Button size="small" variant="contained" onClick={handleVerifyCode}>
                            Verify
                        </Button>
                    </Box>
                )}

                {/* Step 3 */}
                {step === 2 && (
                    <Box display="flex" flexDirection="column" gap={2}>

                        <TextField
                            fullWidth
                            size="small"
                            label="Password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                            }}
                            margin="normal"
                            required
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={togglePasswordVisibility} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            error={!!errors.newPassword}
                        />

                        <TextField
                            fullWidth
                            size="small"
                            label="Confirm Password"
                            name="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                            }}
                            margin="normal"
                            required
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={togglePasswordVisibility} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            error={!!errors.confirmPassword}

                        />

                        <Button size="small" variant="contained" onClick={handleResetPassword}>
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
    );
};

export default ForgotPassword;
