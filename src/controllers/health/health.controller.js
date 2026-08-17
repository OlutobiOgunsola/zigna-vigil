const config = require('../../config/environment');
const toolCache = require('../../services/toolCache.service');

module.exports = {
  async check(req, res) {
    return res.ok({
      message: 'Vigil is running',
      data: {
        uptime: process.uptime(),
        env: config.nodeEnv,
        aiProvider: config.ai.provider,
        cache: toolCache.stats(),
      },
    });
  },
};
