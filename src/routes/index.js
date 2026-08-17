const router = require('express').Router();
const responseMiddleware = require('../middleware/response.middleware');
const loggerMiddleware = require('../middleware/logger.middleware');
const errorLog = require('../services/errorLog.service');
const { SERVER_ERROR_MESSAGES } = require('../lib/literature/errors.literature');

const conversationRoutes = require('./conversation.routes');
const healthRoutes = require('./health.routes');
const usageRoutes = require('./usage.routes');
const metricsRoutes = require('./metrics.routes');
const errorLogsRoutes = require('./errorLogs.routes');
const authRoutes = require('./auth.routes');

// Global middleware for all API routes
router.use(responseMiddleware);
router.use(loggerMiddleware);

// Mount sub-routers
// Public routes (no auth)
router.use('/auth', authRoutes);

// Protected routes
router.use('/conversation', conversationRoutes);
router.use('/health', healthRoutes);
router.use('/usage', usageRoutes);
router.use('/metrics', metricsRoutes);
router.use('/error-logs', errorLogsRoutes);

// 404 handler
router.use((req, res) => {
  res.notFound({ message: `Route ${req.path} does not exist` });
});

// Centralized error handler (matches sister APIs)
router.use((error, req, res, next) => {
  if (res.headersSent) return;

  const status = Number.isInteger(error.code) ? error.code : 500;

  errorLog.persist({
    requestId: req.request_id || null,
    sessionId: req.sessionId || null,
    productId: req.productId || null,
    productSlug: req.productSlug || null,
    businessId: req.activeBusinessId || null,
    businessName: req.activeBusinessName || null,
    userId: req.userId || null,
    userFullname: req.activeUserFullname || null,
    role: req.activeRole || null,
    error,
    source: error.source || 'api',
    toolName: error.toolName || null,
    aiProvider: error.aiProvider || null,
    endpoint: req.originalUrl || req.url,
    method: req.method,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  return res.status(status).json({
    request_id: req.request_id,
    status: false,
    error: true,
    responseCode: status,
    message: error.message || SERVER_ERROR_MESSAGES.GENERIC_ERROR,
  });
});

module.exports = router;
