const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema(
  {
    joincode: { type: Number, required: true, index: true },
    userID:   { type: Number, required: true, index: true },
    side:     { type: String, enum: ['proponent', 'opponent'], required: true },
  },
  { timestamps: true }
);

VoteSchema.index({ joincode: 1, userID: 1 }, { unique: true });

module.exports = mongoose.model('Vote', VoteSchema);