// models/role.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    role_name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'roles',
    timestamps: true 
  });

  Role.associate = (models) => {
    Role.hasMany(models.User, { foreignKey: 'role_id' });
  };

  return Role;
};
