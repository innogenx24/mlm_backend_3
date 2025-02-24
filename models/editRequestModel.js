'use strict';

module.exports = (sequelize, DataTypes) => {
  const EditRequest = sequelize.define('EditRequest', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    request_reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    new_mobile_number: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    new_email_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    new_address: {
      type: DataTypes.JSON, // Store address as JSON
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(555), // Image file name or URL
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Rejected', 'Completed'),
      allowNull: false,
      defaultValue: 'Pending',
    },
  }, {
    tableName: 'edit_requests',
    timestamps: true,
    createdAt: 'created_at', // Match the column name in the database
    updatedAt: 'updated_at', // Match the column name in the database
  });

  // Define associations
  EditRequest.associate = (models) => {
    EditRequest.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return EditRequest;
};
