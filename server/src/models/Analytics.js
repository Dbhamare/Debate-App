const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  debate: { type: mongoose.Schema.Types.ObjectId, ref: 'Debate', required: true },
  user: { type: Number, required: true },
  participationCount: { type: Number, default: 0 },
  avgSentiment: { type: String },
  lastActive: { type: Date }
});

module.exports = mongoose.model('Analytics', analyticsSchema);
