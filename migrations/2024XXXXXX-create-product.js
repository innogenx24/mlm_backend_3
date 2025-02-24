'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Products', 'image', {
      type: Sequelize.STRING,
      allowNull: false
    });
    await queryInterface.addColumn('Products', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('Products', 'productVolume', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });
    await queryInterface.addColumn('Products', 'mrpPriceCustomer', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });
    await queryInterface.addColumn('Products', 'adoPrice', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });
    await queryInterface.addColumn('Products', 'mdPrice', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });
    await queryInterface.addColumn('Products', 'sdPrice', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });
    await queryInterface.addColumn('Products', 'distributorPrice', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });
    await queryInterface.addColumn('Products', 'autoUpdate', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });
    await queryInterface.addColumn('Products', 'status', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
    await queryInterface.addColumn('products', 'createdBy', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'admins',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Products', 'image');
    await queryInterface.removeColumn('Products', 'description');
    await queryInterface.removeColumn('Products', 'productVolume');
    await queryInterface.removeColumn('Products', 'price');
    await queryInterface.removeColumn('Products', 'adoPrice');
    await queryInterface.removeColumn('Products', 'mdPrice');
    await queryInterface.removeColumn('Products', 'sdPrice');
    await queryInterface.removeColumn('Products', 'distributorPrice');
    await queryInterface.removeColumn('Products', 'autoUpdate');
    await queryInterface.removeColumn('Products', 'status');
  }
};
