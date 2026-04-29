import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  Button,
  CircularProgress
} from "@mui/material";
import { format } from "date-fns";
import socket from "../services/socket";

export default function PublicDebatePage() {
  const { joincode } = useParams();
  const [debate, setDebate] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const listEndRefs = {
    proponent: useRef(null),
    neutral: useRef(null),
    opponent: useRef(null)
  };

  const scrollToBottom = (side) => {
    const ref = listEndRefs[side];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const fetchDebate = async () => {
      try {
        const res = await api.get(`/debates/public/${joincode}`);
        setDebate(res.data);
      } catch {
        setDebate(null);
      }

      try {
        const msgRes = await api.get(`/messages/${joincode}`);
        setMessages(msgRes.data);
        setTimeout(() => {
          ["proponent", "neutral", "opponent"].forEach(scrollToBottom);
        }, 100);
      } catch {
        setMessages([]);
      }

      setLoading(false);
    };

    fetchDebate();
    socket.emit('joinDebate', { joincode: Number(joincode) }, () => {});

    socket.on(`newMessage:${joincode}`, (message) => {
      setMessages(prev => {
        const updated = prev.some((m) => m._id === message._id) ? prev : [...prev, message];
        setTimeout(() => scrollToBottom(message.side || "neutral"), 100);
        return updated;
      });
    });

    const interval = setInterval(fetchDebate, 10000);

    return () => {
      clearInterval(interval);
      socket.off(`newMessage:${joincode}`);
    };
  }, [joincode]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!debate) {
    return (
      <Box p={{ xs: 2, sm: 3, md: 4 }}>
        <Typography variant="h4">Debate Not Found</Typography>
      </Box>
    );
  }

  const sides = ["proponent", "neutral", "opponent"];
  const sideColors = {
    proponent: { bg: "#d4edda", border: "#c3e6cb" },
    neutral: { bg: "#d1ecf1", border: "#bee5eb" },
    opponent: { bg: "#f8d7da", border: "#f5c6cb" }
  };

  return (
    <Box p={{ xs: 2, sm: 3, md: 4 }}>
      <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
        {debate.title}
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" mb={4}>
        {debate.description}
      </Typography>

      <Box
        display="grid"
        gap={2}
        justifyContent="center"
        sx={{ gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(300px, 1fr))' } }}
      >
        {sides.map(sideKey => {
          const filteredMessages = messages.filter(msg => msg.side === sideKey);
          return (
            <Paper key={sideKey} sx={{
              p: 2,
              width: "100%",
              display: 'flex',
              flexDirection: 'column',
              minHeight: { xs: 380, md: 770 }
            }}>
              <Typography variant="h6" gutterBottom textTransform="capitalize" textAlign="center">
                {sideKey} Views
              </Typography>

              <List sx={{ flexGrow: 1, overflowY: { xs: "visible", md: "auto" }, maxHeight: { xs: "none", md: 620 }, mb: 2 }}>
                {filteredMessages.length === 0 ? (
                  <Typography textAlign="center" color="text.secondary" sx={{ mt: 2 }}>
                    No messages yet.
                  </Typography>
                ) : (
                  filteredMessages.map((msg, idx) => (
                    <ListItem key={msg._id || idx}>
                      <Box
                        sx={{
                          bgcolor: sideColors[sideKey].bg,
                          border: "1px solid",
                          borderColor: sideColors[sideKey].border,
                          color: "black",
                          borderRadius: 2,
                          p: 1.5,
                          width: "100%",
                          boxShadow: 1,
                        }}
                      >
                        <Typography fontWeight="bold">
                          {msg.senderName || msg.sender?.name || "Anonymous"}
                        </Typography>
                        <Typography>{msg.content}</Typography>
                        <Typography variant="caption" sx={{ color: "black" }}>
                          {format(new Date(msg.createdAt), "dd MMM yyyy | hh:mm a")}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))
                )}
                <div ref={listEndRefs[sideKey]} />
              </List>
            </Paper>
          );
        })}
      </Box>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" mb={2}>
          Want to Share Your Opinion?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <Button size="large" onClick={() => navigate("/login")}>Login</Button> or{" "}
          <Button size="large" onClick={() => navigate("/register")}>Create a Free Account!</Button>
        </Typography>
      </Paper>
    </Box>
  );
}
