import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";

export default function InstructorCreateDebate() {
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    description: "",
    rules: "",
    isPublic: false,
    startTime: "",
    endTime: "",
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) {
      setToast({ open: true, severity: "warning", message: "End time must be later than start time." });
      setLoading(false);
      return;
    }

    const debateData = {
      ...formData,
      startTime: formData.startTime ? formData.startTime : null,
      endTime: formData.endTime ? formData.endTime : null,
      sides: [
        { name: "proponent", participants: [] },
        { name: "opponent", participants: [] },
        { name: "neutral", participants: [] }
      ]
    };

    try {
      const token = localStorage.getItem("token");
      await api.post("/instructor/debates", debateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setToast({ open: true, severity: "success", message: "Debate created successfully." });
      setTimeout(() => navigate("/instructor/dashboard"), 1500);
    } catch (err) {
      console.error("Error creating debate:", err);
      setToast({ open: true, severity: "error", message: "Failed to create debate. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--background)' }}>
      <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
      <Sidebar user={currentUser} />

      <main className="rhetoric-main" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <header className="rhetoric-topbar">
          <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
            <h1 className="text-headline-md" style={{ color: 'var(--on-surface)', margin: 0, lineHeight: 1.2 }}>Create New Arena</h1>
          </div>
          <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            <button className="btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Initializing...' : 'Deploy Arena'}
            </button>
          </div>
        </header>

        <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto', width: '100%', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel"
            style={{ padding: 40, borderRadius: 24 }}
          >
            <h2 className="text-headline-lg" style={{ marginBottom: 8 }}>Debate Configuration</h2>
            <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginBottom: 32 }}>
              Define the parameters, rules, and scope for the upcoming debate session.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="input-group">
                <label style={{ display: 'block', color: 'var(--on-surface)', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Debate Title</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">title</span>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="rhetoric-input"
                    placeholder="e.g. Ethical Implications of Quantum Computing"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label style={{ display: 'block', color: 'var(--on-surface)', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Primary Topic</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">subject</span>
                  <input
                    type="text"
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    className="rhetoric-input"
                    placeholder="e.g. Emerging Technologies"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label style={{ display: 'block', color: 'var(--on-surface)', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="rhetoric-input"
                  style={{ paddingLeft: 16, minHeight: 100, resize: 'vertical' }}
                  placeholder="Provide context and background for the participants..."
                  required
                />
              </div>

              <div className="input-group">
                <label style={{ display: 'block', color: 'var(--on-surface)', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Engagement Rules</label>
                <textarea
                  name="rules"
                  value={formData.rules}
                  onChange={handleChange}
                  className="rhetoric-input"
                  style={{ paddingLeft: 16, minHeight: 100, resize: 'vertical' }}
                  placeholder="Define etiquette, speaking times, and moderation guidelines..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <label style={{ display: 'block', color: 'var(--on-surface)', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Start Time</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="rhetoric-input"
                    style={{ paddingLeft: 16 }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <label style={{ display: 'block', color: 'var(--on-surface)', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>End Time</label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="rhetoric-input"
                    style={{ paddingLeft: 16 }}
                  />
                </div>
              </div>

              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                padding: '16px 20px', 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: 12,
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  style={{ 
                    width: 20, height: 20, accentColor: 'var(--primary)'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--on-surface)', fontSize: 15, fontWeight: 600 }}>Make Arena Public</div>
                  <div style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>Allow guests and external users to spectate.</div>
                </div>
              </label>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', height: 52, fontSize: 16 }}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Deploy Arena'}
              </button>
            </form>
          </motion.div>
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

