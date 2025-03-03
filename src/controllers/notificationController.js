// const admin = require("../config/firebaseAdmin"); // Firebase Admin SDK
// const { FcmToken, Notification } = require("../../models"); // Import models


// //** properly working code firebase push notification handling */
// exports.sendNotification = async (req, res) => {
//   try {
//     const { user_id } = req.body;

//     if (!user_id) {
//       return res.status(400).json({ message: "User ID is required" });
//     }

//     const latestNotification = await Notification.findOne({
//       where: { user_id, status: "Active" },
//       order: [["created_at", "DESC"]],
//     });

//     if (!latestNotification) {
//       return res.status(404).json({ message: "No active notifications found" });
//     }

//     const title = latestNotification.message || "New Notification";
//     const body = latestNotification.detail?.type || "You have a new update!";

//     const userTokens = await FcmToken.findAll({
//       where: { user_id },
//       attributes: ["token"],
//     });

//     if (!userTokens || userTokens.length === 0) {
//       return res.status(404).json({ message: "User's FCM tokens not found" });
//     }

//     const message = {
//       notification: { title, body },
//       data: { user_id: String(user_id) },
//       android: { notification: { sound: "default" } },
//       apns: { payload: { aps: { sound: "default" } } },
//     };

//     const sentTokens = new Set(); // Prevent duplicate tokens
//     const sendPromises = userTokens
//       .filter(userToken => !sentTokens.has(userToken.token)) // Avoid duplicates
//       .map(userToken => {
//         sentTokens.add(userToken.token);
//         return admin.messaging().send({
//           ...message,
//           token: userToken.token,
//         });
//       });

//     await Promise.all(sendPromises);

//     res.status(200).json({
//       message: "Notification sent successfully",
//       success: true,
//       notification: { title, body },
//     });
//   } catch (error) {
//     console.error("Error sending notification:", error);
//     res.status(500).json({ message: "Failed to send notification", error: error.message });
//   }
// };



















// Send Notification to a Specific User
// exports.sendNotification = async (req, res) => {
//   try {
//     const { user_id } = req.body;

//     if (!user_id) {
//       return res.status(400).json({ message: "User ID is required" });
//     }

//     // Fetch the latest notification for the user
//     const latestNotification = await Notification.findOne({
//       where: { user_id, status: "Active" },
//       order: [["created_at", "DESC"]],
//     });

//     if (!latestNotification) {
//       return res.status(404).json({ message: "No active notifications found for the user" });
//     }

//     const title = latestNotification.message || "New Notification";
//     const body = latestNotification.detail?.type || "You have a new update!";

//     // Fetch all FCM tokens for the given user_id (support multiple tokens)
//     const userTokens = await FcmToken.findAll({
//       where: { user_id },
//       attributes: ["token"],
//     });

//     if (!userTokens || userTokens.length === 0) {
//       return res.status(404).json({ message: "User's FCM tokens not found" });
//     }

//     // Prepare the notification payload
//     const message = {
//       notification: { title, body },
//       data: { user_id: String(user_id) },
//       android: { notification: { sound: "default" } },
//       apns: { payload: { aps: { sound: "default" } } },
//     };

//     // Send notification to all tokens
//     const sendPromises = userTokens.map(userToken => {
//       return admin.messaging().send({
//         ...message,
//         token: userToken.token, // Send to each token
//       });
//     });

//     // Wait for all notifications to be sent
//     await Promise.all(sendPromises);

//     res.status(200).json({
//       message: "Notification sent to all devices successfully",
//       success: true,
//       notification: { title, body },
//     });
//   } catch (error) {
//     console.error("Error sending notification:", error);
//     res.status(500).json({ message: "Failed to send notification", error: error.message });
//   }
// };












// exports.sendNotification = async (req, res) => {
//   try {
//     const { user_id } = req.body;

//     if (!user_id) {
//       return res.status(400).json({ message: "User ID is required" });
//     }

//     // Fetch the latest notification for the user
//     const latestNotification = await Notification.findOne({
//       where: { user_id, status: "Active" },
//       order: [["created_at", "DESC"]],
//     });

//     if (!latestNotification) {
//       return res.status(404).json({ message: "No active notifications found for the user" });
//     }

//     const title = latestNotification.message || "New Notification";
//     const body = latestNotification.detail?.type || "You have a new update!";

//     // Fetch the FCM token for the given user_id
//     const userToken = await FcmToken.findOne({
//       where: { user_id },
//       attributes: ["token"],
//     });
//     if (!userToken || !userToken.token) return res.status(404).json({ message: "User's FCM token not found" });

//     if (!userToken || !userToken.token) {
//       return res.status(404).json({ message: "User's FCM token not found" });
//     }

//     // Notification Payload
//     const message = {
//       token: userToken.token,
//       notification: { title, body },
//       data: { user_id: String(user_id) },
//       android: { notification: { sound: "default" } },
//       apns: { payload: { aps: { sound: "default" } } },
//     };

//     // Send the notification via Firebase
//     await admin.messaging().send(message);

//     res.status(200).json({
//       message: "Notification sent successfully",
//       success: true,
//       notification: { title, body },
//     });
//   } catch (error) {
//     console.error("Error sending notification:", error);
//     res.status(500).json({ message: "Failed to send notification", error: error.message });
//   }
// };
















const admin = require("../config/firebaseAdmin"); // Firebase Admin SDK
const { FcmToken, Notification,User } = require("../../models"); // Import models

// Send Notification to a Specific User
exports.sendNotification = async (req, res) => {
  try {

    let USER_ROLE_NAME = req.user.role_name;
    let user_id = req.user.id;

    if (USER_ROLE_NAME === "Admin") {
      user_id = 1;
    }

    // Fetch the latest notification for the user
    const latestNotification = await Notification.findOne({
      where: { user_id, status: "Active" },
      order: [["created_at", "DESC"]], // Get the most recent notification
    });

    if (!latestNotification) {
      return res.status(404).json({ message: "No active notifications found for the user" });
    }

    const title = latestNotification.message || "New Notification";
    const body = latestNotification.detail.type || "You have a new update!";

    // Fetch the FCM token for the given user_id
    const userToken = await FcmToken.findOne({
      where: { user_id },
      attributes: ["token"],
    });

    if (!userToken || !userToken.token) {
      return res.status(404).json({ message: "User's FCM token not found" });
    }

    // Notification Payload
    const message = {
      token: userToken.token,
      notification: { title, body },
      data: { user_id: String(user_id) },
      android: { notification: { sound: "default" } },
      apns: { payload: { aps: { sound: "default" } } },
    };

    // Send the notification via Firebase
    await admin.messaging().send(message);

    res.status(200).json({
      message: "Notification sent successfully",
      success: true,
      notification: { title, body }, // Return notification details
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ message: "Failed to send notification", error: error.message });
  }
};
