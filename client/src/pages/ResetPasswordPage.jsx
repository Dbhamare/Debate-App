import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import PasswordField from '../components/PasswordField';

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

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setInfo('');
    if (!token) { setError('Password reset link is missing or invalid.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, newPassword });
      setDone(true); setInfo(data?.message || 'Password reset successfully. You can now log in.');
      setNewPassword(''); setConfirmPassword('');
    } catch (err) { setError(err.response?.data?.message || 'Failed to reset password'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--background)', position: 'relative', overflow: 'hidden', padding: 24 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 40%, rgba(56,189,248,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', zIndex: 10, width: '100%', maxWidth: 420,
          background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '40px 36px',
          boxShadow: '0 0 50px -12px rgba(56,189,248,0.2)'
        }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(56,189,248,0.15)',
            border: '1px solid rgba(56,189,248,0.3)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 26 }}>key</span>
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 800, color: 'var(--on-surface)', marginBottom: 6, letterSpacing: '-0.01em' }}>Reset Password</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>Choose a new password for your account.</p>
        </div>
        {!token && <div className="alert-error" style={{ marginBottom: 16 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
          Password reset link is missing or invalid.
        </div>}
        <form onSubmit={handleSubmit}>
          <PasswordField id="reset-new" name="newPassword" label="New Password"
            autoComplete="new-password" required fullWidth margin="normal"
            value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <PasswordField id="reset-confirm" name="confirmPassword" label="Confirm Password"
            autoComplete="new-password" required fullWidth margin="normal"
            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          {info && <div className="alert-success" style={{ marginBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>{info}</div>}
          {error && <div className="alert-error" style={{ marginBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{error}</div>}
          <motion.button type="submit" disabled={busy || done || !token}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{ width: '100%', background: 'var(--primary)', color: 'var(--on-primary)', border: 'none',
              borderRadius: 8, padding: 14, fontSize: 14, fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginTop: 8,
              cursor: busy || done || !token ? 'not-allowed' : 'pointer',
              opacity: busy || done || !token ? 0.6 : 1 }}>
            {busy ? 'Resetting...' : done ? 'Done!' : 'Reset Password'}
          </motion.button>
        </form>
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button type="button" onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--on-surface-variant)', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            Back to Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}
