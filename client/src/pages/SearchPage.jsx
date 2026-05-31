import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function SearchPage() {
  const q = useQuery();
  const term = (q.get('q') || '').trim();
  const scope = q.get('scope') || 'debates';
  const joincode = q.get('joincode') || null;
  const nav = useNavigate();
  const [debates, setDebates] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();

  useEffect(() => {
    let cancel = false;
    const run = async () => {
      setLoading(true);
      try {
        if (scope === 'chat' && joincode) {
          const { data } = await api.get('/messages/search', { params: { q: term, joincode } });
          if (!cancel) setMessages(Array.isArray(data) ? data : []);
        } else {
          const { data } = await api.get('/debates/search', { params: { q: term } });
          if (!cancel) setDebates(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancel) { if (scope === 'chat') setMessages([]); else setDebates([]); }
      } finally { if (!cancel) setLoading(false); }
    };
    if (term) run();
    return () => { cancel = true; };
  }, [term, scope, joincode]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
      <Sidebar user={user} />
      <div className="rhetoric-main" style={{ position: 'relative', zIndex: 1 }}>
        <header className="rhetoric-topbar">
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: 'var(--on-surface)' }}>Search Results</span>
        </header>
        <main style={{ flex: 1, padding: '40px 32px' }}>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontFamily: 'Space Grotesk', fontSize: 36, fontWeight: 800, color: 'var(--on-surface)', marginBottom: 8 }}>
            Search Results
          </motion.h1>
          {term && <p style={{ color: 'var(--on-surface-variant)', fontSize: 16, marginBottom: 32 }}>Results for "<strong>{term}</strong>"</p>}
          {loading ? (
            <div className="rhetoric-loader"><div className="spinner" /></div>
          ) : scope === 'chat' && joincode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.length === 0 ? <p style={{ color: 'var(--on-surface-variant)' }}>No messages matched.</p> :
                messages.map(m => (
                  <motion.div key={m._id} className="debate-card" style={{ padding: 20, cursor: 'pointer' }}
                    whileHover={{ y: -2 }} onClick={() => nav(`/debate/${joincode}`)}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <strong style={{ color: 'var(--on-surface)' }}>{m.senderName || 'Anonymous'}</strong>
                      <span className="badge-neutral" style={{ fontSize: 11 }}>{m.side}</span>
                    </div>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>{m.content}</p>
                  </motion.div>
                ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {debates.length === 0 ? <p style={{ color: 'var(--on-surface-variant)' }}>No debates matched.</p> :
                debates.map((d, i) => (
                  <motion.div key={d.joincode} className="debate-card" style={{ padding: 20, cursor: 'pointer' }}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2 }} onClick={() => nav(d.isPublic ? `/public/debate/${d.joincode}` : `/debate/${d.joincode}`)}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, color: 'var(--on-surface)' }}>{d.title}</h3>
                      <span className={d.isPublic ? 'badge-primary' : 'badge-neutral'} style={{ fontSize: 11 }}>
                        {d.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>{d.description}</p>
                  </motion.div>
                ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
