import { useNavigate } from 'react-router-dom';
export default function AppLogoButton({ size = 42 }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/')} aria-label="Go home"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
      <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: size * 0.6, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em' }}>R</span>
    </button>
  );
}
