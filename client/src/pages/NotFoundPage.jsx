import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--background)', flexDirection: 'column', gap: 24, textAlign: 'center', padding: 32 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 40%, rgba(56,189,248,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: 'Space Grotesk', fontSize: 120, fontWeight: 900, color: 'rgba(56,189,248,0.15)', lineHeight: 1, marginBottom: 8 }}>404</div>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 36, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 12 }}>Page Not Found</h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 16, maxWidth: 400, lineHeight: 1.6, marginBottom: 32 }}>
          The arena you're looking for doesn't exist or has been closed.
        </p>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/')} className="btn-primary" style={{ padding: '12px 32px', fontSize: 15 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>home</span>
          Return Home
        </motion.button>
      </motion.div>
    </div>
  );
}