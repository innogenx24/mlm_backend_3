const { User } = require('../../models');
const jwt = require('jsonwebtoken');

// Dynamic function to get users by ADO and role
exports.getUsersByADOAndRole = async (req, res) => {
  try {
    const { adoId, roleId } = req.query;
    //**  Validate ADO ID and role ID **//
    if (!adoId || !roleId) {
      return res.status(400).json({ error: 'ADO ID and role ID are required' });
    }

    //** Initialize where condition **//
    const whereCondition = {
      superior_ado: adoId,    // Check the ADO assigned
      superior_md: null,      // Ensure superior_md is null
      role_id: roleId         // Role ID is dynamic
    };

    //**  Dynamically add conditions for superior_sd and superior_d based on role ID **//
    if (roleId == 4) { 
      whereCondition.superior_sd = null; // Ensure superior_sd is null for SDs
    } else if (roleId == 5) { 
      whereCondition.superior_sd = null; // Ensure superior_sd is null for Ds
      whereCondition.superior_d = null;  // Ensure superior_d is null for Ds
    } else if (roleId == 6) { 
      whereCondition.superior_sd = null; // Ensure superior_sd is null for Cs
      whereCondition.superior_d = null;  // Ensure superior_d is null for Cs
    }

    //**  Fetch users based on ADO and role dynamically **//
    const users = await User.findAll({
      where: whereCondition
    });

    //**  Check if any users were found **//
    if (users.length === 0) {
      return res.status(404).json({ message: `No users found for ADO with role ID ${roleId}` });
    }

    //** Respond with the list of users **//
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



//************ Dynamic function to get users by MD and role ***************//
exports.getUsersByMDAndRole = async (req, res) => {
  try {
    const { mdId, roleId } = req.query;

    //** Validate MD ID and role ID **//
    if (!mdId || !roleId) {
      return res.status(400).json({ error: 'MD ID and role ID are required' });
    }

    // Initialize where condition
    const whereCondition = {
      superior_md: mdId,    
      role_id: roleId     
    };

    // Dynamically add conditions for superior_sd and superior_d based on role ID
    if (roleId == 4) { 
      whereCondition.superior_sd = null; // Ensure the SD is directly under the MD
    } else if (roleId == 5) { 
      whereCondition.superior_sd = null; // Ensure Distributor is directly under the MD
      whereCondition.superior_d = null;  // Ensure Distributor is not under any other D
    } else if (roleId == 6) {
      whereCondition.superior_sd = null; // Ensure Customer is directly under the MD
      whereCondition.superior_d = null;  // Ensure Customer is not under any other D
    }

    // Fetch users based on MD and role dynamically
    const users = await User.findAll({
      where: whereCondition
    });

    // Check if any users were found
    if (users.length === 0) {
      return res.status(404).json({ message: `No users found for MD with role ID ${roleId}` });
    }

    // Respond with the list of users
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




//************* Dynamic function to get users by SD and role *************//
exports.getUsersBySDAndRole = async (req, res) => {
  try {
    const { sdId, roleId } = req.query;

    //**  Validate SD ID and role ID **//
    if (!sdId || !roleId) {
      return res.status(400).json({ error: 'SD ID and role ID are required' });
    }

    //**  Initialize where condition **//
    const whereCondition = {
      superior_sd: sdId,    
      role_id: roleId     
    };

    // Dynamically add conditions for superior_d based on role ID
    if (roleId == 5) {
      whereCondition.superior_d = null;  // Ensure Distributor is directly under the SD
    } else if (roleId == 6) { 
      whereCondition.superior_d = null;  // Ensure Customer is directly under the SD, no D in-between
    }

    // Fetch users based on SD and role dynamically
    const users = await User.findAll({
      where: whereCondition
    });

    // Check if any users were found
    if (users.length === 0) {
      return res.status(404).json({ message: `No users found for SD with role ID ${roleId}` });
    }

    // Respond with the list of users
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};





//********** Fetch profile dynamically based on logged-in user *******//
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming req.user contains the logged-in user's details (from auth middleware)

    // Fetch the user's profile based on their ID
    const user = await User.findByPk(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch the profile based on user role dynamically
    const userRole = user.role_id;

    let profile;

    // Define different profile data based on user roles
    if (userRole === 2) { // ADO
      profile = await User.findOne({
        where: { id: userId },
        attributes: ['username', 'email', 'full_name', 'mobile_number', 'state', 'city', 'street_name', 'pincode', 'role_id']
      });
    } else if (userRole === 3) { // MD (Master Distributor)
      profile = await User.findOne({
        where: { id: userId },
        attributes: ['username', 'email', 'full_name', 'mobile_number', 'state', 'city', 'superior_ado', 'role_id']
      });
    } else if (userRole === 4) { // SD (Super Distributor)
      profile = await User.findOne({
        where: { id: userId },
        attributes: ['username', 'email', 'full_name', 'mobile_number', 'state', 'city', 'superior_md', 'role_id']
      });
    } else if (userRole === 5) { // D (Distributor)
      profile = await User.findOne({
        where: { id: userId },
        attributes: ['username', 'email', 'full_name', 'mobile_number', 'state', 'city', 'superior_sd', 'role_id']
      });
    } else if (userRole === 6) { // C (Customer)
      profile = await User.findOne({
        where: { id: userId },
        attributes: ['username', 'email', 'full_name', 'mobile_number', 'state', 'city', 'superior_d', 'role_id']
      });
    } else {
      return res.status(400).json({ error: 'Invalid role or role not recognized' });
    }

    // Send back the user's profile
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// Fetch profile dynamically based on logged-in user and optional target user ID
exports.getUserProfileByHierarchy = async (req, res) => {
  try {
    const loggedInUserId = req.user.id; // Assuming req.user contains the logged-in user's details (from auth middleware)
    const targetUserId = req.query.userId || loggedInUserId; // Use the logged-in user ID if no other user ID is passed

    // Fetch the logged-in user's profile to check their role
    const loggedInUser = await User.findByPk(loggedInUserId);

    // Check if the logged-in user exists
    if (!loggedInUser) {
      return res.status(404).json({ error: 'Logged-in user not found' });
    }

    // If a target user is specified, fetch their profile
    const targetUser = await User.findByPk(targetUserId);

    // Check if the target user exists
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Ensure that the logged-in user is allowed to view the target user's profile based on the hierarchy
    const loggedInUserRole = loggedInUser.role_id;
    const targetUserRole = targetUser.role_id;

    // Fetch the profile of the logged-in user or the target user
    let profile;

    // ADO (Role ID 2) can view MDs, SDs, Ds, Cs in their hierarchy
    if (loggedInUserRole === 2) {
      // ADO should only be able to view users under their hierarchy (e.g., MD, SD, D, C)
      if (
        (targetUserRole === 3 && targetUser.superior_ado === loggedInUserId) || // MD
        (targetUserRole === 4 && targetUser.superior_ado === loggedInUserId) || // SD
        (targetUserRole === 5 && targetUser.superior_ado === loggedInUserId) || // D
        (targetUserRole === 6 && targetUser.superior_ado === loggedInUserId)    // C
      ) {
        profile = await fetchUserProfile(targetUserId);
      } else {
        return res.status(403).json({ error: 'You are not authorized to view this user profile.' });
      }
    }
    // MD (Role ID 3) can view SDs, Ds, Cs in their hierarchy
    else if (loggedInUserRole === 3) {
      if (
        (targetUserRole === 4 && targetUser.superior_md === loggedInUserId) || // SD
        (targetUserRole === 5 && targetUser.superior_md === loggedInUserId) || // D
        (targetUserRole === 6 && targetUser.superior_md === loggedInUserId)    // C
      ) {
        profile = await fetchUserProfile(targetUserId);
      } else {
        return res.status(403).json({ error: 'You are not authorized to view this user profile.' });
      }
    }
    // SD (Role ID 4) can view Ds and Cs in their hierarchy
    else if (loggedInUserRole === 4) {
      if (
        (targetUserRole === 5 && targetUser.superior_sd === loggedInUserId) || // D
        (targetUserRole === 6 && targetUser.superior_sd === loggedInUserId)    // C
      ) {
        profile = await fetchUserProfile(targetUserId);
      } else {
        return res.status(403).json({ error: 'You are not authorized to view this user profile.' });
      }
    }
    // D (Role ID 5) can only view Cs in their hierarchy
    else if (loggedInUserRole === 5) {
      if (targetUserRole === 6 && targetUser.superior_d === loggedInUserId) {
        profile = await fetchUserProfile(targetUserId);
      } else {
        return res.status(403).json({ error: 'You are not authorized to view this user profile.' });
      }
    }
    // C (Role ID 6) can only view their own profile
    else if (loggedInUserRole === 6) {
      if (targetUserId !== loggedInUserId) {
        return res.status(403).json({ error: 'You are only authorized to view your own profile.' });
      }
      profile = await fetchUserProfile(targetUserId);
    }
    else {
      return res.status(400).json({ error: 'Invalid role or role not recognized' });
    }

    // Return the profile data
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to fetch user profile
async function fetchUserProfile(userId) {
  return await User.findOne({
    where: { id: userId },
    attributes: ['username', 'email', 'full_name', 'mobile_number', 'state', 'city', 'street_name', 'pincode', 'role_id', 'superior_ado', 'superior_md', 'superior_sd', 'superior_d']
  });
}




//********** Fetch any user's profile by Admin using ID *******//
exports.getUserProfileByAdmin = async (req, res) => {
  try {
    const { userId } = req.params; // Get the user ID from route parameters

    // Check if the admin is authorized (assuming req.user contains the logged-in admin's details from the auth middleware)
    if (req.user.role_id !== 1) { // Assuming role_id 1 corresponds to Admin
      return res.status(403).json({ error: 'Access denied. Only admin can view this information.' });
    }

    // Fetch the user's profile based on the provided user ID
    const user = await User.findByPk(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Respond with the user's profile
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


















// const { User } = require('../../models');


// exports.getSDsByADO = async (req, res) => {
//     try {
//       const { adoId } = req.query; // Get ADO ID from query parameters
  
//       // Validate ADO ID
//       if (!adoId) {
//         return res.status(400).json({ error: 'ADO ID is required' });
//       }
  
//       // Fetch SDs created by the specified ADO
//       const sds = await User.findAll({
//         where: {
//           superior_ado: adoId,   // Check the superior_ado field
//           superior_md: null,      // Ensure superior_md is null
//           role_id: 4              // Role ID 4 corresponds to Super Distributor
//         }
//       });
  
//       // Check if any SDs were found
//       if (sds.length === 0) {
//         return res.status(404).json({ message: 'No Super Distributors found for this ADO' });
//       }
  
//       // Respond with the list of SDs
//       res.status(200).json(sds);
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   };


//   ///*****Get Ds by ADO********///
//   exports.getDistributorsByADO = async (req, res) => {
//     try {
//       const { adoId } = req.query;
//       if (!adoId) {
//         return res.status(400).json({ error: 'ADO ID is required' });
//       }
//       const ds = await User.findAll({
//         where: {
//           superior_ado: adoId,
//           superior_md: null,   
//           superior_sd: null,   
//           role_id: 5             
//         }
//       });
//       if (ds.length === 0) {
//         return res.status(404).json({ message: 'No Distributors found for this ADO' });
//       }
//       res.status(200).json(ds);
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   };


//     ///*****Get Cs by ADO********///
//     exports.getCoustomersByADO = async (req, res) => {
//         try {
//           const { adoId } = req.query;
//           if (!adoId) {
//             return res.status(400).json({ error: 'ADO ID is required' });
//           }
//           const customers = await User.findAll({
//             where: {
//               superior_ado: adoId,
//               superior_md: null,   
//               superior_sd: null,   
//               superior_d: null,   
//               role_id: 6             
//             }
//           });
//           if (customers.length === 0) {
//             return res.status(404).json({ message: 'No Coustomers found for this ADO' });
//           }
//           res.status(200).json(customers);
//         } catch (error) {
//           res.status(500).json({ error: error.message });
//         }
//       };
  