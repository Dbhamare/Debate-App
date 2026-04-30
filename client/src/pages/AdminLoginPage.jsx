import { Box, Button, TextField, Typography, Paper, Stack, Divider, Alert } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PasswordField from '../components/PasswordField';
import AppLogoButton from '../components/AppLogoButton';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/admin/login', { email: email.toLowerCase(), password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 390, borderRadius: 4 }}>
        <Stack alignItems="center" spacing={1.2} sx={{ mb: 2.5 }}>
          <AppLogoButton size={42} />
          <Typography variant="h5" fontWeight={700}>Admin login</Typography>
          <Typography color="text.secondary" textAlign="center">
            Sign in with your administrator account.
          </Typography>
        </Stack>
        <Divider sx={{ mb: 2.5 }} />
        <form onSubmit={handleLogin}>
          <TextField
            id="admin-login-email"
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            fullWidth
            margin="normal"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <PasswordField
            id="admin-login-password"
            name="password"
            label="Password"
            autoComplete="current-password"
            required
            fullWidth
            margin="normal"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Box display="flex" justifyContent="flex-end">
            <Button type="button" size="small" onClick={() => navigate('/forgot-password')}>
              Forgot password?
            </Button>
          </Box>
          {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
          <Button type="submit" variant="contained" color="primary" size="large" fullWidth sx={{ mt: 2.5 }}>
            Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
