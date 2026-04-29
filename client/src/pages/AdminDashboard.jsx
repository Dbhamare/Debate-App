import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Divider,
  TextField,
  Snackbar,
  Alert
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import PageShell from "../components/PageShell";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const [debateOpen, setDebateOpen] = useState(false);
  const [debateData, setDebateData] = useState(null);
  const [idDialog, setIdDialog] = useState({ open: false, userId: "", input: "" });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", action: null });
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usersRes = await api.get("/admin/users");
      const debatesRes = await api.get("/admin/debates");
      setUsers(usersRes.data);
      setDebates(debatesRes.data);
    } catch (err) {
      console.error("Error fetching admin data", err);
    }
  };

  const viewProfile = async (_id) => {
    try {
      const { data } = await api.get(`/admin/users/${_id}/profile`);
      setProfileData(data);
      setProfileOpen(true);
    } catch (e) {
      console.error(e);
      setToast({ open: true, severity: "error", message: "Failed to load profile" });
    }
  };

  const setUserID = async (_id, userID) => {
    try {
      await api.patch(`/admin/users/${_id}/userid`, { userID });
      setToast({ open: true, severity: "success", message: "User ID updated." });
      fetchData();
      setIdDialog({ open: false, userId: "", input: "" });
    } catch (e) {
      console.error(e);
      setToast({ open: true, severity: "error", message: e?.response?.data?.message || "Failed to update ID" });
    }
  };

  const resetID = async (userId) => {
    setLoading(true);
    try {
      const res = await api.patch(`/admin/users/${userId}/reset-id`);
      setToast({ open: true, severity: "success", message: `ID reset successfully. New ID: ${res.data.userID}` });
      fetchData();
    } catch (err) {
      console.error("Error resetting ID", err);
      setToast({ open: true, severity: "error", message: err.response?.data?.message || "Failed to reset ID" });
    } finally {
      setLoading(false);
    }
  };

  const deleteUserMessages = async (_id) => {
    try {
      const { data } = await api.delete(`/admin/users/${_id}/messages`);
      setToast({ open: true, severity: "success", message: `Deleted ${data.deletedCount || 0} messages.` });
    } catch (e) {
      console.error(e);
      setToast({ open: true, severity: "error", message: "Failed to delete messages" });
    }
  };

  const deleteUser = async (_id) => {
    try {
      await api.delete(`/admin/users/${_id}`);
      setToast({ open: true, severity: "success", message: "User deleted" });
      fetchData();
    } catch (e) {
      console.error(e);
      setToast({ open: true, severity: "error", message: "Failed to delete user" });
    }
  };

  const viewDebateDetails = async (joincode) => {
    try {
      const { data } = await api.get(`/admin/debates/${joincode}/details`);
      setDebateData(data);
      setDebateOpen(true);
    } catch (e) {
      console.error(e);
      setToast({ open: true, severity: "error", message: "Failed to load debate details" });
    }
  };

  const viewDebateChat = (joincode) => {
    window.open(`/debate/${joincode}`, '_blank', 'noopener,noreferrer');
  };

  const deleteDebate = async (joincode) => {
    try {
      await api.delete(`/admin/debates/${joincode}`);
      setToast({ open: true, severity: "success", message: "Debate deleted" });
      fetchData();
    } catch (e) {
      console.error(e);
      setToast({ open: true, severity: "error", message: "Failed to delete debate" });
    }
  };

  return (
    <PageShell headerHeight={72} maxWidth={1400}>
      <Box py={{ xs: 2, sm: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5, fontSize: { xs: "1.8rem", md: "2.3rem" } }}>
          Admin Dashboard
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2.5 }}>
          Manage users, moderation actions, and debate rooms.
        </Typography>

        <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            All Users ({users.length})
          </Typography>
          <List sx={{ mt: 1 }}>
            {users.map(user => (
              <ListItem
                key={user._id}
                sx={{
                  display: "block",
                  borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                  py: 1.2,
                  px: 0,
                  "&:hover": {
                    bgcolor: isDark ? alpha("#d8e8ff", 0.04) : alpha("#123865", 0.04),
                  },
                }}
              >
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
                  <ListItemText
                    primary={`${user.name} (${user.email})`}
                    secondary={`Role: ${user.role} | ID: ${user.userID || "No ID assigned"}`}
                    sx={{ m: 0 }}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button size="small" onClick={() => viewProfile(user._id)}>View Profile</Button>
                    <Button size="small" onClick={() => setIdDialog({ open: true, userId: user._id, input: "" })}>Set ID</Button>
                    <Button size="small" onClick={() => resetID(user._id)} disabled={loading}>Reset ID</Button>
                    <Button
                      size="small"
                      color="warning"
                      onClick={() => setConfirmDialog({
                        open: true,
                        title: "Delete User Messages",
                        message: "Delete all messages from this user?",
                        action: () => deleteUserMessages(user._id)
                      })}
                    >
                      Delete Messages
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setConfirmDialog({
                        open: true,
                        title: "Delete User",
                        message: "This will permanently delete the user. This action cannot be undone.",
                        action: () => deleteUser(user._id)
                      })}
                    >
                      Delete User
                    </Button>
                  </Stack>
                </Stack>
              </ListItem>
            ))}
          </List>
        </Paper>

        <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700}>
            All Debates ({debates.length})
          </Typography>
          <List sx={{ mt: 1 }}>
            {debates.map(debate => (
              <ListItem
                key={debate._id}
                sx={{
                  display: "block",
                  borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                  py: 1.2,
                  px: 0,
                  "&:hover": {
                    bgcolor: isDark ? alpha("#d8e8ff", 0.04) : alpha("#123865", 0.04),
                  },
                }}
              >
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
                  <ListItemText
                    primary={`${debate.title}`}
                    secondary={`Status: ${debate.status} | Joincode: ${debate.joincode}`}
                    sx={{ m: 0 }}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button size="small" onClick={() => viewDebateDetails(debate.joincode)}>Details</Button>
                    <Button size="small" onClick={() => viewDebateChat(debate.joincode)}>View Chat</Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setConfirmDialog({
                        open: true,
                        title: "Delete Debate",
                        message: "Delete this debate and all related messages and votes?",
                        action: () => deleteDebate(debate.joincode)
                      })}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Stack>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>

      <Dialog open={idDialog.open} onClose={() => setIdDialog({ open: false, userId: "", input: "" })} maxWidth="xs" fullWidth>
        <DialogTitle>Set User ID</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            fullWidth
            label="User ID"
            placeholder="e.g. 007"
            value={idDialog.input}
            onChange={(e) => setIdDialog((p) => ({ ...p, input: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 3 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIdDialog({ open: false, userId: "", input: "" })}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => setUserID(idDialog.userId, idDialog.input)}
            disabled={!idDialog.input || idDialog.input.length < 3}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>User Profile</DialogTitle>
        <DialogContent dividers>
          {!profileData ? (
            <Typography color="text.secondary">No data</Typography>
          ) : (
            <>
              <Typography variant="subtitle1"><b>{profileData.user.name}</b></Typography>
              <Typography>{profileData.user.email}</Typography>
              <Typography sx={{ mt: 1 }}>
                Role: {profileData.user.role} | ID: {profileData.user.userID || '—'}
              </Typography>
              {profileData.user.course && <Typography>Course: {profileData.user.course}</Typography>}
              {profileData.user.bio && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>{profileData.user.bio}</Typography>
                </>
              )}
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">Messages sent: {profileData.stats?.messageCount || 0}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={debateOpen} onClose={() => setDebateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Debate Details</DialogTitle>
        <DialogContent dividers>
          {!debateData ? (
            <Typography color="text.secondary">No data</Typography>
          ) : (
            <>
              <Typography variant="h6">{debateData.title}</Typography>
              <Typography>Status: {debateData.status} | Joincode: {debateData.joincode}</Typography>
              <Typography sx={{ mt: 1 }}>
                <b>Instructor:</b> {debateData.instructor?.name} ({debateData.instructor?.email}) — ID: {debateData.instructor?.userID}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1">Votes</Typography>
              <Typography>Proponent: {debateData.votes?.proponent || 0}</Typography>
              <Typography>Opponent: {debateData.votes?.opponent || 0}</Typography>
              <Typography sx={{ mt: 0.5 }}>
                Winner: <b>{debateData.winner === 'draw' ? 'Draw' : debateData.winner}</b>
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1">Participants</Typography>
              {(debateData.participants || []).map(s => (
                <Box key={s.side} sx={{ mt: 0.5 }}>
                  <Typography fontWeight="bold">{s.side}</Typography>
                  {(s.participants || []).length === 0 ? (
                    <Typography color="text.secondary">No participants</Typography>
                  ) : (
                    (s.participants || []).map(p => (
                      <Typography key={p.userID} variant="body2">
                        • {p.name} (ID: {p.userID}) {p.email ? `— ${p.email}` : ''}
                      </Typography>
                    ))
                  )}
                </Box>
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {debateData && (
            <Button onClick={() => viewDebateChat(debateData.joincode)}>Open Chat</Button>
          )}
          <Button onClick={() => setDebateOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, title: "", message: "", action: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, title: "", message: "", action: null })}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (confirmDialog.action) await confirmDialog.action();
              setConfirmDialog({ open: false, title: "", message: "", action: null });
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((p) => ({ ...p, open: false }))}
          severity={toast.severity}
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </PageShell>
  );
}
