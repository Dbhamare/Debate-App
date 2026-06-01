import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }
  })
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const liveDebates = [
  {
    id: 1, viewers: '12.4k', category: 'Tech Ethics',
    title: 'The Morality of Autonomous Weapon Systems in Modern Warfare',
    pro: 'Dr. E. Vance', con: 'Col. R. Sterling', proPercent: 58,
    status: 'active', joincode: 100001, isPublic: true
  },
  {
    id: 2, viewers: '8.9k', category: 'Economics',
    title: 'Universal Basic Income: Economic Savior or Inflation Catalyst?',
    pro: 'Prof. A. Chen', con: 'J. M. Keynes Inst', proPercent: 45,
    status: 'closed', joincode: 100003, isPublic: true
  },
  {
    id: 3, viewers: '15.2k', category: 'Philosophy',
    title: 'Determinism vs. Free Will in the Age of Neuroscience',
    pro: 'S. Harris', con: 'D. Dennett', proPercent: 50,
    status: 'upcoming', joincode: 100002, isPublic: true
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'live' | 'archive'

  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();

  useEffect(() => {
    api.get('/debates/public')
      .then(res => {
        setDebates(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch public debates:", err);
        setDebates([]);
        setLoading(false);
      });
  }, []);

  const handleNavClick = (item) => {
    if (item === 'Explore') {
      setActiveTab('explore');
      document.getElementById('active-arenas')?.scrollIntoView({ behavior: 'smooth' });
    } else if (item === 'Live') {
      setActiveTab('live');
      document.getElementById('active-arenas')?.scrollIntoView({ behavior: 'smooth' });
    } else if (item === 'Archive') {
      setActiveTab('archive');
      document.getElementById('active-arenas')?.scrollIntoView({ behavior: 'smooth' });
    } else if (item === 'Leaderboard') {
      setLeaderboardOpen(true);
    }
  };

  return (
    <>
      <div className="page-transition" style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background)'
      }}>
        {/* Ambient */}
      <div className="ambient-bg">
        <div className="blob-1" />
        <div className="blob-2" />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-nav"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 40px', height: 80
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
          <span className="branding-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>RHETORIC</span>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {['Explore', 'Live', 'Leaderboard', 'Archive'].map(item => (
              <button key={item}
                onClick={() => handleNavClick(item)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)', transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {user ? (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="btn-primary" onClick={() => {
                if (user.role === 'admin') navigate('/admin/dashboard');
                else if (user.role === 'instructor') navigate('/instructor/dashboard');
                else navigate('/dashboard');
              }}>
              Go to Dashboard
            </motion.button>
          ) : (
            <>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="btn-ghost" onClick={() => navigate('/login')}>Sign In</motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="btn-primary" onClick={() => navigate('/register')}>
                Start Debate
              </motion.button>
            </>
          )}
        </div>
      </motion.nav>

      {/* Hero */}
      <section style={{
        position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', paddingTop: 80, overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(11,19,38,0.8), var(--background))',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&q=30')`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.15, zIndex: 0
        }} />

        <div style={{
          position: 'relative', zIndex: 2, textAlign: 'center',
          maxWidth: 900, margin: '0 auto', padding: '80px 32px 64px'
        }}>
          <motion.h1
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(44px, 8vw, 88px)',
              fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em',
              color: 'var(--on-surface)', marginBottom: 24
            }}>
            RHETORIC: Where Logic Meets{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Impact</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              color: 'var(--on-surface-variant)', fontSize: 20, lineHeight: 1.6,
              maxWidth: 640, margin: '0 auto 48px'
            }}>
            The premier platform for high-stakes intellectual discourse. Engage in rigorous debate,
            challenge prevailing narratives, and elevate your rhetorical mastery.
          </motion.p>

          {/* CTA Panel */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
              gap: 16, padding: 48, borderRadius: 24,
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 40px rgba(56,189,248,0.15)',
              maxWidth: 480, width: '100%', position: 'relative', overflow: 'hidden'
            }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(56,189,248,0.06), transparent)',
              pointerEvents: 'none'
            }} />
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700,
              color: 'var(--on-surface)', letterSpacing: '-0.01em'
            }}>Enter the Discourse</h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 15, textAlign: 'center' }}>
              Join thousands of academics, professionals, and students in the ultimate arena of ideas.
            </p>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(56,189,248,0.5)' }}
              whileTap={{ scale: 0.96 }}
              className="btn-primary"
              style={{ fontSize: 16, padding: '14px 48px', borderRadius: 999 }}
              onClick={() => navigate(user ? '/dashboard' : '/register')}>
              Join the Arena
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Discourse Arenas Section */}
      <section id="active-arenas" style={{ padding: '80px 40px', maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 48 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: activeTab === 'live' ? 'var(--error)' : 'var(--primary)',
                  display: 'inline-block',
                  animation: activeTab === 'live' ? 'pulse-glow 2s infinite' : 'none'
                }} />
                <span style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--on-surface)'
                }}>
                  {activeTab === 'live' ? 'Live Arenas' : activeTab === 'archive' ? 'Archived Discourse' : 'Discourse Explorer'}
                </span>
              </div>
              <h2 style={{
                fontFamily: 'Space Grotesk, sans-serif', fontSize: 40, fontWeight: 700,
                color: 'var(--on-surface)', letterSpacing: '-0.02em'
              }}>
                {activeTab === 'live' ? 'Active Arenas' : activeTab === 'archive' ? 'Archived Arenas' : 'Explore Arenas'}
              </h2>
            </div>
            
            {/* Tab Controls */}
            <div style={{
              display: 'flex', gap: 8, background: 'rgba(255, 255, 255, 0.03)',
              padding: 4, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              {[
                { id: 'explore', label: 'Explore' },
                { id: 'live', label: 'Live' },
                { id: 'archive', label: 'Archive' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                    color: activeTab === tab.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    if (activeTab !== tab.id) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                  }}
                  onMouseLeave={e => {
                    if (activeTab !== tab.id) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          key={activeTab}
          variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px 0' }} className="rhetoric-loader">
              <div className="spinner" />
            </div>
          ) : (() => {
            const filteredDebates = debates.filter(debate => {
              if (activeTab === 'live') return debate.status === 'active';
              if (activeTab === 'archive') return debate.status === 'closed';
              return true;
            });

            const displayDebates = filteredDebates.length > 0 ? filteredDebates : (
              liveDebates.filter(debate => {
                if (activeTab === 'live') return debate.status === 'active';
                if (activeTab === 'archive') return debate.status === 'closed';
                return true;
              })
            );

            if (displayDebates.length === 0) {
              return (
                <div style={{ gridColumn: '1 / -1', padding: '80px 0', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  No debates match this category.
                </div>
              );
            }

            return displayDebates.map((debate, i) => {
              const proVotes = debate.votes?.[0]?.proponent ?? 0;
              const oppVotes = debate.votes?.[0]?.opponent ?? 0;
              const totalVotes = proVotes + oppVotes;
              const proPercent = debate.proPercent !== undefined ? debate.proPercent : (
                totalVotes > 0 ? Math.round((proVotes / totalVotes) * 100) : 50
              );

              const handleCardClick = () => {
                if (debate.isPublic) {
                  navigate(`/public/debate/${debate.joincode}`);
                } else {
                  navigate(user ? `/debate/${debate.joincode}` : '/login');
                }
              };

              return (
                <motion.div key={debate._id || debate.id || debate.joincode} variants={fadeUp} custom={i}
                  className="debate-card"
                  style={{ padding: 24, cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
                  onClick={handleCardClick}
                  whileHover={{ y: -4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {debate.status === 'active' && (
                        <span className="badge-live">
                          <span className="pulse-dot" />
                          LIVE
                        </span>
                      )}
                      {debate.status === 'upcoming' && (
                        <span className="badge-primary" style={{ fontSize: 11 }}>UPCOMING</span>
                      )}
                      {debate.status === 'closed' && (
                        <span className="badge-neutral" style={{ fontSize: 11 }}>ARCHIVED</span>
                      )}
                      {debate.viewers && (
                        <span className="badge-neutral" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>visibility</span>
                          {debate.viewers}
                        </span>
                      )}
                    </div>
                    <span className="badge-neutral" style={{ fontSize: 11 }}>{debate.topic || debate.category}</span>
                  </div>
                  <h3 style={{
                    fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 600,
                    color: 'var(--on-surface)', lineHeight: 1.3, marginBottom: 12
                  }}>{debate.title}</h3>

                  {debate.description && (
                    <p style={{
                      color: 'var(--on-surface-variant)', fontSize: 14, lineHeight: 1.5,
                      marginBottom: 24, display: '-webkit-box', WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden', flexGrow: 1
                    }}>
                      {debate.description}
                    </p>
                  )}

                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>
                        {debate.pro || 'Proponent'} ({proPercent}%)
                      </span>
                      <span style={{ color: 'var(--error)', fontSize: 13, fontWeight: 600 }}>
                        {debate.con || 'Opponent'} ({100 - proPercent}%)
                      </span>
                    </div>
                    <div className="debate-progress">
                      <div className="pro-bar" style={{ width: `${proPercent}%` }} />
                      <div className="con-bar" style={{ width: `${100 - proPercent}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: 'var(--outline)' }}>
                      <span>Code: {debate.joincode}</span>
                      {totalVotes > 0 && <span>Total Votes: {totalVotes}</span>}
                    </div>
                  </div>
                </motion.div>
              );
            });
          })()}
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(2,6,23,0.9)', padding: '48px 40px', position: 'relative', zIndex: 2
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 16
        }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 800,
            color: 'var(--primary)' }}>RHETORIC</div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'About Us', path: '/about' },
              { label: 'Features', path: '/features' },
              { label: 'Contact Us', path: '/contact' },
              { label: 'Terms & Privacy', path: '#' }
            ].map(link => (
              <a key={link.label} onClick={() => link.path !== '#' ? navigate(link.path) : null} style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13,
                textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif',
                transition: 'color 0.2s', cursor: link.path !== '#' ? 'pointer' : 'default' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                {link.label}
              </a>
            ))}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontFamily: 'Space Grotesk, sans-serif' }}>
            © 2024 RHETORIC. Engineered for high-stakes discourse.
          </div>
        </div>
      </footer>
    </div>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {leaderboardOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.85)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              zIndex: 100, display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: 24
            }}
            onClick={e => e.target === e.currentTarget && setLeaderboardOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="glass-panel"
              style={{
                padding: '24px 32px', borderRadius: 28, maxWidth: 600, width: '100%',
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                position: 'relative', background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <button
                onClick={() => setLeaderboardOpen(false)}
                style={{
                  position: 'absolute', top: 20, right: 24, background: 'none',
                  border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
              </button>

              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--primary)', marginBottom: 8 }}>leaderboard</span>
                <h2 className="text-headline-lg" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 24 }}>RHETORIC LEADERBOARD</h2>
                <p className="text-caption" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>Season 4 • Top Strategic Debaters</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
                {[
                  { rank: 1, name: 'Dr. Elizabeth Vance', points: 1480, wins: 42, losses: 8, badge: '🏆 MASTER' },
                  { rank: 2, name: 'Prof. Alan Chen', points: 1250, wins: 35, losses: 10, badge: '🥇 ELITE' },
                  { rank: 3, name: 'Col. Robert Sterling', points: 1190, wins: 31, losses: 12, badge: '🥈 ADVANCED' },
                  { rank: 4, name: 'Darshan Bhamare', points: 1020, wins: 28, losses: 15, badge: '🥉 ACTIVE' },
                  { rank: 5, name: 'Rhugved Patwardhan', points: 940, wins: 24, losses: 18, badge: 'ACTIVE' },
                ].map(r => (
                  <div
                    key={r.rank}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px',
                      borderRadius: 12, background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: r.rank === 1 ? 'rgba(250, 204, 21, 0.15)' : r.rank === 2 ? 'rgba(156, 163, 175, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${r.rank === 1 ? '#facc15' : r.rank === 2 ? '#9ca3af' : 'rgba(255, 255, 255, 0.1)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, color: r.rank === 1 ? '#facc15' : r.rank === 2 ? '#d1d5db' : '#9ca3af',
                        fontSize: 13
                      }}
                    >
                      {r.rank}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: 14 }}>{r.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.05em', marginTop: 2 }}>{r.badge}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: 14 }}>{r.points} pts</div>
                      <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>W: {r.wins} • L: {r.losses}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 20, borderRadius: 12, padding: '10px 24px' }}
                onClick={() => setLeaderboardOpen(false)}
              >
                Return to Arena
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
