import React, { useState } from 'react';
import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    Avatar,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    Tabs,
    Tab,
    Button
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MediaComponent from '../MediaComponent';

function ChatMenuDialog({ open, onClose, user }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%'
                        }}
                    >
                        <Avatar
                            src={user.avatar_url}
                            sx={{
                                width: 75,
                                height: 75,
                            }}
                        />
                        <Typography variant="subtitle">{user.username}</Typography>
                        <Typography variant="caption" sx={{ color: user.is_online ? 'primary.main' : 'grey' }}>
                            {user.is_online ? 'Online' : 'Offline'}
                        </Typography>
                    </Box>
                    <IconButton
                        sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10
                        }}
                        onClick={handleMenuOpen}
                    >
                        <MoreVertIcon />
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={handleMenuClose}>Mute</MenuItem>
                        <MenuItem onClick={handleMenuClose}>Report</MenuItem>
                        <MenuItem onClick={handleMenuClose} sx={{ color: 'red' }}>Block User</MenuItem>
                    </Menu>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{ mb: 2 }}
                >
                    <Tab label="Media" />
                    <Tab label="Voice" />
                    <Tab label="Links" />
                </Tabs>

                {tabValue === 0 && (
                    <Box
                    sx={{
                        display:'flex',
                        flexWrap: 'now-wrap',
                        gap: 1
                    }}
                    >
                        <MediaComponent />
                        <MediaComponent />
                        <MediaComponent />
                        <MediaComponent />
                    </Box>
                )}
                {tabValue === 1 && (
                    <Box>
                        <Typography>Voice messages go here...</Typography>
                    </Box>
                )}
                {tabValue === 2 && (
                    <Box>
                        <Typography>Links shared in chat go here...</Typography>
                    </Box>
                )}
            </DialogContent>

        </Dialog>
    );
}

export default ChatMenuDialog;
