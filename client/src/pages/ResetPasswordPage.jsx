import { Box, Button, Typography, Paper, Stack, Divider, Alert } from '@mui/material';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import PasswordField from '../components/PasswordField';
import AppLogoButton from '../components/AppLogoButton';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (!token) {
      setError('Password reset link is missing or invalid.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setBusy(true);
      const { data } = await api.post('/auth/reset-password', { token, newPassword });
      setDone(true);
      setInfo(data?.message || 'Password reset successfully. You can now log in.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
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
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 430, borderRadius: 4 }} component="form" onSubmit={handleSubmit}>
        <Stack alignItems="center" spacing={1.2} sx={{ mb: 2.5 }}>
          <AppLogoButton size={42} />
          <Typography variant="h5" fontWeight={700}>Reset password</Typography>
          <Typography color="text.secondary" textAlign="center">
            Choose a new password for your account.
          </Typography>
        </Stack>
        <Divider sx={{ mb: 2.5 }} />

        {!token && <Alert severity="error" sx={{ mb: 1.5 }}>Password reset link is missing or invalid.</Alert>}

        <PasswordField
          label="New Password"
          required
          fullWidth
          margin="normal"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          disabled={!token || done}
          inputProps={{ minLength: 6 }}
        />

        <PasswordField
          label="Confirm Password"
          required
          fullWidth
          margin="normal"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={!token || done}
          inputProps={{ minLength: 6 }}
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
          disabled={busy || done || !token}
        >
          {busy ? 'Resetting...' : 'Reset password'}
        </Button>

        <Button onClick={() => navigate('/login')} sx={{ mt: 1.5 }} fullWidth type="button" size="large">
          Back to Login
        </Button>
      </Paper>
    </Box>
  );
}
