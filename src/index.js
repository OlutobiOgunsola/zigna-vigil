require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const requestIdMiddleware = require('./middleware/requestId.middleware');
const APP_ROUTER = require('./routes');
const config = require('./config/environment');
const errorLog = require('./services/errorLog.service');
const { getLogger } = require('./utils/logging');

const app = express();
const log = getLogger();

app.set('trust proxy', 1);
app.use(helmet());

// CORS
const allowedOrigins = String(config.clientOrigin)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use(requestIdMiddleware);

// Health check (no auth required)
app.get('/health', async (req, res) => {
  const toolCache = require('./services/toolCache.service');
  return res.json({
    status: 'ok',
    service: 'zigna-vigil',
    aiProvider: config.ai.provider,
    uptime: process.uptime(),
    cache: toolCache.stats(),
  });
});

// All API routes mounted under /api
app.use('/api', APP_ROUTER);

// 404 handler (outside /api)
app.use((req, res) => {
  res.status(404).json({
    request_id: req.request_id || null,
    status: false,
    error: true,
    responseCode: 404,
    message: `Route ${req.path} does not exist`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  if (res.headersSent) return;

  const status = Number.isInteger(err.code) ? err.code : 500;

  if (status >= 500) {
    log.error(`${err.name}: ${err.message}`);
    log.error(err.stack);
  }

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
    error: err,
    source: err.source || 'request',
    toolName: err.toolName || null,
    aiProvider: err.aiProvider || null,
    endpoint: req.originalUrl || req.url,
    method: req.method,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  return res.status(status).json({
    request_id: req.request_id || null,
    status: false,
    error: true,
    responseCode: status,
    message: err.message || 'An unexpected error occurred.',
  });
});

const PORT = config.port;
app.listen(PORT, () => {
  log.info(`Zigna Vigil running on port ${PORT} (${config.nodeEnv})`);
  log.info(`AI Provider: ${config.ai.provider}`);
});

module.exports = app;
