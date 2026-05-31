import { useState } from 'react';

export default function PasswordField({ id, name, label, autoComplete, required, fullWidth, margin, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', marginBottom: margin === 'normal' ? 16 : 0, width: fullWidth ? '100%' : 'auto' }}>
      {label && <label htmlFor={id} style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--outline-variant)', fontSize: 20, pointerEvents: 'none' }}>lock</span>
        <input id={id} name={name} type={show ? 'text' : 'password'} autoComplete={autoComplete}
          required={required} value={value} onChange={onChange} placeholder={placeholder || '••••••••••••'}
          className="rhetoric-input" style={{ paddingRight: 44 }} />
        <button type="button" onClick={() => setShow(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline-variant)', display: 'flex', alignItems: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{show ? 'visibility' : 'visibility_off'}</span>
        </button>
      </div>
    </div>
  );
}
