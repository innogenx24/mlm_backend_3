'use strict';

module.exports = (sequelize, DataTypes) => {
  const OrderLimit = sequelize.define('OrderLimit', {
    hours: {
      type: DataTypes.INTEGER,
      allowNull: false,  // Ensure this field is required
    },
    days: {
      type: DataTypes.INTEGER,
      allowNull: false,  // Ensure this field is required
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,  // Ensure role is a required field
    },
  }, {
    tableName: 'order_limits',
    timestamps: true,  // If using createdAt and updatedAt fields
  });

  return OrderLimit;
};
