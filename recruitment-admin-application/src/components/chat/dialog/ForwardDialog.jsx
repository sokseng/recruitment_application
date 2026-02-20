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
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle>Forward message</DialogTitle>

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
                                No more room available
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
                                "Show more"
                            )}
                        </Button>
                    </Box>
                )}

            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={onConfirm}
                    disabled={selectedRooms.size === 0}
                >
                    Forward
                </Button>
            </DialogActions>
        </Dialog>
    );
}
