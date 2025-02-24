const { Order, OrderItem, Product, User, OrderLimit } = require('../../../models');
const { Notification } = require('../../../models');
const moment = require('moment');

exports.createOrder = async (req, res) => {
  const { user_id, items, coupon_code } = req.body;

  try {
    // Check if user exists
    const user = await User.findByPk(user_id, {
      attributes: ['id', 'username', 'full_name', 'role_name'],
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate items input
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items must be a non-empty array' });
    }

    // Determine user role
    const userRole = user.role_name;

    // Initialize total amount, total order volume (in liters), and an array for order items
    let totalAmount = 0;
    let totalQuantity = 0;
    const orderItems = [];

    // Retrieve products in bulk
    const productIds = items.map(item => item.product_id);
    const products = await Product.findAll({ where: { id: productIds } });
    const productMap = new Map(products.map(product => [product.id, product]));

    // Role-based pricing logic
    const rolePriceColumn = {
      'Area Development Officer': product => {
        if (
          product.autoUpdate &&
          product.fromDate &&
          product.toDate &&
          isCurrentDateWithinRange(product.fromDate, product.toDate)
        ) {
          return product.ADO_price;
        }
        return product.adoPrice;
      },
      'Master Distributor': product => {
        if (
          product.autoUpdate &&
          product.fromDate &&
          product.toDate &&
          isCurrentDateWithinRange(product.fromDate, product.toDate)
        ) {
          return product.MD_price;
        }
        return product.mdPrice;
      },
      'Super Distributor': product => {
        if (
          product.autoUpdate &&
          product.fromDate &&
          product.toDate &&
          isCurrentDateWithinRange(product.fromDate, product.toDate)
        ) {
          return product.SD_price;
        }
        return product.sdPrice;
      },
      'Distributor': product => {
        if (
          product.autoUpdate &&
          product.fromDate &&
          product.toDate &&
          isCurrentDateWithinRange(product.fromDate, product.toDate)
        ) {
          return product.distributor_price;
        }
        return product.distributorPrice;
      },
      'Customer': product => {
        if (
          product.autoUpdate &&
          product.fromDate &&
          product.toDate &&
          isCurrentDateWithinRange(product.fromDate, product.toDate)
        ) {
          return product.customer_price;
        }
        return product.price;
      },
    };

    // Helper function for date range check
    function isCurrentDateWithinRange(fromDate, toDate) {
      const currentDate = new Date();
      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);

      return currentDate >= startDate && currentDate <= endDate;
    }

    // Calculate total amount, total order volume (in liters), and prepare order items
    for (let item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.product_id} not found` });
      }

      if (!rolePriceColumn[userRole]) {
        return res.status(400).json({ message: `Role ${userRole} pricing configuration is missing` });
      }

      const basePrice = rolePriceColumn[userRole](product);
      if (basePrice === null || basePrice === undefined) {
        return res.status(500).json({ message: `Pricing not configured for product ID ${item.product_id}` });
      }

      const itemTotalPrice = basePrice * item.quantity;
      totalAmount += itemTotalPrice;
      totalQuantity += item.quantity;

      orderItems.push({
        product_id: product.id,
        quantity: item.quantity,
        quantity_type: product.quantity_type,
        baseprice: basePrice,
        final_price: itemTotalPrice,
        item_volume: parseFloat(product.productVolume) * item.quantity,
      });
    }

    const finalAmount = totalAmount;

    // Logic to set higher_role_id statically if the role is "Area Development Officer"
    let higherRoleId = null;

    if (userRole === 'Area Development Officer') {
      higherRoleId = 1; // Static value for higher_role_id
    } else {
      higherRoleId = await getSuperior(user.id);
    }

    // Generate a unique 8-digit random order ID
    let orderId;
    do {
      orderId = Math.floor(10000000 + Math.random() * 90000000); // Generates an 8-digit number
    } while (await Order.findOne({ where: { order_id: orderId } }));

    // Create order with total order volume in liters
    const order = await Order.create({
      order_id: orderId, // Use the generated 8-digit order ID
      user_id,
      total_amount: totalAmount,
      coupon_code: coupon_code || null,
      discount_applied: null,
      final_amount: finalAmount,
      status: 'Pending',
      requested_by_role: userRole,
      higher_role_id: higherRoleId,
      total_order_quantity: totalQuantity,
    });

    // Bulk create order items
    await OrderItem.bulkCreate(orderItems.map(item => ({
      ...item,
      order_id: order.id,
    })));

    // Add a notification entry
    const notificationMessage = `New order requested by User ${user.full_name}`;
    try {
      await Notification.create({
        user_id: higherRoleId,
        message: notificationMessage,
        photo: "1733391557532.jpeg",
        detail: {
          user_name: user.full_name,
          final_amount: finalAmount,
          type: 'order_request',
          status: 'Pending',
          role: userRole,
          orderUniqueId: order.order_id,
        },
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }

    return res.status(201).json({ message: 'Order created successfully', order });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


// Implement this function to find the superior based on role
// const getSuperior = async (userId, userRole) => {
//   // Find the user to get the superior IDs
//   const user = await User.findByPk(userId);
//   if (!user) {
//     return null; // User not found, return null
//   }

//   switch (userRole) {
//     case 'Customer': // Assuming Customers are under Distributors
//       return user.superior_d || await getSuperior(user.superior_d, 'Distributor');
//     case 'Distributor':
//       return user.superior_sd || await getSuperior(user.superior_sd, 'Super Distributor');
//     case 'Super Distributor':
//       return user.superior_md || await getSuperior(user.superior_md, 'Master Distributor');
//     case 'Master Distributor':
//       return user.superior_ado || await getSuperior(user.superior_ado, 'Area Development Officer');
//     case 'Area Development Officer':
//       return user.superior_id; // Assuming this is the Admin or the direct superior
//     default:
//       return null; // No higher role found
//   }
// };
const getSuperior = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    return null;
  }

  return user.superior_id;
};




/////////////********** / Get Orders my**********//////////


exports.getOrdersByUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    const orders = await Order.findAll({
      where: { user_id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: OrderItem,
          as: 'OrderItems',
          required: false,
          include: [
            {
              model: Product,
              as: 'product',
            },
          ],
        },
      ],
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this user' });
    }

    // Format the createdAt date for each order
    const formattedOrders = orders.map(order => ({
      ...order.toJSON(),
      createdAt: moment(order.createdAt).format('DD-MM-YYYY'),
    }));

    return res.status(200).json({ orders: formattedOrders });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


/////////////see other member requested orderlist////////////
//////////////////////////////////////////////////////


const updateAssignedOrders = async () => {
  try {
    // Fetch all orders with pending status
    const pendingOrders = await Order.findAll({
      where: { status: 'Pending' }
    });

    for (const order of pendingOrders) {
      const user = await User.findOne({
        where: { id: order.higher_role_id }
      });

      const orderUser = await User.findOne({
        where: { id: order.user_id }
      });

      const orderUserName = orderUser ? orderUser.full_name : 'Unknown User';

      if (user) {
        const userRoleID = user.role_id;
        const userRoleName = orderUser.role_name;
        const superiorId = user.superior_id;

        const roleTimeLimit = await OrderLimit.findOne({
          where: { role: user.role_name }
        });

        if (roleTimeLimit) {
          const totalMilliseconds = (roleTimeLimit.days * 24 * 60 * 60 * 1000) + (roleTimeLimit.hours * 60 * 60 * 1000);
          const timeLimit = new Date(Date.now() - totalMilliseconds);  

          if (new Date(order.updatedAt) <= timeLimit) {
            if (userRoleName === "Admin") {
              await Order.update(
                { higher_role_id: userRoleID },
                { where: { id: order.id } }
              );
              console.log(`Order no ${order.id} was assigned to Admin role ID ${userRoleID}.`);
            } else {
              if (superiorId) {
                await Notification.create({
                  user_id: order.higher_role_id,
                  message: `You didn't accept the order, so it is being reassigned to the next top hierarchy.`,
                  photo: "1733391557532.jpeg", 
                  detail: {
                    user_name: orderUserName,
                    orderUniqueId: order.order_id,
                    role: userRoleName,
                    status: 'Pending',
                    type: 'order_request',
                  }
                });

                await Order.update(
                  { higher_role_id: superiorId },
                  { where: { id: order.id } }
                );
                console.log(`Order no ${order.id} was assigned to superior ID ${superiorId}.`);

                await Notification.create({
                  user_id: user.role_name === "Area Development Officer" ? 1 : superiorId,
                  message: `${user.full_name} did not accept the order, so it has been reassigned to you.`,
                  photo: "1733391557532.jpeg",
                  detail: {
                    user_name: orderUserName,
                    orderUniqueId: order.order_id,
                    role: userRoleName,
                    status: 'Pending',
                    type: 'order_request',
                  }
                });

              } else if (userRoleID) {
                await Notification.create({
                  user_id: order.higher_role_id,
                  message: `You didn't accept the order, so it is being reassigned to the next hierarchy.`,
                  photo: "1733391557532.jpeg",
                  detail: {
                    user_name: orderUserName,
                    orderUniqueId: order.order_id,
                    role: userRoleName,
                    status: 'Pending',
                    type: 'order_request',
                  }
                });

                await Order.update(
                  { higher_role_id: userRoleID },
                  { where: { id: order.id } }
                );
                console.log(`Order no ${order.id} was assigned to role ID ${userRoleID}.`);

                await Notification.create({
                  user_id: user.role_name === "Area Development Officer" ? 1 : userRoleID,
                  message: `${user.full_name} did not accept the order, so it has been reassigned to you.`,
                  photo: "1733391557532.jpeg",
                  detail: {
                    user_name: orderUserName,
                    orderUniqueId: order.order_id,
                    role: userRoleName,
                    status: 'Pending',
                    type: 'order_request',
                  }
                });
              } else {
                console.log(`No valid superior or user role ID found for order ${order.id}`);
              }
            }

            if (order.requested_by_role === "Area Development Officer" && !superiorId) {
              console.log(`Order no ${order.id} status already updated to Cancelled.`);
            }
          } else {
            console.log(`Order no ${order.id} was created recently, skipping update.`);
          }
        } else {
          await Order.update(
            { higher_role_id: userRoleID },
            { where: { id: order.id } }
          );
          console.log(`No time limit found for the role ${user.role_name} in order ${order.id}.`);
        }
      } else {
        console.log(`No user found with ID ${order.higher_role_id}.`);
      }
    }
  } catch (error) {
    console.error('Error updating orders:', error.message);
  }
};


