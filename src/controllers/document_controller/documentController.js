const { Document, User, Notification, FcmToken } = require('../../../models');
const { Op } = require('sequelize');
const moment = require('moment');  // Import moment.js
const path = require('path');
const fs = require('fs');  // Ensure fs is imported for file operations
const admin = require("../../config/firebaseAdmin");
const { chunk } = require("lodash");

exports.getDocuments = async (req, res) => {
  try {
    const { role_name } = req.user; // Get role directly from the token

    // Base where clause for active documents
    let whereClause = {
      status: 'active', // Only active documents
    };

    // Role-based filtering
    if (role_name !== 'Admin') {
      // Non-admin roles can only see documents relevant to them
      whereClause.receiver = {
        [Op.like]: `%${role_name}%`, // Check if the role is in the receiver field
      };
    }

    // Fetch documents from database based on the whereClause
    const documents = await Document.findAll({
      where: whereClause,
    });

    if (!documents.length) {
      return res.status(404).json({
        success: false,
        message: "No documents found for the user's role",
      });
    }

    // Validate the `receiver` field to ensure it includes the user's role
    const filteredDocuments = documents.filter(doc => {
      try {
        let receivers;

        if (typeof doc.receiver === 'string') {
          receivers = JSON.parse(doc.receiver); // Parse if stored as JSON string
        } else if (Array.isArray(doc.receiver)) {
          receivers = doc.receiver; // Use directly if it's already an array
        } else {
          receivers = [];
        }

        // Check if the user's role exists in the receivers array
        return receivers.some(receiver => receiver.trim() === role_name.trim());
      } catch (error) {
        console.error("Error parsing receiver field:", error);
        return false; // Skip documents with invalid receiver data
      }
    });

    if (!filteredDocuments.length) {
      return res.status(404).json({
        success: false,
        message: "No documents found for the user's role",
      });
    }

    return res.status(200).json({
      success: true,
      data: filteredDocuments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message,
    });
  }
};


exports.getDocumentsAdmin = async (req, res) => {
  try {
    const { receiver } = req.query;
    const whereClause = {
      status: 'active',
      ...(receiver && { receiver }),
    };

    const documents = await Document.findAll({ where: whereClause });

    return res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message,
    });
  }
};

// // Get all documents with optional filtering by receiver
// exports.getDocumentsAdmin = async (req, res) => {
//   try {
//     const { receiver } = req.query; // Extract receiver from query params
//     const whereClause = receiver ? { receiver } : {}; // Set where clause based on receiver

//     const documents = await Document.findAll({ where: whereClause });

//     return res.status(200).json({
//       success: true,
//       data: documents,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch documents',
//       error: error.message,
//     });
//   }
// };

// // Get all documents with optional filtering by receiver
// exports.getDocuments = async (req, res) => {
//   try {
//     const { receiver } = req.query; // Extract receiver from query params
//     const whereClause = receiver ? { receiver } : {}; // Set where clause based on receiver

//     const documents = await Document.findAll({ where: whereClause });

//     return res.status(200).json({
//       success: true,
//       data: documents,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch documents',
//       error: error.message,
//     });
//   }
// };


// Get a document by ID
exports.getByIdDocument = async (req, res) => {
  const { id } = req.params;
  try {
    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch document',
      error: error.message,
    });
  }
};





// Create a new document
exports.createDocument = async (req, res) => {
  const {
    documentID,
    heading,
    description,
    link,
    receiver,
    autoUpdate,
    fromDate,
    toDate,
    status,
  } = req.body;

  try {
    // Set the default status if not provided
    const documentStatus = status || "active";

    // No file type restrictions - allow all files
    const uploadedFile = req.file ? req.file.filename : null;

    // Create the document in the database
    const document = await Document.create({
      documentID,
      heading,
      description,
      link,
      receiver,
      autoUpdate,
      status: documentStatus,
      fromDate: autoUpdate ? fromDate : null,
      toDate: autoUpdate ? toDate : null,
      image: uploadedFile, // Save the uploaded file (if exists)
    });

    // Emit event for new document
    req.io.emit("new_document", document);

    // Parse receiver if it's a string (for array of roles)
    const parsedReceiver = typeof receiver === "string" ? JSON.parse(receiver) : receiver;

    // If there are receivers (roles), send notifications
    if (parsedReceiver.length > 0) {
      const users = await User.findAll({
        where: {
          role_name: {
            [Op.in]: parsedReceiver, // Match role names in the `receiver` array
          },
        },
      });

      const notifications = users.map((user) => ({
        user_id: user.id,
        message: `New Document received: ${heading}`,
        is_read: false,
        created_at: new Date(),
        detail: {
          document_id: document.id,
          link,
          receiver: parsedReceiver,
          user_name: user.full_name,
          image: uploadedFile,
          type: "document",
        },
      }));

      // Insert notifications in bulk
      // await Notification.bulkCreate(notifications);
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
              body: description || "You have received a new document!",
            },
            data: {
              type: "document",
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
      data: document,
    });
  } catch (error) {
    console.error("Error creating document:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create document",
      error: error.message,
    });
  }
};


