'use strict';

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    order_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: true, 
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    coupon_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    discount_applied: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    final_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    final_price: {
      type: DataTypes.DECIMAL(30, 4),
      allowNull: true,
    },
    total_order_quantity: { 
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Completed', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Pending',
    },
    requested_by_role: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    higher_role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'orders',
    timestamps: true,
  });

  // Associations
  Order.associate = (models) => {
    // Order belongs to a User (customer)
    Order.belongsTo(models.User, {
      foreignKey: 'user_id', // The column in Order table that references User
      as: 'customer', // Alias for the included association
    });

    // Order has many OrderItems
    Order.hasMany(models.OrderItem, {
      foreignKey: 'order_id',
      as: 'OrderItems',
    });
  };

  return Order;
};
