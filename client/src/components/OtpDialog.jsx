import { useState } from 'react';

export default function OtpDialog({ open, onClose, onVerify, title = 'Enter OTP' }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  const handleVerify = async () => {
    setBusy(true);
    try { await onVerify(code); setCode(''); onClose(); }
    catch {} finally { setBusy(false); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--surface-container)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 32, maxWidth: 380, width: '100%' }}>
        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 12 }}>{title}</h3>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, marginBottom: 16 }}>Enter the 6-digit code we sent.</p>
        <input className="rhetoric-input" style={{ paddingLeft: 16, marginBottom: 20, letterSpacing: '0.2em', fontSize: 20, textAlign: 'center' }}
          placeholder="123456" value={code} inputMode="numeric" maxLength={6} autoFocus
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy || code.length < 4} onClick={handleVerify}
            style={{ opacity: busy || code.length < 4 ? 0.6 : 1 }}>
            {busy ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
}
