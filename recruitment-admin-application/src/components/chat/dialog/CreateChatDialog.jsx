import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';

const CreateChatDialog = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    emailOrPhone: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.emailOrPhone) {
      return;
    }
    console.log('Chat Created:', formData);
    setFormData({ name: '', emailOrPhone: '' });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create Chat</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Name"
          name="name"
          fullWidth
          value={formData.name}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          label="Email or Phone"
          name="emailOrPhone"
          fullWidth
          value={formData.emailOrPhone}
          onChange={handleChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{textTransform: "none"}}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" sx={{textTransform: "none"}}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateChatDialog;
