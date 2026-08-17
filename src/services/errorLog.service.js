const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const { getLogger } = require('../utils/logging');

const log = getLogger();

module.exports = {
  async persist({
    requestId = null,
    sessionId = null,
    productId = null,
    productSlug = null,
    businessId = null,
    businessName = null,
    userId = null,
    userFullname = null,
    role = null,
    error,
    source = 'unknown',
    toolName = null,
    aiProvider = null,
    endpoint = null,
    method = null,
    ipAddress = null,
    userAgent = null,
  }) {
    try {
      const errorObj = error instanceof Error ? error : new Error(String(error));

      const now = sequelize.getDialect() === 'sqlite' ? "datetime('now')" : 'NOW()';
      await sequelize.query(
        `INSERT INTO vigil_error_logs
          (id, request_id, session_id, product_id, product_slug, business_id, business_name, user_id, user_fullname, role, error_code, error_name, error_message, error_stack, source, tool_name, ai_provider, endpoint, method, ip_address, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${now})`,
        {
          replacements: [
            uuidv4(),
            requestId,
            sessionId,
            productId,
            productSlug,
            businessId,
            businessName,
            userId,
            userFullname,
            role,
            errorObj.code || 500,
            errorObj.name || 'Error',
            errorObj.message || 'Unknown error',
            errorObj.stack || null,
            source,
            toolName,
            aiProvider,
            endpoint,
            method,
            ipAddress,
            userAgent ? String(userAgent).slice(0, 500) : null,
          ],
        }
      );
    } catch (err) {
      log.warn('Failed to persist error log', { error: err.message });
    }
  },
};
