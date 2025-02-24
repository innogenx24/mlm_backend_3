const { SalesTarget, Order, Product, OrderItem, User, Notification } = require('../../../../models');
const { Op } = require('sequelize');
const admin = require("../../../config/firebaseAdmin"); 
const { FcmToken } = require("../../../../models"); 

exports.sendMonthlyNotifications = async () => {
  try {
    const users = await User.findAll();

    for (const user of users) {
      const { id: user_id, role_name } = user;

      // Reuse the sales target calculation logic
      const salesTargets = await SalesTarget.findAll();
      let totalMonthlyTarget = 0;

      salesTargets.forEach((target) => {
        let productData;
        if (typeof target.product_data === 'string') {
          productData = JSON.parse(target.product_data);
        } else {
          productData = target.product_data;
        }

        productData.forEach((data) => {
          if (data.role === role_name) {
            const targetValue = parseFloat(data.target) || 0;
            const duration = data.duration ? data.duration.toLowerCase() : '';

            if (duration.includes('month')) {
              const months = parseInt(duration) || 1;
              totalMonthlyTarget += targetValue / months;
            }
          }
        });
      });

      const acceptedOrders = await Order.findAll({
        where: {
          higher_role_id: user_id,
          status: 'Accepted',
        },
        include: [
          {
            model: OrderItem,
            as: 'OrderItems',
            include: {
              model: Product,
              as: 'product',
              required: true,
            },
          },
        ],
      });

      let totalAchievementAmount = 0;

      for (const order of acceptedOrders) {
        for (const orderItem of order.OrderItems) {
          const product = orderItem.product;

          let price = 0;
          switch (role_name) {
            case 'Super Distributor':
              price = product.sdPrice || 0;
              break;
            case 'Distributor':
              price = product.distributorPrice || 0;
              break;
            case 'Master Distributor':
              price = product.mdPrice || 0;
              break;
            case 'Area Development Officer':
              price = product.adoPrice || 0;
              break;
            case 'Customer':
              price = product.price || 0;
              break;
            default:
              price = 0;
              break;
          }

          const orderTotal = price * (parseInt(orderItem.quantity) || 0);
          totalAchievementAmount += orderTotal;
        }
      }

      const pendingAmount = totalMonthlyTarget - totalAchievementAmount;
      let achievementAmountPercent = totalMonthlyTarget > 0
        ? (totalAchievementAmount / totalMonthlyTarget) * 100
        : 0;

      if (achievementAmountPercent < 100) {
        const message = `Hello ${role_name}, you have achieved ${achievementAmountPercent.toFixed(
          2
        )}% of your target this month. Please aim to achieve the remaining ${(
          100 - achievementAmountPercent
        ).toFixed(2)}%.`;
        const gallery = `1733391593433.jpeg`;

        await Notification.create({
          user_id,
          message,
          is_read: false,
          photo:gallery,
          created_at: new Date(),
          detail: {
            totalMonthlyTarget,
            achievementAmountPercent,
            type:"achivement"
          },
        });

        console.log(`Notification sent to user ID: ${user_id}`);
      }
    }

    console.log('Monthly notifications sent successfully');
  } catch (error) {
    console.error('Error sending monthly notifications:', error);
  }
};


////////////get notification /////////////////////



const updateNotifications = async () => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 60));

    await Notification.update(
      { status: 'Inactive' },
      {
        where: {
          created_at: {
            [Op.lte]: thirtyDaysAgo,
          },
          status: 'Active',
        },
      }
    );

    console.log('Notifications updated successfully.');
  } catch (error) {
    console.error('Error updating notifications:', error);
  }
};

// setInterval(updateNotifications, 20  * 1000);



exports.getNotifications = async (req, res) => {
  const { user_id } = req.params;

  try {
    const user = await User.findOne({
      where: { id: user_id },
      attributes: ['role_name'], 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const whereClause = {
      status: 'Active', 
    };

    if (user.role_name === 'Admin') {
      whereClause.user_id = 1;
    } else {
      whereClause.user_id = user_id;
    }

    const notifications = await Notification.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
    });

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No notifications found.',
      });
    }

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications.',
      error: error.message,
    });
  }
};

