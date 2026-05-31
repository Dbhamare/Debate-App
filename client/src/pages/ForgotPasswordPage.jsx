import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setInfo('');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setInfo(data?.message || 'If that email is registered, a password reset link has been sent.');
    } catch (err) { setError(err.response?.data?.message || 'Failed to send password reset link'); }
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
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 26 }}>lock_reset</span>
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 800,
            color: 'var(--on-surface)', marginBottom: 6, letterSpacing: '-0.01em' }}>Forgot Password</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, lineHeight: 1.5 }}>
            Enter your account email to receive a reset link.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>Email</label>
            <div className="input-wrapper">
              <span className="input-icon material-symbols-outlined">mail</span>
              <input className="rhetoric-input" type="email" placeholder="scholar@institution.edu"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          {info && <div className="alert-success" style={{ marginBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>{info}</div>}
          {error && <div className="alert-error" style={{ marginBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{error}</div>}
          <motion.button type="submit" disabled={busy} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{ width: '100%', background: 'var(--primary)', color: 'var(--on-primary)', border: 'none',
              borderRadius: 8, padding: 14, fontSize: 14, fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
              boxShadow: '0 0 20px rgba(56,189,248,0.3)', marginTop: 8 }}>
            {busy ? 'Sending...' : 'Send Reset Link'}
          </motion.button>
        </form>
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button type="button" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--on-surface-variant)', fontSize: 14,
            display: 'inline-flex', alignItems: 'center', gap: 4 }}
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
