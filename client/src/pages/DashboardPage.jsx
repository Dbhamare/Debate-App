import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

function DebateCard({ debate, index, onJoin }) {
  const isLive = debate.isLive || debate.status === 'live';
  const isPublic = debate.isPublic;
  return (
    <motion.div
      variants={fadeUp} custom={index}
      className="debate-card"
      style={{ padding: 24 }}
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isLive ? (
            <span className="badge-live">
              <span className="pulse-dot" />
              Live
            </span>
          ) : (
            <span className="badge-primary">{isPublic ? 'Public' : 'Private'}</span>
          )}
        </div>
        {!isPublic && (
          <span className="material-symbols-outlined" style={{ color: 'var(--outline-variant)', fontSize: 20 }}>lock</span>
        )}
      </div>

      <h3 style={{
        fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 600,
        color: 'var(--on-surface)', lineHeight: 1.3, marginBottom: 10,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
      }}>{debate.title}</h3>

      {debate.description && (
        <p style={{
          color: 'var(--on-surface-variant)', fontSize: 14, lineHeight: 1.5,
          marginBottom: 20, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>{debate.description}</p>
      )}

      <div style={{
        marginTop: 'auto', paddingTop: 16,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--outline)', fontSize: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>pin</span>
          Code: <strong style={{ color: 'var(--on-surface-variant)' }}>{debate.joincode}</strong>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="btn-primary"
          style={{ padding: '8px 20px', fontSize: 13 }}
          onClick={() => onJoin(debate.joincode)}>
          Join
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>login</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [debates, setDebates] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();

  useEffect(() => {
    const fetchDebates = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/debates/assigned', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setDebates(res.data || []);
      } catch {
        try {
          const res = await api.get('/debates/public');
          setDebates(res.data || []);
        } catch { setDebates([]); }
      } finally { setLoading(false); }
    };
    fetchDebates();
  }, []);

  const handleJoin = (code) => {
    const c = String(code || joinCode || '').trim();
    if (!c) return;
    navigate(`/debate/${c}`);
    setJoinCode('');
  };

  const filtered = debates.filter(d =>
    !search || d.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-transition" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
      <Sidebar user={user} />

      <div className="rhetoric-main" style={{ position: 'relative', zIndex: 1 }}>
        {/* Topbar */}
        <header className="rhetoric-topbar">
          <div style={{ flex: 1, maxWidth: 480 }}>
            <div className="input-wrapper">
              <span className="input-icon material-symbols-outlined">search</span>
              <input
                className="rhetoric-input"
                style={{ borderRadius: 999, fontSize: 15, padding: '10px 16px 10px 40px' }}
                placeholder="Search debates, topics..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16 }}>
            {/* Join by code */}
            <form onSubmit={e => { e.preventDefault(); handleJoin(); }}
              style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="rhetoric-input"
                style={{ width: 140, padding: '8px 14px 8px 14px', fontSize: 14 }}
                placeholder="Join code..."
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
              />
              <motion.button type="submit" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="btn-primary" style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
                Join
              </motion.button>
            </form>
            <motion.button whileHover={{ scale: 1.1 }} style={{ background: 'none', border: 'none',
              cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
              <span className="material-symbols-outlined">notifications</span>
            </motion.button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '40px 32px', maxWidth: 1400, width: '100%' }}>
          <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible" style={{ marginBottom: 40 }}>
            <h1 style={{
              fontFamily: 'Space Grotesk, sans-serif', fontSize: 36, fontWeight: 700,
              color: 'var(--on-surface)', marginBottom: 8, letterSpacing: '-0.01em'
            }}>Available Debates</h1>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 16 }}>
              Join active rooms or spectate high-stakes discussions.
            </p>
          </motion.div>

          {loading ? (
            <div className="rhetoric-loader"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                padding: 48, textAlign: 'center', borderRadius: 16,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
              <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--outline)', display: 'block', marginBottom: 16 }}>forum</span>
              <h3 style={{ color: 'var(--on-surface)', fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, marginBottom: 8 }}>
                No debates available
              </h3>
              <p style={{ color: 'var(--on-surface-variant)' }}>
                {search ? 'No debates match your search.' : 'Check back later or use a join code above.'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
              initial="hidden" animate="visible"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {filtered.map((debate, i) => (
                <DebateCard key={debate.joincode} debate={debate} index={i} onJoin={handleJoin} />
              ))}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
