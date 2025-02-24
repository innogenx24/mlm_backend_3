const axios = require("axios");


module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      detail: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      photo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "Active",
      },
    },
    {
      tableName: "notifications",
      timestamps: false,
    }
  );

  // Associations
  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  };

  //**  AfterCreate Hook: Send Notification Automatically For Sigle users**//
  Notification.afterCreate(async (notification, options) => {
    if (options.transaction || options.bulk) {
      return; 
    }
    try {
      console.log("New notification created:", notification.message);

      // Send notification for a single user
      await axios.post("https://erp.keramruth.com/api/push-notifications/send", {
        user_id: notification.user_id,
      });

      console.log("Push notification API triggered automatically for user_id:", notification.user_id);
    } catch (error) {
      console.error("Error triggering push notification:", error.message);
    }
  });
  


  return Notification;
};






















// module.exports = (sequelize, DataTypes) => {
//     const Notification = sequelize.define(
//       'Notification',
//       {
//         id: {
//           type: DataTypes.INTEGER,
//           autoIncrement: true,
//           primaryKey: true,
//         },
//         user_id: {
//           type: DataTypes.INTEGER,
//           allowNull: false,
//         },
//         message: {
//           type: DataTypes.TEXT,
//           allowNull: false,
//         },
//         is_read: {
//           type: DataTypes.BOOLEAN,
//           defaultValue: false,
//         },
//         created_at: {
//           type: DataTypes.DATE,
//           defaultValue: DataTypes.NOW,
//         },
//         detail: {
//           type: DataTypes.JSON,
//           allowNull: true, 
//         },
//         photo: {
//           type: DataTypes.STRING,
//           allowNull: true, 
//         },
//         status: {
//           type: DataTypes.STRING,
//           defaultValue: 'Active', 
//         },
//       },
//       {
//         tableName: 'notifications', 
//         timestamps: false, 
//       }
//     );
  
//     // Add associations if required
//     Notification.associate = (models) => {
//       Notification.belongsTo(models.User, {
//         foreignKey: 'user_id',
//         as: 'user',
//       });
//     };
  
//     return Notification;
//   };
  