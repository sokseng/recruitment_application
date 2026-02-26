import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Typography,
} from "@mui/material";
import api from "../../../services/api";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from 'react-i18next';

const FindUsers = ({ open, onClose, onSelectUser }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [recentRooms, setRecentRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    api
      .get("/chat/recent-rooms")
      .then((res) => setRecentRooms(res.data))
      .catch(console.error);
  }, [open]);

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
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = async (user) => {
    try {
      const res = await api.post("/chat/get-or-create-room", {
        other_user_id: user.pk_id,
      });

      onSelectUser(res.data);
      setQuery("");
      setUsers([]);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const showRecent = !query.trim();

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{t('find_users')}</DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={t('search_users_label')}
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {showRecent && recentRooms.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, opacity: 0.7 }}>
              {t('recent_users')}
            </Typography>

            <List>
              {recentRooms.map((room) => (
                <ListItemButton
                  key={room.room_id}
                  onClick={() =>
                    handleSelect({
                      pk_id: room.user_id,
                      user_name: room.username,
                    })
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={room.avatar_url}>
                      {room.username?.[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={room.username} />
                </ListItemButton>
              ))}
            </List>
          </>
        )}

        {!showRecent && (
          <List>
            {users.map((user) => (
              <ListItemButton
                key={user.pk_id}
                onClick={() => handleSelect(user)}
              >
                <ListItemAvatar>
                  <Avatar src={user.avatar_url}>
                    {user.user_name?.[0]?.toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={user.user_name} />
              </ListItemButton>
            ))}
          </List>
        )}

        {!loading && query && users.length === 0 && (
          <Typography sx={{ opacity: 0.6, mt: 2 }}>
            {t('no_users_found')}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", top: 5, right: 5 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogActions>
    </Dialog>
  );
};

export default FindUsers;