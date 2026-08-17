module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vigil_sessions', {
      id: { type: Sequelize.CHAR(36), primaryKey: true },
      product_id: { type: Sequelize.TINYINT, allowNull: false, references: { model: 'vigil_products', key: 'id' } },
      product_slug: { type: Sequelize.STRING(50), allowNull: false },
      business_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      business_name: { type: Sequelize.STRING(255), allowNull: false },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      user_fullname: { type: Sequelize.STRING(255), allowNull: false },
      user_email: { type: Sequelize.STRING(255), allowNull: true },
      role: { type: Sequelize.STRING(50), allowNull: false },
      started_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      last_active_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      message_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('vigil_sessions', ['product_id', 'business_id', 'started_at'], { name: 'vigil_sessions_product_business_started' });
    await queryInterface.addIndex('vigil_sessions', ['product_id', 'user_id', 'started_at'], { name: 'vigil_sessions_product_user_started' });
    await queryInterface.addIndex('vigil_sessions', ['started_at'], { name: 'vigil_sessions_started' });
    await queryInterface.addIndex('vigil_sessions', ['is_active'], { name: 'vigil_sessions_active' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vigil_sessions');
  },
};
