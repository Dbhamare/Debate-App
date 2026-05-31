import api from '../services/api';
import { useEffect, useMemo, useState } from 'react';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';

export default function PublicProfileDialog({ open, onClose, userID, isAnonymous = false }) {
  const [profile, setProfile] = useState(null);
  const [zoom, setZoom] = useState(false);

  const blockOpen = useMemo(() => {
    if (isAnonymous) return true;
    if (userID === null || userID === undefined) return true;
    if (typeof userID === 'number' && (userID <= 0 || !Number.isFinite(userID))) return true;
    if (typeof userID === 'string' && ['anonymous', 'anon', 'anonym'].includes(userID.toLowerCase())) return true;
    return false;
  }, [isAnonymous, userID]);

  useEffect(() => { if (open && blockOpen) { setProfile(null); onClose?.(); } }, [open, blockOpen, onClose]);

  useEffect(() => {
    if (!open || blockOpen || !userID) return;
    (async () => {
      try { const { data } = await api.get(`/profile/public/${userID}`); setProfile(data); }
      catch { setProfile(null); }
    })();
  }, [open, userID, blockOpen]);

  const avatarSrc = profile?.avatarUrl ? `${API_ORIGIN}${profile.avatarUrl}` : null;
  const fallback = profile?.name?.[0]?.toUpperCase() || 'U';

  if (!open || blockOpen) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{ background: 'var(--surface-container)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: 32, maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: 'var(--on-surface)' }}>Profile</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)', fontSize: 22 }}>×</button>
          </div>
          {profile ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: avatarSrc ? `url(${avatarSrc}) center/cover` : 'rgba(56,189,248,0.15)',
                border: '2px solid rgba(56,189,248,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary)', fontWeight: 700, fontSize: 28, fontFamily: 'Space Grotesk',
                cursor: avatarSrc ? 'zoom-in' : 'default'
              }} onClick={() => avatarSrc && setZoom(true)}>
                {!avatarSrc && fallback}
              </div>
              <h4 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, color: 'var(--on-surface)' }}>{profile.name}</h4>
              {profile.course && <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>{profile.course}</p>}
              {profile.bio && <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, lineHeight: 1.5, textAlign: 'left', whiteSpace: 'pre-wrap' }}>{profile.bio}</p>}
            </div>
          ) : (
            <p style={{ color: 'var(--on-surface-variant)' }}>No public profile found.</p>
          )}
        </div>
      </div>
      {zoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setZoom(false)}>
          <img src={avatarSrc} alt="Profile" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
        </div>
      )}
    </>
  );
}