// models/request.js

'use strict';

module.exports = (sequelize, DataTypes) => {
  const Request = sequelize.define('Request', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    current_role: {
      type: DataTypes.ENUM('Distributor', 'Super Distributor', 'Master Distributor', 'ADO'),
      defaultValue: 'Distributor'
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Expired'),
      defaultValue: 'Pending'
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'requests',
    timestamps: false, // Disable automatic timestamp columns
    underscored: true
  });

  // Define any associations if needed
  Request.associate = (models) => {
    // Example association (uncomment if you have a User model)
    // Request.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Request;
};
