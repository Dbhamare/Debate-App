import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
export default function AboutPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', position: 'relative', overflow: 'hidden' }}>
      <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
      <nav style={{ padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 900, color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/')}>RHETORIC</span>
        <button className="btn-outline" onClick={() => navigate('/login')}>Sign In</button>
      </nav>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '80px 40px', position: 'relative', zIndex: 2 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 56, fontWeight: 900, color: 'var(--on-surface)', marginBottom: 24, letterSpacing: '-0.02em' }}>About Rhetoric</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 20, lineHeight: 1.7, maxWidth: 700, marginBottom: 48 }}>
            Rhetoric is the premier platform for high-stakes intellectual discourse — built for academics, professionals, and students who believe that ideas matter and arguments have power.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {[
              { icon: 'forum', title: 'Real Debate', desc: 'Structured Pro vs. Con debates with voting and analytics.' },
              { icon: 'school', title: 'Academic Grade', desc: 'Designed for educational institutions and classroom use.' },
              { icon: 'bolt', title: 'Live & Instant', desc: 'Real-time messaging with live participant tracking.' },
              { icon: 'security', title: 'Secure', desc: 'Role-based access and OTP-verified email authentication.' },
            ].map((f, i) => (
              <motion.div key={f.title} className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                <div className="glow-blob" />
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 32, marginBottom: 12, display: 'block', position: 'relative', zIndex: 1 }}>{f.icon}</span>
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8, position: 'relative', zIndex: 1 }}>{f.title}</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 15, position: 'relative', zIndex: 1 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}