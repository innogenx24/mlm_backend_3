// models/coupon.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Coupon = sequelize.define('Coupon', {
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    discount_type: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false
    },
    discount_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    minimum_order_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    expiration_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    max_usage: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'coupons',
    timestamps: false
  });

  return Coupon;
};
