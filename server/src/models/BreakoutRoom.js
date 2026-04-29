const mongoose = require('mongoose');

const breakoutRoomSchema = new mongoose.Schema({
  debate: { type: mongoose.Schema.Types.ObjectId, ref: 'Debate', required: true },
  name: { type: String, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  timer: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BreakoutRoom', breakoutRoomSchema);
