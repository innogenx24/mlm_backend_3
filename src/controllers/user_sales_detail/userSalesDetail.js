const {
  Order,
  Product,
  OrderItem,
  User,
  SalesStockTarget,
} = require("../../../models");
const { Op } = require("sequelize");

exports.getMonthlySalesDetailsWeb = async (req, res) => {
  const { role_id, user_id } = req.params;
  let { month, year } = req.query;

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Fetch target amounts based on the user's role
    const roleTarget = await SalesStockTarget.findOne({
      where: { role_name: user.role_name },
    });
    if (!roleTarget) {
      return res
        .status(404)
        .json({ success: false, message: "Role target not found" });
    }
    const totalMonthlyTarget = parseFloat(roleTarget.target) || 0;
    const totalStockTarget = parseFloat(roleTarget.stock_target) || 0;

    let startOfMonth, endOfMonth;
    if (month && year) {
      month = parseInt(month);
      year = parseInt(year);
      if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: "Invalid month or year provided in query parameters",
        });
      }

      // Set startOfMonth to the 1st of the month (set time to 00:00:00 to avoid timezone issues)
      startOfMonth = new Date(Date.UTC(year, month - 1, 1));

      // Set endOfMonth to the last day of the month (Feb 2025 will be 28, for example)
      endOfMonth = new Date(Date.UTC(year, month, 0)); // The 0th day of the next month gives the last day of the current month
    } else {
      const currentDate = new Date();
      startOfMonth = new Date(
        Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1)
      );
      endOfMonth = new Date(
        Date.UTC(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      );
    }

    let loginUsertotalSales = 0;

    loginUsertotalSales =
      (await Order.sum("total_amount", {
        where: {
          higher_role_id: user_id,
          status: "Accepted",
          updatedAt: {
            [Op.gte]: new Date(startOfMonth),
            [Op.lte]: new Date(endOfMonth),
          },
        },
      })) || 0;

    // --- Calculate Sales Achievement ---
    const acceptedOrders = await Order.findAll({
      where: {
        higher_role_id: user_id,
        status: "Accepted",
        created_at: { [Op.between]: [startOfMonth, endOfMonth] },
      },
      include: [
        {
          model: OrderItem,
          as: "OrderItems",
          include: {
            model: Product,
            as: "product",
            required: true,
          },
        },
      ],
    });

    let totalAchievementAmount = 0;
    for (const order of acceptedOrders) {
      const orderUser = await User.findByPk(order.higher_role_id);
      const roleName = orderUser ? orderUser.role_name : "";

      for (const orderItem of order.OrderItems) {
        const product = orderItem.product;
        let price = 0;
        switch (roleName) {
          case "Super Distributor":
            price = product.distributorPrice || 0;
            break;
          case "Distributor":
            price = product.price || 0;
            break;
          case "Master Distributor":
            price = product.sdPrice || 0;
            break;
          case "Area Development Officer":
            price = product.mdPrice || 0;
            break;
          case "Customer":
            price = product.price || 0;
            break;
          default:
            price = 0;
        }
        totalAchievementAmount += price * (parseInt(orderItem.quantity) || 0);
      }
    }

    // --- Calculate Stock Achievement ---
    const acceptedOrdersForStock = await Order.findAll({
      where: {
        user_id: user_id,
        status: "Accepted",
        created_at: { [Op.between]: [startOfMonth, endOfMonth] },
      },
    });
    const totalStockAchievement = acceptedOrdersForStock.reduce(
      (total, order) => {
        return total + (parseFloat(order.final_amount) || 0);
      },
      0
    );

    // --- Compute Pending Amounts and Percentages ---
    const pendingAmount = Math.max(0, totalMonthlyTarget - loginUsertotalSales);
    const pendingStockTarget = Math.max(
      0,
      totalStockTarget - totalStockAchievement
    );

    const achievementAmountPercent = Math.min(
      100,
      Math.max(0, (loginUsertotalSales / totalMonthlyTarget) * 100)
    );
    const unachievementAmountPercent = 100 - achievementAmountPercent;

    const stockAchievementPercent = Math.min(
      100,
      Math.max(0, (totalStockAchievement / totalStockTarget) * 100)
    );
    const stockUnachievementPercent = 100 - stockAchievementPercent;

    const monthName = startOfMonth.toLocaleString("default", { month: "long" });

    const monthlyDetail = {
      month: monthName,
      year: startOfMonth.getFullYear(),
      MonthlyTargetAmount: totalMonthlyTarget,
      AchievementAmount: loginUsertotalSales,
      pendingAmount: pendingAmount,
      achievementAmountPercent: achievementAmountPercent.toFixed(2),
      unachievementAmountPercent: unachievementAmountPercent.toFixed(2),
      StockTarget: totalStockTarget,
      StockAchievement: totalStockAchievement,
      PendingStockTarget: pendingStockTarget,
      StockAchievementPercent: stockAchievementPercent.toFixed(2),
      StockUnachievementPercent: stockUnachievementPercent.toFixed(2),
      startOfMonth: startOfMonth.toISOString().split("T")[0], // '2025-02-01'
      endOfMonth: endOfMonth.toISOString().split("T")[0], // '2025-02-28'
    };

    return res.status(200).json({
      success: true,
      role: user.role_name,
      user_id,
      monthlyDetails: monthlyDetail,
    });
  } catch (error) {
    console.error("Error fetching monthly sales details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly sales details",
      error: error.message,
    });
  }
};

