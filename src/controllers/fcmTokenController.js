const { FcmToken, User } = require("../../models"); // Import Sequelize models


exports.createToken = async (req, res) => {
  try {
    let { token, userId, role } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    if (role === "Admin") {
      userId = 1; // Default to admin user
    } else {
      if (!userId) {
        return res.status(400).json({ message: "User ID is required for non-admin roles" });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
    }

    // Check if the combination of token and userId already exists in the FcmToken table
    const existingToken = await FcmToken.findOne({
      where: {
        token: token,
      },
    });

    if (existingToken) {
      // If the token exists but belongs to a different user, update the user_id
      if (existingToken.user_id !== userId) {
        await existingToken.update({ user_id: userId });
        return res.status(200).json({ message: "Token belongs to a different user. User ID updated.", data: existingToken });
      } else {
        return res.status(400).json({ message: "This token is already assigned to this user." });
      }
    }

    // If token doesn't exist, create a new entry
    const newToken = await FcmToken.create({ token, user_id: userId });

    return res.status(201).json({ message: "Token saved successfully", data: newToken });

  } catch (error) {
    console.error("Error saving FCM token:", error);  // Log the error for debugging
    return res.status(500).json({ message: "Internal Server Error", error: error.message }); // Include the error message in the response
  }
};














// exports.createToken = async (req, res) => {
//   try {
//     let { token, userId, role } = req.body;

//     if (!token) {
//       return res.status(400).json({ message: "Token is required" });
//     }

//     if (role === "Admin") {
//       userId = 1;
//     } else {
//       if (!userId) {
//         return res.status(400).json({ message: "User ID is required for non-admin roles" });
//       }

//       const user = await User.findByPk(userId);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }
//     }

//     const existingToken = await FcmToken.findOne({ where: { user_id: userId } });

//     if (existingToken) {
//       await existingToken.update({ token });
//       return res.json({ message: "Token updated successfully", data: existingToken });
//     } else {
//       const newToken = await FcmToken.create({ token, user_id: userId });
//       return res.status(201).json({ message: "Token saved successfully", data: newToken });
//     }
//   } catch (error) {
//     console.error("Error saving FCM token:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

exports.getTokens = async (req, res) => {
  try {
    const { userId } = req.query;

    let whereCondition = {};
    if (userId) {
      whereCondition.user_id = userId;
    }

    const tokens = await FcmToken.findAll({
      where: whereCondition,
      attributes: ["id", "token", "user_id", "created_at"],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(tokens);
  } catch (error) {
    console.error("Error fetching FCM tokens:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

