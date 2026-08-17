'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vigil_usage', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      gym_id: { type: Sequelize.INTEGER, allowNull: true },
      hotel_id: { type: Sequelize.INTEGER, allowNull: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      month: { type: Sequelize.STRING(7), allowNull: false },
      tool_name: { type: Sequelize.STRING(255), allowNull: false },
      ai_provider: { type: Sequelize.STRING(50), allowNull: false },
      ai_model: { type: Sequelize.STRING(100), allowNull: false },
      input_tokens: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      output_tokens: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      tool_executed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      duration_ms: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('vigil_usage', ['gym_id', 'month'], { name: 'vigil_usage_gym_month' });
    await queryInterface.addIndex('vigil_usage', ['hotel_id', 'month'], { name: 'vigil_usage_hotel_month' });
    await queryInterface.addIndex('vigil_usage', ['user_id', 'month'], { name: 'vigil_usage_user_month' });
    await queryInterface.addIndex('vigil_usage', ['tool_name'], { name: 'vigil_usage_tool' });
    await queryInterface.addIndex('vigil_usage', ['created_at'], { name: 'vigil_usage_created' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vigil_usage');
  },
};
