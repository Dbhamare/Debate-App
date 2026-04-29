const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');

const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const publicShape = (u) => ({
  userID: u.userID,
  name: u.name,
  avatarUrl: u.avatarUrl || '',
  bio: u.bio || '',
  course: u.course || '',
});

const AVATAR_DIR = path.join(__dirname, '../uploads/avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname || '') || '.jpg').toLowerCase();
    const tokenUserId = req.user?.userId || req.user?._id || req.user?.userID || 'u';
    cb(null, `avatar_${tokenUserId}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

function removeIfExists(absPath) {
  if (!absPath) return;
  try {
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
  } catch (_) {}
}

async function findAuthedUser(req) {
  const u = req.user || {};

  const oid = u.userID || u.id || u._id;
  if (oid && mongoose.isValidObjectId(String(oid))) {
    const byId = await User.findById(oid);
    if (byId) return byId;
  }

  const numeric = Number(u.userID || u.uid);
  if (numeric) {
    const byUID = await User.findOne({ userID: numeric });
    if (byUID) return byUID;
  }

  return null;
}

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await findAuthedUser(req);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const safe = user.toObject();
    delete safe.password;
    res.json(safe);
  } catch (e) {
    console.error('Profile /me error:', e);
    res.status(500).json({ message: 'Failed to load profile' });
  }
});

router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      email,
      title,
      gender,
      phone,
      bio,
      course,
      avatarUrl,
      oldPassword,
      newPassword,
    } = req.body;

    const user = await findAuthedUser(req);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (typeof name === 'string') user.name = name.trim();
    if (typeof email === 'string') {
      const nextEmail = email.toLowerCase().trim();
      if (nextEmail && nextEmail !== user.email) {
        return res.status(400).json({ message: 'Use OTP email verification endpoint to change email' });
      }
    }

    if (typeof title !== 'undefined') user.title = title;
    if (typeof gender !== 'undefined') user.gender = gender;
    if (typeof phone !== 'undefined') {
      const nextPhone = String(phone || '').trim();
      const currentPhone = String(user.phone || '').trim();
      if (nextPhone !== currentPhone) {
        return res.status(400).json({ message: 'Use OTP phone verification endpoint to change phone' });
      }
    }
    if (typeof bio !== 'undefined') user.bio = bio;
    if (typeof course !== 'undefined') user.course = course;
    if (typeof avatarUrl !== 'undefined') user.avatarUrl = avatarUrl;

    if (newPassword) {
      if (!oldPassword) return res.status(400).json({ message: 'Old password required' });
      const ok = await bcrypt.compare(oldPassword, user.password || '');
      if (!ok) return res.status(400).json({ message: 'Old password incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ message: 'New password too short' });
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    const safe = user.toObject();
    delete safe.password;
    res.json(safe);
  } catch (e) {
    console.error('Profile update error:', e);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const user = await findAuthedUser(req);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/')) {
      const oldAbs = path.join(__dirname, '..', user.avatarUrl.replace(/^\//, ''));
      removeIfExists(oldAbs);
    }

    user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    res.json({ avatarUrl: user.avatarUrl });
  } catch (e) {
    console.error('Avatar upload failed:', e);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

router.delete('/avatar', authMiddleware, async (req, res) => {
  try {
    const user = await findAuthedUser(req);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/')) {
      const oldAbs = path.join(__dirname, '..', user.avatarUrl.replace(/^\//, ''));
      removeIfExists(oldAbs);
    }
    user.avatarUrl = '';
    await user.save();

    res.json({ success: true });
  } catch (e) {
    console.error('Avatar delete failed:', e);
    res.status(500).json({ message: 'Failed to delete avatar' });
  }
});

router.get('/public/:userID', async (req, res) => {
  try {
    const u = await User.findOne({ userID: Number(req.params.userID) })
      .select('userID name avatarUrl bio course');
    if (!u) return res.status(404).json({ message: 'User not found' });
    res.json(publicShape(u));
  } catch (e) {
    console.error('Public profile error:', e);
    res.status(500).json({ message: 'Failed to load profile' });
  }
});

module.exports = router;