exports.getMonthlySalesDetails = async (req, res) => {
  const { role_id, user_id } = req.params;

  try {
    // Fetch user details for creation date
    const user = await User.findByPk(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userCreatedAt = new Date(user.createdAt);
    const currentDate = new Date();

    // Fetch SalesStockTarget based on user's role_name
    const roleTarget = await SalesStockTarget.findOne({
      where: {
        role_name: user.role_name,
      },
    });

    if (!roleTarget) {
      return res
        .status(404)
        .json({ success: false, message: "Role target not found" });
    }

    const totalMonthlyTarget = parseFloat(roleTarget.target) || 0;
    const totalStockTarget = parseFloat(roleTarget.stock_target) || 0;

    // Initialize results
    const monthlyDetails = [];

    // Helper function to iterate month-by-month
    const getMonthsBetweenDates = (start, end) => {
      const months = [];
      const current = new Date(start);
      while (current <= end) {
        months.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
      }
      return months;
    };

    const months = getMonthsBetweenDates(userCreatedAt, currentDate);

    // const startDate = new Date(
    //   currentDate.getFullYear(),
    //   currentDate.getMonth(),
    //   1
    // );
    // const endDate = new Date(
    //   currentDate.getFullYear(),
    //   currentDate.getMonth() + 1,
    //   0
    // );

    // loginUsertotalSales =
    //   (await Order.sum("total_amount", {
    //     where: {
    //       higher_role_id: user_id,
    //       status: "Accepted",
    //       updatedAt: { [Op.between]: [startDate, endDate] },
    //     },
    //   })) || 0;



    for (const targetDate of months) {
      // const startOfMonth = new Date(
      //   targetDate.getFullYear(),
      //   targetDate.getMonth(),
      //   1
      // );
      // const endOfMonth = new Date(
      //   targetDate.getFullYear(),
      //   targetDate.getMonth() + 1,
      //   0
      // );

      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

      // Fetch total sales (Accepted orders only)
      const loginUsertotalSales = await Order.sum("total_amount", {
        where: {
          higher_role_id: user_id,
          status: "Accepted",
          updatedAt: { [Op.between]: [startOfMonth, endOfMonth] },
        },
      }) || 0;

      // Fetch all accepted orders for the user within the target month
      const acceptedOrders = await Order.findAll({
        where: {
          higher_role_id: user_id,
          status: "Accepted",
          created_at: { [Op.between]: [startOfMonth, endOfMonth] },
        },
        include: [
          {
            model: OrderItem,
            as: "OrderItems",
            include: {
              model: Product,
              as: "product",
              required: true,
            },
          },
        ],
      });

      const acceptedOrdersForStock = await Order.findAll({
        where: {
          user_id: user_id,
          status: "Accepted",
          created_at: { [Op.between]: [startOfMonth, endOfMonth] },
        },
      });

      // Calculate total achievement amount
      let totalAchievementAmount = 0;
      for (const order of acceptedOrders) {
        const orderUser = await User.findByPk(order.higher_role_id);
        const roleName = orderUser ? orderUser.role_name : "";

        for (const orderItem of order.OrderItems) {
          const product = orderItem.product;
          let price = 0;

          switch (roleName) {
            case "Super Distributor":
              price = product.distributorPrice || 0;
              break;
            case "Distributor":
              price = product.price || 0;
              break;
            case "Master Distributor":
              price = product.mdPrice || 0;
              break;
            case "Area Development Officer":
              price = product.mdPrice || 0;
              break;
            case "Customer":
              price = product.price || 0;
              break;
            default:
              price = 0;
              break;
          }

          totalAchievementAmount += price * (parseInt(orderItem.quantity) || 0);
        }
      }

      // Calculate total stock achievement
      // const totalStockAchievement = acceptedOrders.reduce((total, order) => {
      //   return total + order.OrderItems.reduce((subtotal, item) => subtotal + (parseInt(item.quantity) || 0), 0);
      // }, 0);
      const totalStockAchievement = acceptedOrdersForStock.reduce(
        (total, order) => {
          return total + (parseFloat(order.final_amount) || 0);
        },
        0
      );

      // Ensure no negative values
      const pendingAmount = Math.max(
        0,
        totalMonthlyTarget - loginUsertotalSales
      );
      const pendingStockTarget = Math.max(
        0,
        totalStockTarget - totalStockAchievement
      );

      // Calculate percentages capped between 0 and 100
      const achievementAmountPercent = Math.min(
        100,
        Math.max(0, (loginUsertotalSales / totalMonthlyTarget) * 100)
      );
      const unachievementAmountPercent = 100 - achievementAmountPercent;

      const stockAchievementPercent = Math.min(
        100,
        Math.max(0, (totalStockAchievement / totalStockTarget) * 100)
      );
      const stockUnachievementPercent = 100 - stockAchievementPercent;

      // Add current month's details to the result
      monthlyDetails.push({
        month: startOfMonth.toLocaleString("default", { month: "long" }),
        year: startOfMonth.getFullYear(),
        MonthlyTargetAmount: totalMonthlyTarget,
        AchievementAmount: loginUsertotalSales,
        pendingAmount: pendingAmount,
        achievementAmountPercent: achievementAmountPercent.toFixed(2),
        unachievementAmountPercent: unachievementAmountPercent.toFixed(2),
        StockTarget: totalStockTarget,
        StockAchievement: totalStockAchievement,
        PendingStockTarget: pendingStockTarget,
        StockAchievementPercent: stockAchievementPercent.toFixed(2),
        StockUnachievementPercent: stockUnachievementPercent.toFixed(2),
      });
    }

    // Check if this month's data is missing and add it dynamically
    const currentMonthDetails = monthlyDetails.find(
      (detail) =>
        detail.month ===
          currentDate.toLocaleString("default", { month: "long" }) &&
        detail.year === currentDate.getFullYear()
    );

    // If current month's data is not found, calculate it manually
    if (!currentMonthDetails) {
      const startOfCurrentMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endOfCurrentMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const acceptedOrdersForCurrentMonth = await Order.findAll({
        where: {
          higher_role_id: user_id,
          status: "Accepted",
          created_at: {
            [Op.between]: [startOfCurrentMonth, endOfCurrentMonth],
          },
        },
        include: [
          {
            model: OrderItem,
            as: "OrderItems",
            include: {
              model: Product,
              as: "product",
              required: true,
            },
          },
        ],
      });

      let totalAchievementAmountCurrent = 0;
      // let totalStockAchievementCurrent = 0;

      for (const order of acceptedOrdersForCurrentMonth) {
        const orderUser = await User.findByPk(order.higher_role_id);
        const roleName = orderUser ? orderUser.role_name : "";

        for (const orderItem of order.OrderItems) {
          const product = orderItem.product;
          let price = 0;

          switch (roleName) {
            case "Super Distributor":
              price = product.sdPrice || 0;
              break;
            case "Distributor":
              price = product.distributorPrice || 0;
              break;
            case "Master Distributor":
              price = product.mdPrice || 0;
              break;
            case "Area Development Officer":
              price = product.adoPrice || 0;
              break;
            case "Customer":
              price = product.price || 0;
              break;
            default:
              price = 0;
              break;
          }

          totalAchievementAmountCurrent +=
            price * (parseInt(orderItem.quantity) || 0);
        }
      }

      const acceptedOrdersForCurrentMonthForStock = await Order.findAll({
        where: {
          user_id: user_id, // Notice the filter change here!
          status: "Accepted",
          created_at: {
            [Op.between]: [startOfCurrentMonth, endOfCurrentMonth],
          },
        },
      });

      const totalStockAchievementCurrent =
        acceptedOrdersForCurrentMonthForStock.reduce((total, order) => {
          return total + (parseFloat(order.final_amount) || 0);
        }, 0);

      // totalStockAchievementCurrent = acceptedOrdersForCurrentMonth.reduce((total, order) => {
      //   return total + order.OrderItems.reduce((subtotal, item) => subtotal + (parseInt(item.quantity) || 0), 0);
      // }, 0);

      const pendingAmountCurrent = Math.max(
        0,
        totalMonthlyTarget - totalAchievementAmountCurrent
      );
      const pendingStockTargetCurrent = Math.max(
        0,
        totalStockTarget - totalStockAchievementCurrent
      );

      const achievementAmountPercentCurrent = Math.min(
        100,
        Math.max(0, (totalAchievementAmountCurrent / totalMonthlyTarget) * 100)
      );
      const unachievementAmountPercentCurrent =
        100 - achievementAmountPercentCurrent;

      const stockAchievementPercentCurrent = Math.min(
        100,
        Math.max(0, (totalStockAchievementCurrent / totalStockTarget) * 100)
      );
      const stockUnachievementPercentCurrent =
        100 - stockAchievementPercentCurrent;

      monthlyDetails.push({
        month: currentDate.toLocaleString("default", { month: "long" }),
        year: currentDate.getFullYear(),
        MonthlyTargetAmount: totalMonthlyTarget,
        AchievementAmount: totalAchievementAmountCurrent,
        pendingAmount: pendingAmountCurrent,
        achievementAmountPercent: achievementAmountPercentCurrent.toFixed(2),
        unachievementAmountPercent:
          unachievementAmountPercentCurrent.toFixed(2),
        StockTarget: totalStockTarget,
        StockAchievement: totalStockAchievementCurrent,
        PendingStockTarget: pendingStockTargetCurrent,
        StockAchievementPercent: stockAchievementPercentCurrent.toFixed(2),
        StockUnachievementPercent: stockUnachievementPercentCurrent.toFixed(2),
      });
    }

    // Respond with the monthly details
    return res.status(200).json({
      success: true,
      role: user.role_name,
      user_id,
      // monthlyDetails,
      monthlyDetails: monthlyDetails.reverse(),
    });
  } catch (error) {
    console.error("Error fetching monthly sales details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly sales details",
      error: error.message,
    });
  }
};

// exports.getLowHierarchySalesDetails = async (req, res) => {
//   const { user_id } = req.params;

//   try {
//     // Fetch users under the given user_id (lower hierarchy)
//     const lowerHierarchyUsers = await User.findAll({
//       where: {
//         superior_id: user_id,
//         role_name: { [Op.ne]: "Customer" },
//       },
//     });

//     if (!lowerHierarchyUsers || lowerHierarchyUsers.length === 0) {
//       return res
//         .status(404)
//         .json({ success: false, message: "No lower hierarchy users found" });
//     }

//     const result = [];

//     // Iterate over each lower hierarchy user
//     for (const user of lowerHierarchyUsers) {
//       const role = user.role_name;
//       const photo = user.image;
//       const userCreatedAt = new Date(user.createdAt);
//       const currentDate = new Date();

//       let totalMonthlyTarget = 0;
//       let totalStockTarget = 0;
//       const monthlyDetails = [];

//       let targetDate = new Date(userCreatedAt);
//       while (targetDate <= currentDate) {
//         const startOfMonth = new Date(
//           targetDate.getFullYear(),
//           targetDate.getMonth(),
//           1
//         );
//         const endOfMonth = new Date(
//           targetDate.getFullYear(),
//           targetDate.getMonth() + 1,
//           0
//         );

//         // Fetch the SalesStockTarget for the current user's role
//         const roleTarget = await SalesStockTarget.findOne({
//           where: { role_name: role },
//         });

//         if (roleTarget) {
//           totalMonthlyTarget = parseFloat(roleTarget.target) || 0;
//           totalStockTarget = parseFloat(roleTarget.stock_target) || 0;
//         }

//         // Fetch accepted orders for the user within the month
//         const acceptedOrders = await Order.findAll({
//           where: {
//             higher_role_id: user.id,
//             status: "Accepted",
//             created_at: { [Op.between]: [startOfMonth, endOfMonth] },
//           },
//           include: [
//             {
//               model: OrderItem,
//               as: "OrderItems",
//               include: {
//                 model: Product,
//                 as: "product",
//                 required: true,
//               },
//             },
//           ],
//         });

//         // Calculate total achievement amount and stock achievement
//         let totalAchievementAmount = 0;
//         let totalStockAchievement = 0;

//         for (const order of acceptedOrders) {
//           for (const orderItem of order.OrderItems) {
//             const product = orderItem.product;
//             let price = 0;

//             switch (role) {
//               case "Super Distributor":
//                 price = product.sdPrice || 0;
//                 break;
//               case "Distributor":
//                 price = product.distributorPrice || 0;
//                 break;
//               case "Master Distributor":
//                 price = product.mdPrice || 0;
//                 break;
//               case "Area Development Officer":
//                 price = product.adoPrice || 0;
//                 break;
//             }

//             totalAchievementAmount +=
//               price * (parseInt(orderItem.quantity) || 0);
//             totalStockAchievement += parseInt(orderItem.quantity) || 0;
//           }
//         }

//         // Calculate percentages and ensure they're within valid bounds
//         const achievementAmountPercent = Math.min(
//           Math.max(
//             totalMonthlyTarget > 0
//               ? (totalAchievementAmount / totalMonthlyTarget) * 100
//               : 0,
//             0
//           ),
//           100
//         );
//         const unachievementAmountPercent = Math.min(
//           100 - achievementAmountPercent,
//           100
//         );

//         const stockAchievementPercent = Math.min(
//           Math.max(
//             totalStockTarget > 0
//               ? (totalStockAchievement / totalStockTarget) * 100
//               : 0,
//             0
//           ),
//           100
//         );
//         const stockUnachievementPercent = Math.min(
//           100 - stockAchievementPercent,
//           100
//         );

//         const pendingAmount = Math.max(
//           totalMonthlyTarget - totalAchievementAmount,
//           0
//         );
//         const pendingStockTarget = Math.max(
//           totalStockTarget - totalStockAchievement,
//           0
//         );

//         monthlyDetails.push({
//           month: startOfMonth.toLocaleString("default", { month: "long" }),
//           year: startOfMonth.getFullYear(),
//           totalMonthlyTarget,
//           totalAchievementAmount,
//           pendingAmount,
//           achievementAmountPercent: achievementAmountPercent.toFixed(2),
//           unachievementAmountPercent: unachievementAmountPercent.toFixed(2),
//           totalStockTarget,
//           totalStockAchievement,
//           pendingStockTarget,
//           stockAchievementPercent: stockAchievementPercent.toFixed(2),
//           stockUnachievementPercent: stockUnachievementPercent.toFixed(2),
//           roleName: role,
//           roleId: user.role_id,
//         });

//         targetDate.setMonth(targetDate.getMonth() + 1);
//       }

//       // Sort the monthlyDetails array to display the current year and current month first
//       monthlyDetails.sort((a, b) => {
//         if (b.year !== a.year) {
//           return b.year - a.year; // Sort by year in descending order
//         }
//         return b.month.localeCompare(a.month, "en", { month: "short" }); // Sort by month in descending order
//       });

//       result.push({
//         user_id: user.id,
//         full_name: user.full_name,
//         image: photo,
//         monthlyDetails,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       result,
//     });
//   } catch (error) {
//     console.error("Error fetching lower hierarchy sales details:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch sales details",
//       error: error.message,
//     });
//   }
// };

