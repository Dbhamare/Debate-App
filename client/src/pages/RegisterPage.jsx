import { Box, Button, TextField, Typography, Paper, Stack, Divider, Alert } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PasswordField from '../components/PasswordField';
import AppLogoButton from '../components/AppLogoButton';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [userID, setUserID] = useState('');

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [emailVerificationToken, setEmailVerificationToken] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const navigate = useNavigate();

  const sendEmailOtp = async () => {
    setError('');
    setInfo('');
    try {
      const emailToVerify = email.trim().toLowerCase();
      if (!emailToVerify) {
        setError('Please enter your email first.');
        return;
      }
      setBusy(true);
      setEmail(emailToVerify);
      setEmailVerified(false);
      setVerifiedEmail('');
      setEmailVerificationToken('');
      await api.post('/otp/register/email/request', { email: emailToVerify });
      setOtpSent(true);
      setInfo('Verification code sent to your email.');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send email code');
    } finally {
      setBusy(false);
    }
  };

  const verifyEmailOtp = async () => {
    setError('');
    setInfo('');
    try {
      const emailToVerify = email.trim().toLowerCase();
      if (!otpCode.trim()) {
        setError('Please enter the code you received.');
        return;
      }
      setBusy(true);
      const verifyRes = await api.post('/otp/register/email/verify', {
        email: emailToVerify,
        code: otpCode.trim(),
      });
      setEmailVerified(true);
      setEmail(emailToVerify);
      setVerifiedEmail(emailToVerify);
      setEmailVerificationToken(verifyRes?.data?.verificationToken || '');
      setInfo('Email verified. You can now complete registration.');
    } catch (e) {
      setEmailVerified(false);
      setVerifiedEmail('');
      setError(e.response?.data?.message || 'Invalid or expired code');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!emailVerified) {
      setError('Please verify your email first.');
      return;
    }
    if (!emailVerificationToken) {
      setError('Email verification token missing. Please verify email again.');
      return;
    }
    if (!verifiedEmail) {
      setError('Verified email missing. Please verify email again.');
      return;
    }

    try {
      setBusy(true);

      const res = await api.post('/auth/register', {
        name,
        email: verifiedEmail,
        password,
        userID: Number(userID),
        emailVerificationToken,
      });

      const { token, user } = res.data || {};
      if (token) localStorage.setItem('token', token);
      if (user)  localStorage.setItem('user', JSON.stringify(user));

      if (
        user?.role === 'instructor' ||
        (Number(user?.userID) >= 501 && Number(user?.userID) <= 600)
      ) {
        navigate('/instructor/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
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
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 430, borderRadius: 4 }} component="form" onSubmit={handleRegister}>
        <Stack alignItems="center" spacing={1.2} sx={{ mb: 2.5 }}>
          <AppLogoButton size={42} />
          <Typography variant="h5" fontWeight={700}>Create your account</Typography>
          <Typography color="text.secondary" textAlign="center">
            Verify your email to get started with debates.
          </Typography>
        </Stack>
        <Divider sx={{ mb: 2.5 }} />

        <TextField
          id="register-name"
          name="name"
          label="Name"
          autoComplete="name"
          required
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
          <TextField
            id="register-email"
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            fullWidth
            margin="normal"
            value={email}
            disabled={emailVerified}
            helperText={emailVerified ? 'Email verified' : ''}
            onChange={(e) => {
              setEmail(e.target.value);
              setOtpSent(false);
              setEmailVerified(false);
              setVerifiedEmail('');
              setEmailVerificationToken('');
              setOtpCode('');
            }}
          />
          <Button
            variant="outlined"
            sx={{ whiteSpace: 'nowrap', mt: 1, minWidth: { sm: 110 } }}
            onClick={sendEmailOtp}
            disabled={busy || !email || emailVerified}
            type="button"
          >
            {emailVerified ? 'Verified' : 'Send code'}
          </Button>
        </Stack>

        {otpSent && !emailVerified && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
            <TextField
              id="register-email-code"
              name="emailCode"
              label="Email code"
              autoComplete="one-time-code"
              fullWidth
              margin="normal"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
            />
            <Button
              variant="contained"
              sx={{ whiteSpace: 'nowrap', mt: 1, minWidth: { sm: 110 } }}
              onClick={verifyEmailOtp}
              disabled={busy || !otpCode}
              type="button"
            >
              Verify
            </Button>
          </Stack>
        )}

        <PasswordField
          id="register-password"
          name="password"
          label="Password"
          autoComplete="new-password"
          required
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <TextField
          id="register-user-id"
          name="userID"
          label="Student/Instructor ID"
          autoComplete="off"
          required
          fullWidth
          margin="normal"
          value={userID}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '');
            setUserID(v);
          }}
          helperText="Enter your unique registration User ID"
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        />

        {!!info && <Alert sx={{ mt: 1.2 }} severity="info">{info}</Alert>}
        {!!error && <Alert sx={{ mt: 1.2 }} severity="error">{error}</Alert>}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          sx={{ mt: 2.5 }}
          disabled={busy || !emailVerified}
        >
          Register
        </Button>

        <Button onClick={() => navigate('/login')} sx={{ mt: 1.5 }} fullWidth type="button" size="large">
          Back to Login
        </Button>
      </Paper>
    </Box>
  );
}
