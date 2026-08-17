const sequelize = require('../config/database');

module.exports = {
  async getOverview({ productId, startDate, endDate }) {
    const replacements = [startDate, endDate];
    let productFilter = '';
    if (productId) {
      productFilter = 'AND product_id = ?';
      replacements.push(productId);
    }

    const [rows] = await sequelize.query(
      `SELECT
        COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as total_questions,
        COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as total_responses,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT CONCAT(product_id, '-', user_id)) as unique_users,
        SUM(CASE WHEN direction = 'outbound' THEN input_tokens ELSE 0 END) as total_input_tokens,
        SUM(CASE WHEN direction = 'outbound' THEN output_tokens ELSE 0 END) as total_output_tokens,
        AVG(CASE WHEN direction = 'outbound' THEN duration_ms END) as avg_duration_ms,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count
       FROM vigil_messages
       WHERE created_at >= ? AND created_at <= ? ${productFilter}`,
      { replacements }
    );

    // Tool call count
    const toolReplacements = [startDate, endDate];
    let toolProductFilter = '';
    if (productId) {
      toolProductFilter = 'AND product_id = ?';
      toolReplacements.push(productId);
    }
    const [toolRows] = await sequelize.query(
      `SELECT COUNT(*) as total_tool_calls FROM vigil_tool_executions WHERE created_at >= ? AND created_at <= ? ${toolProductFilter}`,
      { replacements: toolReplacements }
    );

    return { ...rows[0], total_tool_calls: toolRows[0]?.total_tool_calls || 0 };
  },

  async getQuestions({ productId, startDate, endDate, limit = 50, offset = 0 }) {
    const replacements = [startDate, endDate];
    let productFilter = '';
    if (productId) {
      productFilter = 'AND product_id = ?';
      replacements.push(productId);
    }
    replacements.push(limit, offset);

    const [rows] = await sequelize.query(
      `SELECT id, session_id, product_slug, business_id, business_name, user_id, user_fullname, role, direction, content, ai_provider, ai_model, input_tokens, output_tokens, duration_ms, status, error_message, created_at
       FROM vigil_messages
       WHERE created_at >= ? AND created_at <= ? ${productFilter}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      { replacements }
    );

    return rows;
  },

  async getTools({ productId, startDate, endDate }) {
    const replacements = [startDate, endDate];
    let productFilter = '';
    if (productId) {
      productFilter = 'AND product_id = ?';
      replacements.push(productId);
    }

    const [rows] = await sequelize.query(
      `SELECT
        product_slug,
        tool_name,
        COUNT(*) as total_executions,
        COUNT(CASE WHEN tool_status = 'success' THEN 1 END) as success_count,
        COUNT(CASE WHEN tool_status = 'error' THEN 1 END) as error_count,
        AVG(duration_ms) as avg_duration_ms,
        MAX(duration_ms) as max_duration_ms
       FROM vigil_tool_executions
       WHERE created_at >= ? AND created_at <= ? ${productFilter}
       GROUP BY product_slug, tool_name
       ORDER BY total_executions DESC`,
      { replacements }
    );

    return rows;
  },

  async getToolExecutions({ productId, startDate, endDate, toolName, limit = 50, offset = 0 }) {
    const replacements = [startDate, endDate];
    let productFilter = '';
    if (productId) {
      productFilter = 'AND product_id = ?';
      replacements.push(productId);
    }
    let toolFilter = '';
    if (toolName) {
      toolFilter = 'AND tool_name = ?';
      replacements.push(toolName);
    }
    replacements.push(limit, offset);

    const [rows] = await sequelize.query(
      `SELECT id, message_id, product_slug, business_id, business_name, user_id, user_fullname, tool_name, tool_args, tool_result_summary, tool_status, tool_error, permission_used, duration_ms, created_at
       FROM vigil_tool_executions
       WHERE created_at >= ? AND created_at <= ? ${productFilter} ${toolFilter}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      { replacements }
    );

    return rows;
  },

  async getProviders({ productId, startDate, endDate }) {
    const replacements = [startDate, endDate];
    let productFilter = '';
    if (productId) {
      productFilter = 'AND product_id = ?';
      replacements.push(productId);
    }

    const [rows] = await sequelize.query(
      `SELECT
        provider,
        model,
        COUNT(*) as total_calls,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        AVG(latency_ms) as avg_latency_ms,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count
       FROM vigil_ai_interactions
       WHERE created_at >= ? AND created_at <= ? ${productFilter}
       GROUP BY provider, model
       ORDER BY total_calls DESC`,
      { replacements }
    );

    return rows;
  },

  async getBusinesses({ productId, startDate, endDate }) {
    const replacements = [startDate, endDate];
    let productFilter = '';
    if (productId) {
      productFilter = 'AND product_id = ?';
      replacements.push(productId);
    }

    const [rows] = await sequelize.query(
      `SELECT
        product_slug,
        product_id,
        business_id,
        business_name,
        COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as total_questions,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(CASE WHEN direction = 'outbound' THEN input_tokens + output_tokens ELSE 0 END) as total_tokens,
        AVG(CASE WHEN direction = 'outbound' THEN duration_ms END) as avg_duration_ms
       FROM vigil_messages
       WHERE created_at >= ? AND created_at <= ? ${productFilter}
       GROUP BY product_slug, product_id, business_id, business_name
       ORDER BY total_questions DESC`,
      { replacements }
    );

    return rows;
  },

  async getUsers({ productId, startDate, endDate, limit = 50 }) {
    const replacements = [startDate, endDate];
    let productFilter = '';
    if (productId) {
      productFilter = 'AND product_id = ?';
      replacements.push(productId);
    }
    replacements.push(limit);

    const [rows] = await sequelize.query(
      `SELECT
        product_slug,
        product_id,
        business_id,
        business_name,
        user_id,
        user_fullname,
        user_email,
        role,
        COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as total_questions,
        COUNT(DISTINCT session_id) as total_sessions,
        SUM(CASE WHEN direction = 'outbound' THEN input_tokens + output_tokens ELSE 0 END) as total_tokens,
        MAX(created_at) as last_active
       FROM vigil_messages
       WHERE created_at >= ? AND created_at <= ? ${productFilter}
       GROUP BY product_slug, product_id, business_id, business_name, user_id, user_fullname, user_email, role
       ORDER BY total_questions DESC
       LIMIT ?`,
      { replacements }
    );

    return rows;
  },
};
