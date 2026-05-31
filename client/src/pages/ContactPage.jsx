import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
export default function ContactPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', position: 'relative', overflow: 'hidden' }}>
      <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
      <nav style={{ padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 900, color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/')}>RHETORIC</span>
        <button className="btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
      </nav>
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '80px 40px', position: 'relative', zIndex: 2 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 56, fontWeight: 900, color: 'var(--on-surface)', marginBottom: 16, letterSpacing: '-0.02em' }}>Contact Us</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 18, lineHeight: 1.7, marginBottom: 48 }}>
            Have questions, feedback, or need support? Reach out to us and we'll get back to you within 24 hours.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { icon: 'mail', label: 'Email', value: 'support@rhetoric.app', href: 'mailto:support@rhetoric.app' },
              { icon: 'school', label: 'Academic Partnerships', value: 'edu@rhetoric.app', href: 'mailto:edu@rhetoric.app' },
              { icon: 'bug_report', label: 'Bug Reports', value: 'GitHub Issues', href: '#' },
            ].map(c => (
              <motion.a key={c.label} href={c.href} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="session-item" style={{ textDecoration: 'none', flexDirection: 'row' }}>
                <div className="left-accent" />
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 28, marginLeft: 16 }}>{c.icon}</span>
                <div style={{ marginLeft: 20 }}>
                  <div style={{ color: 'var(--outline)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ color: 'var(--on-surface)', fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600 }}>{c.value}</div>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}