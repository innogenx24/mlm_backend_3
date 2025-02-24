const { OrderLimit } = require('../../models'); // Ensure the path is correct

const getOrderLimits = async (req, res) => {
    try {
        const { role_name } = req.user; // Assume role_name is part of req.user

        // Check if the user has the "Admin" role
        if (role_name !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only admins can view order limits.',
            });
        }

        // Proceed with fetching order limits if the user is an Admin
        const orderLimits = await OrderLimit.findAll();
        res.json({ data: orderLimits });
    } catch (error) {
        console.error('Error fetching order limits:', error);
        res.status(500).json({ error: 'Error fetching order limits' });
    }
};

const createOrderLimit = async (req, res) => {
    const { days, hours, role } = req.body;

    // Log incoming data to make sure days, hours, and role are coming in correctly
    console.log('Received Data:', { days, hours, role });

    // Validation for missing fields
    if (!days || !hours || !role) {
        return res.status(400).json({ message: 'Days, hours, and role are required' });
    }

    try {
        // Attempt to create the order limit
        const newOrderLimit = await OrderLimit.create({ days, hours, role });
        console.log('Order limit created successfully:', newOrderLimit); // Log the created record
        return res.status(201).json({ message: 'Order limit created successfully', data: newOrderLimit });
    } catch (error) {
        // Log the error details from Sequelize
        console.error('Error creating order limit:', error);  // Detailed error log

        // Send the error message to the client
        return res.status(500).json({ message: 'Failed to create order limit', error: error.message });
    }
};

const updateOrderLimit = async (req, res) => {
    const { id } = req.params;
    const { days, hours } = req.body;

    try {
        const orderLimit = await OrderLimit.findByPk(id);
        if (!orderLimit) {
            return res.status(404).json({ message: 'Order limit not found' });
        }
        // Update days and hours
        orderLimit.days = days;
        orderLimit.hours = hours;
        await orderLimit.save();
        return res.status(200).json({ message: 'Order limit updated successfully', data: orderLimit });
    } catch (error) {
        console.error('Error updating order limit:', error);
        return res.status(500).json({ message: 'Failed to update order limit' });
    }
};

const deleteOrderLimit = async (req, res) => {
    const { id } = req.params;
    try {
        const orderLimit = await OrderLimit.findByPk(id);
        if (!orderLimit) {
            return res.status(404).json({ message: 'Order limit not found' });
        }
        await orderLimit.destroy();
        return res.status(200).json({ message: 'Order limit deleted successfully' });
    } catch (error) {
        console.error('Error deleting order limit:', error);
        return res.status(500).json({ message: 'Failed to delete order limit' });
    }
};

module.exports = {
    getOrderLimits,
    createOrderLimit,
    updateOrderLimit,
    deleteOrderLimit
};
