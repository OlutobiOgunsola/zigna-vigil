const productApi = require('../lib/http');
const config = require('../config/environment');
const { getLogger } = require('../utils/logging');

const log = getLogger();

module.exports = {
  async record({
    activeBusinessId,
    activeBusinessType,
    userId,
    toolName,
    aiProvider,
    aiModel,
    inputTokens,
    outputTokens,
    toolExecuted,
    durationMs,
  }) {
    const month = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    const record = {
      business_id: activeBusinessId,
      business_type: activeBusinessType,
      user_id: userId,
      month,
      tool_name: toolName || 'none',
      ai_provider: aiProvider,
      ai_model: aiModel,
      input_tokens: inputTokens || 0,
      output_tokens: outputTokens || 0,
      tool_executed: toolExecuted || false,
      duration_ms: durationMs || 0,
    };

    const productApiUrl =
      activeBusinessType === 'gym'
        ? config.products.zignalyft.apiUrl
        : config.products.zignastay.apiUrl;

    const headers = {};
    if (activeBusinessType === 'gym') {
      headers['x-gym-id'] = activeBusinessId;
    } else {
      headers['x-hotel-id'] = activeBusinessId;
    }

    try {
      await productApi.post(`${productApiUrl}/vigil/usage`, record, { headers });
    } catch (error) {
      // Non-fatal — product API might be down
      log.warn('Could not record usage to product API', {
        error: error.message,
        businessId: activeBusinessId,
        businessType: activeBusinessType,
      });
    }
  },

  async getUsage({ activeBusinessId, activeBusinessType, month, userId }) {
    const productApiUrl =
      activeBusinessType === 'gym'
        ? config.products.zignalyft.apiUrl
        : config.products.zignastay.apiUrl;

    const params = {};
    if (month) params.month = month;
    if (userId) params.user_id = userId;

    const headers = {};
    if (activeBusinessType === 'gym') {
      headers['x-gym-id'] = activeBusinessId;
    } else {
      headers['x-hotel-id'] = activeBusinessId;
    }

    const { data } = await productApi.get(`${productApiUrl}/vigil/usage`, {
      params,
      headers,
    });

    return data;
  },
};
