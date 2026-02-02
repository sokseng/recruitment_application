import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
} from "@mui/material";
import api from "../../../services/api";
import CloseIcon from '@mui/icons-material/Close';

const FindUsers = ({ open, onClose, onSelectUser }) => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    const timeout = setTimeout(() => {
      setLoading(true);
      api
        .get("/chat/find-users", { params: { q: query } })
        .then((res) => setUsers(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300); // debounce

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (user) => {
    onSelectUser(user);
    setQuery("");
    setUsers([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Find Users</DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Search by username, email, or phone"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <List>
          {users.map((user) => (
            <ListItemButton key={user.pk_id} onClick={() => handleSelect(user)}>
              <ListItemAvatar>
                <Avatar src={user.avatar_url}>
                  {user.user_name[0]?.toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={user.user_name} />
            </ListItemButton>
          ))}
        </List>

        {!loading && query && users.length === 0 && (
          <p style={{ opacity: 0.6 }}>No users found</p>
        )}
      </DialogContent>

      <DialogActions>
        <IconButton onClick={onClose} sx={{ textTransform: "none", position: 'absolute', top: 5, right: 5 }}>
          <CloseIcon/>
        </IconButton>
      </DialogActions>
    </Dialog>
  );
};

export default FindUsers;
