import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
    pro: 'Dr. E. Vance', con: 'Col. R. Sterling', proPercent: 58
  },
  {
    id: 2, viewers: '8.9k', category: 'Economics',
    title: 'Universal Basic Income: Economic Savior or Inflation Catalyst?',
    pro: 'Prof. A. Chen', con: 'J. M. Keynes Inst', proPercent: 45
  },
  {
    id: 3, viewers: '15.2k', category: 'Philosophy',
    title: 'Determinism vs. Free Will in the Age of Neuroscience',
    pro: 'S. Harris', con: 'D. Dennett', proPercent: 50
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();

  return (
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

      {/* Live Now Section */}
      <section style={{ padding: '80px 40px', maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--error)',
                display: 'inline-block', animation: 'pulse-glow 2s infinite' }} />
              <span style={{
                fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--on-surface)'
              }}>Live Now</span>
            </div>
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif', fontSize: 40, fontWeight: 700,
              color: 'var(--on-surface)', letterSpacing: '-0.02em'
            }}>Active Arenas</h2>
          </div>
          <button style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--primary)', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4
          }}>View All Live
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </button>
        </motion.div>

        <motion.div
          variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {liveDebates.map((debate, i) => (
            <motion.div key={debate.id} variants={fadeUp} custom={i}
              className="debate-card"
              style={{ padding: 24, cursor: 'pointer' }}
              onClick={() => navigate(user ? '/dashboard' : '/login')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <span className="badge-live">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>visibility</span>
                  {debate.viewers}
                </span>
                <span className="badge-neutral">{debate.category}</span>
              </div>
              <h3 style={{
                fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 600,
                color: 'var(--on-surface)', lineHeight: 1.3, marginBottom: 20
              }}>{debate.title}</h3>
              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>{debate.pro} (Pro)</span>
                  <span style={{ color: 'var(--error)', fontSize: 13, fontWeight: 600 }}>{debate.con} (Con)</span>
                </div>
                <div className="debate-progress">
                  <div className="pro-bar" style={{ width: `${debate.proPercent}%` }} />
                  <div className="con-bar" style={{ width: `${100 - debate.proPercent}%` }} />
                </div>
              </div>
            </motion.div>
          ))}
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
            {['Terms of Service', 'Privacy Policy', 'Debate Guidelines', 'Technical Support'].map(t => (
              <a key={t} href="#" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13,
                textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif',
                transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                {t}
              </a>
            ))}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontFamily: 'Space Grotesk, sans-serif' }}>
            © 2024 RHETORIC. Engineered for high-stakes discourse.
          </div>
        </div>
      </footer>
    </div>
  );
}
