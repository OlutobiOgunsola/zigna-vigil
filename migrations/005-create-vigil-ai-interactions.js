module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vigil_ai_interactions', {
      id: { type: Sequelize.CHAR(36), primaryKey: true },
      message_id: { type: Sequelize.CHAR(36), allowNull: false, references: { model: 'vigil_messages', key: 'id' } },
      session_id: { type: Sequelize.CHAR(36), allowNull: false },
      product_id: { type: Sequelize.TINYINT, allowNull: false, references: { model: 'vigil_products', key: 'id' } },
      product_slug: { type: Sequelize.STRING(50), allowNull: false },
      business_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      business_name: { type: Sequelize.STRING(255), allowNull: false },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      user_fullname: { type: Sequelize.STRING(255), allowNull: false },
      provider: { type: Sequelize.STRING(50), allowNull: false },
      model: { type: Sequelize.STRING(100), allowNull: false },
      input_tokens: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      output_tokens: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      total_tokens: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      finish_reason: { type: Sequelize.STRING(20), allowNull: true },
      tools_offered: { type: Sequelize.JSON, allowNull: true },
      tool_selected: { type: Sequelize.STRING(100), allowNull: true },
      latency_ms: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      status: { type: Sequelize.ENUM('success', 'error', 'timeout', 'rate_limited'), allowNull: false },
      error_message: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('vigil_ai_interactions', ['provider', 'created_at'], { name: 'vigil_ai_provider_created' });
    await queryInterface.addIndex('vigil_ai_interactions', ['model', 'created_at'], { name: 'vigil_ai_model_created' });
    await queryInterface.addIndex('vigil_ai_interactions', ['message_id'], { name: 'vigil_ai_message' });
    await queryInterface.addIndex('vigil_ai_interactions', ['product_id', 'business_id', 'created_at'], { name: 'vigil_ai_product_business_created' });
    await queryInterface.addIndex('vigil_ai_interactions', ['status'], { name: 'vigil_ai_status' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vigil_ai_interactions');
  },
};
