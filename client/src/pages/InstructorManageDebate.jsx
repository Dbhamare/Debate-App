import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from "recharts";

const CHART_COLORS = ["#38bdf8", "#ff97a3", "#a7b2c9", "#891933", "#004c69", "#bcc7de"];

export default function InstructorManageDebate() {
  const { joincode } = useParams();
  const navigate = useNavigate();
  const [debate, setDebate] = useState(null);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [voteCounts, setVoteCounts] = useState({ proponent: 0, opponent: 0, my: null });
  const [votesLoading, setVotesLoading] = useState(true);
  const [selection, setSelection] = useState({});
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchDebate();
    fetchStudents();
    fetchAnalytics();
    fetchVotes();
  }, [joincode]);

  const fetchDebate = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/debates/join/${joincode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDebate(res.data);
      const sel = {};
      (res.data.sides || []).forEach(s => {
        (s.participants || []).forEach(uid => { sel[uid] = s.name; });
      });
      setSelection(sel);
    } catch (err) {
      console.error("Error fetching debate:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/users", { headers: { Authorization: `Bearer ${token}` } });
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/debates/join/${joincode}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchVotes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/debates/join/${joincode}/votes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = res.data || {};
      setVoteCounts({
        proponent: Number(data.proponent || 0),
        opponent: Number(data.opponent || 0),
        my: data.my ?? null,
      });
    } catch (err) {
      console.error("Error fetching votes:", err);
    } finally {
      setVotesLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(`/debates/join/${joincode}/status`, { status }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setToast({ open: true, severity: "success", message: `Arena status updated to ${status}` });
      fetchDebate();
      fetchAnalytics();
      fetchVotes();
    } catch (err) {
      setToast({ open: true, severity: "error", message: "Failed to update status." });
    }
  };

  const toggleUserSide = (userID, side) => {
    setSelection(prev => {
      const current = prev[userID] || "";
      const next = current === side ? "" : side;
      return { ...prev, [userID]: next };
    });
  };

  const handleBulkAssign = async () => {
    const assignments = Object.entries(selection)
      .filter(([, side]) => side)
      .map(([userID, side]) => ({ userID: Number(userID), side }));

    if (assignments.length === 0) {
      setToast({ open: true, severity: "warning", message: "Select at least one debater and a side." });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.patch(`/debates/join/${joincode}/assign-bulk`, { assignments }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setToast({ open: true, severity: "success", message: "Assignments tactical update complete." });
      fetchDebate();
    } catch (err) {
      setToast({ open: true, severity: "error", message: "Failed to deploy assignments." });
    }
  };

  const handleRemoveFromDebate = async (userID) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/debates/join/${joincode}/assign/${userID}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      fetchDebate();
    } catch (err) {
      setToast({ open: true, severity: "error", message: "Failed to revoke assignment." });
    }
  };

  const nameFor = (id) => students.find(s => s.userID === id)?.name || `ID: ${id}`;

  const downloadFile = (filename, content, mimeType = "application/json") => {
    const blob = new Blob([content], { type: mimeType });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  const handleExportAnalytics = () => {
    if (!analytics || !debate) {
      setToast({ open: true, severity: "warning", message: "No tactical data to export." });
      return;
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      debate: { title: debate.title, joincode: debate.joincode, status: debate.status },
      votes: voteCounts,
      analytics,
    };
    downloadFile(`arena_${debate.joincode}_analytics.json`, JSON.stringify(payload, null, 2));
    setToast({ open: true, severity: "success", message: "Tactical report exported." });
  };

  const handleExportTranscript = async () => {
    if (!debate) return;
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get(`/messages/${debate.joincode}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      downloadFile(`arena_${debate.joincode}_transcript.json`, JSON.stringify({
        exportedAt: new Date().toISOString(),
        debate: { title: debate.title, joincode: debate.joincode, status: debate.status },
        messages: Array.isArray(data) ? data : [],
      }, null, 2));
      setToast({ open: true, severity: "success", message: "Transcript log exported." });
    } catch (err) {
      setToast({ open: true, severity: "error", message: "Failed to export logs." });
    }
  };

  const badgeFor = (participant) => {
    if (!participant) return "Participant";
    if (participant.Messages >= 25) return "Arena Master";
    if (participant.UpvotesReceived >= 12) return "Tactical Lead";
    if (participant.LikesReceived >= 12) return "Elite Orator";
    if (participant.Messages >= 10) return "Active Combatant";
    return "Standard Role";
  };

  if (loading) return <div className="rhetoric-loader"><div className="spinner" /></div>;

  if (!debate) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
        <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
        <Sidebar user={currentUser} />
        <div className="rhetoric-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h2 className="text-headline-lg">Arena Not Found</h2>
        </div>
      </div>
    );
  }

  // Process data for charts
  let messagesSeries = [];
  let reactionsSeries = [];
  let participantsSeries = [];
  let timelineSeries = [];
  let highlights = analytics?.topMessages || null;

  if (analytics) {
    const perSide = analytics.perSide || {};
    const sides = ["proponent", "opponent", "neutral"];
    messagesSeries = sides.map(s => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      count: perSide[s]?.messages || 0
    }));
    reactionsSeries = sides.map(s => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      Likes: perSide[s]?.likes || 0,
      Upvotes: perSide[s]?.upvotes || 0,
      Downvotes: perSide[s]?.downvotes || 0
    }));
    participantsSeries = (analytics.perUser || []).slice(0, 8).map(u => ({
      name: u.name,
      Messages: u.messages,
      Likes: u.likesReceived,
      Upvotes: u.upvotesReceived
    }));
    timelineSeries = (analytics.timeline || []).map(t => ({
      time: new Date(t.minute).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      Messages: t.messages
    }));
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card" style={{ padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
          <p className="text-label-bold" style={{ marginBottom: 4, color: 'var(--primary)' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-transition" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
      <Sidebar user={currentUser} />

      <main className="rhetoric-main">
        <header className="rhetoric-topbar">
          <div>
            <h1 className="text-headline-md" style={{ color: 'var(--on-surface)' }}>Arena Command Center</h1>
            <p className="text-caption" style={{ color: 'var(--on-surface-variant)' }}>Debate System Control & Analytics</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
             <button className="btn-ghost" onClick={handleExportAnalytics}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>analytics</span>
                Export Report
             </button>
             <button className="btn-ghost" onClick={handleExportTranscript}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>description</span>
                Transcript
             </button>
          </div>
        </header>

        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Status & Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel" 
            style={{ padding: 32, borderRadius: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                   <h2 className="text-headline-lg">{debate.title}</h2>
                   <div className={`badge-${debate.status === 'active' ? 'live' : 'neutral'}`}>
                      {debate.status === 'active' && <div className="pulse-dot" />}
                      {debate.status.toUpperCase()}
                   </div>
                </div>
                <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', maxWidth: 800 }}>{debate.description}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                 <button className={`btn-ghost ${debate.status === 'upcoming' ? 'active' : ''}`} onClick={() => handleStatusChange('upcoming')}>Upcoming</button>
                 <button className={`btn-primary`} style={{ background: debate.status === 'active' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: debate.status === 'active' ? '#0b1326' : 'var(--on-surface)' }} onClick={() => handleStatusChange('active')}>Live Arena</button>
                 <button className={`btn-danger`} onClick={() => handleStatusChange('closed')}>Terminate</button>
              </div>
            </div>
          </motion.div>

          {/* User Assignments */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel" 
              style={{ padding: 32, borderRadius: 24, overflow: 'hidden' }}
            >
              <h3 className="text-headline-md" style={{ marginBottom: 24 }}>Personnel Deployment</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="rhetoric-table">
                  <thead>
                    <tr>
                      <th>Debater</th>
                      <th style={{ textAlign: 'center' }}>Pro</th>
                      <th style={{ textAlign: 'center' }}>Opp</th>
                      <th style={{ textAlign: 'center' }}>Neu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.userID}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>ID: {s.userID} • {s.role}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={selection[s.userID] === 'proponent'} onChange={() => toggleUserSide(s.userID, 'proponent')} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={selection[s.userID] === 'opponent'} onChange={() => toggleUserSide(s.userID, 'opponent')} style={{ width: 18, height: 18, accentColor: '#ff97a3' }} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={selection[s.userID] === 'neutral'} onChange={() => toggleUserSide(s.userID, 'neutral')} style={{ width: 18, height: 18, accentColor: '#a7b2c9' }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn-primary" style={{ marginTop: 24, width: '100%', justifyContent: 'center' }} onClick={handleBulkAssign}>
                Deploy Tactical Assignments
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card" 
              style={{ padding: 24, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <h3 className="text-label-bold" style={{ textTransform: 'uppercase', color: 'var(--primary)' }}>Active Roster</h3>
              
              {["proponent", "opponent", "neutral"].map(side => {
                const participants = debate.sides?.find(s => s.name === side)?.participants || [];
                const color = side === 'proponent' ? 'var(--primary)' : side === 'opponent' ? '#ff97a3' : '#a7b2c9';
                
                return (
                  <div key={side}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                       <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                       <span className="text-label-bold" style={{ textTransform: 'capitalize' }}>{side}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {participants.length === 0 ? (
                        <span style={{ fontSize: 12, opacity: 0.3 }}>Unassigned</span>
                      ) : (
                        participants.map(pid => (
                          <div key={pid} style={{ 
                            padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', 
                            border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6
                          }}>
                            {nameFor(pid)}
                            <span className="material-symbols-outlined" style={{ fontSize: 14, cursor: 'pointer', opacity: 0.5 }} onClick={() => handleRemoveFromDebate(pid)}>close</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Analytics Dashboard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
             <h3 className="text-headline-md">Engagement Analytics</h3>
             
             {analyticsLoading ? (
               <div className="rhetoric-loader" style={{ minHeight: 200 }}><div className="spinner" /></div>
             ) : (
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>
                  <motion.div className="glass-panel" style={{ padding: 24, borderRadius: 24, height: 350 }}>
                    <h4 className="text-label-bold" style={{ marginBottom: 16 }}>Participation Distribution</h4>
                    <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={messagesSeries}>
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                           {messagesSeries.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                           ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>

                  <motion.div className="glass-panel" style={{ padding: 24, borderRadius: 24, height: 350 }}>
                    <h4 className="text-label-bold" style={{ marginBottom: 16 }}>Activity Timeline</h4>
                    <ResponsiveContainer width="100%" height="85%">
                      <LineChart data={timelineSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="Messages" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>

                  <motion.div className="glass-panel" style={{ padding: 24, borderRadius: 24, height: 350 }}>
                    <h4 className="text-label-bold" style={{ marginBottom: 16 }}>Top Performers</h4>
                    <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={participantsSeries} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" fontSize={11} width={80} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="Messages" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Upvotes" fill="#bcc7de" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>

                  <motion.div className="glass-panel" style={{ padding: 24, borderRadius: 24, height: 350 }}>
                    <h4 className="text-label-bold" style={{ marginBottom: 16 }}>Sentiment & Highlights</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                       {highlights ? (
                         <>
                           <div style={{ padding: 12, background: 'rgba(56,189,248,0.05)', borderRadius: 12, border: '1px solid rgba(56,189,248,0.1)' }}>
                              <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 800, marginBottom: 4 }}>MOST UPVOTED</div>
                              <p style={{ fontSize: 13, lineHeight: 1.4 }}>"{highlights.mostUpvoted?.content?.slice(0, 100)}..."</p>
                              <div style={{ fontSize: 11, marginTop: 4, opacity: 0.5 }}>— {highlights.mostUpvoted?.senderName}</div>
                           </div>
                           <div style={{ padding: 12, background: 'rgba(255,151,163,0.05)', borderRadius: 12, border: '1px solid rgba(255,151,163,0.1)' }}>
                              <div style={{ fontSize: 10, color: '#ff97a3', fontWeight: 800, marginBottom: 4 }}>CONTROVERSIAL INSIGHT</div>
                              <p style={{ fontSize: 13, lineHeight: 1.4 }}>"{highlights.mostDisliked?.content?.slice(0, 100)}..."</p>
                              <div style={{ fontSize: 11, marginTop: 4, opacity: 0.5 }}>— {highlights.mostDisliked?.senderName}</div>
                           </div>
                         </>
                       ) : <p style={{ opacity: 0.4 }}>Generating highlights...</p>}
                    </div>
                  </motion.div>
               </div>
             )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {toast.open && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
              padding: '12px 24px', borderRadius: 12,
              background: toast.severity === 'success' ? 'rgba(56,189,248,0.95)' : 'rgba(255,151,163,0.95)',
              color: '#0b1326', fontWeight: 600, zIndex: 100, display: 'flex', alignItems: 'center', gap: 10,
              backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}
          >
            <span className="material-symbols-outlined">
              {toast.severity === 'success' ? 'check_circle' : 'error'}
            </span>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

