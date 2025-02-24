const { Sector } = require('../../../models');
const { Op } = require('sequelize'); // Import Sequelize operators

// Create a new sector
exports.createSector = async (req, res) => {
  try {
    const { sector_name } = req.body;

    // Check if the sector name already exists in the database
    const existingSector = await Sector.findOne({ where: { sector_name } });

    if (existingSector) {
      // If the sector name already exists, send an error response
      return res.status(400).json({ message: 'Sector name already exists' });
    }

    // If no existing sector found, create the new sector
    const sector = await Sector.create({ sector_name });
    res.status(201).json({ message: 'Sector created successfully', sector });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating sector', error });
  }
};


// Get all sectors
exports.getSectors = async (req, res) => {
  try {
    const sectors = await Sector.findAll();
    res.status(200).json(sectors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sectors', error });
  }
};

// Get sector by ID
exports.getSectorById = async (req, res) => {
  try {
    const sector = await Sector.findByPk(req.params.id);
    if (!sector) {
      return res.status(404).json({ message: 'Sector not found' });
    }
    res.status(200).json(sector);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sector', error });
  }
};

exports.updateSector = async (req, res) => {
  try {
    const sector = await Sector.findByPk(req.params.id);
    if (!sector) {
      return res.status(404).json({ message: 'Sector not found' });
    }

    const { sector_name } = req.body;

    // Check if a sector with the same name already exists (excluding the current sector)
    const existingSector = await Sector.findOne({
      where: { sector_name, id: { [Op.ne]: req.params.id } } // Exclude the current sector being updated
    });

    if (existingSector) {
      return res.status(400).json({ message: 'Sector name already exists' });
    }

    // Update the sector details
    sector.sector_name = sector_name || sector.sector_name;

    await sector.save();
    res.status(200).json({ message: 'Sector updated successfully', sector });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating sector', error });
  }
};

// Delete a sector
exports.deleteSector = async (req, res) => {
  try {
    const sector = await Sector.findByPk(req.params.id);
    if (!sector) {
      return res.status(404).json({ message: 'Sector not found' });
    }

    await sector.destroy();
    res.status(200).json({ message: 'Sector deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting sector', error });
  }
};
