import { Box, Typography, Card, CardContent, Button, Stack, CardActionArea } from "@mui/material";
import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function PublicDebatesSection() {
  const [debates, setDebates] = useState([]);
  const [activeDebate, setActiveDebate] = useState(null);
  const [comments, setComments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/debates/public").then(res => setDebates(res.data)).catch(() => setDebates([]));
  }, []);

  useEffect(() => {
    if (activeDebate) {
      api.get(`/messages/${activeDebate.joincode}`).then(res => setComments(res.data)).catch(() => setComments([]));
    }
  }, [activeDebate]);

  return (
    <Box mt={8}>
      <Typography variant="h5" mb={2}>Open Debates</Typography>
      <Stack direction="row" flexWrap="wrap" spacing={2}>
        {debates.length === 0 && (
          <Typography color="text.secondary">No public debates at the moment.</Typography>
        )}
        {debates.map(debate => (
          <Card
            key={debate._id}
            variant={activeDebate?._id === debate._id ? "outlined" : "elevation"}
            sx={{ minWidth: 240 }}
          >
            <CardActionArea onClick={() => setActiveDebate(debate)}>
              <CardContent>
                <Typography fontWeight="bold">{debate.title}</Typography>
                <Typography variant="body2">{debate.topic}</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>

      {activeDebate && (
        <Box mt={4}>
          <Typography variant="h6">{activeDebate.title}</Typography>
          <Box sx={{ maxHeight: 200, overflowY: "auto", mt: 2, mb: 1, px: 2, py: 1, bgcolor: "#f4f4f4", borderRadius: 2 }}>
            {comments.length === 0 ? (
              <Typography color="text.secondary">No comments yet.</Typography>
            ) : (
              comments.map(msg => (
                <Box key={msg._id} sx={{ mb: 2 }}>
                  <Typography fontWeight="bold" display="inline">{msg.sender?.name || "Anonymous"}: </Typography>
                  <Typography display="inline">{msg.content}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">{new Date(msg.createdAt).toLocaleString()}</Typography>
                </Box>
              ))
            )}
          </Box>
          <Button
            variant="outlined"
            onClick={() => navigate("/login")}
          >
            Login or Register to comment
          </Button>
        </Box>
      )}
    </Box>
  );
}
