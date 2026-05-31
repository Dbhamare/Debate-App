import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
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
    setError(''); setInfo('');
    const emailToVerify = email.trim().toLowerCase();
    if (!emailToVerify) { setError('Please enter your email first.'); return; }
    setBusy(true);
    try {
      setEmail(emailToVerify); setEmailVerified(false); setVerifiedEmail(''); setEmailVerificationToken('');
      await api.post('/otp/register/email/request', { email: emailToVerify });
      setOtpSent(true); setInfo('Verification code sent to your email.');
    } catch (e) { setError(e.response?.data?.message || 'Failed to send email code'); }
    finally { setBusy(false); }
  };

  const verifyEmailOtp = async () => {
    setError(''); setInfo('');
    if (!otpCode.trim()) { setError('Please enter the code you received.'); return; }
    setBusy(true);
    try {
      const emailToVerify = email.trim().toLowerCase();
      const r = await api.post('/otp/register/email/verify', { email: emailToVerify, code: otpCode.trim() });
      setEmailVerified(true); setVerifiedEmail(emailToVerify);
      setEmailVerificationToken(r?.data?.verificationToken || '');
      setInfo('Email verified! Complete your registration below.');
    } catch (e) { setEmailVerified(false); setVerifiedEmail(''); setError(e.response?.data?.message || 'Invalid or expired code'); }
    finally { setBusy(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setInfo('');
    if (!emailVerified) { setError('Please verify your email first.'); return; }
    if (!emailVerificationToken) { setError('Email verification token missing. Please verify email again.'); return; }
    setBusy(true);
    try {
      const res = await api.post('/auth/register', { name, email: verifiedEmail, password, userID: Number(userID), emailVerificationToken });
      const { token, user } = res.data || {};
      if (token) localStorage.setItem('token', token);
      if (user) localStorage.setItem('user', JSON.stringify(user));
      if (user?.role === 'instructor' || (Number(user?.userID) >= 501 && Number(user?.userID) <= 600)) {
        navigate('/instructor/dashboard');
      } else { navigate('/dashboard'); }
    } catch (err) { setError(err.response?.data?.message || err.message || 'Registration failed'); }
    finally { setBusy(false); }
  };

  const inputField = (label, props) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>{label}</label>
      <input className="rhetoric-input" {...props} />
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--background)', position: 'relative', overflow: 'hidden', padding: '32px 24px'
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 30%, rgba(56,189,248,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&q=20')`, backgroundSize: 'cover', opacity: 0.05, pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', zIndex: 10, width: '100%', maxWidth: 480,
          background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '40px 36px',
          boxShadow: '0 0 50px -12px rgba(56,189,248,0.2)'
        }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 38, fontWeight: 800,
            letterSpacing: '-0.02em', color: 'var(--primary)', marginBottom: 8 }}>RHETORIC</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>Request Access — Create your account</p>
        </motion.div>

        <form onSubmit={handleRegister}>
          {/* Name */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon material-symbols-outlined">person</span>
              <input className="rhetoric-input" type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          </motion.div>

          {/* Email + Send OTP */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>
              Email {emailVerified && <span style={{ color: 'var(--primary)', marginLeft: 8 }}>✓ Verified</span>}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="input-wrapper" style={{ flex: 1 }}>
                <span className="input-icon material-symbols-outlined">mail</span>
                <input className="rhetoric-input" type="email" placeholder="scholar@institution.edu"
                  value={email} disabled={emailVerified}
                  onChange={e => { setEmail(e.target.value); setOtpSent(false); setEmailVerified(false); setVerifiedEmail(''); setEmailVerificationToken(''); setOtpCode(''); }}
                  required />
              </div>
              <motion.button type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={sendEmailOtp} disabled={busy || !email || emailVerified}
                style={{
                  background: emailVerified ? 'rgba(56,189,248,0.1)' : 'var(--primary)',
                  color: emailVerified ? 'var(--primary)' : 'var(--on-primary)',
                  border: emailVerified ? '1px solid rgba(56,189,248,0.3)' : 'none',
                  borderRadius: 8, padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: busy || emailVerified ? 'default' : 'pointer',
                  opacity: busy ? 0.6 : 1, whiteSpace: 'nowrap', flexShrink: 0
                }}>
                {emailVerified ? '✓ Verified' : 'Send Code'}
              </motion.button>
            </div>
          </motion.div>

          {/* OTP verify */}
          {otpSent && !emailVerified && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>Email Code</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="rhetoric-input" placeholder="Enter code" value={otpCode}
                  onChange={e => setOtpCode(e.target.value)} style={{ flex: 1 }} />
                <motion.button type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={verifyEmailOtp} disabled={busy || !otpCode}
                  style={{ background: 'var(--primary)', color: 'var(--on-primary)', border: 'none',
                    borderRadius: 8, padding: '0 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    opacity: busy || !otpCode ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                  Verify
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Password */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>Password</label>
            <div className="input-wrapper">
              <span className="input-icon material-symbols-outlined">lock</span>
              <input className="rhetoric-input" type={showPass ? 'text' : 'password'} placeholder="Create a strong password"
                value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline-variant)', display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showPass ? 'visibility' : 'visibility_off'}</span>
              </button>
            </div>
          </motion.div>

          {/* User ID */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>Student / Instructor ID</label>
            <div className="input-wrapper">
              <span className="input-icon material-symbols-outlined">badge</span>
              <input className="rhetoric-input" type="text" placeholder="e.g. 001"
                value={userID} onChange={e => setUserID(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric" maxLength={3} required />
            </div>
          </motion.div>

          {/* Alerts */}
          {info && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="alert-success" style={{ marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
              {info}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="alert-error" style={{ marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
              {error}
            </motion.div>
          )}

          <motion.button type="submit" disabled={busy || !emailVerified}
            whileHover={{ scale: busy || !emailVerified ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', background: 'var(--primary)', color: 'var(--on-primary)',
              border: 'none', borderRadius: 8, padding: 14, marginTop: 8,
              fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', cursor: busy || !emailVerified ? 'not-allowed' : 'pointer',
              opacity: busy || !emailVerified ? 0.5 : 1, boxShadow: '0 0 20px rgba(56,189,248,0.3)'
            }}>
            {busy ? 'Creating Account...' : 'Create Account'}
          </motion.button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button type="button" onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--on-surface-variant)', fontSize: 14,
              display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}>
            Already registered? Sign In
          </button>
        </div>
      </motion.div>
    </div>
  );
}