///****** User Sales Detail *******///



exports.getLowHierarchySalesDetails = async (req, res) => {
  const { user_id, month_year } = req.params; // Extract year and month from request params

  try {
    // Parse the received month_year (e.g., "2025-02")
    const [year, month] = month_year.split("-").map(Number);

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid year or month format. Use YYYY-MM.",
      });
    }

    // Fetch lower hierarchy users under the given user_id
    const lowerHierarchyUsers = await User.findAll({
      where: {
        superior_id: user_id,
        role_name: { [Op.ne]: "Customer" },
      },
    });

    if (!lowerHierarchyUsers || lowerHierarchyUsers.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No lower hierarchy users found" });
    }

    const result = [];

    for (const user of lowerHierarchyUsers) {
      const role = user.role_name;
      const photo = user.image;

      // Fetch the SalesStockTarget for the current user's role
      const roleTarget = await SalesStockTarget.findOne({
        where: { role_name: role },
      });

      const totalMonthlyTarget = roleTarget ? parseFloat(roleTarget.target) || 0 : 0;
      const totalStockTarget = roleTarget ? parseFloat(roleTarget.stock_target) || 0 : 0;

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);

      // Fetch accepted orders for the user within the selected month & year
      const acceptedOrders = await Order.findAll({
        where: {
          higher_role_id: user.id,
          status: "Accepted",
          created_at: { [Op.between]: [startOfMonth, endOfMonth] },
        },
        include: [
          {
            model: OrderItem,
            as: "OrderItems",
            include: {
              model: Product,
              as: "product",
              required: true,
            },
          },
        ],
      });

      let totalAchievementAmount = 0;
      let totalStockAchievement = 0;

      for (const order of acceptedOrders) {
        for (const orderItem of order.OrderItems) {
          const product = orderItem.product;
          let price = 0;

          switch (role) {
            case "Super Distributor":
              price = product.distributorPrice || 0;
              break;
            case "Distributor":
              price = product.price || 0;
              break;
            case "Master Distributor":
              price = product.sdPrice || 0;
              break;
            case "Area Development Officer":
              price = product.mdPrice || 0;
              break;
          }

          totalAchievementAmount += price * (parseInt(orderItem.quantity) || 0);
          totalStockAchievement += parseInt(orderItem.quantity) || 0;
        }
      }

      const achievementAmountPercent = Math.min(
        Math.max(totalMonthlyTarget > 0 ? (totalAchievementAmount / totalMonthlyTarget) * 100 : 0, 0),
        100
      );

      const unachievementAmountPercent = 100 - achievementAmountPercent;

      const stockAchievementPercent = Math.min(
        Math.max(totalStockTarget > 0 ? (totalStockAchievement / totalStockTarget) * 100 : 0, 0),
        100
      );

      const stockUnachievementPercent = 100 - stockAchievementPercent;

      const pendingAmount = Math.max(totalMonthlyTarget - totalAchievementAmount, 0);
      const pendingStockTarget = Math.max(totalStockTarget - totalStockAchievement, 0);

      result.push({
        user_id: user.id,
        full_name: user.full_name,
        image: photo,
        monthlyDetails: {
          month: startOfMonth.toLocaleString("default", { month: "long" }),
          year: startOfMonth.getFullYear(),
          totalMonthlyTarget,
          totalAchievementAmount,
          pendingAmount,
          achievementAmountPercent: achievementAmountPercent.toFixed(2),
          unachievementAmountPercent: unachievementAmountPercent.toFixed(2),
          totalStockTarget,
          totalStockAchievement,
          pendingStockTarget,
          stockAchievementPercent: stockAchievementPercent.toFixed(2),
          stockUnachievementPercent: stockUnachievementPercent.toFixed(2),
          roleName: role,
          roleId: user.role_id,
        },
      });
    }

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error fetching lower hierarchy sales details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sales details",
      error: error.message,
    });
  }
};


