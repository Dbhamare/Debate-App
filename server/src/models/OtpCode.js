const mongoose = require('mongoose');

const otpCodeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    purpose: { type: String, required: true },

    target: { type: String, default: '' },

    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

otpCodeSchema.index({ user: 1, purpose: 1, target: 1, used: 1 });

module.exports = mongoose.model('OtpCode', otpCodeSchema);
