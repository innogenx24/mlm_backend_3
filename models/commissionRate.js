'use strict';

module.exports = (sequelize, DataTypes) => {
  const CommissionRate = sequelize.define('CommissionRate', {
    role_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'roles',
        key: 'id'
      },
      allowNull: false
    },
    commission_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    }
  }, {
    tableName: 'commissionrates', // This explicitly sets the table name
    timestamps: true // Ensure timestamps are managed by Sequelize
  });

  CommissionRate.associate = (models) => {
    // Associate with Role
    CommissionRate.belongsTo(models.Role, { foreignKey: 'role_id' });
  };

  return CommissionRate;
};
