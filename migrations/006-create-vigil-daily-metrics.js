module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vigil_daily_metrics', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      product_id: { type: Sequelize.TINYINT, allowNull: false, references: { model: 'vigil_products', key: 'id' } },
      business_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      business_name: { type: Sequelize.STRING(255), allowNull: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      user_fullname: { type: Sequelize.STRING(255), allowNull: true },
      role: { type: Sequelize.STRING(50), allowNull: true },
      tool_name: { type: Sequelize.STRING(100), allowNull: true },
      ai_provider: { type: Sequelize.STRING(50), allowNull: true },
      ai_model: { type: Sequelize.STRING(100), allowNull: true },
      total_questions: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      total_responses: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      total_tool_calls: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      unique_users: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      unique_sessions: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      total_input_tokens: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      total_output_tokens: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      avg_duration_ms: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      p95_duration_ms: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      error_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      success_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('vigil_daily_metrics', ['date', 'product_id'], { name: 'vigil_daily_date_product' });
    await queryInterface.addIndex('vigil_daily_metrics', ['date', 'product_id', 'business_id'], { name: 'vigil_daily_date_product_business' });
    await queryInterface.addIndex('vigil_daily_metrics', ['date', 'product_id', 'tool_name'], { name: 'vigil_daily_date_product_tool' });
    await queryInterface.addIndex('vigil_daily_metrics', ['date', 'product_id', 'ai_provider'], { name: 'vigil_daily_date_product_provider' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vigil_daily_metrics');
  },
};
