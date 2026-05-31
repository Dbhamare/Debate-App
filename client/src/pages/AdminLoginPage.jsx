import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/admin/login', { email: email.toLowerCase(), password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check admin credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-transition" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--background)', position: 'relative', overflow: 'hidden', padding: 24
    }}>
      {/* Ambient - error tinted for admin */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 40%, rgba(147,0,10,0.12) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=20") center/cover',
        opacity: 0.06, zIndex: 0, filter: 'grayscale(80%) hue-rotate(180deg)'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: 420,
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,180,171,0.12)',
          borderRadius: 16, padding: '40px 36px',
          boxShadow: '0 0 50px -12px rgba(147,0,10,0.3)'
        }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }} style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(147,0,10,0.2)', border: '1px solid rgba(255,180,171,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: 28 }}>
              admin_panel_settings
            </span>
          </div>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif', fontSize: 32, fontWeight: 800,
            letterSpacing: '-0.02em', color: 'var(--on-surface)', marginBottom: 6
          }}>Admin Console</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>
            Restricted access — Authorized personnel only
          </p>
        </motion.div>

        <form onSubmit={handleLogin}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>
              Admin Email
            </label>
            <div className="input-wrapper">
              <span className="input-icon material-symbols-outlined">mail</span>
              <input className="rhetoric-input" type="email" placeholder="admin@system.io"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }} style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>
              Admin Password
            </label>
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
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {showPass ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </motion.div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="alert-error" style={{ marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
              {error}
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }} style={{ paddingTop: 16 }}>
            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', background: 'var(--error)', color: 'var(--on-error)',
                border: 'none', borderRadius: 8, padding: 14,
                fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                boxShadow: '0 0 20px rgba(147,0,10,0.4)'
              }}>
              {loading ? 'Authenticating...' : 'Access System'}
            </motion.button>
          </motion.div>
        </form>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ marginTop: 20, textAlign: 'center' }}>
          <button type="button" onClick={() => navigate('/login')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--on-surface-variant)', fontSize: 14,
              display: 'inline-flex', alignItems: 'center', gap: 6
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--on-surface)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            Back to Standard Login
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
