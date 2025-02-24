const { Announcement, User, Notification, FcmToken} = require('../../../models');
const { Op } = require('sequelize');
const admin = require("../../config/firebaseAdmin");
const { chunk } = require("lodash");

exports.getAnnouncements = async (req, res) => {
  try {
    const { role_name } = req.user; // Assume role_name is available in req.user

    // Check if the user is an admin (this can be based on role_name or a specific flag like isAdmin)
    if (role_name === 'Admin') {
      // If admin, fetch all announcements
      const announcements = await Announcement.findAll();

      return res.status(200).json({
        success: true,
        data: announcements,
      });
    }

    const whereClause = {
      receiver: {
        [Op.like]: `%${role_name}%`, 
      },
    };

    // Fetch announcements with the role_name condition
    const announcements = await Announcement.findAll({
      where: whereClause,
    });

    return res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error.message,
    });
  }
};


// Get an announcement by ID
exports.getByIdAnnouncement = async (req, res) => {
  const { id } = req.params;
  try {
    const announcement = await Announcement.findByPk(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement',
      error: error.message,
    });
  }
};

// controller.js

// Create a new announcement
// exports.createAnnouncement = async (req, res) => {
//   try {
//     const {
//       documentID,
//       heading,
//       description,
//       link,
//       receiver,
      
//     } = req.body;

//     if (!documentID || !heading || !receiver) {
//       return res.status(400).json({
//         success: false,
//         message: 'Document ID, heading, and receiver are required fields.',
//       });
//     }

//     const announcement = await Announcement.create({
//       documentID,
//       heading,
//       description,
//       link,
//       receiver,
//       image: req.file ? req.file.filename : null,   
//     });

//     // Emit event for new announcement using `req.io`
//     req.io.emit('new_announcement', announcement);

//     ///////////////
//     const parsedReceiver = typeof receiver === 'string' ? JSON.parse(receiver) : receiver;

//     if (parsedReceiver.length > 0) {
//       // Find all users whose roles match the roles in `receiver`
//       const users = await User.findAll({
//         where: {
//           role_name: {
//             [Op.in]: parsedReceiver, // Match role names in the `receiver` array
//           },
//         },
//         attributes: ['id', 'username', 'full_name'],
//       });

//       const notifications = users.map((user) => ({
//         user_id: user.id, 
//         message: `New Announcement is received: ${heading}`, 
//         is_read: false, 
//         created_at: new Date(), 
//         detail: {
//           announcement_id:announcement.id,
//           link,
//           receiver: parsedReceiver,
//           user_name:user.full_name,
//           image: req.file ? req.file.filename : null,
//           type:"announcement"
//         },
//       }));

//       // Insert notifications in bulk
//       await Notification.bulkCreate(notifications);
//     }


//     return res.status(201).json({
//       success: true,
//       data: announcement,
//     });
//   } catch (error) {
//     console.error('Error creating announcement:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to create announcement',
//       error: error.message,
//     });
//   }
// };


