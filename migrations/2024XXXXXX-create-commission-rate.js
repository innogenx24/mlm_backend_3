'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CommissionRates', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      role_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Roles',
          key: 'id'
        },
        allowNull: false
      },
      commission_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Insert example data
    await queryInterface.bulkInsert('CommissionRates', [
      { role_id: 2, commission_rate: 10.00 }, // Master Distributor
      { role_id: 3, commission_rate: 7.50 },  // Super Distributor
      { role_id: 4, commission_rate: 5.00 }   // Distributor
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CommissionRates');
  }
};