// Update a document by ID
exports.updateByIdDocument = async (req, res) => {
  const { id } = req.params;
  const {
    documentID,
    heading,
    description,
    link,
    receiver,
    autoUpdate,
    fromDate,
    toDate,
  } = req.body;

  try {
    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Update the document fields
    document.documentID = documentID || document.documentID;
    document.heading = heading || document.heading;
    document.description = description || document.description;
    document.link = link || null;

    // Update receiver array
    let parsedReceiver = receiver;
    if (typeof receiver === 'string') {
      parsedReceiver = JSON.parse(receiver);
    }
    if (Array.isArray(parsedReceiver)) {
      document.receiver = JSON.stringify(parsedReceiver);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Receiver must be an array of roles.',
      });
    }

    // Update auto-update and dates
    document.autoUpdate = autoUpdate !== undefined ? autoUpdate : document.autoUpdate;
    if (autoUpdate) {
      document.fromDate = fromDate || document.fromDate;
      document.toDate = toDate || document.toDate;
    }

    // Update the file/image if provided
    if (req.file) {
      // Delete old file (if exists) before saving the new one
      if (document.file) {
        const filePath = path.join(__dirname, '../uploads', document.file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Delete the old file
        }
      }
      document.image = req.file.filename; // Store the new file's filename
    }

    // Save the updated document
    await document.save();

    // Emit event for document update (if using socket.io)
    req.io.emit('update_document', document);

    // Send notifications to users based on updated receiver roles
    const receiverArray = JSON.parse(document.receiver);
    if (receiverArray.length > 0) {
      await Notification.destroy({
        where: { 'detail.document_id': document.id },
      });

      const users = await User.findAll({
        where: { role_name: { [Op.in]: receiverArray } },
      });

      const notifications = users.map((user) => ({
        user_id: user.id,
        message: `New Document received: ${heading}`,
        is_read: false,
        created_at: new Date(),
        detail: {
          document_id: document.id,
          link,
          receiver: receiverArray,
          image: req.file ? req.file.filename : document.file,
          type: 'document',
        },
      }));

      // Insert notifications in bulk
      await Notification.bulkCreate(notifications);
    }

    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update document',
      error: error.message,
    });
  }
};


// Delete a document by ID
exports.deleteByIdDocument = async (req, res) => {
  const { id } = req.params;

  try {
    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    await Notification.destroy({
      where: {
        "detail.document_id": id,
      },
    });

    await document.destroy();

    req.io.emit('delete_document', { id });

    return res.status(200).json({
      success: true,
      message: 'Document and related notifications deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message,
    });
  }
};





// Function to check for expired documents and update them every 10 seconds
function autoUpdateDocuments() {
  setInterval(async () => {
    try {
      const now = moment().startOf('day').toDate();  // Local time (start of the day)

      const documentsToUpdate = await Document.findAll({
        where: {
          autoUpdate: 1,  // Filter for documents with autoUpdate set to 1
          toDate: {
            [Op.lt]: now  // Fetch documents where toDate is less than current date (expired)
          }
        }
      });

      // Update the documents
      const result = await Document.update(
        {
          autoUpdate: 0,  
          fromDate: null,  
          toDate: null,   
          status: "Expired"  
        },
        {
          where: {
            autoUpdate: 1,  
            toDate: {
              [Op.lt]: now  
            }
          }
        });

      // Log the updates for each document
      documentsToUpdate.forEach(document => {
        console.log(`Document ID ${document.id} updated successfully.`);
      });

    } catch (error) {
      console.error('Error updating documents:', error);
    }
  }, 30 * 1000);  // Call the function every 10 seconds
}

// autoUpdateDocuments(); 
