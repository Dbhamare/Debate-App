import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
const features = [
  { icon: 'record_voice_over', title: 'Live Debate Arenas', desc: 'Real-time Pro vs. Con structured debates with live audience and voting.' },
  { icon: 'how_to_vote', title: 'Audience Voting', desc: 'Anonymous or registered voting to determine the winner in real-time.' },
  { icon: 'analytics', title: 'Analytics Dashboard', desc: 'In-depth argument analytics and engagement metrics per session.' },
  { icon: 'class', title: 'Classroom Integration', desc: 'Instructor tools for managing sessions, assigning sides, and reviewing debates.' },
  { icon: 'qr_code', title: 'QR Join Codes', desc: 'Instant student access via QR codes and join codes.' },
  { icon: 'shield', title: 'Secure Auth', desc: 'OTP-verified email and role-based access control for all users.' },
];
export default function FeaturesPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', position: 'relative', overflow: 'hidden' }}>
      <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
      <nav style={{ padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 900, color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/')}>RHETORIC</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </nav>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 40px', position: 'relative', zIndex: 2 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 64 }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 56, fontWeight: 900, color: 'var(--on-surface)', marginBottom: 16, letterSpacing: '-0.02em' }}>Platform Features</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 20, lineHeight: 1.6 }}>Everything you need to run high-stakes intellectual discourse.</p>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {features.map((f, i) => (
            <motion.div key={f.title} className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <div className="glow-blob" />
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 36, marginBottom: 16, display: 'block', position: 'relative', zIndex: 1 }}>{f.icon}</span>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8, position: 'relative', zIndex: 1 }}>{f.title}</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 15, lineHeight: 1.5, position: 'relative', zIndex: 1 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}