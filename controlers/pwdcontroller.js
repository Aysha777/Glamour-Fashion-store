const OrderDetail = require("../models/orderdetailsModel");
const User = require("../models/userModel");
const { securepassword } = require("../controlers/userController"); // Import the securepassword function
const OrderStatus = require("../models/orderStatusModel");

// Controller function to handle changing password
const changePassword = async (req, res) => {
  const { email, password, npassword, cpassword } = req.body;
  let user, order, ordersList, orderStatus; // Define variables outside of the try block

  try {
    // Find user by email
    user = await User.findOne({ email });
    order = await OrderDetail.findOne({ user: user._id }).populate(
      "billingDetails"
    );
    ordersList = await OrderDetail.find({ user: user._id });
    orderStatus = await OrderStatus.findOne({ orderId: order._id });

    // Validate if new password and confirm password match
    if (npassword !== cpassword) {
      return res.status(400).render("user/products/user-profile", {
        message: "New password and confirm password do not match",
        user: req.user,
        order,
        ordersList,
        orderStatus,
      });
    }

    // If user not found, return error
    if (!user) {
      return res.status(404).render("user/products/user-profile", {
        message: "User not found",
        user,
        order,
        ordersList,
        orderStatus,
      });
    }

    // Check if current password matches
    const isPasswordValid = await user.comparePassword(password);

    // If current password is incorrect, return error
    if (!isPasswordValid) {
      return res.status(401).render("user/products/user-profile", {
        message: "Current password is incorrect",
        user,
        order,
        ordersList,
        orderStatus,
      });
    }

    // Securely hash the new password
    const spassword = await securepassword(npassword);

    // Update user's password
    user.password = spassword;
    await user.save();

    // Send success response with user object
    res.render("user/products/user-profile", {
      message: "Password changed successfully",
      user,
      order,
      ordersList,
      orderStatus,
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).render("user/products/user-profile", {
      message: "Internal Server Error",
      user,
      order,
      ordersList,
      orderStatus,
    });
  }
};

module.exports = {
  changePassword,
};