// setInterval(updateAssignedOrders, 30 * 1000);
setInterval(updateAssignedOrders, 30 * 1000);

// Function to fetch orders requested by lower hierarchy roles
exports.getOrdersBySubordinates = async (req, res) => {
  const userId = req.params.user_id; // The ID of the currently logged-in user

  try {
    // Fetch the logged-in user's role
    const currentUser = await User.findByPk(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentRole = currentUser.role_name;

    // Fetch all subordinate users based on the current user's role
    const subordinates = await findSubordinateUsers(userId, currentRole);

    if (subordinates.length === 0) {
      return res.status(404).json({ message: 'No subordinates found' });
    }

    // Fetch orders requested by subordinates, including customer name, image, mobile number, and order details
    const subordinateIds = subordinates.map(user => user.id); // Extract subordinate user IDs
    const orders = await Order.findAll({
      where: { higher_role_id: userId },
      include: [
        {
          model: User,
          as: 'customer',  // Alias for the User model representing the customer
          attributes: ['full_name', 'image', 'mobile_number'], // Fetch customer name, image, and mobile number
        },
        {
          model: OrderItem,
          as: 'OrderItems',
          include: [
            {
              model: Product,
              as: 'product',  // Including product details if needed
              attributes: ['name', 'image', 'price', 'description'], // Fetch product details
            },
          ], // Include order items if they exist
        },
      ],
      attributes: ['id','order_id','total_amount', 'coupon_code', 'discount_applied', 'final_amount', 'total_order_quantity', 'status', 'createdAt', 'updatedAt'],
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for subordinates' });
    }

    // Format the response to include necessary details
    const orderDetails = orders.map(order => ({
      orderId: order.id,
      orderUniqueId:order.order_id,
      userId: order.user_id,
      totalAmount: order.total_amount,
      couponCode: order.coupon_code,
      discountApplied: order.discount_applied,
      finalAmount: order.final_amount,
      totalOrderQuantity: order.total_order_quantity,
      status: order.status,
      requestedByRole: order.requested_by_role,
      higherRoleId: order.higher_role_id,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customerName: order.customer.full_name,  // Customer name
      customerImage: order.customer.image,    // Customer image
      customerMobile: order.customer.mobile_number, // Customer mobile number
      OrderItems: order.OrderItems.map(item => ({
        itemId: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        quantityType: item.quantity_type,
        basePrice: item.baseprice,
        finalPrice: item.final_price,
        itemVolume: item.item_volume,
        productName: item.product.name, // Product name
        productImage: item.product.image, // Product image
        productPrice: item.product.price, // Product price
        productDescription: item.product.description, // Product description
      }))
    }));

    return res.status(200).json({ orders: orderDetails });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Helper function to find subordinates based on the user's role
// const findSubordinateUsers = async (userId, role) => {
//   let whereCondition = {};

//   switch (role) {
//     case 'Area Development Officer':
//       whereCondition = { superior_ado: userId };
//       break;
//     case 'Master Distributor':
//       whereCondition = { superior_md: userId };
//       break;
//     case 'Super Distributor':
//       whereCondition = { superior_sd: userId };
//       break;
//     case 'Distributor':
//       whereCondition = { superior_d: userId };
//       break;
//     default:
//       return []; // No subordinates for roles like Customer
//   }

//   return await User.findAll({
//     where: whereCondition
//   });
// };
// Helper function to find subordinates based on the user's role
const findSubordinateUsers = async (userId) => {
  // Get the user's superior_id (they are subordinates under this ID)
  const user = await User.findByPk(userId);
  if (!user) {
    return [];
  }

  return await User.findAll({
    where: { superior_id: userId } // Fetch users whose superior_id is the logged-in user
  });
};



///////////*********get order detail**********/////////////// */

// Get Order Details
exports.getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id; // Assuming the order ID is passed in the request params

    const orderDetails = await Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: OrderItem,
          as: 'OrderItems', // Correct alias here
          include: [
            {
              model: Product,
              as: 'product', // Make sure this alias matches your Product model association
            },
          ],
        },
      ],
    });

    if (!orderDetails) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(orderDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};



