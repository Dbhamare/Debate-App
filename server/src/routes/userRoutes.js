const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.find(
      { role: { $in: ['student', 'instructor'] } },
      { _id: 0, userID: 1, name: 1, role: 1 }
    ).sort({ name: 1 });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users list:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
