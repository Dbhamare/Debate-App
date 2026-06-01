const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { validate } = require('../middleware/validate');
const { otpSchemas } = require('../validation/schemas');

const { sendEmail } = require('../services/email');
const { sendSms } = require('../services/sms');
const { generateOtpCode, expiryFromNow, signOtpToken } = require('../utils/otp');

const OtpCode = require('../models/OtpCode');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

async function createOtpForUser(user, purpose, target = '', ttlMinutes = 10) {
  const code = generateOtpCode(6);
  const expiresAt = expiryFromNow(ttlMinutes);

  await OtpCode.updateMany(
    { user: user._id, purpose, target, used: false },
    { $set: { used: true } }
  );

  const rec = await OtpCode.create({ user: user._id, purpose, target, code, expiresAt });
  return { code, rec };
}

async function verifyUserOtp(user, purpose, target, code) {
  const rec = await OtpCode.findOne({
    user: user._id,
    purpose,
    target,
    used: false,
  }).sort({ createdAt: -1 });

  if (!rec) throw new Error('No OTP request found. Please request a new code.');
  if (rec.expiresAt < new Date()) throw new Error('OTP expired. Please request a new code.');
  if (rec.code !== String(code).trim()) throw new Error('Invalid code.');

  rec.used = true;
  await rec.save();
  return true;
}

const pending = new Map();

router.post('/register/email/request', validate({ body: otpSchemas.registerRequestBody }), async (req, res) => {
  try {
    const em = String(req.body?.email || '').toLowerCase().trim();
    if (!em) return res.status(400).json({ message: 'Email required' });

    const existing = await User.findOne({ email: em });
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const code = generateOtpCode(6);
    pending.set(`reg:${em}`, { code, expiresAt: Date.now() + 10 * 60 * 1000 });

    await sendEmail(
      em,
      'Your verification code',
      `<p>Your verification code is: <b>${code}</b>. It expires in 10 minutes.</p>`
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('register/email/request error:', err);
    res.status(500).json({ message: 'Failed to send email OTP' });
  }
});

router.post('/register/email/verify', validate({ body: otpSchemas.registerVerifyBody }), async (req, res) => {
  try {
    const em = String(req.body?.email || '').toLowerCase().trim();
    const code = String(req.body?.code || '').trim();
    if (!em || !code) return res.status(400).json({ message: 'Email and code required' });

    const key = `reg:${em}`;
    const item = pending.get(key);
    if (!item) return res.status(400).json({ message: 'No OTP pending' });
    if (Date.now() > item.expiresAt) {
      pending.delete(key);
      return res.status(400).json({ message: 'OTP expired' });
    }
    if (item.code !== code) return res.status(400).json({ message: 'Invalid OTP' });

    pending.delete(key);
    const verificationToken = signOtpToken(
      { purpose: 'register_email', email: em.toLowerCase() },
      15 * 60
    );
    res.json({ ok: true, verificationToken });
  } catch (err) {
    console.error('register/email/verify error:', err);
    res.status(500).json({ message: 'Failed to verify email OTP' });
  }
});

router.post('/profile/email/request', auth, validate({ body: otpSchemas.profileEmailRequestBody }), async (req, res) => {
  try {
    const newEmail = String(req.body?.newEmail || '').toLowerCase().trim();
    if (!newEmail) return res.status(400).json({ message: 'newEmail required' });

    const user = await User.findOne({ userID: req.user.userID });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { code } = await createOtpForUser(user, 'profile_email', newEmail);
    await sendEmail(
      newEmail,
      'Verify your new email',
      `<p>Your verification code is: <b>${code}</b>. It expires in 10 minutes.</p>`
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('profile/email/request error:', e);
    res.status(500).json({ message: 'Failed to send email OTP' });
  }
});

router.post('/profile/email/verify', auth, validate({ body: otpSchemas.profileEmailVerifyBody }), async (req, res) => {
  try {
    const newEmail = String(req.body?.newEmail || '').toLowerCase().trim();
    const code = String(req.body?.code || '').trim();
    if (!newEmail || !code) return res.status(400).json({ message: 'code and newEmail required' });

    const user = await User.findOne({ userID: req.user.userID });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const taken = await User.findOne({ email: newEmail, _id: { $ne: user._id } });
    if (taken) return res.status(409).json({ message: 'Email already in use' });

    await verifyUserOtp(user, 'profile_email', newEmail, code);

    user.email = newEmail;
    user.emailVerified = true;
    await user.save();
    res.json({ ok: true, email: user.email });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Verification failed' });
  }
});

router.post('/profile/password/request', auth, async (req, res) => {
  try {
    const user = await User.findOne({ userID: req.user.userID });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { code } = await createOtpForUser(user, 'profile_password', user.email);
    await sendEmail(
      user.email,
      'Verify password change',
      `<p>Your verification code is: <b>${code}</b>. It expires in 10 minutes.</p>`
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('profile/password/request error:', e);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

router.post('/profile/password/verify', auth, validate({ body: otpSchemas.profilePasswordVerifyBody }), async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim();
    const newPassword = String(req.body?.newPassword || '');
    if (!code || !newPassword) return res.status(400).json({ message: 'code and newPassword required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'New password too short' });

    const user = await User.findOne({ userID: req.user.userID });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await verifyUserOtp(user, 'profile_password', user.email, code);

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    user.passwordHash = hash;
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Verification failed' });
  }
});

router.post('/profile/phone/request', auth, validate({ body: otpSchemas.profilePhoneRequestBody }), async (req, res) => {
  try {
    const newPhone = String(req.body?.newPhone || '').trim();
    if (!newPhone) return res.status(400).json({ message: 'Phone required' });

    const user = await User.findOne({ userID: req.user.userID });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { code } = await createOtpForUser(user, 'profile_phone', newPhone);
    await sendSms(newPhone, `Your verification code is: ${code}`);
    res.json({ ok: true });
  } catch (e) {
    console.error('profile/phone/request error:', e);
    res.status(500).json({ message: 'Failed to send SMS OTP' });
  }
});

router.post('/profile/phone/verify', auth, validate({ body: otpSchemas.profilePhoneVerifyBody }), async (req, res) => {
  try {
    const newPhone = String(req.body?.newPhone || '').trim();
    const code = String(req.body?.code || '').trim();
    if (!newPhone || !code) return res.status(400).json({ message: 'code and newPhone required' });

    const user = await User.findOne({ userID: req.user.userID });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await verifyUserOtp(user, 'profile_phone', newPhone, code);

    user.phone = newPhone;
    user.phoneVerified = true;
    await user.save();
    res.json({ ok: true, phone: user.phone });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Verification failed' });
  }
});

module.exports = router;
