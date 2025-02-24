const Role = require('../../../models').Role;

// Get all roles
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll(); 
    return res.status(200).json({
      success: true,
      data: roles
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch roles',
      error: error.message
    });
  }
};

//////////////***********///////// */
// Create a new role
exports.createRole = async (req, res) => {
  const { role_name } = req.body;

  // Validate request body
  if (!role_name) {
    return res.status(400).json({ success: false, message: 'Role name is required' });
  }

  try {
    // Check if the role already exists in the database
    const existingRole = await Role.findOne({ where: { role_name } });

    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: 'Role name already exists'
      });
    }

    // Create a new role if the role_name is unique
    const newRole = await Role.create({ role_name });
    
    return res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: newRole
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create role',
      error: error.message
    });
  }
};


