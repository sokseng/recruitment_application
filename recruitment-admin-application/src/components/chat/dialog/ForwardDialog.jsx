import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItemButton,
    ListItemText,
    Checkbox,
    Button,
    CircularProgress,
    Box,
    Typography,
} from "@mui/material";
import { useTranslation } from 'react-i18next';

export default function ForwardDialog({
    open,
    onClose,
    onConfirm,
    rooms,
    selectedRooms,
    toggleRoom,
    loadMore,
    hasMore,
    loading,
}) {
    const { t } = useTranslation();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle>{t('forward_message')}</DialogTitle>

            <DialogContent
                dividers
                sx={{
                    maxHeight: "60vh",
                    overflowY: "auto",
                }}
            >

                <List dense>
                    {rooms.length === 0 ?
                        (
                            <Typography textAlign="center">
                                {t('no_more_rooms')}
                            </Typography>
                        ) :
                        (rooms.map((room) => {
                            const checked = selectedRooms.has(room.room_id);

                            return (
                                <ListItemButton
                                    key={room.room_id}
                                    onClick={() => toggleRoom(room.room_id)}
                                >
                                    <Checkbox
                                        edge="start"
                                        checked={checked}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                    <ListItemText
                                        primary={room.username}
                                    />
                                </ListItemButton>
                            );
                        }))}
                </List>

                {hasMore && (
                    <Box display="flex" justifyContent="center" mt={2}>
                        <Button
                            onClick={loadMore}
                            disabled={loading}
                            size="small"
                        >
                            {loading ? (
                                <CircularProgress size={20} />
                            ) : (
                                t('show_more')
                            )}
                        </Button>
                    </Box>
                )}

            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>
                    {t('cancel')}
                </Button>
                <Button
                    variant="contained"
                    onClick={onConfirm}
                    disabled={selectedRooms.size === 0}
                >
                    {t('forward')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}