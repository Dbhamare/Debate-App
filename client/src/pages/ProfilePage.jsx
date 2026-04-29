import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button,
  List, ListItem, MenuItem, Stack, Avatar, Dialog, DialogContent, DialogTitle, DialogActions, Snackbar, Alert, Divider, Chip
} from '@mui/material';
import api from '../services/api';
import PageShell from '../components/PageShell';
import PasswordField from '../components/PasswordField';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';

const toProfileFields = (data = {}) => ({
  name: data.name || '',
  email: data.email || '',
  avatarUrl: data.avatarUrl || '',
  title: data.title || '',
  gender: data.gender || '',
  phone: data.phone || '',
  bio: data.bio || '',
  course: data.course || '',
});

export default function ProfilePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteAvatarOpen, setDeleteAvatarOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState(null);
  const [otpTarget, setOtpTarget] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const token = localStorage.getItem('token');

  const [form, setForm] = useState({
    name: '', email: '', avatarUrl: '',
    title: '', gender: '', phone: '', bio: '', course: '',
    oldPassword: '', newPassword: ''
  });
  const [, setSavedProfile] = useState(() => toProfileFields());

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/profile/me', { headers: { Authorization: `Bearer ${token}` } });
        const persisted = toProfileFields(data);
        setMe(data);
        setSavedProfile(persisted);
        setForm((f) => ({
          ...f,
          ...persisted,
        }));
      } catch (e) {
        console.error('load profile failed', e);
      }
    };
    load();
  }, [token]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const { data } = await api.post('/profile/avatar', fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      const avatarUrl = data.avatarUrl || '';
      setForm((f) => ({ ...f, avatarUrl }));
      setSavedProfile((p) => ({ ...p, avatarUrl }));
      setMe((prev) => (prev ? { ...prev, avatarUrl } : prev));
      const u = JSON.parse(localStorage.getItem('user') || 'null') || {};
      localStorage.setItem('user', JSON.stringify({ ...u, avatarUrl }));
      setToast({ open: true, severity: 'success', message: 'Profile picture updated.' });
    } catch (err) {
      setToast({ open: true, severity: 'error', message: err.response?.data?.message || 'Failed to upload avatar' });
    } finally {
      e.target.value = '';
    }
  };

  const onDeleteAvatar = async () => {
    try {
      await api.delete('/profile/avatar', { headers: { Authorization: `Bearer ${token}` } });
      setForm((f) => ({ ...f, avatarUrl: '' }));
      setSavedProfile((p) => ({ ...p, avatarUrl: '' }));
      setMe((prev) => (prev ? { ...prev, avatarUrl: '' } : prev));
      const u = JSON.parse(localStorage.getItem('user') || 'null') || {};
      localStorage.setItem('user', JSON.stringify({ ...u, avatarUrl: '' }));
      setToast({ open: true, severity: 'success', message: 'Profile picture removed.' });
    } catch (e) {
      setToast({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to delete avatar' });
    } finally {
      setDeleteAvatarOpen(false);
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = toProfileFields(form);
      const { data } = await api.patch('/profile/me', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedProfile = toProfileFields({ ...payload, ...data });
      setSavedProfile(updatedProfile);
      setMe((prev) => (prev ? { ...prev, ...updatedProfile } : prev));
      setForm((f) => ({ ...f, ...updatedProfile }));
      const u = JSON.parse(localStorage.getItem('user') || 'null') || {};
      localStorage.setItem('user', JSON.stringify({
        ...u,
        name: updatedProfile.name,
        email: updatedProfile.email,
        avatarUrl: updatedProfile.avatarUrl
      }));
      setToast({ open: true, severity: 'success', message: 'Profile updated.' });
    } catch (e) {
      setToast({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const onCancelChanges = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/dashboard');
  };

  const requestEmailOtp = async () => {
    if (!form.email || form.email === me?.email) {
      setToast({ open: true, severity: 'warning', message: 'Enter a new email to verify.' });
      return;
    }
    try {
      await api.post('/otp/profile/email/request', { newEmail: form.email }, { headers: { Authorization: `Bearer ${token}` } });
      setOtpPurpose('change_email'); setOtpTarget(form.email); setOtpCode(''); setOtpOpen(true);
    } catch (e) {
      setToast({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to send email OTP' });
    }
  };

  const requestPasswordOtp = async () => {
    if (!form.newPassword) {
      setToast({ open: true, severity: 'warning', message: 'Enter a new password first.' });
      return;
    }
    try {
      await api.post('/otp/profile/password/request', {}, { headers: { Authorization: `Bearer ${token}` } });
      setOtpPurpose('change_password'); setOtpTarget(''); setOtpCode(''); setOtpOpen(true);
    } catch (e) {
      setToast({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to send password OTP' });
    }
  };

  const requestPhoneOtp = async () => {
    if (!form.phone) {
      setToast({ open: true, severity: 'warning', message: 'Enter a phone number with country code.' });
      return;
    }
    try {
      await api.post('/otp/profile/phone/request', { newPhone: form.phone }, { headers: { Authorization: `Bearer ${token}` } });
      setOtpPurpose('change_phone'); setOtpTarget(form.phone); setOtpCode(''); setOtpOpen(true);
    } catch (e) {
      setToast({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to send SMS OTP' });
    }
  };

  const verifyCurrentOtp = async () => {
    try {
      setVerifying(true);
      if (otpPurpose === 'change_email') {
        const { data } = await api.post('/otp/profile/email/verify', { code: otpCode, newEmail: otpTarget }, { headers: { Authorization: `Bearer ${token}` } });
        const email = data.email || '';
        setForm((f) => ({ ...f, email }));
        setSavedProfile((p) => ({ ...p, email }));
        setMe((prev) => (prev ? { ...prev, email } : prev));
        const u = JSON.parse(localStorage.getItem('user') || 'null') || {};
        localStorage.setItem('user', JSON.stringify({ ...u, email }));
        setToast({ open: true, severity: 'success', message: 'Email verified and updated.' });
      } else if (otpPurpose === 'change_password') {
        await api.post('/otp/profile/password/verify', { code: otpCode, newPassword: form.newPassword }, { headers: { Authorization: `Bearer ${token}` } });
        setForm((f) => ({ ...f, oldPassword: '', newPassword: '' }));
        setToast({ open: true, severity: 'success', message: 'Password updated.' });
      } else if (otpPurpose === 'change_phone') {
        const { data } = await api.post('/otp/profile/phone/verify', { code: otpCode, newPhone: otpTarget }, { headers: { Authorization: `Bearer ${token}` } });
        const phone = data.phone || '';
        setForm((f) => ({ ...f, phone }));
        setSavedProfile((p) => ({ ...p, phone }));
        setMe((prev) => (prev ? { ...prev, phone } : prev));
        setToast({ open: true, severity: 'success', message: 'Phone verified and updated.' });
      }
      setOtpOpen(false);
    } catch (e) {
      setToast({ open: true, severity: 'error', message: e.response?.data?.message || 'Verification failed' });
    } finally {
      setVerifying(false);
    }
  };

  const avatarSrc = form.avatarUrl ? `${API_ORIGIN}${form.avatarUrl}` : undefined;
  const fallback = form.name?.[0]?.toUpperCase() || 'U';

  return (
    <PageShell headerHeight={72} maxWidth={1120}>
      <Box py={{ xs: 2, sm: 3 }} display="flex" justifyContent="center">
        <Paper sx={{ p: { xs: 2.6, sm: 3.5 }, width: '100%', maxWidth: 980, borderRadius: 4 }} component="form" onSubmit={onSave}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={1}
            sx={{ mb: 1.5 }}
          >
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.65rem', md: '2rem' } }}>
                My Profile
              </Typography>
              <Typography color="text.secondary">
                Update personal details, avatar, and account security.
              </Typography>
            </Box>
            <Chip label={me?.role || 'user'} size="small" color="primary" variant="outlined" />
          </Stack>
          <Divider sx={{ mb: 2.5 }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 2.5 }}>
          <Avatar
            src={avatarSrc}
            sx={{ width: 72, height: 72, cursor: avatarSrc ? 'zoom-in' : 'default' }}
            onClick={() => avatarSrc && setPreviewOpen(true)}
          >
            {fallback}
          </Avatar>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button variant="outlined" component="label">
              Upload New Avatar
              <input type="file" hidden accept="image/*" onChange={onPickAvatar} />
            </Button>
            <Button variant="text" color="error" onClick={() => setDeleteAvatarOpen(true)} disabled={!form.avatarUrl}>
              Delete Avatar
            </Button>
          </Stack>
        </Stack>

        <List disablePadding>
          <ListItem sx={{ px: 0, py: 1 }}>
            <TextField
              label="Title"
              name="title"
              value={form.title}
              onChange={onChange}
              fullWidth
              placeholder="e.g., MSc Student, Instructor"
            />
          </ListItem>

          <ListItem sx={{ px: 0, py: 1 }}>
            <TextField label="Full Name" name="name" value={form.name} onChange={onChange} fullWidth required />
          </ListItem>

          <ListItem sx={{ px: 0, py: 1, gap: 1, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <TextField label="Email" name="email" type="email" value={form.email} onChange={onChange} fullWidth required />
            <Button variant="outlined" onClick={requestEmailOtp}>Verify new email</Button>
          </ListItem>

          <ListItem sx={{ px: 0, py: 1 }}>
            <TextField select label="Gender" name="gender" value={form.gender} onChange={onChange} fullWidth>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
              <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
            </TextField>
          </ListItem>

          <ListItem sx={{ px: 0, py: 1, gap: 1, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <TextField label="Mobile (+country code)" name="phone" value={form.phone} onChange={onChange} fullWidth placeholder="+447700900123" />
            <Button variant="outlined" onClick={requestPhoneOtp}>Verify phone</Button>
          </ListItem>

          <ListItem sx={{ px: 0, py: 1 }}>
            <TextField label="Course" name="course" value={form.course} onChange={onChange} fullWidth placeholder="MSc Computer Science" />
          </ListItem>

          <ListItem sx={{ px: 0, py: 1 }}>
            <TextField label="Bio" name="bio" value={form.bio} onChange={onChange} fullWidth multiline minRows={3} />
          </ListItem>

          <ListItem sx={{ px: 0, py: 1.5 }}>
            <Divider flexItem />
          </ListItem>

          <ListItem sx={{ px: 0, py: 0.2 }}>
            <Typography variant="h6" fontWeight={700}>Change Password</Typography>
          </ListItem>

          <ListItem sx={{ px: 0, py: 1 }}>
            <PasswordField label="Old Password" name="oldPassword" value={form.oldPassword} onChange={onChange} fullWidth />
          </ListItem>

          <ListItem sx={{ px: 0, py: 1, gap: 1, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <PasswordField label="New Password" name="newPassword" value={form.newPassword} onChange={onChange} fullWidth />
            <Button variant="outlined" onClick={requestPasswordOtp}>Send OTP to email</Button>
          </ListItem>
        </List>

        <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
          <Button type="button" variant="outlined" size="large" onClick={onCancelChanges} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" size="large" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </Box>
        </Paper>
      </Box>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Profile Picture</DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Profile"
              style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 8 }}
            />
          ) : (
            <Typography color="text.secondary">No profile picture.</Typography>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={otpOpen} onClose={() => setOtpOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {otpPurpose === 'change_email' ? 'Verify new email'
            : otpPurpose === 'change_password' ? 'Verify password change'
            : otpPurpose === 'change_phone' ? 'Verify phone number'
            : 'Enter OTP'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Enter the 6-digit code we just sent.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
            placeholder="123456"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtpOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={verifying || otpCode.length < 4} onClick={verifyCurrentOtp}>
            {verifying ? 'Verifying…' : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteAvatarOpen} onClose={() => setDeleteAvatarOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove Profile Picture</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Your current profile picture will be removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAvatarOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={onDeleteAvatar}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={2600}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast((p) => ({ ...p, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </PageShell>
  );
}
