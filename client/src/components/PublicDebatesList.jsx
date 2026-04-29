import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function PublicDebatesList() {
  const [debates, setDebates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/debates/public").then(res => setDebates(res.data));
  }, []);

  return (
    <Box mt={4}>
      <Typography variant="h5" gutterBottom>
        Public Debates
      </Typography>
      {debates.map((debate) => (
        <Card key={debate._id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{debate.title}</Typography>
            <Typography variant="body2">{debate.description}</Typography>
            <Button sx={{ mt: 1 }} variant="outlined" onClick={() => navigate(`/public/debate/${debate.joincode}`)}>
              View Comments
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
