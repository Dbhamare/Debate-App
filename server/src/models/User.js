const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userID: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  isAdmin: { type: Boolean, default: false },
  rewards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reward' }],
  streak: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  avatarUrl: { type: String, default: "" },
  title:     { type: String, default: "" },
  gender:    { type: String, enum: ["male","female","other","prefer_not_to_say",""], default: "" },
  phone:     { type: String, default: "" },
  bio:       { type: String, default: "" },
  course:    { type: String, default: "" },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  passwordResetTokenHash: { type: String, default: "", select: false },
  passwordResetExpiresAt: { type: Date, default: null, select: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
