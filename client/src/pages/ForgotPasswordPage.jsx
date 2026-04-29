import { Box, Button, TextField, Typography, Paper, Stack, Divider, Alert } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AppLogoButton from '../components/AppLogoButton';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    try {
      setBusy(true);
      const { data } = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setInfo(data?.message || 'If that email is registered, a password reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send password reset link');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={2}
      py={4}
    >
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 410, borderRadius: 4 }} component="form" onSubmit={handleSubmit}>
        <Stack alignItems="center" spacing={1.2} sx={{ mb: 2.5 }}>
          <AppLogoButton size={42} />
          <Typography variant="h5" fontWeight={700}>Forgot password</Typography>
          <Typography color="text.secondary" textAlign="center">
            Enter your account email to receive a reset link.
          </Typography>
        </Stack>
        <Divider sx={{ mb: 2.5 }} />

        <TextField
          label="Email"
          type="email"
          required
          fullWidth
          margin="normal"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        {!!info && <Alert severity="success" sx={{ mt: 1.5 }}>{info}</Alert>}
        {!!error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          sx={{ mt: 2.5 }}
          disabled={busy}
        >
          {busy ? 'Sending...' : 'Send reset link'}
        </Button>

        <Button onClick={() => navigate('/login')} sx={{ mt: 1.5 }} fullWidth type="button" size="large">
          Back to Login
        </Button>
      </Paper>
    </Box>
  );
}
