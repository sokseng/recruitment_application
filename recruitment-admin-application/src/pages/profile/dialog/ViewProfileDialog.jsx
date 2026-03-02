import { Box, Dialog, DialogContent, IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

function ViewProfileDialog({open, onClose, imageUrl}) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >

            <DialogContent sx={{ textAlign: "center" }}>
                {imageUrl && (
                    <Box
                        component="img"
                        src={imageUrl}
                        alt="Company Logo"
                        sx={{
                            maxWidth: "100%",
                            maxHeight: 400,
                            borderRadius: 2,
                        }}
                    />
                )}
            </DialogContent>

            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    top: 5,
                    right: 5
                }}
            >
                <CloseIcon />
            </IconButton>
        </Dialog>
    )
}

export default ViewProfileDialog
