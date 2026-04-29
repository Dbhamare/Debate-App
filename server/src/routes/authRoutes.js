const express = require('express');
const router = express.Router();
const { register, login, adminLogin, forgotPassword, resetPassword } = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { authSchemas } = require('../validation/schemas');

router.post('/register', validate({ body: authSchemas.registerBody }), async (req, res, next) => {
  const origJson = res.json.bind(res);
  res.json = (body) => {
    try {
      if (body && body.user && !body.userId && body.user._id) {
        body.userId = body.user._id;
      }
    } catch (_) {}
    return origJson(body);
  };
  return register(req, res, next);
});

router.post('/login', validate({ body: authSchemas.loginBody }), login);
router.post('/admin/login', validate({ body: authSchemas.adminLoginBody }), adminLogin);
router.post('/forgot-password', validate({ body: authSchemas.forgotPasswordBody }), forgotPassword);
router.post('/reset-password', validate({ body: authSchemas.resetPasswordBody }), resetPassword);

module.exports = router;
