const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const OTP_JWT_SECRET = process.env.OTP_JWT_SECRET || process.env.JWT_SECRET;
if (!OTP_JWT_SECRET) {
  throw new Error('OTP_JWT_SECRET (or JWT_SECRET) must be set');
}

function generateOtpCode(len = 6) {
  return crypto.randomInt(0, 10 ** len).toString().padStart(len, '0');
}

function signOtpToken(payload, ttlSeconds = 600) {
  return jwt.sign(payload, OTP_JWT_SECRET, { expiresIn: ttlSeconds });
}

function verifyOtpToken(token) {
  try {
    return jwt.verify(token, OTP_JWT_SECRET);
  } catch {
    return null;
  }
}

function expiryFromNow(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

module.exports = {
  generateOtpCode,
  signOtpToken,
  verifyOtpToken,
  expiryFromNow,
};
