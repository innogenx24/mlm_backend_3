const { User, Role } = require('../../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');



exports.getMasterDistributorsByADO = async (req, res) => {
    try {
      const { ado_id } = req.query;
  
      // Validate ado_id parameter
      if (!ado_id) {
        return res.status(400).json({ error: 'ADO ID must be provided' });
      }
  
      // Fetch Master Distributors created by the ADO
      const masterDistributors = await User.findAll({
        where: {
          role_name: 'Master Distributor',  // Filter for Master Distributors
          superior_id: ado_id              // Filter by ADO ID
        }
      });
  
      if (masterDistributors.length === 0) {
        return res.status(404).json({ message: 'No Master Distributors found for this ADO' });
      }
  
      res.status(200).json(masterDistributors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  //*********  Get Super Distributors created by a specific Master Distributor ***********///
  exports.getSuperDistributorsByMD = async (req, res) => {
    try {
      const { md_id } = req.query;
  
      // Validate md_id parameter
      if (!md_id) {
        return res.status(400).json({ error: 'MD ID must be provided' });
      }
  
      // Fetch Super Distributors created by the MD
      const superDistributors = await User.findAll({
        where: {
          role_name: 'Super Distributor',  // Filter for Super Distributors
          superior_id: md_id               // Filter by MD ID
        }
      });
  
      if (superDistributors.length === 0) {
        return res.status(404).json({ message: 'No Super Distributors found for this MD' });
      }
  
      res.status(200).json(superDistributors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  

  //***********Get Distributors created by a specific Super Distributor******************//
exports.getDistributorsBySD = async (req, res) => {
  try {
    const { sd_id } = req.query;

    // Validate sd_id parameter
    if (!sd_id) {
      return res.status(400).json({ error: 'Super Distributor ID must be provided' });
    }

    // Fetch Distributors created by the Super Distributor
    const distributors = await User.findAll({
      where: {
        role_name: 'Distributor',  // Filter for Distributors
        superior_id: sd_id         // Filter by Super Distributor ID
      }
    });

    if (distributors.length === 0) {
      return res.status(404).json({ message: 'No Distributors found for this Super Distributor' });
    }

    res.status(200).json(distributors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//****  Get Customers based on Distributor ID  *******//
exports.getCustomersByDistributor = async (req, res) => {
  try {
    const { distributorId } = req.query; // Get distributorId from query params

    if (!distributorId) {
      return res.status(400).json({ error: 'Distributor ID is required' });
    }

    // Fetch all users where the superior_d matches the given distributorId
    const customers = await User.findAll({
      where: { superior_id: distributorId, role_name: 'Customer' },
    });

    if (customers.length === 0) {
      return res.status(404).json({ message: 'No customers found for this Distributor' });
    }

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




