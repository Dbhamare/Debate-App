import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button, Typography, Grid, Paper, Box, Chip, TextField, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import PageShell from '../components/PageShell';

export default function DashboardPage() {
  const [debates, setDebates] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    const fetchDebates = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/debates/assigned', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setDebates(res.data || []);
      } catch {
        try {
          const res = await api.get('/debates/public');
          setDebates(res.data || []);
        } catch {
          setDebates([]);
        }
      }
    };
    fetchDebates();
  }, []);

  const handleJoin = (e) => {
    e?.preventDefault?.();
    const code = String(joinCode || '').trim();
    if (!code) return;
    navigate(`/debate/${code}`);
    setJoinCode('');
  };

  return (
    <PageShell headerHeight={72} maxWidth={1260}>
      <Box py={{ xs: 2, sm: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          mb={3}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.8rem', md: '2.25rem' } }}>
              Available Debates
            </Typography>
            <Typography color="text.secondary">Join assigned rooms or browse public sessions.</Typography>
          </Box>

          {isLoggedIn && (
            <Paper sx={{ p: 1.2, borderRadius: 3, minWidth: { xs: '100%', md: 360 } }}>
              <Box component="form" onSubmit={handleJoin} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Enter join code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                />
                <Button variant="contained" onClick={handleJoin}>Join</Button>
              </Box>
            </Paper>
          )}
        </Stack>

        {debates.length === 0 ? (
          <Paper sx={{ p: 3.5, borderRadius: 3 }}>
            <Typography color="text.secondary">No debates available.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {debates.map(debate => (
              <Grid size={{ xs: 12, sm: 6, xl: 4 }} key={debate.joincode}>
                <Paper
                  sx={{
                    p: 2.2,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.1,
                    height: '100%',
                    transition: 'transform 170ms ease, box-shadow 170ms ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: isDark
                        ? `0 12px 26px ${alpha('#03070d', 0.48)}`
                        : `0 12px 26px ${alpha('#123865', 0.16)}`,
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                    <Typography fontWeight={700} sx={{ lineHeight: 1.3 }}>{debate.title}</Typography>
                    <Chip
                      label={debate.isPublic ? 'Public' : 'Private'}
                      size="small"
                      color={debate.isPublic ? 'success' : 'default'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {debate.description}
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Chip size="small" label={`Code: ${debate.joincode}`} variant="outlined" />
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/debate/${debate.joincode}`)}
                    >
                      Open
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </PageShell>
  );
}
