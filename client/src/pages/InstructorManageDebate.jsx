import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  CircularProgress,
  Chip,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Snackbar,
  Alert
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { useParams } from "react-router-dom";
import api from "../services/api";
import PageShell from "../components/PageShell";

import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

const CHART_COLORS = ["#2e7d32", "#c62828", "#0277bd", "#6a1b9a", "#ef6c00", "#283593"];

export default function InstructorManageDebate() {
  const { joincode } = useParams();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [debate, setDebate] = useState(null);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [voteCounts, setVoteCounts] = useState({ proponent: 0, opponent: 0, my: null });
  const [votesLoading, setVotesLoading] = useState(true);

  const [selection, setSelection] = useState({});
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });
  const chartSx = {
    "& .recharts-cartesian-grid line": {
      stroke: alpha(theme.palette.text.primary, 0.2),
    },
    "& .recharts-text": {
      fill: theme.palette.text.secondary,
    },
    "& .recharts-legend-item-text": {
      color: `${theme.palette.text.secondary} !important`,
    },
  };
  const chartTooltipProps = {
    cursor: false,
    contentStyle: {
      borderRadius: 10,
      backgroundColor: isDark ? alpha("#091425", 0.92) : alpha("#ffffff", 0.96),
      border: `1px solid ${isDark ? alpha("#d8e8ff", 0.22) : alpha("#123865", 0.16)}`,
    },
    labelStyle: {
      color: isDark ? "#d6e6fb" : "#1a2f4c",
    },
  };

  useEffect(() => {
    fetchDebate();
    fetchStudents();
    fetchAnalytics();
    fetchVotes();
  }, [joincode]);

  const fetchDebate = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/debates/join/${joincode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDebate(res.data);

      const sel = {};
      (res.data.sides || []).forEach(s => {
        (s.participants || []).forEach(uid => { sel[uid] = s.name; });
      });
      setSelection(sel);
    } catch (err) {
      console.error("Error fetching debate:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/debates/join/${joincode}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchVotes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/debates/join/${joincode}/votes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = res.data || {};
      setVoteCounts({
        proponent: Number(data.proponent || 0),
        opponent: Number(data.opponent || 0),
        my: data.my ?? null,
      });
    } catch (err) {
      console.error("Error fetching votes:", err);
      setVoteCounts({ proponent: 0, opponent: 0, my: null });
    } finally {
      setVotesLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(
        `/debates/join/${joincode}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ open: true, severity: "success", message: `Debate status updated to ${status}` });
      fetchDebate();
      fetchAnalytics();
      fetchVotes();
    } catch (err) {
      console.error("Error updating status:", err);
      setToast({ open: true, severity: "error", message: "Failed to update status." });
    }
  };

  const toggleUserSide = (userID, side) => {
    setSelection(prev => {
      const current = prev[userID] || "";
      const next = current === side ? "" : side;
      return { ...prev, [userID]: next };
    });
  };

  const handleBulkAssign = async () => {
    const assignments = Object.entries(selection)
      .filter(([, side]) => side)
      .map(([userID, side]) => ({ userID: Number(userID), side }));

    if (assignments.length === 0) {
      setToast({ open: true, severity: "warning", message: "Select at least one student/user and a side." });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.patch(
        `/debates/join/${joincode}/assign-bulk`,
        { assignments },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ open: true, severity: "success", message: "Assignments saved." });
      fetchDebate();
    } catch (err) {
      console.error("Error bulk assigning:", err);
      setToast({ open: true, severity: "error", message: "Failed to assign students/users." });
    }
  };

  const handleRemoveFromDebate = async (userID) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(
        `/debates/join/${joincode}/assign/${userID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDebate(prev => {
        if (!prev) return prev;
        const next = {
          ...prev,
          sides: (prev.sides || []).map(s => ({
            ...s,
            participants: (s.participants || []).filter(id => id !== userID)
          }))
        };
        return next;
      });
      setSelection(prev => {
        const cp = { ...prev };
        delete cp[userID];
        return cp;
      });
    } catch (err) {
      console.error("Error removing student:", err);
      setToast({ open: true, severity: "error", message: "Failed to remove user from debate." });
    }
  };

  const nameFor = (id) =>
    students.find(s => s.userID === id)?.name || `ID: ${id}`;

  const downloadFile = (filename, content, mimeType = "application/json") => {
    const blob = new Blob([content], { type: mimeType });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  const handleExportAnalytics = () => {
    if (!analytics || !debate) {
      setToast({ open: true, severity: "warning", message: "No analytics to export." });
      return;
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      debate: { title: debate.title, joincode: debate.joincode, status: debate.status },
      votes: voteCounts,
      analytics,
    };
    downloadFile(
      `debate_${debate.joincode}_analytics.json`,
      JSON.stringify(payload, null, 2)
    );
    setToast({ open: true, severity: "success", message: "Analytics exported." });
  };

  const handleExportTranscript = async () => {
    if (!debate) return;
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get(`/messages/${debate.joincode}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      downloadFile(
        `debate_${debate.joincode}_transcript.json`,
        JSON.stringify({
          exportedAt: new Date().toISOString(),
          debate: { title: debate.title, joincode: debate.joincode, status: debate.status },
          messages: Array.isArray(data) ? data : [],
        }, null, 2)
      );
      setToast({ open: true, severity: "success", message: "Transcript exported." });
    } catch (err) {
      console.error("Error exporting transcript:", err);
      setToast({ open: true, severity: "error", message: "Failed to export transcript." });
    }
  };

  const badgeFor = (participant) => {
    if (!participant) return "Participant";
    if (participant.Messages >= 25) return "Debate Champion";
    if (participant.UpvotesReceived >= 12) return "Insight Leader";
    if (participant.LikesReceived >= 12) return "Community Voice";
    if (participant.Messages >= 10) return "Rising Contributor";
    return "Participant";
  };

  if (loading) {
    return (
      <PageShell headerHeight={72} maxWidth={1420}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
          <CircularProgress />
        </Box>
      </PageShell>
    );
  }

  if (!debate) {
    return (
      <PageShell headerHeight={72} maxWidth={1420}>
        <Box py={{ xs: 2, sm: 3 }}>
          <Typography variant="h5" color="error">Debate Not Found</Typography>
        </Box>
      </PageShell>
    );
  }

  let messagesSeries = [];
  let reactionsSeries = [];
  let participantsSeries = [];
  let timelineSeries = [];
  let highlights = null;

  const votesFromEndpoint = {
    proponent: Number(voteCounts.proponent || 0),
    opponent: Number(voteCounts.opponent || 0),
  };
  const votesFromAnalytics = {
    proponent: Number(analytics?.votes?.proponent || 0),
    opponent: Number(analytics?.votes?.opponent || 0),
  };
  const effectiveVotes =
    (votesFromEndpoint.proponent + votesFromEndpoint.opponent > 0 ||
     !analytics) ? votesFromEndpoint : votesFromAnalytics;

  let voteData = [{
    name: 'Votes',
    opponent: effectiveVotes.opponent,
    proponent: effectiveVotes.proponent,
  }];
  const noVotes = (effectiveVotes.opponent + effectiveVotes.proponent) === 0;

  if (analytics) {
    const perSide = analytics.perSide || {
      proponent: { messages: 0, likes: 0, dislikes: 0, upvotes: 0, downvotes: 0, sentimentAvg: 0 },
      opponent:  { messages: 0, likes: 0, dislikes: 0, upvotes: 0, downvotes: 0, sentimentAvg: 0 },
      neutral:   { messages: 0, likes: 0, dislikes: 0, upvotes: 0, downvotes: 0, sentimentAvg: 0 },
    };

    const sideRows = [
      { side: "Proponent", ...perSide.proponent },
      { side: "Opponent",  ...perSide.opponent  },
      { side: "Neutral",   ...perSide.neutral   },
    ];

    messagesSeries = sideRows.map(r => ({
      side: r.side,
      Messages: r.messages,
      Sentiment: r.sentimentAvg,
    }));

    reactionsSeries = sideRows.map(r => ({
      side: r.side,
      Likes: r.likes,
      Dislikes: r.dislikes,
      Upvotes: r.upvotes,
      Downvotes: r.downvotes,
    }));

    participantsSeries = (analytics.perUser || []).slice(0, 10).map(u => ({
      name: `${u.name} (${u.userID})`,
      Messages: u.messages,
      LikesReceived: u.likesReceived,
      UpvotesReceived: u.upvotesReceived,
      Sentiment: u.sentimentAvg,
    }));

    timelineSeries = (analytics.timeline || []).map(t => ({
      minute: new Date(t.minute).toLocaleTimeString(),
      Messages: t.messages,
      Sentiment: t.sentimentAvg,
    }));

    highlights = analytics.topMessages || null;
  }

  return (
    <PageShell headerHeight={72} maxWidth={1420}>
      <Box py={{ xs: 2, sm: 3 }}>
      <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: "1.8rem", md: "2.25rem" } }}>
        Manage Debate
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2.2 }}>
        Assign participants, moderate status, and review analytics.
      </Typography>

      <Paper sx={{ p: { xs: 2, sm: 2.8 }, mt: 2, borderRadius: 3 }}>
        <Typography variant="h5">{debate.title}</Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          {debate.description}
        </Typography>
        <Typography>Status: <b>{debate.status}</b></Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={() => handleStatusChange("upcoming")}
            color={debate.status === "upcoming" ? "primary" : "inherit"}
          >
            Set Upcoming
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleStatusChange("active")}
          >
            Set Active
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleStatusChange("closed")}
          >
            Set Closed
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 2.8 }, mt: 2.5, borderRadius: 3 }}>
        <Typography variant="h6">Assign Students/Users to Sides</Typography>

        <Box sx={{ mt: 2, overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell><strong>Student/User</strong></TableCell>
              <TableCell align="center"><strong>Proponent</strong></TableCell>
              <TableCell align="center"><strong>Opponent</strong></TableCell>
              <TableCell align="center"><strong>Neutral</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((s) => {
              const userID = s.userID;
              const selected = selection[userID] || "";
              return (
                <TableRow
                  key={userID}
                  sx={{
                    "&:hover": {
                      bgcolor: isDark ? alpha("#d8e8ff", 0.04) : alpha("#123865", 0.04),
                    },
                  }}
                >
                  <TableCell>{s.name} ({userID}) – {s.role}</TableCell>
                  <TableCell align="center">
                    <Checkbox
                      checked={selected === "proponent"}
                      onChange={() => toggleUserSide(userID, "proponent")}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Checkbox
                      checked={selected === "opponent"}
                      onChange={() => toggleUserSide(userID, "opponent")}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Checkbox
                      checked={selected === "neutral"}
                      onChange={() => toggleUserSide(userID, "neutral")}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </Box>

        <Box mt={2} mb={1}>
          <Button variant="contained" onClick={handleBulkAssign}>
            Assign Selected
          </Button>
        </Box>

        <Box mt={3}>
          <Typography variant="subtitle1" fontWeight="bold">Current Assignments:</Typography>
          {debate.sides && debate.sides.map((side) => (
            <Box key={side.name} mt={1}>
              <Typography variant="body2" fontWeight="bold">
                {side.name.charAt(0).toUpperCase() + side.name.slice(1)}:
              </Typography>
              {side.participants.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No students/users assigned.</Typography>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {side.participants.map((studentID) => (
                    <Chip
                      key={studentID}
                      label={nameFor(studentID)}
                      onDelete={() => handleRemoveFromDebate(studentID)}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 2.8 }, mt: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}>
          <Typography variant="h6">Debate Analytics</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="outlined" onClick={handleExportAnalytics}>Export Analytics</Button>
            <Button variant="outlined" onClick={handleExportTranscript}>Export Transcript</Button>
          </Stack>
        </Stack>

        {analyticsLoading ? (
          <CircularProgress size={24} sx={{ mt: 2 }} />
        ) : !analytics ? (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            No analytics available.
          </Typography>
        ) : (
          <>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
              <Paper sx={{ p: 2, flex: 1, minHeight: 320, borderRadius: 2.5, ...chartSx }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>Votes</Typography>
                {votesLoading ? (
                  <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : noVotes ? (
                  <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">No votes yet</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={voteData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip {...chartTooltipProps} />
                      <Legend />
                      <Bar dataKey="opponent" name="Opponent" fill="#c62828" />
                      <Bar dataKey="proponent" name="Proponent" fill="#2e7d32" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Paper>

              <Paper sx={{ p: 2, flex: 1, minHeight: 320, borderRadius: 2.5, ...chartSx }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>Messages per Side</Typography>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={messagesSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="side" />
                    <YAxis />
                    <Tooltip {...chartTooltipProps} />
                    <Legend />
                    <Bar dataKey="Messages" fill={CHART_COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Paper sx={{ p: 2, flex: 1, minHeight: 340, borderRadius: 2.5, ...chartSx }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>Reactions by Side</Typography>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={reactionsSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="side" />
                    <YAxis />
                    <Tooltip {...chartTooltipProps} />
                    <Legend />
                    <Bar dataKey="Likes" fill={CHART_COLORS[0]} />
                    <Bar dataKey="Dislikes" fill={CHART_COLORS[1]} />
                    <Bar dataKey="Upvotes" fill={CHART_COLORS[2]} />
                    <Bar dataKey="Downvotes" fill={CHART_COLORS[3]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>

              <Paper sx={{ p: 2, flex: 1, minHeight: 340, borderRadius: 2.5, ...chartSx }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>Sentiment Over Time</Typography>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={timelineSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="minute" />
                    <YAxis />
                    <Tooltip {...chartTooltipProps} />
                    <Legend />
                    <Line type="monotone" dataKey="Sentiment" stroke="#1976d2" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Paper sx={{ p: 2, borderRadius: 2.5, ...chartSx }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>Top Participants (by messages)</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={participantsSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip {...chartTooltipProps} />
                  <Legend />
                  <Bar dataKey="Messages" fill="#2e7d32" />
                  <Bar dataKey="LikesReceived" fill="#0277bd" />
                  <Bar dataKey="UpvotesReceived" fill="#6a1b9a" />
                </BarChart>
              </ResponsiveContainer>

              <Box sx={{ mt: 1, overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 640 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Participant</TableCell>
                    <TableCell align="right">Messages</TableCell>
                    <TableCell align="right">Likes Received</TableCell>
                    <TableCell align="right">Upvotes Received</TableCell>
                    <TableCell align="right">Avg Sentiment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {participantsSeries.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell align="right">{p.Messages}</TableCell>
                      <TableCell align="right">{p.LikesReceived}</TableCell>
                      <TableCell align="right">{p.UpvotesReceived}</TableCell>
                      <TableCell align="right">{p.Sentiment}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </Box>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Leaderboard & Badges
              </Typography>
              <Stack spacing={1}>
                {participantsSeries.slice(0, 5).map((p, idx) => (
                  <Stack
                    key={`${p.name}-${idx}`}
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    sx={{
                      p: 1,
                      border: `1px solid ${alpha(theme.palette.text.primary, 0.15)}`,
                      borderRadius: 1.5
                    }}
                  >
                    <Typography variant="body2">
                      #{idx + 1} {p.name}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" color="primary" label={`${p.Messages} messages`} />
                      <Chip size="small" variant="outlined" label={badgeFor(p)} />
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Paper>

            <Divider sx={{ my: 2 }} />

            <Paper sx={{ p: 2, borderRadius: 2.5 }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>Highlights</Typography>
              <Stack spacing={0.5}>
                <Typography>
                  <b>Most Liked:</b> {highlights?.mostLiked?.senderName} — “{highlights?.mostLiked?.content}” ({highlights?.mostLiked?.likes || 0})
                </Typography>
                <Typography>
                  <b>Most Disliked:</b> {highlights?.mostDisliked?.senderName} — “{highlights?.mostDisliked?.content}” ({highlights?.mostDisliked?.dislikes || 0})
                </Typography>
                <Typography>
                  <b>Most Upvoted:</b> {highlights?.mostUpvoted?.senderName} — “{highlights?.mostUpvoted?.content}” ({highlights?.mostUpvoted?.upvotes || 0})
                </Typography>
                <Typography>
                  <b>Most Downvoted:</b> {highlights?.mostDownvoted?.senderName} — “{highlights?.mostDownvoted?.content}” ({highlights?.mostDownvoted?.downvotes || 0})
                </Typography>
              </Stack>
            </Paper>
          </>
        )}
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
