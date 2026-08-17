const { getLogger } = require('../utils/logging');

module.exports = function loggerMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = getLogger();
    log.info('request', {
      request_id: req.request_id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId || null,
      businessId: req.activeBusinessId || null,
      businessType: req.activeBusinessType || null,
    });
  });

  next();
};
