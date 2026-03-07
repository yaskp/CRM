'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('store_transactions');

    if (!tableInfo.manpower_data) {
      await queryInterface.addColumn('store_transactions', 'manpower_data', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!tableInfo.machinery_data) {
      await queryInterface.addColumn('store_transactions', 'machinery_data', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!tableInfo.rmc_logs) {
      await queryInterface.addColumn('store_transactions', 'rmc_logs', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('store_transactions', 'manpower_data');
    await queryInterface.removeColumn('store_transactions', 'machinery_data');
    await queryInterface.removeColumn('store_transactions', 'rmc_logs');
  }
};
