module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vigil_error_logs', {
      id: { type: Sequelize.CHAR(36), primaryKey: true },
      request_id: { type: Sequelize.STRING(36), allowNull: true },
      session_id: { type: Sequelize.CHAR(36), allowNull: true },
      product_id: { type: Sequelize.TINYINT, allowNull: true, references: { model: 'vigil_products', key: 'id' } },
      product_slug: { type: Sequelize.STRING(50), allowNull: true },
      business_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      business_name: { type: Sequelize.STRING(255), allowNull: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      user_fullname: { type: Sequelize.STRING(255), allowNull: true },
      role: { type: Sequelize.STRING(50), allowNull: true },
      error_code: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      error_name: { type: Sequelize.STRING(100), allowNull: false },
      error_message: { type: Sequelize.TEXT, allowNull: false },
      error_stack: { type: Sequelize.TEXT, allowNull: true },
      source: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'unknown' },
      tool_name: { type: Sequelize.STRING(100), allowNull: true },
      ai_provider: { type: Sequelize.STRING(50), allowNull: true },
      endpoint: { type: Sequelize.STRING(255), allowNull: true },
      method: { type: Sequelize.STRING(10), allowNull: true },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      user_agent: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('vigil_error_logs', ['product_id', 'created_at'], { name: 'vigil_errors_product_created' });
    await queryInterface.addIndex('vigil_error_logs', ['error_code'], { name: 'vigil_errors_code' });
    await queryInterface.addIndex('vigil_error_logs', ['source'], { name: 'vigil_errors_source' });
    await queryInterface.addIndex('vigil_error_logs', ['user_id', 'created_at'], { name: 'vigil_errors_user_created' });
    await queryInterface.addIndex('vigil_error_logs', ['created_at'], { name: 'vigil_errors_created' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vigil_error_logs');
  },
};
