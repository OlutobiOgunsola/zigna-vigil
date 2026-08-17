module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vigil_messages', {
      id: { type: Sequelize.CHAR(36), primaryKey: true },
      session_id: { type: Sequelize.CHAR(36), allowNull: false, references: { model: 'vigil_sessions', key: 'id' } },
      product_id: { type: Sequelize.TINYINT, allowNull: false, references: { model: 'vigil_products', key: 'id' } },
      product_slug: { type: Sequelize.STRING(50), allowNull: false },
      business_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      business_name: { type: Sequelize.STRING(255), allowNull: false },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      user_fullname: { type: Sequelize.STRING(255), allowNull: false },
      user_email: { type: Sequelize.STRING(255), allowNull: true },
      role: { type: Sequelize.STRING(50), allowNull: false },
      request_id: { type: Sequelize.STRING(36), allowNull: false },
      direction: { type: Sequelize.ENUM('inbound', 'outbound'), allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      ai_provider: { type: Sequelize.STRING(50), allowNull: true },
      ai_model: { type: Sequelize.STRING(100), allowNull: true },
      input_tokens: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      output_tokens: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      duration_ms: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      status: { type: Sequelize.ENUM('success', 'error', 'timeout'), allowNull: false, defaultValue: 'success' },
      error_message: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('vigil_messages', ['session_id'], { name: 'vigil_messages_session' });
    await queryInterface.addIndex('vigil_messages', ['product_id', 'business_id', 'created_at'], { name: 'vigil_messages_product_business_created' });
    await queryInterface.addIndex('vigil_messages', ['product_id', 'user_id', 'created_at'], { name: 'vigil_messages_product_user_created' });
    await queryInterface.addIndex('vigil_messages', ['created_at'], { name: 'vigil_messages_created' });
    await queryInterface.addIndex('vigil_messages', ['ai_provider'], { name: 'vigil_messages_provider' });
    await queryInterface.addIndex('vigil_messages', ['status'], { name: 'vigil_messages_status' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vigil_messages');
  },
};
