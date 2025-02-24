'use strict';

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    sector_name: { 
      type: DataTypes.STRING(225),
      allowNull: true
    },
    category_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    parent_category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    timestamps: true,
    tableName: 'category'
  });

  return Category;
};
