'use strict';

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true, 
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    quantity_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'INR' 
    },
    product_code: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    stock_quantity: {
      type: DataTypes.INTEGER,  
      allowNull: false, 
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    productVolume: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    adoPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    mdPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    sdPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    distributorPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    customer_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    ADO_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    MD_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    SD_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    distributor_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    autoUpdate: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'admins',
        key: 'id'
      }
    },
    category_name: { 
      type: DataTypes.STRING(225),
      allowNull: true
    },
    fromDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    toDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    isDeleted: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0  
    }
  }, {
    tableName: 'products',
    timestamps: true,
  });

  return Product;
};
