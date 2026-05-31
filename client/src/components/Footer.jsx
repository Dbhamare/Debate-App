import { Link } from 'react-router-dom';
export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(2,6,23,0.9)',
      padding: '32px 40px',
      backdropFilter: 'blur(16px)'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>RHETORIC</div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[{ to: '/about', label: 'About' }, { to: '/features', label: 'Features' }, { to: '/contact', label: 'Contact' }].map(l => (
            <Link key={l.to} to={l.to} style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textDecoration: 'none', fontFamily: 'Space Grotesk',
              transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
              {l.label}
            </Link>
          ))}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: 'Space Grotesk' }}>
          © {new Date().getFullYear()} RHETORIC
        </div>
      </div>
    </footer>
  );
}
