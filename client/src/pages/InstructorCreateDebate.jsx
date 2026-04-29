import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  Snackbar,
  Alert
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import PageShell from "../components/PageShell";


export default function InstructorCreateDebate() {
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    description: "",
    rules: "",
    isPublic: false,
    startTime: "",
    endTime: "",
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) {
      setToast({ open: true, severity: "warning", message: "End time must be later than start time." });
      setLoading(false);
      return;
    }

    const debateData = {
      ...formData,
      sides: [
        { name: "proponent", participants: [] },
        { name: "opponent", participants: [] },
        { name: "neutral", participants: [] }
      ]
    };

    try {
      const token = localStorage.getItem("token");
      await api.post("/instructor/debates", debateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setToast({ open: true, severity: "success", message: "Debate created successfully." });
      navigate("/instructor/dashboard");
    } catch (err) {
      console.error("Error creating debate:", err);
      setToast({ open: true, severity: "error", message: "Failed to create debate. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell headerHeight={72} maxWidth={800}>
    <Box p={{ xs: 2, sm: 3, md: 4 }} display="flex" justifyContent="center">
      <Paper sx={{ p: { xs: 3, sm: 4 }, maxWidth: 720, width: "100%", borderRadius: 4 }}>
        <Typography variant="h4" fontWeight={800} sx={{ mb: 0.6, fontSize: { xs: "1.65rem", md: "2rem" } }}>
          Create New Debate
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2.2 }}>
          Configure debate details, schedule, and visibility before publishing.
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSubmit}>
          <TextField
            label="Debate Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            fullWidth
            required
            placeholder="e.g. Should AI replace traditional grading?"
            sx={{ mb: 2 }}
          />

          <TextField
            label="Debate Topic"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            fullWidth
            required
            placeholder="e.g. AI in Higher Education"
            sx={{ mb: 2 }}
          />

          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            required
            placeholder="Give participants context and scope."
            sx={{ mb: 2 }}
          />

          <TextField
            label="Rules"
            name="rules"
            value={formData.rules}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            required
            placeholder="Define etiquette and moderation rules."
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.isPublic}
                onChange={handleChange}
                name="isPublic"
              />
            }
            label="Make Debate Public"
            sx={{ mb: 2 }}
          />

          <TextField
            label="Start Time"
            name="startTime"
            type="datetime-local"
            value={formData.startTime}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="End Time"
            name="endTime"
            type="datetime-local"
            value={formData.endTime}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Debate"}
          </Button>
        </form>
      </Paper>
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
    </Box>
    </PageShell>
  );
}
