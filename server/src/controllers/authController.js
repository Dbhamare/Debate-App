const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { verifyOtpToken } = require('../utils/otp');
const { sendEmail } = require('../services/email');

const RESET_PASSWORD_TTL_MINUTES = 30;

function hashResetToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function getClientOrigin(req) {
  const origin =
    process.env.CLIENT_ORIGIN ||
    process.env.FRONTEND_ORIGIN ||
    process.env.FRONTEND_URL ||
    req.get('origin') ||
    'http://localhost:5173';

  return String(origin).replace(/\/+$/, '');
}

exports.register = async (req, res) => {
  try {
    let { name, email, password, userID, emailVerificationToken } = req.body;

    email = String(email || '').toLowerCase().trim();
    const verified = verifyOtpToken(emailVerificationToken);
    if (!verified || verified.purpose !== 'register_email' || String(verified.email || '').toLowerCase() !== email) {
      return res.status(400).json({ message: 'Email verification is required before registration.' });
    }

    if (!userID || !/^\d+$/.test(String(userID))) {
      return res.status(400).json({ message: 'A numeric Student/Instructor ID is required.' });
    }
    const numericID = parseInt(userID, 10);

    let role = null;
    if (numericID >= 1 && numericID <= 200) {
      role = 'student';
    } else if (numericID >= 501 && numericID <= 600) {
      role = 'instructor';
    } else {
      return res.status(400).json({
        message: 'Invalid ID range (Hint: Use IDs 001–200 for students or 501–600 for instructors)',
      });
    }

    const userExists = await User.findOne({ $or: [{ email }, { userID: numericID }] });
    if (userExists) {
      return res.status(400).json({ message: 'Email or ID is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: String(name || '').trim(),
      email,
      password: hashedPassword,
      userID: numericID,
      role,
      emailVerified: true,
    });

    const token = jwt.sign(
      { userID: user.userID, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const cleanUser = await User.findOne({ userID: user.userID }).select('-password -passwordHash');

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: cleanUser,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    let { email, password, userID } = req.body;

    email = String(email || '').toLowerCase().trim();

    const adminCheck = await User.findOne({ email });
    if (adminCheck && adminCheck.role === 'admin') {
      const isMatch = await bcrypt.compare(password, adminCheck.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect password' });
      }
      const token = jwt.sign(
        { userID: adminCheck.userID || null, role: adminCheck.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      const cleanUser = await User.findOne({ email }).select('-password -passwordHash');
      return res.json({ token, user: cleanUser });
    }

    if (!userID || !/^\d+$/.test(String(userID))) {
      return res.status(400).json({ message: 'Student/Instructor ID must be a number.' });
    }
    const numericID = parseInt(userID, 10);

    const user = await User.findOne({ email, userID: numericID });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or ID combination.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign(
      { userID: user.userID, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const cleanUser = await User.findOne({ userID: user.userID }).select('-password -passwordHash');

    return res.json({ token, user: cleanUser });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = String(email || '').toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user || user.role !== 'admin') {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { userID: user.userID || null, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const cleanUser = await User.findOne({ email }).select('-password -passwordHash');

    return res.json({ token, user: cleanUser });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ message: 'Admin login failed' });
  }
};

exports.forgotPassword = async (req, res) => {
  const response = {
    message: 'If that email is registered, a password reset link has been sent.',
  };

  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpiresAt');

    if (!user) {
      return res.json(response);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = hashResetToken(resetToken);
    user.passwordResetExpiresAt = new Date(Date.now() + RESET_PASSWORD_TTL_MINUTES * 60 * 1000);
    await user.save();

    const resetUrl = `${getClientOrigin(req)}/reset-password?token=${encodeURIComponent(resetToken)}`;

    await sendEmail(
      user.email,
      'Reset your Debate Platform password',
      `<p>Use this link to reset your password:</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>
       <p>This link expires in ${RESET_PASSWORD_TTL_MINUTES} minutes. If you did not request it, you can ignore this email.</p>`
    );

    return res.json(response);
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Failed to send password reset link' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const resetToken = String(req.body?.token || '').trim();
    const newPassword = String(req.body?.newPassword || '');
    const tokenHash = hashResetToken(resetToken);

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetExpiresAt');

    if (!user) {
      return res.status(400).json({ message: 'Password reset link is invalid or expired.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordHash = hashedPassword;
    user.passwordResetTokenHash = '';
    user.passwordResetExpiresAt = null;
    await user.save();

    return res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
};