// Create a new announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const {
      documentID,
      heading,
      description,
      link,
      receiver,

    } = req.body;

    if (!documentID || !heading || !receiver) {
      return res.status(400).json({
        success: false,
        message: 'Document ID, heading, and receiver are required fields.',
      });
    }

    const announcement = await Announcement.create({
      documentID,
      heading,
      description,
      link,
      receiver,
      image: req.file ? req.file.filename : null,
    });

    // Emit event for new announcement using `req.io`
    req.io.emit('new_announcement', announcement);

    ///////////////
    const parsedReceiver = typeof receiver === 'string' ? JSON.parse(receiver) : receiver;

    if (parsedReceiver.length > 0) {
      // Find all users whose roles match the roles in `receiver`
      const users = await User.findAll({
        where: {
          role_name: {
            [Op.in]: parsedReceiver, // Match role names in the `receiver` array
          },
        },
        attributes: ['id', 'username', 'full_name'],
      });

      const notifications = users.map((user) => ({
        user_id: user.id,
        message: `New Announcement is received: ${heading}`,
        is_read: false,
        created_at: new Date(),
        detail: {
          announcement_id: announcement.id,
          link,
          receiver: parsedReceiver,
          user_name: user.full_name,
          image: req.file ? req.file.filename : null,
          type: "announcement"
        },
      }));

      // Insert notifications in bulk
      // await Notification.bulkCreate(notifications, { individualHooks: false });
      const insertedNotifications = await Notification.bulkCreate(notifications, { returning: true });

      //============ **********FOR PUSH Notification**********==========//

      // Get user IDs from the inserted notifications (Only valid users)
      const userIds = insertedNotifications.map(notif => notif.user_id);

      const userTokens = await FcmToken.findAll({
        where: { user_id: { [Op.in]: userIds } },
        attributes: ["user_id", "token"],
      });

      // Remove duplicate tokens and null values
      let tokens = [...new Set(userTokens.map(t => t.token))].filter(token => token);

      if (tokens.length > 0) {
        // Create a map of user notifications
        const notificationMap = insertedNotifications.reduce((map, notification) => {
          map[notification.user_id] = notification;
          return map;
        }, {});
        // Firebase can only send a max of 500 tokens per request, so we batch them
        const chunkSize = 500;
        // Send push notifications
        for (let i = 0; i < tokens.length; i += chunkSize) {
          const batchTokens = tokens.slice(i, i + chunkSize);

          const message = {
            notification: {
              title: heading,
              body: description || "You have a new announcement!",
            },
            data: {
              type: "announcement",
              documentID,
              notification_id: String(notificationMap[userIds[i]]?.id || ""),
              notification_message: notificationMap[userIds[i]]?.message || "",
              notification_detail: JSON.stringify(notificationMap[userIds[i]]?.detail || {}),
            },
            android: { notification: { sound: "default" } },
            apns: { payload: { aps: { sound: "default" } } },
            tokens: batchTokens,
          };

          try {
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`Push notifications sent! Success: ${response.successCount}, Failure: ${response.failureCount}`);
          } catch (err) {
            console.error("Error sending push notifications:", err.message);
          }
        }
      } else {
        console.warn("No valid FCM tokens found. Skipping push notifications.");

      }
      //=======*** push notification End ***===========//
    }
    return res.status(201).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
      error: error.message,
    });
  }
};




// Update an announcement by ID
exports.updateByIdAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { documentID, heading, description, link, receiver } = req.body;

  try {
    // Find the announcement by ID
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Ensure description is not empty
    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description cannot be empty",
      });
    }

    // Parse receiver if it's a stringified JSON
    let parsedReceiver = receiver;
    if (typeof receiver === "string") {
      parsedReceiver = JSON.parse(receiver);
    }

    // Validate receiver is an array
    if (!Array.isArray(parsedReceiver)) {
      return res.status(400).json({
        success: false,
        message: "Receiver must be an array of roles.",
      });
    }

    // Update fields
    announcement.documentID = documentID || announcement.documentID;
    announcement.heading = heading || announcement.heading;
    announcement.description = description || announcement.description;
    announcement.link = link || null;
    announcement.receiver = JSON.stringify(parsedReceiver);

    // Handle file upload if present
    if (req.file) {
      announcement.image = req.file.filename;
    }

    await announcement.save();

    // Emit the 'update_announcement' event
    req.io.emit("update_announcement", announcement);

    // Find users with roles matching the receiver array
    if (parsedReceiver.length > 0) {
      // Remove existing notifications for this announcement
      await Notification.destroy({
        where: {
          "detail.announcement_id": announcement.id,
        },
      });

      const users = await User.findAll({
        where: {
          role_name: {
            [Op.in]: parsedReceiver,
          },
        },
        attributes: ["id", "username", "full_name"],
      });

      // Create notifications for the updated announcement
      const notifications = users.map((user) => ({
        user_id: user.id,
        message: `New Announcement is received: ${heading}`,
        is_read: false,
        created_at: new Date(),
        detail: {
          announcement_id: announcement.id,
          link,
          receiver: parsedReceiver,
          image: req.file ? req.file.filename : announcement.image,
          type: "announcement",
        },
      }));

      // Insert notifications in bulk
      await Notification.bulkCreate(notifications);
    }

    // Respond with the updated announcement
    return res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error("Error updating announcement:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update announcement",
      error: error.message,
    });
  }
};



// Delete an announcement by ID
exports.deleteByIdAnnouncement = async (req, res) => {
  const { id } = req.params;

  try {
    const announcement = await Announcement.findByPk(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    await Notification.destroy({
      where: {
        "detail.announcement_id": id, 
      },
    });

    await announcement.destroy();

    req.io.emit('delete_announcement', { id });

    return res.status(200).json({
      success: true,
      message: 'Announcement and related notifications deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
      error: error.message,
    });
  }
};

