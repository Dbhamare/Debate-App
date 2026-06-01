import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { format } from 'date-fns';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

function DebateCard({ debate, index, onJoin }) {
  const isLive = debate.isLive || debate.status === 'active' || debate.status === 'live';
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
  const currentUser = user;

  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const generateRealNotifications = async (fetchedDebates) => {
    const token = localStorage.getItem('token');
    if (!token || !currentUser) return;

    let userMap = {};
    try {
      const usersRes = await api.get('/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      (usersRes.data || []).forEach(u => {
        userMap[u.userID] = u.name;
      });
    } catch (err) {
      console.error('Failed to fetch users list:', err);
    }

    const getName = (uid) => userMap[uid] || `Someone`;

    // Load message reactions store
    let messageReactions = {};
    try {
      const storedReactions = localStorage.getItem('message_reactions');
      if (storedReactions) messageReactions = JSON.parse(storedReactions);
    } catch {}

    setNotifications(prev => {
      const existingKeys = new Set(prev.map(n => n.key).filter(Boolean));
      const newNotifications = [...prev];
      let updated = false;

      fetchedDebates.forEach(debate => {
        const isLive = debate.isLive || debate.status === 'active' || debate.status === 'live';
        
        // 1. Live debate notification
        if (isLive) {
          const key = `live_${debate.joincode}`;
          if (!existingKeys.has(key)) {
            newNotifications.unshift({
              id: Date.now() + Math.random(),
              key,
              text: `Debate "${debate.title}" is now LIVE!`,
              time: format(new Date(), 'hh:mm a · MMM dd'),
              read: false,
              type: 'live',
              debateCode: debate.joincode
            });
            existingKeys.add(key);
            updated = true;
          }
        }

        // 2. Assigned debate notification
        const assignedKey = `assigned_${debate.joincode}`;
        if (!existingKeys.has(assignedKey)) {
          newNotifications.unshift({
            id: Date.now() + Math.random(),
            key: assignedKey,
            text: `New debate assigned: "${debate.title}"`,
            time: format(new Date(), 'hh:mm a · MMM dd'),
            read: false,
            type: 'assignment',
            debateCode: debate.joincode
          });
          existingKeys.add(assignedKey);
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem('notifications', JSON.stringify(newNotifications));
      }
      return newNotifications;
    });

    // Scan for new likes, dislikes, upvotes, downvotes in user's messages
    let newReactionAlerts = [];
    let reactionsUpdated = false;

    for (const debate of fetchedDebates) {
      try {
        const msgRes = await api.get(`/messages/${debate.joincode}`);
        const messages = Array.isArray(msgRes.data) ? msgRes.data : [];
        const myMessages = messages.filter(m => Number(m.senderID) === Number(currentUser.userID));

        myMessages.forEach(msg => {
          const stored = messageReactions[msg._id];
          const current = {
            likes: msg.likes || [],
            upvotes: msg.upvotes || [],
            dislikes: msg.dislikes || [],
            downvotes: msg.downvotes || []
          };

          if (stored) {
            // Compare and find new actions
            current.likes.forEach(uid => {
              if (Number(uid) !== Number(currentUser.userID) && !stored.likes.includes(uid)) {
                newReactionAlerts.push({
                  key: `like_${msg._id}_${uid}`,
                  text: `${getName(uid)} liked your argument in "${debate.title}"`,
                  type: 'like',
                  debateCode: debate.joincode
                });
              }
            });

            current.upvotes.forEach(uid => {
              if (Number(uid) !== Number(currentUser.userID) && !stored.upvotes.includes(uid)) {
                newReactionAlerts.push({
                  key: `upvote_${msg._id}_${uid}`,
                  text: `${getName(uid)} upvoted your argument in "${debate.title}"`,
                  type: 'upvote',
                  debateCode: debate.joincode
                });
              }
            });

            current.dislikes.forEach(uid => {
              if (Number(uid) !== Number(currentUser.userID) && !stored.dislikes.includes(uid)) {
                newReactionAlerts.push({
                  key: `dislike_${msg._id}_${uid}`,
                  text: `${getName(uid)} disliked your argument in "${debate.title}"`,
                  type: 'dislike',
                  debateCode: debate.joincode
                });
              }
            });

            current.downvotes.forEach(uid => {
              if (Number(uid) !== Number(currentUser.userID) && !stored.downvotes.includes(uid)) {
                newReactionAlerts.push({
                  key: `downvote_${msg._id}_${uid}`,
                  text: `${getName(uid)} downvoted your argument in "${debate.title}"`,
                  type: 'downvote',
                  debateCode: debate.joincode
                });
              }
            });
          }

          // Update reactions store
          messageReactions[msg._id] = current;
          reactionsUpdated = true;
        });
      } catch (err) {
        console.error(`Failed to fetch messages for debate ${debate.joincode}:`, err);
      }
    }

    if (reactionsUpdated) {
      localStorage.setItem('message_reactions', JSON.stringify(messageReactions));
    }

    if (newReactionAlerts.length > 0) {
      setNotifications(prev => {
        const existingKeys = new Set(prev.map(n => n.key).filter(Boolean));
        const filteredNew = newReactionAlerts
          .filter(n => !existingKeys.has(n.key))
          .map(n => ({
            id: Date.now() + Math.random(),
            key: n.key,
            text: n.text,
            time: format(new Date(), 'hh:mm a · MMM dd'),
            read: false,
            type: n.type,
            debateCode: n.debateCode
          }));

        if (filteredNew.length === 0) return prev;

        const next = [...filteredNew, ...prev];
        localStorage.setItem('notifications', JSON.stringify(next));
        return next;
      });
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('notifications', JSON.stringify(next));
      return next;
    });
  };

  const markAsRead = (id) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('notifications', JSON.stringify(next));
      return next;
    });
  };

  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    setShowNotifications(false);
    if (n.debateCode) {
      navigate(`/debate/${n.debateCode}`);
    }
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment': return 'assignment';
      case 'live': return 'sensors';
      case 'upvote': return 'arrow_upward';
      case 'downvote': return 'arrow_downward';
      case 'like': return 'favorite';
      case 'dislike': return 'heart_broken';
      case 'grade': return 'grade';
      default: return 'notifications';
    }
  };

  const getNotificationIconColor = (type) => {
    switch (type) {
      case 'assignment': return 'var(--primary)';
      case 'live': return '#ff97a3';
      case 'upvote': return 'var(--primary)';
      case 'downvote': return 'var(--outline)';
      case 'like': return '#ff97a3';
      case 'dislike': return 'var(--outline)';
      case 'grade': return '#fbbf24';
      default: return 'var(--outline)';
    }
  };

  useEffect(() => {
    const fetchDebates = async () => {
      setLoading(true);
      let fetched = [];
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/debates/assigned', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        fetched = Array.isArray(res.data) ? res.data : [];
      } catch {
        try {
          const res = await api.get('/debates/public');
          fetched = Array.isArray(res.data) ? res.data : [];
        } catch { fetched = []; }
      } finally {
        setDebates(fetched);
        generateRealNotifications(fetched);
        setLoading(false);
      }
    };
    fetchDebates();
  }, []);

  const handleJoin = (code) => {
    const c = String(code || joinCode || '').trim();
    if (!c) return;
    navigate(`/debate/${c}`);
    setJoinCode('');
  };

  const debatesList = Array.isArray(debates) ? debates : [];
  const filtered = debatesList.filter(d =>
    !search || d.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-transition" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--background)' }}>
      <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
      <Sidebar user={user} />

      <div className="rhetoric-main" style={{ position: 'relative', zIndex: 1, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16, flexShrink: 0 }}>
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
            {/* Notifications Dropdown */}
            <div style={{ position: 'relative' }}>
              <motion.button 
                whileHover={{ scale: 1.1 }} 
                style={{ 
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: unreadCount > 0 ? 'var(--primary)' : 'rgba(255,255,255,0.4)', 
                  display: 'flex', position: 'relative', padding: 4 
                }}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#ff97a3',
                    boxShadow: '0 0 8px #ff97a3'
                  }} />
                )}
              </motion.button>
              
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                      onClick={() => setShowNotifications(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      style={{
                        position: 'absolute', right: 0, top: 40,
                        width: 320, background: 'rgba(11, 19, 38, 0.98)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                        zIndex: 100, overflow: 'hidden'
                      }}
                    >
                      <div style={{ 
                        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'Space Grotesk, sans-serif' }}>
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            style={{ 
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 11, color: 'var(--primary)', fontWeight: 600 
                            }}
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      
                      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--outline)', fontSize: 13 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 28, display: 'block', marginBottom: 6, opacity: 0.3 }}>notifications_off</span>
                            All clear! No alerts.
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div 
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                background: n.read ? 'transparent' : 'rgba(56,189,248,0.03)',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                display: 'flex', gap: 10, alignItems: 'flex-start'
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ 
                                fontSize: 16, marginTop: 2,
                                color: n.read ? 'var(--outline)' : getNotificationIconColor(n.type) 
                              }}>
                                {getNotificationIcon(n.type)}
                              </span>
                              
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ 
                                  fontSize: 12, lineHeight: 1.4, margin: 0,
                                  color: n.read ? 'var(--on-surface-variant)' : 'var(--on-surface)',
                                  fontWeight: n.read ? 400 : 500,
                                  textAlign: 'left'
                                }}>
                                  {n.text}
                                </p>
                                <span style={{ fontSize: 10, color: 'var(--outline)', display: 'block', marginTop: 4, textAlign: 'left' }}>
                                  {n.time}
                                </span>
                              </div>
                              
                              {!n.read && (
                                <span style={{
                                  width: 6, height: 6, borderRadius: '50%',
                                  background: 'var(--primary)', alignSelf: 'center', flexShrink: 0
                                }} />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      
                      {notifications.length > 0 && (
                        <div style={{ 
                          padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.06)',
                          textAlign: 'center'
                        }}>
                          <button 
                            onClick={clearAll}
                            style={{ 
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 11, color: 'var(--error)', fontWeight: 600 
                            }}
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '40px 32px', maxWidth: '100%', width: '100%', overflowY: 'auto', minHeight: 0 }}>
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
