const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  user: { type: Number, required: true },
  type: { type: String, enum: ['badge', 'points', 'streak', 'custom'], required: true },
  value: { type: Number, default: 0 },
  badgeName: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reward', rewardSchema);
