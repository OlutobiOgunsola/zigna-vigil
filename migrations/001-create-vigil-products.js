module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vigil_products', {
      id: { type: Sequelize.TINYINT, primaryKey: true, autoIncrement: true },
      slug: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      display_name: { type: Sequelize.STRING(100), allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.bulkInsert('vigil_products', [
      { id: 1, slug: 'zignalyft', display_name: 'ZignaLyft', is_active: true, created_at: new Date() },
      { id: 2, slug: 'zignastay', display_name: 'ZignaStay', is_active: true, created_at: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vigil_products');
  },
};
