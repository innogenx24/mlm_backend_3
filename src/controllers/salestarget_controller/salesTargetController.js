const { SalesStockTarget } = require('../../../models'); // Adjust the path according to your project structure

// Get all sales stock targets (Admin only)
exports.getSalesStockTargets = async (req, res) => {
  try {
    const { role_name } = req.user; // Assume role_name is part of req.user

    // Check if the user has the "Admin" role
    if (role_name !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can view sales stock targets.',
      });
    }

    // Fetch all sales stock targets for admin
    const targets = await SalesStockTarget.findAll();
    return res.status(200).json({
      success: true,
      data: targets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sales stock targets',
      error: error.message,
    });
  }
};


exports.updateSalesStockTarget = async (req, res) => {
  const { role_name } = req.params;  // Get the role_name from URL parameter
  const { target, stock_target, duration } = req.body; // Get the updated target details from the request body

  // Validate that required fields are provided
  if (!target || !stock_target || !duration) {
    return res.status(400).json({
      success: false,
      message: 'Target, stock target, and duration are required.',
    });
  }

  try {
    // Find the sales stock target for the given role_name
    const targetToUpdate = await SalesStockTarget.findOne({
      where: { role_name: role_name },
    });

    // If no target is found for the given role_name, return a 404 error
    if (!targetToUpdate) {
      return res.status(404).json({
        success: false,
        message: `Sales stock target for role '${role_name}' not found`,
      });
    }

    // Update the sales stock target
    await targetToUpdate.update({
      target,
      stock_target,
      duration,
    });

    return res.status(200).json({
      success: true,
      message: 'Sales stock target updated successfully.',
      target,  // Optionally send updated data back
      stock_target,  // Optionally send updated data back
      duration,  // Optionally send updated data back
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update sales stock target',
      error: error.message,
    });
  }
};
