module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vigil_migrations_applied', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      applied_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.bulkInsert('vigil_migrations_applied', [
      { name: '007-add-metrics-permissions', applied_at: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vigil_migrations_applied');
  },
};
