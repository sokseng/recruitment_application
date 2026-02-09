import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";

export default function DeleteDialog({open, onClose, onCancel, onConfirm}) {
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
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}
