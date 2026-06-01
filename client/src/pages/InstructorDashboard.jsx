import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import api from '../services/api';
import Sidebar from '../components/Sidebar';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

function Toast({ message, type, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      style={{
        position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, minWidth: 280,
        background: type === 'error' ? 'rgba(147,0,10,0.9)' : 'rgba(0,52,74,0.9)',
        backdropFilter: 'blur(12px)', border: `1px solid ${type === 'error' ? 'rgba(255,180,171,0.3)' : 'rgba(56,189,248,0.3)'}`,
        color: type === 'error' ? 'var(--error)' : 'var(--primary)',
        borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 8
      }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
        {type === 'error' ? 'error' : 'check_circle'}
      </span>
      {message}
    </motion.div>
  );
}

function DeleteModal({ onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
      }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{
          background: 'var(--surface-container)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: 32, maxWidth: 400, width: '100%'
        }}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700,
          color: 'var(--on-surface)', marginBottom: 12 }}>Delete Debate</h3>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
          This will permanently delete the debate and all related data. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="btn-ghost" onClick={onCancel}>Cancel</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="btn-danger" style={{ background: 'var(--error)', color: 'var(--on-error)',
              border: 'none', padding: '10px 24px' }}
            onClick={onConfirm}>Delete</motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function InstructorDashboard() {
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, joincode: '' });
  const navigate = useNavigate();
  const location = useLocation();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { fetchDebates(); }, []);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.hash, loading]);

  const fetchDebates = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/debates', { headers: { Authorization: `Bearer ${token}` } });
      const ud = JSON.parse(localStorage.getItem('user') || '{}');
      setDebates(res.data.filter(d => d.instructor === Number(ud?.userID)));
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleDelete = async (joincode) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/debates/join/${joincode}`, { headers: { Authorization: `Bearer ${token}` } });
      setDebates(prev => prev.filter(d => d.joincode !== joincode));
      showToast('Debate deleted successfully.');
    } catch {
      showToast('Failed to delete debate.', 'error');
    } finally { setDeleteDialog({ open: false, joincode: '' }); }
  };

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard.');
    } catch { showToast('Failed to copy link.', 'error'); }
  };

  const liveCount = debates.filter(d => d.status === 'active' || d.status === 'live').length;
  const totalParticipants = debates.reduce((acc, d) => acc + (d.participantCount || 0), 0);

  return (
    <div className="page-transition" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--background)' }}>
      <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
      <Sidebar user={user} />

      <div className="rhetoric-main" style={{ position: 'relative', zIndex: 1, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header className="rhetoric-topbar">
          <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700,
              color: 'var(--on-surface)', letterSpacing: '-0.01em', display: 'block', lineHeight: 1.2 }}>Instructor Dashboard</span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="btn-primary" onClick={() => navigate('/instructor/create-debate')}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              Create Session
            </motion.button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '40px 32px', position: 'relative', overflowY: 'auto', minHeight: 0 }}>
          {/* Hero section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'relative', borderRadius: 16, overflow: 'hidden',
              marginBottom: 40, background: 'var(--surface-container)',
              border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 40px rgba(0,0,0,0.3)'
            }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to right, var(--surface-container), rgba(23,31,51,0.5), transparent)',
              zIndex: 1
            }} />
            <div style={{ position: 'relative', zIndex: 2, padding: '40px 48px' }}>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 40, fontWeight: 800,
                color: 'var(--on-surface)', letterSpacing: '-0.02em', marginBottom: 8 }}>
                Instructor Dashboard
              </h1>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 17, lineHeight: 1.5 }}>
                Manage active discourse, review analytics, and orchestrate high-stakes debates with precision.
              </p>
            </div>
          </motion.section>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
            {[
              { label: 'Active Debates', value: liveCount, icon: 'record_voice_over', trend: 'Live now' },
              { label: 'Total Sessions', value: debates.length, icon: 'forum', trend: 'All time' },
              { label: 'Total Participants', value: totalParticipants || '—', icon: 'groups', trend: 'Enrolled' },
            ].map((stat, i) => (
              <motion.div key={stat.label} className="stat-card"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}>
                <div className="glow-blob" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative', zIndex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>{stat.label}</span>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 22 }}>{stat.icon}</span>
                </div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 48, fontWeight: 800,
                  color: 'var(--on-surface)', lineHeight: 1, position: 'relative', zIndex: 1, marginBottom: 8 }}>
                  {stat.value}
                </div>
                <div style={{ color: 'var(--primary)', fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4, position: 'relative', zIndex: 1 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_upward</span>
                  {stat.trend}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Session Management */}
          <div id="manage" style={{ scrollMarginTop: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 700,
                color: 'var(--on-surface)', letterSpacing: '-0.01em' }}>Session Management</h2>
            </div>

            {loading ? (
              <div className="rhetoric-loader"><div className="spinner" /></div>
            ) : debates.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{
                  padding: 48, textAlign: 'center', borderRadius: 16,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)'
                }}>
                <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)', display: 'block', marginBottom: 16 }}>forum</span>
                <h3 style={{ color: 'var(--on-surface)', fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, marginBottom: 8 }}>
                  No debates created yet
                </h3>
                <p style={{ color: 'var(--on-surface-variant)', marginBottom: 24 }}>
                  Create your first debate session to get started.
                </p>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="btn-primary" onClick={() => navigate('/instructor/create-debate')}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                  Create Debate
                </motion.button>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {debates.map((debate, i) => {
                  const debateUrl = `${window.location.origin}/debate/${debate.joincode}`;
                  const isLive = debate.status === 'active' || debate.status === 'live';
                  return (
                    <motion.div key={debate.joincode} className="session-item"
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                      <div className="left-accent" style={{ background: isLive ? 'var(--primary)' : 'var(--outline-variant)' }} />
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, paddingLeft: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 600,
                              color: 'var(--on-surface)', letterSpacing: '-0.01em' }}>{debate.title}</h3>
                            {isLive ? (
                              <span className="badge-live" style={{ fontSize: 11 }}>
                                <span className="pulse-dot" style={{ width: 6, height: 6 }} />Live
                              </span>
                            ) : (
                              <span className="badge-neutral" style={{ fontSize: 11 }}>
                                {debate.status || 'Inactive'}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4,
                              color: 'var(--on-surface-variant)', fontSize: 13 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>pin</span>
                              Code: <strong style={{ color: 'var(--on-surface)' }}>{debate.joincode}</strong>
                            </span>
                            {debate.participantCount !== undefined && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4,
                                color: 'var(--on-surface-variant)', fontSize: 13 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>group</span>
                                {debate.participantCount} Joined
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            className="btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}
                            onClick={() => navigate(`/debate/${debate.joincode}`)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chat</span>
                            Chat
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}
                            onClick={() => navigate(`/instructor/debate/${debate.joincode}/manage`)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings</span>
                            Manage
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            className="btn-danger" style={{ padding: '8px 14px' }}
                            onClick={() => setDeleteDialog({ open: true, joincode: debate.joincode })}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* QR + Link row */}
                      <div style={{
                        marginTop: 16, paddingTop: 16, paddingLeft: 16, width: '100%',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap'
                      }}>
                        <div style={{ background: '#fff', padding: 8, borderRadius: 8 }}>
                          <QRCode value={debateUrl} size={72} />
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
                            textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>
                            Share Link
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input readOnly value={debateUrl}
                              style={{
                                flex: 1, background: 'var(--surface-container-lowest)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                                padding: '8px 12px', fontSize: 13, color: 'var(--on-surface-variant)',
                                outline: 'none', minWidth: 0
                              }} />
                            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                              className="btn-ghost" style={{ padding: '8px 12px', flexShrink: 0 }}
                              onClick={() => copyLink(debateUrl)}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {deleteDialog.open && (
          <DeleteModal
            onConfirm={() => handleDelete(deleteDialog.joincode)}
            onCancel={() => setDeleteDialog({ open: false, joincode: '' })}
          />
        )}
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
