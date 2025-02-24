const { Request } = require('../../../models');

// Fetch all requests
exports.fetchRequests = async (req, res) => {
  try {
    const requests = await Request.findAll();
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch requests', error: error.message });
  }
};

// Create a new request
exports.createRequest = async (req, res) => {
  const { product_name, quantity } = req.body;

  try {
    const request = await Request.create({
      product_name,
      quantity,
      current_role: 'Distributor', // Starting role
      status: 'Pending', // Initial status
      expiry_date: new Date(Date.now() + 1 * 60 * 1000) // 1 minute from now
    });
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create request', error: error.message });
  }
};

// Handle approval or forwarding
exports.handleApproval = async (req, res) => {
  const { id, action } = req.body;

  try {
    const request = await Request.findByPk(id);

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (action === 'approve') {
      request.status = 'Approved';
      await request.save(); // Save updated status

      // Fetch the updated request and return it
      const updatedRequest = await Request.findByPk(id);
      return res.status(200).json({ success: true, data: updatedRequest, message: 'Request approved' });
    } else if (action === 'forward') {
      let nextRole;
      switch (request.current_role) {
        case 'Distributor':
          nextRole = 'Super Distributor';
          break;
        case 'Super Distributor':
          nextRole = 'Master Distributor';
          break;
        case 'Master Distributor':
          nextRole = 'ADO';
          break;
        case 'ADO':
          request.status = 'Expired';
          await request.save(); // Save the expired status
          return res.status(200).json({ success: true, message: 'Request expired' });
      }

      request.current_role = nextRole;
      request.expiry_date = new Date(Date.now() + 1 * 60 * 1000); // 1 minute for the next role
      await request.save(); // Save updated role and expiry date

      return res.status(200).json({ success: true, message: `Request forwarded to ${nextRole}` });
    }
  } catch (error) {
    console.error("Approval Processing Error:", error); // Log the error for debugging
    res.status(500).json({ success: false, message: 'Failed to process request', error: error.message });
  }
};
