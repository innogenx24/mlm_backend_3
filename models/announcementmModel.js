// models/Announcement.js

'use strict';

module.exports = (sequelize, DataTypes) => {
  const Announcement = sequelize.define('Announcement', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    documentID: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    heading: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    receiver: {
      type: DataTypes.STRING,
      allowNull: false,
    },
   
    image: {
      type: DataTypes.STRING,
      allowNull: true, 
    },
  }, {
    tableName: 'announcements',
    timestamps: true,
  });

  return Announcement;
};
