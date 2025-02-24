'use strict';

const { EditRequest, Notification, User } = require('../../../models');
const { body, validationResult } = require('express-validator');

// Get all edit requests
exports.getEditRequests = async (req, res) => {
  try {
    const editRequests = await EditRequest.findAll();
    return res.status(200).json({
      success: true,
      data: editRequests
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch edit requests',
      error: error.message
    });
  }
};

// Get an edit request by ID
exports.getByIdEditRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const editRequest = await EditRequest.findByPk(id);

    if (!editRequest) {
      return res.status(404).json({
        success: false,
        message: 'Edit request not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: editRequest
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch edit request',
      error: error.message
    });
  }
};

exports.createEditRequest = [
  // Validation middleware
  body('user_id').isInt().withMessage('User ID must be an integer'),
  body('role_id').isInt().withMessage('Role ID must be an integer'),
  body('request_reason').isString().notEmpty().withMessage('Request reason is required'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { user_id, role_id, request_reason, new_mobile_number, new_email_id, new_address } = req.body;

    try {
      const user = await User.findByPk(user_id, {
        attributes: ['id', 'username', 'full_name', 'role_name', 'image'],
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Image format validation is handled in the `upload` middleware
      const image = req.file ? req.file.filename : null;

      const newEditRequest = await EditRequest.create({
        user_id,
        role_id,
        request_reason,
        new_mobile_number,
        new_email_id,
        new_address,
        image,
      });

      ///**profile Natification*///
    // Add a notification entry
    const notificationMessage = `Profile Edit Request: by user ${user.full_name} `;
    try {
      await Notification.create({
        user_id: 1,
        message: notificationMessage,
        photo: user.image,
        detail: {
          user_name: user.full_name,
          request_reason,
          role: user.role_name,
          type: 'profile_edite_request',
        },
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }

      return res.status(201).json({
        success: true,
        message: 'Edit request created successfully',
        data: newEditRequest,
      });
    } catch (error) {
      console.error('Error creating edit request:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create edit request',
        error: error.message,
      });
    }
  },
];



exports.rejectByIdEditRequest = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the EditRequest by its ID and include the User based on user_id
    const editRequest = await EditRequest.findByPk(id);

    if (!editRequest) {
      return res.status(404).json({
        success: false,
        message: 'Edit request not found'
      });
    }

    // Now, fetch the associated user using the user_id from the editRequest
    const user = await User.findByPk(editRequest.user_id, {
      attributes: ['id', 'full_name', 'image', 'username']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update the status to "Rejected"
    editRequest.status = 'Rejected';
    await editRequest.save(); // Save the updated request

    // Send Notification to the user who made the request
    const notificationMessage = `Your profile edit request has been rejected by the admin.`;

    try {
      // Create a notification entry
      await Notification.create({
        user_id: user.id, // Send the notification to the user who made the request
        message: notificationMessage,
        photo: user.image, // Attach the user's image to the notification
        detail: {
          user_name: user.full_name,
          type: 'profile_edit_request_rejected',
        },
      });
    } catch (error) {
      console.error('Error creating rejection notification:', error);
    }

    return res.status(200).json({
      success: true,
      message: 'Edit request marked as rejected successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update edit request status',
      error: error.message,
    });
  }
};




