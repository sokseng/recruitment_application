import { ArrowBack } from "@mui/icons-material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
    Alert,
    Box,
    Button,
    Container,
    IconButton,
    InputAdornment,
    Paper,
    Snackbar,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import api from "../services/api";

const ForgotPassword = () => {
    const { t } = useTranslation();
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

    const steps = [t('enter_email'), t('verify_code'), t('reset_password')];

    // Step 1: Request reset code
    const handleRequestCode = async () => {
        setLoading(true);
        try {
            await api.post("/forgot_password", { email: email });
            setStep(1);
        } catch (err) {

            if (err.response && err.response.status === 404 && err.response.data.detail === "Email not found") {
                setSeverity('success')
                setMessage(t('email_not_found'))
                setOpenSnackbar(true)
            } else if (err.response && err.response.status === 429 && err.response.data.detail === "System email limit reached for today. Please try again tomorrow.") {
                setSeverity('warning')
                setMessage(t('email_limit_reached'))
                setOpenSnackbar(true)
            } else {
                setSeverity('error')
                setMessage(t('error_sending_code'))
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
                setMessage(t('code_email_not_provided'))
                setOpenSnackbar(true)
            } else if (err.response && err.response.status === 400 && err.response.data.detail === "Invalid email or code") {
                setSeverity('error')
                setMessage(t('invalid_email_or_code'))
                setOpenSnackbar(true)
            } else if (err.response && err.response.status === 400 && err.response.data.detail === "Code has expired") {
                setSeverity('error')
                setMessage(t('code_expired'))
                setOpenSnackbar(true)
            }
            else {
                setSeverity('error')
                setMessage(t('error_verifying_code'))
                setOpenSnackbar(true)
                console.error(err)
            }
        }
    };

    // Step 3: Reset password
    const handleResetPassword = async () => {

        if (newPassword !== confirmPassword) {
            setSeverity('error')
            setMessage(t('passwords_do_not_match'))
            setOpenSnackbar(true)
            return;
        }
        try {
            await api.post("/forgot_password/reset_password", {
                email,
                new_password: newPassword
            });

            setSeverity('success')
            setMessage(t('password_reset_success'))
            setOpenSnackbar(true)
            window.location.href = "/"; // auto redirect
        } catch (err) {
            if (err.response && err.response.status === 400 && err.response.data.detail === "Email not found") {
                setSeverity('error')
                setMessage(t('email_not_found'))
                setOpenSnackbar(true)
            } else {
                setSeverity('error')
                setMessage(t('error_resetting_password'))
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
                            {t('forgot_password')}
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
                                label={t('email')}
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
                                    t('send_code')
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
                                label={t('verification_code')}
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
                                {t('verify')}
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
                                label={t('new_password')}
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
                                label={t('confirm_password')}
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
                                {t('reset_password')}
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