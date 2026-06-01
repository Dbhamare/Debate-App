import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';

function Modal({ title, children, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
      }} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{
          background: 'var(--surface-container)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: 32, maxWidth: 560, width: '100%', maxHeight: '80vh', overflowY: 'auto'
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, color: 'var(--on-surface)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--outline)', fontSize: 24 }}>×</button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
      style={{
        position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
        minWidth: 280, background: type === 'error' ? 'rgba(93,0,10,0.95)' : 'rgba(0,52,74,0.95)',
        backdropFilter: 'blur(12px)', border: `1px solid ${type === 'error' ? 'rgba(255,180,171,0.3)' : 'rgba(56,189,248,0.3)'}`,
        color: type === 'error' ? 'var(--error)' : 'var(--primary)', borderRadius: 10,
        padding: '12px 20px', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
      }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{type === 'error' ? 'error' : 'check_circle'}</span>
      {message}
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileModal, setProfileModal] = useState(null);
  const [debateModal, setDebateModal] = useState(null);
  const [idDialog, setIdDialog] = useState({ open: false, userId: '', input: '' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', action: null });
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => { fetchData(); }, []);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ur, dr] = await Promise.all([api.get('/admin/users'), api.get('/admin/debates')]);
      setUsers(ur.data); setDebates(dr.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const viewProfile = async (_id) => {
    try { const { data } = await api.get(`/admin/users/${_id}/profile`); setProfileModal(data); }
    catch { showToast('Failed to load profile', 'error'); }
  };

  const setUserID = async (_id, userID) => {
    try {
      await api.patch(`/admin/users/${_id}/userid`, { userID });
      showToast('User ID updated.'); fetchData();
      setIdDialog({ open: false, userId: '', input: '' });
    } catch (e) { showToast(e?.response?.data?.message || 'Failed to update ID', 'error'); }
  };

  const resetID = async (userId) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/reset-id`);
      showToast(`ID reset. New ID: ${res.data.userID}`); fetchData();
    } catch (e) { showToast(e.response?.data?.message || 'Failed to reset ID', 'error'); }
  };

  const deleteUserMessages = async (_id) => {
    try { const { data } = await api.delete(`/admin/users/${_id}/messages`); showToast(`Deleted ${data.deletedCount || 0} messages.`); }
    catch { showToast('Failed to delete messages', 'error'); }
  };

  const deleteUser = async (_id) => {
    try { await api.delete(`/admin/users/${_id}`); showToast('User deleted'); fetchData(); }
    catch { showToast('Failed to delete user', 'error'); }
  };

  const viewDebateDetails = async (joincode) => {
    try { const { data } = await api.get(`/admin/debates/${joincode}/details`); setDebateModal(data); }
    catch { showToast('Failed to load debate details', 'error'); }
  };

  const deleteDebate = async (joincode) => {
    try { await api.delete(`/admin/debates/${joincode}`); showToast('Debate deleted'); fetchData(); }
    catch { showToast('Failed to delete debate', 'error'); }
  };

  const filteredUsers = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--background)' }}>
      <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
      <Sidebar user={user} />
      <div className="rhetoric-main" style={{ position: 'relative', zIndex: 1, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <header className="rhetoric-topbar">
          <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
            <span style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: 'var(--on-surface)', display: 'block', lineHeight: 1.2 }}>Command Center</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
              borderRadius: 8, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 18 }}>circle</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>System: Optimal</span>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '40px 32px', overflowY: 'auto', minHeight: 0 }}>
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
            <div style={{ position: 'absolute', top: 0, left: '25%', width: 600, height: 400,
              background: 'rgba(56,189,248,0.04)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 44, fontWeight: 800, color: 'var(--on-surface)',
              letterSpacing: '-0.02em', marginBottom: 8 }}>Command Center</h1>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 17 }}>
              High-level platform oversight — monitor live debates, manage users, and review analytics in real-time.
            </p>
          </motion.div>

          {/* Metrics */}
          <motion.div id="analytics" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40, scrollMarginTop: 100 }}>
            {[
              { label: 'Active Users', value: users.length, icon: 'monitoring', color: 'primary', trend: '+12% this week' },
              { label: 'Live Debates', value: debates.filter(d => d.status === 'active' || d.status === 'live').length, icon: null, color: 'error', trend: 'Peak engagement' },
              { label: 'Total Debates', value: debates.length, icon: 'forum', color: 'primary', trend: 'All time' },
              { label: 'Server Load', value: '42%', icon: 'memory', color: 'primary', trend: null, progress: 42 },
            ].map((m, i) => (
              <motion.div key={m.label} className="stat-card"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.06 }}>
                <div className="glow-blob" style={{ background: `rgba(${m.color === 'error' ? '147,0,10' : '56,189,248'},0.1)` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative', zIndex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>{m.label}</span>
                  {m.icon ? (
                    <span className="material-symbols-outlined" style={{ color: `var(--${m.color})`, fontSize: 20 }}>{m.icon}</span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--error)',
                        boxShadow: '0 0 8px rgba(255,180,171,0.8)', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: 44, fontWeight: 800, color: 'var(--on-surface)',
                  lineHeight: 1, position: 'relative', zIndex: 1, marginBottom: 8 }}>{m.value}</div>
                {m.progress !== undefined ? (
                  <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'var(--surface-container-high)', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: `${m.progress}%`, height: '100%', background: 'var(--primary)', borderRadius: 999 }} />
                  </div>
                ) : (
                  <div style={{ color: `var(--${m.color})`, fontSize: 12, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 4, position: 'relative', zIndex: 1 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span>
                    {m.trend}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Users Table */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            <motion.div id="users" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16, overflow: 'hidden', scrollMarginTop: 100
              }}>
              <div style={{
                padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16
              }}>
                <div>
                  <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 2 }}>User Registry</h3>
                  <p style={{ color: 'var(--outline)', fontSize: 12 }}>Manage accounts, roles, and moderation actions.</p>
                </div>
                <div className="input-wrapper" style={{ width: 220 }}>
                  <span className="input-icon material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
                  <input className="rhetoric-input" style={{ fontSize: 13, padding: '8px 12px 8px 36px', borderRadius: 8 }}
                    placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              {loading ? (
                <div className="rhetoric-loader"><div className="spinner" /></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="rhetoric-table">
                    <thead>
                      <tr>
                        <th>User</th><th>Role</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--primary)', fontWeight: 700, fontSize: 13, flexShrink: 0
                              }}>{u.name?.[0]?.toUpperCase() || 'U'}</div>
                              <div>
                                <div style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                                <div style={{ color: 'var(--outline)', fontSize: 12 }}>ID: {u.userID || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ padding: '3px 10px', borderRadius: 6,
                              background: 'var(--surface-container-high)',
                              border: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>{u.role}</span>
                          </td>
                          <td>
                            <span className="badge-primary" style={{ fontSize: 11 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)',
                                boxShadow: '0 0 6px rgba(56,189,248,0.8)', display: 'inline-block' }} />
                              Active
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              {[
                                { icon: 'visibility', action: () => viewProfile(u._id), title: 'View Profile' },
                                { icon: 'key', action: () => setIdDialog({ open: true, userId: u._id, input: '' }), title: 'Set ID' },
                                { icon: 'refresh', action: () => resetID(u._id), title: 'Reset ID' },
                                { icon: 'delete_sweep', action: () => setConfirmDialog({ open: true, title: 'Delete Messages', message: 'Delete all messages from this user?', action: () => deleteUserMessages(u._id) }), title: 'Delete Messages' },
                                { icon: 'delete_forever', action: () => setConfirmDialog({ open: true, title: 'Delete User', message: 'Permanently delete this user?', action: () => deleteUser(u._id) }), title: 'Delete User', danger: true },
                              ].map(btn => (
                                <button key={btn.icon} title={btn.title} onClick={btn.action}
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6,
                                    color: btn.danger ? 'var(--error)' : 'var(--outline)',
                                    transition: 'all 0.2s', display: 'flex'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{btn.icon}</span>
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--outline)' }}>Showing {filteredUsers.length} of {users.length} users</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Debates Feed */}
            <motion.div id="debates" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', scrollMarginTop: 100
              }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: 'var(--on-surface)' }}>Debate Sessions</h3>
                <span style={{ fontSize: 13, color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>View All</span>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1 }}>
                {debates.map(d => (
                  <div key={d._id} style={{
                    padding: 16, borderRadius: 10, background: 'var(--surface-container)',
                    border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                      background: d.status === 'active' || d.status === 'live' ? 'var(--primary)' : 'var(--outline-variant)'
                    }} />
                    <div style={{ paddingLeft: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        {d.status === 'active' || d.status === 'live' ? (
                          <span className="badge-live" style={{ fontSize: 10 }}>
                            <span className="pulse-dot" />
                            Live Now
                          </span>
                        ) : d.status === 'upcoming' ? (
                          <span className="badge-primary" style={{ fontSize: 10 }}>Upcoming</span>
                        ) : (
                          <span className="badge-neutral" style={{ fontSize: 10 }}>Closed</span>
                        )}
                        <span style={{ color: 'var(--outline)', fontSize: 11 }}>ID: {d.joincode}</span>
                      </div>
                      <h4 style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, color: 'var(--on-surface)',
                        marginBottom: 12, lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {d.title}
                      </h4>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => viewDebateDetails(d.joincode)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--outline)', fontSize: 12, fontWeight: 600, padding: '4px 8px',
                            borderRadius: 4, transition: 'color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--outline)'}>
                          Details
                        </button>
                        <button onClick={() => window.open(`/debate/${d.joincode}`, '_blank')}
                          style={{ background: 'var(--primary)', border: 'none', cursor: 'pointer',
                            color: 'var(--on-primary)', fontSize: 12, fontWeight: 600,
                            padding: '4px 10px', borderRadius: 4 }}>
                          View Chat
                        </button>
                        <button onClick={() => setConfirmDialog({ open: true, title: 'Delete Debate',
                          message: 'Delete this debate and all related data?', action: () => deleteDebate(d.joincode) })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--error)', fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 4 }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {profileModal && (
          <Modal title="User Profile" onClose={() => setProfileModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ color: 'var(--on-surface)', fontSize: 18, fontWeight: 700 }}>{profileModal.user?.name}</div>
              <div style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>{profileModal.user?.email}</div>
              <div style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>
                Role: <strong style={{ color: 'var(--primary)' }}>{profileModal.user?.role}</strong> &nbsp;|&nbsp;
                ID: <strong style={{ color: 'var(--on-surface)' }}>{profileModal.user?.userID || '—'}</strong>
              </div>
              {profileModal.user?.bio && <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, lineHeight: 1.5 }}>{profileModal.user.bio}</p>}
              <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface-variant)', fontSize: 13 }}>
                Messages sent: <strong>{profileModal.stats?.messageCount || 0}</strong>
              </div>
            </div>
          </Modal>
        )}
        {debateModal && (
          <Modal title="Debate Details" onClose={() => setDebateModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h4 style={{ color: 'var(--on-surface)', fontSize: 18, fontWeight: 700 }}>{debateModal.title}</h4>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>Status: {debateModal.status} | Code: {debateModal.joincode}</p>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>Instructor: {debateModal.instructor?.name} ({debateModal.instructor?.email})</p>
              <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Votes</p>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>Proponent: {debateModal.votes?.proponent || 0} | Opponent: {debateModal.votes?.opponent || 0}</p>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>Winner: <strong>{debateModal.winner || '—'}</strong></p>
              </div>
              <button className="btn-outline" onClick={() => window.open(`/debate/${debateModal.joincode}`, '_blank')}>Open Chat</button>
            </div>
          </Modal>
        )}
        {idDialog.open && (
          <Modal title="Set User ID" onClose={() => setIdDialog({ open: false, userId: '', input: '' })}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-wrapper">
                <span className="input-icon material-symbols-outlined">badge</span>
                <input className="rhetoric-input" placeholder="e.g. 007" value={idDialog.input}
                  onChange={e => setIdDialog(p => ({ ...p, input: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                  inputMode="numeric" maxLength={3} autoFocus />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn-ghost" onClick={() => setIdDialog({ open: false, userId: '', input: '' })}>Cancel</button>
                <button className="btn-primary" onClick={() => setUserID(idDialog.userId, idDialog.input)}
                  disabled={!idDialog.input || idDialog.input.length < 3}>Save</button>
              </div>
            </div>
          </Modal>
        )}
        {confirmDialog.open && (
          <Modal title={confirmDialog.title} onClose={() => setConfirmDialog({ open: false, title: '', message: '', action: null })}>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setConfirmDialog({ open: false, title: '', message: '', action: null })}>Cancel</button>
              <button style={{ background: 'var(--error)', color: 'var(--on-error)', border: 'none', borderRadius: 8,
                padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                onClick={async () => { if (confirmDialog.action) await confirmDialog.action(); setConfirmDialog({ open: false, title: '', message: '', action: null }); }}>
                Confirm
              </button>
            </div>
          </Modal>
        )}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