//////////////Cncel Order ////////////////////
//////////////////////////////////////////////

exports.cancelOrder = async (req, res) => {
  const { orderId } = req.params; // Extract orderId from the URL parameters
  const userId = req.user.id; // Assuming you get the user ID from the decoded token

  try {
    // Find the order by ID
    const order = await Order.findOne({ where: { id: orderId } });

    // Check if the order exists
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the user is the creator of the order
    if (order.user_id !== userId) {
      return res.status(403).json({ message: 'You are not authorized to cancel this order' });
    }

    // Update the order status to 'Cancelled'
    order.status = 'Cancelled';
    await order.save();

    return res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


/////////Accept Ordr by hiery hirarchy////////////////
//////////////Accepted means sended //////////////////////////
// In your orderController.js
exports.acceptOrder = async (req, res) => {
  const { orderId } = req.params;
  const { id: userId } = req.user; // Extract 'id' from req.user (the logged-in user's ID)

  try {
    // Log the orderId and userId for debugging
    console.log("Accepting Order - Order ID:", orderId, "User ID:", userId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. No user ID found." });
    }

    // Find the order by its ID and ensure the logged-in user is the 'higher_role_id' (the person the order was requested to)
    const order = await Order.findOne({ where: { id: orderId, higher_role_id: userId } });

    if (!order) {
      return res.status(404).json({ message: "Order not found or you are not authorized to accept this order." });
    }

    // Fetch the username of the user who created the order
    const orderCreator = await User.findByPk(order.user_id, { attributes: ['username', 'full_name'] });

    if (!orderCreator) {
      return res.status(404).json({ message: "Order creator not found." });
    }

    // Fetch the username of the higher role user (the one accepting the order)
    const higherRoleUser = await User.findByPk(userId, { attributes: ['username', 'full_name'] });

    if (!higherRoleUser) {
      return res.status(404).json({ message: "Higher role user not found." });
    }

    // Update order status to 'Accepted'
    order.status = 'Accepted';
    await order.save();

    //****** Notification Logic ******//
    const notificationMessage = `Order ID: ${orderId} has been accepted by ${higherRoleUser.full_name}`;
    const gallery = "1733391571619.jpeg"; // Image filename for accepted orders

    const notificationDetails = {
      user_name: orderCreator.full_name,
      accepted_by: higherRoleUser.full_name,
      total_amount: order.total_amount,
      type: 'order_accept',
    };

    // Debugging the gallery value
    console.log("Gallery value being inserted:", gallery);

    // Create the notification
    await Notification.create({
      user_id: order.user_id,
      message: notificationMessage,
      photo: gallery, // Ensure the gallery value is passed
      is_read: false,
      created_at: new Date(),
      detail: notificationDetails,
    })
      .then(() => {
        console.log("Notification created successfully with photo:", gallery);
      })
      .catch((err) => {
        console.error("Error inserting notification photo:", err);
      });

    // Response for successful order acceptance
    res.status(200).json({ message: "Order accepted successfully.", order });
  } catch (error) {
    console.error("Error while accepting order:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};




///ADMIN GET PENDING ORDERS



exports.getOrdersBySubordinatesAdmin = async (req, res) => {
  try {
    // Fetch only required fields and avoid unnecessary processing to improve performance
    const orders = await Order.findAll({
      where: {
        higher_role_id: 1, // Filter only higher_role_id = 1
        status: ['Pending', 'Accepted', 'Cancelled'], // Filter required statuses
      },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['full_name', 'image', 'mobile_number'], // Only fetch necessary fields
        },
        {
          model: OrderItem,
          as: 'OrderItems',
          attributes: ['id', 'product_id', 'quantity', 'quantity_type', 'baseprice', 'final_price', 'item_volume'],
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['name', 'image', 'price', 'description'], // Fetch product details
            },
          ],
        },
      ],
      attributes: ['id', 'order_id', 'total_amount', 'coupon_code', 'discount_applied', 'final_amount', 'total_order_quantity', 'status', 'createdAt', 'updatedAt'], // Added 'order_id' here
    });

    // Handle empty results
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found' });
    }

    // Map orders to the desired structure
    const orderDetails = orders.map(order => ({
      orderId: order.id,
      orderUniqueId: order.order_id, // Accessing order_id
      totalAmount: order.total_amount,
      couponCode: order.coupon_code,
      discountApplied: order.discount_applied,
      finalAmount: order.final_amount,
      totalOrderQuantity: order.total_order_quantity,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customer: order.customer
        ? {
            name: order.customer.full_name,
            image: order.customer.image,
            mobile: order.customer.mobile_number,
          }
        : null,
      OrderItems: order.OrderItems.map(item => ({
        itemId: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        quantityType: item.quantity_type,
        basePrice: item.baseprice,
        finalPrice: item.final_price,
        itemVolume: item.item_volume,
        product: item.product
          ? {
              name: item.product.name,
              image: item.product.image,
              price: item.product.price,
              description: item.product.description,
            }
          : null,
      })),
    }));

    // Immediately respond with the processed data
    return res.status(200).json({ orders: orderDetails });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};



exports.acceptOrRejectOrder = async (req, res) => {
  const { orderId } = req.params; // Get orderId from URL parameters
  const { action } = req.body; 
  const userId = req.user.id; 
  const userRole = req.user.role_name; 

  try {
    // Find the order by its ID
    const order = await Order.findByPk(orderId);
    //
    const user = await User.findByPk(userId, { attributes: ['full_name'] });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userName = user.full_name;

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'Accepted' || order.status === 'Cancelled') {
      return res.status(400).json({ message: 'Order already processed' });
    }

    if (action !== 'accept' && action !== 'reject') {
      return res.status(400).json({ message: 'Invalid action' });
    }

    // Fetch order items for the given order ID
    const orderItems = await OrderItem.findAll({
      where: { order_id: orderId },
      attributes: ['product_id', 'quantity'],
    });

    if (!orderItems || orderItems.length === 0) {
      return res.status(404).json({ message: 'No items found for this order' });
    }

    if (action === 'accept') {
      for (const item of orderItems) {
        const productId = item.product_id;
        const requestedQuantity = item.quantity;
    
        if (userRole === 'Admin') {
          const product = await Product.findByPk(productId, { attributes: ['id', 'name', 'stock_quantity'] });
    
          if (!product) {
            return res.status(400).json({
              message: `Product with ID ${productId} not found.`,
            });
          }
    
          if (requestedQuantity > product.stock_quantity) {
            return res.status(400).json({
              message: `Insufficient stock for product "${product.name}". Available: ${product.stock_quantity}, Requested: ${requestedQuantity}`,
            });
          }
    
          const updatedStockQuantity = product.stock_quantity - requestedQuantity;
          product.stock_quantity = updatedStockQuantity; 
    
          await product.save(); 
    
          continue;
        }
    
        // Non-admin users: Calculate stockQuantity dynamically
        const receivedOrders = await OrderItem.findAll({
          where: {
            '$order.status$': 'Accepted',
            '$order.user_id$': userId,
            product_id: productId,
          },
          attributes: ['quantity'],
          include: [{
            model: Order,
            as: 'order',
            where: { status: 'Accepted', user_id: userId },
            attributes: [],
          }],
        });
    
        const soldOrders = await OrderItem.findAll({
          where: {
            '$order.status$': 'Accepted',
            '$order.higher_role_id$': userId,
            product_id: productId,
          },
          attributes: ['quantity'],
          include: [{
            model: Order,
            as: 'order',
            where: { status: 'Accepted', higher_role_id: userId },
            attributes: [],
          }],
        });
    
        // Calculate stockQuantity
        let stockQuantity = 0;
        receivedOrders.forEach((received) => {
          stockQuantity += parseFloat(received.quantity || 0);
        });
        soldOrders.forEach((sold) => {
          stockQuantity -= parseFloat(sold.quantity || 0);
        });
    
        // Fetch product name for non-admin users
        const product = await Product.findByPk(productId, { attributes: ['name'] });
        if (!product) {
          return res.status(400).json({
            message: `Product with ID ${productId} not found.`,
          });
        }
    
        // Check if requested quantity exceeds stockQuantity
        if (requestedQuantity > stockQuantity) {
          return res.status(400).json({
            message: `Insufficient stock for product "${product.name}". Available: ${stockQuantity}, Requested: ${requestedQuantity}`,
          });
        }
      }
    
      // If all items have sufficient stock, update the order status to 'Accepted'
      order.status = 'Accepted';
      //
      await Notification.create({
        user_id: order.user_id,
        message: `Order has been accepted by ${userName}.`,
        photo: "1733391571619.jpeg",
        detail: {
          orderUniqueId: order.order_id,
          status: 'Accepted',
          user_name: userName,
          role: userRole,
          type:"order_acceptReject"
        },
      });
    } else if (action === 'reject') {
      // Update the order status to 'Cancelled'
      order.status = 'Cancelled';
      //
      await Notification.create({
        user_id: order.user_id,
        message: `Order has been rejected by ${userName}.`,
        photo: "1733391593433.jpeg",
        detail: {
          orderUniqueId: order.order_id,
          status: 'Rejected',
          user_name: userName,
          role: userRole,
          type:"order_acceptReject"
        },
      });
    }
    
    // Save the updated order status
    await order.save();
    
    return res.json({ message: `Order ${action}ed successfully` });
    
  } catch (error) {
    console.error('Error processing order:', error); // Log the full error
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// exports.acceptOrRejectOrder = async (req, res) => {
//   const { orderId } = req.params; // Get orderId from URL parameters
//   const { action, productId, quantity } = req.body; 
//   const userId = req.user.id; // Logged-in user's ID
  

//   try {
//     // Find the order by its ID
//     const order = await Order.findByPk(orderId);

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     // Ensure the order is in a valid state to accept/reject
//     if (order.status === 'Accepted' || order.status === 'Cancelled') {
//       return res.status(400).json({ message: 'Order already processed' });
//     }

//     // Check if the action is valid
//     if (action !== 'accept' && action !== 'reject') {
//       return res.status(400).json({ message: 'Invalid action' });
//     }

//     if (action === 'accept') {
//       // Calculate stockQuantity dynamically
//       const receivedOrders = await OrderItem.findAll({
//         where: {
//           '$order.status$': 'Accepted',
//           '$order.user_id$': userId,
//           product_id: productId,
//         },
//         attributes: ['product_id', 'quantity'],
//         include: [{
//           model: Order,
//           as: 'order',
//           where: { status: 'Accepted', user_id: userId },
//           attributes: [],
//         }],
//       });

//       const soldOrders = await OrderItem.findAll({
//         where: {
//           '$order.status$': 'Accepted',
//           '$order.higher_role_id$': userId,
//           product_id: productId,
//         },
//         attributes: ['product_id', 'quantity'],
//         include: [{
//           model: Order,
//           as: 'order',
//           where: { status: 'Accepted', higher_role_id: userId },
//           attributes: [],
//         }],
//       });

//       // Calculate stockQuantity
//       let stockQuantity = 0;
//       receivedOrders.forEach((order) => {
//         stockQuantity += parseFloat(order.quantity || 0);
//       });
//       soldOrders.forEach((order) => {
//         stockQuantity -= parseFloat(order.quantity || 0);
//       });

//       // Check if requested quantity exceeds stockQuantity
//       if (quantity > stockQuantity) {
//         return res.status(400).json({
//           message: `Insufficient stock for product ID ${productId}. Available: ${stockQuantity}, Requested: ${quantity}`,
//         });
//       }

//       // Update the order status to 'Accepted'
//       order.status = 'Accepted';
//     } else if (action === 'reject') {
//       // Update the order status to 'Cancelled'
//       order.status = 'Cancelled';
//     }

//     // Save the updated order status
//     await order.save();

//     return res.json({ message: `Order ${action}ed successfully` });
//   } catch (error) {
//     console.error('Error processing order:', error); // Log the full error
//     return res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// exports.acceptOrRejectOrder = async (req, res) => {
//   const { orderId } = req.params; // Get orderId from URL parameters
//   const { action,productId,quantity } = req.body; 
//   const userId = req.user.id;

//   try {
//     // Find the order by its ID
//     const order = await Order.findByPk(orderId);

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     // Ensure the order is in a valid state to accept/reject
//     if (order.status === 'Accepted' || order.status === 'Cancelled') {
//       return res.status(400).json({ message: 'Order already processed' });
//     }

//     // Check if the action is valid
//     if (action !== 'accept' && action !== 'reject') {
//       return res.status(400).json({ message: 'Invalid action' });
//     }

//     // Update the order status based on the action
//     if (action === 'accept') {
//       order.status = 'Accepted';
//     } else if (action === 'reject') {
//       order.status = 'Cancelled';
//     }

//     // Save the updated order status
//     await order.save();

//     return res.json({ message: `Order ${action}ed successfully` });
//   } catch (error) {
//     console.error('Error processing order:', error); // Log the full error
//     return res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };






// exports.getOrdersByUser = async (req, res) => {
//   const { user_id } = req.params; // Expecting user_id as a URL parameter

//   try {
//     // Check if user exists
//     const orders = await Order.findAll({
//       where: { user_id },
//       include: [{
//         model: OrderItem,
//         as: 'OrderItems', // Make sure this matches the alias used in the Order model
//         required: false,
//         include: [
//           {
//             model: Product,
//             as: 'product',
//           },
//         ],
//       }],
//     });

//     if (orders.length === 0) {
//       return res.status(404).json({ message: 'No orders found for this user' });
//     }

//     // Calculate total quantity for each order
//     const ordersWithTotalQuantity = orders.map(order => {
//       // Calculate total order quantity by summing up the quantity of all OrderItems
//       const totalOrderQuantity = order.OrderItems.reduce((total, item) => total + item.quantity, 0);

//       return {
//         ...order.toJSON(), // Convert Sequelize model instance to plain object
//         total_order_quantity: totalOrderQuantity,
//       };
//     });

//     return res.status(200).json({ orders: ordersWithTotalQuantity });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Internal server error', error: error.message });
//   }
// };