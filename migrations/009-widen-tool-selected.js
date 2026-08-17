'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('vigil_ai_interactions', 'tool_selected', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('vigil_ai_interactions', 'tool_selected', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },
};
