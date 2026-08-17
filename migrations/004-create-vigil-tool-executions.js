module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vigil_tool_executions', {
      id: { type: Sequelize.CHAR(36), primaryKey: true },
      message_id: { type: Sequelize.CHAR(36), allowNull: false, references: { model: 'vigil_messages', key: 'id' } },
      session_id: { type: Sequelize.CHAR(36), allowNull: false },
      product_id: { type: Sequelize.TINYINT, allowNull: false, references: { model: 'vigil_products', key: 'id' } },
      product_slug: { type: Sequelize.STRING(50), allowNull: false },
      business_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      business_name: { type: Sequelize.STRING(255), allowNull: false },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      user_fullname: { type: Sequelize.STRING(255), allowNull: false },
      tool_name: { type: Sequelize.STRING(100), allowNull: false },
      tool_args: { type: Sequelize.JSON, allowNull: true },
      tool_result_summary: { type: Sequelize.TEXT, allowNull: true },
      tool_status: { type: Sequelize.ENUM('success', 'error', 'timeout', 'forbidden'), allowNull: false },
      tool_error: { type: Sequelize.TEXT, allowNull: true },
      permission_used: { type: Sequelize.STRING(100), allowNull: true },
      duration_ms: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('vigil_tool_executions', ['tool_name', 'created_at'], { name: 'vigil_tool_exec_name_created' });
    await queryInterface.addIndex('vigil_tool_executions', ['message_id'], { name: 'vigil_tool_exec_message' });
    await queryInterface.addIndex('vigil_tool_executions', ['product_id', 'business_id', 'created_at'], { name: 'vigil_tool_exec_product_business_created' });
    await queryInterface.addIndex('vigil_tool_executions', ['tool_status'], { name: 'vigil_tool_exec_status' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vigil_tool_executions');
  },
};
