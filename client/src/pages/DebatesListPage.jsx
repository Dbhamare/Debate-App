import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button, Typography } from '@mui/material';

export default function DebatesListPage() {
  const [debates, setDebates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/debates')
      .then(res => setDebates(res.data))
      .catch(() => setDebates([]));
  }, []);

  return (
    <div>
      <Typography variant="h4" mb={2}>Join a Debate</Typography>
      {debates.map(debate => (
        <Button
          key={debate.joincode}
          variant="outlined"
          sx={{ m: 1 }}
          onClick={() => navigate(`/debate/${debate.joincode}`)}
        >
          {debate.title}
        </Button>
      ))}
    </div>
  );
}