exports.getUserCurrentMonthSalesDetailsId = async (req, res) => {
  const { user_id } = req.params;

  try {
    // Fetch the user details for the given user_id
    const user = await User.findOne({
      where: {
        id: user_id,
        role_name: { [Op.ne]: "Customer" }, // Ensure the user is not a customer
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const role = user.role_name;
    const photo = user.image;
    const userCreatedAt = new Date(user.createdAt);
    const currentDate = new Date();

    let totalMonthlyTarget = 0;
    let totalStockTarget = 0;
    const monthlyDetails = [];

    // Focus only on the current month
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // Fetch the SalesStockTarget for the current user's role
    const roleTarget = await SalesStockTarget.findOne({
      where: { role_name: role },
    });

    if (roleTarget) {
      totalMonthlyTarget = parseFloat(roleTarget.target) || 0;
      totalStockTarget = parseFloat(roleTarget.stock_target) || 0;
    }

    // Fetch accepted orders for the user within the current month
    const acceptedOrders = await Order.findAll({
      where: {
        higher_role_id: user.id,
        status: "Accepted",
        created_at: { [Op.between]: [startOfMonth, endOfMonth] },
      },
      include: [
        {
          model: OrderItem,
          as: "OrderItems",
          include: {
            model: Product,
            as: "product",
            required: true,
          },
        },
      ],
    });

    // Calculate total achievement amount and stock achievement for the current month
    let totalAchievementAmount = 0;
    let totalStockAchievement = 0;

    for (const order of acceptedOrders) {
      for (const orderItem of order.OrderItems) {
        const product = orderItem.product;
        let price = 0;

        switch (role) {
          case "Super Distributor":
            price = product.sdPrice || 0;
            break;
          case "Distributor":
            price = product.distributorPrice || 0;
            break;
          case "Master Distributor":
            price = product.mdPrice || 0;
            break;
          case "Area Development Officer":
            price = product.adoPrice || 0;
            break;
        }

        totalAchievementAmount += price * (parseInt(orderItem.quantity) || 0);
        totalStockAchievement += parseInt(orderItem.quantity) || 0;
      }
    }

    // Calculate percentages and ensure they're within valid bounds
    const achievementAmountPercent = Math.min(
      Math.max(
        totalMonthlyTarget > 0
          ? (totalAchievementAmount / totalMonthlyTarget) * 100
          : 0,
        0
      ),
      100
    );
    const unachievementAmountPercent = Math.min(
      100 - achievementAmountPercent,
      100
    );

    const stockAchievementPercent = Math.min(
      Math.max(
        totalStockTarget > 0
          ? (totalStockAchievement / totalStockTarget) * 100
          : 0,
        0
      ),
      100
    );
    const stockUnachievementPercent = Math.min(
      100 - stockAchievementPercent,
      100
    );

    const pendingAmount = Math.max(
      totalMonthlyTarget - totalAchievementAmount,
      0
    );
    const pendingStockTarget = Math.max(
      totalStockTarget - totalStockAchievement,
      0
    );

    monthlyDetails.push({
      month: startOfMonth.toLocaleString("default", { month: "long" }),
      year: startOfMonth.getFullYear(),
      totalMonthlyTarget,
      totalAchievementAmount,
      pendingAmount,
      achievementAmountPercent: achievementAmountPercent.toFixed(2),
      unachievementAmountPercent: unachievementAmountPercent.toFixed(2),
      totalStockTarget,
      totalStockAchievement,
      pendingStockTarget,
      stockAchievementPercent: stockAchievementPercent.toFixed(2),
      stockUnachievementPercent: stockUnachievementPercent.toFixed(2),
      roleName: role,
      roleId: user.role_id,
    });

    return res.status(200).json({
      success: true,
      user_id: user.id,
      full_name: user.full_name,
      image: photo,
      monthlyDetails,
    });
  } catch (error) {
    console.error("Error fetching current month sales details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sales details",
      error: error.message,
    });
  }
};

// const { Order, Product, OrderItem, User, SalesStockTarget } = require('../../models');
// const { Op } = require('sequelize');

// exports.getMonthlySalesDetails = async (req, res) => {
//   const { role_id, user_id } = req.params;

//   try {
//     // Fetch user details for creation date
//     const user = await User.findByPk(user_id);
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     const userCreatedAt = new Date(user.createdAt);
//     const currentDate = new Date();

//     // Fetch SalesStockTarget based on user's role_name
//     const roleTarget = await SalesStockTarget.findOne({
//       where: {
//         role_name: user.role_name,
//       },
//     });

//     if (!roleTarget) {
//       return res.status(404).json({ success: false, message: 'Role target not found' });
//     }

//     const totalMonthlyTarget = parseFloat(roleTarget.target) || 0;
//     const totalStockTarget = parseFloat(roleTarget.stock_target) || 0;

//     // Initialize results
//     const monthlyDetails = [];

//     // Iterate month-by-month from userCreatedAt to the current month
//     let targetDate = new Date(userCreatedAt);
//     while (targetDate <= currentDate) {
//       const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
//       const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

//       // Fetch all accepted orders for the user within the target month
//       const acceptedOrders = await Order.findAll({
//         where: {
//           higher_role_id: user_id,
//           status: 'Accepted',
//           created_at: { [Op.between]: [startOfMonth, endOfMonth] }, // Filter by month range
//         },
//         include: [
//           {
//             model: OrderItem,
//             as: 'OrderItems',
//             include: {
//               model: Product,
//               as: 'product',
//               required: true,
//             },
//           },
//         ],
//       });

//       // Calculate total achievement amount
//       const totalAchievementAmount = await acceptedOrders.reduce(async (totalPromise, order) => {
//         let total = await totalPromise;

//         const user = await User.findByPk(order.higher_role_id);
//         const roleName = user ? user.role_name : '';

//         order.OrderItems.forEach((orderItem) => {
//           const product = orderItem.product;

//           let price = 0;
//           switch (roleName) {
//             case 'Super Distributor':
//               price = product.sdPrice || 0;
//               break;
//             case 'Distributor':
//               price = product.distributorPrice || 0;
//               break;
//             case 'Master Distributor':
//               price = product.mdPrice || 0;
//               break;
//             case 'Area Development Officer':
//               price = product.adoPrice || 0;
//               break;
//             case 'Customer':
//               price = product.price || 0;
//               break;
//             default:
//               price = 0;
//               break;
//           }

//           const orderTotal = price * (parseInt(orderItem.quantity) || 0);
//           total += orderTotal;
//         });

//         return total;
//       }, Promise.resolve(0));

//       // Calculate total stock achievement
//       const totalStockAchievement = acceptedOrders.reduce((total, order) => {
//         return total + order.OrderItems.reduce((subtotal, item) => subtotal + (parseInt(item.quantity) || 0), 0);
//       }, 0);

//       // Calculate pending amount
//       const pendingAmount = totalMonthlyTarget - totalAchievementAmount;
//       const pendingStockTarget = totalStockTarget - totalStockAchievement;

//       // Calculate achievement and unachievement percentages
//       const achievementAmountPercent =
//         totalMonthlyTarget > 0 ? (totalAchievementAmount / totalMonthlyTarget) * 100 : 0;
//       const unachievementAmountPercent = 100 - achievementAmountPercent;

//       // Add current month's details to the result
//       monthlyDetails.push({
//         month: startOfMonth.toLocaleString('default', { month: 'long' }),
//         year: startOfMonth.getFullYear(),
//         MonthlyTargetAmount: totalMonthlyTarget,
//         AchievementAmount: totalAchievementAmount,
//         pendingAmount,
//         achievementAmountPercent: achievementAmountPercent.toFixed(2),
//         unachievementAmountPercent: unachievementAmountPercent.toFixed(2),
//         StockTarget: totalStockTarget,
//         StockAchievement: totalStockAchievement,
//         PendingStockTarget: pendingStockTarget,
//         // StockAchievementPercent: totalStockTarget > 0 ? ((totalStockAchievement / totalStockTarget) * 100).toFixed(2) : '0.00',
//         StockAchievementPercent: totalStockTarget > 0 ? ((totalStockAchievement / totalStockTarget) * 100).toFixed(4) : '0.0000',

//         StockUnachievementPercent: totalStockTarget > 0 ? (100 - (totalStockAchievement / totalStockTarget) * 100).toFixed(2) : '100.00',
//       });

//       // Move to the next month
//       targetDate.setMonth(targetDate.getMonth() + 1);
//     }

//     // Respond with the monthly details
//     return res.status(200).json({
//       success: true,
//       role: user.role_name,
//       user_id,
//       monthlyDetails,
//     });
//   } catch (error) {
//     console.error('Error fetching monthly sales details:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch monthly sales details',
//       error: error.message,
//     });
//   }
// };

////////*******************///////////
////////*******************///////////

// const { SalesTarget, Order, Product, OrderItem, User } = require('../../models');
// const { Op } = require('sequelize');

// exports.getLowHierarchySalesDetails = async (req, res) => {
//   const { user_id } = req.params;

//   try {
//     // Fetch users under the given user_id (lower hierarchy)
//     const lowerHierarchyUsers = await User.findAll({
//       where: {
//         superior_id: user_id,
//         role_name: { [Op.ne]: 'Customer' }
//       },
//     });

//     if (!lowerHierarchyUsers || lowerHierarchyUsers.length === 0) {
//       return res.status(404).json({ success: false, message: 'No lower hierarchy users found' });
//     }

//     const result = [];

//     // Iterate over each lower hierarchy user
//     for (const user of lowerHierarchyUsers) {
//       const role = user.role_name;
//       const photo = user.image;
//       const userCreatedAt = new Date(user.createdAt);
//       const currentDate = new Date();

//       let totalMonthlyTarget = 0;
//       let totalStockTarget = 0;
//       const monthlyDetails = [];

//       let targetDate = new Date(userCreatedAt);
//       while (targetDate <= currentDate) {
//         const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
//         const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

//         // Fetch the SalesStockTarget for the current user's role
//         const roleTarget = await SalesStockTarget.findOne({
//           where: {
//             role_name: role,
//           },
//         });

//         if (roleTarget) {
//           totalMonthlyTarget = parseFloat(roleTarget.target) || 0;
//           totalStockTarget = parseFloat(roleTarget.stock_target) || 0;
//         } else {
//           totalMonthlyTarget = 0;
//           totalStockTarget = 0;
//         }

//         // Fetch accepted orders for the user within the month
//         const acceptedOrders = await Order.findAll({
//           where: {
//             higher_role_id: user.id,
//             status: 'Accepted',
//             created_at: { [Op.between]: [startOfMonth, endOfMonth] },
//           },
//           include: [
//             {
//               model: OrderItem,
//               as: 'OrderItems',
//               include: {
//                 model: Product,
//                 as: 'product',
//                 required: true,
//               },
//             },
//           ],
//         });

//         // Calculate total achievement amount and stock achievement
//         let totalAchievementAmount = 0;
//         let totalStockAchievement = 0;

//         for (const order of acceptedOrders) {
//           const user = await User.findByPk(order.higher_role_id);
//           const roleName = user ? user.role_name : '';

//           for (const orderItem of order.OrderItems) {
//             const product = orderItem.product;
//             let price = 0;

//             switch (roleName) {
//               case 'Super Distributor':
//                 price = product.sdPrice || 0;
//                 break;
//               case 'Distributor':
//                 price = product.distributorPrice || 0;
//                 break;
//               case 'Master Distributor':
//                 price = product.mdPrice || 0;
//                 break;
//               case 'Area Development Officer':
//                 price = product.adoPrice || 0;
//                 break;
//             }

//             const orderTotal = price * (parseInt(orderItem.quantity) || 0);
//             totalAchievementAmount += orderTotal;
//             totalStockAchievement += parseInt(orderItem.quantity) || 0;
//           }
//         }

//         // Calculate percentages
//         const achievementAmountPercent =
//           totalMonthlyTarget > 0 ? (totalAchievementAmount / totalMonthlyTarget) * 100 : 0;
//         const unachievementAmountPercent = 100 - achievementAmountPercent;

//         const stockAchievementPercent =
//           totalStockTarget > 0 ? (totalStockAchievement / totalStockTarget) * 100 : 0;
//         const stockUnachievementPercent = 100 - stockAchievementPercent;

//         const pendingStockTarget = totalStockTarget - totalStockAchievement;

//         monthlyDetails.push({
//           month: startOfMonth.toLocaleString('default', { month: 'long' }),
//           year: startOfMonth.getFullYear(),
//           totalMonthlyTarget,
//           totalAchievementAmount,
//           pendingAmount: totalMonthlyTarget - totalAchievementAmount,
//           achievementAmountPercent: achievementAmountPercent.toFixed(2),
//           unachievementAmountPercent: unachievementAmountPercent.toFixed(2),
//           totalStockTarget,
//           totalStockAchievement,
//           pendingStockTarget: pendingStockTarget,
//           stockAchievementPercent: stockAchievementPercent.toFixed(2),
//           stockUnachievementPercent: stockUnachievementPercent.toFixed(2),
//           roleName: role,
//           roleId: user.role_id,
//         });

//         targetDate.setMonth(targetDate.getMonth() + 1);
//       }

//       result.push({
//         user_id: user.id,
//         full_name: user.full_name,
//         image: photo,
//         monthlyDetails,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       result,
//     });
//   } catch (error) {
//     console.error('Error fetching lower hierarchy sales details:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch sales details',
//       error: error.message,
//     });
//   }
// };

//////OVERAL YEARLY CALCULATIONS DATA///////

exports.getYearlySalesDetails = async (req, res) => {
  const { role_id, user_id } = req.params;

  try {
    // Fetch user details for creation date
    const user = await User.findByPk(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userCreatedAt = new Date(user.createdAt);
    const currentDate = new Date();

    // Fetch SalesStockTarget based on user's role_name
    const roleTarget = await SalesStockTarget.findOne({
      where: {
        role_name: user.role_name,
      },
    });

    if (!roleTarget) {
      return res
        .status(404)
        .json({ success: false, message: "Role target not found" });
    }

    const totalMonthlyTarget = parseFloat(roleTarget.target) || 0;
    const totalStockTarget = parseFloat(roleTarget.stock_target) || 0;

    // Initialize results for the whole year
    let yearlyAchievementAmount = 0;
    let yearlyStockAchievement = 0;

    // Helper function to get all months in 2025
    const getMonthsInYear = (year) => {
      const months = [];
      for (let i = 0; i < 12; i++) {
        months.push(new Date(year, i, 1));
      }
      return months;
    };

    const months2025 = getMonthsInYear(2025);

    for (const targetDate of months2025) {
      const startOfMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0
      );

      // Fetch all accepted orders for the user within the target month
      const acceptedOrders = await Order.findAll({
        where: {
          higher_role_id: user_id,
          status: "Accepted",
          created_at: { [Op.between]: [startOfMonth, endOfMonth] },
        },
        include: [
          {
            model: OrderItem,
            as: "OrderItems",
            include: {
              model: Product,
              as: "product",
              required: true,
            },
          },
        ],
      });

      // Calculate total achievement amount for the current month
      let totalAchievementAmount = 0;
      let totalStockAchievement = 0;

      for (const order of acceptedOrders) {
        const orderUser = await User.findByPk(order.higher_role_id);
        const roleName = orderUser ? orderUser.role_name : "";

        for (const orderItem of order.OrderItems) {
          const product = orderItem.product;
          let price = 0;

          switch (roleName) {
            case "Super Distributor":
              price = product.sdPrice || 0;
              break;
            case "Distributor":
              price = product.distributorPrice || 0;
              break;
            case "Master Distributor":
              price = product.mdPrice || 0;
              break;
            case "Area Development Officer":
              price = product.adoPrice || 0;
              break;
            case "Customer":
              price = product.price || 0;
              break;
            default:
              price = 0;
              break;
          }

          totalAchievementAmount += price * (parseInt(orderItem.quantity) || 0);
        }
      }

      // Calculate total stock achievement for the current month
      totalStockAchievement += acceptedOrders.reduce((total, order) => {
        return (
          total +
          order.OrderItems.reduce(
            (subtotal, item) => subtotal + (parseInt(item.quantity) || 0),
            0
          )
        );
      }, 0);

      yearlyAchievementAmount += totalAchievementAmount;
      yearlyStockAchievement += totalStockAchievement;
    }

    // Calculate overall yearly pending amounts
    const yearlyPendingAmount = Math.max(
      0,
      totalMonthlyTarget * 12 - yearlyAchievementAmount
    );
    const yearlyPendingStockTarget = Math.max(
      0,
      totalStockTarget * 12 - yearlyStockAchievement
    );

    // Calculate percentages for the year
    const yearlyAchievementAmountPercent = Math.min(
      100,
      Math.max(0, (yearlyAchievementAmount / (totalMonthlyTarget * 12)) * 100)
    );
    const yearlyUnachievementAmountPercent =
      100 - yearlyAchievementAmountPercent;

    const yearlyStockAchievementPercent = Math.min(
      100,
      Math.max(0, (yearlyStockAchievement / (totalStockTarget * 12)) * 100)
    );
    const yearlyStockUnachievementPercent = 100 - yearlyStockAchievementPercent;

    // Respond with the overall yearly details
    return res.status(200).json({
      success: true,
      role: user.role_name,
      user_id,
      yearlyDetails: {
        year: 2025,
        MonthlyTargetAmount: totalMonthlyTarget * 12,
        AchievementAmount: yearlyAchievementAmount,
        pendingAmount: yearlyPendingAmount,
        achievementAmountPercent: yearlyAchievementAmountPercent.toFixed(2),
        unachievementAmountPercent: yearlyUnachievementAmountPercent.toFixed(2),
        StockTarget: totalStockTarget * 12,
        StockAchievement: yearlyStockAchievement,
        PendingStockTarget: yearlyPendingStockTarget,
        StockAchievementPercent: yearlyStockAchievementPercent.toFixed(2),
        StockUnachievementPercent: yearlyStockUnachievementPercent.toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error fetching yearly sales details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch yearly sales details",
      error: error.message,
    });
  }
};


































// const { Order, Product, OrderItem, User, SalesStockTarget } = require('../../../models');
// const { Op } = require('sequelize');

// exports.getMonthlySalesDetailsWeb = async (req, res) => {
//   const { role_id, user_id } = req.params;
//   let { month, year } = req.query;

//   try {
//     const user = await User.findByPk(user_id);
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

   

//     // Fetch target amounts based on the user's role
//     const roleTarget = await SalesStockTarget.findOne({
//       where: { role_name: user.role_name },
//     });
//     if (!roleTarget) {
//       return res.status(404).json({ success: false, message: 'Role target not found' });
//     }
//     const totalMonthlyTarget = parseFloat(roleTarget.target) || 0;
//     const totalStockTarget = parseFloat(roleTarget.stock_target) || 0;

//     let startOfMonth, endOfMonth;
//     if (month && year) {
//       month = parseInt(month);
//       year = parseInt(year);
//       if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid month or year provided in query parameters',
//         });
//       }
      
//       // Set startOfMonth to the 1st of the month (set time to 00:00:00 to avoid timezone issues)
//       startOfMonth = new Date(Date.UTC(year, month - 1, 1));

//       // Set endOfMonth to the last day of the month (Feb 2025 will be 28, for example)
//       endOfMonth = new Date(Date.UTC(year, month, 0));  // The 0th day of the next month gives the last day of the current month
//     } else {
//       const currentDate = new Date();
//       startOfMonth = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1));
//       endOfMonth = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
//     }

//     let loginUsertotalSales = 0;

//     loginUsertotalSales =
//       (await Order.sum("total_amount", {
//         where: {
//           higher_role_id: user_id,
//           status: "Accepted",
//           updatedAt: {
//             [Op.gte]: new Date(startOfMonth),
//             [Op.lte]: new Date(endOfMonth),
//           },
//         },
//       })) || 0;

//     // --- Calculate Sales Achievement ---
//     const acceptedOrders = await Order.findAll({
//       where: {
//         higher_role_id: user_id,
//         status: 'Accepted',
//         created_at: { [Op.between]: [startOfMonth, endOfMonth] },
//       },
//       include: [
//         {
//           model: OrderItem,
//           as: 'OrderItems',
//           include: {
//             model: Product,
//             as: 'product',
//             required: true,
//           },
//         },
//       ],
//     });

//     let totalAchievementAmount = 0;
//     for (const order of acceptedOrders) {
//       const orderUser = await User.findByPk(order.higher_role_id);
//       const roleName = orderUser ? orderUser.role_name : '';

//       for (const orderItem of order.OrderItems) {
//         const product = orderItem.product;
//         let price = 0;
//         switch (roleName) {
//           case 'Super Distributor':
//             price = product.distributorPrice || 0;
//             break;
//           case 'Distributor':
//             price = product.price || 0;
//             break;
//           case 'Master Distributor':
//             price = product.sdPrice || 0;
//             break;
//           case 'Area Development Officer':
//             price = product.mdPrice || 0;
//             break;
//           case 'Customer':
//             price = product.price || 0;
//             break;
//           default:
//             price = 0;
//         }
//         totalAchievementAmount += price * (parseInt(orderItem.quantity) || 0);
//       }
//     }

//     // --- Calculate Stock Achievement ---
//     const acceptedOrdersForStock = await Order.findAll({
//       where: {
//         user_id: user_id,
//         status: 'Accepted',
//         created_at: { [Op.between]: [startOfMonth, endOfMonth] },
//       },
//     });
//     const totalStockAchievement = acceptedOrdersForStock.reduce((total, order) => {
//       return total + (parseFloat(order.final_amount) || 0);
//     }, 0);

//     // --- Compute Pending Amounts and Percentages ---
//     const pendingAmount = Math.max(0, totalMonthlyTarget - loginUsertotalSales);
//     const pendingStockTarget = Math.max(0, totalStockTarget - totalStockAchievement);

//     const achievementAmountPercent = Math.min(100, Math.max(0, (loginUsertotalSales / totalMonthlyTarget) * 100));
//     const unachievementAmountPercent = 100 - achievementAmountPercent;

//     const stockAchievementPercent = Math.min(100, Math.max(0, (totalStockAchievement / totalStockTarget) * 100));
//     const stockUnachievementPercent = 100 - stockAchievementPercent;

//     const monthName = startOfMonth.toLocaleString('default', { month: 'long' });

//     const monthlyDetail = {
//       month: monthName,
//       year: startOfMonth.getFullYear(),
//       MonthlyTargetAmount: totalMonthlyTarget,
//       AchievementAmount: loginUsertotalSales,
//       pendingAmount: pendingAmount,
//       achievementAmountPercent: achievementAmountPercent.toFixed(2),
//       unachievementAmountPercent: unachievementAmountPercent.toFixed(2),
//       StockTarget: totalStockTarget,
//       StockAchievement: totalStockAchievement,
//       PendingStockTarget: pendingStockTarget,
//       StockAchievementPercent: stockAchievementPercent.toFixed(2),
//       StockUnachievementPercent: stockUnachievementPercent.toFixed(2),
//       startOfMonth: startOfMonth.toISOString().split('T')[0], // '2025-02-01'
//       endOfMonth: endOfMonth.toISOString().split('T')[0], // '2025-02-28'
      
//     };

//     return res.status(200).json({
//       success: true,
//       role: user.role_name,
//       user_id,
//       monthlyDetails: monthlyDetail,
//     });
//   } catch (error) {
//     console.error('Error fetching monthly sales details:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch monthly sales details',
//       error: error.message,
//     });
//   }
// };











// exports.getMonthlySalesDetails = async (req, res) => {
//   const { role_id, user_id } = req.params;

//   try {
//     // Fetch user details for creation date
//     const user = await User.findByPk(user_id);
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     const userCreatedAt = new Date(user.createdAt);
//     const currentDate = new Date();

//     // Fetch SalesStockTarget based on user's role_name
//     const roleTarget = await SalesStockTarget.findOne({
//       where: {
//         role_name: user.role_name,
//       },
//     });

//     if (!roleTarget) {
//       return res.status(404).json({ success: false, message: 'Role target not found' });
//     }

//     const totalMonthlyTarget = parseFloat(roleTarget.target) || 0;
//     const totalStockTarget = parseFloat(roleTarget.stock_target) || 0;

//     // Initialize results
//     const monthlyDetails = [];

//     // Helper function to iterate month-by-month
//     const getMonthsBetweenDates = (start, end) => {
//       const months = [];
//       const current = new Date(start);
//       while (current <= end) {
//         months.push(new Date(current));
//         current.setMonth(current.getMonth() + 1);
//       }
//       return months;
//     };

//     const months = getMonthsBetweenDates(userCreatedAt, currentDate);

//     for (const targetDate of months) {
//       const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
//       const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

//       // Fetch all accepted orders for the user within the target month
//       const acceptedOrders = await Order.findAll({
//         where: {
//           higher_role_id: user_id,
//           status: 'Accepted',
//           created_at: { [Op.between]: [startOfMonth, endOfMonth] },
//         },
//         include: [
//           {
//             model: OrderItem,
//             as: 'OrderItems',
//             include: {
//               model: Product,
//               as: 'product',
//               required: true,
//             },
//           },
//         ],
//       });

//       const acceptedOrdersForStock = await Order.findAll({
//         where: {
//           user_id: user_id,
//           status: 'Accepted',
//           created_at: { [Op.between]: [startOfMonth, endOfMonth] },
//         },
//       });

//       // Calculate total achievement amount
//       let totalAchievementAmount = 0;
//       for (const order of acceptedOrders) {
//         const orderUser = await User.findByPk(order.higher_role_id);
//         const roleName = orderUser ? orderUser.role_name : '';

//         for (const orderItem of order.OrderItems) {
//           const product = orderItem.product;
//           let price = 0;

//           switch (roleName) {
//             case 'Super Distributor':
//               price = product.sdPrice || 0;
//               break;
//             case 'Distributor':
//               price = product.distributorPrice || 0;
//               break;
//             case 'Master Distributor':
//               price = product.mdPrice || 0;
//               break;
//             case 'Area Development Officer':
//               price = product.adoPrice || 0;
//               break;
//             case 'Customer':
//               price = product.price || 0;
//               break;
//             default:
//               price = 0;
//               break;
//           }

//           totalAchievementAmount += price * (parseInt(orderItem.quantity) || 0);
//         }
//       }

//       // Calculate total stock achievement
//       // const totalStockAchievement = acceptedOrders.reduce((total, order) => {
//       //   return total + order.OrderItems.reduce((subtotal, item) => subtotal + (parseInt(item.quantity) || 0), 0);
//       // }, 0);
//       const totalStockAchievement = acceptedOrdersForStock.reduce((total, order) => {
//         return total + (parseFloat(order.final_amount) || 0);
//       }, 0);

//       // Ensure no negative values
//       const pendingAmount = Math.max(0, totalMonthlyTarget - totalAchievementAmount);
//       const pendingStockTarget = Math.max(0, totalStockTarget - totalStockAchievement);

//       // Calculate percentages capped between 0 and 100
//       const achievementAmountPercent = Math.min(100, Math.max(0, (totalAchievementAmount / totalMonthlyTarget) * 100));
//       const unachievementAmountPercent = 100 - achievementAmountPercent;

//       const stockAchievementPercent = Math.min(100, Math.max(0, (totalStockAchievement / totalStockTarget) * 100));
//       const stockUnachievementPercent = 100 - stockAchievementPercent;

//       // Add current month's details to the result
//       monthlyDetails.push({
//         month: startOfMonth.toLocaleString('default', { month: 'long' }),
//         year: startOfMonth.getFullYear(),
//         MonthlyTargetAmount: totalMonthlyTarget,
//         AchievementAmount: totalAchievementAmount,
//         pendingAmount: pendingAmount,
//         achievementAmountPercent: achievementAmountPercent.toFixed(2),
//         unachievementAmountPercent: unachievementAmountPercent.toFixed(2),
//         StockTarget: totalStockTarget,
//         StockAchievement: totalStockAchievement,
//         PendingStockTarget: pendingStockTarget,
//         StockAchievementPercent: stockAchievementPercent.toFixed(2),
//         StockUnachievementPercent: stockUnachievementPercent.toFixed(2),
//       });
//     }

//     // Check if this month's data is missing and add it dynamically
//     const currentMonthDetails = monthlyDetails.find(
//       (detail) => detail.month === currentDate.toLocaleString('default', { month: 'long' }) && detail.year === currentDate.getFullYear()
//     );

//     // If current month's data is not found, calculate it manually
//     if (!currentMonthDetails) {
//       const startOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
//       const endOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

//       const acceptedOrdersForCurrentMonth = await Order.findAll({
//         where: {
//           higher_role_id: user_id,
//           status: 'Accepted',
//           created_at: { [Op.between]: [startOfCurrentMonth, endOfCurrentMonth] },
//         },
//         include: [
//           {
//             model: OrderItem,
//             as: 'OrderItems',
//             include: {
//               model: Product,
//               as: 'product',
//               required: true,
//             },
//           },
//         ],
//       });

//       let totalAchievementAmountCurrent = 0;
//       // let totalStockAchievementCurrent = 0;

//       for (const order of acceptedOrdersForCurrentMonth) {
//         const orderUser = await User.findByPk(order.higher_role_id);
//         const roleName = orderUser ? orderUser.role_name : '';

//         for (const orderItem of order.OrderItems) {
//           const product = orderItem.product;
//           let price = 0;

//           switch (roleName) {
//             case 'Super Distributor':
//               price = product.sdPrice || 0;
//               break;
//             case 'Distributor':
//               price = product.distributorPrice || 0;
//               break;
//             case 'Master Distributor':
//               price = product.mdPrice || 0;
//               break;
//             case 'Area Development Officer':
//               price = product.adoPrice || 0;
//               break;
//             case 'Customer':
//               price = product.price || 0;
//               break;
//             default:
//               price = 0;
//               break;
//           }

//           totalAchievementAmountCurrent += price * (parseInt(orderItem.quantity) || 0);
//         }
//       }

//       const acceptedOrdersForCurrentMonthForStock = await Order.findAll({
//         where: {
//           user_id: user_id, // Notice the filter change here!
//           status: 'Accepted',
//           created_at: { [Op.between]: [startOfCurrentMonth, endOfCurrentMonth] },
//         },
//       });

//       const totalStockAchievementCurrent = acceptedOrdersForCurrentMonthForStock.reduce((total, order) => {
//         return total + (parseFloat(order.final_amount) || 0);
//       }, 0);

//       // totalStockAchievementCurrent = acceptedOrdersForCurrentMonth.reduce((total, order) => {
//       //   return total + order.OrderItems.reduce((subtotal, item) => subtotal + (parseInt(item.quantity) || 0), 0);
//       // }, 0);

//       const pendingAmountCurrent = Math.max(0, totalMonthlyTarget - totalAchievementAmountCurrent);
//       const pendingStockTargetCurrent = Math.max(0, totalStockTarget - totalStockAchievementCurrent);

//       const achievementAmountPercentCurrent = Math.min(100, Math.max(0, (totalAchievementAmountCurrent / totalMonthlyTarget) * 100));
//       const unachievementAmountPercentCurrent = 100 - achievementAmountPercentCurrent;

//       const stockAchievementPercentCurrent = Math.min(100, Math.max(0, (totalStockAchievementCurrent / totalStockTarget) * 100));
//       const stockUnachievementPercentCurrent = 100 - stockAchievementPercentCurrent;

//       monthlyDetails.push({
//         month: currentDate.toLocaleString('default', { month: 'long' }),
//         year: currentDate.getFullYear(),
//         MonthlyTargetAmount: totalMonthlyTarget,
//         AchievementAmount: totalAchievementAmountCurrent,
//         pendingAmount: pendingAmountCurrent,
//         achievementAmountPercent: achievementAmountPercentCurrent.toFixed(2),
//         unachievementAmountPercent: unachievementAmountPercentCurrent.toFixed(2),
//         StockTarget: totalStockTarget,
//         StockAchievement: totalStockAchievementCurrent,
//         PendingStockTarget: pendingStockTargetCurrent,
//         StockAchievementPercent: stockAchievementPercentCurrent.toFixed(2),
//         StockUnachievementPercent: stockUnachievementPercentCurrent.toFixed(2),
//       });
//     }

//     // Respond with the monthly details
//     return res.status(200).json({
//       success: true,
//       role: user.role_name,
//       user_id,
//       // monthlyDetails,
//       monthlyDetails: monthlyDetails.reverse(), 
//     });
//   } catch (error) {
//     console.error('Error fetching monthly sales details:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch monthly sales details',
//       error: error.message,
//     });
//   }
// };








// exports.getLowHierarchySalesDetails = async (req, res) => {
//   const { user_id } = req.params;

//   try {
//     // Fetch users under the given user_id (lower hierarchy)
//     const lowerHierarchyUsers = await User.findAll({
//       where: {
//         superior_id: user_id,
//         role_name: { [Op.ne]: 'Customer' },
//       },
//     });

//     if (!lowerHierarchyUsers || lowerHierarchyUsers.length === 0) {
//       return res.status(404).json({ success: false, message: 'No lower hierarchy users found' });
//     }

//     const result = [];

//     // Iterate over each lower hierarchy user
//     for (const user of lowerHierarchyUsers) {
//       const role = user.role_name;
//       const photo = user.image;
//       const userCreatedAt = new Date(user.createdAt);
//       const currentDate = new Date();

//       let totalMonthlyTarget = 0;
//       let totalStockTarget = 0;
//       const monthlyDetails = [];

//       let targetDate = new Date(userCreatedAt);
//       while (targetDate <= currentDate) {
//         const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
//         const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

//         // Fetch the SalesStockTarget for the current user's role
//         const roleTarget = await SalesStockTarget.findOne({
//           where: { role_name: role },
//         });

//         if (roleTarget) {
//           totalMonthlyTarget = parseFloat(roleTarget.target) || 0;
//           totalStockTarget = parseFloat(roleTarget.stock_target) || 0;
//         }

//         // Fetch accepted orders for the user within the month
//         const acceptedOrders = await Order.findAll({
//           where: {
//             higher_role_id: user.id,
//             status: 'Accepted',
//             created_at: { [Op.between]: [startOfMonth, endOfMonth] },
//           },
//           include: [
//             {
//               model: OrderItem,
//               as: 'OrderItems',
//               include: {
//                 model: Product,
//                 as: 'product',
//                 required: true,
//               },
//             },
//           ],
//         });

//         // Calculate total achievement amount and stock achievement
//         let totalAchievementAmount = 0;
//         let totalStockAchievement = 0;

//         for (const order of acceptedOrders) {
//           for (const orderItem of order.OrderItems) {
//             const product = orderItem.product;
//             let price = 0;

//             switch (role) {
//               case 'Super Distributor':
//                 price = product.sdPrice || 0;
//                 break;
//               case 'Distributor':
//                 price = product.distributorPrice || 0;
//                 break;
//               case 'Master Distributor':
//                 price = product.mdPrice || 0;
//                 break;
//               case 'Area Development Officer':
//                 price = product.adoPrice || 0;
//                 break;
//             }

//             totalAchievementAmount += price * (parseInt(orderItem.quantity) || 0);
//             totalStockAchievement += parseInt(orderItem.quantity) || 0;
//           }
//         }

//         // Calculate percentages and ensure they're within valid bounds
//         const achievementAmountPercent = Math.min(
//           Math.max(totalMonthlyTarget > 0 ? (totalAchievementAmount / totalMonthlyTarget) * 100 : 0, 0),
//           100
//         );
//         const unachievementAmountPercent = Math.min(100 - achievementAmountPercent, 100);

//         const stockAchievementPercent = Math.min(
//           Math.max(totalStockTarget > 0 ? (totalStockAchievement / totalStockTarget) * 100 : 0, 0),
//           100
//         );
//         const stockUnachievementPercent = Math.min(100 - stockAchievementPercent, 100);

//         const pendingAmount = Math.max(totalMonthlyTarget - totalAchievementAmount, 0);
//         const pendingStockTarget = Math.max(totalStockTarget - totalStockAchievement, 0);

//         monthlyDetails.push({
//           month: startOfMonth.toLocaleString('default', { month: 'long' }),
//           year: startOfMonth.getFullYear(),
//           totalMonthlyTarget,
//           totalAchievementAmount,
//           pendingAmount,
//           achievementAmountPercent: achievementAmountPercent.toFixed(2),
//           unachievementAmountPercent: unachievementAmountPercent.toFixed(2),
//           totalStockTarget,
//           totalStockAchievement,
//           pendingStockTarget,
//           stockAchievementPercent: stockAchievementPercent.toFixed(2),
//           stockUnachievementPercent: stockUnachievementPercent.toFixed(2),
//           roleName: role,
//           roleId: user.role_id,
//         });

//         targetDate.setMonth(targetDate.getMonth() + 1);
//       }

//       // Sort the monthlyDetails array to display the current year and current month first
//       monthlyDetails.sort((a, b) => {
//         if (b.year !== a.year) {
//           return b.year - a.year; // Sort by year in descending order
//         }
//         return b.month.localeCompare(a.month, 'en', { month: 'short' }); // Sort by month in descending order
//       });

//       result.push({
//         user_id: user.id,
//         full_name: user.full_name,
//         image: photo,
//         monthlyDetails,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       result,
//     });
//   } catch (error) {
//     console.error('Error fetching lower hierarchy sales details:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch sales details',
//       error: error.message,
//     });
//   }
// };




// ///****** User Sales Detail *******///

// exports.getUserCurrentMonthSalesDetailsId = async (req, res) => {
//   const { user_id } = req.params;

//   try {
//     // Fetch the user details for the given user_id
//     const user = await User.findOne({
//       where: {
//         id: user_id,
//         role_name: { [Op.ne]: 'Customer' },  // Ensure the user is not a customer
//       },
//     });

//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     const role = user.role_name;
//     const photo = user.image;
//     const userCreatedAt = new Date(user.createdAt);
//     const currentDate = new Date();

//     let totalMonthlyTarget = 0;
//     let totalStockTarget = 0;
//     const monthlyDetails = [];

//     // Focus only on the current month
//     const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
//     const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

//     // Fetch the SalesStockTarget for the current user's role
//     const roleTarget = await SalesStockTarget.findOne({
//       where: { role_name: role },
//     });

//     if (roleTarget) {
//       totalMonthlyTarget = parseFloat(roleTarget.target) || 0;
//       totalStockTarget = parseFloat(roleTarget.stock_target) || 0;
//     }

//     // Fetch accepted orders for the user within the current month
//     const acceptedOrders = await Order.findAll({
//       where: {
//         higher_role_id: user.id,
//         status: 'Accepted',
//         created_at: { [Op.between]: [startOfMonth, endOfMonth] },
//       },
//       include: [
//         {
//           model: OrderItem,
//           as: 'OrderItems',
//           include: {
//             model: Product,
//             as: 'product',
//             required: true,
//           },
//         },
//       ],
//     });

//     // Calculate total achievement amount and stock achievement for the current month
//     let totalAchievementAmount = 0;
//     let totalStockAchievement = 0;

//     for (const order of acceptedOrders) {
//       for (const orderItem of order.OrderItems) {
//         const product = orderItem.product;
//         let price = 0;

//         switch (role) {
//           case 'Super Distributor':
//             price = product.sdPrice || 0;
//             break;
//           case 'Distributor':
//             price = product.distributorPrice || 0;
//             break;
//           case 'Master Distributor':
//             price = product.mdPrice || 0;
//             break;
//           case 'Area Development Officer':
//             price = product.adoPrice || 0;
//             break;
//         }

//         totalAchievementAmount += price * (parseInt(orderItem.quantity) || 0);
//         totalStockAchievement += parseInt(orderItem.quantity) || 0;
//       }
//     }

//     // Calculate percentages and ensure they're within valid bounds
//     const achievementAmountPercent = Math.min(
//       Math.max(totalMonthlyTarget > 0 ? (totalAchievementAmount / totalMonthlyTarget) * 100 : 0, 0),
//       100
//     );
//     const unachievementAmountPercent = Math.min(100 - achievementAmountPercent, 100);

//     const stockAchievementPercent = Math.min(
//       Math.max(totalStockTarget > 0 ? (totalStockAchievement / totalStockTarget) * 100 : 0, 0),
//       100
//     );
//     const stockUnachievementPercent = Math.min(100 - stockAchievementPercent, 100);

//     const pendingAmount = Math.max(totalMonthlyTarget - totalAchievementAmount, 0);
//     const pendingStockTarget = Math.max(totalStockTarget - totalStockAchievement, 0);

//     monthlyDetails.push({
//       month: startOfMonth.toLocaleString('default', { month: 'long' }),
//       year: startOfMonth.getFullYear(),
//       totalMonthlyTarget,
//       totalAchievementAmount,
//       pendingAmount,
//       achievementAmountPercent: achievementAmountPercent.toFixed(2),
//       unachievementAmountPercent: unachievementAmountPercent.toFixed(2),
//       totalStockTarget,
//       totalStockAchievement,
//       pendingStockTarget,
//       stockAchievementPercent: stockAchievementPercent.toFixed(2),
//       stockUnachievementPercent: stockUnachievementPercent.toFixed(2),
//       roleName: role,
//       roleId: user.role_id,
//     });

//     return res.status(200).json({
//       success: true,
//       user_id: user.id,
//       full_name: user.full_name,
//       image: photo,
//       monthlyDetails,
//     });

//   } catch (error) {
//     console.error('Error fetching current month sales details:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch sales details',
//       error: error.message,
//     });
//   }
// };












// // const { Order, Product, OrderItem, User, SalesStockTarget } = require('../../models');
// // const { Op } = require('sequelize');

// // exports.getMonthlySalesDetails = async (req, res) => {
// //   const { role_id, user_id } = req.params;

// //   try {
// //     // Fetch user details for creation date
// //     const user = await User.findByPk(user_id);
// //     if (!user) {
// //       return res.status(404).json({ success: false, message: 'User not found' });
// //     }

// //     const userCreatedAt = new Date(user.createdAt);
// //     const currentDate = new Date();

// //     // Fetch SalesStockTarget based on user's role_name
// //     const roleTarget = await SalesStockTarget.findOne({
// //       where: {
// //         role_name: user.role_name,
// //       },
// //     });

// //     if (!roleTarget) {
// //       return res.status(404).json({ success: false, message: 'Role target not found' });
// //     }

// //     const totalMonthlyTarget = parseFloat(roleTarget.target) || 0;
// //     const totalStockTarget = parseFloat(roleTarget.stock_target) || 0;

// //     // Initialize results
// //     const monthlyDetails = [];

// //     // Iterate month-by-month from userCreatedAt to the current month
// //     let targetDate = new Date(userCreatedAt);
// //     while (targetDate <= currentDate) {
// //       const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
// //       const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

// //       // Fetch all accepted orders for the user within the target month
// //       const acceptedOrders = await Order.findAll({
// //         where: {
// //           higher_role_id: user_id,
// //           status: 'Accepted',
// //           created_at: { [Op.between]: [startOfMonth, endOfMonth] }, // Filter by month range
// //         },
// //         include: [
// //           {
// //             model: OrderItem,
// //             as: 'OrderItems',
// //             include: {
// //               model: Product,
// //               as: 'product',
// //               required: true,
// //             },
// //           },
// //         ],
// //       });

// //       // Calculate total achievement amount
// //       const totalAchievementAmount = await acceptedOrders.reduce(async (totalPromise, order) => {
// //         let total = await totalPromise;

// //         const user = await User.findByPk(order.higher_role_id);
// //         const roleName = user ? user.role_name : '';

// //         order.OrderItems.forEach((orderItem) => {
// //           const product = orderItem.product;

// //           let price = 0;
// //           switch (roleName) {
// //             case 'Super Distributor':
// //               price = product.sdPrice || 0;
// //               break;
// //             case 'Distributor':
// //               price = product.distributorPrice || 0;
// //               break;
// //             case 'Master Distributor':
// //               price = product.mdPrice || 0;
// //               break;
// //             case 'Area Development Officer':
// //               price = product.adoPrice || 0;
// //               break;
// //             case 'Customer':
// //               price = product.price || 0;
// //               break;
// //             default:
// //               price = 0;
// //               break;
// //           }

// //           const orderTotal = price * (parseInt(orderItem.quantity) || 0);
// //           total += orderTotal;
// //         });

// //         return total;
// //       }, Promise.resolve(0));

// //       // Calculate total stock achievement
// //       const totalStockAchievement = acceptedOrders.reduce((total, order) => {
// //         return total + order.OrderItems.reduce((subtotal, item) => subtotal + (parseInt(item.quantity) || 0), 0);
// //       }, 0);

// //       // Calculate pending amount
// //       const pendingAmount = totalMonthlyTarget - totalAchievementAmount;
// //       const pendingStockTarget = totalStockTarget - totalStockAchievement;

// //       // Calculate achievement and unachievement percentages
// //       const achievementAmountPercent =
// //         totalMonthlyTarget > 0 ? (totalAchievementAmount / totalMonthlyTarget) * 100 : 0;
// //       const unachievementAmountPercent = 100 - achievementAmountPercent;

// //       // Add current month's details to the result
// //       monthlyDetails.push({
// //         month: startOfMonth.toLocaleString('default', { month: 'long' }),
// //         year: startOfMonth.getFullYear(),
// //         MonthlyTargetAmount: totalMonthlyTarget,
// //         AchievementAmount: totalAchievementAmount,
// //         pendingAmount,
// //         achievementAmountPercent: achievementAmountPercent.toFixed(2),
// //         unachievementAmountPercent: unachievementAmountPercent.toFixed(2),
// //         StockTarget: totalStockTarget,
// //         StockAchievement: totalStockAchievement,
// //         PendingStockTarget: pendingStockTarget,
// //         // StockAchievementPercent: totalStockTarget > 0 ? ((totalStockAchievement / totalStockTarget) * 100).toFixed(2) : '0.00',
// //         StockAchievementPercent: totalStockTarget > 0 ? ((totalStockAchievement / totalStockTarget) * 100).toFixed(4) : '0.0000',

// //         StockUnachievementPercent: totalStockTarget > 0 ? (100 - (totalStockAchievement / totalStockTarget) * 100).toFixed(2) : '100.00',
// //       });

// //       // Move to the next month
// //       targetDate.setMonth(targetDate.getMonth() + 1);
// //     }

// //     // Respond with the monthly details
// //     return res.status(200).json({
// //       success: true,
// //       role: user.role_name,
// //       user_id,
// //       monthlyDetails,
// //     });
// //   } catch (error) {
// //     console.error('Error fetching monthly sales details:', error);
// //     return res.status(500).json({
// //       success: false,
// //       message: 'Failed to fetch monthly sales details',
// //       error: error.message,
// //     });
// //   }
// // };


// ////////*******************///////////
// ////////*******************///////////



// // const { SalesTarget, Order, Product, OrderItem, User } = require('../../models');
// // const { Op } = require('sequelize');





// // exports.getLowHierarchySalesDetails = async (req, res) => {
// //   const { user_id } = req.params;

// //   try {
// //     // Fetch users under the given user_id (lower hierarchy)
// //     const lowerHierarchyUsers = await User.findAll({
// //       where: {
// //         superior_id: user_id,
// //         role_name: { [Op.ne]: 'Customer' }
// //       },
// //     });

// //     if (!lowerHierarchyUsers || lowerHierarchyUsers.length === 0) {
// //       return res.status(404).json({ success: false, message: 'No lower hierarchy users found' });
// //     }

// //     const result = [];

// //     // Iterate over each lower hierarchy user
// //     for (const user of lowerHierarchyUsers) {
// //       const role = user.role_name;
// //       const photo = user.image;
// //       const userCreatedAt = new Date(user.createdAt);
// //       const currentDate = new Date();

// //       let totalMonthlyTarget = 0;
// //       let totalStockTarget = 0;
// //       const monthlyDetails = [];

// //       let targetDate = new Date(userCreatedAt);
// //       while (targetDate <= currentDate) {
// //         const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
// //         const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

// //         // Fetch the SalesStockTarget for the current user's role
// //         const roleTarget = await SalesStockTarget.findOne({
// //           where: {
// //             role_name: role,
// //           },
// //         });

// //         if (roleTarget) {
// //           totalMonthlyTarget = parseFloat(roleTarget.target) || 0;
// //           totalStockTarget = parseFloat(roleTarget.stock_target) || 0;
// //         } else {
// //           totalMonthlyTarget = 0;
// //           totalStockTarget = 0;
// //         }

// //         // Fetch accepted orders for the user within the month
// //         const acceptedOrders = await Order.findAll({
// //           where: {
// //             higher_role_id: user.id,
// //             status: 'Accepted',
// //             created_at: { [Op.between]: [startOfMonth, endOfMonth] },
// //           },
// //           include: [
// //             {
// //               model: OrderItem,
// //               as: 'OrderItems',
// //               include: {
// //                 model: Product,
// //                 as: 'product',
// //                 required: true,
// //               },
// //             },
// //           ],
// //         });

// //         // Calculate total achievement amount and stock achievement
// //         let totalAchievementAmount = 0;
// //         let totalStockAchievement = 0;

// //         for (const order of acceptedOrders) {
// //           const user = await User.findByPk(order.higher_role_id);
// //           const roleName = user ? user.role_name : '';

// //           for (const orderItem of order.OrderItems) {
// //             const product = orderItem.product;
// //             let price = 0;

// //             switch (roleName) {
// //               case 'Super Distributor':
// //                 price = product.sdPrice || 0;
// //                 break;
// //               case 'Distributor':
// //                 price = product.distributorPrice || 0;
// //                 break;
// //               case 'Master Distributor':
// //                 price = product.mdPrice || 0;
// //                 break;
// //               case 'Area Development Officer':
// //                 price = product.adoPrice || 0;
// //                 break;
// //             }

// //             const orderTotal = price * (parseInt(orderItem.quantity) || 0);
// //             totalAchievementAmount += orderTotal;
// //             totalStockAchievement += parseInt(orderItem.quantity) || 0;
// //           }
// //         }

// //         // Calculate percentages
// //         const achievementAmountPercent =
// //           totalMonthlyTarget > 0 ? (totalAchievementAmount / totalMonthlyTarget) * 100 : 0;
// //         const unachievementAmountPercent = 100 - achievementAmountPercent;

// //         const stockAchievementPercent =
// //           totalStockTarget > 0 ? (totalStockAchievement / totalStockTarget) * 100 : 0;
// //         const stockUnachievementPercent = 100 - stockAchievementPercent;

// //         const pendingStockTarget = totalStockTarget - totalStockAchievement;

// //         monthlyDetails.push({
// //           month: startOfMonth.toLocaleString('default', { month: 'long' }),
// //           year: startOfMonth.getFullYear(),
// //           totalMonthlyTarget,
// //           totalAchievementAmount,
// //           pendingAmount: totalMonthlyTarget - totalAchievementAmount,
// //           achievementAmountPercent: achievementAmountPercent.toFixed(2),
// //           unachievementAmountPercent: unachievementAmountPercent.toFixed(2),
// //           totalStockTarget,
// //           totalStockAchievement,
// //           pendingStockTarget: pendingStockTarget,
// //           stockAchievementPercent: stockAchievementPercent.toFixed(2),
// //           stockUnachievementPercent: stockUnachievementPercent.toFixed(2),
// //           roleName: role,
// //           roleId: user.role_id,
// //         });

// //         targetDate.setMonth(targetDate.getMonth() + 1);
// //       }

// //       result.push({
// //         user_id: user.id,
// //         full_name: user.full_name,
// //         image: photo,
// //         monthlyDetails,
// //       });
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       result,
// //     });
// //   } catch (error) {
// //     console.error('Error fetching lower hierarchy sales details:', error);
// //     return res.status(500).json({
// //       success: false,
// //       message: 'Failed to fetch sales details',
// //       error: error.message,
// //     });
// //   }
// // };




// //////OVERAL YEARLY CALCULATIONS DATA///////




// exports.getYearlySalesDetails = async (req, res) => {
//   const { role_id, user_id } = req.params;

//   try {
//     // Fetch user details for creation date
//     const user = await User.findByPk(user_id);
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     const userCreatedAt = new Date(user.createdAt);
//     const currentDate = new Date();

//     // Fetch SalesStockTarget based on user's role_name
//     const roleTarget = await SalesStockTarget.findOne({
//       where: {
//         role_name: user.role_name,
//       },
//     });

//     if (!roleTarget) {
//       return res.status(404).json({ success: false, message: 'Role target not found' });
//     }

//     const totalMonthlyTarget = parseFloat(roleTarget.target) || 0;
//     const totalStockTarget = parseFloat(roleTarget.stock_target) || 0;

//     // Initialize results for the whole year
//     let yearlyAchievementAmount = 0;
//     let yearlyStockAchievement = 0;

//     // Helper function to get all months in 2025
//     const getMonthsInYear = (year) => {
//       const months = [];
//       for (let i = 0; i < 12; i++) {
//         months.push(new Date(year, i, 1));
//       }
//       return months;
//     };

//     const months2025 = getMonthsInYear(2025);

//     for (const targetDate of months2025) {
//       const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
//       const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

//       // Fetch all accepted orders for the user within the target month
//       const acceptedOrders = await Order.findAll({
//         where: {
//           higher_role_id: user_id,
//           status: 'Accepted',
//           created_at: { [Op.between]: [startOfMonth, endOfMonth] },
//         },
//         include: [
//           {
//             model: OrderItem,
//             as: 'OrderItems',
//             include: {
//               model: Product,
//               as: 'product',
//               required: true,
//             },
//           },
//         ],
//       });

//       // Calculate total achievement amount for the current month
//       let totalAchievementAmount = 0;
//       let totalStockAchievement = 0;

//       for (const order of acceptedOrders) {
//         const orderUser = await User.findByPk(order.higher_role_id);
//         const roleName = orderUser ? orderUser.role_name : '';

//         for (const orderItem of order.OrderItems) {
//           const product = orderItem.product;
//           let price = 0;

//           switch (roleName) {
//             case 'Super Distributor':
//               price = product.sdPrice || 0;
//               break;
//             case 'Distributor':
//               price = product.distributorPrice || 0;
//               break;
//             case 'Master Distributor':
//               price = product.mdPrice || 0;
//               break;
//             case 'Area Development Officer':
//               price = product.adoPrice || 0;
//               break;
//             case 'Customer':
//               price = product.price || 0;
//               break;
//             default:
//               price = 0;
//               break;
//           }

//           totalAchievementAmount += price * (parseInt(orderItem.quantity) || 0);
//         }
//       }

//       // Calculate total stock achievement for the current month
//       totalStockAchievement += acceptedOrders.reduce((total, order) => {
//         return total + order.OrderItems.reduce((subtotal, item) => subtotal + (parseInt(item.quantity) || 0), 0);
//       }, 0);

//       yearlyAchievementAmount += totalAchievementAmount;
//       yearlyStockAchievement += totalStockAchievement;
//     }

//     // Calculate overall yearly pending amounts
//     const yearlyPendingAmount = Math.max(0, totalMonthlyTarget * 12 - yearlyAchievementAmount);
//     const yearlyPendingStockTarget = Math.max(0, totalStockTarget * 12 - yearlyStockAchievement);

//     // Calculate percentages for the year
//     const yearlyAchievementAmountPercent = Math.min(100, Math.max(0, (yearlyAchievementAmount / (totalMonthlyTarget * 12)) * 100));
//     const yearlyUnachievementAmountPercent = 100 - yearlyAchievementAmountPercent;

//     const yearlyStockAchievementPercent = Math.min(100, Math.max(0, (yearlyStockAchievement / (totalStockTarget * 12)) * 100));
//     const yearlyStockUnachievementPercent = 100 - yearlyStockAchievementPercent;

//     // Respond with the overall yearly details
//     return res.status(200).json({
//       success: true,
//       role: user.role_name,
//       user_id,
//       yearlyDetails: {
//         year: 2025,
//         MonthlyTargetAmount: totalMonthlyTarget * 12,
//         AchievementAmount: yearlyAchievementAmount,
//         pendingAmount: yearlyPendingAmount,
//         achievementAmountPercent: yearlyAchievementAmountPercent.toFixed(2),
//         unachievementAmountPercent: yearlyUnachievementAmountPercent.toFixed(2),
//         StockTarget: totalStockTarget * 12,
//         StockAchievement: yearlyStockAchievement,
//         PendingStockTarget: yearlyPendingStockTarget,
//         StockAchievementPercent: yearlyStockAchievementPercent.toFixed(2),
//         StockUnachievementPercent: yearlyStockUnachievementPercent.toFixed(2),
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching yearly sales details:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch yearly sales details',
//       error: error.message,
//     });
//   }
// };
