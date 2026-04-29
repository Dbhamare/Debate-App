import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Chip,
  Stack,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import api from "../services/api";
import { alpha, useTheme } from "@mui/material/styles";
import PageShell from "../components/PageShell";

export default function InstructorDashboard() {
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, joincode: "" });
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  useEffect(() => {
    fetchDebates();
  }, []);

  const fetchDebates = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/debates", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const user = JSON.parse(localStorage.getItem("user"));
      const instructorDebates = res.data.filter(
        (debate) => debate.instructor === Number(user?.userID)
      );

      setDebates(instructorDebates);
    } catch (err) {
      console.error("Error fetching debates", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (joincode) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/debates/join/${joincode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDebates((prev) => prev.filter((debate) => debate.joincode !== joincode));
      setToast({ open: true, severity: "success", message: "Debate deleted." });
    } catch (err) {
      console.error("Error deleting debate:", err);
      setToast({ open: true, severity: "error", message: "Failed to delete debate." });
    } finally {
      setDeleteDialog({ open: false, joincode: "" });
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ open: true, severity: "success", message: "Link copied to clipboard." });
    } catch {
      setToast({ open: true, severity: "error", message: "Failed to copy link." });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageShell headerHeight={72} maxWidth={1260}>
        <Box py={{ xs: 2, sm: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
          mb={3}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: "1.8rem", md: "2.3rem" } }}>
              Instructor Dashboard
            </Typography>
            <Typography color="text.secondary">
              Create debates, share room links, and manage live sessions.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate("/instructor/create-debate")}
          >
            Create New Debate
          </Button>
        </Stack>

        <Grid container spacing={2.5}>
          {debates.length === 0 ? (
            <Grid size={12}>
              <Paper sx={{ p: 3.5, borderRadius: 3 }}>
                <Typography color="text.secondary">
                  No debates created yet.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            debates.map((debate) => {
              const debateUrl = `${window.location.origin}/debate/${debate.joincode}`;
              return (
                <Grid size={{ xs: 12, sm: 6, xl: 4 }} key={debate.joincode}>
                  <Paper
                    sx={{
                      p: 2.2,
                      borderRadius: 3,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      transition: "transform 170ms ease, box-shadow 170ms ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: isDark
                          ? `0 12px 28px ${alpha("#03070d", 0.5)}`
                          : `0 12px 28px ${alpha("#123865", 0.18)}`,
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                      <Typography variant="h6" fontWeight={700}>
                        {debate.title}
                      </Typography>
                      <Chip
                        label={debate.isPublic ? "Public" : "Private"}
                        size="small"
                        color={debate.isPublic ? "success" : "default"}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.1, minHeight: 42 }}>
                      {debate.description}
                    </Typography>
                    <Typography variant="caption">
                      Status: <b>{debate.status}</b>
                    </Typography>

                    <Box
                      mt={2}
                      p={1.5}
                      sx={{
                        border: `1px dashed ${isDark ? alpha("#d7e8ff", 0.28) : alpha("#133862", 0.2)}`,
                        borderRadius: 2.5,
                        bgcolor: isDark ? alpha("#0a182a", 0.45) : alpha("#f8fbff", 0.65),
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        Share with Students/Users
                      </Typography>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
                        <Box sx={{ bgcolor: "#fff", p: 1, borderRadius: 1.5, width: "fit-content" }}>
                          <QRCode value={debateUrl} size={96} />
                        </Box>

                        <Box flex={1}>
                          <Stack spacing={1}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" sx={{ minWidth: { xs: 48, sm: 80 } }}>Link:</Typography>
                              <TextField
                                value={debateUrl}
                                size="small"
                                fullWidth
                                InputProps={{ readOnly: true }}
                              />
                              <Tooltip title="Copy link">
                                <IconButton onClick={() => copyToClipboard(debateUrl)} size="small">
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>

                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" sx={{ minWidth: { xs: 76, sm: 80 } }}>Join code:</Typography>
                              <Chip label={debate.joincode} color="primary" variant="outlined" />
                            </Box>
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>

                    <Stack mt={2} direction="row" gap={1} flexWrap="wrap">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => navigate(`/debate/${debate.joincode}`)}
                      >
                        Chat
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/instructor/debate/${debate.joincode}/manage`)}
                      >
                        Manage
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => setDeleteDialog({ open: true, joincode: debate.joincode })}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
              );
            })
          )}
        </Grid>
        </Box>
      </PageShell>
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

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, joincode: "" })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Debate</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete the debate and related data. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, joincode: "" })}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => handleDelete(deleteDialog.joincode)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
