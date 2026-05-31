import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

function EyeIcon({ visible }) {
  return visible ? (
    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>visibility</span>
  ) : (
    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>visibility_off</span>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userID, setUserID] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanUserID = userID.replace(/\D/g, '');
    try {
      const res = await api.post('/auth/login', { email: cleanEmail, password, userID: Number(cleanUserID) });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.user.role === 'instructor' || (Number(res.data.user.userID) >= 501 && Number(res.data.user.userID) <= 600)) {
        navigate('/instructor/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', background: 'var(--background)', padding: '24px'
    }}>
      {/* Ambient background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 40%, rgba(56,189,248,0.12) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=20") center/cover',
        opacity: 0.06, zIndex: 0, filter: 'grayscale(80%)'
      }} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: 440,
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '40px 36px',
          boxShadow: '0 0 50px -12px rgba(56,189,248,0.2)'
        }}
      >
        {/* Header */}
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible"
          style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 className="branding-logo" style={{ fontSize: 42, marginBottom: 8 }} onClick={() => navigate('/')}>RHETORIC</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>Initialize Secure Session</p>
        </motion.div>

        <form onSubmit={handleLogin}>
          {/* Email */}
          <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible" style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>
              Email Identifier
            </label>
            <div className="input-wrapper">
              <span className="input-icon material-symbols-outlined">mail</span>
              <input className="rhetoric-input" type="email" placeholder="scholar@institution.edu"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </motion.div>

          {/* User ID */}
          <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible" style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>
              Student / Instructor ID
            </label>
            <div className="input-wrapper">
              <span className="input-icon material-symbols-outlined">badge</span>
              <input className="rhetoric-input" type="text" placeholder="e.g. 001"
                value={userID}
                onChange={e => setUserID(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric" maxLength={3} required />
            </div>
          </motion.div>

          {/* Password */}
          <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>
                Security Key
              </label>
              <button type="button" onClick={() => navigate('/forgot-password')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)',
                  fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Forgot Key?
              </button>
            </div>
            <div className="input-wrapper">
              <span className="input-icon material-symbols-outlined">lock</span>
              <input className="rhetoric-input" type={showPass ? 'text' : 'password'}
                placeholder="••••••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required
                style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--outline-variant)', display: 'flex', alignItems: 'center'
                }}>
                <EyeIcon visible={showPass} />
              </button>
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="alert-error" style={{ marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible" style={{ paddingTop: 16 }}>
            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', background: 'var(--primary)', color: 'var(--on-primary)',
                border: 'none', borderRadius: 8, padding: '14px',
                fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                boxShadow: '0 0 20px rgba(56,189,248,0.3)',
                transition: 'all 0.3s ease'
              }}>
              {loading ? 'Authenticating...' : 'Engage'}
            </motion.button>
          </motion.div>
        </form>

        {/* Divider */}
        <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible"
          style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0' }}>
          <div style={{ flex: 1, borderTop: '1px solid rgba(62,72,79,0.4)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>
            Or
          </span>
          <div style={{ flex: 1, borderTop: '1px solid rgba(62,72,79,0.4)' }} />
        </motion.div>

        {/* Register + Admin links */}
        <motion.div variants={fadeUp} custom={6} initial="hidden" animate="visible"
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/register')}
            style={{
              width: '100%', background: 'transparent', color: 'var(--on-surface)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px',
              fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
            Request Access
          </motion.button>

          <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/admin/login')}
            style={{
              width: '100%', background: 'transparent', color: 'var(--error)',
              border: '1px solid rgba(255,180,171,0.2)', borderRadius: 8, padding: '12px',
              fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,180,171,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            Admin Console
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
