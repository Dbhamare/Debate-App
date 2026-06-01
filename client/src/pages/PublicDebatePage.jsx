import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import socket from "../services/socket";
import Sidebar from "../components/Sidebar";

export default function PublicDebatePage() {
  const { joincode } = useParams();
  const [debate, setDebate] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem('user'));

  const listEndRefs = {
    proponent: useRef(null),
    neutral: useRef(null),
    opponent: useRef(null)
  };

  const scrollToBottom = (side) => {
    const ref = listEndRefs[side];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const fetchDebate = async () => {
      try {
        const res = await api.get(`/debates/public/${joincode}`);
        setDebate(res.data);
      } catch {
        setDebate(null);
      }

      try {
        const msgRes = await api.get(`/messages/${joincode}`);
        setMessages(msgRes.data);
        setTimeout(() => {
          ["proponent", "neutral", "opponent"].forEach(scrollToBottom);
        }, 300);
      } catch {
        setMessages([]);
      }

      setLoading(false);
    };

    fetchDebate();
    socket.emit('joinDebate', { joincode: Number(joincode) }, () => {});

    socket.on(`newMessage:${joincode}`, (message) => {
      setMessages(prev => {
        const updated = prev.some((m) => m._id === message._id) ? prev : [...prev, message];
        setTimeout(() => scrollToBottom(message.side || "neutral"), 100);
        return updated;
      });
    });

    const interval = setInterval(fetchDebate, 10000);

    return () => {
      clearInterval(interval);
      socket.off(`newMessage:${joincode}`);
    };
  }, [joincode]);

  if (loading) {
    return (
      <div className="rhetoric-loader">
        <div className="spinner" />
      </div>
    );
  }

  if (!debate) {
    return (
      <div className="page-transition" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
        <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
        <Sidebar user={currentUser} />
        <div className="rhetoric-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ padding: 48, textAlign: 'center', borderRadius: 24 }}>
             <h2 className="text-headline-lg" style={{ color: 'var(--error)', marginBottom: 16 }}>Debate Not Found</h2>
             <button className="btn-primary" onClick={() => navigate('/')}>Return Home</button>
          </div>
        </div>
      </div>
    );
  }

  const sides = ["proponent", "neutral", "opponent"];
  const sideLabels = { proponent: "Proponent", neutral: "Neutral", opponent: "Opponent" };
  const sideColors = {
    proponent: { bg: "rgba(136,169,146,0.05)", border: "rgba(136,169,146,0.2)", text: "#d7e9dc", accent: "#38bdf8" },
    neutral: { bg: "rgba(142,166,191,0.03)", border: "rgba(142,166,191,0.15)", text: "#dce8f5", accent: "#bcc7de" },
    opponent: { bg: "rgba(181,141,149,0.03)", border: "rgba(181,141,149,0.2)", text: "#f0dde1", accent: "#ff453a" }
  };

  return (
    <div className="page-transition" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--background)' }}>
      <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
      <Sidebar user={currentUser} />

      <main className="rhetoric-main" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <header className="rhetoric-topbar">
          <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
            <h1 className="text-headline-md" style={{ color: 'var(--on-surface)', margin: 0, lineHeight: 1.2, minWidth: 0, wordBreak: 'break-word' }}>{debate.title}</h1>
            {debate.description && (
              <p className="text-caption" style={{ color: 'var(--on-surface-variant)', marginTop: 6, wordBreak: 'break-word' }}>{debate.description}</p>
            )}
          </div>
          <div className="badge-live" style={{ flexShrink: 0 }}>
            <div className="pulse-dot" />
            LIVE SPECTATOR VIEW
          </div>
        </header>

        <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 24, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: 16, 
            flex: 1,
            minHeight: 0
          }}>
            {sides.map(sideKey => {
              const filteredMessages = messages.filter(msg => msg.side === sideKey);
              const sc = sideColors[sideKey];
              
              return (
                <motion.div 
                  key={sideKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="glass-card"
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    borderRadius: 20,
                    overflow: 'hidden',
                    background: sc.bg,
                    borderColor: sc.border,
                    height: '100%'
                  }}
                >
                  <div style={{ 
                    padding: '16px 20px', 
                    borderBottom: `1px solid ${sc.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc.accent }} />
                    <h3 className="text-label-bold" style={{ color: sc.text, textTransform: 'uppercase' }}>
                      {sideLabels[sideKey]} Views
                    </h3>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: sc.text, opacity: 0.5 }}>
                      {filteredMessages.length} msgs
                    </span>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <AnimatePresence initial={false}>
                      {filteredMessages.length === 0 ? (
                        <div style={{ padding: 32, textAlign: 'center', opacity: 0.4, color: sc.text }}>
                          No insights shared yet.
                        </div>
                      ) : (
                        filteredMessages.map((msg, idx) => (
                          <div 
                            key={msg._id || idx}
                            className="arena-message"
                            style={{ 
                              borderColor: sc.border,
                              color: sc.text
                            }}
                          >
                            <div className="message-meta">
                              <span className="message-sender" style={{ color: sc.accent }}>
                                {msg.senderName || msg.sender?.name || "Anonymous"}
                              </span>
                            </div>
                            <p className="message-content" style={{ color: sc.text }}>
                              {msg.content}
                            </p>
                            <div style={{ fontSize: 10, color: sc.text, opacity: 0.3 }}>
                              {format(new Date(msg.createdAt), "hh:mm a · MMM dd, yyyy")}
                            </div>
                          </div>
                        ))
                      )}
                    </AnimatePresence>
                    <div ref={listEndRefs[sideKey]} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel"
            style={{ padding: 32, borderRadius: 20, textAlign: 'center' }}
          >
            <h4 className="text-headline-md" style={{ marginBottom: 12 }}>Want to Share Your Opinion?</h4>
            <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginBottom: 24 }}>
              Join the conversation and challenge perspectives in real-time.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => navigate("/login")}>
                <span className="material-symbols-outlined">login</span>
                Engage Now
              </button>
              <button className="btn-outline" onClick={() => navigate("/register")}>
                Create Secure Account
              </button>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
