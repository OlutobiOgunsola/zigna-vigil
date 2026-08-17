const sequelize = require('../config/database');

module.exports = {
  async getErrorLogs({ productId, startDate, endDate, limit = 50, offset = 0 }) {
    const replacements = [startDate, endDate];
    let productFilter = '';
    if (productId) {
      productFilter = 'AND product_id = ?';
      replacements.push(productId);
    }
    replacements.push(limit, offset);

    const [rows] = await sequelize.query(
      `SELECT id, request_id, session_id, product_id, product_slug, business_id, business_name,
              user_id, user_fullname, role, error_code, error_name, error_message, error_stack,
              source, tool_name, ai_provider, endpoint, method, ip_address, created_at
       FROM vigil_error_logs
       WHERE created_at >= ? AND created_at <= ? ${productFilter}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      { replacements }
    );

    return rows;
  },
};
