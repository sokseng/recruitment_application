import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { useTranslation } from 'react-i18next';

export default function DeleteDialog({ open, onClose, onCancel, onConfirm, deleting }) {
    const { t } = useTranslation();

    return (
        <Dialog
            open={open}
            onClose={onClose}
        >
            <DialogTitle>{t('delete_message')}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {t('delete_message_confirmation')}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="primary">
                    {t('cancel')}
                </Button>
                <Button onClick={onConfirm} color="error" variant="contained">
                    {deleting ? <CircularProgress sx={{ color: 'white', fontSize: 14 }} /> : t('delete')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}