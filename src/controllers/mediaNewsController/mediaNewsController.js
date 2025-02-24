const { MediaNews, User, Notification } = require('../../../models');
const { Op } = require('sequelize');

exports.createMediaNews = async (req, res) => {
    try {
      let {  // Change const to let
        documentID,
        heading,
        description,
        link,
        receiver, // Array to be converted to string
        event_date,
      } = req.body;
  
      // Validate required fields
      if (!documentID || !heading || !receiver) {
        return res.status(400).json({
          success: false,
          message: 'Document ID, heading, and receiver are required fields.',
        });
      }
      
      if (typeof receiver === 'string') {
          receiver = JSON.parse(receiver);  // Convert stringified array back to array
      }
        
      // Ensure receiver is an array
      if (!Array.isArray(receiver)) {
        return res.status(400).json({
          success: false,
          message: 'Receiver must be an array of roles.',
        });
      }
  
      // Convert receiver array to a JSON string
      const receiverString = JSON.stringify(receiver);
  
      // Create media news record in the database
      const mediaNews = await MediaNews.create({
        documentID,
        heading,
        description,
        link,
        receiver: receiverString, // Store as JSON string
        event_date,
        image: req.file ? req.file.filename : null,
      });
  
      // Emit the 'new_media_news' event
      req.io.emit('new_media_news', mediaNews);
  
      // Parse the receiver data from the JSON string
      const parsedReceiver = JSON.parse(receiverString);
  
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
  
        // Create notifications for users
        const notifications = users.map((user) => ({
          user_id: user.id,
          message: `New Media News received: ${heading}`,
          is_read: false,
          created_at: new Date(),
          detail: {
            news_id: mediaNews.id,
            link,
            receiver: parsedReceiver,
            user_name: user.full_name,
            image: req.file ? req.file.filename : null,
            type: 'media_news',
          },
        }));
  
        // Insert notifications in bulk
        await Notification.bulkCreate(notifications);
      }
  
      // Respond with the created media news record
      return res.status(201).json({
        success: true,
        data: mediaNews,
      });
    } catch (error) {
      console.error('Error creating media news:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create media news',
        error: error.message,
      });
    }
  };
  

  exports.getMediaNews = async (req, res) => {
    try {
      const { role_name } = req.user; // Assume role_name is available in req.user
  
      // Check if the user is an admin (this can be based on role_name or a specific flag like isAdmin)
      if (role_name === 'Admin') {
        // If admin, fetch all media news
        const mediaNews = await MediaNews.findAll();
  
        return res.status(200).json({
          success: true,
          data: mediaNews,
        });
      }
  
      // Define the condition for non-admin users
      const whereClause = {
        receiver: {
          [Op.like]: `%${role_name}%`, // Check if the user's role_name is in the receiver list
        },
      };
  
      // Fetch media news with the role_name condition
      const mediaNews = await MediaNews.findAll({
        where: whereClause,
      });
  
      return res.status(200).json({
        success: true,
        data: mediaNews,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch media news',
        error: error.message,
      });
    }
  };
  


  exports.updateMediaNews = async (req, res) => {
    try {
      const { id } = req.params;
      let {
        documentID,
        heading,
        description,
        link,
        receiver, 
        event_date,
      } = req.body;
  
      // Convert receiver to an array if it's a stringified JSON
      if (typeof receiver === 'string') {
        receiver = JSON.parse(receiver); // Parse back to an array
      }
  
      // Ensure receiver is an array
      if (!Array.isArray(receiver)) {
        return res.status(400).json({
          success: false,
          message: 'Receiver must be an array of roles.',
        });
      }
  
      // Convert receiver array to a JSON string
      const receiverString = JSON.stringify(receiver);
  
      // Find the media news record to update
      const mediaNews = await MediaNews.findByPk(id);
      if (!mediaNews) {
        return res.status(404).json({
          success: false,
          message: 'Media news not found.',
        });
      }
  
      // Update the media news record
      await mediaNews.update({
        documentID,
        heading,
        description,
        link,
        receiver: receiverString, // Store as JSON string
        event_date,
        image: req.file ? req.file.filename : mediaNews.image, // Update image only if a new file is uploaded
      });
  
      // Emit the 'update_media_news' event
      req.io.emit('update_media_news', mediaNews);
  
      // Parse the receiver data from the JSON string
      const parsedReceiver = JSON.parse(receiverString);
  
      if (parsedReceiver.length > 0) {
        // Remove existing notifications for this media news
        await Notification.destroy({
          where: {
            "detail.news_id": mediaNews.id,
          },
        });
  
        // Find all users whose roles match the roles in `receiver`
        const users = await User.findAll({
          where: {
            role_name: {
              [Op.in]: parsedReceiver, // Match role names in the `receiver` array
            },
          },
          attributes: ['id', 'username', 'full_name'],
        });
  
        // Create notifications for updated media news
        const notifications = users.map((user) => ({
          user_id: user.id,
          message: `New Media News received: ${heading}`,
          is_read: false,
          created_at: new Date(),
          detail: {
            news_id: mediaNews.id,
            link,
            receiver: parsedReceiver,
            image: req.file ? req.file.filename : mediaNews.image,
            type: 'media_news',
          },
        }));
  
        await Notification.bulkCreate(notifications);
      }
  
      return res.status(200).json({
        success: true,
        data: mediaNews,
      });
    } catch (error) {
      console.error('Error updating media news:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update media news',
        error: error.message,
      });
    }
  };
  
  

  exports.deleteMediaNews = async (req, res) => {
    try {
      const { id } = req.params; 
  
      const mediaNews = await MediaNews.findByPk(id);
      if (!mediaNews) {
        return res.status(404).json({
          success: false,
          message: 'Media news not found.',
        });
      }
  
      await Notification.destroy({
        where: {
          "detail.news_id": id,
        },
      });
  
      await mediaNews.destroy();
  
      req.io.emit('delete_media_news', { id });
  
      return res.status(200).json({
        success: true,
        message: 'Media news and related notifications deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting media news:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete media news',
        error: error.message,
      });
    }
  };
  
  