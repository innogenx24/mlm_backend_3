'use strict';

module.exports = (sequelize, DataTypes) => {
    const Feedback = sequelize.define('Feedback', {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'orders',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        rating: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
                isDecimal: true,
            },
        },

        comments: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        feedback_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'feedback',
        timestamps: false,
    });

    // Associations
    Feedback.associate = (models) => {
        Feedback.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        // Feedback.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
        Feedback.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
        Feedback.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    };

    return Feedback;
};
