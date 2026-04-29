const Joi = require('joi');

function validate({ body, params, query } = {}) {
  return (req, res, next) => {
    try {
      if (body) {
        const { error, value } = body.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
        if (error) {
          return res.status(400).json({ message: error.details.map((d) => d.message).join('; ') });
        }
        req.body = value;
      }

      if (params) {
        const { error, value } = params.validate(req.params || {}, { abortEarly: false, stripUnknown: true });
        if (error) {
          return res.status(400).json({ message: error.details.map((d) => d.message).join('; ') });
        }
        req.params = value;
      }

      if (query) {
        const { error, value } = query.validate(req.query || {}, { abortEarly: false, stripUnknown: true });
        if (error) {
          return res.status(400).json({ message: error.details.map((d) => d.message).join('; ') });
        }
        req.query = value;
      }

      return next();
    } catch (err) {
      return res.status(500).json({ message: 'Validation middleware failed' });
    }
  };
}

module.exports = { validate, Joi };
