const { Member, EditRequest, Role, Notification } = require('../../../models'); // Include Notification model
const { Op } = require('sequelize');

const updateMember = async (req, res) => {
  const memberId = req.params.id;
  const {
    mobile_number,
    email,
    state,
    city,
    street_name,
    pincode,
  } = req.body;

  try {
    // Find the member by ID
    const member = await Member.findByPk(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Fetch the role associated with the member
    const role = await Role.findByPk(member.role_id); // Adjust field names as needed
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role not found' });
    }

    // Dynamically generate username based on role and mobile number if provided
    let username = member.username; // Default to current username
    if (mobile_number) {
      switch (role.role_name) {
        case 'Area Development Officer':
          username = `ado_${mobile_number}`;
          break;
        case 'Master Distributor':
          username = `md_${mobile_number}`;
          break;
        case 'Super Distributor':
          username = `sd_${mobile_number}`;
          break;
        case 'Distributor':
          username = `d_${mobile_number}`;
          break;
        case 'Customer':
          username = `c_${mobile_number}`;
          break;
        default:
          username = mobile_number; // Fallback username
      }
    }

    // Check if mobile number already exists in the database (excluding the current member)
    if (mobile_number) {
      const existingMobileNumber = await Member.findOne({
        where: { mobile_number, id: { [Op.ne]: memberId } },
      });
      if (existingMobileNumber) {
        return res.status(400).json({ success: false, message: 'Mobile number already exists' });
      }
    }

    // Check if email already exists in the database (excluding the current member)
    if (email) {
      const existingEmail = await Member.findOne({
        where: { email, id: { [Op.ne]: memberId } },
      });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
    }

    // Update member details, including setting approved to "Completed"
    await member.update({
      username, // Update the dynamically generated username
      mobile_number,
      email,
      state,
      city,
      street_name,
      pincode,
      approved: 'Completed', // Set approved column to "Completed"
    });

    // Find the corresponding edit request for this member and update its status
    const editRequest = await EditRequest.findOne({
      where: { user_id: memberId, status: 'Pending' }, // Assuming the request is pending
    });

    if (editRequest) {
      // Update the status of the corresponding edit request to "Completed"
      await editRequest.update({
        status: 'Completed',
      });

      // Send Notification for the accepted request
      const notificationMessage = `Your profile edit request has been approved by the admin.`;

      try {
        // Create a notification entry
        await Notification.create({
          user_id: member.id, // Send the notification to the member who made the request
          message: notificationMessage,
          photo: member.image, // Attach the user's image to the notification
          detail: {
            user_name: member.full_name,
            type: 'profile_edit_request_approved',
          },
        });
      } catch (notificationError) {
        console.error('Error creating acceptance notification:', notificationError);
        return res.status(500).json({
          success: false,
          message: 'Error sending notification for acceptance',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Member updated successfully, and edit request status updated to Completed',
      member, // Include the updated member details in the response
    });
  } catch (error) {
    console.error('Error updating member:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Unknown error',
    });
  }
};

module.exports = {
  updateMember,
};