exports.sendNotification = async (req, res) => {
  const { user_id, title, message } = req.body;

  try {
    // Fetch the user's FCM token from fcm_tokens table
    const fcmToken = await FcmToken.findOne({
      where: { user_id },
      attributes: ["token"],
      order: [["created_at", "DESC"]], // Get the latest token
    });

    if (!fcmToken || !fcmToken.token) {
      return res.status(400).json({ success: false, message: "User FCM token not found." });
    }

    const payload = {
      token: fcmToken.token, // Use token from fcm_tokens table
      notification: {
        title: title,
        body: message,
      },
      android: {
        notification: {
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    // Send notification using Firebase Admin SDK
    await admin.messaging().send(payload);

    // Save notification to database
    await Notification.create({ user_id, title, message, status: "Active" });

    return res.status(200).json({ success: true, message: "Notification sent successfully!" });
  } catch (error) {
    console.error("FCM Error:", error);
    return res.status(500).json({ success: false, message: "Failed to send notification.", error: error.message });
  }
};



// exports.getNotifications = async (req, res) => {
//   const { user_id } = req.params;

//   try {
//     // Fetch the user role using the user_id
//     const user = await User.findOne({
//       where: { id: user_id },
//       attributes: ['role_name'], // We only need the role_name
//     });

//     // If the user does not exist, return an error
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found.',
//       });
//     }

//     // Check if the user is an Admin
//     if (user.role_name === 'Admin') {
//       // Admin should receive all notifications where user_id is 1 (or any other criteria for Admin)
//       const notifications = await Notification.findAll({
//         where: { user_id: 1 }, // Admin sees notifications for user_id = 1
//         order: [['created_at', 'DESC']], // Order by created_at, newest first
//       });

//       // If no notifications found for Admin, return a message
//       if (!notifications || notifications.length === 0) {
//         return res.status(404).json({
//           success: false,
//           message: 'No notifications found for this user.',
//         });
//       }

//       // Respond with the notifications for Admin
//       return res.status(200).json({
//         success: true,
//         notifications,
//       });
//     } else {
//       // Non-Admin users will see their own notifications
//       const notifications = await Notification.findAll({
//         where: { user_id },
//         order: [['created_at', 'DESC']], // Order by created_at, newest first
//       });

//       // If no notifications found for the particular user, return a message
//       if (!notifications || notifications.length === 0) {
//         return res.status(404).json({
//           success: false,
//           message: 'No notifications found for this user.',
//         });
//       }

//       // Respond with the notifications for the non-Admin user
//       return res.status(200).json({
//         success: true,
//         notifications,
//       });
//     }
//   } catch (error) {
//     console.error('Error fetching notifications:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch notifications.',
//       error: error.message,
//     });
//   }
// };





// Notification controller to get notifications for a specific user
// exports.getNotifications = async (req, res) => {
//     const { user_id } = req.params;
  
//     try {
//       // Fetch unread notifications for the given user
//       const notifications = await Notification.findAll({
//         where: { user_id },
//         order: [['created_at', 'DESC']], // Order by created_at, newest first
//       });
  
//       // If no notifications found, return a message
//       if (!notifications || notifications.length === 0) {
//         return res.status(404).json({
//           success: false,
//           message: 'No notifications found for this user.',
//         });
//       }
  
//       // Respond with the notifications
//       return res.status(200).json({
//         success: true,
//         notifications,
//       });
//     } catch (error) {
//       console.error('Error fetching notifications:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to fetch notifications.',
//         error: error.message,
//       });
//     }
//   };
  
  
  /////////////as readed? ////////////////
  // Notification controller to mark notifications as read
  // exports.markNotificationsAsRead = async (req, res) => {
  //   const { user_id } = req.params;
  
  //   try {
  //     // Update all unread notifications for the user to be read
  //     const updatedNotifications = await Notification.update(
  //       { is_read: true },
  //       { where: { user_id, is_read: false } }
  //     );
  
  //     // If no notifications were updated
  //     if (updatedNotifications[0] === 0) {
  //       return res.status(404).json({
  //         success: false,
  //         message: 'No unread notifications found.',
  //       });
  //     }
  
  //     return res.status(200).json({
  //       success: true,
  //       message: 'Notifications marked as read.',
  //     });
  //   } catch (error) {
  //     console.error('Error marking notifications as read:', error);
  //     return res.status(500).json({
  //       success: false,
  //       message: 'Failed to mark notifications as read.',
  //       error: error.message,
  //     });
  //   }
  // };





  exports.markNotificationAsRead = async (req, res) => {
    const { user_id, notification_id } = req.params;
    
    try {
      // Fetch the user role using the user_id
      const user = await User.findOne({
        where: { id: user_id },
        attributes: ['role_name'], 
      });

      // If the user does not exist, return an error
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }

      // Check if the user is an Admin
      let targetUserId = user_id;

      if (user.role_name === 'Admin') {
        targetUserId = 1; 
      }

      // Find the notification by user_id and notification_id
      const notification = await Notification.findOne({
        where: { user_id: targetUserId, id: notification_id, is_read: false },
      });

      // If notification not found
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or already marked as read.',
        });
      }

      // Mark the specific notification as read
      await Notification.update(
        { is_read: true },
        { where: { id: notification_id } }
      );

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read.',
        error: error.message,
      });
    }
};


  // exports.markNotificationAsRead = async (req, res) => {
  //   const { user_id, notification_id } = req.params; 
    
  //   try {
  //     // Find the notification by user_id and notification_id
  //     const notification = await Notification.findOne({
  //       where: { user_id, id: notification_id, is_read: false }
  //     });
  
  //     // If notification not found
  //     if (!notification) {
  //       return res.status(404).json({
  //         success: false,
  //         message: 'Notification not found or already marked as read.',
  //       });
  //     }
  
  //     // Mark the specific notification as read
  //     await Notification.update(
  //       { is_read: true },
  //       { where: { id: notification_id } }
  //     );
  
  //     return res.status(200).json({
  //       success: true,
  //       message: 'Notification marked as read.',
  //     });
  //   } catch (error) {
  //     console.error('Error marking notification as read:', error);
  //     return res.status(500).json({
  //       success: false,
  //       message: 'Failed to mark notification as read.',
  //       error: error.message,
  //     });
  //   }
  // };
  
  
  
