'use strict';

module.exports = (sequelize, DataTypes) => {
  const Sale = sequelize.define('Sale', {
    product_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'products',
        key: 'id'
      },
      allowNull: true
    },
    
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      },
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  });

  Sale.associate = (models) => {
    // Associate with Product
    Sale.belongsTo(models.Product, { foreignKey: 'product_id' });

    // Associate with User
    Sale.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return Sale;
};
