import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, CircularProgress } from "@mui/material";

export default function DeleteDialog({ open, onClose, onCancel, onConfirm, deleting }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
        >
            <DialogTitle>Delete Message</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to delete this message?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="primary">
                    Cancel
                </Button>
                <Button onClick={onConfirm} color="error" variant="contained">
                    {deleting ? <CircularProgress sx={{ color: 'white', fontSize: 14 }} /> : 'Delete'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
