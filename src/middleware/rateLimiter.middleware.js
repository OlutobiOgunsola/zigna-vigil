const rateLimit = require('express-rate-limit');
const config = require('../config/environment');

module.exports = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  keyGenerator: (req) => {
    // Rate limit by business entity, not by IP
    return `${req.activeBusinessType}:${req.activeBusinessId}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      request_id: req.request_id,
      status: false,
      error: true,
      responseCode: 429,
      message: 'Rate limit exceeded for this business entity. Try again in a minute.',
    });
  },
});
