import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Stack,
    Typography,
    CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function ViewProfileDialog({ open, onClose, loading, onConfirm }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    p: 1
                }
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: 600
                }}
            >
                Delete Profile
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Stack spacing={2}>
                    <Typography variant="body1">
                        Are you sure you want to delete this profile?
                    </Typography>

                    <DialogContentText sx={{ color: "text.secondary" }}>
                        This action cannot be undone. All profile data will be permanently removed.
                    </DialogContentText>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                >
                    Cancel
                </Button>

                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="error"
                >
                    {loading ? <CircularProgress sx={{ fontSize: 14, color: 'white' }} /> : 'Delete'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ViewProfileDialog;
