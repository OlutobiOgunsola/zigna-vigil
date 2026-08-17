const crypto = require('crypto');

module.exports = function requestIdMiddleware(req, res, next) {
  req.request_id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.request_id);
  next();
};
