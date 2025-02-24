const { Club } = require('../../../models');
const { Op } = require('sequelize'); // Import Sequelize operators

// Get all clubs (Admin only)
exports.getClubs = async (req, res) => {
  try {
    const { role_name } = req.user; // Assume role_name is part of req.user

    // Check if the user has the "Admin" role
    // if (role_name !== 'Admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Access denied. Only admins can view clubs.',
    //   });
    // }

    // Fetch all clubs for admin
    const clubs = await Club.findAll();
    return res.status(200).json({
      success: true,
      data: clubs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch clubs',
      error: error.message,
    });
  }
};


// Get a club by ID
exports.getByIdClubs = async (req, res) => {
  const { id } = req.params;
  try {
    const club = await Club.findByPk(id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: club
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch club',
      error: error.message
    });
  }
};

// Create a new club
exports.createClub = async (req, res) => {
  const { club_name, litre_quantity } = req.body;

  if (!club_name || !litre_quantity) {
    return res.status(400).json({ success: false, message: 'Club name and litre quantity are required' });
  }

  try {
    const existingClub = await Club.findOne({ where: { club_name } });

    if (existingClub) {
      return res.status(409).json({
        success: false,
        message: 'Club name already exists'
      });
    }

    const newClub = await Club.create({ club_name, litre_quantity });

    return res.status(201).json({
      success: true,
      message: 'Club created successfully',
      data: newClub
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create club',
      error: error.message
    });
  }
};

exports.updateByIdClubs = async (req, res) => {
  const { id } = req.params;
  const { club_name, litre_quantity } = req.body;

  try {
    // Find the club to update
    const club = await Club.findByPk(id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    // Check if the new club_name already exists for another club
    const existingClub = await Club.findOne({
      where: { club_name, id: { [Op.ne]: id } } // Check for a different club with the same name
    });

    if (existingClub) {
      return res.status(400).json({
        success: false,
        message: 'Club name already exists'
      });
    }

    // Update club details
    club.club_name = club_name || club.club_name;
    club.litre_quantity = litre_quantity || club.litre_quantity;

    await club.save();

    return res.status(200).json({
      success: true,
      message: 'Club updated successfully',
      data: club
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update club',
      error: error.message
    });
  }
};


// Delete a club by ID
exports.deleteByIdClubs = async (req, res) => {
  const { id } = req.params;

  try {
    const club = await Club.findByPk(id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    await club.destroy();

    return res.status(200).json({
      success: true,
      message: 'Club deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete club',
      error: error.message
    });
  }
};
