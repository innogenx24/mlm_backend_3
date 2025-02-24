'use strict';

module.exports = (sequelize, DataTypes) => {
  const Commission = sequelize.define('Commission', {
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      },
      allowNull: true
    },
    sale_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'sales',
        key: 'id'
      },
      allowNull: true
    },
    commission: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  });

  Commission.associate = (models) => {
    // Associate with User
    Commission.belongsTo(models.User, { foreignKey: 'user_id' });

    // Associate with Sale
    Commission.belongsTo(models.Sale, { foreignKey: 'sale_id' });
  };

  return Commission;
};
