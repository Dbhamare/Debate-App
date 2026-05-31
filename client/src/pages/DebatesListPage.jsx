import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';

export default function DebatesListPage() {
  const [debates, setDebates] = useState([]);
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();

  useEffect(() => {
    api.get('/debates').then(res => setDebates(res.data)).catch(() => setDebates([]));
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
      <Sidebar user={user} />
      <div className="rhetoric-main" style={{ position: 'relative', zIndex: 1 }}>
        <header className="rhetoric-topbar">
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: 'var(--on-surface)' }}>All Debates</span>
        </header>
        <main style={{ flex: 1, padding: '40px 32px' }}>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontFamily: 'Space Grotesk', fontSize: 36, fontWeight: 800, color: 'var(--on-surface)', marginBottom: 32 }}>
            Browse Debates
          </motion.h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {debates.map((d, i) => (
              <motion.div key={d.joincode} className="debate-card" style={{ padding: 24, cursor: 'pointer' }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }} whileHover={{ y: -3 }}
                onClick={() => navigate(`/debate/${d.joincode}`)}>
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 8 }}>{d.title}</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, marginBottom: 16 }}>{d.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--outline)', fontSize: 12 }}>Code: {d.joincode}</span>
                  <span className={d.isPublic ? 'badge-primary' : 'badge-neutral'} style={{ fontSize: 11 }}>
                    {d.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </main>
      </div>
    </div>
  );
}