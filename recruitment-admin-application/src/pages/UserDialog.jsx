import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useState, useEffect } from "react";
import api from "../services/api";

const UserDialog = ({ open, onClose, user, refresh }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    user_type: "",
    user_name: "",
    email: "",
    password: "",
    gender: "",
    phone: "",
    date_of_birth: "",
    address: "",
  });

  useEffect(() => {
    if (user) {
      setForm({ ...user, password: "" });
    } else {
      setForm({
        user_type: "",
        user_name: "",
        email: "",
        password: "",
        gender: "",
        phone: "",
        date_of_birth: "",
        address: "",
      });
    }
  }, [user]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (user) {
      await api.put(`/user/${user.pk_id}`, form);
    } else {
      await api.post("/user", form);
    }

    refresh();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{user ? "Update User" : "Create User"}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} component="form" onSubmit={handleSubmit}>
          <TextField
            size="small"
            name="user_type"
            label="User Type"
            select
            value={form.user_type}
            onChange={handleChange}
            required
          >
            <MenuItem value={1}>Admin</MenuItem>
            <MenuItem value={2}>Employer</MenuItem>
            <MenuItem value={3}>Candidate</MenuItem>
          </TextField>

          <TextField
            size="small"
            name="user_name"
            label="Username"
            value={form.user_name}
            onChange={handleChange}
            required
          />

          <TextField
            size="small"
            name="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <TextField
            size="small"
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            required={!user}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            size="small"
            name="gender"
            label="Gender"
            select
            value={form.gender}
            onChange={handleChange}
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
          </TextField>

          <TextField size="small" name="phone" label="Phone" value={form.phone} onChange={handleChange} />

          <TextField
            size="small"
            name="date_of_birth"
            type="date"
            label="Date of Birth"
            value={form.date_of_birth || ""}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            size="small"
            name="address"
            label="Address"
            multiline
            rows={2}
            value={form.address}
            onChange={handleChange}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" onClick={handleSubmit}>
          {user ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDialog;
