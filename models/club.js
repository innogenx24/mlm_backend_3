'use strict';

module.exports = (sequelize, DataTypes) => {
  const Club = sequelize.define('Club', {
    club_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    litre_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    tableName: 'club', // The actual table name in the database
    timestamps: true // If you want Sequelize to manage createdAt and updatedAt
  });

  // Define associations (if needed)
  Club.associate = (models) => {
    // Example of association: 
    // Club.hasMany(models.Member, { foreignKey: 'club_id' });
  };

  return Club;
};
