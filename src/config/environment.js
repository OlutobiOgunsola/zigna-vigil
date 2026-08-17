module.exports = {
  port: parseInt(process.env.PORT, 10) || 3100,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:7002,http://localhost:7102',

  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  ai: {
    provider: process.env.AI_PROVIDER || 'opencode',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'qwen3.7-plus',
    baseUrl: process.env.AI_BASE_URL || '',
    tieredRouting: process.env.TIERED_MODEL_ROUTING !== 'false', // enabled by default
    defaultTier: process.env.DEFAULT_AI_TIER || 'medium',
  },

  products: {
    zignalyft: { apiUrl: process.env.ZIGNALYFT_API_URL || 'http://localhost:7001/api' },
    zignastay: { apiUrl: process.env.ZIGNASTAY_API_URL || 'http://localhost:7003/api' },
  },

  vigilSecret: process.env.VIGIL_SECRET || '',
  dashboardSecret: process.env.VIGIL_DASHBOARD_SECRET || 'vigil-admin-2026',

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 60,
  },
};
