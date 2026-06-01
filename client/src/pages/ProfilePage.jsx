import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';

const toProfileFields = (d = {}) => ({
  name: d.name || '', email: d.email || '', avatarUrl: d.avatarUrl || '',
  title: d.title || '', gender: d.gender || '', phone: d.phone || '',
  bio: d.bio || '', course: d.course || '',
});

function Modal({ title, children, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{ background: 'var(--surface-container)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: 32, maxWidth: 440, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: 'var(--on-surface)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)', fontSize: 22 }}>×</button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

const fieldStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteAvatarOpen, setDeleteAvatarOpen] = useState(false);
  const [otpModal, setOtpModal] = useState({ open: false, purpose: null, target: '' });
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', avatarUrl: '', title: '', gender: '', phone: '', bio: '', course: '', oldPassword: '', newPassword: '' });
  const token = localStorage.getItem('token');
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!token) { navigate('/login', { replace: true }); return; }
    const load = async () => {
      try {
        const { data } = await api.get('/profile/me', { headers: { Authorization: `Bearer ${token}` } });
        setMe(data); setForm(f => ({ ...f, ...toProfileFields(data) }));
      } catch (e) {
        if (e.response?.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login', { replace: true }); }
      }
    };
    load();
  }, [token, navigate]);

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('avatar', file);
    try {
      const { data } = await api.post('/profile/avatar', fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      const avatarUrl = data.avatarUrl || '';
      setForm(f => ({ ...f, avatarUrl })); setMe(p => p ? { ...p, avatarUrl } : p);
      const u = JSON.parse(localStorage.getItem('user') || '{}'); localStorage.setItem('user', JSON.stringify({ ...u, avatarUrl }));
      showToast('Profile picture updated.');
    } catch (err) { showToast(err.response?.data?.message || 'Failed to upload avatar', 'error'); }
    finally { e.target.value = ''; }
  };

  const onDeleteAvatar = async () => {
    try {
      await api.delete('/profile/avatar', { headers: { Authorization: `Bearer ${token}` } });
      setForm(f => ({ ...f, avatarUrl: '' })); setMe(p => p ? { ...p, avatarUrl: '' } : p);
      const u = JSON.parse(localStorage.getItem('user') || '{}'); localStorage.setItem('user', JSON.stringify({ ...u, avatarUrl: '' }));
      showToast('Profile picture removed.');
    } catch (e) { showToast(e.response?.data?.message || 'Failed to delete avatar', 'error'); }
    finally { setDeleteAvatarOpen(false); }
  };

  const onSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = toProfileFields(form);
      const emailChanged = me && payload.email !== me.email;
      const phoneChanged = me && payload.phone !== me.phone;
      if (emailChanged) payload.email = me.email;
      if (phoneChanged) payload.phone = me.phone;

      const { data } = await api.patch('/profile/me', payload, { headers: { Authorization: `Bearer ${token}` } });
      const updated = toProfileFields({ ...payload, ...data });
      setMe(p => p ? { ...p, ...updated } : p); setForm(f => ({ ...f, ...updated }));
      
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...u,
        name: updated.name,
        avatarUrl: updated.avatarUrl,
        title: updated.title,
        gender: updated.gender,
        bio: updated.bio,
        course: updated.course
      }));

      if (emailChanged || phoneChanged) {
        showToast('Profile updated. Note: Unverified email/phone changes were not saved. Verify them via OTP first.', 'info');
      } else {
        showToast('Profile updated.');
      }
    } catch (e) { showToast(e.response?.data?.message || 'Failed to update profile', 'error'); }
    finally { setSaving(false); }
  };

  const requestEmailOtp = async () => {
    if (!form.email || form.email === me?.email) { showToast('Enter a new email to verify.', 'error'); return; }
    try {
      await api.post('/otp/profile/email/request', { newEmail: form.email }, { headers: { Authorization: `Bearer ${token}` } });
      setOtpModal({ open: true, purpose: 'change_email', target: form.email }); setOtpCode('');
    } catch (e) { showToast(e.response?.data?.message || 'Failed to send email OTP', 'error'); }
  };

  const requestPhoneOtp = async () => {
    if (!form.phone || form.phone === me?.phone) { showToast('Enter a new phone number to verify.', 'error'); return; }
    try {
      await api.post('/otp/profile/phone/request', { newPhone: form.phone }, { headers: { Authorization: `Bearer ${token}` } });
      setOtpModal({ open: true, purpose: 'change_phone', target: form.phone }); setOtpCode('');
    } catch (e) { showToast(e.response?.data?.message || 'Failed to send phone OTP', 'error'); }
  };

  const requestPasswordOtp = async () => {
    if (!form.newPassword) { showToast('Enter a new password first.', 'error'); return; }
    try {
      await api.post('/otp/profile/password/request', {}, { headers: { Authorization: `Bearer ${token}` } });
      setOtpModal({ open: true, purpose: 'change_password', target: '' }); setOtpCode('');
    } catch (e) { showToast(e.response?.data?.message || 'Failed to send password OTP', 'error'); }
  };

  const verifyOtp = async () => {
    setVerifying(true);
    try {
      if (otpModal.purpose === 'change_email') {
        const { data } = await api.post('/otp/profile/email/verify', { code: otpCode, newEmail: otpModal.target }, { headers: { Authorization: `Bearer ${token}` } });
        setForm(f => ({ ...f, email: data.email || '' }));
        if (me) setMe(p => p ? { ...p, email: data.email } : p);
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...u, email: data.email, emailVerified: true }));
        showToast('Email verified and updated.');
      } else if (otpModal.purpose === 'change_phone') {
        const { data } = await api.post('/otp/profile/phone/verify', { code: otpCode, newPhone: otpModal.target }, { headers: { Authorization: `Bearer ${token}` } });
        setForm(f => ({ ...f, phone: data.phone || '' }));
        if (me) setMe(p => p ? { ...p, phone: data.phone } : p);
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...u, phone: data.phone, phoneVerified: true }));
        showToast('Phone number verified and updated.');
      } else if (otpModal.purpose === 'change_password') {
        await api.post('/otp/profile/password/verify', { code: otpCode, newPassword: form.newPassword }, { headers: { Authorization: `Bearer ${token}` } });
        setForm(f => ({ ...f, oldPassword: '', newPassword: '' }));
        showToast('Password updated.');
      }
      setOtpModal({ open: false, purpose: null, target: '' });
    } catch (e) { showToast(e.response?.data?.message || 'Verification failed', 'error'); }
    finally { setVerifying(false); }
  };

  const avatarSrc = form.avatarUrl ? `${API_ORIGIN}${form.avatarUrl}` : null;
  const fallback = form.name?.[0]?.toUpperCase() || 'U';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--background)' }}>
      <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
      <Sidebar user={user} />
      <div className="rhetoric-main" style={{ position: 'relative', zIndex: 1, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <header className="rhetoric-topbar">
          <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
            <span style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: 'var(--on-surface)', display: 'block', lineHeight: 1.2 }}>My Profile</span>
          </div>
        </header>
        <main style={{ flex: 1, padding: '40px 32px', display: 'flex', justifyContent: 'center', overflowY: 'auto', minHeight: 0 }}>
          <motion.form onSubmit={onSave} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', maxWidth: 1400 }}>
            <div style={{ marginBottom: 40 }}>
              <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 36, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.01em', marginBottom: 6 }}>My Profile</h1>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 16 }}>Update personal details, avatar, and account security.</p>
            </div>

            {/* Avatar */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 32, marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 20 }}>Profile Picture</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: avatarSrc ? `url(${avatarSrc}) center/cover` : 'rgba(56,189,248,0.15)',
                  border: '2px solid rgba(56,189,248,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)', fontWeight: 700, fontSize: 28, fontFamily: 'Space Grotesk',
                  cursor: avatarSrc ? 'zoom-in' : 'default', flexShrink: 0
                }} onClick={() => avatarSrc && setPreviewOpen(true)}>{!avatarSrc && fallback}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                    background: 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: 8,
                    padding: '10px 18px', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
                    Upload Avatar
                    <input type="file" hidden accept="image/*" onChange={onPickAvatar} />
                  </label>
                  {form.avatarUrl && (
                    <button type="button" onClick={() => setDeleteAvatarOpen(true)} className="btn-danger" style={{ padding: '10px 18px', fontSize: 13 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 32, marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 24 }}>Personal Information</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                {[
                  { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Your full name', required: true },
                  { label: 'Title', name: 'title', type: 'text', placeholder: 'e.g. MSc Student' },
                  { label: 'Course', name: 'course', type: 'text', placeholder: 'MSc Computer Science' },
                ].map(f => (
                  <div key={f.name}>
                    <label style={fieldStyle}>{f.label}</label>
                    <input className="rhetoric-input" style={{ paddingLeft: 16 }} type={f.type}
                      name={f.name} placeholder={f.placeholder} value={form[f.name]}
                      onChange={onChange} required={f.required} />
                  </div>
                ))}
                <div>
                  <label style={fieldStyle}>Gender</label>
                  <select name="gender" value={form.gender} onChange={onChange}
                    style={{ width: '100%', background: 'var(--surface-container-lowest)', border: '1px solid rgba(62,72,79,0.5)', borderRadius: 8, padding: '12px 16px', color: 'var(--on-surface)', fontSize: 16, outline: 'none' }}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                <label style={fieldStyle}>Bio</label>
                <textarea name="bio" value={form.bio} onChange={onChange} rows={4}
                  placeholder="Tell us about yourself..." className="rhetoric-input"
                  style={{ paddingLeft: 16, resize: 'vertical', minHeight: 100 }} />
              </div>
            </div>

            {/* Email */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 32, marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 20 }}>Email Address</h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <span className="input-icon material-symbols-outlined">mail</span>
                  <input className="rhetoric-input" type="email" name="email" value={form.email} onChange={onChange} placeholder="your@email.com" required />
                </div>
                <motion.button type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={requestEmailOtp} className="btn-outline" style={{ flexShrink: 0 }}>
                  Verify New Email
                </motion.button>
              </div>
            </div>

            {/* Phone */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 32, marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 20 }}>Phone Number</h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <span className="input-icon material-symbols-outlined">phone</span>
                  <input className="rhetoric-input" type="tel" name="phone" value={form.phone} onChange={onChange} placeholder="+447700900123" />
                </div>
                <motion.button type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={requestPhoneOtp} className="btn-outline" style={{ flexShrink: 0 }}>
                  Verify Phone
                </motion.button>
              </div>
            </div>

            {/* Password */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 32, marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 20 }}>Change Password</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={fieldStyle}>Old Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon material-symbols-outlined">lock</span>
                    <input className="rhetoric-input" type="password" name="oldPassword" value={form.oldPassword} onChange={onChange} placeholder="Current password" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={fieldStyle}>New Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon material-symbols-outlined">lock_open</span>
                      <input className="rhetoric-input" type="password" name="newPassword" value={form.newPassword} onChange={onChange} placeholder="New password" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 0 }}>
                    <motion.button type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={requestPasswordOtp} className="btn-outline">
                      Send OTP
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn-ghost" onClick={() => navigate(-1)}>Cancel</motion.button>
              <motion.button type="submit" disabled={saving} whileHover={{ scale: saving ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn-primary" style={{ padding: '12px 32px', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </div>
          </motion.form>
        </main>
      </div>

      <AnimatePresence>
        {previewOpen && (
          <Modal title="Profile Picture" onClose={() => setPreviewOpen(false)}>
            <img src={avatarSrc} alt="Profile" style={{ maxWidth: '100%', borderRadius: 8 }} />
          </Modal>
        )}
        {deleteAvatarOpen && (
          <Modal title="Remove Profile Picture" onClose={() => setDeleteAvatarOpen(false)}>
            <p style={{ color: 'var(--on-surface-variant)', marginBottom: 24 }}>Your current profile picture will be permanently removed.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setDeleteAvatarOpen(false)}>Cancel</button>
              <button style={{ background: 'var(--error)', color: 'var(--on-error)', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}
                onClick={onDeleteAvatar}>Remove</button>
            </div>
          </Modal>
        )}
        {otpModal.open && (
          <Modal title={
            otpModal.purpose === 'change_email' ? 'Verify New Email' : 
            otpModal.purpose === 'change_phone' ? 'Verify Phone Number' : 'Verify Password Change'
          } onClose={() => setOtpModal({ open: false, purpose: null, target: '' })}>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, marginBottom: 16 }}>
              {otpModal.purpose === 'change_phone' 
                ? 'Enter the 6-digit code we sent to your phone number.' 
                : 'Enter the 6-digit code we sent to your registered email.'}
            </p>
            <input className="rhetoric-input" style={{ paddingLeft: 16, marginBottom: 20, letterSpacing: '0.2em', fontSize: 20, textAlign: 'center' }}
              placeholder="123456" value={otpCode} inputMode="numeric" maxLength={6}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setOtpModal({ open: false, purpose: null, target: '' })}>Cancel</button>
              <button className="btn-primary" disabled={verifying || otpCode.length < 4} onClick={verifyOtp}
                style={{ opacity: verifying || otpCode.length < 4 ? 0.6 : 1 }}>
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </Modal>
        )}
        {toast && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            style={{
              position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
              minWidth: 280, background: toast.type === 'error' ? 'rgba(93,0,10,0.95)' : 'rgba(0,52,74,0.95)',
              backdropFilter: 'blur(12px)', border: `1px solid ${toast.type === 'error' ? 'rgba(255,180,171,0.3)' : 'rgba(56,189,248,0.3)'}`,
              color: toast.type === 'error' ? 'var(--error)' : 'var(--primary)', borderRadius: 10,
              padding: '12px 20px', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{toast.type === 'error' ? 'error' : 'check_circle'}</span>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
