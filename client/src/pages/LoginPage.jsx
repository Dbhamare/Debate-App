import { Box, Button, TextField, Typography, Paper, Stack, Divider, Alert } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PasswordField from '../components/PasswordField';
import AppLogoButton from '../components/AppLogoButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userID, setUserID] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password, userID });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      if (
        res.data.user.role === 'instructor' ||
        (Number(res.data.user.userID) >= 501 && Number(res.data.user.userID) <= 600)
      ) {
        navigate('/instructor/dashboard');
      } else {
        navigate('/dashboard');
      }

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
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 410, borderRadius: 4 }}>
        <Stack alignItems="center" spacing={1.2} sx={{ mb: 2.5 }}>
          <AppLogoButton size={42} />
          <Typography variant="h5" fontWeight={700}>Welcome back</Typography>
          <Typography color="text.secondary" textAlign="center">
            Login to continue your debates and classroom sessions.
          </Typography>
        </Stack>
        <Divider sx={{ mb: 2.5 }} />
        <form onSubmit={handleLogin}>
          <TextField
            id="login-email"
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
            id="login-password"
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

          <TextField
            id="login-user-id"
            name="userID"
            label="Student/Instructor ID"
            autoComplete="off"
            required
            fullWidth
            margin="normal"
            value={userID}
            onChange={e => setUserID(e.target.value)}
            helperText="Enter your unique registration User ID"
          />

          {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{ mt: 2.5 }}
          >
            Login
          </Button>
        </form>

        <Button onClick={() => navigate('/register')} sx={{ mt: 2 }} fullWidth size="large">
          Register
        </Button>
        <Button onClick={() => navigate('/admin/login')} sx={{ mt: 1 }} fullWidth color="secondary" size="large">
          Admin Login
        </Button>
      </Paper>
    </Box>
  );
}
