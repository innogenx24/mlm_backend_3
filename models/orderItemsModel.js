'use strict';

module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity_type: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    baseprice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    final_price: {
      type: DataTypes.DECIMAL(30, 4),
      allowNull: false
    },
    item_volume: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
  }, {
    tableName: 'orderitems',
    timestamps: true,
  });

  OrderItem.associate = (models) => {
    // Each OrderItem belongs to one Order
    OrderItem.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
    
    // Each OrderItem belongs to one Product
    OrderItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  };

  return OrderItem;
};
