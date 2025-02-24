'use strict';

module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true, // primary key set on id, not documentID
    },
    documentID: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Keep documentID unique but not primary key
    },
    heading: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    receiver: {
      type: DataTypes.ENUM('All Users', 'Area Development Officer', 'Master Distributor', 'Super Distributor', 'Distributor', 'Customer'),
      allowNull: false,
    },
    autoUpdate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    activateStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    fromDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    toDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imageSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'documents',
    timestamps: true, 
  });

  return Document;
};
