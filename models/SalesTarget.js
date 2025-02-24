'use strict';

module.exports = (sequelize, DataTypes) => {
  const SalesStockTarget = sequelize.define(
    'SalesStockTarget',
    {
      role_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      target: {
        type: DataTypes.DECIMAL(15, 2), 
        allowNull: false,
      },
      stock_target: {
        type: DataTypes.DECIMAL(15, 2), 
        allowNull: false,
      },
      duration: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'sales_stock_targets', 
      timestamps: true, 
      createdAt: 'createdAt', 
      updatedAt: 'updatedAt',
    }
  );

  return SalesStockTarget;
};
