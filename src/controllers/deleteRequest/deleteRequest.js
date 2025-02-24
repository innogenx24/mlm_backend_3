const { DeleteRequest, User, Notification } = require("../../../models");
const { Op } = require("sequelize");

// Create a delete request
exports.createDeleteRequest = async (req, res) => {
  try {
    const { user_id, reason } = req.body;

    // Fetch user details
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingRequest = await DeleteRequest.findOne({ where: { user_id } });
    if (existingRequest) {
      return res.status(400).json({ message: "Delete request already submitted" });
    }

    const deleteRequest = await DeleteRequest.create({
      user_id,
      reason,
      status: "Pending",
    });

    const notificationMessage = `Profile Delete Request: by user ${user.full_name}`;
    
    try {
      await Notification.create({
        user_id: 1, // Assuming admin ID
        message: notificationMessage,
        photo: user.image,
        detail: {
          user_name: user.full_name,
          request_reason: reason, // Fixed request_reason
          role: user.role_name,
          type: "profile_delete_request",
        },
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }

    res.status(201).json({
      message: "Delete request submitted successfully",
      deleteRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error submitting delete request", error });
  }
};

// Update status to 'Deleted'
exports.updateStatusToDeleted = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteRequest = await DeleteRequest.findByPk(id);
    if (!deleteRequest) {
      return res.status(404).json({ message: "Delete request not found" });
    }

    // Fetch the user associated with the delete request
    const user = await User.findByPk(deleteRequest.user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const notificationMessage = `Your account delete request has been approved by the admin.`;

    try {
      await Notification.create({
        user_id: user.id,
        message: notificationMessage,
        photo: user.image,
        detail: {
          user_name: user.full_name,
          type: "profile_delete_request_is_deleted",
        },
      });
    } catch (notificationError) {
      console.error("Error creating deletion notification:", notificationError);
      return res.status(500).json({
        success: false,
        message: "Error sending notification for deletion",
      });
    }

    deleteRequest.status = "Deleted";
    await deleteRequest.save();

    res.status(200).json({ message: "Delete request marked as deleted", deleteRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating status to deleted", error });
  }
};


// Update status to 'Rejected'

exports.updateStatusToRejected = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteRequest = await DeleteRequest.findByPk(id);
    if (!deleteRequest) {
      return res.status(404).json({ message: "Delete request not found" });
    }

    // Fetch the user associated with the delete request
    const user = await User.findByPk(deleteRequest.user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const notificationMessage = `Your account delete request has been rejected by the admin.`;

    try {
      await Notification.create({
        user_id: user.id,
        message: notificationMessage,
        photo: user.image,
        detail: {
          user_name: user.full_name,
          type: "profile_delete_request_rejected",
        },
      });
    } catch (notificationError) {
      console.error("Error creating rejection notification:", notificationError);
      return res.status(500).json({
        success: false,
        message: "Error sending notification for rejection",
      });
    }

    deleteRequest.status = "Rejected";
    await deleteRequest.save();

    res.status(200).json({
      message: "Delete request marked as rejected",
      deleteRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating status to rejected", error });
  }
};


exports.getAllDeleteRequests = async (req, res) => {
  try {
    // Fetch all delete requests with the associated user details, sorted by updated_at in ascending order
    const deleteRequests = await DeleteRequest.findAll({
      include: {
        model: User, // Include the User model
        required: true, // Only include requests with associated users
        attributes: [
          "full_name", // Member Name
          "role_name", // Role
          "createdAt", // Date of Joining
          "mobile_number", // Mobile No
          "username",
          "image", // Member Image
        ],
      },
      order: [["updated_at", "DESC"]], // Sorting by updated_at in ascending order
    });

    if (deleteRequests.length === 0) {
      return res.status(404).json({ message: "No delete requests found" });
    }

    // Format the response data to match your required structure
    const formattedDeleteRequests = deleteRequests.map((request) => ({
      id: request.id,
      member_name: request.User.full_name,
      full_name: request.User.full_name,
      role: request.User.role_name,
      date_of_joining: request.User.createdAt,
      mobile_number: request.User.mobile_number,
      username: request.User.username,
      request_reason: request.reason,
      status: request.status,
      image: request.User.image,
      created_at: request.createdAt,
    }));

    res.status(200).json({
      message: "All delete requests retrieved successfully",
      deleteRequests: formattedDeleteRequests,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error retrieving delete requests", error });
  }
};

