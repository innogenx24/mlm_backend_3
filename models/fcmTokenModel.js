'use strict';

module.exports = (sequelize, DataTypes) => {
  const FcmToken = sequelize.define(
    "FcmToken",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true, // Prevent duplicate tokens
      },
      user_id: {
        //for requirment allonul true
        type: DataTypes.INTEGER,
        allowNull:true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: false,
      tableName: "fcm_tokens",
    }
  );



  return FcmToken;
};








// 'use strict';

// module.exports = (sequelize, DataTypes) => {
//   const FcmToken = sequelize.define(
//     "FcmToken",
//     {
//       id: {
//         type: DataTypes.INTEGER,
//         autoIncrement: true,
//         primaryKey: true,
//       },
//       token: {
//         type: DataTypes.STRING(255),
//         allowNull: false,
//         unique: true,
//       },
//       user_id: {
//         type: DataTypes.INTEGER,
//         allowNull: true,
//       },
//       created_at: {
//         type: DataTypes.DATE,
//         defaultValue: DataTypes.NOW,
//       },
//     },
//     {
//       timestamps: false,
//       tableName: "fcm_tokens",
//     }
//   );

//   return FcmToken;
// };






















// 'use strict';

// module.exports = (sequelize, DataTypes) => {
//   const FcmToken = sequelize.define(
//     "FcmToken",
//     {
//       id: {
//         type: DataTypes.INTEGER,
//         autoIncrement: true,
//         primaryKey: true,
//       },
//       token: {
//         type: DataTypes.STRING(255),
//         allowNull: false,
//         unique: true,
//       },
//       user_id: {
//         type: DataTypes.INTEGER,
//         allowNull: true,
//         // references: {
//         //   model: "users", // Ensure this matches the actual users table name
//         //   key: "id",
//         // },
//         // onDelete: "CASCADE",
//       },
//       created_at: {
//         type: DataTypes.DATE,
//         defaultValue: DataTypes.NOW,
//       },
//     },
//     {
//       timestamps: false,
//       tableName: "fcm_tokens",
//     }
//   );

//   // FcmToken.associate = (models) => {
//   //   FcmToken.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
//   // };

//   return FcmToken;
// };
