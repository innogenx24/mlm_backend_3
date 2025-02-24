const { MinimumStock } = require('../../../models'); // Adjust the path according to your project structure

// Get all minimum stocks
exports.getMinimumStocks = async (req, res) => {
  try {
    const stocks = await MinimumStock.findAll();
    return res.status(200).json({
      success: true,
      data: stocks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch minimum stocks',
      error: error.message,
    });
  }
};

// Get a minimum stock by ID
exports.getMinimumStockById = async (req, res) => {
  const { id } = req.params;
  try {
    const stock = await MinimumStock.findByPk(id);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Minimum stock not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch minimum stock',
      error: error.message,
    });
  }
};

// Create a new minimum stock entry
exports.createMinimumStock = async (req, res) => {
  const { stocks } = req.body; // Updated variable name

  // Validate input
  if (!stocks || !Array.isArray(stocks)) {
    return res.status(400).json({
      success: false,
      message: 'Stocks must be an array and is required.',
    });
  }

  try {
    const createdStocks = [];

    // Loop through each stock object
    for (const stock of stocks) {
      const { role, productData } = stock;

      // Validate required fields
      if (!role || !productData || !Array.isArray(productData)) {
        return res.status(400).json({
          success: false,
          message: 'Role and productData (as an array) are required.',
        });
      }

      // Create entry in the database
      const createdStock = await MinimumStock.create({
        role,
        productData,
      });

      createdStocks.push(createdStock);
    }

    return res.status(201).json({
      success: true,
      message: 'Minimum stocks created successfully',
      data: createdStocks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create minimum stocks',
      error: error.message,
    });
  }
};

exports.updateMinimumStock = async (req, res) => {
    try {
      const { role, productData } = req.body; // Capture role and productData from the request body
  
      // Validate that productData is provided and is an array
      if (!productData || !Array.isArray(productData)) {
        return res.status(400).json({ error: 'Product data is required.' });
      }
  
      // Ensure that productData has required properties
      productData.forEach(product => {
        if (!product.productType || !product.stock || !product.duration) {
          throw new Error('Product type, stock, and duration are required.');
        }
      });
  
      // Update the record in the database
      const updatedStock = await MinimumStock.update(
        { role, productData }, // Update with new values
        { where: { id: req.params.id } } // Use the ID from the request
      );
  
      res.status(200).json({
        message: "Minimum stock updated successfully",
        data: updatedStock,
      });
    } catch (error) {
      console.error("Error updating minimum stock:", error);
      res.status(400).json({ error: error.message });
    }
  };
  
// Delete a minimum stock by ID
exports.deleteMinimumStock = async (req, res) => {
  const { id } = req.params;

  try {
    const stockToDelete = await MinimumStock.findByPk(id);

    if (!stockToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Minimum stock not found',
      });
    }

    await stockToDelete.destroy();

    return res.status(200).json({
      success: true,
      message: 'Minimum stock deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete minimum stock',
      error: error.message,
    });
  }
};
