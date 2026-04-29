const { Joi } = require('../middleware/validate');

const sixDigitJoincode = Joi.number().integer().min(100000).max(999999);

const authSchemas = {
  registerBody: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(6).max(128).required(),
    userID: Joi.number().integer().required(),
    emailVerificationToken: Joi.string().required(),
  }),
  loginBody: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(1).required(),
    userID: Joi.number().integer().optional(),
  }),
  adminLoginBody: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(1).required(),
  }),
  forgotPasswordBody: Joi.object({
    email: Joi.string().trim().email().required(),
  }),
  resetPasswordBody: Joi.object({
    token: Joi.string().trim().min(32).max(256).required(),
    newPassword: Joi.string().min(6).max(128).required(),
  }),
};

const otpSchemas = {
  registerRequestBody: Joi.object({
    email: Joi.string().trim().email().required(),
  }),
  registerVerifyBody: Joi.object({
    email: Joi.string().trim().email().required(),
    code: Joi.string().trim().pattern(/^\d{4,8}$/).required(),
  }),
  profileEmailRequestBody: Joi.object({
    newEmail: Joi.string().trim().email().required(),
  }),
  profileEmailVerifyBody: Joi.object({
    newEmail: Joi.string().trim().email().required(),
    code: Joi.string().trim().pattern(/^\d{4,8}$/).required(),
  }),
  profilePasswordVerifyBody: Joi.object({
    code: Joi.string().trim().pattern(/^\d{4,8}$/).required(),
    newPassword: Joi.string().min(6).max(128).required(),
  }),
  profilePhoneRequestBody: Joi.object({
    newPhone: Joi.string().trim().min(6).max(32).required(),
  }),
  profilePhoneVerifyBody: Joi.object({
    newPhone: Joi.string().trim().min(6).max(32).required(),
    code: Joi.string().trim().pattern(/^\d{4,8}$/).required(),
  }),
};

const debateSchemas = {
  joincodeParams: Joi.object({
    joincode: sixDigitJoincode.required(),
  }),
  joincodeAndUserParams: Joi.object({
    joincode: sixDigitJoincode.required(),
    userID: Joi.number().integer().required(),
  }),
  createDebateBody: Joi.object({
    title: Joi.string().trim().min(3).max(200).required(),
    topic: Joi.string().trim().min(2).max(200).required(),
    rules: Joi.string().trim().min(1).max(5000).required(),
    description: Joi.string().trim().min(1).max(5000).required(),
    sides: Joi.array().items(
      Joi.object({
        name: Joi.string().valid('proponent', 'opponent', 'neutral').required(),
        participants: Joi.array().items(Joi.number().integer()).default([]),
      })
    ).optional(),
    isPublic: Joi.boolean().optional(),
    startTime: Joi.date().optional().allow(null),
    endTime: Joi.date().optional().allow(null),
  }),
  statusBody: Joi.object({
    status: Joi.string().valid('upcoming', 'active', 'closed').required(),
  }),
  assignStudentBody: Joi.object({
    studentId: Joi.number().integer().required(),
    side: Joi.string().valid('proponent', 'opponent', 'neutral').required(),
  }),
  assignBulkBody: Joi.object({
    assignments: Joi.array().items(
      Joi.object({
        userID: Joi.number().integer().required(),
        side: Joi.string().valid('proponent', 'opponent', 'neutral').required(),
      })
    ).required(),
  }),
  voteBody: Joi.object({
    side: Joi.string().valid('proponent', 'opponent').required(),
  }),
};

const messageSchemas = {
  joincodeParams: Joi.object({
    joincode: sixDigitJoincode.required(),
  }),
  searchQuery: Joi.object({
    q: Joi.string().trim().min(1).max(200).required(),
    joincode: sixDigitJoincode.required(),
  }),
  messageIdParams: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  createMessageBody: Joi.object({
    debate: sixDigitJoincode.required(),
    content: Joi.string().trim().min(1).max(5000).required(),
    side: Joi.string().valid('proponent', 'opponent', 'neutral').required(),
    replyTo: Joi.string().hex().length(24).optional().allow(null),
    isAnonymous: Joi.boolean().optional(),
  }),
  updateMessageBody: Joi.object({
    content: Joi.string().trim().min(1).max(5000).required(),
  }),
  pinBody: Joi.object({
    pinned: Joi.boolean().optional(),
  }),
  replyBody: Joi.object({
    content: Joi.string().trim().min(1).max(5000).required(),
    side: Joi.string().valid('proponent', 'opponent', 'neutral').required(),
    isAnonymous: Joi.boolean().optional(),
  }),
};

module.exports = {
  authSchemas,
  otpSchemas,
  debateSchemas,
  messageSchemas,
};
